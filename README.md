# Kurye Çıkış Saati Planlayıcı — kuryeplan

Kuryeplan, İstanbul'da çalışan küçük bir kurye işletmesinin operasyon sorumlusuna son teslim saatinden geriye doğru hazırlık başlangıcını ve en geç çıkış zamanını planlamada yardımcı olan bir web ürünüdür. Ürün, İBB'nin yayımladığı **şehir geneli** trafik indeksinin tarihsel örüntülerini de göstermeyi amaçlar.

> **Veri ve kapsam notu:** İBB trafik kaynağı şehir genelinde tek indeks sağlar; ilçe çifti veya sokak bazında trafik ölçümü, gerçek rota süresi, GPS takibi ya da geleceğe dönük trafik tahmini değildir. İlk otomatik veri çekimi başarılı olmadan site örnek/sahte trafik sayısı göstermez; bunun yerine açıklayıcı boş durum gösterir. Planlar mevcut sürümde tarayıcının `localStorage` alanında tutulur; gerçek müşteri/sipariş bilgisi girmeyin.

## Özellikler

- Türkçe, duyarlı web arayüzü; tablet ve masaüstünde büyük dokunma hedefleri.
- Teslimat zamanı, hazırlık, kullanıcı tahmini yol süresi ve güven payına göre çıkış/başlangıç hesaplaması.
- Tarayıcıda plan kaydı ve CSV dışa aktarma.
- İstanbul haritası: Leaflet + OpenStreetMap taban haritası ve Vercel sunucu fonksiyonu üzerinden TomTom canlı trafik akış karoları. TomTom anahtarı yalnızca Vercel ortam değişkeninde tutulur; NGINX/Docker statik dağıtımında proxy ayrıca kurulmadıkça canlı katman kapalı kalır.
- İBB şehir geneli trafik indeksinden zaman serisi, haftanın günü × saat ısı haritası, aynı gün/saat geçmiş karşılaştırması, tarihsel saat önerisi ve sıralanabilir gözlem tablosu.
- Trafik verisi GitHub Actions tarafından günlük çekilir; geçersiz/eksik kaynak yanıtı son başarılı JSON dosyasını değiştirmez. Son başarılı dosya tarayıcıda önbelleklenebilir.
- Yükleniyor, boş veri, kaynak hatası ve son başarılı veriye dönme durumları.
- Vercel statik dağıtımı için güvenlik başlıkları; `/.well-known/security.txt` teknik bildirim dosyası.
- Docker için unprivileged NGINX, UID/GID `101:101`, salt okunur çalışma testi, `no-new-privileges`, `cap_drop: ALL` ve Trivy CI kapısı.

## Veri kaynağı ve metodoloji

- İBB veri sayfası: https://data.ibb.gov.tr/dataset/trafik-indeks-degeri-web-servisi
- Saatlik tarihsel uç nokta: `https://api.ibb.gov.tr/tkmservices/api/TrafficData/v1/TrafficIndexHistory/28/H`
- Kısa aralıklı indeks uç noktası: `https://api.ibb.gov.tr/tkmservices/api/TrafficData/v1/TrafficIndexHistory/1/5M`
- Veri dosyası: `data/traffic.json`
- Toplayıcı: `scripts/fetch_ibb_traffic.py`
- Zamanlanmış workflow: `.github/workflows/traffic-data.yml` (günlük 09:15 Türkiye saati; `workflow_dispatch` ile elle de çalıştırılabilir).

Toplayıcı kaynak yanıtını doğrular, gözlemleri zaman sırasına koyar, yinelenen zamanları tekilleştirir ve `data/traffic.json` dosyasını atomik olarak yazar. Zorunlu tarihsel uç nokta başarısızsa son başarılı dosya korunur ve workflow başarısız olur. Kısa aralıklı uç nokta başarısız ama tarihsel uç nokta başarılıysa çıktı açık bir `partial` uyarısıyla son saatlik gözleme geri döner. Kaynağın tam lisans/atıf şartı teslimden önce portal üzerinden ayrıca doğrulanmalıdır.

**Önemli sınırlılık:** Tarihsel düşük indeksli saat, ilçe çifti için kanıtlanmış en hızlı rota demek değildir. Öneri, yalnızca kullanıcının seçtiği gün/saat çevresinde yeterli geçmiş şehir-geneli gözlem varsa verilir; gerçek rota navigasyonu yerine geçmez.

## Yerelde çalıştırma

Bağımlılıksız statik uygulamadır. Proje kökünde aşağıdaki komutla yerel web sunucusu başlatılabilir:

```bash
python -m http.server 8081 --bind 127.0.0.1
```

Tarayıcıda `http://127.0.0.1:8081` adresini aç. Windows'ta Python `PATH` üzerinde değilse Anaconda Prompt'ta bilinen Python yolunu kullan: `C:\Anaconda3\envs\rayli-agi\python.exe -m http.server 8081 --bind 127.0.0.1`.

Python veri hattı testleri:

```bash
python -m unittest discover -s tests -v
python scripts/fetch_ibb_traffic.py
```

İkinci komut internet bağlantısı ve İBB uç noktasının erişilebilir olmasını gerektirir; yanıt doğrulanamazsa var olan son başarılı `data/traffic.json` korunur. Statik dosyaları `file://` ile açmak, fetch/CSP davranışını doğru test etmez; yerel sunucu kullan.

## Canlı TomTom trafik katmanı (Vercel)

1. Vercel Project Settings → Environment Variables bölümünde `TOMTOM_API_KEY` adında Production değişkeni oluştur. API anahtarını dosyaya veya GitHub'a koyma.
2. TomTom panelinde Traffic Raster Flow Tiles ürününün bu anahtar için açık olduğunu ve kullanım kotasını kontrol et. Mümkünse anahtarın ürün erişimini sınırla ve kullanımını izle.
3. `api/traffic-tile.js`, anahtarı sunucu tarafında tutarak TomTom Traffic Flow Tiles uç noktasını vekil olarak çağırır. İstemciye anahtar gönderilmez.
4. Proxy tarayıcı çağrılarında Vercel proje referrer/origin değerini kontrol ederek basit hotlink koruması uygular; bu, bağımsız API rate limiter yerine geçmez. TomTom kotasını gözlemle.
5. NGINX/Docker sürümü statik sunucudur; bu Vercel fonksiyonunu çalıştırmaz. Container için canlı trafik katmanı ayrıca proxy entegrasyonu gerektirir.

## Vercel'e yayınlama

1. GitHub'daki `kurye-cikis-saati-planlayici` deposunu Vercel'e bağla.
2. Framework preset `Other`; build/install komutu gerekmez, Output Directory proje kökü (`.`).
3. Her commit sonrasında deploy durumunu kontrol et.
4. Yayın sonrası planlama hesabı, CSV, İstanbul haritası, trafik veri kartı (ilk veri çekiminden sonra), güvenlik sayfası ve `/.well-known/security.txt` adresini elle kontrol et.
5. `curl -I https://kurye-cikis-saati-planlayici.vercel.app/` ile başlıkları gör; Mozilla Observatory/securityheaders sonuçlarını ancak gerçek tarama sonrasında raporla.

Ayrıntı: [`docs/vercel-deployment.md`](docs/vercel-deployment.md)

## CI ve güvenlik

`.github/workflows/security.yml` Gitleaks deposu taramasını, Docker build'i, runtime kullanıcısının `101:101` olduğunu, salt-okunur smoke testini ve Trivy'nin kritik zafiyet kapısını çalıştırır. Kritik bulgu release adımını engeller. Başarılı scan artifact'inde tam Trivy JSON ve taranan imaj saklanır. Bulut ayarları verilmediği için Cloud Run adımı şu anda koşullu olarak atlanır.

Ek olarak:
- `.github/workflows/traffic-data.yml`: günlük İBB trafik indeksini çeker ve doğrulanmış JSON dosyasını günceller.
- `.github/workflows/trivy-baseline.yml`: yalnızca karşılaştırma için eski/root çalışan baseline imajını tarar; **baseline imajı asla yayımlanmaz**.
- `.github/workflows/zap-baseline.yml`: yalnızca bu depoya ait Vercel adresinde pasif ZAP baseline taraması çalıştırır; `before` ve `after` sonuçları gerçek run artifact'lerinden karşılaştırılmalıdır.
- Dependabot yapılandırması ve `.well-known/security.txt` dosyası depoda bulunur.

## Docker güvenlik testleri

Docker Desktop açıkken:

```bash
docker build --pull -t kurye-planlayici:hardened .
docker image inspect kurye-planlayici:hardened --format '{{.Config.User}}'
docker run --rm --entrypoint id kurye-planlayici:hardened
```

İlk iki kanıt `101:101` kullanıcıyı; `id` çıktısı UID/GID 101'i göstermelidir. Salt okunur runtime testi:

```bash
docker run --rm --read-only --tmpfs /tmp:rw,noexec,nosuid,size=64m --security-opt no-new-privileges --cap-drop ALL -p 8080:8080 kurye-planlayici:hardened
```

Ayrıntı: [`docs/container-proof.md`](docs/container-proof.md), [`docs/trivy-before-after.md`](docs/trivy-before-after.md).

## Teslim, rapor ve gerçek kanıt

- [`docs/design-decisions.md`](docs/design-decisions.md): tasarım kararları.
- [`docs/portfolio-case-study.md`](docs/portfolio-case-study.md): portföy vaka sayfası taslağı.
- [`docs/demo-script.md`](docs/demo-script.md): 60–90 saniyelik demo taslağı.
- [`docs/user-test-template.csv`](docs/user-test-template.csv): 2 kullanıcı × 3 görev için boş gerçek test formu.
- [`docs/security-report-template.md`](docs/security-report-template.md): güvenlik raporu taslağı.
- [`docs/stride-risk-register.csv`](docs/stride-risk-register.csv): 12 STRIDE tehdidi.
- `docs/evidence/`: kendi ekran görüntülerini ve raporlarını koyacağın klasör.

Kullanıcı testi, demo videosu, ilk canlı İBB veri çekimi, ZAP önce/sonra raporu, Trivy baseline JSON, Lighthouse sonuçları ve portföy yayını gerçek olarak üretilmeden tamamlandı diye işaretlenmemelidir. Bulut sağlayıcısı, bütçe alarmı, log ve alarm kuralları kullanıcının talebiyle şimdilik ertelenmiştir; bu alanlar teslimden önce hocayla netleştirilmelidir. Ücretin sıfır olduğu varsayılmamalıdır.

## Yapay zekâ kullanım beyanı

Bu projede ChatGPT; başlangıç arayüzü ve dokümantasyon taslakları oluşturma, trafik veri hattı kodu ve testlerini hazırlama, güvenlik yapılandırmalarını gözden geçirme ve hata ayıklama desteği için kullanılmıştır. Öğrenci, kodu çalıştırıp sonuçlarını doğrulamalı ve yaptığı kararları demoda kendi cümleleriyle açıklayabilmelidir.

## CV için tek satır — sonuçlar ölçüldükten sonra güncelle

> İstanbul trafik indeksini günlük doğrulayan veri hattı ve tarihsel çıkış-saati önerisi bulunan Kuryeplan web uygulamasını geliştirdim; NGINX container'ını root olmayan kullanıcı ve salt okunur runtime ile sertleştirip Trivy kritik zafiyet kapısını CI'a ekledim.

Bulut yayınını, sonuç puanlarını veya kullanıcı testi sayılarını ancak gerçek kanıt oluştuğunda ekle.
