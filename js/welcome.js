// Páginas de boas-vindas: perguntas para personalizar o plano de treino.
// Usado depois de criar conta e sempre que a pessoa quiser mudar as escolhas (ou só o objetivo) no Perfil.
import { icon } from './icons.js';
import { burst, sparkle, pop, popDone, haptic } from './fx.js';
import { createBodyMap } from './body.js';
import {
  MUSCLES, MUSCLE_LABEL, CARDIO_OPTIONS, SPORT_OPTIONS, DAYS_OPTIONS, OBJECTIVES, OBJECTIVE_KEYS, planOf, cardioLabel, sportLabel
} from './plan.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const DAY_TEXT = { 2: 'Leve e tranquilo', 3: 'O clássico equilibrado', 4: 'Ritmo de quem leva a sério', 5: 'Quase todos os dias', 6: 'Modo atleta' };

const PAGE_META = {
  hello: { title: 'Bem-vinda!', required: false },
  objective: { title: 'O teu objetivo', required: true },
  body: { title: 'O teu corpo', required: true },
  cardio: { title: 'Cardio', required: false },
  sports: { title: 'Desportos', required: false },
  days: { title: 'Frequência', required: false },
  done: { title: 'Pronto', required: false }
};

// opts: { profile, name, pages, mode: 'first'|'edit'|'objective', onSave(data) -> Promise, onFinish(result) }
export function openWelcome(opts) {
  const root = document.getElementById('welcome');
  const appEl = document.getElementById('app');
  const splashEl = document.getElementById('splash');
  const base = planOf(opts.profile);
  const st = {
    objective: opts.profile.objective && OBJECTIVES[opts.profile.objective] ? opts.profile.objective : '',
    areas: new Set(base.areas),
    cardio: new Set(base.cardio),
    sports: new Set(base.sports),
    days: base.days || 3
  };
  const pages = opts.pages;
  let idx = 0, dir = 1, saving = false;
  const opener = document.activeElement;

  const closable = true; // pode sempre saltar; a página Início volta a oferecer a personalização
  root.hidden = false;
  root.classList.remove('leaving');
  appEl.inert = true; splashEl.inert = true;
  document.body.classList.add('wl-open');

  const chipHtml = (set, key, text, extra = '') =>
    `<button type="button" class="wl-chip${set.has(key) ? ' on' : ''}" data-key="${esc(key)}" aria-pressed="${set.has(key)}"${extra}><span class="wl-tick" aria-hidden="true">${icon('check', 13)}</span>${esc(text)}</button>`;

  const pageBody = (key) => {
    const n = esc(opts.name || '');
    if (key === 'hello') return `
      <div class="wl-hero">
        <div class="wl-orb" aria-hidden="true"><img src="icons/icon-192.png" alt="" width="92" height="92"></div>
        <h2 class="wl-h" tabindex="-1">Bem-vinda${n ? `, ${n}` : ''}! ✨</h2>
        <p class="wl-sub">Vamos montar o teu plano com algumas perguntas rápidas. Demora cerca de um minuto e podes mudar tudo mais tarde no Perfil.</p>
        <ul class="wl-feats">
          <li style="--n:0"><span>${icon('target', 18)}</span>O teu objetivo</li>
          <li style="--n:1"><span>${icon('dumbbell', 18)}</span>Os músculos que queres trabalhar</li>
          <li style="--n:2"><span>${icon('activity', 18)}</span>Cardio e desportos que fazes</li>
          <li style="--n:3"><span>${icon('calendar', 18)}</span>Quantos dias por semana</li>
        </ul>
      </div>`;
    if (key === 'objective') return `
      <h2 class="wl-h" tabindex="-1">Qual é o teu objetivo?</h2>
      <p class="wl-sub">Isto ajusta a forma de treinar (repetições, descanso e cardio) e as sugestões de alimentação.</p>
      <div class="obj-list wl-obj" role="radiogroup" aria-label="O meu objetivo">
        ${OBJECTIVE_KEYS.map((k, i) => `<button type="button" class="obj-opt${k === st.objective ? ' on' : ''}" style="--n:${i}" data-obj="${k}" role="radio" aria-checked="${k === st.objective}">
          <span class="obj-ico" aria-hidden="true">${icon(OBJECTIVES[k][4], 20)}</span>
          <span class="obj-txt"><b>${esc(OBJECTIVES[k][0])}</b><small>${esc(OBJECTIVES[k][1])}</small></span>
          <span class="obj-dot" aria-hidden="true">${k === st.objective ? icon('check', 14) : ''}</span></button>`).join('')}
      </div>`;
    if (key === 'body') return `
      <h2 class="wl-h" tabindex="-1">Que partes do corpo queres trabalhar?</h2>
      <p class="wl-sub">Toca nos músculos no desenho (ou nos botões por baixo). Podes escolher vários.</p>
      <div id="wl-body"></div>
      <div class="wl-chips wl-chips-body" role="group" aria-label="Músculos">
        ${MUSCLES.map((m) => chipHtml(st.areas, m.key, m.label)).join('')}
      </div>
      <div class="wl-mini"><button type="button" class="link-btn" data-all="1">Escolher todos</button><button type="button" class="link-btn" data-none="1">Limpar</button></div>`;
    if (key === 'cardio') return `
      <h2 class="wl-h" tabindex="-1">Que cardio gostavas de fazer?</h2>
      <p class="wl-sub">Escolhe as máquinas ou o estilo de que mais gostas. Vão aparecer no teu Treino, na aba Cardio.</p>
      <div class="wl-chips" role="group" aria-label="Cardio">${CARDIO_OPTIONS.map((o) => chipHtml(st.cardio, o[0], o[1])).join('')}</div>
      <p class="footnote">Podes deixar em branco se preferires só treino de força.</p>`;
    if (key === 'sports') return `
      <h2 class="wl-h" tabindex="-1">Que desportos praticas?</h2>
      <p class="wl-sub">Vão aparecer em “Outros desportos”, para registares tempo e distância.</p>
      <div class="wl-chips" role="group" aria-label="Desportos">${SPORT_OPTIONS.map((o) => chipHtml(st.sports, o[0], o[1])).join('')}</div>
      <p class="footnote">Se não fazes nenhum, tudo bem: deixa em branco.</p>`;
    if (key === 'days') return `
      <h2 class="wl-h" tabindex="-1">Quantos dias por semana?</h2>
      <p class="wl-sub">Quantas vezes queres treinar? Usamos isto para sugerir a tua meta do mês.</p>
      <div class="wl-days" role="radiogroup" aria-label="Dias por semana">
        ${DAYS_OPTIONS.map((d) => `<button type="button" class="wl-day${d === st.days ? ' on' : ''}" data-days="${d}" role="radio" aria-checked="${d === st.days}"><b>${d}</b><small>dias</small></button>`).join('')}
      </div>
      <p class="wl-days-note" id="wl-days-note" aria-live="polite"></p>`;
    return summaryHtml();
  };

  const names = (set, fn) => [...set].map(fn);
  const summaryHtml = () => `
      <div class="wl-hero wl-done">
        <div class="wl-orb ok" aria-hidden="true">${icon('check', 40)}</div>
        <h2 class="wl-h" tabindex="-1">${opts.mode === 'objective' ? 'Objetivo atualizado!' : 'O teu plano está pronto!'}</h2>
        <p class="wl-sub">${opts.mode === 'objective' ? 'O teu treino e as sugestões vão acompanhar o novo objetivo.' : 'Montámos o teu treino com as tuas escolhas. Dá uma vista de olhos:'}</p>
        <div class="wl-sum">
          <div class="wl-sum-row"><span class="k">${icon('target', 15)}Objetivo</span><b>${esc(OBJECTIVES[st.objective][0])}</b></div>
          ${opts.mode === 'objective' ? '' : `
          <div class="wl-sum-row"><span class="k">${icon('dumbbell', 15)}Músculos</span><b>${st.areas.size ? esc(names(st.areas, (k) => MUSCLE_LABEL[k]).join(', ')) : 'Todos'}</b></div>
          <div class="wl-sum-row"><span class="k">${icon('activity', 15)}Cardio</span><b>${st.cardio.size ? esc(names(st.cardio, cardioLabel).join(', ')) : 'Sem preferência'}</b></div>
          <div class="wl-sum-row"><span class="k">${icon('trend', 15)}Desportos</span><b>${st.sports.size ? esc(names(st.sports, sportLabel).join(', ')) : 'Nenhum'}</b></div>
          <div class="wl-sum-row"><span class="k">${icon('calendar', 15)}Frequência</span><b>${st.days} dias por semana</b></div>`}
        </div>
      </div>`;

  const valid = (key) => {
    if (key === 'objective') return !!st.objective;
    if (key === 'body') return st.areas.size > 0;
    return true;
  };
  const hintFor = (key) => (key === 'objective' ? 'Escolhe o teu objetivo para continuar.' : key === 'body' ? 'Escolhe pelo menos um músculo.' : '');

  root.innerHTML = `
    <div class="wl-bg" aria-hidden="true"><i class="wl-b1"></i><i class="wl-b2"></i><i class="wl-b3"></i></div>
    <div class="wl-panel" role="dialog" aria-modal="true" aria-labelledby="wl-title">
      <div class="wl-top">
        <div class="wl-prog" role="progressbar" aria-valuemin="1" aria-valuemax="${pages.length}" aria-valuenow="1"><i></i></div>
        <div class="wl-step" id="wl-title"></div>
        ${closable ? `<button type="button" class="wl-close" id="wl-close" aria-label="Fechar">${icon('x', 18)}</button>` : ''}
      </div>
      <div class="wl-stage"><div class="wl-page" id="wl-page"></div></div>
      <div class="wl-err" id="wl-err" role="alert"></div>
      <div class="wl-nav">
        <button type="button" class="rg-back" id="wl-back">Voltar</button>
        <button type="button" class="save-btn" id="wl-next">Seguinte</button>
      </div>
    </div>`;
  const pageEl = root.querySelector('#wl-page');
  const errEl = root.querySelector('#wl-err');
  const nextBtn = root.querySelector('#wl-next');
  const backBtn = root.querySelector('#wl-back');
  let bodyMap = null;

  const refreshNext = () => {
    const key = pages[idx];
    nextBtn.classList.toggle('dim', !valid(key));
    nextBtn.setAttribute('aria-disabled', String(!valid(key)));
  };

  const daysNote = () => {
    const el = root.querySelector('#wl-days-note');
    if (el) el.innerHTML = `<b>${DAY_TEXT[st.days]}</b> · cerca de ${st.days * 4} treinos por mês`;
  };

  const draw = () => {
    const key = pages[idx];
    const meta = PAGE_META[key];
    pageEl.className = `wl-page ${dir > 0 ? 'in-next' : 'in-back'}`;
    pageEl.innerHTML = pageBody(key);
    void pageEl.offsetWidth;
    errEl.textContent = '';
    root.querySelector('.wl-prog i').style.width = `${((idx + 1) / pages.length) * 100}%`;
    root.querySelector('.wl-prog').setAttribute('aria-valuenow', String(idx + 1));
    root.querySelector('#wl-title').textContent = `${idx + 1}/${pages.length} · ${meta.title}`;
    backBtn.hidden = idx === 0;
    const last = idx === pages.length - 1;
    nextBtn.textContent = last ? (opts.mode === 'objective' ? 'Guardar' : 'Começar!') : key === 'hello' ? 'Vamos lá' : 'Seguinte';
    nextBtn.classList.toggle('finish', last);
    bodyMap = null;
    if (key === 'body') {
      bodyMap = createBodyMap(pageEl.querySelector('#wl-body'), { selected: st.areas, onToggle: (k, x, y) => { toggleSet(st.areas, k); sparkle(x, y, 9); errEl.textContent = ''; syncChips(); refreshNext(); } });
    }
    if (key === 'days') daysNote();
    if (key === 'done') { setTimeout(() => { const o = root.querySelector('.wl-orb'); if (o) { const r = o.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 60); popDone(); } }, 350); }
    refreshNext();
    const h = pageEl.querySelector('.wl-h');
    if (h) h.focus({ preventScroll: true });
    root.querySelector('.wl-stage').scrollTop = 0;
  };

  const toggleSet = (set, k) => { if (set.has(k)) set.delete(k); else set.add(k); };
  const syncChips = () => {
    pageEl.querySelectorAll('.wl-chips-body .wl-chip').forEach((c) => { const on = st.areas.has(c.dataset.key); c.classList.toggle('on', on); c.setAttribute('aria-pressed', String(on)); });
    if (bodyMap) bodyMap.paint();
  };

  pageEl.addEventListener('click', (e) => {
    const t = e.target;
    const chip = t.closest('.wl-chip');
    if (chip) {
      const key = pages[idx];
      const set = key === 'body' ? st.areas : key === 'cardio' ? st.cardio : st.sports;
      toggleSet(set, chip.dataset.key);
      const on = set.has(chip.dataset.key);
      chip.classList.toggle('on', on); chip.setAttribute('aria-pressed', String(on));
      if (on) { const r = chip.getBoundingClientRect(); sparkle(r.left + r.width / 2, r.top + r.height / 2, 7); }
      if (key === 'body') syncChips();
      errEl.textContent = '';
      refreshNext();
      return;
    }
    const obj = t.closest('[data-obj]');
    if (obj) {
      st.objective = obj.dataset.obj;
      pageEl.querySelectorAll('.obj-opt').forEach((o) => {
        const on = o === obj;
        o.classList.toggle('on', on); o.setAttribute('aria-checked', String(on));
        o.querySelector('.obj-dot').innerHTML = on ? icon('check', 14) : '';
      });
      const r = obj.getBoundingClientRect(); sparkle(r.left + 40, r.top + r.height / 2, 8);
      errEl.textContent = ''; refreshNext();
      return;
    }
    const day = t.closest('[data-days]');
    if (day) {
      st.days = Number(day.dataset.days);
      pageEl.querySelectorAll('.wl-day').forEach((o) => { const on = o === day; o.classList.toggle('on', on); o.setAttribute('aria-checked', String(on)); });
      daysNote();
      const r = day.getBoundingClientRect(); sparkle(r.left + r.width / 2, r.top + 10, 8);
      return;
    }
    if (t.closest('[data-all]')) { MUSCLES.forEach((m) => st.areas.add(m.key)); syncChips(); refreshNext(); pop(1.2); return; }
    if (t.closest('[data-none]')) { st.areas.clear(); syncChips(); refreshNext(); return; }
  });

  const finish = (result) => {
    document.removeEventListener('keydown', onKey, true);
    root.classList.add('leaving');
    setTimeout(() => {
      root.hidden = true; root.classList.remove('leaving'); root.innerHTML = '';
      appEl.inert = false; splashEl.inert = false;
      document.body.classList.remove('wl-open');
      if (opener && opener.focus && document.contains(opener)) opener.focus({ preventScroll: true });
      if (opts.onFinish) opts.onFinish(result);
    }, 380);
  };

  const save = async () => {
    saving = true;
    nextBtn.disabled = true;
    errEl.textContent = 'A guardar…';
    try {
      await opts.onSave({
        objective: st.objective,
        plan: { done: true, areas: [...st.areas], cardio: [...st.cardio], sports: [...st.sports], days: st.days }
      });
      saving = false;
      haptic([20, 40, 20]);
      finish('saved');
    } catch (ex) {
      saving = false; nextBtn.disabled = false;
      errEl.textContent = ex && ex.message ? ex.message : 'Não foi possível guardar. Tenta de novo.';
    }
  };

  nextBtn.addEventListener('click', () => {
    if (saving) return;
    const key = pages[idx];
    if (!valid(key)) { errEl.textContent = hintFor(key); pageEl.classList.remove('shake'); void pageEl.offsetWidth; pageEl.classList.add('shake'); pop(0.55); return; }
    if (idx === pages.length - 1) { save(); return; }
    // a página final só mostra o resumo; guardar acontece ao carregar em "Começar!"
    idx++; dir = 1; draw();
  });
  backBtn.addEventListener('click', () => { if (saving || idx === 0) return; idx--; dir = -1; draw(); });
  if (closable) root.querySelector('#wl-close').addEventListener('click', () => { if (!saving) finish('closed'); });

  function onKey(e) {
    if (e.key === 'Escape' && closable && !saving) { e.preventDefault(); finish('closed'); return; }
    if (e.key !== 'Tab') return;
    const f = [...root.querySelectorAll('button:not([disabled]):not([hidden]), [tabindex="0"]')].filter((x) => x.offsetParent !== null && !x.closest('[inert]'));
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  document.addEventListener('keydown', onKey, true);
  draw();
}

export const WELCOME_PAGES = ['hello', 'objective', 'body', 'cardio', 'sports', 'days', 'done'];
export const EDIT_PAGES = ['objective', 'body', 'cardio', 'sports', 'days', 'done'];
export const OBJECTIVE_PAGES = ['objective', 'done'];
