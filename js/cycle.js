// Ciclo menstrual: cálculo da fase de cada dia e o que esperar em cada uma.
// Informação geral e educativa; não substitui o acompanhamento médico.

export const GENDERS = ['Feminino', 'Outro'];

export const STATUSES = [
  ['cycle', 'Tenho ciclo menstrual'],
  ['pregnant', 'Estou grávida'],
  ['none', 'Não tenho menstruação']
];

export const PHASES = {
  menstrual: {
    label: 'Menstruação', color: '#F2A9C4', energy: 2,
    what: 'O corpo elimina o revestimento do útero. Os estrogénios e a progesterona estão no ponto mais baixo do ciclo.',
    expect: ['Fluxo menstrual e, para muitas pessoas, cólicas', 'Cansaço e energia mais baixa', 'Dor lombar ou nas pernas, sensação de peso', 'Humor mais sensível ou introspetivo'],
    train: 'Ouve o corpo: caminhadas, yoga, alongamentos ou treino de força leve. Se te sentires bem, treina normalmente, não há nada que o impeça.',
    eat: 'Alimentos com ferro (carne magra, leguminosas, espinafres) com vitamina C ao lado. Omega-3 (salmão, nozes, linhaça) pode ajudar nas cólicas. Bebe bastante água.',
    tip: 'Calor local na barriga ajuda nas cólicas. Se a dor te impedir de fazer a tua vida ou o fluxo for muito abundante, fala com o médico.'
  },
  follicular: {
    label: 'Fase folicular', color: '#BFE3D0', energy: 4,
    what: 'Os estrogénios vão subindo e o corpo prepara um novo óvulo. É a fase em que muita gente se sente mais disposta.',
    expect: ['Energia e motivação a subir', 'Humor mais estável e positivo', 'Pele geralmente melhor', 'Boa recuperação entre treinos'],
    train: 'Boa altura para treinos mais intensos, cargas mais pesadas, aprender exercícios novos e bater recordes.',
    eat: 'Proteína em todas as refeições, hidratos de qualidade para dar energia ao treino (aveia, arroz, batata-doce) e muitos vegetais.',
    tip: 'Aproveita a energia extra, mas mantém os dias de descanso.'
  },
  ovulation: {
    label: 'Ovulação', color: '#FBD58A', energy: 5,
    what: 'Um óvulo é libertado, normalmente cerca de 14 dias antes da próxima menstruação. É o pico dos estrogénios.',
    expect: ['Energia e disposição no máximo', 'Possível dor leve num dos lados da barriga', 'Mais muco cervical, transparente e elástico', 'Maior apetite sexual em muitas pessoas'],
    train: 'Ótimo para treino intenso. Aquece bem e cuida da técnica nos joelhos: os ligamentos podem estar um pouco mais laxos.',
    eat: 'Fibra, boa hidratação e alimentos ricos em antioxidantes (frutos vermelhos, folhas verdes).',
    tip: 'É a fase mais fértil do ciclo. Isto é uma estimativa e não serve como método contracetivo.'
  },
  luteal: {
    label: 'Fase lútea', color: '#D9CFF0', energy: 3,
    what: 'A progesterona sobe e a temperatura do corpo aumenta ligeiramente. O corpo gasta um pouco mais de energia.',
    expect: ['Apetite um pouco maior', 'Energia estável, que vai descendo aos poucos', 'Temperatura corporal ligeiramente mais alta', 'Mais calor e suor nos treinos'],
    train: 'Treino de força moderado, pilates e cardio constante funcionam bem. Se o esforço te parecer mais pesado, baixa uma ou duas repetições sem culpa.',
    eat: 'Refeições regulares com proteína e hidratos complexos mantêm a saciedade. Come um pouco mais se tiveres fome, é normal.',
    tip: 'Dormir bem faz muita diferença nesta fase.'
  },
  pms: {
    label: 'Pré-menstrual (TPM)', color: '#F7C7A8', energy: 2,
    what: 'Os estrogénios e a progesterona descem de novo. Os sintomas pré-menstruais costumam aparecer nos 5 a 7 dias antes da menstruação.',
    expect: ['Barriga inchada e retenção de líquidos', 'Seios sensíveis', 'Irritabilidade, ansiedade ou humor mais baixo', 'Vontade de doces e snacks, cansaço, sono pior'],
    train: 'Treinos moderados, caminhadas, natação, yoga ou pilates. Mexer o corpo ajuda a aliviar o inchaço e o humor.',
    eat: 'Menos sal e álcool, mais água. Alimentos ricos em magnésio (frutos secos, chocolate negro, banana) ajudam. Podes ter um doce sem drama.',
    tip: 'Se os sintomas forem muito fortes ou afetarem o teu dia a dia, vale a pena falar com o médico.'
  }
};

// Notas específicas de cada dia dentro da fase
function dayNote(sub, i) {
  switch (sub) {
    case 'm-first': return 'Primeiro dia da menstruação: costuma ser o dia com mais cólicas e mais cansaço.';
    case 'm-heavy': return 'O fluxo costuma ser mais abundante nestes primeiros dias.';
    case 'm-light': return 'O fluxo costuma diminuir e as cólicas aliviam.';
    case 'f-early': return 'A energia começa a voltar. Boa altura para retomar a intensidade.';
    case 'f-late': return 'Fase de crescimento dos estrogénios: força, humor e disposição em alta.';
    case 'o-before': return 'Véspera da ovulação: a energia está quase no máximo.';
    case 'o-day': return 'Dia provável da ovulação.';
    case 'o-after': return 'Dia a seguir à ovulação: a energia ainda é boa, a temperatura começa a subir.';
    case 'l-early': return 'A progesterona está a subir: podes ter mais calor e mais apetite.';
    case 'l-mid': return 'Meio da fase lútea: energia estável, o corpo trabalha a um ritmo mais calmo.';
    case 'p-early': return 'Os sintomas pré-menstruais podem começar a aparecer.';
    case 'p-late': return i === 0 ? 'Os sintomas pré-menstruais costumam ser mais intensos agora.' : 'Última fase antes da menstruação: descansa e sê gentil contigo.';
    default: return '';
  }
}

const DAY = 86400000;
const parseIso = (iso) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
export const diffDays = (a, b) => Math.round((parseIso(a) - parseIso(b)) / DAY);
export function addDays(iso, n) {
  const t = new Date(parseIso(iso) + n * DAY);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
}

// Configuração do ciclo, com valores por omissão e limites seguros
export function cycleParams(c) {
  const L = Math.min(45, Math.max(21, Math.round(Number(c?.cycle_len)) || 28));
  const P = Math.min(8, Math.max(2, Math.round(Number(c?.period_len)) || 5));
  return { L, P };
}

// Fase do dia `iso`, a partir do primeiro dia da última menstruação
export function cycleDayInfo(c, iso) {
  if (!c || c.status !== 'cycle' || !c.last_period) return null;
  const { L, P } = cycleParams(c);
  const off = diffDays(iso, c.last_period);
  const n = ((off % L) + L) % L + 1;           // dia do ciclo, 1..L
  const ov = L - 14;                            // dia provável da ovulação
  const ovS = Math.max(P + 1, ov - 1), ovE = ovS + 2;
  const pms = Math.max(ovE + 1, L - 5);
  let phase, sub, i = 0;
  if (n <= P) { phase = 'menstrual'; sub = n === 1 ? 'm-first' : n <= Math.ceil(P / 2) ? 'm-heavy' : 'm-light'; }
  else if (n < ovS) { phase = 'follicular'; sub = n <= P + Math.ceil((ovS - P - 1) / 2) ? 'f-early' : 'f-late'; }
  else if (n <= ovE) { phase = 'ovulation'; sub = n === ovS ? 'o-before' : n === ovS + 1 ? 'o-day' : 'o-after'; }
  else if (n < pms) { phase = 'luteal'; sub = n <= ovE + Math.ceil((pms - ovE - 1) / 2) ? 'l-early' : 'l-mid'; }
  else { phase = 'pms'; i = n - pms; sub = n < pms + 2 ? 'p-early' : 'p-late'; }
  const fertile = n >= ovS - 4 && n <= ovE;      // janela fértil estimada (5 dias antes da ovulação + 1 depois)
  return {
    n, L, P, phase, fertile,
    note: dayNote(sub, i),
    daysToNext: L - n + 1,
    ...PHASES[phase]
  };
}

// Dias de atraso em relação ao previsto (só faz sentido para hoje)
export function lateDays(c, todayIso) {
  if (!c || c.status !== 'cycle' || !c.last_period) return 0;
  const { L } = cycleParams(c);
  return Math.max(0, diffDays(todayIso, c.last_period) - L + 1);
}

// Próxima menstruação prevista, a contar de `fromIso`
export function nextPeriod(c, fromIso) {
  const { L } = cycleParams(c);
  const off = diffDays(fromIso, c.last_period);
  const k = off < 0 ? 0 : Math.floor(off / L) + 1;
  return addDays(c.last_period, k * L);
}

export const TRIMESTERS = [
  {
    label: '1.º trimestre', until: 13,
    expect: ['Cansaço e sonolência', 'Enjoos e sensibilidade a cheiros', 'Seios sensíveis e vontade de urinar mais vezes', 'Humor com altos e baixos'],
    train: 'Se já treinavas, normalmente podes continuar, com menos intensidade se te sentires cansada. Caminhadas, yoga e treino de força leve funcionam bem.',
    eat: 'Pequenas refeições frequentes ajudam nos enjoos. Ácido fólico, hidratação e proteína em cada refeição.'
  },
  {
    label: '2.º trimestre', until: 27,
    expect: ['Mais energia e menos enjoos', 'A barriga começa a notar-se', 'Movimentos do bebé', 'Dor lombar ou nas costas ligeira'],
    train: 'Evita exercícios deitada de costas por muito tempo e desportos de contacto. Força leve, natação, caminhadas e pilates para grávidas.',
    eat: 'Mais ferro, cálcio e proteína. Come com regularidade e evita alimentos crus ou mal cozinhados.'
  },
  {
    label: '3.º trimestre', until: 42,
    expect: ['Mais cansaço e peso na barriga', 'Azia, inchaço nos pés e dificuldade em dormir', 'Contrações de treino (Braxton Hicks)', 'Preparação para o parto'],
    train: 'Movimento suave: caminhar, alongar, respiração e exercícios do pavimento pélvico. Para quando sentires tonturas, dor ou contrações regulares.',
    eat: 'Refeições mais pequenas para a azia, bastante água e fibra. Segue as indicações da tua equipa de saúde.'
  }
];

export function pregnancyInfo(c, todayIso) {
  if (!c || c.status !== 'pregnant' || !c.last_period) return null;
  const days = diffDays(todayIso, c.last_period);
  if (days < 0) return null;
  const weeks = Math.floor(days / 7);
  const tri = TRIMESTERS.find((t) => weeks <= t.until) || TRIMESTERS[2];
  return { weeks, extraDays: days % 7, due: addDays(c.last_period, 280), tri };
}

export function ageOf(birthIso, todayIso) {
  if (!birthIso) return null;
  const [by, bm, bd] = birthIso.split('-').map(Number);
  const [ty, tm, td] = todayIso.split('-').map(Number);
  let a = ty - by;
  if (tm < bm || (tm === bm && td < bd)) a--;
  return a >= 0 ? a : null;
}
