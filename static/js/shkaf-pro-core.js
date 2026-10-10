/* Конструктор шкафа PRO: модель, геометрия, список деталей, цена. Без DOM — можно проверять в node. Размеры в см. */

export const P = {
  K: 1.55, Klabor: 1.25, laborM2: 260000, delivery: 250000,
  sheetArea: 2.75 * 1.83, waste: 1.15, cutM2: 7950, edgeM: 2500, hdfM2: 42000,
  glass: { mirror: 190000, film: 235000, laco: 420000, sand: 330000 },
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
export const FILLS = { dsp: 'ЛДСП', mirror: 'Зеркало', laco: 'Лакобель (цветное стекло)', film: 'Зеркало с плёнкой', sand: 'Зеркало с рисунком' };
export const ITEM_TYPES = {
  shelf: 'Полка', rod: 'Штанга', drawers: 'Ящики', shoe: 'Обувные полки', pant: 'Брючница', basket: 'Корзина', hook: 'Крючки', led: 'Подсветка', vpanel: 'Вертикальная панель'
};
export const ITEM_ICON = { shelf: '▬', rod: '⎯', drawers: '▤', shoe: '👟', pant: '⇋', basket: '🧺', hook: '⌒', led: '💡', vpanel: '▮' };

let seq = 1;
export const uid = () => 'i' + (seq++) + Math.random().toString(36).slice(2, 5);
export const r1 = v => Math.round(v * 10) / 10;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---- состояние ---- */
export function mkItem(type, y, extra) {
  const b = { id: uid(), type, y: r1(y) };
  if (type === 'shelf') b.d = null;                         // глубина: null — стандартная (D − 2,5)
  if (type === 'drawers') Object.assign(b, { n: 3, fh: 18, sys: 'tier' });
  if (type === 'shoe') Object.assign(b, { n: 3 });
  if (type === 'basket') Object.assign(b, { h: 18 });
  if (type === 'vpanel') Object.assign(b, { y1: r1(y + 60), x: 0 });
  return Object.assign(b, extra || {});
}
export function defState() {
  const S = { v: 1, W: 240, H: 240, D: 60, t: 1.6, plinth: 8, tier: 1, color: 0, custom: null, cols: [], mezz: { on: true, h: 40, n: 3, shelves: 0 },
    doors: { kind: 'none', n: 3, fills: ['dsp', 'mirror', 'dsp', 'mirror', 'dsp', 'mirror'], laco: 0, handles: true }, led: false, name: 'Мой шкаф' };
  S.cols = [
    { id: uid(), w: 78, items: [mkItem('rod', 185), mkItem('shelf', 193), mkItem('shelf', 40), mkItem('shelf', 100)] },
    { id: uid(), w: 78, items: [mkItem('shelf', 68), mkItem('shelf', 105), mkItem('shelf', 142), mkItem('shelf', 180), mkItem('drawers', 9.6, { n: 3 })] },
    { id: uid(), w: 78, items: [mkItem('rod', 185), mkItem('rod', 115), mkItem('shelf', 193)] }
  ];
  fitWidth(S, 240);
  return S;
}
export function fitWidth(S, W) {
  const n = S.cols.length, inner = W - (n + 1) * S.t, w = r1(Math.max(15, inner / n));
  S.cols.forEach(c => { c.w = w; });
  const sum = S.cols.reduce((a, c) => a + c.w, 0);
  S.cols[n - 1].w = r1(S.cols[n - 1].w + (inner - sum));
  S.W = r1(S.t * (n + 1) + S.cols.reduce((a, c) => a + c.w, 0));
}
export function recalcW(S) { S.W = r1(S.t * (S.cols.length + 1) + S.cols.reduce((a, c) => a + c.w, 0)); }

/* ---- геометрия ---- */
export function geom(S) {
  const t = S.t, mh = S.mezz.on ? S.mezz.h : 0;
  const yMF = S.mezz.on ? S.H - t - mh - t : null;            // низ полки-пола антресоли
  const y0 = S.plinth + t, y1 = S.mezz.on ? yMF : S.H - t;     // рабочая зона шкафа
  let x = t; const cols = S.cols.map(c => { const a = { xa: x, xb: x + c.w, w: c.w }; x += c.w + t; return a; });
  return { t, y0, y1, yMF, my0: S.mezz.on ? yMF + t : null, my1: S.mezz.on ? S.H - t : null, cols, W: x, mh, doorTop: S.mezz.on ? yMF + t : S.H };
}
export function ext(it, S) {   // вертикальный размах предмета [низ, верх]
  const t = S.t;
  switch (it.type) {
    case 'shelf': return [it.y, it.y + t];
    case 'rod': return [it.y - 1.25, it.y + 1.25];
    case 'drawers': return [it.y, it.y + it.n * it.fh];
    case 'shoe': return [it.y, it.y + it.n * 12];
    case 'pant': return [it.y, it.y + 10];
    case 'basket': return [it.y, it.y + it.h];
    case 'hook': return [it.y, it.y + 3];
    case 'led': return [it.y, it.y + 1];
    case 'vpanel': return [it.y, it.y1];
  }
  return [it.y, it.y];
}
const BLOCK = { drawers: 1, shoe: 1, pant: 1, basket: 1 };
export function freeY(S, col, h) {   // первое свободное место высотой h в отсеке
  const g = geom(S), blocks = col.items.filter(i => BLOCK[i.type]).map(i => ext(i, S)).sort((a, b) => a[0] - b[0]);
  let y = g.y0;
  for (const b of blocks) { if (b[0] - y >= h) return r1(y); y = Math.max(y, b[1]); }
  return g.y1 - y >= h ? r1(y) : null;
}
export function warnings(S) {
  const g = geom(S), out = [];
  S.cols.forEach((c, ci) => {
    const label = 'Отсек ' + (ci + 1);
    c.items.forEach(it => {
      const [a, b] = ext(it, S);
      if (a < g.y0 - .01 || b > g.y1 + .01) out.push(`${label}: «${ITEM_TYPES[it.type]}» выходит за пределы отсека`);
    });
    const bl = c.items.filter(i => BLOCK[i.type]);
    for (let i = 0; i < bl.length; i++) for (let j = i + 1; j < bl.length; j++) { const A = ext(bl[i], S), B = ext(bl[j], S); if (A[0] < B[1] - .01 && B[0] < A[1] - .01) out.push(`${label}: «${ITEM_TYPES[bl[i].type]}» и «${ITEM_TYPES[bl[j].type]}» пересекаются`); }
    c.items.filter(i => i.type === 'shelf').forEach(sh => bl.forEach(b => { const B = ext(b, S); if (sh.y > B[0] + .5 && sh.y < B[1] - .5) out.push(`${label}: полка пересекает «${ITEM_TYPES[b.type]}»`); }));
    c.items.filter(i => i.type === 'rod').forEach(r => { if (c.items.some(i => i.type === 'shelf' && i.y > r.y && i.y - r.y < 6)) out.push(`${label}: штанга слишком близко к полке над ней (нужно от 6 см)`); });
    if (c.w < 20) out.push(`${label}: слишком узкий отсек`);
  });
  if (S.mezz.on && S.mezz.h < 20) out.push('Антресоль слишком низкая');
  return out;
}

/* ---- двери ---- */
export function doorList(S) {   // [{zone:'main'|'mezz', i, x, w, h, y, fill}]
  const g = geom(S), d = S.doors, out = [], W = g.W;
  if (d.kind !== 'none') {
    const n = d.n, h = g.doorTop - S.plinth - .4;
    if (d.kind === 'swing') { const w = W / n - .3; for (let i = 0; i < n; i++) out.push({ zone: 'main', i, x: i * (W / n) + .15, w, h, y: S.plinth + .2, fill: d.fills[i] || 'dsp' }); }
    else { const w = (W + (n - 1) * 2.5) / n; for (let i = 0; i < n; i++) out.push({ zone: 'main', i, x: i * (w - 2.5), w, h, y: S.plinth + .2, fill: d.fills[i] || 'dsp' }); }
  }
  if (S.mezz.on && S.mezz.n > 0) {
    const n = S.mezz.n, w = W / n - .3, y = g.doorTop + .1, h = S.H - y - .1;
    for (let i = 0; i < n; i++) out.push({ zone: 'mezz', i, x: i * (W / n) + .15, w, h, y, fill: 'dsp' });
  }
  return out;
}

/* ---- список деталей и фурнитуры + цена ---- */
export function buildParts(S) {
  const g = geom(S), t = S.t, W = g.W, H = S.H, D = S.D, mm = v => Math.round(v * 10), T = P.tiers[S.tier];
  const parts = [], hw = [];
  const body = 'ЛДСП ' + mm(t) + ' мм';
  const add = (grp, name, qty, L, Wd, tt, mat, edgeEach, note, kind) => parts.push({ grp, name, qty, L: mm(Math.max(L, Wd)), W: mm(Math.min(L, Wd)), t: mm(tt), mat, kind: kind || 'dsp', edgeM: Math.round(edgeEach * qty * 100) / 100, note: note || '' });
  const addHw = (grp, name, qty, unit, price, note) => { qty = Math.round(qty * 100) / 100; if (qty > 0) hw.push({ grp, name, qty, unit: unit || 'шт.', price: Math.round(price || 0), note: note || '' }); };
  const bd = D - .3, ph = S.plinth, hs = H - ph;
  add('Корпус', 'Боковина', 2, hs, bd, t, body, hs / 100, 'кромка по переднему торцу');
  add('Корпус', 'Крышка (верх)', 1, W - 2 * t, bd, t, body, (W - 2 * t) / 100);
  add('Корпус', 'Дно', 1, W - 2 * t, bd, t, body, (W - 2 * t) / 100);
  const hm = g.y1 - g.y0;
  if (S.cols.length > 1) add('Корпус', 'Перегородка отсека', S.cols.length - 1, hm, bd, t, body, hm / 100, 'до пола антресоли / крышки');
  if (S.mezz.on) {
    add('Антресоль', 'Пол антресоли', 1, W - 2 * t, bd, t, body, (W - 2 * t) / 100);
    if (S.cols.length > 1) add('Антресоль', 'Перегородка антресоли', S.cols.length - 1, S.mezz.h, bd, t, body, S.mezz.h / 100);
    S.cols.forEach((c, i) => { for (let k = 0; k < (S.mezz.shelves | 0); k++) add('Антресоль', 'Полка антресоли (отсек ' + (i + 1) + ')', 1, c.w - .2, D - 2.5, t, body, (c.w - .2) / 100, 'на 4 полкодержателя'); });
  }
  add('Корпус', 'Задняя стенка', 1, W - .4, hs - .4, .3, 'ХДФ 3 мм', 0, 'в паз / на скобу', 'hdf');
  add('Корпус', 'Цоколь', 1, W - 2 * t, ph, t, body, (W - 2 * t) / 100);
  const joints = S.cols.length * 8 + 16 + (S.mezz.on ? 8 : 0);
  addHw('Крепёж', 'Конфирмат 7×50', joints, 'шт.', 600);
  addHw('Крепёж', 'Опора-ножка цоколя', Math.max(4, Math.ceil(W / 60) * 2), 'шт.', 6000);
  addHw('Крепёж', 'Уголок крепления к стене', 4, 'шт.', 3000);
  let rods = 0, hooks = 0, ledM = 0, basket = 0, pant = 0, pins = 0; const drw = {};
  S.cols.forEach((c, ci) => {
    const lbl = ' (отсек ' + (ci + 1) + ')';
    c.items.forEach(it => {
      if (it.type === 'shelf') { const d = it.d || D - 2.5; add('Наполнение', 'Полка' + lbl, 1, c.w - .2, d, t, body, (c.w - .2) / 100, 'на 4 полкодержателя'); pins += 4; }
      else if (it.type === 'rod') { rods++; add('Наполнение', 'Штанга ⌀25' + lbl, 1, c.w - .6, 2.5, 2.5, 'Хром, труба 25×15', 0, 'длина ' + mm(c.w - .6) + ' мм', 'metal'); }
      else if (it.type === 'drawers') {
        const bw = c.w - .4;
        for (let k = 0; k < it.n; k++) {
          add('Ящики', 'Фасад ящика' + lbl, 1, bw, it.fh - .3, t, body, (2 * (bw + it.fh)) / 100);
          if (it.sys === 'tier') { add('Ящики', 'Боковина ящика' + lbl, 2, D - 8, Math.max(8, it.fh - 6), t, body, 0); add('Ящики', 'Задняя ящика' + lbl, 1, bw - 5.4, Math.max(8, it.fh - 6), t, body, 0); add('Ящики', 'Дно ящика' + lbl, 1, bw - 3.6, D - 9, .3, 'ХДФ 3 мм', 0, '', 'hdf'); }
        }
        drw[it.sys] = (drw[it.sys] || 0) + it.n;
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
  // двери
  const doors = doorList(S); let hinges = 0, handles = 0;
  doors.forEach(d => {
    const lbl = d.zone === 'mezz' ? ' антресоли' : '';
    const kind = d.fill === 'dsp' ? 'dsp' : d.fill;
    const mat = d.fill === 'dsp' ? body : FILLS[d.fill];
    if (d.fill === 'dsp') add('Двери', 'Дверь' + lbl + ' ' + (d.i + 1), 1, d.h, d.w, t, mat, (2 * (d.h + d.w)) / 100, S.doors.kind === 'sliding' && d.zone === 'main' ? 'в раме системы' : '');
    else add('Двери', 'Вставка / дверь' + lbl + ' ' + (d.i + 1), 1, d.h, d.w, .4, mat, (2 * (d.h + d.w)) / 100, 'полировка кромки', kind);
    if (S.doors.kind === 'swing' || d.zone === 'mezz') { hinges += d.h <= 90 ? 2 : d.h <= 160 ? 3 : d.h <= 220 ? 4 : 5; if (S.doors.handles !== false) handles++; }
  });
  addHw('Двери', 'Петля с доводчиком', hinges, 'шт.', T.hinge);
  addHw('Двери', 'Ручка', handles, 'шт.', T.handle);
  if (S.doors.kind === 'sliding') {
    const n = S.doors.n; let kit = T.doorKit * Math.pow(n / 3, .9);
    if (g.W > 270) kit += (g.W / 100 - 2.7) * 2 * T.rail;
    addHw('Двери', 'Система купе (направляющие, ролики, профили) на ' + n + ' двери', 1, 'комплект', kit);
  }
  return { parts, hw, doors, g };
}

export function pricing(S, bp) {
  bp = bp || buildParts(S);
  const T = P.tiers[S.tier], pm = T.sheet / P.sheetArea * P.waste + P.cutM2 + 3 * P.edgeM, lines = [];
  let dspM2 = 0, hdfM2 = 0, glass = {};
  bp.parts.forEach(p => {
    const a = p.L * p.W * p.qty / 1e6;
    if (p.kind === 'dsp') dspM2 += a; else if (p.kind === 'hdf') hdfM2 += a; else if (p.kind !== 'metal') glass[p.kind] = (glass[p.kind] || 0) + a;
  });
  const add = (n, q, c) => { if (c > 0) lines.push({ n, q, c: Math.round(c) }); };
  add('ЛДСП с распилом и кромкой', Math.round(dspM2 * 100) / 100 + ' м²', dspM2 * pm);
  add('Задняя стенка ХДФ', Math.round(hdfM2 * 100) / 100 + ' м²', hdfM2 * P.hdfM2);
  Object.keys(glass).forEach(k => add(FILLS[k] || k, Math.round(glass[k] * 100) / 100 + ' м²', glass[k] * P.glass[k]));
  bp.hw.forEach(h => add(h.name, h.qty + ' ' + h.unit, h.qty * h.price));
  const mat = lines.reduce((a, l) => a + l.c, 0), front = bp.g.W / 100 * S.H / 100, labor = front * P.laborM2 * P.Klabor;
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
  if (!S || typeof S !== 'object' || !Array.isArray(S.cols) || !S.cols.length) return null;
  const D = defState(), n = (v, a, b, d) => { v = Number(v); return isFinite(v) ? clamp(v, a, b) : d; };
  const o = { v: 1, W: n(S.W, 60, 800, 240), H: n(S.H, 100, 320, 240), D: n(S.D, 25, 90, 60), t: S.t === 1.8 ? 1.8 : 1.6, plinth: n(S.plinth, 0, 20, 8), tier: n(S.tier, 0, 2, 1) | 0, color: n(S.color, 0, 99, 0) | 0, custom: /^#[0-9a-f]{6}$/i.test(S.custom || '') ? S.custom : null,
    mezz: { on: !!(S.mezz && S.mezz.on), h: n(S.mezz && S.mezz.h, 15, 90, 40), n: n(S.mezz && S.mezz.n, 0, 8, 3) | 0, shelves: n(S.mezz && S.mezz.shelves, 0, 3, 0) | 0 },
    doors: { kind: ['none', 'swing', 'sliding'].includes(S.doors && S.doors.kind) ? S.doors.kind : 'none', n: n(S.doors && S.doors.n, 1, 8, 3) | 0, fills: (S.doors && Array.isArray(S.doors.fills) ? S.doors.fills : D.doors.fills).map(f => FILLS[f] ? f : 'dsp').slice(0, 8), laco: n(S.doors && S.doors.laco, 0, 5, 0) | 0, handles: !(S.doors && S.doors.handles === false) },
    led: !!S.led, name: String(S.name || 'Мой шкаф').slice(0, 60), cols: [] };
  while (o.doors.fills.length < 8) o.doors.fills.push('dsp');
  S.cols.slice(0, 12).forEach(c => {
    const col = { id: uid(), w: n(c && c.w, 15, 200, 60), items: [] };
    (c && Array.isArray(c.items) ? c.items : []).slice(0, 40).forEach(it => {
      if (!it || !ITEM_TYPES[it.type]) return;
      const b = mkItem(it.type, n(it.y, 0, 330, 50));
      if (it.type === 'shelf') b.d = it.d ? n(it.d, 15, 85, 57.5) : null;
      if (it.type === 'drawers') { b.n = n(it.n, 1, 8, 3) | 0; b.fh = n(it.fh, 8, 40, 18); b.sys = DRAWER_SYS[it.sys] ? it.sys : 'tier'; }
      if (it.type === 'shoe') b.n = n(it.n, 1, 6, 3) | 0;
      if (it.type === 'basket') b.h = n(it.h, 10, 40, 18);
      if (it.type === 'vpanel') { b.y1 = n(it.y1, 0, 330, b.y + 60); b.x = n(it.x, 0, 200, 0); }
      col.items.push(b);
    });
    o.cols.push(col);
  });
  recalcW(o);
  return o;
}
