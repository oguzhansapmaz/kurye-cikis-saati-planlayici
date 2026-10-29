# Teslim durumu — gerçek kanıtla güncellenecek

## Şu ana kadar gözlenen
- Kuryeplan statik sitesi Vercel'de yayında: https://kurye-cikis-saati-planlayici.vercel.app/
- Kaynak kod deposu: https://github.com/oguzhansapmaz/kurye-cikis-saati-planlayici
- Kullanıcı tarafından paylaşılan GitHub Actions ekranında Secret scan ve Docker non-root/read-only/Trivy gate adımları başarılı görünüyordu (Brotli düzeltmesinden sonraki çalıştırma). Sonraki kod değişiklikleri yeni çalışma gerektirir.
- Container için `USER 101:101`, read-only smoke test, no-new-privileges ve `cap-drop ALL` yapılandırması depoda tanımlı.

## Bu paketle eklenenler — ilk veri çalıştırması gerektirir
- İBB tarihsel trafik indeksini normalleştiren Python çekim betiği.
- Günlük GitHub Actions çekimi ve 5 dakikalık uç nokta erişilemezse işaretli tarihsel saatlik fallback.
- Zaman serisi grafiği, hafta günü × saat ısı haritası, aynı gün/saat tarihsel karşılaştırması, tarihsel çıkış saati önerisi ve sıralanabilir tablo.
- Veri hattı için birim testleri, UI kontrat testleri ve kullanıcı testi/demo/portföy şablonları.

## Henüz yapılmamış veya kanıt bekleyen
- İlk canlı İBB veri çekimi: GitHub Actions `İBB trafik verisini güncelle` sonucundan doğrula. Veri dosyası dolmadan gerçek indeks gösterilmiş sayılmaz.
- OWASP ZAP baseline taraması: yalnızca bu depoya ait Vercel sitesi üzerinde `before` ve değişiklik sonrası `after` çalıştır; iki raporu karşılaştır.
- Trivy baseline (`Dockerfile.baseline`) öncesi kritik bulgu sayısı ile hardened image sonrası kritik sayısı: gerçek JSON artefaktlarından raporla.
- Kullanıcı testi: en az 2 uygun katılımcı ve 3 görev; sonuçları `docs/user-test-template.csv` içine gerçek zaman/süreyle yaz.
- 60–90 saniyelik gerçek demo videosu ve portföy vaka sayfasının yayımlanması.
- Lighthouse mobil ekran görüntüsü ve erişilebilirlik/performance değerleri.
- GitHub branch protection / doğrudan push kapatma ekran görüntüsü ve Dependabot/secret scanning ayar doğrulaması.
- Azure/Google Cloud hesabı ve gerçek bulut yayını, bütçe alarmı, servis logları ve alarm kuralı kullanıcı isteğiyle şimdilik ertelenmiştir. Kişisel kartta belirtilen Azure Container Apps / Google Cloud Run şartının alternatif platformla değiştirilmesi için öğretim elemanının onayı gerekebilir.
- İBB veri lisansının tam metni portal üzerinden tekrar doğrulanmalıdır.

**Kurallar:** Kırmızı/yeşil sonuç yalnızca kendi gerçek CI çalıştırmasının durumudur. Canlı çalıştırma, kullanıcı testi, tarama veya bulut kaynağı yapılmadan başarı varmış gibi yazılmamalıdır.

- Kullanıcı arayüzü gereksinimleri: İBB veri hattı, 3 KPI, zaman serisi, gün × saat ısı haritası, tarihsel çıkış saati önerisi, boş/hata/yüklenme durumları ve sıralanabilir tablolar bu pakete eklendi; ilk gerçek veri çekimi sonrası tarayıcıda tekrar doğrulanmalı.
- Otomatik yerel testler: `python -m unittest discover -s tests -v` ile 13 test ve `node --check` ile 3 JS dosyası sözdizimi kontrol edildi. Bu testler gerçek İBB API çağrısı, Docker image build, Lighthouse veya kullanıcı testi yerine geçmez.

- İBB API erişimi GitHub runner üzerinden zaman aşımına uğrarsa veri hattı mevcut doğrulanmış JSON dosyasını korur; henüz veri yoksa boş şemayı yayınlar. Arayüz ek olarak resmî İBB API'sini tarayıcıdan kısa zaman aşımıyla denemektedir. Bu yolların gerçek trafik verisi ürettiği, API erişilebilir olduğu doğrulanmadan iddia edilmemelidir.
