# Kuryeplan — Tasarım kararları (tek sayfa özeti)

## Kullanıcı ve cihaz
Bir İstanbul kurye firmasının operasyon sorumlusu, teslimat saatlerini araç içi yatay tablet ekranında hızlıca planlar. Bu nedenle en geç çıkış saati ve ölçümler büyük rakamlarla gösterilir; ana eylemler geniş dokunma alanlarına sahiptir. Dar ekranlarda paneller tek sütuna iner ve tablo yatay kaydırılabilir.

## Renk ve tipografi
Beyaz zemin ve koyu mürekkep rengi uzun süreli okunabilirlik için seçilmiştir. Mavi/mor vurgular etkileşimli kontroller ve planlama adımlarını, yeşil yalnızca olumlu durumları, amber veri eskiliğini, kırmızı daha yüksek indeks/uyarı durumlarını belirtir. Renk tek başına anlam taşımaz: durumlar metinle, indeksler sayısal değerle, grafikler başlık ve açıklamalarla desteklenir. Sistem yazı tipleri kullanılır; harici font isteği gerekmez.

## Grafik seçimi
- Zaman serisi çizgisi trafik indeksinin zaman içindeki seyrini gösterir.
- Haftanın günü × saat ısı haritası tekrarlayan haftalık örüntüleri taramayı sağlar.
- Sıralanabilir tablo, grafikteki gözlemleri kesin değerlerle incelemek için alternatif sunar.
- Üç KPI; son gözlenen indeks, ölçüm zamanı ve aynı gün/saat geçmiş ortalamasından farkı özetler.

## Veri ve dürüstlük
Kaynak, İBB Açık Veri Portalındaki İstanbul Trafik İndeks Değeri Web Servisidir. Kaynak şehir geneli indeks sağlar; ilçe çiftlerine özel ölçüm veya gerçek rota seyahat süresi sağlamaz. İlçe seçimi operasyon senaryosunu tanımlar, tarihsel saat önerisi ise yalnızca şehir geneli geçmiş endekse dayanır. Site bu sınırlılığı arayüzde açıkça belirtir; veri akışı gelmeden örnek/sahte indeks gösterilmez.

## Dayanıklılık ve erişilebilirlik
Yükleniyor, boş veri ve hata durumları ayrıdır. Veriye erişilemezse son başarılı JSON dosyası ve varsa tarayıcı önbelleği kullanılır, güncellik bilgisi görünür. Grafiklerin yanında otomatik özet ve tabloya erişim vardır; kontroller klavyeyle kullanılabilir ve odak görünürdür.
