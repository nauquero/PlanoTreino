// Efeitos: som "pop" (sintetizado, sem ficheiros de áudio), confetti pastel e vibração.

const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- som ----------
const MUTE_KEY = 'plano-treino-mute';
let muted = false;
try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch { /* ignora */ }
let actx = null;

export const isMuted = () => muted;
export function setMuted(m) {
  muted = m;
  try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch { /* ignora */ }
}

// Um "pop": onda sinusoidal que desce rapidamente de tom, com ataque e queda curtos.
export function pop(pitch = 1, delay = 0) {
  if (muted) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t = actx.currentTime + delay;
    const p = pitch * (0.96 + Math.random() * 0.08); // pequena variação, mais "vivo"
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(760 * p, t);
    osc.frequency.exponentialRampToValueAtTime(190 * p, t + 0.09);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.32, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    osc.connect(gain).connect(actx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  } catch { /* sem áudio disponível */ }
}

// "pop-pop" ascendente para momentos de sucesso
export function popSuccess() {
  pop(1.1);
  pop(1.5, 0.09);
}

// fim do descanso: três "pops" ascendentes
export function popDone() {
  pop(1.0);
  pop(1.25, 0.14);
  pop(1.6, 0.28);
}

export function haptic(pattern = 10) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch { /* ignora */ }
}

// ---------- confetti ----------
const COLORS = ['#F5C6D8', '#D9CFF0', '#C6E8DC', '#FBDCC4', '#B5798E', '#FFFDFB'];
let canvas = null;
let ctx = null;
let parts = [];
let raf = 0;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function ensureCanvas() {
  if (canvas) return;
  canvas = document.createElement('canvas');
  canvas.className = 'fx-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  resize();
  addEventListener('resize', resize);
}

function tick() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter((p) => p.life > 0 && p.y < innerHeight + 40);
  for (const p of parts) {
    p.vy += 0.28;
    p.vx *= 0.985;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life -= 0.016;
    ctx.save();
    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
    else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    ctx.restore();
  }
  if (parts.length) raf = requestAnimationFrame(tick);
  else { raf = 0; ctx.clearRect(0, 0, innerWidth, innerHeight); }
}

export function burst(x, y, count = 34) {
  if (reduceMotion()) return;
  ensureCanvas();
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = 3 + Math.random() * 7;
    parts.push({
      x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4,
      size: 5 + Math.random() * 6, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      color: COLORS[(Math.random() * COLORS.length) | 0], round: Math.random() < 0.5, life: 1
    });
  }
  if (!raf) raf = requestAnimationFrame(tick);
}
