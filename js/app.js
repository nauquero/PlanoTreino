import { api, isDemo, errorMessage } from './api.js';
import {
  FOCUS, TONES, METRICS, MEANINGS, EFFORT_LABELS, NUTRITION, GROUPS, TABS, WARMUP_STRETCH, GOAL_SUGGESTIONS, REST,
  WATER, PROTEIN_G_PER_KG, FOOD_GUIDE, FOOD_LIMIT
} from './data.js';
import { icon } from './icons.js';
import { burst, haptic, pop, popSuccess, popDone, isMuted, setMuted } from './fx.js';
import { summarize, buildStory, rowsOfLog, bestSet, bestHold, MONTH_NAMES } from './progress.js';
import { createTimer } from './timer.js';

// ---------- estado ----------
const state = {
  user: null,         // { id, name, focus, cardio, tone }
  pin: null,
  page: 'treino',
  group: 'pernas',
  metric: 'weight',
  openExercise: null,
  showMeanings: false,
  calMonth: startOfMonth(new Date()),
  selectedDay: null,
  editingLog: null,   // id do registo a corrigir
  editingMeas: null,  // data da medição a corrigir
  confirm: null,      // 'log:<id>' | 'meas:<data>' | 'sleep:<data>' | 'cex:<id>' à espera de confirmação para apagar
  addingExercise: false,
  editingGoal: false,
  sleepDate: null,
  data: { measurements: [], logs: [], gymDays: new Set(), sleep: [], custom: [], goals: new Map() }
};

// exercícios do plano, por nome
const BUILTIN = new Map();
for (const [key, g] of Object.entries(GROUPS)) for (const ex of g.exercises) BUILTIN.set(ex.name, { ex, kind: ex.kind || g.kind, group: key });

const SESSION_KEY = 'plano-treino-session';
const LAST_NUMBER_KEY = 'plano-treino-last-number';

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
function fmtShort(iso) { const [, m, d] = iso.split('-'); return `${d}/${m}`; }
function num(v) { return v === null || v === undefined ? '–' : Number(v); }
function ptNum(v, dec = 1) { return Number(v).toLocaleString('pt-PT', { maximumFractionDigits: dec }); }
function metricDef(key) { return METRICS.find((m) => m[0] === key); }
const fmtClock = (s) => `${Math.floor(s / 60)}:${pad2(s % 60)}`;
const today = () => isoDate(new Date());
const uid = () => state.user.id;

function hash(str) { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; }
const toneFor = (name) => TONES[hash(name) % TONES.length];

let toastTimer;
function toast(msg) {
  const el = $('toast');
  el.innerHTML = `${icon('alert', 16)}<span>${esc(msg)}</span>`;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3600);
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
  state.data.sleep = out.sleep || [];
  state.data.custom = out.custom_exercises || [];
  state.data.goals = new Map((out.goals || []).map((g) => [g.month, Number(g.days)]));
}

const goalFor = (key) => state.data.goals.get(key) || null;
const daysInMonth = (key) => { const [y, m] = key.split('-').map(Number); return new Date(y, m, 0).getDate(); };

async function refreshData() {
  applyData(await api.getData(uid(), state.pin));
}

// ---------- exercícios (planeados + personalizados) ----------
function customToEx(c) {
  return {
    name: c.name, effort: c.effort, kind: c.kind, custom: true, id: c.id,
    reps: c.kind === 'time' ? 'Registo por tempo' : c.kind === 'hold' ? 'Isométrico (segundos)' : 'Força (séries e repetições)',
    tech: 'Exercício criado por ti.', mistakes: [], distanceUnit: c.distance_unit || undefined
  };
}

function exercisesOf(groupKey) {
  const custom = state.data.custom.filter((c) => c.group_key === groupKey).map(customToEx);
  return [...GROUPS[groupKey].exercises, ...custom];
}

function exInfo(name) {
  if (BUILTIN.has(name)) return BUILTIN.get(name);
  const c = state.data.custom.find((x) => x.name === name);
  return c ? { ex: customToEx(c), kind: c.kind } : null;
}

// ---------- registos de séries ----------
function logChips(l) {
  if (l.minutes !== null && l.minutes !== undefined) {
    const info = exInfo(l.exercise);
    let t = `${num(l.minutes)} min`;
    if (l.distance !== null && l.distance !== undefined) t += ` · ${num(l.distance)} ${info?.ex.distanceUnit || 'km'}`;
    if (l.note) t += ` · ${l.note}`;
    return `<span class="set-chip wide">${esc(t)}</span>`;
  }
  const rows = rowsOfLog(l);
  if (!rows.length) return '';
  const kind = exInfo(l.exercise)?.kind;
  return rows.map((r) => `<span class="set-chip">${kind === 'hold' ? `${r.reps} s` : `${r.weight !== null ? `${ptNum(r.weight, 2)} kg × ` : ''}${r.reps}`}</span>`).join('');
}

function setRowHtml(i, kind, row, hint) {
  const v = (x) => (x !== null && x !== undefined ? ` value="${esc(x)}"` : '');
  const reps = `<input type="number" inputmode="decimal" min="0" step="any" data-set="reps" placeholder="${kind === 'hold' ? 'Segundos' : (hint?.reps ?? 'Reps')}" aria-label="${kind === 'hold' ? 'Segundos' : 'Repetições'} da série ${i + 1}"${v(row?.reps)}>`;
  const weight = kind === 'hold' ? '' : `<input type="number" inputmode="decimal" min="0" step="any" data-set="weight" placeholder="${hint?.weight ?? 'Kg'}" aria-label="Peso em kg da série ${i + 1}"${v(row?.weight)}>`;
  return `<div class="set-row"><span class="set-n">Série ${i + 1}</span>${reps}${weight}</div>`;
}

function logFormHtml(ex, kind, editing, history) {
  const input = (key, ph, label, value = '') =>
    `<input type="number" inputmode="decimal" min="0" step="any" placeholder="${ph}" aria-label="${label}" data-log="${key}" value="${esc(value)}">`;
  let fields = '';
  if (kind === 'time') {
    fields = `<div class="log-inputs">${input('minutes', 'Minutos', 'Duração em minutos', editing?.minutes ?? '')}`;
    if (ex.distanceUnit) fields += input('distance', ex.distanceUnit === 'm' ? 'Metros' : 'Km', `Distância em ${ex.distanceUnit === 'm' ? 'metros' : 'quilómetros'} (opcional)`, editing?.distance ?? '');
    fields += '</div>';
    if (ex.noteLabel) fields += `<input type="text" maxlength="60" class="log-note" placeholder="${esc(ex.noteLabel)}" aria-label="${esc(ex.noteLabel)}" data-log="note" value="${editing?.note ? esc(editing.note) : ''}">`;
  } else {
    // séries do dia: 3 linhas por defeito (mais as que precisares com "+ série")
    const lastRows = history[0] ? rowsOfLog(history[0]) : [];
    const rows = editing ? rowsOfLog(editing) : [];
    const count = Math.max(3, rows.length);
    fields = `<div class="set-rows" data-sets>${Array.from({ length: count }, (_, i) => setRowHtml(i, kind, rows[i], editing ? null : lastRows[i] || lastRows[lastRows.length - 1])).join('')}</div>
      <button type="button" class="add-set" data-action="add-set">${icon('plus', 15)}série</button>`;
  }
  const date = editing?.date || today();
  return `${fields}
    <div class="log-date"><label>Dia</label><input type="date" data-log="date" max="${today()}" value="${date}" aria-label="Dia do treino"></div>`;
}

function logRowHtml(l) {
  const key = `log:${l.id}`;
  const hasId = l.id !== undefined && l.id !== null;
  if (hasId && state.confirm === key) {
    return `<div class="log-entry confirm"><span>Apagar este registo?</span>
      <span class="le-actions"><button class="mini danger" data-action="del-yes" data-kind="log" data-id="${l.id}">Sim</button><button class="mini" data-action="del-no">Não</button></span></div>`;
  }
  return `<div class="log-entry${state.editingLog === l.id ? ' editing' : ''}"><span class="le-date">${fmtDate(l.date)}</span><span class="le-val">${logChips(l)}</span>
    ${hasId ? `<span class="le-actions">
      <button class="mini-ico" data-action="edit-log" data-id="${l.id}" data-ex="${esc(l.exercise)}" aria-label="Corrigir registo">${icon('pencil', 14)}</button>
      <button class="mini-ico" data-action="del-log" data-id="${l.id}" aria-label="Apagar registo">${icon('trash', 14)}</button></span>` : ''}</div>`;
}

// ---------- Treino ----------
function planCard(plan, cls) {
  return `<details class="card plan ${cls}">
    <summary>${icon(cls === 'warm' ? 'flame' : 'leaf', 16)}<span>${esc(plan.title)}</span><em>${esc(plan.time)}</em></summary>
    ${plan.rule ? `<p class="plan-rule">${esc(plan.rule)}</p>` : ''}
    <ul>${plan.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
  </details>`;
}

function tabsHtml() {
  const active = TABS.find((t) => t.key === state.group || (t.children || []).includes(state.group));
  const top = TABS.map((t) => {
    const target = t.children ? (t.children.includes(state.group) ? state.group : t.children[0]) : t.key;
    return `<button class="group-btn${t === active ? ' active' : ''}" data-action="group" data-group="${target}">${t.label}</button>`;
  }).join('');
  const sub = active?.children
    ? `<div class="groups sub">${active.children.map((k) => `<button class="group-btn sub${k === state.group ? ' active' : ''}" data-action="group" data-group="${k}">${GROUPS[k].label}</button>`).join('')}</div>`
    : '';
  return `<div class="groups">${top}</div>${sub}`;
}

function addExerciseHtml() {
  if (!state.addingExercise) {
    return `<div class="card add-ex"><button class="add-ex-btn" data-action="add-ex-open">${icon('plus', 18)}Adicionar exercício</button></div>`;
  }
  const g = GROUPS[state.group];
  return `<form class="card add-ex-form" id="add-ex-form" autocomplete="off">
    <h2>Novo exercício em ${esc(g.label)}</h2>
    <div class="field"><label for="cx-name">Nome</label><input type="text" id="cx-name" maxlength="40" placeholder="ex: Leg Press foco quadríceps" required></div>
    <div class="field"><label for="cx-kind">Como queres registar?</label>
      <select id="cx-kind">
        <option value="strength">Força: séries, repetições e peso</option>
        <option value="time">Tempo: minutos (e distância)</option>
        <option value="hold">Isométrico: segundos</option>
      </select></div>
    <div class="field"><label for="cx-effort">Esforço (define o descanso sugerido)</label>
      <select id="cx-effort">
        <option value="alto">Alto: pesado e multiarticular</option>
        <option value="medio-alto" selected>Médio-alto</option>
        <option value="medio">Médio: mais localizado</option>
        <option value="baixo">Baixo: músculos pequenos</option>
      </select></div>
    <div class="field" id="cx-dist-row" hidden><label for="cx-dist">Distância</label>
      <select id="cx-dist"><option value="">Sem distância</option><option value="km">Quilómetros</option><option value="m">Metros</option></select></div>
    <div class="log-btns">
      <button type="submit" class="save-btn" data-action="add-ex-save">Guardar exercício</button>
      <button type="button" class="log-cancel" data-action="add-ex-cancel">Cancelar</button>
    </div>
    <div class="saved-flash" id="cx-flash"></div>
  </form>`;
}

function renderTreino() {
  const group = GROUPS[state.group];
  const plan = WARMUP_STRETCH[state.group];
  const exercises = exercisesOf(state.group);

  const exercisesHtml = exercises.map((ex) => {
    const kind = ex.kind || group.kind;
    const open = state.openExercise === ex.name;
    const all = state.data.logs.filter((l) => l.exercise === ex.name);
    const history = all.slice(0, 8);
    const editing = state.editingLog !== null ? history.find((l) => l.id === state.editingLog) : null;
    const rest = kind !== 'time' ? REST[ex.effort] : null;
    const best = kind === 'strength' ? bestSet(all) : kind === 'hold' ? bestHold(all) : null;
    const bestHtml = best
      ? `<div class="best-line">${icon('star', 15)}<span>Melhor carga: <b>${kind === 'hold' ? `${best.seconds} s` : `${ptNum(best.weight, 2)} kg × ${best.reps}`}</b> <em>(${fmtDate(best.date)})</em></span></div>`
      : '';
    const restHtml = rest ? `
        <div class="rest-box">
          <div class="rest-head">${icon('timer', 16)}<span>Descanso recomendado: <b>${rest.range}</b></span></div>
          <button class="rest-start" data-action="rest-start" data-sec="${rest.sec}" data-ex="${esc(ex.name)}">${icon('play', 15)}Iniciar ${fmtClock(rest.sec)}</button>
          <details class="rest-why"><summary>Porquê este tempo?</summary><p>${esc(rest.why)}</p></details>
        </div>` : '';
    const removeHtml = ex.custom
      ? (state.confirm === `cex:${ex.id}`
        ? `<div class="log-entry confirm"><span>Remover este exercício? (os registos ficam guardados)</span><span class="le-actions"><button class="mini danger" data-action="del-yes" data-kind="cex" data-id="${ex.id}">Sim</button><button class="mini" data-action="del-no">Não</button></span></div>`
        : `<button class="remove-ex" data-action="del-cex" data-id="${ex.id}">${icon('trash', 14)}Remover este exercício</button>`)
      : '';
    return `
    <div class="exercise${open ? ' open' : ''}">
      <button class="ex-head" data-action="toggle-ex" data-ex="${esc(ex.name)}" aria-expanded="${open}">
        <span class="ex-title">
          <span class="ex-name">${esc(ex.name)}</span>
          <span class="ex-sub"><span class="effort ${ex.effort}">${EFFORT_LABELS[ex.effort]}</span><span class="ex-reps">${esc(ex.reps)}</span>${ex.custom ? '<span class="own-chip">Meu</span>' : ''}</span>
        </span>
        <span class="chev">${icon('chevron-down', 18)}</span>
      </button>
      <div class="ex-body"><div class="ex-clip"><div class="ex-content">
        <div class="tech-text">${esc(ex.tech)}</div>
        ${ex.mistakes.length ? `<div class="mistakes">
          <div class="m-title">${icon('alert', 15)}Erros comuns</div>
          <ul>${ex.mistakes.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
        </div>` : ''}
        ${bestHtml}
        ${restHtml}
        <div class="log-box${editing ? ' is-editing' : ''}" data-kind="${kind}">
          <div class="log-title">${icon('pencil', 15)}${editing ? 'A corrigir um registo' : 'Registar sessão'}</div>
          ${logFormHtml(ex, kind, editing, history)}
          <div class="log-btns">
            <button class="log-save" data-action="save-log" data-ex="${esc(ex.name)}">${editing ? 'Atualizar' : 'Guardar'}</button>
            ${editing ? '<button class="log-cancel" data-action="cancel-edit">Cancelar</button>' : ''}
          </div>
          <div class="saved-flash" data-flash></div>
          ${history.length ? `<div class="log-history">${history.map(logRowHtml).join('')}</div>` : ''}
        </div>
        ${removeHtml}
      </div></div></div>
    </div>`;
  }).join('');

  let comboHtml = '';
  if (group.combo) {
    comboHtml = `
    <div class="card mint">
      <div class="card-title-row">${icon('target', 16)}Para fechar este treino</div>
      <div class="combo-text"><b>${esc(group.combo.cardio[state.user.cardio] || group.combo.cardio.bicicleta)}</b> + <b>${esc(group.combo.abs)}</b><br>${esc(group.combo.why)}</div>
    </div>`;
  }

  pageEl.innerHTML = `${tabsHtml()}${planCard(plan.warm, 'warm')}${exercisesHtml}${addExerciseHtml()}${comboHtml}${planCard(plan.stretch, 'stretch')}`;
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
  const entry = { exercise: exName, date: raw('date'), sets: null, reps: null, weight: null, minutes: null, distance: null, note: raw('note') || null, sets_json: null };
  if (!entry.date) return { error: 'Escolhe o dia.' };
  if (entry.date > today()) return { error: errorMessage('future_date') };

  if (kind === 'time') {
    const minutes = raw('minutes') === '' ? NaN : Number(raw('minutes'));
    if (!(minutes > 0)) return { error: 'Diz quantos minutos treinaste.' };
    entry.minutes = minutes;
    const dist = raw('distance') === '' ? null : Number(raw('distance'));
    entry.distance = dist !== null && !Number.isNaN(dist) && dist >= 0 ? dist : null;
    return { entry };
  }

  const rows = [];
  let n = 0;
  for (const row of box.querySelectorAll('.set-row')) {
    n++;
    const r = row.querySelector('[data-set="reps"]').value.trim();
    const wEl = row.querySelector('[data-set="weight"]');
    const w = wEl ? wEl.value.trim() : '';
    if (r === '' && w === '') continue; // linha vazia: ignora
    if (r === '' || (kind === 'strength' && w === '')) return { error: kind === 'hold' ? `Preenche os segundos da série ${n}.` : `Preenche as repetições e o peso da série ${n} (0 se for só o peso do corpo).` };
    const reps = Number(r), weight = kind === 'strength' ? Number(w) : null;
    if (!(reps > 0) || (weight !== null && !(weight >= 0))) return { error: `Valores inválidos na série ${n}.` };
    rows.push(kind === 'strength' ? { reps, weight } : { reps });
  }
  if (!rows.length) return { error: 'Preenche pelo menos uma série.' };
  const top = rows.reduce((b, r) => ((r.weight ?? 0) > (b.weight ?? 0) || ((r.weight ?? 0) === (b.weight ?? 0) && r.reps > b.reps) ? r : b), rows[0]);
  entry.sets_json = rows;
  entry.sets = rows.length;
  entry.reps = top.reps;
  entry.weight = kind === 'strength' ? top.weight : null;
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
    if (wasEditing !== null) await api.updateLog(uid(), state.pin, wasEditing, entry);
    else await api.addLog(uid(), state.pin, entry);
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

function addSetRow(btn) {
  const box = btn.closest('.log-box');
  const rows = box.querySelector('[data-sets]');
  const n = rows.querySelectorAll('.set-row').length;
  rows.insertAdjacentHTML('beforeend', setRowHtml(n, box.dataset.kind, null, null));
  rows.lastElementChild.querySelector('input').focus();
}

async function saveCustomExercise(form) {
  const name = $('cx-name').value.trim();
  const kind = $('cx-kind').value;
  const flash = $('cx-flash');
  if (name.length < 2) { flash.textContent = 'Escreve o nome do exercício.'; return; }
  if (exercisesOf(state.group).some((e) => e.name.toLowerCase() === name.toLowerCase())) { flash.textContent = errorMessage('duplicate'); return; }
  try {
    await api.addCustomExercise(uid(), state.pin, {
      group_key: state.group, name, kind, effort: $('cx-effort').value, distance_unit: kind === 'time' ? $('cx-dist').value : ''
    });
    state.addingExercise = false;
    state.openExercise = name;
    await refreshData();
    render();
    popSuccess();
    burst(innerWidth / 2, innerHeight / 2, 30);
    scrollToAndFocus('.exercise.open');
  } catch (e) {
    flash.textContent = errorMessage(e.code);
  }
}

async function confirmDelete(kind, id) {
  try {
    if (kind === 'log') await api.deleteLog(uid(), state.pin, Number(id));
    else if (kind === 'meas') await api.deleteMeasurement(uid(), state.pin, id);
    else if (kind === 'sleep') await api.deleteSleep(uid(), state.pin, id);
    else if (kind === 'cex') await api.deleteCustomExercise(uid(), state.pin, Number(id));
    state.confirm = null;
    if (kind === 'log' && state.editingLog === Number(id)) state.editingLog = null;
    if (kind === 'meas' && state.editingMeas === id) state.editingMeas = null;
    if (kind === 'cex') state.openExercise = null;
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
function lastWeight() {
  for (let i = state.data.measurements.length - 1; i >= 0; i--) {
    const w = state.data.measurements[i].weight;
    if (w !== null && w !== undefined && Number(w) > 0) return Number(w);
  }
  return null;
}

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
  const focus = state.user.focus;
  const bits = [];
  if (last.bmi != null) bits.push(`BMI de ${num(last.bmi)}`);
  if (last.body_fat != null) bits.push(`${num(last.body_fat)}% de gordura corporal`);
  const intro = bits.length ? `Com ${bits.join(' e ')}` : 'Com estes valores';
  const lines = [];
  if (focus === 'hipertrofia') lines.push(`${intro}, o foco é ganhar massa muscular de forma controlada: sobrecarga progressiva nos treinos e proteína suficiente em todas as refeições.`);
  else if (focus === 'definicao') lines.push(`${intro}, o foco é reduzir gordura de forma gradual, mantendo (ou até ganhando) massa muscular ao mesmo tempo.`);
  else lines.push(`${intro}, o foco é manter hábitos saudáveis e regulares: treino, alimentação equilibrada e bom sono.`);
  if (last.visceral != null) {
    const v = Number(last.visceral);
    if (v <= 9) lines.push(`A gordura visceral está num valor normal (${v}), sem preocupação nessa área.`);
    else if (v < 15) lines.push(`A gordura visceral está elevada (${v}) — cardio regular e um ligeiro ajuste na alimentação ajudam, sem cortes drásticos.`);
    else lines.push(`A gordura visceral está muito elevada (${v}) — vale a pena falar com um profissional de saúde.`);
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
  return `<div class="hist-row${state.editingMeas === e.date ? ' editing' : ''}"><span>${fmtDate(e.date)}</span><b>${num(e[state.metric])}${unit}</b>
    <span class="le-actions">
      <button class="mini-ico" data-action="edit-meas" data-date="${e.date}" aria-label="Corrigir medição">${icon('pencil', 14)}</button>
      <button class="mini-ico" data-action="del-meas" data-date="${e.date}" aria-label="Apagar medição">${icon('trash', 14)}</button>
    </span></div>`;
}

function renderMedicao() {
  const entries = state.data.measurements;
  const last = lastMeasurement();
  const [, , activeUnit] = metricDef(state.metric);
  const editing = state.editingMeas ? entries.find((m) => m.date === state.editingMeas) : null;
  const val = (key) => (editing && editing[key] !== null && editing[key] !== undefined ? ` value="${esc(editing[key])}"` : '');

  const formCard = `
    <div class="card${editing ? ' is-editing' : ''}" id="meas-form">
      <h2>${editing ? `A corrigir a medição de ${fmtDate(editing.date)}` : last ? 'Adicionar nova medição' : 'Adiciona a tua primeira medição'}</h2>
      <div class="form-row">
        <div class="field"><label for="m-date">Data</label><input type="date" id="m-date" max="${today()}" value="${editing ? editing.date : today()}"${editing ? ' disabled' : ''}></div>
      </div>
      ${editing ? '<p class="edit-hint">Para mudar a data, apaga esta medição e cria uma nova.</p>' : ''}
      <div class="form-row">
        ${METRICS.map(([key, label, unit]) => `<div class="field"><label for="m-${key}">${label} (${unit || 'nº'})</label><input type="number" inputmode="decimal" step="any" min="0" id="m-${key}" placeholder="${last ? num(last[key]) : ''}"${val(key)}></div>`).join('')}
      </div>
      <div class="log-btns">
        <button class="save-btn" data-action="save-measurement">${editing ? 'Atualizar medição' : 'Guardar medição'}</button>
        ${editing ? '<button class="log-cancel" data-action="cancel-meas">Cancelar</button>' : ''}
      </div>
      <div class="saved-flash" id="m-flash"></div>
    </div>`;

  if (!last) {
    pageEl.innerHTML = `<div class="card"><h2>Medição Corporal</h2><p class="diet-note">Ainda não tens medições guardadas. Preenche o que tiveres (podes deixar campos em branco) e começa a acompanhar a tua evolução.</p></div>${formCard}`;
    return;
  }

  pageEl.innerHTML = `
    <div class="card">
      <h2>Medição Corporal</h2>
      <div class="stats-sub">Última medição: ${fmtDate(last.date)}</div>
      <div class="stats-grid">${METRICS.map(([key, label, unit]) => `<div class="stat"><span>${label}</span><b>${num(last[key])}${last[key] != null ? unit : ''}</b></div>`).join('')}</div>
      <div class="chip-row">
        <span class="goal-chip">${icon('target', 15)}${esc((FOCUS[state.user.focus] || FOCUS.saude).goal)}</span>
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

    ${formCard}`;
}

async function saveMeasurement(btn) {
  const date = $('m-date').value;
  if (!date) { $('m-flash').textContent = 'Escolhe uma data.'; return; }
  if (date > today()) { $('m-flash').textContent = errorMessage('future_date'); return; }
  const base = (state.editingMeas && state.data.measurements.find((m) => m.date === state.editingMeas)) || lastMeasurement() || {};
  const entry = { date };
  let filled = 0;
  for (const [key] of METRICS) {
    const raw = $(`m-${key}`).value;
    if (raw !== '' && Number(raw) < 0) { $('m-flash').textContent = 'Os valores não podem ser negativos.'; return; }
    if (raw !== '') filled++;
    entry[key] = raw !== '' ? Number(raw) : (base[key] ?? null); // campos vazios herdam o valor de referência
  }
  if (!filled && !Object.keys(base).length) { $('m-flash').textContent = 'Preenche pelo menos uma medição.'; return; }
  const wasEditing = !!state.editingMeas;
  btn.disabled = true;
  const [cx, cy] = centerOf(btn);
  try {
    await api.addMeasurement(uid(), state.pin, entry);
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
function trainedToday() {
  const t = today();
  return state.data.gymDays.has(t) || state.data.logs.some((l) => l.date === t);
}

function renderAlimentacao() {
  const focus = FOCUS[state.user.focus] ? state.user.focus : 'saude';
  const n = NUTRITION[focus];
  const w = lastWeight();

  let waterHtml;
  if (w) {
    const ml = Math.round((w * WATER.mlPerKg) / 100) * 100;
    const withTraining = ml + WATER.trainingExtraMl;
    const L = (v) => ptNum(v / 1000, 1);
    const glasses = (v) => Math.ceil(v / WATER.glassMl);
    const todayMl = trainedToday() ? withTraining : ml;
    waterHtml = `
      <div class="water-main"><span class="water-num">${L(todayMl)}</span><span class="water-unit">litros hoje</span></div>
      <p class="diet-note">${trainedToday() ? 'Hoje é dia de treino, por isso soma um extra para compensar o suor.' : 'Este é o valor para um dia sem treino.'} São cerca de <b>${glasses(todayMl)} copos</b> de ${WATER.glassMl} ml.</p>
      <div class="water-rows">
        <div><span>Dia sem treino</span><b>${L(ml)} L</b></div>
        <div><span>Dia de treino</span><b>${L(withTraining)} L</b></div>
      </div>
      <p class="footnote">Calculado a partir do teu último peso (${ptNum(w, 1)} kg × ${WATER.mlPerKg} ml). Inclui água, chás e infusões sem açúcar; a comida também ajuda. Bebe ao longo do dia, não tudo de uma vez.</p>`;
  } else {
    waterHtml = `<div class="water-main"><span class="water-num">${WATER.fallback}</span><span class="water-unit">por dia</span></div>
      <p class="diet-note">Regista o teu peso na secção Medição e eu calculo a quantidade certa para ti. Em dias de treino, soma cerca de 0,5 L.</p>`;
  }

  const proteinHtml = w ? (() => {
    const lo = Math.round(w * PROTEIN_G_PER_KG[0]), hi = Math.round(w * PROTEIN_G_PER_KG[1]);
    return `<div class="water-main"><span class="water-num">${lo}–${hi}</span><span class="water-unit">g de proteína por dia</span></div>
      <p class="diet-note">Reparte por 3 a 4 refeições (cerca de <b>${Math.round(lo / 4)}–${Math.round(hi / 3)} g</b> em cada).</p>`;
  })() : '<p class="diet-note">Regista o teu peso na secção Medição para veres a tua proteína diária de referência.</p>';

  const foodHtml = FOOD_GUIDE.map((c, i) => `
    <details class="food"${i === 0 ? ' open' : ''}>
      <summary>${esc(c.title)}</summary>
      <div class="food-chips">${c.items.map((it) => `<span class="food-chip">${esc(it)}</span>`).join('')}</div>
      <p class="food-portion"><b>Quantidade:</b> ${esc(c.portion[focus])}</p>
    </details>`).join('') + `
    <details class="food limit"><summary>${esc(FOOD_LIMIT.title)}</summary>
      <div class="food-chips">${FOOD_LIMIT.items.map((it) => `<span class="food-chip">${esc(it)}</span>`).join('')}</div></details>`;

  pageEl.innerHTML = `
    <div class="card hydration">
      <h2>${icon('droplet', 18)} Hidratação</h2>
      ${waterHtml}
    </div>
    <div class="card">
      <h2>Proteína do dia</h2>
      ${proteinHtml}
    </div>
    <div class="card">
      <h2>O que podes comer</h2>
      <p class="diet-note">Escolhe sobretudo alimentos simples e pouco processados. Uma palma, um punhado e um polegar são medidas à tua medida, sem balança.</p>
      ${foodHtml}
    </div>
    <div class="card">
      <h2>Refeições sugeridas</h2>
      <p class="diet-note">${esc(n.note)}</p>
      ${Object.entries(n.meals).map(([title, items], i) => `
        <div class="meal-block" style="--n:${i}">
          <div class="meal-title">${esc(title)}</div>
          <ul>${items.map((it) => `<li>${esc(it)}</li>`).join('')}</ul>
        </div>`).join('')}
      <p class="footnote">Valores de referência gerais, não substituem o acompanhamento de um nutricionista.</p>
    </div>`;
}

// ---------- Sono ----------
const SLEEP_LABELS = ['Péssima', 'Fraca', 'Razoável', 'Boa', 'Ótima'];
const fmtHours = (h) => `${ptNum(h, 2)} h`;

function lastDays(n) {
  return Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (n - 1 - i)); return isoDate(d); });
}

function sleepChart() {
  const map = new Map(state.data.sleep.map((s) => [s.day, s]));
  const days = lastDays(14);
  const w = 500, h = 180, padX = 18, padTop = 14, padBottom = 30, max = 12;
  const H = h - padTop - padBottom, slot = (w - padX * 2) / days.length;
  const y = (hrs) => h - padBottom - (hrs / max) * H;
  const bars = days.map((d, i) => {
    const s = map.get(d);
    const x = padX + i * slot + 3;
    const label = i % 2 === 1 || i === days.length - 1 ? `<text class="chart-axis" x="${x + (slot - 6) / 2}" y="${h - 8}" text-anchor="middle">${fmtShort(d)}</text>` : '';
    if (!s) return `<rect class="sbar empty" x="${x}" y="${h - padBottom - 3}" width="${slot - 6}" height="3" rx="1.5"/>${label}`;
    return `<rect class="sbar q${s.quality}" x="${x}" y="${y(Number(s.hours))}" width="${slot - 6}" height="${(Number(s.hours) / max) * H}" rx="5"><title>${fmtDate(d)}: ${fmtHours(s.hours)} · ${SLEEP_LABELS[s.quality - 1]}</title></rect>${label}`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto" role="img" aria-label="Horas de sono nos últimos 14 dias">
    <rect x="${padX}" y="${y(9)}" width="${w - padX * 2}" height="${y(7) - y(9)}" rx="6" fill="#C6E8DC" opacity=".55"/>
    <text class="chart-axis" x="${w - padX}" y="${y(9) - 4}" text-anchor="end">ideal: 7–9 h</text>
    ${bars}
  </svg>`;
}

function sleepSummary() {
  const set = new Set(lastDays(7));
  const week = state.data.sleep.filter((s) => set.has(s.day));
  if (!week.length) return { html: '<p class="diet-note">Regista o teu primeiro sono e começamos a conta.</p>' };
  const avgH = week.reduce((a, s) => a + Number(s.hours), 0) / week.length;
  const avgQ = week.reduce((a, s) => a + Number(s.quality), 0) / week.length;
  const msg = avgH >= 7
    ? 'Sono em modo premium: o músculo agradece e a recuperação também.'
    : avgH >= 6
      ? 'Quase lá! Mais uns 30 minutos de cama e fazes upgrade para o sono premium.'
      : 'O teu corpo anda a pedir mais cama. Tenta deitar-te mais cedo e vê a diferença no treino.';
  return {
    html: `<div class="sleep-stats">
        <div><span>Média da semana</span><b>${fmtHours(avgH)}</b></div>
        <div><span>Qualidade média</span><b>${SLEEP_LABELS[Math.min(4, Math.max(0, Math.round(avgQ) - 1))]}</b></div>
        <div><span>Noites registadas</span><b>${week.length}/7</b></div>
      </div><p class="diet-note">${msg}</p>`
  };
}

function sleepRowHtml(s) {
  const key = `sleep:${s.day}`;
  if (state.confirm === key) {
    return `<div class="hist-row confirm"><span>Apagar o sono de ${fmtDate(s.day)}?</span>
      <span class="le-actions"><button class="mini danger" data-action="del-yes" data-kind="sleep" data-id="${s.day}">Sim</button><button class="mini" data-action="del-no">Não</button></span></div>`;
  }
  const moons = Array.from({ length: 5 }, (_, i) => `<span class="moon${i < s.quality ? ' on' : ''}">${icon('moon', 13)}</span>`).join('');
  return `<div class="hist-row"><span>${fmtDate(s.day)}</span><b>${fmtHours(s.hours)}</b><span class="moons" title="${SLEEP_LABELS[s.quality - 1]}">${moons}</span>
    <span class="le-actions">
      <button class="mini-ico" data-action="edit-sleep" data-day="${s.day}" aria-label="Corrigir sono">${icon('pencil', 14)}</button>
      <button class="mini-ico" data-action="del-sleep" data-day="${s.day}" aria-label="Apagar sono">${icon('trash', 14)}</button>
    </span></div>`;
}

function renderSono() {
  if (!state.sleepDate) state.sleepDate = today();
  const day = state.sleepDate;
  const existing = state.data.sleep.find((s) => s.day === day);
  const q = existing ? existing.quality : 0;
  const sum = sleepSummary();

  pageEl.innerHTML = `
    <div class="card" id="sleep-form">
      <h2>${icon('moon', 18)} ${existing ? 'Corrigir o sono' : 'Como dormiste?'}</h2>
      <div class="form-row">
        <div class="field"><label for="sl-date">Noite que terminou no dia</label><input type="date" id="sl-date" max="${today()}" value="${day}"></div>
        <div class="field"><label for="sl-hours">Horas dormidas</label><input type="number" inputmode="decimal" id="sl-hours" min="0.5" max="16" step="0.25" placeholder="ex: 7,5" value="${existing ? esc(existing.hours) : ''}"></div>
      </div>
      <div class="sleep-q" id="sl-q" data-q="${q}" role="radiogroup" aria-label="Qualidade do sono">
        ${SLEEP_LABELS.map((lab, i) => `<button type="button" class="moon-btn${i < q ? ' on' : ''}" data-action="sleep-q" data-q="${i + 1}" role="radio" aria-checked="${i + 1 === q}" aria-label="${lab}">${icon('moon', 26)}<span>${lab}</span></button>`).join('')}
      </div>
      <button class="save-btn" data-action="save-sleep">${existing ? 'Atualizar sono' : 'Guardar sono'}</button>
      <div class="saved-flash" id="sl-flash"></div>
    </div>

    <div class="card">
      <h2>Esta semana</h2>
      ${sum.html}
      <div class="chart-wrap">${sleepChart()}</div>
      <p class="footnote">Para adultos, o recomendado são 7 a 9 horas por noite. Dormir bem ajuda a recuperar o músculo e a manter a energia nos treinos.</p>
    </div>

    <div class="card">
      <h2>Histórico</h2>
      ${state.data.sleep.length ? `<div class="hist-list tall">${state.data.sleep.slice(0, 21).map(sleepRowHtml).join('')}</div>` : '<p class="diet-note">Ainda não registaste nenhuma noite.</p>'}
    </div>`;
}

async function saveSleep(btn) {
  const day = $('sl-date').value;
  const hours = $('sl-hours').value === '' ? NaN : Number($('sl-hours').value);
  const quality = Number($('sl-q').dataset.q);
  const flash = $('sl-flash');
  if (!day) { flash.textContent = 'Escolhe o dia.'; return; }
  if (day > today()) { flash.textContent = errorMessage('future_date'); return; }
  if (!(hours > 0 && hours <= 16)) { flash.textContent = 'Diz quantas horas dormiste (entre 0,5 e 16).'; return; }
  if (!(quality >= 1 && quality <= 5)) { flash.textContent = 'Escolhe a qualidade do sono.'; return; }
  const wasExisting = state.data.sleep.some((s) => s.day === day);
  btn.disabled = true;
  const [cx, cy] = centerOf(btn);
  try {
    await api.setSleep(uid(), state.pin, { day, hours, quality });
    await refreshData();
    render();
    flashOk($('sl-flash'), wasExisting ? 'Sono atualizado!' : 'Sono guardado!');
    burst(cx, cy, 28);
    popSuccess();
  } catch (e) {
    btn.disabled = false;
    toast(errorMessage(e.code));
  }
}

function pickSleepQuality(btn) {
  const q = Number(btn.dataset.q);
  const box = $('sl-q');
  box.dataset.q = q;
  box.querySelectorAll('.moon-btn').forEach((b, i) => {
    b.classList.toggle('on', i < q);
    b.setAttribute('aria-checked', String(i + 1 === q));
  });
}

// ---------- Progresso (resumo mensal + calendário) ----------
const ringOffset = (n, goal) => (goal ? 100 - Math.min(n / goal, 1) * 100 : 100);

// dias de treino do mês = dias marcados ∪ dias com registos (nunca dias futuros)
function trainedCount(key) {
  const t = today();
  const s = new Set([...state.data.gymDays].filter((d) => d.startsWith(key) && d <= t));
  state.data.logs.forEach((l) => { if (l.date.startsWith(key) && l.date <= t) s.add(l.date); });
  return s.size;
}

const VERDICT_ICON = { empty: 'sparkles', few: 'leaf', good: 'trend', goal: 'flame' };

function dayDetailHtml(iso) {
  if (!iso) return '<div class="dd-empty">Toca num dia para ver o que fizeste.</div>';
  const logs = state.data.logs.filter((l) => l.date === iso);
  const marked = state.data.gymDays.has(iso) || logs.length > 0;
  const [, m, d] = iso.split('-').map(Number);
  return `
    <div class="dd-head"><b>${d} de ${MONTH_NAMES[m - 1].toLowerCase()}</b><span class="dd-chip${marked ? ' on' : ''}">${marked ? 'Dia de treino' : 'Sem treino'}</span></div>
    ${logs.length
      ? logs.map((l) => `<div class="dd-log"><span>${esc(l.exercise)}</span><span class="dd-val">${logChips(l)}</span></div>`).join('')
      : '<div class="dd-empty">Sem registos neste dia.</div>'}
    ${logs.length
      ? '<div class="dd-note">Marcado automaticamente pelos teus registos.</div>'
      : `<button class="dd-toggle" data-action="toggle-day" data-date="${iso}">${marked ? 'Desmarcar dia de treino' : 'Marcar como dia de treino'}</button>`}`;
}

function renderProgresso() {
  const year = state.calMonth.getFullYear(), month = state.calMonth.getMonth();
  const key = `${year}-${pad2(month + 1)}`;
  const t = today();
  const isCurrent = key >= monthKeyOf(new Date());

  if (state.selectedDay && !state.selectedDay.startsWith(key)) state.selectedDay = null;
  if (!state.selectedDay && isCurrent) state.selectedDay = t;

  const goal = goalFor(key);
  const sum = summarize({ logs: state.data.logs, gymDays: state.data.gymDays }, key, goal, t);
  const story = buildStory(sum, { name: state.user.name, focus: state.user.focus });
  const count = sum.sessions;

  const chips = [`<span class="s-chip">${icon('calendar', 14)}${goal ? `${count}/${goal} treinos` : `${count} ${count === 1 ? 'treino' : 'treinos'}`}</span>`];
  if (sum.minutes > 0) chips.push(`<span class="s-chip">${icon('activity', 14)}${sum.minutes} min de cardio/desporto</span>`);

  const bestsHtml = sum.bests.length ? `
    <div class="card">
      <h2>Melhor carga de cada exercício</h2>
      <div class="hl-list">${sum.bests.map((b) => `
        <div class="hl-row">
          <span class="hl-ico">${icon('star', 16)}</span>
          <span class="hl-name">${esc(b.name)}</span>
          <span class="hl-val"><b>${ptNum(b.weight, 2)} kg × ${b.reps}</b> <em>${fmtShort(b.date)}</em></span>
        </div>`).join('')}</div>
    </div>` : '';

  const logDays = new Set(state.data.logs.map((l) => l.date));
  const startDow = (new Date(year, month, 1).getDay() + 6) % 7; // semana começa à segunda
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let cells = '<div class="cal-day empty"></div>'.repeat(startDow);
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${key}-${pad2(d)}`;
    const future = iso > t;
    const done = !future && (state.data.gymDays.has(iso) || logDays.has(iso));
    cells += `<button class="cal-day${done ? ' done' : ''}${iso === t ? ' today' : ''}${iso === state.selectedDay ? ' sel' : ''}${future ? ' future' : ''}" data-action="select-day" data-date="${iso}" aria-pressed="${done}"${future ? ' disabled aria-label="Ainda não chegou"' : ''}>${d}</button>`;
  }

  const showGoalCard = isCurrent && (!goal || state.editingGoal);

  pageEl.innerHTML = `
    ${showGoalCard ? goalCardHtml(key, goal) : ''}
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

    ${bestsHtml}

    <div class="card">
      <div class="cal-summary">
        <div class="ring">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle class="ring-bg" cx="50" cy="50" r="42"/>
            <circle class="ring-fg" id="ring-fg" cx="50" cy="50" r="42" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${ringOffset(count, goal)}"/>
          </svg>
          <div class="ring-num" id="ring-num">${count}</div>
        </div>
        <div>
          <div class="cal-count" id="cal-count">${count} ida${count !== 1 ? 's' : ''} ao ginásio este mês</div>
          <div class="cal-goal">${goal ? `Meta: ${goal} dias de treino` : isCurrent ? 'Ainda sem meta este mês' : 'Sem meta definida neste mês'}${goal && isCurrent ? ' <button class="link-btn" data-action="goal-edit">Alterar</button>' : ''}</div>
        </div>
      </div>
      <div class="cal-grid">
        ${['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d) => `<div class="cal-dow">${d}</div>`).join('')}
        ${cells}
      </div>
      <div class="day-detail" id="day-detail">${dayDetailHtml(state.selectedDay)}</div>
    </div>`;
}

function goalCardHtml(key, goal) {
  const [y, m] = key.split('-').map(Number);
  const dim = daysInMonth(key);
  const first = !goal;
  return `
    <div class="card goal-card${first ? ' first' : ''}" id="goal-card">
      <div class="goal-head"><span class="goal-badge">${icon('target', 20)}</span>
        <div><h2>${first ? `Define a tua meta de ${MONTH_NAMES[m - 1].toLowerCase()}` : `Meta de ${MONTH_NAMES[m - 1].toLowerCase()}`}</h2>
        <p class="goal-sub">${first ? 'Novo mês, nova meta! Quantos dias queres treinar?' : 'Podes ajustar a meta quando quiseres durante o mês.'}</p></div></div>
      <div class="goal-picker">
        <button type="button" class="goal-step" data-action="goal-minus" aria-label="Menos um dia">${icon('minus', 20)}</button>
        <div class="goal-field"><input id="goal-days" type="number" inputmode="numeric" min="1" max="${dim}" value="${goal || 12}" aria-label="Dias de treino este mês"><span>dias</span></div>
        <button type="button" class="goal-step" data-action="goal-plus" aria-label="Mais um dia">${icon('plus', 20)}</button>
      </div>
      <div class="goal-chips">${GOAL_SUGGESTIONS.filter((n) => n <= dim).map((n) => `<button type="button" class="goal-chip-btn" data-action="goal-pick" data-n="${n}">${n}</button>`).join('')}</div>
      <p class="footnote">Dica: 3 treinos por semana são cerca de 12 dias por mês.</p>
      <div class="log-btns">
        <button class="save-btn" data-action="goal-save">${first ? 'Definir meta' : 'Atualizar meta'}</button>
        ${!first ? '<button class="log-cancel" data-action="goal-cancel">Cancelar</button>' : ''}
      </div>
      <div class="saved-flash" id="goal-flash"></div>
    </div>`;
}

async function saveGoal(btn) {
  const key = monthKeyOf(new Date());
  const raw = $('goal-days').value;
  const days = Number(raw);
  const flash = $('goal-flash');
  if (raw === '' || !Number.isInteger(days) || days < 1 || days > daysInMonth(key)) { flash.textContent = `Escolhe um número de dias entre 1 e ${daysInMonth(key)}.`; return; }
  btn.disabled = true;
  const [cx, cy] = centerOf(btn);
  try {
    await api.setGoal(uid(), state.pin, key, days);
    state.editingGoal = false;
    await refreshData();
    render();
    burst(cx, cy, 40);
    popSuccess();
    haptic([12, 40, 12]);
  } catch (e) {
    btn.disabled = false;
    toast(errorMessage(e.code));
  }
}

function stepGoal(delta) {
  const input = $('goal-days');
  const max = daysInMonth(monthKeyOf(new Date()));
  const v = Math.min(max, Math.max(1, (Number(input.value) || 12) + delta));
  input.value = v;
}

function selectDay(el) {
  state.selectedDay = el.dataset.date;
  pageEl.querySelectorAll('.cal-day.sel').forEach((x) => x.classList.remove('sel'));
  el.classList.add('sel');
  $('day-detail').innerHTML = dayDetailHtml(state.selectedDay);
}

async function toggleDay(iso) {
  const had = state.data.gymDays.has(iso);
  if (!had && iso > today()) { toast(errorMessage('future_date')); return; }
  const key = iso.slice(0, 7);
  const before = trainedCount(key);
  const setDay = (on) => { if (on) state.data.gymDays.add(iso); else state.data.gymDays.delete(iso); };
  const celebrate = (on) => {
    const fg = $('ring-fg');
    if (fg) { // anima o anel do valor antigo para o novo
      fg.style.strokeDashoffset = ringOffset(before, goalFor(key));
      void fg.getBoundingClientRect();
      fg.style.strokeDashoffset = ringOffset(trainedCount(key), goalFor(key));
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
    const out = await api.toggleGymDay(uid(), state.pin, iso);
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
  ['sono', 'Sono', 'moon'],
  ['progresso', 'Progresso', 'trend']
];

function renderNav() {
  const nav = $('nav');
  if (!nav.firstChild) {
    nav.style.setProperty('--tabs', PAGES.length);
    nav.innerHTML = '<div class="tab-indicator"></div>' + PAGES.map(([key, label, ic], i) =>
      `<button class="nav-btn" data-action="page" data-page="${key}" data-pitch="${(0.9 + i * 0.1).toFixed(2)}">${icon(ic, 22)}<span>${label}</span></button>`).join('');
  }
  const idx = PAGES.findIndex((p) => p[0] === state.page);
  nav.style.setProperty('--i', idx);
  nav.querySelectorAll('.nav-btn').forEach((b, i) => {
    b.classList.toggle('active', i === idx);
    b.classList.toggle('dot', PAGES[i][0] === 'progresso' && !!state.user && !goalFor(monthKeyOf(new Date())));
  });
}

const RENDERERS = { treino: renderTreino, medicao: renderMedicao, alimentacao: renderAlimentacao, sono: renderSono, progresso: renderProgresso };

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
    case 'group':
      state.group = d.group; state.openExercise = null; state.editingLog = null; state.confirm = null; state.addingExercise = false;
      break;
    case 'toggle-ex': toggleExercise(el); return;
    case 'metric': state.metric = d.metric; break;
    case 'toggle-meanings': state.showMeanings = !state.showMeanings; render(); return;
    case 'cal-prev': state.calMonth = new Date(state.calMonth.getFullYear(), state.calMonth.getMonth() - 1, 1); state.selectedDay = null; break;
    case 'cal-next': state.calMonth = new Date(state.calMonth.getFullYear(), state.calMonth.getMonth() + 1, 1); state.selectedDay = null; break;
    case 'goal-edit': state.editingGoal = true; render(); scrollToAndFocus('#goal-card'); return;
    case 'goal-cancel': state.editingGoal = false; render(); return;
    case 'goal-minus': stepGoal(-1); return;
    case 'goal-plus': stepGoal(1); return;
    case 'goal-pick': $('goal-days').value = d.n; return;
    case 'goal-save': saveGoal(el); return;
    case 'select-day': selectDay(el); return;
    case 'toggle-day': toggleDay(d.date); return;
    case 'save-log': saveLog(el); return;
    case 'add-set': addSetRow(el); return;
    case 'save-measurement': saveMeasurement(el); return;
    case 'save-sleep': saveSleep(el); return;
    case 'sleep-q': pickSleepQuality(el); return;
    case 'edit-sleep': state.sleepDate = d.day; state.confirm = null; render(); scrollToAndFocus('#sleep-form'); return;
    case 'del-sleep': state.confirm = `sleep:${d.day}`; render(); return;
    case 'edit-log':
      state.editingLog = Number(d.id); state.openExercise = d.ex; state.confirm = null;
      render(); scrollToAndFocus('.log-box.is-editing'); return;
    case 'cancel-edit': state.editingLog = null; render(); return;
    case 'del-log': state.confirm = `log:${d.id}`; render(); return;
    case 'edit-meas': state.editingMeas = d.date; state.confirm = null; render(); scrollToAndFocus('#meas-form'); return;
    case 'cancel-meas': state.editingMeas = null; render(); return;
    case 'del-meas': state.confirm = `meas:${d.date}`; render(); return;
    case 'add-ex-open': state.addingExercise = true; render(); scrollToAndFocus('#add-ex-form'); return;
    case 'add-ex-cancel': state.addingExercise = false; render(); return;
    case 'del-cex': state.confirm = `cex:${d.id}`; render(); return;
    case 'del-no': state.confirm = null; render(); return;
    case 'del-yes': confirmDelete(d.kind, d.id); return;
    case 'rest-start': rest.start(Number(d.sec), d.ex); return;
    default: return;
  }
  render(true); // mudança de secção/grupo/métrica/mês: entrada animada
}

pageEl.addEventListener('submit', (e) => {
  if (e.target.id === 'add-ex-form') { e.preventDefault(); saveCustomExercise(e.target); }
});

pageEl.addEventListener('change', (e) => {
  if (e.target.id === 'sl-date') { state.sleepDate = e.target.value || today(); state.confirm = null; render(); }
  if (e.target.id === 'cx-kind') $('cx-dist-row').hidden = e.target.value !== 'time';
});

// ---------- login ----------
const splashEl = $('splash');
const splashInner = $('splash-inner');
let leaveTimer = 0;

function showLogin() {
  splashEl.classList.add('pin-mode');
  let last = '';
  try { last = localStorage.getItem(LAST_NUMBER_KEY) || ''; } catch { /* ignora */ }
  splashInner.innerHTML = `<form class="login-box rise" id="login-form" autocomplete="on" novalidate>
    <div class="login-title">Entrar</div>
    <div class="login-sub">Usa o teu número de utilizador e a tua palavra-passe</div>
    <label class="lf"><span>${icon('user', 15)}Número de utilizador</span>
      <input id="lg-number" name="username" type="text" inputmode="numeric" autocomplete="username" autocapitalize="off" placeholder="ex: 1" value="${esc(last)}"></label>
    <label class="lf"><span>${icon('lock', 15)}Palavra-passe</span>
      <input id="lg-pass" name="password" type="password" autocomplete="current-password" placeholder="••••"></label>
    <div class="pin-error" id="pin-error" role="alert"></div>
    <button class="save-btn" id="lg-submit" type="submit">Entrar</button>
  </form>`;
  const form = $('login-form');
  (last ? $('lg-pass') : $('lg-number')).focus();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const number = $('lg-number').value.trim();
    const pass = $('lg-pass').value;
    const err = $('pin-error');
    if (!number || !pass) { err.textContent = 'Preenche o número e a palavra-passe.'; return; }
    const btn = $('lg-submit');
    btn.disabled = true;
    err.textContent = 'A verificar…';
    try {
      const out = await api.login(number, pass);
      try { localStorage.setItem(LAST_NUMBER_KEY, number); } catch { /* ignora */ }
      await startSession(out.profile, pass);
    } catch (ex) {
      err.textContent = ex.code === 'server'
        ? 'Não foi possível entrar. Se acabaste de atualizar a app, falta correr o ficheiro supabase/atualizar.sql no Supabase.'
        : errorMessage(ex.code);
      form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
      pop(0.55);
      haptic([30, 40, 30]);
      $('lg-pass').value = '';
      btn.disabled = false;
    }
  });
}

async function startSession(profile, pin) {
  const user = { id: profile.id, name: profile.name, focus: profile.focus || 'saude', cardio: profile.cardio || 'bicicleta', tone: toneFor(profile.name) };
  const out = await api.getData(user.id, pin);
  state.user = user;
  state.pin = pin;
  applyData(out);
  Object.assign(state, {
    page: 'treino', group: 'pernas', metric: 'weight', openExercise: null, showMeanings: false,
    calMonth: startOfMonth(new Date()), selectedDay: null, editingLog: null, editingMeas: null, confirm: null,
    addingExercise: false, editingGoal: false, sleepDate: null
  });
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ profile, pin })); } catch { /* ignora */ }

  $('avatar').className = `avatar ${user.tone}`;
  $('avatar').textContent = user.name[0].toUpperCase();
  $('header-eyebrow').textContent = `Hey, sweetie (aka ${user.name})`;
  const outdated = !isDemo && out.version !== 4;
  $('demo-banner').innerHTML = `${icon('alert', 16)}<span>${outdated
    ? 'Há novidades! Falta atualizar a base de dados: corre o ficheiro supabase/atualizar.sql no Supabase.'
    : 'Modo demo: os dados ficam só neste dispositivo. Liga o Supabase (ver README) para os guardar online.'}</span>`;
  $('demo-banner').hidden = !(isDemo || outdated);
  $('app').hidden = false;
  render(true);
  window.scrollTo(0, 0);
  if (!outdated && !goalFor(monthKeyOf(new Date()))) setTimeout(() => toast('Novo mês, nova meta! Define-a na aba Progresso.'), 900);

  splashEl.classList.add('leaving');
  clearTimeout(leaveTimer);
  leaveTimer = setTimeout(() => { splashEl.hidden = true; splashEl.classList.remove('leaving'); }, 520);
}

function logout() {
  rest.stop();
  state.user = null;
  state.pin = null;
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignora */ }
  clearTimeout(leaveTimer);
  $('app').hidden = true;
  splashEl.classList.remove('leaving');
  splashEl.hidden = false;
  showLogin();
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
  showLogin();
  // mantém a sessão ao recarregar a página (só enquanto o separador estiver aberto)
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (saved && saved.profile && saved.profile.id) await startSession(saved.profile, saved.pin);
  } catch { logout(); }
})();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
