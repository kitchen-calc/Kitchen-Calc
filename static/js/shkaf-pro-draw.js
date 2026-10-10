/* Чертежи конструктора шкафа PRO в стиле AutoCAD, лист A4 (альбомный). Размеры на чертежах — в мм. Только для режима мастера. */
import { geom, ext, doorList, buildParts, pricing, ITEM_TYPES, PALETTE, FILLS, r1 } from '/static/js/shkaf-pro-core.js?v=1';

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

function meta(S, bp) { return [['Изделие', S.name + ' · ' + Math.round(bp.g.W * 10) + '×' + Math.round(S.H * 10) + '×' + Math.round(S.D * 10) + ' мм'], ['Цвет корпуса', S.custom ? S.custom : PALETTE[S.color][0]], ['Материал', 'ЛДСП ' + Math.round(S.t * 10) + ' мм, задняя стенка ХДФ 3 мм'], ['Отсеков', S.cols.length + (S.mezz.on ? ', антресоль' : '')], ['Двери', { none: 'без дверей', swing: 'распашные ' + S.doors.n, sliding: 'купе ' + S.doors.n }[S.doors.kind]], ['Дата', new Date().toLocaleDateString('ru-RU')]]; }

/* ---------- вид спереди (с наполнением) ---------- */
function drawFront(S, g, x0, y0, sc, o) {
  o = o || {};
  const X = v => x0 + v * 10 * sc, Y = v => y0 + (S.H - v) * 10 * sc, out = [], t = S.t;
  // каркас
  out.push(rect(X(0), Y(S.H), g.W * 10 * sc, (S.H - S.plinth) * 10 * sc, 'o'));
  out.push(rect(X(0), Y(S.H), t * 10 * sc, (S.H - S.plinth) * 10 * sc, 'o', 'url(#h1)'), rect(X(g.W - t), Y(S.H), t * 10 * sc, (S.H - S.plinth) * 10 * sc, 'o', 'url(#h1)'));
  out.push(rect(X(t), Y(S.H), (g.W - 2 * t) * 10 * sc, t * 10 * sc, 'o', 'url(#h1)'), rect(X(t), Y(S.plinth + t), (g.W - 2 * t) * 10 * sc, t * 10 * sc, 'o', 'url(#h1)'));
  out.push(rect(X(t), Y(S.plinth), (g.W - 2 * t) * 10 * sc, S.plinth * 10 * sc, 't', '#efefef'), text(X(g.W / 2), Y(S.plinth / 2) + 3, 'цоколь ' + mm(S.plinth), 7));
  if (S.mezz.on) out.push(rect(X(t), Y(g.yMF + t), (g.W - 2 * t) * 10 * sc, t * 10 * sc, 'o', 'url(#h1)'));
  g.cols.forEach((c, i) => {
    if (i < g.cols.length - 1) { out.push(rect(X(c.xb), Y(g.y1), t * 10 * sc, (g.y1 - g.y0) * 10 * sc, 'o', 'url(#h1)')); if (S.mezz.on) out.push(rect(X(c.xb), Y(g.my1), t * 10 * sc, (g.my1 - g.my0) * 10 * sc, 'o', 'url(#h1)')); }
    const col = S.cols[i];
    col.items.forEach(it => {
      const [a, b] = ext(it, S), xa = c.xa, xb = c.xb, w = c.w;
      if (it.type === 'shelf') out.push(rect(X(xa), Y(it.y + t), w * 10 * sc, t * 10 * sc, 'o', 'url(#h1)'));
      else if (it.type === 'rod') { out.push(line(X(xa + .3), Y(it.y), X(xb - .3), Y(it.y), 'o'), rect(X(xa), Y(it.y + 1.7), 2.8 * 10 * sc, 3.4 * 10 * sc, 't'), rect(X(xb - 2.8), Y(it.y + 1.7), 2.8 * 10 * sc, 3.4 * 10 * sc, 't')); }
      else if (it.type === 'drawers') for (let k = 0; k < it.n; k++) { const yy = it.y + k * it.fh; out.push(rect(X(xa + .2), Y(yy + it.fh - .15), (w - .4) * 10 * sc, (it.fh - .3) * 10 * sc, 'o', '#fff'), rect(X(xa + w / 2 - 7), Y(yy + it.fh - 4), 140 * sc, 8 * sc, 't', '#ddd')); }
      else if (it.type === 'shoe') for (let k = 0; k < it.n; k++) out.push(line(X(xa), Y(it.y + k * 12 + 3), X(xb), Y(it.y + k * 12 + 3), 'o'), line(X(xa), Y(it.y + k * 12 + 3), X(xb), Y(it.y + k * 12 + 3 + 0), 't'));
      else if (it.type === 'pant') out.push(rect(X(xa + 1), Y(it.y + 10), (w - 2) * 10 * sc, 100 * sc, 'h'), text(X(xa + w / 2), Y(it.y + 5) + 3, 'брючница', 6.5));
      else if (it.type === 'basket') out.push(rect(X(xa + 1.5), Y(it.y + it.h), (w - 3) * 10 * sc, it.h * 10 * sc, 'h'), text(X(xa + w / 2), Y(it.y + it.h / 2) + 3, 'корзина', 6.5));
      else if (it.type === 'hook') { out.push(rect(X(xa + .2), Y(it.y + 4), (w - .4) * 10 * sc, 40 * sc, 'o', '#fff')); for (let k = 0; k < Math.max(2, Math.floor(w / 8)); k++) out.push(circ(X(xa + (k + .5) * w / Math.max(2, Math.floor(w / 8))), Y(it.y + 2), 2.2 * sc * 3, 't')); }
      else if (it.type === 'led') out.push(line(X(xa + .5), Y(it.y), X(xb - .5), Y(it.y), 'c'));
      else if (it.type === 'vpanel') out.push(rect(X(xa + it.x), Y(it.y1), t * 10 * sc, (it.y1 - it.y) * 10 * sc, 'o', 'url(#h1)'));
      if (o.marks && it.type !== 'led') out.push(text(X(xa) + 4, Y(a) - 2, 'y' + mm(a), 6, 'start', 'fill="#b3261e"'));
    });
  });
  return out.join('');
}

function drawSection(S, g, ci, x0, y0, sc) {
  const X = v => x0 + v * 10 * sc, Y = v => y0 + (S.H - v) * 10 * sc, out = [], t = S.t, D = S.D, col = S.cols[ci];
  out.push(rect(X(0), Y(S.H), D * 10 * sc, (S.H - S.plinth) * 10 * sc, 'o'));
  out.push(rect(X(0), Y(S.H), .3 * 10 * sc, (S.H - S.plinth) * 10 * sc, 'o', 'url(#h1)'));
  out.push(rect(X(.3), Y(S.H), (D - .3) * 10 * sc, t * 10 * sc, 'o', 'url(#h1)'), rect(X(.3), Y(S.plinth + t), (D - .3) * 10 * sc, t * 10 * sc, 'o', 'url(#h1)'));
  out.push(rect(X(D - 6 - t), Y(S.plinth), t * 10 * sc, S.plinth * 10 * sc, 'o', 'url(#h1)'));
  if (S.mezz.on) out.push(rect(X(.3), Y(g.yMF + t), (D - .3) * 10 * sc, t * 10 * sc, 'o', 'url(#h1)'));
  col.items.forEach(it => {
    if (it.type === 'shelf') out.push(rect(X(.3), Y(it.y + t), (it.d || D - 2.5) * 10 * sc, t * 10 * sc, 'o', 'url(#h1)'));
    else if (it.type === 'rod') out.push(circ(X(D / 2), Y(it.y), 12.5 * sc, 'o'), rect(X(D / 2 - 12), Y(it.y - 1.7), 24 * sc, 34 * sc, 't'));
    else if (it.type === 'drawers') for (let k = 0; k < it.n; k++) { const yy = it.y + k * it.fh; out.push(rect(X(D - t), Y(yy + it.fh - .15), t * 10 * sc, (it.fh - .3) * 10 * sc, 'o', 'url(#h2)'), rect(X(6), Y(yy + it.fh - 3), (D - 12) * 10 * sc, (it.fh - 4) * 10 * sc, 'h')); }
    else if (it.type === 'shoe') for (let k = 0; k < it.n; k++) { const yb = it.y + k * 12; out.push(line(X(.3), Y(yb + 9), X(D - 6), Y(yb + 1), 'o'), line(X(D - 6), Y(yb + 1), X(D - 6), Y(yb + 3), 'o')); }
    else if (it.type === 'basket') out.push(rect(X(8), Y(it.y + it.h), (D - 16) * 10 * sc, it.h * 10 * sc, 'h'));
    else if (it.type === 'pant') out.push(rect(X(6), Y(it.y + 10), (D - 12) * 10 * sc, 100 * sc, 'h'));
    else if (it.type === 'hook') out.push(rect(X(.3), Y(it.y + 4), 16 * sc, 40 * sc, 'o', 'url(#h1)'), line(X(1.9), Y(it.y + 2), X(7), Y(it.y + 2), 'o'));
  });
  const dd = doorList(S).find(d => d.zone === 'main'); if (dd) out.push(rect(X(D + .3), Y(dd.y + dd.h), 16 * sc, dd.h * 10 * sc, 'o', 'url(#h2)'), text(X(D) + 18 * sc * 0 + 6, Y(S.H / 2), 'дверь', 7, 'start'));
  out.push(dimH(X(0), X(D), Y(S.H), Y(S.H) - 24, mm(D)), dimV(Y(S.H), Y(0), X(D) + 16 * sc, X(D) + 70 * sc + 24, mm(S.H)));
  // цепочка высот предметов слева
  const ys = col.items.filter(i => i.type !== 'led').map(i => ext(i, S)[0]).sort((a, b) => a - b);
  ys.forEach((yv, k) => { out.push(dimV(Y(yv), Y(0), X(0), X(0) - 24 - (k % 3) * 22, mm(yv))); });
  return out.join('');
}

function drawPlan(S, g, x0, y0, sc) {
  const X = v => x0 + v * 10 * sc, Y = v => y0 + v * 10 * sc, out = [], t = S.t, D = S.D, W = g.W;
  out.push(rect(X(0), Y(0), W * 10 * sc, D * 10 * sc, 'o'));
  out.push(rect(X(0), Y(0), t * 10 * sc, (D - 0) * 10 * sc, 'o', 'url(#h1)'), rect(X(W - t), Y(0), t * 10 * sc, D * 10 * sc, 'o', 'url(#h1)'), rect(X(0), Y(0), W * 10 * sc, .3 * 10 * sc, 'o', 'url(#h1)'));
  g.cols.forEach((c, i) => { if (i < g.cols.length - 1) out.push(rect(X(c.xb), Y(.3), t * 10 * sc, (D - .3) * 10 * sc, 'o', 'url(#h1)')); });
  doorList(S).filter(d => d.zone === 'main').forEach(d => {
    if (S.doors.kind === 'swing') { const left = d.i < S.doors.n / 2, hx = left ? d.x : d.x + d.w, r = d.w; out.push(`<path d="M ${N(X(left ? d.x + r : d.x - 0))} ${N(Y(D))} A ${N(r * 10 * sc)} ${N(r * 10 * sc)} 0 0 ${left ? 1 : 0} ${N(X(hx))} ${N(Y(D + r))}" ${ST.h}/>`, line(X(hx), Y(D), X(hx), Y(D + r), 'h')); }
    else out.push(rect(X(d.x), Y(D + .4 + (d.i % 2) * 3.4), d.w * 10 * sc, 16 * sc, 'o', 'url(#h2)'));
  });
  out.push(dimH(X(0), X(W), Y(0), Y(0) - 24, mm(W)), dimV(Y(0), Y(D), X(W), X(W) + 28, mm(D)));
  g.cols.forEach(c => out.push(dimH(X(c.xa), X(c.xb), Y(D), Y(D) + 26 + (S.doors.kind === 'swing' ? 40 : 0), mm(c.w))));
  return out.join('');
}

/* ---------- листы ---------- */
function sheetOverview(S, bp, no, total) {
  const g = bp.g, sc = Math.min(1000 / (g.W * 10), 470 / (S.H * 10), .5), x0 = 105, y0 = 80;
  let o = drawFront(S, g, x0, y0, sc, { marks: false });
  o += dimH(x0, x0 + g.W * 10 * sc, y0, y0 - 30, mm(g.W));
  g.cols.forEach((c, i) => { o += dimH(x0 + c.xa * 10 * sc, x0 + c.xb * 10 * sc, y0, y0 - 8 + 0, mm(c.w)); });
  o += dimV(y0, y0 + S.H * 10 * sc, x0 + g.W * 10 * sc, x0 + g.W * 10 * sc + 34, mm(S.H));
  if (S.mezz.on) o += dimV(y0, y0 + (S.H - g.my0) * 10 * sc, x0, x0 - 30, mm(S.mezz.h + S.t)), o += dimV(y0 + (S.H - g.y1) * 10 * sc, y0 + (S.H - S.plinth) * 10 * sc, x0, x0 - 60, mm(g.y1 - S.plinth));
  o += text(x0 + g.W * 10 * sc / 2, y0 + S.H * 10 * sc + 40, 'ВИД СПЕРЕДИ (двери сняты, показано наполнение)', 10, 'middle', 'font-weight="700"');
  o += text(1100, 60, `М 1:${niceScale(sc)}`, 12, 'end', 'font-weight="700"');
  return sheet(o, meta(S, bp), no, total);
}
function sheetDoors(S, bp, no, total) {
  const g = bp.g, sc = Math.min(1000 / (g.W * 10), 470 / (S.H * 10), .5), x0 = 105, y0 = 80, X = v => x0 + v * 10 * sc, Y = v => y0 + (S.H - v) * 10 * sc;
  let o = rect(X(0), Y(S.H), g.W * 10 * sc, S.H * 10 * sc, 't');
  const dl = bp.doors;
  dl.forEach(d => {
    o += rect(X(d.x), Y(d.y + d.h), d.w * 10 * sc, d.h * 10 * sc, 'o', d.fill === 'dsp' ? '#fff' : 'url(#h2)');
    o += text(X(d.x + d.w / 2), Y(d.y + d.h / 2), (d.zone === 'mezz' ? 'А' : 'Д') + (d.i + 1) + ' · ' + (FILLS[d.fill]), 7.5);
    o += text(X(d.x + d.w / 2), Y(d.y + d.h / 2) + 14, mm(d.w) + '×' + mm(d.h), 7.5, 'middle', 'fill="#0b6e8f"');
    if (S.doors.kind === 'swing' || d.zone === 'mezz') { const left = d.i < (d.zone === 'mezz' ? S.mezz.n : S.doors.n) / 2; const n = d.h <= 90 ? 2 : d.h <= 160 ? 3 : d.h <= 220 ? 4 : 5; for (let k = 0; k < n; k++) { const yy = d.y + 10 + k * (d.h - 20) / (n - 1); o += circ(X(left ? d.x + 2 : d.x + d.w - 2), Y(yy), 3.5, 'o'); } o += line(X(left ? d.x + d.w : d.x), Y(d.y), X(left ? d.x : d.x + d.w), Y(d.y + d.h / 2), 'h') + line(X(left ? d.x + d.w : d.x), Y(d.y + d.h), X(left ? d.x : d.x + d.w), Y(d.y + d.h / 2), 'h'); }
  });
  if (S.doors.kind === 'sliding') o += line(X(0), Y(S.plinth + 1), X(g.W), Y(S.plinth + 1), 'c') + line(X(0), Y(bp.g.doorTop - 1), X(g.W), Y(bp.g.doorTop - 1), 'c') + text(X(g.W / 2), Y(S.plinth) + 14, 'нижняя направляющая системы купе', 7);
  o += dimH(X(0), X(g.W), Y(S.H), Y(S.H) - 28, mm(g.W)) + dimV(Y(S.H), Y(0), X(g.W), X(g.W) + 34, mm(S.H));
  o += text(X(g.W / 2), Y(0) + 40, 'ФАСАДЫ: ДВЕРИ И ЗАПОЛНЕНИЕ (мм)', 10, 'middle', 'font-weight="700"') + text(1100, 60, `М 1:${niceScale(sc)}`, 12, 'end', 'font-weight="700"');
  return sheet(o, meta(S, bp), no, total);
}
function sheetSections(S, bp, no, total) {
  const g = bp.g; let ci = 0, best = -1; S.cols.forEach((c, i) => { if (c.items.length > best) { best = c.items.length; ci = i; } });
  const sc = Math.min(330 / (S.D * 10), 470 / (S.H * 10), .45), pw = Math.min(1000 / (g.W * 10), 230 / (S.D * 10), .5);
  let o = drawSection(S, g, ci, 150, 90, sc) + text(150 + S.D * 5 * sc, 90 + S.H * 10 * sc + 40, 'РАЗРЕЗ ПО ОТСЕКУ ' + (ci + 1) + ' (вид сбоку)', 10, 'middle', 'font-weight="700"');
  o += drawPlan(S, g, 560, 120, Math.min(pw, 560 / (g.W * 10))) + text(560 + g.W * 5 * Math.min(pw, 560 / (g.W * 10)), 120 + S.D * 10 * Math.min(pw, 560 / (g.W * 10)) + 110 + (S.doors.kind === 'swing' ? 80 : 0), 'ВИД СВЕРХУ (ПЛАН)', 10, 'middle', 'font-weight="700"');
  return sheet(o, meta(S, bp), no, total);
}
function sheetColumn(S, bp, ci, no, total) {
  const g = bp.g, c = g.cols[ci], col = S.cols[ci], sc = Math.min(470 / (S.H * 10), 360 / (c.w * 10), .5), x0 = 230, y0 = 80, X = v => x0 + (v - c.xa + 2) * 10 * sc, Y = v => y0 + (S.H - v) * 10 * sc;
  let o = '';
  const T = S.t;
  o += rect(X(c.xa - T), Y(S.H), T * 10 * sc, (S.H - S.plinth) * 10 * sc, 'o', 'url(#h1)') + rect(X(c.xb), Y(S.H), T * 10 * sc, (S.H - S.plinth) * 10 * sc, 'o', 'url(#h1)');
  o += rect(X(c.xa - T), Y(S.H), (c.w + 2 * T) * 10 * sc, T * 10 * sc, 'o', 'url(#h1)') + rect(X(c.xa - T), Y(S.plinth + T), (c.w + 2 * T) * 10 * sc, T * 10 * sc, 'o', 'url(#h1)');
  if (S.mezz.on) o += rect(X(c.xa - T), Y(g.yMF + T), (c.w + 2 * T) * 10 * sc, T * 10 * sc, 'o', 'url(#h1)');
  const sub = { xa: c.xa, xb: c.xb, w: c.w };
  const fake = Object.assign({}, S, { cols: [col] }), gg = Object.assign({}, g, { cols: [sub] });
  // наполнение отсека
  const items = col.items.slice().sort((a, b) => ext(a, S)[0] - ext(b, S)[0]), lines = [];
  items.forEach(it => {
    const [a, b] = ext(it, S), w = c.w, xa = c.xa, xb = c.xb;
    if (it.type === 'shelf') { o += rect(X(xa), Y(it.y + T), w * 10 * sc, T * 10 * sc, 'o', 'url(#h1)'); lines.push([it.y + T / 2, `Полка ${mm(T)}×${mm(w - .2)}×${mm(it.d || S.D - 2.5)}`]); }
    else if (it.type === 'rod') { o += line(X(xa + .3), Y(it.y), X(xb - .3), Y(it.y), 'o') + rect(X(xa), Y(it.y + 1.7), 28 * sc, 34 * sc, 't') + rect(X(xb - 2.8), Y(it.y + 1.7), 28 * sc, 34 * sc, 't'); lines.push([it.y, `Штанга ⌀25, L=${mm(w - .6)}`]); }
    else if (it.type === 'drawers') { for (let k = 0; k < it.n; k++) { const yy = it.y + k * it.fh; o += rect(X(xa + .2), Y(yy + it.fh - .15), (w - .4) * 10 * sc, (it.fh - .3) * 10 * sc, 'o', '#fff') + rect(X(xa + w / 2 - 7), Y(yy + it.fh - 4), 140 * sc, 8 * sc, 't', '#ddd'); } lines.push([(a + b) / 2, `Ящики ${it.n} шт. · фасад ${mm(w - .4)}×${mm(it.fh - .3)}`]); }
    else if (it.type === 'shoe') { for (let k = 0; k < it.n; k++) o += line(X(xa), Y(it.y + k * 12 + 3), X(xb), Y(it.y + k * 12 + 3), 'o'); lines.push([(a + b) / 2, `Обувные полки ${it.n} шт.`]); }
    else if (it.type === 'pant') { o += rect(X(xa + 1), Y(it.y + 10), (w - 2) * 10 * sc, 100 * sc, 'h'); lines.push([it.y + 5, 'Брючница выдвижная']); }
    else if (it.type === 'basket') { o += rect(X(xa + 1.5), Y(it.y + it.h), (w - 3) * 10 * sc, it.h * 10 * sc, 'h'); lines.push([it.y + it.h / 2, `Корзина h=${mm(it.h)}`]); }
    else if (it.type === 'hook') { o += rect(X(xa + .2), Y(it.y + 4), (w - .4) * 10 * sc, 40 * sc, 'o', '#fff'); lines.push([it.y + 2, 'Планка с крючками']); }
    else if (it.type === 'led') { o += line(X(xa + .5), Y(it.y), X(xb - .5), Y(it.y), 'c'); lines.push([it.y, 'LED-подсветка']); }
    else if (it.type === 'vpanel') { o += rect(X(xa + it.x), Y(it.y1), T * 10 * sc, (it.y1 - it.y) * 10 * sc, 'o', 'url(#h1)'); lines.push([(it.y + it.y1) / 2, `Вертикальная панель ${mm(it.y1 - it.y)}×${mm(S.D - 2.5)}`]); }
  });
  // выноски справа
  const xr = X(c.xb + T) + 20; lines.sort((p, q) => q[0] - p[0]);
  let lastY = -1e9;
  lines.forEach(([yv, tx]) => { let ty = Math.max(Y(yv), lastY + 14); lastY = ty; o += line(X(c.xb), Y(yv), xr, ty, 't') + text(xr + 4, ty + 3, tx, 7.5, 'start'); });
  // цепочка размеров слева: расстояние от пола до низа каждого предмета и просветы между ними
  const levels = [S.plinth + T]; items.forEach(it => { if (it.type === 'led') return; const [a, b] = ext(it, S); levels.push(a, b); });
  levels.push(g.y1); const uniq = Array.from(new Set(levels.map(v => r1(v)))).sort((a, b) => a - b);
  for (let k = 0; k < uniq.length - 1; k++) { const a = uniq[k], b = uniq[k + 1]; if (b - a < 2.2) continue; o += dimV(Y(b), Y(a), X(c.xa - T), X(c.xa - T) - 30, mm(b - a)); }
  o += dimV(Y(S.H), Y(0), X(c.xa - T), X(c.xa - T) - 74, mm(S.H));
  o += dimH(X(c.xa), X(c.xb), Y(S.H), Y(S.H) - 26, mm(c.w)) + dimH(X(c.xa - T), X(c.xb + T), Y(S.H), Y(S.H) - 54, mm(c.w + 2 * T));
  o += text(X(c.xa + c.w / 2), Y(0) + 38, 'ОТСЕК ' + (ci + 1) + ' · ВНУТРЕННИЕ РАЗМЕРЫ И ПРОСВЕТЫ (мм)', 10, 'middle', 'font-weight="700"') + text(1100, 60, `М 1:${niceScale(sc)}`, 12, 'end', 'font-weight="700"');
  void fake; void gg;
  const rows = meta(S, bp).slice(0, 3).concat([['Отсек', `№${ci + 1} · ширина ${mm(c.w)} мм`], ['Наполнение', col.items.length + ' поз.'], ['Дата', new Date().toLocaleDateString('ru-RU')]]);
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
  const dr = S.cols.flatMap(cl => cl.items).find(i => i.type === 'drawers'), fh = dr ? dr.fh : 18;
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
  const out = [], rowsPerPage = 31;
  // детали
  const groups = []; let last = null; bp.parts.forEach(p => { if (p.grp !== last) { groups.push({ h: p.grp }); last = p.grp; } groups.push(p); });
  let page = 0, idx = 0, n = 0;
  while (idx < groups.length) {
    let o = text(60, 62, 'СПЕЦИФИКАЦИЯ ДЕТАЛЕЙ (раскрой)', 10, 'start', 'font-weight="700"');
    const cols = [60, 100, 400, 460, 540, 620, 690, 880, 980], head = ['№', 'Деталь', 'Кол', 'Длина', 'Шир.', 'Толщ.', 'Материал', 'Кромка м', 'Примечание'];
    head.forEach((h, i) => o += text(cols[i] + 2, 90, h, 7.6, 'start', 'font-weight="700"')); o += line(54, 96, 1150, 96, 'o');
    let y = 112, k = 0;
    while (idx < groups.length && k < rowsPerPage) {
      const r = groups[idx++]; k++;
      if (r.h) { o += rect(54, y - 11, 1096, 15, 't', '#eef3f6') + text(60, y, r.h.toUpperCase(), 7.6, 'start', 'font-weight="700"'); y += 16; continue; }
      n++; [n, r.name, r.qty, r.L, r.W, r.t, r.mat, r.edgeM || '', r.note].forEach((v, i) => o += text(cols[i] + 2, y, String(v), 7.2, 'start'));
      o += line(54, y + 4, 1150, y + 4, 't'); y += 16;
    }
    out.push(sheet(o, meta(S, bp).slice(0, 2).concat([['Таблица', 'Детали, лист ' + (++page)], ['Всего деталей', bp.parts.reduce((a, p) => a + p.qty, 0) + ' шт.'], ['ЛДСП', pr.dspM2.toFixed(2) + ' м²'], ['Дата', new Date().toLocaleDateString('ru-RU')]]), startNo + out.length, total));
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
  S.cols.forEach((c, i) => sheets.push(sheetColumn(S, bp, i, no++, total)));
  sheets.push(sheetDetails(S, bp, no++, total));
  const tbl = tableSheets(S, bp, pr, no, total);
  tbl.forEach(t => sheets.push(t));
  return { sheets: sheets.map(x => x.split('__T__').join(String(sheets.length))), bp, pr };
}
