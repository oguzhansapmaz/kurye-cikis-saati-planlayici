(function () {
  'use strict';
  const STORAGE_NAMESPACE = 'kuryeplan.savedPlans.v1';
  const $ = (id) => document.getElementById(id);
  const form = $('planner-form');
  const fieldIds = ['order-id', 'courier-name', 'destination', 'deadline', 'prep-minutes', 'route-minutes', 'buffer-minutes'];
  let currentPlan = null;
  let toastTimeout = null;

  function parseDateTime(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatTime(date) {
    return new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', weekday: 'long' }).format(date);
  }

  function formatShortDate(date) {
    return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' }).format(date);
  }

  function localDateTimeValue(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function roundToFiveMinutes(date) {
    const result = new Date(date);
    result.setSeconds(0, 0);
    result.setMinutes(Math.ceil(result.getMinutes() / 5) * 5);
    return result;
  }

  function showToast(message) {
    const toast = $('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function readForm() {
    const deadline = parseDateTime($('deadline').value);
    const prep = Number($('prep-minutes').value);
    const route = Number($('route-minutes').value);
    const buffer = Number($('buffer-minutes').value);
    const courierName = $('courier-name').value.trim();
    const destination = $('destination').value.trim();

    if (!courierName || !destination) throw new Error('Lütfen kurye kodunu ve teslimat bölgesini gir.');
    if (!deadline) throw new Error('Lütfen geçerli bir son teslim tarihi ve saati seç.');
    if (deadline.getTime() <= Date.now()) throw new Error('Son teslim zamanı şu andan ileri bir zaman olmalı.');
    if (!Number.isInteger(prep) || prep < 0 || prep > 360) throw new Error('Hazırlık süresi 0–360 dakika arasında tam sayı olmalı.');
    if (!Number.isInteger(route) || route < 1 || route > 600) throw new Error('Yolculuk süresi 1–600 dakika arasında tam sayı olmalı.');
    if (!Number.isInteger(buffer) || buffer < 0 || buffer > 180) throw new Error('Güven payı 0–180 dakika arasında tam sayı olmalı.');

    const exit = new Date(deadline.getTime() - (route + buffer) * 60000);
    const prepStart = new Date(exit.getTime() - prep * 60000);
    const arrival = new Date(exit.getTime() + route * 60000);
    return {
      id: $('order-id').value.trim() || `KRY-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      orderId: $('order-id').value.trim(), courierName, destination,
      deadline: deadline.toISOString(), prepMinutes: prep, routeMinutes: route, bufferMinutes: buffer,
      exit: exit.toISOString(), prepStart: prepStart.toISOString(), arrival: arrival.toISOString(),
      totalMinutes: prep + route + buffer, createdAt: new Date().toISOString()
    };
  }

  function countdownText(ms) {
    const abs = Math.abs(ms);
    const minutes = Math.floor(abs / 60000);
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;
    const parts = [];
    if (days) parts.push(`${days} gün`);
    if (hours) parts.push(`${hours} saat`);
    if (mins || !parts.length) parts.push(`${mins} dk`);
    return parts.join(' ');
  }

  function getStatus(plan) {
    const now = Date.now();
    const prepMs = new Date(plan.prepStart).getTime() - now;
    const exitMs = new Date(plan.exit).getTime() - now;
    if (exitMs <= 0) return { type: 'late', label: 'Çıkış saati geçti', warning: 'Hesaplanan çıkış saati geçti. Teslimatın zamanında ulaşması için yeni bir tahmin veya daha erken bir teslim saati gerekebilir.' };
    if (prepMs <= 0) return { type: 'warning', label: 'Hazırlık başlamalı', warning: 'Planlanan hazırlık başlangıç zamanı geldi veya geçti. Operasyonun hazır olup olmadığını hemen kontrol et.' };
    if (prepMs < 15 * 60000) return { type: 'warning', label: 'Zaman daralıyor', warning: 'Hazırlığa başlamak için 15 dakikadan az süre kaldı.' };
    return { type: 'ready', label: 'Planlanabilir', warning: '' };
  }

  function renderPlan(plan) {
    currentPlan = plan;
    const exit = new Date(plan.exit);
    const prepStart = new Date(plan.prepStart);
    const arrival = new Date(plan.arrival);
    const status = getStatus(plan);
    $('exit-time').textContent = formatTime(exit);
    $('exit-date').textContent = formatDate(exit);
    $('prep-time').textContent = formatTime(prepStart);
    $('prep-date').textContent = formatShortDate(prepStart);
    $('timeline-exit-time').textContent = formatTime(exit);
    $('timeline-exit-date').textContent = formatShortDate(exit);
    $('arrival-time').textContent = formatTime(arrival);
    $('arrival-date').textContent = formatShortDate(arrival);
    $('total-duration').textContent = `${plan.totalMinutes} dk`;
    $('buffer-display').textContent = `${plan.bufferMinutes} dk`;
    const pill = $('status-pill');
    pill.className = `status-pill status-${status.type}`;
    $('status-text').textContent = status.label;
    $('result-warning').hidden = !status.warning;
    $('result-warning').textContent = status.warning;
    refreshCountdown();
  }

  function refreshCountdown() {
    if (!currentPlan) return;
    const exitMs = new Date(currentPlan.exit).getTime() - Date.now();
    const prepMs = new Date(currentPlan.prepStart).getTime() - Date.now();
    if (exitMs <= 0) {
      $('time-left').textContent = `${countdownText(exitMs)} gecikti`;
      $('exit-distance').textContent = 'Acil kontrol';
    } else {
      $('time-left').textContent = countdownText(exitMs);
      $('exit-distance').textContent = `Hazırlığa ${prepMs <= 0 ? 'başlanmalı' : countdownText(prepMs)}`;
    }
    const status = getStatus(currentPlan);
    $('status-pill').className = `status-pill status-${status.type}`;
    $('status-text').textContent = status.label;
    $('result-warning').hidden = !status.warning;
    $('result-warning').textContent = status.warning;
  }

  function onSubmit(event) {
    event.preventDefault();
    $('form-error').hidden = true;
    try {
      const plan = readForm();
      renderPlan(plan);
      showToast('Çıkış ve hazırlık saatleri hesaplandı.');
    } catch (error) {
      $('form-error').textContent = error.message || 'Form kontrolü sırasında bir hata oluştu.';
      $('form-error').hidden = false;
    }
  }

  function readSavedPlans() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_NAMESPACE) || '[]');
      return Array.isArray(value) ? value.filter((item) => item && item.id && item.exit && item.deadline) : [];
    } catch (_) { return []; }
  }

  function writeSavedPlans(plans) {
    try {
      localStorage.setItem(STORAGE_NAMESPACE, JSON.stringify(plans.slice(0, 20)));
      return true;
    } catch (_) {
      showToast('Tarayıcı kaydı başarısız. Depolama alanını kontrol et.');
      return false;
    }
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function renderSavedPlans() {
    const plans = readSavedPlans();
    $('saved-count').textContent = String(plans.length);
    $('clear-plans').disabled = plans.length === 0;
    if (!plans.length) {
      $('saved-plans').innerHTML = '<div class="empty-state"><div class="empty-icon" aria-hidden="true">▤</div><b>Henüz kaydedilmiş plan yok</b><p>İlk hesaplamanı yaptıktan sonra “Planı kaydet” butonuna bas.</p></div>';
      return;
    }
    $('saved-plans').innerHTML = plans.map((plan) => {
      const exit = new Date(plan.exit);
      const deadline = new Date(plan.deadline);
      return `<article class="saved-item"><div class="saved-item-icon" aria-hidden="true">⌖</div><div class="saved-item-main"><strong>${escapeHtml(plan.orderId || plan.id)} · ${escapeHtml(plan.destination)}</strong><small>${escapeHtml(plan.courierName)} · Son teslim ${formatDate(deadline)} ${formatTime(deadline)}</small></div><div class="saved-item-time"><strong>${formatTime(exit)}</strong><small>En geç çıkış</small></div><button class="delete-plan" type="button" data-delete-id="${escapeHtml(plan.id)}" aria-label="${escapeHtml(plan.id)} planını sil" title="Planı sil">×</button></article>`;
    }).join('');
  }

  function saveCurrentPlan() {
    if (!currentPlan) {
      try { currentPlan = readForm(); renderPlan(currentPlan); }
      catch (error) { $('form-error').textContent = error.message; $('form-error').hidden = false; return; }
    }
    const plans = readSavedPlans();
    if (plans.some((plan) => plan.id === currentPlan.id)) currentPlan = { ...currentPlan, id: `${currentPlan.id}-${Date.now().toString().slice(-4)}` };
    const newPlan = { ...currentPlan, savedAt: new Date().toISOString() };
    if (writeSavedPlans([newPlan, ...plans])) { renderSavedPlans(); showToast('Plan bu tarayıcıya kaydedildi.'); }
  }

  function deletePlan(id) {
    const plans = readSavedPlans().filter((plan) => plan.id !== id);
    if (writeSavedPlans(plans)) { renderSavedPlans(); showToast('Plan silindi.'); }
  }

  function csvCell(value) {
    let stringValue = String(value ?? '');
    // Avoid spreadsheet formula execution when a user-controlled field starts with a formula marker.
    if (/^[=+\-@\t\r]/.test(stringValue)) stringValue = "'" + stringValue;
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  function exportPlan() {
    if (!currentPlan) {
      try { currentPlan = readForm(); renderPlan(currentPlan); }
      catch (error) { $('form-error').textContent = error.message; $('form-error').hidden = false; return; }
    }
    const p = currentPlan;
    const rows = [
      ['Alan', 'Değer'], ['İş no', p.orderId || p.id], ['Kurye', p.courierName], ['Teslimat bölgesi', p.destination],
      ['Son teslim zamanı', new Date(p.deadline).toLocaleString('tr-TR')], ['Hazırlık (dakika)', p.prepMinutes],
      ['Yolculuk (dakika)', p.routeMinutes], ['Güven payı (dakika)', p.bufferMinutes],
      ['Hazırlık başlangıcı', new Date(p.prepStart).toLocaleString('tr-TR')], ['En geç çıkış', new Date(p.exit).toLocaleString('tr-TR')],
      ['Tahmini varış', new Date(p.arrival).toLocaleString('tr-TR')], ['Yöntem notu', 'Manuel süre tahmini; canlı trafik verisi kullanılmaz.']
    ];
    const csv = '\ufeff' + rows.map((row) => row.map(csvCell).join(';')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `kurye-plan-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    showToast('Plan CSV olarak indirildi.');
  }

  function setDefaults() {
    const now = new Date();
    const deadline = roundToFiveMinutes(new Date(now.getTime() + 2 * 60 * 60000));
    $('order-id').value = '';
    $('courier-name').value = 'Kurye 01';
    $('destination').value = 'Kadıköy / Moda';
    $('deadline').value = localDateTimeValue(deadline);
    $('prep-minutes').value = '10';
    $('route-minutes').value = '35';
    $('buffer-minutes').value = '15';
    $('form-error').hidden = true;
    try { renderPlan(readForm()); } catch (_) { /* defaults are expected to be valid */ }
  }

  function updateClock() {
    $('clock-label').textContent = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()) + ' · Yerel saat';
  }

  form.addEventListener('submit', onSubmit);
  $('reset-button').addEventListener('click', () => { setDefaults(); showToast('Örnek değerlere dönüldü.'); });
  $('save-plan').addEventListener('click', saveCurrentPlan);
  $('export-plan').addEventListener('click', exportPlan);
  $('clear-plans').addEventListener('click', () => {
    if (!readSavedPlans().length) return;
    if (window.confirm('Bu tarayıcıda kaydedilmiş tüm planlar silinsin mi?')) {
      if (writeSavedPlans([])) { renderSavedPlans(); showToast('Tüm yerel kayıtlar silindi.'); }
    }
  });
  $('saved-plans').addEventListener('click', (event) => {
    const button = event.target.closest('[data-delete-id]');
    if (button) deletePlan(button.getAttribute('data-delete-id'));
  });
  fieldIds.forEach((id) => $(id).addEventListener('change', () => {
    try { const p = readForm(); renderPlan(p); $('form-error').hidden = true; }
    catch (_) { /* keep the last valid calculation while the user edits */ }
  }));

  setDefaults();
  renderSavedPlans();
  updateClock();
  setInterval(() => { updateClock(); refreshCountdown(); }, 30000);
})();
