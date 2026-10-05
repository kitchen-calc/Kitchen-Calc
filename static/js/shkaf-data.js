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
  shelves: 6, rods: 2, drawers: 3, pant: 0, shoes: 2, led: false,
  shape: 'line', A: 300, B: 200, C: 200,
  mirror: { on: false, type: 'plain', W: 60, H: 180, wall: 'A' },
  hall: {
    shape: 'line',
    wardrobe: { on: true, W: 140, H: 230, D: 40, kind: 'swing', doors: 3, mirrorDoor: false, wall: 'A' },
    shoe: { on: true, W: 80, tiers: 3, wall: 'A' },
    hanger: { on: true, W: 80, wall: 'A' },
    bench: { on: true, W: 80, cushion: true, wall: 'A' },
    antresol: { on: false, W: 140, H: 40 }
  },
  decor: { plant: true, lamp: true, pouf: true, rug: true, pics: true }
});

const PRESETS = {
  kupe: [
    { name: 'Практичный', seg: 'Эконом', note: 'Двухдверный, зеркало и ЛДСП', m: { tier: 0, color: 1, W: 180, H: 240, D: 60, doors: 2, fills: ['dsp', 'mirror'], shelves: 4, rods: 1, drawers: 2, shoes: 1, pant: 0, led: false, decor: { plant: true, lamp: false, pouf: false, rug: true, pics: true } } },
    { name: 'Светлый с зеркалами', seg: 'Стандарт', note: 'Три двери, подсветка и обувь', m: { tier: 1, color: 0, W: 270, H: 250, D: 60, doors: 3, fills: ['combo', 'mirror', 'combo'], shelves: 7, rods: 2, drawers: 3, shoes: 3, pant: 1, led: true, decor: { plant: true, lamp: true, pouf: true, rug: true, pics: true } } },
    { name: 'Лакобель и антресоль', seg: 'Премиум', note: 'Четыре двери, антресоль, Blum и подсветка', m: { tier: 2, color: 5, laco: 0, W: 340, H: 270, D: 62, doors: 4, fills: ['laco', 'sand', 'laco', 'sand'], antresol: 40, shelves: 9, rods: 3, drawers: 5, shoes: 4, pant: 2, led: true, decor: { plant: true, lamp: true, pouf: true, rug: true, pics: true } } }
  ],
  wardrobe: [
    { name: 'Линейная', seg: 'Эконом', note: 'Вдоль одной стены, штанги и полки', m: { type: 'wardrobe', tier: 0, color: 0, shape: 'line', A: 240, H: 240, D: 45, shelves: 8, rods: 3, drawers: 2, shoes: 2, pant: 0, led: false, mirror: { on: false, type: 'plain', W: 60, H: 180 }, decor: { plant: true, lamp: false, pouf: false, rug: true, pics: false } } },
    { name: 'Г-образная с зеркалом', seg: 'Стандарт', note: 'Две стены, обувница и подсветка', m: { type: 'wardrobe', tier: 1, color: 4, shape: 'L', A: 320, B: 200, H: 250, D: 50, shelves: 12, rods: 5, drawers: 4, shoes: 4, pant: 1, led: true, mirror: { on: true, type: 'plain', W: 70, H: 190 }, decor: { plant: true, lamp: true, pouf: true, rug: true, pics: false } } },
    { name: 'П-образная люкс', seg: 'Премиум', note: 'Три стены, пантограф, Blum, зеркало с подсветкой', m: { type: 'wardrobe', tier: 2, color: 5, shape: 'U', A: 340, B: 260, C: 260, H: 260, D: 55, shelves: 18, rods: 8, drawers: 8, shoes: 6, pant: 2, led: true, mirror: { on: true, type: 'led', W: 80, H: 200 }, decor: { plant: true, lamp: true, pouf: true, rug: true, pics: false } } }
  ],
  hall: [
    { name: 'Компактная', seg: 'Эконом', note: 'Шкаф, обувница и вешалка', m: { type: 'hall', tier: 0, color: 1, hall: { shape: 'line', wardrobe: { on: true, W: 100, H: 220, D: 38, kind: 'swing', doors: 2, mirrorDoor: true, wall: 'A' }, shoe: { on: true, W: 60, tiers: 2, wall: 'A' }, hanger: { on: true, W: 60, wall: 'A' }, bench: { on: false, W: 60, cushion: false, wall: 'A' }, antresol: { on: false, W: 100, H: 40 } }, mirror: { on: false, type: 'plain', W: 50, H: 120, wall: 'A' }, decor: { plant: true, lamp: false, pouf: false, rug: true, pics: true } } },
    { name: 'Семейная', seg: 'Стандарт', note: 'Шкаф, скамья с подушкой, зеркало в рост', m: { type: 'hall', tier: 1, color: 2, hall: { shape: 'line', wardrobe: { on: true, W: 160, H: 240, D: 40, kind: 'swing', doors: 3, mirrorDoor: false, wall: 'A' }, shoe: { on: true, W: 80, tiers: 3, wall: 'A' }, hanger: { on: true, W: 80, wall: 'A' }, bench: { on: true, W: 80, cushion: true, wall: 'A' }, antresol: { on: true, W: 160, H: 40 } }, mirror: { on: true, type: 'plain', W: 60, H: 170, wall: 'A' }, decor: { plant: true, lamp: true, pouf: true, rug: true, pics: true } } },
    { name: 'Купе с зеркалами', seg: 'Премиум', note: 'Раздвижной шкаф, зеркало с подсветкой', m: { type: 'hall', tier: 2, color: 5, hall: { shape: 'line', wardrobe: { on: true, W: 200, H: 250, D: 45, kind: 'sliding', doors: 2, mirrorDoor: true, wall: 'A' }, shoe: { on: true, W: 100, tiers: 4, wall: 'A' }, hanger: { on: true, W: 80, wall: 'A' }, bench: { on: true, W: 100, cushion: true, wall: 'A' }, antresol: { on: false, W: 200, H: 40 } }, mirror: { on: true, type: 'led', W: 70, H: 180, wall: 'A' }, decor: { plant: true, lamp: true, pouf: true, rug: true, pics: true } } },
    { name: 'Угловая Г-образная', seg: 'Стандарт', note: 'Шкаф на одной стене, скамья и обувница на другой', m: { type: 'hall', tier: 1, color: 4, hall: { shape: 'L', wardrobe: { on: true, W: 180, H: 240, D: 45, kind: 'swing', doors: 3, mirrorDoor: false, wall: 'A' }, shoe: { on: true, W: 90, tiers: 3, wall: 'B' }, hanger: { on: true, W: 80, wall: 'B' }, bench: { on: true, W: 100, cushion: true, wall: 'B' }, antresol: { on: true, W: 180, H: 40 } }, mirror: { on: true, type: 'plain', W: 60, H: 170, wall: 'B' }, decor: { plant: true, lamp: true, pouf: true, rug: true, pics: true } } },
    { name: 'П-образная люкс', seg: 'Премиум', note: 'Купе, вешалка со скамьёй и обувница с зеркалом на трёх стенах', m: { type: 'hall', tier: 2, color: 5, hall: { shape: 'U', wardrobe: { on: true, W: 220, H: 250, D: 50, kind: 'sliding', doors: 2, mirrorDoor: true, wall: 'A' }, shoe: { on: true, W: 120, tiers: 4, wall: 'C' }, hanger: { on: true, W: 100, wall: 'B' }, bench: { on: true, W: 100, cushion: true, wall: 'B' }, antresol: { on: true, W: 220, H: 40 } }, mirror: { on: true, type: 'led', W: 80, H: 190, wall: 'C' }, decor: { plant: true, lamp: true, pouf: true, rug: true, pics: true } } }
  ]
};
