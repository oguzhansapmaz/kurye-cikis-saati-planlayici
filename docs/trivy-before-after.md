# Trivy önce/sonra karşılaştırması

**Bu belge bir prosedürdür; tarama sonuçları henüz oluşturulmamıştır.** Kritik zafiyet adetlerini sadece gerçek JSON çıktılarından kaydet.

> `Dockerfile.baseline`, yalnızca yerel “önce” taraması için bilerek eski/root çalışan bir örnek imaj oluşturur. Bu imajı dağıtma veya internetten erişilebilir hâle getirme. Yalnızca image metadata taraması yap.

## 1. Araç

Trivy bilgisayarında kurulu olmalı. Sürümünü kaydet:

```bash
trivy --version
```

## 2. Önce — zayıf baseline image (sadece tarama)

```bash
docker build --pull -f Dockerfile.baseline -t kurye-planlayici:baseline .
trivy image --scanners vuln --severity CRITICAL --ignore-unfixed --format json -o trivy-before.json kurye-planlayici:baseline
python scripts/compare_trivy.py trivy-before.json
```

## 3. Sonra — hardened image

```bash
docker build --pull -t kurye-planlayici:hardened .
trivy image --scanners vuln --severity CRITICAL --ignore-unfixed --format json -o trivy-after.json kurye-planlayici:hardened
python scripts/compare_trivy.py trivy-after.json
```

## 4. Raporlama

JSON dosyalarında bulunan gerçek `CRITICAL` bulgu sayılarını raporla. Baseline taraması eski imaj, ağ erişimi veya Trivy veritabanı kaynaklı olarak tamamlanmazsa bunu olduğu gibi belirt; sıfır veya daha düşük bir sayı uydurma. Trivy taramasındaki zafiyet sayısı ile “root değil” güvenlik kontrolü ayrı kanıtlardır.

CI'da `.github/workflows/security.yml` Trivy'nin kritik bulguda başarısız çıkış kodu vermesini ister; gerçek koşu sonucu GitHub Actions ekranından alınmalıdır.
