# Kuryeplan — güncel başlangıç rehberi

Kuryeplan, Kullanıcı Arayüzü Tasarımı (BVA 2245) ve Bulut Bilişim ve Siber Güvenlik ödevleri için ortak üründür. Ürün Vercel'de yayımlandı. İBB trafik veri hattı, planlama panosu ve test dosyaları bu sürümde eklendi; ilk gerçek veri çekimi ve son arayüz değişiklikleri sonrası doğrulama hâlâ yapılmalıdır.

## 0. Başlangıç kanıtlarını kaydetmeden güncellemeyi uygulama

Önce `Kuryeplan_Baseline_Taramalari_Once.zip` paketindeki iki workflow dosyasını mevcut klasöre ekleyip commit/push et. GitHub Actions'ta ZAP workflow'unu `before`, Trivy baseline workflow'unu elle çalıştır; Artifact dosyalarını indirip sakla. Bundan sonra `Kuryeplan_Kalan_Odev_Paketi.zip` içeriğini mevcut proje klasörünün üzerine çıkarıp yeni kodu commit/push edebilirsin. Bu sırayı uygularsan `before` raporları yeni sürümden önceki canlı siteyi ve yalnızca tarama amacıyla ayrılmış eski test imajını temsil eder. `.git` klasörünü silme.

## 1. Yerelde aç

Anaconda Prompt veya CMD ile proje köküne girip, sistemde mevcut Python'u kullan:

```bat
C:\Anaconda3\envs\rayli-agi\python.exe -m http.server 8081 --bind 127.0.0.1
```

`http://127.0.0.1:8081` adresini aç. Harita için internet gerekir. Trafik paneli, `data/traffic.json` ilk kez gerçek verilerle doldurulana kadar boş durum gösterebilir; bu beklenen ve sahte sayı göstermeyen davranıştır.

## 2. Testler

```bat
C:\Anaconda3\envs\rayli-agi\python.exe -m unittest discover -s tests -v
```

Veri hattını elle çalıştırmak için internete bağlıyken:

```bat
C:\Anaconda3\envs\rayli-agi\python.exe scripts\fetch_ibb_traffic.py
```

Başarısız kaynak yanıtı son başarılı `data/traffic.json` dosyasını değiştirmemelidir.

## 3. İlk canlı veri çekimi

GitHub'a gönderdikten sonra **Actions → “İBB trafik verisini güncelle” → Run workflow** seç. Tamamlanırsa action `data/traffic.json` dosyasını commit eder. Başarısız olursa log'u incele; veriyi elle uydurarak doldurma. JSON boşsa dashboard'un “veri henüz hazır değil” mesajı göstermesi normaldir.

## 4. Web yayını

Vercel mevcut depoya bağlıdır. Kaynak koda commit/push yaptıktan sonra Vercel deployment durumunu kontrol et. Vercel build komutu gerektiren bir framework kullanılmıyor; statik HTML/CSS/JS ve `data/traffic.json` yayımlanır.

## 5. Güvenlik ve kanıt

- `.github/workflows/security.yml`: Gitleaks + Docker non-root/read-only + Trivy critical gate.
- `.github/workflows/trivy-baseline.yml`: BEFORE imaj taraması; yalnızca rapor üretir ve baseline imajını yayımlamaz.
- `.github/workflows/zap-baseline.yml`: sadece kendi Vercel sitene pasif ZAP baseline taraması; önce `before`, düzeltmeler/yeni sürüm sonrası `after`.
- `docs/container-proof.md`, `docs/trivy-before-after.md`, `docs/security-checklist.md` gerçek test komutlarını ve kanıtları anlatır.

Bulut sağlayıcısı/yayını, bütçe ve izleme alarmı kullanıcı isteğiyle şimdilik ertelenmiştir. Bunları tamamlandı gibi raporlama; kişisel karttaki Azure Container Apps/Google Cloud Run şartı için öğretim elemanıyla alternatif onayını netleştir.

## 6. Durum

Kod taslakları ve otomatik testler hazırdır. İlk gerçek İBB çekimi, live UI smoke test, ZAP before/after, Trivy baseline JSON, Lighthouse screenshot'ı, kullanıcı testi, 60–90 sn video, portföy yayını ve cloud/budget/log evidence hâlâ gerekli. Bu belgelerdeki kutuları ancak gerçek sonuç alındıktan sonra işaretle.
