// Corpo humano desenhado (frente e costas) com os músculos clicáveis.
// Cada músculo é um botão acessível (teclado e leitor de ecrã) e está ligado aos botões da lista por baixo.
import { MUSCLES } from './plan.js';

// Silhueta desenhada com curvas suaves: só se descreve o lado direito, o esquerdo é o espelho.
// cada segmento: [c1x, c1y, c2x, c2y, x, y], a partir do ponto anterior
const START = [100, 54];
const RIGHT = [
  [103, 54, 106, 55, 108, 58], [108, 62, 108, 65, 108, 68],
  [114, 70, 128, 72, 138, 78], [148, 80, 154, 88, 154, 98],
  [155, 114, 156, 136, 153, 150], [151, 168, 149, 188, 146, 204],
  [148, 212, 149, 222, 146, 228], [143, 232, 138, 231, 138, 226],
  [138, 212, 139, 190, 140, 170], [141, 150, 140, 128, 136, 108],
  [134, 128, 129, 148, 124, 164], [120, 176, 140, 192, 141, 212],
  [143, 252, 140, 290, 137, 314], [139, 338, 138, 368, 131, 392],
  [131, 398, 137, 398, 136, 404], [134, 410, 118, 410, 114, 406],
  [112, 402, 113, 398, 113, 392], [112, 368, 112, 340, 110, 320],
  [107, 280, 106, 250, 100, 234]
];
function silhouette() {
  const m = (x) => 200 - x;
  let d = `M${START[0]} ${START[1]}`;
  RIGHT.forEach((c) => { d += `C${c.join(' ')}`; });
  const pts = [START, ...RIGHT.map((c) => [c[4], c[5]])];
  for (let i = RIGHT.length - 1; i >= 0; i--) {
    const c = RIGHT[i], to = pts[i];
    d += `C${m(c[2])} ${c[3]} ${m(c[0])} ${c[1]} ${m(to[0])} ${to[1]}`;
  }
  return `${d}Z`;
}

const mirror = (inner) => `<g transform="translate(200 0) scale(-1 1)">${inner}</g>`;
const both = (inner) => `${inner}${mirror(inner)}`;
const shape = (d) => `<path class="m-shape" d="${d}"/>`;

const BASE = `
  <ellipse class="bm-shadow" cx="100" cy="408" rx="46" ry="6"/>
  <g class="bm-base">
    <path d="${silhouette()}"/>
    <ellipse cx="100" cy="31" rx="15.5" ry="19.5"/>
  </g>
  <path class="bm-contour" d="M100 234v-6M96 62q4 3 8 0"/>`;

const DELT = both(shape('M132 80C144 78 154 88 154 100C154 112 151 118 148 120C144 110 140 98 132 92Z'));
const QUAD = shape('M137 236C141 262 139 292 135 312C128 318 116 314 112 300C108 276 107 250 106 238C112 230 128 228 137 236Z');
const CALF = shape('M134 328C137 345 135 368 130 386C124 388 118 384 117 372C115 356 118 338 124 326C128 324 132 325 134 328Z');

const FRONT = {
  ombros: DELT,
  peito: both(shape('M102 90C114 86 128 88 134 98C136 110 130 122 118 123C108 123 102 116 102 108Z')),
  biceps: both(shape('M141 116C148 114 153 122 153 136C153 146 150 152 146 152C141 144 139 128 141 116Z')),
  abs: both([130, 148, 166].map((y) => `<rect class="m-shape" x="102" y="${y}" width="9.5" height="14" rx="4.5"/>`).join('')),
  pernas: both(QUAD + CALF)
};
const BACK = {
  ombros: DELT,
  costas: both(`${shape('M101 72C112 74 128 76 134 86C138 104 134 128 124 148C114 152 106 146 101 140Z')}<path class="m-line" d="M104 96C116 98 126 104 130 112M104 118C114 120 122 126 126 134"/>`),
  triceps: both(`${shape('M141 112C149 110 154 120 154 136C154 148 151 154 147 154C142 146 140 128 141 112Z')}<path class="m-line" d="M145 122C148 130 148 140 146 148"/>`),
  gluteo: both(shape('M101 190C112 184 130 188 138 204C142 218 130 232 112 228C103 226 101 214 101 200Z')),
  pernas: both(QUAD.replace('m-shape', 'm-shape') + CALF)
};

const label = (k) => MUSCLES.find((m) => m.key === k).label;

function viewHtml(view, shapes) {
  const parts = Object.entries(shapes).map(([k, inner]) =>
    `<g class="muscle" data-m="${k}" role="button" tabindex="0" aria-pressed="false" aria-label="${label(k)}"><title>${label(k)}</title>${inner}</g>`).join('');
  const defs = view === 'front' ? `<defs>
      <linearGradient id="bm-g-base" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4F8"/><stop offset=".55" stop-color="#F6E4EF"/><stop offset="1" stop-color="#E7DAF3"/></linearGradient>
      <linearGradient id="bm-g-m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD3E4"/><stop offset="1" stop-color="#F0A3C2"/></linearGradient>
      <linearGradient id="bm-g-on" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F08DB5"/><stop offset="1" stop-color="#A24F77"/></linearGradient>
    </defs>` : '';
  return `<svg viewBox="0 0 200 420" class="bm-svg" role="group" aria-label="Corpo, ${view === 'front' ? 'vista de frente' : 'vista de costas'}">
    ${defs}${BASE}${parts}
    ${view === 'back' ? '<path class="bm-spine" d="M100 68v70"/>' : ''}
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
