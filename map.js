(function () {
  'use strict';
  const frame = document.getElementById('istanbul-map-frame');
  if (!frame) return;
  const presets = {
    istanbul: { title: 'İstanbul geneli', description: 'İBB trafik indeksi İstanbul şehir geneli ölçümüdür. Haritayı başlangıç bölgesi olarak kullan; güzergâha özel trafik göstermez.', bbox: '28.55%2C40.80%2C29.45%2C41.30', zoomLink: '10/41.0082/28.9784' },
    kadikoy: { title: 'Kadıköy', description: 'Anadolu yakasının önemli teslimat bölgelerinden birini incele. Tarihsel indeks burada sokak veya rota seviyesinde ayrıştırılmaz.', bbox: '29.00%2C40.96%2C29.12%2C40.99', zoomLink: '13/40.9906/29.0277' },
    besiktas: { title: 'Beşiktaş', description: 'Boğaz kıyısı ve merkezî Beşiktaş bölgesini keşfet. Bu görünüm harita bağlamıdır; canlı trafik ölçümü değildir.', bbox: '28.99%2C41.03%2C29.04%2C41.08', zoomLink: '14/41.0430/29.0060' },
    sisli: { title: 'Şişli', description: 'Merkez iş ve teslimat alanlarını haritada incele. Öneri motoru şehir geneli geçmiş indeksini kullanır.', bbox: '28.97%2C41.04%2C29.00%2C41.08', zoomLink: '14/41.0602/28.9877' },
    uskudar: { title: 'Üsküdar', description: 'Anadolu yakasındaki Üsküdar bölgesini keşfet. Bu harita GPS veya gerçek zamanlı kurye konumu göstermez.', bbox: '29.00%2C41.01%2C29.06%2C41.04', zoomLink: '14/41.0255/29.0154' },
    bakirkoy: { title: 'Bakırköy', description: 'Bakırköy ve çevresini harita üzerinden incele. Yolculuk süreleri planlama formunda kullanıcı tahmini olarak girilir.', bbox: '28.84%2C40.96%2C28.90%2C41.00', zoomLink: '14/40.9780/28.8720' }
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
  buttons.forEach((button) => button.setAttribute('aria-pressed', button.classList.contains('active') ? 'true' : 'false'));
})();
