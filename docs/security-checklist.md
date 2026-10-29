# Ödev gereksinimi → uygulama/kanıt eşlemesi

| Yönerge maddesi | Bu repodaki karşılık | Tamamlamak için gereken |
|---|---|---|
| Küçük base + root olmayan kullanıcı | `Dockerfile`, `nginxinc/nginx-unprivileged:stable-alpine`, `USER 101:101` | Build + `docker image inspect` / `id` çıktısı |
| Salt okunur dosya sistemi | `compose.readonly.yml`, CI read-only smoke test | Gerçek Docker/Actions başarılı sonucu |
| Trivy CI ve kritik zafiyette durdurma | `.github/workflows/security.yml` | GitHub Actions'ta gerçek tarama başarılı/başarısız çıktısı ve JSON kanıtı |
| Önce/sonra kritik adetleri | `Dockerfile.baseline`, `.github/workflows/trivy-baseline.yml`, `docs/trivy-before-after.md` | Gerçek `trivy-before.json` ve `trivy-after.json` artifactlerini indir ve sayıları rapora yaz |
| Bulut yayını | `infra/terraform`, `docs/cloud-run-deployment.md` | ERTELENDİ: Azure/Google Cloud hesabı ve şartı öğretim elemanıyla netleştirilecek |
| IaC | `infra/terraform/main.tf` | `terraform plan/apply` sonucu veya raporda gerçek çıktı |
| Secret scanning / dependency | Gitleaks, Dependabot | Repo ayarları ve Actions run kanıtı |
| En az yetki CI/OIDC | `docs/github-actions-oidc.md`, workflow `permissions` | OIDC sağlayıcı/role bağlantısı; key JSON kullanmama |
| HTTPS/HSTS/CSP/security headers | `vercel.json`, `nginx/default.conf`, `.well-known/security.txt` | Canlı URL `curl -I`, Observatory ve securityheaders kanıtı |
| DFD + 8 STRIDE tehdit | `docs/architecture.md`, `docs/stride-risk-register.csv` | Rapor içinde gözden geçirilmiş olmalı |
| ZAP önce/sonra | `.github/workflows/zap-baseline.yml` | Kendi Vercel URL'nde `before`/`after` workflow çalıştır ve artifact indir |
| Log ve alarm / bütçe | `docs/cloud-run-deployment.md` yönergeleri | Cloud Logging + alarm + budget alert gerçekten kurulmalı; ekran görüntüsü |
| Olay müdahale kılavuzu | `docs/incident-response-runbook.md` | Kişiselleştirip rapora ekle |
| Güvenlik raporu PDF | `docs/security-report-template.md` | Kanıtlarla 5–8 sayfaya dönüştür ve PDF dışa aktar |
| Portföy “Güvenlik ve Altyapı” | README/deploy dokümanında planlandı | Canlı URL ve gerçek üç kontrol sonucuyla portföyde güncelle |

**Durum kuralı:** Dosya mevcut olması, gerçek servisin kurulduğu ya da testin geçtiği anlamına gelmez. Kanıtı olmayan maddeleri “devam ediyor” olarak bırak.


## Trafik verisi ve harita için ek kontrol

- Ana sayfadaki İstanbul haritası Leaflet ve OpenStreetMap karo hizmetini kullanır; tarayıcı `unpkg.com` ve `*.tile.openstreetmap.org` kaynaklarına bağlanır. Canlı trafik katmanı Vercel `api/traffic-tile.js` üzerinden TomTom Traffic Flow Tiles çağırır. “Harici çağrı yok” iddiası kullanılmamalıdır.
- `TOMTOM_API_KEY` yalnızca Vercel Production Environment Variables içinde tutulmalıdır; kaynak kodunda veya GitHub'da yer almamalıdır. TomTom anahtarı ürün/alan adı kısıtlamaları ve kullanım gözlemiyle korunmalıdır. Proxy referrer kontrolü tek başına güçlü bir kota/rate-limit sistemi değildir.
- `Referrer-Policy: strict-origin-when-cross-origin` tüm kaynağı değil yalnızca origin bilgisini üçüncü tarafa gönderir. OSM atfı haritanın yanında görünür.
- İBB endeks kartı gerçek veri dosyası çekildiyse şehir-geneli tarihsel indeksi gösterir; ilçe/rota bazlı canlı trafik veya gerçek zamanlı kurye konumu iddia etmez. Boş veri durumunda sahte sayı üretilmez.


## Kullanıcı arayüzü ödevi için ek maddeler

- [ ] GitHub Actions `İBB trafik verisini güncelle` ilk kez başarıyla çalıştı ve `data/traffic.json` doldu.
- [ ] `fetchedAt`, kaynak bağlantısı ve İstanbul zaman dilimi ekran üzerinde doğru görünüyor.
- [ ] Hafta günü × saat ısı haritası, ana trend, aynı gün/saat karşılaştırması ve sıralanabilir tablo gerçek gözlemlerden üretiliyor.
- [ ] Aynı çıkış/varış ilçesi seçilince açıklayıcı doğrulama mesajı gösteriliyor.
- [ ] Kaynak hata/boş-data/last-good-cache durumları denenip ekran görüntüsü alındı.
- [ ] 2 katılımcı × 3 görev kullanıcı testi gerçek zamanlarla dolduruldu.
- [ ] 60–90 saniyelik gerçek demo videosu kaydedildi; portföy vakası yayımlandı.
- [ ] Lighthouse mobil raporu alındı; gerçek değerler not edildi.
- [ ] Veri lisansı/atıf şartları portal kaydından kontrol edildi.
