// Descanso em segundo plano.
// Uma página web não consegue mostrar um contador "ao vivo" na barra de tarefas, mas consegue duas coisas:
//  1) uma notificação multimédia (como a de um leitor de música) com o nome do exercício, o tempo e uma barra de progresso,
//     enquanto toca um áudio silencioso, o que também mantém a app ativa;
//  2) um alarme sonoro e uma notificação quando o descanso acaba.
// O tempo em si continua a ser contado pelo relógio (ver timer.js), por isso nunca fica errado.
import { isMuted } from './fx.js';

let audio = null, silentUrl = '', alarmUrl = '', active = false, lastPaint = 0, asked = false, handlers = null;

// WAV mono de 16 bits gerado em código, sem ficheiros de áudio
function wavUrl(rate, seconds, sample) {
  const n = Math.floor(rate * seconds);
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, sample(i / rate))) * 32767, true);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

// alarme: três "ding" ascendentes, repetidos duas vezes (cerca de 3,5 s)
function alarmSample(t) {
  const notes = [880, 1175, 1568];
  const slot = 0.5, pause = 0.45;                       // cada "ding" dura 0,5 s; pausa de 0,45 s entre repetições
  const cycle = notes.length * slot + pause;
  const c = t % cycle;
  if (c >= notes.length * slot) return 0;
  const k = Math.floor(c / slot), local = c - k * slot;
  const env = Math.min(1, local / 0.01) * Math.exp(-local * 5);
  return 0.85 * env * Math.sin(2 * Math.PI * notes[k] * local) + 0.25 * env * Math.sin(2 * Math.PI * notes[k] * 2 * local);
}

function ensure() {
  if (audio) return;
  silentUrl = wavUrl(8000, 1, () => 0);
  alarmUrl = wavUrl(22050, 3.4, alarmSample);
  audio = new Audio();
  audio.preload = 'auto';
  audio.setAttribute('playsinline', '');
  audio.addEventListener('ended', () => { if (!audio.loop) restBgStop(); });
}

function meta(title, artist) {
  const ms = navigator.mediaSession;
  if (!ms || typeof MediaMetadata === 'undefined') return;
  try { ms.metadata = new MediaMetadata({ title, artist, album: 'Just Butts', artwork: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }] }); } catch { /* ignora */ }
}

const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function restBgInit(h) {
  handlers = h;
  const ms = navigator.mediaSession;
  if (!ms) return;
  const set = (a, fn) => { try { ms.setActionHandler(a, fn); } catch { /* ação não suportada */ } };
  set('play', () => handlers.onPlay());
  set('pause', () => handlers.onPause());
  set('stop', () => handlers.onStop());
}

// chamado a cada "tick" do temporizador enquanto corre ou está em pausa
export function restBgUpdate(s) {
  if (!active) {
    ensure();
    active = true;
    audio.loop = true;
    audio.src = silentUrl;
    audio.play().catch(() => { /* sem permissão de áudio: fica só o aviso final */ });
    if (!asked && 'Notification' in window && Notification.permission === 'default') {
      asked = true;
      try { Notification.requestPermission(); } catch { /* ignora */ }
    }
    lastPaint = 0;
  }
  const now = Date.now();
  if (now - lastPaint < 1000 && lastPaint) return;
  lastPaint = now;
  const ms = navigator.mediaSession;
  meta(s.paused ? `Descanso em pausa · ${clock(s.remaining)}` : `Descanso · faltam ${clock(s.remaining)}`, s.label || 'Just Butts');
  if (ms) {
    try {
      ms.playbackState = s.paused ? 'paused' : 'playing';
      if (!s.paused && ms.setPositionState) ms.setPositionState({ duration: s.total, position: Math.min(s.total, Math.max(0, s.total - s.remaining)), playbackRate: 1 });
    } catch { /* ignora */ }
  }
  if (s.paused) audio.pause(); else if (audio.paused) audio.play().catch(() => {});
}

// o descanso acabou
export function restBgDone(label) {
  if (!active) return;
  const visible = document.visibilityState === 'visible';
  meta('Descanso terminado, bora!', label || 'Próxima série');
  if (!visible) {
    if (!isMuted()) {
      audio.loop = false;
      audio.src = alarmUrl;
      audio.play().catch(() => {});
    }
    if ('Notification' in window && Notification.permission === 'granted' && navigator.serviceWorker) {
      navigator.serviceWorker.getRegistration().then((r) => r && r.showNotification('Descanso terminado', { body: 'Bora! Próxima série.', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'descanso', renotify: true, vibrate: [220, 110, 220, 110, 320], requireInteraction: true })).catch(() => {});
    }
    if (isMuted()) restBgStop();
  } else {
    restBgStop();
  }
}

export function restBgStop() {
  if (!audio) return;
  active = false;
  try { audio.pause(); audio.removeAttribute('src'); audio.load(); } catch { /* ignora */ }
  const ms = navigator.mediaSession;
  if (ms) { try { ms.metadata = null; ms.playbackState = 'none'; } catch { /* ignora */ } }
}

export const restBgActive = () => active;
