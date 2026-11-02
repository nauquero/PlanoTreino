// Descanso em segundo plano.
//
// Uma página web não consegue desenhar um contador "ao vivo" na barra de estado, mas o telemóvel mostra uma
// notificação multimédia (como a de um leitor de música) com barra de progresso e tempo (0:23 / 1:30) para qualquer
// áudio que esteja a tocar. Por isso o descanso é um ÁUDIO com a duração exata do descanso (quase silêncio)
// seguido do alarme no fim:
//   • a notificação conta o tempo enquanto estás noutra app ou com o ecrã bloqueado;
//   • o alarme toca sozinho quando o descanso acaba, mesmo com a app em segundo plano;
//   • pausar, retomar e +15 s funcionam a partir da própria notificação.
// O relógio (timer.js) continua a ser a fonte da verdade do tempo mostrado dentro da app.
import { isMuted } from './fx.js';

const RATE = 11025;
const ALARM_SEC = 3.6;
let audio = null, url = '', active = false, builtTotal = 0, withAlarm = false, meta = { paused: null, label: null };
let handlers = null, asked = false, endedBound = false;

// WAV mono de 8 bits gerado em código (sem ficheiros de áudio)
function buildWav(totalSec, alarm) {
  const n = Math.floor(RATE * (totalSec + (alarm ? ALARM_SEC : 0.5)));
  const quiet = Math.floor(RATE * totalSec);
  const buf = new ArrayBuffer(44 + n);
  const v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + n, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, RATE, true); v.setUint32(28, RATE, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  str(36, 'data'); v.setUint32(40, n, true);
  const bytes = new Uint8Array(buf, 44);
  const notes = [880, 1175, 1568];
  const slot = 0.5, cycle = notes.length * slot + 0.45;
  for (let i = 0; i < n; i++) {
    if (i < quiet || !alarm) { bytes[i] = i % 41 === 0 ? 129 : 128; continue; } // 1 degrau de ruído: nunca é "silêncio digital"
    const t = (i - quiet) / RATE, c = t % cycle;
    let s = 0;
    if (c < notes.length * slot) {
      const k = Math.floor(c / slot), local = c - k * slot;
      const env = Math.min(1, local / 0.01) * Math.exp(-local * 4.5);
      s = 0.8 * env * Math.sin(2 * Math.PI * notes[k] * local) + 0.2 * env * Math.sin(2 * Math.PI * notes[k] * 2 * local);
    }
    bytes[i] = Math.max(0, Math.min(255, Math.round(128 + s * 120)));
  }
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

function ensure() {
  if (audio) return;
  audio = new Audio();
  audio.preload = 'auto';
  audio.setAttribute('playsinline', '');
}

function setMeta(title, artist) {
  const ms = navigator.mediaSession;
  if (!ms || typeof MediaMetadata === 'undefined') return;
  try { ms.metadata = new MediaMetadata({ title, artist, album: 'Just Butts', artwork: [{ src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }] }); } catch { /* ignora */ }
}

function setPosition(total) {
  const ms = navigator.mediaSession;
  if (!ms || !ms.setPositionState || !audio) return;
  try { ms.setPositionState({ duration: total, position: Math.min(total, Math.max(0, audio.currentTime || 0)), playbackRate: 1 }); } catch { /* ignora */ }
}

// handlers: { onPlay, onPause, onStop, onAdd, elapsed() -> segundos já passados }
export function restBgInit(h) {
  handlers = h;
  const ms = navigator.mediaSession;
  if (ms) {
    const set = (a, fn) => { try { ms.setActionHandler(a, fn); } catch { /* ação não suportada */ } };
    set('play', () => handlers.onPlay());
    set('pause', () => handlers.onPause());
    set('stop', () => handlers.onStop());
    set('seekforward', () => handlers.onAdd());
    set('nexttrack', () => handlers.onAdd());
  }
  document.addEventListener('visibilitychange', () => {
    if (active && document.visibilityState === 'visible') resync(handlers.elapsed());
  });
}

// põe o áudio no mesmo ponto que o relógio (se fugirem mais de 1,5 s)
function resync(elapsed) {
  if (!audio || !active || !(audio.readyState > 0)) return;
  if (Math.abs(audio.currentTime - elapsed) > 1.5 && elapsed < builtTotal) { try { audio.currentTime = elapsed; } catch { /* ignora */ } }
}

function load(total, startAt, playing) {
  withAlarm = !isMuted();
  const old = url;
  url = buildWav(total, withAlarm);
  builtTotal = total;
  audio.src = url;
  audio.loop = false;
  const go = () => {
    audio.removeEventListener('loadedmetadata', go);
    try { if (startAt > 0) audio.currentTime = Math.min(startAt, total); } catch { /* ignora */ }
    setPosition(total);
  };
  audio.addEventListener('loadedmetadata', go);
  if (old) URL.revokeObjectURL(old);
  if (playing) audio.play().catch(() => { /* sem permissão de áudio: fica só o aviso final */ }); // dentro do gesto do utilizador (necessário no iPhone)
}

// chamado a cada "tick" do temporizador enquanto corre ou está em pausa
export function restBgUpdate(s) {
  const ms = navigator.mediaSession;
  if (!active) {
    ensure();
    active = true;
    meta = { paused: null, label: null };
    if (!endedBound) { audio.addEventListener('ended', () => { if (active && audio.currentTime >= builtTotal) restBgStop(); }); endedBound = true; }
    load(s.total, 0, !s.paused);
    if (!asked && 'Notification' in window && Notification.permission === 'default') {
      asked = true;
      try { Notification.requestPermission(); } catch { /* ignora */ }
    }
  } else if (s.total !== builtTotal) {
    // "+15 s": volta a gerar o áudio mais comprido e continua do mesmo ponto
    load(s.total, audio.currentTime || 0, !s.paused);
  }
  if (meta.paused !== s.paused || meta.label !== s.label) {
    meta = { paused: s.paused, label: s.label };
    setMeta(s.paused ? 'Descanso em pausa' : 'A descansar', s.label || 'Just Butts');
    if (ms) { try { ms.playbackState = s.paused ? 'paused' : 'playing'; } catch { /* ignora */ } }
    setPosition(s.total);
  }
  if (s.paused) { if (!audio.paused) audio.pause(); } else if (audio.paused && audio.readyState > 0) audio.play().catch(() => {});
  if (!s.paused) resync(s.total - s.remaining);
}

// o descanso acabou. Devolve true se o alarme toca pelo próprio áudio (a app não precisa de tocar outro som).
export function restBgDone(label) {
  if (!active) return false;
  setMeta('Descanso terminado, bora!', label || 'Próxima série');
  const ms = navigator.mediaSession;
  if (ms) { try { ms.playbackState = 'playing'; } catch { /* ignora */ } }
  if (withAlarm && audio.paused) {
    // o áudio não estava a tocar (por exemplo, o telemóvel suspendeu-o): toca o alarme já
    try { audio.currentTime = builtTotal; audio.play().catch(() => {}); } catch { /* ignora */ }
  }
  if (document.visibilityState !== 'visible' && 'Notification' in window && Notification.permission === 'granted' && navigator.serviceWorker) {
    navigator.serviceWorker.getRegistration().then((r) => r && r.showNotification('Descanso terminado', { body: 'Bora! Próxima série.', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'descanso', renotify: true, vibrate: [220, 110, 220, 110, 320], requireInteraction: true })).catch(() => {});
  }
  if (!withAlarm) setTimeout(restBgStop, 1500);
  return withAlarm;
}

export function restBgStop() {
  if (!audio) return;
  active = false;
  try { audio.pause(); audio.removeAttribute('src'); audio.load(); } catch { /* ignora */ }
  if (url) { URL.revokeObjectURL(url); url = ''; }
  builtTotal = 0;
  const ms = navigator.mediaSession;
  if (ms) { try { ms.metadata = null; ms.playbackState = 'none'; } catch { /* ignora */ } }
}

export const restBgActive = () => active;
