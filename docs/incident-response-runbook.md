# Olay müdahale kılavuzu — API anahtarı veya secret sızıntısı

Bu ürünün başlangıç sürümü API anahtarı kullanmaz. Yine de depo, CI veya bulut ayarlarında bir token/credential sızıntısı fark edilirse aşağıdaki adımları uygula.

## 1. Tespit ve sınırlama
1. GitHub secret scanning/Gitleaks uyarısının zamanını, depo/commit/iş akışı kimliğini not et. Token değerini rapora veya sohbete kopyalama.
2. Anahtarın türünü belirle (cloud access key, registry token, GitHub PAT, webhook, vb.) yalnızca sağlayıcının güvenli arayüzünden.
3. Etkilenen anahtarı derhal sağlayıcı konsolundan iptal et/disable et. Commit'i silmek tek başına yeterli değildir.
4. Şüpheli deploy/pipeline çalıştırmalarını durdur ve gerekirse ilgili credential'a bağlı erişimi geçici olarak kaldır.

## 2. Yenileme
1. Yeni bir anahtar gerekiyorsa yeni credential üret ve en az yetki ile sınırla; mümkünse uzun ömürlü anahtar yerine OIDC/federated identity kullan.
2. Yeni değeri sadece GitHub Actions Secrets veya bulut secret manager'a koy. Frontend dosyasına, `.env` örneğine, issue'ya veya log'a yazma.
3. Workflow ve deploy'u yeni credential ile doğrula. Eski anahtarın artık çalışmadığını güvenli biçimde teyit et.

## 3. İnceleme
1. Olay başlangıç/bitiş saatlerini ve etkilenen kaynakları not et.
2. Git history, GitHub Actions logları, cloud audit logs ve deploy geçmişini yetkili erişimle kontrol et.
3. İzinsiz erişim, beklenmeyen kaynak yaratımı veya ücret varsa sağlayıcı olay müdahale prosedürünü izle ve gerekli bildirimleri yap.
4. Kanıtları hassas değerleri maskeleyerek erişimi kısıtlı depoda sakla.

## 4. İyileştirme ve kapanış
1. Gerekirse Git history'yi temizle; bu iptalin yerine geçmez.
2. Gitleaks/secret scanning ve dependency/image taramalarını yeniden çalıştır; düzeltme sonrası temiz sonucu kaydet.
3. Olayın kök nedenini, yapılan işlemi ve kalan riski raporla.
4. Bu bir ders projesi içinse öğretim elemanına yalnızca talep edilen ve hassas veri içermeyen kanıtı gönder.

**Önemli:** Gerçek bir secret'ı mesajla paylaşma. Sızıntı şüphesinde ilk işlem revoke/rotate olmalıdır.
