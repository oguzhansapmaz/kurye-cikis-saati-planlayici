# OWASP ZAP baseline test (yalnızca kendi canlı URL'in)

Bu tarama pasif baseline denetimidir; yalnızca sana ait Vercel/Cloud Run URL'sinde kullan. İBB/veri sağlayıcı API'leri, üniversite sistemleri veya başka siteleri hedefleme.

## Önce — ilk yayın taraması

PowerShell'de proje klasöründe ve Docker Desktop çalışırken (URL'yi kendi Vercel veya Cloud Run URL'inle değiştir):

```powershell
New-Item -ItemType Directory -Force .\docs\evidence | Out-Null
docker run --rm -t -v "${PWD}\docs\evidence:/zap/wrk/:rw" ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t "https://YOUR-OWN-URL" -r zap-before.html -J zap-before.json
```

Bu dosyayı `docs/evidence/zap-before.html` ve `.json` olarak sakla. Hatalar varsa raporla; ekran görüntüsünü ve tarama zamanını kaydet.

## Düzeltme ve tekrar taraması

1. ZAP çıktısından gerçekten ilgili olan uyarıları risk düzeyine göre sınıflandır.
2. Bu uygulamada önce HTTPS, HSTS, CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, frame-ancestors ve security.txt varlığını doğrula; gerektiğinde ilgili yapılandırmayı düzeltip yeniden deploy et.
3. Aynı canlı URL'nin düzeltilmiş sürümünde:

```powershell
docker run --rm -t -v "${PWD}\docs\evidence:/zap/wrk/:rw" ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t "https://YOUR-OWN-URL" -r zap-after.html -J zap-after.json
```

4. İki raporun gerçek bulgu adetlerini karşılaştır. Düzelmeyen uyarıları “kalan risk” olarak rapora yaz. Tarama komutu çalıştırılmadan sonuç veya bulgu sayısı uydurma.
