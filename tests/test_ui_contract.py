import json
import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class ContractParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.scripts = []
        self.links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids.append(attrs["id"])
        if tag == "script" and attrs.get("src"):
            self.scripts.append(attrs["src"])
        if tag == "a" and attrs.get("href"):
            self.links.append(attrs["href"])


class UiContractTests(unittest.TestCase):
    def test_dashboard_contains_required_features(self):
        parser = ContractParser()
        parser.feed((ROOT / "index.html").read_text(encoding="utf-8"))
        self.assertEqual(len(parser.ids), len(set(parser.ids)), "HTML id değerleri benzersiz olmalı")
        required = {
            "traffic-insights", "traffic-current-value", "traffic-current-time",
            "traffic-delta-value", "traffic-trend-chart", "traffic-heatmap",
            "route-origin", "route-destination", "recommend-weekday", "recommend-hour",
            "traffic-observation-table", "traffic-heatmap-table", "traffic-update-label",
        }
        self.assertTrue(required.issubset(set(parser.ids)), f"Eksik HTML ID'leri: {sorted(required - set(parser.ids))}")
        self.assertIn("./traffic-dashboard.js", parser.scripts)
        self.assertIn("./map.js", parser.scripts)
        self.assertIn("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js", parser.scripts)
        self.assertIn('id="istanbul-map-canvas"', (ROOT / "index.html").read_text(encoding="utf-8"))
        self.assertTrue((ROOT / "api" / "traffic-tile.js").is_file())
        dashboard_js = (ROOT / "traffic-dashboard.js").read_text(encoding="utf-8")
        self.assertIn("raw.githubusercontent.com/oguzhansapmaz/kurye-cikis-saati-planlayici/traffic-data/data/traffic.json", dashboard_js)
        self.assertIn("function fetchLiveIbbData()", dashboard_js)
        self.assertIn("api.ibb.gov.tr/tkmservices/api/TrafficData", dashboard_js)
        for config_path in (ROOT / "vercel.json", ROOT / "nginx" / "default.conf"):
            config = config_path.read_text(encoding="utf-8")
            self.assertIn("https://api.ibb.gov.tr", config)

    def test_initial_dataset_does_not_fabricate_observations(self):
        data = json.loads((ROOT / "data" / "traffic.json").read_text(encoding="utf-8"))
        self.assertEqual(data["status"], "empty")
        self.assertEqual(data["observations"], [])
        self.assertIsNone(data["currentObservation"])
        self.assertIn("İstanbul geneli", data["source"]["geography"])

    def test_local_assets_and_istanbul_navigation_exist(self):
        parser = ContractParser()
        parser.feed((ROOT / "index.html").read_text(encoding="utf-8"))
        for path in parser.scripts:
            if path.startswith(("http://", "https://", "//")):
                continue
            self.assertTrue((ROOT / path).is_file(), f"Eksik yerel script: {path}")
        for link in parser.links:
            if link.startswith(("http://", "https://", "//", "#", "mailto:")):
                continue
            if link.startswith("./"):
                target = link[2:].split("#", 1)[0].split("?", 1)[0]
                if not target:
                    continue
                self.assertTrue((ROOT / target).is_file(), f"Eksik yerel link: {link}")
        self.assertIn('href="#istanbul-map"', (ROOT / "index.html").read_text(encoding="utf-8"))
        self.assertIn('href="./#istanbul-map"', (ROOT / "security.html").read_text(encoding="utf-8"))
        self.assertNotIn('href="./#izmir-map"', (ROOT / "security.html").read_text(encoding="utf-8"))

    def test_headers_do_not_allow_inline_scripts(self):
        vercel = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
        headers = vercel["headers"][0]["headers"]
        csp = next(item["value"] for item in headers if item["key"] == "Content-Security-Policy")
        self.assertIn("script-src 'self' https://unpkg.com", csp)
        self.assertIn("style-src-attr 'unsafe-inline'", csp)
        self.assertNotIn("'unsafe-inline'", csp.split("script-src", 1)[1].split(";", 1)[0])
        self.assertNotIn("'unsafe-eval'", csp)
        self.assertIn("https://*.tile.openstreetmap.org", csp)
        self.assertIn("https://raw.githubusercontent.com", csp)

    def test_tomtom_proxy_keeps_key_server_side(self):
        api = (ROOT / "api" / "traffic-tile.js").read_text(encoding="utf-8")
        self.assertIn("process.env.TOMTOM_API_KEY", api)
        self.assertIn('url.searchParams.set("key", key)', api)
        self.assertNotIn("TOMTOM_API_KEY =", api)


if __name__ == "__main__":
    unittest.main()
