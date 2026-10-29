(function () {
  'use strict';

  const SOURCE_URL = 'https://data.ibb.gov.tr/dataset/trafik-indeks-degeri-web-servisi';
  // The scheduled workflow writes the latest validated JSON to a data-only branch.
  // This avoids requiring a full Vercel rebuild for each daily snapshot and leaves main protected.
  const REMOTE_DATA_URL = 'https://raw.githubusercontent.com/oguzhansapmaz/kurye-cikis-saati-planlayici/traffic-data/data/traffic.json';
  const CACHE_NAMESPACE = 'kuryeplan.trafficData.v1';
  const DAY_NAMES = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const DAY_ABBR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const EN_DAY_TO_INDEX = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const state = {
    data: null,
    observations: [],
    range: '7d',
    sortField: 'observedAt',
    sortDirection: -1,
    fromLocalCache: false
  };

  const $ = (id) => document.getElementById(id);
  const statusEl = $('traffic-status');
  const contentEl = $('traffic-dashboard-content');
  if (!statusEl || !contentEl) return;

  function safeReadCache() {
    try {
      const text = localStorage.getItem(CACHE_NAMESPACE);
      if (!text) return null;
      const data = JSON.parse(text);
      return Array.isArray(data.observations) && data.observations.length ? data : null;
    } catch (_) { return null; }
  }

  function rememberData(data) {
    if (!data || !Array.isArray(data.observations) || !data.observations.length) return;
    try { localStorage.setItem(CACHE_NAMESPACE, JSON.stringify(data)); } catch (_) { /* storage may be disabled */ }
  }

  function setStatus(kind, title, message, withRetry) {
    statusEl.className = `traffic-state traffic-state-${kind}`;
    const icon = kind === 'loading' ? '<span class="traffic-spinner" aria-hidden="true"></span>'
      : kind === 'error' ? '<span class="traffic-state-icon" aria-hidden="true">!</span>'
      : kind === 'empty' ? '<span class="traffic-state-icon" aria-hidden="true">↗</span>'
      : '<span class="traffic-state-icon" aria-hidden="true">i</span>';
    const retry = withRetry ? '<button type="button" id="traffic-retry" class="button button-quiet">Tekrar dene</button>' : '';
    statusEl.innerHTML = `${icon}<div class="traffic-state-copy"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p>${retry}</div>`;
    statusEl.hidden = false;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function dateFrom(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatTime(value) {
    const date = dateFrom(value);
    return date ? new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date) : '—';
  }

  function formatDateTime(value, withWeekday) {
    const date = dateFrom(value);
    if (!date) return '—';
    return new Intl.DateTimeFormat('tr-TR', {
      timeZone: 'Europe/Istanbul',
      ...(withWeekday ? { weekday: 'short' } : {}),
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).format(date);
  }

  function getIstanbulParts(value) {
    const date = dateFrom(value);
    if (!date) return null;
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Istanbul', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23'
    }).formatToParts(date);
    const map = {};
    parts.forEach((part) => { map[part.type] = part.value; });
    const weekday = EN_DAY_TO_INDEX[map.weekday];
    return {
      weekday,
      weekdayNumber: weekday + 1,
      hour: Number(map.hour),
      day: `${map.year}-${map.month}-${map.day}`,
      date
    };
  }

  function indexLevel(index) {
    if (index < 25) return 'Daha düşük';
    if (index < 50) return 'Orta';
    if (index < 70) return 'Yüksek';
    return 'Çok yüksek';
  }

  function getObservations(data) {
    if (!data || !Array.isArray(data.observations)) return [];
    return data.observations
      .filter((item) => item && Number.isFinite(Number(item.index)) && dateFrom(item.observedAt))
      .map((item) => ({ observedAt: item.observedAt, index: Number(item.index), sourceFrequency: item.sourceFrequency || 'H' }))
      .sort((a, b) => new Date(a.observedAt) - new Date(b.observedAt));
  }

  function setDashboardState(data, fromCache) {
    state.data = data;
    state.observations = getObservations(data);
    state.fromLocalCache = Boolean(fromCache);
    if (!state.observations.length || !data.currentObservation) {
      contentEl.hidden = true;
      setStatus('empty', 'Trafik verisi henüz hazır değil', 'Resmî veri, GitHub Actions içindeki “İBB trafik verisini güncelle” akışı ilk kez çalıştırılınca alınacak. Bu sırada gerçek olmayan örnek değer göstermiyoruz.', true);
      return;
    }
    contentEl.hidden = false;
    statusEl.hidden = true;
    renderDashboard();
    rememberData(data);
  }

  async function fetchDataFile(sourceUrl) {
    const url = new URL(sourceUrl, window.location.href);
    url.searchParams.set('refresh', String(Date.now()));
    const response = await fetch(url.toString(), {
      cache: 'no-store',
      credentials: 'omit',
      mode: url.origin === window.location.origin ? 'same-origin' : 'cors'
    });
    if (!response.ok) throw new Error(`Veri dosyası HTTP ${response.status} döndürdü`);
    return response.json();
  }

  async function loadTrafficData() {
    setStatus('loading', 'Trafik verisi yükleniyor', 'Son başarılı İBB veri dosyası okunuyor.', false);
    contentEl.hidden = true;
    const candidates = [REMOTE_DATA_URL, './data/traffic.json'];
    let lastError = null;
    let emptyResponse = null;
    for (const source of candidates) {
      try {
        const data = await fetchDataFile(source);
        if (Array.isArray(data.observations) && data.observations.length && data.currentObservation) {
          setDashboardState(data, false);
          return;
        }
        emptyResponse = data;
      } catch (error) {
        lastError = error;
      }
    }

    const cached = safeReadCache();
    if (cached) {
      cached.warning = emptyResponse
        ? 'Güncel trafik dosyası henüz gerçek gözlem içermiyor; bu tarayıcıdaki son başarılı veri kullanılıyor.'
        : 'Güncel trafik dosyası alınamadı; bu tarayıcıdaki son başarılı veri kullanılıyor. ' + (lastError ? lastError.message : '');
      setDashboardState(cached, true);
      return;
    }
    if (emptyResponse) {
      setDashboardState(emptyResponse, false);
      return;
    }
    contentEl.hidden = true;
    setStatus('error', 'Trafik dosyasına ulaşılamadı', 'İBB verisinin son başarılı kopyası bulunamadı. Bağlantını kontrol edip tekrar deneyebilir veya GitHub Actions içinden “İBB trafik verisini güncelle” akışını çalıştırabilirsin.', true);
  }

  function renderDashboard() {
    const data = state.data;
    const observations = state.observations;
    const current = data.currentObservation;
    const currentParts = getIstanbulParts(current.observedAt);
    const currentIndex = Number(current.index);
    $('traffic-current-value').textContent = `${Math.round(currentIndex)}/100`;
    $('traffic-current-level').textContent = `${indexLevel(currentIndex)} indeks seviyesi`;
    $('traffic-current-time').textContent = formatTime(current.observedAt);
    $('traffic-current-age').textContent = `${formatDateTime(current.observedAt, true)} · ${current.isCurrentFrequency ? '5 dakikalık ölçüm' : 'saatlik geçmiş ölçümü'}`;
    $('traffic-update-label').textContent = data.fetchedAt ? `Son başarılı veri: ${formatDateTime(data.fetchedAt, true)}` : 'Güncelleme zamanı bilinmiyor';
    $('traffic-record-count').textContent = `${observations.length.toLocaleString('tr-TR')} gözlem`;

    const fetchedAt = dateFrom(data.fetchedAt);
    const ageHours = fetchedAt ? Math.max(0, (Date.now() - fetchedAt.getTime()) / 3600000) : null;
    if (ageHours !== null && ageHours > 36) {
      $('traffic-update-label').classList.add('is-stale');
      $('traffic-current-age').textContent += ` · Son çekim ${Math.floor(ageHours)} saattir yenilenmedi`;
    } else {
      $('traffic-update-label').classList.remove('is-stale');
    }
    if (state.fromLocalCache) {
      $('traffic-update-label').classList.add('is-stale');
      showDataWarning('Tarayıcı önbelleği kullanılıyor; değerler en son başarılı veri dosyasına aittir.');
    } else if (data.warning) {
      showDataWarning(data.warning);
    } else if (data.status === 'partial') {
      showDataWarning('Güncel 5 dakikalık ölçüm yerine son saatlik gözlem gösteriliyor.');
    } else {
      removeDataWarning();
    }

    renderTrendChart();
    renderHeatmap();
    renderObservationTable();
    renderSameDayComparison(current, currentParts);
    populateRecommendationHours();
    runRecommendation();
  }

  function showDataWarning(message) {
    let note = $('traffic-data-warning');
    if (!note) {
      note = document.createElement('p');
      note.id = 'traffic-data-warning';
      note.className = 'traffic-data-warning';
      statusEl.insertAdjacentElement('afterend', note);
    }
    note.textContent = message;
    note.hidden = false;
  }

  function removeDataWarning() {
    const note = $('traffic-data-warning');
    if (note) note.hidden = true;
  }

  function filteredObservations() {
    const sorted = state.observations;
    if (!sorted.length) return [];
    const last = new Date(sorted[sorted.length - 1].observedAt).getTime();
    const span = state.range === '24h' ? 24 * 3600000 : state.range === '7d' ? 7 * 86400000 : 28 * 86400000;
    const start = last - span;
    const filtered = sorted.filter((item) => new Date(item.observedAt).getTime() >= start);
    return filtered.length >= 2 ? filtered : sorted.slice(-Math.min(sorted.length, state.range === '24h' ? 24 : state.range === '7d' ? 168 : 672));
  }

  function renderTrendChart() {
    const svg = $('traffic-trend-chart');
    const rows = filteredObservations();
    if (!rows.length) {
      svg.innerHTML = '<text x="360" y="130" text-anchor="middle">Yeterli tarihsel gözlem bulunamadı.</text>';
      $('traffic-trend-summary').textContent = 'Trend grafiği için daha fazla geçerli gözlem gerekiyor.';
      return;
    }
    const width = 720, height = 260, left = 52, right = 16, top = 14, bottom = 38;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const x = (index) => left + (rows.length <= 1 ? plotWidth / 2 : index / (rows.length - 1) * plotWidth);
    const y = (value) => top + (100 - Math.max(0, Math.min(100, value))) / 100 * plotHeight;
    const grid = [0, 25, 50, 75, 100].map((tick) => `<line class="traffic-chart-gridline" x1="${left}" y1="${y(tick)}" x2="${width - right}" y2="${y(tick)}"/><text class="traffic-chart-axis" x="${left - 10}" y="${y(tick) + 4}" text-anchor="end">${tick}</text>`).join('');
    const points = rows.map((row, index) => `${x(index).toFixed(1)},${y(row.index).toFixed(1)}`).join(' ');
    const ticks = [0, Math.floor((rows.length - 1) / 3), Math.floor(2 * (rows.length - 1) / 3), rows.length - 1]
      .filter((item, index, array) => array.indexOf(item) === index)
      .map((i) => `<text class="traffic-chart-axis" x="${x(i)}" y="${height - 12}" text-anchor="${i === 0 ? 'start' : i === rows.length - 1 ? 'end' : 'middle'}">${escapeHtml(formatDateTime(rows[i].observedAt, false).replace(/\s+\d{4}/, ''))}</text>`).join('');
    const latest = rows[rows.length - 1];
    svg.innerHTML = `<title>İBB şehir geneli trafik indeksi</title><desc>Bu dönem içinde indeks ${Math.min(...rows.map((r) => r.index))} ile ${Math.max(...rows.map((r) => r.index))} arasında değişti.</desc>${grid}<polyline class="traffic-chart-line" points="${points}"/><circle class="traffic-chart-last-point" cx="${x(rows.length - 1)}" cy="${y(latest.index)}" r="4.5"/>${ticks}`;
    const average = rows.reduce((sum, row) => sum + row.index, 0) / rows.length;
    const minRow = rows.reduce((a, b) => a.index <= b.index ? a : b);
    const maxRow = rows.reduce((a, b) => a.index >= b.index ? a : b);
    $('traffic-trend-summary').textContent = `${rows.length} gözlemde ortalama indeks ${average.toFixed(1)}. En düşük: ${Math.round(minRow.index)} (${formatDateTime(minRow.observedAt, true)}); en yüksek: ${Math.round(maxRow.index)} (${formatDateTime(maxRow.observedAt, true)}).`;
    document.querySelectorAll('[data-traffic-range]').forEach((button) => button.setAttribute('aria-pressed', button.dataset.trafficRange === state.range ? 'true' : 'false'));
  }

  function historyBuckets() {
    const map = new Map();
    state.observations.forEach((row) => {
      const parts = getIstanbulParts(row.observedAt);
      if (!parts) return;
      const key = `${parts.weekday}-${parts.hour}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row.index);
    });
    const result = new Map();
    map.forEach((values, key) => result.set(key, { average: values.reduce((sum, value) => sum + value, 0) / values.length, count: values.length }));
    return result;
  }

  function levelForIndex(value, count) {
    if (count < 2 || value === null || !Number.isFinite(value)) return 0;
    if (value < 25) return 1;
    if (value < 45) return 2;
    if (value < 65) return 3;
    return 4;
  }

  function renderHeatmap() {
    const root = $('traffic-heatmap');
    const buckets = historyBuckets();
    if (!buckets.size) {
      root.innerHTML = '<p class="empty-traffic-note">Isı haritası için tarihsel gözlem bulunamadı.</p>';
      $('traffic-heatmap-summary').textContent = 'Isı haritası verisi henüz mevcut değil.';
      return;
    }
    let markup = '<div class="heatmap-hour-row" role="row"><span class="heatmap-day-label">Gün / saat</span>';
    for (let hour = 0; hour < 24; hour += 1) markup += `<span class="heatmap-hour-label">${String(hour).padStart(2, '0')}</span>`;
    markup += '</div>';
    for (let day = 0; day < 7; day += 1) {
      markup += `<div class="heatmap-data-row" role="row"><span class="heatmap-day-label">${DAY_ABBR[day]}</span>`;
      for (let hour = 0; hour < 24; hour += 1) {
        const item = buckets.get(`${day}-${hour}`);
        const value = item ? item.average : null;
        const count = item ? item.count : 0;
        const level = levelForIndex(value, count);
        const title = item ? `${DAY_NAMES[day]} ${String(hour).padStart(2, '0')}:00 · ortalama ${value.toFixed(1)} · ${count} gözlem` : `${DAY_NAMES[day]} ${String(hour).padStart(2, '0')}:00 · yeterli gözlem yok`;
        markup += `<span class="heatmap-cell heatmap-level-${level}" role="gridcell" tabindex="0" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}">${item ? Math.round(value) : '·'}</span>`;
      }
      markup += '</div>';
    }
    root.innerHTML = markup;

    const usable = Array.from(buckets.entries()).filter(([, item]) => item.count >= 2);
    const lowest = usable.reduce((best, item) => !best || item[1].average < best[1].average ? item : best, null);
    const highest = usable.reduce((best, item) => !best || item[1].average > best[1].average ? item : best, null);
    if (lowest && highest) {
      const [lowDay, lowHour] = lowest[0].split('-').map(Number);
      const [highDay, highHour] = highest[0].split('-').map(Number);
      $('traffic-heatmap-summary').textContent = `Yeterli örneği olan gün/saat hücrelerinde en düşük ortalama ${DAY_NAMES[lowDay]} ${String(lowHour).padStart(2, '0')}:00 (${lowest[1].average.toFixed(1)}); en yüksek ${DAY_NAMES[highDay]} ${String(highHour).padStart(2, '0')}:00 (${highest[1].average.toFixed(1)}).`;
    } else {
      $('traffic-heatmap-summary').textContent = 'Gün/saat ortalaması çıkarabilmek için her hücrede en az iki gözlem aranıyor.';
    }
    renderHeatmapAccessibleTable(buckets);
  }

  function renderHeatmapAccessibleTable(buckets) {
    const root = $('traffic-heatmap-table');
    let html = '<table class="traffic-data-table heatmap-access-data"><caption>Haftanın günü ve saate göre ortalama trafik indeksi</caption><thead><tr><th scope="col">Gün</th>';
    for (let hour = 0; hour < 24; hour += 1) html += `<th scope="col">${String(hour).padStart(2, '0')}:00</th>`;
    html += '</tr></thead><tbody>';
    for (let day = 0; day < 7; day += 1) {
      html += `<tr><th scope="row">${DAY_NAMES[day]}</th>`;
      for (let hour = 0; hour < 24; hour += 1) {
        const item = buckets.get(`${day}-${hour}`);
        html += `<td>${item ? `${item.average.toFixed(1)} (${item.count})` : '—'}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    root.innerHTML = html;
  }

  function renderObservationTable() {
    const rows = [...state.observations].sort((a, b) => {
      const aValue = state.sortField === 'index' ? a.index : new Date(a.observedAt).getTime();
      const bValue = state.sortField === 'index' ? b.index : new Date(b.observedAt).getTime();
      return (aValue > bValue ? 1 : aValue < bValue ? -1 : 0) * state.sortDirection;
    }).slice(0, 100);
    const tbody = $('traffic-observation-rows');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="3">Gösterilecek gözlem bulunamadı.</td></tr>';
      $('traffic-table-summary').textContent = 'Tablo boş; başarılı veri çekimi bekleniyor.';
      return;
    }
    tbody.innerHTML = rows.map((row) => {
      const parts = getIstanbulParts(row.observedAt);
      const day = parts ? DAY_NAMES[parts.weekday] : '—';
      return `<tr><td>${escapeHtml(formatDateTime(row.observedAt, false))}</td><td><span class="index-value">${Math.round(row.index)}</span></td><td>${day}</td></tr>`;
    }).join('');
    $('traffic-table-summary').textContent = `Tabloda ${rows.length} kayıt gösteriliyor; kaynakta toplam ${state.observations.length} saatlik gözlem var. Tarih veya indeks sütununu seçerek sıralamayı değiştirebilirsin.`;
  }

  function renderSameDayComparison(current, currentParts) {
    if (!currentParts) {
      $('traffic-delta-value').textContent = '—';
      $('traffic-delta-label').textContent = 'Geçerli gözlem zamanı yok';
      return;
    }
    const samples = state.observations.filter((item) => {
      const parts = getIstanbulParts(item.observedAt);
      return parts && parts.weekday === currentParts.weekday && parts.hour === currentParts.hour && parts.day < currentParts.day;
    });
    if (samples.length < 2) {
      $('traffic-delta-value').textContent = 'Yetersiz veri';
      $('traffic-delta-label').textContent = `Aynı ${DAY_NAMES[currentParts.weekday]} ${String(currentParts.hour).padStart(2, '0')}:00 saati için en az 2 geçmiş gözlem gerekiyor.`;
      return;
    }
    const average = samples.reduce((sum, row) => sum + row.index, 0) / samples.length;
    const delta = Number(current.index) - average;
    $('traffic-delta-value').textContent = `${delta > 0 ? '+' : ''}${delta.toFixed(1)} puan`;
    $('traffic-delta-label').textContent = `Bugün ${Math.round(Number(current.index))}; geçmiş ${samples.length} eşleşen gözlemin ortalaması ${average.toFixed(1)}.`;
    $('traffic-delta-value').classList.toggle('traffic-value-worse', delta > 0);
    $('traffic-delta-value').classList.toggle('traffic-value-better', delta < 0);
  }

  function populateRecommendationHours() {
    const select = $('recommend-hour');
    if (!select || select.options.length) return;
    for (let hour = 5; hour <= 23; hour += 1) {
      const option = document.createElement('option');
      option.value = String(hour);
      option.textContent = `${String(hour).padStart(2, '0')}:00`;
      select.appendChild(option);
    }
    const nowParts = getIstanbulParts(new Date().toISOString());
    if (nowParts) select.value = String(Math.min(23, Math.max(5, nowParts.hour)));
    const daySelect = $('recommend-weekday');
    if (nowParts && daySelect) daySelect.value = String(nowParts.weekdayNumber);
  }

  function runRecommendation() {
    const output = $('traffic-recommendation-result');
    const origin = $('route-origin').value;
    const destination = $('route-destination').value;
    const weekday = Number($('recommend-weekday').value) - 1;
    const targetHour = Number($('recommend-hour').value);
    if (origin === destination) {
      output.innerHTML = '<strong>İki farklı ilçe seç</strong><p>Çıkış ve varış ilçeleri aynı olamaz.</p>';
      return;
    }
    const candidates = [];
    const firstHour = Math.max(5, targetHour - 3);
    const lastHour = Math.min(23, targetHour + 3);
    for (let hour = firstHour; hour <= lastHour; hour += 1) {
      const values = state.observations.filter((row) => {
        const parts = getIstanbulParts(row.observedAt);
        return parts && parts.weekday === weekday && parts.hour === hour;
      }).map((row) => row.index);
      if (values.length >= 2) candidates.push({ hour, average: values.reduce((sum, value) => sum + value, 0) / values.length, count: values.length });
    }
    if (!candidates.length) {
      output.innerHTML = '<strong>Henüz güvenilir öneri için yeterli veri yok</strong><p>Bu gün ve çevredeki saatler için en az ikişer geçmiş gözlem gerekiyor. Günlük veri yenilemesi tamamlandıktan sonra yeniden dene.</p>';
      return;
    }
    candidates.sort((a, b) => a.average - b.average || Math.abs(a.hour - targetHour) - Math.abs(b.hour - targetHour));
    const best = candidates[0];
    const planned = candidates.find((item) => item.hour === targetHour);
    const delta = planned ? planned.average - best.average : null;
    const time = `${String(best.hour).padStart(2, '0')}:00`;
    const improvement = delta !== null && best.hour !== targetHour ? ` Seçtiğin ${String(targetHour).padStart(2, '0')}:00 saatine göre geçmiş ortalama indeks ${delta.toFixed(1)} puan daha düşük.` : '';
    output.innerHTML = `<strong>${escapeHtml(origin)} → ${escapeHtml(destination)} için tarihsel saat önerisi: ${time}</strong><p>${DAY_NAMES[weekday]} günü, seçtiğin saat çevresindeki ${best.count} gözlemden hesaplanan ortalama indeks ${best.average.toFixed(1)}.${escapeHtml(improvement)}</p><small>Bu öneri şehir geneli endekse dayanır; iki ilçe arasındaki gerçek rota süresini veya trafik yoğunluğunu ölçmez.</small>`;
  }

  document.querySelectorAll('[data-traffic-range]').forEach((button) => button.addEventListener('click', () => {
    state.range = button.dataset.trafficRange;
    renderTrendChart();
  }));

  document.querySelectorAll('[data-show-table]').forEach((button) => button.addEventListener('click', () => {
    const target = $(button.dataset.showTable);
    if (!target) return;
    const shouldShow = target.hidden;
    target.hidden = !shouldShow;
    button.setAttribute('aria-expanded', shouldShow ? 'true' : 'false');
    button.textContent = shouldShow ? 'Tabloyu gizle' : (target.id === 'traffic-heatmap-table' ? 'Isı haritası verisini tablo olarak gör' : 'Veriyi tablo olarak gör');
  }));

  document.querySelectorAll('[data-sort-traffic]').forEach((button) => button.addEventListener('click', () => {
    const field = button.dataset.sortTraffic;
    state.sortDirection = state.sortField === field ? state.sortDirection * -1 : field === 'index' ? 1 : -1;
    state.sortField = field;
    renderObservationTable();
    document.querySelectorAll('[data-sort-traffic]').forEach((item) => {
      const active = item.dataset.sortTraffic === field;
      item.setAttribute('aria-pressed', active ? 'true' : 'false');
      item.textContent = `${field === 'index' ? 'Trafik indeksi' : 'Gözlem zamanı'} ${active ? (state.sortDirection === 1 ? '↑' : '↓') : '↕'}`;
    });
  }));

  $('traffic-recommend-button').addEventListener('click', runRecommendation);
  ['route-origin', 'route-destination', 'recommend-weekday', 'recommend-hour'].forEach((id) => $(id).addEventListener('change', runRecommendation));
  statusEl.addEventListener('click', (event) => { if (event.target.closest('#traffic-retry')) loadTrafficData(); });
  loadTrafficData();
})();
