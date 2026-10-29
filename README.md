# Kurye Çıkış Saati Planlayıcı

Kurye ve teslimat ekipleri için, teslim edilmesi gereken zamandan geriye doğru hesaplama yapan hafif bir web uygulaması. Hazırlık süresi, tahmini yolculuk süresi ve kullanıcı tarafından seçilen güven payıyla **hazırlık başlangıcını**, **en geç çıkış saatini** ve **tahmini varışı** hesaplar.

> **Sürüm notu:** Bu proje bu sprintte sıfırdan oluşturulan bir başlangıç ürünüdür. Canlı trafik veya rota hesaplama verisi kullanmaz; OpenStreetMap yalnızca bölgeyi görsel olarak keşfetmek için açılır, süreleri kullanıcı girer. Kayıtlar yalnızca tarayıcının `localStorage` alanında tutulur. Gerçek kurye/sipariş verisi veya hassas kişisel bilgi girmeyin.

## Özellikler

- Duyarlı Türkçe arayüz; masaüstü ve mobil kullanım.
- Teslimat zamanı, hazırlık, yolculuk ve güven payına göre anlık hesaplama.
- Zaman baskısı uyarıları, tarayıcıda plan kaydı ve CSV dışa aktarma.
- Planlayıcı için hesap, parola veya API anahtarı gerekmez; İzmir bölge görünümü OpenStreetMap gömülü haritasına bağlanır.
- Vercel için statik yayın yapılandırması ve güvenlik başlıkları.
- NGINX unprivileged taban imajı ile Docker paketleme; 8080 portu ve runtime UID/GID 101.
- Trivy kritik zafiyet kapısı, Gitleaks taraması, Dependabot yapılandırması.
- Cloud Run için Terraform altyapı tanımı, DFD/STRIDE ve olay müdahale belgeleri.

## Hesaplama mantığı

- `En geç çıkış = Son teslim zamanı − Tahmini yolculuk süresi − Güven payı`
- `Hazırlık başlangıcı = En geç çıkış − Hazırlık süresi`
- `Tahmini varış = En geç çıkış + Tahmini yolculuk süresi`

Bu, kullanıcı girdilerine dayalı bir planlama tahminidir; navigasyon, trafik tahmini ya da teslimat garantisi değildir.

## Yerelde çalıştırma

Bağımlılıksız statik uygulama: `index.html` dosyasını tarayıcıda açabilirsin. Daha gerçekçi yerel sunucu testi için Python yüklüyse proje kökünde:

```bash
python -m http.server 8081
```

Sonra `http://localhost:8081` adresini aç. Bu yöntem sadece UI fonksiyonlarını dener; production güvenlik başlıkları için Vercel/NGINX yapılandırmalarını da test et.

## Vercel'e yayınlama

1. Dosyaları GitHub'da yeni, herkese açık bir depoya gönder.
2. Vercel'de **Add New → Project** üzerinden bu depoyu içe aktar.
3. Framework preset otomatik çıkmazsa `Other` seç; Build Command ve Install Command gerekmez, Output Directory için proje kökünü (`.`) kullan.
4. Deploy sonrasında mobil/masaüstü formu, CSV indirme, yerel kayıt ve `/.well-known/security.txt` yolunu kontrol et.
5. `vercel.json` içindeki CSP/HSTS ve diğer başlıkları canlı adreste gözle; Observatory ve securityheaders sonuçlarını kaydet.

Ayrıntı: [`docs/vercel-deployment.md`](docs/vercel-deployment.md)

## Docker: derle, dene ve doğrula

Docker Desktop çalışırken proje kökünde:

```bash
docker build --pull -t kurye-planlayici:hardened .
docker image inspect kurye-planlayici:hardened --format '{{.Config.User}}'
docker run --rm --read-only --tmpfs /tmp:rw,noexec,nosuid,size=64m --security-opt no-new-privileges --cap-drop ALL -p 8080:8080 kurye-planlayici:hardened
```

İlk komut imajı oluşturur; ikinci komut `101:101` göstermelidir. Üçüncü komut salt-okunur ana dosya sistemiyle, geçici yazma alanı `/tmp` ile ve yetki düşürülerek çalıştırır. Tarayıcıda `http://localhost:8080` ve `http://localhost:8080/healthz` adreslerini kontrol et. `Ctrl+C` ile durdur.

Aynı yapı Compose ile:

```bash
docker compose -f compose.readonly.yml up --build
```

> `Dockerfile.baseline` yalnızca ödevdeki “önce” Trivy ölçümünü yerelde karşılaştırmak içindir; eski ve root çalışan imajdır. **Bu imajı yayınlama, servise açma veya gerçek veriyle kullanma.**

Detaylar: [`docs/container-proof.md`](docs/container-proof.md), [`docs/trivy-before-after.md`](docs/trivy-before-after.md)

## Güvenlik kontrolleri

`.github/workflows/security.yml` bir GitHub Actions güvenlik kapısı tanımlar:

- Gitleaks depo/secret taraması.
- Container build ve runtime kullanıcısının `101:101` olduğunun doğrulanması.
- Trivy image taraması; kritik zafiyet bulursa iş adımı başarısız olur.
- Tarama raporunun artifact olarak saklanması.

Workflow'un çalışması GitHub deposuna gönderim ve Actions etkinleştirmesi gerektirir. Bir workflow dosyasının mevcut olması, taramanın başarılı olduğunun kanıtı değildir. Gerçek eylem çalıştırma sonucu ve Trivy raporu teslim kanıtına eklenmelidir. Branch protection ayrıca GitHub depo ayarlarından açılmalıdır.

## Bulut yayını

Ödev kartı Docker ürünü için Google Cloud Run veya Azure Container Apps'i kabul ediyor. Vercel statik web sayfasını kolay yayımlamak için kullanılabilir, fakat tek başına Docker/rootless/readonly/Trivy/Cloud Run kısmının yerine geçmez. Cloud Run yayını için [`docs/cloud-run-deployment.md`](docs/cloud-run-deployment.md) ve `infra/terraform/` kullan.

Yayın yapıldığı, ücretin sıfır olduğu, taramaların geçtiği veya güvenlik derecesi alındığı; ilgili servisler gerçekten kurulup test edilmeden **iddia edilmemelidir**. Ücret doğmaması için bulut sağlayıcısında bütçe alarmı kur ve kaynakları iş bitince kapat/sil.

## Teslim raporu kanıtları

`docs/evidence/` içine kendi bilgisayarında veya kendi servisinde aldığın gerçek ekran görüntülerini ve raporları koy. Hassas logları, tokenları, proje kimliklerini ve hesap ayrıntılarını herkese açık depoya yükleme. Güvenlik raporu şablonu: [`docs/security-report-template.md`](docs/security-report-template.md).

## Yapay zekâ kullanım beyanı

Bu projede ChatGPT; başlangıç arayüzü ve dokümantasyon taslağı oluşturma, güvenlik yapılandırması taslağı hazırlama ve hata ayıklama yardımı için kullanılmıştır. Ürünün buluta gerçekten yayımlanması, test edilmesi ve ekran görüntüsü kanıtlarının alınması kullanıcı tarafından tamamlanıp doğrulanmalıdır.

## CV için cümle (yalnızca doğrulanan işleri kapsayan şekilde güncelle)

> Kurye çıkış planlama uygulamasını statik web arayüzü olarak oluşturdum; root olmayan NGINX container tasarımı, salt okunur runtime testi ve kritik zafiyette CI kapısı için güvenlik otomasyonu hazırladım.


## İzmir haritası ve güvenlik iletişimi

- Ana sayfada İzmir geneli, Konak, Karşıyaka, Bornova, Buca ve Urla için etkileşimli OpenStreetMap gömülü görünümü bulunur.
- Harita gerçek zamanlı trafik veya GPS tabanlı kurye konumu göstermez; yolculuk süresi kullanıcı tarafından tahmin edilir.
- Harita bölümü yüklendiğinde tarayıcı OpenStreetMap servisine bağlanır. Kullanıcıya ait kişisel veya hassas bilgiler harita servisine gönderilmemelidir.
- İnsan tarafından okunabilir güvenlik/iletişim sayfası `/security.html`; makine tarafından okunabilir bildirim bilgisi `/.well-known/security.txt` konumundadır.
