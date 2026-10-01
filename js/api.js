import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const isDemo = !SUPABASE_URL.startsWith('https://') || SUPABASE_ANON_KEY.startsWith('COLE_AQUI');

const ERRORS = {
  invalid_pin: 'Código incorreto, tenta de novo.',
  locked: 'Demasiadas tentativas. Tenta novamente daqui a 15 minutos.',
  not_configured: 'O código deste perfil ainda não foi definido na base de dados.',
  network: 'Sem ligação à base de dados. Verifica a internet e tenta de novo.',
  future_date: 'Essa data ainda não aconteceu. Só podes registar hoje ou dias passados.',
  not_found: 'Esse registo já não existe. Atualiza a página.',
  duplicate: 'Já existe um exercício com esse nome neste grupo.',
  invalid: 'Valor inválido. Confirma e tenta de novo.'
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
  login: (number, pin) => rpc('login_user', { p_number: number, p_pin: pin }),
  getData: (profile, pin) => rpc('get_data', { p_profile: profile, p_pin: pin }),
  addMeasurement: (profile, pin, entry) => rpc('add_measurement', { p_profile: profile, p_pin: pin, p_entry: entry }),
  deleteMeasurement: (profile, pin, date) => rpc('delete_measurement', { p_profile: profile, p_pin: pin, p_date: date }),
  addLog: (profile, pin, entry) => rpc('add_log', { p_profile: profile, p_pin: pin, p_entry: entry }),
  updateLog: (profile, pin, id, entry) => rpc('update_log', { p_profile: profile, p_pin: pin, p_id: id, p_entry: entry }),
  deleteLog: (profile, pin, id) => rpc('delete_log', { p_profile: profile, p_pin: pin, p_id: id }),
  toggleGymDay: (profile, pin, day) => rpc('toggle_gym_day', { p_profile: profile, p_pin: pin, p_day: day }),
  setSleep: (profile, pin, entry) => rpc('set_sleep', { p_profile: profile, p_pin: pin, p_entry: entry }),
  deleteSleep: (profile, pin, day) => rpc('delete_sleep', { p_profile: profile, p_pin: pin, p_day: day }),
  addCustomExercise: (profile, pin, entry) => rpc('add_custom_exercise', { p_profile: profile, p_pin: pin, p_entry: entry }),
  deleteCustomExercise: (profile, pin, id) => rpc('delete_custom_exercise', { p_profile: profile, p_pin: pin, p_id: id }),
  setGoal: (profile, pin, month, days) => rpc('set_goal', { p_profile: profile, p_pin: pin, p_month: month, p_days: days })
};

// ---------- Modo demo (localStorage) ----------
// Só existe para veres o site a funcionar antes de ligares o Supabase.
// Não valida PINs (não há PINs no código do site).

const INITIAL = { weight: 60, bmi: 22, body_fat: 25, sub_fat: 22, visceral: 4, water: 52, muscle: 40, bone: 2.5, bmr: 1350 };

const demoKey = (profile) => `plano-treino-demo-${profile}`;
const pad2 = (n) => String(n).padStart(2, '0');
function todayIso() { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }

function demoLoad(profile) {
  let d = null;
  try { const raw = localStorage.getItem(demoKey(profile)); if (raw) d = JSON.parse(raw); } catch { /* ignora */ }
  if (!d) d = { measurements: [{ date: '2026-09-29', ...INITIAL }], logs: [], gym_days: [], sleep: [], custom_exercises: [], goals: [] };
  d.goals = d.goals || [];
  d.sleep = d.sleep || [];
  d.custom_exercises = d.custom_exercises || [];
  let next = d.logs.reduce((m, l) => Math.max(m, l.id || 0), 0);
  d.logs.forEach((l) => { if (!l.id) l.id = ++next; });
  return d;
}
function demoSave(profile, data) {
  try { localStorage.setItem(demoKey(profile), JSON.stringify(data)); } catch { /* ignora */ }
}
const noFuture = (date) => { if (date > todayIso()) throw new ApiError('future_date'); };
const norm = (e) => ({ sets: null, reps: null, weight: null, minutes: null, distance: null, note: null, sets_json: null, ...e });

const demo = {
  async login(number, pin) {
    if (!/^\d{1,6}$/.test(String(number).trim()) || String(pin).length < 4) throw new ApiError('invalid_pin');
    const n = String(number).trim();
    const focus = n === '1' ? 'hipertrofia' : n === '2' ? 'definicao' : 'saude';
    return { ok: true, profile: { id: `demo-${n}`, name: `Convidada ${n}`, focus, cardio: n === '1' ? 'escadas' : 'bicicleta' } };
  },
  async getData(profile) { return { ok: true, version: 4, ...demoLoad(profile) }; },
  async addMeasurement(profile, pin, entry) {
    noFuture(entry.date);
    const d = demoLoad(profile);
    d.measurements = d.measurements.filter((m) => m.date !== entry.date).concat(entry).sort((a, b) => a.date.localeCompare(b.date));
    demoSave(profile, d);
    return { ok: true };
  },
  async deleteMeasurement(profile, pin, date) {
    const d = demoLoad(profile);
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
  },
  async setSleep(profile, pin, entry) {
    noFuture(entry.day);
    const d = demoLoad(profile);
    d.sleep = d.sleep.filter((x) => x.day !== entry.day).concat({ day: entry.day, hours: entry.hours, quality: entry.quality }).sort((a, b) => b.day.localeCompare(a.day));
    demoSave(profile, d);
    return { ok: true };
  },
  async deleteSleep(profile, pin, day) {
    const d = demoLoad(profile);
    if (!d.sleep.some((x) => x.day === day)) throw new ApiError('not_found');
    d.sleep = d.sleep.filter((x) => x.day !== day);
    demoSave(profile, d);
    return { ok: true };
  },
  async addCustomExercise(profile, pin, entry) {
    const d = demoLoad(profile);
    const name = String(entry.name || '').trim();
    if (name.length < 2 || name.length > 40) throw new ApiError('invalid');
    if (d.custom_exercises.some((c) => c.group_key === entry.group_key && c.name.toLowerCase() === name.toLowerCase())) throw new ApiError('duplicate');
    d.custom_exercises.push({ id: d.custom_exercises.reduce((m, c) => Math.max(m, c.id), 0) + 1, group_key: entry.group_key, name, kind: entry.kind, effort: entry.effort, distance_unit: entry.distance_unit || null });
    demoSave(profile, d);
    return { ok: true };
  },
  async setGoal(profile, pin, month, days) {
    const now = new Date();
    const cur = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
    const nx = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nxt = `${nx.getFullYear()}-${pad2(nx.getMonth() + 1)}`;
    const [y, m] = String(month).split('-').map(Number);
    const dim = new Date(y, m, 0).getDate();
    if (!/^\d{4}-\d{2}$/.test(month) || month < cur || month > nxt || !Number.isInteger(days) || days < 1 || days > dim) throw new ApiError('invalid');
    const d = demoLoad(profile);
    d.goals = d.goals.filter((g) => g.month !== month).concat({ month, days }).sort((a, b) => a.month.localeCompare(b.month));
    demoSave(profile, d);
    return { ok: true };
  },
  async deleteCustomExercise(profile, pin, id) {
    const d = demoLoad(profile);
    if (!d.custom_exercises.some((c) => c.id === id)) throw new ApiError('not_found');
    d.custom_exercises = d.custom_exercises.filter((c) => c.id !== id);
    demoSave(profile, d);
    return { ok: true };
  }
};

export const api = isDemo ? demo : remote;
export { ApiError };
