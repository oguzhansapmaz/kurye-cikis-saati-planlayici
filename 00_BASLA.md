# Kuryeplan — tek paket başlangıç rehberi

Bu klasör, UI Design ve Cloud Security ödevlerinin ortak proje kaynağıdır. İstanbul haritası Leaflet/OpenStreetMap ile çalışır; canlı trafik karoları Vercel sunucu fonksiyonu üzerinden TomTom'dan alınır. Tarihsel İBB indeks paneli ayrı veri hattıdır ve gerçek veriler gelmeden boş durum göstermesi doğrudur.

## 1. Mevcut depo üzerine uygula

ZIP'in içindeki dosyaları mevcut proje klasörüne çıkar ve sorulursa dosyaların üzerine yaz. **Mevcut ` .git` klasörünü silme** (başındaki boşluk olmadan adı `.git` olmalı); ZIP'in içinde `.git` bulunmaz.

Proje dizini örneği:
`C:\Users\Oguzhan Sapmaz\Desktop\kurye-cikis-saati-planlayici`

## 2. TomTom anahtarı

Vercel Project Settings → Environment Variables bölümünde değişken adı tam olarak `TOMTOM_API_KEY` olmalı ve Production için kaydedilmelidir. Anahtarın kendisini HTML/JavaScript dosyalarına, GitHub'a veya ekran görüntülerine koyma. TomTom panelinde Traffic Raster Flow Tiles ürün erişiminin açık olduğundan emin ol. Sunucu tarafında çalışan bu proxy için alan adı kısıtlaması istekleri engellerse anahtarın ürün kısıtını ve TomTom'un key yönetimi kurallarını kontrol et; kullanımı/quotayı izle.

## 3. Testler

Anaconda Prompt'ta proje köküne geç ve çalıştır:

```bat
python -m unittest discover -s tests -v
node --check app.js
node --check map.js
node --check traffic-dashboard.js
node --check api\traffic-tile.js
```

Python testleri `OK` ile bitmeli; `node --check` komutları hata vermemelidir.

## 4. GitHub'a gönder

```bat
git status --short
git add -A
git commit -m "Finalize Istanbul traffic map and coursework evidence"
git push
```

`nothing to commit` derse zaten commit edilmiş olabilir; `git log -1 --oneline` ile commit'i kontrol et. Push sonrası GitHub Actions'ta yeni `Security gate and Cloud Run release` çalışmasını ve Vercel deployment'ını kontrol et.

## 5. Canlı trafik katmanını doğrula

Yayın sonrası `https://kurye-cikis-saati-planlayici.vercel.app/api/traffic-tile?health=1` adresini aç. `configured: true` anahtarın Vercel ortamında bulunduğunu gösterir; bu **TomTom trafik karolarının başarılı döndüğünü tek başına kanıtlamaz**. Site haritasındaki durum yazısında `Canlı TomTom trafik katmanı açık` görülmeli. Hata durumunda Vercel Functions log'undan HTTP 502/403 sebebini ve TomTom ürün/anahtar erişimini kontrol et.

## 6. Tarihsel İBB verisi ve ödev kanıtları

GitHub Actions → `İBB trafik verisini güncelle` workflow'unu çalıştır. `data/traffic.json` içinde `observations` boşsa tarihsel analiz henüz gerçek verilerle dolmamıştır; sayı uydurma. Kullanıcı testi, Lighthouse, demo videosu, ZAP/Trivy karşılaştırması ve bulut yayını ancak gerçek kanıt üretildiğinde tamamlandı diye işaretlenmelidir. Bulut yayını şu an ertelenmiştir ve yönergede zorunluysa öğretim elemanıyla netleştirilmelidir.
