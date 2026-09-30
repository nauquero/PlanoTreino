// Conteúdo estático do plano (exercícios, refeições, significados).
// Para mudar textos ou exercícios basta editar este ficheiro.

export const PROFILES = {
  mariana: { name: 'Mariana', emoji: '🍑', goal: '🎯 Objetivo: Hipertrofia' },
  elia: { name: 'Élia', emoji: '🚴', goal: '🎯 Objetivo: Perda de gordura + Hipertrofia' }
};

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

export const NUTRITION = {
  mariana: {
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
  elia: {
    note: 'Foco em perda de gordura + hipertrofia — défice calórico ligeiro, proteína alta para preservar músculo, carboidratos mais controlados mas sempre presentes à volta do treino.',
    meals: {
      'Pequeno-almoço': ['Iogurte grego (natural, sem açúcar) + fruta + canela', 'Ovos mexidos + legumes salteados', 'Torrada integral + queijo fresco magro'],
      'Almoço': ['Proteína magra (frango/peixe) + legumes abundantes + porção moderada de arroz/batata-doce', 'Salada completa com proteína + azeite (moderado)'],
      'Pré-treino (60–90 min antes)': ['Fruta pequena (ex: maçã)', 'Café + torrada fina'],
      'Pós-treino': ['Iogurte grego + fruta', 'Batido proteico leve (água em vez de leite gordo)'],
      'Lanche': ['Palitos de legumes + húmus', 'Queijo fresco magro', 'Punhado pequeno de frutos secos'],
      'Jantar': ['Mais leve que o almoço: proteína + muitos legumes + carbo reduzido (ex: só legumes ou pouco arroz)']
    }
  }
};

export const GROUPS = {
  gluteo: {
    label: '🍑 Glúteo',
    combo: { cardio: { mariana: 'Escadas — 15 min', elia: 'Bicicleta sentada — 15–20 min' }, abs: 'Prancha — 3x30–45seg', why: 'Mantém o glúteo ativo mesmo depois do treino de força, e a prancha fecha a sessão sem sobrecarregar mais as pernas.' },
    exercises: [
      { name: 'Hip Thrust', effort: 'alto', reps: '6–10 reps · 3–4 séries', tech: 'Pausa de 1–2seg no topo, contrai bem o glúteo antes de descer.', mistakes: ['Arquear demasiado a lombar', 'Não subir a anca até à extensão completa', 'Apoiar o peso nos pés à frente'] },
      { name: 'RDLs', effort: 'alto', reps: '6–10 reps · 3–4 séries', tech: 'Desce controlado (3–4seg), sente o alongamento no glúteo/posterior antes de subir.', mistakes: ['Arredondar as costas', 'Dobrar demasiado os joelhos', 'Afastar o peso do corpo'] },
      { name: 'Single Leg Leg Press', effort: 'medio-alto', reps: '10–12 reps · 3 séries', tech: 'Pés mais altos na plataforma para focar mais glúteo.', mistakes: ['Joelho a colapsar para dentro', 'Não controlar a descida'] },
      { name: 'Cable Kickback', effort: 'medio', reps: '12–20 reps · 3 séries', tech: 'Movimento lento e controlado, drop set no fim.', mistakes: ['Balançar o tronco', 'Arquear a lombar'] },
      { name: 'Cadeira Adutora', effort: 'medio', reps: '12–15 reps · 3 séries', tech: 'Contração lenta.', mistakes: ['Usar impulso'] },
      { name: 'Cadeira Abdutora', effort: 'baixo', reps: '15–20 reps · 3 séries', tech: 'Finisher do dia de glúteo.', mistakes: ['Inclinar o tronco para trás'] }
    ]
  },
  pernas: {
    label: '🦵 Pernas',
    combo: { cardio: { mariana: 'Escadas — 15–20 min', elia: 'Bicicleta sentada — 15–20 min' }, abs: 'Elevação de pernas — 3x12', why: 'Mantém a perna ativa, e a elevação de pernas fecha com o core sem pedir mais das coxas.' },
    exercises: [
      { name: 'Hack Squat', effort: 'alto', reps: '6–10 reps · 3–4 séries', tech: 'Descida controlada (3–4seg).', mistakes: ['Joelhos a colapsar para dentro', 'Amplitude curta'] },
      { name: 'Leg Press', effort: 'medio-alto', reps: '10–12 reps · 3–4 séries', tech: 'Pés à largura dos ombros.', mistakes: ['Bloquear os joelhos no topo'] },
      { name: 'Leg Extension', effort: 'medio', reps: '12–15 reps · 3 séries', tech: 'Contrai 1seg no topo.', mistakes: ['Usar impulso'] },
      { name: 'Leg Curl', effort: 'medio', reps: '12–15 reps · 3 séries', tech: 'Movimento lento.', mistakes: ['Levantar a anca do banco'] },
      { name: 'Calf Raises', effort: 'baixo', reps: '15–20 reps · 3 séries', tech: 'Amplitude completa, pausa no topo.', mistakes: ['Movimento muito rápido'] }
    ]
  },
  costas: {
    label: '🔙 Costas & Tricep',
    combo: { cardio: { mariana: 'Escadas — 15 min', elia: 'Bicicleta sentada — 15–20 min' }, abs: 'Crunch na máquina — 3x15', why: 'Cardio completo sem pedir mais dos braços, e o crunch fecha a sessão com foco no core.' },
    exercises: [
      { name: 'Lat Pulldown', effort: 'alto', reps: '8–10 reps · 3–4 séries', tech: 'Puxa até ao peito, cotovelos para baixo e para trás.', mistakes: ['Puxar só com os braços', 'Inclinar muito o tronco'] },
      { name: 'T Bar Row', effort: 'alto', reps: '8–10 reps · 3–4 séries', tech: 'Cotovelos junto ao corpo.', mistakes: ['Balanço do tronco'] },
      { name: 'Low Row', effort: 'medio-alto', reps: '15 / 20 reps', tech: 'Pirâmide decrescente.', mistakes: ['Puxar só com os braços'] },
      { name: 'Delt Fly', effort: 'medio', reps: '15 / 10 / 8 / 6 reps', tech: 'Pirâmide crescente de peso.', mistakes: ['Usar impulso do tronco'] },
      { name: 'Extensão de Tríceps no Cabo', effort: 'baixo', reps: '12–15 reps · 3 séries', tech: 'Cotovelos fixos.', mistakes: ['Cotovelos a afastarem-se do corpo'] },
      { name: 'Tríceps Francês', effort: 'baixo', reps: '12–15 reps · 3 séries', tech: 'Cotovelos fixos junto à cabeça.', mistakes: ['Cotovelos a abrir para os lados'] }
    ]
  },
  peito: {
    label: '💪 Peito, Ombro & Bícep',
    combo: { cardio: { mariana: 'Escadas — 15 min', elia: 'Bicicleta sentada — 15–20 min' }, abs: 'Prancha — 3x30–45seg', why: 'Cardio completo, e a prancha fecha com o core sem pedir mais esforço aos braços já cansados.' },
    exercises: [
      { name: 'Chest Press', effort: 'alto', reps: '8–10 reps · 3–4 séries', tech: 'Desce controlado.', mistakes: ['Bloquear os cotovelos no topo'] },
      { name: 'Shoulder Press', effort: 'alto', reps: '8–10 reps · 3 séries', tech: 'Não bloqueies o cotovelo no topo.', mistakes: ['Arquear a lombar'] },
      { name: 'Pec Fly', effort: 'medio', reps: '12–15 reps · 3 séries', tech: 'Movimento em arco.', mistakes: ['Estender os cotovelos completamente'] },
      { name: 'Lateral Raises', effort: 'medio', reps: '12–15 reps · 3 séries', tech: 'Até à altura do ombro.', mistakes: ['Usar impulso do corpo'] },
      { name: 'Bicep Curl', effort: 'baixo', reps: '12–15 reps · 3 séries', tech: 'Cotovelos fixos.', mistakes: ['Balançar o tronco'] },
      { name: 'Hammer Curl', effort: 'baixo', reps: '12–15 reps · 3 séries', tech: 'Pega neutra.', mistakes: ['Balançar os ombros'] }
    ]
  },
  abs: {
    label: '🔥 Abs',
    exercises: [
      { name: 'Elevação de Pernas', effort: 'medio', reps: '12–15 reps · 3 séries', tech: 'Sobe sem balançar o corpo.', mistakes: ['Balançar o corpo'] },
      { name: 'Crunch na Máquina', effort: 'medio', reps: '15 reps · 3 séries', tech: 'Contrai o abdominal.', mistakes: ['Puxar o pescoço'] },
      { name: 'Prancha', effort: 'baixo', reps: '30–45seg · 3 séries', tech: 'Corpo em linha reta.', mistakes: ['Deixar a anca cair'] }
    ]
  },
  cardio: {
    label: '🚴 Cardio',
    exercises: [
      { name: 'Passadeira', effort: 'medio-alto', reps: '15–20 min', tech: 'Intervalado 1min/1min.', mistakes: ['Agarrar-se aos corrimãos'] },
      { name: 'Escadas', effort: 'medio-alto', reps: '15 min', tech: 'Só para a Mariana.', mistakes: ['Agarrar-se à máquina'] },
      { name: 'Elíptica', effort: 'medio', reps: '15–20 min', tech: 'Ritmo moderado.', mistakes: ['Apoiar peso nos braços'] },
      { name: 'Bicicleta Sentada', effort: 'baixo', reps: '15–20 min', tech: 'Preferência da Élia.', mistakes: ['Selim muito baixo'] }
    ]
  }
};
