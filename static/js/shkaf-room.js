/* Комната для конструктора шкафа: стартовое окно с размерами и редактор «нарисуй комнату» (Г-, П-образная и любая прямоугольная форма). */
import { rpRect, rpEdgeLen, rpNormalize, rpValid, rpEditLen } from '/static/js/shkaf-pro-core.js?v=16';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let st = null, cssDone = false;

function css() {
  if (cssDone) return; cssDone = true;
  const s = document.createElement('style');
  s.textContent = `.rm-ov{display:none;position:fixed;inset:0;z-index:2000;background:rgba(15,12,8,.65);align-items:center;justify-content:center;padding:14px}.rm-ov.on{display:flex}
.rm-box{background:#fff;border-radius:16px;width:min(1100px,100%);max-height:100%;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.4);font-family:Manrope,Segoe UI,Arial,sans-serif;color:#241d12}
.rm-head{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #e6e6e6;font-size:1.05rem}.rm-head button{border:0;background:#f1f1f1;border-radius:8px;width:34px;height:34px;cursor:pointer}
.rm-body{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(260px,1fr);gap:14px;padding:14px 16px;overflow:auto}
#rmSvg{width:100%;height:430px;background:#fff;border:1px solid #d3dbe2;border-radius:10px;touch-action:none;cursor:crosshair}
.rm-note{color:#6b7280;font-size:.78rem;margin:6px 0;line-height:1.4}.rm-h{font-weight:800;margin-bottom:4px}
.rm-list{display:flex;flex-direction:column;gap:6px;margin:8px 0;max-height:300px;overflow:auto}.rm-w{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:.88rem}
.rm-w input,.rm-step input,.rm-start input{width:92px;padding:7px 8px;border:1px solid #cbd2d9;border-radius:8px;font-family:inherit}
.rm-step{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:8px 0}.rm-dirs{display:flex;gap:5px}
.rm-dirs button,.rm-btns button,.rm-start button.sec{border:1px solid #cbd2d9;background:#fff;border-radius:9px;padding:8px 12px;cursor:pointer;font-size:.85rem;font-family:inherit}.rm-dirs button{width:42px;font-size:1.1rem}
.rm-btns{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}.rm-btns button.pri,.rm-start button.pri{background:#b07d12;color:#fff;border-color:#b07d12;font-weight:700}
.rm-start{padding:20px 22px;width:min(460px,100%)}.rm-start h2{margin:0 0 6px;font-family:'Playfair Display',Georgia,serif}.rm-start .row{display:flex;align-items:center;justify-content:space-between;margin:10px 0;gap:10px}
.rm-start button{padding:11px 16px;border-radius:10px;border:0;cursor:pointer;font-family:inherit;font-size:.95rem}.rm-start .acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
@media(max-width:760px){.rm-body{grid-template-columns:1fr}#rmSvg{height:300px}}`;
  document.head.appendChild(s);
}
function overlay(id) {
  let d = document.getElementById(id);
  if (!d) { d = document.createElement('div'); d.id = id; d.className = 'rm-ov'; document.body.appendChild(d); }
  return d;
}

/* ---------- стартовое окно: размер комнаты ---------- */
export function openRoomStart(room, onDone, onDraw) {
  css(); const d = overlay('rmStart');
  d.innerHTML = `<div class="rm-box rm-start"><h2>Размер комнаты</h2><div class="rm-note">Шкаф ставится у основной (задней) стены. Задайте комнату — или нарисуйте её, если она Г-образная или нестандартная.</div>
    <div class="row"><span>Ширина стены, см</span><input id="rmsW" type="number" value="${Math.round(room.W)}" min="100" max="1500"></div>
    <div class="row"><span>Глубина комнаты, см</span><input id="rmsD" type="number" value="${Math.round(room.D)}" min="100" max="1500"></div>
    <div class="row"><span>Высота потолка, см</span><input id="rmsH" type="number" value="${Math.round(room.H)}" min="180" max="400"></div>
    <div class="acts"><button type="button" class="pri" id="rmsOk">Продолжить</button><button type="button" class="sec" id="rmsDraw">✏️ Нарисовать комнату</button><button type="button" class="sec" id="rmsSkip">Пропустить</button></div></div>`;
  d.classList.add('on');
  const val = id => Math.max(1, parseFloat(document.getElementById(id).value) || 0);
  document.getElementById('rmsOk').onclick = () => { const r = { W: Math.min(1500, Math.max(100, val('rmsW'))), D: Math.min(1500, Math.max(100, val('rmsD'))), H: Math.min(400, Math.max(180, val('rmsH'))) }; d.classList.remove('on'); onDone(r); };
  document.getElementById('rmsSkip').onclick = () => { d.classList.remove('on'); onDone(null); };
  document.getElementById('rmsDraw').onclick = () => { d.classList.remove('on'); onDraw(); };
}

/* ---------- редактор комнаты ---------- */
export function openRoomEditor(opt) {   // opt: { poly, W, D, onApply(poly|null) }
  css(); const d = overlay('rmEd');
  d.innerHTML = '<div class="rm-box"><div class="rm-head"><b>✏️ Рисуем комнату</b><button type="button" onclick="RM.close()" aria-label="x">✕</button></div><div class="rm-body"><div><svg id="rmSvg" xmlns="http://www.w3.org/2000/svg"></svg><div class="rm-note" id="rmNote"></div></div><div id="rmRight"></div></div></div>';
  const svg = d.querySelector('#rmSvg'); svg.addEventListener('pointerdown', click); svg.addEventListener('pointermove', move);
  st = { P: (opt.poly && opt.poly.length >= 4 ? opt.poly : rpRect(opt.W || 400, opt.D || 300)).map(p => p.slice()), draw: false, tmp: [], cur: null, onApply: opt.onApply };
  d.classList.add('on'); document.body.style.overflow = 'hidden'; render();
}
const svgPt = ev => { const svg = document.getElementById('rmSvg'), pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; const m = svg.getScreenCTM(); if (!m) return null; const p = pt.matrixTransform(m.inverse()); return [Math.round(p.x / 10) * 10, Math.round(p.y / 10) * 10]; };
const axis = (last, p) => Math.abs(p[0] - last[0]) >= Math.abs(p[1] - last[1]) ? [p[0], last[1]] : [last[0], p[1]];
function click(ev) { if (!st.draw) return; const p = svgPt(ev); if (!p) return; if (!st.tmp.length) st.tmp.push(p); else { const l = st.tmp[st.tmp.length - 1], q = axis(l, p); if (q[0] !== l[0] || q[1] !== l[1]) st.tmp.push(q); } render(); }
function move(ev) { if (!st.draw || !st.tmp.length) return; const p = svgPt(ev); if (!p) return; st.cur = axis(st.tmp[st.tmp.length - 1], p); render(); }
function finish() {
  if (st.tmp.length < 2) { st.draw = false; st.tmp = []; render(); return; }
  const S0 = st.tmp[0], P = st.tmp.map(p => p.slice()), L = P[P.length - 1];
  if (L[0] !== S0[0] || L[1] !== S0[1]) {
    if (L[0] !== S0[0] && L[1] !== S0[1]) { const prevH = P.length >= 2 && P[P.length - 2][1] === L[1]; P.push(prevH ? [L[0], S0[1]] : [S0[0], L[1]]); }
    const L2 = P[P.length - 1]; if (L2[0] !== S0[0] && L2[1] !== S0[1]) P.push([S0[0], L2[1]]);
  } else P.pop();
  const N = rpNormalize(P); st.draw = false; st.tmp = [];
  if (N && rpValid(N)) st.P = N; else alert('Не получилась замкнутая комната — попробуйте ещё раз');
  render();
}
function render() {
  const d = document.getElementById('rmEd'); if (!d) return;
  const svg = document.getElementById('rmSvg'), pts = st.draw ? st.tmp.concat(st.cur && st.tmp.length ? [st.cur] : []) : st.P;
  let bb = pts && pts.length ? { x0: Math.min(...pts.map(p => p[0])), x1: Math.max(...pts.map(p => p[0])), z0: Math.min(...pts.map(p => p[1])), z1: Math.max(...pts.map(p => p[1])) } : { x0: 0, x1: 400, z0: 0, z1: 300 };
  if (st.draw) { bb.x0 = Math.min(bb.x0, 0); bb.z0 = Math.min(bb.z0, 0); bb.x1 = Math.max(bb.x1, 500); bb.z1 = Math.max(bb.z1, 400); }
  const pad = Math.max(60, (bb.x1 - bb.x0) * .12), x0 = bb.x0 - pad, z0 = bb.z0 - pad, w = bb.x1 - bb.x0 + 2 * pad, h = bb.z1 - bb.z0 + 2 * pad, fs = Math.max(w, h) / 34;
  svg.setAttribute('viewBox', `${x0} ${z0} ${w} ${h}`);
  let g = ''; const gs = 50;
  for (let x = Math.ceil(x0 / gs) * gs; x < x0 + w; x += gs) g += `<line x1="${x}" y1="${z0}" x2="${x}" y2="${z0 + h}" stroke="${x % 100 ? '#e7ecf0' : '#d3dbe2'}" stroke-width="${fs / 25}"/>`;
  for (let z = Math.ceil(z0 / gs) * gs; z < z0 + h; z += gs) g += `<line x1="${x0}" y1="${z}" x2="${x0 + w}" y2="${z}" stroke="${z % 100 ? '#e7ecf0' : '#d3dbe2'}" stroke-width="${fs / 25}"/>`;
  const label = (a, b, txt, nn, col) => { const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, hz = a[1] === b[1]; return `<text x="${mx}" y="${mz + (hz ? -fs * .55 : 0)}" dx="${hz ? 0 : fs * .6}" font-size="${fs}" text-anchor="${hz ? 'middle' : 'start'}" fill="${col}" font-weight="700" font-family="Arial">${nn ? nn + ': ' : ''}${txt}</text>`; };
  if (st.draw) {
    const T = st.tmp.concat(st.cur && st.tmp.length ? [st.cur] : []);
    if (T.length) g += `<polyline points="${T.map(p => p.join(',')).join(' ')}" fill="none" stroke="#0b6e8f" stroke-width="${fs / 6}" stroke-linejoin="round"/>`;
    T.forEach((p, i) => { g += `<circle cx="${p[0]}" cy="${p[1]}" r="${fs / 3}" fill="${i ? '#0b6e8f' : '#b3261e'}"/>`; if (i) g += label(T[i - 1], p, Math.round(Math.abs(p[0] - T[i - 1][0]) + Math.abs(p[1] - T[i - 1][1])) + ' см', i, '#0b6e8f'); });
  } else {
    const P = st.P;
    g += `<polygon points="${P.map(p => p.join(',')).join(' ')}" fill="#f3ecd9" stroke="#2b2f33" stroke-width="${fs / 4}" stroke-linejoin="round"/>`;
    g += `<line x1="${P[0][0]}" y1="${P[0][1]}" x2="${P[1][0]}" y2="${P[1][1]}" stroke="#b07d12" stroke-width="${fs / 2.2}"/>`;
    P.forEach((p, i) => { g += `<circle cx="${p[0]}" cy="${p[1]}" r="${fs / 3.2}" fill="#2b2f33"/>` + label(p, P[(i + 1) % P.length], Math.round(rpEdgeLen(P, i)) + ' см', i + 1, '#1f2933'); });
  }
  svg.innerHTML = g;
  const R = document.getElementById('rmRight'), dirB = (dir, ch) => `<button type="button" onclick="RM.step('${dir}')">${ch}</button>`; let h2;
  if (st.draw) {
    h2 = `<div class="rm-h">Рисуем по линиям</div><div class="rm-note">Нажимайте на сетку — каждая точка это угол комнаты. Линии идут только вдоль осей. Первая линия — основная стена (там стоит шкаф). Или задайте стену числом:</div>
      <div class="rm-step"><input id="rmLen" type="number" value="300" min="10" step="10"> см<div class="rm-dirs">${dirB('N', '↑')}${dirB('W', '←')}${dirB('E', '→')}${dirB('S', '↓')}</div></div>
      <div class="rm-list">${st.tmp.slice(1).map((p, i) => `<div class="rm-w"><span>Стена ${i + 1}</span><b>${Math.round(Math.abs(p[0] - st.tmp[i][0]) + Math.abs(p[1] - st.tmp[i][1]))} см</b></div>`).join('')}</div>
      <div class="rm-btns"><button type="button" class="pri" onclick="RM.finish()">✓ Замкнуть комнату</button><button type="button" onclick="RM.undo()">↶ Отменить точку</button><button type="button" onclick="RM.stopDraw()">Выйти из рисования</button></div>`;
  } else {
    const P = st.P;
    h2 = `<div class="rm-h">Стены комнаты</div><div class="rm-note">Измените длину любой стены — соседняя сдвинется, комната останется ровной. Стена 1 (золотая) — основная.</div>
      <div class="rm-list">${P.map((p, i) => { const q = P[(i + 1) % P.length], ar = q[0] > p[0] ? '→' : (q[1] > p[1] ? '↓' : (q[0] < p[0] ? '←' : '↑')); return `<div class="rm-w"><span>Стена ${i + 1}${i === 0 ? ' ★' : ''} ${ar}</span><input type="number" min="10" step="1" value="${Math.round(rpEdgeLen(P, i))}" onchange="RM.wall(${i}, this.value)"> см</div>`; }).join('')}</div>
      <div class="rm-h" style="margin-top:12px">Быстрая форма</div>
      <div class="rm-btns"><button type="button" onclick="RM.preset('R')">▭ Прямая</button><button type="button" onclick="RM.preset('L')">⌐ Г-образная</button><button type="button" onclick="RM.preset('U')">⊓ П-образная</button></div>
      <div class="rm-btns"><button type="button" onclick="RM.start()">✏️ Нарисовать самому</button></div>
      <div class="rm-btns"><button type="button" class="pri" onclick="RM.done()">✓ Применить</button><button type="button" onclick="RM.reset()">Сбросить (прямоугольная)</button></div>`;
  }
  R.innerHTML = h2;
  const note = document.getElementById('rmNote'); if (note) note.textContent = st.draw ? 'Первая точка — красная. Длина стены подписана у линии.' : 'Размеры в сантиметрах. Золотая линия — основная стена, у неё стоит шкаф.';
}
window.RM = {
  close() { const d = document.getElementById('rmEd'); if (d) d.classList.remove('on'); document.body.style.overflow = ''; },
  start() { st.draw = true; st.tmp = []; st.cur = null; render(); },
  stopDraw() { st.draw = false; st.tmp = []; render(); },
  step(dir) { const len = Math.round(parseFloat((document.getElementById('rmLen') || {}).value) || 0); if (len < 10) return; if (!st.tmp.length) st.tmp.push([0, 0]); const l = st.tmp[st.tmp.length - 1], v = { E: [len, 0], W: [-len, 0], N: [0, -len], S: [0, len] }[dir]; st.tmp.push([l[0] + v[0], l[1] + v[1]]); render(); },
  undo() { st.tmp.pop(); render(); }, finish,
  wall(i, v) { const Q = rpEditLen(st.P, i, v); if (Q) st.P = Q; else alert('Так стена не получается: стены пересекаются или слишком короткие'); render(); },
  preset(kind) { const W = Math.max(150, rpEdgeLen(st.P, 0)), D = 320; let P; if (kind === 'L') P = [[0, 0], [W, 0], [W, D * .55], [W * .55, D * .55], [W * .55, D], [0, D]]; else if (kind === 'U') P = [[0, 0], [W, 0], [W, D], [W * .7, D], [W * .7, D * .45], [W * .3, D * .45], [W * .3, D], [0, D]]; else P = rpRect(W, D); st.P = P.map(p => [Math.round(p[0] / 5) * 5, Math.round(p[1] / 5) * 5]); st.draw = false; st.tmp = []; render(); },
  done() { let P = st.P; if (st.draw) { finish(); P = st.P; } const N = P && rpNormalize(P); if (!N || !rpValid(N)) { alert('Комната не замкнута или стены пересекаются'); return; } RM.close(); st.onApply(N); },
  reset() { RM.close(); st.onApply(null); }
};
