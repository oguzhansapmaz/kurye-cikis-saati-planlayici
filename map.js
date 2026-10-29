(function () {
  'use strict';

  const mapElement = document.getElementById('istanbul-map-canvas');
  if (!mapElement) return;

  const statusElement = document.getElementById('map-layer-status');
  const statusText = document.getElementById('map-layer-status-text');
  const legend = document.getElementById('map-traffic-legend');
  const loadNote = document.getElementById('map-load-note');
  const title = document.getElementById('map-focus-title');
  const description = document.getElementById('map-focus-description');
  const buttons = Array.from(document.querySelectorAll('[data-map-focus]'));

  const presets = {
    istanbul: { title: 'İstanbul geneli', description: 'İstanbul genelinde haritayı incele. TomTom katmanı erişilebiliyorsa yollar bağıl trafik hızına göre renklenir.', center: [41.0082, 28.9784], zoom: 10, mapUrl: 'https://www.openstreetmap.org/#map=10/41.0082/28.9784' },
    kadikoy: { title: 'Kadıköy', description: 'Anadolu yakasındaki Kadıköy çevresine yakınlaş. Renkler canlı trafik katmanı etkin olduğunda görünür.', center: [40.9906, 29.0277], zoom: 13, mapUrl: 'https://www.openstreetmap.org/#map=13/40.9906/29.0277' },
    besiktas: { title: 'Beşiktaş', description: 'Boğaz kıyısı ve merkezî Beşiktaş bölgesini incele; yoğunluk renkleri TomTom trafik akışı katmanından gelir.', center: [41.0430, 29.0060], zoom: 14, mapUrl: 'https://www.openstreetmap.org/#map=14/41.0430/29.0060' },
    sisli: { title: 'Şişli', description: 'Merkez iş ve teslimat alanlarına yakınlaş. Katman canlı yol hızına göre renklendirme yapar; gelecekteki süreyi tahmin etmez.', center: [41.0602, 28.9877], zoom: 14, mapUrl: 'https://www.openstreetmap.org/#map=14/41.0602/28.9877' },
    uskudar: { title: 'Üsküdar', description: 'Anadolu yakasındaki Üsküdar bölgesini incele. Harita kişisel konum veya kurye GPS takibi yapmaz.', center: [41.0255, 29.0154], zoom: 14, mapUrl: 'https://www.openstreetmap.org/#map=14/41.0255/29.0154' },
    bakirkoy: { title: 'Bakırköy', description: 'Bakırköy ve çevresine yakınlaş. Renkli yollar canlı trafik görüntüsüdür; teslimat süresi planlama formundan ayrıca girilir.', center: [40.9780, 28.8720], zoom: 14, mapUrl: 'https://www.openstreetmap.org/#map=14/40.9780/28.8720' }
  };

  function setStatus(state, message, showLegend) {
    if (statusElement) statusElement.dataset.state = state;
    if (statusText) statusText.textContent = message;
    if (legend) legend.hidden = !showLegend;
  }

  if (!window.L || typeof window.L.map !== 'function') {
    setStatus('unavailable', 'Harita kütüphanesi yüklenemedi. İnternet bağlantını kontrol et.', false);
    if (loadNote) loadNote.hidden = false;
    return;
  }

  const map = window.L.map(mapElement, { center: [41.0082, 28.9784], zoom: 10, minZoom: 5, maxZoom: 18, zoomControl: true, scrollWheelZoom: true, preferCanvas: true });
  const baseLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
    crossOrigin: true
  }).addTo(map);

  baseLayer.on('tileerror', function () { if (loadNote) loadNote.hidden = false; });

  function focus(key) {
    const item = presets[key];
    if (!item) return;
    buttons.forEach(function (button) {
      const active = button.dataset.mapFocus === key;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    if (title) title.textContent = item.title;
    if (description) description.textContent = item.description;
    map.flyTo(item.center, item.zoom, { duration: 0.45 });
    if (loadNote) {
      const link = loadNote.querySelector('a');
      if (link) link.href = item.mapUrl;
    }
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () { focus(button.dataset.mapFocus); });
    button.setAttribute('aria-pressed', button.classList.contains('active') ? 'true' : 'false');
  });

  async function configureTrafficLayer() {
    setStatus('checking', 'Canlı trafik katmanı kontrol ediliyor…', false);
    try {
      const response = await fetch('/api/traffic-tile?health=1', { method: 'GET', cache: 'no-store', credentials: 'same-origin', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Sunucu trafik katmanını etkin olarak bildirmedi.');
      const health = await response.json();
      if (!health || health.configured !== true) throw new Error('TomTom anahtarı yapılandırılmamış.');

      const trafficLayer = window.L.tileLayer('/api/traffic-tile?z={z}&x={x}&y={y}', {
        tileSize: 256, minZoom: 5, maxZoom: 18, maxNativeZoom: 18, opacity: 0.82, updateWhenIdle: true, keepBuffer: 2,
        attribution: '&copy; <a href="https://www.tomtom.com/" target="_blank" rel="noopener noreferrer">TomTom Traffic</a>'
      });

      let firstTileError = true;
      trafficLayer.on('tileerror', function () {
        if (!firstTileError) return;
        firstTileError = false;
        setStatus('unavailable', 'TomTom katmanı açılamadı. API anahtarının geçerliliğini ve Traffic Flow Tiles yetkisini kontrol et.', false);
      });
      trafficLayer.on('load', function () {
        firstTileError = true;
        setStatus('live', 'Canlı TomTom trafik katmanı açık. Renkler bağıl yol hızını gösterir.', true);
      });
      trafficLayer.addTo(map);
      window.L.control.layers({ 'OpenStreetMap': baseLayer }, { 'Canlı trafik (TomTom)': trafficLayer }, { collapsed: true }).addTo(map);
      setStatus('checking', 'TomTom trafik katmanı bağlandı; yol karoları yükleniyor…', true);
    } catch (_) {
      setStatus('unavailable', 'Canlı trafik şu anda etkin değil. Vercel ortam değişkeni TOMTOM_API_KEY ve TomTom trafik ürün erişimi kontrol edilmeli. Temel harita kullanılabilir.', false);
    }
  }

  configureTrafficLayer();
  window.setTimeout(function () { map.invalidateSize(); }, 100);
})();
