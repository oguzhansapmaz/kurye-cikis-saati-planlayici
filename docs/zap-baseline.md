# OWASP ZAP baseline test — yalnızca kendi Kuryeplan URL'in

Bu workflow pasif baseline taramasıdır ve yalnızca bu kullanıcıya ait Vercel URL'sini hedefler. İBB API'sini, üçüncü taraf siteleri, üniversite sistemlerini veya başka öğrencilerin sitelerini hedefleme. ZAP baseline pasif test yapar; aktif saldırı veya yük testi değildir.

## Önce taraması

1. `.github/workflows/zap-baseline.yml` GitHub `main` dalına eklensin.
2. GitHub → Actions → **OWASP ZAP baseline — own Vercel site** → Run workflow.
3. `stage` olarak `before` seç.
4. Çalışma tamamlandığında `zap-baseline-before` artifact'ini indir. Gerçek HTML/JSON raporunu `docs/evidence` içinde yerel olarak sakla; hassas veri veya gereksiz ayrıntıları public depoya ekleme.

## İnceleme ve düzeltme

ZAP raporundaki uyarıları bağlamına göre değerlendir. Yalnızca doğrulanmış bulgulara göre düzeltme yap; bir alarm sayısını otomatik olarak “açık” diye yorumlama. HTTPS, HSTS, CSP (unsafe-inline/eval olmadan), nosniff, Referrer-Policy, Permissions-Policy, frame koruması ve `/.well-known/security.txt` yanıtını ayrıca test et.

## Sonra taraması

1. Güvenlik düzeltmeleri Vercel'de gerçekten yayımlandıktan sonra aynı workflow'u yeniden çalıştır.
2. `stage` olarak `after` seç.
3. `zap-baseline-after` artifact'ini indir.
4. Önce/sonra gerçek alert seviyelerini karşılaştır; düzelmeyen/yanlış pozitif uyarıları kalan risk olarak belirt. Tarama çalışmadan sonuç sayısı uydurma.
