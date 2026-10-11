/* Конструктор «Свои шкафчики»: рисуем контур сверху (углы, кривые, змейка, волна), задаём стороны (стенка / дверца / гнутая стенка / открыто),
   материал (ЛДСП, фанера, МДФ), полки — и сохраняем в «Мои шкафчики». Оттуда шкафчик вставляется в комнату в 3D как обычный предмет:
   двери открываются, детали идут в раскрой, стоимость и чертежи. Библиотека хранится в этом браузере. */
const $ = id => document.getElementById(id);
const SNAP = 5, LIB_KEY = 'kc_pro_lib';
const ET = ['Стенка', 'Дверца', 'Гнутая стенка', 'Открыто'];
const MATS = [['dsp', 'ЛДСП'], ['ply', 'Фанера берёзовая 12 мм'], ['mdf', 'МДФ крашеный']];

/* ---- формы-заготовки ---- */
function band(path, depth) {   // лента вдоль линии: задняя кривая + передняя, сдвинутая на depth
  const m = path.length, nrm = path.map((p, i) => { const a = path[Math.max(0, i - 1)], b = path[Math.min(m - 1, i + 1)], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1; return [-dz / L, dx / L]; });
  let sg = nrm.reduce((a, n) => a + n[1], 0); if (Math.abs(sg) < .01) sg = nrm.reduce((a, n) => a + n[0], 0); sg = sg >= 0 ? 1 : -1;
  const back = path.map(p => [Math.round(p[0] * 2) / 2, Math.round(p[1] * 2) / 2]), mk = f => path.map((p, i) => f(p, i)).map(q => [Math.round(q[0] * 2) / 2, Math.round(q[1] * 2) / 2]).reverse();
  let front = mk((p, i) => [p[0] + sg * nrm[i][0] * depth, p[1] + sg * nrm[i][1] * depth]), P = back.concat(front);
  if (!validPoly(P)) { front = mk(p => [p[0], p[1] + (sg >= 0 && Math.abs(nrm.reduce((a, n) => a + n[1], 0)) > .01 ? depth : sg * depth)]); P = back.concat(front); }   // кривизна круче глубины: сдвигаем всю волну вниз
  return { p: P, ed: [...Array(m - 1).fill(2), 0, ...Array(m - 1).fill(3), 0] };
}
const wave = (len, lam, amp, step) => { const o = []; for (let x = 0; x <= len + .01; x += step) o.push([x, amp * Math.sin(2 * Math.PI * x / lam)]); return o; };
const PRESETS = {
  rect: { ru: 'Прямоугольник', p: [[0, 0], [100, 0], [100, 50], [0, 50]], ed: [0, 0, 1, 0] },
  L: { ru: 'Г-образный', p: [[0, 0], [120, 0], [120, 40], [40, 40], [40, 120], [0, 120]], ed: [0, 0, 1, 1, 1, 0] },
  corner: { ru: 'Угловой (скос)', p: [[0, 0], [90, 0], [90, 35], [35, 90], [0, 90]], ed: [0, 0, 0, 1, 0] },
  trap: { ru: 'Трапеция', p: [[0, 0], [120, 0], [95, 45], [25, 45]], ed: [0, 0, 1, 0] },
  U: { ru: 'П-образный', p: [[0, 0], [120, 0], [120, 100], [85, 100], [85, 35], [35, 35], [35, 100], [0, 100]], ed: [0, 0, 0, 0, 0, 1, 0, 0] },
  wave: Object.assign({ ru: '〰 Волна' }, band(wave(160, 80, 10, 8), 30)),
  snake: Object.assign({ ru: '🐍 Змейка', n: 3 }, band(wave(220, 110, 22, 8), 30)),
  snake2: Object.assign({ ru: '🐍 Змейка тонкая', n: 4 }, band(wave(260, 90, 16, 6), 24)),
  arc: Object.assign({ ru: '◜ Дуга', n: 3 }, band((() => { const o = []; for (let a = 0; a <= 180; a += 12) o.push([80 - 80 * Math.cos(a * Math.PI / 180), 60 - 60 * Math.sin(a * Math.PI / 180)]); return o; })(), 28)),
  zig: Object.assign({ ru: '⩘ Зигзаг' }, (() => { const r = band([[0, 0], [40, 22], [80, 0], [120, 22], [160, 0]], 30); r.ed = [0, 0, 0, 0, 0, 3, 3, 3, 3, 0]; return r; })()),
  shell: Object.assign({ ru: '🐚 Ракушка (веер)' }, (() => { const o = []; for (let a = 200; a <= 340; a += 10) o.push([100 + 100 * Math.cos(a * Math.PI / 180), 100 + 100 * Math.sin(a * Math.PI / 180) + 20]); return band(o, 26); })())
};

let st = null, cv, cx, view = { s: 2, ox: 20, oz: 20 }, drag = null, hoverV = -1, stroke = null;
const rnd = v => Math.round(v / SNAP) * SNAP;
const loadLib = () => { try { return JSON.parse(localStorage.getItem(LIB_KEY) || '[]'); } catch (e) { return []; } };
const saveLib = a => { try { localStorage.setItem(LIB_KEY, JSON.stringify(a)); } catch (e) {} };

function newState(o) {
  if (o && o.poly) return { id: o.id, name: o.name || '', p: o.poly.map(q => q.slice()), ed: (o.ed || o.poly.map(() => 0)).slice(), closed: true, free: false, h: o.h, n: o.n, back: o.back, fill: o.fill, handles: o.handles !== false, y: o.y, mat: o.mat || 'dsp', color: o.color || '', depth: 30, selE: -1, selV: -1 };
  const pr = PRESETS.snake;
  return { id: null, name: '', p: pr.p.map(q => q.slice()), ed: pr.ed.slice(), closed: true, free: false, h: 180, n: pr.n || 3, back: false, fill: 'dsp', handles: true, y: 0, mat: 'ply', color: '', depth: 30, selE: -1, selV: -1 };
}
const bbox = () => { const xs = st.p.map(q => q[0]), zs = st.p.map(q => q[1]); return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) }; };
function fit() {
  const b = st.p.length ? bbox() : { x0: 0, x1: 100, z0: 0, z1: 60 }, w = Math.max(b.x1 - b.x0, 100) + 60, d = Math.max(b.z1 - b.z0, 60) + 60;
  view.s = Math.min(cv.width / w, cv.height / d); view.ox = (cv.width - (b.x1 - b.x0) * view.s) / 2 - b.x0 * view.s; view.oz = (cv.height - (b.z1 - b.z0) * view.s) / 2 - b.z0 * view.s;
}
const px = p => [view.ox + p[0] * view.s, view.oz + p[1] * view.s], wd = (x, y) => [(x - view.ox) / view.s, (y - view.oz) / view.s];
function cross(a, b, c, d) { const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]); return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0; }
function valid() { return validPoly(st.p); }
function validPoly(P) {
  const n = P.length; if (n < 3) return false;
  let ar = 0; for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n]; ar += a[0] * b[1] - b[0] * a[1]; if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1) return false; }
  if (Math.abs(ar) / 2 < 100) return false;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { if (j === i + 1 || (i === 0 && j === n - 1)) continue; if (cross(P[i], P[(i + 1) % n], P[j], P[(j + 1) % n])) return false; }
  return true;
}
/* ---- рисование от руки: упрощаем линию, сглаживаем и равномерно режем на отрезки ---- */
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  let dmax = 0, idx = 0; const a = pts[0], b = pts[pts.length - 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  for (let i = 1; i < pts.length - 1; i++) { const d = Math.abs((b[0] - a[0]) * (a[1] - pts[i][1]) - (a[0] - pts[i][0]) * (b[1] - a[1])) / L; if (d > dmax) { dmax = d; idx = i; } }
  if (dmax > eps) { const l = rdp(pts.slice(0, idx + 1), eps), r = rdp(pts.slice(idx), eps); return l.slice(0, -1).concat(r); }
  return [a, b];
}
function chaikin(p, it) { for (let k = 0; k < it; k++) { const o = [p[0]]; for (let i = 0; i < p.length - 1; i++) { const a = p[i], b = p[i + 1]; o.push([.75 * a[0] + .25 * b[0], .75 * a[1] + .25 * b[1]], [.25 * a[0] + .75 * b[0], .25 * a[1] + .75 * b[1]]); } o.push(p[p.length - 1]); p = o; } return p; }
function resample(p, step) {
  const o = [p[0]]; let acc = 0;
  for (let i = 1; i < p.length; i++) { const a = p[i - 1], b = p[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); let t = step - acc; while (t <= L) { const f = t / L; o.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]); t += step; } acc = (acc + L) % step; }
  const e = p[p.length - 1], l = o[o.length - 1]; if (Math.hypot(e[0] - l[0], e[1] - l[1]) > step * .4) o.push(e);
  return o;
}
function finishStroke() {
  const raw = stroke.map(q => wd(q[0], q[1])); stroke = null;
  if (raw.length < 4) { draw(); return; }
  let path = rdp(raw, 2.5); if (path.length < 2) { draw(); return; }
  path = resample(chaikin(path, path.length > 3 ? 3 : 0), 8);
  const r = band(path, Math.max(8, st.depth || 30)); st.p = r.p; st.ed = r.ed; st.closed = true; st.free = false; st.selE = st.selV = -1;
  const b = bbox(); st.p = st.p.map(q => [q[0] - b.x0, q[1] - b.z0]); fit(); ui(); draw();
}
function draw() {
  const W = cv.width, H = cv.height; cx.clearRect(0, 0, W, H);
  cx.fillStyle = '#fff'; cx.fillRect(0, 0, W, H);
  const g = 10 * view.s; cx.lineWidth = 1;
  for (let x = view.ox % g; x < W; x += g) { cx.strokeStyle = Math.round((x - view.ox) / g) % 5 === 0 ? 'rgba(120,120,120,.35)' : 'rgba(120,120,120,.14)'; cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x, H); cx.stroke(); }
  for (let y = view.oz % g; y < H; y += g) { cx.strokeStyle = Math.round((y - view.oz) / g) % 5 === 0 ? 'rgba(120,120,120,.35)' : 'rgba(120,120,120,.14)'; cx.beginPath(); cx.moveTo(0, y); cx.lineTo(W, y); cx.stroke(); }
  cx.fillStyle = 'rgba(120,120,120,.8)'; cx.font = '12px sans-serif'; cx.fillText('↑ стена (задняя сторона)', 8, 14);
  if (stroke) { cx.strokeStyle = '#2f9bd8'; cx.lineWidth = 3; cx.beginPath(); stroke.forEach((q, i) => i ? cx.lineTo(q[0], q[1]) : cx.moveTo(q[0], q[1])); cx.stroke(); }
  const P = st.p, n = P.length; if (!n) return;
  if (st.closed && n >= 3) { cx.beginPath(); P.forEach((q, i) => { const [a, b] = px(q); i ? cx.lineTo(a, b) : cx.moveTo(a, b); }); cx.closePath(); cx.fillStyle = valid() ? 'rgba(205,187,160,.55)' : 'rgba(220,80,80,.3)'; cx.fill(); }
  const m = st.closed ? n : n - 1, small = n > 18;
  for (let i = 0; i < m; i++) {
    const a = P[i], b = P[(i + 1) % n], [x1, y1] = px(a), [x2, y2] = px(b), ty = st.ed[i] | 0;
    cx.strokeStyle = i === st.selE ? '#2f9bd8' : ty === 1 ? '#e0771a' : ty === 2 ? '#7a4cc2' : ty === 3 ? '#aaa' : '#444'; cx.lineWidth = i === st.selE ? 5 : ty === 3 ? 1.5 : ty === 2 ? 4 : 3; cx.setLineDash(ty === 1 ? [9, 5] : ty === 3 ? [3, 4] : []); cx.beginPath(); cx.moveTo(x1, y1); cx.lineTo(x2, y2); cx.stroke(); cx.setLineDash([]);
    if (!small || i === st.selE) { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); cx.fillStyle = '#222'; cx.font = 'bold 12px sans-serif'; cx.fillText(Math.round(L * 10) / 10 + (ty === 1 ? ' ·дверь' : ''), (x1 + x2) / 2 + 4, (y1 + y2) / 2 - 4); }
  }
  P.forEach((q, i) => { const [a, b] = px(q); cx.beginPath(); cx.arc(a, b, i === st.selV || i === hoverV ? 7 : (small ? 3 : 6), 0, 7); cx.fillStyle = i === 0 ? '#2a9d4a' : (i === st.selV ? '#2f9bd8' : '#fff'); cx.fill(); cx.strokeStyle = '#333'; cx.lineWidth = small ? 1 : 2; cx.stroke(); });
}
function thumb(o) {
  const P = o.poly && o.poly.length ? o.poly : [[0, 0], [o.w || 100, 0], [o.w || 100, o.d || 40], [0, o.d || 40]], xs = P.map(p => p[0]), zs = P.map(p => p[1]), x0 = Math.min(...xs), z0 = Math.min(...zs), w = Math.max(...xs) - x0 || 1, d = Math.max(...zs) - z0 || 1, k = Math.min(86 / w, 46 / d);
  return `<svg width="96" height="56" viewBox="0 0 96 56"><polygon points="${P.map(p => (5 + (p[0] - x0) * k).toFixed(1) + ',' + (5 + (p[1] - z0) * k).toFixed(1)).join(' ')}" fill="#e6d9c0" stroke="#444" stroke-width="1.4"/></svg>`;
}
function libHtml() {
  const lib = loadLib();
  if (!lib.length) return '<div class="note">Пока пусто. Нарисуйте шкафчик выше и нажмите «💾 В мои шкафчики» — он появится здесь, и его можно будет вставлять в комнату сколько угодно раз.</div>';
  return `<div class="shlib">${lib.map((it, i) => `<div class="shcard">${thumb(it.tpl)}<input type="text" value="${String(it.name || '').replace(/"/g, '&quot;')}" data-ren="${i}"><div class="shr"><button type="button" class="go" data-ins="${i}">Вставить в комнату</button></div><div class="shr"><button type="button" data-edit="${i}">✏️ Изменить</button><button type="button" data-del="${i}">🗑</button></div></div>`).join('')}</div>`;
}
function ui() {
  const e = $('shapeUi'); if (!e) return;
  const b = st.p.length ? bbox() : { x0: 0, x1: 0, z0: 0, z1: 0 }, ok = st.closed && valid(), edi = st.selE >= 0 && st.closed ? st.selE : -1;
  let h = `<div class="shr"><b>Готовые формы:</b> ${Object.keys(PRESETS).map(k => `<button type="button" data-pre="${k}">${PRESETS[k].ru}</button>`).join('')}</div>`;
  h += `<div class="shr"><button type="button" data-act="freehand" class="${st.free ? 'go' : ''}">✍ Нарисовать от руки</button> <span>${st.free ? 'проведите линию мышью/пальцем — получится лента глубиной' : 'или своя лента глубиной'}</span> <input type="number" id="shDepth" value="${st.depth}" style="width:60px"> см <button type="button" data-act="clear">Очистить / по точкам</button></div>`;
  h += `<div class="shr">${st.closed ? `Габарит ${Math.round((b.x1 - b.x0) * 10)}×${Math.round((b.z1 - b.z0) * 10)} мм · ${st.p.length} точек${ok ? '' : ' · <span style="color:#c33">контур пересекается или слишком мал</span>'}` : 'Ставьте точки кликом по сетке (шаг 5 см). Чтобы замкнуть — нажмите на зелёную первую точку.'}</div>`;
  if (st.closed) {
    h += `<div class="shr">${edi >= 0 ? `<b>Сторона ${edi + 1}</b> длина, см <input type="number" id="shLen" value="${Math.round(Math.hypot(st.p[(edi + 1) % st.p.length][0] - st.p[edi][0], st.p[(edi + 1) % st.p.length][1] - st.p[edi][1]) * 10) / 10}" step="1" style="width:70px"> <select id="shEt">${ET.map((n, k) => `<option value="${k}" ${(st.ed[edi] | 0) === k ? 'selected' : ''}>${n}</option>`).join('')}</select> <button type="button" data-act="split">＋ угол посередине</button> <button type="button" data-act="eqrun">Эта сторона для всей цепочки</button>` : '<span class="note">Нажмите на сторону: длина и тип — стенка, дверца, гнутая стенка (фанера/МДФ) или открыто. Точки можно тащить мышью.</span>'}${st.selV >= 0 && st.p.length > 3 ? ' <button type="button" data-act="delv">✕ убрать точку</button>' : ''}</div>`;
    h += `<div class="shr">Высота, см <input type="number" id="shH" value="${st.h}" style="width:64px"> Полок <input type="number" id="shN" value="${st.n}" min="0" max="12" style="width:52px"> Над полом <input type="number" id="shY" value="${st.y}" style="width:60px"> <label><input type="checkbox" id="shBack" ${st.back ? 'checked' : ''}> задняя стенка</label> <label><input type="checkbox" id="shHnd" ${st.handles ? 'checked' : ''}> ручки</label></div>`;
    h += `<div class="shr">Материал <select id="shMat">${MATS.map(([k, n]) => `<option value="${k}" ${st.mat === k ? 'selected' : ''}>${n}</option>`).join('')}</select> Цвет <input type="color" id="shCol" value="${st.color || '#d8bd8a'}"><button type="button" data-act="nocol">по умолчанию</button> Дверцы <select id="shFill">${[['dsp', 'как корпус'], ['mdf', 'Фрезерованный МДФ'], ['glass', 'Стекло'], ['mirror', 'Зеркало']].map(([k, n]) => `<option value="${k}" ${st.fill === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>`;
    h += `<div class="shr"><input type="text" id="shName" placeholder="Название (например «Змейка 220»)" value="${String(st.name || '').replace(/"/g, '&quot;')}" style="min-width:210px"><button type="button" class="go" data-act="apply" ${ok ? '' : 'disabled'}>${st.id ? '💾 Сохранить изменения в комнате' : '➕ Добавить в комнату'}</button><button type="button" data-act="save" ${ok ? '' : 'disabled'}>💾 В мои шкафчики</button>${st.id ? '<button type="button" data-act="new">Это новый шкаф</button>' : ''}</div>`;
  }
  e.innerHTML = h;
  const L = $('shapeLib'); if (L) L.innerHTML = libHtml();
}
function pick(ev) { const r = cv.getBoundingClientRect(), x = (ev.clientX - r.left) * cv.width / r.width, y = (ev.clientY - r.top) * cv.height / r.height; return { x, y, w: wd(x, y) }; }
function near(x, y) {
  let v = -1, e = -1, dv = 12;
  st.p.forEach((q, i) => { const [a, b] = px(q), d = Math.hypot(a - x, b - y); if (d < dv) { dv = d; v = i; } });
  if (v >= 0) return { v, e: -1 };
  const n = st.p.length, m = st.closed ? n : n - 1; let de = 8;
  for (let i = 0; i < m; i++) { const [x1, y1] = px(st.p[i]), [x2, y2] = px(st.p[(i + 1) % n]), l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2 || 1, t = Math.max(0, Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / l2)), d = Math.hypot(x1 + t * (x2 - x1) - x, y1 + t * (y2 - y1) - y); if (d < de) { de = d; e = i; } }
  return { v: -1, e };
}
function payload() {
  const b = bbox(), poly = st.p.map(q => [Math.round((q[0] - b.x0) * 10) / 10, Math.round((q[1] - b.z0) * 10) / 10]);
  return { kind: 'custom', poly, ed: st.ed.slice(), h: st.h, n: st.n, back: st.back, fill: st.fill, handles: st.handles, y: st.y, mat: st.mat, color: st.color, dn: 0, dh: 0 };
}
function msg(t) { const m = $('shapeMsg'); if (m) { m.textContent = t; setTimeout(() => { if (m.textContent === t) m.textContent = ''; }, 3500); } }
function bind() {
  cv.addEventListener('pointerdown', ev => {
    const q = pick(ev);
    if (st.free) { stroke = [[q.x, q.y]]; cv.setPointerCapture(ev.pointerId); draw(); return; }
    const h = near(q.x, q.y);
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
    if (stroke) { stroke.push([q.x, q.y]); draw(); return; }
    if (drag) { st.p[drag.v] = [rnd(q.w[0]), rnd(q.w[1])]; draw(); return; }
    const h = near(q.x, q.y).v; if (h !== hoverV) { hoverV = h; draw(); }
  });
  cv.addEventListener('pointerup', () => { if (stroke) finishStroke(); if (drag) { drag = null; ui(); } });
  const root = $('shapeBox');
  root.addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.pre) { const pr = PRESETS[b.dataset.pre]; st.p = pr.p.map(q => q.slice()); st.ed = pr.ed.slice(); if (pr.n != null) st.n = pr.n; st.closed = true; st.free = false; st.selE = st.selV = -1; fit(); ui(); draw(); return; }
    if (b.dataset.ins != null) { const it = loadLib()[+b.dataset.ins]; if (it && window.PRO && window.PRO.insertTpl) { window.PRO.insertTpl(it.tpl, it.name); msg('✔ «' + it.name + '» вставлен в комнату — смотрите 3D выше'); } return; }
    if (b.dataset.edit != null) { const it = loadLib()[+b.dataset.edit]; if (it) { st = newState(Object.assign({}, it.tpl, { id: null, name: it.name })); st.name = it.name; st.libIdx = +b.dataset.edit; fit(); ui(); draw(); $('shapeCv').scrollIntoView({ behavior: 'smooth', block: 'center' }); } return; }
    if (b.dataset.del != null) { const lib = loadLib(); lib.splice(+b.dataset.del, 1); saveLib(lib); ui(); return; }
    const a = b.dataset.act;
    if (a === 'freehand') { st.free = !st.free; if (st.free) { st.p = []; st.ed = []; st.closed = false; } ui(); draw(); }
    else if (a === 'clear') { st.p = []; st.ed = []; st.closed = false; st.free = false; st.selE = st.selV = -1; fit(); ui(); draw(); }
    else if (a === 'split' && st.selE >= 0) { const i = st.selE, p1 = st.p[i], p2 = st.p[(i + 1) % st.p.length]; st.p.splice(i + 1, 0, [rnd((p1[0] + p2[0]) / 2), rnd((p1[1] + p2[1]) / 2)]); st.ed.splice(i + 1, 0, st.ed[i]); st.selE = -1; ui(); draw(); }
    else if (a === 'eqrun' && st.selE >= 0) { const t = st.ed[st.selE]; let i = st.selE; const n = st.ed.length; for (let k = 0; k < n; k++) { const j = (i + k) % n; if (st.ed[j] === t || k === 0) st.ed[j] = t; else break; } ui(); draw(); }
    else if (a === 'delv' && st.selV >= 0 && st.p.length > 3) { st.p.splice(st.selV, 1); st.ed.splice(st.selV, 1); st.selV = -1; ui(); draw(); }
    else if (a === 'nocol') { st.color = ''; ui(); }
    else if (a === 'new') { st.id = null; ui(); }
    else if (a === 'apply') { if (!valid()) return; if (window.PRO && window.PRO.shapeApply) { window.PRO.shapeApply(payload(), st.id); msg('✔ Готово — шкафчик стоит в комнате (см. 3D выше)'); } }
    else if (a === 'save') {
      if (!valid()) return; const lib = loadLib(), nm = (st.name || '').trim() || ('Шкафчик ' + (lib.length + 1));
      const rec = { name: nm, tpl: payload() }; if (st.libIdx != null && lib[st.libIdx]) lib[st.libIdx] = rec; else lib.push(rec); saveLib(lib); st.libIdx = st.libIdx != null ? st.libIdx : lib.length - 1; st.name = nm; ui(); msg('✔ Сохранено в «Мои шкафчики»');
    }
  });
  root.addEventListener('change', ev => {
    const t = ev.target, num = () => parseFloat(String(t.value).replace(',', '.'));
    if (t.dataset && t.dataset.ren != null) { const lib = loadLib(); if (lib[+t.dataset.ren]) { lib[+t.dataset.ren].name = t.value.trim() || 'Шкафчик'; saveLib(lib); } return; }
    if (t.id === 'shLen' && st.selE >= 0) {
      const i = st.selE, n = st.p.length, a = st.p[i], b = st.p[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nl = Math.max(2, num() || L), k = nl / L;
      st.p[(i + 1) % n] = [Math.round((a[0] + (b[0] - a[0]) * k) * 10) / 10, Math.round((a[1] + (b[1] - a[1]) * k) * 10) / 10]; draw(); ui();
    } else if (t.id === 'shEt' && st.selE >= 0) { st.ed[st.selE] = +t.value; draw(); ui(); }
    else if (t.id === 'shDepth') st.depth = Math.max(8, Math.min(120, num() || 30));
    else if (t.id === 'shH') st.h = Math.max(5, Math.min(320, num() || st.h));
    else if (t.id === 'shN') st.n = Math.max(0, Math.min(12, Math.round(num() || 0)));
    else if (t.id === 'shY') st.y = Math.max(0, Math.min(300, num() || 0));
    else if (t.id === 'shBack') st.back = t.checked;
    else if (t.id === 'shHnd') st.handles = t.checked;
    else if (t.id === 'shFill') st.fill = t.value;
    else if (t.id === 'shMat') st.mat = t.value;
    else if (t.id === 'shCol') st.color = t.value;
    else if (t.id === 'shName') st.name = t.value;
  });
  new ResizeObserver(() => size()).observe(cv.parentElement);
}
function size() { const w = Math.max(280, Math.min(900, cv.parentElement.clientWidth - 2)); if (cv.width !== w) { cv.width = w; cv.height = Math.round(w * .55); if (st) { fit(); draw(); } } }
function init() {
  cv = $('shapeCv'); if (!cv) return; cx = cv.getContext('2d'); st = newState(null); size(); fit(); bind(); ui(); draw();
}
window.SHAPE = {
  open(o) { st = newState(o); if (!cv) init(); else { fit(); ui(); draw(); } const b = $('shapeBox'); if (b) { b.style.display = ''; b.scrollIntoView({ behavior: 'smooth', block: 'start' }); } },
  libAdd(o, name) { const lib = loadLib(), nm = name || ('Шкафчик ' + (lib.length + 1)); const tpl = JSON.parse(JSON.stringify(o)); delete tpl.id; delete tpl.x; delete tpl.z; delete tpl.rot; lib.push({ name: nm, tpl }); saveLib(lib); if (st) ui(); return nm; },
  init
};
init();
