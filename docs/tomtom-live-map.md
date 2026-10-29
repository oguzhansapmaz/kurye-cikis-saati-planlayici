# TomTom canlı trafik katmanı

## Kurulum

- Vercel Project Settings → Environment Variables → `TOMTOM_API_KEY` (Production). Anahtarın değeri yalnızca Vercel'de saklanır.
- TomTom yönetim panelinde Traffic Raster Flow Tiles hizmetine ürün erişimini doğrula.
- Yeni deployment sonrasında İstanbul haritasında `Canlı TomTom trafik katmanı açık` durumunu kontrol et. Katman kontrolünden canlı trafik açılıp kapatılabilir.

## Teknik akış

`Leaflet` → aynı-origin `/api/traffic-tile?z=...&x=...&y=...` → `api/traffic-tile.js` → TomTom Raster Flow Tiles v4 → PNG karo. TomTom anahtarı tarayıcıya gönderilmez. `?health=1` anahtarın sunucu ortamında tanımlı olup olmadığını anahtarı açığa çıkarmadan denetler.

## Güvenlik ve sınırlamalar

- Proxy referrer/origin doğrulaması basit hotlink önlemidir; güçlü rate limiting değildir. TomTom anahtarının izinlerini/kotasını sınırla ve kullanımı izle.
- Yalnızca Vercel serverless dağıtım `api/traffic-tile.js` dosyasını fonksiyon olarak çalıştırır. NGINX/Docker sürümünde API proxy ayrıca yapılandırılmadıkça canlı trafik katmanı gösterilmez.
- Canlı trafik renkleri yol segmentlerinin bağıl hızını gösterir; kurye GPS'i, tarihsel veri kümesi veya güzergâha özel teslim süresi değildir. İBB tarihsel indeks dashboard'u ayrı veri kaynağı olarak kalır.
- OpenStreetMap taban harita karoları için atıf gösterilir. Leaflet 1.9.4 sabitlenmiş, SRI ile yüklenmiştir.
