// Temporizador de descanso. Usa a hora do relógio (não conta "ticks"), por isso continua certo
// mesmo que o separador fique em segundo plano ou o telemóvel abrande o JavaScript.
export function createTimer(onChange, onDone) {
  let endAt = 0, total = 0, label = '', paused = false, remaining = 0, running = false, id = 0;

  const left = () => (paused ? remaining : Math.max(0, Math.ceil((endAt - Date.now()) / 1000)));
  const snapshot = () => ({ running, paused, total, label, remaining: left() });

  function tick() {
    const s = snapshot();
    if (!paused && running && s.remaining <= 0) {
      clearInterval(id);
      running = false;
      onChange({ ...s, running: false, done: true });
      onDone(s);
      return;
    }
    onChange(s);
  }
  function loop() { clearInterval(id); id = setInterval(tick, 250); tick(); }

  return {
    start(sec, lab) { total = sec; remaining = sec; endAt = Date.now() + sec * 1000; label = lab; paused = false; running = true; loop(); },
    pause() { if (!running || paused) return; remaining = left(); paused = true; tick(); },
    resume() { if (!running || !paused) return; endAt = Date.now() + remaining * 1000; paused = false; loop(); },
    add(sec) { if (!running) return; total += sec; if (paused) remaining += sec; else endAt += sec * 1000; tick(); },
    stop() { clearInterval(id); running = false; paused = false; onChange({ running: false }); },
    isRunning: () => running
  };
}
