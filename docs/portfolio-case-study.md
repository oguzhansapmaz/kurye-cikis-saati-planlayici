# Portfolyo vaka çalışması taslağı — Kuryeplan

## Problem
Küçük bir İstanbul kurye firmasının operasyon sorumlusu, teslim zamanından geriye doğru hazırlık başlangıcını ve en geç çıkış saatini belirlemek, aynı zamanda tarihsel şehir trafik örüntülerini görebilmek ister.

## Çözüm
Kuryeplan, son teslim zamanından geriye doğru hazırlık, yolculuk ve güven payını hesaplar. İBB'nin şehir geneli tarihsel trafik indeksini çizgi grafiği ve hafta günü × saat ısı haritasıyla sunar; seçilen gün ve saat çevresindeki tarihsel düşük-indeks pencerelerini açıklanabilir biçimde karşılaştırır.

## Veri hattı
İBB açık veri servisi → günlük GitHub Actions çekimi → doğrulanmış `data/traffic.json` → Vercel statik site. Tarayıcıda API anahtarı kullanılmaz. Başarısız kaynak çekiminde önceki dosya korunur; güncellik bilgisi ekranda gösterilir.

## Güvenlik
NGINX unprivileged container, UID/GID 101, read-only runtime smoke test, no-new-privileges/capability drop ve kritik bulguda yayını durduran Trivy kapısı tasarlandı. Gerçek bulut yayını, bütçe alarmı ve izleme kaydı henüz doğrulanmadı; bu alanlar teslim öncesinde gerçek kanıtla güncellenmelidir.

## Sınırlılıklar
İBB uç noktası şehir geneli indeks yayımlar; ilçe veya yol segmenti için trafik ölçmez. Öneri navigasyon, gerçek rota süresi veya gelecek tahmini değildir. Açık lisansın tam metni teslimden önce portalda doğrulanmalıdır.

## Gerçek sonuçlar ve kanıtlar (doldurulacak)
- Vercel URL: https://kurye-cikis-saati-planlayici.vercel.app/
- GitHub: https://github.com/oguzhansapmaz/kurye-cikis-saati-planlayici
- Son veri güncellemesi / gözlem sayısı: [Actions sonrası gerçek değer]
- Kullanıcı testi: [2 katılımcı, 3 görev ve ölçümler]
- Lighthouse mobil: [gerçek rapor]
- ZAP önce/sonra: [gerçek artefaktlar]
- Docker/Trivy: [gerçek workflow/JSON artefaktı]
- Demo videosu (60–90 sn): [gerçek bağlantı]


## Yayınlamadan önce tamamlanacak kanıtlar

- [ ] Gerçek İBB verisi ve güncelleme zaman damgası görünen ekran görüntüsü
- [ ] En az iki gerçek katılımcıyla kullanıcı testi ve sonuç özeti
- [ ] 60–90 saniyelik ürün demo videosu
- [ ] Lighthouse mobil ölçümleri
- [ ] Cloud deployment ve güvenlik kanıtları; bulut şimdilik ertelendiği için bunu tamamlandı yazma
