/* Конструктор шкафа PRO: модель, геометрия, список деталей, цена. Без DOM — можно проверять в node. Размеры в см. */

export const P = {
  mdfM2: 480000, plyM2: 520000, slatM3: 9500000, shapeK: 1.3,
  K: 1.55, Klabor: 1.25, laborM2: 260000, delivery: 250000,
  sheetArea: 2.75 * 1.83, waste: 1.15, cutM2: 7950, edgeM: 2500, hdfM2: 42000,
  glass: { mirror: 190000, film: 235000, laco: 420000, sand: 330000, glass: 260000 }, frameM: 70000,
  tiers: [
    { key: 'econ', ru: 'Эконом',   sheet: 360000, doorKit: 380000, rod: 45000,  shoe: 90000,  pant: 350000, drawer: 90000,  hinge: 12000, hook: 25000, led: 180000, ledKit: 150000, rail: 60000, handle: 18000 },
    { key: 'std',  ru: 'Стандарт', sheet: 500000, doorKit: 650000, rod: 70000,  shoe: 180000, pant: 520000, drawer: 190000, hinge: 28000, hook: 45000, led: 180000, ledKit: 150000, rail: 95000, handle: 35000 },
    { key: 'prem', ru: 'Премиум',  sheet: 560000, doorKit: 1350000, rod: 120000, shoe: 320000, pant: 900000, drawer: 537055, hinge: 41900, hook: 90000, led: 320000, ledKit: 500000, rail: 170000, handle: 70000 }
  ]
};
export const DRAWER_SYS = {
  tier: { ru: 'По классу комплектации' },
  tandem_fix: { ru: 'Blum TANDEM (фиксаторы)', price: 151620 }, movento: { ru: 'Blum MOVENTO', price: 315000 },
  tbx_m: { ru: 'Blum TANDEMBOX plus (M)', price: 503800 }, lbx_m: { ru: 'Blum LEGRABOX pure (M)', price: 683100 }
};
export const PALETTE = [['Белый', '#f2f1ee'], ['Светлый дуб', '#d8bd91'], ['Бежевый', '#cdbba0'], ['Серый', '#a9adb0'], ['Орех', '#7a5638'], ['Графит', '#3a3d41'], ['Чёрный', '#1c1d1f'], ['Капучино', '#a88b73']];
export const LACO = [['Графит', '#2a2d31'], ['Серо-зелёный', '#6f7d73'], ['Шампань', '#d6c3a1'], ['Белый', '#f0efe9'], ['Синий', '#33476a'], ['Бордо', '#6b2a35']];
export const FILLS = { dsp: 'ЛДСП', mdf: 'Фрезерованный МДФ', glass: 'Стекло в алюминиевой раме', mirror: 'Зеркало', laco: 'Лакобель (цветное стекло)', film: 'Зеркало с плёнкой', sand: 'Зеркало с рисунком' };
export const PANEL_KINDS = { mirror: 'Зеркало', film: 'Зеркало с плёнкой', sand: 'Зеркало с рисунком', glass: 'Стекло в алюминиевой раме', laco: 'Лакобель', dsp: 'ЛДСП', mdf: 'Фрезерованный МДФ', slats: 'Перегородка из клеёного МДФ (рейки)' };
export const BED_STYLES = { foam: { ru: 'Беспружинный (пенный)', price: 900000 }, spring: { ru: 'Независимые пружины', price: 1600000 }, ortho: { ru: 'Ортопедический (кокос + латекс)', price: 2200000 }, combi: { ru: 'Комби (пружины + кокос)', price: 2600000 } };
export const BED_SIZES = [[70, 160, 'Детский 70×160'], [80, 160, 'Детский 80×160'], [80, 190, '80×190'], [90, 200, '90×200'], [120, 200, '120×200'], [140, 200, '140×200'], [160, 200, '160×200'], [180, 200, '180×200']];
export const BED_KINDS = { single: 'Кровать', bunk: 'Двухъярусная детская' };
export const BED_COLORS = [['Серый', '#8b8f94'], ['Бежевый', '#c9b79c'], ['Графит', '#4b4e53'], ['Голубой', '#8fb1c9'], ['Розовый', '#d8a9b5'], ['Зелёный', '#7f9a85']];
export const UNIT_KINDS = { flap: 'Откидные створки (обувница)', doors: 'Распашные двери и полки', drawers: 'Ящики' };
export const MIRROR_KINDS = ['mirror', 'film', 'sand'];
export const SLAT_PRESETS = [[32, 100], [32, 60], [20, 50], [40, 80], [25, 40]];   // [толщина, ширина] рейки, мм
export const MIRROR_SIZES = [[60, 180, 'rect'], [80, 200, 'rect'], [100, 200, 'rect'], [120, 200, 'rect'], [60, 60, 'round'], [80, 80, 'round'], [100, 100, 'round'], [60, 100, 'oval'], [80, 160, 'arch']];
export const PANEL_PATTERNS = { vgroove: 'Вертикальные пазы', hgroove: 'Горизонтальные пазы', grid: 'Кассеты (сетка)', frame: 'Филёнка (рамка)' };
export const ITEM_TYPES = {
  shelf: 'Полка', rod: 'Штанга', drawer: 'Ящик', idoor: 'Дверца в отсеке', shoe: 'Обувные полки', pant: 'Брючница', basket: 'Корзина', hook: 'Крючки', led: 'Подсветка', vpanel: 'Вертикальная панель'
};
export const ITEM_ICON = { shelf: '▬', rod: '⎯', drawer: '▤', idoor: '🚪', shoe: '👟', pant: '⇋', basket: '🧺', hook: '⌒', led: '💡', vpanel: '▮' };

let seq = 1;
export const uid = () => 'i' + (seq++) + Math.random().toString(36).slice(2, 5);
export const r1 = v => Math.round(v * 10) / 10;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---- комната: углы по часовой стрелке [[x, z]] в см; первая стена — основная (у неё шкаф), от (0,0) вправо ---- */
export const rpRect = (W, D) => [[0, 0], [W, 0], [W, D], [0, D]];
export const rpEdgeLen = (P, i) => { const a = P[i], b = P[(i + 1) % P.length]; return Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]); };
export function rpArea(P) { let a = 0; P.forEach((p, i) => { const q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; }); return a / 2; }
export function rpClean(P) {
  const q = P.filter((p, i) => { const n = P[(i + 1) % P.length]; return !(p[0] === n[0] && p[1] === n[1]); });
  let ch = true;
  while (ch && q.length > 3) { ch = false; for (let i = 0; i < q.length; i++) { const a = q[(i + q.length - 1) % q.length], b = q[i], c = q[(i + 1) % q.length]; if ((a[0] === b[0] && b[0] === c[0]) || (a[1] === b[1] && b[1] === c[1])) { q.splice(i, 1); ch = true; break; } } }
  return q;
}
const rpCross = (a, b, c, d) => { const ov = (p, q, r, s2) => Math.max(Math.min(p, q), Math.min(r, s2)) <= Math.min(Math.max(p, q), Math.max(r, s2)) + 1e-9; return ov(a[0], b[0], c[0], d[0]) && ov(a[1], b[1], c[1], d[1]); };
export function rpValid(P) {
  if (!P || P.length < 4 || P.length > 24) return false;
  const n = P.length;
  for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % n]; if (!(a[0] === b[0] || a[1] === b[1]) || rpEdgeLen(P, i) < 10) return false; }
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { if (j === i + 1 || (i === 0 && j === n - 1)) continue; if (rpCross(P[i], P[(i + 1) % n], P[j], P[(j + 1) % n])) return false; }
  return Math.abs(rpArea(P)) > 1000;
}
export function rpNormalize(P) {
  P = rpClean(P.map(p => [Math.round(p[0]), Math.round(p[1])])); if (P.length < 4) return null;
  const dx = Math.sign(P[1][0] - P[0][0]), dz = Math.sign(P[1][1] - P[0][1]);
  let f = p => p;
  if (dx === 0 && dz > 0) f = p => [p[1], -p[0]]; else if (dx < 0) f = p => [-p[0], -p[1]]; else if (dx === 0 && dz < 0) f = p => [-p[1], p[0]];
  P = P.map(f);
  if (rpArea(P) < 0) P = P.map(p => [p[0], -p[1]]);
  const o = P[0]; return P.map(p => [p[0] - o[0], p[1] - o[1]]);
}
export function rpPointIn(P, x, z) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
export function rpRectIn(P, f) {   // прямоугольник f {x0,x1,z0,z1} целиком в комнате
  const e = .3, r = { x0: f.x0 + e, x1: f.x1 - e, z0: f.z0 + e, z1: f.z1 - e };
  if (![[r.x0, r.z0], [r.x1, r.z0], [r.x1, r.z1], [r.x0, r.z1]].every(c => rpPointIn(P, c[0], c[1]))) return false;
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length];
    if (a[1] === b[1]) { if (a[1] > r.z0 && a[1] < r.z1 && Math.max(Math.min(a[0], b[0]), r.x0) < Math.min(Math.max(a[0], b[0]), r.x1)) return false; }
    else if (a[0] > r.x0 && a[0] < r.x1 && Math.max(Math.min(a[1], b[1]), r.z0) < Math.min(Math.max(a[1], b[1]), r.z1)) return false;
  }
  return true;
}
export function rpEditLen(P0, i, v) {   // длина стены i = v: соседняя перпендикулярная стена сдвигается
  const P = P0.map(p => p.slice()), n = P.length, a = P[i], b = P[(i + 1) % n], horiz = a[1] === b[1];
  v = Math.round(parseFloat(String(v).replace(',', '.')) || 0); if (v < 10) return null;
  const dir = horiz ? Math.sign(b[0] - a[0]) : Math.sign(b[1] - a[1]), delta = (v - rpEdgeLen(P, i)) * dir;
  [(i + 1) % n, (i + 2) % n].forEach(j => { if (horiz) P[j][0] += delta; else P[j][1] += delta; });
  const o = P[0], Q = P.map(p => [p[0] - o[0], p[1] - o[1]]);
  return rpValid(Q) ? Q : null;
}
export function wfoot(S, rot) {   // габарит шкафа на полу при повороте rot (0/90/180/270): w,d — размеры по x,z; mx,mz — смещение начала
  const g = geom(S), D = Math.max(S.D, ...S.cols.filter(c => !c.gap && !c.det).map(c => c.D || S.D)), W = g.W;
  const a = ((rot === undefined ? (S.room && S.room.rot) : rot) || 0) * Math.PI / 180, c = Math.round(Math.cos(a)), s = Math.round(Math.sin(a));
  const xs = [0, W].flatMap(x => [0, D].map(z => x * c + z * s)), zs = [0, W].flatMap(x => [0, D].map(z => -x * s + z * c));
  return { w: Math.max(...xs) - Math.min(...xs), d: Math.max(...zs) - Math.min(...zs), mx: Math.min(...xs), mz: Math.min(...zs) };
}
export function wardrobeRect(S) { const f = wfoot(S), r = S.room || {}; return { x0: r.ox || 0, x1: (r.ox || 0) + f.w, z0: r.oz || 0, z1: (r.oz || 0) + f.d }; }
export function rectMagnet(S, ox, oz, footFn, curRot, lim, onlyRot, opts) {   // притягивает прямоугольник к ближайшей стене комнаты (задней стороной) и поворачивает лицом в комнату
  const P = roomPoly(S), cur = footFn(curRot), cx = ox + cur.w / 2, cz = oz + cur.d / 2; lim = lim || 45;
  let best = null;
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length], L = rpEdgeLen(P, i); if (L < 5) continue;
    const dx = Math.sign(b[0] - a[0]), dz = Math.sign(b[1] - a[1]), mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    let nx = -dz, nz = dx; if (!rpPointIn(P, mx + nx * 2, mz + nz * 2)) { nx = -nx; nz = -nz; }
    const rot = nx === 0 ? (nz > 0 ? 0 : 180) : (nx > 0 ? 90 : 270), f = footFn(rot);
    if (onlyRot !== undefined && rot !== onlyRot) continue;
    if (opts && opts.edge !== undefined && i !== opts.edge) continue;
    let X, Z;
    if (nz !== 0) { const lo = Math.min(a[0], b[0]), hi = Math.max(a[0], b[0]); X = Math.min(Math.max(cx - f.w / 2, lo), Math.max(lo, hi - f.w)); if (Math.abs(X - lo) < 12) X = lo; else if (Math.abs(X + f.w - hi) < 12) X = hi - f.w; Z = nz > 0 ? a[1] : a[1] - f.d; }
    else { const lo = Math.min(a[1], b[1]), hi = Math.max(a[1], b[1]); Z = Math.min(Math.max(cz - f.d / 2, lo), Math.max(lo, hi - f.d)); if (Math.abs(Z - lo) < 12) Z = lo; else if (Math.abs(Z + f.d - hi) < 12) Z = hi - f.d; X = nx > 0 ? a[0] : a[0] - f.w; }
    if (opts && opts.align) {   // явная постановка: к стене i, в начало / по центру / в конец стены
      if (nz !== 0) { const lo = Math.min(a[0], b[0]), hi = Math.max(a[0], b[0]); X = opts.align === 'start' ? lo : opts.align === 'end' ? hi - f.w : (lo + hi - f.w) / 2; }
      else { const lo = Math.min(a[1], b[1]), hi = Math.max(a[1], b[1]); Z = opts.align === 'start' ? lo : opts.align === 'end' ? hi - f.d : (lo + hi - f.d) / 2; }
    }
    const dist = opts ? 0 : Math.hypot(X + f.w / 2 - cx, Z + f.d / 2 - cz);
    if (!opts && dist > lim || (best && dist >= best.dist)) continue;
    if (!opts && !rpRectIn(P, { x0: X, x1: X + f.w, z0: Z, z1: Z + f.d })) continue;
    best = { ox: r1(X), oz: r1(Z), rot, dist };
  }
  return best;
}
export function placeAtWall(S, footFn, edge, align) { return rectMagnet(S, 0, 0, footFn, 0, 0, undefined, { edge, align }); }
export function wardrobeMagnet(S, ox, oz, lim, onlyRot) { return rectMagnet(S, ox, oz, r => wfoot(S, r), (S.room && S.room.rot) || 0, lim, onlyRot); }

/* ---- свободные предметы: стеллажи, книжные шкафы, полки и шкафы своей формы ---- */
export const OBJ_MATS = { dsp: 'ЛДСП', ply: 'Фанера берёзовая 12 мм', mdf: 'МДФ крашеный 16 мм' };
export const OBJ_KINDS = {
  book: { ru: 'Книжный шкаф', w: 90, d: 30, h: 200, n: 5, dn: 0, back: true, y: 0 },
  rack: { ru: 'Открытый стеллаж', w: 80, d: 35, h: 180, n: 4, dn: 0, back: false, y: 0 },
  low: { ru: 'Низкий стеллаж / тумба ТВ', w: 140, d: 40, h: 55, n: 1, dn: 2, back: true, y: 0 },
  wallcab: { ru: 'Навесной шкафчик', w: 80, d: 30, h: 60, n: 1, dn: 2, back: true, y: 140 },
  vert: { ru: 'Вертикальная полка (стойка)', w: 1.6, d: 30, h: 180, n: 0, dn: 0, back: false, y: 0 },
  shelf: { ru: 'Полка к стене', w: 100, d: 25, h: 3, n: 0, dn: 0, back: false, y: 140 },
  custom: { ru: 'Шкаф своей формы', w: 100, d: 50, h: 200, n: 3, dn: 0, back: true, y: 0 }
};
export const CORNER_L = [[0, 0], [120, 0], [120, 40], [40, 40], [40, 120], [0, 120]];
export function mkObj(kind, x, z, extra) {
  const k = OBJ_KINDS[kind] || OBJ_KINDS.book, poly = kind === 'custom' ? CORNER_L.map(p => p.slice()) : null;
  return Object.assign({ id: uid(), kind, x: r1(x || 0), z: r1(z || 0), rot: 0, y: k.y, w: k.w, d: k.d, h: k.h, n: k.n, dn: k.dn, dh: 0, back: k.back, fill: 'dsp', mat: 'dsp', color: '', handles: true, poly, ed: poly ? poly.map(() => 0) : null }, extra || {});
}
export function objPoly(o) { return o.kind === 'custom' && o.poly ? o.poly : [[0, 0], [o.w, 0], [o.w, o.d], [0, o.d]]; }
export function objBox(o) { const P = objPoly(o), xs = P.map(p => p[0]), zs = P.map(p => p[1]); return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) }; }
export function objFoot(o, rot) {   // габарит на полу при повороте: w,d — размеры по x,z; mx,mz — смещение начала
  const b = objBox(o), a = ((rot === undefined ? o.rot : rot) || 0) * Math.PI / 180, c = Math.round(Math.cos(a)), s = Math.round(Math.sin(a));
  const cs = [[b.x0, b.z0], [b.x1, b.z0], [b.x1, b.z1], [b.x0, b.z1]], xs = cs.map(p => p[0] * c + p[1] * s), zs = cs.map(p => -p[0] * s + p[1] * c);
  return { w: Math.max(...xs) - Math.min(...xs), d: Math.max(...zs) - Math.min(...zs), mx: Math.min(...xs), mz: Math.min(...zs) };
}
export function rectFoot(w0, d0, rot) {
  const a = (rot || 0) * Math.PI / 180, c = Math.round(Math.cos(a)), s = Math.round(Math.sin(a));
  const cs = [[0, 0], [w0, 0], [w0, d0], [0, d0]], xs = cs.map(p => p[0] * c + p[1] * s), zs = cs.map(p => -p[0] * s + p[1] * c);
  return { w: Math.max(...xs) - Math.min(...xs), d: Math.max(...zs) - Math.min(...zs), mx: Math.min(...xs), mz: Math.min(...zs) };
}
export function itemBase(S, kind, it) {   // габарит предмета в собственных осях (до поворота), см
  if (kind === 'unit') return { w: it.w, d: it.d };
  if (kind === 'bed') { const d = bedDims(it, S.t); return it.rot === 90 ? { w: d.L, d: d.W } : { w: d.W, d: d.L }; }
  return { w: it.w, d: (it.mount === 'free' ? Math.max(.5, it.pz || 30) : .5) + 2.5 };   // зеркало / панель
}
export function itemFoot(S, kind, it, rot) { const b = itemBase(S, kind, it); return rectFoot(b.w, b.d, rot === undefined ? (it.fp && it.fp.rot) : rot); }
export function itemRect(S, kind, it) { const f = itemFoot(S, kind, it), p = it.fp || { x: 0, z: 0 }; return { x0: p.x, x1: p.x + f.w, z0: p.z, z1: p.z + f.d }; }
export function itemMagnet(S, kind, it, ox, oz, lim, onlyRot) { return rectMagnet(S, ox, oz, r => itemFoot(S, kind, it, r), (it.fp && it.fp.rot) || 0, lim, onlyRot); }
export function freeItem(S, kind, it) {   // «освободить» предмет от шкафа: он остаётся на месте, но дальше его можно двигать и крутить по комнате
  if (it.fp) return it.fp;
  const rm = S.room || {}, ft = wfoot(S), a = (rm.rot || 0) * Math.PI / 180, c = Math.round(Math.cos(a)), s = Math.round(Math.sin(a));
  const b = itemBase(S, kind, it), lx = it.x || 0, lz = kind === 'panel' ? 0 : (it.pz || 0), ox = (rm.ox || 0) - ft.mx, oz = (rm.oz || 0) - ft.mz;
  const pts = [[lx, lz], [lx + b.w, lz], [lx + b.w, lz + b.d], [lx, lz + b.d]].map(p => [p[0] * c + p[1] * s + ox, -p[0] * s + p[1] * c + oz]);
  it.fp = { x: r1(Math.min(...pts.map(p => p[0]))), z: r1(Math.min(...pts.map(p => p[1]))), rot: rm.rot || 0 };
  return it.fp;
}
export function colFoot(S, ci, rot) { const g = geom(S), c = g.cols[ci]; return rectFoot(c.w + 2 * S.t, c.D, rot === undefined ? (S.cols[ci].det && S.cols[ci].det.rot) : rot); }
export function colRect(S, ci) { const f = colFoot(S, ci), d = S.cols[ci].det; return { x0: d.x, x1: d.x + f.w, z0: d.z, z1: d.z + f.d }; }
export function detachPos(S, ci) {   // где сейчас стоит отсек в комнате (вытаскиваем его вперёд, чтобы был виден)
  const g = geom(S), c = g.cols[ci], t = S.t, rm = S.room || {}, ft = wfoot(S), a = (rm.rot || 0) * Math.PI / 180, cs = Math.round(Math.cos(a)), sn = Math.round(Math.sin(a));
  const lx = c.xa - t, w = c.w + 2 * t, d = c.D, off = d + 25, ox = (rm.ox || 0) - ft.mx, oz = (rm.oz || 0) - ft.mz;
  const pts = [[lx, off], [lx + w, off], [lx + w, off + d], [lx, off + d]].map(p => [p[0] * cs + p[1] * sn + ox, -p[0] * sn + p[1] * cs + oz]);
  return { x: r1(Math.min(...pts.map(p => p[0]))), z: r1(Math.min(...pts.map(p => p[1]))), rot: rm.rot || 0 };
}
export function objRect(o) { const f = objFoot(o); return { x0: o.x, x1: o.x + f.w, z0: o.z, z1: o.z + f.d }; }
export function objMagnet(S, o, ox, oz, lim, onlyRot) { return rectMagnet(S, ox, oz, r => objFoot(o, r), o.rot || 0, lim, onlyRot); }
export function objEdges(o) {   // стороны контура: a,b,L, угол, внутренняя нормаль, признак двери
  const P = objPoly(o), n = P.length;
  return P.map((a, i) => {
    const b = P[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1, ex = dx / L, ez = dz / L, mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    let nx = -ez, nz = ex; if (!rpPointIn(P, mx + nx * .6, mz + nz * .6)) { nx = -nx; nz = -nz; }
    const ty = o.ed ? (o.ed[i] | 0) : 0;
    return { i, a, b, L, ex, ez, ang: Math.atan2(dz, dx), nin: [nx, nz], type: ty, door: ty === 1, curved: ty === 2, open: ty === 3 };
  });
}
export const roomPoly = S => (S.room && S.room.poly) ? S.room.poly : rpRect((S.room && S.room.W) || 400, (S.room && S.room.D) || 300);

/* ---- состояние ---- */
export function mkItem(type, y, extra) {
  const b = { id: uid(), type, y: r1(y) };
  if (type === 'shelf') b.d = null;                         // глубина: null — стандартная (D − 2,5)
  if (type === 'drawer') Object.assign(b, { fh: 18, sys: 'tier' });
  if (type === 'idoor') Object.assign(b, { y1: r1(y + 60), x: 0, w: null, dir: 'L' });
  if (type === 'shoe') Object.assign(b, { n: 3 });
  if (type === 'basket') Object.assign(b, { h: 18 });
  if (type === 'vpanel') Object.assign(b, { y1: r1(y + 60), x: 0, sh: 'L' });
  return Object.assign(b, extra || {});
}
export function defState() {
  const S = { v: 2, W: 240, H: 200, D: 60, t: 1.6, plinth: 8, tier: 1, color: 0, custom: null, cols: [], mezzes: [], panels: [], units: [], beds: [], objs: [], room: { W: 400, D: 300, H: 260, ox: 0, oz: 0, rot: 0, mag: true, poly: null, set: false },
    doors: { kind: 'none', n: 3, fills: ['dsp', 'mirror', 'dsp', 'mirror', 'dsp', 'mirror', 'dsp', 'mirror'], laco: 0, handles: true, gf: 4 }, led: false, name: 'Мой шкаф' };
  S.cols = [
    { id: uid(), w: 78, items: [mkItem('rod', 185), mkItem('shelf', 193), mkItem('shelf', 40), mkItem('shelf', 100)] },
    { id: uid(), w: 78, items: [mkItem('shelf', 68), mkItem('shelf', 105), mkItem('shelf', 142), mkItem('shelf', 180), mkItem('drawer', 9.6), mkItem('drawer', 27.6), mkItem('drawer', 45.6)] },
    { id: uid(), w: 78, items: [mkItem('rod', 185), mkItem('rod', 115), mkItem('shelf', 193)] }
  ];
  fitWidth(S, 240);
  S.mezzes = [mkMezz(0, S.W, S.H)];
  return S;
}
export function mkPanel(x, y, w, h) { return { id: uid(), x: r1(x), y: r1(y), w: r1(w), h: r1(h), kind: 'mirror', mount: 'wall', frame: false, fw: 3, shape: 'rect', bl: false, pat: 'vgroove', gp: 12, sw: 100, sd: 32, sg: 20, so: 'v', pz: 30 }; }
export function mkBed(x, kind) {
  const bunk = kind === 'bunk';
  return { id: uid(), x: r1(x), pz: 0, rot: 0, kind: bunk ? 'bunk' : 'single', mw: bunk ? 80 : 160, ml: bunk ? 190 : 200, mt: bunk ? 14 : 22, style: bunk ? 'foam' : 'spring', mcol: 0, sh: bunk ? 22 : 28, hh: bunk ? 95 : 95, fh: bunk ? 95 : 40, lg: bunk ? 8 : 15, drw: 0, lift: false, soft: !bunk, bedding: true, lv2: 150, rail: 28, ladder: 'end', steps: 5 };
}
export function bedDims(b, t) {   // габариты кровати, см (t — толщина ЛДСП)
  const W = b.mw + 1 + 2 * t, L = b.ml + 1 + 2 * t, slatTop = b.lg + b.sh - 3.2;
  const postH = b.kind === 'bunk' ? b.lv2 + b.mt + b.rail : 0;
  return { W, L, slatTop, mTop: slatTop + b.mt, postH, H: Math.max(b.hh, b.kind === 'bunk' ? postH + 2 : b.lg + b.sh + b.mt), n: Math.max(1, Math.floor((b.ml + 1) / 10.8)) };
}
export function mkUnit(x, w) { return { id: uid(), x: r1(x), pz: 0, w: r1(w), h: 100, d: 35, kind: 'flap', n: 2, fill: 'dsp', seat: false, legs: 8 }; }
export function mkMezz(x, w, y) { return { id: uid(), x: r1(x), w: r1(w), h: 40, y: r1(y), n: Math.max(1, Math.round(w / 60)), shelves: 0, fill: 'dsp', div: [], cd: [], dir: [] }; }
export function presetP() {   // П-образный шкаф: две башни и антресоль-перемычка над проёмом
  const S = defState(); S.H = 240; S.name = 'П-образный шкаф';
  S.cols = [
    { id: uid(), w: 58, items: [mkItem('rod', 225), mkItem('shelf', 232), mkItem('shelf', 60), mkItem('shelf', 120), mkItem('shelf', 170)] },
    { id: uid(), w: 100, gap: true, items: [] },
    { id: uid(), w: 58, items: [mkItem('shelf', 72), mkItem('shelf', 108), mkItem('shelf', 144), mkItem('shelf', 180), mkItem('drawer', 9.6), mkItem('drawer', 27.6), mkItem('drawer', 45.6)] }
  ];
  recalcW(S); S.mezzes = [mkMezz(0, S.W, S.H)]; S.mezzes[0].h = 40; return S;
}
export function fitWidth(S, W) {
  const n = S.cols.length, inner = W - (n + 1) * S.t, w = r1(Math.max(15, inner / n));
  S.cols.forEach(c => { c.w = w; });
  const sum = S.cols.reduce((a, c) => a + c.w, 0);
  S.cols[n - 1].w = r1(S.cols[n - 1].w + (inner - sum));
  S.W = r1(S.t * (n + 1) + S.cols.reduce((a, c) => a + c.w, 0));
}
export function recalcW(S) {
  if (S.cols.some(c => c.det) && S.cols.some((c, i) => c.det && S.cols.slice(i).some(q => !q.det))) S.cols = S.cols.filter(c => !c.det).concat(S.cols.filter(c => c.det));   // отдельные шкафы всегда в конце списка
  const m = S.cols.filter(c => !c.det); S.W = r1(S.t * (m.length + 1) + m.reduce((a, c) => a + c.w, 0));
}

/* ---- геометрия ---- */
export function geom(S) {
  const t = S.t; let x = t, prev = null;
  const cols = new Array(S.cols.length);
  S.cols.forEach((c, i) => {
    if (c.det) return;
    const H = Number(c.H) || S.H, D = Number(c.D) || S.D, gap = !!c.gap;
    const split = !!(prev && !prev.gap && !gap && (prev.H !== H || prev.D !== D));   // другая высота/глубина — отдельная коробка со своими боковинами
    if (split) x += t;
    const a = { xa: x, xb: x + c.w, w: c.w, gap, H, D, y1: H - t, split };
    x += c.w + t; prev = a; cols[i] = a;
  });
  const mainW = x;
  { let dx = mainW + 60;   // отделённые шкафы: у каждого своя коробка, считаются отдельно справа (в комнате стоят где угодно)
    S.cols.forEach((c, i) => { if (!c.det) return; const H = Number(c.H) || S.H, D = Number(c.D) || S.D; dx += t; cols[i] = { xa: dx, xb: dx + c.w, w: c.w, gap: false, H, D, y1: H - t, split: false, det: true }; dx += c.w + t + 60; }); }
  const n = cols.length, bnd = [];
  for (let k = 0; k <= n; k++) { const L = cols[k - 1], R = cols[k]; bnd.push({ k, x: k === 0 ? 0 : cols[k - 1].xb, has: !!(((L && !L.gap) || (R && !R.gap)) && !(L && L.det) && !(R && R.det)) }); }
  const runs = []; let cur = null;
  cols.forEach((c, i) => { if (c.det) { if (cur) { runs.push(cur); cur = null; } runs.push({ a: i, b: i, x0: c.xa - t, x1: c.xb + t, H: c.H, D: c.D, det: true }); return; } if (c.gap) { if (cur) { runs.push(cur); cur = null; } } else { if (cur && c.split) { runs.push(cur); cur = null; } if (!cur) cur = { a: i, b: i, x0: c.xa - t, x1: 0, H: c.H, D: c.D }; cur.b = i; cur.x1 = c.xb + t; } });
  if (cur) runs.push(cur);
  const compOf = m => { const ix0 = m.x + t, ix1 = m.x + m.w - t, dv = (m.div || []).map(v => clamp(v, 5, Math.max(5, m.w - 2 * t - t - 5))).sort((a, b) => a - b), comp = []; let a = ix0; dv.forEach(off => { comp.push({ x0: a, x1: ix0 + off }); a = ix0 + off + t; }); comp.push({ x0: a, x1: ix1 }); return { dv, comp }; };
  const mz = (S.mezzes || []).map((m, mi) => Object.assign(compOf(m), { id: m.id, mi, fill: m.fill, cd: m.cd, dir: m.dir, x: m.x, w: m.w, h: m.h, y: m.y, n: m.n, shelves: m.shelves, x0: m.x, x1: m.x + m.w, yb: m.y, yt: m.y + m.h, ix0: m.x + t, ix1: m.x + m.w - t, iy0: m.y + t, iy1: m.y + m.h - t }));
  const totalH = Math.max(S.H, ...cols.map(c => c.H), ...mz.map(m => m.yt), ...(S.panels || []).map(p => p.y + p.h), ...(S.units || []).map(u => u.h), ...(S.beds || []).map(b => bedDims(b, S.t).H));
  return { t, y0: S.plinth + t, y1: S.H - t, cols, W: mainW, bnd, runs, mz, totalH, doorTop: S.H };
}
export function ext(it, S) {   // вертикальный размах предмета [низ, верх]
  const t = S.t;
  switch (it.type) {
    case 'shelf': return [it.y, it.y + t];
    case 'rod': return [it.y - 1.25, it.y + 1.25];
    case 'drawer': return [it.y, it.y + it.fh];
    case 'idoor': return [it.y, it.y1];
    case 'shoe': return [it.y, it.y + it.n * 12];
    case 'pant': return [it.y, it.y + 10];
    case 'basket': return [it.y, it.y + it.h];
    case 'hook': return [it.y, it.y + 3];
    case 'led': return [it.y, it.y + 1];
    case 'vpanel': return [it.y, it.y1];
  }
  return [it.y, it.y];
}
const BLOCK = { drawer: 1, shoe: 1, pant: 1, basket: 1 };
// уровни для перегородки: «дно», полки (низ и верх), «верх» — чтобы выбрать, между какими полками стоит панель
export function levels(S, col) {
  const g = geom(S), ci = S.cols.indexOf(col), y1 = ci >= 0 ? g.cols[ci].y1 : g.y1, L = [{ label: 'дно', top: g.y0, bot: g.y0 }];
  col.items.filter(i => i.type === 'shelf').sort((a, b) => a.y - b.y).forEach((sh, k) => L.push({ label: 'полка ' + (k + 1) + ' (' + Math.round(sh.y * 10) + ' мм)', top: r1(sh.y + S.t), bot: sh.y }));
  L.push({ label: 'верх', top: y1, bot: y1 });
  return L;
}
export function freeY(S, col, h) {   // первое свободное место высотой h в отсеке
  const g = geom(S), blocks = col.items.filter(i => BLOCK[i.type]).map(i => ext(i, S)).sort((a, b) => a[0] - b[0]);
  const ci = S.cols.indexOf(col), y1 = ci >= 0 ? g.cols[ci].y1 : g.y1; let y = g.y0;
  for (const b of blocks) { if (b[0] - y >= h) return r1(y); y = Math.max(y, b[1]); }
  return y1 - y >= h ? r1(y) : null;
}
export function warnings(S) {
  const g = geom(S), out = [];
  S.cols.forEach((c, ci) => {
    if (c.gap) return;
    const label = 'Отсек ' + (ci + 1);
    c.items.forEach(it => {
      const [a, b] = ext(it, S);
      if (a < g.y0 - .01 || b > g.cols[ci].y1 + .01) out.push(`${label}: «${ITEM_TYPES[it.type]}» выходит за пределы отсека`);
    });
    const bl = c.items.filter(i => BLOCK[i.type]);
    for (let i = 0; i < bl.length; i++) for (let j = i + 1; j < bl.length; j++) { const A = ext(bl[i], S), B = ext(bl[j], S); if (A[0] < B[1] - .01 && B[0] < A[1] - .01) out.push(`${label}: «${ITEM_TYPES[bl[i].type]}» и «${ITEM_TYPES[bl[j].type]}» пересекаются`); }
    c.items.filter(i => i.type === 'shelf').forEach(sh => bl.forEach(b => { const B = ext(b, S); if (sh.y > B[0] + .5 && sh.y < B[1] - .5) out.push(`${label}: полка пересекает «${ITEM_TYPES[b.type]}»`); }));
    c.items.filter(i => i.type === 'rod').forEach(r => { if (c.items.some(i => i.type === 'shelf' && i.y > r.y && i.y - r.y < 6)) out.push(`${label}: штанга слишком близко к полке над ней (нужно от 6 см)`); });
    if (c.w < 20) out.push(`${label}: слишком узкий отсек`);
  });
  g.mz.forEach((m, mi) => {
    if (m.h < 20) out.push(`Антресоль ${mi + 1}: слишком низкая`);
    if (m.y < S.H - .5 && g.runs.some(r => m.x0 < r.x1 - .5 && m.x1 > r.x0 + .5 && m.yb < S.H - .5)) out.push(`Антресоль ${mi + 1}: заходит в корпус (низ антресоли должен быть не ниже ${Math.round(S.H * 10)} мм над отсеками)`);
    g.mz.forEach((o, oi) => { if (oi > mi && m.x0 < o.x1 - .5 && m.x1 > o.x0 + .5 && m.yb < o.yt - .5 && m.yt > o.yb + .5) out.push(`Антресоли ${mi + 1} и ${oi + 1} пересекаются`); });
  });
  return out;
}

/* ---- двери ---- */
export function shelfSpan(col, wcol, t, it) {   // полка рядом с вертикальной панелью есть только с выбранной стороны: слева или справа от неё
  let x0 = 0, x1 = wcol;
  (col.items || []).forEach(v => { if (v.type === 'vpanel' && it.y >= v.y - .05 && it.y <= v.y1 + .05) { if ((v.sh || 'L') === 'L') x1 = Math.min(x1, v.x); else x0 = Math.max(x0, v.x + t); } });
  return { x0, x1, w: Math.max(5, x1 - x0) };
}
export function colSplits(S, g, ci) {   // перегородки «у каждой двери»: при 3–4 дверях в отсеке у каждой своя секция
  const c = g.cols[ci], col = S.cols[ci], t = S.t; if (!c || c.gap || !col || S.doors.kind !== 'swing') return [];
  const n = col.dn != null ? col.dn : (c.w > 65 ? 2 : 1); if (n < 3 || col.dp === false) return [];
  const L = c.det || ci === 0 || g.cols[ci - 1].gap || g.cols[ci - 1].det ? c.xa - t : c.xa - t / 2, R = c.det || ci === g.cols.length - 1 || g.cols[ci + 1].gap || g.cols[ci + 1].det ? c.xb + t : c.xb + t / 2, cw = R - L, out = [];
  for (let k = 1; k < n; k++) out.push(L + k * cw / n);
  return out;
}
export function doorList(S) {   // [{zone:'main'|'mezz', i, x, w, h, y, fill, left, hinge:'L'|'R'|'U'|'D', n, sliding}]
  const g = geom(S), d = S.doors, out = [], t = S.t;
  if (d.kind !== 'none' && g.runs.length) {
    const hh = (g.runs[0] ? g.runs[0].H : S.H) - S.plinth - .4, tot = g.runs.reduce((a, r) => a + (r.x1 - r.x0), 0), sliding = d.kind === 'sliding' && g.runs.length === 1; let idx = 0;
    g.runs.forEach(r => {
      const rw = r.x1 - r.x0, n = sliding ? d.n : Math.max(1, Math.round(d.n * rw / tot));
      if (sliding) { const w = (rw + (n - 1) * 2.5) / n; for (let i = 0; i < n; i++) { out.push({ zone: 'main', i: idx, ri: i, n, x: r.x0 + i * (w - 2.5), w, h: hh, y: S.plinth + .2, fill: d.fills[idx] || 'dsp', sliding: true, left: i < n / 2, hinge: 'L', gf: d.gf || 4 }); idx++; } }
      else void 0;
    });
    if (!sliding) {   // распашные: у каждого отсека свои двери (0, 1 или 2), своё заполнение и открывание
      let k = 0;
      g.cols.forEach((c, ci) => {
        if (c.gap) return; const col = S.cols[ci], L = c.det || ci === 0 || g.cols[ci - 1].gap || g.cols[ci - 1].det ? c.xa - t : c.xa - t / 2, R = c.det || ci === g.cols.length - 1 || g.cols[ci + 1].gap || g.cols[ci + 1].det ? c.xb + t : c.xb + t / 2, cw = R - L;
        const n = col.dn != null ? col.dn : (c.w > 65 ? 2 : 1), fill = col.df || 'dsp', dr = col.dd || 'auto';
        for (let i = 0; i < n; i++) { const hinge = dr === 'auto' ? (n === 1 ? 'L' : (i < n / 2 ? 'L' : 'R')) : dr; out.push({ zone: 'main', i: k++, ci, ri: i, n, x: L + i * (cw / n) + .15, w: cw / n - .3, h: c.H - S.plinth - .4, y: S.plinth + .2, fill, sliding: false, left: hinge === 'L', hinge, gf: d.gf || 4 }); }
      });
    }
  }
  g.mz.forEach(m => {
    let idx = 0;
    m.comp.forEach((c, ci) => {
      const x0 = ci === 0 ? m.x : c.x0 - t / 2, x1 = ci === m.comp.length - 1 ? m.x + m.w : c.x1 + t / 2, cw = x1 - x0;
      const n = m.cd && m.cd[ci] != null ? m.cd[ci] : Math.max(1, Math.round(cw / 60)), mode = (m.dir && m.dir[ci]) || 'swing';
      for (let i = 0; i < n; i++) { const hinge = mode === 'swing' ? (i < n / 2 ? 'L' : 'R') : mode; out.push({ zone: 'mezz', mi: m.mi, ci, i: idx++, ri: i, n, x: x0 + i * (cw / n) + .15, w: cw / n - .3, h: m.h - .2, y: m.y + .1, fill: m.fill || 'dsp', sliding: false, left: hinge === 'L', hinge, gf: d.gf || 4 }); }
    });
  });
  return out;
}

/* ---- список деталей и фурнитуры + цена ---- */
export function buildParts(S) {
  const g = geom(S), t = S.t, W = g.W, H = S.H, D = S.D, mm = v => Math.round(v * 10), T = P.tiers[S.tier];
  const parts = [], hw = [];
  const body = 'ЛДСП ' + mm(t) + ' мм';
  const add = (grp, name, qty, L, Wd, tt, mat, edgeEach, note, kind) => {
    const lg = Math.max(L, Wd), sh = Math.min(L, Wd), e = edgeEach * 100, facade = /^(Дверь|Фасад|Вставка)/.test(name);
    let desc = '—';
    if (edgeEach > 0) desc = Math.abs(e - 2 * (L + Wd)) < .6 ? 'по периметру (4 стороны)' : Math.abs(e - lg) < .6 ? '1 длинная сторона' : Math.abs(e - sh) < .6 ? '1 короткая сторона' : Math.abs(e - lg - sh) < .6 ? '2 стороны (длинная + короткая)' : Math.abs(e - lg - 2 * sh) < .6 ? '3 стороны (перед + 2 торца)' : Math.round(e) / 100 + ' м на деталь';
    parts.push({ grp, name, qty, L: mm(lg), W: mm(sh), t: mm(tt), mat, kind: kind || 'dsp', edgeM: Math.round(edgeEach * qty * 100) / 100, edgeT: (edgeEach > 0 && (!kind || kind === 'dsp')) ? (facade ? '2' : '0,4') : '', edgeDesc: desc, note: note || '' });
  };
  const addHw = (grp, name, qty, unit, price, note) => { qty = Math.round(qty * 100) / 100; if (qty > 0) hw.push({ grp, name, qty, unit: unit || 'шт.', price: Math.round(price || 0), note: note || '' }); };
  const bd = D - .3, ph = S.plinth, hs = H - ph;
  let joints = 8, feet = 0, hinges0 = 0, handles0 = 0, joints_u = 0;
  g.runs.forEach((r, ri) => {
    const rw = r.x1 - r.x0, k = r.b - r.a + 1, D = r.D, hs = r.H - ph, lbl = g.runs.length > 1 ? ' (секция ' + (ri + 1) + ')' : '';
    add('Корпус', 'Дно' + lbl, 1, rw, D, t, body, (rw + 2 * D) / 100, 'на всю ширину: боковины и спинка стоят на дне; кромка перед + 2 торца');
    add('Корпус', 'Боковина' + lbl, 2, hs - t, D, t, body, (hs - t) / 100, 'стоит на дне; кромка по переднему торцу');
    add('Корпус', 'Крышка (верх)' + lbl, 1, rw - 2 * t, D, t, body, (rw - 2 * t) / 100, 'между боковинами');
    if (k > 1) add('Корпус', 'Перегородка отсека' + lbl, k - 1, hs - 2 * t, D, t, body, (hs - 2 * t) / 100, 'стоит на дне, под крышкой');
    add('Корпус', 'Задняя стенка' + lbl, 1, rw - 2 * t, hs - 2 * t, .3, 'ХДФ 3 мм', 0, 'ставится на дно между боковин', 'hdf');
    add('Корпус', 'Цоколь' + lbl, 1, rw - 2 * t, ph, t, body, (rw - 2 * t) / 100, 'кромка по верхней длинной стороне');
    joints += k * 8 + 8; feet += Math.max(2, Math.ceil(rw / 60) * 2);
  });
  g.mz.forEach((m, mi) => {
    const lbl = ' (антресоль ' + (mi + 1) + ')', gr = 'Антресоль ' + (mi + 1);
    add(gr, 'Дно' + lbl, 1, m.w, D, t, body, (m.w + 2 * D) / 100, 'на всю ширину; боковины стоят на дне; кромка перед + 2 торца');
    add(gr, 'Боковина' + lbl, 2, m.h - t, D, t, body, (m.h - t) / 100, 'стоит на дне');
    add(gr, 'Крышка' + lbl, 1, m.w - 2 * t, D, t, body, (m.w - 2 * t) / 100, 'между боковинами');
    if (m.dv.length) add(gr, 'Перегородка' + lbl, m.dv.length, m.h - 2 * t, D, t, body, (m.h - 2 * t) / 100, 'вертикальная, стоит на дне');
    add(gr, 'Задняя стенка' + lbl, 1, m.w - 2 * t, m.h - 2 * t, .3, 'ХДФ 3 мм', 0, 'ставится на дно между боковин', 'hdf');
    m.comp.forEach((c, ci) => { for (let k = 0; k < (m.shelves | 0); k++) add(gr, 'Полка' + lbl + (m.comp.length > 1 ? ' отд. ' + (ci + 1) : ''), 1, c.x1 - c.x0 - .2, D - 2.5, t, body, (c.x1 - c.x0 - .2) / 100, 'на 4 полкодержателя'); });
    joints += 16 + (m.shelves | 0) * 4 + m.dv.length * 8;
  });
  (S.panels || []).forEach((p, i) => {
    const where = p.mount === 'front' ? 'на фасад' : (p.mount === 'free' ? 'отдельно стоящая' : 'на стену'), per = (2 * (p.h + p.w)) / 100;
    if (p.kind === 'slats') {
      const sw = p.sw || 100, sd = p.sd || 32, sg = p.sg || 20, vert = p.so !== 'h', span = (vert ? p.w : p.h) * 10, len = (vert ? p.h : p.w) * 10, cnt = Math.max(1, Math.floor((span + sg) / (sw + sg)));
      parts.push({ grp: 'Панели', name: 'Рейка клеёного МДФ ' + sd + '×' + sw + ' (панель ' + (i + 1) + ')', qty: cnt, L: Math.round(len), W: Math.round(sw), t: Math.round(sd), mat: 'Клеёный МДФ', kind: 'slat', edgeM: 0, edgeT: '', edgeDesc: '—', note: (vert ? 'вертикально' : 'горизонтально') + ', зазор ' + sg + ' мм, ' + where });
      addHw('Крепёж', 'Монтажная рейка и клей для реек панели ' + (i + 1), 1, 'комплект', 45000 + cnt * 1500);
      return;
    }
    const isMirror = MIRROR_KINDS.includes(p.kind), th = (p.kind === 'dsp' || p.kind === 'mdf') ? t : .6, mat = p.kind === 'dsp' ? body : (p.kind === 'mdf' ? 'Фрезерованный МДФ ' + mm(t) + ' мм' : FILLS[p.kind] + ', 6 мм');
    const shapeName = { rect: '', round: ', круглое', oval: ', овальное', arch: ', арка' }[p.shape || 'rect'];
    add('Панели', 'Панель ' + (i + 1) + ' (' + where + ')' + (isMirror ? shapeName : ''), 1, p.h, p.w, th, mat, per, 'размер ' + mm(p.w) + '×' + mm(p.h) + (p.kind === 'mdf' ? ', фрезеровка: ' + (PANEL_PATTERNS[p.pat] || '') + ', шаг ' + mm(p.gp || 12) + ' мм' : ''), p.kind);
    if (isMirror && p.shape && p.shape !== 'rect') parts[parts.length - 1].mult = P.shapeK;
    if (p.frame && p.kind !== 'mdf') add('Панели', 'Рамка панели ' + (i + 1), 1, p.h, p.w, p.fw || 3, 'Алюминий, профиль ' + mm(p.fw || 3) + ' мм', per, 'периметр', 'frame');
    if (isMirror && p.bl) { const pm = (p.shape === 'round' ? Math.PI * p.w : (p.shape === 'oval' ? Math.PI * (p.w + p.h) / 2 : 2 * (p.w + p.h))) / 100; addHw('Свет', 'Подсветка зеркала ' + (i + 1) + ' (LED по контуру + блок)', 1, 'комплект', pm * T.led + T.ledKit, 'периметр ' + Math.round(pm * 100) / 100 + ' м'); }
  });
  (S.units || []).forEach((u, i) => {
    const gr = 'Тумба-обувница ' + (i + 1), lbl = ' (тумба ' + (i + 1) + ')', ph2 = u.legs || 0, hb = u.h - ph2, w = u.w, d = u.d;
    add(gr, 'Дно' + lbl, 1, w, d, t, body, (w + 2 * d) / 100, 'на всю ширину; боковины и спинка стоят на дне; кромка перед + 2 торца');
    add(gr, 'Боковина' + lbl, 2, hb - t, d, t, body, (hb - t) / 100, 'стоит на дне; кромка по переднему торцу');
    if (u.seat) add(gr, 'Сиденье (крышка)' + lbl, 1, w + 1, d + 1.5, t, body, (2 * (w + d + 2.5)) / 100, 'под мягкую накладку; кромка по периметру');
    else add(gr, 'Крышка' + lbl, 1, w - 2 * t, d, t, body, (w - 2 * t) / 100, 'между боковинами');
    add(gr, 'Задняя стенка' + lbl, 1, w - 2 * t, hb - 2 * t, .3, 'ХДФ 3 мм', 0, 'ставится на дно между боковин', 'hdf');
    const fn = Math.max(1, u.n | 0), fill = u.fill || 'dsp', fmat = fill === 'dsp' ? body : FILLS[fill], fh = (hb - fn * .3 - .3) / fn;
    const front = (name, qty, L, W2, note) => { if (fill === 'dsp') add(gr, name + lbl, qty, L, W2, t, fmat, (2 * (L + W2)) / 100, note); else add(gr, name + lbl, qty, L, W2, fill === 'mdf' ? t : .4, fmat, (2 * (L + W2)) / 100, note, fill); };
    if (u.kind === 'flap') {
      front('Откидная створка', fn, fh, w - .4, 'открывается вперёд-вниз');
      add(gr, 'Полка наклонная' + lbl, fn, w - 2 * t - .2, d - 4, t, body, (w - 2 * t - .2) / 100, 'угол ≈ 15° для обуви');
      addHw('Двери', 'Откидной механизм обувницы (комплект на створку)', fn, 'шт.', T.shoe, 'тумба ' + (i + 1));
      if (S.doors.handles !== false) addHw('Двери', 'Ручка', fn, 'шт.', T.handle);
    } else if (u.kind === 'doors') {
      const dn = w > 65 ? 2 : 1, dh = hb - .4;
      front('Дверь', dn, dh, w / dn - .3, 'распашная');
      if (fn > 0) add(gr, 'Полка' + lbl, fn, w - 2 * t - .2, d - 3, t, body, (w - 2 * t - .2) / 100, 'на 4 полкодержателя');
      addHw('Двери', 'Петля с доводчиком', dn * (dh <= 90 ? 2 : 3), 'шт.', T.hinge); if (S.doors.handles !== false) addHw('Двери', 'Ручка', dn, 'шт.', T.handle);
    } else {
      front('Фасад ящика', fn, fh, w - .4, 'ящик');
      for (let k = 0; k < fn; k++) { add(gr, 'Боковина ящика' + lbl, 2, d - 8, Math.max(8, fh - 6), t, body, 0); add(gr, 'Задняя ящика' + lbl, 1, w - 2 * t - 5.4, Math.max(8, fh - 6), t, body, 0); add(gr, 'Дно ящика' + lbl, 1, w - 2 * t - 3.6, d - 9, .3, 'ХДФ 3 мм', 0, '', 'hdf'); }
      addHw('Ящики', 'Направляющие ящика (комплект)', fn, 'комплект', T.drawer); if (S.doors.handles !== false) addHw('Двери', 'Ручка', fn, 'шт.', T.handle);
    }
    if (u.seat) addHw('Мебель', 'Мягкое сиденье (поролон + ткань) тумбы ' + (i + 1), 1, 'шт.', Math.round(150000 * w / 100));
    if (ph2 > 0) addHw('Крепёж', 'Ножка-опора тумбы ' + (i + 1), 4, 'шт.', 6000);
    joints_u += 12;
  });
  (S.beds || []).forEach((b, i) => {
    const gr = (b.kind === 'bunk' ? 'Двухъярусная кровать ' : 'Кровать ') + (i + 1), lbl = ' (кровать ' + (i + 1) + ')', d = bedDims(b, t), per = (a, c) => (2 * (a + c)) / 100;
    add(gr, 'Боковина' + lbl, 2, b.ml + 1, b.sh, t, body, per(b.ml + 1, b.sh), 'видимая, кромка по периметру');
    add(gr, 'Изголовье' + lbl, 1, d.W, b.hh - b.lg, t, body, per(d.W, b.hh - b.lg), (b.soft ? 'под мягкую накладку; ' : '') + 'кромка по периметру');
    add(gr, 'Изножье' + lbl, 1, d.W, b.fh - b.lg, t, body, per(d.W, b.fh - b.lg), 'кромка по периметру');
    add(gr, 'Брусок опорный 30×40' + lbl, 2, b.ml + 1, 4, 3, 'Брус сосна', 0, 'под ламели, крепится к боковинам', 'metal');
    const n = d.n;
    add(gr, 'Ламель ортопедическая' + lbl, n, b.mw + 1, 6.8, .8, 'Бук 68×8', 0, 'шаг ' + Math.round((b.ml + 1) / n * 10) + ' мм', 'metal');
    addHw('Основание', 'Ламеледержатель (пара)', n, 'пар', 1800);
    addHw('Крепёж', 'Ножка кровати ' + mm(b.lg) + ' мм', b.mw >= 140 ? 6 : 4, 'шт.', 16000);
    addHw('Крепёж', 'Кроватный замок / угловая стяжка', 4, 'шт.', 9000);
    joints_u += 16;
    const mp = Math.round(BED_STYLES[b.style].price * (b.mw * b.ml / 10000));
    addHw('Матрас', 'Матрас «' + BED_STYLES[b.style].ru + '» ' + mm(b.mw) + '×' + mm(b.ml) + '×' + mm(b.mt) + ' мм', b.kind === 'bunk' ? 2 : 1, 'шт.', mp);
    if (b.soft) addHw('Мебель', 'Мягкое изголовье (поролон + ткань)', 1, 'шт.', Math.round(250000 * d.W / 100));
    if (b.lift) addHw('Основание', 'Подъёмный механизм основания (2 газлифта)', 1, 'комплект', 650000);
    if ((b.drw | 0) > 0) {
      const dn = b.drw | 0, fl = (b.ml + 1) / dn - .3;
      add(gr, 'Фасад ящика' + lbl, dn, fl, b.sh - 4, t, body, per(fl, b.sh - 4), 'ящик под кроватью');
      add(gr, 'Боковина ящика' + lbl, dn * 2, 45, Math.max(8, b.sh - 9), t, body, 0);
      add(gr, 'Задняя/передняя ящика' + lbl, dn * 2, fl - 2 * t - 4, Math.max(8, b.sh - 9), t, body, 0);
      add(gr, 'Дно ящика' + lbl, dn, fl - 4, 45, .3, 'ХДФ 3 мм', 0, '', 'hdf');
      addHw('Ящики', 'Направляющие ящика (комплект)', dn, 'комплект', T.drawer);
    }
    if (b.kind === 'bunk') {
      add(gr, 'Боковина 2-го яруса' + lbl, 2, b.ml + 1, b.sh, t, body, per(b.ml + 1, b.sh), 'верхний ярус');
      add(gr, 'Брусок опорный 30×40 (2-й ярус)' + lbl, 2, b.ml + 1, 4, 3, 'Брус сосна', 0, '', 'metal');
      add(gr, 'Ламель ортопедическая (2-й ярус)' + lbl, n, b.mw + 1, 6.8, .8, 'Бук 68×8', 0, '', 'metal');
      addHw('Основание', 'Ламеледержатель (пара) 2-го яруса', n, 'пар', 1800);
      add(gr, 'Стойка 70×70' + lbl, 4, d.postH, 7, 7, 'Брус / клеёный массив', 0, 'угловые стойки', 'metal');
      const gl = (b.ladder === 'side') ? (b.ml + 1) * .55 : b.ml + 1;
      add(gr, 'Бортик верхнего яруса (длинный)' + lbl, b.ladder === 'side' ? 3 : 2, b.ladder === 'side' ? gl : b.ml + 1, b.rail, t, body, per(b.ml + 1, b.rail), 'защитный бортик');
      add(gr, 'Бортик верхнего яруса (торцевой)' + lbl, b.ladder === 'end' ? 1 : 2, d.W, b.rail, t, body, per(d.W, b.rail), 'защитный бортик');
      const sn = Math.max(3, b.steps | 0);
      add(gr, 'Стойка лестницы' + lbl, 2, b.lv2 + 6, 6, 2.5, 'Брус / клеёный массив', 0, 'под углом 12°', 'metal');
      add(gr, 'Ступень лестницы' + lbl, sn, 40, 6, 2.5, 'Клеёный массив', 0, 'шаг ' + Math.round(b.lv2 / sn * 10) + ' мм');
      addHw('Крепёж', 'Болты/стяжки стоек и крепление 2-го яруса', 8, 'шт.', 14000);
      joints_u += 24;
    }
  });
  (S.objs || []).forEach((q, i) => {
    const okind = q.mat === 'ply' ? 'ply' : q.mat === 'mdf' ? 'mdf' : undefined, t = q.mat === 'ply' ? 1.2 : S.t;
    const body = q.mat === 'ply' ? OBJ_MATS.ply : q.mat === 'mdf' ? 'МДФ крашеный ' + mm(S.t) + ' мм' : 'ЛДСП ' + mm(S.t) + ' мм';
    const addP = (grp, name, qty, L, Wd, tt, mat, edgeEach, note, kind) => { if (okind && !kind) add(grp, name, qty, L, Wd, tt, mat, 0, (note ? note + '; ' : '') + (okind === 'ply' ? 'торцы: шлифовка + масло/лак' : 'торцы: шпаклёвка + покраска'), okind); else add(grp, name, qty, L, Wd, tt, mat, edgeEach, note, kind); };
    const gr = OBJ_KINDS[q.kind].ru + ' ' + (i + 1), lbl = ' (' + OBJ_KINDS[q.kind].ru.toLowerCase() + ' ' + (i + 1) + ')', hnd = q.handles !== false;
    const fmat = q.fill === 'dsp' ? body : FILLS[q.fill], fth = q.fill === 'dsp' || q.fill === 'mdf' ? t : .4;
    const door = (name, qty, L, Wd, note) => { if (q.fill === 'dsp') addP(gr, name + lbl, qty, L, Wd, t, fmat, (2 * (L + Wd)) / 100, note); else addP(gr, name + lbl, qty, L, Wd, fth, fmat, (2 * (L + Wd)) / 100, note, q.fill); };
    const addDoorHw = (dn, dh) => { addHw('Двери', 'Петля с доводчиком', dn * (dh <= 90 ? 2 : dh <= 160 ? 3 : 4), 'шт.', T.hinge); if (hnd) addHw('Двери', 'Ручка', dn, 'шт.', T.handle); };
    if (q.kind === 'vert') { addP(gr, 'Вертикальная полка' + lbl, 1, q.h, q.d, q.w, body, (2 * (q.h + q.d)) / 100, 'стоит на полу/крепится к стене, кромка по периметру'); addHw('Крепёж', 'Уголок мебельный для крепления к стене/полу', 2, 'шт.', 6000); return; }
    if (q.kind === 'shelf') { addP(gr, 'Полка' + lbl, 1, q.w, q.d, t, body, (q.w + 2 * q.d) / 100, 'кромка перед + 2 торца'); addHw('Крепёж', 'Скрытое крепление полки (штанга-кронштейн)', 2, 'шт.', 18000); return; }
    if (q.kind === 'custom') {
      const E = objEdges(q), B = objBox(q), bw = B.x1 - B.x0, bz = B.z1 - B.z0, per = E.reduce((a, e) => a + e.L, 0) / 100;
      addP(gr, 'Дно по контуру' + lbl, 1, bw, bz, t, body, per, 'форма по чертежу (габарит ' + mm(bw) + '×' + mm(bz) + ' мм), кромка по контуру');
      addP(gr, 'Крышка по контуру' + lbl, 1, bw, bz, t, body, per, 'форма по чертежу, кромка по контуру');
      if (q.n > 0) addP(gr, 'Полка по контуру' + lbl, q.n, bw, bz, t, body, per, 'форма по чертежу, на полкодержатели');
      let run = 0, runN = 0; const flush = () => { if (run > 0) { addP(gr, 'Гнутая стенка' + lbl, 1, q.h - 2 * t, run, okind === 'ply' ? 1.2 : t, body, 0, 'гнётся по шаблону/склеивается из ламелей, длина по кривой ' + mm(run) + ' мм, сегментов ' + runN, okind || 'dsp'); if (okind !== 'ply') addHw('Материал', 'Работа: гнутьё/фрезеровка кривой стенки', Math.ceil(run / 100), 'пог. м', 90000); else addHw('Материал', 'Работа: гнутьё фанеры по шаблону', Math.ceil(run / 100), 'пог. м', 70000); } run = 0; runN = 0; };
      E.forEach(e => { if (e.curved) { run += e.L; runN++; return; } flush(); if (e.open) return; const L = Math.max(5, e.L - (e.door ? .4 : 2 * t)); if (e.door) { door('Дверь', 1, q.h - .4, L, 'распашная, сторона ' + (e.i + 1)); addDoorHw(1, q.h); } else addP(gr, 'Стенка (сторона ' + (e.i + 1) + ')' + lbl, 1, q.h - 2 * t, L, t, body, (q.h - 2 * t) / 100, 'видимая кромка по высоте'); });
      flush();
      if (q.back) addP(gr, 'Задняя стенка' + lbl, 1, E.reduce((a, e) => Math.max(a, e.L), 0), q.h - 2 * t, .3, 'ХДФ 3 мм', 0, 'ХДФ по самой длинной стороне у стены', 'hdf');
      joints_u += 8 + E.length * 4;
      return;
    }
    const w = q.w, d = q.d, h = q.h;
    addP(gr, 'Дно' + lbl, 1, w, d, t, body, (w + 2 * d) / 100, 'боковины стоят на дне; кромка перед + 2 торца');
    addP(gr, 'Боковина' + lbl, 2, h - t, d, t, body, (h - t) / 100, 'кромка по переднему торцу');
    addP(gr, 'Крышка' + lbl, 1, w - 2 * t, d, t, body, (w - 2 * t) / 100, 'между боковинами');
    if (q.n > 0) addP(gr, 'Полка' + lbl, q.n, w - 2 * t - .2, d - 2, t, body, (w - 2 * t - .2) / 100, 'на 4 полкодержателя');
    if (q.back) addP(gr, 'Задняя стенка' + lbl, 1, w - 2 * t, h - 2 * t, .3, 'ХДФ 3 мм', 0, 'ставится на дно между боковин', 'hdf');
    if (q.dn > 0) { const dh = q.dh > 0 ? Math.min(q.dh, h - 2 * t) : h - 2 * t, dw = w / q.dn - .3; door('Дверь', q.dn, dh - .4, dw, 'распашная'); addDoorHw(q.dn, dh); }
    if (q.kind === 'wallcab') addHw('Крепёж', 'Навес для шкафа (регулируемый, пара)', 1, 'пара', 40000);
    joints_u += 10;
  });
  addHw('Крепёж', 'Крепёж зеркальных / стеклянных панелей (подвесы, клей)', (S.panels || []).length, 'шт.', 35000);
  addHw('Крепёж', 'Конфирмат 7×50', joints + joints_u, 'шт.', 600);
  addHw('Крепёж', 'Опора-ножка цоколя', feet, 'шт.', 6000);
  addHw('Крепёж', 'Уголок крепления к стене', 4 * Math.max(1, g.runs.length) + 2 * g.mz.length, 'шт.', 3000);
  let rods = 0, hooks = 0, ledM = 0, basket = 0, pant = 0, pins = g.mz.reduce((a, m) => a + (m.shelves | 0) * 4 * m.comp.length, 0), lifts = 0, lowers = 0; const drw = {};
  S.cols.forEach((c, ci) => {
    if (c.gap) return;
    const lbl = ' (отсек ' + (ci + 1) + ')', D = g.cols[ci].D, splitsN = colSplits(S, g, ci).length;
    if (splitsN) { add('Наполнение', 'Перегородка под двери' + lbl, splitsN, g.cols[ci].y1 - g.y0 - S.plinth * 0 - 2 * t, D - .3, t, body, (g.cols[ci].y1 - g.y0 - 2 * t) / 100, 'у каждой двери своя секция; кромка по переднему торцу'); joints_u += splitsN * 4; }
    c.items.forEach(it => {
      if (it.type === 'shelf') { const d = it.d || D - 2.5, sp = splitsN, ss = shelfSpan(c, c.w, t, it), sw = sp ? (c.w - .2 - sp * t) / (sp + 1) : ss.w - .2, vside = !sp && ss.w < c.w - .5 ? (ss.x0 > 0 ? ' (справа от панели)' : ' (слева от панели)') : ''; add('Наполнение', 'Полка' + lbl + (sp ? ' (между перегородками)' : '') + vside, sp + 1, sw, d, t, body, sw / 100, 'на 4 полкодержателя'); pins += 4 * (sp + 1); }
      else if (it.type === 'rod') { rods++; add('Наполнение', 'Штанга ⌀25' + lbl, 1, c.w - .6, 2.5, 2.5, 'Хром, труба 25×15', 0, 'длина ' + mm(c.w - .6) + ' мм', 'metal'); }
      else if (it.type === 'drawer') {
        const bw = c.w - .4;
        add('Ящики', 'Фасад ящика' + lbl, 1, bw, it.fh - .3, t, body, (2 * (bw + it.fh)) / 100);
        if (it.sys === 'tier') { add('Ящики', 'Боковина ящика' + lbl, 2, D - 8, Math.max(8, it.fh - 6), t, body, 0); add('Ящики', 'Задняя ящика' + lbl, 1, bw - 5.4, Math.max(8, it.fh - 6), t, body, 0); add('Ящики', 'Дно ящика' + lbl, 1, bw - 3.6, D - 9, .3, 'ХДФ 3 мм', 0, '', 'hdf'); }
        drw[it.sys] = (drw[it.sys] || 0) + 1;
      }
      else if (it.type === 'idoor') {
        const iw = it.w || (c.w - it.x), ih = it.y1 - it.y;
        add('Двери', 'Дверца в отсеке' + lbl, 1, ih - .4, iw - .4, t, body, (2 * (ih + iw)) / 100, 'открывание: ' + ({ L: 'влево', R: 'вправо', U: 'вверх', D: 'вниз' }[it.dir] || 'влево'));
        if (it.dir === 'U') lifts += 2; else if (it.dir === 'D') lowers += 2; else hinges0 += ih <= 90 ? 2 : ih <= 160 ? 3 : 4;
        handles0++;
      }
      else if (it.type === 'shoe') { for (let k = 0; k < it.n; k++) add('Наполнение', 'Обувная полка (наклонная)' + lbl, 1, c.w - .2, D - 6, t, body, (c.w - .2) / 100, 'угол ≈ 12°'); pins += it.n * 4; }
      else if (it.type === 'pant') pant++;
      else if (it.type === 'basket') basket++;
      else if (it.type === 'hook') { hooks++; add('Наполнение', 'Планка для крючков' + lbl, 1, c.w - .4, 4, t, body, (c.w - .4) / 100); }
      else if (it.type === 'led') ledM += c.w / 100;
      else if (it.type === 'vpanel') add('Наполнение', 'Вертикальная панель' + lbl, 1, it.y1 - it.y, D - 2.5, t, body, (it.y1 - it.y) / 100);
    });
  });
  addHw('Фурнитура', 'Штанга хромированная ⌀25 (в сборе)', rods, 'шт.', T.rod);
  addHw('Фурнитура', 'Штангодержатель', rods * 2, 'шт.', 0, 'входит в цену штанги');
  addHw('Фурнитура', 'Полкодержатель ⌀5', pins, 'шт.', 1500);
  addHw('Фурнитура', 'Брючница выдвижная', pant, 'шт.', T.pant);
  addHw('Фурнитура', 'Корзина выдвижная', basket, 'шт.', Math.round(T.pant * .55));
  addHw('Фурнитура', 'Крючки (комплект)', hooks, 'шт.', T.hook);
  addHw('Свет', 'LED-лента 12 В', ledM, 'м', T.led);
  if (ledM > 0 || S.led) addHw('Свет', 'Блок питания и датчик', 1, 'шт.', T.ledKit);
  Object.keys(drw).forEach(k => addHw('Ящики', 'Направляющие / система: ' + (DRAWER_SYS[k] ? DRAWER_SYS[k].ru : k), drw[k], 'комплект', (DRAWER_SYS[k] && DRAWER_SYS[k].price) || T.drawer));
  const doors = doorList(S); let hinges = 0, handles = 0, slidingN = 0;
  doors.forEach(d => {
    d.gf = S.doors.gf || 4; const lbl = d.zone === 'mezz' ? ' антресоли ' + (d.mi + 1) + '.' : (d.ci != null ? ' отсека ' + (d.ci + 1) + '.' : ' '), nm = d.zone === 'mezz' ? d.i + 1 : (d.ci != null ? d.ri + 1 : d.i + 1);
    const mat = d.fill === 'dsp' ? body : FILLS[d.fill];
    if (d.fill === 'glass') { const gf = d.gf || 4; add('Двери', 'Стекло' + lbl + nm, 1, d.h - 2 * gf, d.w - 2 * gf, .4, 'Стекло 4 мм, полировка кромки', (2 * (d.h + d.w - 4 * gf)) / 100, 'размер стекла ' + mm(d.w - 2 * gf) + '×' + mm(d.h - 2 * gf), 'glass'); add('Двери', 'Рамка алюминиевая' + lbl + nm, 1, d.h, d.w, gf, 'Алюминий, профиль ' + mm(gf) + ' мм', (2 * (d.h + d.w)) / 100, 'периметр', 'frame'); }
    else if (d.fill === 'dsp') add('Двери', 'Дверь' + lbl + nm, 1, d.h, d.w, t, mat, (2 * (d.h + d.w)) / 100, d.sliding ? 'в раме системы' : '');
    else add('Двери', 'Вставка / дверь' + lbl + nm, 1, d.h, d.w, .4, mat, (2 * (d.h + d.w)) / 100, 'полировка кромки', d.fill);
    if (!d.sliding) { if (d.hinge === 'U') lifts += 2; else if (d.hinge === 'D') lowers += 2; else hinges += d.h <= 90 ? 2 : d.h <= 160 ? 3 : d.h <= 220 ? 4 : 5; if (S.doors.handles !== false) handles++; } else slidingN = d.n;
  });
  addHw('Двери', 'Петля с доводчиком', hinges + hinges0, 'шт.', T.hinge);
  addHw('Двери', 'Подъёмник (газлифт) для дверей вверх', lifts, 'шт.', 85000);
  addHw('Двери', 'Откидной механизм (ограничители) для дверей вниз', lowers, 'шт.', 45000);
  addHw('Двери', 'Ручка', handles + handles0, 'шт.', T.handle);
  if (slidingN) {
    let kit = T.doorKit * Math.pow(slidingN / 3, .9); const rw = g.runs[0].x1 - g.runs[0].x0;
    if (rw > 270) kit += (rw / 100 - 2.7) * 2 * T.rail;
    addHw('Двери', 'Система купе (направляющие, ролики, профили) на ' + slidingN + ' двери', 1, 'комплект', kit);
  }
  return { parts, hw, doors, g };
}

// итоги по кромке: метры по видам (0,4 мм на корпус, 2 мм на фасады), площади материалов
export function edgeTotals(parts) {
  const e = { '0,4': 0, '2': 0 }; let dsp = 0, facade = 0, hdf = 0;
  parts.forEach(p => { if (p.edgeT) e[p.edgeT] = (e[p.edgeT] || 0) + p.edgeM; const a = p.L * p.W * p.qty / 1e6; if (p.kind === 'hdf') hdf += a; else if (p.kind === 'dsp') { if (/^(Дверь|Фасад)/.test(p.name)) facade += a; else dsp += a; } });
  const r = v => Math.round(v * 100) / 100;
  return { e04: r(e['0,4']), e2: r(e['2']), total: r(e['0,4'] + e['2']), dsp: r(dsp), facade: r(facade), hdf: r(hdf) };
}
export function pricing(S, bp) {
  bp = bp || buildParts(S);
  const T = P.tiers[S.tier], pm = T.sheet / P.sheetArea * P.waste + P.cutM2 + 3 * P.edgeM, lines = [];
  let dspM2 = 0, plyM2 = 0, hdfM2 = 0, frameM = 0, mdfM2 = 0, slatM3 = 0, glass = {};
  bp.parts.forEach(p => {
    const a = p.L * p.W * p.qty / 1e6 * (p.mult || 1);
    if (p.kind === 'frame') { frameM += p.edgeM; return; }
    if (p.kind === 'slat') { slatM3 += p.L * p.W * p.t * p.qty / 1e9; return; }
    if (p.kind === 'mdf') { mdfM2 += a; return; }
    if (p.kind === 'ply') { plyM2 += a; return; }
    if (p.kind === 'dsp') dspM2 += a; else if (p.kind === 'hdf') hdfM2 += a; else if (p.kind !== 'metal') glass[p.kind] = (glass[p.kind] || 0) + a;
  });
  const add = (n, q, c) => { if (c > 0) lines.push({ n, q, c: Math.round(c) }); };
  add('ЛДСП с распилом и кромкой', Math.round(dspM2 * 100) / 100 + ' м²', dspM2 * pm);
  add('Задняя стенка ХДФ', Math.round(hdfM2 * 100) / 100 + ' м²', hdfM2 * P.hdfM2);
  Object.keys(glass).forEach(k => add(k === 'glass' ? 'Стекло дверей' : (FILLS[k] || k), Math.round(glass[k] * 100) / 100 + ' м²', glass[k] * P.glass[k]));
  add('Фанера берёзовая 12 мм (распил)', Math.round(plyM2 * 100) / 100 + ' м²', plyM2 * P.plyM2);
  add('Фрезерованный МДФ (двери, панели)', Math.round(mdfM2 * 100) / 100 + ' м²', mdfM2 * P.mdfM2);
  add('Клеёный МДФ — рейки перегородок', Math.round(slatM3 * 1000) / 1000 + ' м³', slatM3 * P.slatM3);
  add('Алюминиевая рамка дверей', Math.round(frameM * 10) / 10 + ' м', frameM * P.frameM);
  bp.hw.forEach(h => add(h.name, h.qty + ' ' + h.unit, h.qty * h.price));
  const mat = lines.reduce((a, l) => a + l.c, 0), front = bp.g.W / 100 * bp.g.totalH / 100 + S.cols.reduce((a, c) => a + (c.det ? (c.w + 2 * S.t) / 100 * (c.H || S.H) / 100 : 0), 0), labor = front * P.laborM2 * P.Klabor;
  const total = Math.round((mat * P.K + labor + P.delivery) / 10000) * 10000;
  return { lines, mat, labor: Math.round(labor), delivery: P.delivery, total, front, dspM2, hdfM2 };
}

/* ---- сохранение в ссылке ---- */
export function encodeState(S) { const j = JSON.stringify(S), b = btoa(unescape(encodeURIComponent(j))); return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
export function decodeState(str) {
  try {
    let s = str.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
    const S = JSON.parse(decodeURIComponent(escape(atob(s))));
    return sanitize(S);
  } catch (e) { return null; }
}
export function sanitize(S) {
  if (!S || typeof S !== 'object' || !Array.isArray(S.cols)) return null;
  const D = defState(), n = (v, a, b, d) => { v = Number(v); return isFinite(v) ? clamp(v, a, b) : d; };
  const o = { v: 2, W: n(S.W, 60, 800, 240), H: n(S.H, 100, 320, 200), D: n(S.D, 25, 90, 60), t: S.t === 1.8 ? 1.8 : 1.6, plinth: n(S.plinth, 0, 20, 8), tier: n(S.tier, 0, 2, 1) | 0, color: n(S.color, 0, 99, 0) | 0, custom: /^#[0-9a-f]{6}$/i.test(S.custom || '') ? S.custom : null,
    mezzes: [],
    doors: { kind: ['none', 'swing', 'sliding'].includes(S.doors && S.doors.kind) ? S.doors.kind : 'none', n: n(S.doors && S.doors.n, 1, 8, 3) | 0, fills: (S.doors && Array.isArray(S.doors.fills) ? S.doors.fills : D.doors.fills).map(f => FILLS[f] ? f : 'dsp').slice(0, 8), laco: n(S.doors && S.doors.laco, 0, 5, 0) | 0, handles: !(S.doors && S.doors.handles === false), gf: n(S.doors && S.doors.gf, 2, 30, 4), dir: (S.doors && Array.isArray(S.doors.dir) ? S.doors.dir : []).slice(0, 8).map(v => ['auto', 'L', 'R', 'U', 'D'].includes(v) ? v : 'auto') },
    led: !!S.led, name: String(S.name || 'Мой шкаф').slice(0, 60), cols: [] };
  while (o.doors.fills.length < 8) o.doors.fills.push('dsp');
  S.cols.slice(0, 14).forEach(c => {
    const col = { id: uid(), w: n(c && c.w, 15, 250, 60), items: [] };
    if (c && c.gap) col.gap = true;
    if (c && c.dn != null) col.dn = n(c.dn, 0, 4, 1) | 0;
    if (c && c.dp === false) col.dp = false;
    if (c && c.det && isFinite(c.det.x) && isFinite(c.det.z)) col.det = { x: r1(n(c.det.x, -1500, 3000, 0)), z: r1(n(c.det.z, -1500, 3000, 0)), rot: [0, 90, 180, 270].includes(c.det.rot) ? c.det.rot : 0 };
    if (c && FILLS[c.df] && c.df !== 'dsp') col.df = c.df;
    if (c && ['L', 'R', 'U', 'D'].includes(c.dd)) col.dd = c.dd;
    (!col.gap && c && Array.isArray(c.items) ? c.items : []).slice(0, 40).forEach(it => {
      if (it && it.type === 'drawers') { const cnt = n(it.n, 1, 8, 3) | 0, fh0 = n(it.fh, 8, 40, 18); for (let k = 0; k < cnt; k++) { const b0 = mkItem('drawer', n(it.y, 0, 330, 10) + k * fh0); b0.fh = fh0; b0.sys = DRAWER_SYS[it.sys] ? it.sys : 'tier'; col.items.push(b0); } return; }
      if (!it || !ITEM_TYPES[it.type]) return;
      const b = mkItem(it.type, n(it.y, 0, 330, 50));
      if (it.type === 'shelf') b.d = it.d ? n(it.d, 15, 85, 57.5) : null;
      if (it.type === 'drawer') { b.fh = n(it.fh, 8, 40, 18); b.sys = DRAWER_SYS[it.sys] ? it.sys : 'tier'; }
      if (it.type === 'idoor') { b.y1 = n(it.y1, 0, 330, b.y + 60); b.x = n(it.x, 0, 250, 0); b.w = it.w ? n(it.w, 8, 250, 40) : null; b.dir = ['L', 'R', 'U', 'D'].includes(it.dir) ? it.dir : 'L'; }
      if (it.type === 'shoe') b.n = n(it.n, 1, 6, 3) | 0;
      if (it.type === 'basket') b.h = n(it.h, 10, 40, 18);
      if (it.type === 'vpanel') { b.y1 = n(it.y1, 0, 330, b.y + 60); b.x = n(it.x, 0, 200, 0); b.sh = it.sh === 'R' ? 'R' : 'L'; }
      col.items.push(b);
    });
    o.cols.push(col);
  });
  if (o.cols.length && !o.cols.some(c => !c.gap)) o.cols[0].gap = false;
  const fpOf = q => (q && q.fp && isFinite(q.fp.x) && isFinite(q.fp.z)) ? { x: r1(n(q.fp.x, -1500, 3000, 0)), z: r1(n(q.fp.z, -1500, 3000, 0)), rot: [0, 90, 180, 270].includes(q.fp.rot) ? q.fp.rot : 0 } : undefined;
  o.panels = (Array.isArray(S.panels) ? S.panels : []).slice(0, 24).map(p => ({ id: uid(), x: r1(n(p && p.x, -300, 1200, 0)), y: r1(n(p && p.y, 0, 340, 20)), w: r1(n(p && p.w, 10, 400, 60)), h: r1(n(p && p.h, 10, 340, 180)), kind: PANEL_KINDS[p && p.kind] ? p.kind : 'mirror', mount: p && p.mount === 'front' ? 'front' : (p && p.mount === 'free' ? 'free' : 'wall'), frame: !!(p && p.frame), fw: r1(n(p && p.fw, 1, 15, 3)), shape: ['rect', 'round', 'oval', 'arch'].includes(p && p.shape) ? p.shape : 'rect', bl: !!(p && p.bl), pat: PANEL_PATTERNS[p && p.pat] ? p.pat : 'vgroove', gp: r1(n(p && p.gp, 3, 60, 12)), sw: n(p && p.sw, 10, 400, 100), sd: n(p && p.sd, 6, 100, 32), sg: n(p && p.sg, 0, 200, 20), so: p && p.so === 'h' ? 'h' : 'v', pz: r1(n(p && p.pz, 0, 400, 30)), fp: fpOf(p) }));
  { const rm = S.room || {}, P = Array.isArray(rm.poly) ? rm.poly.map(p => [Number(p[0]), Number(p[1])]) : null;
    o.room = { W: r1(n(rm.W, 100, 1500, 400)), D: r1(n(rm.D, 100, 1500, 300)), H: r1(n(rm.H, 180, 400, 260)), ox: r1(n(rm.ox, -500, 1500, 0)), oz: r1(n(rm.oz, -500, 1500, 0)), rot: [0, 90, 180, 270].includes(rm.rot) ? rm.rot : 0, mag: rm.mag !== false, poly: P && P.every(p => p.every(v => isFinite(v))) && rpValid(P) ? P : null, set: !!rm.set }; }
  o.units = (Array.isArray(S.units) ? S.units : []).slice(0, 24).map(u => ({ id: uid(), x: r1(n(u && u.x, -600, 1600, 0)), pz: r1(n(u && u.pz, 0, 400, 0)), w: r1(n(u && u.w, 25, 300, 80)), h: r1(n(u && u.h, 30, 200, 100)), d: r1(n(u && u.d, 15, 80, 35)), kind: UNIT_KINDS[u && u.kind] ? u.kind : 'flap', n: n(u && u.n, 1, 8, 2) | 0, fill: ['dsp', 'mdf', 'glass', 'mirror'].includes(u && u.fill) ? u.fill : 'dsp', seat: !!(u && u.seat), legs: r1(n(u && u.legs, 0, 20, 8)), fp: fpOf(u) }));
  o.beds = (Array.isArray(S.beds) ? S.beds : []).slice(0, 12).map(b => { const k = b && b.kind === 'bunk' ? 'bunk' : 'single', d = mkBed(0, k); return { id: uid(), x: r1(n(b && b.x, -800, 1800, 0)), pz: r1(n(b && b.pz, 0, 500, 0)), rot: b && b.rot === 90 ? 90 : 0, kind: k, mw: r1(n(b && b.mw, 50, 220, d.mw)), ml: r1(n(b && b.ml, 100, 240, d.ml)), mt: r1(n(b && b.mt, 5, 40, d.mt)), style: BED_STYLES[b && b.style] ? b.style : d.style, mcol: n(b && b.mcol, 0, 5, 0) | 0, sh: r1(n(b && b.sh, 10, 60, d.sh)), hh: r1(n(b && b.hh, 20, 220, d.hh)), fh: r1(n(b && b.fh, 10, 220, d.fh)), lg: r1(n(b && b.lg, 0, 40, d.lg)), drw: n(b && b.drw, 0, 4, 0) | 0, lift: !!(b && b.lift), soft: !!(b && b.soft), bedding: !(b && b.bedding === false), lv2: r1(n(b && b.lv2, 80, 200, 150)), rail: r1(n(b && b.rail, 10, 60, 28)), ladder: b && b.ladder === 'side' ? 'side' : 'end', steps: n(b && b.steps, 3, 9, 5) | 0, fp: fpOf(b) }; });
  o.objs = (Array.isArray(S.objs) ? S.objs : []).slice(0, 80).map(q => {
    const kind = q && OBJ_KINDS[q.kind] ? q.kind : 'book', d = mkObj(kind, 0, 0), poly = kind === 'custom' && Array.isArray(q.poly) && q.poly.length >= 3 && q.poly.length <= 40 && q.poly.every(p => Array.isArray(p) && isFinite(p[0]) && isFinite(p[1])) ? q.poly.map(p => [r1(n(p[0], -2000, 2000, 0)), r1(n(p[1], -2000, 2000, 0))]) : (kind === 'custom' ? CORNER_L.map(p => p.slice()) : null);
    return { id: uid(), kind, x: r1(n(q && q.x, -800, 2500, 0)), z: r1(n(q && q.z, -800, 2500, 0)), rot: [0, 90, 180, 270].includes(q && q.rot) ? q.rot : 0, y: r1(n(q && q.y, 0, 300, d.y)), w: r1(n(q && q.w, 1, 600, d.w)), d: r1(n(q && q.d, 5, 120, d.d)), h: r1(n(q && q.h, 1, 320, d.h)), n: n(q && q.n, 0, 12, d.n) | 0, dn: n(q && q.dn, 0, 4, d.dn) | 0, dh: r1(n(q && q.dh, 0, 320, 0)), back: q ? q.back !== false : d.back, fill: ['dsp', 'glass', 'mdf', 'mirror'].includes(q && q.fill) ? q.fill : 'dsp', handles: !(q && q.handles === false), mat: ['dsp', 'ply', 'mdf'].includes(q && q.mat) ? q.mat : 'dsp', color: q && /^#[0-9a-fA-F]{6}$/.test(q.color || '') ? q.color : '', poly, ed: poly ? poly.map((_, i) => (q && Array.isArray(q.ed) ? Math.max(0, Math.min(3, q.ed[i] | 0)) : 0)) : null };
  });
  recalcW(o);
  if (Array.isArray(S.mezzes)) S.mezzes.slice(0, 8).forEach(m => { if (m) o.mezzes.push({ id: uid(), x: r1(n(m.x, -100, 900, 0)), w: r1(n(m.w, 20, 900, 60)), h: r1(n(m.h, 15, 120, 40)), y: r1(n(m.y, 0, 340, o.H)), n: n(m.n, 0, 10, 2) | 0, shelves: n(m.shelves, 0, 3, 0) | 0, fill: FILLS[m.fill] ? m.fill : 'dsp', div: (Array.isArray(m.div) ? m.div : []).slice(0, 7).map(v => r1(n(v, 5, 800, 30))), cd: (Array.isArray(m.cd) ? m.cd : []).slice(0, 8).map(v => v == null ? null : n(v, 0, 5, 1) | 0), dir: (Array.isArray(m.dir) ? m.dir : []).slice(0, 8).map(v => ['swing', 'U', 'D'].includes(v) ? v : 'swing') }); });
  else if (S.mezz && S.mezz.on) {   // старый формат: одна антресоль сверху на всю ширину
    const mh = n(S.mezz.h, 15, 90, 40); o.H = r1(Math.max(100, o.H - mh - o.t)); o.mezzes.push({ id: uid(), x: 0, w: o.W, h: r1(mh + o.t), y: o.H, n: n(S.mezz.n, 0, 10, 3) | 0, shelves: n(S.mezz.shelves, 0, 3, 0) | 0 });
  }
  return o;
}
