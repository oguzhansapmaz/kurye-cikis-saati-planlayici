#!/usr/bin/env python3
"""Print the real CRITICAL vulnerability count from a Trivy image JSON report."""
import json
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python scripts/compare_trivy.py <trivy-json-report>", file=sys.stderr)
        return 2
    path = Path(sys.argv[1])
    if not path.is_file():
        print(f"Report not found: {path}", file=sys.stderr)
        return 2
    try:
        report = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"Could not read Trivy report: {exc}", file=sys.stderr)
        return 2
    rows = report.get("Results") or []
    findings = []
    seen = set()
    for row in rows:
        for item in row.get("Vulnerabilities") or []:
            if item.get("Severity") == "CRITICAL":
                unique_key = (item.get("VulnerabilityID"), item.get("PkgName"), item.get("InstalledVersion"))
                if unique_key not in seen:
                    seen.add(unique_key)
                    findings.append(item)
    target = report.get("ArtifactName") or report.get("Target") or path.name
    print(f"Report: {path}")
    print(f"Image/target: {target}")
    print(f"CRITICAL vulnerabilities: {len(findings)}")
    if not rows:
        print("WARNING: Trivy report has no Results entries; confirm the scan completed.")
        return 1
    for item in findings:
        print(f" - {item.get('VulnerabilityID', 'unknown')} | {item.get('PkgName', 'unknown')} | {item.get('InstalledVersion', 'unknown')} -> {item.get('FixedVersion', 'no fixed version')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
