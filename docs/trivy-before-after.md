# Trivy önce/sonra karşılaştırması

**Bu belge bir prosedürdür; tarama sonuçları henüz oluşturulmamıştır.** Kritik zafiyet adetlerini sadece gerçek JSON çıktılarından kaydet.

> `Dockerfile.baseline`, yalnızca yerel “önce” taraması için bilerek eski/root çalışan bir örnek imaj oluşturur. Bu imajı dağıtma veya internetten erişilebilir hâle getirme. Yalnızca image metadata taraması yap.

## 1. Tercih edilen yol — GitHub Actions

GitHub deposuna bu workflow eklendikten sonra `Actions → Trivy BEFORE baseline → Run workflow` çalıştır. `trivy-before-<run_id>` artifact içinden `trivy-before.json` dosyasını indir. Sonra `Actions → Security gate and Cloud Run release` workflow’unun son başarılı koşusundaki `scanned-release-<sha>` artifact içinden `trivy-after.json` dosyasını indir. Scan zamanı, image/base sürümü ve tam `CRITICAL` sayısını rapora yaz. Baseline imajı hiçbir zaman yayımlanmaz.

## 2. Yerel alternatif

Trivy bilgisayarında kurulu olmalı. Sürümünü kaydet:

```bash
trivy --version
```

## 3. Önce — zayıf baseline image (sadece tarama)

```bash
docker build --pull -f Dockerfile.baseline -t kurye-planlayici:baseline .
trivy image --scanners vuln --severity CRITICAL --ignore-unfixed --format json -o trivy-before.json kurye-planlayici:baseline
python scripts/compare_trivy.py trivy-before.json
```

## 4. Sonra — hardened image

```bash
docker build --pull -t kurye-planlayici:hardened .
trivy image --scanners vuln --severity CRITICAL --ignore-unfixed --format json -o trivy-after.json kurye-planlayici:hardened
python scripts/compare_trivy.py trivy-after.json
```

## 5. Raporlama

JSON dosyalarında bulunan gerçek `CRITICAL` bulgu sayılarını raporla. Baseline taraması eski imaj, ağ erişimi veya Trivy veritabanı kaynaklı olarak tamamlanmazsa bunu olduğu gibi belirt; sıfır veya daha düşük bir sayı uydurma. Trivy taramasındaki zafiyet sayısı ile “root değil” güvenlik kontrolü ayrı kanıtlardır.

CI'da `.github/workflows/security.yml` Trivy'nin kritik bulguda başarısız çıkış kodu vermesini ister; gerçek koşu sonucu GitHub Actions ekranından alınmalıdır.
