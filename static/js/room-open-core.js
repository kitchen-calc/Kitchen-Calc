/* Двери, окна, розетки и другие элементы стен — общий модуль для конструкторов шкафа и кухни.
   Элемент стоит на стене: номер стены, расстояние от начала стены до его центра, размеры и высота от пола. */

export const OPEN_KINDS = {
  door: { ru: 'Дверь', icon: '🚪', w: 90, h: 210, y: 0 },
  balcony: { ru: 'Балконная дверь', icon: '🪟', w: 80, h: 220, y: 0, n: 1 },
  window: { ru: 'Окно', icon: '🪟', w: 120, h: 140, y: 90, n: 2 },
  socket: { ru: 'Розетка', icon: '🔌', w: 8, h: 8, y: 30 },
  socket2: { ru: 'Розетка двойная', icon: '🔌', w: 14, h: 8, y: 30 },
  switch: { ru: 'Выключатель', icon: '💡', w: 8, h: 8, y: 90 },
  radiator: { ru: 'Радиатор', icon: '♨', w: 100, h: 60, y: 10 },
  vent: { ru: 'Вентиляция', icon: '🌀', w: 15, h: 15, y: 230 },
  pipe: { ru: 'Труба (вода / газ)', icon: '🚰', w: 8, h: 260, y: 0 },
  column: { ru: 'Колонна / выступ', icon: '▮', w: 40, h: 260, y: 0, d: 40 }
};
export const OPEN_VARIANTS = {
  window: [['plain', 'Стандартное'], ['fixed', 'Глухое'], ['transom', 'С фрамугой'], ['arch', 'Арочное'], ['round', 'Круглое'], ['pano', 'Панорамное (в пол)']],
  balcony: [['plain', 'Одностворчатая'], ['glass', 'Со стеклопакетом'], ['double', 'Двустворчатая']],
  door: [['flat', 'Глухая'], ['glass', 'Со стеклом'], ['panel', 'Филёнчатая'], ['double', 'Двустворчатая'], ['sliding', 'Раздвижная'], ['arch', 'Арка (проём)'], ['entry', 'Входная (металл)']]
};
export const OPEN_COLORS = {
  window: [['#f4f4f2', 'Белый'], ['#7a5230', 'Дерево'], ['#4a4d52', 'Антрацит'], ['#c9b79c', 'Бежевый']],
  balcony: [['#f4f4f2', 'Белый'], ['#7a5230', 'Дерево'], ['#4a4d52', 'Антрацит']],
  door: [['#f1efe9', 'Белая'], ['#b98b5a', 'Дуб'], ['#6b4428', 'Орех'], ['#3b2b24', 'Венге'], ['#8a8f94', 'Серая'], ['#222426', 'Чёрная']]
};
export const openVariantName = o => { const v = (OPEN_VARIANTS[o.kind] || []).find(x => x[0] === o.v); return v ? v[1] : ''; };
let _uid = 0; const uid = () => 'o' + Date.now().toString(36).slice(-4) + (++_uid).toString(36);

export function roomEdges(P) {   // стены комнаты: a,b, длина, направление, внутренняя нормаль
  const n = P.length, inside = (x, z) => { let c = false; for (let i = 0, j = n - 1; i < n; j = i++) { const a = P[i], b = P[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  return P.map((a, i) => {
    const b = P[(i + 1) % n], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1, ex = dx / L, ez = dz / L, mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2;
    let nx = -ez, nz = ex; if (!inside(mx + nx * 2, mz + nz * 2)) { nx = -nx; nz = -nz; }
    return { i, a, b, L, ex, ez, nx, nz };
  });
}
export function mkOpen(kind, wall, off, extra) {
  const k = OPEN_KINDS[kind] || OPEN_KINDS.door;
  return Object.assign({ id: uid(), kind, wall: wall | 0, off: off == null ? 0 : off, w: k.w, h: k.h, y: k.y, d: k.d || 0, n: k.n || 1, v: (OPEN_VARIANTS[kind] || [[null]])[0][0], c: 0 }, extra || {});
}
export function sanitizeOpens(arr, P) {
  const n = Math.max(1, P.length), E = roomEdges(P), num = (v, a, b, d) => { v = parseFloat(v); return isFinite(v) ? Math.min(b, Math.max(a, v)) : d; };
  return (Array.isArray(arr) ? arr : []).slice(0, 80).map(q => {
    const kind = q && OPEN_KINDS[q.kind] ? q.kind : 'door', k = OPEN_KINDS[kind], wall = Math.min(n - 1, Math.max(0, (q && q.wall | 0) || 0));
    const w = Math.round(num(q && q.w, 2, 600, k.w) * 10) / 10, L = E[wall] ? E[wall].L : 400;
    return { id: (q && typeof q.id === 'string' && q.id) || uid(), kind, wall, w, h: Math.round(num(q && q.h, 2, 400, k.h) * 10) / 10, y: Math.round(num(q && q.y, 0, 400, k.y) * 10) / 10, d: Math.round(num(q && q.d, 0, 200, k.d || 0) * 10) / 10, n: Math.round(num(q && q.n, 1, 8, k.n || 1)), v: (OPEN_VARIANTS[kind] || []).some(x => x[0] === (q && q.v)) ? q.v : ((OPEN_VARIANTS[kind] || [[null]])[0][0]), c: Math.round(num(q && q.c, 0, 5, 0)), off: Math.round(num(q && q.off, 0, Math.max(0, L - w), Math.max(0, (L - w) / 2)) * 10) / 10 };
  });
}
export const openCenter = (o, E) => { const e = E[o.wall]; if (!e) return null; const c = o.off + o.w / 2; return { x: e.a[0] + e.ex * c, z: e.a[1] + e.ez * c, e }; };
export function openRect2D(o, E) {   // прямоугольник на плане (для занятости пола дверью / колонной)
  const c = openCenter(o, E); if (!c) return null; const e = c.e, d = o.kind === 'column' ? o.d || 40 : (o.kind === 'door' || o.kind === 'balcony' ? o.w : 0);
  if (!d) return null;
  const x0 = c.x - e.ex * o.w / 2, z0 = c.z - e.ez * o.w / 2, x1 = c.x + e.ex * o.w / 2 + e.nx * d, z1 = c.z + e.ez * o.w / 2 + e.nz * d;
  return { x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1) };
}

