// A Butty muda de visual conforme o mês: acessório, decoração, cores do cartão
// e uma frase própria do mês.
// Desenhos do mês: icons/butty/meses/MM-N.webp (N = 1, 2, 3...). Em `art` diz-se quantos há
// (`count`), qual se usa nos resumos (`hero`) e que desenho substitui cada cara normal da Butty
// (`faces`: a cara de cada nível). Meses sem desenhos usam as caras normais.
export const BUTTY_MONTHS = [
  { name: 'Janeiro', title: 'Butty de Ano Novo', acc: '🎉', deco: ['✨', '🎆', '🥂'], c1: '#FCE7B8', c2: '#D9CFF0',
    lines: ['Ano novo, rabinho novo! Bora começar com tudo? 🎉', 'Resoluções de janeiro: beber água, treinar e dar-me sementes. Por esta ordem. 🥂'], art: { count: 10, hero: 1, faces: { 'face-sleepy': 7, 'face-shock': 4, 'face-joy': 1, 'face-love': 5, 'face-wink': 9, 'face-laugh': 3, 'face-peek': 10 } } },
  { name: 'Fevereiro', title: 'Butty Apaixonada', acc: '💘', deco: ['💗', '💕', '🌹'], c1: '#F9C9D9', c2: '#F6D7E8',
    lines: ['Este mês o amor-próprio também treina. 💘', 'Amo-te mais do que agachamentos. E eu adoro agachamentos. 💕'], art: { count: 10, hero: 1, faces: { 'face-sleepy': 10, 'face-shock': 4, 'face-joy': 1, 'face-love': 3, 'face-wink': 2, 'face-laugh': 5, 'face-peek': 4 } } },
  { name: 'Março', title: 'Butty da Primavera', acc: '🌷', deco: ['🌸', '🌼', '🦋'], c1: '#DDF2E9', c2: '#F8D6E4',
    lines: ['A primavera chegou e eu já estou a florir. E tu? 🌷', 'Mais luz, mais energia, mais treinos. A natureza manda! 🦋'], art: null },
  { name: 'Abril', title: 'Butty da Páscoa', acc: '🐰', deco: ['🥚', '🌸', '🐣'], c1: '#E9F3C8', c2: '#F9DDE7',
    lines: ['Chocolate? Pode ser, mas o treino vem primeiro. 🐰', 'Abril, águas mil... e muitas sementes também! 🐣'], art: null },
  { name: 'Maio', title: 'Butty das Flores', acc: '🌺', deco: ['🌻', '🌼', '🐝'], c1: '#FDE6C8', c2: '#F6CFE0',
    lines: ['Maio é mês das flores e eu sou a mais bonita da floresta. 🌺', 'Os dias estão maiores: há mais tempo para mexer esse rabinho! 🐝'], art: null },
  { name: 'Junho', title: 'Butty dos Santos', acc: '🎈', deco: ['🎏', '🐟', '🌿'], c1: '#CDEBF5', c2: '#FBE0C6',
    lines: ['Santos populares! Uma sardinha e depois um treino, combinado? 🐟', 'Junho pede manjerico, arraial e muita água. 🌿'], art: null },
  { name: 'Julho', title: 'Butty de Verão', acc: '🕶️', deco: ['☀️', '🌴', '🍉'], c1: '#FFE9A8', c2: '#C9ECF0',
    lines: ['Calor! Bebe água a dobrar que eu já estou a derreter. ☀️', 'Óculos de sol postos, treino feito e praia à espera. 🕶️'], art: null },
  { name: 'Agosto', title: 'Butty de Férias', acc: '👒', deco: ['🏖️', '🐚', '🍦'], c1: '#C6E8F2', c2: '#FFE3B5',
    lines: ['Férias não são desculpa: até na areia se fazem agachamentos. 🏖️', 'Um gelado de vez em quando não faz mal. Eu não conto a ninguém. 🍦'], art: null },
  { name: 'Setembro', title: 'Butty de Regresso', acc: '🎒', deco: ['📚', '🍎', '✏️'], c1: '#FBDCC4', c2: '#DCE9C8',
    lines: ['Regresso às rotinas! A minha mochila já tem a garrafa de água. 🎒', 'Setembro é o novo janeiro: bora recomeçar com força! 🍎'], art: null },
  { name: 'Outubro', title: 'Butty de Halloween', acc: '🎃', deco: ['🦇', '👻', '🍂'], c1: '#FCD4A8', c2: '#D9CFF0',
    lines: ['Assustador mesmo é saltar o treino de pernas. 🎃', 'Doçura ou travessura? Eu escolho sementes! 👻'], art: null },
  { name: 'Novembro', title: 'Butty de Outono', acc: '🍂', deco: ['🍁', '🌰', '☕'], c1: '#F6D3B3', c2: '#EED9C9',
    lines: ['Folhas a cair, treinos a subir. 🍂', 'Castanhas assadas e um treino quentinho: o outono perfeito. 🌰'], art: { count: 10, hero: 2, faces: { 'face-sleepy': 6, 'face-shock': 5, 'face-joy': 1, 'face-love': 10, 'face-wink': 2, 'face-laugh': 9, 'face-peek': 5 } } },
  { name: 'Dezembro', title: 'Butty de Natal', acc: '🎅', deco: ['❄️', '🎄', '🎁'], c1: '#F7C9CF', c2: '#D3ECE0',
    lines: ['Ho ho ho! O melhor presente és tu a treinar. 🎄', 'Bacalhau, bolo-rei e... um treino para equilibrar! 🎁'], art: { count: 10, hero: 1, faces: { 'face-sleepy': 4, 'face-shock': 5, 'face-joy': 3, 'face-love': 9, 'face-wink': 7, 'face-laugh': 6, 'face-peek': 5 } } }
];

export const buttyMonth = (date = new Date()) => BUTTY_MONTHS[date.getMonth()];

const artPath = (monthIdx, n) => `icons/butty/meses/${String(monthIdx + 1).padStart(2, '0')}-${n}.webp`;

// Imagem da Butty para este mês: o desenho do mês que corresponde a esta cara, se houver; senão a normal.
export function buttyMonthImg(img, date = new Date()) {
  const art = buttyMonth(date).art;
  return art && art.faces[img] ? artPath(date.getMonth(), art.faces[img]) : `icons/butty/${img}.webp`;
}

// "Butty do dia": nos meses com desenhos, cada dia mostra um desenho diferente do mês
// (todos aparecem ao longo do mês). Sem desenhos, fica a cara do nível.
export function buttyDayImg(levelImg, date = new Date()) {
  const art = buttyMonth(date).art;
  if (!art) return `icons/butty/${levelImg}.webp`;
  return artPath(date.getMonth(), ((date.getDate() - 1) % art.count) + 1);
}

// Desenho de destaque de um mês (0 = janeiro) para os resumos, ou a cara indicada se não houver.
export function buttyMonthHero(monthIdx, fallback = 'face-love') {
  const art = BUTTY_MONTHS[monthIdx].art;
  return art ? artPath(monthIdx, art.hero) : `icons/butty/${fallback}.webp`;
}

// Desenho de um mês para uma cara (para os resumos de meses passados).
export function buttyMonthFace(monthIdx, face) {
  const art = BUTTY_MONTHS[monthIdx].art;
  return art && art.faces[face] ? artPath(monthIdx, art.faces[face]) : `icons/butty/${face}.webp`;
}

// Faz anos hoje? (quem nasceu a 29 de fevereiro festeja a 28 nos anos não bissextos)
export function isBirthday(birth, day) {
  if (!birth || !day) return false;
  const [, bm, bd] = birth.split('-').map(Number);
  const [y, m, d] = day.split('-').map(Number);
  if (!bm || !bd) return false;
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  if (bm === 2 && bd === 29 && !leap) return m === 2 && d === 28;
  return bm === m && bd === d;
}

export const BIRTHDAY_LINES = [
  'Hoje a estrela és tu! Já pus o chapéu de festa e tudo. 🥳',
  'Parabéns! Hoje o bolo conta como refeição saudável. Só hoje! 🎂',
  'Mais um ano de rabinho forte e coração gigante. Parabéns! 💗',
  'Hoje não há desafios: há festa! (Mas se treinares, ganho sementes de aniversário.) 🎉'
];
