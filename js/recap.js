// Resumos da Butty: no fim de cada mês e no fim do ano.
// Só cálculos e texto (sem DOM), para ser fácil de testar.
import { MONTH_NAMES, rowsOfLog } from './progress.js';
import { BUTTY_MONTHS } from './butty-months.js';

const pad2 = (n) => String(n).padStart(2, '0');
const num = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
const hashOf = (str) => str.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const pick = (arr, seed) => arr[hashOf(seed) % arr.length];
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const fmt1 = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);

export const monthName = (key) => MONTH_NAMES[Number(key.slice(5, 7)) - 1];
export const daysInKey = (key) => new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)), 0).getDate();
export function prevKey(key) {
  const y = Number(key.slice(0, 4)), m = Number(key.slice(5, 7));
  return m === 1 ? `${y - 1}-12` : `${y}-${pad2(m - 1)}`;
}
export function nextKey(key) {
  const y = Number(key.slice(0, 4)), m = Number(key.slice(5, 7));
  return m === 12 ? `${y + 1}-01` : `${y}-${pad2(m + 1)}`;
}

// Maior número de dias seguidos de um conjunto de datas ISO (já ordenadas ou não).
function longestRun(isoDays) {
  const sorted = [...isoDays].sort();
  let best = 0, run = 0, prev = null;
  for (const d of sorted) {
    const t = Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)));
    run = prev !== null && t - prev === 86400000 ? run + 1 : 1;
    if (run > best) best = run;
    prev = t;
  }
  return best;
}

function topOf(map) {
  let best = null;
  for (const [k, n] of map) if (!best || n > best[1]) best = [k, n];
  return best ? { name: best[0], count: best[1] } : null;
}

// Números de um período (um mês "2026-11" ou um ano "2026"): tudo o que as pessoas registaram.
// data = { logs, gymDays, sleep, meals, waters, restDays, moods }
// opts = { today, groupOf, groupLabel, prDays }
export function periodStats(data, prefix, opts = {}) {
  const { today = '9999-12-31', groupOf = () => 'outros', groupLabel = (g) => g, prDays = [] } = opts;
  const inP = (d) => typeof d === 'string' && d.startsWith(prefix) && d <= today;
  const logs = (data.logs || []).filter((l) => inP(l.date));
  const trained = new Set([...(data.gymDays || [])].filter(inP));
  logs.forEach((l) => trained.add(l.date));

  // cada exercício conta uma vez por dia
  const exDay = new Map();
  for (const l of logs) exDay.set(`${l.date}|${l.exercise}`, l.exercise);
  const exCount = new Map(), groupCount = new Map();
  for (const name of exDay.values()) {
    exCount.set(name, (exCount.get(name) || 0) + 1);
    const g = groupOf(name);
    groupCount.set(g, (groupCount.get(g) || 0) + 1);
  }
  let sets = 0, volume = 0, minutes = 0;
  for (const l of logs) {
    const m = num(l.minutes);
    if (m) minutes += m;
    for (const r of rowsOfLog(l)) {
      sets++;
      if (r.weight > 0 && r.reps > 0) volume += r.weight * r.reps;
    }
  }

  const sleep = (data.sleep || []).filter((s) => inP(s.day) && num(s.hours) !== null);
  const sleepAvg = sleep.length ? sleep.reduce((a, s) => a + Number(s.hours), 0) / sleep.length : null;
  const goodSleep = new Set(sleep.filter((s) => Number(s.hours) >= 7).map((s) => s.day));
  const goodMeals = new Set((data.meals || []).filter((m) => inP(m.day) && Number(m.ate) >= 1).map((m) => m.day));
  const water = new Set((data.waters || []).filter((w) => inP(w.day) && w.ok === true).map((w) => w.day));
  const rest = new Set((data.restDays || []).filter(inP));
  const moods = (data.moods || []).filter((m) => inP(m.day));
  const moodCount = new Map();
  moods.forEach((m) => moodCount.set(Number(m.mood), (moodCount.get(Number(m.mood)) || 0) + 1));
  const perfect = [...trained].filter((d) => goodSleep.has(d) && goodMeals.has(d) && water.has(d)).length;

  const fav = topOf(exCount);
  const topGroup = topOf(groupCount);
  return {
    prefix,
    sessions: trained.size,
    trainedDays: trained,
    longestRun: longestRun(trained),
    exercises: exDay.size,
    distinctExercises: exCount.size,
    favExercise: fav,
    topGroup: topGroup ? { ...topGroup, label: groupLabel(topGroup.name) } : null,
    sets,
    volume: Math.round(volume),
    minutes: Math.round(minutes),
    prs: prDays.filter(inP).length,
    sleepNights: sleep.length,
    sleepAvg,
    waterDays: water.size,
    mealDays: goodMeals.size,
    restDays: rest.size,
    perfect,
    moods: moods.length,
    topMood: topOf(moodCount),
    any: trained.size + sleep.length + water.size + goodMeals.size + rest.size + moods.length > 0
  };
}

// ---------- resumo do mês ----------

export function monthRecap(data, key, opts = {}) {
  const s = periodStats(data, key, opts);
  const goal = opts.goal || null;
  const prev = periodStats(data, prevKey(key), opts);
  const level = s.sessions === 0 ? 'zero'
    : goal && s.sessions >= goal ? 'goal'
      : (goal ? s.sessions >= goal * 0.8 : s.sessions >= 12) ? 'great'
        : (goal ? s.sessions >= goal * 0.5 : s.sessions >= 6) ? 'good' : 'start';
  return { ...s, key, goal, goalHit: !!goal && s.sessions >= goal, prevSessions: prev.sessions, level, monthIdx: Number(key.slice(5, 7)) - 1, days: daysInKey(key) };
}

const MONTH_OPENERS = {
  zero: [
    'Este mês o sofá ganhou a corrida. Mas eu não guardo rancor, e tu também não deves.',
    'Mês de pausa, acontece às melhores corças. O importante é voltar, e eu fico à tua espera.'
  ],
  start: [
    'Houve treinos, e cada um contou. Começar é a parte mais difícil, e essa já está feita.',
    'Foi um mês de arranque: poucos treinos, mas todos valeram sementes e orgulho.'
  ],
  good: [
    'Bom mês! Já se nota uma rotina a crescer, e eu cresci contigo.',
    'Gostei muito deste mês: constância a sério, sem dramas. Assim é que é!'
  ],
  great: [
    'Que mês! Estiveste quase sempre lá, e eu andei aos saltos de contente.',
    'Mês fortíssimo! Quase sem falhas, até o meu rabinho abanou de orgulho.'
  ],
  goal: [
    'META CUMPRIDA! Fiz uma dança da vitória no meio da floresta. 🏆',
    'Bateste a meta do mês! Isto merece confettis, sementes e um abraço de corça. 🏆'
  ]
};

const LEVEL_FACE = { zero: 'face-sleepy', start: 'face-joy', good: 'face-love', great: 'face-wink', goal: 'face-laugh' };
export const recapFace = (level) => LEVEL_FACE[level] || 'face-joy';

// A opinião da Butty sobre o mês: 3 ou 4 frases curtas.
export function buttyMonthOpinion(r) {
  const seed = `${r.key}-${r.sessions}`;
  const out = [pick(MONTH_OPENERS[r.level], seed)];
  const extras = [];
  if (r.prs > 0) extras.push(`Bateste ${plural(r.prs, 'recorde', 'recordes')} de carga. Vi tudo e já contei às outras corças! 🏋️`);
  if (r.sessions > 0 && r.prevSessions > 0 && r.sessions > r.prevSessions) extras.push(`Treinaste mais ${plural(r.sessions - r.prevSessions, 'vez', 'vezes')} do que em ${lower(monthName(prevKey(r.key)))}. Estou mesmo convencida!`);
  if (r.longestRun >= 3) extras.push(`A tua maior sequência foram ${r.longestRun} dias seguidos a treinar. Que ritmo!`);
  if (r.perfect > 0) extras.push(`Tiveste ${plural(r.perfect, 'dia', 'dias')} em pleno (treino, sono, comida e água). São os meus favoritos! ✨`);
  if (r.sleepNights >= 5 && r.sleepAvg < 7) extras.push(`Só um reparo: dormiste ${fmt1(r.sleepAvg)} h em média. Eu não abdico da minha soneca, e tu também não devias. 😴`);
  else if (r.sleepNights >= 5) extras.push(`Dormiste ${fmt1(r.sleepAvg)} h em média: assim até dá gosto acordar. 🌙`);
  if (r.waterDays >= 10) extras.push(`${plural(r.waterDays, 'dia', 'dias')} com a água em dia. Hidratação de campeã! 💧`);
  if (r.minutes >= 60) extras.push(`${r.minutes} minutos de cardio e desporto. O teu coração mandou-me um obrigado. ❤️`);
  if (r.sessions > 0 && r.prevSessions === 0 && r.level !== 'zero') extras.push('E voltaste aos treinos depois de um mês parado. Isso é que é garra!');
  out.push(...extras.slice(0, 3));
  const next = BUTTY_MONTHS[(r.monthIdx + 1) % 12];
  out.push(r.level === 'zero'
    ? `Em ${lower(next.name)} recomeçamos juntas, combinado? Eu até já me vesti a rigor: ${next.title} ${next.acc}`
    : `Em ${lower(next.name)} vou ser a ${next.title} ${next.acc}. Bora continuar?`);
  return out;
}

// ---------- resumo do ano ----------

export function yearRecap(data, year, opts = {}) {
  const goals = opts.goals || new Map();
  const y = String(year);
  const months = Array.from({ length: 12 }, (_, i) => {
    const key = `${y}-${pad2(i + 1)}`;
    const s = periodStats(data, key, opts);
    const goal = goals.get(key) || null;
    return { key, idx: i, name: MONTH_NAMES[i], sessions: s.sessions, goal, goalHit: !!goal && s.sessions >= goal, prs: s.prs, minutes: s.minutes, perfect: s.perfect, any: s.any, future: key > (opts.today || '9999').slice(0, 7) };
  });
  const tot = periodStats(data, y, opts);
  const active = months.filter((m) => m.sessions > 0);
  const best = active.length ? active.reduce((a, m) => (m.sessions > a.sessions ? m : a)) : null;
  return {
    year: Number(year), months, ...tot,
    activeMonths: active.length,
    goalsHit: months.filter((m) => m.goalHit).length,
    goalsSet: months.filter((m) => m.goal).length,
    bestMonth: best,
    maxSessions: Math.max(1, ...months.map((m) => m.sessions))
  };
}

// Destaques do ano (os que existirem), por ordem de importância.
export function yearHighlights(r) {
  const h = [];
  if (r.bestMonth) h.push({ em: '🏆', title: 'O teu melhor mês', text: `${r.bestMonth.name}, com ${plural(r.bestMonth.sessions, 'treino', 'treinos')}.` });
  if (r.longestRun >= 2) h.push({ em: '🔥', title: 'Maior sequência', text: `${r.longestRun} dias seguidos a treinar.` });
  if (r.goalsHit > 0) h.push({ em: '🎯', title: 'Metas cumpridas', text: `${r.goalsHit} de ${plural(r.goalsSet, 'meta definida', 'metas definidas')}.` });
  if (r.favExercise) h.push({ em: '💪', title: 'Exercício favorito', text: `${r.favExercise.name} (${plural(r.favExercise.count, 'dia', 'dias')}).` });
  if (r.topGroup && r.topGroup.name !== 'outros') h.push({ em: '🦵', title: 'Parte do corpo mais treinada', text: `${r.topGroup.label}.` });
  if (r.prs > 0) h.push({ em: '🏋️', title: 'Recordes de carga', text: `${plural(r.prs, 'recorde batido', 'recordes batidos')}.` });
  if (r.volume > 0) h.push({ em: '⚖️', title: 'Peso levantado', text: `${r.volume.toLocaleString('pt-PT')} kg no total (peso × repetições).` });
  if (r.minutes > 0) h.push({ em: '⏱️', title: 'Cardio e desporto', text: `${r.minutes.toLocaleString('pt-PT')} minutos.` });
  if (r.perfect > 0) h.push({ em: '✨', title: 'Dias em pleno', text: `${plural(r.perfect, 'dia', 'dias')} com treino, sono, comida e água em dia.` });
  if (r.sleepNights >= 10) h.push({ em: '🌙', title: 'Sono', text: `${fmt1(r.sleepAvg)} h por noite, em média.` });
  if (r.waterDays > 0) h.push({ em: '💧', title: 'Água', text: `${plural(r.waterDays, 'dia', 'dias')} com a água em dia.` });
  return h;
}

export function buttyYearOpinion(r) {
  const seed = `${r.year}-${r.sessions}`;
  const out = [];
  if (r.sessions === 0) out.push('Este ano foi mais de descanso, e eu gosto de ti na mesma. O próximo pode ser o nosso ano!');
  else if (r.sessions >= 120) out.push(pick(['Que ano, que ANO! Mais de cem treinos: és oficialmente uma lenda da floresta. 👑', 'Treinaste mais vezes do que eu como sementes (e eu como muitas). Ano histórico! 👑'], seed));
  else if (r.sessions >= 50) out.push(pick(['Foi um ano a sério: constância, esforço e muitas sementes. Estou tão orgulhosa!', 'Olho para este ano e só vejo uma coisa: alguém que não desistiu. Orgulho máximo!'], seed));
  else out.push(pick(['Cada treino deste ano foi um passo, e juntos fizeram um caminho bonito.', 'Este ano plantaste sementes. No próximo vamos vê-las crescer!'], seed));
  if (r.activeMonths >= 10) out.push(`Treinaste em ${r.activeMonths} dos 12 meses. Isso é que é constância!`);
  if (r.bestMonth && r.sessions > 0) out.push(`${r.bestMonth.name} foi o teu mês de ouro, e eu ainda me lembro bem dele.`);
  out.push(`Para ${r.year + 1} só peço três coisas: água, sono e tu a treinar comigo. Feliz ano novo! 🎉`);
  return out;
}

// ---------- quando mostrar ----------

// Resumo do mês: do último dia do mês (a partir das 18h) até ao dia 10 do mês seguinte.
// Devolve a chave do mês a resumir, ou null.
export function dueMonthRecap(now = new Date()) {
  const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
  const last = new Date(y, m, 0).getDate();
  if (d === last && now.getHours() >= 18) return `${y}-${pad2(m)}`;
  if (d <= 10) return m === 1 ? `${y - 1}-12` : `${y}-${pad2(m - 1)}`;
  return null;
}

// Resumo do ano: de 31 de dezembro (a partir das 18h) até 15 de janeiro.
export function dueYearRecap(now = new Date()) {
  const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
  if (m === 12 && d === 31 && now.getHours() >= 18) return y;
  if (m === 1 && d <= 15) return y - 1;
  return null;
}
