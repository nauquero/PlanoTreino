import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const isDemo = !SUPABASE_URL.startsWith('https://') || SUPABASE_ANON_KEY.startsWith('COLE_AQUI');

const ERRORS = {
  invalid_pin: 'Código incorreto, tenta de novo.',
  locked: 'Demasiadas tentativas. Tenta novamente daqui a 15 minutos.',
  not_configured: 'O código deste perfil ainda não foi definido na base de dados.',
  network: 'Sem ligação à base de dados. Verifica a internet e tenta de novo.',
  future_date: 'Essa data ainda não aconteceu. Só podes registar hoje ou dias passados.',
  not_found: 'Esse registo já não existe. Atualiza a página.',
  last_measurement: 'Tem de ficar pelo menos uma medição guardada.'
};
export const errorMessage = (code) => ERRORS[code] || 'Ocorreu um erro. Tenta de novo.';

class ApiError extends Error {
  constructor(code) { super(code); this.code = code; }
}

// ---------- Supabase (funções RPC) ----------

async function rpc(fn, args) {
  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify(args)
    });
  } catch {
    throw new ApiError('network');
  }
  if (!res.ok) throw new ApiError('server');
  const out = await res.json();
  if (!out.ok) throw new ApiError(out.error || 'server');
  return out;
}

const remote = {
  login: (profile, pin) => rpc('login', { p_profile: profile, p_pin: pin }),
  getData: (profile, pin) => rpc('get_data', { p_profile: profile, p_pin: pin }),
  addMeasurement: (profile, pin, entry) => rpc('add_measurement', { p_profile: profile, p_pin: pin, p_entry: entry }),
  deleteMeasurement: (profile, pin, date) => rpc('delete_measurement', { p_profile: profile, p_pin: pin, p_date: date }),
  addLog: (profile, pin, entry) => rpc('add_log', { p_profile: profile, p_pin: pin, p_entry: entry }),
  updateLog: (profile, pin, id, entry) => rpc('update_log', { p_profile: profile, p_pin: pin, p_id: id, p_entry: entry }),
  deleteLog: (profile, pin, id) => rpc('delete_log', { p_profile: profile, p_pin: pin, p_id: id }),
  toggleGymDay: (profile, pin, day) => rpc('toggle_gym_day', { p_profile: profile, p_pin: pin, p_day: day })
};

// ---------- Modo demo (localStorage) ----------
// Só existe para veres o site a funcionar antes de ligares o Supabase.
// Não valida PINs (não há PINs no código do site).

const INITIAL = {
  mariana: { weight: 52.9, bmi: 19.9, body_fat: 15.9, sub_fat: 14.9, visceral: 2, water: 57.7, muscle: 41.8, bone: 2.67, bmr: 1331 },
  elia: { weight: 68, bmi: 26.6, body_fat: 35.7, sub_fat: 32.2, visceral: 9, water: 44.1, muscle: 41.1, bone: 2.62, bmr: 1314 }
};

const demoKey = (profile) => `plano-treino-demo-${profile}`;
const pad2 = (n) => String(n).padStart(2, '0');
function todayIso() { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }

function demoLoad(profile) {
  let d = null;
  try { const raw = localStorage.getItem(demoKey(profile)); if (raw) d = JSON.parse(raw); } catch { /* ignora */ }
  if (!d) d = { measurements: [{ date: '2026-09-29', ...INITIAL[profile] }], logs: [], gym_days: [] };
  let next = d.logs.reduce((m, l) => Math.max(m, l.id || 0), 0);
  d.logs.forEach((l) => { if (!l.id) l.id = ++next; });
  return d;
}
function demoSave(profile, data) {
  try { localStorage.setItem(demoKey(profile), JSON.stringify(data)); } catch { /* ignora */ }
}
const noFuture = (date) => { if (date > todayIso()) throw new ApiError('future_date'); };
const norm = (e) => ({ sets: null, reps: null, weight: null, minutes: null, distance: null, note: null, ...e });

const demo = {
  async login(profile, pin) {
    if (!/^\d{4}$/.test(pin)) throw new ApiError('invalid_pin');
    return { ok: true };
  },
  async getData(profile) { return { ok: true, version: 2, ...demoLoad(profile) }; },
  async addMeasurement(profile, pin, entry) {
    noFuture(entry.date);
    const d = demoLoad(profile);
    d.measurements = d.measurements.filter((m) => m.date !== entry.date).concat(entry).sort((a, b) => a.date.localeCompare(b.date));
    demoSave(profile, d);
    return { ok: true };
  },
  async deleteMeasurement(profile, pin, date) {
    const d = demoLoad(profile);
    if (d.measurements.length <= 1) throw new ApiError('last_measurement');
    if (!d.measurements.some((m) => m.date === date)) throw new ApiError('not_found');
    d.measurements = d.measurements.filter((m) => m.date !== date);
    demoSave(profile, d);
    return { ok: true };
  },
  async addLog(profile, pin, entry) {
    noFuture(entry.date);
    const d = demoLoad(profile);
    d.logs.unshift({ ...norm(entry), id: d.logs.reduce((m, l) => Math.max(m, l.id), 0) + 1 });
    if (!d.gym_days.includes(entry.date)) d.gym_days = d.gym_days.concat(entry.date).sort();
    demoSave(profile, d);
    return { ok: true };
  },
  async updateLog(profile, pin, id, entry) {
    noFuture(entry.date);
    const d = demoLoad(profile);
    const i = d.logs.findIndex((l) => l.id === id);
    if (i < 0) throw new ApiError('not_found');
    d.logs[i] = { ...norm(entry), id, exercise: d.logs[i].exercise };
    if (!d.gym_days.includes(entry.date)) d.gym_days = d.gym_days.concat(entry.date).sort();
    demoSave(profile, d);
    return { ok: true };
  },
  async deleteLog(profile, pin, id) {
    const d = demoLoad(profile);
    if (!d.logs.some((l) => l.id === id)) throw new ApiError('not_found');
    d.logs = d.logs.filter((l) => l.id !== id);
    demoSave(profile, d);
    return { ok: true };
  },
  async toggleGymDay(profile, pin, day) {
    const d = demoLoad(profile);
    const on = !d.gym_days.includes(day);
    if (on) noFuture(day);
    d.gym_days = on ? d.gym_days.concat(day).sort() : d.gym_days.filter((x) => x !== day);
    demoSave(profile, d);
    return { ok: true, on };
  }
};

export const api = isDemo ? demo : remote;
export { ApiError };
