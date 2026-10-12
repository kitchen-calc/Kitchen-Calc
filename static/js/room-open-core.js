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
  column: { ru: 'Колонна / выступ', icon: '▮', w: 40, h: 260, y: 0, d: 40 },
  apron: { ru: 'Фартук', icon: '🧱', w: 240, h: 60, y: 90, d: .6 },
  wpanel: { ru: 'Стеновая панель', icon: '▦', w: 120, h: 260, y: 0, d: 1.8 }
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
/* ---- фартук кухни и стеновые панели: элементы стены с видом, цветом, размерами и ценой за м² ----
   pat: grid | brick | mosaic | hex | diamond | herring | slab | flat | wood | brushed | ribbed | frame | wave | slats | soft | mirror
   tw, th — размер плитки / шага, см; price — сум за м² (с монтажом ориентировочно) */
export const OPEN_INFO = {
  apron: {
    kab_w: { ru: 'Плитка «кабанчик» белая', col: '#f3f3f1', pat: 'brick', tw: 15, th: 7.5, grout: '#cfcfca', gloss: .25, price: 380000 },
    kab_g: { ru: 'Плитка «кабанчик» серая', col: '#a9adb0', pat: 'brick', tw: 15, th: 7.5, grout: '#8f9396', gloss: .25, price: 380000 },
    kab_b: { ru: 'Плитка «кабанчик» чёрная', col: '#2c2e31', pat: 'brick', tw: 15, th: 7.5, grout: '#16171a', gloss: .25, price: 400000 },
    kab_gr: { ru: 'Плитка «кабанчик» зелёная', col: '#6f8f78', pat: 'brick', tw: 15, th: 7.5, grout: '#c9ccc4', gloss: .25, price: 420000 },
    sq10: { ru: 'Плитка 10×10 белая', col: '#f2f2ef', pat: 'grid', tw: 10, th: 10, grout: '#d4d4cf', gloss: .3, price: 330000 },
    sq20: { ru: 'Плитка 20×20 бежевая', col: '#d9cdb8', pat: 'grid', tw: 20, th: 20, grout: '#bfb49f', gloss: .35, price: 340000 },
    sq3060: { ru: 'Плитка 30×60 серая', col: '#b9bcbe', pat: 'grid', tw: 30, th: 60, grout: '#a0a3a5', gloss: .4, price: 420000 },
    mos_g: { ru: 'Мозаика стеклянная бирюзовая', col: '#4fa8a8', pat: 'mosaic', tw: 2.5, th: 2.5, grout: '#2f6a6a', gloss: .15, price: 950000 },
    mos_m: { ru: 'Мозаика мраморная серая', col: '#b5b2ad', pat: 'mosaic', tw: 2.5, th: 2.5, grout: '#8d8a85', gloss: .3, price: 900000 },
    mos_gold: { ru: 'Мозаика золотая', col: '#c9a14a', pat: 'mosaic', tw: 2.5, th: 2.5, grout: '#8a6a22', gloss: .1, metal: .6, price: 1200000 },
    hex: { ru: 'Плитка-соты (шестигранник)', col: '#f1f1ee', pat: 'hex', tw: 10, th: 10, grout: '#c9c9c4', gloss: .3, price: 560000 },
    rhomb: { ru: 'Плитка «ромб»', col: '#e8e4dc', pat: 'diamond', tw: 10, th: 10, grout: '#c5c0b6', gloss: .3, price: 520000 },
    herr: { ru: 'Ёлочка под дерево', col: '#c49a6c', pat: 'herring', tw: 6, th: 24, grout: '#8f6d47', gloss: .5, price: 600000 },
    marble_w: { ru: 'Мрамор белый (плита)', col: '#ecebe7', pat: 'slab', veins: '#9a9a9a', gloss: .15, price: 1500000 },
    marble_b: { ru: 'Мрамор чёрный (плита)', col: '#23252a', pat: 'slab', veins: '#c8a96a', gloss: .12, price: 1700000 },
    marble_e: { ru: 'Мрамор коричневый (плита)', col: '#7d6c5e', pat: 'slab', veins: '#e0d0b6', gloss: .15, price: 1700000 },
    stone: { ru: 'Керамогранит под камень', col: '#8d8f91', pat: 'slab', veins: '#6d7073', gloss: .45, price: 1200000 },
    glass_w: { ru: 'Стекло (скинали) белое', col: '#f5f6f6', pat: 'flat', gloss: .05, price: 1300000 },
    glass_b: { ru: 'Стекло (скинали) чёрное', col: '#1b1d20', pat: 'flat', gloss: .05, price: 1300000 },
    glass_g: { ru: 'Стекло (скинали) зелёное', col: '#4f7a62', pat: 'flat', gloss: .05, price: 1350000 },
    mdf_w: { ru: 'МДФ-панель белая', col: '#f0efec', pat: 'flat', gloss: .6, price: 450000 },
    mdf_o: { ru: 'МДФ-панель светлый дуб', col: '#d1ad7c', pat: 'wood', tw: 15, th: 60, gloss: .55, price: 500000 },
    steel: { ru: 'Нержавеющая сталь', col: '#b9bcc0', pat: 'brushed', gloss: .3, metal: .9, price: 1100000 },
    brick: { ru: 'Кирпич красный', col: '#a2503b', pat: 'brick', tw: 25, th: 6.5, grout: '#b9b0a4', gloss: .8, price: 480000 },
    concrete: { ru: 'Микроцемент (бетон)', col: '#9a9b9a', pat: 'slab', veins: '#7c7d7c', gloss: .7, price: 700000 },
    ribbed: { ru: 'Рейка вертикальная (МДФ)', col: '#e3dccf', pat: 'ribbed', tw: 3, th: 3, gloss: .55, price: 650000 }
  },
  wpanel: {
    rail_w: { ru: 'МДФ-рейка вертикальная белая', col: '#efede8', pat: 'ribbed', tw: 3, th: 3, gloss: .55, price: 700000 },
    rail_o: { ru: 'МДФ-рейка светлый дуб', col: '#cfa977', pat: 'ribbed', tw: 3, th: 3, gloss: .55, price: 720000 },
    rail_g: { ru: 'МДФ-рейка графит', col: '#3a3d41', pat: 'ribbed', tw: 3, th: 3, gloss: .55, price: 720000 },
    cass: { ru: 'Панель-филёнка (кассеты)', col: '#e8e4dc', pat: 'frame', tw: 45, th: 70, gloss: .6, price: 650000 },
    flat: { ru: 'Плоская панель (цвет)', col: '#d9d4c8', pat: 'flat', gloss: .6, price: 420000 },
    wave: { ru: '3D-панель «волна»', col: '#e9e6df', pat: 'wave', tw: 6, th: 6, gloss: .6, price: 850000 },
    slats: { ru: 'Деревянные рейки с зазором', col: '#b98b5a', pat: 'slats', tw: 5, th: 5, gloss: .55, price: 900000 },
    soft: { ru: 'Мягкая панель (ромбы)', col: '#8b8c90', pat: 'soft', tw: 20, th: 20, gloss: .9, price: 1100000 },
    mirror: { ru: 'Зеркальная панель', col: '#dfe6ea', pat: 'mirror', gloss: .03, metal: .85, price: 800000 },
    brickd: { ru: 'Декоративный кирпич', col: '#d9cfc2', pat: 'brick', tw: 21, th: 6.5, grout: '#b7aea2', gloss: .85, price: 600000 },
    marble: { ru: 'Мрамор (плита)', col: '#ecebe7', pat: 'slab', veins: '#9a9a9a', gloss: .15, price: 1500000 },
    plaster: { ru: 'Декоративная штукатурка', col: '#cfc7ba', pat: 'slab', veins: '#b3aa9b', gloss: .85, price: 380000 }
  }
};
export const OPEN_TINTS = [['', 'Как на образце'], ['#f2f2f0', 'Белый'], ['#d9cdb8', 'Бежевый'], ['#a9adb0', 'Серый'], ['#3a3d41', 'Графит'], ['#1c1d1f', 'Чёрный'], ['#6f8f78', 'Зелёный'], ['#3d5a80', 'Синий'], ['#b06a4f', 'Терракота'], ['#c49a6c', 'Дерево']];
export function openCost(opens) {   // стоимость фартука и стеновых панелей: площадь × цена варианта
  let sum = 0; (opens || []).forEach(o => { const inf = OPEN_INFO[o.kind] && OPEN_INFO[o.kind][o.v]; if (inf) sum += o.w * o.h / 1e4 * inf.price; });
  return Math.round(sum / 10000) * 10000;
}
OPEN_VARIANTS.apron = Object.keys(OPEN_INFO.apron).map(k => [k, OPEN_INFO.apron[k].ru]);
OPEN_VARIANTS.wpanel = Object.keys(OPEN_INFO.wpanel).map(k => [k, OPEN_INFO.wpanel[k].ru]);
OPEN_COLORS.apron = OPEN_TINTS; OPEN_COLORS.wpanel = OPEN_TINTS;
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

/* ---- отделка комнаты: пол и стены (общий каталог для кухни и шкафа PRO) ----
   ru — название, grp — раздел, pat — рисунок (см. panelMat), col — цвет, tw/th — размер доски / плитки / шага, см */
const F = (ru, grp, pat, col, o) => Object.assign({ ru, grp, pat, col }, o || {});
const PQ = (ru, col, g) => F(ru, 'Паркет', 'parquet', col, { tw: 15, th: 90, gloss: g || .5 });
const HB = (ru, col) => F(ru, 'Ёлочка', 'herring', col, { tw: 6, th: 24, grout: '#6b5438', gloss: .5 });
const LM = (ru, col) => F(ru, 'Ламинат и винил', 'parquet', col, { tw: 19, th: 120, gloss: .7 });
const TL = (ru, col, w, h, grout, gl) => F(ru, 'Плитка', 'grid', col, { tw: w, th: h, grout: grout || '#c9c9c4', gloss: gl != null ? gl : .3 });
const SL = (ru, col, veins, g, grp) => F(ru, grp || 'Камень', 'slab', col, { veins, gloss: g != null ? g : .3 });
const PN = (ru, col) => F(ru, 'Краска', 'flat', col, { gloss: .95 });
export const ROOM_FINISH = {
  floor: {
    fp_oak_l: PQ('Паркет дуб светлый', '#d6b98a'), fp_oak_n: PQ('Паркет дуб натуральный', '#c49a6c'), fp_oak_b: PQ('Паркет дуб беленый', '#e3d3b8'), fp_ash: PQ('Паркет ясень серый', '#b9a99a'),
    fp_walnut: PQ('Паркет орех', '#7a5638'), fp_cherry: PQ('Паркет вишня', '#a0522d'), fp_wenge: PQ('Паркет венге', '#3b2b24'), fp_teak: PQ('Паркет тик', '#b07a3f'), fp_maple: PQ('Паркет клён', '#e0c9a0'),
    fh_oak: HB('Ёлочка дуб', '#c49a6c'), fh_walnut: HB('Ёлочка орех', '#6b4428'), fh_gray: HB('Ёлочка серая', '#8f8a84'), fh_white: HB('Ёлочка беленая', '#e3d3b8'),
    lm_gray: LM('Ламинат серый дуб', '#bfb7aa'), lm_dark: LM('Ламинат тёмный дуб', '#5a4636'), lm_white: LM('Ламинат белый', '#ece8df'), lm_sand: LM('Ламинат песочный', '#cdb48d'), vn_oak: LM('Винил под дерево', '#c8ab7d'),
    t_white: TL('Плитка белая глянцевая 60×60', '#f2f2ef', 60, 60, '#d4d4cf', .15), t_beige: TL('Плитка бежевая 60×60', '#d9cdb8', 60, 60, '#bfb49f'), t_gray: TL('Плитка серая 60×60', '#bdbdbb', 60, 60, '#a0a3a5'), t_graph: TL('Плитка графит 60×60', '#3a3d41', 60, 60, '#222427'),
    t_big_gray: TL('Керамогранит 120×60 серый', '#a9adb0', 120, 60, '#8f9396'), t_big_white: TL('Керамогранит 120×60 белый', '#ecebe7', 120, 60, '#cfcfca'), t_wood: TL('Плитка под дерево 20×120', '#b98b5a', 20, 120, '#7a5a38', .5),
    t_terra: TL('Терракота 30×30', '#b06a4f', 30, 30, '#8a4f3a', .6),
    t_check: F('Шахматка чёрно-белая 30×30', 'Плитка', 'checker', '#f2f2ef', { col2: '#1c1d1f', tw: 30, gloss: .25 }), t_check_b: F('Шахматка бежево-коричневая', 'Плитка', 'checker', '#d9cdb8', { col2: '#8a6a4a', tw: 30, gloss: .3 }),
    t_hex: F('Соты 20 серые', 'Плитка', 'hex', '#8d8f91', { tw: 20, grout: '#6d7073', gloss: .35 }), t_cement: F('Цементная плитка (узор)', 'Плитка', 'geo', '#e8e4dc', { col2: '#4a5a6a', tw: 20, th: 20, gloss: .5 }),
    s_marble_w: SL('Мрамор белый', '#ecebe7', '#9a9a9a', .15), s_marble_b: SL('Мрамор чёрный', '#23252a', '#c8a96a', .12), s_trav: SL('Травертин', '#d8c9ad', '#b8a98d', .5), s_granite: SL('Гранит серый', '#8d8f91', '#5d6063', .3), s_slate: SL('Сланец тёмный', '#4a4d52', '#2a2c2f', .6), s_lime: SL('Известняк', '#d9d2c3', '#bfb7a6', .7),
    s_emp: SL('Мрамор коричневый (эмпрадор)', '#7d6c5e', '#e0d0b6', .15), s_dark: SL('Камень тёмный', '#3b3a39', '#2a2928', .2), s_terrazzo: F('Терраццо', 'Камень', 'terrazzo', '#e6e1d8', { gloss: .3 }),
    c_light: SL('Бетон светлый (микроцемент)', '#b5b6b5', '#9a9b9a', .7, 'Бетон'), c_dark: SL('Бетон тёмный', '#6e7072', '#55575a', .7, 'Бетон'), c_pol: SL('Полированный бетон', '#8b8d8e', '#7c7d7c', .25, 'Бетон'),
    o_cork: SL('Пробка', '#c49a6c', '#8a6a3a', .8, 'Другое'), o_lino: F('Линолеум серый', 'Другое', 'flat', '#a9adb0', { gloss: .6 }), o_carpet: F('Ковролин бежевый', 'Другое', 'linen', '#cbbfa9', { gloss: .98 }), o_resin: F('Наливной пол белый', 'Другое', 'flat', '#f2f2ef', { gloss: .2 })
  },
  wall: {
    w_white: PN('Белая', '#f2f1ee'), w_warm: PN('Тёплый белый', '#efe8dc'), w_cream: PN('Кремовая', '#e9dfc8'), w_beige: PN('Бежевая', '#d9cdb8'), w_sand: PN('Песочная', '#cdbba0'), w_lgray: PN('Светло-серая', '#d6d6d4'), w_gray: PN('Серая', '#a9adb0'),
    w_graph: PN('Графит', '#4a4d52'), w_black: PN('Чёрная', '#1c1d1f'), w_sage: PN('Шалфей', '#9cae9a'), w_olive: PN('Оливковая', '#7d8461'), w_mint: PN('Мятная', '#bcd9cc'), w_blue: PN('Серо-голубая', '#8fa8c0'), w_navy: PN('Тёмно-синяя', '#2f4258'),
    w_terra: PN('Терракота', '#b8715a'), w_mustard: PN('Горчичная', '#d0a63c'), w_pink: PN('Пыльная роза', '#e0b9b4'), w_lav: PN('Лаванда', '#bfb3d1'), w_mocha: PN('Мокко', '#8a6b55'), w_green: PN('Зелёная', '#5e7d63'), w_teal: PN('Бирюза тёмная', '#3e7a7a'), w_burg: PN('Бордо', '#7a2f3c'), w_choc: PN('Тёмный шоколад', '#2e2723'),
    wp_str_b: F('Обои полоска бежевая', 'Обои', 'stripe', '#efe8dc', { col2: '#d9cdb8', tw: 10, gloss: .95 }), wp_str_g: F('Обои полоска серая', 'Обои', 'stripe', '#e6e6e4', { col2: '#b9bcbe', tw: 10, gloss: .95 }), wp_str_bl: F('Обои полоска голубая', 'Обои', 'stripe', '#eaf0f5', { col2: '#a9c0d8', tw: 10, gloss: .95 }),
    wp_geo: F('Обои геометрия', 'Обои', 'geo', '#efe8dc', { col2: '#b8a98a', tw: 15, th: 15, gloss: .95 }), wp_dam: F('Обои дамаск бежевые', 'Обои', 'damask', '#e9dfc8', { col2: '#c9b48a', tw: 30, th: 30, gloss: .95 }), wp_dam_g: F('Обои дамаск серые', 'Обои', 'damask', '#dcdcda', { col2: '#a9adb0', tw: 30, th: 30, gloss: .95 }),
    wp_lin: F('Обои лён бежевые', 'Обои', 'linen', '#d9cdb8', { gloss: .98 }), wp_lin_g: F('Обои лён серые', 'Обои', 'linen', '#b9bcbe', { gloss: .98 }), wp_reed: F('Обои тростник', 'Обои', 'linen', '#c9b48a', { gloss: .98 }),
    pl_ven: SL('Венецианская штукатурка', '#d9d2c3', '#bfb7a6', .5, 'Штукатурка и бетон'), pl_dec: SL('Декоративная штукатурка серая', '#b5b6b5', '#9a9b9a', .9, 'Штукатурка и бетон'), pl_conc: SL('Бетонная стена', '#9a9b9a', '#7c7d7c', .85, 'Штукатурка и бетон'), pl_micro: SL('Микроцемент', '#aaa9a6', '#8f8e8b', .6, 'Штукатурка и бетон'), pl_warm: SL('Фактурная штукатурка тёплая', '#d8c9ad', '#b8a98d', .95, 'Штукатурка и бетон'),
    br_white: F('Кирпич белый', 'Кирпич', 'brick', '#ece8e0', { tw: 25, th: 6.5, grout: '#cfcac0', gloss: .9 }), br_red: F('Кирпич красный', 'Кирпич', 'brick', '#a2503b', { tw: 25, th: 6.5, grout: '#b9b0a4', gloss: .9 }), br_gray: F('Кирпич серый', 'Кирпич', 'brick', '#8d8f91', { tw: 25, th: 6.5, grout: '#6d7073', gloss: .9 }), br_loft: F('Кирпич лофт', 'Кирпич', 'brick', '#b97c5c', { tw: 25, th: 6.5, grout: '#9a8f82', gloss: .9 }),
    tl_sub_w: F('Плитка «кабанчик» белая', 'Плитка', 'brick', '#f3f3f1', { tw: 15, th: 7.5, grout: '#cfcfca', gloss: .25 }), tl_sub_g: F('Плитка «кабанчик» зелёная', 'Плитка', 'brick', '#6f8f78', { tw: 15, th: 7.5, grout: '#c9ccc4', gloss: .25 }), tl_sq: F('Плитка 10×10 белая', 'Плитка', 'grid', '#f2f2ef', { tw: 10, th: 10, grout: '#d4d4cf', gloss: .3 }), tl_sq_b: F('Плитка 20×20 бежевая', 'Плитка', 'grid', '#d9cdb8', { tw: 20, th: 20, grout: '#bfb49f', gloss: .35 }),
    wd_light: F('Дерево светлое (вагонка)', 'Дерево и панели', 'wood', '#d1ad7c', { tw: 10, th: 60, gloss: .6 }), wd_dark: F('Дерево тёмное', 'Дерево и панели', 'wood', '#5a4636', { tw: 10, th: 60, gloss: .6 }), wd_slats: F('Деревянные рейки', 'Дерево и панели', 'slats', '#b98b5a', { tw: 5, th: 5, gloss: .55 }),
    wd_rib: F('Рейка белая', 'Дерево и панели', 'ribbed', '#efede8', { tw: 3, th: 3, gloss: .55 }), wd_rib_o: F('Рейка дуб', 'Дерево и панели', 'ribbed', '#cfa977', { tw: 3, th: 3, gloss: .55 }), wd_rib_g: F('Рейка графит', 'Дерево и панели', 'ribbed', '#3a3d41', { tw: 3, th: 3, gloss: .55 }), p3_wave: F('3D-панель «волна»', 'Дерево и панели', 'wave', '#e9e6df', { tw: 6, th: 6, gloss: .6 }), p3_soft: F('Мягкая стеновая панель', 'Дерево и панели', 'soft', '#8b8c90', { tw: 20, th: 20, gloss: .9 }),
    st_emp: SL('Мрамор коричневый', '#7d6c5e', '#e0d0b6', .15, 'Камень'), st_marble: SL('Мрамор', '#ecebe7', '#9a9a9a', .15, 'Камень'), st_stone: SL('Камень серый', '#8d8f91', '#5d6063', .5, 'Камень'), st_mirror: F('Зеркальная стена', 'Камень', 'mirror', '#dfe6ea', { gloss: .03, metal: .85 })
  }
};
export const FINISH_TINTS = [['', 'Как на образце'], ['#f2f2f0', 'Белый'], ['#e9dfc8', 'Кремовый'], ['#d9cdb8', 'Бежевый'], ['#a9adb0', 'Серый'], ['#3a3d41', 'Графит'], ['#1c1d1f', 'Чёрный'], ['#6f8f78', 'Зелёный'], ['#3d5a80', 'Синий'], ['#b06a4f', 'Терракота'], ['#c49a6c', 'Дерево'], ['#7a5638', 'Орех']];
export const finishName = (kind, id) => (ROOM_FINISH[kind] && ROOM_FINISH[kind][id]) ? ROOM_FINISH[kind][id].ru : '';
