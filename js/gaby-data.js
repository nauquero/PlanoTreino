// Plano de treino em casa da Gabriela (12 semanas, 3 sessões por semana).
// Só é usado quando ela entra; não afeta o treino das outras pessoas.

export const HEIGHT_CM = 155;

export const GABY_REST = {
  alto: { sec: 120, range: '~2 min' },
  'medio-alto': { sec: 90, range: '1–2 min' },
  medio: { sec: 75, range: '~1 min' },
  baixo: { sec: 60, range: '~1 min' }
};

// ---------- Plano ----------
export const PLAN_START = '2026-10-05'; // segunda-feira
export const PLAN_WEEKS = 12;           // até 27 de dezembro

export const PHASES = [
  { key: 1, name: 'Fase 1 · Habituar', weeks: 'Semanas 1–4', text: 'Aprender os movimentos e criar o hábito. 2 séries, sem pressa e sem dor. O objetivo é terminar cada sessão a sentir que ainda davas mais um pouco.' },
  { key: 2, name: 'Fase 2 · Construir', weeks: 'Semanas 5–8', text: 'Passam a 3 séries e mais algumas repetições. Se te sentires bem, usa um elástico mais firme ou halteres um pouco mais pesados.' },
  { key: 3, name: 'Fase 3 · Fortalecer', weeks: 'Semanas 9–12', text: 'O corpo já conhece o ritmo. Mais repetições, mais tempo de prancha e a bicicleta mais longa. Tudo ao teu ritmo.' }
];

export const phaseOf = (week) => (week <= 4 ? 0 : week <= 8 ? 1 : 2);

export const SAFETY = [
  'Treina num ritmo em que consigas falar em frases curtas. Se não consegues, abranda.',
  'Dor aguda, tonturas, falta de ar fora do normal ou dor no peito: pára e fala com o teu médico.',
  'Sentir os músculos a trabalhar é normal. Dor nas articulações não é: reduz a amplitude ou escolhe a versão mais fácil.',
  'Não precisas de saltar nem de correr. Todos os exercícios são de baixo impacto.',
  'Bebe água antes, durante e depois. Descansa pelo menos um dia entre sessões.'
];

// ---------- Exercícios ----------
// X(nome, esforço, tipo, [prescrição fase 1, 2, 3], progressão, técnica, erros, extras)
// tipos: 'strength' (reps + peso), 'reps' (reps, peso opcional), 'hold' (segundos), 'time' (minutos)
const X = (name, effort, kind, rx, prog, tech, mistakes, extra = {}) => ({ name, effort, kind, rx, prog, tech, mistakes, ...extra });
const S = (a, b, c) => [{ sets: 2, reps: a }, { sets: 3, reps: b }, { sets: 3, reps: c }];
const H = (a, b, c) => [{ sets: 2, sec: a }, { sets: 3, sec: b }, { sets: 3, sec: c }];

const BIKE = X('Bicicleta estática', 'medio', 'time',
  [{ min: '10–15' }, { min: '15–20' }, { min: '20–30' }],
  'Resistência leve a moderada. Deves conseguir falar sem ficar sem ar. Começa pelo mais curto e vai juntando minutos.',
  'Ajusta o selim para o joelho ficar quase esticado no ponto mais baixo. Costas direitas, ombros relaxados.',
  ['Resistência tão alta que paras de conseguir falar', 'Selim demasiado baixo', 'Agarrar o guiador com força'],
  { distanceUnit: 'km', noteLabel: 'Como te sentiste?' });

const MAIN = (key, title) => X(`Treino principal: ${title}`, 'medio', 'time',
  [{ min: '15–20' }, { min: '20–25' }, { min: '25–30' }],
  'O vídeo que escolheste para esta sessão. Faz ao teu ritmo e pára quando precisares.',
  'Segue o vídeo e adapta: se um exercício for difícil, faz a versão mais fácil ou salta-o.',
  [], { noteLabel: 'Que vídeo fizeste?', main: key });

export const SESSIONS = {
  dia1: {
    label: 'Dia 1', title: 'Pernas e glúteos',
    mainHint: 'Escolhe um treino de pernas e glúteos de baixo impacto (Pamela Reif ou Lilly Sabri).',
    main: MAIN('dia1', 'Pernas e glúteos'),
    warm: {
      title: 'Aquecimento', time: '5 min',
      items: ['Marcha no lugar, 1 min', 'Círculos de ombros, 10 para cada lado', 'Círculos de anca, 8 para cada lado', 'Meio agachamento com apoio numa cadeira, 8 reps', 'Elevação de joelhos devagar, 1 min']
    },
    exercises: [
      X('Agachamento com bola na parede', 'medio-alto', 'reps', S(8, 10, 12),
        'Mais fácil: desce só um pouco. Mais difícil: segura um halter junto ao peito.',
        'Costas contra a bola na parede, pés à largura da anca e um pouco à frente. Desce como se fosses sentar e sobe a empurrar o chão.',
        ['Joelhos a ir para dentro', 'Descer mais do que é confortável', 'Calcanhares a levantar']),
      X('Ponte de glúteos', 'medio', 'reps', S(10, 12, 15),
        'Mais difícil: coloca um halter sobre a anca ou um elástico acima dos joelhos.',
        'Deitada de costas no tapete, joelhos dobrados. Sobe a anca a contrair os glúteos, pausa de 1 s no topo e desce devagar.',
        ['Arquear a lombar no topo', 'Empurrar só com a ponta dos pés']),
      X('Abdução deitada com elástico', 'baixo', 'reps', S(8, 10, 12),
        'Mais fácil: sem elástico. Mais difícil: elástico mais firme.',
        'Deitada de lado, elástico acima dos joelhos. Sobe o joelho de cima sem rodar a anca e desce devagar.',
        ['Rodar a anca para trás', 'Fazer rápido'], { perSide: true }),
      X('Subida ao step', 'medio-alto', 'reps', S(6, 8, 10),
        'Mais fácil: step mais baixo ou com a mão num apoio. Mais difícil: halteres nas mãos.',
        'Põe o pé inteiro em cima do step e sobe empurrando por esse pé. Desce com controlo, sem deixar cair.',
        ['Dar impulso com a perna de baixo', 'Step instável'], { perSide: true })
    ],
    optional: [
      X('Agachamento sumo com halter', 'medio-alto', 'strength', S(8, 10, 12),
        'Segura um halter com as duas mãos à frente. Pés afastados, pontas ligeiramente abertas.',
        'Desce com as costas direitas e sobe a apertar os glúteos.', ['Joelhos para dentro']),
      X('Coice de glúteo com elástico', 'baixo', 'reps', S(8, 10, 12),
        'Mais fácil: sem elástico.', 'Em quatro apoios, elástico à volta dos pés. Estende a perna para trás sem arquear a lombar.',
        ['Arquear a lombar', 'Balançar o tronco'], { perSide: true }),
      X('Elevação de gémeos com apoio', 'baixo', 'reps', S(10, 12, 15),
        'Mãos na parede ou numa cadeira.', 'Sobe devagar na ponta dos pés, pausa curta no topo e desce devagar.',
        ['Fazer rápido'])
    ],
    stretch: {
      title: 'Alongamento', time: '5 min', rule: 'Mantém cada posição cerca de 30 s, sem dor e a respirar fundo.',
      items: ['Coxa à frente (de pé, com apoio)', 'Parte de trás da coxa (sentada, perna esticada)', 'Glúteos (deitada, joelho ao peito)', 'Gémeos (mãos na parede)']
    }
  },
  dia2: {
    label: 'Dia 2', title: 'Core',
    mainHint: 'Escolhe um treino de core ou abdominais suaves (Pamela Reif ou Lilly Sabri).',
    main: MAIN('dia2', 'Core'),
    warm: {
      title: 'Aquecimento', time: '5 min',
      items: ['Marcha no lugar, 1 min', 'Rotação de tronco em pé, 10 para cada lado', 'Gato e vaca em quatro apoios, 8 reps', 'Inclinações laterais, 8 para cada lado']
    },
    exercises: [
      X('Dead bug', 'medio', 'reps', S(6, 8, 10),
        'Mais fácil: só os braços ou só as pernas. Mais difícil: pausa de 2 s com o braço e a perna esticados.',
        'Deitada de costas, braços ao teto e joelhos a 90 graus. Estende o braço e a perna contrários devagar, mantendo a lombar no chão.',
        ['Lombar a levantar do chão', 'Fazer rápido', 'Prender a respiração'], { perSide: true }),
      X('Prancha', 'medio-alto', 'hold', H(15, 20, 30),
        'Mais fácil: mãos num sofá ou numa mesa estável. Depois, nos joelhos. Mais difícil: no chão, nos pés.',
        'Antebraços ou mãos apoiados, corpo em linha reta. Aperta a barriga e os glúteos e respira normalmente.',
        ['Anca demasiado alta ou a cair', 'Prender a respiração', 'Cabeça caída'],
        { progression: ['Inclinada (mãos num apoio)', 'Nos joelhos', 'Nos pés'] }),
      X('Bird dog', 'medio', 'reps', S(6, 8, 10),
        'Mais fácil: só estende a perna. Mais difícil: pausa de 3 s no topo.',
        'Em quatro apoios, estende o braço e a perna contrários, mantendo as costas planas como uma mesa.',
        ['Rodar a anca', 'Arquear a lombar'], { perSide: true }),
      X('Prancha lateral nos joelhos', 'medio', 'hold', H(10, 15, 20),
        'Mais difícil: com os joelhos esticados, apoiada nos pés.',
        'Deitada de lado, apoiada no antebraço, joelhos dobrados. Sobe a anca até o corpo ficar em linha.',
        ['Anca a cair', 'Ombro encolhido'], { perSide: true })
    ],
    optional: [
      X('Crunch curto na bola de pilates', 'medio', 'reps', S(8, 10, 12),
        'Lombar apoiada na bola, pés bem assentes. Sobe só os ombros, sem puxar o pescoço.',
        'Expira ao subir, desce devagar.', ['Puxar a cabeça com as mãos']),
      X('Rotação sentada', 'baixo', 'reps', S(8, 10, 12),
        'Sentada, segura um halter leve com as duas mãos. Roda o tronco de um lado ao outro com as costas direitas.',
        'Move o tronco, não só os braços.', ['Curvar as costas']),
      X('Ponte com marcha', 'medio', 'reps', S(6, 8, 10),
        'Na posição de ponte, levanta um pé de cada vez sem deixar a anca cair.',
        'Anca estável, mantém a ponte durante a marcha.', ['Anca a descair'], { perSide: true })
    ],
    stretch: {
      title: 'Alongamento', time: '5 min', rule: 'Mantém cada posição cerca de 30 s, sem dor e a respirar fundo.',
      items: ['Posição da criança (sentada sobre os calcanhares, braços à frente)', 'Rotação suave deitada, joelhos para um lado', 'Cobra suave (só até onde for confortável)', 'Alongamento lateral de pé']
    }
  },
  dia3: {
    label: 'Dia 3', title: 'Braços, peito e costas',
    mainHint: 'Escolhe um treino de parte superior do corpo (Pamela Reif ou Lilly Sabri).',
    main: MAIN('dia3', 'Braços, peito e costas'),
    warm: {
      title: 'Aquecimento', time: '5 min',
      items: ['Marcha no lugar, 1 min', 'Círculos de braços, 10 para a frente e 10 para trás', 'Abrir e fechar os braços, 10 reps', 'Rotação de ombros, 10 reps']
    },
    exercises: [
      X('Flexões inclinadas', 'medio-alto', 'reps', S(5, 8, 10),
        'Mais fácil: mãos na parede. Depois, num sofá ou numa mesa estável. Mais difícil: mãos num apoio mais baixo.',
        'Mãos um pouco mais afastadas que os ombros, corpo em linha reta. Desce o peito até ao apoio e empurra.',
        ['Anca a cair', 'Cotovelos muito abertos', 'Pescoço esticado']),
      X('Remada com elástico sentada', 'medio', 'reps', S(8, 10, 12),
        'Mais fácil: elástico mais leve. Mais difícil: elástico mais firme ou pausa de 2 s.',
        'Sentada com as pernas esticadas e o elástico nos pés. Puxa os cotovelos para trás, juntando as omoplatas.',
        ['Encolher os ombros', 'Curvar as costas']),
      X('Elevação lateral com halteres', 'baixo', 'strength', S(8, 10, 12),
        'Começa com halteres leves. Sobe até à altura dos ombros e desce devagar.',
        'Cotovelos ligeiramente dobrados, sobe sem balançar o tronco.',
        ['Balançar o corpo', 'Subir acima dos ombros', 'Peso demasiado alto']),
      X('Curl de bíceps com halteres', 'baixo', 'strength', S(8, 10, 12),
        'Cotovelos junto ao corpo. Sobe devagar e desce em 3 segundos.',
        'Só os antebraços se mexem.', ['Balançar o tronco', 'Cotovelos a fugir do corpo'])
    ],
    optional: [
      X('Extensão de tríceps acima da cabeça', 'baixo', 'strength', S(8, 10, 12),
        'Segura um halter com as duas mãos atrás da cabeça. Estende os braços para cima.',
        'Cotovelos apontados para a frente, sem abrir.', ['Cotovelos a abrir']),
      X('Press de peito no chão', 'medio', 'strength', S(8, 10, 12),
        'Deitada no tapete, joelhos dobrados, halteres sobre o peito. Empurra para cima e desce até os cotovelos tocarem o chão.',
        'Pulsos direitos, ombros longe das orelhas.', ['Arquear a lombar']),
      X('Abertura com elástico', 'baixo', 'reps', S(8, 10, 12),
        'Elástico atrás das costas, braços ligeiramente dobrados. Abre e fecha como num abraço.',
        'Movimento lento, cotovelos fixos.', ['Esticar demais os braços'])
    ],
    stretch: {
      title: 'Alongamento', time: '5 min', rule: 'Mantém cada posição cerca de 30 s, sem dor e a respirar fundo.',
      items: ['Peito (mãos atrás das costas, abrir)', 'Costas (braços à frente, curvar suavemente)', 'Tríceps (cotovelo atrás da cabeça)', 'Ombros (braço cruzado à frente)']
    }
  }
};

// Cardio: bicicleta estática (também disponível em qualquer dia)
export const CARDIO = BIKE;

// Rótulos usados no calendário e nos resumos (chave -> { label })
export const GABY_GROUPS = {
  dia1: { label: 'Pernas e glúteos' },
  dia2: { label: 'Core' },
  dia3: { label: 'Braços, peito e costas' },
  cardio: { label: 'Cardio' }
};

// Todos os exercícios por nome: { ex, kind, group }
export const ALL_EXERCISES = new Map();
for (const [key, s] of Object.entries(SESSIONS)) {
  for (const ex of [s.main, ...s.exercises, ...s.optional]) ALL_EXERCISES.set(ex.name, { ex, kind: ex.kind, group: key });
}
ALL_EXERCISES.set(BIKE.name, { ex: BIKE, kind: 'time', group: 'cardio' });

// Texto da prescrição de um exercício numa fase (0, 1 ou 2)
export function rxText(ex, phase) {
  const r = ex.rx[phase];
  if (r.min) return `${r.min} min`;
  if (r.sec) return `${r.sets} × ${r.sec} s${ex.perSide ? ' por lado' : ''}`;
  return `${r.sets} × ${r.reps}${ex.perSide ? ' por lado' : ''}`;
}

// Número de séries prescritas numa fase (para pré-preencher as linhas)
export const setsOf = (ex, phase) => ex.rx[phase].sets || 0;
