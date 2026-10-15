// Обработка деталей: отверстия, вырезы, пазы, срезы углов — и чертёж детали.
// Координаты обработки задаются на плоскости детали (пласти): U — по горизонтали чертежа, V — по вертикали, в мм от
// левого-нижнего угла чертежа. Толщина — ось N. Пласть А — сторона с большей координатой по N, Б — обратная.
// Торцы: U0 (левый на чертеже), U1 (правый), V0 (нижний), V1 (верхний).
import * as THREE from 'three';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';

const AX = { x: 'w', y: 'h', z: 'd' };
const FRAMES = { x: { U: 'z', V: 'y' }, y: { U: 'x', V: 'z' }, z: { U: 'x', V: 'y' } };
const UNIT = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };

// Названия сторон детали — зависят от того, как она стоит (по самой тонкой оси)
export const SIDE_NAMES = {
  x: { A: 'правая пласть', B: 'левая пласть', U0: 'задний торец', U1: 'передний торец', V0: 'нижний торец', V1: 'верхний торец' },
  y: { A: 'верхняя пласть', B: 'нижняя пласть', U0: 'левый торец', U1: 'правый торец', V0: 'задний торец', V1: 'передний торец' },
  z: { A: 'лицевая пласть', B: 'тыльная пласть', U0: 'левый торец', U1: 'правый торец', V0: 'нижний торец', V1: 'верхний торец' },
};
const FROM = { 'задний торец': 'от заднего торца', 'передний торец': 'от переднего торца', 'нижний торец': 'от нижнего торца',
  'верхний торец': 'от верхнего торца', 'левый торец': 'от левого торца', 'правый торец': 'от правого торца',
  'левая пласть': 'от левой пласти', 'нижняя пласть': 'от нижней пласти', 'тыльная пласть': 'от тыльной пласти' };
export const fromName = n => FROM[n] || 'от ' + n;

export const HOLE_PRESETS = [
  { id: 'custom', name: 'Своё отверстие', dia: 8, depth: 12 },
  { id: 'hinge', name: 'Петля: чашка Ø35, гл. 13', dia: 35, depth: 13 },
  { id: 'hingeplate', name: 'Петля: ответная планка Ø5, гл. 12', dia: 5, depth: 12 },
  { id: 'confFace', name: 'Конфирмат в пласть Ø5, сквозное', dia: 5, depth: 0, through: true },
  { id: 'confEdge', name: 'Конфирмат в торец Ø7, гл. 50', dia: 7, depth: 50, edge: true },
  { id: 'dowelFace', name: 'Шкант в пласть Ø8, гл. 12', dia: 8, depth: 12 },
  { id: 'dowelEdge', name: 'Шкант в торец Ø8, гл. 30', dia: 8, depth: 30, edge: true },
  { id: 'shelf', name: 'Полкодержатель Ø5, гл. 12, шаг 32', dia: 5, depth: 12, count: 5, step: 32 },
  { id: 'cam', name: 'Эксцентрик Ø15, гл. 13', dia: 15, depth: 13 },
  { id: 'camRod', name: 'Шток эксцентрика в торец Ø8, гл. 34', dia: 8, depth: 34, edge: true },
  { id: 'handle', name: 'Ручка Ø5, сквозное', dia: 5, depth: 0, through: true },
];
export const CUT_PRESETS = [
  { id: 'custom', name: 'Свой вырез', cw: 100, ch: 60, depth: 0, through: true },
  { id: 'slot', name: 'Овальный паз (скруглённые концы)', cw: 80, ch: 12, r: 6, depth: 0, through: true },
  { id: 'round', name: 'Вырез со скруглёнными углами R10', cw: 200, ch: 100, r: 10, depth: 0, through: true },
  { id: 'hdf', name: 'Паз под ХДФ: ширина 4, глубина 8', cw: 4, ch: 0, depth: 8, through: false, groove: true },
  { id: 'pipe', name: 'Вырез под трубу / плинтус', cw: 80, ch: 100, depth: 0, through: true },
  { id: 'vent', name: 'Вентиляционный вырез', cw: 400, ch: 60, depth: 0, through: true },
  { id: 'socket', name: 'Под розетку / провод', cw: 70, ch: 70, depth: 0, through: true },
];

// Петли: чашка Ø dia, глубина depth, C — расстояние от края фасада до края чашки
export const HINGES = [
  { id: 'blum', name: 'Blum Clip top — Ø35, C=5', dia: 35, depth: 13, C: 5 },
  { id: 'hettich', name: 'Hettich Sensys — Ø35, C=5', dia: 35, depth: 13, C: 5 },
  { id: 'gtv', name: 'GTV — Ø35, C=4', dia: 35, depth: 12, C: 4 },
  { id: 'boyard', name: 'Boyard — Ø35, C=4', dia: 35, depth: 11.5, C: 4 },
  { id: 'mini', name: 'Мини-петля — Ø26, C=4', dia: 26, depth: 11, C: 4 },
  { id: 'none', name: 'Без петель' },
];
export const CORNER_SHAPES = [['chamfer', 'Скос (прямой срез)'], ['round', 'Скругление угла'], ['cove', 'Вырез радиусом (внутрь)']];

// Прямоугольник со скруглёнными углами (точки по кругу, от левого нижнего угла)
function roundedRect(cw, ch, r, n = 8) {
  r = Math.min(+r || 0, cw / 2, ch / 2);
  if (r <= 0.01) return [[0, 0], [cw, 0], [cw, ch], [0, ch]];
  const pts = [];
  const arc = (cx, cy, a0) => { for (let k = 0; k <= n; k++) { const a = a0 + Math.PI / 2 * k / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
  arc(cw - r, r, -Math.PI / 2); arc(cw - r, ch - r, 0); arc(r, ch - r, Math.PI / 2); arc(r, r, Math.PI);
  return pts;
}
// Точки контура выреза на пласти (с поворотом и скруглением)
export function cutPts(o) {
  const a = THREE.MathUtils.degToRad(o.angle || 0), c = Math.cos(a), sn = Math.sin(a);
  return roundedRect(o.cw, o.ch, o.r).map(([p, q]) => [o.u + p * c - q * sn, o.v + p * sn + q * c]);
}
// Срез угла в «каноническом» левом нижнем углу: линия от (размер, 0) до (0, размер)
function cornerCanon(o, n = 12) {
  const shape = o.shape || 'chamfer', R = o.a;
  if (shape === 'chamfer') return [[o.a, 0], [0, o.b]];
  const pts = [];
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    if (shape === 'round') { const a = -Math.PI / 2 - t * Math.PI / 2; pts.push([R + R * Math.cos(a), R + R * Math.sin(a)]); }
    else { const a = t * Math.PI / 2; pts.push([R * Math.cos(a), R * Math.sin(a)]); }
  }
  return pts;
}

export function thinAxis(it) { return ['x', 'y', 'z'].reduce((a, c) => it[AX[c]] < it[AX[a]] ? c : a, 'x'); }
export function frame(it) {
  const N = thinAxis(it), { U, V } = FRAMES[N];
  const eU = new THREE.Vector3(...UNIT[U]), eV = new THREE.Vector3(...UNIT[V]), eN = new THREE.Vector3(...UNIT[N]);
  return { N, U, V, SU: it[AX[U]], SV: it[AX[V]], T: it[AX[N]], det: eU.dot(eV.clone().cross(eN)), names: SIDE_NAMES[N] };
}

// Повторы (ряд отверстий с шагом): смещения вдоль U или V
function instances(op) {
  const n = Math.max(1, op.count | 0), out = [];
  for (let k = 0; k < n; k++) out.push(k * (+op.step || 0));
  return out;
}

// ---------------------------------------------------------------- 3D: деталь с настоящими отверстиями
const ev = new Evaluator();
ev.attributes = ['position', 'normal'];
ev.useGroups = false;
const geoCache = new Map();

// Переносит геометрию из координат детали (U, V, N от угла) в координаты 3D-бокса (центр в нуле)
function mapGeo(g, fr) {
  g = g.index ? g.toNonIndexed() : g;
  if (g.getAttribute('uv')) g.deleteAttribute('uv');
  const p = g.getAttribute('position'), nrm = g.getAttribute('normal');
  const half = { [fr.U]: fr.SU / 2, [fr.V]: fr.SV / 2, [fr.N]: fr.T / 2 };
  const put = (attr, i, a, b, c, shift) => {
    const o = { [fr.U]: a, [fr.V]: b, [fr.N]: c };
    attr.setXYZ(i, o.x - (shift ? half.x : 0), o.y - (shift ? half.y : 0), o.z - (shift ? half.z : 0));
  };
  for (let i = 0; i < p.count; i++) {
    put(p, i, p.getX(i), p.getY(i), p.getZ(i), true);
    put(nrm, i, nrm.getX(i), nrm.getY(i), nrm.getZ(i), false);
  }
  if (fr.det < 0) {  // зеркальная перестановка осей — меняем обход треугольников, чтобы нормали смотрели наружу
    for (const attr of [p, nrm]) for (let i = 0; i < attr.count; i += 3) {
      const a = [attr.getX(i + 1), attr.getY(i + 1), attr.getZ(i + 1)];
      attr.setXYZ(i + 1, attr.getX(i + 2), attr.getY(i + 2), attr.getZ(i + 2));
      attr.setXYZ(i + 2, ...a);
    }
  }
  return g;
}
const cyl = (r, len) => new THREE.CylinderGeometry(r, r, len, Math.max(16, Math.min(48, Math.round(r * 3))));

// Фрезы для вычитания — в координатах детали
function cutters(op, fr) {
  const { SU, SV, T } = fr, out = [];
  if (op.type === 'hole') {
    const r = Math.max(0.5, op.dia / 2);
    for (const off of instances(op)) {
      if (op.face === 'A' || op.face === 'B') {
        const len = op.through ? T + 2 : op.depth + 1;
        const nc = op.through ? T / 2 : op.face === 'A' ? T - op.depth / 2 + 0.5 : op.depth / 2 - 0.5;
        const u = op.u + (op.dir === 'v' ? 0 : off), v = op.v + (op.dir === 'v' ? off : 0);
        out.push(cyl(r, len).rotateX(Math.PI / 2).translate(u, v, nc));
      } else {
        const len = op.depth + 1, s = op.s + off, o = op.o;
        if (op.face === 'U0') out.push(cyl(r, len).rotateZ(Math.PI / 2).translate((op.depth - 1) / 2, s, o));
        if (op.face === 'U1') out.push(cyl(r, len).rotateZ(Math.PI / 2).translate(SU - (op.depth - 1) / 2, s, o));
        if (op.face === 'V0') out.push(cyl(r, len).translate(s, (op.depth - 1) / 2, o));
        if (op.face === 'V1') out.push(cyl(r, len).translate(s, SV - (op.depth - 1) / 2, o));
      }
    }
  } else if (op.type === 'cut') {
    const len = op.through ? T + 2 : op.depth + 1;
    const nc = op.through ? T / 2 : op.face === 'A' ? T - op.depth / 2 + 0.5 : op.depth / 2 - 0.5;
    const pts = roundedRect(Math.max(op.cw, 0.5), Math.max(op.ch, 0.5), op.r);
    const b = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([p, q]) => new THREE.Vector2(p, q))), { depth: len, bevelEnabled: false, curveSegments: 4 });
    b.translate(0, 0, nc - len / 2).rotateZ(THREE.MathUtils.degToRad(op.angle || 0)).translate(op.u, op.v, 0);
    out.push(b);
  } else if (op.type === 'corner') {
    const cp = cornerCanon(op), first = cp[0], last = cp[cp.length - 1];
    const sh = new THREE.Shape([[first[0], -20], ...cp, [-20, last[1]], [-20, -20]].map(([p, q]) => new THREE.Vector2(p, q)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: T + 4, bevelEnabled: false }).translate(0, 0, -2);
    const right = op.corner[0] === 'R', top = op.corner[1] === 'T';
    // зеркалим угол в нужную сторону поворотами (без отражений): правый — поворот вокруг V, верхний — вокруг U
    if (right && top) g.rotateZ(Math.PI).translate(SU, SV, 0);
    else if (right) g.rotateY(Math.PI).translate(SU, 0, T);
    else if (top) g.rotateX(Math.PI).translate(0, SV, T);
    out.push(g);
  }
  return out;
}

// Геометрия детали с обработкой (кэш по размерам и операциям); null — если обработки нет
export function panelGeometry(it) {
  if (!it.ops || !it.ops.length) return null;
  const key = `${it.w}|${it.h}|${it.d}|${JSON.stringify(it.ops)}`;
  if (geoCache.has(key)) return geoCache.get(key);
  const fr = frame(it);
  let res;
  try {
    const base = new THREE.BoxGeometry(it.w, it.h, it.d); base.deleteAttribute('uv');
    res = new Brush(base); res.updateMatrixWorld();
    for (const op of it.ops) for (const c of cutters(op, fr)) {
      const b = new Brush(mapGeo(c, fr)); b.updateMatrixWorld();
      res = ev.evaluate(res, b, SUBTRACTION);
    }
  } catch (e) {
    console.warn('CSG:', e);
    return null;
  }
  const out = { geo: res.geometry, edges: featureEdges(it, fr) };
  if (geoCache.size > 400) geoCache.clear();
  geoCache.set(key, out);
  return out;
}

// Контурные линии детали: края (со срезанными углами), окружности отверстий, края вырезов.
// Рёбра результата вычитания не годятся — на плоских гранях видны линии разбиения на треугольники.
export function outline(fr, ops) {
  const { SU, SV } = fr, corners = {};
  ops.forEach(o => { if (o.type === 'corner') corners[o.corner] = o; });
  // обход против часовой стрелки: ЛН → ПН → ПВ → ЛВ
  const pc = key => {
    let p = corners[key] ? cornerCanon(corners[key]) : [[0, 0]];
    p = p.map(([u, v]) => [key[0] === 'R' ? SU - u : u, key[1] === 'T' ? SV - v : v]);
    if (key === 'LB' || key === 'RT') p.reverse();
    return p;
  };
  const pts = [...pc('LB'), ...pc('RB'), ...pc('RT'), ...pc('LT')];
  return pts.filter((p, i) => { const q = pts[(i + pts.length - 1) % pts.length]; return Math.abs(p[0] - q[0]) > 1e-6 || Math.abs(p[1] - q[1]) > 1e-6; });
}
function featureEdges(it, fr) {
  const { SU, SV, T } = fr, ops = it.ops || [], seg = [];
  const loop = (pts, close = true) => { for (let i = 0; i < pts.length - (close ? 0 : 1); i++) seg.push(pts[i], pts[(i + 1) % pts.length]); };
  const circle = (fn, r, n = 32) => loop(Array.from({ length: n }, (_, k) => fn(r * Math.cos(2 * Math.PI * k / n), r * Math.sin(2 * Math.PI * k / n))));
  const ol = outline(fr, ops);
  loop(ol.map(([u, v]) => [u, v, 0])); loop(ol.map(([u, v]) => [u, v, T]));
  ol.forEach(([u, v]) => seg.push([u, v, 0], [u, v, T]));
  for (const o of ops) {
    if (o.type === 'hole') {
      const r = Math.max(0.5, o.dia / 2);
      for (const off of instances(o)) {
        if (o.face === 'A' || o.face === 'B') {
          const u = o.u + (o.dir === 'v' ? 0 : off), v = o.v + (o.dir === 'v' ? off : 0);
          const ns = o.through ? [0, T] : [o.face === 'A' ? T : 0];
          ns.forEach(n => circle((a, b) => [u + a, v + b, n], r));
        } else {
          const p = o.s + off;
          if (o.face === 'U0') circle((a, b) => [0, p + a, o.o + b], r);
          if (o.face === 'U1') circle((a, b) => [SU, p + a, o.o + b], r);
          if (o.face === 'V0') circle((a, b) => [p + a, 0, o.o + b], r);
          if (o.face === 'V1') circle((a, b) => [p + a, SV, o.o + b], r);
        }
      }
    } else if (o.type === 'cut') {
      const pts = cutPts(o);
      const ns = o.through ? [0, T] : [o.face === 'A' ? T : 0];
      ns.forEach(n => loop(pts.map(([u, v]) => [u, v, n])));
    }
  }
  const half = { [fr.U]: SU / 2, [fr.V]: SV / 2, [fr.N]: T / 2 };
  const arr = new Float32Array(seg.length * 3);
  seg.forEach(([u, v, n], i) => {
    const o = { [fr.U]: u, [fr.V]: v, [fr.N]: n };
    arr[i * 3] = o.x - half.x; arr[i * 3 + 1] = o.y - half.y; arr[i * 3 + 2] = o.z - half.z;
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  return g;
}

// ---------------------------------------------------------------- описание операции
const f = v => String(Math.round(v * 10) / 10).replace('.', ',');
export function describeOp(op, it) {
  const n = frame(it).names;
  const rep = (op.count | 0) > 1 ? `, ${op.count} шт. шаг ${f(op.step)}` : '';
  if (op.type === 'hole') {
    const depth = op.through ? 'сквозное' : `гл. ${f(op.depth)}`;
    const pos = op.face === 'A' || op.face === 'B' ? `${f(op.u)}; ${f(op.v)}` : `${f(op.s)} вдоль, ${f(op.o)} ${fromName(n.B)}`;
    return `Отверстие Ø${f(op.dia)} ${depth} — ${n[op.face]} (${pos})${rep}`;
  }
  if (op.type === 'cut') {
    const depth = op.through ? 'насквозь' : `гл. ${f(op.depth)}`;
    return `Вырез ${f(op.cw)}×${f(op.ch)}${op.r ? ` R${f(op.r)}` : ''} ${depth}${op.angle ? `, угол ${f(op.angle)}°` : ''} — ${n[op.face]} (${f(op.u)}; ${f(op.v)})`;
  }
  if (op.type === 'corner') {
    const where = { LB: 'левый нижний', LT: 'левый верхний', RB: 'правый нижний', RT: 'правый верхний' }[op.corner];
    if (op.shape === 'round') return `Скругление угла R${f(op.a)}: ${where}`;
    if (op.shape === 'cove') return `Вырез радиусом R${f(op.a)}: ${where} угол`;
    return `Срез угла ${where}: ${f(op.a)} × ${f(op.b)}`;
  }
  return '';
}

// ---------------------------------------------------------------- чертёж детали (SVG)
// Возвращает { svg, map } — map нужен, чтобы переводить клик по чертежу в мм
export function drawingSVG(it, { width = 760, height = 520, ops = it.ops || [], hl = -1 } = {}) {
  const fr = frame(it), { SU, SV, T, names } = fr;
  const pad = { l: 92, r: 96, t: 86, b: 76 };
  const s = Math.min((width - pad.l - pad.r) / SU, (height - pad.t - pad.b) / SV);
  const X = u => pad.l + u * s, Y = v => pad.t + (SV - v) * s;
  const ink = '#1d1a16', blue = '#1f5fb4', hlc = '#d9770f';
  let g = '';

  // контур с учётом срезанных углов
  const pts = outline(fr, ops);
  g += `<polygon points="${pts.map(([u, v]) => `${X(u).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')}" fill="#fbf8f2" stroke="${ink}" stroke-width="1.6"/>`;

  const us = new Set(), vs = new Set();
  const mark = (k, x, y, color) => { g += `<g><circle cx="${x + 12}" cy="${y - 12}" r="8" fill="#fff" stroke="${color}"/><text x="${x + 12}" y="${y - 8.5}" font-size="10" text-anchor="middle" fill="${color}">${k + 1}</text></g>`; };
  ops.forEach((o, k) => {
    const color = k === hl ? hlc : blue, dash = o.face === 'B' && !o.through ? ' stroke-dasharray="4 3"' : '';
    if (o.type === 'hole' && (o.face === 'A' || o.face === 'B')) {
      const r = Math.max(2, o.dia / 2 * s);
      instances(o).forEach((off, j) => {
        const u = o.u + (o.dir === 'v' ? 0 : off), v = o.v + (o.dir === 'v' ? off : 0);
        us.add(u); vs.add(v);
        g += `<circle cx="${X(u)}" cy="${Y(v)}" r="${r}" fill="${o.through ? '#e8e2d6' : 'none'}" stroke="${color}" stroke-width="1.3"${dash}/>`;
        g += `<path d="M${X(u) - r - 3} ${Y(v)}h${2 * r + 6}M${X(u)} ${Y(v) - r - 3}v${2 * r + 6}" stroke="${color}" stroke-width=".6"/>`;
        if (j === 0) mark(k, X(u) + r * 0.7, Y(v) - r * 0.7, color);
      });
    } else if (o.type === 'hole') {
      const r = Math.max(1.5, o.dia / 2 * s), dp = o.depth * s;
      instances(o).forEach((off, j) => {
        const p = o.s + off;
        let x, y, w, h;
        if (o.face === 'U0') { x = X(0); y = Y(p) - r; w = dp; h = 2 * r; vs.add(p); }
        if (o.face === 'U1') { x = X(SU) - dp; y = Y(p) - r; w = dp; h = 2 * r; vs.add(p); }
        if (o.face === 'V0') { x = X(p) - r; y = Y(0) - dp; w = 2 * r; h = dp; us.add(p); }
        if (o.face === 'V1') { x = X(p) - r; y = Y(SV); w = 2 * r; h = dp; us.add(p); }
        g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${color}" stroke-width="1.2" stroke-dasharray="4 3"/>`;
        if (j === 0) mark(k, x + w / 2, y, color);
      });
    } else if (o.type === 'cut') {
      const pts = cutPts(o);
      us.add(o.u); vs.add(o.v);
      g += `<polygon points="${pts.map(([u, v]) => `${X(u).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')}" fill="${o.through ? '#e8e2d6' : 'rgba(31,95,180,.08)'}" stroke="${color}" stroke-width="1.3"${dash}/>`;
      const top = pts.reduce((a, p) => (p[1] > a[1] || (p[1] === a[1] && p[0] > a[0]) ? p : a), pts[0]);
      mark(k, X(top[0]), Y(top[1]), color);
    } else if (o.type === 'corner') {
      const bb = o.shape && o.shape !== 'chamfer' ? o.a : o.b;
      const cx = o.corner[0] === 'R' ? SU - o.a / 2 : o.a / 2, cy = o.corner[1] === 'T' ? SV - bb / 2 : bb / 2;
      us.add(o.corner[0] === 'R' ? SU - o.a : o.a); vs.add(o.corner[1] === 'T' ? SV - bb : bb);
      mark(k, X(cx) - 12, Y(cy) + 12, color);
    }
  });

  // размеры: общий габарит снизу и слева
  const dimH = Y(0) + 44, dimV = X(0) - 58;
  g += `<path d="M${X(0)} ${Y(0) + 6}V${dimH + 6}M${X(SU)} ${Y(0) + 6}V${dimH + 6}M${X(0)} ${dimH}H${X(SU)}" stroke="${ink}" stroke-width=".8" marker-start="url(#ar)" marker-end="url(#ar)"/>`;
  g += `<text x="${(X(0) + X(SU)) / 2}" y="${dimH - 5}" font-size="13" text-anchor="middle" font-weight="600">${f(SU)}</text>`;
  g += `<path d="M${X(0) - 6} ${Y(0)}H${dimV - 6}M${X(0) - 6} ${Y(SV)}H${dimV - 6}M${dimV} ${Y(0)}V${Y(SV)}" stroke="${ink}" stroke-width=".8"/>`;
  g += `<text x="${dimV - 6}" y="${(Y(0) + Y(SV)) / 2}" font-size="13" text-anchor="middle" font-weight="600" transform="rotate(-90 ${dimV - 6} ${(Y(0) + Y(SV)) / 2})">${f(SV)}</text>`;
  // координаты обработки: сверху — по U, справа — по V (от левого нижнего угла)
  [...us].sort((a, b) => a - b).forEach(u => {
    g += `<path d="M${X(u)} ${Y(SV) - 4}V${Y(SV) - 14}" stroke="${blue}" stroke-width=".8"/>`;
    g += `<text x="${X(u) + 3.5}" y="${Y(SV) - 17}" font-size="10.5" fill="${blue}" transform="rotate(-90 ${X(u) + 3.5} ${Y(SV) - 17})">${f(u)}</text>`;
  });
  [...vs].sort((a, b) => a - b).forEach(v => {
    g += `<path d="M${X(SU) + 4} ${Y(v)}H${X(SU) + 14}" stroke="${blue}" stroke-width=".8"/>`;
    g += `<text x="${X(SU) + 17}" y="${Y(v) + 3.5}" font-size="10.5" fill="${blue}">${f(v)}</text>`;
  });
  // названия торцов
  const lbl = 'font-size="10.5" fill="#7a7266" font-style="italic"';
  g += `<text x="${(X(0) + X(SU)) / 2}" y="${Y(0) + 17}" text-anchor="middle" ${lbl}>${names.V0}</text>`;
  g += `<text x="${X(0)}" y="${pad.t - 50}" ${lbl}>↑ ${names.V1}</text>`;
  g += `<text x="${X(0) - 14}" y="${(Y(0) + Y(SV)) / 2}" text-anchor="middle" ${lbl} transform="rotate(-90 ${X(0) - 14} ${(Y(0) + Y(SV)) / 2})">${names.U0}</text>`;
  g += `<text x="${width - 10}" y="${(Y(0) + Y(SV)) / 2}" text-anchor="middle" ${lbl} transform="rotate(90 ${width - 10} ${(Y(0) + Y(SV)) / 2})">${names.U1}</text>`;
  g += `<text x="${X(0)}" y="${height - 8}" font-size="11" fill="#5a5348">Вид на ${names.A} · толщина ${f(T)} мм · сплошные линии — со стороны «${names.A}», пунктир — с обратной стороны или в торце · координаты — от левого нижнего угла</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="Segoe UI, Arial, sans-serif" fill="${ink}">
<defs><marker id="ar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 2L10 5L0 8" fill="none" stroke="${ink}"/></marker></defs>
<rect width="100%" height="100%" fill="#fff"/>${g}</svg>`;
  return { svg, map: { s, x0: pad.l, y0: pad.t, SU, SV } };
}
