(function () {
  'use strict';
  const frame = document.getElementById('izmir-map-frame');
  if (!frame) return;
  const presets = {
    izmir: { title: 'İzmir geneli', description: 'İzmir merkez ve çevresini incele. Bölgeler arasında geçiş yaparak planına uygun alanı keşfet.', bbox: '26.88%2C38.22%2C27.38%2C38.58', zoomLink: '11/38.4237/27.1428' },
    konak: { title: 'Konak', description: 'Konak ve çevresine yakınlaş. Merkez teslimat senaryolarını planlarken bölgenin sokak dokusunu inceleyebilirsin.', bbox: '27.08%2C38.39%2C27.17%2C38.47', zoomLink: '14/38.4189/27.1287' },
    karsiyaka: { title: 'Karşıyaka', description: 'Karşıyaka kıyı şeridi ve çevresine odaklan. Bu görünüm yalnızca coğrafi referanstır; trafik bilgisi sağlamaz.', bbox: '27.05%2C38.44%2C27.17%2C38.51', zoomLink: '13/38.4595/27.1110' },
    bornova: { title: 'Bornova', description: 'Bornova ve doğu İzmir yönünü incele. Yolculuk süresini güncel rota ve trafik bilgisi varsa ayrıca doğrulamalısın.', bbox: '27.16%2C38.43%2C27.28%2C38.49', zoomLink: '13/38.4622/27.2178' },
    buca: { title: 'Buca', description: 'Buca çevresine yakınlaş. Bölgeyi görsel olarak değerlendirebilir, süre tahminini planlama formuna girebilirsin.', bbox: '27.13%2C38.34%2C27.23%2C38.40', zoomLink: '13/38.3741/27.1735' },
    urla: { title: 'Urla', description: 'İzmir merkezinin batısındaki Urla bölgesine odaklan. Bu harita kurye hareketini veya canlı yol durumunu izlemez.', bbox: '26.65%2C38.28%2C26.87%2C38.40', zoomLink: '12/38.3220/26.7640' }
  };
  const buttons = Array.from(document.querySelectorAll('[data-map-focus]'));
  const title = document.getElementById('map-focus-title');
  const description = document.getElementById('map-focus-description');
  const loadNote = document.getElementById('map-load-note');
  function focus(key, updateFrame) {
    const item = presets[key];
    if (!item) return;
    buttons.forEach((button) => {
      const active = button.dataset.mapFocus === key;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    title.textContent = item.title;
    description.textContent = item.description;
    if (updateFrame) frame.src = `https://www.openstreetmap.org/export/embed.html?bbox=${item.bbox}&layer=mapnik`;
    if (loadNote) loadNote.hidden = true;
  }
  buttons.forEach((button) => button.addEventListener('click', () => focus(button.dataset.mapFocus, true)));
  frame.addEventListener('error', () => { if (loadNote) loadNote.hidden = false; });
  // A slow or blocked third-party map may never trigger iframe error; the fallback is a direct OSM link.
  buttons.forEach((button) => button.setAttribute('aria-pressed', button.classList.contains('active') ? 'true' : 'false'));
})();
