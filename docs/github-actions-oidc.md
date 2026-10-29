# GitHub Actions → Google Cloud OIDC (uzun ömürlü anahtar yok)

Bu bölüm gerekli bir kereye mahsus Google Cloud ayarlarını ve GitHub repo secrets/variables değerlerini tarif eder. Google Cloud projesi kurulmadan ve izinler verilmeden otomatik deploy çalışmaz. **Service account JSON key oluşturup depoya koyma.**

## GitHub repo variables

Settings → Secrets and variables → Actions → Variables:

- `GCP_PROJECT_ID`: Google Cloud project ID
- `GCP_REGION`: `europe-west1` (veya hesabında desteklenen bölge)
- `AR_REPOSITORY`: Artifact Registry Docker repository adı; ör. `kurye-images`

## GitHub repo secrets

Settings → Secrets and variables → Actions → Secrets:

- `GCP_WORKLOAD_IDENTITY_PROVIDER`: Google Cloud Workload Identity Provider tam resource name
- `GCP_SERVICE_ACCOUNT`: CI/deploy service account e-posta adresi

## Google Cloud tarafı

1. Cloud Run API ve Artifact Registry API'yi etkinleştir; `kurye-images` Docker repository oluştur.
2. GitHub Actions için bir Workload Identity Pool ve GitHub OIDC provider oluştur. Provider attribute condition'ı kendi GitHub kullanıcı/depo ve `refs/heads/main` ile sınırla; tüm depolara güvenme.
3. Deploy service account'a yalnızca gerekli yetkileri ver: Artifact Registry'ye yazma, Cloud Run servis dağıtma/güncelleme ve yalnızca runtime service account üzerinde `iam.serviceAccountUser`. Proje düzeyinde Owner/Editor verme.
4. Runtime service account `kurye-planner-runtime@PROJECT_ID.iam.gserviceaccount.com` Terraform ile oluşturulur ve uygulama API rolleri verilmez.
5. Provider resource name ve service account e-postasını yukarıdaki GitHub secrets'a gir.
6. Workflow `main` dalına push edildiğinde: Gitleaks → build → non-root/read-only smoke test → Trivy CRITICAL kapısı → Artifact Registry push → Cloud Run deploy sırası çalışır. Trivy aşaması başarısız olursa push ve deploy adımları çalışmaz.

İzin/claim yapılandırması proje ve repo bilgisine göre değiştiği için provider'ın doğru resource name'ini Cloud Console'dan kopyala. Bu belgede herhangi bir gerçek provider veya servis account oluşturulmuş değildir.
