/* Окно «Нарисовать свою форму»: вид сверху, точки контура, двери на любых сторонах.
   Готовая форма добавляется в комнату как шкаф: полки, дверцы открываются в 3D, детали попадают в раскрой и чертежи. */
const $ = id => document.getElementById(id);
const SNAP = 5;
const PRESETS = {
  rect: { ru: 'Прямоугольник', p: [[0, 0], [100, 0], [100, 50], [0, 50]], ed: [0, 0, 1, 0] },
  L: { ru: 'Г-образный', p: [[0, 0], [120, 0], [120, 40], [40, 40], [40, 120], [0, 120]], ed: [0, 0, 1, 1, 1, 0] },
  corner: { ru: 'Угловой (скос)', p: [[0, 0], [90, 0], [90, 35], [35, 90], [0, 90]], ed: [0, 0, 0, 1, 0] },
  trap: { ru: 'Трапеция', p: [[0, 0], [120, 0], [95, 45], [25, 45]], ed: [0, 0, 1, 0] },
  half: { ru: 'Полукруг', p: [[0, 0], [100, 0], [98, 17], [90, 33], [77, 45], [62, 53], [50, 55], [38, 53], [23, 45], [10, 33], [2, 17]], ed: [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0] },
  U: { ru: 'П-образный', p: [[0, 0], [120, 0], [120, 100], [85, 100], [85, 35], [35, 35], [35, 100], [0, 100]], ed: [0, 0, 0, 0, 0, 1, 0, 0] }
};
let st = null, cv, cx, view = { s: 2, ox: 20, oz: 20 }, drag = null, hoverV = -1;

const rnd = v => Math.round(v / SNAP) * SNAP;
function newState(o) {
  if (o && o.poly) return { id: o.id, p: o.poly.map(q => q.slice()), ed: (o.ed || o.poly.map(() => 0)).slice(), closed: true, h: o.h, n: o.n, back: o.back, fill: o.fill, handles: o.handles !== false, y: o.y, selE: -1, selV: -1 };
  const pr = PRESETS.L;
  return { id: null, p: pr.p.map(q => q.slice()), ed: pr.ed.slice(), closed: true, h: 200, n: 3, back: true, fill: 'dsp', handles: true, y: 0, selE: -1, selV: -1 };
}
const bbox = () => { const xs = st.p.map(q => q[0]), zs = st.p.map(q => q[1]); return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) }; };
function fit() {
  const b = st.p.length ? bbox() : { x0: 0, x1: 100, z0: 0, z1: 60 }, w = Math.max(b.x1 - b.x0, 100) + 60, d = Math.max(b.z1 - b.z0, 60) + 60;
  view.s = Math.min(cv.width / w, cv.height / d); view.ox = (cv.width - (b.x1 - b.x0) * view.s) / 2 - b.x0 * view.s; view.oz = (cv.height - (b.z1 - b.z0) * view.s) / 2 - b.z0 * view.s;
}
const px = p => [view.ox + p[0] * view.s, view.oz + p[1] * view.s], wd = (x, y) => [(x - view.ox) / view.s, (y - view.oz) / view.s];
const cross = (a, b, c, d) => { const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]); return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0; };
function valid() {
  const P = st.p, n = P.length; if (n < 3) return false;
  let ar = 0; for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n]; ar += a[0] * b[1] - b[0] * a[1]; if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 3) return false; }
  if (Math.abs(ar) / 2 < 100) return false;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { if (j === i + 1 || (i === 0 && j === n - 1)) continue; if (cross(P[i], P[(i + 1) % n], P[j], P[(j + 1) % n])) return false; }
  return true;
}
function draw() {
  const W = cv.width, H = cv.height; cx.clearRect(0, 0, W, H);
  cx.fillStyle = getComputedStyle(document.body).getPropertyValue('--card') || '#fff'; cx.fillRect(0, 0, W, H);
  const g = 10 * view.s; cx.lineWidth = 1;
  for (let x = view.ox % g; x < W; x += g) { cx.strokeStyle = Math.round((x - view.ox) / g) % 5 === 0 ? 'rgba(120,120,120,.35)' : 'rgba(120,120,120,.14)'; cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x, H); cx.stroke(); }
  for (let y = view.oz % g; y < H; y += g) { cx.strokeStyle = Math.round((y - view.oz) / g) % 5 === 0 ? 'rgba(120,120,120,.35)' : 'rgba(120,120,120,.14)'; cx.beginPath(); cx.moveTo(0, y); cx.lineTo(W, y); cx.stroke(); }
  cx.fillStyle = 'rgba(120,120,120,.8)'; cx.font = '12px sans-serif'; cx.fillText('↑ стена (задняя сторона)', 8, 14);
  const P = st.p, n = P.length; if (!n) return;
  if (st.closed && n >= 3) { cx.beginPath(); P.forEach((q, i) => { const [a, b] = px(q); i ? cx.lineTo(a, b) : cx.moveTo(a, b); }); cx.closePath(); cx.fillStyle = valid() ? 'rgba(205,187,160,.55)' : 'rgba(220,80,80,.3)'; cx.fill(); }
  const m = st.closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const a = P[i], b = P[(i + 1) % n], [x1, y1] = px(a), [x2, y2] = px(b), door = st.ed[i];
    cx.strokeStyle = i === st.selE ? '#2f9bd8' : door ? '#e0771a' : '#444'; cx.lineWidth = i === st.selE ? 5 : door ? 4 : 3; cx.setLineDash(door ? [9, 5] : []); cx.beginPath(); cx.moveTo(x1, y1); cx.lineTo(x2, y2); cx.stroke(); cx.setLineDash([]);
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]); cx.fillStyle = '#222'; cx.font = 'bold 12px sans-serif'; cx.fillText(Math.round(L * 10) / 10 + (door ? ' ·дверь' : ''), (x1 + x2) / 2 + 4, (y1 + y2) / 2 - 4);
  }
  P.forEach((q, i) => { const [a, b] = px(q); cx.beginPath(); cx.arc(a, b, i === st.selV || i === hoverV ? 8 : 6, 0, 7); cx.fillStyle = i === 0 ? '#2a9d4a' : (i === st.selV ? '#2f9bd8' : '#fff'); cx.fill(); cx.strokeStyle = '#333'; cx.lineWidth = 2; cx.stroke(); });
}
function ui() {
  const e = $('shapeUi'); if (!e) return;
  const b = st.p.length ? bbox() : { x0: 0, x1: 0, z0: 0, z1: 0 }, ok = st.closed && valid(), edi = st.selE >= 0 && st.closed ? st.selE : -1;
  let h = `<div class="shr"><b>Готовые формы:</b> ${Object.keys(PRESETS).map(k => `<button type="button" data-pre="${k}">${PRESETS[k].ru}</button>`).join('')}<button type="button" data-act="clear">Очистить</button></div>`;
  h += `<div class="shr">${st.closed ? `Габарит ${Math.round((b.x1 - b.x0) * 10)}×${Math.round((b.z1 - b.z0) * 10)} мм · ${st.p.length} углов${ok ? '' : ' · <span style="color:#c33">контур пересекается или слишком мал</span>'}` : 'Ставьте точки кликом по сетке (шаг 5 см). Чтобы замкнуть — нажмите на зелёную первую точку.'}</div>`;
  if (st.closed) {
    h += `<div class="shr">${edi >= 0 ? `<b>Сторона ${edi + 1}</b> длина, см <input type="number" id="shLen" value="${Math.round(Math.hypot(st.p[(edi + 1) % st.p.length][0] - st.p[edi][0], st.p[(edi + 1) % st.p.length][1] - st.p[edi][1]) * 10) / 10}" step="1" style="width:70px"> <label><input type="checkbox" id="shDoor" ${st.ed[edi] ? 'checked' : ''}> здесь дверца</label> <button type="button" data-act="split">＋ угол посередине</button>` : '<span class="note">Нажмите на сторону — задайте длину и поставьте на ней дверцу. Точки можно тащить мышью.</span>'}${st.selV >= 0 && st.p.length > 3 ? ' <button type="button" data-act="delv">✕ убрать угол</button>' : ''}</div>`;
    h += `<div class="shr">Высота, см <input type="number" id="shH" value="${st.h}" style="width:64px"> Полок <input type="number" id="shN" value="${st.n}" min="0" max="12" style="width:52px"> Над полом <input type="number" id="shY" value="${st.y}" style="width:60px"> <label><input type="checkbox" id="shBack" ${st.back ? 'checked' : ''}> задняя стенка</label> <label><input type="checkbox" id="shHnd" ${st.handles ? 'checked' : ''}> ручки</label> <select id="shFill">${[['dsp', 'ЛДСП'], ['mdf', 'Фрезерованный МДФ'], ['glass', 'Стекло'], ['mirror', 'Зеркало']].map(([k, n]) => `<option value="${k}" ${st.fill === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>`;
    h += `<div class="shr"><button type="button" class="go" data-act="apply" ${ok ? '' : 'disabled'}>${st.id ? '💾 Сохранить изменения' : '➕ Добавить в комнату'}</button>${st.id ? '<button type="button" data-act="new">Это новый шкаф</button>' : ''}</div>`;
  }
  e.innerHTML = h;
}
function pick(ev) {
  const r = cv.getBoundingClientRect(), x = (ev.clientX - r.left) * cv.width / r.width, y = (ev.clientY - r.top) * cv.height / r.height;
  return { x, y, w: wd(x, y) };
}
function near(x, y) {
  let v = -1, e = -1, dv = 14;
  st.p.forEach((q, i) => { const [a, b] = px(q), d = Math.hypot(a - x, b - y); if (d < dv) { dv = d; v = i; } });
  if (v >= 0) return { v, e: -1 };
  const n = st.p.length, m = st.closed ? n : n - 1; let de = 9;
  for (let i = 0; i < m; i++) { const [x1, y1] = px(st.p[i]), [x2, y2] = px(st.p[(i + 1) % n]), l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2 || 1, t = Math.max(0, Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / l2)), d = Math.hypot(x1 + t * (x2 - x1) - x, y1 + t * (y2 - y1) - y); if (d < de) { de = d; e = i; } }
  return { v: -1, e };
}
function bind() {
  cv.addEventListener('pointerdown', ev => {
    const q = pick(ev), h = near(q.x, q.y);
    if (!st.closed) {
      if (h.v === 0 && st.p.length >= 3) { st.closed = true; st.ed = st.p.map(() => 0); st.selE = st.selV = -1; ui(); draw(); return; }
      if (h.v < 0) { st.p.push([rnd(q.w[0]), rnd(q.w[1])]); st.ed = st.p.map(() => 0); ui(); draw(); } return;
    }
    if (h.v >= 0) { st.selV = h.v; st.selE = -1; drag = { v: h.v }; cv.setPointerCapture(ev.pointerId); }
    else if (h.e >= 0) { st.selE = h.e; st.selV = -1; }
    else { st.selE = st.selV = -1; }
    ui(); draw();
  });
  cv.addEventListener('pointermove', ev => {
    const q = pick(ev);
    if (drag) { st.p[drag.v] = [rnd(q.w[0]), rnd(q.w[1])]; draw(); ui(); return; }
    const h = near(q.x, q.y).v; if (h !== hoverV) { hoverV = h; draw(); }
  });
  cv.addEventListener('pointerup', () => { drag = null; });
  $('shapeUi').addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.pre) { const pr = PRESETS[b.dataset.pre]; st.p = pr.p.map(q => q.slice()); st.ed = pr.ed.slice(); st.closed = true; st.selE = st.selV = -1; fit(); ui(); draw(); return; }
    const a = b.dataset.act;
    if (a === 'clear') { st.p = []; st.ed = []; st.closed = false; st.selE = st.selV = -1; fit(); ui(); draw(); }
    else if (a === 'split' && st.selE >= 0) { const i = st.selE, p1 = st.p[i], p2 = st.p[(i + 1) % st.p.length]; st.p.splice(i + 1, 0, [rnd((p1[0] + p2[0]) / 2), rnd((p1[1] + p2[1]) / 2)]); st.ed.splice(i + 1, 0, st.ed[i]); st.selE = -1; ui(); draw(); }
    else if (a === 'delv' && st.selV >= 0 && st.p.length > 3) { st.p.splice(st.selV, 1); st.ed.splice(st.selV, 1); st.selV = -1; ui(); draw(); }
    else if (a === 'new') { st.id = null; ui(); }
    else if (a === 'apply') apply();
  });
  $('shapeUi').addEventListener('change', ev => {
    const t = ev.target, num = () => parseFloat(String(t.value).replace(',', '.'));
    if (t.id === 'shLen' && st.selE >= 0) {   // длина стороны: конец стороны и всё, что за ним, сдвигается вдоль стороны
      const i = st.selE, n = st.p.length, a = st.p[i], b = st.p[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nl = Math.max(5, num() || L), k = nl / L, dx = (b[0] - a[0]) * (k - 1), dz = (b[1] - a[1]) * (k - 1);
      st.p[(i + 1) % n] = [Math.round((b[0] + dx) * 10) / 10, Math.round((b[1] + dz) * 10) / 10]; draw(); ui();
    } else if (t.id === 'shDoor' && st.selE >= 0) { st.ed[st.selE] = t.checked ? 1 : 0; draw(); ui(); }
    else if (t.id === 'shH') st.h = Math.max(20, Math.min(320, num() || st.h));
    else if (t.id === 'shN') st.n = Math.max(0, Math.min(12, Math.round(num() || 0)));
    else if (t.id === 'shY') st.y = Math.max(0, Math.min(300, num() || 0));
    else if (t.id === 'shBack') st.back = t.checked;
    else if (t.id === 'shHnd') st.handles = t.checked;
    else if (t.id === 'shFill') st.fill = t.value;
  });
  new ResizeObserver(() => size()).observe(cv.parentElement);
}
function size() { const w = Math.max(280, Math.min(900, cv.parentElement.clientWidth - 2)); if (cv.width !== w) { cv.width = w; cv.height = Math.round(w * .55); if (st) { fit(); draw(); } } }
function apply() {
  if (!valid()) return;
  const b = bbox(), poly = st.p.map(q => [Math.round((q[0] - b.x0) * 10) / 10, Math.round((q[1] - b.z0) * 10) / 10]);
  if (window.PRO && window.PRO.shapeApply) window.PRO.shapeApply({ poly, ed: st.ed.slice(), h: st.h, n: st.n, back: st.back, fill: st.fill, handles: st.handles, y: st.y }, st.id);
  const s = $('shapeBox'); if (s) { const t = $('shapeMsg'); if (t) { t.textContent = '✔ Готово — шкаф стоит в комнате (см. 3D выше)'; setTimeout(() => { t.textContent = ''; }, 3000); } }
}
function init() {
  cv = $('shapeCv'); if (!cv) return; cx = cv.getContext('2d'); st = newState(null); size(); fit(); bind(); ui(); draw();
}
window.SHAPE = {
  open(o) { st = newState(o); if (!cv) init(); else { fit(); ui(); draw(); } const b = $('shapeBox'); if (b) { b.style.display = ''; b.scrollIntoView({ behavior: 'smooth', block: 'start' }); } },
  init
};
init();
