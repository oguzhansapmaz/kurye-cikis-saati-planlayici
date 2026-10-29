# İBB trafik verisi — lisans ve atıf kontrolü

**Durum: İnsan tarafından doğrulanmalı.** Bu belge lisans izni verdiğini iddia etmez.

## Kaynaklar

- İBB Açık Veri Portalı veri sayfası: https://data.ibb.gov.tr/dataset/trafik-indeks-degeri-web-servisi
- Portal lisans/atıf sayfası: https://data.ibb.gov.tr/license
- Tarihsel JSON uç noktası: https://api.ibb.gov.tr/tkmservices/api/TrafficData/v1/TrafficIndexHistory/28/H
- Kısa aralık JSON uç noktası: https://api.ibb.gov.tr/tkmservices/api/TrafficData/v1/TrafficIndexHistory/1/5M

## Teslim öncesi yapılacak doğrulama

- [ ] Veri seti sayfasındaki güncel lisans metnini açıp sürüm/tarihle birlikte kaydet.
- [ ] Ticari olmayan ders projesinde yeniden yayınlama ve API'den çekilmiş özet değerleri yayımlama koşullarının uygun olduğunu doğrula.
- [ ] Gerekli kaynak atfının tam ifadesini kaydet ve README ile uygulamadaki kaynak linki/atıf metnini ona göre düzelt.
- [ ] Uç nokta kullanım şartı, rate limit ve cache/yenileme önerilerini kontrol et.
- [ ] Ekran görüntüsünü `docs/evidence/` altında sakla; kişisel hesap bilgilerini ekleme.

## Metodoloji notu

Kod yalnızca İstanbul şehir geneli trafik indeksini işler. İlçe veya yol kesimi seviyesinde veri olmadığından bu ürün gerçek rota seyahat süresi, navigasyon veya geleceğe dönük trafik tahmini iddiasında bulunmamalıdır.
