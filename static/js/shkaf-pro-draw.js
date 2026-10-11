/* Чертежи конструктора шкафа PRO в стиле AutoCAD, лист A4 (альбомный). Размеры на чертежах — в мм. Только для режима мастера. */
import { OPEN_KINDS, openVariantName, roomEdges, openCenter } from '/static/js/room-open-core.js?v=3';
import { runInfo, shelfSpans, itemSpans, idoorSpan, SPLITTABLE, colFoot, colRect, wfoot, roomPoly, itemRect, itemBase, freeItem, objFoot, objPoly, objRect, OBJ_KINDS, BED_STYLES, bedDims, PANEL_KINDS, geom, ext, doorList, buildParts, pricing, edgeTotals, ITEM_TYPES, PALETTE, FILLS, r1 } from '/static/js/shkaf-pro-core.js?v=19';

const F = 1.4;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const N = v => Math.round(v * 100) / 100, mm = v => Math.round(v * 10);
const ST = { o: 'stroke="#111" stroke-width="1.5" fill="none" stroke-linejoin="round"', t: 'stroke="#333" stroke-width=".7" fill="none"', h: 'stroke="#555" stroke-width=".7" stroke-dasharray="6 3.5" fill="none"', c: 'stroke="#b3261e" stroke-width=".6" stroke-dasharray="14 3 2 3" fill="none"', d: 'stroke="#0b6e8f" stroke-width=".8" fill="none"' };
const line = (x1, y1, x2, y2, s) => `<line x1="${N(x1)}" y1="${N(y1)}" x2="${N(x2)}" y2="${N(y2)}" ${ST[s || 'o']}/>`;
const rect = (x, y, w, h, s, fill) => `<rect x="${N(x)}" y="${N(y)}" width="${N(Math.max(0, w))}" height="${N(Math.max(0, h))}" ${ST[s || 'o']}${fill ? ` fill="${fill}"` : ''}/>`;
const text = (x, y, t, size, anchor, extra) => `<text x="${N(x)}" y="${N(y)}" font-size="${N((size || 10) * F)}" text-anchor="${anchor || 'middle'}" font-family="Arial, sans-serif" fill="#111" ${extra || ''}>${esc(t)}</text>`;
const circ = (x, y, r, s, fill) => `<circle cx="${N(x)}" cy="${N(y)}" r="${N(r)}" ${ST[s || 'o']}${fill ? ` fill="${fill}"` : ''}/>`;
const tick = (x, y) => `<line x1="${N(x - 3)}" y1="${N(y + 3)}" x2="${N(x + 3)}" y2="${N(y - 3)}" stroke="#0b6e8f" stroke-width="1"/>`;
function dimH(x1, x2, yObj, yDim, label) {
  const dir = yDim < yObj ? -1 : 1;
  return line(x1, yObj + dir * 2, x1, yDim + dir * 4, 'd') + line(x2, yObj + dir * 2, x2, yDim + dir * 4, 'd') + line(x1, yDim, x2, yDim, 'd') + tick(x1, yDim) + tick(x2, yDim) + text((x1 + x2) / 2, yDim - 3, label, 9.5, 'middle', 'fill="#0b6e8f"');
}
function dimV(y1, y2, xObj, xDim, label) {
  const dir = xDim < xObj ? -1 : 1;
  return line(xObj + dir * 2, y1, xDim + dir * 4, y1, 'd') + line(xObj + dir * 2, y2, xDim + dir * 4, y2, 'd') + line(xDim, y1, xDim, y2, 'd') + tick(xDim, y1) + tick(xDim, y2) +
    `<text transform="translate(${N(xDim - 3)} ${N((y1 + y2) / 2)}) rotate(-90)" font-size="${N(9.5 * F)}" text-anchor="middle" font-family="Arial, sans-serif" fill="#0b6e8f">${esc(label)}</text>`;
}
const defs = `<defs><pattern id="h1" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="#444" stroke-width=".7"/></pattern><pattern id="h2" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line x1="0" y1="0" x2="0" y2="4" stroke="#777" stroke-width=".6"/></pattern></defs>`;
function titleBlock(rows, no, total) {
  const x = 620, y = 646, w = 538, h = 140;
  let o = rect(x, y, w, h, 'o') + line(x, y + 28, x + w, y + 28, 'o') + text(x + 10, y + 18, 'KITCHEN-CALC.UZ · ШКАФЫ НА ЗАКАЗ · ТАШКЕНТ', 9.5, 'start', 'font-weight="700"');
  rows.forEach((r, i) => { const yy = y + 43 + i * 15; o += text(x + 10, yy, r[0], 7.6, 'start', 'fill="#555"') + text(x + 118, yy, r[1], 8, 'start', 'font-weight="600"'); });
  return o + text(x + w - 10, y + h - 8, `Лист ${no} / ${total}`, 8.5, 'end', 'font-weight="700"');
}
const sheet = (inner, rows, no, total) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1190 840" width="100%" style="background:#fff;display:block" font-family="Arial, sans-serif">${defs}${rect(10, 10, 1170, 820, 'o')}${rect(30, 30, 1130, 760, 't')}<g class="ct">${inner}</g>${titleBlock(rows, no, total)}</svg>`;
const niceScale = sc => { const N0 = (1190 / 420) / sc, nice = [2, 4, 5, 8, 10, 15, 20, 25, 30, 40, 50, 75, 100]; let b = nice[0]; nice.forEach(n => { if (Math.abs(n - N0) < Math.abs(b - N0)) b = n; }); return b; };

function meta(S, bp) { return [['Изделие', S.name + ' · ' + Math.round(bp.g.W * 10) + '×' + Math.round(bp.g.totalH * 10) + '×' + Math.round(S.D * 10) + ' мм'], ['Цвет корпуса', S.custom ? S.custom : PALETTE[S.color][0]], ['Материал', 'ЛДСП ' + Math.round(S.t * 10) + ' мм, задняя стенка ХДФ 3 мм'], ['Отсеков', S.cols.filter(c => !c.gap).length + (S.cols.some(c => c.gap) ? ' + проём' : '') + (S.mezzes.length ? ', антресолей ' + S.mezzes.length : '')], ['Двери', { none: 'без дверей', swing: 'распашные ' + S.doors.n, sliding: 'купе ' + S.doors.n }[S.doors.kind]], ['Дата', new Date().toLocaleDateString('ru-RU')]]; }

/* ---------- вид спереди (с наполнением) ---------- */
function drawFront(S, g, x0, y0, sc, o) {
  o = o || {};
  const k10 = 10 * sc, X = v => x0 + v * k10, Y = v => y0 + (g.totalH - v) * k10, out = [], t = S.t;
  g.runs.forEach(r => {
    const rw = r.x1 - r.x0, RH = r.H;
    out.push(rect(X(r.x0), Y(RH), rw * k10, (RH - S.plinth) * k10, 'o'));
    const ri = runInfo(S, g, r);
    if (!ri.noL) out.push(rect(X(r.x0), Y(RH), t * k10, (RH - S.plinth) * k10, 'o', 'url(#h1)')); if (!ri.noR) out.push(rect(X(r.x1 - t), Y(RH), t * k10, (RH - S.plinth) * k10, 'o', 'url(#h1)'));
    out.push(rect(X(r.x0 + t), Y(RH), (rw - 2 * t) * k10, t * k10, 'o', 'url(#h1)'), rect(X(r.x0 + t), Y(S.plinth + t), (rw - 2 * t) * k10, t * k10, 'o', 'url(#h1)'));
    out.push(rect(X(r.x0 + t), Y(S.plinth), (rw - 2 * t) * k10, S.plinth * k10, 't', '#efefef'), text(X((r.x0 + r.x1) / 2), Y(S.plinth / 2) + 3, 'цоколь ' + mm(S.plinth), 7));
  });
  g.bnd.forEach((b, k) => { if (!b.has || k === 0 || k === g.cols.length) return; const L = g.cols[k - 1], R = g.cols[k]; if (L.gap || R.gap || R.split || (S.cols[k] && S.cols[k].nl)) return; out.push(rect(X(b.x), Y(L.y1), t * k10, (L.y1 - g.y0) * k10, 'o', 'url(#h1)')); });
  g.cols.forEach(c => { if (c.gap) out.push(text(X((c.xa + c.xb) / 2), Y(S.H / 2), 'проём ' + mm(c.w), 8, 'middle', 'fill="#555"'), line(X(c.xa), Y(S.H / 2) + 6, X(c.xb), Y(S.H / 2) + 6, 'c')); });
  g.mz.forEach(m => {
    out.push(rect(X(m.x0), Y(m.yt), m.w * k10, m.h * k10, 'o'));
    out.push(rect(X(m.x0), Y(m.yt), t * k10, m.h * k10, 'o', 'url(#h1)'), rect(X(m.x1 - t), Y(m.yt), t * k10, m.h * k10, 'o', 'url(#h1)'), rect(X(m.x0 + t), Y(m.yt), (m.w - 2 * t) * k10, t * k10, 'o', 'url(#h1)'), rect(X(m.x0 + t), Y(m.yb + t), (m.w - 2 * t) * k10, t * k10, 'o', 'url(#h1)'));
    m.dv.forEach(off => out.push(rect(X(m.ix0 + off), Y(m.iy1), t * k10, (m.iy1 - m.iy0) * k10, 'o', 'url(#h1)')));
    for (let k = 1; k <= (m.shelves | 0); k++) out.push(rect(X(m.ix0), Y(m.iy0 + (m.iy1 - m.iy0) * k / ((m.shelves | 0) + 1) + t), (m.w - 2 * t) * k10, t * k10, 'o', 'url(#h1)'));
    out.push(text(X((m.x0 + m.x1) / 2), Y((m.yb + m.yt) / 2) + 3, 'АНТРЕСОЛЬ ' + (m.mi + 1), 7.5));
  });
  S.cols.forEach((col, i) => {
    const c = g.cols[i]; if (c.gap) return;
    col.items.forEach(it => {
      const [a, b] = ext(it, S), xa = c.xa, xb = c.xb, w = c.w;
      if (it.type === 'shelf') shelfSpans(col, w, t, it).forEach(ss => out.push(rect(X(xa + ss.x0), Y(it.y + t), ss.w * k10, t * k10, 'o', 'url(#h1)')));
      else if (SPLITTABLE.includes(it.type)) itemSpans(S, col, c.w, it).forEach(ss => ((xa, xb, w) => {
        if (false) {}
      else if (it.type === 'rod') { out.push(line(X(xa + .3), Y(it.y), X(xb - .3), Y(it.y), 'o'), rect(X(xa), Y(it.y + 1.7), 2.8 * k10, 3.4 * k10, 't'), rect(X(xb - 2.8), Y(it.y + 1.7), 2.8 * k10, 3.4 * k10, 't')); }
      else if (it.type === 'drawer') for (let k = 0; k < 1; k++) { const yy = it.y + k * it.fh; out.push(rect(X(xa + .2), Y(yy + it.fh - .15), (w - .4) * k10, (it.fh - .3) * k10, 'o', '#fff'), rect(X(xa + w / 2 - 7), Y(yy + it.fh - 4), 140 * sc, 8 * sc, 't', '#ddd')); }
      else if (it.type === 'shoe') for (let k = 0; k < it.n; k++) out.push(line(X(xa), Y(it.y + k * 12 + 3), X(xb), Y(it.y + k * 12 + 3), 'o'));
      else if (it.type === 'pant') out.push(rect(X(xa + 1), Y(it.y + 10), (w - 2) * k10, 100 * sc, 'h'), text(X(xa + w / 2), Y(it.y + 5) + 3, 'брючница', 6.5));
      else if (it.type === 'basket') out.push(rect(X(xa + 1.5), Y(it.y + it.h), (w - 3) * k10, it.h * k10, 'h'), text(X(xa + w / 2), Y(it.y + it.h / 2) + 3, 'корзина', 6.5));
      else if (it.type === 'hook') { out.push(rect(X(xa + .2), Y(it.y + 4), (w - .4) * k10, 40 * sc, 'o', '#fff')); for (let k = 0; k < Math.max(2, Math.floor(w / 8)); k++) out.push(circ(X(xa + (k + .5) * w / Math.max(2, Math.floor(w / 8))), Y(it.y + 2), 2.2 * sc * 3, 't')); }
      else if (it.type === 'led') out.push(line(X(xa + .5), Y(it.y), X(xb - .5), Y(it.y), 'c'));
      })(c.xa + ss.x0, c.xa + ss.x0 + ss.w, ss.w));
      else if (it.type === 'vpanel') out.push(rect(X(xa + it.x), Y(it.y1), t * k10, (it.y1 - it.y) * k10, 'o', 'url(#h1)'));
      else if (it.type === 'idoor') { const iw = idoorSpan(col, w, t, it).w; out.push(rect(X(xa + it.x), Y(it.y1), iw * k10, (it.y1 - it.y) * k10, 'o', '#fff'), text(X(xa + it.x + iw / 2), Y((it.y + it.y1) / 2), 'дверца ' + ({ L: '◀', R: '▶', U: '▲', D: '▼' }[it.dir] || '◀'), 7)); }
      if (o.marks && it.type !== 'led') out.push(text(X(xa) + 4, Y(a) - 2, 'y' + mm(a), 6, 'start', 'fill="#b3261e"'));
    });
  });
  (S.beds || []).forEach((b, i) => { const d = bedDims(b, S.t), w = b.rot === 90 ? d.L : d.W; out.push(rect(X(b.x), Y(d.H), w * k10, (d.H - b.lg) * k10, 'o', '#fff'), rect(X(b.x), Y(b.lg + b.sh + b.mt), w * k10, (b.sh + b.mt) * k10, 'h'), text(X(b.x + w / 2), Y(d.H / 2), 'К' + (i + 1) + (b.kind === 'bunk' ? ' 2 яруса' : ' кровать'), 7), text(X(b.x + w / 2), Y(d.H / 2) + 14, mm(d.W) + '×' + mm(d.L) + '×' + mm(d.H), 7, 'middle', 'fill="#0b6e8f"')); });
  (S.units || []).forEach((u, i) => {
    const hb = u.h - (u.legs || 0), fn = Math.max(1, u.n | 0);
    out.push(rect(X(u.x), Y(u.h), u.w * k10, hb * k10, 'o', '#fff'));
    if (u.kind === 'doors') { const dn = u.w > 65 ? 2 : 1; for (let k = 1; k < dn; k++) out.push(line(X(u.x + k * u.w / dn), Y(u.h), X(u.x + k * u.w / dn), Y(u.legs || 0), 'o')); }
    else for (let k = 1; k < fn; k++) out.push(line(X(u.x), Y((u.legs || 0) + k * hb / fn), X(u.x + u.w), Y((u.legs || 0) + k * hb / fn), 'o'));
    out.push(text(X(u.x + u.w / 2), Y(u.h / 2), 'Т' + (i + 1) + ' ' + ({ flap: 'обувница', doors: 'тумба', drawers: 'ящики' }[u.kind]), 7), text(X(u.x + u.w / 2), Y(u.h / 2) + 14, mm(u.w) + '×' + mm(u.h) + '×' + mm(u.d), 7, 'middle', 'fill="#0b6e8f"'));
  });
  (S.panels || []).forEach((p, i) => {
    const lbl = 'П' + (i + 1) + ' ' + (PANEL_KINDS[p.kind] || '').split(' ')[0];
    if (p.kind === 'slats') { const sw = (p.sw || 100) / 10, sg = (p.sg || 20) / 10, vert = p.so !== 'h', span = vert ? p.w : p.h, cnt = Math.max(1, Math.floor((span + sg) / (sw + sg))); for (let k = 0; k < cnt; k++) { const o = k * (sw + sg); out.push(vert ? rect(X(p.x + o), Y(p.y + p.h), sw * k10, p.h * k10, 'o', 'url(#h2)') : rect(X(p.x), Y(p.y + o + sw), p.w * k10, sw * k10, 'o', 'url(#h2)')); } out.push(text(X(p.x + p.w / 2), Y(p.y + p.h / 2), lbl + ' ' + cnt + ' реек', 7)); }
    else if (p.shape === 'round' || p.shape === 'oval') out.push(`<ellipse cx="${N(X(p.x + p.w / 2))}" cy="${N(Y(p.y + p.h / 2))}" rx="${N(p.w * k10 / 2)}" ry="${N(p.h * k10 / 2)}" ${ST.o} fill="url(#h2)"/>`, text(X(p.x + p.w / 2), Y(p.y + p.h / 2), lbl + (p.bl ? ' ✨' : ''), 7));
    else out.push(rect(X(p.x), Y(p.y + p.h), p.w * k10, p.h * k10, 'o', 'url(#h2)'), text(X(p.x + p.w / 2), Y(p.y + p.h / 2), lbl + (p.bl ? ' ✨' : ''), 7));
    out.push(text(X(p.x + p.w / 2), Y(p.y + p.h / 2) + 14, mm(p.w) + '×' + mm(p.h), 7, 'middle', 'fill="#0b6e8f"'));
  });
  return out.join('');
}

function drawSection(S, g, ci, x0, y0, sc) {
  const k10 = 10 * sc, X = v => x0 + v * k10, Y = v => y0 + (g.totalH - v) * k10, out = [], t = S.t, col = S.cols[ci], c = g.cols[ci], D = c.D;
  out.push(rect(X(0), Y(c.H), D * k10, (c.H - S.plinth) * k10, 'o'));
  out.push(rect(X(0), Y(c.H), .3 * k10, (c.H - S.plinth) * k10, 'o', 'url(#h1)'));
  out.push(rect(X(.3), Y(c.H), (D - .3) * k10, t * k10, 'o', 'url(#h1)'), rect(X(.3), Y(S.plinth + t), (D - .3) * k10, t * k10, 'o', 'url(#h1)'));
  out.push(rect(X(D - 6 - t), Y(S.plinth), t * k10, S.plinth * k10, 'o', 'url(#h1)'));
  g.mz.filter(m => m.x0 < c.xb && m.x1 > c.xa).forEach(m => {
    out.push(rect(X(0), Y(m.yt), D * k10, m.h * k10, 'o'), rect(X(0), Y(m.yt), .3 * k10, m.h * k10, 'o', 'url(#h1)'), rect(X(.3), Y(m.yt), (D - .3) * k10, t * k10, 'o', 'url(#h1)'), rect(X(.3), Y(m.yb + t), (D - .3) * k10, t * k10, 'o', 'url(#h1)'));
    for (let k = 1; k <= (m.shelves | 0); k++) out.push(rect(X(.3), Y(m.iy0 + (m.iy1 - m.iy0) * k / ((m.shelves | 0) + 1) + t), (D - 2.8) * k10, t * k10, 'o', 'url(#h1)'));
    out.push(dimV(Y(m.yt), Y(m.yb), X(0), X(0) - 90, mm(m.h)));
  });
  col.items.forEach(it => {
    if (it.type === 'shelf') out.push(rect(X(.3), Y(it.y + t), (it.d || D - 2.5) * k10, t * k10, 'o', 'url(#h1)'));
    else if (it.type === 'rod') out.push(circ(X(D / 2), Y(it.y), 12.5 * sc, 'o'), rect(X(D / 2 - 12), Y(it.y - 1.7), 24 * sc, 34 * sc, 't'));
    else if (it.type === 'drawer') for (let k = 0; k < 1; k++) { const yy = it.y + k * it.fh; out.push(rect(X(D - t), Y(yy + it.fh - .15), t * k10, (it.fh - .3) * k10, 'o', 'url(#h2)'), rect(X(6), Y(yy + it.fh - 3), (D - 12) * k10, (it.fh - 4) * k10, 'h')); }
    else if (it.type === 'shoe') for (let k = 0; k < it.n; k++) { const yb = it.y + k * 12; out.push(line(X(.3), Y(yb + 9), X(D - 6), Y(yb + 1), 'o'), line(X(D - 6), Y(yb + 1), X(D - 6), Y(yb + 3), 'o')); }
    else if (it.type === 'basket') out.push(rect(X(8), Y(it.y + it.h), (D - 16) * k10, it.h * k10, 'h'));
    else if (it.type === 'pant') out.push(rect(X(6), Y(it.y + 10), (D - 12) * k10, 100 * sc, 'h'));
    else if (it.type === 'hook') out.push(rect(X(.3), Y(it.y + 4), 16 * sc, 40 * sc, 'o', 'url(#h1)'), line(X(1.9), Y(it.y + 2), X(7), Y(it.y + 2), 'o'));
  });
  const dd = doorList(S).find(d => d.zone === 'main'); if (dd) out.push(rect(X(D + .3), Y(dd.y + dd.h), 16 * sc, dd.h * k10, 'o', 'url(#h2)'), text(X(D) + 6, Y(c.H / 2), 'дверь', 7, 'start'));
  out.push(dimH(X(0), X(D), Y(g.totalH), Y(g.totalH) - 24, mm(D)), dimV(Y(g.totalH), Y(0), X(D) + 16 * sc, X(D) + 70 * sc + 24, mm(g.totalH)));
  const ys = col.items.filter(i => i.type !== 'led').map(i => ext(i, S)[0]).sort((a, b) => a - b);
  ys.forEach((yv, k) => { out.push(dimV(Y(yv), Y(0), X(0), X(0) - 24 - (k % 3) * 22, mm(yv))); });
  return out.join('');
}

function drawPlan(S, g, x0, y0, sc) {
  const k10 = 10 * sc, X = v => x0 + v * k10, Y = v => y0 + v * k10, out = [], t = S.t, D = S.D, W = g.W;
  g.runs.forEach(r => {
    const rw = r.x1 - r.x0;
    const D = r.D;
    out.push(rect(X(r.x0), Y(0), rw * k10, D * k10, 'o'));
    out.push(rect(X(r.x0), Y(0), t * k10, D * k10, 'o', 'url(#h1)'), rect(X(r.x1 - t), Y(0), t * k10, D * k10, 'o', 'url(#h1)'), rect(X(r.x0), Y(0), rw * k10, .3 * k10, 'o', 'url(#h1)'));
  });
  g.bnd.forEach((b, k) => { if (!b.has || k === 0 || k === g.cols.length) return; const L = g.cols[k - 1], R = g.cols[k]; if (L.gap || R.gap) return; out.push(rect(X(b.x), Y(.3), t * k10, (D - .3) * k10, 'o', 'url(#h1)')); });
  g.cols.forEach(c => { if (c.gap) out.push(text(X((c.xa + c.xb) / 2), Y(D / 2), 'проём', 7.5, 'middle', 'fill="#555"')); });
  g.mz.forEach(m => out.push(rect(X(m.x0), Y(0), m.w * k10, D * k10, 'h'), text(X((m.x0 + m.x1) / 2), Y(D / 2) + 3, 'антресоль ' + (m.mi + 1) + ' (над)', 6.5, 'middle', 'fill="#555"')));
  doorList(S).filter(d => d.zone === 'main').forEach(d => {
    if (!d.sliding) { const left = d.left, hx = left ? d.x : d.x + d.w, r = d.w; out.push(`<path d="M ${N(X(left ? d.x + r : d.x - 0))} ${N(Y(D))} A ${N(r * k10)} ${N(r * k10)} 0 0 ${left ? 1 : 0} ${N(X(hx))} ${N(Y(D + r))}" ${ST.h}/>`, line(X(hx), Y(D), X(hx), Y(D + r), 'h')); }
    else out.push(rect(X(d.x), Y(D + .4 + (d.ri % 2) * 3.4), d.w * k10, 16 * sc, 'o', 'url(#h2)'));
  });
  out.push(dimH(X(0), X(W), Y(0), Y(0) - 24, mm(W)), dimV(Y(0), Y(D), X(W), X(W) + 28, mm(D)));
  g.cols.forEach(c => out.push(dimH(X(c.xa), X(c.xb), Y(D), Y(D) + 26 + (S.doors.kind === 'swing' ? 40 : 0), mm(c.w))));
  return out.join('');
}

/* ---------- листы ---------- */
function sheetOverview(S, bp, no, total) {
  const g = bp.g, sc = Math.min(1000 / (g.W * 10), 470 / (g.totalH * 10), .5), x0 = 105, y0 = 80, k10 = 10 * sc;
  let o = drawFront(S, g, x0, y0, sc, { marks: false });
  o += dimH(x0, x0 + g.W * k10, y0, y0 - 30, mm(g.W));
  g.cols.forEach(c => { o += dimH(x0 + c.xa * k10, x0 + c.xb * k10, y0, y0 - 8, mm(c.w)); });
  o += dimV(y0, y0 + g.totalH * k10, x0 + g.W * k10, x0 + g.W * k10 + 34, mm(g.totalH));
  o += dimV(y0 + (g.totalH - S.H) * k10, y0 + g.totalH * k10, x0, x0 - 30, mm(S.H));
  g.mz.forEach((m, i) => { o += dimV(y0 + (g.totalH - m.yt) * k10, y0 + (g.totalH - m.yb) * k10, x0, x0 - 60 - i * 26, mm(m.h)); });
  o += text(x0 + g.W * k10 / 2, y0 + g.totalH * k10 + 40, 'ВИД СПЕРЕДИ (двери сняты, показано наполнение)', 10, 'middle', 'font-weight="700"');
  o += text(1100, 60, `М 1:${niceScale(sc)}`, 12, 'end', 'font-weight="700"');
  return sheet(o, meta(S, bp), no, total);
}
/* ---------- план всей комнаты: шкаф, кровати, тумбы, зеркала, стеллажи и шкафы своей формы ---------- */
function sheetRoomPlan(S, bp, no, total) {
  const P = roomPoly(S), bx = Math.max(...P.map(p => p[0])), bz = Math.max(...P.map(p => p[1]));
  const sc = Math.min(760 / (bx * 10), 460 / (bz * 10), .5), k10 = 10 * sc, x0 = 120, y0 = 90, X = v => x0 + v * k10, Z = v => y0 + v * k10;
  let o = `<polygon points="${P.map(p => N(X(p[0])) + ',' + N(Z(p[1]))).join(' ')}" ${ST.o} stroke-width="3" fill="#faf7f0"/>`;
  { const E = roomEdges(P); (S.opens || []).forEach((q, i) => {
      const c = openCenter(q, E); if (!c) return; const e = c.e, hw = q.w / 2, k = q.kind, p1 = [c.x - e.ex * hw, c.z - e.ez * hw], p2 = [c.x + e.ex * hw, c.z + e.ez * hw], n = [e.nx, e.nz];
      const P2 = (p, d) => [X(p[0] + n[0] * d), Z(p[1] + n[1] * d)], ln = (a, b, st) => `<line x1="${N(a[0])}" y1="${N(a[1])}" x2="${N(b[0])}" y2="${N(b[1])}" ${st || ST.o}/>`;
      if (k === 'door' || k === 'balcony') {
        o += ln(P2(p1, 0), P2(p2, 0), 'stroke="#faf7f0" stroke-width="7"') + ln(P2(p1, -2), P2(p1, 2)) + ln(P2(p2, -2), P2(p2, 2));
        const tip = P2(p1, q.w), end = P2(p2, 0), cr = n[0] * e.ez - n[1] * e.ex;
        o += ln(P2(p1, 0), tip, ST.o) + `<path d="M${N(tip[0])} ${N(tip[1])} A${N(q.w * k10)} ${N(q.w * k10)} 0 0 ${cr > 0 ? 1 : 0} ${N(end[0])} ${N(end[1])}" ${ST.t}/>`;
      } else if (k === 'window') {
        o += ln(P2(p1, 0), P2(p2, 0), 'stroke="#faf7f0" stroke-width="7"') + ln(P2(p1, -2.2), P2(p2, -2.2)) + ln(P2(p1, 0), P2(p2, 0), ST.t) + ln(P2(p1, 2.2), P2(p2, 2.2)) + ln(P2(p1, -2.2), P2(p1, 2.2)) + ln(P2(p2, -2.2), P2(p2, 2.2));
        for (let j = 1; j < (q.n || 1); j++) { const pp = [p1[0] + (p2[0] - p1[0]) * j / q.n, p1[1] + (p2[1] - p1[1]) * j / q.n]; o += ln(P2(pp, -2.2), P2(pp, 2.2)); }
      } else if (k === 'radiator') {
        o += `<polygon points="${[P2(p1, 0), P2(p2, 0), P2(p2, 9), P2(p1, 9)].map(a => N(a[0]) + ',' + N(a[1])).join(' ')}" ${ST.o} fill="url(#h2)"/>`;
      } else if (k === 'column') {
        o += `<polygon points="${[P2(p1, 0), P2(p2, 0), P2(p2, q.d || 40), P2(p1, q.d || 40)].map(a => N(a[0]) + ',' + N(a[1])).join(' ')}" ${ST.o} fill="url(#h1)"/>`;
      } else {
        const cc = P2([c.x, c.z], 2.5); o += circ(cc[0], cc[1], k === 'pipe' ? Math.max(2, q.w / 2 * k10) : 3.4, 'o', k === 'pipe' ? '#ddd' : '#fff') + text(cc[0] + n[0] * 9, cc[1] + n[1] * 9 + 2.5, k === 'switch' ? 'В' : (k === 'vent' ? '⌀' : (k === 'pipe' ? 'Т' : 'Р')), 6.2, 'middle', 'font-weight="700"');
      }
      const lb = P2([c.x, c.z], -9); o += text(lb[0], lb[1] + 3, String(i + 1), 6.5, 'middle', 'fill="#0b6e8f" font-weight="700"');
    }); }
  const items = [], rm = S.room || {}, rotPts = (pts, rot, ox, oz) => { const a = (rot || 0) * Math.PI / 180, c = Math.round(Math.cos(a)), s = Math.round(Math.sin(a)); return pts.map(p => [p[0] * c + p[1] * s + ox, -p[0] * s + p[1] * c + oz]); };
  const ft = wfoot(S), wr = { x0: rm.ox || 0, z0: rm.oz || 0 };
  if (S.cols.some(c => !c.gap && !c.det)) items.push({ n: 'Шкаф', poly: [[wr.x0, wr.z0], [wr.x0 + ft.w, wr.z0], [wr.x0 + ft.w, wr.z0 + ft.d], [wr.x0, wr.z0 + ft.d]], rot: rm.rot || 0, w: bp.g.W, d: ft.d, fill: 'url(#h2)' });
  const add = (n, w, d, r, rot, fill) => items.push({ n, poly: [[r.x0, r.z0], [r.x1, r.z0], [r.x1, r.z1], [r.x0, r.z1]], rot, w, d, fill });
  S.cols.forEach((c, ci) => { if (c.det) add('Ш' + (ci + 1), c.w, c.D || S.D, colRect(S, ci), c.det.rot, '#e9ddc4'); });
  S.units.forEach((u, i) => { const c = u.fp ? u : Object.assign({}, u); if (!c.fp) freeItem(S, 'unit', c); add('Т' + (i + 1), u.w, u.d, itemRect(S, 'unit', c), c.fp.rot, '#efe3c8'); });
  S.beds.forEach((b, i) => { const c = b.fp ? b : Object.assign({}, b); if (!c.fp) freeItem(S, 'bed', c); const bb = itemBase(S, 'bed', c); add('К' + (i + 1), bb.w, bb.d, itemRect(S, 'bed', c), c.fp.rot, '#dfe8f0'); });
  S.panels.forEach((p, i) => { const c = p.fp ? p : Object.assign({}, p); if (!c.fp) freeItem(S, 'panel', c); add('З' + (i + 1), p.w, Math.max(3, itemBase(S, 'panel', c).d), itemRect(S, 'panel', c), c.fp.rot, '#d8eef7'); });
  (S.objs || []).forEach((q, i) => {
    const f = objFoot(q), poly = q.kind === 'custom' ? rotPts(objPoly(q), q.rot, q.x - f.mx, q.z - f.mz) : null, r = objRect(q);
    items.push({ n: 'С' + (i + 1), poly: poly || [[r.x0, r.z0], [r.x1, r.z0], [r.x1, r.z1], [r.x0, r.z1]], rot: q.rot, w: q.w, d: q.d, fill: '#ece2cf', kind: OBJ_KINDS[q.kind].ru });
  });
  const legend = [];
  items.forEach(it => {
    o += `<polygon points="${it.poly.map(p => N(X(p[0])) + ',' + N(Z(p[1]))).join(' ')}" ${ST.o} fill="${it.fill}"/>`;
    const xs = it.poly.map(p => p[0]), zs = it.poly.map(p => p[1]), ix0 = Math.min(...xs), ix1 = Math.max(...xs), iz0 = Math.min(...zs), iz1 = Math.max(...zs), cx = (ix0 + ix1) / 2, cz = (iz0 + iz1) / 2, a = (it.rot || 0) * Math.PI / 180;
    o += line(X(cx), Z(cz), X(cx) + Math.sin(a) * 16, Z(cz) + Math.cos(a) * 16, 'o') + circ(X(cx), Z(cz), 2, 'o', '#111');   // стрелка «лицом»
    o += text(X(cx), Z(cz) - 6, it.n, 8.5, 'middle', 'font-weight="700"');
    legend.push([it.n, it.kind || '', mm(ix1 - ix0) + '×' + mm(iz1 - iz0), 'от лев. ' + mm(ix0) + ', от дальн. ' + mm(iz0), (it.rot || 0) + '°']);
  });
  items.forEach((it, i) => {   // отступы от стен до каждого предмета, мм
    const xs = it.poly.map(p => p[0]), zs = it.poly.map(p => p[1]), ix0 = Math.min(...xs), ix1 = Math.max(...xs), iz0 = Math.min(...zs), iz1 = Math.max(...zs), cxm = (ix0 + ix1) / 2, czm = (iz0 + iz1) / 2, off = (i % 3 - 1) * 9;
    if (ix0 > 1) o += dimH(X(0), X(ix0), Z(czm) + off, Z(czm) + off, mm(ix0));
    if (iz0 > 1) o += dimV(Z(0), Z(iz0), X(cxm) + off, X(cxm) + off, mm(iz0));
    o += dimH(X(ix0), X(ix1), Z(iz1), Z(iz1) + 10 + (i % 2) * 9, mm(ix1 - ix0));
  });
  o += dimH(X(0), X(bx), Z(0), Z(0) - 30, mm(bx)) + dimV(Z(0), Z(bz), X(bx), X(bx) + 34, mm(bz));
  o += text(X(bx / 2), Z(bz) + 36, 'ПЛАН КОМНАТЫ С МЕБЕЛЬЮ (вид сверху) · стрелка — куда смотрит лицо · габариты, мм', 10, 'middle', 'font-weight="700"');
  const lx = 935, ly = 90; o += text(lx, ly - 6, 'ЭКСПЛИКАЦИЯ', 9, 'start', 'font-weight="700"');
  legend.slice(0, 22).forEach((r, i) => { o += text(lx, ly + 14 + i * 26, `${r[0]} ${r[1]} ${r[2]}`, 6.6, 'start', 'font-weight="700"') + text(lx + 6, ly + 25 + i * 26, `${r[3]} · поворот ${r[4]}`, 6, 'start', 'fill="#444"'); });
  return sheet(o, meta(S, bp).slice(0, 3).concat([['Лист', 'План комнаты с мебелью'], ['Предметов', String(items.length)], ['Дата', new Date().toLocaleDateString('ru-RU')]]), no, total);
}
function sheetOpenings(S, bp, no, total) {
  const P = roomPoly(S), E = roomEdges(P), hd = ['№', 'Элемент', 'Стена', 'От угла стены до левого края, мм', 'Ширина × высота, мм', 'От пола, мм', 'Выступ, мм'], cw = [44, 200, 100, 300, 200, 110, 90], x0 = 70;
  let o = '', y = 80, xs = [x0]; cw.forEach(w => xs.push(xs[xs.length - 1] + w));
  o += text(x0, 62, 'ДВЕРИ, ОКНА, РОЗЕТКИ И ДРУГИЕ ЭЛЕМЕНТЫ СТЕН (номера — как на плане комнаты)', 10, 'start', 'font-weight="700"');
  o += rect(x0, y, xs[xs.length - 1] - x0, 26, 'o', '#f0e9d8'); hd.forEach((t, i) => { o += text(xs[i] + 6, y + 17, t, 7.6, 'start', 'font-weight="700"'); if (i) o += line(xs[i], y, xs[i], y + 26 + 26 * Math.min(S.opens.length, 24)); });
  S.opens.slice(0, 24).forEach((q, i) => {
    const yy = y + 26 + i * 26, e = E[q.wall], k = OPEN_KINDS[q.kind];
    o += rect(x0, yy, xs[xs.length - 1] - x0, 26, 't');
    [i + 1, k.ru + (openVariantName(q) ? ' · ' + openVariantName(q).toLowerCase() : ''), '№' + (q.wall + 1) + ' · ' + mm(e ? e.L : 0), mm(q.off), mm(q.w) + ' × ' + mm(q.h) + (q.kind === 'window' || q.kind === 'balcony' ? ' · ' + (q.n || 1) + ' ств.' : ''), mm(q.y), q.kind === 'column' ? mm(q.d) : '—'].forEach((t, j) => { o += text(xs[j] + 6, yy + 17, String(t), 8, 'start'); });
  });
  return sheet(o, meta(S, bp).slice(0, 3).concat([['Лист', 'Элементы стен'], ['Элементов', String(S.opens.length)], ['Дата', new Date().toLocaleDateString('ru-RU')]]), no, total);
}
function sheetDoors(S, bp, no, total) {
  const g = bp.g, sc = Math.min(1000 / (g.W * 10), 470 / (g.totalH * 10), .5), x0 = 105, y0 = 80, k10 = 10 * sc, X = v => x0 + v * k10, Y = v => y0 + (g.totalH - v) * k10;
  let o = rect(X(0), Y(g.totalH), g.W * k10, g.totalH * k10, 't');
  bp.doors.forEach(d => {
    o += rect(X(d.x), Y(d.y + d.h), d.w * k10, d.h * k10, 'o', d.fill === 'dsp' ? '#fff' : 'url(#h2)');
    o += text(X(d.x + d.w / 2), Y(d.y + d.h / 2), (d.zone === 'mezz' ? 'А' + (d.mi + 1) + '.' : 'Д') + (d.i + 1) + ' · ' + FILLS[d.fill], 7.5);
    o += text(X(d.x + d.w / 2), Y(d.y + d.h / 2) + 14, mm(d.w) + '×' + mm(d.h), 7.5, 'middle', 'fill="#0b6e8f"');
    if (!d.sliding && (d.hinge === 'U' || d.hinge === 'D')) { const up = d.hinge === 'U', yy = up ? d.y + d.h : d.y; o += line(X(d.x), Y(d.y), X(d.x + d.w / 2), Y(yy), 'h') + line(X(d.x + d.w), Y(d.y), X(d.x + d.w / 2), Y(yy), 'h') + line(X(d.x), Y(d.y + d.h), X(d.x + d.w / 2), Y(yy), 'h') + line(X(d.x + d.w), Y(d.y + d.h), X(d.x + d.w / 2), Y(yy), 'h') + text(X(d.x + d.w / 2), Y(d.y + d.h / 2) + 28, up ? '▲ вверх (газлифт)' : '▼ вниз', 7); }
    else if (!d.sliding) { const left = d.left, n = d.h <= 90 ? 2 : d.h <= 160 ? 3 : d.h <= 220 ? 4 : 5; for (let k = 0; k < n; k++) { const yy = d.y + 10 + k * (d.h - 20) / (n - 1); o += circ(X(left ? d.x + 2 : d.x + d.w - 2), Y(yy), 3.5, 'o'); } o += line(X(left ? d.x + d.w : d.x), Y(d.y), X(left ? d.x : d.x + d.w), Y(d.y + d.h / 2), 'h') + line(X(left ? d.x + d.w : d.x), Y(d.y + d.h), X(left ? d.x : d.x + d.w), Y(d.y + d.h / 2), 'h'); }
  });
  if (S.doors.kind === 'sliding' && g.runs.length === 1) o += line(X(g.runs[0].x0), Y(S.plinth + 1), X(g.runs[0].x1), Y(S.plinth + 1), 'c') + line(X(g.runs[0].x0), Y(S.H - 1), X(g.runs[0].x1), Y(S.H - 1), 'c') + text(X(g.W / 2), Y(S.plinth) + 14, 'нижняя направляющая системы купе', 7);
  o += dimH(X(0), X(g.W), Y(g.totalH), Y(g.totalH) - 28, mm(g.W)) + dimV(Y(g.totalH), Y(0), X(g.W), X(g.W) + 34, mm(g.totalH));
  o += text(X(g.W / 2), Y(0) + 40, 'ФАСАДЫ: ДВЕРИ И ЗАПОЛНЕНИЕ (мм)', 10, 'middle', 'font-weight="700"') + text(1100, 60, `М 1:${niceScale(sc)}`, 12, 'end', 'font-weight="700"');
  return sheet(o, meta(S, bp), no, total);
}
function sheetSections(S, bp, no, total) {
  const g = bp.g; let ci = -1, best = -1; S.cols.forEach((c, i) => { if (!c.gap && c.items.length > best) { best = c.items.length; ci = i; } });
  if (ci < 0) ci = 0;
  const sc = Math.min(330 / (S.D * 10), 470 / (g.totalH * 10), .45), pw = Math.min(1000 / (g.W * 10), 230 / (S.D * 10), .5), ps = Math.min(pw, 560 / (g.W * 10));
  let o = drawSection(S, g, ci, 150, 90, sc) + text(150 + S.D * 5 * sc, 90 + g.totalH * 10 * sc + 40, 'РАЗРЕЗ ПО ОТСЕКУ ' + (ci + 1) + ' (вид сбоку)', 10, 'middle', 'font-weight="700"');
  o += drawPlan(S, g, 560, 120, ps) + text(560 + g.W * 5 * ps, 120 + S.D * 10 * ps + 110 + (S.doors.kind === 'swing' ? 80 : 0), 'ВИД СВЕРХУ (ПЛАН)', 10, 'middle', 'font-weight="700"');
  return sheet(o, meta(S, bp), no, total);
}
function sheetColumn(S, bp, ci, no, total) {
  const g = bp.g, c = g.cols[ci], col = S.cols[ci], sc = Math.min(470 / (c.H * 10), 360 / (c.w * 10), .5), x0 = 230, y0 = 80, X = v => x0 + (v - c.xa + 2) * 10 * sc, Y = v => y0 + (c.H - v) * 10 * sc;
  let o = '';
  const T = S.t;
  o += rect(X(c.xa - T), Y(c.H), T * 10 * sc, (c.H - S.plinth) * 10 * sc, 'o', 'url(#h1)') + rect(X(c.xb), Y(c.H), T * 10 * sc, (c.H - S.plinth) * 10 * sc, 'o', 'url(#h1)');
  o += rect(X(c.xa - T), Y(c.H), (c.w + 2 * T) * 10 * sc, T * 10 * sc, 'o', 'url(#h1)') + rect(X(c.xa - T), Y(S.plinth + T), (c.w + 2 * T) * 10 * sc, T * 10 * sc, 'o', 'url(#h1)');
  const sub = { xa: c.xa, xb: c.xb, w: c.w };
  const fake = Object.assign({}, S, { cols: [col] }), gg = Object.assign({}, g, { cols: [sub] });
  // наполнение отсека
  const items = col.items.slice().sort((a, b) => ext(a, S)[0] - ext(b, S)[0]), lines = [];
  items.forEach(it => {
    const [a, b] = ext(it, S), w = c.w, xa = c.xa, xb = c.xb;
    if (it.type === 'shelf') { shelfSpans(col, w, T, it).forEach(ss => { o += rect(X(xa + ss.x0), Y(it.y + T), ss.w * 10 * sc, T * 10 * sc, 'o', 'url(#h1)'); lines.push([it.y + T / 2, `Полка ${mm(T)}×${mm(ss.w - .2)}×${mm(it.d || c.D - 2.5)}`]); }); }
    else if (SPLITTABLE.includes(it.type)) itemSpans(S, col, c.w, it).forEach(ss => ((xa, xb, w) => {
      if (false) {}
    else if (it.type === 'rod') { o += line(X(xa + .3), Y(it.y), X(xb - .3), Y(it.y), 'o') + rect(X(xa), Y(it.y + 1.7), 28 * sc, 34 * sc, 't') + rect(X(xb - 2.8), Y(it.y + 1.7), 28 * sc, 34 * sc, 't'); lines.push([it.y, `Штанга ⌀25, L=${mm(w - .6)}`]); }
    else if (it.type === 'drawer') { for (let k = 0; k < 1; k++) { const yy = it.y + k * it.fh; o += rect(X(xa + .2), Y(yy + it.fh - .15), (w - .4) * 10 * sc, (it.fh - .3) * 10 * sc, 'o', '#fff') + rect(X(xa + w / 2 - 7), Y(yy + it.fh - 4), 140 * sc, 8 * sc, 't', '#ddd'); } lines.push([(a + b) / 2, `Ящик · фасад ${mm(w - .4)}×${mm(it.fh - .3)}`]); }
    else if (it.type === 'shoe') { for (let k = 0; k < it.n; k++) o += line(X(xa), Y(it.y + k * 12 + 3), X(xb), Y(it.y + k * 12 + 3), 'o'); lines.push([(a + b) / 2, `Обувные полки ${it.n} шт.`]); }
    else if (it.type === 'pant') { o += rect(X(xa + 1), Y(it.y + 10), (w - 2) * 10 * sc, 100 * sc, 'h'); lines.push([it.y + 5, 'Брючница выдвижная']); }
    else if (it.type === 'basket') { o += rect(X(xa + 1.5), Y(it.y + it.h), (w - 3) * 10 * sc, it.h * 10 * sc, 'h'); lines.push([it.y + it.h / 2, `Корзина h=${mm(it.h)}`]); }
    else if (it.type === 'hook') { o += rect(X(xa + .2), Y(it.y + 4), (w - .4) * 10 * sc, 40 * sc, 'o', '#fff'); lines.push([it.y + 2, 'Планка с крючками']); }
    else if (it.type === 'led') { o += line(X(xa + .5), Y(it.y), X(xb - .5), Y(it.y), 'c'); lines.push([it.y, 'LED-подсветка']); }
    })(c.xa + ss.x0, c.xa + ss.x0 + ss.w, ss.w));
    else if (it.type === 'vpanel') { o += rect(X(xa + it.x), Y(it.y1), T * 10 * sc, (it.y1 - it.y) * 10 * sc, 'o', 'url(#h1)'); lines.push([(it.y + it.y1) / 2, `Вертикальная панель ${mm(it.y1 - it.y)}×${mm(c.D - 2.5)}`]); }
    else if (it.type === 'idoor') { const iw = idoorSpan(col, w, T, it).w; o += rect(X(xa + it.x), Y(it.y1), iw * 10 * sc, (it.y1 - it.y) * 10 * sc, 'o', '#fff'); lines.push([(it.y + it.y1) / 2, `Дверца ${mm(iw - .4)}×${mm(it.y1 - it.y - .4)} · открывание ${({ L: 'влево', R: 'вправо', U: 'вверх', D: 'вниз' })[it.dir] || 'влево'}`]); }
  });
  // выноски справа
  const xr = X(c.xb + T) + 20; lines.sort((p, q) => q[0] - p[0]);
  let lastY = -1e9;
  lines.forEach(([yv, tx]) => { let ty = Math.max(Y(yv), lastY + 14); lastY = ty; o += line(X(c.xb), Y(yv), xr, ty, 't') + text(xr + 4, ty + 3, tx, 7.5, 'start'); });
  // цепочка размеров слева: расстояние от пола до низа каждого предмета и просветы между ними
  const levels = [S.plinth + T]; items.forEach(it => { if (it.type === 'led') return; const [a, b] = ext(it, S); levels.push(a, b); });
  levels.push(g.y1); const uniq = Array.from(new Set(levels.map(v => r1(v)))).sort((a, b) => a - b);
  for (let k = 0; k < uniq.length - 1; k++) { const a = uniq[k], b = uniq[k + 1]; if (b - a < 2.2) continue; o += dimV(Y(b), Y(a), X(c.xa - T), X(c.xa - T) - 30, mm(b - a)); }
  o += dimV(Y(c.H), Y(0), X(c.xa - T), X(c.xa - T) - 74, mm(c.H));
  o += dimH(X(c.xa), X(c.xb), Y(c.H), Y(c.H) - 26, mm(c.w)) + dimH(X(c.xa - T), X(c.xb + T), Y(c.H), Y(c.H) - 54, mm(c.w + 2 * T));
  o += text(X(c.xa + c.w / 2), Y(0) + 38, 'ОТСЕК ' + (ci + 1) + ' · ВНУТРЕННИЕ РАЗМЕРЫ И ПРОСВЕТЫ (мм)', 10, 'middle', 'font-weight="700"') + text(1100, 60, `М 1:${niceScale(sc)}`, 12, 'end', 'font-weight="700"');
  void fake; void gg;
  const rows = meta(S, bp).slice(0, 3).concat([['Отсек', `№${ci + 1} · ширина ${mm(c.w)} мм`], ['Наполнение', col.items.length + ' поз.'], ['Дата', new Date().toLocaleDateString('ru-RU')]]);
  return sheet(o, rows, no, total);
}
function sheetMezz(S, bp, mi, no, total) {
  const g = bp.g, m = g.mz[mi], t = S.t, sc = Math.min(560 / (m.w * 10), 420 / (m.h * 10), .5), x0 = 150, y0 = 130, k10 = 10 * sc, X = v => x0 + (v - m.x0) * k10, Y = v => y0 + (m.yt - v) * k10;
  let o = rect(X(m.x0), Y(m.yt), m.w * k10, m.h * k10, 'o') + rect(X(m.x0), Y(m.yt), t * k10, m.h * k10, 'o', 'url(#h1)') + rect(X(m.x1 - t), Y(m.yt), t * k10, m.h * k10, 'o', 'url(#h1)') + rect(X(m.x0 + t), Y(m.yt), (m.w - 2 * t) * k10, t * k10, 'o', 'url(#h1)') + rect(X(m.x0 + t), Y(m.yb + t), (m.w - 2 * t) * k10, t * k10, 'o', 'url(#h1)');
  m.dv.forEach(off => { o += rect(X(m.ix0 + off), Y(m.iy1), t * k10, (m.iy1 - m.iy0) * k10, 'o', 'url(#h1)'); });
  for (let k = 1; k <= (m.shelves | 0); k++) o += rect(X(m.ix0), Y(m.iy0 + (m.iy1 - m.iy0) * k / ((m.shelves | 0) + 1) + t), (m.w - 2 * t) * k10, t * k10, 'o', 'url(#h1)');
  const dl = bp.doors.filter(d => d.zone === 'mezz' && d.mi === mi);
  dl.forEach(d => { o += rect(X(d.x), Y(d.y + d.h), d.w * k10, d.h * k10, 'h') + text(X(d.x + d.w / 2), Y(d.y + d.h / 2), 'А' + (mi + 1) + '.' + (d.i + 1) + ' ' + mm(d.w) + '×' + mm(d.h), 7.5); });
  o += dimH(X(m.x0), X(m.x1), Y(m.yt), Y(m.yt) - 26, mm(m.w)) + dimV(Y(m.yt), Y(m.yb), X(m.x0), X(m.x0) - 30, mm(m.h)) + dimV(Y(m.yb), Y(0), X(m.x0), X(m.x0) - 74, mm(m.yb));
  o += dimH(X(0), X(m.x0), Y(m.yb) + 20, Y(m.yb) + 44, mm(m.x0));
  o += text(X((m.x0 + m.x1) / 2), Y(m.yb) + 70, 'АНТРЕСОЛЬ ' + (mi + 1) + ' · отдельный блок · от пола ' + mm(m.yb) + ' мм, от левого края ' + mm(m.x0) + ' мм', 9.5, 'middle', 'font-weight="700"') + text(1100, 60, `М 1:${niceScale(sc)}`, 12, 'end', 'font-weight="700"');
  const rows = meta(S, bp).slice(0, 3).concat([['Антресоль', '№' + (mi + 1) + ' · ' + mm(m.w) + '×' + mm(m.h) + '×' + mm(S.D) + ' мм'], ['Дверей / полок', m.n + ' / ' + (m.shelves | 0)], ['Дата', new Date().toLocaleDateString('ru-RU')]]);
  return sheet(o, rows, no, total);
}
function sheetDetails(S, bp, no, total) {
  const T = S.t, c = S.cols.reduce((a, b) => b.w > a.w ? b : a, S.cols[0]), D = S.D;
  let o = '';
  // 1. боковина с отверстиями системы 32
  const sc1 = .17, px = 70, py = 90, ph = 460;
  o += text(px + 60, py - 40, '1 · Перегородка: система 32', 9, 'middle', 'font-weight="700"');
  const hh = (bp.g.y1 - bp.g.y0) * 10, hs = Math.min(1, ph / hh);
  o += rect(px, py, (D - .3) * 10 * sc1 * 2.2, hh * hs, 'o');
  const used = []; S.cols.forEach(cl => cl.items.forEach(it => { if (it.type === 'shelf' || it.type === 'shoe') used.push(it.y); }));
  for (let y = 37; y < hh - 20; y += 32) { [37, (D - .3) * 10 - 37].forEach(xx => o += circ(px + xx * sc1 * 2.2, py + hh * hs - y * hs, 1.3, 'o')); }
  used.forEach(y => { const yy = (y - bp.g.y0) * 10; o += line(px - 6, py + hh * hs - yy * hs, px + (D - .3) * 10 * sc1 * 2.2 + 6, py + hh * hs - yy * hs, 'c'); });
  o += dimH(px + 37 * sc1 * 2.2, px + ((D - .3) * 10 - 37) * sc1 * 2.2, py, py - 10, mm(D - .3) - 74) + dimV(py + hh * hs - 69 * hs, py + hh * hs - 37 * hs, px, px - 14, 32);
  o += text(px + 6, py + hh * hs + 18, 'отв. ⌀5, шаг 32, от края 37 мм', 7, 'start');
  // 2. штанга
  const rx = 420, ry = 120, L = mm(c.w - .6), s2 = 260 / L;
  o += text(rx + 130, ry - 40, '2 · Штанга ⌀25 с держателями', 9, 'middle', 'font-weight="700"');
  o += rect(rx, ry, L * s2, 25 * s2 * 2, 'o', '#f4f4f4') + rect(rx - 10, ry - 12, 28 * s2 * 1.5 + 10, 60, 't') + rect(rx + L * s2 - 28 * s2 * 1.5, ry - 12, 28 * s2 * 1.5 + 10, 60, 't');
  o += dimH(rx, rx + L * s2, ry + 50, ry + 80, L);
  o += `<ellipse cx="${rx + 130}" cy="${ry + 175}" rx="${25 * 2.4}" ry="${15 * 2.4}" ${ST.o}/>` + dimH(rx + 130 - 60, rx + 130 + 60, ry + 210, ry + 232, 25) + dimV(ry + 175 - 36, ry + 175 + 36, rx + 130 + 60, rx + 130 + 80, 15);
  o += text(rx + 130, ry + 258, 'сечение трубы 25×15, хром', 7);
  // 3. ящик
  const dx0 = 780, dy0 = 90, dw = 300, dh0 = 120;
  o += text(dx0 + 100, dy0 - 40, '3 · Ящик (ЛДСП, шариковые направляющие)', 9, 'middle', 'font-weight="700"');
  const dr = S.cols.flatMap(cl => cl.items).find(i => i.type === 'drawer'), fh = dr ? dr.fh : 18;
  o += rect(dx0, dy0, dw, dh0 * 0.9, 'o', '#fff') + rect(dx0 + 20, dy0 + 10, dw - 40, dh0 * 0.7, 'h') + dimH(dx0, dx0 + dw, dy0, dy0 - 12, mm(c.w - .4)) + dimV(dy0, dy0 + dh0 * .9, dx0 + dw, dx0 + dw + 20, mm(fh - .3));
  o += rect(dx0, dy0 + 160, dw * .8, 90, 'o', '#fff') + dimH(dx0, dx0 + dw * .8, dy0 + 250, dy0 + 272, mm(D - 8));
  o += text(dx0 + 4, dy0 + 150, 'боковина: ' + mm(D - 8) + '×' + mm(Math.max(8, fh - 6)), 7, 'start') + text(dx0 + 4, dy0 + 292, 'задняя: ' + mm(c.w - .4 - 5.4) + '×' + mm(Math.max(8, fh - 6)) + ' · дно ХДФ ' + mm(c.w - .4 - 3.6) + '×' + mm(D - 9), 7, 'start');
  // 4. узел конфирмата
  const kx = 780, ky = 450;
  o += text(kx + 100, ky - 36, '4 · Узел: конфирмат 7×50', 9, 'middle', 'font-weight="700"');
  o += rect(kx, ky, 200, 40, 'o', 'url(#h1)') + rect(kx + 80, ky + 40, 40, 110, 'o', 'url(#h1)') + line(kx + 100, ky + 6, kx + 100, ky + 90, 'o') + circ(kx + 100, ky + 6, 6, 'o') + dimH(kx, kx + 200, ky, ky - 8, mm(T * 4 + 60) + ' (пример)') + dimV(ky, ky + 40, kx + 200, kx + 218, mm(T));
  o += text(kx, ky + 175, 'сверло ⌀5 в пласть, ⌀7 в торец; отступ 50 мм от края', 7, 'start');
  return sheet(o, meta(S, bp), no, total);
}
function tableSheets(S, bp, pr, startNo, total) {
  const out = [], rowsPerPage = 29, et = edgeTotals(bp.parts), fm = v => String(v).replace('.', ',');
  const groups = []; let last = null; bp.parts.forEach(p => { if (p.grp !== last) { groups.push({ h: p.grp }); last = p.grp; } groups.push(p); });
  let page = 0, idx = 0, n = 0;
  const edgeLine = `КРОМКА: 0,4 мм — ${fm(et.e04)} м · 2 мм (фасады) — ${fm(et.e2)} м · всего ${fm(et.total)} м (с запасом 10% — ${fm(Math.round(et.total * 110) / 100)} м)`;
  while (idx < groups.length) {
    let o = text(60, 62, 'РАСКРОЙ ДЕТАЛЕЙ · ЛДСП ' + Math.round(S.t * 10) + ' мм · кромка на видимых сторонах', 10, 'start', 'font-weight="700"');
    o += text(1150, 62, edgeLine.split(' · ')[2] ? 'Кромка всего: ' + fm(et.total) + ' м' : '', 9, 'end', 'font-weight="700" fill="#b3261e"');
    const cols = [60, 92, 372, 410, 468, 526, 576, 740, 880, 950], head = ['№', 'Деталь', 'Кол', 'Длина', 'Шир.', 'Толщ.', 'Материал', 'Кромка (где)', 'Кромка, м', 'Примечание'];
    head.forEach((h, i) => o += text(cols[i] + 2, 90, h, 7.4, 'start', 'font-weight="700"')); o += line(54, 96, 1150, 96, 'o');
    let y = 112, k = 0;
    while (idx < groups.length && k < rowsPerPage) {
      const r = groups[idx++]; k++;
      if (r.h) { o += rect(54, y - 11, 1096, 15, 't', '#eef3f6') + text(60, y, r.h.toUpperCase(), 7.4, 'start', 'font-weight="700"'); y += 16; continue; }
      n++; [n, r.name, r.qty, r.L, r.W, r.t, r.mat, r.edgeDesc && r.edgeDesc !== '—' ? r.edgeDesc + ' (' + r.edgeT + ')' : '—', r.edgeM || '', r.note].forEach((v, i) => o += text(cols[i] + 2, y, String(i === 8 && v !== '' ? fm(v) : v).slice(0, i === 9 ? 30 : 60), 7, 'start'));
      o += line(54, y + 4, 1150, y + 4, 't'); y += 16;
    }
    if (idx >= groups.length) {   // последний лист раскроя — итоги по материалам и кромке
      y += 8; o += rect(54, y - 12, 1096, 66, 'o', '#fffaf0');
      o += text(62, y, 'ИТОГО: деталей ' + bp.parts.reduce((a, p) => a + p.qty, 0) + ' шт. · ЛДСП корпус ' + fm(et.dsp.toFixed(2)) + ' м² · фасады ' + fm(et.facade.toFixed(2)) + ' м² · ХДФ ' + fm(et.hdf.toFixed(2)) + ' м²', 8, 'start', 'font-weight="700"');
      o += text(62, y + 16, edgeLine, 8, 'start', 'font-weight="700" fill="#b3261e"');
      o += text(62, y + 32, 'Правило сборки: боковины, спинка и перегородки стоят на дне; крышка — между боковинами. Кромка — на видимых сторонах: передний торец, фасады по периметру.', 7, 'start');
    }
    out.push(sheet(o, meta(S, bp).slice(0, 2).concat([['Таблица', 'Раскрой, лист ' + (++page)], ['Всего деталей', bp.parts.reduce((a, p) => a + p.qty, 0) + ' шт.'], ['Кромка', fm(et.total) + ' м (0,4 мм: ' + fm(et.e04) + ', 2 мм: ' + fm(et.e2) + ')'], ['Дата', new Date().toLocaleDateString('ru-RU')]]), startNo + out.length, total));
  }
  // фурнитура и цена
  let o = text(60, 62, 'ФУРНИТУРА И КРЕПЁЖ', 10, 'start', 'font-weight="700"');
  const cols = [60, 100, 650, 730, 800, 920], head = ['№', 'Наименование', 'Кол-во', 'Ед.', 'Цена, сум', 'Сумма, сум'];
  head.forEach((h, i) => o += text(cols[i] + 2, 90, h, 7.6, 'start', 'font-weight="700"')); o += line(54, 96, 1150, 96, 'o');
  let y = 112; bp.hw.slice(0, 26).forEach((h, i) => { [i + 1, h.name, h.qty, h.unit, h.price.toLocaleString('ru-RU'), Math.round(h.price * h.qty).toLocaleString('ru-RU')].forEach((v, k) => o += text(cols[k] + 2, y, String(v), 7.2, 'start')); o += line(54, y + 4, 1150, y + 4, 't'); y += 16; });
  out.push(sheet(o, meta(S, bp).slice(0, 3).concat([['Фурнитура', bp.hw.length + ' позиций'], ['Итого (с работой и доставкой)', pr.total.toLocaleString('ru-RU') + ' сум'], ['Дата', new Date().toLocaleDateString('ru-RU')]]), startNo + out.length, total));
  return out;
}

/* ---------- кровати: общий вид, узлы, двухъярусная ---------- */
function bedRows(S, bp, b, bi, extra) { const d = bedDims(b, S.t); return [['Изделие', (b.kind === 'bunk' ? 'Двухъярусная кровать ' : 'Кровать ') + (bi + 1)], ['Каркас Ш×Д×В', mm(d.W) + ' × ' + mm(d.L) + ' × ' + mm(d.H) + ' мм'], ['Матрас', mm(b.mw) + '×' + mm(b.ml) + '×' + mm(b.mt) + ' мм, ' + BED_STYLES[b.style].ru], ['Материал', 'ЛДСП ' + mm(S.t) + ' мм · кромка 2 мм по видимым торцам'], ['Лист', extra], ['Дата', new Date().toLocaleDateString('ru-RU')]]; }
function sheetBedMain(S, bp, bi, no, total) {
  const b = S.beds[bi], t = S.t, d = bedDims(b, t), W = d.W, L = d.L, bunk = b.kind === 'bunk';
  const sc = Math.min(860 / ((W + L) * 10 + 1200), 440 / (L * 10), .3), k = 10 * sc;
  let o = '';
  // --- вид сверху
  const px = 110, py = 100, PX = v => px + v * k, PY = v => py + v * k;
  o += rect(PX(0), PY(0), W * k, L * k, 'o');
  o += rect(PX(0), PY(0), W * k, t * k, 'o', 'url(#h1)') + rect(PX(0), PY(L - t), W * k, t * k, 'o', 'url(#h1)') + rect(PX(0), PY(t), t * k, (L - 2 * t) * k, 'o', 'url(#h1)') + rect(PX(W - t), PY(t), t * k, (L - 2 * t) * k, 'o', 'url(#h1)');
  const n = d.n, span = (b.ml + 1) - 6.8;
  for (let i = 0; i < n; i++) o += rect(PX(t), PY(t + (n > 1 ? i * span / (n - 1) : 0)), (W - 2 * t) * k, 6.8 * k, 't', '#f1e6d2');
  o += rect(PX(t + .5), PY(t + .5), b.mw * k, b.ml * k, 'h') + text(PX(W / 2), PY(L / 2), 'МАТРАС ' + mm(b.mw) + '×' + mm(b.ml), 8);
  [[0, 0], [W - 5, 0], [0, L - 5], [W - 5, L - 5]].forEach(([lx, lz]) => { o += rect(PX(lx), PY(lz), 5 * k, 5 * k, 'h'); });
  o += rect(PX(t), PY(t), 3 * k, (L - 2 * t) * k, 'h') + rect(PX(W - t - 3), PY(t), 3 * k, (L - 2 * t) * k, 'h');
  if (b.drw) for (let i = 0; i < b.drw; i++) o += rect(PX(W), PY(t + i * (L - 2 * t) / b.drw + .15), 36 * k, ((L - 2 * t) / b.drw - .3) * k, 'h') + text(PX(W) + 18 * k, PY(t + (i + .5) * (L - 2 * t) / b.drw), 'ящик ' + (i + 1), 6.5);
  o += dimH(PX(0), PX(W), PY(0), PY(0) - 28, mm(W)) + dimV(PY(0), PY(L), PX(0), PX(0) - 28, mm(L));
  o += dimH(PX(t + .5), PX(t + .5 + b.mw), PY(L), PY(L) + 26, mm(b.mw)) + dimV(PY(t + .5), PY(t + .5 + b.ml), PX(W), PX(W) + (b.drw ? 36 * k : 0) + 30, mm(b.ml));
  o += text(PX(W / 2), PY(L) + 54, 'ВИД СВЕРХУ (ПЛАН) · ламелей ' + n + ' шт · шаг ' + mm((b.ml + 1) / n) + ' мм', 8.5, 'middle', 'font-weight="700"');
  // --- вид сбоку (изголовье слева)
  const sx = px + W * k + 130 + (b.drw ? 36 * k : 0), sy = 90, SX = v => sx + v * k, SY = v => sy + (d.H - v) * k;
  o += rect(SX(0), SY(b.hh), t * k, (b.hh - b.lg) * k, 'o', 'url(#h1)') + rect(SX(L - t), SY(b.fh), t * k, (b.fh - b.lg) * k, 'o', 'url(#h1)');
  o += rect(SX(t), SY(b.lg + b.sh), (L - 2 * t) * k, b.sh * k, 'o', 'url(#h2)');
  o += rect(SX(0), SY(b.lg), 5 * k, b.lg * k, 'o') + rect(SX(L - 5), SY(b.lg), 5 * k, b.lg * k, 'o');
  o += line(SX(t), SY(d.slatTop), SX(L - t), SY(d.slatTop), 'o') + rect(SX(t + .5), SY(d.slatTop + .8 + b.mt), b.ml * k, b.mt * k, 'h') + text(SX(L / 2), SY(d.slatTop + .8 + b.mt / 2) + 3, 'матрас ' + mm(b.mt), 7.5);
  o += rect(SX(t), SY(b.lg + b.sh - 2), (L - 2 * t) * k, 4 * k, 't');
  if (b.soft) o += rect(SX(t), SY(b.hh - 2), 6 * k, (b.hh - b.lg - b.sh - 2) * k, 'o', '#e8e8e8') + text(SX(t + 12), SY(b.hh - 4), 'мягкая накладка', 6.5, 'start');
  if (bunk) {
    const y2 = b.lv2 + 3.2;
    o += rect(SX(0), SY(d.postH), 7 * k, d.postH * k, 'o') + rect(SX(L - 7), SY(d.postH), 7 * k, d.postH * k, 'o');
    o += rect(SX(7), SY(y2), (L - 14) * k, b.sh * k, 'o', 'url(#h2)') + line(SX(7), SY(b.lv2), SX(L - 7), SY(b.lv2), 'o') + rect(SX(t + .5), SY(b.lv2 + .8 + b.mt), b.ml * k, b.mt * k, 'h');
    o += rect(SX(7), SY(b.lv2 + b.mt + b.rail), (L - 14) * k, (b.mt + b.rail + 2) * k, 'h') + dimV(SY(b.lv2 + b.mt + b.rail), SY(b.lv2 + 1), SX(L), SX(L) + 30, mm(b.mt + b.rail));
    o += dimV(SY(b.lv2), SY(0), SX(L), SX(L) + 60, mm(b.lv2));
  }
  o += dimV(SY(b.hh), SY(0), SX(0), SX(0) - 28, mm(b.hh)) + dimV(SY(b.fh), SY(0), SX(L), SX(L) + (bunk ? 96 : 28), mm(b.fh)) + dimV(SY(b.lg + b.sh), SY(b.lg), SX(L / 2), SX(L / 2) + 0, mm(b.sh));
  o += dimV(SY(b.lg), SY(0), SX(L - 14), SX(L - 14) - 22, mm(b.lg));
  o += dimH(SX(0), SX(L), SY(d.H), SY(d.H) - 26, mm(L));
  o += text(SX(L / 2), SY(0) + 38, 'ВИД СБОКУ (изголовье слева) · боковина ' + mm(b.sh) + ' · ножки ' + mm(b.lg) + ' · основание на ' + mm(d.slatTop) + ' от пола', 8.5, 'middle', 'font-weight="700"');
  // --- вид спереди (с торца)
  const fx = sx + 40, fy = 390, FX = v => fx + v * k, FY = v => fy + (b.hh - v) * k;
  o += rect(FX(0), FY(b.hh), W * k, (b.hh - b.lg) * k, 'o', 'url(#h2)') + rect(FX(0), FY(b.fh), W * k, (b.fh - b.lg) * k, 'o', '#fff') + rect(FX(0), FY(b.lg), 5 * k, b.lg * k, 'o') + rect(FX(W - 5), FY(b.lg), 5 * k, b.lg * k, 'o');
  o += rect(FX(t + .5), FY(d.slatTop + .8 + b.mt), b.mw * k, b.mt * k, 'h');
  o += dimH(FX(0), FX(W), FY(b.hh), FY(b.hh) - 24, mm(W)) + dimV(FY(b.hh), FY(0), FX(W), FX(W) + 26, mm(b.hh)) + dimV(FY(b.fh), FY(0), FX(0), FX(0) - 26, mm(b.fh));
  o += text(FX(W / 2), FY(0) + 36, 'ВИД С ИЗНОЖЬЯ', 8.5, 'middle', 'font-weight="700"') + text(1100, 60, 'М 1:' + niceScale(sc), 12, 'end', 'font-weight="700"');
  return sheet(o, bedRows(S, bp, b, bi, 'общий вид и размеры'), no, total);
}
function sheetBedDetails(S, bp, bi, no, total) {
  const b = S.beds[bi], t = S.t, d = bedDims(b, t); let o = '';
  const T10 = t * 10, k = 3.2;
  // 1. угловое соединение боковины и изголовья (вид сверху)
  let x = 80, y = 110;
  o += text(x + 120, y - 34, '1 · Узел: боковина — изголовье (вид сверху)', 9, 'middle', 'font-weight="700"');
  o += rect(x, y, 220, T10 * k / 3.2 * 1, 'o', 'url(#h1)');   // изголовье
  o += rect(x, y + T10 * k / 3.2, T10 * k / 3.2 * 1, 190, 'o', 'url(#h1)');       // боковина
  o += circ(x + 36, y + 30, 5, 'o') + line(x + 36, y + 30, x + 36, y + 160, 'h') + circ(x + 36, y + 170, 4, 'o');
  o += text(x + 66, y + 34, 'конфирмат 7×50', 7.5, 'start') + text(x + 66, y + 174, 'шкант ⌀8×30 (2 шт)', 7.5, 'start') + dimH(x, x + T10 * k / 3.2, y + 190, y + 214, T10) + dimV(y, y + T10 * k / 3.2, x + 220, x + 246, T10);
  o += text(x + 110, y + 240, 'Соединение: торец боковины в пласть изголовья', 7.5, 'middle');
  // 2. ламель в держателе (сечение)
  x = 440; y = 110;
  o += text(x + 100, y - 34, '2 · Ламель в ламеледержателе (сечение)', 9, 'middle', 'font-weight="700"');
  o += rect(x, y + 70, 200, 38, 'o', 'url(#h2)') + text(x + 100, y + 128, 'опорный брусок 30×40', 7.5);
  o += rect(x + 20, y + 54, 160, 16, 'o', '#f1e6d2') + text(x + 100, y + 48, 'ламель бук 68×8, шаг ' + mm((b.ml + 1) / d.n) + ' мм', 7.5);
  o += `<path d="M ${x + 20} ${y + 54} q 0 -10 -8 -10 M ${x + 180} ${y + 54} q 0 -10 8 -10" ${ST.o}/>` + dimH(x + 20, x + 180, y + 70, y + 160, 68);
  // 3. ножка и крепление
  x = 780; y = 110;
  o += text(x + 100, y - 34, '3 · Ножка кровати', 9, 'middle', 'font-weight="700"');
  o += rect(x + 50, y, 100, 14, 'o', 'url(#h1)') + rect(x + 80, y + 14, 40, Math.min(150, b.lg * 10 * .6), 'o') + circ(x + 100, y + 7, 3, 'o');
  o += dimV(y + 14, y + 14 + Math.min(150, b.lg * 10 * .6), x + 80, x + 40, mm(b.lg)) + dimH(x + 80, x + 120, y + 14 + Math.min(150, b.lg * 10 * .6), y + 14 + Math.min(150, b.lg * 10 * .6) + 24, 50);
  o += text(x + 100, y + 14 + Math.min(150, b.lg * 10 * .6) + 50, 'монтажная пластина + болт M8', 7.5);
  // 4. матрас: слои
  x = 80; y = 400;
  o += text(x + 150, y - 24, '4 · Матрас «' + BED_STYLES[b.style].ru + '»: слои (сумма ' + mm(b.mt) + ' мм)', 9, 'middle', 'font-weight="700"');
  const layers = b.style === 'foam' ? [['Чехол стёганый', .08], ['Пена HR', .46], ['Пена средней жёсткости', .38], ['Чехол', .08]] : b.style === 'spring' ? [['Чехол стёганый', .08], ['Слой пены / струттофайбер', .17], ['Блок независимых пружин', .67], ['Основание', .08]] : b.style === 'ortho' ? [['Чехол', .08], ['Латекс', .25], ['Кокосовая койра', .34], ['Латекс', .25], ['Чехол', .08]] : [['Чехол', .08], ['Пена', .16], ['Блок пружин', .42], ['Кокосовая койра', .26], ['Основание', .08]];
  let yy = y; const th = 250;
  layers.forEach(([nm, f]) => { const h = th * f; o += rect(x, yy, 220, h, 'o', '#f6f3ec') + text(x + 236, yy + h / 2 + 3, nm + ' · ' + mm(b.mt * f) + ' мм', 7.5, 'start'); yy += h; });
  o += dimV(y, y + th, x, x - 24, mm(b.mt));
  // 5. спецификация основных деталей кровати
  x = 560; y = 400; o += text(x, y - 24, '5 · Детали кровати (из общего раскроя)', 9, 'start', 'font-weight="700"');
  const gr = bp.parts.filter(p => p.grp.indexOf('ровать ' + (bi + 1)) >= 0 || p.grp.indexOf('Двухъярусная кровать ' + (bi + 1)) >= 0).slice(0, 13);
  gr.forEach((p, i) => { o += text(x, y + 6 + i * 15, p.name.replace(/ \(кровать \d+\)/, '') + ' — ' + p.qty + ' шт · ' + p.L + '×' + p.W + '×' + p.t, 7, 'start'); });
  o += text(1100, 60, 'Узлы и сечения', 12, 'end', 'font-weight="700"');
  return sheet(o, bedRows(S, bp, b, bi, 'узлы, сечения, матрас'), no, total);
}
function sheetBunk(S, bp, bi, no, total) {
  const b = S.beds[bi], t = S.t, d = bedDims(b, t), sn = Math.max(3, b.steps | 0), sp = b.lv2 / (sn + 1); let o = '';
  const sc = Math.min(520 / (d.postH * 10 + 100), .3), k = 10 * sc, x0 = 120, y0 = 70, X = v => x0 + v * k, Y = v => y0 + (d.postH + 5 - v) * k;
  // ладья: вид сбоку с лестницей (торцевая) — стойки, ступени
  o += rect(X(0), Y(d.postH), 7 * k, d.postH * k, 'o', 'url(#h1)') + rect(X(d.L - 7), Y(d.postH), 7 * k, d.postH * k, 'o', 'url(#h1)');
  o += rect(X(7), Y(b.lv2 + 3.2), (d.L - 14) * k, b.sh * k, 'o', 'url(#h2)') + rect(X(7), Y(b.lg + b.sh), (d.L - 14) * k, b.sh * k, 'o', 'url(#h2)');
  o += rect(X(7), Y(b.lv2 + b.mt + b.rail), (d.L - 14) * k, (b.mt + b.rail + 2) * k, 'h') + text(X(d.L / 2), Y(b.lv2 + b.mt + b.rail / 2) + 3, 'бортик ' + mm(b.rail) + ' над матрасом', 7.5);
  o += rect(X(t + .5), Y(b.lv2 + .8 + b.mt), b.ml * k, b.mt * k, 'h') + rect(X(t + .5), Y(d.slatTop + .8 + b.mt), b.ml * k, b.mt * k, 'h');
  const lx = X(d.L) + 40; o += rect(lx, Y(b.lv2 + 6), 6 * k, (b.lv2 + 6) * k, 'o', 'url(#h1)') + rect(lx + 40 * k, Y(b.lv2 + 6), 6 * k, (b.lv2 + 6) * k, 'o', 'url(#h1)');
  for (let i = 1; i <= sn; i++) { o += rect(lx + 6 * k, Y(i * sp + 1.25), 34 * k, 2.5 * k, 'o', '#f1e6d2'); if (i > 1) o += dimV(Y(i * sp), Y((i - 1) * sp), lx + 46 * k, lx + 46 * k + 26 + (i % 2) * 22, mm(sp)); }
  o += dimV(Y(sp), Y(0), lx, lx - 26, mm(sp)) + dimV(Y(b.lv2), Y(0), X(0), X(0) - 34, mm(b.lv2)) + dimV(Y(d.postH), Y(0), X(0), X(0) - 70, mm(d.postH));
  o += dimV(Y(b.lv2 + b.mt + b.rail), Y(b.lv2), X(d.L - 7), X(d.L - 7) - 30, mm(b.mt + b.rail));
  o += dimH(X(0), X(d.L), Y(d.postH), Y(d.postH) - 26, mm(d.L)) + text(X(d.L / 2), Y(0) + 40, 'ДВУХЪЯРУСНАЯ: стойки 70×70, ярусы, бортики, лестница (' + sn + ' ступеней, шаг ' + mm(sp) + ' мм)', 9, 'middle', 'font-weight="700"');
  o += text(lx + 23 * k, Y(b.lv2 + 6) - 14, 'лестница', 8, 'middle', 'font-weight="700"');
  o += text(1100, 60, 'М 1:' + niceScale(sc), 12, 'end', 'font-weight="700"');
  return sheet(o, bedRows(S, bp, b, bi, 'двухъярусная: стойки и лестница'), no, total);
}
/* ---------- комната целиком: все предметы с размерами в мм ---------- */
function roomItems(S, bp) {
  const rm = S.room || {}, ft = wfoot(S), out = [];
  const add = (n, name, r, y0, y1) => out.push({ n, name, x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, y0, y1 });
  if (S.cols.some(c => !c.gap && !c.det)) add('Шкаф', 'Шкаф', { x0: rm.ox || 0, x1: (rm.ox || 0) + ft.w, z0: rm.oz || 0, z1: (rm.oz || 0) + ft.d }, 0, bp.g.totalH);
  S.cols.forEach((c, ci) => { if (c.det) add('Ш' + (ci + 1), 'Отдельный шкаф ' + (ci + 1), colRect(S, ci), 0, c.H || S.H); });
  S.units.forEach((u, i) => { const c = u.fp ? u : Object.assign({}, u); if (!c.fp) freeItem(S, 'unit', c); add('Т' + (i + 1), 'Тумба ' + (i + 1), itemRect(S, 'unit', c), 0, u.h); });
  S.beds.forEach((b, i) => { const c = b.fp ? b : Object.assign({}, b); if (!c.fp) freeItem(S, 'bed', c); add('К' + (i + 1), 'Кровать ' + (i + 1), itemRect(S, 'bed', c), 0, bedDims(b, S.t).H); });
  S.panels.forEach((p, i) => { const c = p.fp ? p : Object.assign({}, p); if (!c.fp) freeItem(S, 'panel', c); add('З' + (i + 1), 'Зеркало / панель ' + (i + 1), itemRect(S, 'panel', c), p.y, p.y + p.h); });
  (S.objs || []).forEach((q, i) => add('С' + (i + 1), OBJ_KINDS[q.kind].ru + ' ' + (i + 1), objRect(q), q.y || 0, (q.y || 0) + q.h));
  return out;
}
/* ---------- аксонометрия комнаты: как на эскизе — две стены, пол, мебель и проёмы ---------- */
function sheetIso(S, bp, no, total) {
  const P = roomPoly(S), E = roomEdges(P), H = (S.room && S.room.H) || 260, items = roomItems(S, bp), c30 = .866, s30 = .5;
  const pr = (x, y, z) => [(x - z) * c30, (x + z) * s30 - y];
  const pts = [];   // для масштаба
  P.forEach(p => { pts.push(pr(p[0], 0, p[1]), pr(p[0], H, p[1])); });
  items.forEach(it => { [[it.x0, it.z0], [it.x1, it.z0], [it.x1, it.z1], [it.x0, it.z1]].forEach(c => { pts.push(pr(c[0], it.y0, c[1]), pr(c[0], it.y1, c[1])); }); });
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), bx0 = Math.min(...xs), bx1 = Math.max(...xs), by0 = Math.min(...ys), by1 = Math.max(...ys);
  const sc = Math.min(720 / (bx1 - bx0 || 1), 560 / (by1 - by0 || 1)), ox = 60 - bx0 * sc + (720 - (bx1 - bx0) * sc) / 2, oy = 70 - by0 * sc;
  const Q = (x, y, z) => { const p = pr(x, y, z); return [ox + p[0] * sc, oy + p[1] * sc]; }, poly = (arr, st, fill) => `<polygon points="${arr.map(a => N(a[0]) + ',' + N(a[1])).join(' ')}" ${st || ST.o}${fill ? ` fill="${fill}"` : ''}/>`;
  let o = poly(P.map(p => Q(p[0], 0, p[1])), ST.o, '#f3ecdc');
  E.forEach(e => {   // стены, которые видно изнутри (дальние от зрителя)
    if ((e.nx + e.nz) / Math.SQRT2 < .3) return;
    o += poly([Q(e.a[0], 0, e.a[1]), Q(e.b[0], 0, e.b[1]), Q(e.b[0], H, e.b[1]), Q(e.a[0], H, e.a[1])], ST.t, 'rgba(210,205,195,.45)');
    const mid = Q((e.a[0] + e.b[0]) / 2, 0, (e.a[1] + e.b[1]) / 2); o += text(mid[0] + e.nx * 0 - 10, mid[1] + 24, Math.round(e.L * 10) + '', 7.5, 'middle', 'fill="#0b6e8f" font-weight="700"');
  });
  (S.opens || []).forEach((q, i) => {   // проёмы на видимых стенах
    const e = E[q.wall]; if (!e || (e.nx + e.nz) / Math.SQRT2 < .3) return;
    const W3 = (u, y) => Q(e.a[0] + e.ex * u, y, e.a[1] + e.ez * u), u0 = q.off, u1 = q.off + q.w, y0 = q.y, y1 = q.y + q.h;
    o += poly([W3(u0, y0), W3(u1, y0), W3(u1, y1), W3(u0, y1)], ST.o, q.kind === 'window' ? 'rgba(160,200,225,.55)' : (q.kind === 'door' || q.kind === 'balcony' ? 'rgba(160,110,70,.4)' : '#fff'));
    if (q.kind === 'window') for (let j = 1; j < (q.n || 1); j++) { const u = u0 + (u1 - u0) * j / q.n; o += line(W3(u, y0)[0], W3(u, y0)[1], W3(u, y1)[0], W3(u, y1)[1], 't'); }
    const c = W3((u0 + u1) / 2, (y0 + y1) / 2); o += text(c[0], c[1] + 3, String(i + 1), 6.5, 'middle', 'fill="#0b6e8f" font-weight="700"');
  });
  items.slice().sort((a, b) => (a.x0 + a.x1 + a.z0 + a.z1) - (b.x0 + b.x1 + b.z0 + b.z1)).forEach(it => {   // дальние сначала
    const top = [Q(it.x0, it.y1, it.z0), Q(it.x1, it.y1, it.z0), Q(it.x1, it.y1, it.z1), Q(it.x0, it.y1, it.z1)];
    o += poly([Q(it.x1, it.y0, it.z0), Q(it.x1, it.y0, it.z1), Q(it.x1, it.y1, it.z1), Q(it.x1, it.y1, it.z0)], ST.o, '#e1d8c6');   // грань +x
    o += poly([Q(it.x0, it.y0, it.z1), Q(it.x1, it.y0, it.z1), Q(it.x1, it.y1, it.z1), Q(it.x0, it.y1, it.z1)], ST.o, '#d3c9b3');   // грань +z
    o += poly(top, ST.o, '#f6f1e6');
    const tc = Q((it.x0 + it.x1) / 2, it.y1, (it.z0 + it.z1) / 2); o += text(tc[0], tc[1] + 3, it.n, 7.5, 'middle', 'font-weight="700"');
  });
  o += text(60 + 360, 52, 'АКСОНОМЕТРИЯ КОМНАТЫ · размеры стен и высота — мм · номера предметов см. в экспликации и на развёртках стен', 9, 'middle', 'font-weight="700"');
  const lx = 830, ly = 90; o += text(lx, ly - 6, 'ЭКСПЛИКАЦИЯ (мм)', 9, 'start', 'font-weight="700"');
  items.slice(0, 22).forEach((it, i) => { o += text(lx, ly + 14 + i * 26, `${it.n} ${it.name}`, 6.6, 'start', 'font-weight="700"') + text(lx + 6, ly + 25 + i * 26, `${mm(it.x1 - it.x0)}×${mm(it.z1 - it.z0)}×${mm(it.y1 - it.y0)} · от пола ${mm(it.y0)}`, 6, 'start', 'fill="#444"'); });
  return sheet(o, meta(S, bp).slice(0, 3).concat([['Лист', 'Аксонометрия комнаты'], ['Предметов', String(items.length + (S.opens || []).length)], ['Дата', new Date().toLocaleDateString('ru-RU')]]), no, total);
}
/* ---------- развёртка стены: проёмы, розетки и мебель с отступами от угла и высотой от пола, мм ---------- */
function wallElements(S, bp, wi, E, items) {
  const e = E[wi], L = e.L, out = [];
  (S.opens || []).forEach((q, i) => { if (q.wall === wi) out.push({ n: String(i + 1), name: OPEN_KINDS[q.kind].ru, u0: q.off, u1: q.off + q.w, y0: q.y, y1: q.y + q.h, kind: q.kind, ns: q.n || 1, open: true }); });
  items.forEach(it => {
    const cs = [[it.x0, it.z0], [it.x1, it.z0], [it.x1, it.z1], [it.x0, it.z1]].map(c => [(c[0] - e.a[0]) * e.ex + (c[1] - e.a[1]) * e.ez, (c[0] - e.a[0]) * e.nx + (c[1] - e.a[1]) * e.nz]);
    const u0 = Math.min(...cs.map(c => c[0])), u1 = Math.max(...cs.map(c => c[0])), dm = Math.min(...cs.map(c => c[1]));
    if (dm <= 30 && u1 > 0 && u0 < L) out.push({ n: it.n, name: it.name, u0, u1, y0: it.y0, y1: it.y1, kind: 'item', dist: dm });
  });
  return out.sort((a, b) => a.u0 - b.u0);
}
function sheetWall(S, bp, wi, items, no, total) {
  const P = roomPoly(S), E = roomEdges(P), e = E[wi], H = (S.room && S.room.H) || 260, L = e.L, els = wallElements(S, bp, wi, E, items);
  const nr = Math.min(els.length, 10), sc = Math.min((1000 - 40 - 24 * Math.min(els.length, 8)) / (L * 10), (560 - 18 * nr) / (H * 10), .45), k10 = 10 * sc, x0 = 80, y0 = 80, X = u => x0 + u * k10, Y = y => y0 + (H - y) * k10;
  let o = rect(X(0), Y(H), L * k10, H * k10, 't', '#faf7f0') + line(X(-20 / 10), Y(0), X(L + 2), Y(0), 'o');
  els.forEach(el => {
    const w = (el.u1 - el.u0) * k10, h = (el.y1 - el.y0) * k10;
    if (el.open) {
      o += rect(X(el.u0), Y(el.y1), w, h, 'o', el.kind === 'window' ? '#dbeaf3' : (el.kind === 'door' || el.kind === 'balcony' ? '#e6d2bb' : '#fff'));
      if (el.kind === 'window') for (let j = 1; j < el.ns; j++) o += line(X(el.u0 + (el.u1 - el.u0) * j / el.ns), Y(el.y1), X(el.u0 + (el.u1 - el.u0) * j / el.ns), Y(el.y0), 't');
      if (el.kind === 'door' || el.kind === 'balcony') o += line(X(el.u0), Y(el.y1), X(el.u1), (Y(el.y0) + Y(el.y1)) / 2, 'h') + line(X(el.u0), Y(el.y0), X(el.u1), (Y(el.y0) + Y(el.y1)) / 2, 'h');
    } else o += rect(X(Math.max(0, el.u0)), Y(el.y1), (Math.min(L, el.u1) - Math.max(0, el.u0)) * k10, h, 'o', 'url(#h2)');
    o += text(X((Math.max(0, el.u0) + Math.min(L, el.u1)) / 2), Y((el.y0 + el.y1) / 2) + 3, (el.open ? '№' : '') + el.n, 7, 'middle', 'font-weight="700" fill="#0b6e8f"');
  });
  // размеры по горизонтали: от левого угла стены до каждого элемента и его ширина — по строке на элемент
  els.slice(0, 10).forEach((el, i) => {
    const yd = Y(0) + 26 + i * 18, a = Math.max(0, el.u0), b = Math.min(L, el.u1);
    if (a > 0.5) o += dimH(X(0), X(a), Y(0), yd, mm(a));
    o += dimH(X(a), X(b), Y(0), yd, mm(b - a));
    const pv = els[i - 1]; if (pv && pv.u1 < el.u0 - .5 && pv.open !== el.open) o += dimH(X(pv.u1), X(el.u0), Y(0), yd + 9, 'зазор ' + mm(el.u0 - pv.u1));
  });
  o += dimH(X(0), X(L), Y(H), Y(H) - 22, mm(L)) + dimV(Y(H), Y(0), X(0), X(0) - 34, mm(H));
  // вертикальные размеры справа: от пола до низа элемента и высота элемента
  els.slice(0, 8).forEach((el, i) => {
    const xd = X(L) + 26 + i * 24, tiny = el.y1 - el.y0 <= 16;
    if (tiny) o += dimV(Y((el.y0 + el.y1) / 2), Y(0), X(L), xd, mm((el.y0 + el.y1) / 2)); else { if (el.y0 > .5) o += dimV(Y(el.y0), Y(0), X(L), xd, mm(el.y0)); o += dimV(Y(el.y1), Y(el.y0), X(L), xd, mm(el.y1 - el.y0)); }
    o += line(X(Math.min(L, el.u1)), Y(el.y0), X(L), Y(el.y0), 'c');
  });
  o += text(x0 + L * k10 / 2, y0 - 38, `РАЗВЁРТКА СТЕНЫ ${wi + 1} · длина ${mm(L)} мм · высота ${mm(H)} мм · вид изнутри комнаты, слева направо от начала стены`, 9.5, 'middle', 'font-weight="700"');
  return sheet(o, meta(S, bp).slice(0, 3).concat([['Лист', 'Развёртка стены ' + (wi + 1)], ['Элементов', String(els.length)], ['Дата', new Date().toLocaleDateString('ru-RU')]]), no, total);
}
/* ---------- по одному листу на каждый предмет: он сам в мм, расстояния до стен и соседей, высоты ---------- */
function obstacles(P, items, it) {   // до чего сколько мм в четыре стороны (стена или соседний предмет)
  const xc = (it.x0 + it.x1) / 2, zc = (it.z0 + it.z1) / 2, res = {};
  const hits = { L: [], R: [], U: [], D: [] };
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length];
    if (a[0] === b[0]) { const lo = Math.min(a[1], b[1]), hi = Math.max(a[1], b[1]); if (zc >= lo && zc <= hi) { if (a[0] <= it.x0 + .01) hits.L.push([it.x0 - a[0], 'стена']); if (a[0] >= it.x1 - .01) hits.R.push([a[0] - it.x1, 'стена']); } }
    else if (a[1] === b[1]) { const lo = Math.min(a[0], b[0]), hi = Math.max(a[0], b[0]); if (xc >= lo && xc <= hi) { if (a[1] <= it.z0 + .01) hits.U.push([it.z0 - a[1], 'стена']); if (a[1] >= it.z1 - .01) hits.D.push([a[1] - it.z1, 'стена']); } }
  }
  items.forEach(o => {
    if (o === it) return;
    if (o.z0 < it.z1 - .5 && o.z1 > it.z0 + .5) { if (o.x1 <= it.x0 + .5) hits.L.push([it.x0 - o.x1, o.n]); if (o.x0 >= it.x1 - .5) hits.R.push([o.x0 - it.x1, o.n]); }
    if (o.x0 < it.x1 - .5 && o.x1 > it.x0 + .5) { if (o.z1 <= it.z0 + .5) hits.U.push([it.z0 - o.z1, o.n]); if (o.z0 >= it.z1 - .5) hits.D.push([o.z0 - it.z1, o.n]); }
  });
  Object.keys(hits).forEach(k => { hits[k].sort((p, q) => p[0] - q[0]); res[k] = hits[k][0] || null; });
  return res;
}
function sheetItem(S, bp, it, items, no, total) {
  const P = roomPoly(S), bx = Math.max(...P.map(p => p[0])), bz = Math.max(...P.map(p => p[1])), sc = Math.min(540 / (bx * 10), 430 / (bz * 10)), k10 = 10 * sc, x0 = 70, y0 = 105, X = v => x0 + v * k10, Z = v => y0 + v * k10;
  let o = `<polygon points="${P.map(p => N(X(p[0])) + ',' + N(Z(p[1]))).join(' ')}" ${ST.o} stroke-width="2.5" fill="#faf7f0"/>`;
  items.forEach(q => { if (q !== it) o += rect(X(q.x0), Z(q.z0), (q.x1 - q.x0) * k10, (q.z1 - q.z0) * k10, 't', '#eee6d6') + text(X((q.x0 + q.x1) / 2), Z((q.z0 + q.z1) / 2) + 3, q.n, 6.5, 'middle', 'fill="#777"'); });
  o += rect(X(it.x0), Z(it.z0), (it.x1 - it.x0) * k10, (it.z1 - it.z0) * k10, 'o', 'url(#h2)') + text(X((it.x0 + it.x1) / 2), Z((it.z0 + it.z1) / 2) + 3, it.n, 9, 'middle', 'font-weight="700"');
  const ob = obstacles(P, items, it), xc = (it.x0 + it.x1) / 2, zc = (it.z0 + it.z1) / 2;
  const lab = (v, nm) => mm(v) + (nm !== 'стена' ? ' → ' + nm : '');
  if (ob.L) o += dimH(X(it.x0 - ob.L[0]), X(it.x0), Z(zc), Z(zc), lab(ob.L[0], ob.L[1]));
  if (ob.R) o += dimH(X(it.x1), X(it.x1 + ob.R[0]), Z(zc), Z(zc), lab(ob.R[0], ob.R[1]));
  if (ob.U) o += dimV(Z(it.z0 - ob.U[0]), Z(it.z0), X(xc), X(xc), lab(ob.U[0], ob.U[1]));
  if (ob.D) o += dimV(Z(it.z1), Z(it.z1 + ob.D[0]), X(xc), X(xc), lab(ob.D[0], ob.D[1]));
  o += dimH(X(it.x0), X(it.x1), Z(it.z0), Z(it.z0) - 14, mm(it.x1 - it.x0)) + dimV(Z(it.z0), Z(it.z1), X(it.x1), X(it.x1) + 14, mm(it.z1 - it.z0));
  o += dimH(X(0), X(bx), Z(0), Z(0) - 40, mm(bx)) + dimV(Z(0), Z(bz), X(bx), X(bx) + 34, mm(bz));
  // проёмы рядом (до 1,5 м): расстояние от предмета, мм
  const E = roomEdges(P), near = [];
  (S.opens || []).forEach((q, i) => { const c = openCenter(q, E); if (!c) return; const dx = Math.max(it.x0 - c.x, 0, c.x - it.x1), dz = Math.max(it.z0 - c.z, 0, c.z - it.z1), d = Math.hypot(dx, dz); if (d <= 150) near.push([d, q, i, c]); });
  near.sort((a, b) => a[0] - b[0]).slice(0, 8).forEach(([d, q, i, c], k) => {
    o += circ(X(c.x), Z(c.z), 3, 'o', '#fff') + text(X(c.x) + c.e.nx * 8, Z(c.z) + c.e.nz * 8 + 3, '№' + (i + 1), 6.5, 'middle', 'fill="#0b6e8f" font-weight="700"');
  });
  // справа: вид спереди самого предмета с высотами от пола
  const w = it.x1 - it.x0, d = it.z1 - it.z0, h = it.y1 - it.y0, fx = 700, fy = 110, sc2 = Math.min(420 / (Math.max(w, d) * 10), 360 / ((it.y1 + 5) * 10), .6), kk = 10 * sc2, FX = v => fx + v * kk, FY = v => fy + (Math.max(it.y1, 100) - v) * kk;
  const ww = (it.n === 'Шкаф') ? bp.g.W : w;
  o += line(FX(-6), FY(0), FX(ww + 8), FY(0), 'o') + rect(FX(0), FY(it.y1), ww * kk, h * kk, 'o', 'url(#h2)');
  if (it.n === 'Шкаф') { o += drawFront(Object.assign({}, S, { cols: S.cols.filter(c => !c.det), beds: [], units: [], panels: [] }), bp.g, FX(0), FY(bp.g.totalH), sc2, { marks: false }); }
  o += dimH(FX(0), FX(ww), FY(0), FY(0) + 26, mm(ww)) + dimV(FY(it.y1), FY(it.y0), FX(ww), FX(ww) + 30, mm(h));
  if (it.y0 > .5) o += dimV(FY(it.y0), FY(0), FX(0), FX(0) - 30, 'от пола ' + mm(it.y0));
  o += text(fx + ww * kk / 2, fy - 24, 'ВИД СПЕРЕДИ · габарит и высоты, мм', 8.5, 'middle', 'font-weight="700"');
  o += text(x0 + bx * k10 / 2, y0 - 62, 'ПЛАН КОМНАТЫ · где стоит «' + it.name + '» и что вокруг, мм', 9, 'middle', 'font-weight="700"');
  // список ближайших проёмов с расстояниями
  let ty = 560; o += text(70, ty, 'Рядом с этим предметом:', 7.5, 'start', 'font-weight="700"');
  [['слева', ob.L], ['справа', ob.R], ['сзади (к дальней стене)', ob.U], ['спереди', ob.D]].forEach(([nm, v], i) => { o += text(80, ty + 14 + i * 12, `${nm}: ${v ? mm(v[0]) + ' мм до ' + (v[1] === 'стена' ? 'стены' : 'предмета ' + v[1]) : '—'}`, 7, 'start'); });
  near.slice(0, 6).forEach(([dd, q, i], k) => { o += text(330, ty + 14 + k * 12, `№${i + 1} ${OPEN_KINDS[q.kind].ru}: ${mm(dd)} мм от предмета · от пола ${mm(q.y)} мм`, 7, 'start'); });
  return sheet(o, meta(S, bp).slice(0, 3).concat([['Предмет', it.n + ' · ' + it.name], ['Габарит Ш×Г×В', mm(w) + '×' + mm(d) + '×' + mm(h) + ' мм'], ['От пола / от стен', mm(it.y0) + ' / ' + mm(Math.min(it.x0, it.z0)) + ' мм']]), no, total);
}
export function buildSheets(S0) {
  const bpAll = buildParts(S0), pr = pricing(S0, bpAll), S = Object.assign({}, S0, { cols: S0.cols.filter(c => !c.det) }); S.W = geom(S).W;
  const bp = buildParts(S), total = '__T__', sheets = [], hasMain = S.cols.some(c => !c.gap);
  let no = 1;
  const add = (title, make) => {   // один неудавшийся лист не должен ломать все чертежи
    try { const r = make(no); (Array.isArray(r) ? r : [r]).forEach(x => { sheets.push(x); no++; }); }
    catch (e) { console.error('Чертёж «' + title + '»:', e); sheets.push(sheet(text(600, 200, 'Не удалось построить лист: ' + title, 12) + text(600, 230, String(e && e.message || e).slice(0, 120), 9), [['Лист', title], ['Ошибка', String(e && e.message || e).slice(0, 40)]], no, total)); no++; }
  };
  if (hasMain) add('Общий вид', n => sheetOverview(S, bp, n, total));
  if (S.objs.length || S.beds.length || S.units.length || S.panels.length || S.room.rot || S.room.oz || S0.cols.some(c => c.det) || (S0.opens || []).length || !hasMain) add('План комнаты', n => sheetRoomPlan(S0, bp, n, total));
  if ((S0.opens || []).length) add('Элементы стен', n => sheetOpenings(S0, bp, n, total));
  { const items0 = roomItems(S0, bp);
    if (items0.length || (S0.opens || []).length) {
      add('Аксонометрия комнаты', n => sheetIso(S0, bp, n, total));
      items0.forEach(it => add('Предмет ' + it.n, n => sheetItem(S0, bp, it, items0, n, total)));
    } }
  if (hasMain) { add('Двери', n => sheetDoors(S, bp, n, total)); add('Секции', n => sheetSections(S, bp, n, total)); }
  S.cols.forEach((c, i) => { if (!c.gap) add('Отсек ' + (i + 1), n => sheetColumn(S, bp, i, n, total)); });
  S.mezzes.forEach((m, i) => add('Антресоль ' + (i + 1), n => sheetMezz(S, bp, i, n, total)));
  S.beds.forEach((b, bi) => { add('Кровать ' + (bi + 1), n => sheetBedMain(S, bp, bi, n, total)); add('Кровать ' + (bi + 1) + ': узлы', n => sheetBedDetails(S, bp, bi, n, total)); if (b.kind === 'bunk') add('Двухъярусная ' + (bi + 1), n => sheetBunk(S, bp, bi, n, total)); });
  if (hasMain || S.beds.length) add('Узлы и детали', n => sheetDetails(S, bp, n, total));
  S0.cols.filter(c => c.det).forEach((c, di) => {   // отдельные шкафы: свои листы
    const Sd = Object.assign({}, S0, { cols: [Object.assign({}, c, { det: undefined })], mezzes: [], panels: [], units: [], beds: [], objs: [], opens: [], name: 'Отдельный шкаф ' + (di + 1), room: Object.assign({}, S0.room, { ox: 0, oz: 0, rot: 0 }) }); delete Sd.cols[0].det; Sd.W = geom(Sd).W;
    const bpd = buildParts(Sd); add('Отдельный шкаф ' + (di + 1), n => sheetOverview(Sd, bpd, n, total)); add('Отдельный шкаф ' + (di + 1) + ': отсек', n => sheetColumn(Sd, bpd, 0, n, total));
  });
  { const items1 = roomItems(S0, bp), E1 = roomEdges(roomPoly(S0));   // последние листы — розетки, окна, двери: размеры и расстояния от мебели
    E1.forEach((e, wi) => { if ((S0.opens || []).some(q => q.wall === wi)) add('Стена ' + (wi + 1) + ': окна, двери, розетки', n => sheetWall(S0, bp, wi, items1, n, total)); }); }
  add('Раскрой и спецификация', n => tableSheets(S0, bpAll, pr, n, total));
  return { sheets: sheets.map(x => x.split('__T__').join(String(sheets.length))), bp: bpAll, pr };
}
