import json
import unittest
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from pathlib import Path
import tempfile
from urllib.error import URLError

import scripts.fetch_ibb_traffic as traffic_fetcher
from scripts.fetch_ibb_traffic import build_payload, fetch_json, normalise_records


class TrafficPipelineTests(unittest.TestCase):

    def test_fetch_json_retries_transient_timeout(self):
        response = MagicMock()
        response.__enter__.return_value.status = 200
        response.__enter__.return_value.read.return_value = b'{"ok": true}'
        with patch("scripts.fetch_ibb_traffic.urllib.request.urlopen", side_effect=[URLError("timed out"), URLError("timed out"), response]) as opener, patch("scripts.fetch_ibb_traffic.time.sleep", return_value=None):
            payload = fetch_json("https://example.invalid/data", attempts=3)
        self.assertEqual(payload, {"ok": True})
        self.assertEqual(opener.call_count, 3)

    def test_fetch_json_rejects_non_retryable_http_error_without_retries(self):
        from urllib.error import HTTPError
        error = HTTPError("https://example.invalid/data", 404, "not found", {}, None)
        with patch("scripts.fetch_ibb_traffic.urllib.request.urlopen", side_effect=error) as opener, patch("scripts.fetch_ibb_traffic.time.sleep", return_value=None):
            with self.assertRaises(HTTPError):
                fetch_json("https://example.invalid/data", attempts=3)
        self.assertEqual(opener.call_count, 1)


    def test_main_keeps_last_good_data_when_history_endpoint_fails(self):
        valid_payload = {
            "schemaVersion": 1,
            "status": "available",
            "observations": [
                {"observedAt": f"2026-10-{day:02d}T09:00:00+03:00", "index": 40, "sourceFrequency": "H"}
                for day in range(1, 25)
            ],
            "currentObservation": {"observedAt": "2026-10-29T09:00:00+03:00", "index": 40},
        }
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "traffic.json"
            output.write_text(json.dumps(valid_payload), encoding="utf-8")
            with patch.object(traffic_fetcher, "OUTPUT", output), patch.object(traffic_fetcher, "fetch_json", side_effect=URLError("timed out")):
                self.assertEqual(traffic_fetcher.main(), 0)
            self.assertEqual(json.loads(output.read_text(encoding="utf-8")), valid_payload)

    def test_main_handles_first_run_source_failure_without_fake_data(self):
        empty_payload = {"schemaVersion": 1, "status": "empty", "observations": [], "currentObservation": None}
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "traffic.json"
            output.write_text(json.dumps(empty_payload), encoding="utf-8")
            with patch.object(traffic_fetcher, "OUTPUT", output), patch.object(traffic_fetcher, "fetch_json", side_effect=URLError("timed out")):
                self.assertEqual(traffic_fetcher.main(), 0)
            result = json.loads(output.read_text(encoding="utf-8"))
            self.assertEqual(result["observations"], [])
            self.assertIsNone(result["currentObservation"])

    def test_normalise_official_field_names_and_sort(self):
        source = [
            {"TrafficIndex": 47, "TrafficIndexDate": "2026-10-28T18:00:00"},
            {"TrafficIndex": "52", "TrafficIndexDate": "2026-10-28T17:00:00"},
        ]
        result = normalise_records(source, "H")
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["index"], 52.0)
        self.assertTrue(result[0]["observedAt"].endswith("+03:00"))

    def test_wrapper_response_and_invalid_rows(self):
        source = {"data": [
            {"trafficIndex": 38, "trafficIndexDate": "2026-10-27T09:00:00"},
            {"TrafficIndex": 101, "TrafficIndexDate": "2026-10-27T10:00:00"},
            {"TrafficIndex": "not-a-number", "TrafficIndexDate": "2026-10-27T11:00:00"},
            {"other": "field"},
        ]}
        result = normalise_records(source, "H")
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["index"], 38.0)

    def test_history_needs_minimum_coverage(self):
        short = [{"observedAt": f"2026-10-28T{hour:02d}:00:00+03:00", "index": hour, "sourceFrequency": "H"} for hour in range(10)]
        with self.assertRaises(ValueError):
            build_payload(short, [], fetched_at=datetime(2026, 10, 29, tzinfo=timezone.utc))

    def test_current_and_daily_snapshot_are_merged(self):
        history = []
        for day in range(1, 29):
            history.append({"observedAt": f"2026-10-{day:02d}T09:00:00+03:00", "index": 30 + day % 15, "sourceFrequency": "H"})
        current = [{"observedAt": "2026-10-29T12:05:00+03:00", "index": 42, "sourceFrequency": "5M"}]
        payload = build_payload(history, current, previous={"snapshots": []}, fetched_at=datetime(2026, 10, 29, 9, 10, tzinfo=timezone.utc))
        self.assertEqual(payload["status"], "available")
        self.assertEqual(payload["currentObservation"]["index"], 42)
        self.assertEqual(len(payload["snapshots"]), 1)
        self.assertEqual(payload["snapshots"][0]["snapshotDate"], "2026-10-29")

    def test_current_failure_is_marked_as_hourly_fallback(self):
        history = [{"observedAt": f"2026-10-{day:02d}T09:00:00+03:00", "index": day, "sourceFrequency": "H"} for day in range(1, 25)]
        payload = build_payload(history, [], current_error="network down", fetched_at=datetime(2026, 10, 29, tzinfo=timezone.utc))
        self.assertEqual(payload["status"], "partial")
        self.assertFalse(payload["currentObservation"]["isCurrentFrequency"])
        self.assertIn("network down", payload["warning"])
        self.assertEqual(payload["snapshots"], [])


if __name__ == "__main__":
    unittest.main()
