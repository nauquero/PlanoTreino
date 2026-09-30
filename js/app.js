import { api, isDemo, errorMessage } from './api.js';
import { PROFILES, METRICS, MEANINGS, EFFORT_LABELS, NUTRITION, GROUPS, GYM_GOAL_PER_MONTH, REST, REST_REFERENCES } from './data.js';
import { icon } from './icons.js';
import { burst, haptic, pop, popSuccess, popDone, isMuted, setMuted } from './fx.js';
import { summarize, buildStory, MONTH_NAMES } from './progress.js';
import { createTimer } from './timer.js';

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
  selectedDay: null,
  editingLog: null,   // id do registo a corrigir
  editingMeas: null,  // data da medição a corrigir
  confirm: null,      // 'log:<id>' | 'meas:<data>' à espera de confirmação para apagar
  data: { measurements: [], logs: [], gymDays: new Set() }
};

// índice dos exercícios por nome (tipo de registo, unidades, etc.)
const EX = new Map();
for (const g of Object.values(GROUPS)) for (const ex of g.exercises) EX.set(ex.name, { ex, kind: ex.kind || g.kind });

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
function monthKeyOf(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`; }
function fmtDate(iso) { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; }
function num(v) { return v === null || v === undefined ? '–' : Number(v); }
function metricDef(key) { return METRICS.find((m) => m[0] === key); }
const fmtClock = (s) => `${Math.floor(s / 60)}:${pad2(s % 60)}`;

let toastTimer;
function toast(msg) {
  const el = $('toast');
  el.innerHTML = `${icon('alert', 16)}<span>${esc(msg)}</span>`;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3400);
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

async function refreshData() {
  applyData(await api.getData(state.profile, state.pin));
}

// ---------- Treino ----------
function fmtLog(l) {
  const info = EX.get(l.exercise);
  if (l.minutes !== null && l.minutes !== undefined) {
    let t = `${num(l.minutes)} min`;
    if (l.distance !== null && l.distance !== undefined) t += ` · ${num(l.distance)} ${info?.ex.distanceUnit || 'km'}`;
    if (l.note) t += ` · ${l.note}`;
    return t;
  }
  if (info?.kind === 'hold') return `${num(l.sets)}x${num(l.reps)}s`;
  return `${num(l.sets)}x${num(l.reps)} · ${num(l.weight)}kg`;
}

function logFormHtml(ex, kind, editing) {
  const v = (k) => (editing && editing[k] !== null && editing[k] !== undefined ? esc(editing[k]) : '');
  const input = (key, ph, label, extra = '') =>
    `<input type="number" inputmode="decimal" min="0" step="any" placeholder="${ph}" aria-label="${label}" data-log="${key}" value="${v(key)}" ${extra}>`;
  let fields;
  if (kind === 'time') {
    fields = input('minutes', 'Minutos', 'Duração em minutos');
    if (ex.distanceUnit) fields += input('distance', ex.distanceUnit === 'm' ? 'Metros' : 'Km', `Distância em ${ex.distanceUnit === 'm' ? 'metros' : 'quilómetros'} (opcional)`);
  } else if (kind === 'hold') {
    fields = input('sets', 'Séries', 'Séries') + input('reps', 'Segundos', 'Segundos por série');
  } else {
    fields = input('sets', 'Séries', 'Séries') + input('reps', 'Reps', 'Repetições') + input('weight', 'Kg', 'Peso em kg (0 se for só o peso do corpo)');
  }
  const note = ex.noteLabel
    ? `<input type="text" maxlength="60" class="log-note" placeholder="${esc(ex.noteLabel)}" aria-label="${esc(ex.noteLabel)}" data-log="note" value="${editing?.note ? esc(editing.note) : ''}">`
    : '';
  const date = editing?.date || isoDate(new Date());
  return `
    <div class="log-inputs">${fields}</div>
    ${note}
    <div class="log-date"><label>Dia</label><input type="date" data-log="date" max="${isoDate(new Date())}" value="${date}" aria-label="Dia do treino"></div>`;
}

function logRowHtml(l) {
  const key = `log:${l.id}`;
  const hasId = l.id !== undefined && l.id !== null;
  if (hasId && state.confirm === key) {
    return `<div class="log-entry confirm"><span>Apagar este registo?</span>
      <span class="le-actions"><button class="mini danger" data-action="del-yes" data-kind="log" data-id="${l.id}">Sim</button><button class="mini" data-action="del-no">Não</button></span></div>`;
  }
  return `<div class="log-entry${state.editingLog === l.id ? ' editing' : ''}"><span class="le-date">${fmtDate(l.date)}</span><b class="le-val">${esc(fmtLog(l))}</b>
    ${hasId ? `<span class="le-actions">
      <button class="mini-ico" data-action="edit-log" data-id="${l.id}" data-ex="${esc(l.exercise)}" aria-label="Corrigir registo">${icon('pencil', 14)}</button>
      <button class="mini-ico" data-action="del-log" data-id="${l.id}" aria-label="Apagar registo">${icon('trash', 14)}</button></span>` : ''}</div>`;
}

function renderTreino() {
  const group = GROUPS[state.group];
  const groupsHtml = Object.entries(GROUPS).map(([key, g]) =>
    `<button class="group-btn${state.group === key ? ' active' : ''}" data-action="group" data-group="${key}">${g.label}</button>`).join('');

  const exercisesHtml = group.exercises.map((ex) => {
    const kind = ex.kind || group.kind;
    const open = state.openExercise === ex.name;
    const history = state.data.logs.filter((l) => l.exercise === ex.name).slice(0, 6);
    const editing = state.editingLog !== null ? history.find((l) => l.id === state.editingLog) : null;
    const rest = kind !== 'time' ? REST[ex.effort] : null;
    const restHtml = rest ? `
        <div class="rest-box">
          <div class="rest-head">${icon('timer', 16)}<span>Descanso recomendado: <b>${rest.range}</b></span></div>
          <button class="rest-start" data-action="rest-start" data-sec="${rest.sec}" data-ex="${esc(ex.name)}">${icon('play', 15)}Iniciar ${fmtClock(rest.sec)}</button>
          <details class="rest-why"><summary>Porquê este tempo?</summary><p>${esc(rest.why)}</p></details>
        </div>` : '';
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
        ${restHtml}
        <div class="log-box${editing ? ' is-editing' : ''}" data-kind="${kind}">
          <div class="log-title">${icon('pencil', 15)}${editing ? 'A corrigir um registo' : 'Registar sessão'}</div>
          ${logFormHtml(ex, kind, editing)}
          <div class="log-btns">
            <button class="log-save" data-action="save-log" data-ex="${esc(ex.name)}">${editing ? 'Atualizar' : 'Guardar'}</button>
            ${editing ? '<button class="log-cancel" data-action="cancel-edit">Cancelar</button>' : ''}
          </div>
          <div class="saved-flash" data-flash></div>
          ${history.length ? `<div class="log-history">${history.map(logRowHtml).join('')}</div>` : ''}
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

  const refsHtml = `
    <details class="card refs">
      <summary>${icon('book', 16)}A ciência do descanso entre séries</summary>
      <p>Os tempos sugeridos dependem do tipo de exercício: quanto mais pesado e multiarticular, mais descanso ajuda a manter a carga nas séries seguintes. São valores de referência gerais, não aconselhamento médico. Ajusta ao teu corpo.</p>
      <ul>${REST_REFERENCES.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
    </details>`;

  pageEl.innerHTML = `<div class="groups">${groupsHtml}</div>${exercisesHtml}${comboHtml}${group.kind === 'strength' ? refsHtml : ''}`;
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

function readLogForm(box, kind, exName) {
  const raw = (k) => { const el = box.querySelector(`[data-log="${k}"]`); return el ? el.value.trim() : ''; };
  const toNum = (k) => (raw(k) === '' ? null : Number(raw(k)));
  const entry = { exercise: exName, date: raw('date'), sets: null, reps: null, weight: null, minutes: null, distance: null, note: raw('note') || null };
  if (!entry.date) return { error: 'Escolhe o dia.' };
  if (entry.date > isoDate(new Date())) return { error: errorMessage('future_date') };
  const need = kind === 'time' ? ['minutes'] : kind === 'hold' ? ['sets', 'reps'] : ['sets', 'reps', 'weight'];
  for (const k of need) {
    const n = toNum(k);
    if (n === null || Number.isNaN(n) || n < 0) return { error: kind === 'time' ? 'Diz quantos minutos treinaste.' : 'Preenche séries, reps e peso (0 se for só o peso do corpo).' };
    entry[k] = n;
  }
  if (kind === 'time') {
    if (!(entry.minutes > 0)) return { error: 'Diz quantos minutos treinaste.' };
    const dist = toNum('distance');
    entry.distance = dist !== null && !Number.isNaN(dist) && dist >= 0 ? dist : null;
  }
  return { entry };
}

async function saveLog(btn) {
  const box = btn.closest('.log-box');
  const { entry, error } = readLogForm(box, box.dataset.kind, btn.dataset.ex);
  if (error) { box.querySelector('[data-flash]').textContent = error; return; }
  const wasEditing = state.editingLog;
  btn.disabled = true;
  const [cx, cy] = centerOf(btn);
  try {
    if (wasEditing !== null) await api.updateLog(state.profile, state.pin, wasEditing, entry);
    else await api.addLog(state.profile, state.pin, entry);
    state.editingLog = null;
    await refreshData();
    render();
    flashOk(pageEl.querySelector('.exercise.open [data-flash]'), wasEditing !== null ? 'Registo atualizado!' : 'Guardado! Já está no teu Progresso.');
    burst(cx, cy);
    popSuccess();
    haptic([12, 40, 12]);
  } catch (e) {
    btn.disabled = false;
    toast(errorMessage(e.code));
  }
}

async function confirmDelete(kind, id) {
  try {
    if (kind === 'log') await api.deleteLog(state.profile, state.pin, Number(id));
    else await api.deleteMeasurement(state.profile, state.pin, id);
    state.confirm = null;
    if (kind === 'log' && state.editingLog === Number(id)) state.editingLog = null;
    if (kind === 'meas' && state.editingMeas === id) state.editingMeas = null;
    await refreshData();
    render();
    pop(0.7);
  } catch (e) {
    state.confirm = null;
    render();
    toast(errorMessage(e.code));
  }
}

// ---------- Descanso (temporizador) ----------
let timerHide = 0;
function paintTimer(s) {
  const box = $('rest-timer');
  clearTimeout(timerHide);
  if (!s.running && !s.done) { box.hidden = true; box.classList.remove('done'); return; }
  box.hidden = false;
  box.classList.toggle('done', !!s.done);
  const remaining = s.done ? 0 : s.remaining;
  $('rt-time').textContent = fmtClock(remaining);
  $('rt-fg').style.strokeDashoffset = 100 - (s.done ? 100 : (remaining / s.total) * 100);
  $('rt-title').textContent = s.done ? 'Bora! Próxima série' : s.paused ? 'Em pausa' : 'A descansar';
  $('rt-label').textContent = s.done ? 'Descanso terminado' : s.label;
  $('rt-pause').innerHTML = icon(s.paused ? 'play' : 'pause', 18);
  $('rt-pause').hidden = !!s.done;
  $('rt-add').hidden = !!s.done;
  if (s.done) timerHide = setTimeout(() => { box.hidden = true; box.classList.remove('done'); }, 8000);
}
const rest = createTimer(paintTimer, () => {
  popDone();
  haptic([220, 110, 220, 110, 320]);
  burst(innerWidth / 2, innerHeight - 150, 30);
});

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

function histRowHtml(e, unit) {
  const key = `meas:${e.date}`;
  if (state.confirm === key) {
    return `<div class="hist-row confirm"><span>Apagar a medição de ${fmtDate(e.date)}?</span>
      <span class="le-actions"><button class="mini danger" data-action="del-yes" data-kind="meas" data-id="${e.date}">Sim</button><button class="mini" data-action="del-no">Não</button></span></div>`;
  }
  const canDelete = state.data.measurements.length > 1;
  return `<div class="hist-row${state.editingMeas === e.date ? ' editing' : ''}"><span>${fmtDate(e.date)}</span><b>${num(e[state.metric])}${unit}</b>
    <span class="le-actions">
      <button class="mini-ico" data-action="edit-meas" data-date="${e.date}" aria-label="Corrigir medição">${icon('pencil', 14)}</button>
      ${canDelete ? `<button class="mini-ico" data-action="del-meas" data-date="${e.date}" aria-label="Apagar medição">${icon('trash', 14)}</button>` : ''}
    </span></div>`;
}

function renderMedicao() {
  const entries = state.data.measurements;
  const last = lastMeasurement();
  if (!last) { pageEl.innerHTML = '<div class="card">Sem medições ainda.</div>'; return; }
  const [, , activeUnit] = metricDef(state.metric);
  const editing = state.editingMeas ? entries.find((m) => m.date === state.editingMeas) : null;
  const val = (key) => (editing && editing[key] !== null && editing[key] !== undefined ? ` value="${esc(editing[key])}"` : '');

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
      <div class="hist-list">${entries.slice().reverse().map((e) => histRowHtml(e, activeUnit)).join('')}</div>
    </div>

    <div class="card${editing ? ' is-editing' : ''}" id="meas-form">
      <h2>${editing ? `A corrigir a medição de ${fmtDate(editing.date)}` : 'Adicionar nova medição'}</h2>
      <div class="form-row">
        <div class="field"><label for="m-date">Data</label><input type="date" id="m-date" max="${isoDate(new Date())}" value="${editing ? editing.date : isoDate(new Date())}"${editing ? ' disabled' : ''}></div>
      </div>
      ${editing ? '<p class="edit-hint">Para mudar a data, apaga esta medição e cria uma nova.</p>' : ''}
      <div class="form-row">
        ${METRICS.map(([key, label, unit]) => `<div class="field"><label for="m-${key}">${label} (${unit || 'nº'})</label><input type="number" inputmode="decimal" step="any" min="0" id="m-${key}" placeholder="${num(last[key])}"${val(key)}></div>`).join('')}
      </div>
      <div class="log-btns">
        <button class="save-btn" data-action="save-measurement">${editing ? 'Atualizar medição' : 'Guardar medição'}</button>
        ${editing ? '<button class="log-cancel" data-action="cancel-meas">Cancelar</button>' : ''}
      </div>
      <div class="saved-flash" id="m-flash"></div>
    </div>`;
}

async function saveMeasurement(btn) {
  const date = $('m-date').value;
  if (!date) { $('m-flash').textContent = 'Escolhe uma data.'; return; }
  if (date > isoDate(new Date())) { $('m-flash').textContent = errorMessage('future_date'); return; }
  const base = (state.editingMeas && state.data.measurements.find((m) => m.date === state.editingMeas)) || lastMeasurement();
  const entry = { date };
  for (const [key] of METRICS) {
    const raw = $(`m-${key}`).value;
    if (raw !== '' && Number(raw) < 0) { $('m-flash').textContent = 'Os valores não podem ser negativos.'; return; }
    entry[key] = raw !== '' ? Number(raw) : base[key]; // campos vazios herdam o valor de referência
  }
  const wasEditing = !!state.editingMeas;
  btn.disabled = true;
  const [cx, cy] = centerOf(btn);
  try {
    await api.addMeasurement(state.profile, state.pin, entry);
    state.editingMeas = null;
    await refreshData();
    render();
    flashOk($('m-flash'), wasEditing ? 'Medição atualizada!' : 'Medição guardada!');
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

// ---------- Progresso (resumo mensal + calendário) ----------
const ringOffset = (n) => 100 - Math.min(n / GYM_GOAL_PER_MONTH, 1) * 100;

// dias de treino do mês = dias marcados ∪ dias com registos
function trainedCount(key) {
  const s = new Set([...state.data.gymDays].filter((d) => d.startsWith(key)));
  state.data.logs.forEach((l) => { if (l.date.startsWith(key)) s.add(l.date); });
  return s.size;
}

const VERDICT_ICON = { empty: 'sparkles', starting: 'sparkles', flying: 'flame', rising: 'trend', steady: 'leaf', dip: 'sparkles' };
const TREND_ICON = { up: 'arrow-up', down: 'arrow-down', flat: 'minus', new: 'sparkles' };

function dayDetailHtml(iso) {
  if (!iso) return '<div class="dd-empty">Toca num dia para ver o que fizeste.</div>';
  const logs = state.data.logs.filter((l) => l.date === iso);
  const marked = state.data.gymDays.has(iso) || logs.length > 0;
  const [, m, d] = iso.split('-').map(Number);
  return `
    <div class="dd-head"><b>${d} de ${MONTH_NAMES[m - 1].toLowerCase()}</b><span class="dd-chip${marked ? ' on' : ''}">${marked ? 'Dia de treino' : 'Sem treino'}</span></div>
    ${logs.length
      ? logs.map((l) => `<div class="dd-log"><span>${esc(l.exercise)}</span><b>${esc(fmtLog(l))}</b></div>`).join('')
      : '<div class="dd-empty">Sem registos neste dia.</div>'}
    ${logs.length
      ? '<div class="dd-note">Marcado automaticamente pelos teus registos.</div>'
      : `<button class="dd-toggle" data-action="toggle-day" data-date="${iso}">${marked ? 'Desmarcar dia de treino' : 'Marcar como dia de treino'}</button>`}`;
}

function renderProgresso() {
  const year = state.calMonth.getFullYear(), month = state.calMonth.getMonth();
  const key = `${year}-${pad2(month + 1)}`;
  const today = isoDate(new Date());
  const isCurrent = key >= monthKeyOf(new Date());
  const p = PROFILES[state.profile];

  if (state.selectedDay && !state.selectedDay.startsWith(key)) state.selectedDay = null;
  if (!state.selectedDay && isCurrent) state.selectedDay = today;

  const sum = summarize({ logs: state.data.logs, gymDays: state.data.gymDays, measurements: state.data.measurements }, key, GYM_GOAL_PER_MONTH);
  const story = buildStory(sum, { name: p.name, focus: p.focus });
  const count = sum.sessions;

  const chips = [`<span class="s-chip">${icon('calendar', 14)}${count}/${GYM_GOAL_PER_MONTH} treinos</span>`];
  if (sum.volume > 0) chips.push(`<span class="s-chip">${icon('dumbbell', 14)}${sum.volume.toLocaleString('pt-PT')} kg de volume</span>`);
  if (sum.minutes > 0) chips.push(`<span class="s-chip">${icon('activity', 14)}${sum.minutes} min de cardio/desporto</span>`);

  const highlightsHtml = sum.highlights.length ? `
    <div class="card">
      <h2>Evolução de carga</h2>
      <div class="hl-list">${sum.highlights.map((h) => `
        <div class="hl-row ${h.trend}">
          <span class="hl-ico">${icon(TREND_ICON[h.trend], 16)}</span>
          <span class="hl-name">${esc(h.name)}</span>
          <span class="hl-val">${h.trend === 'new' ? `Estreia: ${esc(h.to)}` : `${esc(h.from)} → ${esc(h.to)}${h.deltaKg ? ` <em>(${h.deltaKg > 0 ? '+' : ''}${h.deltaKg}kg)</em>` : ''}`}</span>
        </div>`).join('')}</div>
      <p class="footnote">Comparamos a carga estimada (peso × repetições, fórmula de Epley) com o melhor registo do mês anterior. Se não houver mês anterior, comparamos o início e o fim do mês.</p>
    </div>` : '';

  const logDays = new Set(state.data.logs.map((l) => l.date));
  const startDow = (new Date(year, month, 1).getDay() + 6) % 7; // semana começa à segunda
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let cells = '<div class="cal-day empty"></div>'.repeat(startDow);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${key}-${pad2(d)}`;
    const done = state.data.gymDays.has(iso) || logDays.has(iso);
    const future = iso > today;
    cells += `<button class="cal-day${done ? ' done' : ''}${iso === today ? ' today' : ''}${iso === state.selectedDay ? ' sel' : ''}${future ? ' future' : ''}" data-action="select-day" data-date="${iso}" aria-pressed="${done}"${future ? ' disabled aria-label="Ainda não chegou"' : ''}>${d}</button>`;
  }

  pageEl.innerHTML = `
    <div class="card month-nav">
      <button data-action="cal-prev" aria-label="Mês anterior">${icon('chevron-left', 18)}</button>
      <div class="month-label">${MONTH_NAMES[month]} ${year}</div>
      <button data-action="cal-next" aria-label="Mês seguinte"${isCurrent ? ' disabled' : ''}>${icon('chevron-right', 18)}</button>
    </div>

    <div class="card story ${sum.verdict}">
      <div class="story-head"><span class="story-badge">${icon(VERDICT_ICON[sum.verdict], 22)}</span><h2 class="story-title">${esc(story.title)}</h2></div>
      ${story.lines.map((l) => `<p>${esc(l)}</p>`).join('')}
      <div class="story-chips">${chips.join('')}</div>
      <div class="story-mission">${icon('target', 16)}<span>${esc(story.mission)}</span></div>
    </div>

    ${highlightsHtml}

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
      <div class="cal-grid">
        ${['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d) => `<div class="cal-dow">${d}</div>`).join('')}
        ${cells}
      </div>
      <div class="day-detail" id="day-detail">${dayDetailHtml(state.selectedDay)}</div>
    </div>`;
}

function selectDay(el) {
  state.selectedDay = el.dataset.date;
  pageEl.querySelectorAll('.cal-day.sel').forEach((x) => x.classList.remove('sel'));
  el.classList.add('sel');
  $('day-detail').innerHTML = dayDetailHtml(state.selectedDay);
}

async function toggleDay(iso) {
  const had = state.data.gymDays.has(iso);
  if (!had && iso > isoDate(new Date())) { toast(errorMessage('future_date')); return; }
  const key = iso.slice(0, 7);
  const before = trainedCount(key);
  const setDay = (on) => { if (on) state.data.gymDays.add(iso); else state.data.gymDays.delete(iso); };
  const celebrate = (on) => {
    const fg = $('ring-fg');
    if (fg) { // anima o anel do valor antigo para o novo
      fg.style.strokeDashoffset = ringOffset(before);
      void fg.getBoundingClientRect();
      fg.style.strokeDashoffset = ringOffset(trainedCount(key));
      const n = $('ring-num'); n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump');
    }
    const b = pageEl.querySelector(`.cal-day[data-date="${iso}"]`);
    if (b) { b.classList.add('pop'); if (on) { const [cx, cy] = centerOf(b); burst(cx, cy, 26); } }
  };
  // atualização otimista; reverte se a base de dados recusar
  setDay(!had);
  render();
  celebrate(!had);
  if (!had) { popSuccess(); haptic([10, 30, 10]); }
  try {
    const out = await api.toggleGymDay(state.profile, state.pin, iso);
    if (out.on !== !had) { setDay(out.on); render(); }
  } catch (e) {
    setDay(had);
    render();
    toast(errorMessage(e.code));
  }
}

// ---------- navegação e eventos ----------
const PAGES = [
  ['treino', 'Treino', 'dumbbell'],
  ['medicao', 'Medição', 'activity'],
  ['alimentacao', 'Alimentação', 'leaf'],
  ['progresso', 'Progresso', 'trend']
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

const RENDERERS = { treino: renderTreino, medicao: renderMedicao, alimentacao: renderAlimentacao, progresso: renderProgresso };

function render(fresh = false) {
  renderNav();
  pageEl.classList.toggle('fresh', fresh);
  RENDERERS[state.page]();
  if (fresh) [...pageEl.children].forEach((el, i) => el.style.setProperty('--n', i));
}

function scrollToAndFocus(selector) {
  const el = pageEl.querySelector(selector);
  if (!el) return;
  setTimeout(() => { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 60);
}

function onClick(ev) {
  const el = ev.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const d = el.dataset;
  switch (d.action) {
    case 'page':
      if (state.page === d.page) return;
      state.page = d.page;
      state.confirm = null;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    case 'group': state.group = d.group; state.openExercise = null; state.editingLog = null; state.confirm = null; break;
    case 'toggle-ex': toggleExercise(el); return;
    case 'metric': state.metric = d.metric; break;
    case 'toggle-meanings': state.showMeanings = !state.showMeanings; render(); return;
    case 'cal-prev': state.calMonth = new Date(state.calMonth.getFullYear(), state.calMonth.getMonth() - 1, 1); state.selectedDay = null; break;
    case 'cal-next': state.calMonth = new Date(state.calMonth.getFullYear(), state.calMonth.getMonth() + 1, 1); state.selectedDay = null; break;
    case 'select-day': selectDay(el); return;
    case 'toggle-day': toggleDay(d.date); return;
    case 'save-log': saveLog(el); return;
    case 'save-measurement': saveMeasurement(el); return;
    case 'edit-log':
      state.editingLog = Number(d.id); state.openExercise = d.ex; state.confirm = null;
      render(); scrollToAndFocus('.log-box.is-editing'); return;
    case 'cancel-edit': state.editingLog = null; render(); return;
    case 'del-log': state.confirm = `log:${d.id}`; render(); return;
    case 'edit-meas': state.editingMeas = d.date; state.confirm = null; render(); scrollToAndFocus('#meas-form'); return;
    case 'cancel-meas': state.editingMeas = null; render(); return;
    case 'del-meas': state.confirm = `meas:${d.date}`; render(); return;
    case 'del-no': state.confirm = null; render(); return;
    case 'del-yes': confirmDelete(d.kind, d.id); return;
    case 'rest-start': rest.start(Number(d.sec), d.ex); return;
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

async function startSession(profileKey, pin) {
  const out = await api.getData(profileKey, pin);
  const p = PROFILES[profileKey];
  state.profile = profileKey;
  state.pin = pin;
  applyData(out);
  Object.assign(state, {
    page: 'treino', group: 'gluteo', metric: 'weight', openExercise: null, showMeanings: false,
    calMonth: startOfMonth(new Date()), selectedDay: null, editingLog: null, editingMeas: null, confirm: null
  });
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ profileKey, pin })); } catch { /* ignora */ }

  $('avatar').className = `avatar ${p.tone}`;
  $('avatar').textContent = p.name[0];
  $('header-eyebrow').textContent = `Hey, sweetie (aka ${p.name})`;
  const outdated = !isDemo && out.version !== 2;
  $('demo-banner').innerHTML = `${icon('alert', 16)}<span>${outdated
    ? 'Há novidades! Falta atualizar a base de dados para ativar: apagar/corrigir registos, outros desportos e datas seguras. Segue as instruções do ficheiro supabase/migracao-2.sql.'
    : 'Modo demo: os dados ficam só neste dispositivo. Liga o Supabase (ver README) para os guardar online.'}</span>`;
  $('demo-banner').hidden = !(isDemo || outdated);
  $('app').hidden = false;
  render(true);
  window.scrollTo(0, 0);

  splashEl.classList.add('leaving');
  clearTimeout(leaveTimer);
  leaveTimer = setTimeout(() => { splashEl.hidden = true; splashEl.classList.remove('leaving'); }, 520);
}

function logout() {
  rest.stop();
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

// controlos do temporizador flutuante
$('rt-close').innerHTML = icon('x', 18);
$('rt-close').addEventListener('click', () => rest.stop());
$('rt-add').addEventListener('click', () => rest.add(15));
$('rt-pause').addEventListener('click', () => {
  const paused = $('rt-title').textContent === 'Em pausa';
  if (paused) rest.resume(); else rest.pause();
});

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
