import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const isDemo = !SUPABASE_URL.startsWith('https://') || SUPABASE_ANON_KEY.startsWith('COLE_AQUI');

const ERRORS = {
  invalid_pin: 'Código incorreto, tenta de novo.',
  locked: 'Demasiadas tentativas. Tenta novamente daqui a 15 minutos.',
  not_configured: 'O código deste perfil ainda não foi definido na base de dados.',
  network: 'Sem ligação à base de dados. Verifica a internet e tenta de novo.'
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
  addLog: (profile, pin, entry) => rpc('add_log', { p_profile: profile, p_pin: pin, p_entry: entry }),
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

function demoLoad(profile) {
  try {
    const raw = localStorage.getItem(demoKey(profile));
    if (raw) return JSON.parse(raw);
  } catch { /* ignora */ }
  return { measurements: [{ date: '2026-09-29', ...INITIAL[profile] }], logs: [], gym_days: [] };
}
function demoSave(profile, data) {
  try { localStorage.setItem(demoKey(profile), JSON.stringify(data)); } catch { /* ignora */ }
}

const demo = {
  async login(profile, pin) {
    if (!/^\d{4}$/.test(pin)) throw new ApiError('invalid_pin');
    return { ok: true };
  },
  async getData(profile) { return { ok: true, ...demoLoad(profile) }; },
  async addMeasurement(profile, pin, entry) {
    const d = demoLoad(profile);
    d.measurements = d.measurements.filter((m) => m.date !== entry.date).concat(entry).sort((a, b) => a.date.localeCompare(b.date));
    demoSave(profile, d);
    return { ok: true };
  },
  async addLog(profile, pin, entry) {
    const d = demoLoad(profile);
    d.logs.unshift(entry);
    demoSave(profile, d);
    return { ok: true };
  },
  async toggleGymDay(profile, pin, day) {
    const d = demoLoad(profile);
    const on = !d.gym_days.includes(day);
    d.gym_days = on ? d.gym_days.concat(day).sort() : d.gym_days.filter((x) => x !== day);
    demoSave(profile, d);
    return { ok: true, on };
  }
};

export const api = isDemo ? demo : remote;
export { ApiError };
