import { api, isDemo, errorMessage } from './api.js';
import { PROFILES, METRICS, MEANINGS, EFFORT_LABELS, NUTRITION, GROUPS } from './data.js';

// ---------- estado ----------
const state = {
  profile: null,
  pin: null,
  page: 'treino',
  group: 'gluteo',
  metric: 'weight',
  openExercise: null,
  showMeanings: false,
  calMonth: startOfMonth(new Date()),
  data: { measurements: [], logs: [], gymDays: new Set() }
};

const SESSION_KEY = 'plano-treino-session';

// ---------- helpers ----------
const $ = (id) => document.getElementById(id);
const pageEl = $('page-content');

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function pad2(n) { return String(n).padStart(2, '0'); }
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function isoDate(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; } // data local, não UTC
function fmtDate(iso) { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; }
function num(v) { return v === null || v === undefined ? '–' : Number(v); }
function metricDef(key) { return METRICS.find((m) => m[0] === key); }

let toastTimer;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

function applyData(out) {
  state.data.measurements = out.measurements;
  state.data.logs = out.logs;
  state.data.gymDays = new Set(out.gym_days);
}

// ---------- Treino ----------
function renderTreino() {
  const group = GROUPS[state.group];
  const groupsHtml = Object.entries(GROUPS).map(([key, g]) =>
    `<button class="group-btn${state.group === key ? ' active' : ''}" data-action="group" data-group="${key}">${g.label}</button>`).join('');

  const exercisesHtml = group.exercises.map((ex) => {
    const open = state.openExercise === ex.name;
    const history = state.data.logs.filter((l) => l.exercise === ex.name).slice(0, 4);
    return `
    <div class="exercise${open ? ' open' : ''}">
      <button class="ex-head" data-action="toggle-ex" data-ex="${esc(ex.name)}" aria-expanded="${open}">
        <span class="ex-name">${esc(ex.name)}</span>
        <span class="effort ${ex.effort}">${EFFORT_LABELS[ex.effort]}</span>
      </button>
      <div class="ex-body"><div class="ex-body-inner">
        <div class="reps-text">${esc(ex.reps)}</div>
        <div class="tech-text">${esc(ex.tech)}</div>
        <div class="mistakes">
          <div class="m-title">⚠️ Erros comuns</div>
          <ul>${ex.mistakes.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
        </div>
        <div class="log-box">
          <div class="log-title">📝 Registar sessão de hoje</div>
          <div class="log-inputs">
            <input type="number" inputmode="decimal" min="0" step="any" placeholder="Séries" aria-label="Séries" data-log="sets">
            <input type="number" inputmode="decimal" min="0" step="any" placeholder="Reps" aria-label="Repetições" data-log="reps">
            <input type="number" inputmode="decimal" min="0" step="any" placeholder="Peso (kg)" aria-label="Peso em kg" data-log="weight">
          </div>
          <button class="log-save" data-action="save-log" data-ex="${esc(ex.name)}">Guardar</button>
          <div class="saved-flash" data-flash></div>
          ${history.length ? `<div class="log-history">${history.map((l) =>
            `<div class="log-entry"><span>${fmtDate(l.date)}</span><b>${num(l.sets)}x${num(l.reps)} · ${num(l.weight)}kg</b></div>`).join('')}</div>` : ''}
        </div>
      </div></div>
    </div>`;
  }).join('');

  let comboHtml = '';
  if (group.combo) {
    comboHtml = `
    <div class="card mint">
      <div style="font-family:'Baloo 2',sans-serif;font-weight:700;font-size:13px;color:#2E6E56;margin-bottom:6px;">🎯 Para fechar este treino</div>
      <div style="font-size:13px;color:#3C6656;line-height:1.55;"><b>${esc(group.combo.cardio[state.profile])}</b> + <b>${esc(group.combo.abs)}</b><br>${esc(group.combo.why)}</div>
    </div>`;
  }

  pageEl.innerHTML = `<div class="groups">${groupsHtml}</div>${exercisesHtml}${comboHtml}`;
}

async function saveLog(btn) {
  const box = btn.closest('.log-box');
  const [sets, reps, weight] = ['sets', 'reps', 'weight'].map((k) => box.querySelector(`[data-log="${k}"]`).value);
  if (sets === '' || reps === '' || weight === '' || [sets, reps, weight].some((v) => Number(v) < 0)) {
    box.querySelector('[data-flash]').textContent = 'Preenche séries, reps e peso.';
    return;
  }
  const entry = { exercise: btn.dataset.ex, date: isoDate(new Date()), sets: Number(sets), reps: Number(reps), weight: Number(weight) };
  btn.disabled = true;
  try {
    await api.addLog(state.profile, state.pin, entry);
    state.data.logs.unshift(entry);
    render();
    const flash = pageEl.querySelector(`.exercise.open [data-flash]`);
    if (flash) flash.textContent = '✅ Guardado!';
  } catch (e) {
    btn.disabled = false;
    toast(errorMessage(e.code));
  }
}

// ---------- Medição corporal ----------
function lastMeasurement() { return state.data.measurements[state.data.measurements.length - 1]; }

function renderChart(entries, key) {
  const pts = entries.filter((e) => e[key] !== null && e[key] !== undefined).map((e) => ({ date: e.date, v: Number(e[key]) }));
  if (pts.length < 2) return '<div class="chart-empty">Adiciona mais medições para veres a evolução desta métrica.</div>';
  const [, , unit] = metricDef(key);
  const w = 500, h = 170, padX = 34, padTop = 22, padBottom = 30;
  const vals = pts.map((p) => p.v);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const stepX = (w - padX * 2) / (pts.length - 1);
  const xy = pts.map((p, i) => [padX + i * stepX, h - padBottom - ((p.v - min) / range) * (h - padTop - padBottom)]);
  const path = xy.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const dots = xy.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4" fill="#B5798E"><title>${fmtDate(pts[i].date)}: ${pts[i].v}${unit}</title></circle>`).join('');
  const label = (x, y, text, anchor) => `<text class="chart-axis" x="${x}" y="${y}" text-anchor="${anchor}">${esc(text)}</text>`;
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;" role="img" aria-label="Evolução de ${esc(metricDef(key)[1])}">
    <path d="${path}" fill="none" stroke="#B5798E" stroke-width="2.5" stroke-linejoin="round"/>
    ${dots}
    ${label(padX, 14, `mín ${min}${unit} · máx ${max}${unit}`, 'start')}
    ${label(padX, h - 6, fmtDate(pts[0].date), 'start')}
    ${label(w - padX, h - 6, fmtDate(pts[pts.length - 1].date), 'end')}
  </svg>`;
}

function buildOpinion(entries) {
  const last = entries[entries.length - 1];
  const first = entries[0];
  const lines = [];
  if (state.profile === 'mariana') {
    lines.push(`Com BMI de ${num(last.bmi)} e ${num(last.body_fat)}% de gordura corporal, o teu corpo já está numa zona magra e saudável — o foco não deve ser perder peso, mas sim ganhar massa muscular de forma controlada.`);
    if (last.visceral <= 3) lines.push('A gordura visceral está num valor ótimo, sem preocupação nessa área.');
    lines.push('Como a água corporal e a massa muscular já são boas, a prioridade é sobrecarga progressiva nos treinos e proteína suficiente em todas as refeições.');
  } else {
    lines.push(`Com BMI de ${num(last.bmi)} e ${num(last.body_fat)}% de gordura corporal, há espaço para reduzir gordura de forma gradual, mantendo (ou até ganhando) massa muscular ao mesmo tempo.`);
    if (last.visceral >= 9) lines.push(`A gordura visceral está num valor a vigiar (${num(last.visceral)}) — vale a pena focar em cardio regular e reduzir ligeiramente as calorias, sem cortes drásticos.`);
    else lines.push(`A gordura visceral está em ${num(last.visceral)}, abaixo do limite de atenção — continua com o cardio regular.`);
    lines.push('A água corporal está um pouco mais baixa, o que é comum com percentagem de gordura mais elevada — tende a subir à medida que a massa magra aumenta em proporção.');
  }
  if (entries.length > 1) {
    const diff = (k, u) => {
      if (first[k] == null || last[k] == null) return null;
      const d = Math.round((last[k] - first[k]) * 100) / 100;
      return `${METRICS.find((m) => m[0] === k)[1].toLowerCase()} ${d > 0 ? '+' : ''}${d}${u}`;
    };
    const parts = [diff('weight', 'kg'), diff('body_fat', '%'), diff('muscle', 'kg')].filter(Boolean);
    if (parts.length) lines.push(`📈 Desde ${fmtDate(first.date)}: ${parts.join(' · ')}.`);
  }
  return lines;
}

function renderMedicao() {
  const entries = state.data.measurements;
  const last = lastMeasurement();
  if (!last) { pageEl.innerHTML = '<div class="card">Sem medições ainda.</div>'; return; }
  const [, , activeUnit] = metricDef(state.metric);

  pageEl.innerHTML = `
    <div class="card">
      <h2>Medição Corporal</h2>
      <div class="stats-sub">Última medição: ${fmtDate(last.date)}</div>
      <div class="stats-grid">${METRICS.map(([key, label, unit]) => `<div class="stat"><span>${label}</span><b>${num(last[key])}${unit}</b></div>`).join('')}</div>
      <span class="goal-chip">${PROFILES[state.profile].goal}</span>
      <button class="meaning-toggle" data-action="toggle-meanings">${state.showMeanings ? 'Fechar significados' : 'O que significa cada medição?'}</button>
      ${state.showMeanings ? `<div class="meaning-box">${MEANINGS.map(([k, v]) => `<div class="m-item"><b>${k}:</b> ${v}</div>`).join('')}</div>` : ''}
      <div class="opinion-box">
        <div class="o-title">💬 A nossa opinião</div>
        ${buildOpinion(entries).map((l) => `<p>${esc(l)}</p>`).join('')}
      </div>
    </div>

    <div class="card">
      <h2>Evolução</h2>
      <div class="metric-select">${METRICS.map(([key, label]) => `<button class="metric-btn${state.metric === key ? ' active' : ''}" data-action="metric" data-metric="${key}">${label}</button>`).join('')}</div>
      <div class="chart-wrap">${renderChart(entries, state.metric)}</div>
      <div class="hist-list">${entries.slice().reverse().map((e) => `<div class="hist-row"><span>${fmtDate(e.date)}</span><b>${num(e[state.metric])}${activeUnit}</b></div>`).join('')}</div>
    </div>

    <div class="card">
      <h2>Adicionar nova medição</h2>
      <div class="form-row">
        <div class="field"><label for="m-date">Data</label><input type="date" id="m-date" value="${isoDate(new Date())}"></div>
      </div>
      <div class="form-row">
        ${METRICS.map(([key, label, unit]) => `<div class="field"><label for="m-${key}">${label} (${unit || 'nº'})</label><input type="number" inputmode="decimal" step="any" min="0" id="m-${key}" placeholder="${num(last[key])}"></div>`).join('')}
      </div>
      <button class="save-btn" data-action="save-measurement">Guardar medição</button>
      <div class="saved-flash" id="m-flash"></div>
    </div>`;
}

async function saveMeasurement(btn) {
  const date = $('m-date').value;
  if (!date) { $('m-flash').textContent = 'Escolhe uma data.'; return; }
  const last = lastMeasurement();
  const entry = { date };
  for (const [key] of METRICS) {
    const raw = $(`m-${key}`).value;
    if (raw !== '' && Number(raw) < 0) { $('m-flash').textContent = 'Os valores não podem ser negativos.'; return; }
    entry[key] = raw !== '' ? Number(raw) : last[key]; // campos vazios herdam a última medição
  }
  btn.disabled = true;
  try {
    await api.addMeasurement(state.profile, state.pin, entry);
    const list = state.data.measurements.filter((m) => m.date !== date).concat(entry);
    list.sort((a, b) => a.date.localeCompare(b.date));
    state.data.measurements = list;
    render();
    $('m-flash').textContent = '✅ Medição guardada!';
  } catch (e) {
    btn.disabled = false;
    toast(errorMessage(e.code));
  }
}

// ---------- Alimentação ----------
function renderAlimentacao() {
  const n = NUTRITION[state.profile];
  pageEl.innerHTML = `
    <div class="card">
      <h2>Alimentação</h2>
      <p style="font-size:12.5px;color:#6B5A6B;line-height:1.6;margin-bottom:14px;">${esc(n.note)}</p>
      ${Object.entries(n.meals).map(([title, items]) => `
        <div class="meal-block">
          <div class="meal-title">${esc(title)}</div>
          <ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
        </div>`).join('')}
    </div>`;
}

// ---------- Calendário ----------
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function renderCalendario() {
  const year = state.calMonth.getFullYear(), month = state.calMonth.getMonth();
  const startDow = (new Date(year, month, 1).getDay() + 6) % 7; // semana começa à segunda
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = isoDate(new Date());

  let cells = '<div class="cal-day empty"></div>'.repeat(startDow);
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${pad2(month + 1)}-${pad2(d)}`;
    const done = state.data.gymDays.has(iso);
    if (done) count++;
    cells += `<button class="cal-day${done ? ' done' : ''}${iso === today ? ' today' : ''}" data-action="toggle-day" data-date="${iso}" aria-pressed="${done}">${d}</button>`;
  }

  pageEl.innerHTML = `
    <div class="card">
      <div class="cal-header">
        <button data-action="cal-prev" aria-label="Mês anterior">←</button>
        <div class="month-label">${MONTH_NAMES[month]} ${year}</div>
        <button data-action="cal-next" aria-label="Mês seguinte">→</button>
      </div>
      <div class="cal-grid">
        ${['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d) => `<div class="cal-dow">${d}</div>`).join('')}
        ${cells}
      </div>
      <div class="cal-count">🏋️ ${count} ida${count !== 1 ? 's' : ''} ao ginásio este mês</div>
    </div>`;
}

async function toggleDay(iso) {
  const had = state.data.gymDays.has(iso);
  // atualização otimista; reverte se falhar
  if (had) state.data.gymDays.delete(iso); else state.data.gymDays.add(iso);
  render();
  try {
    const out = await api.toggleGymDay(state.profile, state.pin, iso);
    if (out.on !== !had) { // o servidor tinha o estado contrário
      if (out.on) state.data.gymDays.add(iso); else state.data.gymDays.delete(iso);
      render();
    }
  } catch (e) {
    if (had) state.data.gymDays.add(iso); else state.data.gymDays.delete(iso);
    render();
    toast(errorMessage(e.code));
  }
}

// ---------- navegação e eventos ----------
const PAGES = [['treino', '💪 Treino'], ['medicao', '📏 Medição'], ['alimentacao', '🍽️ Alimentação'], ['calendario', '📅 Calendário']];

function renderNav() {
  $('nav').innerHTML = PAGES.map(([key, label]) =>
    `<button class="nav-btn${state.page === key ? ' active' : ''}" data-action="page" data-page="${key}">${label}</button>`).join('');
}

function render() {
  renderNav();
  ({ treino: renderTreino, medicao: renderMedicao, alimentacao: renderAlimentacao, calendario: renderCalendario })[state.page]();
}

function onClick(ev) {
  const el = ev.target.closest('[data-action]');
  if (!el) return;
  const d = el.dataset;
  switch (d.action) {
    case 'page': state.page = d.page; break;
    case 'group': state.group = d.group; state.openExercise = null; break;
    case 'toggle-ex': state.openExercise = state.openExercise === d.ex ? null : d.ex; break;
    case 'metric': state.metric = d.metric; break;
    case 'toggle-meanings': state.showMeanings = !state.showMeanings; break;
    case 'cal-prev': state.calMonth = new Date(state.calMonth.getFullYear(), state.calMonth.getMonth() - 1, 1); break;
    case 'cal-next': state.calMonth = new Date(state.calMonth.getFullYear(), state.calMonth.getMonth() + 1, 1); break;
    case 'toggle-day': toggleDay(d.date); return;
    case 'save-log': saveLog(el); return;
    case 'save-measurement': saveMeasurement(el); return;
    default: return;
  }
  render();
}

// ---------- splash / login ----------
const splashEl = $('splash');
const splashInner = $('splash-inner');

function showChoices() {
  splashInner.innerHTML = `<div class="splash-choices">${Object.entries(PROFILES).map(([key, p]) =>
    `<button class="splash-choice" data-p="${key}"><span class="emoji">${p.emoji}</span>${esc(p.name)}</button>`).join('')}</div>`;
  splashInner.querySelectorAll('.splash-choice').forEach((el) => { el.onclick = () => showPin(el.dataset.p); });
}

function showPin(profileKey) {
  splashInner.innerHTML = `<div class="pin-box">
    <div class="pin-title">Código de ${esc(PROFILES[profileKey].name)}</div>
    <input type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" id="pin-input" placeholder="••••" autocomplete="off" aria-label="Código de 4 dígitos">
    <div class="pin-error" id="pin-error" role="alert"></div>
    <button class="pin-back" id="pin-back" type="button">← Voltar</button>
  </div>`;
  const input = $('pin-input');
  input.focus();
  let busy = false;
  input.addEventListener('input', async () => {
    input.value = input.value.replace(/\D/g, '');
    if (input.value.length !== 4 || busy) return;
    busy = true;
    input.disabled = true;
    $('pin-error').textContent = 'A verificar…';
    try {
      await api.login(profileKey, input.value);
      await startSession(profileKey, input.value);
    } catch (e) {
      $('pin-error').textContent = errorMessage(e.code);
      input.disabled = false;
      input.value = '';
      input.focus();
    }
    busy = false;
  });
  $('pin-back').onclick = showChoices;
}

async function startSession(profileKey, pin) {
  const out = await api.getData(profileKey, pin);
  state.profile = profileKey;
  state.pin = pin;
  applyData(out);
  Object.assign(state, { page: 'treino', group: 'gluteo', metric: 'weight', openExercise: null, showMeanings: false, calMonth: startOfMonth(new Date()) });
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ profileKey, pin })); } catch { /* ignora */ }
  splashEl.hidden = true;
  $('app').hidden = false;
  $('demo-banner').hidden = !isDemo;
  $('header-eyebrow').textContent = `${PROFILES[profileKey].name} ★ Plano de Treino`;
  render();
  window.scrollTo(0, 0);
}

function logout() {
  state.profile = null;
  state.pin = null;
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignora */ }
  $('app').hidden = true;
  splashEl.hidden = false;
  showChoices();
}

// ---------- arranque ----------
pageEl.addEventListener('click', onClick);
$('nav').addEventListener('click', onClick);
$('logout-link').addEventListener('click', logout);

(async function init() {
  showChoices();
  // mantém a sessão ao recarregar a página (só enquanto o separador estiver aberto)
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (saved && PROFILES[saved.profileKey]) await startSession(saved.profileKey, saved.pin);
  } catch { logout(); }
})();
