/* Конструктор шкафа PRO: модель, геометрия, список деталей, цена. Без DOM — можно проверять в node. Размеры в см. */

export const P = {
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
export const FILLS = { dsp: 'ЛДСП', glass: 'Стекло в алюминиевой раме', mirror: 'Зеркало', laco: 'Лакобель (цветное стекло)', film: 'Зеркало с плёнкой', sand: 'Зеркало с рисунком' };
export const ITEM_TYPES = {
  shelf: 'Полка', rod: 'Штанга', drawer: 'Ящик', idoor: 'Дверца в отсеке', shoe: 'Обувные полки', pant: 'Брючница', basket: 'Корзина', hook: 'Крючки', led: 'Подсветка', vpanel: 'Вертикальная панель'
};
export const ITEM_ICON = { shelf: '▬', rod: '⎯', drawer: '▤', idoor: '🚪', shoe: '👟', pant: '⇋', basket: '🧺', hook: '⌒', led: '💡', vpanel: '▮' };

let seq = 1;
export const uid = () => 'i' + (seq++) + Math.random().toString(36).slice(2, 5);
export const r1 = v => Math.round(v * 10) / 10;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---- состояние ---- */
export function mkItem(type, y, extra) {
  const b = { id: uid(), type, y: r1(y) };
  if (type === 'shelf') b.d = null;                         // глубина: null — стандартная (D − 2,5)
  if (type === 'drawer') Object.assign(b, { fh: 18, sys: 'tier' });
  if (type === 'idoor') Object.assign(b, { y1: r1(y + 60), x: 0, w: null, dir: 'L' });
  if (type === 'shoe') Object.assign(b, { n: 3 });
  if (type === 'basket') Object.assign(b, { h: 18 });
  if (type === 'vpanel') Object.assign(b, { y1: r1(y + 60), x: 0 });
  return Object.assign(b, extra || {});
}
export function defState() {
  const S = { v: 2, W: 240, H: 200, D: 60, t: 1.6, plinth: 8, tier: 1, color: 0, custom: null, cols: [], mezzes: [], panels: [],
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
export function mkPanel(x, y, w, h) { return { id: uid(), x: r1(x), y: r1(y), w: r1(w), h: r1(h), kind: 'mirror', mount: 'wall', frame: false, fw: 3 }; }
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
export function recalcW(S) { S.W = r1(S.t * (S.cols.length + 1) + S.cols.reduce((a, c) => a + c.w, 0)); }

/* ---- геометрия ---- */
export function geom(S) {
  const t = S.t; let x = t;
  const cols = S.cols.map(c => { const a = { xa: x, xb: x + c.w, w: c.w, gap: !!c.gap }; x += c.w + t; return a; });
  const n = cols.length, bnd = [];
  for (let k = 0; k <= n; k++) { const L = cols[k - 1], R = cols[k]; bnd.push({ k, x: k === 0 ? 0 : cols[k - 1].xb, has: !!((L && !L.gap) || (R && !R.gap)) }); }
  const runs = []; let cur = null;
  cols.forEach((c, i) => { if (c.gap) { if (cur) { runs.push(cur); cur = null; } } else { if (!cur) cur = { a: i, b: i, x0: bnd[i].x, x1: 0 }; cur.b = i; cur.x1 = bnd[i + 1].x + t; } });
  if (cur) runs.push(cur);
  const compOf = m => { const ix0 = m.x + t, ix1 = m.x + m.w - t, dv = (m.div || []).map(v => clamp(v, 5, Math.max(5, m.w - 2 * t - t - 5))).sort((a, b) => a - b), comp = []; let a = ix0; dv.forEach(off => { comp.push({ x0: a, x1: ix0 + off }); a = ix0 + off + t; }); comp.push({ x0: a, x1: ix1 }); return { dv, comp }; };
  const mz = (S.mezzes || []).map((m, mi) => Object.assign(compOf(m), { id: m.id, mi, fill: m.fill, cd: m.cd, dir: m.dir, x: m.x, w: m.w, h: m.h, y: m.y, n: m.n, shelves: m.shelves, x0: m.x, x1: m.x + m.w, yb: m.y, yt: m.y + m.h, ix0: m.x + t, ix1: m.x + m.w - t, iy0: m.y + t, iy1: m.y + m.h - t }));
  const totalH = Math.max(S.H, ...mz.map(m => m.yt), ...(S.panels || []).map(p => p.y + p.h));
  return { t, y0: S.plinth + t, y1: S.H - t, cols, W: x, bnd, runs, mz, totalH, doorTop: S.H };
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
  const g = geom(S), L = [{ label: 'дно', top: g.y0, bot: g.y0 }];
  col.items.filter(i => i.type === 'shelf').sort((a, b) => a.y - b.y).forEach((sh, k) => L.push({ label: 'полка ' + (k + 1) + ' (' + Math.round(sh.y * 10) + ' мм)', top: r1(sh.y + S.t), bot: sh.y }));
  L.push({ label: 'верх', top: g.y1, bot: g.y1 });
  return L;
}
export function freeY(S, col, h) {   // первое свободное место высотой h в отсеке
  const g = geom(S), blocks = col.items.filter(i => BLOCK[i.type]).map(i => ext(i, S)).sort((a, b) => a[0] - b[0]);
  let y = g.y0;
  for (const b of blocks) { if (b[0] - y >= h) return r1(y); y = Math.max(y, b[1]); }
  return g.y1 - y >= h ? r1(y) : null;
}
export function warnings(S) {
  const g = geom(S), out = [];
  S.cols.forEach((c, ci) => {
    if (c.gap) return;
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
  g.mz.forEach((m, mi) => {
    if (m.h < 20) out.push(`Антресоль ${mi + 1}: слишком низкая`);
    if (m.y < S.H - .5 && g.runs.some(r => m.x0 < r.x1 - .5 && m.x1 > r.x0 + .5 && m.yb < S.H - .5)) out.push(`Антресоль ${mi + 1}: заходит в корпус (низ антресоли должен быть не ниже ${Math.round(S.H * 10)} мм над отсеками)`);
    g.mz.forEach((o, oi) => { if (oi > mi && m.x0 < o.x1 - .5 && m.x1 > o.x0 + .5 && m.yb < o.yt - .5 && m.yt > o.yb + .5) out.push(`Антресоли ${mi + 1} и ${oi + 1} пересекаются`); });
  });
  return out;
}

/* ---- двери ---- */
export function doorList(S) {   // [{zone:'main'|'mezz', i, x, w, h, y, fill, left, hinge:'L'|'R'|'U'|'D', n, sliding}]
  const g = geom(S), d = S.doors, out = [], t = S.t;
  if (d.kind !== 'none' && g.runs.length) {
    const hh = S.H - S.plinth - .4, tot = g.runs.reduce((a, r) => a + (r.x1 - r.x0), 0), sliding = d.kind === 'sliding' && g.runs.length === 1; let idx = 0;
    g.runs.forEach(r => {
      const rw = r.x1 - r.x0, n = sliding ? d.n : Math.max(1, Math.round(d.n * rw / tot));
      if (sliding) { const w = (rw + (n - 1) * 2.5) / n; for (let i = 0; i < n; i++) { out.push({ zone: 'main', i: idx, ri: i, n, x: r.x0 + i * (w - 2.5), w, h: hh, y: S.plinth + .2, fill: d.fills[idx] || 'dsp', sliding: true, left: i < n / 2, hinge: 'L', gf: d.gf || 4 }); idx++; } }
      else void 0;
    });
    if (!sliding) {   // распашные: у каждого отсека свои двери (0, 1 или 2), своё заполнение и открывание
      let k = 0;
      g.cols.forEach((c, ci) => {
        if (c.gap) return; const col = S.cols[ci], L = ci === 0 || g.cols[ci - 1].gap ? c.xa - t : c.xa - t / 2, R = ci === g.cols.length - 1 || g.cols[ci + 1].gap ? c.xb + t : c.xb + t / 2, cw = R - L;
        const n = col.dn != null ? col.dn : (c.w > 65 ? 2 : 1), fill = col.df || 'dsp', dr = col.dd || 'auto';
        for (let i = 0; i < n; i++) { const hinge = dr === 'auto' ? (n === 1 ? 'L' : (i < n / 2 ? 'L' : 'R')) : dr; out.push({ zone: 'main', i: k++, ci, ri: i, n, x: L + i * (cw / n) + .15, w: cw / n - .3, h: hh, y: S.plinth + .2, fill, sliding: false, left: hinge === 'L', hinge, gf: d.gf || 4 }); }
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
    if (edgeEach > 0) desc = Math.abs(e - 2 * (L + Wd)) < .6 ? 'по периметру (4 стороны)' : Math.abs(e - lg) < .6 ? '1 длинная сторона' : Math.abs(e - sh) < .6 ? '1 короткая сторона' : Math.abs(e - lg - sh) < .6 ? '2 стороны (длинная + короткая)' : Math.round(e) / 100 + ' м на деталь';
    parts.push({ grp, name, qty, L: mm(lg), W: mm(sh), t: mm(tt), mat, kind: kind || 'dsp', edgeM: Math.round(edgeEach * qty * 100) / 100, edgeT: edgeEach > 0 ? (facade ? '2' : '0,4') : '', edgeDesc: desc, note: note || '' });
  };
  const addHw = (grp, name, qty, unit, price, note) => { qty = Math.round(qty * 100) / 100; if (qty > 0) hw.push({ grp, name, qty, unit: unit || 'шт.', price: Math.round(price || 0), note: note || '' }); };
  const bd = D - .3, ph = S.plinth, hs = H - ph;
  let joints = 8, feet = 0, hinges0 = 0, handles0 = 0;
  g.runs.forEach((r, ri) => {
    const rw = r.x1 - r.x0, k = r.b - r.a + 1, lbl = g.runs.length > 1 ? ' (секция ' + (ri + 1) + ')' : '';
    add('Корпус', 'Дно' + lbl, 1, rw, D, t, body, rw / 100, 'на всю ширину: боковины и спинка стоят на дне');
    add('Корпус', 'Боковина' + lbl, 2, hs - t, D, t, body, (hs - t) / 100, 'стоит на дне; кромка по переднему торцу');
    add('Корпус', 'Крышка (верх)' + lbl, 1, rw - 2 * t, D, t, body, (rw - 2 * t) / 100, 'между боковинами');
    if (k > 1) add('Корпус', 'Перегородка отсека' + lbl, k - 1, hs - 2 * t, D, t, body, (hs - 2 * t) / 100, 'стоит на дне, под крышкой');
    add('Корпус', 'Задняя стенка' + lbl, 1, rw - 2 * t, hs - 2 * t, .3, 'ХДФ 3 мм', 0, 'ставится на дно между боковин', 'hdf');
    add('Корпус', 'Цоколь' + lbl, 1, rw - 2 * t, ph, t, body, (rw - 2 * t) / 100, 'кромка по верхней длинной стороне');
    joints += k * 8 + 8; feet += Math.max(2, Math.ceil(rw / 60) * 2);
  });
  g.mz.forEach((m, mi) => {
    const lbl = ' (антресоль ' + (mi + 1) + ')', gr = 'Антресоль ' + (mi + 1);
    add(gr, 'Дно' + lbl, 1, m.w, D, t, body, m.w / 100, 'на всю ширину; боковины стоят на дне');
    add(gr, 'Боковина' + lbl, 2, m.h - t, D, t, body, (m.h - t) / 100, 'стоит на дне');
    add(gr, 'Крышка' + lbl, 1, m.w - 2 * t, D, t, body, (m.w - 2 * t) / 100, 'между боковинами');
    if (m.dv.length) add(gr, 'Перегородка' + lbl, m.dv.length, m.h - 2 * t, D, t, body, (m.h - 2 * t) / 100, 'вертикальная, стоит на дне');
    add(gr, 'Задняя стенка' + lbl, 1, m.w - 2 * t, m.h - 2 * t, .3, 'ХДФ 3 мм', 0, 'ставится на дно между боковин', 'hdf');
    m.comp.forEach((c, ci) => { for (let k = 0; k < (m.shelves | 0); k++) add(gr, 'Полка' + lbl + (m.comp.length > 1 ? ' отд. ' + (ci + 1) : ''), 1, c.x1 - c.x0 - .2, D - 2.5, t, body, (c.x1 - c.x0 - .2) / 100, 'на 4 полкодержателя'); });
    joints += 16 + (m.shelves | 0) * 4 + m.dv.length * 8;
  });
  (S.panels || []).forEach((p, i) => {
    const th = p.kind === 'dsp' ? t : .6, mat = p.kind === 'dsp' ? body : FILLS[p.kind] + ', 6 мм';
    add('Панели', 'Панель ' + (i + 1) + ' (' + (p.mount === 'front' ? 'на фасад' : 'на стену') + ')', 1, p.h, p.w, th, mat, (2 * (p.h + p.w)) / 100, 'размер ' + mm(p.w) + '×' + mm(p.h), p.kind);
    if (p.frame) add('Панели', 'Рамка панели ' + (i + 1), 1, p.h, p.w, p.fw || 3, 'Алюминий, профиль ' + mm(p.fw || 3) + ' мм', (2 * (p.h + p.w)) / 100, 'периметр', 'frame');
  });
  addHw('Крепёж', 'Крепёж зеркальных / стеклянных панелей (подвесы, клей)', (S.panels || []).length, 'шт.', 35000);
  addHw('Крепёж', 'Конфирмат 7×50', joints, 'шт.', 600);
  addHw('Крепёж', 'Опора-ножка цоколя', feet, 'шт.', 6000);
  addHw('Крепёж', 'Уголок крепления к стене', 4 * Math.max(1, g.runs.length) + 2 * g.mz.length, 'шт.', 3000);
  let rods = 0, hooks = 0, ledM = 0, basket = 0, pant = 0, pins = g.mz.reduce((a, m) => a + (m.shelves | 0) * 4 * m.comp.length, 0), lifts = 0, lowers = 0; const drw = {};
  S.cols.forEach((c, ci) => {
    if (c.gap) return;
    const lbl = ' (отсек ' + (ci + 1) + ')';
    c.items.forEach(it => {
      if (it.type === 'shelf') { const d = it.d || D - 2.5; add('Наполнение', 'Полка' + lbl, 1, c.w - .2, d, t, body, (c.w - .2) / 100, 'на 4 полкодержателя'); pins += 4; }
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
  let dspM2 = 0, hdfM2 = 0, frameM = 0, glass = {};
  bp.parts.forEach(p => {
    const a = p.L * p.W * p.qty / 1e6;
    if (p.kind === 'frame') { frameM += p.edgeM; return; }
    if (p.kind === 'dsp') dspM2 += a; else if (p.kind === 'hdf') hdfM2 += a; else if (p.kind !== 'metal') glass[p.kind] = (glass[p.kind] || 0) + a;
  });
  const add = (n, q, c) => { if (c > 0) lines.push({ n, q, c: Math.round(c) }); };
  add('ЛДСП с распилом и кромкой', Math.round(dspM2 * 100) / 100 + ' м²', dspM2 * pm);
  add('Задняя стенка ХДФ', Math.round(hdfM2 * 100) / 100 + ' м²', hdfM2 * P.hdfM2);
  Object.keys(glass).forEach(k => add(k === 'glass' ? 'Стекло дверей' : (FILLS[k] || k), Math.round(glass[k] * 100) / 100 + ' м²', glass[k] * P.glass[k]));
  add('Алюминиевая рамка дверей', Math.round(frameM * 10) / 10 + ' м', frameM * P.frameM);
  bp.hw.forEach(h => add(h.name, h.qty + ' ' + h.unit, h.qty * h.price));
  const mat = lines.reduce((a, l) => a + l.c, 0), front = bp.g.W / 100 * bp.g.totalH / 100, labor = front * P.laborM2 * P.Klabor;
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
  const o = { v: 2, W: n(S.W, 60, 800, 240), H: n(S.H, 100, 320, 200), D: n(S.D, 25, 90, 60), t: S.t === 1.8 ? 1.8 : 1.6, plinth: n(S.plinth, 0, 20, 8), tier: n(S.tier, 0, 2, 1) | 0, color: n(S.color, 0, 99, 0) | 0, custom: /^#[0-9a-f]{6}$/i.test(S.custom || '') ? S.custom : null,
    mezzes: [],
    doors: { kind: ['none', 'swing', 'sliding'].includes(S.doors && S.doors.kind) ? S.doors.kind : 'none', n: n(S.doors && S.doors.n, 1, 8, 3) | 0, fills: (S.doors && Array.isArray(S.doors.fills) ? S.doors.fills : D.doors.fills).map(f => FILLS[f] ? f : 'dsp').slice(0, 8), laco: n(S.doors && S.doors.laco, 0, 5, 0) | 0, handles: !(S.doors && S.doors.handles === false), gf: n(S.doors && S.doors.gf, 2, 30, 4), dir: (S.doors && Array.isArray(S.doors.dir) ? S.doors.dir : []).slice(0, 8).map(v => ['auto', 'L', 'R', 'U', 'D'].includes(v) ? v : 'auto') },
    led: !!S.led, name: String(S.name || 'Мой шкаф').slice(0, 60), cols: [] };
  while (o.doors.fills.length < 8) o.doors.fills.push('dsp');
  S.cols.slice(0, 14).forEach(c => {
    const col = { id: uid(), w: n(c && c.w, 15, 250, 60), items: [] };
    if (c && c.gap) col.gap = true;
    if (c && c.dn != null) col.dn = n(c.dn, 0, 3, 1) | 0;
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
      if (it.type === 'vpanel') { b.y1 = n(it.y1, 0, 330, b.y + 60); b.x = n(it.x, 0, 200, 0); }
      col.items.push(b);
    });
    o.cols.push(col);
  });
  if (!o.cols.some(c => !c.gap)) o.cols[0].gap = false;
  o.panels = (Array.isArray(S.panels) ? S.panels : []).slice(0, 8).map(p => ({ id: uid(), x: r1(n(p && p.x, -300, 1200, 0)), y: r1(n(p && p.y, 0, 340, 20)), w: r1(n(p && p.w, 10, 400, 60)), h: r1(n(p && p.h, 10, 340, 180)), kind: ['mirror', 'film', 'sand', 'glass', 'laco', 'dsp'].includes(p && p.kind) ? p.kind : 'mirror', mount: p && p.mount === 'front' ? 'front' : 'wall', frame: !!(p && p.frame), fw: r1(n(p && p.fw, 1, 15, 3)) }));
  recalcW(o);
  if (Array.isArray(S.mezzes)) S.mezzes.slice(0, 8).forEach(m => { if (m) o.mezzes.push({ id: uid(), x: r1(n(m.x, -100, 900, 0)), w: r1(n(m.w, 20, 900, 60)), h: r1(n(m.h, 15, 120, 40)), y: r1(n(m.y, 0, 340, o.H)), n: n(m.n, 0, 10, 2) | 0, shelves: n(m.shelves, 0, 3, 0) | 0, fill: FILLS[m.fill] ? m.fill : 'dsp', div: (Array.isArray(m.div) ? m.div : []).slice(0, 7).map(v => r1(n(v, 5, 800, 30))), cd: (Array.isArray(m.cd) ? m.cd : []).slice(0, 8).map(v => v == null ? null : n(v, 0, 5, 1) | 0), dir: (Array.isArray(m.dir) ? m.dir : []).slice(0, 8).map(v => ['swing', 'U', 'D'].includes(v) ? v : 'swing') }); });
  else if (S.mezz && S.mezz.on) {   // старый формат: одна антресоль сверху на всю ширину
    const mh = n(S.mezz.h, 15, 90, 40); o.H = r1(Math.max(100, o.H - mh - o.t)); o.mezzes.push({ id: uid(), x: 0, w: o.W, h: r1(mh + o.t), y: o.H, n: n(S.mezz.n, 0, 10, 3) | 0, shelves: n(S.mezz.shelves, 0, 3, 0) | 0 });
  }
  return o;
}
