// Resumo mensal de progresso: cálculo (funções puras) + texto motivacional.
// Sem DOM, por isso é fácil de testar. Sem comparações com meses anteriores:
// só factos (dias de treino, minutos, e a melhor carga de cada exercício).

export const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const isNum = (v) => v !== null && v !== undefined && v !== '' && !Number.isNaN(Number(v));
const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);

// Séries de um registo. Registos novos têm "sets_json" (uma linha por série);
// registos antigos têm séries × reps × peso iguais.
export function rowsOfLog(l) {
  if (Array.isArray(l.sets_json) && l.sets_json.length) {
    return l.sets_json.map((r) => ({ reps: isNum(r.reps) ? Number(r.reps) : null, weight: isNum(r.weight) ? Number(r.weight) : null }));
  }
  if (isNum(l.sets) && isNum(l.reps)) {
    return Array.from({ length: Math.max(1, Number(l.sets)) }, () => ({ reps: Number(l.reps), weight: isNum(l.weight) ? Number(l.weight) : null }));
  }
  return [];
}

// Melhor série com carga: o maior peso; a igualdade desempata-se pelas repetições.
export function bestSet(logs) {
  let best = null;
  for (const l of logs) {
    for (const r of rowsOfLog(l)) {
      if (!(r.weight > 0) || !(r.reps > 0)) continue;
      if (!best || r.weight > best.weight || (r.weight === best.weight && r.reps > best.reps)) best = { weight: r.weight, reps: r.reps, date: l.date };
    }
  }
  return best;
}

// Melhor tempo de um exercício isométrico (prancha): os segundos são guardados em "reps".
export function bestHold(logs) {
  let best = null;
  for (const l of logs) for (const r of rowsOfLog(l)) if (r.reps > 0 && (!best || r.reps > best.seconds)) best = { seconds: r.reps, date: l.date };
  return best;
}

export function summarize({ logs, gymDays }, key, goal, today) {
  const past = (d) => !today || d <= today; // dias futuros nunca contam
  const inMonth = logs.filter((l) => l.date.startsWith(key) && past(l.date));
  const days = new Set([...gymDays].filter((d) => d.startsWith(key) && past(d)));
  inMonth.forEach((l) => days.add(l.date));

  const minutes = sum(inMonth.filter((l) => isNum(l.minutes)), (l) => Number(l.minutes));
  const names = [...new Set(inMonth.map((l) => l.exercise))];
  const bests = names
    .map((name) => ({ name, ...bestSet(inMonth.filter((l) => l.exercise === name)) }))
    .filter((b) => b.weight > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt'));

  const s = days.size;
  const verdict = s === 0 ? 'empty' : s >= goal ? 'goal' : s >= Math.ceil(goal * 0.6) ? 'good' : 'few';
  return { key, goal, sessions: s, minutes, bests, verdict };
}

// ---------- texto ----------

function hash(str) { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; }
const fill = (t, vars) => t.replace(/\{(\w+)\}/g, (_, k) => vars[k]);

const TITLES = {
  empty: ['Este mês ainda é uma tela em branco', 'Capítulo em branco, potencial de bestseller'],
  few: ['A semente está plantada', 'Os grandes começos fazem pouco barulho'],
  good: ['A caminho da meta, e a fazer figura', 'Constância é o teu novo superpoder'],
  goal: ['Meta batida: aplausos de pé!', 'Isto já é abuso de poder!']
};

const STORY = {
  empty: [
    '{name}, ainda não há registos neste mês. Os grandes filmes também começam com o ecrã preto, por isso regista o primeiro treino e deixa o teu eu do futuro agradecer.',
    'Nada registado por aqui, {name}, e não faz mal: o melhor momento para começar é agora, o segundo melhor é logo a seguir. Um treino, mesmo curtinho, já muda o enredo.'
  ],
  few: [
    '{name}, já há treinos registados e isso muda tudo: o mais difícil (começar) já está feito. Agora é só dar continuidade, um treino de cada vez. Tens {dias} de treino.',
    'Bom começo, {name}! Cada treino é um voto na pessoa que queres ser, e tu já votaste {dias}.'
  ],
  good: [
    '{name}, estás a dar o exemplo: o ginásio já te trata pelo nome e o sofá já nem espera por ti. Já vais com {dias} de treino, continua assim!',
    'Que mês bonito, {name}! A consistência está a trabalhar a teu favor, mesmo nos dias em que a motivação foi de férias. {dias} de treino até agora.'
  ],
  goal: [
    '{name}, objetivo do mês cumprido com {dias} de treino! O sofá abriu um processo contra ti e o ginásio quer pôr o teu nome numa placa.',
    'Missão cumprida, {name}! Atingiste a meta do mês ({dias} de treino) e o teu eu do futuro mandou um abraço.'
  ]
};

const MISSION = {
  hipertrofia: 'Próxima missão: mais 1–2 repetições ou um pouquinho mais de carga nos exercícios principais, com proteína a acompanhar. Sobrecarga progressiva é o teu superpoder.',
  definicao: 'Próxima missão: subir a carga devagarinho (o músculo é o teu melhor aliado na definição) e manter o cardio regular. Devagar e sempre, mas com pesos.',
  saude: 'Próxima missão: manter a regularidade, mexer o corpo de formas que gostes e dormir bem. O resto vem por arrasto.'
};

export function buildStory(sum, { name, focus }) {
  const h = hash(`${name}${sum.key}`);
  const pick = (arr) => arr[h % arr.length];
  const vars = { name, dias: sum.sessions === 1 ? '1 dia' : `${sum.sessions} dias` };
  const lines = [fill(pick(STORY[sum.verdict]), vars)];
  if (sum.bests.length) {
    lines.push(`${sum.bests.length === 1 ? '1 exercício com carga registada' : `${sum.bests.length} exercícios com carga registada`}: lá em baixo vês a tua melhor carga em cada um.`);
  }
  if (sum.minutes > 0) lines.push(`${sum.minutes} min de cardio e desporto: o teu coração mandou uma mensagem de agradecimento.`);
  return { title: pick(TITLES[sum.verdict]), lines, mission: MISSION[focus] || MISSION.saude };
}
