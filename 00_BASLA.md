# Başlamadan önce — Kurye Çıkış Saati Planlayıcı

Bu proje sıfırdan oluşturulmuş çalışan bir statik web uygulaması ve Bulut Bilişim ve Siber Güvenlik ödevi için güvenlik/dağıtım iskeletidir. Vercel'e UI dağıtımı yapılabilir; ancak ders kartındaki Docker ve Cloud Run/Container Apps gereksinimleri ayrıca tamamlanmalıdır.

## 1. Web sitesini yerelde aç

`start-local.bat` dosyasına çift tıkla. Bu dosya projeyi yerel sunucuda açmayı dener ve varsa Anaconda Python yolunu kullanır. Açılmazsa Anaconda Prompt içinde proje klasörüne girip `C:\Anaconda3\envs\rayli-agi\python.exe -m http.server 8081 --bind 127.0.0.1` komutunu çalıştır ve `http://127.0.0.1:8081` adresini aç.

`index.html` dosyasını doğrudan açmak da arayüzün bir bölümünü göstermelidir; harita ise internet bağlantısı gerektirir.

## 2. GitHub'a koy

1. GitHub'da `kurye-cikis-saati-planlayici` adında boş public repository oluştur; README/.gitignore seçme (bu klasörde ikisi de zaten var).
2. Bu klasördeki **tüm dosya ve gizli klasörleri** GitHub'a gönder. `.github/workflows/` görünür olmalı. `.env`, key veya credentials ekleme.
3. `git init`, `git add .`, `git commit`, `git branch -M main`, `git remote add origin ...`, `git push -u origin main` kullanılabilir. Repository URL'ni not et.

## 3. Vercel yayını

`docs/vercel-deployment.md` adımlarını izle. Vercel'de GitHub repo import edilir; build/install komutu gerekmez, site statik HTML/CSS/JS'dir. Canlı URL ve güvenlik başlıkları test edilmeden rapora başarılı diye yazma.

## 4. Docker güvenlik testi

`docs/container-proof.md` adımlarını izle. Docker Desktop gereklidir. Runtime user `101:101` olmalı ve read-only çalışma komutu başarıyla test edilmelidir.

## 5. Trivy “önce/sonra”

`docs/trivy-before-after.md` dosyasındaki komutları sırayla uygula. `Dockerfile.baseline` eski/root çalışan imajdır ve yalnızca local scan için vardır; asla deploy etme. JSON raporlarından gerçek kritik zafiyet sayılarını al.

## 6. CI ve Cloud Run

GitHub Actions iş akışı: `.github/workflows/security.yml`. Gitleaks veya Trivy başarısız olursa release devam etmez. Cloud Run'a otomatik release için önce `docs/github-actions-oidc.md` ve `docs/cloud-run-deployment.md` adımlarını uygula. GCP/OIDC ayarları verilmediği sürece deploy job'u çalışmaz; bu beklenen güvenli varsayılandır.

## 7. Teslim kanıtları ve rapor

- `docs/security-report-template.md` şablonunu gerçek sonuçlarla doldur.
- Gerçek ekran görüntülerini `docs/evidence/` içine al; public depoya hassas log veya anahtar koyma.
- STRIDE risk tablosu `docs/stride-risk-register.csv` içindedir.
- Bütçe alarmı ve izleme alarmı gerçekten kurulmalı. Sadece yönerge dosyası bu maddeleri tamamlamaz.

## Gerçek dışı başarı yazma

Bu paket bir web uygulaması ve dosya iskeleti hazırlar. Senin GitHub/Vercel/Google Cloud hesabında yayın, Trivy, ZAP, Observatory, securityheaders, maliyet alarmı, izleme alarmı ve ekran görüntüsü henüz çalıştırılıp doğrulanmış değildir. Bunları ancak gerçek sonuçlar oluşunca “tamamlandı” olarak işaretle.
