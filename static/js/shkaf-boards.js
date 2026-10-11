/* Конструктор «Стеллаж из досок»: рисуем вид спереди — горизонтальные и вертикальные доски (змейка, лесенка, ячейки…).
   Готовое ставится в комнату как свободный шкафчик (3D, раскрой, цена, чертежи) и сохраняется в «Мои шкафчики». */
import { BOARD_PRESETS } from '/static/js/shkaf-pro-core.js?v=25';
const $ = id => document.getElementById(id);
const SNAP = 5, MATS = [['dsp', 'ЛДСП 16 мм'], ['ply', 'Фанера 12 мм'], ['mdf', 'МДФ крашеный']];
let st = null, cv, cx, view = { s: 2, ox: 20, oy: 20 }, drag = null, draw = null, selB = -1, tool = 'sel';
const tOf = () => (st.mat === 'ply' ? 1.2 : 1.6);
const rnd = v => Math.round(v / SNAP) * SNAP;
function fromObj(o) {
  const t = o && o.bd && o.bd.length ? Math.min(...o.bd.map(b => Math.min(b[2], b[3]))) : 1.6;
  return { id: o ? o.id : null, name: o && o.name || '', d: o ? o.d : 30, y: o ? o.y : 0, mat: o && o.mat || 'dsp', color: o && o.color || '', t,
    bd: (o && o.bd && o.bd.length ? o.bd : BOARD_PRESETS.snake.gen(1.6)).map(b => ({ o: b[2] >= b[3] ? 'h' : 'v', x: b[0], y: b[1], l: Math.max(b[2], b[3]) })) };
}
const rects = () => st.bd.map(b => b.o === 'h' ? [b.x, b.y, b.l, tOf()] : [b.x, b.y, tOf(), b.l]);
function bbox() { const R = rects(); if (!R.length) return { x0: 0, y0: 0, x1: 80, y1: 160 }; return { x0: Math.min(...R.map(r => r[0])), y0: Math.min(...R.map(r => r[1])), x1: Math.max(...R.map(r => r[0] + r[2])), y1: Math.max(...R.map(r => r[1] + r[3])) }; }
function fit() {
  const b = bbox(), w = Math.max(b.x1, 100) + 50, h = Math.max(b.y1, 120) + 40;
  view.s = Math.min(cv.width / w, cv.height / h); view.ox = 30; view.oy = cv.height - 22;
}
const px = (x, y) => [view.ox + x * view.s, view.oy - y * view.s], wd = (X, Y) => [(X - view.ox) / view.s, (view.oy - Y) / view.s];
function paint() {
  const W = cv.width, H = cv.height; cx.fillStyle = '#fff'; cx.fillRect(0, 0, W, H);
  const g = 10 * view.s; cx.lineWidth = 1;
  for (let x = view.ox; x < W; x += g) { cx.strokeStyle = Math.round((x - view.ox) / g) % 5 === 0 ? 'rgba(120,120,120,.38)' : 'rgba(120,120,120,.14)'; cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x, H); cx.stroke(); }
  for (let y = view.oy; y > 0; y -= g) { cx.strokeStyle = Math.round((view.oy - y) / g) % 5 === 0 ? 'rgba(120,120,120,.38)' : 'rgba(120,120,120,.14)'; cx.beginPath(); cx.moveTo(0, y); cx.lineTo(W, y); cx.stroke(); }
  cx.strokeStyle = '#7a6a58'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(0, view.oy); cx.lineTo(W, view.oy); cx.stroke();
  cx.fillStyle = 'rgba(120,120,120,.85)'; cx.font = '12px sans-serif'; cx.fillText('пол', 6, view.oy - 5);
  const R = rects();
  R.forEach((r, i) => { const [x1, y1] = px(r[0], r[1] + r[3]), [x2, y2] = px(r[0] + r[2], r[1]); cx.fillStyle = i === selB ? '#8fc4e8' : (st.color || (st.mat === 'ply' ? '#d8bd8a' : '#d9cdb5')); cx.fillRect(x1, y1, Math.max(2, x2 - x1), Math.max(2, y2 - y1)); cx.strokeStyle = i === selB ? '#1f78b4' : '#4a4036'; cx.lineWidth = i === selB ? 2.5 : 1.5; cx.strokeRect(x1, y1, Math.max(2, x2 - x1), Math.max(2, y2 - y1)); });
  if (draw) { const [x1, y1] = px(draw.x, draw.y); const l = draw.l; const [x2, y2] = draw.o === 'h' ? px(draw.x + l, draw.y) : px(draw.x, draw.y + l); cx.strokeStyle = '#2f9bd8'; cx.lineWidth = 4; cx.beginPath(); cx.moveTo(x1, y1); cx.lineTo(x2, y2); cx.stroke(); cx.fillStyle = '#1f78b4'; cx.font = 'bold 12px sans-serif'; cx.fillText(Math.round(l * 10) / 10 + ' см', x2 + 6, y2 - 6); }
  if (selB >= 0 && R[selB]) { const r = R[selB], [x1, y1] = px(r[0], r[1] + r[3]); cx.fillStyle = '#1f78b4'; cx.font = 'bold 12px sans-serif'; cx.fillText((st.bd[selB].o === 'h' ? 'гор. ' : 'верт. ') + Math.round(st.bd[selB].l * 10) / 10 + ' см', x1 + 2, y1 - 5); }
  const b = bbox(); cx.fillStyle = '#222'; cx.font = 'bold 12px sans-serif'; cx.fillText('Габарит ' + Math.round((b.x1 - b.x0) * 10) + '×' + Math.round((b.y1 - b.y0) * 10) + ' мм', W - 190, 18);
}
function ui() {
  const e = $('brdUi'); if (!e) return; const s = selB >= 0 ? st.bd[selB] : null;
  let h = `<div class="shr"><b>Готовые:</b> ${Object.keys(BOARD_PRESETS).map(k => `<button type="button" data-pre="${k}">${BOARD_PRESETS[k].ru}</button>`).join('')}<button type="button" data-act="clear">Очистить</button></div>`;
  h += `<div class="shr"><b>Рисовать:</b> <button type="button" data-tool="sel" class="${tool === 'sel' ? 'go' : ''}">☝ Выбрать / двигать</button><button type="button" data-tool="h" class="${tool === 'h' ? 'go' : ''}">▬ Горизонтальная доска</button><button type="button" data-tool="v" class="${tool === 'v' ? 'go' : ''}">▮ Вертикальная доска</button><span class="note">${tool === 'sel' ? 'Нажмите на доску, потяните, чтобы переместить.' : 'Нажмите и тяните по сетке — получится доска нужной длины (шаг 5 см).'}</span></div>`;
  if (s) h += `<div class="shr"><b>Доска ${selB + 1}</b> X <input type="number" id="bX" value="${s.x}" style="width:62px"> Y <input type="number" id="bY" value="${s.y}" style="width:62px"> Длина <input type="number" id="bL" value="${s.l}" style="width:62px"> см <button type="button" data-act="n-l">◀</button><button type="button" data-act="n-r">▶</button><button type="button" data-act="n-u">▲</button><button type="button" data-act="n-d">▼</button><button type="button" data-act="rot">⟳ повернуть</button><button type="button" data-act="dup">⧉ копия</button><button type="button" data-act="del">🗑 удалить</button></div>`;
  h += `<div class="shr">Глубина, см <input type="number" id="bD" value="${st.d}" style="width:62px"> Над полом, см <input type="number" id="bY0" value="${st.y}" style="width:62px"> Материал <select id="bMat">${MATS.map(([k, n]) => `<option value="${k}" ${st.mat === k ? 'selected' : ''}>${n}</option>`).join('')}</select> Цвет <input type="color" id="bCol" value="${st.color || '#d8bd8a'}"><button type="button" data-act="nocol">по умолчанию</button></div>`;
  h += `<div class="shr"><input type="text" id="bName" placeholder="Название (например «Змейка 80×160»)" value="${String(st.name || '').replace(/"/g, '&quot;')}" style="min-width:220px"><button type="button" class="go" data-act="apply">${st.id ? '💾 Сохранить изменения в комнате' : '➕ Добавить в комнату'}</button><button type="button" data-act="save">💾 В мои шкафчики</button>${st.id ? '<button type="button" data-act="new">Это новый</button>' : ''}</div>`;
  e.innerHTML = h;
}
function hit(X, Y) { const [x, y] = wd(X, Y), R = rects(); for (let i = R.length - 1; i >= 0; i--) { const r = R[i], m = 1.5; if (x >= r[0] - m && x <= r[0] + r[2] + m && y >= r[1] - m && y <= r[1] + r[3] + m) return i; } return -1; }
function pos(ev) { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) * cv.width / r.width, (ev.clientY - r.top) * cv.height / r.height]; }
function payload() {
  const R = rects(), b = bbox(), bd = R.map(r => [Math.round((r[0] - b.x0) * 10) / 10, Math.round((r[1] - b.y0) * 10) / 10, Math.round(r[2] * 10) / 10, Math.round(r[3] * 10) / 10]);
  return { kind: 'boards', bd, d: st.d, y: st.y, mat: st.mat, color: st.color, w: Math.round((b.x1 - b.x0) * 10) / 10, h: Math.round((b.y1 - b.y0) * 10) / 10, n: 0, dn: 0, back: false, handles: false, fill: 'dsp' };
}
const msg = t => { const m = $('brdMsg'); if (m) { m.textContent = t; setTimeout(() => { if (m.textContent === t) m.textContent = ''; }, 3500); } };
function bind() {
  cv.addEventListener('pointerdown', ev => {
    const [X, Y] = pos(ev), [x, y] = wd(X, Y);
    if (tool === 'sel') { selB = hit(X, Y); if (selB >= 0) { const b = st.bd[selB]; drag = { i: selB, x0: b.x, y0: b.y, p0: [x, y] }; cv.setPointerCapture(ev.pointerId); } ui(); paint(); return; }
    draw = { o: tool, x: rnd(x), y: Math.max(0, rnd(y)), l: 0 }; cv.setPointerCapture(ev.pointerId); paint();
  });
  cv.addEventListener('pointermove', ev => {
    const [X, Y] = pos(ev), [x, y] = wd(X, Y);
    if (draw) { draw.l = Math.max(0, draw.o === 'h' ? rnd(x) - draw.x : rnd(y) - draw.y); paint(); return; }
    if (drag) { const b = st.bd[drag.i]; b.x = Math.round(Math.max(-50, drag.x0 + rnd(x - drag.p0[0])) * 10) / 10; b.y = Math.round(Math.max(0, drag.y0 + rnd(y - drag.p0[1])) * 10) / 10; paint(); }
  });
  cv.addEventListener('pointerup', () => {
    if (draw) { if (draw.l >= 10) { st.bd.push({ o: draw.o, x: draw.x, y: draw.y, l: draw.l }); selB = st.bd.length - 1; } draw = null; ui(); paint(); return; }
    if (drag) { drag = null; ui(); }
  });
  const root = $('brdBox');
  root.addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.pre) { const pr = BOARD_PRESETS[b.dataset.pre]; st.bd = pr.gen(tOf()).map(r => ({ o: r[2] >= r[3] ? 'h' : 'v', x: r[0], y: r[1], l: Math.max(r[2], r[3]) })); st.d = pr.d; selB = -1; fit(); ui(); paint(); return; }
    if (b.dataset.tool) { tool = b.dataset.tool; ui(); return; }
    const a = b.dataset.act, s = selB >= 0 ? st.bd[selB] : null;
    if (a === 'clear') { st.bd = []; selB = -1; ui(); paint(); }
    else if (a && a.startsWith('n-') && s) { const d = { l: [-5, 0], r: [5, 0], u: [0, 5], d: [0, -5] }[a[2]]; s.x = Math.round((s.x + d[0]) * 10) / 10; s.y = Math.max(0, Math.round((s.y + d[1]) * 10) / 10); ui(); paint(); }
    else if (a === 'rot' && s) { s.o = s.o === 'h' ? 'v' : 'h'; ui(); paint(); }
    else if (a === 'dup' && s) { st.bd.push(Object.assign({}, s, { x: s.x + 10, y: s.y + 10 })); selB = st.bd.length - 1; ui(); paint(); }
    else if (a === 'del' && s) { st.bd.splice(selB, 1); selB = -1; ui(); paint(); }
    else if (a === 'nocol') { st.color = ''; ui(); paint(); }
    else if (a === 'new') { st.id = null; ui(); }
    else if (a === 'apply') { if (!st.bd.length) return; if (window.PRO && window.PRO.shapeApply) { window.PRO.shapeApply(payload(), st.id); msg('✔ Готово — стеллаж стоит в комнате (см. 3D выше)'); } }
    else if (a === 'save') {
      if (!st.bd.length || !window.SHAPE) return; const nm = (st.name || '').trim() || 'Стеллаж из досок'; const nm2 = window.SHAPE.libAdd(Object.assign(payload(), { id: null }), nm); st.name = nm2; ui(); msg('✔ Сохранено в «Мои шкафчики»');
    }
  });
  root.addEventListener('change', ev => {
    const t = ev.target, num = () => parseFloat(String(t.value).replace(',', '.')), s = selB >= 0 ? st.bd[selB] : null;
    if (t.id === 'bX' && s) s.x = Math.round(num() * 10) / 10 || 0; else if (t.id === 'bY' && s) s.y = Math.max(0, Math.round(num() * 10) / 10 || 0); else if (t.id === 'bL' && s) s.l = Math.max(3, Math.round(num() * 10) / 10 || s.l);
    else if (t.id === 'bD') st.d = Math.max(8, Math.min(80, num() || st.d)); else if (t.id === 'bY0') st.y = Math.max(0, Math.min(300, num() || 0));
    else if (t.id === 'bMat') st.mat = t.value; else if (t.id === 'bCol') st.color = t.value; else if (t.id === 'bName') st.name = t.value;
    paint(); ui();
  });
  new ResizeObserver(() => size()).observe(cv.parentElement);
}
function size() { const w = Math.max(280, Math.min(900, cv.parentElement.clientWidth - 2)); if (cv.width !== w) { cv.width = w; cv.height = Math.round(w * .6); if (st) { fit(); paint(); } } }
function init() { cv = $('brdCv'); if (!cv) return; cx = cv.getContext('2d'); st = fromObj(null); size(); fit(); bind(); ui(); paint(); }
window.BOARDS = {
  open(o) { st = fromObj(o); selB = -1; tool = 'sel'; if (!cv) init(); else { fit(); ui(); paint(); } const b = $('brdBox'); if (b) { b.style.display = ''; b.scrollIntoView({ behavior: 'smooth', block: 'start' }); } },
  init
};
init();
