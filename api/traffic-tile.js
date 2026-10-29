"use strict";

const PROJECT_SLUG = "kurye-cikis-saati-planlayici";

function trustedHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  if (host === "localhost" || host === "127.0.0.1") return true;
  return host === `${PROJECT_SLUG}.vercel.app` ||
    (host.endsWith(".vercel.app") && host.includes(PROJECT_SLUG));
}

function trustedRequest(req) {
  const requestOrigin = req.headers.origin;
  const requestReferer = req.headers.referer || req.headers.referrer;
  const requestHost = String(req.headers.host || "").split(":")[0].toLowerCase();
  if (requestOrigin) {
    try {
      const originHost = new URL(requestOrigin).hostname.toLowerCase();
      return trustedHost(originHost) && originHost === requestHost;
    } catch (_) { return false; }
  }
  if (requestReferer) {
    try {
      const refererHost = new URL(requestReferer).hostname.toLowerCase();
      return trustedHost(refererHost) && refererHost === requestHost;
    } catch (_) { return false; }
  }
  return false;
}

module.exports = async function handler(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Vary", "Origin, Referer");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!trustedRequest(req)) return res.status(403).json({ error: "Same-origin traffic tiles only" });

  const key = process.env.TOMTOM_API_KEY;
  if (!key) return res.status(503).json({ configured: false, error: "TomTom API anahtarı yapılandırılmamış." });
  if (req.query && req.query.health === "1") {
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ configured: true, provider: "TomTom Traffic Flow Tiles" });
  }

  const z = Number(req.query && req.query.z);
  const x = Number(req.query && req.query.x);
  const y = Number(req.query && req.query.y);
  if (!Number.isInteger(z) || z < 5 || z > 18 || !Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= 2 ** z || y >= 2 ** z) {
    return res.status(400).json({ error: "Geçersiz harita karosu." });
  }

  try {
    const url = new URL(`https://api.tomtom.com/traffic/map/4/tile/flow/relative0/${z}/${x}/${y}.png`);
    url.searchParams.set("tileSize", "256");
    // The v4 Raster Flow Tiles endpoint documents the key query parameter.
    // This URL is constructed server-side only; the key is never returned to the browser.
    url.searchParams.set("key", key);
    const upstream = await fetch(url, {
      method: "GET",
      headers: { Accept: "image/png" },
      signal: AbortSignal.timeout(10000)
    });
    if (!upstream.ok) {
      console.error("TomTom traffic tile upstream status:", upstream.status);
      return res.status(502).json({ error: "TomTom trafik karosu alınamadı; API ürün erişimini kontrol et." });
    }
    const contentType = upstream.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("image/png")) {
      console.error("TomTom traffic tile returned unexpected content type");
      return res.status(502).json({ error: "TomTom beklenmeyen bir yanıt verdi." });
    }
    const image = Buffer.from(await upstream.arrayBuffer());
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=120, stale-while-revalidate=300");
    return res.status(200).send(image);
  } catch (error) {
    console.error("TomTom traffic tile request failed:", error && error.name ? error.name : "unknown");
    return res.status(502).json({ error: "Canlı trafik servisine şu anda ulaşılamıyor." });
  }
};
