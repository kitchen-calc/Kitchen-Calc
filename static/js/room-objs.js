/* Общий 3D-сборщик «своих шкафчиков» (стеллаж, книжный шкаф, навесной шкафчик, полка, шкаф своей формы) — для кухни.
   Локальные оси: начало в левом заднем углу габарита, x вправо, z вперёд (к комнате), y вверх. Контур, стороны и двери — из shkaf-pro-core.js. */
import * as THREE from 'three';
import { ledStrips, objEdges, objPoly } from '/static/js/shkaf-pro-core.js?v=33';

const DEG = Math.PI / 180;
/* ctx: { t, body, back, glass, mirror, chrome, edge (LineBasicMaterial|null), keyBase, onDoor(key, apply), mark(mesh) } */
/* подсветка изделия: светящиеся полосы по режиму q.led (материал ctx.led — общий с подсветкой кухни) */
export function buildObjGroup(q, ctx) {
  const og = buildObj0(q, ctx);
  if (q.led && ctx.led) ledStrips(q).forEach(sx => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx.w, sx.h, sx.d), ctx.led); m.position.set(sx.x + sx.w / 2, sx.y + sx.h / 2, sx.z + sx.d / 2); og.add(m); });
  return og;
}
function buildObj0(q, ctx) {
  const og = new THREE.Group(), t = ctx.t, w = q.w, d = q.d, h = q.h, BM = ctx.body;
  const fmat = q.fill === 'glass' ? ctx.glass : (q.fill === 'mirror' ? ctx.mirror : BM), hnd = q.handles !== false;
  const add = (par, m) => { m.castShadow = m.receiveShadow = true; if (ctx.edge) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), ctx.edge)); if (ctx.mark) ctx.mark(m); par.add(m); return m; };
  const bx = (bw, bh, bd, mat, x, y, z, par) => { const m = new THREE.Mesh(new THREE.BoxGeometry(Math.max(.05, bw), Math.max(.05, bh), Math.max(.05, bd)), mat); m.position.set(x + bw / 2, y + bh / 2, z + bd / 2); return add(par || og, m); };
  const slab = (poly, y, th, mat) => {
    const sh = new THREE.Shape(poly.map(p => new THREE.Vector2(p[0], -p[1]))), geo = new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2); const m = new THREE.Mesh(geo, mat); m.position.y = y; return add(og, m);
  };
  if (q.kind === 'shelf') { bx(w, t, d, BM, 0, 0, 0); return og; }
  if (q.kind === 'vert') { bx(Math.max(.3, w), h, d, BM, 0, 0, 0); return og; }
  if (q.kind === 'parts') {
    const groups = {}, DEGR = Math.PI / 180;
    (q.pt || []).forEach((b, idx) => {
      const k = b[0], x = b[1], y = b[2], z = b[3], w = b[4], h = b[5], d = b[6], gi = b[7] || 0;
      const pm = b[11] === 'glass' ? ctx.glass : (b[11] === 'mirror' ? ctx.mirror : (b[11] && ctx.catMat ? ctx.catMat(b[11]) : null)), BMp = pm || BM, fm = pm || fmat;
      const rot = m => { if (b[8] || b[9] || b[10]) { m.rotation.order = 'YXZ'; m.rotation.set((b[9] || 0) * DEGR, (b[8] || 0) * DEGR, (b[10] || 0) * DEGR); } return m; };
      if (k === 1) { const m = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, h, 24), BMp); m.position.set(x + w / 2, y + h / 2, z + d / 2); rot(m); add(og, m); return; }
      if (k >= 2 && k <= 5) {   // дверца на петлях: слева / справа / сверху / снизу
        const pv = new THREE.Group(); og.add(pv);
        if (k === 2) { pv.position.set(x, y, z + d); bx(w, h, d, fm, 0, 0, -d, pv); ctx.onDoor(ctx.keyBase + ':p' + idx, f => { pv.rotation.y = -105 * DEGR * f; }); }
        else if (k === 3) { pv.position.set(x + w, y, z + d); bx(w, h, d, fm, -w, 0, -d, pv); ctx.onDoor(ctx.keyBase + ':p' + idx, f => { pv.rotation.y = 105 * DEGR * f; }); }
        else if (k === 4) { pv.position.set(x, y + h, z + d); bx(w, h, d, fm, 0, -h, -d, pv); ctx.onDoor(ctx.keyBase + ':p' + idx, f => { pv.rotation.x = -100 * DEGR * f; }); }
        else { pv.position.set(x, y, z + d); bx(w, h, d, fm, 0, 0, -d, pv); ctx.onDoor(ctx.keyBase + ':p' + idx, f => { pv.rotation.x = 95 * DEGR * f; }); }
        if (hnd) bx(Math.min(14, w * .5), 1.4, 1.2, ctx.chrome, k === 3 ? -w + 3 : 3, h - 5, 0, pv);
        return;
      }
      if (k === 6 && gi) { if (!groups[gi]) { groups[gi] = { g: new THREE.Group(), dmax: 0 }; og.add(groups[gi].g); } groups[gi].dmax = Math.max(groups[gi].dmax, d); bx(w, h, d, BMp, x, y, z, groups[gi].g); return; }
      rot(bx(w, h, d, BMp, x, y, z));
    });
    Object.keys(groups).forEach(gi => { const G = groups[gi]; ctx.onDoor(ctx.keyBase + ':g' + gi, f => { G.g.position.z = f * G.dmax * .8; }); });
    return og;
  }
  if (q.kind === 'boards') { (q.bd || []).forEach(r => bx(r[2], r[3], d, BM, r[0], r[1], 0)); return og; }
  if (q.kind === 'custom') {
    const E = objEdges(q), P = objPoly(q);
    slab(P, 0, t, BM); slab(P, h - t, t, BM);
    for (let k = 1; k <= q.n; k++) slab(P, (h - t) * k / (q.n + 1), t, BM);
    E.forEach(e => {
      if (e.open) return;
      if (!e.door) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(e.L + (e.curved ? .5 : 0), h - 2 * t, t), BM);
        m.position.set((e.a[0] + e.b[0]) / 2 + e.nin[0] * t / 2, h / 2, (e.a[1] + e.b[1]) / 2 + e.nin[1] * t / 2); m.rotation.y = -e.ang; add(og, m);
      } else {
        const pv = new THREE.Group(); pv.position.set(e.a[0], t, e.a[1]); pv.rotation.y = -e.ang; og.add(pv);
        const pz = -e.ez * e.nin[0] + e.ex * e.nin[1] > 0 ? 0 : -1.8, dw = e.L - .4, dh = h - 2 * t - .4;
        bx(dw, dh, 1.8, fmat, .2, .2, pz, pv);
        if (hnd) bx(2, Math.min(24, dh * .4), 1.6, ctx.chrome, dw - 2, dh / 2 - 6, pz > -.1 ? 1.8 : pz - 1.6, pv);
        const pd = Math.sign(-e.ez * e.nin[0] + e.ex * e.nin[1]) || 1;
        ctx.onDoor(ctx.keyBase + ':e' + e.i, fq => { pv.rotation.y = -e.ang + pd * 100 * DEG * fq; });
      }
    });
    if (q.back) { const L0 = E.reduce((a, e) => (e.L > a.L ? e : a), E[0]); const m = new THREE.Mesh(new THREE.BoxGeometry(L0.L - 2 * t, h - 2 * t, .3), ctx.back); m.position.set((L0.a[0] + L0.b[0]) / 2 + L0.nin[0] * (t + .15), h / 2, (L0.a[1] + L0.b[1]) / 2 + L0.nin[1] * (t + .15)); m.rotation.y = -L0.ang; og.add(m); }
    return og;
  }
  bx(w, t, d, BM, 0, 0, 0); bx(t, h - t, d, BM, 0, t, 0); bx(t, h - t, d, BM, w - t, t, 0); bx(w - 2 * t, t, d, BM, t, h - t, 0);
  if (q.back) bx(w - 2 * t, h - 2 * t, .3, ctx.back, t, t, 0);
  for (let k = 1; k <= q.n; k++) bx(w - 2 * t - .2, t, d - 2, BM, t + .1, t + (h - 2 * t) * k / (q.n + 1) - t / 2, 1);
  if (q.dn > 0) {
    const dh = (q.dh > 0 ? Math.min(q.dh, h - 2 * t) : h - 2 * t) - .4, dw = (w - .4) / q.dn;
    for (let k = 0; k < q.dn; k++) {
      const left = k < q.dn / 2, pv = new THREE.Group(); pv.position.set(left ? .2 + k * dw : .2 + (k + 1) * dw, t + .2, d); og.add(pv);
      const dx = left ? 0 : -dw; bx(dw - .3, dh, 1.8, fmat, dx, 0, 0, pv);
      if (hnd) bx(2, Math.min(24, dh * .4), 1.6, ctx.chrome, left ? dw - 3.5 : -dw + 1.2, dh / 2 - 6, 1.8, pv);
      ctx.onDoor(ctx.keyBase + ':d' + k, fq => { pv.rotation.y = (left ? -1 : 1) * 105 * DEG * fq; });
    }
  }
  return og;
}
