/* Чертежи конструктора шкафа PRO в стиле AutoCAD, лист A4 (альбомный). Размеры на чертежах — в мм. Только для режима мастера. */
import { geom, ext, doorList, buildParts, pricing, edgeTotals, ITEM_TYPES, PALETTE, FILLS, r1 } from '/static/js/shkaf-pro-core.js?v=1';

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
const sheet = (inner, rows, no, total) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1190 840" width="100%" style="background:#fff;display:block" font-family="Arial, sans-serif">${defs}${rect(10, 10, 1170, 820, 'o')}${rect(30, 30, 1130, 760, 't')}${inner}${titleBlock(rows, no, total)}</svg>`;
const niceScale = sc => { const N0 = (1190 / 420) / sc, nice = [2, 4, 5, 8, 10, 15, 20, 25, 30, 40, 50, 75, 100]; let b = nice[0]; nice.forEach(n => { if (Math.abs(n - N0) < Math.abs(b - N0)) b = n; }); return b; };

function meta(S, bp) { return [['Изделие', S.name + ' · ' + Math.round(bp.g.W * 10) + '×' + Math.round(bp.g.totalH * 10) + '×' + Math.round(S.D * 10) + ' мм'], ['Цвет корпуса', S.custom ? S.custom : PALETTE[S.color][0]], ['Материал', 'ЛДСП ' + Math.round(S.t * 10) + ' мм, задняя стенка ХДФ 3 мм'], ['Отсеков', S.cols.filter(c => !c.gap).length + (S.cols.some(c => c.gap) ? ' + проём' : '') + (S.mezzes.length ? ', антресолей ' + S.mezzes.length : '')], ['Двери', { none: 'без дверей', swing: 'распашные ' + S.doors.n, sliding: 'купе ' + S.doors.n }[S.doors.kind]], ['Дата', new Date().toLocaleDateString('ru-RU')]]; }

/* ---------- вид спереди (с наполнением) ---------- */
function drawFront(S, g, x0, y0, sc, o) {
  o = o || {};
  const k10 = 10 * sc, X = v => x0 + v * k10, Y = v => y0 + (g.totalH - v) * k10, out = [], t = S.t;
  g.runs.forEach(r => {
    const rw = r.x1 - r.x0, RH = r.H;
    out.push(rect(X(r.x0), Y(RH), rw * k10, (RH - S.plinth) * k10, 'o'));
    out.push(rect(X(r.x0), Y(RH), t * k10, (RH - S.plinth) * k10, 'o', 'url(#h1)'), rect(X(r.x1 - t), Y(RH), t * k10, (RH - S.plinth) * k10, 'o', 'url(#h1)'));
    out.push(rect(X(r.x0 + t), Y(RH), (rw - 2 * t) * k10, t * k10, 'o', 'url(#h1)'), rect(X(r.x0 + t), Y(S.plinth + t), (rw - 2 * t) * k10, t * k10, 'o', 'url(#h1)'));
    out.push(rect(X(r.x0 + t), Y(S.plinth), (rw - 2 * t) * k10, S.plinth * k10, 't', '#efefef'), text(X((r.x0 + r.x1) / 2), Y(S.plinth / 2) + 3, 'цоколь ' + mm(S.plinth), 7));
  });
  g.bnd.forEach((b, k) => { if (!b.has || k === 0 || k === g.cols.length) return; const L = g.cols[k - 1], R = g.cols[k]; if (L.gap || R.gap || R.split) return; out.push(rect(X(b.x), Y(L.y1), t * k10, (L.y1 - g.y0) * k10, 'o', 'url(#h1)')); });
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
      if (it.type === 'shelf') out.push(rect(X(xa), Y(it.y + t), w * k10, t * k10, 'o', 'url(#h1)'));
      else if (it.type === 'rod') { out.push(line(X(xa + .3), Y(it.y), X(xb - .3), Y(it.y), 'o'), rect(X(xa), Y(it.y + 1.7), 2.8 * k10, 3.4 * k10, 't'), rect(X(xb - 2.8), Y(it.y + 1.7), 2.8 * k10, 3.4 * k10, 't')); }
      else if (it.type === 'drawer') for (let k = 0; k < 1; k++) { const yy = it.y + k * it.fh; out.push(rect(X(xa + .2), Y(yy + it.fh - .15), (w - .4) * k10, (it.fh - .3) * k10, 'o', '#fff'), rect(X(xa + w / 2 - 7), Y(yy + it.fh - 4), 140 * sc, 8 * sc, 't', '#ddd')); }
      else if (it.type === 'shoe') for (let k = 0; k < it.n; k++) out.push(line(X(xa), Y(it.y + k * 12 + 3), X(xb), Y(it.y + k * 12 + 3), 'o'));
      else if (it.type === 'pant') out.push(rect(X(xa + 1), Y(it.y + 10), (w - 2) * k10, 100 * sc, 'h'), text(X(xa + w / 2), Y(it.y + 5) + 3, 'брючница', 6.5));
      else if (it.type === 'basket') out.push(rect(X(xa + 1.5), Y(it.y + it.h), (w - 3) * k10, it.h * k10, 'h'), text(X(xa + w / 2), Y(it.y + it.h / 2) + 3, 'корзина', 6.5));
      else if (it.type === 'hook') { out.push(rect(X(xa + .2), Y(it.y + 4), (w - .4) * k10, 40 * sc, 'o', '#fff')); for (let k = 0; k < Math.max(2, Math.floor(w / 8)); k++) out.push(circ(X(xa + (k + .5) * w / Math.max(2, Math.floor(w / 8))), Y(it.y + 2), 2.2 * sc * 3, 't')); }
      else if (it.type === 'led') out.push(line(X(xa + .5), Y(it.y), X(xb - .5), Y(it.y), 'c'));
      else if (it.type === 'vpanel') out.push(rect(X(xa + it.x), Y(it.y1), t * k10, (it.y1 - it.y) * k10, 'o', 'url(#h1)'));
      else if (it.type === 'idoor') { const iw = Math.min(it.w || (w - it.x), w - it.x); out.push(rect(X(xa + it.x), Y(it.y1), iw * k10, (it.y1 - it.y) * k10, 'o', '#fff'), text(X(xa + it.x + iw / 2), Y((it.y + it.y1) / 2), 'дверца ' + ({ L: '◀', R: '▶', U: '▲', D: '▼' }[it.dir] || '◀'), 7)); }
      if (o.marks && it.type !== 'led') out.push(text(X(xa) + 4, Y(a) - 2, 'y' + mm(a), 6, 'start', 'fill="#b3261e"'));
    });
  });
  (S.panels || []).forEach((p, i) => { out.push(rect(X(p.x), Y(p.y + p.h), p.w * k10, p.h * k10, 'o', 'url(#h2)'), text(X(p.x + p.w / 2), Y(p.y + p.h / 2), 'П' + (i + 1) + ' ' + FILLS[p.kind], 7), text(X(p.x + p.w / 2), Y(p.y + p.h / 2) + 14, mm(p.w) + '×' + mm(p.h), 7, 'middle', 'fill="#0b6e8f"')); });
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
    if (it.type === 'shelf') { o += rect(X(xa), Y(it.y + T), w * 10 * sc, T * 10 * sc, 'o', 'url(#h1)'); lines.push([it.y + T / 2, `Полка ${mm(T)}×${mm(w - .2)}×${mm(it.d || c.D - 2.5)}`]); }
    else if (it.type === 'rod') { o += line(X(xa + .3), Y(it.y), X(xb - .3), Y(it.y), 'o') + rect(X(xa), Y(it.y + 1.7), 28 * sc, 34 * sc, 't') + rect(X(xb - 2.8), Y(it.y + 1.7), 28 * sc, 34 * sc, 't'); lines.push([it.y, `Штанга ⌀25, L=${mm(w - .6)}`]); }
    else if (it.type === 'drawer') { for (let k = 0; k < 1; k++) { const yy = it.y + k * it.fh; o += rect(X(xa + .2), Y(yy + it.fh - .15), (w - .4) * 10 * sc, (it.fh - .3) * 10 * sc, 'o', '#fff') + rect(X(xa + w / 2 - 7), Y(yy + it.fh - 4), 140 * sc, 8 * sc, 't', '#ddd'); } lines.push([(a + b) / 2, `Ящик · фасад ${mm(w - .4)}×${mm(it.fh - .3)}`]); }
    else if (it.type === 'shoe') { for (let k = 0; k < it.n; k++) o += line(X(xa), Y(it.y + k * 12 + 3), X(xb), Y(it.y + k * 12 + 3), 'o'); lines.push([(a + b) / 2, `Обувные полки ${it.n} шт.`]); }
    else if (it.type === 'pant') { o += rect(X(xa + 1), Y(it.y + 10), (w - 2) * 10 * sc, 100 * sc, 'h'); lines.push([it.y + 5, 'Брючница выдвижная']); }
    else if (it.type === 'basket') { o += rect(X(xa + 1.5), Y(it.y + it.h), (w - 3) * 10 * sc, it.h * 10 * sc, 'h'); lines.push([it.y + it.h / 2, `Корзина h=${mm(it.h)}`]); }
    else if (it.type === 'hook') { o += rect(X(xa + .2), Y(it.y + 4), (w - .4) * 10 * sc, 40 * sc, 'o', '#fff'); lines.push([it.y + 2, 'Планка с крючками']); }
    else if (it.type === 'led') { o += line(X(xa + .5), Y(it.y), X(xb - .5), Y(it.y), 'c'); lines.push([it.y, 'LED-подсветка']); }
    else if (it.type === 'vpanel') { o += rect(X(xa + it.x), Y(it.y1), T * 10 * sc, (it.y1 - it.y) * 10 * sc, 'o', 'url(#h1)'); lines.push([(it.y + it.y1) / 2, `Вертикальная панель ${mm(it.y1 - it.y)}×${mm(c.D - 2.5)}`]); }
    else if (it.type === 'idoor') { const iw = Math.min(it.w || (w - it.x), w - it.x); o += rect(X(xa + it.x), Y(it.y1), iw * 10 * sc, (it.y1 - it.y) * 10 * sc, 'o', '#fff'); lines.push([(it.y + it.y1) / 2, `Дверца ${mm(iw - .4)}×${mm(it.y1 - it.y - .4)} · открывание ${({ L: 'влево', R: 'вправо', U: 'вверх', D: 'вниз' })[it.dir] || 'влево'}`]); }
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

export function buildSheets(S) {
  const bp = buildParts(S), pr = pricing(S, bp);
  const total = '__T__';
  let no = 1;
  const sheets = [sheetOverview(S, bp, no++, total), sheetDoors(S, bp, no++, total), sheetSections(S, bp, no++, total)];
  S.cols.forEach((c, i) => { if (!c.gap) sheets.push(sheetColumn(S, bp, i, no++, total)); });
  S.mezzes.forEach((m, i) => sheets.push(sheetMezz(S, bp, i, no++, total)));
  sheets.push(sheetDetails(S, bp, no++, total));
  const tbl = tableSheets(S, bp, pr, no, total);
  tbl.forEach(t => sheets.push(t));
  return { sheets: sheets.map(x => x.split('__T__').join(String(sheets.length))), bp, pr };
}
