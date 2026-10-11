/* 3D-часть элементов стен (общая для шкафа и кухни); логика и данные — в room-open-core.js */
import * as THREE from 'three';
import { roomEdges, openCenter, OPEN_KINDS, OPEN_COLORS } from '/static/js/room-open-core.js?v=3';
export * from '/static/js/room-open-core.js?v=3';
/* ---- 3D ---- */
export function buildOpenings(parent, opens, P, ctx) {
  // ctx: { mat(hex, opts), glass(), picks[], meta(i), edgeMat? } → возвращает карту id → группа
  const E = roomEdges(P), groups = new Map(), DEG = Math.PI / 180;
  const box = (g, w, h, d, m, x, y, z, pick, i) => { const me = new THREE.Mesh(new THREE.BoxGeometry(Math.max(.05, w), Math.max(.05, h), Math.max(.05, d)), m); me.position.set(x, y + h / 2, z + d / 2); me.castShadow = me.receiveShadow = true; if (pick) { me.userData.sel = ctx.meta(i); ctx.picks.push(me); } g.add(me); return me; };
  const white = ctx.mat('#f4f4f2', { roughness: .5 }), dark = ctx.mat('#4a4a4a', { roughness: .6 }), wood = ctx.mat('#8b5a33', { roughness: .55 }), chrome = ctx.mat('#c9ccd0', { roughness: .25, metalness: .8 }), beige = ctx.mat('#e6dfd2', { roughness: .9 });
  opens.forEach((o, i) => {
    const c = openCenter(o, E); if (!c) return; const e = c.e, g = new THREE.Group(), w = o.w, h = o.h;
    g.position.set(c.x + e.nx * .1, o.y, c.z + e.nz * .1); g.rotation.y = Math.atan2(e.nx, e.nz); parent.add(g); groups.set(o.id, g);
    const bx = (bw, bh, bd, m, x, y, z, pk) => box(g, bw, bh, bd, m, x, y, z, pk !== false, i);
    const k = o.kind;
    const cols = OPEN_COLORS[k] || [], cc = cols[Math.max(0, Math.min(cols.length - 1, o.c | 0))], fm = cc ? ctx.mat(cc[0], { roughness: .5 }) : white, v = o.v;
    const arcTop = (cx, cy, r, tube, mat, z, depth) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, 28, Math.PI), mat); m.position.set(cx, cy, z + depth / 2); m.castShadow = true; m.userData.sel = ctx.meta(i); ctx.picks.push(m); g.add(m); };
    const disc = (cx, cy, r, mat, z, half) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 36, 0, half ? Math.PI : Math.PI * 2), mat); m.position.set(cx, cy, z); g.add(m); };
    if (k === 'door' || k === 'balcony') {
      const f = 4;
      if (v === 'arch') {   // арка: проёма без полотна
        const pr = w / 2; bx(f, h - pr + f, 3.2, fm, -w / 2 - f, 0, 0); bx(f, h - pr + f, 3.2, fm, w / 2, 0, 0); arcTop(0, h - pr, pr + f / 2, f / 2, fm, 0, 3.2);
      } else {
        bx(f, h + f, 3.2, fm, -w / 2 - f, 0, 0); bx(f, h + f, 3.2, fm, w / 2, 0, 0); bx(w + 2 * f, f, 3.2, fm, -w / 2 - f, h, 0);
        if (v === 'sliding') {   // раздвижная: полотно перед стеной на направляющей
          bx(w * 1.1, 3, 3, chrome, -w / 2 - w * .05, h + f, 3.2); bx(w * .62, h - .4, 3.4, fm, -w / 2 + w * .5, .2, 3.4); bx(1.6, 12, 2.2, chrome, -w / 2 + w * .5 + 4, h * .5 - 6, 6.8);
        } else if (v === 'double') {
          const lw = (w - .9) / 2; bx(lw, h - .4, 3.6, k === 'balcony' ? ctx.glass() : fm, -w / 2 + .3, .2, .6); bx(lw, h - .4, 3.6, k === 'balcony' ? ctx.glass() : fm, .3, .2, .6);
          bx(1.4, 12, 2.6, chrome, -4, h * .5 - 6, 4); bx(1.4, 12, 2.6, chrome, 2.6, h * .5 - 6, 4);
        } else if (v === 'entry') {
          bx(w - .6, h - .4, 4.6, ctx.mat('#8a8f94', { roughness: .35, metalness: .7 }), -w / 2 + .3, .2, .6); bx(2, 2, 1, chrome, w * .1, h * .72, 5.2); bx(2.4, 14, 2.6, chrome, w / 2 - 8, h * .5 - 7, 5.2);
        } else if (v === 'glass') {
          bx(w - .6, h - .4, 3.6, fm, -w / 2 + .3, .2, .6); bx(w * .5, h * .55, .8, ctx.glass(), -w / 4, h * .3, 4.1, false); bx(1.6, 12, 2.6, chrome, w / 2 - 6, h * .5 - 6, 4);
        } else if (v === 'panel') {
          bx(w - .6, h - .4, 3.6, fm, -w / 2 + .3, .2, .6); const dk = ctx.mat('#000000', { roughness: .8, transparent: true, opacity: .14 });
          [[.1, .06, .8, .36], [.1, .46, .8, .46]].forEach(r => bx(w * r[2], h * r[3], .5, dk, -w / 2 + w * r[0], h * r[1], 4.1, false)); bx(1.6, 12, 2.6, chrome, w / 2 - 6, h * .5 - 6, 4);
        } else {
          bx(w - .6, h - .4, 3.6, k === 'balcony' ? ctx.glass() : fm, -w / 2 + .3, .2, .6);
          if (k === 'balcony') { bx(w - .6, 3, 3.8, fm, -w / 2 + .3, h * .45, .5); bx(3, h - .4, 3.8, fm, -1.5, .2, .5); }
          bx(1.6, 12, 2.6, chrome, w / 2 - 6, h * .5 - 6, 4);
        }
      }
    } else if (k === 'window') {
      const f = 4.5, ns = Math.max(1, o.n | 0 || 1), handles = v !== 'fixed';
      if (v === 'round') {
        const r = Math.min(w, h) / 2; const m = new THREE.Mesh(new THREE.TorusGeometry(r - 2, 2.4, 10, 40), fm); m.position.set(0, h / 2, 2.5); m.castShadow = true; m.userData.sel = ctx.meta(i); ctx.picks.push(m); g.add(m); disc(0, h / 2, r - 2, ctx.glass(), 2.2, false);
        bx(r * 2 - 4, 3, 3, fm, -r + 2, h / 2 - 1.5, 1); bx(3, r * 2 - 4, 3, fm, -1.5, h / 2 - r + 2, 1);
      } else if (v === 'arch') {
        const pr = w / 2, hr = h - pr; bx(f, hr, 5, fm, -w / 2, 0, 0); bx(f, hr, 5, fm, w / 2 - f, 0, 0); bx(w - 2 * f, f, 5, fm, -w / 2 + f, 0, 0);
        arcTop(0, hr, pr - f / 2, f / 2 + .4, fm, 0, 5); bx(w - 2 * f, hr - f, .6, ctx.glass(), -w / 2 + f, f, 2, false); disc(0, hr, pr - f, ctx.glass(), 2, true);
        for (let j = 1; j < ns; j++) bx(3.4, hr - f + pr * .7, 4, fm, -w / 2 + j * w / ns - 1.7, f, .5);
        bx(w + 10, 2.4, 11, fm, -w / 2 - 5, -2.4, 0);
      } else {
        bx(f, h, 5, fm, -w / 2, 0, 0); bx(f, h, 5, fm, w / 2 - f, 0, 0); bx(w - 2 * f, f, 5, fm, -w / 2 + f, 0, 0); bx(w - 2 * f, f, 5, fm, -w / 2 + f, h - f, 0);
        bx(w - 2 * f, h - 2 * f, .6, ctx.glass(), -w / 2 + f, f, 2, false);
        const tr = v === 'transom' ? Math.min(40, h * .25) : 0, hb = h - 2 * f - tr;   // высота створок под фрамугой
        if (tr) bx(w - 2 * f, 3.6, 4.5, fm, -w / 2 + f, f + hb - 1.8, .5);
        for (let j = 1; j < ns; j++) bx(3.4, hb, 4, fm, -w / 2 + j * w / ns - 1.7, f, .5);
        if (handles) for (let j = 0; j < ns; j++) bx(1.6, 10, 3, chrome, -w / 2 + (j + .5) * w / ns + (ns > 1 ? 4 : 0), f + hb * .5 - 5, 5.5);
        if (v !== 'pano') bx(w + 10, 2.4, 11, fm, -w / 2 - 5, -2.4, 0);
      }
    } else if (k === 'socket' || k === 'socket2') {
      bx(w, h, 1.4, white, -w / 2, 0, 0); const n = k === 'socket2' ? 2 : 1;
      for (let j = 0; j < n; j++) { const cx = (j - (n - 1) / 2) * 7; bx(4.6, 4.6, .4, ctx.mat('#e9e9e6', { roughness: .4 }), cx - 2.3, h / 2 - 2.3, 1.4, false); bx(.7, .7, .3, dark, cx - 1.3, h / 2 - .35, 1.8, false); bx(.7, .7, .3, dark, cx + .6, h / 2 - .35, 1.8, false); }
    } else if (k === 'switch') {
      bx(w, h, 1.2, white, -w / 2, 0, 0); bx(w - 2.6, h - 2.6, .6, ctx.mat('#ededea', { roughness: .4 }), -w / 2 + 1.3, 1.3, 1.2, false);
    } else if (k === 'radiator') {
      const n = Math.max(3, Math.round(w / 8)); bx(w, 3, 9, white, -w / 2, 0, 0); bx(w, 3, 9, white, -w / 2, h - 3, 0);
      for (let j = 0; j < n; j++) bx(w / n - 1, h - 6, 8, white, -w / 2 + j * w / n + .5, 3, .5, j === 0);
    } else if (k === 'vent') {
      bx(w, h, 1, white, -w / 2, 0, 0); for (let j = 0; j < 4; j++) bx(w - 3, .8, .5, dark, -w / 2 + 1.5, 2.5 + j * (h - 5) / 3.4, 1, false);
    } else if (k === 'pipe') {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, h, 18), white); m.position.set(0, h / 2, w / 2 + .5); m.castShadow = true; m.userData.sel = ctx.meta(i); ctx.picks.push(m); g.add(m);
    } else if (k === 'column') {
      bx(w, h, o.d || 40, beige, -w / 2, 0, -.1);
    }
  });
  return groups;
}

/* луч мыши → ближайшая стена: { wall, off (до центра элемента), y } или null */
export function pickWall(ray, P, H) {
  const E = roomEdges(P); let best = null;
  E.forEach(e => {
    const den = ray.direction.x * e.nx + ray.direction.z * e.nz; if (Math.abs(den) < 1e-6) return;
    const t = ((e.a[0] - ray.origin.x) * e.nx + (e.a[1] - ray.origin.z) * e.nz) / den; if (t <= 0) return;
    const x = ray.origin.x + ray.direction.x * t, z = ray.origin.z + ray.direction.z * t, y = ray.origin.y + ray.direction.y * t;
    const s = (x - e.a[0]) * e.ex + (z - e.a[1]) * e.ez; if (s < -2 || s > e.L + 2 || y < -2 || y > H + 2) return;
    if (!best || t < best.t) best = { t, wall: e.i, s, y };
  });
  return best;
}
