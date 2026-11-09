// Sementes e níveis da Butty.
// Tudo o que a pessoa faz dá sementes; as sementes acumulam-se para sempre (nunca descem)
// e cada nível pede mais sementes do que o anterior. É sempre a mesma Butty, só sobe de nível.

// Sementes necessárias para subir do nível k para o nível k+1.
// Os primeiros 5 valores são fixos (pensados caso a caso); a partir daí a exigência cresce
// sempre ~1.5x, arredondada a múltiplos de 5, para que haja sempre um próximo nível com sentido.
const BASE_THRESHOLDS = [15, 20, 30, 50, 75];

function thresholdFor(levelIndex) {
  if (levelIndex < BASE_THRESHOLDS.length) return BASE_THRESHOLDS[levelIndex];
  let v = BASE_THRESHOLDS[BASE_THRESHOLDS.length - 1];
  for (let i = BASE_THRESHOLDS.length; i <= levelIndex; i++) v = Math.ceil((v * 1.5) / 5) * 5;
  return v;
}

const cumCache = [0];
function cumulativeFor(level) {
  while (cumCache.length <= level) cumCache.push(cumCache[cumCache.length - 1] + thresholdFor(cumCache.length - 1));
  return cumCache[level];
}

function levelForSeeds(seeds) {
  let level = 0;
  while (cumulativeFor(level + 1) <= seeds) level++;
  return level;
}

const LEVEL_ART = ['face-sleepy', 'face-shock', 'face-joy', 'face-love', 'face-wink', 'face-laugh'];
const LEVEL_NAMES = ['Butty bebé', 'Butty curiosa', 'Butty animada', 'Butty amorosa', 'Butty convencida', 'Butty radiante'];
const levelArt = (level) => LEVEL_ART[Math.min(level, LEVEL_ART.length - 1)];
const levelName = (level) => (level < LEVEL_NAMES.length ? LEVEL_NAMES[level] : `${LEVEL_NAMES[LEVEL_NAMES.length - 1]} · nível ${level + 1}`);

const DAY_MS = 86400000;
const parseIso = (iso) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const diffIso = (a, b) => Math.round((parseIso(b) - parseIso(a)) / DAY_MS);

function isoWeekKey(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = (dt.getUTCDay() + 6) % 7; // segunda = 0
  dt.setUTCDate(dt.getUTCDate() - dow + 3);
  const firstThu = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round((dt - firstThu) / (7 * DAY_MS));
  return `${dt.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
const monthKeyOf = (iso) => iso.slice(0, 7);

// Conta blocos completos de `runLen` dias seguidos dentro de um conjunto de dias "bons"
// (uma sequência de 6 dias com runLen 3 conta 2 blocos, não 1).
function runBonus(daySet, runLen, perRun) {
  const days = [...daySet].sort();
  let count = 0, curLen = 0, prev = null;
  for (const iso of days) {
    curLen = prev !== null && diffIso(prev, iso) === 1 ? curLen + 1 : 1;
    if (curLen === runLen) { count++; curLen = 0; }
    prev = iso;
  }
  return { count, seeds: count * perRun };
}

// Conta quantos grupos (semanas/meses, conforme keyFn) têm pelo menos `min` dias dentro deles.
function groupCount(days, keyFn, min) {
  const byKey = new Map();
  for (const iso of days) { const k = keyFn(iso); byKey.set(k, (byKey.get(k) || 0) + 1); }
  let count = 0;
  for (const n of byKey.values()) if (n >= min) count++;
  return count;
}

function cycleFilled(cycle) {
  if (!cycle || !cycle.status) return false;
  if (cycle.status === 'none') return true;
  return !!cycle.last_period;
}

export function computeSeeds(ctx) {
  const {
    profile = {}, trainedDays = new Set(), cardioDays = new Set(), sleepGoodDays = new Set(),
    mealGoodDays = new Set(), waterGoodDays = new Set(), restDays = new Set(), measurementDays = [],
    prCount = 0, goals = new Map(), today
  } = ctx;

  const perfectDays = new Set([...trainedDays].filter((d) => sleepGoodDays.has(d) && mealGoodDays.has(d) && waterGoodDays.has(d)));

  const sources = [];
  const add = (id, label, seeds, group, count = 1) => { if (seeds > 0) sources.push({ id, label, seeds, group, count }); };

  // Nível 0 → 1: dar os primeiros passos na conta
  add('name', 'Preencher o nome', (profile.first_name || '').trim() ? 5 : 0, 'conta');
  add('birth', 'Preencher a data de nascimento', profile.birth ? 5 : 0, 'conta');
  add('cycle', 'Preencher os dados do ciclo', cycleFilled(profile.cycle) ? 5 : 0, 'conta');

  // Nível 1 → 2: hábitos a pegar
  const streak3 = runBonus(trainedDays, 3, 10);
  add('streak3', '3 treinos em dias seguidos', streak3.seeds, 'semana', streak3.count);
  const cardioWeeks = groupCount(cardioDays, isoWeekKey, 2);
  add('cardioWeek', 'Cardio 2x na mesma semana', cardioWeeks * 5, 'semana', cardioWeeks);
  add('pr', 'Bater uma melhor carga', prCount * 5, 'semana', prCount);

  // Nível 2 → 3: consistência
  const fiveDayWeeks = groupCount(trainedDays, isoWeekKey, 5);
  add('fiveDayWeek', '5 dias de treino na mesma semana', fiveDayWeeks * 10, 'mes', fiveDayWeeks);
  const sleepStreak5 = runBonus(sleepGoodDays, 5, 10);
  add('sleepStreak5', '5 noites bem dormidas seguidas', sleepStreak5.seeds, 'mes', sleepStreak5.count);
  const measureMonths = groupCount(measurementDays, monthKeyOf, 1);
  add('measureMonth', 'Atualizar medidas pelo menos 1x no mês', measureMonths * 10, 'mes', measureMonths);

  // Nível 3 → 4: objetivos maiores
  const trainedByMonth = new Map();
  for (const d of trainedDays) { const k = monthKeyOf(d); trainedByMonth.set(k, (trainedByMonth.get(k) || 0) + 1); }
  let goalMonths = 0;
  for (const [month, target] of goals) if (month <= monthKeyOf(today) && (trainedByMonth.get(month) || 0) >= target) goalMonths++;
  add('goalMonth', 'Cumprir o objetivo mensal', goalMonths * 25, 'nivel', goalMonths);
  const perfectStreak14 = runBonus(perfectDays, 14, 25);
  add('perfectStreak14', '14 dias de pleno seguidos', perfectStreak14.seeds, 'nivel', perfectStreak14.count);

  // Todos os dias: os pilares diários (contam para sempre, um por dia)
  add('mealGood', 'Comer bem', mealGoodDays.size * 2, 'dia', mealGoodDays.size);
  add('waterGood', 'Beber a água toda', waterGoodDays.size * 2, 'dia', waterGoodDays.size);
  add('sleepGood', 'Dormir bem', sleepGoodDays.size * 2, 'dia', sleepGoodDays.size);
  add('trainedDay', 'Fazer o exercício do dia', trainedDays.size * 5, 'dia', trainedDays.size);
  // Treino e descanso partilham o mesmo desafio diário: num dia em que se treinou, o descanso não soma.
  const restOnly = [...restDays].filter((d) => !trainedDays.has(d)).length;
  add('restDay', 'Registar o descanso do dia', restOnly * 1, 'dia', restOnly);

  const total = sources.reduce((s, x) => s + x.seeds, 0);
  const level = levelForSeeds(total);
  const curFloor = cumulativeFor(level);
  const nextFloor = cumulativeFor(level + 1);
  const pct = Math.min(100, Math.round(((total - curFloor) / (nextFloor - curFloor)) * 100));

  return {
    total, level, pct, curFloor, nextFloor,
    inLevel: total - curFloor, needed: nextFloor - curFloor,
    img: levelArt(level), name: levelName(level), nextName: levelName(level + 1),
    sources: sources.sort((a, b) => b.seeds - a.seeds)
  };
}

// Progresso de um conjunto de dias "bons" seguidos que acaba hoje (ou ontem, se hoje ainda não conta).
function currentRun(daySet, today) {
  let d = daySet.has(today) ? today : shiftIso(today, -1);
  let n = 0;
  while (n < 400 && daySet.has(d)) { n++; d = shiftIso(d, -1); }
  return n;
}
function shiftIso(iso, delta) {
  const dt = new Date(parseIso(iso) + delta * DAY_MS);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}
// Num bloco de `len` dias seguidos, quanto falta para o próximo (um bloco acabado mostra-se cheio).
const runProgress = (run, len) => (run > 0 && run % len === 0 ? len : run % len);

// Progresso de cada desafio no período atual (hoje / esta semana / este mês / conta),
// para mostrar os desafios de forma visual (anel a encher). Devolve { id: { cur, target } }.
export function challengeProgress(ctx) {
  const {
    profile = {}, trainedDays = new Set(), cardioDays = new Set(), sleepGoodDays = new Set(),
    mealGoodDays = new Set(), waterGoodDays = new Set(), restDays = new Set(), measurementDays = [],
    prDays = [], goals = new Map(), today
  } = ctx;
  const week = isoWeekKey(today), month = monthKeyOf(today);
  const inWeek = (days) => [...days].filter((d) => d <= today && isoWeekKey(d) === week).length;
  const inMonth = (days) => [...days].filter((d) => d <= today && monthKeyOf(d) === month).length;
  const perfectDays = new Set([...trainedDays].filter((d) => sleepGoodDays.has(d) && mealGoodDays.has(d) && waterGoodDays.has(d)));
  const has = (set) => (set.has(today) ? 1 : 0);
  const goal = goals.get(month) || 0;
  return {
    mealGood: { cur: has(mealGoodDays), target: 1 },
    waterGood: { cur: has(waterGoodDays), target: 1 },
    sleepGood: { cur: has(sleepGoodDays), target: 1 },
    // Treino ou descanso: uma só bola dividida ao meio (treino +5, descanso +1).
    trainOrRest: trainedDays.has(today) ? { cur: 1, target: 1, mode: 'train' } : restDays.has(today) ? { cur: 1, target: 1, mode: 'rest' } : { cur: 0, target: 1, mode: null },
    streak3: { cur: runProgress(currentRun(trainedDays, today), 3), target: 3 },
    cardioWeek: { cur: Math.min(2, inWeek(cardioDays)), target: 2 },
    pr: { cur: Math.min(1, inWeek(new Set(prDays))), target: 1 },
    fiveDayWeek: { cur: Math.min(5, inWeek(trainedDays)), target: 5 },
    sleepStreak5: { cur: runProgress(currentRun(sleepGoodDays, today), 5), target: 5 },
    measureMonth: { cur: Math.min(1, inMonth(new Set(measurementDays))), target: 1 },
    goalMonth: goal ? { cur: Math.min(goal, inMonth(trainedDays)), target: goal } : { cur: 0, target: 0 },
    perfectStreak14: { cur: runProgress(currentRun(perfectDays, today), 14), target: 14 },
    name: { cur: (profile.first_name || '').trim() ? 1 : 0, target: 1 },
    birth: { cur: profile.birth ? 1 : 0, target: 1 },
    cycle: { cur: cycleFilled(profile.cycle) ? 1 : 0, target: 1 }
  };
}

// Para mostrar "como ganhar sementes", independente do que já foi feito.
// `short` é o nome curto que cabe por baixo do anel; `ic` o ícone; `page` para onde ir ao tocar.
export const SEED_GUIDE = [
  {
    group: 'dia', title: 'Hoje', items: [
      {
        id: 'trainOrRest', label: 'Treinar (+5) ou registar o descanso (+1)', short: 'Treino ou descanso', split: true, page: 'treino',
        halves: [{ mode: 'train', ic: 'dumbbell', seeds: 5, done: 'Treinou!' }, { mode: 'rest', ic: 'timer', seeds: 1, done: 'Descansou' }]
      },
      { id: 'sleepGood', label: 'Dormir bem (7h ou mais)', short: 'Sono 7h+', ic: 'moon', page: 'alimentacao', seeds: 2 },
      { id: 'mealGood', label: 'Comer bem', short: 'Comida', ic: 'leaf', page: 'alimentacao', seeds: 2 },
      { id: 'waterGood', label: 'Beber a água toda', short: 'Água', ic: 'droplet', page: 'alimentacao', seeds: 2 }
    ]
  },
  {
    group: 'semana', title: 'Semana', items: [
      { id: 'streak3', label: '3 treinos em dias seguidos', short: '3 seguidos', ic: 'flame', seeds: 10 },
      { id: 'cardioWeek', label: 'Cardio 2x na mesma semana', short: 'Cardio 2x', ic: 'activity', seeds: 5 },
      { id: 'pr', label: 'Bater uma melhor carga', short: 'Nova marca', ic: 'trend', seeds: 5 },
      { id: 'fiveDayWeek', label: '5 dias de treino na mesma semana', short: '5 treinos', ic: 'calendar', seeds: 10 }
    ]
  },
  {
    group: 'mes', title: 'Mês', items: [
      { id: 'sleepStreak5', label: '5 noites bem dormidas seguidas', short: '5 noites', ic: 'moon', seeds: 10 },
      { id: 'measureMonth', label: 'Atualizar medidas pelo menos 1x no mês', short: 'Medidas', ic: 'activity', page: 'progresso', seeds: 10 },
      { id: 'goalMonth', label: 'Cumprir o objetivo mensal', short: 'Objetivo', ic: 'target', page: 'progresso', seeds: 25 },
      { id: 'perfectStreak14', label: '14 dias de pleno seguidos', short: '14 plenos', ic: 'star', seeds: 25 }
    ]
  },
  {
    group: 'conta', title: 'Conta', items: [
      { id: 'name', label: 'Preencher o nome', short: 'Nome', ic: 'user', page: 'perfil', seeds: 5 },
      { id: 'birth', label: 'Preencher a data de nascimento', short: 'Aniversário', ic: 'calendar', page: 'perfil', seeds: 5 },
      { id: 'cycle', label: 'Preencher os dados do ciclo', short: 'Ciclo', ic: 'droplet', page: 'perfil', seeds: 5 }
    ]
  }
];
