import { api, isDemo, errorMessage } from './api.js';
import { PROFILES, METRICS, MEANINGS, EFFORT_LABELS, NUTRITION, GROUPS, GYM_GOAL_PER_MONTH } from './data.js';
import { icon } from './icons.js';
import { burst, haptic, pop, popSuccess, isMuted, setMuted } from './fx.js';

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
  el.innerHTML = `${icon('alert', 16)}<span>${esc(msg)}</span>`;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

function flashOk(el, text) {
  if (el) el.innerHTML = `${icon('check', 14)}<span>${esc(text)}</span>`;
}

function centerOf(el) {
  const r = el.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 2];
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
        <span class="ex-title">
          <span class="ex-name">${esc(ex.name)}</span>
          <span class="ex-sub"><span class="effort ${ex.effort}">${EFFORT_LABELS[ex.effort]}</span><span class="ex-reps">${esc(ex.reps)}</span></span>
        </span>
        <span class="chev">${icon('chevron-down', 18)}</span>
      </button>
      <div class="ex-body"><div class="ex-clip"><div class="ex-content">
        <div class="tech-text">${esc(ex.tech)}</div>
        <div class="mistakes">
          <div class="m-title">${icon('alert', 15)}Erros comuns</div>
          <ul>${ex.mistakes.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
        </div>
        <div class="log-box">
          <div class="log-title">${icon('pencil', 15)}Registar sessão de hoje</div>
          <div class="log-inputs">
            <input type="number" inputmode="decimal" min="0" step="any" placeholder="Séries" aria-label="Séries" data-log="sets">
            <input type="number" inputmode="decimal" min="0" step="any" placeholder="Reps" aria-label="Repetições" data-log="reps">
            <input type="number" inputmode="decimal" min="0" step="any" placeholder="Peso" aria-label="Peso em kg" data-log="weight">
          </div>
          <button class="log-save" data-action="save-log" data-ex="${esc(ex.name)}">Guardar</button>
          <div class="saved-flash" data-flash></div>
          ${history.length ? `<div class="log-history">${history.map((l) =>
            `<div class="log-entry"><span>${fmtDate(l.date)}</span><b>${num(l.sets)}x${num(l.reps)} · ${num(l.weight)}kg</b></div>`).join('')}</div>` : ''}
        </div>
      </div></div></div>
    </div>`;
  }).join('');

  let comboHtml = '';
  if (group.combo) {
    comboHtml = `
    <div class="card mint">
      <div class="card-title-row">${icon('target', 16)}Para fechar este treino</div>
      <div class="combo-text"><b>${esc(group.combo.cardio[state.profile])}</b> + <b>${esc(group.combo.abs)}</b><br>${esc(group.combo.why)}</div>
    </div>`;
  }

  pageEl.innerHTML = `<div class="groups">${groupsHtml}</div>${exercisesHtml}${comboHtml}`;
}

function toggleExercise(head) {
  const card = head.closest('.exercise');
  const wasOpen = card.classList.contains('open');
  pageEl.querySelectorAll('.exercise.open').forEach((c) => {
    c.classList.remove('open');
    c.querySelector('.ex-head').setAttribute('aria-expanded', 'false');
  });
  if (wasOpen) { state.openExercise = null; return; }
  card.classList.add('open');
  head.setAttribute('aria-expanded', 'true');
  state.openExercise = head.dataset.ex;
  setTimeout(() => card.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 120);
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
  const [cx, cy] = centerOf(btn);
  try {
    await api.addLog(state.profile, state.pin, entry);
    state.data.logs.unshift(entry);
    render();
    flashOk(pageEl.querySelector('.exercise.open [data-flash]'), 'Guardado!');
    burst(cx, cy);
    popSuccess();
    haptic([12, 40, 12]);
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
  const w = 500, h = 180, padX = 34, padTop = 26, padBottom = 32;
  const vals = pts.map((p) => p.v);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const stepX = (w - padX * 2) / (pts.length - 1);
  const xy = pts.map((p, i) => [padX + i * stepX, h - padBottom - ((p.v - min) / range) * (h - padTop - padBottom)]);
  const path = xy.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${path} L${xy[xy.length - 1][0].toFixed(1)},${h - padBottom} L${xy[0][0].toFixed(1)},${h - padBottom} Z`;
  const dots = xy.map((p, i) => `<circle class="chart-dot" style="--i:${i}" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="5" fill="#B5798E" stroke="#FFFDFB" stroke-width="2.5"><title>${fmtDate(pts[i].date)}: ${pts[i].v}${unit}</title></circle>`).join('');
  const label = (x, y, text, anchor) => `<text class="chart-axis" x="${x}" y="${y}" text-anchor="${anchor}">${esc(text)}</text>`;
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;overflow:visible" role="img" aria-label="Evolução de ${esc(metricDef(key)[1])}">
    <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F5C6D8" stop-opacity=".85"/><stop offset="1" stop-color="#F5C6D8" stop-opacity="0"/></linearGradient></defs>
    <path class="chart-area" d="${area}" fill="url(#cg)"/>
    <path class="chart-line" pathLength="1" d="${path}" fill="none" stroke="#B5798E" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
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
  const paragraphs = lines.map((l) => `<p>${esc(l)}</p>`);
  if (entries.length > 1) {
    const diff = (k, u) => {
      if (first[k] == null || last[k] == null) return null;
      const d = Math.round((last[k] - first[k]) * 100) / 100;
      return `${metricDef(k)[1].toLowerCase()} ${d > 0 ? '+' : ''}${d}${u}`;
    };
    const parts = [diff('weight', 'kg'), diff('body_fat', '%'), diff('muscle', 'kg')].filter(Boolean);
    if (parts.length) paragraphs.push(`<p class="opinion-trend">${icon('trend', 16)}<span>Desde ${fmtDate(first.date)}: ${esc(parts.join(' · '))}.</span></p>`);
  }
  return paragraphs.join('');
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
      <div class="chip-row">
        <span class="goal-chip">${icon('target', 15)}${esc(PROFILES[state.profile].goal)}</span>
        <button class="meaning-toggle" data-action="toggle-meanings">${icon('info', 15)}${state.showMeanings ? 'Fechar significados' : 'O que significa cada medição?'}</button>
      </div>
      ${state.showMeanings ? `<div class="meaning-box">${MEANINGS.map(([k, v]) => `<div class="m-item"><b>${k}:</b> ${v}</div>`).join('')}</div>` : ''}
      <div class="opinion-box">
        <div class="o-title">${icon('message', 16)}A nossa opinião</div>
        ${buildOpinion(entries)}
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
  const [cx, cy] = centerOf(btn);
  try {
    await api.addMeasurement(state.profile, state.pin, entry);
    const list = state.data.measurements.filter((m) => m.date !== date).concat(entry);
    list.sort((a, b) => a.date.localeCompare(b.date));
    state.data.measurements = list;
    render();
    flashOk($('m-flash'), 'Medição guardada!');
    burst(cx, cy, 44);
    popSuccess();
    haptic([12, 40, 12]);
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
      <p class="diet-note">${esc(n.note)}</p>
      ${Object.entries(n.meals).map(([title, items], i) => `
        <div class="meal-block" style="--n:${i}">
          <div class="meal-title">${esc(title)}</div>
          <ul>${items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul>
        </div>`).join('')}
    </div>`;
}

// ---------- Calendário ----------
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function monthCount() {
  const prefix = `${state.calMonth.getFullYear()}-${pad2(state.calMonth.getMonth() + 1)}`;
  let n = 0;
  for (const d of state.data.gymDays) if (d.startsWith(prefix)) n++;
  return n;
}
const ringOffset = (n) => 100 - Math.min(n / GYM_GOAL_PER_MONTH, 1) * 100;

function paintCalSummary(bump) {
  const n = monthCount();
  const label = $('cal-count');
  if (!label) return;
  label.textContent = `${n} ida${n !== 1 ? 's' : ''} ao ginásio este mês`;
  const numEl = $('ring-num');
  numEl.textContent = n;
  if (bump) { numEl.classList.remove('bump'); void numEl.offsetWidth; numEl.classList.add('bump'); }
  $('ring-fg').style.strokeDashoffset = ringOffset(n);
}

function paintDay(iso, on, celebrate) {
  const b = pageEl.querySelector(`.cal-day[data-date="${iso}"]`);
  if (!b) return;
  b.classList.toggle('done', on);
  b.setAttribute('aria-pressed', String(on));
  b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
  if (on && celebrate) { const [cx, cy] = centerOf(b); burst(cx, cy, 26); }
}

function renderCalendario() {
  const year = state.calMonth.getFullYear(), month = state.calMonth.getMonth();
  const startDow = (new Date(year, month, 1).getDay() + 6) % 7; // semana começa à segunda
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = isoDate(new Date());
  const count = monthCount();

  let cells = '<div class="cal-day empty"></div>'.repeat(startDow);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${pad2(month + 1)}-${pad2(d)}`;
    const done = state.data.gymDays.has(iso);
    cells += `<button class="cal-day${done ? ' done' : ''}${iso === today ? ' today' : ''}" data-action="toggle-day" data-date="${iso}" aria-pressed="${done}">${d}</button>`;
  }

  pageEl.innerHTML = `
    <div class="card">
      <div class="cal-summary">
        <div class="ring">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle class="ring-bg" cx="50" cy="50" r="42"/>
            <circle class="ring-fg" id="ring-fg" cx="50" cy="50" r="42" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${ringOffset(count)}"/>
          </svg>
          <div class="ring-num" id="ring-num">${count}</div>
        </div>
        <div>
          <div class="cal-count" id="cal-count">${count} ida${count !== 1 ? 's' : ''} ao ginásio este mês</div>
          <div class="cal-goal">Meta: ${GYM_GOAL_PER_MONTH} idas por mês</div>
        </div>
      </div>
      <div class="cal-header">
        <button data-action="cal-prev" aria-label="Mês anterior">${icon('chevron-left', 18)}</button>
        <div class="month-label">${MONTH_NAMES[month]} ${year}</div>
        <button data-action="cal-next" aria-label="Mês seguinte">${icon('chevron-right', 18)}</button>
      </div>
      <div class="cal-grid">
        ${['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d) => `<div class="cal-dow">${d}</div>`).join('')}
        ${cells}
      </div>
    </div>`;
}

async function toggleDay(iso) {
  const had = state.data.gymDays.has(iso);
  const setDay = (on) => { if (on) state.data.gymDays.add(iso); else state.data.gymDays.delete(iso); };
  // atualização otimista, sem redesenhar a página (mantém as animações); reverte se falhar
  setDay(!had);
  paintDay(iso, !had, true);
  paintCalSummary(true);
  if (!had) { popSuccess(); haptic([10, 30, 10]); }
  try {
    const out = await api.toggleGymDay(state.profile, state.pin, iso);
    if (out.on !== !had) { // o servidor tinha o estado contrário
      setDay(out.on);
      paintDay(iso, out.on, false);
      paintCalSummary(false);
    }
  } catch (e) {
    setDay(had);
    paintDay(iso, had, false);
    paintCalSummary(false);
    toast(errorMessage(e.code));
  }
}

// ---------- navegação e eventos ----------
const PAGES = [
  ['treino', 'Treino', 'dumbbell'],
  ['medicao', 'Medição', 'activity'],
  ['alimentacao', 'Alimentação', 'leaf'],
  ['calendario', 'Calendário', 'calendar']
];

function renderNav() {
  const nav = $('nav');
  if (!nav.firstChild) {
    nav.innerHTML = '<div class="tab-indicator"></div>' + PAGES.map(([key, label, ic], i) =>
      `<button class="nav-btn" data-action="page" data-page="${key}" data-pitch="${(0.9 + i * 0.12).toFixed(2)}">${icon(ic, 22)}<span>${label}</span></button>`).join('');
  }
  const idx = PAGES.findIndex((p) => p[0] === state.page);
  nav.style.setProperty('--i', idx);
  nav.querySelectorAll('.nav-btn').forEach((b, i) => b.classList.toggle('active', i === idx));
}

const RENDERERS = { treino: renderTreino, medicao: renderMedicao, alimentacao: renderAlimentacao, calendario: renderCalendario };

function render(fresh = false) {
  renderNav();
  pageEl.classList.toggle('fresh', fresh);
  RENDERERS[state.page]();
  if (fresh) [...pageEl.children].forEach((el, i) => el.style.setProperty('--n', i));
}

function onClick(ev) {
  const el = ev.target.closest('[data-action]');
  if (!el) return;
  const d = el.dataset;
  switch (d.action) {
    case 'page':
      if (state.page === d.page) return;
      state.page = d.page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    case 'group': state.group = d.group; state.openExercise = null; break;
    case 'toggle-ex': toggleExercise(el); return;
    case 'metric': state.metric = d.metric; break;
    case 'toggle-meanings': state.showMeanings = !state.showMeanings; render(); return;
    case 'cal-prev': state.calMonth = new Date(state.calMonth.getFullYear(), state.calMonth.getMonth() - 1, 1); break;
    case 'cal-next': state.calMonth = new Date(state.calMonth.getFullYear(), state.calMonth.getMonth() + 1, 1); break;
    case 'toggle-day': toggleDay(d.date); return;
    case 'save-log': saveLog(el); return;
    case 'save-measurement': saveMeasurement(el); return;
    default: return;
  }
  render(true); // mudança de secção/grupo/métrica/mês: entrada animada
}

// ---------- splash / login ----------
const splashEl = $('splash');
const splashInner = $('splash-inner');
let pinCleanup = null;
let leaveTimer = 0;

function showChoices() {
  if (pinCleanup) pinCleanup();
  splashEl.classList.remove('pin-mode');
  splashInner.innerHTML = `<div class="splash-choices">${Object.entries(PROFILES).map(([key, p], i) =>
    `<button class="splash-choice rise" style="--n:${i + 1}" data-p="${key}">
       <span class="avatar big ${p.tone}">${esc(p.name[0])}</span>
       <span class="sc-name">${esc(p.name)}</span>
       <span class="sc-goal">${esc(p.tagline)}</span>
     </button>`).join('')}</div>`;
  splashInner.querySelectorAll('.splash-choice').forEach((el) => { el.onclick = () => showPin(el.dataset.p); });
}

function showPin(profileKey) {
  if (pinCleanup) pinCleanup();
  splashEl.classList.add('pin-mode');
  const p = PROFILES[profileKey];
  splashInner.innerHTML = `<div class="pin-box rise" id="pin-box">
    <div class="avatar big ${p.tone}">${esc(p.name[0])}</div>
    <div class="pin-title">Olá, ${esc(p.name)}</div>
    <div class="pin-sub">Escreve o teu código</div>
    <div class="pin-dots" id="pin-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    <div class="pin-error" id="pin-error" role="alert"></div>
    <div class="keypad">
      ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button class="key" type="button" data-k="${n}" data-pitch="${(0.85 + n * 0.06).toFixed(2)}">${n}</button>`).join('')}
      <span></span>
      <button class="key" type="button" data-k="0" data-pitch="0.85">0</button>
      <button class="key ghost" type="button" data-k="back" aria-label="Apagar">${icon('delete', 22)}</button>
    </div>
    <button class="pin-back" id="pin-back" type="button">${icon('chevron-left', 14)}Voltar</button>
  </div>`;

  const box = $('pin-box');
  const dots = [...splashInner.querySelectorAll('#pin-dots i')];
  let pin = '';
  let busy = false;
  const paint = () => dots.forEach((dot, i) => dot.classList.toggle('on', i < pin.length));

  async function submit() {
    busy = true;
    $('pin-error').textContent = 'A verificar…';
    try {
      await api.login(profileKey, pin);
      cleanup();
      await startSession(profileKey, pin);
    } catch (e) {
      $('pin-error').textContent = errorMessage(e.code);
      box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
      pop(0.55);
      haptic([30, 40, 30]);
      pin = '';
      paint();
    }
    busy = false;
  }

  async function press(k) {
    if (busy) return;
    if (k === 'back') pin = pin.slice(0, -1);
    else if (pin.length < 4) pin += k;
    paint();
    if (pin.length === 4) await submit();
  }

  const onKey = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^\d$/.test(e.key)) { pop(0.85 + Number(e.key) * 0.06); press(e.key); }
    else if (e.key === 'Backspace') { pop(0.8); press('back'); }
  };
  function cleanup() { document.removeEventListener('keydown', onKey); pinCleanup = null; }
  pinCleanup = cleanup;
  document.addEventListener('keydown', onKey);

  splashInner.querySelectorAll('.key').forEach((b) => { b.onclick = () => press(b.dataset.k); });
  $('pin-back').onclick = () => { cleanup(); showChoices(); };
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 20 ? 'Boa tarde' : 'Boa noite';
}

async function startSession(profileKey, pin) {
  const out = await api.getData(profileKey, pin);
  const p = PROFILES[profileKey];
  state.profile = profileKey;
  state.pin = pin;
  applyData(out);
  Object.assign(state, { page: 'treino', group: 'gluteo', metric: 'weight', openExercise: null, showMeanings: false, calMonth: startOfMonth(new Date()) });
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ profileKey, pin })); } catch { /* ignora */ }

  $('avatar').className = `avatar ${p.tone}`;
  $('avatar').textContent = p.name[0];
  $('header-eyebrow').textContent = `${greeting()}, ${p.name}`;
  $('demo-banner').innerHTML = `${icon('alert', 16)}<span>Modo demo: os dados ficam só neste dispositivo. Liga o Supabase (ver README) para os guardar online.</span>`;
  $('demo-banner').hidden = !isDemo;
  $('app').hidden = false;
  render(true);
  window.scrollTo(0, 0);

  splashEl.classList.add('leaving');
  clearTimeout(leaveTimer);
  leaveTimer = setTimeout(() => { splashEl.hidden = true; splashEl.classList.remove('leaving'); }, 520);
}

function logout() {
  state.profile = null;
  state.pin = null;
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignora */ }
  clearTimeout(leaveTimer);
  $('app').hidden = true;
  splashEl.classList.remove('leaving');
  splashEl.hidden = false;
  showChoices();
}

// ---------- som ----------
function paintSound() {
  const b = $('sound-toggle');
  b.innerHTML = icon(isMuted() ? 'volume-off' : 'volume-on', 20);
  b.setAttribute('aria-pressed', String(!isMuted()));
  b.title = isMuted() ? 'Som desligado' : 'Som ligado';
}

// ---------- arranque ----------
pageEl.addEventListener('click', onClick);
$('nav').addEventListener('click', onClick);
$('logout-link').innerHTML = icon('logout', 20);
$('logout-link').addEventListener('click', logout);
$('sound-toggle').addEventListener('click', () => {
  setMuted(!isMuted());
  paintSound();
  if (!isMuted()) pop(1.3);
});
paintSound();

// "pop" em todos os botões (pointerdown = resposta imediata e desbloqueia o áudio no telemóvel)
document.addEventListener('pointerdown', (e) => {
  const b = e.target.closest('button');
  if (!b || b.disabled || b.id === 'sound-toggle') return;
  pop(Number(b.dataset.pitch) || 1);
  haptic(6);
}, { passive: true });

// o fundo mexe-se ligeiramente com o rato / dedo
addEventListener('pointermove', (e) => {
  const s = document.documentElement.style;
  s.setProperty('--mx', (e.clientX / innerWidth - 0.5).toFixed(3));
  s.setProperty('--my', (e.clientY / innerHeight - 0.5).toFixed(3));
}, { passive: true });

(async function init() {
  showChoices();
  // mantém a sessão ao recarregar a página (só enquanto o separador estiver aberto)
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (saved && PROFILES[saved.profileKey]) await startSession(saved.profileKey, saved.pin);
  } catch { logout(); }
})();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
