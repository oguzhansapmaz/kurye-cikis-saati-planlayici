# Container güvenlik doğrulama adımları

Bu adımlar kendi bilgisayarında Docker Desktop ile çalıştırılır. Gerçek komut çıktısı ve tarih/saat görünürken alınan ekran görüntülerini `docs/evidence/` altında tut. Komutlar çalıştırılmadan başarı iddiası yazılmamalıdır.

## A. Root olmayan runtime kullanıcısı

```bash
docker build --pull -t kurye-planlayici:hardened .
docker image inspect kurye-planlayici:hardened --format '{{.Config.User}}'
docker run --rm --entrypoint id kurye-planlayici:hardened
```

Beklenen kanıt: image inspect `101:101` kullanıcısını, `id` ise uid/gid 101 değerini gösterir.

## B. Salt okunur dosya sistemi

```bash
docker run --rm --read-only --tmpfs /tmp:rw,noexec,nosuid,size=64m --security-opt no-new-privileges --cap-drop ALL -p 8080:8080 kurye-planlayici:hardened
```

Başka bir terminalde:

```bash
curl -i http://localhost:8080/healthz
curl -I http://localhost:8080/
curl -i http://localhost:8080/.well-known/security.txt
```

Beklenen kanıt: `/healthz` `200` döner, tarayıcı sayfayı açar, security header'lar yanıtta görünür. Bu komutun gerçekten başarıyla çalışması şarttır; hata alınırsa çıktıyı kaydet ve raporda sorunu/çözümü açıkça yaz.

## C. Fonksiyonel UI kontrol listesi

- [ ] Telefon genişliğinde form alanları taşmıyor.
- [ ] Son teslim zamanı geçmiş seçilirse form hata veriyor.
- [ ] Hazırlık + yolculuk + güven payı toplamı doğru hesaplanıyor.
- [ ] Plan kaydediliyor, sayfa yenilenince aynı tarayıcıda listede duruyor.
- [ ] Plan silme ve tüm planları temizleme çalışıyor.
- [ ] CSV indiriliyor; içeriği hesaplamayla tutarlı.
- [ ] “Canlı trafik verisi kullanılmaz” notu görünüyor.

## D. Güvenlik başlıkları

Vercel/Cloud Run canlı URL'sinde `curl -I https://YOUR-URL` çalıştır veya Mozilla Observatory ve securityheaders.com üzerinden kendi URL'ni denetle. Tarama sonuçlarının gerçek ekran görüntülerini sakla. Bir web sitesi puanı önceden tahmin edilmez.
