// Resumo mensal de progresso: cálculo (funções puras) + texto motivacional.
// Sem DOM, por isso é fácil de testar. A carga é comparada pela estimativa de 1RM (fórmula de Epley):
// 1RM ≈ peso × (1 + repetições / 30).

export const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);
const isNum = (v) => v !== null && v !== undefined && v !== '' && !Number.isNaN(Number(v));

export const e1rm = (weight, reps) => Number(weight) * (1 + Number(reps) / 30);

// registo de força: séries × reps × peso (exclui cardio/desportos e exercícios sem carga)
export function isStrength(l) {
  return !isNum(l.minutes) && isNum(l.sets) && isNum(l.reps) && isNum(l.weight) && Number(l.weight) > 0;
}

export function prevMonthKey(key) {
  const [y, m] = key.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

const setText = (l) => `${round(Number(l.weight), 2)}kg × ${Number(l.reps)}`;

function compareExercises(month, prev) {
  const names = [...new Set(month.map((l) => l.exercise))];
  const rows = names.map((name) => {
    const cur = month.filter((l) => l.exercise === name).sort((a, b) => a.date.localeCompare(b.date));
    const best = cur.reduce((b, l) => (e1rm(l.weight, l.reps) > e1rm(b.weight, b.reps) ? l : b), cur[0]);
    const prevLogs = prev.filter((l) => l.exercise === name);
    let base = null, mode = null, top = best;
    if (prevLogs.length) {
      base = prevLogs.reduce((b, l) => (e1rm(l.weight, l.reps) > e1rm(b.weight, b.reps) ? l : b), prevLogs[0]);
      mode = 'prev';
    } else if (cur.length >= 2) {
      base = cur[0]; top = cur[cur.length - 1]; mode = 'within';
    }
    if (!base) return { name, trend: 'new', to: setText(best), pct: 0, deltaKg: 0 };
    const pct = (e1rm(top.weight, top.reps) - e1rm(base.weight, base.reps)) / e1rm(base.weight, base.reps);
    const trend = pct >= 0.02 ? 'up' : pct <= -0.02 ? 'down' : 'flat';
    return { name, trend, mode, from: setText(base), to: setText(top), pct: round(pct * 100, 0), deltaKg: round(Number(top.weight) - Number(base.weight), 2) };
  });
  const order = { up: 0, flat: 1, new: 2, down: 3 };
  return rows.sort((a, b) => order[a.trend] - order[b.trend] || b.pct - a.pct);
}

function bodyChange(measurements, key) {
  const inM = measurements.filter((m) => m.date.startsWith(key)).sort((a, b) => a.date.localeCompare(b.date));
  if (!inM.length) return null;
  const before = measurements.filter((m) => m.date < `${key}-01`).sort((a, b) => a.date.localeCompare(b.date)).pop();
  const ref = before || (inM.length >= 2 ? inM[0] : null);
  const cur = inM[inM.length - 1];
  if (!ref || ref === cur) return null;
  const d = (k) => (isNum(ref[k]) && isNum(cur[k]) ? round(Number(cur[k]) - Number(ref[k]), 2) : null);
  return { muscle: d('muscle'), body_fat: d('body_fat'), weight: d('weight') };
}

export function summarize({ logs, gymDays, measurements }, key, goal) {
  const inMonth = logs.filter((l) => l.date.startsWith(key));
  const inPrev = logs.filter((l) => l.date.startsWith(prevMonthKey(key)));
  const days = new Set([...gymDays].filter((d) => d.startsWith(key)));
  inMonth.forEach((l) => days.add(l.date));

  const strengthM = inMonth.filter(isStrength);
  const strengthP = inPrev.filter(isStrength);
  const volume = sum(strengthM, (l) => l.sets * l.reps * l.weight);
  const volumePrev = sum(strengthP, (l) => l.sets * l.reps * l.weight);
  const minutes = sum(inMonth.filter((l) => isNum(l.minutes)), (l) => Number(l.minutes));
  const highlights = compareExercises(strengthM, strengthP);
  const count = (t) => highlights.filter((h) => h.trend === t).length;
  const up = count('up'), down = count('down'), flat = count('flat');
  const comparable = up + down + flat;

  let verdict;
  if (!days.size && !inMonth.length) verdict = 'empty';
  else if (!comparable) verdict = 'starting';
  else if (up >= 1 && down === 0) verdict = up >= 2 ? 'flying' : 'rising';
  else if (up > down) verdict = 'rising';
  else if (down > up) verdict = 'dip';
  else verdict = 'steady';

  return {
    key, goal, sessions: days.size, volume: Math.round(volume), volumePrev: Math.round(volumePrev),
    volumePct: volumePrev > 0 ? round(((volume - volumePrev) / volumePrev) * 100, 0) : null,
    minutes, highlights, up, down, flat, verdict, body: bodyChange(measurements, key)
  };
}

// ---------- texto ----------

function hash(str) { let h = 0; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0; return h; }
const fill = (t, vars) => t.replace(/\{(\w+)\}/g, (_, k) => vars[k]);

const TITLES = {
  empty: ['Este mês ainda é uma tela em branco', 'Capítulo em branco, potencial de bestseller'],
  starting: ['Ponto de partida oficialmente marcado', 'Primeiros dados na praça!'],
  flying: ['Isto já é abuso de poder!', 'Alerta: pessoa perigosamente forte a caminho'],
  rising: ['A subir, e com estilo', 'O gráfico está apaixonado por ti'],
  steady: ['Modo consistência ativado', 'Firme como uma rocha (com melhor postura)'],
  dip: ['Recuar para saltar melhor', 'Plot twist: o regresso épico está a ser preparado']
};

const STORY = {
  empty: [
    '{name}, ainda não há registos neste mês. Os grandes filmes também começam com o ecrã preto, por isso regista o primeiro treino e deixa o teu eu do futuro agradecer.',
    'Nada registado por aqui, {name}, e não faz mal: o melhor momento para começar é agora, o segundo melhor é logo a seguir. Um treino, mesmo curtinho, já muda o enredo.'
  ],
  starting: [
    'Ainda não há com que comparar, {name}, e isso é uma notícia ótima: tudo o que vier daqui para a frente só pode ser progresso. É matemática e é irrefutável.',
    'Os primeiros números já cá estão, {name}! Guarda-os com carinho: daqui a uns meses vais olhar para eles como quem vê fotografias de bebé, com ternura e algum espanto.'
  ],
  flying: [
    '{name}, {exs} a subir e nenhum a queixar-se! Os pesos que levantavas há uns tempos estão a olhar para ti com respeito.',
    'Isto está a correr tão bem que a gravidade pediu uma reunião, {name}. {exs} a subir de carga: continua assim e o ginásio vai ter de te dar uma cadeira só para ti.'
  ],
  rising: [
    'Há evolução à vista, {name}! Pelo menos um exercício subiu e a tendência é claramente positiva. O corpo está a dizer "obrigada" na única língua que sabe: mais força.',
    '{name}, o teu caminho está a apontar para cima, e sem GPS! Continua a somar pequenas vitórias: é assim que se constroem as grandes.'
  ],
  steady: [
    'A carga manteve-se estável, {name}, e isso também é progresso: o corpo está a consolidar o que já conquistaste antes de dar o próximo salto. Estabilidade é o aquecimento da subida.',
    'Mês de estabilidade, {name}: o corpo está a arrumar a casa antes de receber mais peso. Quem consolida, constrói para durar.'
  ],
  dip: [
    'Alguns exercícios andaram um bocadinho para trás este mês, {name}, e está tudo bem: sono, stress e semanas malucas acontecem a toda a gente. Os melhores regressos começam com um passo atrás e um salto enorme a seguir.',
    'Este mês o gráfico fez uma pequena vénia, {name}, mas é só para tomar balanço. O músculo tem memória e vai lembrar-se de tudo assim que voltares em força.'
  ]
};

const SESSION_LINES = {
  goal: '{dias} de treino, meta batida! O sofá abriu um processo contra ti.',
  good: '{dias} de treino: o ginásio já sabe o teu nome e o teu sítio favorito.',
  some: '{dias} de treino: a semente está plantada, agora é só regar com constância.'
};

const MISSION = {
  hipertrofia: 'Próxima missão: mais 1–2 repetições ou um pouquinho mais de carga nos exercícios principais, com proteína a acompanhar. Sobrecarga progressiva é o teu superpoder.',
  definicao: 'Próxima missão: subir a carga devagarinho (o músculo é o teu melhor aliado na definição) e manter o cardio regular. Devagar e sempre, mas com pesos.',
  outro: 'Próxima missão: subir a carga ou as repetições um bocadinho de cada vez. Pequenos passos, grandes resultados.'
};

export function buildStory(sum, { name, focus, monthLabel }) {
  const h = hash(`${name}${sum.key}`);
  const pick = (arr) => arr[h % arr.length];
  const vars = { name, dias: sum.sessions === 1 ? '1 dia' : `${sum.sessions} dias`, exs: sum.up === 1 ? '1 exercício' : `${sum.up} exercícios` };
  const title = pick(TITLES[sum.verdict]);
  const lines = [fill(pick(STORY[sum.verdict]), vars)];

  if (sum.sessions > 0) {
    const t = sum.sessions >= sum.goal ? 'goal' : sum.sessions >= Math.ceil(sum.goal * 0.6) ? 'good' : 'some';
    lines.push(fill(SESSION_LINES[t], vars));
  }
  if (sum.volumePct !== null && sum.volumePct > 0) {
    lines.push(`Volume total de ${sum.volume.toLocaleString('pt-PT')} kg, ${sum.volumePct}% acima do mês passado: literalmente mais peso na tua história.`);
  } else if (sum.volumePct !== null && sum.volumePct < 0) {
    lines.push(`Volume total de ${sum.volume.toLocaleString('pt-PT')} kg (${sum.volumePct}% face ao mês passado): pausa tática, não derrota.`);
  }
  if (sum.minutes > 0) lines.push(`${sum.minutes} min de cardio e desporto: o teu coração mandou uma mensagem de agradecimento.`);
  if (sum.body) {
    const parts = [];
    if (sum.body.muscle > 0) parts.push(`massa muscular +${sum.body.muscle}kg (o espelho já anda a espalhar boatos)`);
    if (sum.body.body_fat < 0) parts.push(`gordura corporal ${sum.body.body_fat}% (a definição a fazer a sua entrada)`);
    if (parts.length) lines.push(`Nas medições: ${parts.join(' e ')}.`);
  }
  return { title, lines, mission: MISSION[focus] || MISSION.outro, monthLabel };
}
