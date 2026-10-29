# Google Cloud Run dağıtımı

Bu uygulama iki hedef için hazırlanır: statik UI Vercel'de, Docker ürünü ise ödev kartını karşılamak için Cloud Run'da. Aynı kaynak dosyaları her iki hedefte de kullanılabilir. Cloud Run deploy'u burada henüz yapılmış değildir; kullanıcı Google Cloud hesabı/izinleri ve image registry gerekir.

## Maliyet ve hesap

- Google Cloud hesabında billing aktif olmalıdır; yeni hesaplarda kredi/promosyon koşulları değişebilir. Ücretsiz kota/harcama tutarı için sağlayıcının mevcut fiyatlandırmasını kontrol et.
- Bir bütçe alarmı kur (tercihen küçük bir uyarı sınırı ve %50/%90/%100); bütçe alarmı tek başına harcamayı durdurmaz.
- Cloud Run için minimum instance 0, maksimum instance 1 ve düşük CPU/RAM limiti kullan. Container Artifact Registry'de depolanması ücret doğurabilir.
- Testten sonra kullanılmayan servis ve image repository'yi silmeyi değerlendir.

## Seçenek A — gcloud ile hızlı yayın

Önkoşullar: Docker, `gcloud` CLI, bir Google Cloud project, billing ve Container Registry/Artifact Registry izinleri.

1. `gcloud auth login` ve `gcloud config set project YOUR_PROJECT_ID`.
2. Artifact Registry'de `europe-west1` bölgesinde Docker repository oluştur (`kurye-images`).
3. `gcloud auth configure-docker europe-west1-docker.pkg.dev`.
4. Image'ı oluştur ve yükle:

```bash
docker build --pull -t europe-west1-docker.pkg.dev/YOUR_PROJECT_ID/kurye-images/kurye-planlayici:1.0 .
docker push europe-west1-docker.pkg.dev/YOUR_PROJECT_ID/kurye-images/kurye-planlayici:1.0
```

5. Trivy taramasını **push/deploy'dan önce** yap:

```bash
trivy image --scanners vuln --severity CRITICAL --ignore-unfixed --exit-code 1 europe-west1-docker.pkg.dev/YOUR_PROJECT_ID/kurye-images/kurye-planlayici:1.0
```

6. Kritik bulgu varsa düzelt ve tekrar taramadan geçmeden deploy etme. Başarılıysa:

```bash
gcloud run deploy kurye-planlayici \
  --image europe-west1-docker.pkg.dev/YOUR_PROJECT_ID/kurye-images/kurye-planlayici:1.0 \
  --region europe-west1 \
  --port 8080 \
  --cpu 1 --memory 256Mi \
  --min 0 --max 1 \
  --allow-unauthenticated
```

7. Ekranda verilen HTTPS URL'sini aç; uygulama, `/healthz`, `/.well-known/security.txt` ve security header'ları kontrol et. Gerçek tarih/saat görünürken ekran görüntüsü al.

## Seçenek B — Terraform

`infra/terraform` içinde `google_cloud_run_v2_service` ve least-privilege çalışma kimliği tanımı var. Terraform önce registry'ye yüklenmiş image URL'sini bekler.

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars içine kendi project_id ve gerçek image URL'sini yaz
terraform init
terraform plan
terraform apply
```

Terraform uygulanmadan önce `terraform plan` çıktısını incele; yanlış proje/harcama riski varsa dur. Uygulama tamamlandığında servis URL'sini kaydet ve test et. Bu belgede sahte deployment URL'si veya başarılı cloud çıktısı yoktur.

## Son kontrol

- [ ] HTTPS servisi açılıyor.
- [ ] `id` / image config non-root kanıtı kaydedildi.
- [ ] Docker read-only test komutu başarılı.
- [ ] Trivy sonucu kritik bulgu olmadan tamamlandı veya kalan bulgular dürüstçe raporlandı.
- [ ] Cloud Logging'de erişim/hata kanıtı mevcut; en az bir uptime/metric veya bütçe alarmı gerçek projede kuruldu.
- [ ] Bütçe alarmı ekran görüntüsü alındı.
- [ ] Kaynaklar ve bütçe durumu demo sonrası kontrol edildi.

## Bütçe ve izleme alarmı — kanıt için

1. Google Cloud Console'da **Billing → Budgets & alerts → Create budget** aç.
2. Yalnızca bu proje kapsamını seç; küçük bir harcama bütçesi koy ve %50, %90, %100 eşikleri için email uyarıları etkinleştir. Miktarı hesabının para birimi, ders hedefi ve sağlayıcının güncel fiyatlandırmasıyla belirle.
3. Bu bir harcama tavanı değildir; uyarı alınca kaynağı kapatma/silme eylemini sen yapmalısın.
4. **Monitoring → Uptime checks → Create Uptime Check** üzerinden Cloud Run URL'sinin `/healthz` yolunu HTTPS ile kontrol et.
5. Uptime check başarısız olduğunda tetiklenen bir alert policy oluştur. Testte kullandığın kendi endpoint'ini seç.
6. Billing budget ekranını, uptime check ve alert policy ekranını tarih/saat görünürken kaydet.

Cloud Run stdout/stderr logları Cloud Logging'de görünmelidir. Logs Explorer'dan test isteğine ait erişim/hata kaydını kontrol et; hesap/project ID veya hassas içerik içeren ekranı public depoya koyma.
