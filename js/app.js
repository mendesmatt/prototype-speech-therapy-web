/* Instituto Londucci — App do Paciente
   Lógica de interação: navegação de abas, cronômetro, gravação
   simulada, pagamentos, agendamento e gráficos */

/* ========== CLOCK ========== */
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('clock').textContent = `${h}:${m}`;
}
updateClock();
setInterval(updateClock, 10000);

/* ========== TABS ========== */
function switchTab(tab, btn) {
  document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.remove('active');
    b.classList.add('text-slate-400');
  });
  btn.classList.add('active');
  btn.classList.remove('text-slate-400');
  document.getElementById('content').scrollTop = 0;
}

/* ========== TOAST ========== */
let toastTimer;
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toastIcon');
  document.getElementById('toastMsg').textContent = msg;
  const icons = {
    success: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="3"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    info: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="3"><path d="M12 16v-4M12 8h.01" stroke-linecap="round"/><circle cx="12" cy="12" r="10"/></svg>',
    copy: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>'
  };
  icon.innerHTML = icons[type] || icons.success;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

/* ========== WEEK CALENDAR (Treino) ========== */
const weekDays = [
  { d: 'S', done: true },
  { d: 'T', done: true },
  { d: 'Q', done: true },
  { d: 'Q', done: false, today: true },
  { d: 'S', done: false },
  { d: 'S', done: false, weekend: true },
  { d: 'D', done: false, weekend: true }
];
function renderWeekCalendar() {
  const el = document.getElementById('weekCalendar');
  el.innerHTML = weekDays.map(day => {
    let inner, label;
    if (day.done) {
      inner = `<div class="w-9 h-9 rounded-full bg-menta flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;
    } else if (day.today) {
      inner = `<div class="w-9 h-9 rounded-full border-2 border-sereno border-dashed flex items-center justify-center">
        <div class="w-2 h-2 rounded-full bg-sereno"></div></div>`;
    } else {
      inner = `<div class="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
        <div class="w-1.5 h-1.5 rounded-full bg-slate-300"></div></div>`;
    }
    const color = day.today ? 'text-sereno font-bold' : (day.weekend ? 'text-slate-300' : 'text-slate-400');
    return `<div class="flex flex-col items-center gap-1.5 day-chip">
      <span class="text-[11px] font-semibold ${color}">${day.d}</span>${inner}</div>`;
  }).join('');
}
renderWeekCalendar();

/* ========== EVOLUTION CHART (Perfil) ========== */
const evoData = [
  { h: 42, c: 'from-sereno-light to-sereno' },
  { h: 55, c: 'from-sereno-light to-sereno' },
  { h: 68, c: 'from-violeta-light to-violeta' },
  { h: 80, c: 'from-violeta-light to-violeta' },
  { h: 90, c: 'from-menta-light to-menta' }
];
function renderEvoChart() {
  const el = document.getElementById('evoChart');
  el.innerHTML = evoData.map((bar, i) => `
    <div class="flex-1 flex flex-col items-center justify-end h-full">
      <span class="text-[10px] font-bold text-slate-500 mb-1">${bar.h}%</span>
      <div class="w-full rounded-t-lg bg-gradient-to-t ${bar.c}" style="height:0%;transition:height 0.7s ease ${i*0.1}s" data-h="${bar.h}"></div>
    </div>`).join('');
  // animate when perfil tab visible
}
renderEvoChart();

// Animate chart when profile tab is opened
const perfilObserver = new MutationObserver(() => {
  const perfil = document.getElementById('tab-perfil');
  if (perfil.classList.contains('active')) {
    setTimeout(() => {
      document.querySelectorAll('#evoChart [data-h]').forEach(b => {
        b.style.height = b.dataset.h + '%';
      });
    }, 100);
  } else {
    document.querySelectorAll('#evoChart [data-h]').forEach(b => b.style.height = '0%');
  }
});
perfilObserver.observe(document.getElementById('tab-perfil'), { attributes: true, attributeFilter: ['class'] });

/* ========== EXERCISE MODAL + TIMER ========== */
let timerInterval, recInterval;
function openExercise() {
  document.getElementById('exerciseOverlay').classList.add('open');
}
function closeExercise() {
  document.getElementById('exerciseOverlay').classList.remove('open');
  resetTimer();
  stopRecord();
}
let totalTime = 30, timeLeft = 30;
const ringLen = 490;
function startTimer() {
  const btn = document.getElementById('timerBtn');
  if (timerInterval) { // pause
    clearInterval(timerInterval);
    timerInterval = null;
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Continuar';
    return;
  }
  btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg> Pausar';
  const phases = ['Inspire...', 'Segure', 'Expire...', 'Relaxe'];
  timerInterval = setInterval(() => {
    timeLeft--;
    const m = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const s = String(timeLeft % 60).padStart(2, '0');
    document.getElementById('timerText').textContent = `${m}:${s}`;
    document.getElementById('timerRing').style.strokeDashoffset = ringLen * (1 - timeLeft / totalTime);
    // cycle breathing phase every ~4s
    const phaseIdx = Math.floor((totalTime - timeLeft) / 3) % phases.length;
    document.getElementById('timerPhase').textContent = phases[phaseIdx];
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      finishExercise();
    }
  }, 1000);
}
function finishExercise() {
  document.getElementById('timerText').textContent = '✓';
  document.getElementById('timerPhase').textContent = 'Concluído!';
  document.getElementById('timerRing').style.stroke = '#10B981';
  document.getElementById('timerBtn').innerHTML =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg> Treino concluído';
  // mark today as done
  const todayIdx = weekDays.findIndex(d => d.today);
  if (todayIdx >= 0) {
    weekDays[todayIdx].done = true;
    weekDays[todayIdx].today = false;
    renderWeekCalendar();
    updateWeekProgress(4, 5);
  }
  setTimeout(() => {
    closeExercise();
    showToast('Treino do dia registrado! 🎉', 'success');
  }, 1400);
}
function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timeLeft = totalTime;
  document.getElementById('timerText').textContent = '00:30';
  document.getElementById('timerPhase').textContent = 'Preparar';
  document.getElementById('timerRing').style.strokeDashoffset = '0';
  document.getElementById('timerRing').style.stroke = '#8B5CF6';
  document.getElementById('timerBtn').innerHTML =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Começar prática';
}
function updateWeekProgress(done, total) {
  const ring = document.getElementById('weekRing');
  const circ = 182.2;
  ring.style.strokeDashoffset = circ * (1 - done / total);
  document.getElementById('weekCount').textContent = `${done}/${total}`;
  const bar = document.getElementById('weekBar');
  if (bar) bar.style.width = (done / total * 100) + '%';
  const label = document.getElementById('weekLabel');
  if (label) label.textContent = `${done} de ${total} dias de treino concluídos. ${done === total ? 'Meta batida! 🎉' : 'Falta pouco!'}`;
}

/* ========== RECORD (simulated) ========== */
let recording = false, recSeconds = 0;
function toggleRecord(btn) {
  if (!recording) {
    recording = true;
    recSeconds = 0;
    btn.classList.add('pulse-rec');
    btn.classList.remove('bg-slate-800');
    btn.classList.add('bg-red-500');
    document.getElementById('recLabel').textContent = 'Gravando 00:00';
    document.getElementById('recDot').classList.add('animate-ping');
    recInterval = setInterval(() => {
      recSeconds++;
      const s = String(recSeconds % 60).padStart(2, '0');
      const m = String(Math.floor(recSeconds / 60)).padStart(2, '0');
      document.getElementById('recLabel').textContent = `Gravando ${m}:${s}`;
    }, 1000);
  } else {
    stopRecord();
    showToast('Áudio enviado à fonoaudióloga 🎤', 'info');
  }
}
function stopRecord() {
  if (!recording) return;
  recording = false;
  clearInterval(recInterval);
  const btn = document.getElementById('recordBtn');
  btn.classList.remove('pulse-rec', 'bg-red-500');
  btn.classList.add('bg-slate-800');
  document.getElementById('recDot').classList.remove('animate-ping');
  document.getElementById('recLabel').textContent = 'Gravar minha dicção';
}

/* ========== AGENDA ========== */
function confirmPresence(btn) {
  btn.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg> Presença Confirmada';
  btn.classList.remove('bg-white', 'text-sereno-dark');
  btn.classList.add('bg-menta', 'text-white');
  btn.disabled = true;
  showToast('Presença confirmada para 08/08 ✓', 'success');
}

/* ========== SCHEDULER ========== */
const schedDays = [
  { label: 'Seg', num: '11' },
  { label: 'Ter', num: '12' },
  { label: 'Qua', num: '13' },
  { label: 'Qui', num: '14' },
  { label: 'Sex', num: '15' }
];
const slotsByDay = {
  '11': ['09:00', '10:30', '14:00'],
  '12': ['08:30', '11:00', '15:30', '16:30'],
  '13': ['10:00', '13:30'],
  '14': ['09:30', '11:30', '14:30', '17:00'],
  '15': ['08:00', '10:00', '15:00']
};
let selectedDay = null, selectedSlot = null;

function openScheduler() {
  document.getElementById('schedulerOverlay').classList.add('open');
  renderDaySelector();
  document.getElementById('slotGrid').innerHTML = '<p class="col-span-3 text-slate-300 text-[13px] text-center py-4">Selecione um dia acima</p>';
  resetScheduleBtn();
}
function closeScheduler() {
  document.getElementById('schedulerOverlay').classList.remove('open');
  selectedDay = null; selectedSlot = null;
}
function renderDaySelector() {
  document.getElementById('daySelector').innerHTML = schedDays.map(day => `
    <button onclick="selectDay('${day.num}', this)" class="day-select flex-1 flex flex-col items-center py-2.5 rounded-2xl border-2 border-slate-100 bg-white transition">
      <span class="text-[11px] font-semibold text-slate-400">${day.label}</span>
      <span class="text-[16px] font-extrabold text-slate-700 mt-0.5">${day.num}</span>
    </button>`).join('');
}
function selectDay(num, btn) {
  selectedDay = num; selectedSlot = null;
  document.querySelectorAll('.day-select').forEach(b => {
    b.classList.remove('border-sereno', 'bg-sereno/5');
    b.classList.add('border-slate-100');
  });
  btn.classList.add('border-sereno', 'bg-sereno/5');
  btn.classList.remove('border-slate-100');
  renderSlots(num);
  resetScheduleBtn();
}
function renderSlots(num) {
  const slots = slotsByDay[num] || [];
  document.getElementById('slotGrid').innerHTML = slots.map(slot => `
    <button onclick="selectSlot('${slot}', this)" class="slot-btn py-2.5 rounded-xl border-2 border-slate-100 text-slate-600 font-semibold text-[13px] transition active:scale-95">
      ${slot}</button>`).join('');
}
function selectSlot(slot, btn) {
  selectedSlot = slot;
  document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  const confirmBtn = document.getElementById('confirmSchedule');
  confirmBtn.disabled = false;
  confirmBtn.classList.remove('bg-slate-200', 'text-slate-400');
  confirmBtn.classList.add('bg-sereno', 'text-white', 'shadow-md', 'shadow-sereno/30');
  confirmBtn.textContent = `Confirmar dia ${selectedDay} às ${slot}`;
}
function resetScheduleBtn() {
  const btn = document.getElementById('confirmSchedule');
  btn.disabled = true;
  btn.classList.add('bg-slate-200', 'text-slate-400');
  btn.classList.remove('bg-sereno', 'text-white', 'shadow-md', 'shadow-sereno/30');
  btn.textContent = 'Selecione um horário';
}
function confirmSchedule() {
  const d = selectedDay, s = selectedSlot;
  closeScheduler();
  showToast(`Consulta agendada: ${d}/08 às ${s} ✓`, 'success');
}

/* ========== FINANCEIRO ========== */
function markPaid() {
  document.getElementById('invoiceTag').textContent = 'PAGO';
  document.getElementById('invoiceTag').classList.remove('bg-amber-100', 'text-amber-700');
  document.getElementById('invoiceTag').classList.add('bg-menta/15', 'text-menta-dark');
  document.getElementById('payButtons').classList.add('hidden');
  document.getElementById('paidState').classList.remove('hidden');
}
function payPix() {
  document.getElementById('pixOverlay').classList.add('open');
  renderQR();
}
function closePix() { document.getElementById('pixOverlay').classList.remove('open'); }
function copyPix() {
  const btn = document.getElementById('copyPixBtn');
  btn.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg> Código copiado!';
  showToast('Código Pix copiado', 'copy');
  setTimeout(() => {
    btn.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke-linecap="round"/></svg> Copiar código Pix';
  }, 2000);
}
function simulatePixPaid() {
  closePix();
  markPaid();
  showToast('Pagamento Pix confirmado! ✓', 'success');
}
function payCard() { document.getElementById('cardOverlay').classList.add('open'); }
function closeCard() { document.getElementById('cardOverlay').classList.remove('open'); }
function simulateCardPaid() {
  const btn = document.getElementById('cardPayBtn');
  btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#fff" stroke-width="3" stroke-dasharray="40" stroke-linecap="round" opacity="0.4"/></svg> Processando...';
  btn.style.animation = 'none';
  setTimeout(() => {
    closeCard();
    markPaid();
    showToast('Pagamento aprovado! ✓', 'success');
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20" stroke-linecap="round"/></svg> Pagar R$ 720,00';
  }, 1600);
}
function downloadReceipt(month) {
  showToast(`Recibo de ${month} baixado (PDF)`, 'info');
}
function renderQR() {
  const qr = document.getElementById('qrCode');
  if (qr.children.length) return;
  const pattern = [
    1,1,1,0,1,1,1,0, 1,0,0,1,0,0,1,0, 1,0,1,1,1,0,1,0, 1,0,0,0,1,1,0,0,
    0,1,1,0,0,1,0,1, 1,0,1,1,0,0,1,0, 1,1,0,0,1,1,0,1, 0,1,0,1,0,1,1,0
  ];
  qr.innerHTML = pattern.map(v =>
    `<div class="${v ? 'bg-slate-800' : 'bg-white'} rounded-[1px]"></div>`).join('');
}

/* ========== PROFILE ========== */
function whatsapp() {
  showToast('Abrindo WhatsApp da clínica...', 'info');
}