// A Butty muda de visual conforme o mês: acessório, decoração, cores do cartão
// e uma frase própria do mês. Para usar desenhos próprios de um mês, põe as imagens em
// icons/butty/meses/ (ex.: 12-face-joy.webp) e escreve o nome das que existem em `imgs`.
export const BUTTY_MONTHS = [
  { name: 'Janeiro', title: 'Butty de Ano Novo', acc: '🎉', deco: ['✨', '🎆', '🥂'], c1: '#FCE7B8', c2: '#D9CFF0',
    lines: ['Ano novo, rabinho novo! Bora começar com tudo? 🎉', 'Resoluções de janeiro: beber água, treinar e dar-me sementes. Por esta ordem. 🥂'], imgs: [] },
  { name: 'Fevereiro', title: 'Butty Apaixonada', acc: '💘', deco: ['💗', '💕', '🌹'], c1: '#F9C9D9', c2: '#F6D7E8',
    lines: ['Este mês o amor-próprio também treina. 💘', 'Amo-te mais do que agachamentos. E eu adoro agachamentos. 💕'], imgs: [] },
  { name: 'Março', title: 'Butty da Primavera', acc: '🌷', deco: ['🌸', '🌼', '🦋'], c1: '#DDF2E9', c2: '#F8D6E4',
    lines: ['A primavera chegou e eu já estou a florir. E tu? 🌷', 'Mais luz, mais energia, mais treinos. A natureza manda! 🦋'], imgs: [] },
  { name: 'Abril', title: 'Butty da Páscoa', acc: '🐰', deco: ['🥚', '🌸', '🐣'], c1: '#E9F3C8', c2: '#F9DDE7',
    lines: ['Chocolate? Pode ser, mas o treino vem primeiro. 🐰', 'Abril, águas mil... e muitas sementes também! 🐣'], imgs: [] },
  { name: 'Maio', title: 'Butty das Flores', acc: '🌺', deco: ['🌻', '🌼', '🐝'], c1: '#FDE6C8', c2: '#F6CFE0',
    lines: ['Maio é mês das flores e eu sou a mais bonita da floresta. 🌺', 'Os dias estão maiores: há mais tempo para mexer esse rabinho! 🐝'], imgs: [] },
  { name: 'Junho', title: 'Butty dos Santos', acc: '🎈', deco: ['🎏', '🐟', '🌿'], c1: '#CDEBF5', c2: '#FBE0C6',
    lines: ['Santos populares! Uma sardinha e depois um treino, combinado? 🐟', 'Junho pede manjerico, arraial e muita água. 🌿'], imgs: [] },
  { name: 'Julho', title: 'Butty de Verão', acc: '🕶️', deco: ['☀️', '🌴', '🍉'], c1: '#FFE9A8', c2: '#C9ECF0',
    lines: ['Calor! Bebe água a dobrar que eu já estou a derreter. ☀️', 'Óculos de sol postos, treino feito e praia à espera. 🕶️'], imgs: [] },
  { name: 'Agosto', title: 'Butty de Férias', acc: '👒', deco: ['🏖️', '🐚', '🍦'], c1: '#C6E8F2', c2: '#FFE3B5',
    lines: ['Férias não são desculpa: até na areia se fazem agachamentos. 🏖️', 'Um gelado de vez em quando não faz mal. Eu não conto a ninguém. 🍦'], imgs: [] },
  { name: 'Setembro', title: 'Butty de Regresso', acc: '🎒', deco: ['📚', '🍎', '✏️'], c1: '#FBDCC4', c2: '#DCE9C8',
    lines: ['Regresso às rotinas! A minha mochila já tem a garrafa de água. 🎒', 'Setembro é o novo janeiro: bora recomeçar com força! 🍎'], imgs: [] },
  { name: 'Outubro', title: 'Butty de Halloween', acc: '🎃', deco: ['🦇', '👻', '🍂'], c1: '#FCD4A8', c2: '#D9CFF0',
    lines: ['Assustador mesmo é saltar o treino de pernas. 🎃', 'Doçura ou travessura? Eu escolho sementes! 👻'], imgs: [] },
  { name: 'Novembro', title: 'Butty de Outono', acc: '🍂', deco: ['🍁', '🌰', '☕'], c1: '#F6D3B3', c2: '#EED9C9',
    lines: ['Folhas a cair, treinos a subir. 🍂', 'Castanhas assadas e um treino quentinho: o outono perfeito. 🌰'], imgs: [] },
  { name: 'Dezembro', title: 'Butty de Natal', acc: '🎅', deco: ['❄️', '🎄', '🎁'], c1: '#F7C9CF', c2: '#D3ECE0',
    lines: ['Ho ho ho! O melhor presente és tu a treinar. 🎄', 'Bacalhau, bolo-rei e... um treino para equilibrar! 🎁'], imgs: [] }
];

export const buttyMonth = (date = new Date()) => BUTTY_MONTHS[date.getMonth()];

// Imagem da Butty para este mês, se houver uma versão própria; senão a normal.
export function buttyMonthImg(img, date = new Date()) {
  const m = buttyMonth(date);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return m.imgs.includes(img) ? `icons/butty/meses/${mm}-${img}.webp` : `icons/butty/${img}.webp`;
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
