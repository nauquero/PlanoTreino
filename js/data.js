// Conteúdo estático do plano (exercícios, refeições, etc.).
// Para mudar textos ou exercícios basta editar este ficheiro.

// Objetivo de cada pessoa (guardado na base de dados: coluna "focus").
export const FOCUS = {
  hipertrofia: { goal: 'Objetivo: Hipertrofia' },
  definicao: { goal: 'Objetivo: Perda de gordura + Hipertrofia' },
  emagrecimento: { goal: 'Objetivo: emagrecer com saúde' },
  saude: { goal: 'Objetivo: Saúde e bem-estar' }
};

// Cores dos avatares (escolhidas pelo nome, para cada pessoa ter a sua)
export const TONES = ['rose', 'mint', 'lilac', 'peach'];

// Sugestões rápidas para a meta mensal de dias de treino (cada pessoa escolhe a sua em cada mês).
export const GOAL_SUGGESTIONS = [8, 12, 16, 20];

// [chave na BD, nome, unidade]
export const METRICS = [
  ['weight', 'Peso', 'kg'],
  ['bmi', 'BMI', ''],
  ['body_fat', 'Gordura corporal', '%'],
  ['sub_fat', 'Gordura subcutânea', '%'],
  ['visceral', 'Gordura visceral', ''],
  ['water', 'Água corporal', '%'],
  ['muscle', 'Massa muscular', 'kg'],
  ['bone', 'Massa óssea', 'kg'],
  ['bmr', 'BMR', 'kcal']
];

export const MEANINGS = [
  ['BMI', 'Relação peso/altura — indicador geral, não distingue gordura de músculo.'],
  ['Gordura corporal', 'Percentagem do peso total que é gordura.'],
  ['Gordura subcutânea', 'Gordura logo por baixo da pele — a maior parte da gordura corporal.'],
  ['Gordura visceral', 'Gordura à volta dos órgãos internos. 1–9 normal, 10–14 elevado, 15+ muito elevado.'],
  ['Água corporal', 'Percentagem do peso que é água — normalmente mais alta em quem tem mais massa muscular.'],
  ['Massa muscular', 'Peso total de músculo no corpo.'],
  ['Massa óssea', 'Peso estimado dos ossos.'],
  ['BMR', 'Calorias que o corpo gasta em repouso completo — a base para calcular as calorias diárias.']
];

export const EFFORT_LABELS = {
  alto: 'Esforço alto',
  'medio-alto': 'Esforço médio-alto',
  medio: 'Esforço médio',
  baixo: 'Esforço baixo'
};

// ---------- Alimentação ----------

export const NUTRITION = {
  hipertrofia: {
    note: 'Foco em hipertrofia — precisas de proteína suficiente em todas as refeições e carboidratos à volta do treino para teres energia e recuperares bem.',
    meals: {
      'Pequeno-almoço': ['Iogurte grego + aveia + fruta + mel', 'Ovos mexidos + pão integral + abacate', 'Smoothie proteico (leite + banana + proteína + manteiga de amendoim)'],
      'Almoço': ['Proteína (frango/peixe/carne) + arroz ou batata-doce + legumes + azeite', 'Prato bem composto: 1 palma de proteína, 2 punhados de carbo, legumes à vontade'],
      'Pré-treino (60–90 min antes)': ['Fruta + um punhado de oleaginosas', 'Torrada com mel', 'Banana'],
      'Pós-treino': ['Batido proteico + fruta', 'Iogurte grego + granola', 'Sandes de frango/atum'],
      'Lanche': ['Queijo fresco + fruta', 'Ovo cozido', 'Barra proteica'],
      'Jantar': ['Semelhante ao almoço, proteína + vegetais + carbo moderado (arroz, massa integral, batata)']
    }
  },
  definicao: {
    note: 'Foco em perda de gordura + hipertrofia — défice calórico ligeiro, proteína alta para preservar músculo, carboidratos mais controlados mas sempre presentes à volta do treino.',
    meals: {
      'Pequeno-almoço': ['Iogurte grego (natural, sem açúcar) + fruta + canela', 'Ovos mexidos + legumes salteados', 'Torrada integral + queijo fresco magro'],
      'Almoço': ['Proteína magra (frango/peixe) + legumes abundantes + porção moderada de arroz/batata-doce', 'Salada completa com proteína + azeite (moderado)'],
      'Pré-treino (60–90 min antes)': ['Fruta pequena (ex: maçã)', 'Café + torrada fina'],
      'Pós-treino': ['Iogurte grego + fruta', 'Batido proteico leve (água em vez de leite gordo)'],
      'Lanche': ['Palitos de legumes + húmus', 'Queijo fresco magro', 'Punhado pequeno de frutos secos'],
      'Jantar': ['Mais leve que o almoço: proteína + muitos legumes + carbo reduzido (ex: só legumes ou pouco arroz)']
    }
  },
  emagrecimento: {
    note: 'Foco em perda de gordura + hipertrofia — défice calórico ligeiro, proteína alta para preservar músculo, carboidratos mais controlados mas sempre presentes à volta do treino.',
    meals: {
      'Pequeno-almoço': ['Iogurte grego (natural, sem açúcar) + fruta + canela', 'Ovos mexidos + legumes salteados', 'Torrada integral + queijo fresco magro'],
      'Almoço': ['Proteína magra (frango/peixe) + legumes abundantes + porção moderada de arroz/batata-doce', 'Salada completa com proteína + azeite (moderado)'],
      'Pré-treino (60–90 min antes)': ['Fruta pequena (ex: maçã)', 'Café + torrada fina'],
      'Pós-treino': ['Iogurte grego + fruta', 'Batido proteico leve (água em vez de leite gordo)'],
      'Lanche': ['Palitos de legumes + húmus', 'Queijo fresco magro', 'Punhado pequeno de frutos secos'],
      'Jantar': ['Mais leve que o almoço: proteína + muitos legumes + carbo reduzido (ex: só legumes ou pouco arroz)']
    }
  },
  saude: {
    note: 'Foco em saúde e bem-estar — refeições equilibradas, com proteína, hidratos e gorduras boas, muitos legumes e fruta, e alimentos o mais naturais possível.',
    meals: {
      'Pequeno-almoço': ['Iogurte natural + aveia + fruta', 'Ovos mexidos + pão integral', 'Papas de aveia com fruta e canela'],
      'Almoço': ['Proteína (peixe, frango, ovos ou leguminosas) + hidratos (arroz, batata ou massa integral) + legumes', 'Salada completa com leguminosas e um fio de azeite'],
      'Pré-treino (60–90 min antes)': ['Fruta', 'Torrada com queijo fresco'],
      'Pós-treino': ['Iogurte com fruta', 'Sandes de atum ou frango'],
      'Lanche': ['Fruta + um punhado de frutos secos', 'Iogurte natural', 'Queijo fresco com tomate'],
      'Jantar': ['Proteína + muitos legumes + porção moderada de hidratos']
    }
  }
};

// Hidratação: referência geral por kg de peso, mais um extra nos dias de treino.
export const WATER = { mlPerKg: 35, trainingExtraMl: 500, glassMl: 250, fallback: '1,5–2 L' };

// Proteína diária de referência para quem treina força (g por kg de peso).
export const PROTEIN_G_PER_KG = [1.6, 2.2];

// Alimentos recomendados e quantidades por refeição, por objetivo.
export const FOOD_GUIDE = [
  {
    title: 'Proteínas',
    items: ['Frango e peru', 'Ovos', 'Atum, salmão, pescada, bacalhau, sardinha', 'Camarão e outro marisco', 'Vaca magra e porco magro', 'Tofu, tempeh, seitan', 'Iogurte grego, skyr, queijo fresco, requeijão', 'Leguminosas (grão, feijão, lentilhas)', 'Proteína em pó (whey ou vegetal)'],
    portion: {
      hipertrofia: '1 palma da mão por refeição (cerca de 120–150 g de carne ou peixe, 3 ovos, ou 200 g de iogurte grego).',
      definicao: '1 palma da mão por refeição (cerca de 120–150 g de carne ou peixe magro, 2–3 ovos, ou 200 g de iogurte grego).',
      emagrecimento: '1 palma da mão por refeição (cerca de 120–150 g de carne ou peixe magro, 2–3 ovos, ou 200 g de iogurte grego).',
      saude: '1 palma da mão por refeição (cerca de 100–130 g de carne ou peixe, 2 ovos, ou 150 g de iogurte).'
    }
  },
  {
    title: 'Hidratos de carbono',
    items: ['Arroz (de preferência integral ou basmati)', 'Batata e batata-doce', 'Massa integral', 'Aveia', 'Pão integral ou de centeio', 'Quinoa, cuscuz, trigo sarraceno', 'Milho e ervilhas'],
    portion: {
      hipertrofia: '1 a 2 punhados por refeição (cerca de 150–250 g de arroz ou massa já cozinhados), mais à volta do treino.',
      definicao: '1 punhado por refeição (cerca de 100–150 g já cozinhados), com um pouco mais antes ou depois do treino. Ao jantar podes reduzir.',
      emagrecimento: '1 punhado por refeição (cerca de 100–150 g já cozinhados), com um pouco mais antes ou depois do treino. Ao jantar podes reduzir.',
      saude: '1 punhado por refeição (cerca de 120–180 g já cozinhados).'
    }
  },
  {
    title: 'Gorduras boas',
    items: ['Azeite extra virgem', 'Abacate', 'Frutos secos (amêndoas, nozes, avelãs, caju)', 'Manteiga de amendoim ou de amêndoa (sem açúcar)', 'Sementes (chia, linhaça, abóbora)', 'Peixe gordo (salmão, sardinha, cavala)'],
    portion: {
      hipertrofia: '1 a 2 polegares por refeição (1 colher de sopa de azeite ou de manteiga de amendoim; um punhado pequeno de frutos secos).',
      definicao: '1 polegar por refeição (1 colher de sopa de azeite; um punhado pequeno de frutos secos). As gorduras têm muitas calorias, mede-as.',
      emagrecimento: '1 polegar por refeição (1 colher de sopa de azeite; um punhado pequeno de frutos secos). As gorduras têm muitas calorias, mede-as.',
      saude: '1 polegar por refeição (1 colher de sopa de azeite; um punhado pequeno de frutos secos).'
    }
  },
  {
    title: 'Legumes',
    items: ['Brócolos, couve-flor, couves', 'Espinafres, rúcula, alface', 'Courgette, pepino, pimento', 'Cenoura, beterraba, abóbora', 'Tomate, cogumelos, cebola', 'Feijão-verde, espargos'],
    portion: {
      hipertrofia: 'À vontade: metade do prato ao almoço e ao jantar (pelo menos 2 punhados cheios).',
      definicao: 'À vontade: metade do prato ao almoço e ao jantar, ou mais. Dão saciedade com poucas calorias.',
      emagrecimento: 'À vontade: metade do prato ao almoço e ao jantar, ou mais. Dão saciedade com poucas calorias.',
      saude: 'Metade do prato ao almoço e ao jantar.'
    }
  },
  {
    title: 'Fruta',
    items: ['Banana, maçã, pera', 'Frutos vermelhos (morangos, mirtilos, framboesas)', 'Laranja, tangerina, kiwi', 'Ananás, manga, melão', 'Uva e cerejas (com moderação)'],
    portion: {
      hipertrofia: '3 a 4 peças por dia, de preferência inteiras (a fruta inteira sacia mais do que o sumo).',
      definicao: '2 a 3 peças por dia, de preferência inteiras e frutos vermelhos quando puderes.',
      emagrecimento: '2 a 3 peças por dia, de preferência inteiras e frutos vermelhos quando puderes.',
      saude: '2 a 3 peças por dia, de preferência inteiras.'
    }
  }
];

export const FOOD_LIMIT = {
  title: 'Com moderação',
  items: ['Bebidas açucaradas e sumos de pacote', 'Álcool', 'Fritos e fast food', 'Bolachas, bolos e doces (um extra de vez em quando é normal e faz parte)', 'Charcutaria e enchidos', 'Molhos industriais e refeições ultraprocessadas']
};

// ---------- Descanso entre séries ----------
// Tempo recomendado por tipo de exercício (segundos). Valores de referência baseados na evidência
// sobre intervalos de descanso no treino de força; não são aconselhamento médico.
// (Só se mostra o tempo; não há explicações nem citações no ecrã.)
export const REST = {
  alto: { sec: 150, range: '2–3 min' },
  'medio-alto': { sec: 120, range: '~2 min' },
  medio: { sec: 90, range: '1–2 min' },
  baixo: { sec: 60, range: '~1 min' }
};

// ---------- Exercícios ----------

const E = (name, effort, reps, tech, mistakes, extra = {}) => ({ name, effort, reps, tech, mistakes, ...extra });

const CARDIO_CLOSE = { escadas: 'Escadas — 15 min', bicicleta: 'Bicicleta sentada — 15–20 min' };
const combo = (cardio, abs, why) => ({ cardio, abs, why });

export const GROUPS = {
  pernas: {
    label: 'Pernas', kind: 'strength',
    combo: combo({ escadas: 'Escadas — 15–20 min', bicicleta: CARDIO_CLOSE.bicicleta }, 'Elevação de pernas — 3x12', 'Mantém a perna ativa, e a elevação de pernas fecha com o core sem pedir mais das coxas.'),
    exercises: [
      E('Agachamento Livre', 'alto', '6–10 reps · 3–4 séries', 'Pés à largura dos ombros, desce controlado até as coxas ficarem paralelas ao chão e empurra o chão para subir.', ['Joelhos a colapsar para dentro', 'Calcanhares a levantar', 'Arredondar a lombar no fundo']),
      E('Agachamento Frontal', 'alto', '6–10 reps · 3 séries', 'Barra apoiada à frente dos ombros, cotovelos altos e tronco bem direito durante todo o movimento.', ['Deixar os cotovelos caírem', 'Inclinar o tronco para a frente', 'Perder a posição da barra']),
      E('Hack Squat', 'alto', '6–10 reps · 3–4 séries', 'Descida controlada (3–4 seg).', ['Joelhos a colapsar para dentro', 'Amplitude curta']),
      E('Leg Press', 'medio-alto', '10–12 reps · 3–4 séries', 'Pés à largura dos ombros.', ['Bloquear os joelhos no topo']),
      E('Agachamento no Smith', 'medio-alto', '8–12 reps · 3 séries', 'Pés ligeiramente à frente da barra, desce controlado e mantém o tronco direito.', ['Pés demasiado atrás da barra', 'Amplitude curta', 'Bloquear os joelhos no topo']),
      E('Agachamento Goblet', 'medio', '10–15 reps · 3 séries', 'Segura o halter junto ao peito, cotovelos entre os joelhos no fundo.', ['Tronco a inclinar para a frente', 'Joelhos para dentro', 'Calcanhares a levantar']),
      E('Afundo (Split Squat)', 'medio-alto', '8–12 reps por perna · 3 séries', 'Pés em passada fixa, desce na vertical e sobe empurrando pelo calcanhar da frente.', ['Passada demasiado curta', 'Joelho da frente a ir para dentro', 'Tronco a cair para a frente']),
      E('Passada Caminhada (Walking Lunge)', 'medio-alto', '10–12 passos por perna · 3 séries', 'Passos largos, desce controlado até o joelho de trás quase tocar no chão.', ['Passos demasiado curtos', 'Tronco a inclinar', 'Joelho a colapsar para dentro']),
      E('Leg Extension', 'medio', '12–15 reps · 3 séries', 'Contrai 1 seg no topo.', ['Usar impulso']),
      E('Leg Curl', 'medio', '12–15 reps · 3 séries', 'Movimento lento.', ['Levantar a anca do banco']),
      E('Leg Curl Sentada', 'medio', '12–15 reps · 3 séries', 'Costas encostadas, flete os joelhos de forma controlada e faz pausa no fim.', ['Usar impulso', 'Amplitude curta']),
      E('Calf Raises', 'baixo', '15–20 reps · 3 séries', 'Amplitude completa, pausa no topo.', ['Movimento muito rápido']),
      E('Calf Raises Sentada', 'baixo', '15–20 reps · 3 séries', 'Desce até sentir o alongamento e sobe o mais alto que conseguires, com pausa no topo.', ['Movimento muito rápido', 'Amplitude curta']),
      E('Gémeos na Leg Press', 'baixo', '15–20 reps · 3 séries', 'Só os pés na ponta da plataforma, joelhos quase esticados (sem bloquear).', ['Bloquear os joelhos', 'Movimento muito rápido'])
    ]
  },
  gluteo: {
    label: 'Glúteos', kind: 'strength',
    combo: combo(CARDIO_CLOSE, 'Prancha — 3x30–45seg', 'Mantém o glúteo ativo mesmo depois do treino de força, e a prancha fecha a sessão sem sobrecarregar mais as pernas.'),
    exercises: [
      E('Hip Thrust', 'alto', '6–10 reps · 3–4 séries', 'Pausa de 1–2 seg no topo, contrai bem o glúteo antes de descer.', ['Arquear demasiado a lombar', 'Não subir a anca até à extensão completa', 'Apoiar o peso nos pés à frente']),
      E('RDLs', 'alto', '6–10 reps · 3–4 séries', 'Desce controlado (3–4 seg), sente o alongamento no glúteo/posterior antes de subir.', ['Arredondar as costas', 'Dobrar demasiado os joelhos', 'Afastar o peso do corpo']),
      E('Agachamento Sumo', 'alto', '8–12 reps · 3–4 séries', 'Pés afastados com as pontas ligeiramente abertas, desce com o tronco direito e empurra o chão para subir.', ['Joelhos a colapsar para dentro', 'Tronco a inclinar demasiado', 'Calcanhares a levantar']),
      E('Bulgarian Split Squat', 'alto', '8–12 reps por perna · 3 séries', 'Pé de trás apoiado num banco; inclina ligeiramente o tronco para a frente para puxar mais pelo glúteo.', ['Pé da frente demasiado perto do banco', 'Joelho a colapsar para dentro', 'Perder o equilíbrio']),
      E('Single Leg Leg Press', 'medio-alto', '10–12 reps · 3 séries', 'Pés mais altos na plataforma para focar mais glúteo.', ['Joelho a colapsar para dentro', 'Não controlar a descida']),
      E('Leg Press (foco glúteo)', 'medio-alto', '10–12 reps · 3–4 séries', 'Pés altos e afastados na plataforma; desce fundo sem a anca descolar do banco e empurra pelos calcanhares.', ['Anca a levantar do banco no fundo', 'Joelhos a colapsar para dentro', 'Bloquear os joelhos no topo']),
      E('Passada para Trás (Reverse Lunge)', 'medio-alto', '8–12 reps por perna · 3 séries', 'Dá um passo atrás, desce controlada e empurra pelo calcanhar da frente para voltar.', ['Passo demasiado curto', 'Tronco a cair para a frente', 'Joelho da frente a ir para dentro']),
      E('Good Morning', 'medio-alto', '8–12 reps · 3 séries', 'Dobra a anca para trás com a coluna neutra e os joelhos ligeiramente fletidos; sobe contraindo os glúteos.', ['Arredondar as costas', 'Carga demasiado pesada', 'Dobrar demasiado os joelhos']),
      E('Step-up', 'medio', '10–12 reps por perna · 3 séries', 'Sobe para o banco empurrando pelo pé de cima, sem impulso do pé de baixo.', ['Impulso com a perna de trás', 'Banco demasiado alto', 'Inclinar o tronco']),
      E('Ponte de Glúteo (Glute Bridge)', 'medio', '12–15 reps · 3 séries', 'Deita-te de costas com os pés apoiados e sobe a anca contraindo o glúteo e faz 1 seg de pausa no topo.', ['Arquear a lombar no topo', 'Empurrar só com os dedos dos pés', 'Subir sem contrair o glúteo']),
      E('Hiperextensão (foco glúteo)', 'medio', '10–15 reps · 3 séries', 'Arredonda ligeiramente as costas e roda os pés para fora; sobe contraindo o glúteo, sem hiperextender a lombar.', ['Hiperextender a lombar no topo', 'Usar balanço', 'Descer sem controlo']),
      E('Pull-Through no Cabo', 'medio', '12–15 reps · 3 séries', 'De costas para o cabo, empurra a anca para trás e depois para a frente, apertando o glúteo.', ['Agachar em vez de dobrar a anca', 'Puxar com os braços', 'Hiperextender a lombar']),
      E('Cable Kickback', 'medio', '12–20 reps · 3 séries', 'Movimento lento e controlado, drop set no fim.', ['Balançar o tronco', 'Arquear a lombar']),
      E('Abdução de Anca no Cabo', 'medio', '12–15 reps por lado · 3 séries', 'Afasta a perna para o lado de forma controlada, sem rodar o tronco.', ['Inclinar o tronco', 'Usar impulso']),
      E('Cadeira Adutora', 'medio', '12–15 reps · 3 séries', 'Contração lenta.', ['Usar impulso']),
      E('Cadeira Abdutora', 'baixo', '15–20 reps · 3 séries', 'Finisher do dia de glúteo.', ['Inclinar o tronco para trás'])
    ]
  },
  costas: {
    label: 'Costas', kind: 'strength',
    combo: combo(CARDIO_CLOSE, 'Crunch na máquina — 3x15', 'Cardio completo sem pedir mais dos braços, e o crunch fecha a sessão com foco no core.'),
    exercises: [
      E('Lat Pulldown', 'alto', '8–10 reps · 3–4 séries', 'Puxa até ao peito, cotovelos para baixo e para trás.', ['Puxar só com os braços', 'Inclinar muito o tronco']),
      E('Pulldown Pega Neutra', 'medio-alto', '8–12 reps · 3 séries', 'Peito aberto, puxa os cotovelos em direção às costelas.', ['Balançar o tronco', 'Puxar com os braços']),
      E('Barra Fixa (Pull-up)', 'alto', '4–8 reps · 3 séries', 'Parte de braços esticados e puxa o peito em direção à barra, levando os cotovelos para baixo (podes usar a máquina assistida).', ['Balançar o corpo', 'Amplitude curta', 'Encolher os ombros para as orelhas']),
      E('T Bar Row', 'alto', '8–10 reps · 3–4 séries', 'Cotovelos junto ao corpo.', ['Balanço do tronco']),
      E('Remada Curvada com Barra', 'alto', '6–10 reps · 3–4 séries', 'Tronco inclinado com a coluna neutra, puxa a barra em direção ao umbigo.', ['Arredondar as costas', 'Usar impulso das pernas', 'Puxar para o peito']),
      E('Remada Unilateral com Halter', 'medio-alto', '8–12 reps por lado · 3 séries', 'Mão e joelho apoiados no banco, puxa o halter em direção à anca.', ['Rodar o tronco', 'Puxar só com o braço', 'Amplitude curta']),
      E('Remada na Máquina (apoio no peito)', 'medio-alto', '10–12 reps · 3 séries', 'Peito apoiado, junta as omoplatas no fim do movimento.', ['Descolar o peito do apoio', 'Encolher os ombros']),
      E('Low Row', 'medio-alto', '15 / 20 reps', 'Pirâmide decrescente.', ['Puxar só com os braços']),
      E('Pulldown com Braços Retos', 'medio', '12–15 reps · 3 séries', 'Braços quase esticados, leva a barra até às coxas apertando os dorsais.', ['Dobrar os cotovelos', 'Balançar o tronco']),
      E('Peso Morto', 'alto', '5–8 reps · 3 séries', 'Barra junto às pernas, costas neutras; empurra o chão e estende a anca no topo.', ['Arredondar as costas', 'Barra afastada do corpo', 'Puxar com a lombar']),
      E('Hiperextensão (lombar)', 'medio', '12–15 reps · 3 séries', 'Corpo em linha reta, sobe até ficar alinhada sem hiperextender.', ['Hiperextender a lombar', 'Usar balanço']),
      E('Encolhimento (Shrug)', 'medio', '10–15 reps · 3 séries', 'Sobe os ombros em direção às orelhas, pausa no topo, sem rodar.', ['Rodar os ombros', 'Carga demasiado pesada com amplitude curta'])
    ]
  },
  peito: {
    label: 'Peito', kind: 'strength',
    combo: combo(CARDIO_CLOSE, 'Prancha — 3x30–45seg', 'Cardio completo, e a prancha fecha com o core sem pedir mais esforço aos braços já cansados.'),
    exercises: [
      E('Supino Reto com Barra', 'alto', '6–10 reps · 3–4 séries', 'Omoplatas juntas, desce a barra até ao peito e empurra em linha reta.', ['Descolar a anca do banco', 'Cotovelos muito abertos', 'Bater com a barra no peito']),
      E('Supino Inclinado com Halteres', 'alto', '8–12 reps · 3 séries', 'Banco a 30°, desce controlado até sentires o peito alongar.', ['Banco demasiado inclinado', 'Cotovelos muito abertos', 'Amplitude curta']),
      E('Chest Press', 'alto', '8–10 reps · 3–4 séries', 'Desce controlado.', ['Bloquear os cotovelos no topo']),
      E('Supino Inclinado na Máquina', 'medio-alto', '8–12 reps · 3 séries', 'Costas coladas ao banco, empurra sem encolher os ombros.', ['Encolher os ombros', 'Bloquear os cotovelos']),
      E('Flexões (Push-up)', 'medio-alto', 'Perto da falha · 3 séries', 'Corpo em linha reta, desce o peito até perto do chão (podes apoiar os joelhos ou as mãos num banco).', ['Deixar a anca cair', 'Amplitude curta', 'Cotovelos muito abertos']),
      E('Pec Fly', 'medio', '12–15 reps · 3 séries', 'Movimento em arco.', ['Estender os cotovelos completamente']),
      E('Crossover no Cabo', 'medio', '12–15 reps · 3 séries', 'Cotovelos ligeiramente fletidos, junta as mãos à frente do peito apertando.', ['Usar impulso do tronco', 'Esticar totalmente os cotovelos'])
    ]
  },
  biceps: {
    label: 'Bíceps', kind: 'strength',
    combo: combo(CARDIO_CLOSE, 'Prancha — 3x30–45seg', 'Cardio completo, e a prancha fecha com o core sem pedir mais esforço aos braços já cansados.'),
    exercises: [
      E('Bicep Curl', 'baixo', '12–15 reps · 3 séries', 'Cotovelos fixos.', ['Balançar o tronco']),
      E('Hammer Curl', 'baixo', '12–15 reps · 3 séries', 'Pega neutra.', ['Balançar os ombros']),
      E('Curl com Barra W', 'medio', '8–12 reps · 3 séries', 'Cotovelos junto ao corpo e subida controlada.', ['Balançar o tronco', 'Cotovelos a irem para a frente']),
      E('Curl Inclinado com Halteres', 'medio', '10–12 reps · 3 séries', 'Banco inclinado, braços caídos para trás para alongar bem o bíceps.', ['Levantar os ombros do banco', 'Usar impulso']),
      E('Curl Scott (Preacher)', 'medio', '10–12 reps · 3 séries', 'Braços apoiados no banco, desce até quase esticar sem largar a tensão.', ['Descer sem controlo', 'Levantar a anca']),
      E('Curl no Cabo', 'baixo', '12–15 reps · 3 séries', 'Tensão constante, cotovelos fixos ao lado do corpo.', ['Balançar o tronco', 'Cotovelos a abrirem']),
      E('Curl Concentrado', 'baixo', '12–15 reps por braço · 2–3 séries', 'Cotovelo apoiado na parte interior da coxa, sobe devagar e aperta no topo.', ['Usar impulso do ombro', 'Amplitude curta'])
    ]
  },
  triceps: {
    label: 'Tríceps', kind: 'strength',
    combo: combo(CARDIO_CLOSE, 'Prancha — 3x30–45seg', 'Cardio completo, e a prancha fecha com o core sem pedir mais esforço aos braços já cansados.'),
    exercises: [
      E('Supino Fechado', 'medio-alto', '8–10 reps · 3 séries', 'Mãos à largura dos ombros, cotovelos junto ao corpo.', ['Mãos demasiado juntas', 'Cotovelos muito abertos']),
      E('Mergulhos nas Paralelas (Dips)', 'alto', '6–10 reps · 3 séries', 'Tronco direito para focar o tríceps; podes usar a máquina assistida.', ['Descer demais com dor no ombro', 'Cotovelos muito abertos']),
      E('Mergulhos no Banco', 'medio', '10–15 reps · 3 séries', 'Mãos no banco, desce dobrando os cotovelos para trás.', ['Ombros a subir para as orelhas', 'Anca demasiado afastada do banco']),
      E('Extensão de Tríceps no Cabo', 'baixo', '12–15 reps · 3 séries', 'Cotovelos fixos.', ['Cotovelos a afastarem-se do corpo']),
      E('Tríceps Francês', 'baixo', '12–15 reps · 3 séries', 'Cotovelos fixos junto à cabeça.', ['Cotovelos a abrir para os lados']),
      E('Extensão Acima da Cabeça no Cabo', 'baixo', '12–15 reps · 3 séries', 'Cotovelos apontados para a frente, estende sem mexer os ombros.', ['Cotovelos a abrirem', 'Arquear a lombar']),
      E('Tríceps Coice (Kickback)', 'baixo', '12–15 reps por braço · 3 séries', 'Cotovelo fixo junto ao tronco, estende o braço para trás e aperta.', ['Balançar o braço', 'Cotovelo a descer'])
    ]
  },
  ombros: {
    label: 'Ombros', kind: 'strength',
    combo: combo(CARDIO_CLOSE, 'Prancha — 3x30–45seg', 'Cardio completo, e a prancha fecha com o core sem pedir mais esforço aos braços já cansados.'),
    exercises: [
      E('Shoulder Press', 'alto', '8–10 reps · 3 séries', 'Não bloqueies o cotovelo no topo.', ['Arquear a lombar']),
      E('Arnold Press', 'medio-alto', '8–12 reps · 3 séries', 'Começa com as palmas viradas para ti e roda enquanto empurras.', ['Arquear a lombar', 'Carga demasiado pesada']),
      E('Lateral Raises', 'medio', '12–15 reps · 3 séries', 'Até à altura do ombro.', ['Usar impulso do corpo']),
      E('Elevação Lateral no Cabo', 'baixo', '12–15 reps · 3 séries', 'Tensão constante, sobe até à altura do ombro.', ['Encolher os ombros', 'Usar impulso']),
      E('Elevação Frontal', 'baixo', '12–15 reps · 3 séries', 'Sobe até à altura dos olhos, sem balançar.', ['Balançar o tronco', 'Subir demasiado alto']),
      E('Delt Fly', 'medio', '15 / 10 / 8 / 6 reps', 'Pirâmide crescente de peso.', ['Usar impulso do tronco']),
      E('Face Pull', 'baixo', '12–15 reps · 3 séries', 'Puxa a corda em direção ao rosto com os cotovelos altos.', ['Cotovelos baixos', 'Inclinar o tronco para trás']),
      E('Remada Alta', 'medio', '10–12 reps · 3 séries', 'Puxa até ao peito com os cotovelos acima das mãos, sem passar da altura dos ombros.', ['Subir demasiado a barra', 'Usar impulso'])
    ]
  },
  abs: {
    label: 'Abs', kind: 'strength',
    exercises: [
      E('Elevação de Pernas', 'medio', '12–15 reps · 3 séries', 'Sobe sem balançar o corpo.', ['Balançar o corpo']),
      E('Elevação de Pernas Suspenso', 'medio-alto', '8–12 reps · 3 séries', 'Pendura-te na barra e sobe as pernas controlando o balanço.', ['Balançar o corpo', 'Usar só os flexores da anca']),
      E('Crunch na Máquina', 'medio', '15 reps · 3 séries', 'Contrai o abdominal.', ['Puxar o pescoço']),
      E('Crunch no Cabo', 'medio', '12–15 reps · 3 séries', 'De joelhos, enrola o tronco em direção ao chão contraindo o abdómen.', ['Puxar com os braços', 'Dobrar só a anca']),
      E('Roda Abdominal', 'medio-alto', '6–10 reps · 3 séries', 'Estende o corpo só até onde conseguires manter a lombar neutra.', ['Deixar a lombar cair', 'Ir mais longe do que consegues controlar']),
      E('Rotação Russa', 'medio', '15–20 reps por lado · 3 séries', 'Tronco ligeiramente inclinado para trás, roda o tronco todo e não só os braços.', ['Rodar só os braços', 'Costas arredondadas']),
      E('Crunch Abdominal', 'baixo', '15–20 reps · 3 séries', 'Sobe só as omoplatas do chão, a olhar para cima.', ['Puxar o pescoço', 'Subir com o impulso']),
      E('Bicycle Crunch', 'baixo', '15–20 reps por lado · 3 séries', 'Lento e controlado, cotovelo em direção ao joelho contrário.', ['Fazer muito depressa', 'Puxar o pescoço']),
      E('Dead Bug', 'baixo', '8–10 reps por lado · 3 séries', 'Lombar colada ao chão enquanto estendes braço e perna contrários.', ['Lombar a levantar do chão', 'Mover depressa demais']),
      E('Prancha', 'baixo', '30–45 seg · 3 séries', 'Corpo em linha reta.', ['Deixar a anca cair'], { kind: 'hold' }),
      E('Prancha Lateral', 'baixo', '20–40 seg por lado · 2–3 séries', 'Corpo em linha reta, cotovelo por baixo do ombro.', ['Deixar a anca cair', 'Rodar o tronco'], { kind: 'hold' })
    ]
  },
  cardio: {
    label: 'Cardio', kind: 'time',
    exercises: [
      E('Passadeira', 'medio-alto', '15–20 min', 'Intervalado 1 min / 1 min.', ['Agarrar-se aos corrimãos'], { distanceUnit: 'km' }),
      E('Passadeira Inclinada', 'medio-alto', '15–20 min', 'Caminha a ritmo firme com inclinação de 8–12%, sem te agarrares às barras.', ['Agarrar-se aos corrimãos', 'Inclinação demasiado alta com má postura'], { distanceUnit: 'km' }),
      E('Escadas', 'medio-alto', '15 min', 'Postura direita, sobe sem te apoiares na máquina.', ['Agarrar-se à máquina']),
      E('Elíptica', 'medio', '15–20 min', 'Ritmo moderado.', ['Apoiar peso nos braços']),
      E('Bicicleta Sentada', 'baixo', '15–20 min', 'Selim à altura certa, pedalar de forma contínua.', ['Selim muito baixo'], { distanceUnit: 'km' }),
      E('Bicicleta de Spinning', 'medio-alto', '20–45 min', 'Alterna ritmo e resistência, mantém as costas direitas.', ['Selim ou guiador mal ajustados', 'Resistência demasiado baixa'], { distanceUnit: 'km' }),
      E('Remo (Máquina)', 'medio-alto', '10–20 min', 'Empurra com as pernas, depois inclina o tronco e só no fim puxas com os braços.', ['Puxar só com os braços', 'Arredondar as costas'], { distanceUnit: 'm' }),
      E('Corda de Saltar', 'medio-alto', '5–15 min', 'Saltos pequenos, ritmo constante e pulsos a rodar a corda.', ['Saltos demasiado altos', 'Rodar a corda com os braços todos'])
    ]
  },
  desporto: {
    label: 'Outros desportos', kind: 'time',
    exercises: [
      E('Natação', 'medio-alto', '20–40 min', 'Aquece com 100–200 m suaves e alterna estilos. Respira de forma rítmica e mantém o corpo alinhado.', ['Levantar demasiado a cabeça', 'Nadar sempre à mesma velocidade, sem pausas planeadas', 'Saltar o aquecimento dos ombros'], { distanceUnit: 'm' }),
      E('Corrida', 'medio-alto', '20–40 min', 'Começa com 5 min de caminhada rápida. Corre a um ritmo em que ainda consegues dizer frases curtas.', ['Começar depressa demais', 'Passadas demasiado largas', 'Aumentar o volume de repente'], { distanceUnit: 'km' }),
      E('Caminhada', 'baixo', '30–60 min', 'Passo rápido, ombros relaxados e braços a acompanhar o passo.', ['Passo demasiado curto e lento', 'Postura curvada a olhar para o chão'], { distanceUnit: 'km' }),
      E('Ciclismo', 'medio', '30–90 min', 'Cadência constante e selim à altura certa; hidrata-te durante o treino.', ['Selim mal ajustado', 'Esquecer a hidratação'], { distanceUnit: 'km' }),
      E('Ténis', 'medio', '45–90 min', 'Aquece ombros e tornozelos e mexe os pés antes de bater na bola.', ['Bater na bola sem mexer os pés', 'Usar só o braço, sem rodar o tronco', 'Saltar o aquecimento']),
      E('Padel', 'medio', '45–90 min', 'Aquece bem ombros e tornozelos e mantém-te em movimento, com os joelhos ligeiramente fletidos.', ['Ficar sem te mexer à espera da bola', 'Saltar o aquecimento']),
      E('Aulas de grupo', 'medio', '45–60 min', 'Escolhe o nível certo, ajusta a intensidade ao teu dia e hidrata-te.', ['Copiar o ritmo dos outros e ignorar o teu corpo', 'Não avisar o professor de lesões', 'Não beber água'], { noteLabel: 'Que aula? (ex: spinning)' }),
      E('Yoga / Pilates', 'baixo', '45–60 min', 'Respira de forma calma e controla cada movimento. Foca-te na qualidade e não na amplitude.', ['Forçar a amplitude', 'Prender a respiração']),
      E('Dança', 'medio', '45–60 min', 'Aquece as articulações e vai aumentando a intensidade aos poucos.', ['Começar a frio com movimentos muito intensos'])
    ]
  }
};

// Exercícios iniciais (os do plano original): estes aparecem SEMPRE.
// Todos os outros do catálogo ficam escondidos e só aparecem se a pessoa os adicionar com o botão "+"
// (ou se já tiverem registos).
export const CORE = new Set([
  'Hip Thrust', 'RDLs', 'Single Leg Leg Press', 'Cable Kickback', 'Cadeira Adutora', 'Cadeira Abdutora',
  'Hack Squat', 'Leg Press', 'Leg Extension', 'Leg Curl', 'Calf Raises',
  'Lat Pulldown', 'T Bar Row', 'Low Row',
  'Chest Press', 'Pec Fly',
  'Bicep Curl', 'Hammer Curl',
  'Extensão de Tríceps no Cabo', 'Tríceps Francês',
  'Shoulder Press', 'Lateral Raises', 'Delt Fly',
  'Elevação de Pernas', 'Crunch na Máquina', 'Prancha',
  'Passadeira', 'Escadas', 'Elíptica', 'Bicicleta Sentada',
  'Natação', 'Corrida', 'Caminhada', 'Ténis', 'Aulas de grupo'
]);

// Separadores do Treino (Braços tem sub-separadores)
export const TABS = [
  { key: 'pernas', label: 'Pernas' },
  { key: 'gluteo', label: 'Glúteos' },
  { key: 'costas', label: 'Costas' },
  { key: 'peito', label: 'Peito' },
  { key: 'bracos', label: 'Braços', children: ['biceps', 'triceps', 'ombros'] },
  { key: 'abs', label: 'Abs' },
  { key: 'cardio', label: 'Cardio' },
  { key: 'desporto', label: 'Outros desportos' }
];

// ---------- Aquecimento e alongamento (por grupo) ----------
// Aquecimento: movimento geral + mobilidade dinâmica do que vais treinar + séries de aproximação.
// Alongamento: no fim do treino, ~30 s por posição.

const WARM_GENERAL = '5 min de cardio leve (bicicleta, passadeira ou elíptica) para aquecer o corpo';
const WARM_RAMP = '1–2 séries leves do primeiro exercício (cerca de 50% e 70% da carga de trabalho) antes de começares a sério';
const STRETCH_RULE = 'Mantém cada posição cerca de 30 s, sem dor, a respirar devagar. Faz no fim do treino, com o corpo quente.';

const warm = (...items) => ({ title: 'Aquecimento', time: '5–8 min', items: [WARM_GENERAL, ...items, WARM_RAMP] });
const stretch = (...items) => ({ title: 'Alongamento', time: '5 min', rule: STRETCH_RULE, items });

const SHOULDER_WARM = ['Círculos de braços — 10 para cada lado', 'Rotação externa de ombro com elástico — 2×12'];

const ARMS_COMBO = { warm: warm(...SHOULDER_WARM, 'Flexão e extensão de cotovelo sem carga — 15', 'Rotação de pulsos — 10 para cada lado') };

export const WARMUP_STRETCH = {
  pernas: {
    warm: warm('Agachamento ao peso do corpo — 2×10', 'Afundo caminhado — 1×8 por perna', 'Balanço de perna — 10 por perna', 'Rotações de tornozelo — 10 por lado'),
    stretch: stretch('Quadríceps em pé — 30 s por perna', 'Posterior da coxa — 30 s por perna', 'Gémeos na parede — 30 s por perna', 'Adutores (posição de borboleta) — 30 s')
  },
  gluteo: {
    warm: warm('Ponte de glúteo — 2×12', 'Abdução de anca com elástico — 2×15 por lado', 'Agachamento ao peso do corpo — 1×10', 'Balanço de perna — 10 por perna'),
    stretch: stretch('Pombo ou figura 4 deitado(a) — 30 s por lado', 'Flexor da anca em afundo — 30 s por lado', 'Posterior da coxa sentado(a) — 30 s por perna', 'Joelhos ao peito, deitado(a) — 30 s')
  },
  costas: {
    warm: warm('Gato-camelo — 8 repetições', 'Rotação torácica — 8 por lado', 'Círculos de ombros — 10 para cada lado', 'Puxada leve com elástico — 2×12'),
    stretch: stretch('Postura da criança — 30 s', 'Dorsais agarrando um apoio e a sentar para trás — 30 s', 'Rotação da coluna deitada — 30 s por lado', 'Trapézio superior (inclinar a cabeça) — 30 s por lado')
  },
  peito: {
    warm: warm('Círculos de braços — 10 para cada lado', 'Abertura dinâmica de braços — 10', 'Flexões inclinadas ou na parede — 1×10', 'Rotação externa de ombro com elástico — 2×12'),
    stretch: stretch('Peitoral na ombreira da porta — 30 s por lado', 'Ombro cruzado à frente — 30 s por lado', 'Bíceps com a mão apoiada na parede — 30 s por lado')
  },
  biceps: {
    ...ARMS_COMBO,
    stretch: stretch('Bíceps com a mão apoiada na parede — 30 s por braço', 'Antebraço (flexores do punho) — 30 s por braço', 'Peitoral na ombreira da porta — 30 s')
  },
  triceps: {
    ...ARMS_COMBO,
    stretch: stretch('Tríceps por cima da cabeça — 30 s por braço', 'Ombro cruzado à frente — 30 s por lado', 'Antebraço (extensores do punho) — 30 s por braço')
  },
  ombros: {
    warm: warm(...SHOULDER_WARM, 'Face pull ou elevações laterais com peso mínimo — 1×15'),
    stretch: stretch('Ombro cruzado à frente — 30 s por lado', 'Peitoral na ombreira da porta — 30 s', 'Trapézio superior (inclinar a cabeça) — 30 s por lado')
  },
  abs: {
    warm: { title: 'Aquecimento', time: '3–5 min', items: ['Gato-camelo — 8 repetições', 'Rotação do tronco — 8 por lado', 'Dead bug — 6 por lado', 'Prancha leve — 20 s'] },
    stretch: stretch('Cobra (extensão suave da coluna) — 30 s', 'Postura da criança — 30 s', 'Rotação da coluna deitada — 30 s por lado')
  },
  cardio: {
    warm: { title: 'Aquecimento', time: '3–5 min', items: ['Começa a ritmo muito leve e vai aumentando aos poucos', 'Mobilidade de tornozelos e ancas — 10 por lado'] },
    stretch: { title: 'Arrefecimento e alongamento', time: '5 min', rule: STRETCH_RULE, items: ['3–5 min a caminhar devagar para baixar o ritmo', 'Gémeos na parede — 30 s por perna', 'Quadríceps em pé — 30 s por perna', 'Posterior da coxa — 30 s por perna'] }
  },
  desporto: {
    warm: { title: 'Aquecimento', time: '5–10 min', items: ['Movimento leve e progressivo, com a mobilidade das articulações que vais usar', 'Aumenta a intensidade aos poucos antes de começares a sério'] },
    stretch: { title: 'Arrefecimento e alongamento', time: '5 min', rule: STRETCH_RULE, items: ['3–5 min a baixar o ritmo', 'Alonga os músculos mais usados — 30 s cada'] }
  }
};
