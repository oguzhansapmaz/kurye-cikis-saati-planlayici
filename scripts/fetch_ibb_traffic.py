#!/usr/bin/env python3
"""Fetch and normalise the official İBB Istanbul traffic-index history.

The job runs from GitHub Actions, not the browser, so no upstream API key is
placed in client code. The output is a small, same-origin JSON file consumed by
Vercel. If the source is down, this script exits without replacing the last
successful JSON file.
"""
from __future__ import annotations

import json
import os
import sys
import tempfile
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "traffic.json"
HISTORY_URL = "https://api.ibb.gov.tr/tkmservices/api/TrafficData/v1/TrafficIndexHistory/28/H"
CURRENT_URL = "https://api.ibb.gov.tr/tkmservices/api/TrafficData/v1/TrafficIndexHistory/1/5M"
DATASET_URL = "https://data.ibb.gov.tr/dataset/trafik-indeks-degeri-web-servisi"
LICENSE_URL = "https://data.ibb.gov.tr/license"
ISTANBUL = ZoneInfo("Europe/Istanbul")
USER_AGENT = "Kuryeplan-course-project/1.0 (scheduled open-data refresh)"


RETRYABLE_HTTP_CODES = {408, 425, 429, 500, 502, 503, 504}


def fetch_json(url: str, timeout: int = 12, attempts: int = 2) -> Any:
    """Fetch read-only JSON with bounded retries for transient upstream failures.

    The İBB history API occasionally times out even when the endpoint is healthy.
    Retry timeouts, connection failures, rate limits, selected 5xx responses, and
    incomplete JSON; never retry ordinary 4xx responses. All attempts are bounded.
    """
    request = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept": "application/json, */*"},
    )
    if attempts < 1:
        raise ValueError("attempts must be at least 1")

    for attempt in range(1, attempts + 1):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                if response.status != 200:
                    raise RuntimeError(f"Source returned HTTP {response.status}: {url}")
                raw = response.read()
                if len(raw) > 8_000_000:
                    raise RuntimeError("Source response exceeded the 8 MB safety limit")
                return json.loads(raw.decode("utf-8-sig"))
        except urllib.error.HTTPError as exc:
            retryable = exc.code in RETRYABLE_HTTP_CODES
            error: Exception = exc
        except (urllib.error.URLError, TimeoutError, ConnectionError, json.JSONDecodeError) as exc:
            retryable = True
            error = exc

        if not retryable or attempt >= attempts:
            raise error

        delay = min(2 ** attempt, 8)
        print(
            f"WARNING: request attempt {attempt}/{attempts} failed for {url}: "
            f"{type(error).__name__}: {error}; retrying in {delay}s",
            file=sys.stderr,
        )
        time.sleep(delay)

    # The loop always returns or raises; this is a defensive guard for type checkers.
    raise RuntimeError(f"Unable to fetch source after {attempts} attempts: {url}")


def _rows_from_json(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        # Different API gateways may wrap the collection in a named property.
        for key in ("data", "Data", "items", "Items", "value", "Value", "result", "Result"):
            value = payload.get(key)
            if isinstance(value, list):
                return [item for item in value if isinstance(item, dict)]
            if isinstance(value, dict):
                nested = _rows_from_json(value)
                if nested:
                    return nested
        if _lookup(payload, ("TrafficIndex", "trafficIndex", "index")) is not None:
            return [payload]
    raise ValueError("İBB yanıtında tanınan trafik gözlem listesi bulunamadı")


def _lookup(row: dict[str, Any], candidate_keys: tuple[str, ...]) -> Any:
    lower_map = {str(k).lower(): v for k, v in row.items()}
    for key in candidate_keys:
        if key.lower() in lower_map:
            return lower_map[key.lower()]
    return None


def normalise_records(payload: Any, frequency: str = "H") -> list[dict[str, Any]]:
    """Return sorted, validated {observedAt, index, sourceFrequency} records."""
    rows = _rows_from_json(payload)
    records: dict[str, dict[str, Any]] = {}
    for row in rows:
        raw_index = _lookup(row, ("TrafficIndex", "trafficIndex", "index", "Index", "value"))
        raw_time = _lookup(row, ("TrafficIndexDate", "trafficIndexDate", "observedAt", "timestamp", "date", "Date"))
        if raw_index is None or raw_time is None:
            continue
        try:
            index = float(raw_index)
        except (TypeError, ValueError):
            continue
        if not 0 <= index <= 100:
            continue
        try:
            dt = datetime.fromisoformat(str(raw_time).replace("Z", "+00:00"))
        except ValueError:
            continue
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=ISTANBUL)
        else:
            dt = dt.astimezone(ISTANBUL)
        observed_at = dt.replace(microsecond=0).isoformat()
        # If upstream sends duplicates, retain only one point at each timestamp.
        records[observed_at] = {
            "observedAt": observed_at,
            "index": round(index, 2),
            "sourceFrequency": frequency,
        }
    return [records[key] for key in sorted(records)]


def _read_previous(path: Path = OUTPUT) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
        return value if isinstance(value, dict) else {}
    except (OSError, json.JSONDecodeError):
        return {}


def build_payload(
    history_records: list[dict[str, Any]],
    current_records: list[dict[str, Any]],
    previous: dict[str, Any] | None = None,
    fetched_at: datetime | None = None,
    current_error: str | None = None,
) -> dict[str, Any]:
    if len(history_records) < 24:
        raise ValueError(f"Tarihsel veri eksik: en az 24 saatlik gözlem bekleniyordu, gelen={len(history_records)}")
    fetched_at = fetched_at or datetime.now(timezone.utc)
    if fetched_at.tzinfo is None:
        fetched_at = fetched_at.replace(tzinfo=timezone.utc)
    fetched_at_iso = fetched_at.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    previous = previous or {}
    if current_records:
        current = dict(current_records[-1])
        current["measurementType"] = "5-minute-index"
        current["isCurrentFrequency"] = True
    else:
        current = dict(history_records[-1])
        current["measurementType"] = "hourly-history-fallback"
        current["isCurrentFrequency"] = False

    snapshots = previous.get("snapshots") if isinstance(previous.get("snapshots"), list) else []
    snapshots = [item for item in snapshots if isinstance(item, dict) and item.get("observedAt") and isinstance(item.get("index"), (int, float))]
    if current_records:
        local_dt = datetime.fromisoformat(current["observedAt"])
        day_key = local_dt.date().isoformat()
        snapshot = {
            "snapshotDate": day_key,
            "retrievedAt": fetched_at_iso,
            "observedAt": current["observedAt"],
            "index": current["index"],
            "sourceFrequency": "5M",
        }
        # One stable daily snapshot. A manual rerun replaces that day's snapshot.
        snapshots = [item for item in snapshots if item.get("snapshotDate") != day_key]
        snapshots.append(snapshot)
        snapshots.sort(key=lambda item: (str(item.get("snapshotDate")), str(item.get("retrievedAt"))))
        snapshots = snapshots[-400:]

    status = "available" if current_records else "partial"
    warning = None
    if current_error:
        warning = "Güncel 5 dakikalık uç nokta yanıt vermedi; kartta son tarihsel saatlik gözlem gösteriliyor. " + current_error[:180]
    elif not current_records:
        warning = "Güncel 5 dakikalık ölçüm alınamadı; kartta son tarihsel saatlik gözlem gösteriliyor."

    return {
        "schemaVersion": 1,
        "status": status,
        "source": {
            "name": "İBB Açık Veri Portalı — Trafik İndeks Değeri Web Servisi",
            "datasetUrl": DATASET_URL,
            "apiHistoryUrl": HISTORY_URL,
            "apiCurrentUrl": CURRENT_URL,
            "licenseUrl": LICENSE_URL,
            "geography": "İstanbul geneli; ilçe/rota bazında ayrıştırılmaz",
        },
        "timezone": "Europe/Istanbul",
        "fetchedAt": fetched_at_iso,
        "historyWindowDays": 28,
        "historyCount": len(history_records),
        "observations": history_records,
        "currentObservation": current,
        "snapshots": snapshots,
        "warning": warning,
        "methodologyNote": "Tarihsel karşılaştırma ve planlama desteğidir; canlı rota süresi, ilçe bazlı trafik, navigasyon veya gelecek tahmini değildir.",
    }


def atomic_write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    encoded = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    fd, tmp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as file:
            file.write(encoded)
            file.flush()
            os.fsync(file.fileno())
        os.replace(tmp_name, path)
    finally:
        try:
            os.unlink(tmp_name)
        except FileNotFoundError:
            pass


def main() -> int:
    # Read the currently checked-out data first. In GitHub Actions this is the last
    # successful JSON restored from the data-only branch, or the explicit empty schema
    # on first run. Never replace it with fabricated/example observations.
    previous_file = _read_previous(OUTPUT)
    print(f"Fetching hourly history from {HISTORY_URL}")
    try:
        history_json = fetch_json(HISTORY_URL)
    except Exception as exc:
        has_last_good = (
            isinstance(previous_file.get("observations"), list)
            and len(previous_file.get("observations", [])) >= 24
            and isinstance(previous_file.get("currentObservation"), dict)
        )
        if has_last_good:
            print(
                f"WARNING: official IBB history is unavailable ({type(exc).__name__}: {exc}). "
                "Keeping the last successfully validated JSON; no data was overwritten.",
                file=sys.stderr,
            )
        else:
            print(
                f"WARNING: official IBB history is unavailable ({type(exc).__name__}: {exc}). "
                "No validated snapshot exists yet; keeping the explicit empty schema. "
                "The UI will show the unavailable state and may try the official API in the browser. "
                "No synthetic traffic values were created.",
                file=sys.stderr,
            )
        # Treat upstream unavailability as a handled operational condition. This keeps
        # scheduled CI healthy while ensuring the data contract stays honest.
        return 0

    history_records = normalise_records(history_json, "H")
    if len(history_records) < 24:
        raise RuntimeError(f"Insufficient history after normalisation: {len(history_records)} rows")

    current_records: list[dict[str, Any]] = []
    current_error = None
    try:
        print(f"Fetching latest short-interval index from {CURRENT_URL}")
        current_records = normalise_records(fetch_json(CURRENT_URL), "5M")
        if not current_records:
            raise ValueError("Güncel uç noktada tanınan gözlem bulunamadı")
    except Exception as exc:  # History can still update if the short-interval endpoint is down.
        current_error = f"{type(exc).__name__}: {exc}"
        print(f"WARNING: {current_error}; will publish an explicitly labelled hourly fallback.", file=sys.stderr)

    previous = _read_previous()
    payload = build_payload(history_records, current_records, previous=previous, current_error=current_error)
    atomic_write_json(OUTPUT, payload)
    print(f"Updated {OUTPUT.relative_to(ROOT)}: history={payload['historyCount']}, currentType={payload['currentObservation']['measurementType']}, status={payload['status']}, snapshots={len(payload['snapshots'])}")
    print(f"Retrieved at: {payload['fetchedAt']}; latest hourly observation: {history_records[-1]['observedAt']}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: traffic data refresh failed; previous JSON was not overwritten. {type(exc).__name__}: {exc}", file=sys.stderr)
        raise SystemExit(1)
