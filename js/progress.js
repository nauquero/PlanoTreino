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
  const verdict = s === 0 ? 'empty' : !goal ? 'few' : s >= goal ? 'goal' : s >= Math.ceil(goal * 0.6) ? 'good' : 'few';
  return { key, goal, sessions: s, minutes, bests, verdict };
}

// ---------- texto ----------

const fill = (t, vars) => t.replace(/\{(\w+)\}/g, (_, k) => vars[k]);

// Uma mensagem diferente para cada número de treinos no mês (0 a 31).
// {name} = nome da pessoa, {dias} = "1 dia" / "5 dias".
const ENTRIES = [
  ['Este mês ainda é uma tela em branco', '{name}, ainda não há treinos registados neste mês. Os grandes filmes também começam com o ecrã preto: regista o primeiro treino e deixa o teu eu do futuro agradecer.'],
  ['O primeiro passo está dado', '{dias} de treino: a parte mais difícil (começar) já ficou para trás. O sofá ficou a olhar para a porta sem perceber nada.'],
  ['Já há aquecimento!', '{dias} de treino. Dois é o princípio de um hábito, e um hábito é o princípio de uma lenda. {name}, o ginásio já está a decorar o teu nome.'],
  ['A constância está a acordar', '{dias} de treino! O corpo começa a desconfiar que isto é para continuar, e o sofá já pediu transferência.'],
  ['Quatro sinais de vida (muito fit)', '{dias} de treino, {name}. Já dá para dizer que isto é uma rotina e não uma boa intenção de segunda-feira.'],
  ['Cinco estrelas, com esforço incluído', '{dias} de treino. A semana de trabalho de quem se leva a sério: cinco dias de dedicação e muito orgulho.'],
  ['Meia dúzia de suor', '{dias} de treino. Meia dúzia de razões para sorrir ao espelho e uma dúzia de razões para beber água.'],
  ['Uma semana inteira de energia', '{dias} de treino. Se fossem seguidos, era uma semana completa! Mesmo espaçados, o resultado é o mesmo: estás a ficar cada vez mais forte.'],
  ['Oito treinos, oito vitórias', '{dias} de treino, e cada um foi uma discussão ganha à preguiça. Resultado final: preguiça 0, {name} 8.'],
  ['Quase em dois dígitos', '{dias} de treino. Falta só um para o clube dos dois dígitos, e esse clube tem muito bom ambiente.'],
  ['Dois dígitos, que classe!', '{dias} de treino. Chegaste ao clube dos dois dígitos, e o lugar já estava reservado para ti.'],
  ['Onze a caminho da dúzia', '{dias} de treino, {name}. O ginásio já te guarda o lugar favorito, e a máquina já tem saudades tuas.'],
  ['Uma dúzia certinha', '{dias} de treino: exatamente uma dúzia, e da boa (sem ovos partidos).'],
  ['Treze: a sorte de quem treina', '{dias} de treino. Há quem tenha medo do número 13; os teus músculos preferem chamar-lhe sorte treinada.'],
  ['Duas semanas de pura dedicação', '{dias} de treino. Duas semanas de rotina e o corpo já começou a reparar nas mudanças (e a gostar delas).'],
  ['Meio mês, meio mundo conquistado', '{dias} de treino, {name}. Tens um ritmo de dar inveja ao relógio.'],
  ['Dezasseis e a ganhar balanço', '{dias} de treino. A inércia perdeu a batalha: quem está em movimento tende a ficar em movimento!'],
  ['Dezassete: o músculo já te conhece', '{dias} de treino. O teu músculo já sabe o teu nome, o teu horário e a tua playlist favorita.'],
  ['Dezoito: maioridade desportiva', '{dias} de treino. Chegaste à maioridade desportiva: já podes votar nas músicas do ginásio.'],
  ['Dezanove: a um passo dos vinte', '{dias} de treino. A um treino de uma marca redonda, e o teu eu do futuro já está a preparar o discurso.'],
  ['Vinte treinos: nível lenda', '{dias} de treino. Isto já merecia cartão de sócio vitalício e um lugar na parede da fama.'],
  ['Vinte e um: ritmo de campeão', '{dias} de treino, {name}. Com esta constância és oficialmente imparável.'],
  ['Vinte e dois e sem travões', '{dias} de treino. O teu ritmo está tão bom que o calendário pediu um autógrafo.'],
  ['Vinte e três: orgulho em modo máximo', '{dias} de treino. Se a constância tivesse um troféu, já estava a ser embrulhado com laço.'],
  ['Vinte e quatro: a render o dia inteiro', '{dias} de treino. Se o mês fosse um jogo, estavas na ronda final com o troféu à vista.'],
  ['Vinte e cinco: um quarto de século de força', '{dias} de treino. Isto é número de atleta de elite com horário de ginásio flexível.'],
  ['Vinte e seis: a lenda está viva', '{dias} de treino, {name}. Fazem-se filmes com menos dedicação do que isto.'],
  ['Vinte e sete: modo máquina', '{dias} de treino. O ginásio devia pagar-te comissão pelo ambiente que crias.'],
  ['Vinte e oito: um fevereiro cheio', '{dias} de treino. Um por cada dia de um fevereiro cheio; só falta pedir um dia de bónus ao calendário.'],
  ['Vinte e nove: a um fio da perfeição', '{dias} de treino. A consistência é tanta que o descanso te mandou uma mensagem a pedir atenção (dá-lhe um dia, ele merece).'],
  ['Trinta: o mês quase inteiro', '{dias} de treino. Quase todos os dias do mês, {name}! O corpo agradece, a cabeça também, e a água do ginásio já te chama pelo nome.'],
  ['Trinta e um: o mês completo', '{dias} de treino: um mês inteiro sem falhar! Lembra-te só de descansar também, que o músculo cresce na pausa.']
];

const MISSION = {
  hipertrofia: 'Próxima missão: mais 1–2 repetições ou um pouquinho mais de carga nos exercícios principais, com proteína a acompanhar. Sobrecarga progressiva é o teu superpoder.',
  definicao: 'Próxima missão: subir a carga devagarinho (o músculo é o teu melhor aliado na definição) e manter o cardio regular. Devagar e sempre, mas com pesos.',
  saude: 'Próxima missão: manter a regularidade, mexer o corpo de formas que gostes e dormir bem. O resto vem por arrasto.'
};

export const STORY_VARIANTS = ENTRIES.length;

export function buildStory(sum, { name, focus }) {
  const n = Math.max(0, Math.min(sum.sessions, ENTRIES.length - 1));
  const vars = { name, dias: n === 1 ? '1 dia' : `${n} dias` };
  const [title, text] = ENTRIES[n];
  const lines = [fill(text, vars)];
  if (sum.goal) {
    const left = sum.goal - sum.sessions;
    if (left > 0) lines.push(`Faltam ${left} ${left === 1 ? 'treino' : 'treinos'} para a tua meta de ${sum.goal}.`);
    else lines.push(`Meta de ${sum.goal} ${sum.goal === 1 ? 'dia' : 'dias'} batida! Que tal subir a fasquia no próximo mês?`);
  }
  if (sum.bests.length) {
    lines.push(`${sum.bests.length === 1 ? '1 exercício com carga registada' : `${sum.bests.length} exercícios com carga registada`}: lá em baixo vês a tua melhor carga em cada um.`);
  }
  if (sum.minutes > 0) lines.push(`${sum.minutes} min de cardio e desporto: o teu coração mandou uma mensagem de agradecimento.`);
  return { title, lines, mission: MISSION[focus] || MISSION.saude };
}
