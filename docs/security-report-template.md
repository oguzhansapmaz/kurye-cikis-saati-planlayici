# Kurye Çıkış Saati Planlayıcı — Güvenlik ve Altyapı Raporu

**Öğrenci:** Oğuzhan Sapmaz  
**Öğrenci no:** 2516016021  
**Ders:** Bulut Bilişim ve Siber Güvenlik  
**Rapor sürümü/tarihi:** [Gerçek tarih ve saat]  
**Vercel URL:** https://kurye-cikis-saati-planlayici.vercel.app/  
**Bulut yayını:** Kullanıcı talebiyle şimdilik ertelendi; personal card cloud provider şartı öğretim elemanıyla netleştirilecek.  
**GitHub URL:** https://github.com/oguzhansapmaz/kurye-cikis-saati-planlayici

> Bu dosya rapor taslağıdır; bulut, izleme/alarm, bütçe uyarısı, ZAP, Trivy baseline ve canlı veri kanıtı eksik olduğu için tek başına final raporu sayılmaz. Köşeli parantez içindeki alanları gerçek bulgular ve kanıtlarla tamamla. Çalıştırılmayan testleri başarılıymış gibi gösterme.

## 1. Yönetici özeti

Kurye Çıkış Saati Planlayıcı, son teslim zamanından geriye doğru planlama yapan istemci taraflı bir web aracıdır. Kullanıcının verdiği hazırlık, yolculuk ve güven payını hesaplayarak hazırlık başlangıcı, en geç çıkış ve tahmini varış zamanlarını gösterir. İBB şehir-geneli trafik indeksini GitHub Actions ile statik JSON dosyasına alacak veri hattı eklendi; ilk gerçek çekimin başarılı olduğu, bu rapor yazılırken Actions kanıtıyla ayrıca doğrulanmalıdır. Sunucu tarafında sipariş saklama yoktur.

**Doğrulanan güvenlik sonucu:** [Sadece yapılan ve kanıtı bulunan kontrolleri yaz.]  
**Açık riskler:** [Kalan gerçek riskleri yaz.]

## 2. Mimari ve güven sınırları

`docs/architecture.md` içindeki DFD'yi kullan. Tarayıcı verisi, GitHub/CI, container registry ve Cloud Run sınırlarını açıkla. Gerçek servis oluşturulmadıysa bunu belirt.

## 3. Tehdit modeli — STRIDE

`docs/stride-risk-register.csv` içindeki 12 tehdit, başlangıç ve kalan risk ile önlemlerinden hareket et. Kişisel karttaki ana tehdit **container'ın root olarak ve zafiyetli taban imajıyla çalışması** olduğundan root, read-only ve Trivy kontrollerine ayrı bir bölüm ayır.

## 4. Container sertleştirmesi

- Taban imaj: [gerçek `docker image inspect` çıktısı]
- Runtime UID/GID: [gerçek `id` çıktısı]
- Salt-okunur filesystem testi: [komut ve sonuç]
- `no-new-privileges`, `cap_drop: ALL` ve geçici `/tmp` kullanımı: [gerçek test sonucu]

## 5. Trivy önce/sonra

| Ölçüm | Kritik zafiyet adedi | Kanıt |
|---|---:|---|
| Önce — baseline imaj | [gerçek sonuç] | `trivy-before.json` |
| Sonra — hardened imaj | [gerçek sonuç] | `trivy-after.json` |

Sürümleri, `--ignore-unfixed` kullanılıp kullanılmadığını ve scan tarihini not et. Baseline imajı yayınlama. Kritik bulgu varsa release CI gate başarısız olmalıdır.

## 6. Web güvenliği / ZAP

- HTTPS/HSTS: [canlı URL sonucu]
- CSP ve diğer header'lar: [curl / Observatory / securityheaders kanıtı]
- `/.well-known/security.txt`: [canlı URL]
- OWASP ZAP baseline önce: [tarih, rapor, bulgular]
- Düzeltmeler: [yapılan gerçek değişiklikler]
- ZAP baseline sonra: [tarih, rapor, önce/sonra karşılaştırması]

## 7. CI/CD ve sır yönetimi

GitHub Actions Gitleaks ve Trivy workflow'unun gerçek run linkini ekle. Branch protection, Dependabot ve secret scanning ayarlarının ekran görüntülerini ekle. Depoda gerçek API anahtarı bulunmadığını söylemek için yalnızca yaptığın taramayı ve kontrolü kullan.

## 8. İzleme, olay müdahalesi ve maliyet

> Bulut hesabı ve yayını şu an kullanıcı talebiyle ertelendi. Bu nedenle canlı log, alarm ve bütçe alarmı sonuçları bu taslakta tamamlanmış olarak sunulamaz; öğretim elemanıyla onaylanan platform üzerinden daha sonra eklenmelidir.

- Loglar: [gerçek Cloud Logging/servis çıktısı]
- Alarm: [gerçek kural ve ekran görüntüsü]
- Bütçe alarmı: [gerçek ekran görüntüsü; alarmın harcamayı durdurmadığını unutma]
- Maliyet: [sağlayıcı konsolundaki gerçek tahmin/gerçekleşen değer]
- Olay müdahale runbook: `docs/incident-response-runbook.md`

## 9. Sonuç ve kalan riskler

[Doğrulanan sonuçlar, doğrulanmamış alanlar ve kalan riskler. Örnek app gerçek trafik verisi veya gerçek operasyon entegrasyonu değildir; bunu sınırlılık olarak açıkça belirt.]

## Ekler

[Gerçek timestamp'li ekran görüntüleri, Actions run linki, Trivy JSON, ZAP HTML/PDF, `id` çıktısı, HTTP başlıkları ve Cloud Run URL'si. Hassas credential, özel log veya ödeme bilgisi yayımlama.]
