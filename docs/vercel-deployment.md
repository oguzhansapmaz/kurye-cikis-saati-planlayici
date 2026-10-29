# Vercel'e statik site yayını

1. GitHub'da boş bir public repository aç.
2. Bu klasördeki tüm proje dosyalarını repository köküne gönder (`index.html`, `styles.css`, `app.js`, `vercel.json`, `.well-known/`, Dockerfile ve güvenlik belgeleri dahil).
3. Vercel panelinde **Add New → Project → Import Git Repository** seç ve bu depoyu bağla.
4. Framework otomatik bulunmazsa `Other` seç. Paket yükleme/build gerekmiyor; output directory proje kökü (`.`) olmalı. Vercel'in projeye gösterdiği ayarların statik dosyaları işaret ettiğini kontrol et.
5. Deploy sonrası canlı URL'de:
   - Plan oluştur, tekrar hesapla, planı kaydet ve sil.
   - CSV indir.
   - Mobil ekranı test et.
   - `/.well-known/security.txt` sayfasını aç.
   - Developer Tools → Network üzerinden CSP ihlali olup olmadığına bak.
   - `curl -I https://YOUR-VERCEL-DOMAIN` ile başlıkları kontrol et.
6. Mozilla Observatory ve securityheaders.com ekran görüntülerini kendin al. Beklenen nota ulaştığını varsayma.

Vercel statik deployment bağlantısı, ders kartında istenen Docker tabanlı cloud container yayınına ek bir URL'dir; onun yerini almaz.
