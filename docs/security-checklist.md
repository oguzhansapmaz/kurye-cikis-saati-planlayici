# Ödev gereksinimi → uygulama/kanıt eşlemesi

| Yönerge maddesi | Bu repodaki karşılık | Tamamlamak için gereken |
|---|---|---|
| Küçük base + root olmayan kullanıcı | `Dockerfile`, `nginxinc/nginx-unprivileged:stable-alpine`, `USER 101:101` | Build + `docker image inspect` / `id` çıktısı |
| Salt okunur dosya sistemi | `compose.readonly.yml`, CI read-only smoke test | Gerçek Docker/Actions başarılı sonucu |
| Trivy CI ve kritik zafiyette durdurma | `.github/workflows/security.yml` | GitHub Actions'ta gerçek tarama başarılı/başarısız çıktısı ve JSON kanıtı |
| Önce/sonra kritik adetleri | `Dockerfile.baseline`, `docs/trivy-before-after.md`, `scripts/compare_trivy.py` | Gerçek iki JSON taraması; sayıları rapora yaz |
| Bulut yayını | `infra/terraform`, `docs/cloud-run-deployment.md` | GCP proje/billing/registry ve canlı HTTPS URL |
| IaC | `infra/terraform/main.tf` | `terraform plan/apply` sonucu veya raporda gerçek çıktı |
| Secret scanning / dependency | Gitleaks, Dependabot | Repo ayarları ve Actions run kanıtı |
| En az yetki CI/OIDC | `docs/github-actions-oidc.md`, workflow `permissions` | OIDC sağlayıcı/role bağlantısı; key JSON kullanmama |
| HTTPS/HSTS/CSP/security headers | `vercel.json`, `nginx/default.conf`, `.well-known/security.txt` | Canlı URL `curl -I`, Observatory ve securityheaders kanıtı |
| DFD + 8 STRIDE tehdit | `docs/architecture.md`, `docs/stride-risk-register.csv` | Rapor içinde gözden geçirilmiş olmalı |
| ZAP önce/sonra | Henüz rapor yok | Yalnızca kendi Vercel/Cloud Run URL'nde iki baseline scan ve düzeltme karşılaştırması |
| Log ve alarm / bütçe | `docs/cloud-run-deployment.md` yönergeleri | Cloud Logging + alarm + budget alert gerçekten kurulmalı; ekran görüntüsü |
| Olay müdahale kılavuzu | `docs/incident-response-runbook.md` | Kişiselleştirip rapora ekle |
| Güvenlik raporu PDF | `docs/security-report-template.md` | Kanıtlarla 5–8 sayfaya dönüştür ve PDF dışa aktar |
| Portföy “Güvenlik ve Altyapı” | README/deploy dokümanında planlandı | Canlı URL ve gerçek üç kontrol sonucuyla portföyde güncelle |

**Durum kuralı:** Dosya mevcut olması, gerçek servisin kurulduğu ya da testin geçtiği anlamına gelmez. Kanıtı olmayan maddeleri “devam ediyor” olarak bırak.


## Harita hizmeti için ek kontrol

- Ana sayfadaki İzmir haritası OpenStreetMap gömülü harita çerçevesini kullanır. Bu nedenle harita açıldığında tarayıcı OpenStreetMap alan adına bağlanır; “harici çağrı yok” iddiası kullanılmamalıdır.
- `Referrer-Policy: strict-origin-when-cross-origin` tüm kaynağı değil yalnızca origin bilgisini üçüncü tarafa gönderir. OSM atfı haritanın yanında görünür.
- Ürün canlı trafik veya gerçek zamanlı kurye konumu göstermediğini açıkça belirtir.
