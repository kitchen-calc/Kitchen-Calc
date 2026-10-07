/* Общие данные калькулятора шкафов (/shkaf) и страницы раскроя (/raskroy): готовые варианты, палитры, значения по умолчанию. */
const FILLS = { dsp: 'ЛДСП', mirror: 'Зеркало', film: 'Зеркало с плёнкой', laco: 'Лакобель (цветное стекло)', combo: 'ЛДСП + зеркало', sand: 'Зеркало с рисунком' };
const MIRRORS = { plain: 'Обычное', film: 'С плёнкой безопасности', led: 'С подсветкой', sand: 'С пескоструйным рисунком' };
const PALETTE = [
  ['Белый', '#f2f1ee'], ['Светлый дуб', '#d8bd91'], ['Бежевый', '#cdbba0'], ['Серый', '#a9adb0'],
  ['Орех', '#7a5638'], ['Графит', '#3a3d41'], ['Чёрный', '#1c1d1f'], ['Капучино', '#a88b73']
];
const LACO = [['Графит', '#2a2d31'], ['Серо-зелёный', '#6f7d73'], ['Шампань', '#d6c3a1'], ['Белый', '#f0efe9'], ['Синий', '#33476a'], ['Бордо', '#6b2a35']];

const deep = o => JSON.parse(JSON.stringify(o));
function merge(t, s) { Object.keys(s).forEach(k => { if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k]) && t[k] && typeof t[k] === 'object') merge(t[k], s[k]); else t[k] = deep(s[k]); }); return t; }

const DEF = () => ({
  type: 'kupe', tier: 1, color: 0, laco: 0, customColor: null,
  W: 240, H: 240, D: 60, doors: 3, fills: ['dsp', 'mirror', 'dsp'], antresol: 0,
  shelves: 6, rods: 2, drawers: 3, drawerSys: 'tier', pant: 0, shoes: 2, led: false,
  shape: 'line', A: 300, B: 200, C: 200,
  mirror: { on: false, type: 'plain', W: 60, H: 180 },
  hall: {
    shape: 'line',     // line — вдоль стены; L — шкаф сбоку + ниша; U — шкафы по бокам + ниша
    side: 'right',     // для L: с какой стороны от ниши шкаф
    niche: { W: 100, slats: false },
    wardrobe: { on: true, W: 140, H: 230, D: 40, kind: 'swing', doors: 3, mirrorDoor: false },
    wardrobe2: { W: 100, doors: 2 },
    shoe: { on: true, W: 80, tiers: 3 },
    hanger: { on: true, W: 80 },
    bench: { on: true, W: 80, cushion: true },
    antresol: { on: false, W: 140, H: 40 }
  },
  decor: { plant: true, lamp: true, pouf: true, rug: true, pics: true },
  hw: { sys: 'tier', hinge: 'tier', open: 'tier', lift: 'hinge', pant: 'tier', rod: 'tier', x: { trouser: 0, shoe_rot: 0, basket: 0, leather: 0, access: 0, shoe_box: 0 } }
});

// photo — настоящее фото похожего шкафа (static/home/<photo>-640.webp): при наведении на карточку схема плавно сменяется фото
const PRESETS = {
  kupe: [
    // ph-w4: 4 двери из белого стекла (лакобель) до потолка, внутри открытые полки и тумба с ящиками
    { name: 'Белый лакобель до потолка', seg: 'Стандарт', photo: 'ph-w4', note: '4 двери из белого стекла, полки, штанги и ящики', m: { tier: 1, color: 0, laco: 3, W: 400, H: 260, D: 60, doors: 4, fills: ['laco', 'laco', 'laco', 'laco'], antresol: 0, shelves: 8, rods: 2, drawers: 3, shoes: 0, pant: 0, led: false, decor: { plant: false, lamp: false, pouf: false, rug: false, pics: false } } },
    { name: 'Лакобель и антресоль', seg: 'Премиум', note: 'Четыре двери, антресоль, Blum и подсветка', m: { tier: 2, color: 5, laco: 0, W: 340, H: 270, D: 62, doors: 4, fills: ['laco', 'sand', 'laco', 'sand'], antresol: 40, shelves: 9, rods: 3, drawers: 5, shoes: 4, pant: 2, led: true, decor: { plant: true, lamp: true, pouf: true, rug: true, pics: true } } }
  ],
  wardrobe: [
    // ph-w3: светлый дуб, П-образная. Слева две секции: штанга над стопкой ящиков; по центру штанга с полкой и открытые полки;
    // справа полки и ящики. Без дверей и подсветки.
    { name: 'Светлый дуб с ящиками', seg: 'Стандарт', photo: 'ph-w3', note: 'П-образная: штанги над ящиками, открытые полки, 14 ящиков', m: { type: 'wardrobe', tier: 1, color: 1, shape: 'U', A: 160, B: 160, C: 160, H: 250, D: 50, pant: 0, led: false, mirror: { on: false, type: 'plain', W: 60, H: 180 },
      secs: [
        { wall: 0, w: 80, rods: 1, shelves: 3, drawers: 0, shoes: 0, pant: 0, dsys: [] }, { wall: 0, w: 80, rods: 1, shelves: 1, drawers: 0, shoes: 1, pant: 0, dsys: [] },
        { wall: 1, w: 80, rods: 1, shelves: 1, drawers: 4, shoes: 0, pant: 0, dsys: [] }, { wall: 1, w: 80, rods: 1, shelves: 1, drawers: 4, shoes: 0, pant: 0, dsys: [] },
        { wall: 2, w: 80, rods: 0, shelves: 3, drawers: 3, shoes: 0, pant: 0, dsys: [] }, { wall: 2, w: 80, rods: 1, shelves: 1, drawers: 3, shoes: 0, pant: 0, dsys: [] }
      ], decor: { plant: false, lamp: false, pouf: false, rug: true, pics: false } } },
    // ph-w2: тёмная П-образная, подсветка под каждой полкой. Центр: полки и 3 ящика; по бокам штанги с полкой и низкая полка;
    // слева ящики, справа полки и ящики. Blum.
    { name: 'Тёмная с подсветкой', seg: 'Премиум', photo: 'ph-w2', note: 'П-образная, подсветка под каждой полкой, 11 ящиков Blum', m: { type: 'wardrobe', tier: 2, color: 5, shape: 'U', A: 240, B: 160, C: 160, H: 270, D: 55, pant: 0, led: true, drawerSys: 'tbx_m', mirror: { on: false, type: 'plain', W: 60, H: 180 },
      secs: [
        { wall: 0, w: 80, rods: 1, shelves: 2, drawers: 0, shoes: 0, pant: 0, dsys: [] }, { wall: 0, w: 80, rods: 0, shelves: 4, drawers: 3, shoes: 0, pant: 0, dsys: [] }, { wall: 0, w: 80, rods: 1, shelves: 2, drawers: 0, shoes: 0, pant: 0, dsys: [] },
        { wall: 1, w: 80, rods: 1, shelves: 2, drawers: 0, shoes: 0, pant: 0, dsys: [] }, { wall: 1, w: 80, rods: 0, shelves: 2, drawers: 4, shoes: 0, pant: 0, dsys: [] },
        { wall: 2, w: 80, rods: 0, shelves: 4, drawers: 0, shoes: 0, pant: 0, dsys: [] }, { wall: 2, w: 80, rods: 0, shelves: 2, drawers: 4, shoes: 0, pant: 0, dsys: [] }
      ], decor: { plant: false, lamp: false, pouf: true, rug: true, pics: false } } }
  ],
  hall: [
    { name: 'Купе с зеркалами', seg: 'Премиум', note: 'Раздвижной шкаф, зеркало с подсветкой', m: { type: 'hall', tier: 2, color: 5, hall: { shape: 'line', wardrobe: { on: true, W: 200, H: 250, D: 45, kind: 'sliding', doors: 2, mirrorDoor: true }, shoe: { on: true, W: 100, tiers: 4 }, hanger: { on: true, W: 80 }, bench: { on: true, W: 100, cushion: true }, antresol: { on: false, W: 200, H: 40 } }, mirror: { on: true, type: 'led', W: 70, H: 180 }, decor: { plant: true, lamp: true, pouf: true, rug: true, pics: true } } },
    // ph-h1: серый шкаф до потолка на 3 двери без ручек, слева ниша с дубовыми рейками, подсветкой сверху и сиденьем с подушкой, над нишей антресоль
    { name: 'Шкаф до потолка и ниша со скамьёй', seg: 'Стандарт', photo: 'ph-h1', note: 'Шкаф на 3 двери, ниша с рейками, подсветкой и мягким сиденьем', m: { type: 'hall', tier: 1, color: 3, led: true, hall: { shape: 'L', side: 'right', niche: { W: 80, slats: true }, wardrobe: { on: true, W: 180, H: 270, D: 60, kind: 'swing', doors: 3, mirrorDoor: false }, wardrobe2: { W: 100, doors: 2 }, shoe: { on: false, W: 80, tiers: 2 }, hanger: { on: false, W: 70 }, bench: { on: true, W: 80, cushion: true }, antresol: { on: true, W: 80, H: 60 } }, mirror: { on: false, type: 'plain', W: 50, H: 130 }, decor: { plant: false, lamp: false, pouf: false, rug: false, pics: false } } },
    // ph-h2: белые шкафы по бокам по одной двери, по центру ниша с полками для обуви, антресоль на всю ширину (1 + 2 + 1 дверь), золотые ручки
    { name: 'Шкафы по бокам и ниша для обуви', seg: 'Стандарт', photo: 'ph-h2', note: 'Два шкафа по 1 двери, ниша с 3 полками для обуви, антресоль', m: { type: 'hall', tier: 1, color: 0, led: false, hw: { open: 'handle_std' }, hall: { shape: 'U', side: 'right', niche: { W: 120, slats: false }, wardrobe: { on: true, W: 60, H: 260, D: 45, kind: 'swing', doors: 1, mirrorDoor: false }, wardrobe2: { W: 70, doors: 1 }, shoe: { on: true, W: 120, tiers: 3 }, hanger: { on: false, W: 110 }, bench: { on: false, W: 120, cushion: false }, antresol: { on: true, W: 250, H: 50 } }, mirror: { on: false, type: 'plain', W: 60, H: 100 }, decor: { plant: false, lamp: false, pouf: false, rug: true, pics: false } } }
  ]
};
