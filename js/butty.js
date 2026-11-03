// Mascote Butty: recolorização em tempo real (olhos e laço) a partir de máscaras
// pré-calculadas (icons/butty/masks/*.webp — canal R = olhos, canal G = laço).
// Mantém a sombra/luz original de cada imagem (preserva o L de HSL) e troca só
// a matiz/saturação pela cor escolhida.

const IMG_BASE = 'icons/butty/';
const MASK_BASE = 'icons/butty/masks/';

export const BUTTY_NAMES = ['face-sleepy', 'face-shock', 'face-joy', 'face-love', 'face-wink', 'face-laugh', 'face-peek', 'body-full'];

export const BUTTY_EYE_OPTIONS = [
  { key: 'castanho', label: 'Castanho', hex: '#6B4226' },
  { key: 'preto', label: 'Preto', hex: '#2B2420' },
  { key: 'verde', label: 'Verde', hex: '#3F8F5F' },
  { key: 'azul', label: 'Azul', hex: '#4A90D9' }
];
export const BUTTY_DEFAULT_EYE = '#6B4226';
export const BUTTY_DEFAULT_BOW = '#F8B8B0';

let current = { eye: BUTTY_DEFAULT_EYE, bow: BUTTY_DEFAULT_BOW };
const cache = new Map();

export function buttyImgPath(name) { return `${IMG_BASE}${name}.webp`; }
export function setButtyColors(eye, bow) { current = { eye: eye || BUTTY_DEFAULT_EYE, bow: bow || BUTTY_DEFAULT_BOW }; }
export function getButtyColors() { return current; }
export function buttySrc(name) { return cache.get(`${name}|${current.eye}|${current.bow}`) || buttyImgPath(name); }

function hexToHs(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0; const l = (max + min) / 2;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s];
}
function hue2rgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}
function hslToRgb(h, s, l) {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [Math.round(hue2rgb(p, q, h + 1 / 3) * 255), Math.round(hue2rgb(p, q, h) * 255), Math.round(hue2rgb(p, q, h - 1 / 3) * 255)];
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function recolor(name, eyeHex, bowHex) {
  const [img, mask] = await Promise.all([loadImage(buttyImgPath(name)), loadImage(`${MASK_BASE}${name}.webp`)]);
  const w = img.naturalWidth, h = img.naturalHeight;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const base = ctx.getImageData(0, 0, w, h);
  const mc = document.createElement('canvas'); mc.width = w; mc.height = h;
  const mctx = mc.getContext('2d', { willReadFrequently: true });
  mctx.drawImage(mask, 0, 0, w, h);
  const mdata = mctx.getImageData(0, 0, w, h).data;
  const data = base.data;
  const [eh, es] = hexToHs(eyeHex);
  const [bh, bs] = hexToHs(bowHex);
  for (let i = 0; i < data.length; i += 4) {
    const eyeA = mdata[i], bowA = mdata[i + 1];
    if (eyeA < 8 && bowA < 8) continue;
    const max = Math.max(data[i], data[i + 1], data[i + 2]) / 255, min = Math.min(data[i], data[i + 1], data[i + 2]) / 255;
    const l = (max + min) / 2;
    if (eyeA >= bowA) {
      const [nr, ng, nb] = hslToRgb(eh, es, l);
      const t = eyeA / 255;
      data[i] += (nr - data[i]) * t; data[i + 1] += (ng - data[i + 1]) * t; data[i + 2] += (nb - data[i + 2]) * t;
    } else {
      const [nr, ng, nb] = hslToRgb(bh, bs, l);
      const t = bowA / 255;
      data[i] += (nr - data[i]) * t; data[i + 1] += (ng - data[i + 1]) * t; data[i + 2] += (nb - data[i + 2]) * t;
    }
  }
  ctx.putImageData(base, 0, 0);
  return c.toDataURL('image/png');
}

// Recalcula e guarda em cache todas as imagens da Butty para as cores atuais; chama onReady() quando prontas.
export async function warmButtyCache(onReady) {
  const { eye, bow } = current;
  await Promise.all(BUTTY_NAMES.map(async (name) => {
    const key = `${name}|${eye}|${bow}`;
    if (cache.has(key)) return;
    try { cache.set(key, await recolor(name, eye, bow)); } catch { /* usa a imagem original */ }
  }));
  if (onReady) onReady();
}

// Pré-visualização isolada (não mexe na cache principal) para o seletor de cores.
export async function previewButty(name, eye, bow) {
  try { return await recolor(name, eye, bow); } catch { return buttyImgPath(name); }
}
