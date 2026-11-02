// Corpo humano desenhado (frente e costas) com os músculos clicáveis.
// Cada músculo é um botão acessível (teclado e leitor de ecrã) e está ligado aos botões da lista por baixo.
import { MUSCLES } from './plan.js';

const NS = 'http://www.w3.org/2000/svg';
const mirror = (inner) => `<g transform="translate(200 0) scale(-1 1)">${inner}</g>`;
const both = (inner) => `${inner}${mirror(inner)}`;

// silhueta (igual à frente e atrás)
const BASE = `
  <g class="bm-base">
    <ellipse cx="100" cy="34" rx="19" ry="22"/>
    <rect x="91" y="52" width="18" height="18" rx="7"/>
    <path d="M70 78 Q100 66 130 78 L140 102 Q138 130 130 152 Q127 170 130 190 L70 190 Q73 170 70 152 Q62 130 60 102 Z"/>
    <path d="M70 184 Q100 196 130 184 L137 216 Q100 230 63 216 Z"/>
    ${both(`<ellipse cx="50" cy="120" rx="12" ry="35" transform="rotate(7 50 120)"/>
    <ellipse cx="41" cy="176" rx="9.5" ry="31" transform="rotate(6 41 176)"/>
    <circle cx="36" cy="212" r="7.5"/>
    <ellipse cx="84" cy="266" rx="20" ry="50"/>
    <ellipse cx="82" cy="348" rx="13" ry="40"/>
    <ellipse cx="80" cy="398" rx="14" ry="6"/>`)}
  </g>`;

const SHOULDER = both('<ellipse class="m-shape" cx="62" cy="89" rx="15" ry="14"/>');

const FRONT = {
  ombros: SHOULDER,
  peito: both('<path class="m-shape" d="M76 92 Q98 89 99 104 Q98 123 80 123 Q67 115 76 92Z"/>'),
  biceps: both('<ellipse class="m-shape" cx="49" cy="124" rx="9.5" ry="21" transform="rotate(7 49 124)"/>'),
  abs: '<rect class="m-shape" x="86" y="128" width="28" height="56" rx="11"/><path class="m-line" d="M100 130v52M88 148h24M88 166h24"/>',
  pernas: both('<ellipse class="m-shape" cx="85" cy="262" rx="16" ry="43"/><ellipse class="m-shape" cx="82" cy="347" rx="10" ry="33"/>')
};
const BACK = {
  ombros: SHOULDER,
  costas: '<path class="m-shape" d="M70 84 Q100 72 130 84 L127 126 Q100 150 73 126Z"/><path class="m-line" d="M100 78v66"/>',
  triceps: both('<ellipse class="m-shape" cx="49" cy="124" rx="9.5" ry="21" transform="rotate(7 49 124)"/>'),
  gluteo: both('<ellipse class="m-shape" cx="86" cy="205" rx="16" ry="15"/>'),
  pernas: both('<ellipse class="m-shape" cx="85" cy="262" rx="16" ry="41"/><ellipse class="m-shape" cx="82" cy="347" rx="10" ry="33"/>')
};

const label = (k) => MUSCLES.find((m) => m.key === k).label;

function viewHtml(view, shapes) {
  const parts = Object.entries(shapes).map(([k, inner]) =>
    `<g class="muscle" data-m="${k}" role="button" tabindex="0" aria-pressed="false" aria-label="${label(k)}"><title>${label(k)}</title>${inner}</g>`).join('');
  return `<svg viewBox="0 0 200 420" class="bm-svg" role="group" aria-label="Corpo, ${view === 'front' ? 'vista de frente' : 'vista de costas'}">
    <defs>
      <linearGradient id="bm-on-${view}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E68AAE"/><stop offset="1" stop-color="#9C5A74"/></linearGradient>
    </defs>${BASE}${parts}
    ${view === 'back' ? '<path class="bm-spine" d="M100 70v118"/>' : '<circle class="bm-face" cx="93" cy="33" r="1.8"/><circle class="bm-face" cx="107" cy="33" r="1.8"/><path class="bm-face s" d="M95 42q5 4 10 0"/>'}
  </svg>`;
}

// container: elemento onde desenhar. opts.onToggle(key, clientX, clientY) é chamado quando se toca num músculo.
export function createBodyMap(container, { selected, onToggle }) {
  container.innerHTML = `
    <div class="bm-wrap">
      <div class="bm-switch" role="group" aria-label="Vista do corpo">
        <button type="button" class="bm-view on" data-view="front" aria-pressed="true">Frente</button>
        <button type="button" class="bm-view" data-view="back" aria-pressed="false">Costas</button>
      </div>
      <div class="bm-card" data-view="front">
        <div class="bm-face-side bm-front">${viewHtml('front', FRONT)}</div>
        <div class="bm-face-side bm-back">${viewHtml('back', BACK)}</div>
      </div>
      <div class="bm-caption" aria-live="polite"></div>
    </div>`;
  const card = container.querySelector('.bm-card');
  const caption = container.querySelector('.bm-caption');

  const paint = () => {
    container.querySelectorAll('.muscle').forEach((g) => {
      const on = selected.has(g.dataset.m);
      g.classList.toggle('on', on);
      g.setAttribute('aria-pressed', String(on));
    });
    const names = [...selected].map(label);
    caption.textContent = names.length ? `Escolhidos: ${names.join(', ')}` : 'Toca nos músculos que queres trabalhar';
  };

  const toggle = (g, x, y) => { onToggle(g.dataset.m, x, y); paint(); };
  container.querySelectorAll('.muscle').forEach((g) => {
    g.addEventListener('click', (e) => toggle(g, e.clientX, e.clientY));
    g.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      const r = g.getBoundingClientRect();
      toggle(g, r.left + r.width / 2, r.top + r.height / 2);
    });
  });
  container.querySelectorAll('.bm-view').forEach((b) => b.addEventListener('click', () => {
    card.dataset.view = b.dataset.view;
    container.querySelectorAll('.bm-view').forEach((o) => { const on = o === b; o.classList.toggle('on', on); o.setAttribute('aria-pressed', String(on)); });
    container.querySelector('.bm-front').inert = b.dataset.view !== 'front';
    container.querySelector('.bm-back').inert = b.dataset.view !== 'back';
  }));
  container.querySelector('.bm-back').inert = true;
  paint();
  return { paint, setView: (v) => container.querySelector(`.bm-view[data-view="${v}"]`).click() };
}
