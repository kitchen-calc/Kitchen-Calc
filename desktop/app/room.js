// Комната: контур пола (точки на плане, мм), высота стен, проёмы (двери, окна) и колонны.
// План: X — вправо вдоль задней стены, Z — от задней стены к нам. Стена i идёт от точки i к точке i+1 (последняя замыкает контур).
import * as THREE from 'three';

export const OPENING_TYPES = {
  door: { name: 'Дверь', w: 800, h: 2100, sill: 0 },
  window: { name: 'Окно', w: 1200, h: 1400, sill: 900 },
  balcony: { name: 'Балконный блок', w: 1500, h: 2100, sill: 0 },
  arch: { name: 'Проём / арка', w: 900, h: 2100, sill: 0 },
};

export const ROOM_PRESETS = [
  { id: 'rect', name: 'Прямоугольная', note: '3,6 × 3 м', pts: [[0, 0], [3600, 0], [3600, 3000], [0, 3000]],
    openings: [{ wall: 2, type: 'door', off: 400, w: 800, h: 2100, sill: 0 }, { wall: 1, type: 'window', off: 900, w: 1200, h: 1400, sill: 900 }] },
  { id: 'L', name: 'Г-образная', note: 'с выступом 1,4 × 1,5 м', pts: [[0, 0], [4000, 0], [4000, 2000], [2600, 2000], [2600, 3500], [0, 3500]],
    openings: [{ wall: 1, type: 'window', off: 400, w: 1200, h: 1400, sill: 900 }, { wall: 4, type: 'door', off: 900, w: 900, h: 2100, sill: 0 }] },
  { id: 'bevel', name: 'Со скошенным углом', note: 'кухня-эркер, колонна', pts: [[0, 0], [3000, 0], [3800, 800], [3800, 3200], [0, 3200]],
    openings: [{ wall: 1, type: 'window', off: 160, w: 800, h: 1400, sill: 900 }, { wall: 3, type: 'arch', off: 1200, w: 1200, h: 2100, sill: 0 }],
    columns: [{ x: 0, z: 1400, w: 400, d: 400, h: 0 }] },
];

const r1 = v => Math.round(v * 10) / 10;
// Площадь со знаком: > 0 — обход по часовой на плане (X вправо, Z к нам) — «внутрь» справа
const area2 = pts => pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + (p[0] * q[1] - q[0] * p[1]); }, 0);

// Приводит комнату к полному виду; старые проекты ({w, d, h}) становятся прямоугольником
export function normRoom(r) {
  r = r || {};
  if (!Array.isArray(r.pts) || r.pts.length < 3) {
    const w = +r.w || 3600, d = +r.d || 3000;
    r.pts = [[0, 0], [w, 0], [w, d], [0, d]];
  }
  r.h = +r.h || 2700;
  r.t = +r.t || 120;
  r.openings = Array.isArray(r.openings) ? r.openings.filter(o => o.wall < r.pts.length) : [];
  r.columns = Array.isArray(r.columns) ? r.columns : [];
  r.floor = r.floor || null; r.wall = r.wall || null; r.wallMats = r.wallMats || {};   // покрытия: декоры из materials.js
  r.w = Math.max(...r.pts.map(p => p[0])); r.d = Math.max(...r.pts.map(p => p[1]));
  return r;
}
// Сдвигаем контур так, чтобы левый задний угол был в 0; обход — всегда по часовой
export function tidyPts(pts) {
  if (area2(pts) < 0) pts = [pts[0], ...pts.slice(1).reverse()];
  const mx = Math.min(...pts.map(p => p[0])), mz = Math.min(...pts.map(p => p[1]));
  return pts.map(p => [r1(p[0] - mx), r1(p[1] - mz)]);
}
export const wallLen = (pts, i) => { const a = pts[i], b = pts[(i + 1) % pts.length]; return Math.hypot(b[0] - a[0], b[1] - a[1]); };

// Стены «по длинам и поворотам»: [{ len, turn }], turn — поворот после стены, ° (+ вправо, − влево). Последняя стена замыкает контур сама.
export function wallsToPts(walls) {
  const pts = [[0, 0]]; let a = 0;
  for (const w of walls) {
    const p = pts[pts.length - 1];
    pts.push([p[0] + Math.cos(a) * w.len, p[1] + Math.sin(a) * w.len]);
    a += (w.turn || 0) * Math.PI / 180;
  }
  // от конца последней стены к началу — замыкающая стена, её строит сам контур
  return pts.length >= 3 ? tidyPts(pts.map(p => [r1(p[0]), r1(p[1])])) : null;
}
// Обратно: контур → стены (кроме замыкающей), чтобы уточнять нарисованное цифрами
export function ptsToWalls(pts) {
  const n = pts.length, out = [];
  for (let i = 0; i < n - 1; i++) {
    const a = pts[i], b = pts[i + 1], c = pts[(i + 2) % n];
    const a1 = Math.atan2(b[1] - a[1], b[0] - a[0]), a2 = Math.atan2(c[1] - b[1], c[0] - b[0]);
    let t = (a2 - a1) * 180 / Math.PI; while (t > 180) t -= 360; while (t <= -180) t += 360;
    out.push({ len: r1(wallLen(pts, i)), turn: Math.round(t * 10) / 10 });
  }
  return out;
}
// Проверка контура: стены не пересекаются, нет нулевых
export function checkPts(pts) {
  if (!pts || pts.length < 3) return 'Нужно хотя бы 3 стены';
  const n = pts.length;
  for (let i = 0; i < n; i++) if (wallLen(pts, i) < 100) return `Стена ${i + 1} короче 10 см`;
  const X = (p, q, r, s) => { const d = (q[0] - p[0]) * (s[1] - r[1]) - (q[1] - p[1]) * (s[0] - r[0]); if (Math.abs(d) < 1e-9) return false;
    const t = ((r[0] - p[0]) * (s[1] - r[1]) - (r[1] - p[1]) * (s[0] - r[0])) / d, u = ((r[0] - p[0]) * (q[1] - p[1]) - (r[1] - p[1]) * (q[0] - p[0])) / d; return t > 1e-6 && t < 1 - 1e-6 && u > 1e-6 && u < 1 - 1e-6; };
  for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
    if (i === 0 && j === n - 1) continue;
    if (X(pts[i], pts[(i + 1) % n], pts[j], pts[(j + 1) % n])) return `Стены ${i + 1} и ${j + 1} пересекаются`;
  }
  return '';
}
export function checkOpening(r, o) {
  const L = wallLen(r.pts, o.wall);
  if (o.off < 0 || o.off + o.w > L + 0.5) return `${OPENING_TYPES[o.type].name} не помещается на стене ${o.wall + 1} (длина ${Math.round(L / 10)} см)`;
  if (o.sill + o.h > r.h) return `${OPENING_TYPES[o.type].name} выше потолка`;
  return '';
}

// Неподвижные препятствия для мебели: колонны и прямые стены (мебель в них не заходит)
export function roomObstacles(r) {
  const out = r.columns.map((c, k) => ({ id: 'col' + k, name: 'Колонна', x: c.x, y: 0, z: c.z, w: c.w, h: c.h > 0 ? c.h : r.h, d: c.d }));
  const n = r.pts.length, t = r.t;
  for (let i = 0; i < n; i++) {
    const a = r.pts[i], b = r.pts[(i + 1) % n];
    const ix = -(b[1] - a[1]), iz = b[0] - a[0];   // нормаль внутрь комнаты (обход по часовой); стена — снаружи линии
    if (Math.abs(a[0] - b[0]) < 0.5) out.push({ id: 'wall' + i, name: `Стена ${i + 1}`, x: ix > 0 ? a[0] - t : a[0], y: 0, z: Math.min(a[1], b[1]), w: t, h: r.h, d: Math.abs(b[1] - a[1]) });
    else if (Math.abs(a[1] - b[1]) < 0.5) out.push({ id: 'wall' + i, name: `Стена ${i + 1}`, x: Math.min(a[0], b[0]), y: 0, z: iz > 0 ? a[1] - t : a[1], w: Math.abs(b[0] - a[0]), h: r.h, d: t });
    else {   // косая стена — «лесенкой» из брусков по 50 мм снаружи линии
      const L = wallLen(r.pts, i), ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L, st = 50, n = Math.ceil(L / st);
      const dx = st * Math.abs(ux) + t, dz = st * Math.abs(uz) + t;
      for (let k = 0; k <= n; k++) {
        const px = a[0] + ux * Math.min(L, k * st), pz = a[1] + uz * Math.min(L, k * st);
        out.push({ id: `wall${i}_${k}`, name: `Стена ${i + 1}`, x: ix > 0 ? px - dx : px, y: 0, z: iz > 0 ? pz - dz : pz, w: dx, h: r.h, d: dz });
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------- 3D
const M = {
  wall: new THREE.MeshStandardMaterial({ color: 0xf3f0ea, roughness: 1 }),
  floor: new THREE.MeshStandardMaterial({ color: 0xd3ccc0, roughness: 1 }),
  glass: new THREE.MeshStandardMaterial({ color: 0xa9cfe6, roughness: 0.1, metalness: 0, transparent: true, opacity: 0.35, depthWrite: false }),
  frame: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }),
  door: new THREE.MeshStandardMaterial({ color: 0x9b7a55, roughness: 0.7 }),
};
export const roomMaterials = M;
const doorMats = new Map(), doorMat = c => { if (!doorMats.has(c)) doorMats.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 })); return doorMats.get(c); };
function boxAt(x0, y0, z0, w, h, d, m) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x0 + w / 2, y0 + h / 2, z0 + d / 2); return b; }

// Пол (по контуру), сетка 100 мм внутри комнаты, стены с проёмами, колонны. Стены — отдельные группы с нормалью наружу:
// в 3D те, что между камерой и комнатой, прячутся (вид «в разрезе»).
export function buildRoom3D(r, { floorMat, wallMatOf = () => null } = {}) {
  const g = new THREE.Group(), n = r.pts.length, t = r.t;
  const shape = new THREE.Shape(r.pts.map(p => new THREE.Vector2(p[0], -p[1])));
  const floor = new THREE.Mesh(new THREE.ShapeGeometry(shape), floorMat || M.floor);
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.5; floor.name = 'floor'; floor.userData.surface = 'floor'; g.add(floor);
  // сетка: каждая линия обрезается по контуру (чётно-нечётное правило)
  const lines = [], cut = (axis, c) => {
    const xs = [];
    for (let i = 0; i < n; i++) {
      const a = r.pts[i], b = r.pts[(i + 1) % n], ka = axis ? a[0] : a[1], kb = axis ? b[0] : b[1];
      if ((ka <= c) !== (kb <= c) && ka !== kb) { const s = (c - ka) / (kb - ka); xs.push(axis ? a[1] + s * (b[1] - a[1]) : a[0] + s * (b[0] - a[0])); }
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) lines.push(...(axis ? [c, 0.2, xs[k], c, 0.2, xs[k + 1]] : [xs[k], 0.2, c, xs[k + 1], 0.2, c]));
  };
  for (let x = 100; x < r.w; x += 100) cut(1, x);
  for (let z = 100; z < r.d; z += 100) cut(0, z);
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
  const grid = new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: 0xb9b09f, transparent: true, opacity: 0.55 })); grid.name = 'grid'; g.add(grid);

  const walls = new THREE.Group(); walls.name = 'walls'; g.add(walls);
  const convex = i => { const p = r.pts[(i - 1 + n) % n], a = r.pts[i], b = r.pts[(i + 1) % n]; return (a[0] - p[0]) * (b[1] - a[1]) - (a[1] - p[1]) * (b[0] - a[0]) > 0; };
  for (let i = 0; i < n; i++) {
    const a = r.pts[i], b = r.pts[(i + 1) % n], L = wallLen(r.pts, i);
    const ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
    const e0 = convex(i) ? t : 0, e1 = convex((i + 1) % n) ? t : 0;   // наружные углы закрываем продлением стены
    const s = new THREE.Shape([new THREE.Vector2(-e0, 0), new THREE.Vector2(L + e1, 0), new THREE.Vector2(L + e1, r.h), new THREE.Vector2(-e0, r.h)]);
    const ops = r.openings.filter(o => o.wall === i);
    for (const o of ops) s.holes.push(new THREE.Path([new THREE.Vector2(o.off, o.sill), new THREE.Vector2(o.off, o.sill + o.h), new THREE.Vector2(o.off + o.w, o.sill + o.h), new THREE.Vector2(o.off + o.w, o.sill)]));
    const wg = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false }), wallMatOf(i) || M.wall);
    mesh.name = 'wall'; mesh.userData.surface = 'wall'; mesh.userData.wall = i; wg.add(mesh);
    for (const o of ops) {   // окна — стекло, подоконник, рама; двери — коробка и полотно
      const c0 = wg.children.length;
      if (o.type === 'window' || o.type === 'balcony') {
        wg.add(boxAt(o.off, o.sill, t * 0.45, o.w, o.h, 6, M.glass));
        for (const [x, w] of [[o.off, 50], [o.off + o.w - 50, 50], [o.off + o.w / 2 - 25, 50]]) wg.add(boxAt(x, o.sill, t * 0.35, w, o.h, 60, M.frame));
        for (const y of [o.sill, o.sill + o.h - 50]) wg.add(boxAt(o.off, y, t * 0.35, o.w, 50, 60, M.frame));
        if (o.type === 'window') wg.add(boxAt(o.off - 50, o.sill - 20, -200, o.w + 100, 20, 200 + t * 0.4, M.frame));   // подоконник
      } else if (o.type === 'door') {
        for (const [x, w] of [[o.off - 70, 70], [o.off + o.w, 70]]) wg.add(boxAt(x, 0, -10, w, o.h + 70, 10, M.frame));
        wg.add(boxAt(o.off - 70, o.h, -10, o.w + 140, 70, 10, M.frame));
        wg.add(boxAt(o.off, 0, t * 0.3, o.w, o.h, 40, o.color ? doorMat(o.color) : M.door));   // color — свой цвет полотна
      }
      for (let j = c0; j < wg.children.length; j++) wg.children[j].userData = { surface: 'opening', op: r.openings.indexOf(o) };   // за эти детали проём тянут мышью в 3D
    }
    // локальные оси: X — вдоль стены, Y — вверх, Z — наружу из комнаты
    // (базис зеркальный — three.js сам разворачивает грани при отрицательном определителе)
    const out = new THREE.Vector3(uz, 0, -ux);
    wg.matrixAutoUpdate = false;
    wg.matrix.makeBasis(new THREE.Vector3(ux, 0, uz), new THREE.Vector3(0, 1, 0), out);
    wg.matrix.setPosition(a[0], 0, a[1]);
    wg.userData = { normal: out, mid: new THREE.Vector3((a[0] + b[0]) / 2, r.h / 2, (a[1] + b[1]) / 2) };
    walls.add(wg);
  }
  r.columns.forEach((c, k) => { const col = boxAt(c.x, 0, c.z, c.w, c.h > 0 ? c.h : r.h, c.d, wallMatOf('col') || M.wall); col.name = 'column'; col.userData = { surface: 'column', col: k }; walls.add(col); });
  return g;
}

// ---------------------------------------------------------------- план для окна «Комната»
export function roomSVG(r, { width = 520, height = 380, draft = null, cursor = null, box = null, labels = true } = {}) {
  const pts = draft || r.pts, n = pts.length;
  const xs = pts.map(p => p[0]).concat(cursor ? [cursor[0]] : [], 0, 1000), zs = pts.map(p => p[1]).concat(cursor ? [cursor[1]] : [], 0, 1000);
  const [x0, z0, x1, z1] = box || [Math.min(...xs) - 600, Math.min(...zs) - 600, Math.max(...xs) + 600, Math.max(...zs) + 600];
  const s = Math.min(width / (x1 - x0), height / (z1 - z0));
  const X = x => ((x - x0) * s).toFixed(1), Z = z => ((z - z0) * s).toFixed(1);
  let g = '';
  for (let x = Math.ceil(x0 / 100) * 100; x <= x1; x += 100) g += `<line x1="${X(x)}" y1="0" x2="${X(x)}" y2="${height}" stroke="${x % 1000 ? '#ece6dc' : '#d6cdbf'}" stroke-width="${x % 1000 ? 0.5 : 1}"/>`;
  for (let z = Math.ceil(z0 / 100) * 100; z <= z1; z += 100) g += `<line x1="0" y1="${Z(z)}" x2="${width}" y2="${Z(z)}" stroke="${z % 1000 ? '#ece6dc' : '#d6cdbf'}" stroke-width="${z % 1000 ? 0.5 : 1}"/>`;
  if (draft) {
    const d = pts.map(p => `${X(p[0])},${Z(p[1])}`).join(' ') + (cursor ? ` ${X(cursor[0])},${Z(cursor[1])}` : '');
    g += `<polyline points="${d}" fill="none" stroke="#1f5fb4" stroke-width="3"/>`;
    pts.forEach((p, i) => { g += `<circle cx="${X(p[0])}" cy="${Z(p[1])}" r="${i ? 4 : 7}" fill="${i ? '#1f5fb4' : '#d9770f'}"/>`; });
    if (cursor && n) { const p = pts[n - 1], L = Math.hypot(cursor[0] - p[0], cursor[1] - p[1]); g += `<text x="${X((p[0] + cursor[0]) / 2)}" y="${(+Z((p[1] + cursor[1]) / 2) - 8).toFixed(1)}" font-size="13" font-weight="700" text-anchor="middle" fill="#1f5fb4">${Math.round(L / 10)} см</text>`; }
  } else {
    g += `<polygon points="${pts.map(p => `${X(p[0])},${Z(p[1])}`).join(' ')}" fill="#f6efe2" stroke="#1d1a16" stroke-width="${Math.max(3, r.t * s)}" stroke-linejoin="miter"/>`;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n], L = wallLen(pts, i), ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L;
      for (const o of r.openings.filter(o => o.wall === i)) {
        const p = [a[0] + ux * o.off, a[1] + uz * o.off], q = [a[0] + ux * (o.off + o.w), a[1] + uz * (o.off + o.w)];
        g += `<line x1="${X(p[0])}" y1="${Z(p[1])}" x2="${X(q[0])}" y2="${Z(q[1])}" stroke="${o.type === 'window' || o.type === 'balcony' ? '#7fb6dc' : '#f6efe2'}" stroke-width="${Math.max(3, r.t * s) + 1}"/>`;
        if (o.type === 'door') g += `<path d="M${X(p[0])} ${Z(p[1])} L${X(p[0] - uz * o.w)} ${Z(p[1] + ux * o.w)}" stroke="#9b7a55" stroke-width="1.5"/>`;
      }
      const mx = (a[0] + b[0]) / 2 - uz * 330, mz = (a[1] + b[1]) / 2 + ux * 330;   // подпись внутри комнаты
      if (!labels) continue;
      const k0 = Math.min(150, L * 0.1), k1 = Math.min(L * 0.3, k0 + 450), ax = a[0] - uz * 90, az = a[1] + ux * 90;   // стрелка: откуда считается «от начала»
      g += `<path d="M${X(ax + ux * k0)} ${Z(az + uz * k0)}L${X(ax + ux * k1)} ${Z(az + uz * k1)}" stroke="#1f5fb4" stroke-width="1.3" marker-end="url(#ra)"/>`;
      g += `<text x="${X(mx)}" y="${Z(mz)}" font-size="11.5" text-anchor="middle" dominant-baseline="middle" fill="#1d1a16"><tspan font-weight="700" fill="#1f5fb4">${i + 1}</tspan> · ${Math.round(L / 10)} см</text>`;
    }
    for (const c of r.columns) g += `<rect x="${X(c.x)}" y="${Z(c.z)}" width="${(c.w * s).toFixed(1)}" height="${(c.d * s).toFixed(1)}" fill="#8a8378"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="Segoe UI, Arial, sans-serif" data-x0="${x0}" data-z0="${z0}" data-s="${s}"><defs><marker id="ra" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 1L10 5L0 9z" fill="#1f5fb4"/></marker></defs><rect width="100%" height="100%" fill="#fff"/>${g}</svg>`;
}
