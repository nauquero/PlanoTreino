// Escolhas de personalização do plano (guardadas em profile_data.plan) e textos da página Início.
// Não precisa de alterações na base de dados: tudo vive dentro do perfil (JSON).

// Músculos que a pessoa pode escolher. "group" é o separador do Treino a que correspondem.
export const MUSCLES = [
  { key: 'pernas', label: 'Pernas', hint: 'Coxas e gémeos', views: ['front', 'back'] },
  { key: 'gluteo', label: 'Glúteos', hint: 'O clássico', views: ['back'] },
  { key: 'peito', label: 'Peito', hint: 'Peitorais', views: ['front'] },
  { key: 'costas', label: 'Costas', hint: 'Dorsais e trapézio', views: ['back'] },
  { key: 'ombros', label: 'Ombros', hint: 'Deltoides', views: ['front', 'back'] },
  { key: 'biceps', label: 'Bíceps', hint: 'Parte da frente do braço', views: ['front'] },
  { key: 'triceps', label: 'Tríceps', hint: 'Parte de trás do braço', views: ['back'] },
  { key: 'abs', label: 'Abdominais', hint: 'Core', views: ['front'] }
];
export const MUSCLE_LABEL = Object.fromEntries(MUSCLES.map((m) => [m.key, m.label]));

// Cardio e desportos: os nomes têm de coincidir com os exercícios do catálogo (data.js)
export const CARDIO_OPTIONS = [
  ['Passadeira', 'Passadeira'], ['Passadeira Inclinada', 'Passadeira inclinada'], ['Elíptica', 'Elíptica'],
  ['Bicicleta Sentada', 'Bicicleta'], ['Bicicleta de Spinning', 'Spinning'], ['Escadas', 'Escadas'],
  ['Remo (Máquina)', 'Remo'], ['Corda de Saltar', 'Corda']
];
export const SPORT_OPTIONS = [
  ['Natação', 'Natação'], ['Corrida', 'Corrida'], ['Caminhada', 'Caminhada'], ['Ciclismo', 'Ciclismo'],
  ['Ténis', 'Ténis'], ['Padel', 'Padel'], ['Aulas de grupo', 'Aulas de grupo'], ['Yoga / Pilates', 'Yoga / Pilates'],
  ['Dança', 'Dança'], ['Futebol', 'Futebol'], ['Basquetebol', 'Basquetebol'], ['Voleibol', 'Voleibol'],
  ['Artes marciais', 'Artes marciais'], ['Escalada', 'Escalada'], ['Trilhos', 'Trilhos']
];
export const cardioLabel = (name) => (CARDIO_OPTIONS.find((o) => o[0] === name) || [name, name])[1];
export const sportLabel = (name) => (SPORT_OPTIONS.find((o) => o[0] === name) || [name, name])[1];

export const DAYS_OPTIONS = [2, 3, 4, 5, 6];

export const OBJECTIVES = {
  hipertrofia: ['Hipertrofia (ganhar massa muscular)', 'O foco é aumentar o músculo, em especial glúteos e pernas.', 'Treino de força com progressão de cargas, séries pesadas e descanso entre elas.', 'Proteína em todas as refeições e calorias suficientes para recuperar e crescer.', 'flame'],
  definicao: ['Perda de gordura + hipertrofia', 'O foco é perder gordura mantendo (ou ganhando) músculo.', 'Treino de força com cardio a seguir, para gastar mais energia sem perder massa muscular.', 'Ligeiro défice calórico, proteína alta e boa hidratação.', 'target'],
  emagrecimento: ['Emagrecer com saúde', 'O foco é perder peso de forma gradual e sustentável.', 'Treino regular, com força e cardio, a um ritmo que consigas manter.', 'Refeições regulares, proteína e legumes, sem dietas extremas.', 'leaf'],
  saude: ['Saúde e bem-estar', 'O foco é sentires-te bem, com mais energia e força no dia a dia.', 'Treino equilibrado, com força, mobilidade e cardio leve.', 'Alimentação variada e regular, com bastante água.', 'sparkles']
};
export const OBJECTIVE_KEYS = ['hipertrofia', 'definicao', 'emagrecimento', 'saude'];

// Como o objetivo muda a forma de treinar (mostrado no topo do Treino)
export const OBJECTIVE_PLAN = {
  hipertrofia: { reps: '6–12 repetições', sets: '3–4 séries', rest: 'Descanso longo (1:30–3:00)', cardio: 'Cardio curto e leve (10–15 min) para não roubar energia à força.', tip: 'Quando fizeres todas as repetições com boa técnica, sobe um pouco a carga.' },
  definicao: { reps: '8–15 repetições', sets: '3 séries', rest: 'Descanso médio (1:00–2:00)', cardio: 'Fecha o treino com 15–20 min de cardio.', tip: 'Mantém as cargas a subir devagar: o músculo é o teu melhor aliado.' },
  emagrecimento: { reps: '10–15 repetições', sets: '3 séries', rest: 'Descanso curto a médio (0:45–1:30)', cardio: 'Cardio de 20–30 min no fim, ou num dia só para ele.', tip: 'A constância ganha à intensidade: o melhor treino é o que consegues repetir.' },
  saude: { reps: '10–15 repetições', sets: '2–3 séries', rest: 'Descanso médio (1:00–1:30)', cardio: '15–20 min de cardio leve, ao teu gosto.', tip: 'Escuta o corpo e escolhe o que te faz sentir bem.' }
};

export const QUOTES = [
  'Não precisas de ser perfeita, só de aparecer.',
  'Um treino de cada vez, uma versão mais forte de ti.',
  'Hoje és mais forte do que ontem. Prova-o.',
  'O progresso mora nos dias em que não apetecia.',
  'Faz por ti, não por ninguém. O corpo agradece.',
  'Pequenos passos todos os dias constroem grandes mudanças.',
  'Músculo cresce na repetição, hábito também.',
  'Respira fundo, aperta o cabelo e vai.',
  'Cada série conta. Cada dia conta. Tu contas.',
  'Disciplina é um ato de carinho contigo mesma.',
  'O difícil é começar; depois o corpo faz o resto.',
  'Não comparas o teu capítulo 1 com o capítulo 20 de ninguém.',
  'Mais água, mais sono, mais coragem.',
  'Se hoje custou, amanhã vai ser mais leve.',
  'Treinar é a tua forma de dizer: eu mereço.'
];

export function quoteOf(isoDate) {
  let h = 0;
  for (let i = 0; i < isoDate.length; i++) h = (h * 31 + isoDate.charCodeAt(i)) >>> 0;
  return QUOTES[h % QUOTES.length];
}

export function greetingOf(hour) {
  if (hour < 6) return 'Boa madrugada';
  if (hour < 12) return 'Bom dia';
  if (hour < 20) return 'Boa tarde';
  return 'Boa noite';
}

// Plano guardado no perfil: { done, areas[], cardio[], sports[], days }
export function planOf(profile) {
  const p = (profile && profile.plan) || {};
  const list = (a, valid) => (Array.isArray(a) ? a.filter((x) => valid.includes(x)) : []);
  return {
    done: !!p.done,
    areas: list(p.areas, MUSCLES.map((m) => m.key)),
    cardio: list(p.cardio, CARDIO_OPTIONS.map((o) => o[0])),
    sports: list(p.sports, SPORT_OPTIONS.map((o) => o[0])),
    days: DAYS_OPTIONS.includes(Number(p.days)) ? Number(p.days) : 0
  };
}
