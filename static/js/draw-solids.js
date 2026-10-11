/* Настоящая геометрия изделий для чертежей: из чего изделие состоит (доски, дверцы, ящики, ножки), а не коробка-габарит.
   Все размеры — см. Коробка: {x0,x1,y0,y1,z0,z1,r}, r: 'b' — корпус, 'f' — фасад (дверца/ящик), 'a' — ниша техники, 'l' — тонкая линия на лице.
   «Многогранник» (свой контур): {poly:[[x,z],…], y0, y1, r}.
   Локальные оси изделия: x — ширина, z — глубина (лицо на z = d), y — вверх. В комнату изделие ставится поворотом rot (0/90/180/270) вокруг вертикали. */
import { ptAabb, objPoly, objBox, objFoot, bedDims, itemRect, itemBase, freeItem, colRect, geom, doorList, wfoot } from '/static/js/shkaf-pro-core.js?v=23';

const B = (x0, x1, y0, y1, z0, z1, r) => ({ x0, x1, y0, y1, z0, z1, r: r || 'b' });
const rot2 = (x, z, rot) => { const a = (rot || 0) * Math.PI / 180, c = Math.round(Math.cos(a)), s = Math.round(Math.sin(a)); return [x * c + z * s, -x * s + z * c]; };

/* поставить локальные коробки в комнату: (X, Z) — угол габарита на полу после поворота, yb — высота основания */
export function placeLocal(local, rot, w, d, X, Z, yb, bb) {
  const b0 = bb || { x0: 0, x1: w, z0: 0, z1: d };
  const cs = [[b0.x0, b0.z0], [b0.x1, b0.z0], [b0.x1, b0.z1], [b0.x0, b0.z1]].map(p => rot2(p[0], p[1], rot)), mx = Math.min(...cs.map(p => p[0])), mz = Math.min(...cs.map(p => p[1]));
  const tp = (x, z) => { const p = rot2(x, z, rot); return [p[0] - mx + X, p[1] - mz + Z]; };
  return local.map(b => {
    if (b.poly) return Object.assign({}, b, { poly: b.poly.map(p => tp(p[0], p[1])), y0: b.y0 + yb, y1: b.y1 + yb });
    const c = [tp(b.x0, b.z0), tp(b.x1, b.z0), tp(b.x1, b.z1), tp(b.x0, b.z1)];
    return { x0: Math.min(...c.map(p => p[0])), x1: Math.max(...c.map(p => p[0])), z0: Math.min(...c.map(p => p[1])), z1: Math.max(...c.map(p => p[1])), y0: b.y0 + yb, y1: b.y1 + yb, r: b.r };
  });
}
export const frontDir = rot => { const a = (rot || 0) * Math.PI / 180; return [Math.round(Math.sin(a)), Math.round(Math.cos(a))]; };   // куда смотрит лицо в комнате

/* ---------- добавленные изделия (свои шкафчики, стеллажи, столы, полки) ---------- */
export function objLocal(q, t) {
  t = t || (q.mat === 'ply' ? 1.2 : 1.6);
  const w = q.w, d = q.d, h = q.h, out = [], n = q.n | 0, dn = q.dn | 0;
  if (q.kind === 'shelf') return [B(0, w, 0, t, 0, d)];
  if (q.kind === 'vert') return [B(0, Math.max(.3, w), 0, h, 0, d)];
  if (q.kind === 'boards') return (q.bd || []).map(r => B(r[0], r[0] + r[2], r[1], r[1] + r[3], 0, d));
  if (q.kind === 'parts') return (q.pt || []).map(b => { const A = ptAabb(b); return B(A[0], A[3], A[1], A[4], A[2], A[5], b[0] >= 2 && b[0] <= 5 ? 'f' : (b[0] === 6 ? 'f' : 'b')); });
  if (q.kind === 'custom') return [{ poly: objPoly(q), y0: 0, y1: h, r: 'b' }];
  out.push(B(0, t, 0, h, 0, d), B(w - t, w, 0, h, 0, d), B(t, w - t, 0, t, 0, d), B(t, w - t, h - t, h, 0, d));
  for (let k = 1; k <= n; k++) { const y = (h - t) * k / (n + 1); out.push(B(t, w - t, y, y + t, 0, d - 1)); }
  if (q.back) out.push(B(t, w - t, t, h - t, 0, .3));
  if (dn > 0) { const dh = q.dh > 0 ? Math.min(q.dh, h - 2 * t) : h - 2 * t, dw = (w - 2 * t) / dn; for (let k = 0; k < dn; k++) out.push(B(t + k * dw + .15, t + (k + 1) * dw - .15, t, t + dh, d - 1.8, d, 'f')); }
  return out;
}
export function objSolid(q, t) {
  const f = objFoot(q), rot = q.rot || 0, local = objLocal(q, t), bb = objBox(q);
  return { local, boxes: placeLocal(local, rot, bb.x1 - bb.x0, bb.z1 - bb.z0, q.x, q.z, q.y || 0, bb), lw: bb.x1 - bb.x0, ld: bb.z1 - bb.z0, lh: q.h, rot, y0: q.y || 0 };
}

/* ---------- кухонный шкаф по модели чертежа (odModel): размеры в мм ---------- */
export function modelLocal(m) {
  const W = m.W / 10, D = m.D / 10, FT = 1.8, out = [], PL = m.PL / 10, hb = m.hb / 10, H = m.H / 10;
  if (PL > 0) out.push(B(2, W - 2, 0, PL, 3, D - 4, 'b'));
  out.push(B(0, W, PL, hb, 0, D - FT, 'b'));
  if (m.CT > 0) out.push(B(0, W, hb, H, 0, D + 2, 'b'));
  (m.panels || []).forEach(p => out.push(B(p.x / 10, (p.x + p.w) / 10, p.y / 10, (p.y + p.h) / 10, D - FT, D, 'f')));
  (m.niche || []).forEach(p => out.push(B(p.x / 10, (p.x + p.w) / 10, p.y / 10, (p.y + p.h) / 10, D - FT, D, 'a')));
  return out;
}

/* ---------- шкаф-купе / шкаф конструктора PRO и его вещи ---------- */
function wardrobeLocal(S, g, W, D, H, doors) {
  const out = [], t = S.t, pl = S.plinth || 0;
  out.push(B(0, W, 0, H, 0, D, 'b'));
  if (doors && doors.length) doors.forEach(d => out.push(B(d.x, d.x + d.w, d.y, d.y + d.h, D - .4, D + 1.8, 'f')));
  else g.cols.forEach(c => { if (c.gap) return; out.push(B(c.xa - t, c.xa, pl, H, D - .3, D, 'l'), B(c.xb, c.xb + t, pl, H, D - .3, D, 'l')); });
  return out;
}
export function wardrobeSolids(S, bp) {
  const items = [], rm = S.room || {}, g = bp.g;
  if (S.cols.some(c => !c.gap && !c.det)) {
    const W = g.W, H = g.totalH, D = S.D, ft = wfoot(S), doors = doorList(S).filter(d => d.zone === 'mezz' || (d.zone === 'main' && (d.ci == null || !S.cols[d.ci].det)));
    const local = wardrobeLocal(S, g, W, D, H, doors);
    items.push({ key: 'main', local, lw: W, ld: D, lh: H, rot: rm.rot || 0, y0: 0, boxes: placeLocal(local, rm.rot || 0, ft.w ? (rm.rot === 90 || rm.rot === 270 ? ft.d : ft.w) : W, D, rm.ox || 0, rm.oz || 0, 0, { x0: 0, x1: W, z0: 0, z1: D }) });
  }
  return items;
}
export function detSolid(S, ci) {
  const c = S.cols[ci], g = geom(S), gc = g.cols[ci], r = colRect(S, ci), W = gc.w + 2 * S.t, D = gc.D, H = c.H || S.H;
  const L0 = gc.xa - S.t, doors = doorList(S).filter(d => d.zone === 'main' && d.ci === ci);
  const local = [B(0, W, 0, H, 0, D, 'b')];
  if (doors.length) doors.forEach(d => local.push(B(d.x - L0, d.x - L0 + d.w, d.y, d.y + d.h, D - .4, D + 1.8, 'f')));
  else local.push(B(S.t, S.t + .1, S.plinth || 0, H, D - .3, D, 'l'));
  return { local, lw: W, ld: D, lh: H, rot: (c.det && c.det.rot) || 0, y0: 0, boxes: placeLocal(local, (c.det && c.det.rot) || 0, W, D, r.x0, r.z0, 0) };
}
export function unitSolid(S, u, c) {
  const b = itemBase(S, 'unit', c), r = itemRect(S, 'unit', c), w = u.w, d = u.d, h = u.h, local = [B(0, w, 0, h, 0, d, 'b')];
  const n = Math.max(1, u.n | 0);
  if (u.kind === 'drawers') { const ph = (h - 3 * (n + 1)) / n; for (let i = 0; i < n; i++) local.push(B(1.5, w - 1.5, 3 + i * (ph + 3), 3 + i * (ph + 3) + ph, d - 1.8, d, 'f')); }
  else { const dn = u.kind === 'doors' ? (w > 65 ? 2 : 1) : n; for (let i = 0; i < dn; i++) local.push(B(1.5 + i * (w - 3) / dn, 1.5 + (i + 1) * (w - 3) / dn - .3, 3, h - 3, d - 1.8, d, 'f')); }
  const rot = (c.fp && c.fp.rot) || 0;
  return { local, lw: w, ld: d, lh: h, rot, y0: 0, boxes: placeLocal(local, rot, w, d, r.x0, r.z0, 0) };
}
export function bedSolid(S, b, c) {
  const dd = bedDims(b, S.t), base = itemBase(S, 'bed', c), r = itemRect(S, 'bed', c), W = dd.W, L = dd.L, rot = (c.fp && c.fp.rot) || 0;
  const w0 = W, d0 = L, local = [];
  const lg = b.lg || 15, sh = b.sh || 20, post = 5;
  [[0, 0], [W - post, 0], [0, L - post], [W - post, L - post]].forEach(p => local.push(B(p[0], p[0] + post, 0, lg, p[1], p[1] + post)));
  local.push(B(0, W, lg, lg + sh, 0, L, 'b'), B(2, W - 2, dd.slatTop, dd.mTop, 2, L - 2, 'f'), B(0, W, 0, Math.max(b.hh || 0, dd.mTop + 10), 0, 3, 'b'));
  if (b.kind === 'bunk') { [[0, 0], [W - 5, 0], [0, L - 5], [W - 5, L - 5]].forEach(p => local.push(B(p[0], p[0] + 5, 0, dd.postH, p[1], p[1] + 5))); local.push(B(0, W, b.lv2 - 4, b.lv2, 0, L, 'b'), B(2, W - 2, b.lv2, b.lv2 + b.mt, 2, L - 2, 'f')); }
  return { local, lw: w0, ld: d0, lh: dd.H, rot, y0: 0, boxes: placeLocal(local, rot, w0, d0, r.x0, r.z0, 0) };
}
export function panelSolid(S, p, c) {
  const base = itemBase(S, 'panel', c), r = itemRect(S, 'panel', c), th = Math.min(base.d, 3), rot = (c.fp && c.fp.rot) || 0, local = [B(0, p.w, 0, p.h, 0, th, 'f')];
  return { local, lw: p.w, ld: th, lh: p.h, rot, y0: p.y, boxes: placeLocal(local, rot, p.w, th, r.x0, r.z0, p.y) };
}
