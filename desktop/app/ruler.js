// Линейка: замеры в 3D — расстояние, цепочка, угол, окружность (по 3 точкам и центр + радиус), дуга, площадь,
// зазор между деталями, положение точки. Точки прилипают к углам деталей, серединам рёбер и центрам граней.
// Готовые замеры хранятся в проекте (P.measures) и видны, пока их не удалят.
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export const RULER_MODES = [
  ['line', '↔', 'Расстояние', 'Две точки: длина по прямой и по осям X, Y, Z', 2],
  ['chain', '⟿', 'Цепочка', 'Несколько точек подряд: каждый отрезок и сумма. Enter или двойной клик — закончить', 0],
  ['angle', '∠', 'Угол', 'Три точки: начало, вершина угла, конец', 3],
  ['circle3', '◯', 'Окружность по 3 точкам', 'Три точки на окружности: радиус, диаметр, длина, площадь', 3],
  ['radius', '⊙', 'Центр + радиус', 'Центр, потом точка на окружности (окружность — в плоскости грани)', 2],
  ['arc', '◠', 'Дуга', 'Начало дуги, точка на дуге, конец: радиус, угол, длина дуги, хорда', 3],
  ['area', '▱', 'Площадь', 'Точки по контуру: площадь и периметр. Enter или двойной клик — закончить', 0],
  ['gap', '⇹', 'Зазор между деталями', 'Клик по одной детали, потом по другой: расстояние между ними', 2],
  ['point', '⌖', 'Точка', 'Одна точка: высота от пола и расстояния от стен', 1],
];
const MODE = Object.fromEntries(RULER_MODES.map(m => [m[0], { id: m[0], icon: m[1], name: m[2], hint: m[3], need: m[4] }]));
const fmt = v => String(Math.round(v * 10) / 10).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const mm = v => `${fmt(v)} мм`;
const m2 = a => String(Math.round(a / 1e3) / 1e3).replace('.', ',');   // мм² → м², 3 знака
const V = a => new THREE.Vector3(a[0], a[1], a[2]);
const lineMat = new THREE.LineBasicMaterial({ color: 0x1f5fb4, depthTest: false, transparent: true });
const draftMat = new THREE.LineDashedMaterial({ color: 0xd9770f, depthTest: false, dashSize: 8, gapSize: 5, transparent: true });
const auxMat = new THREE.LineDashedMaterial({ color: 0x1f5fb4, depthTest: false, dashSize: 5, gapSize: 4, transparent: true, opacity: 0.7 });
const dotMat = new THREE.PointsMaterial({ color: 0x1f5fb4, size: 8, sizeAttenuation: false, depthTest: false });
const snapMat = new THREE.PointsMaterial({ color: 0x2e8b57, size: 13, sizeAttenuation: false, depthTest: false });
const freeMat = new THREE.PointsMaterial({ color: 0xd9770f, size: 10, sizeAttenuation: false, depthTest: false });

// ---------------------------------------------------------------- геометрия замеров
function circumcircle(p1, p2, p3) {
  const a = p1.clone().sub(p3), b = p2.clone().sub(p3), axb = a.clone().cross(b), d = 2 * axb.lengthSq();
  if (axb.length() < 1e-4 * a.length() * b.length()) return null;   // точки на одной прямой
  const c = b.clone().multiplyScalar(a.lengthSq()).sub(a.clone().multiplyScalar(b.lengthSq())).cross(axb).divideScalar(d).add(p3);
  const r = c.distanceTo(p1);
  if (r > 50 * Math.max(p1.distanceTo(p2), p2.distanceTo(p3), p1.distanceTo(p3))) return null;   // почти прямая
  return { c, r, n: axb.normalize() };
}
function circlePts(c, r, n, from = 0, to = Math.PI * 2, u0 = null) {
  const u = (u0 || (Math.abs(n.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)).cross(n)).clone().normalize(), w = n.clone().cross(u);
  const k = Math.max(8, Math.round(Math.abs(to - from) / (Math.PI * 2) * 96)), out = [];
  for (let i = 0; i <= k; i++) { const t = from + (to - from) * i / k; out.push(c.clone().addScaledVector(u, r * Math.cos(t)).addScaledVector(w, r * Math.sin(t))); }
  return out;
}
const angleAt = (u, w, c, p) => { const d = p.clone().sub(c); return Math.atan2(d.dot(w), d.dot(u)); };
// Что показать для замера: линии, подписи, текст для списка
export function measureShape(m, ctx) {
  const P = m.pts.map(V), lines = [], aux = [], labels = [];
  let text = '';
  const seg = (a, b) => lines.push([a, b]);
  const mid = (a, b) => a.clone().add(b).multiplyScalar(0.5);
  switch (m.mode) {
    case 'line': {
      if (P.length < 2) break;
      const [a, b] = P, d = b.clone().sub(a);
      seg(a, b);
      const c1 = new THREE.Vector3(b.x, a.y, a.z), c2 = new THREE.Vector3(b.x, b.y, a.z);   // проекции по осям — пунктиром
      if (Math.abs(d.x) > 0.5 && (Math.abs(d.y) > 0.5 || Math.abs(d.z) > 0.5)) aux.push([a, c1], [c1, c2], [c2, b]);
      labels.push([mid(a, b), `<b>${mm(a.distanceTo(b))}</b>`]);
      text = `${mm(a.distanceTo(b))} · ΔX ${fmt(Math.abs(d.x))} · ΔY ${fmt(Math.abs(d.y))} · ΔZ ${fmt(Math.abs(d.z))}`;
      break;
    }
    case 'chain': case 'area': {
      if (P.length < 2) break;
      let sum = 0;
      for (let i = 1; i < P.length; i++) { seg(P[i - 1], P[i]); const L = P[i - 1].distanceTo(P[i]); sum += L; labels.push([mid(P[i - 1], P[i]), fmt(L)]); }
      if (m.mode === 'chain') { labels.push([P[P.length - 1], `<b>Σ ${mm(sum)}</b>`]); text = `${P.length - 1} отр., всего ${mm(sum)}`; break; }
      if (P.length < 3) break;
      const close = P[P.length - 1].distanceTo(P[0]); sum += close;
      (m.done ? lines : aux).push([P[P.length - 1], P[0]]);
      const A = new THREE.Vector3();
      for (let i = 0; i < P.length; i++) A.add(P[i].clone().cross(P[(i + 1) % P.length]));
      const area = A.length() / 2, cen = P.reduce((s, p) => s.add(p), new THREE.Vector3()).divideScalar(P.length);
      labels.push([cen, `<b>${m2(area)} м²</b><br>периметр ${mm(sum)}`]);
      text = `площадь ${m2(area)} м² (${fmt(area / 100)} см²), периметр ${mm(sum)}`;
      break;
    }
    case 'angle': {
      if (P.length < 2) break;
      seg(P[0], P[1]);
      if (P.length < 3) break;
      seg(P[1], P[2]);
      const a = P[0].clone().sub(P[1]), b = P[2].clone().sub(P[1]), deg = THREE.MathUtils.radToDeg(a.angleTo(b));
      const n = a.clone().cross(b); if (n.lengthSq() > 1e-9) {
        n.normalize(); const r = Math.min(a.length(), b.length()) * 0.3, u = a.clone().normalize(), w = n.clone().cross(u);
        const arc = circlePts(P[1], r, n, 0, a.angleTo(b), u); for (let i = 1; i < arc.length; i++) aux.push([arc[i - 1], arc[i]]);
        labels.push([P[1].clone().addScaledVector(u.clone().add(w.normalize()).normalize(), r * 1.4), `<b>${fmt(deg)}°</b>`]);
      }
      text = `угол ${fmt(deg)}° (дополнит. ${fmt(180 - deg)}°)`;
      break;
    }
    case 'circle3': case 'arc': {
      if (P.length < 2) break;
      if (P.length < 3) { aux.push([P[0], P[1]]); break; }
      const cc = circumcircle(P[0], P[1], P[2]);
      if (!cc) { text = 'точки на одной прямой — это не дуга'; aux.push([P[0], P[1]], [P[1], P[2]]); break; }
      const u = P[0].clone().sub(cc.c).normalize(), w = cc.n.clone().cross(u);
      if (m.mode === 'circle3') {
        const pts = circlePts(cc.c, cc.r, cc.n, 0, Math.PI * 2, u); for (let i = 1; i < pts.length; i++) seg(pts[i - 1], pts[i]);
        aux.push([cc.c, P[0]]);
        labels.push([cc.c, `<b>R ${fmt(cc.r)}</b> · Ø ${fmt(cc.r * 2)}`]);
        text = `R ${mm(cc.r)}, Ø ${mm(2 * cc.r)}, длина ${mm(2 * Math.PI * cc.r)}, площадь ${m2(Math.PI * cc.r * cc.r)} м²`;
      } else {
        let t2 = angleAt(u, w, cc.c, P[1]), t3 = angleAt(u, w, cc.c, P[2]);
        if (t2 < 0) t2 += 2 * Math.PI; if (t3 < 0) t3 += 2 * Math.PI;
        const span = t2 < t3 ? t3 : t3 - 2 * Math.PI;   // идём через среднюю точку
        const pts = circlePts(cc.c, cc.r, cc.n, 0, span, u); for (let i = 1; i < pts.length; i++) seg(pts[i - 1], pts[i]);
        aux.push([cc.c, P[0]], [cc.c, P[2]], [P[0], P[2]]);
        const L = Math.abs(span) * cc.r;
        labels.push([P[1], `<b>дуга ${fmt(L)}</b><br>R ${fmt(cc.r)} · ${fmt(THREE.MathUtils.radToDeg(Math.abs(span)))}°`]);
        text = `дуга ${mm(L)}, R ${mm(cc.r)}, угол ${fmt(THREE.MathUtils.radToDeg(Math.abs(span)))}°, хорда ${mm(P[0].distanceTo(P[2]))}`;
      }
      break;
    }
    case 'radius': {
      if (P.length < 2) break;
      const n = m.n ? V(m.n).normalize() : ctx.viewDir();
      const d = P[1].clone().sub(P[0]), r = d.clone().sub(n.clone().multiplyScalar(d.dot(n))).length() || d.length();
      const u = d.clone().sub(n.clone().multiplyScalar(d.dot(n))).normalize();
      const pts = circlePts(P[0], r, n, 0, Math.PI * 2, u.lengthSq() ? u : null); for (let i = 1; i < pts.length; i++) seg(pts[i - 1], pts[i]);
      aux.push([P[0], P[1]]);
      labels.push([mid(P[0], P[1]), `<b>R ${fmt(r)}</b>`]);
      text = `R ${mm(r)}, Ø ${mm(2 * r)}, длина окружности ${mm(2 * Math.PI * r)}, площадь ${m2(Math.PI * r * r)} м²`;
      break;
    }
    case 'gap': {
      const A = ctx.item(m.ids && m.ids[0]), B = ctx.item(m.ids && m.ids[1]);
      if (!A || !B) { text = 'деталь удалена'; break; }
      const pa = new THREE.Vector3(), pb = new THREE.Vector3(), g = [];
      for (const [k, s] of [['x', 'w'], ['y', 'h'], ['z', 'd']]) {
        const a0 = A[k], a1 = A[k] + A[s], b0 = B[k], b1 = B[k] + B[s];
        if (b0 >= a1) { pa[k] = a1; pb[k] = b0; g.push(b0 - a1); } else if (a0 >= b1) { pa[k] = a0; pb[k] = b1; g.push(a0 - b1); }
        else { const c = (Math.max(a0, b0) + Math.min(a1, b1)) / 2; pa[k] = pb[k] = c; g.push(0); }
      }
      const dist = pa.distanceTo(pb);
      if (dist > 0.05) seg(pa, pb);
      labels.push([mid(pa, pb), dist > 0.05 ? `<b>${mm(dist)}</b>` : '<b>вплотную</b>']);
      text = `«${ctx.label(A)}» ↔ «${ctx.label(B)}»: ${dist > 0.05 ? mm(dist) : 'вплотную'}${g.filter(v => v > 0).length > 1 ? ` (X ${fmt(g[0])}, Y ${fmt(g[1])}, Z ${fmt(g[2])})` : ''}`;
      P.length = 0; P.push(pa, pb);
      break;
    }
    case 'point': {
      if (!P.length) break;
      const p = P[0], f = new THREE.Vector3(p.x, 0, p.z);
      if (p.y > 0.5) aux.push([p, f]);
      labels.push([p, `↑ <b>${fmt(p.y)}</b> от пола<br>X ${fmt(p.x)} · Z ${fmt(p.z)}`]);
      text = `высота ${mm(p.y)}, от левой стены ${mm(p.x)}, от задней ${mm(p.z)}`;
      break;
    }
  }
  return { P, lines, aux, labels, text };
}

// ---------------------------------------------------------------- инструмент
export function createRuler(ctx) {
  const group = new THREE.Group(); group.renderOrder = 30; ctx.scene.add(group);
  const st = { mini: false, on: false, mode: 'line', axis: '', snap: true, pts: [], ids: [], n: null, cursor: null, snapped: false, show: true };
  const panel = document.createElement('div'); panel.className = 'ruler'; panel.hidden = true; ctx.vp.appendChild(panel);
  const list = () => (ctx.P().measures = ctx.P().measures || []);

  function addLines(pairs, mat) {
    if (!pairs.length) return;
    const pts = []; pairs.forEach(([a, b]) => pts.push(a, b));
    const l = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), mat);
    if (mat.isLineDashedMaterial) l.computeLineDistances();
    l.renderOrder = 30; group.add(l);
  }
  function addLabel(p, html, cls = '') { const el = document.createElement('div'); el.className = 'rlabel ' + cls; el.innerHTML = html; const o = new CSS2DObject(el); o.position.copy(p); group.add(o); }
  function addDots(P, mat) { if (!P.length) return; const d = new THREE.Points(new THREE.BufferGeometry().setFromPoints(P), mat); d.renderOrder = 31; group.add(d); }
  function draw() {
    group.clear();
    if (st.show) for (const m of list()) { const s = measureShape(m, ctx); addLines(s.lines, lineMat); addLines(s.aux, auxMat); addDots(s.P, dotMat); s.labels.forEach(([p, h]) => addLabel(p, h)); }
    if (st.on) {
      const draft = { mode: st.mode, pts: st.cursor && st.mode !== 'gap' ? [...st.pts, st.cursor] : st.pts, ids: st.ids, n: st.n };
      if (draft.pts.length && !(st.mode === 'gap' && st.ids.length < 2)) {
        const s = measureShape(draft, ctx);
        addLines(s.lines, draftMat); addLines(s.aux, auxMat); addDots(st.pts.map(V), freeMat); s.labels.forEach(([p, h]) => addLabel(p, h, 'draft'));
        panel.querySelector('.r-live').innerHTML = s.text || MODE[st.mode].hint;
      } else panel.querySelector('.r-live').innerHTML = MODE[st.mode].hint;
      if (st.cursor) addDots([V(st.cursor)], st.snapped ? snapMat : freeMat);
    }
    ctx.render();
  }
  function drawPanel() {
    const ms = list();
    panel.classList.toggle('mini', st.mini);
    if (st.mini) { panel.innerHTML = `<div class="pal-head"><b>📏 ${MODE[st.mode].icon} ${MODE[st.mode].name}</b><span class="grow"></span><button data-r="mini" title="Развернуть">▸</button><button data-r="close" title="Закрыть (Esc)">×</button></div><div class="r-live note"></div>`; draw(); return; }
    panel.innerHTML = `<div class="pal-head"><b>📏 Линейка</b><span class="grow"></span><button data-r="mini" title="Свернуть, чтобы не закрывала модель">▾</button><button data-r="close" title="Закрыть (Esc)">×</button></div>
      <div class="r-modes">${RULER_MODES.map(([id, ic, nm, hint]) => `<button class="${id === st.mode ? 'on' : ''}" data-mode="${id}" title="${hint}"><span>${ic}</span>${nm}</button>`).join('')}</div>
      <div class="r-row"><span>Ось:</span>${[['', 'любая'], ['x', 'X'], ['y', 'Y'], ['z', 'Z']].map(([a, n]) => `<button class="${st.axis === a ? 'on' : ''}" data-axis="${a}">${n}</button>`).join('')}
        <label><input type="checkbox" data-r="snap"${st.snap ? ' checked' : ''}> привязка</label></div>
      <div class="r-live note"></div>
      <div class="r-list">${ms.map((m, i) => `<div class="op"><span><b>${MODE[m.mode].icon} ${MODE[m.mode].name}:</b> ${measureShape(m, ctx).text}</span><button data-del="${i}" title="Удалить замер">✕</button></div>`).join('') || '<div class="note">Замеров пока нет.</div>'}</div>
      <div class="btns"><label><input type="checkbox" data-r="show"${st.show ? ' checked' : ''}> показывать замеры</label>${ms.length ? '<button data-r="clear">Удалить все</button>' : ''}</div>
      <div class="note">Клик — точка. Точки прилипают к углам, серединам рёбер и центрам граней (зелёная). <kbd>Ctrl</kbd> — без привязки. <kbd>Backspace</kbd> — убрать точку, <kbd>Esc</kbd> — отменить.</div>`;
    draw();
  }
  panel.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.mode) { st.mode = b.dataset.mode; reset(); }
    else if (b.dataset.axis !== undefined) st.axis = b.dataset.axis;
    else if (b.dataset.del) ctx.commit(() => list().splice(+b.dataset.del, 1));
    else if (b.dataset.r === 'clear') ctx.commit(() => { ctx.P().measures = []; });
    else if (b.dataset.r === 'close') return api.stop();
    else if (b.dataset.r === 'mini') st.mini = !st.mini;
    drawPanel();
  });
  panel.addEventListener('change', e => { if (e.target.dataset.r === 'snap') st.snap = e.target.checked; if (e.target.dataset.r === 'show') st.show = e.target.checked; draw(); });
  panel.addEventListener('pointerdown', e => e.stopPropagation());
  const reset = () => { st.pts = []; st.ids = []; st.n = null; st.cursor = null; };

  // точка под мышкой: попадание по детали / полу / стене, с привязкой к характерным точкам детали
  function pointAt(e) {
    const hit = ctx.raycast(e); if (!hit) return null;
    let p = hit.point.clone(), snapped = false;
    const n = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : null;
    if (st.snap && !e.ctrlKey) {
      const cands = [];
      const it = hit.object.userData.id && ctx.item(hit.object.userData.id);
      if (it) {
        const xs = [it.x, it.x + it.w / 2, it.x + it.w], ys = [it.y, it.y + it.h / 2, it.y + it.h], zs = [it.z, it.z + it.d / 2, it.z + it.d];
        for (const x of xs) for (const y of ys) for (const z of zs) cands.push(new THREE.Vector3(x, y, z));
      }
      for (const m of list()) for (const q of m.pts) cands.push(V(q));
      for (const q of st.pts) cands.push(V(q));
      const px = ctx.toScreen(p); let best = 14;
      for (const c of cands) { const d = ctx.toScreen(c).distanceTo(px); if (d < best) { best = d; p = c; snapped = true; } }
    }
    if (!snapped) p.set(Math.round(p.x), Math.round(p.y), Math.round(p.z));
    if (st.axis && st.pts.length) { const prev = V(st.pts[st.pts.length - 1]); for (const k of ['x', 'y', 'z']) if (k !== st.axis) p[k] = prev[k]; }
    return { p, snapped, n, id: hit.object.userData.id };
  }
  function finish() {
    const need = MODE[st.mode].need, enough = need ? st.pts.length >= need : st.pts.length >= (st.mode === 'area' ? 3 : 2);
    if (!enough) return;
    const m = { mode: st.mode, pts: st.pts.map(p => p.map(v => Math.round(v * 10) / 10)), done: true };
    if (st.mode === 'radius' && st.n) m.n = st.n;
    if (st.mode === 'gap') m.ids = st.ids.slice();
    ctx.commit(() => list().push(m));
    ctx.status('📏 ' + measureShape(m, ctx).text);
    reset(); drawPanel();
  }
  const api = {
    get on() { return st.on; },
    start() { st.on = true; reset(); panel.hidden = false; ctx.vp.classList.add('ruling'); drawPanel(); },
    stop() { st.on = false; reset(); panel.hidden = true; ctx.vp.classList.remove('ruling'); draw(); },
    toggle() { st.on ? api.stop() : api.start(); },
    move(e) { if (!st.on) return; const r = st.mode === 'gap' ? null : pointAt(e); st.cursor = r ? r.p.toArray() : null; st.snapped = !!(r && r.snapped); draw(); },
    click(e) {
      if (st.mode === 'gap') {
        const hit = ctx.raycast(e), id = hit && hit.object.userData.id;
        if (!id) return ctx.status('Кликните по детали');
        if (!st.ids.length || st.ids[0] !== id) st.ids.push(id);
        if (st.ids.length === 2) { st.pts = [[0, 0, 0], [0, 0, 0]]; finish(); } else ctx.status('Теперь — вторая деталь');
        return draw();
      }
      const r = pointAt(e); if (!r) return;
      if (!st.pts.length && st.mode === 'radius' && r.n) st.n = r.n.toArray();
      st.pts.push(r.p.toArray());
      if (MODE[st.mode].need && st.pts.length >= MODE[st.mode].need) finish(); else draw();
    },
    dblclick() { if (st.on && !MODE[st.mode].need) { st.pts.pop(); finish(); } },   // второй клик двойного уже добавил точку
    key(e) {
      if (!st.on) return false;
      if (e.key === 'Escape') { if (st.pts.length || st.ids.length) { reset(); draw(); } else api.stop(); return true; }
      if (e.key === 'Enter') { finish(); return true; }
      if (e.key === 'Backspace' || e.key === 'Delete') { st.pts.pop(); draw(); return true; }
      return false;
    },
    redraw() { if (st.on) drawPanel(); else draw(); },
  };
  return api;
}
