// Предметы интерьера и электрика: розетки, выключатели, светильники, LED-подсветка, стеновые панели и рейки, декор, стулья, жалюзи и шторы.
// Работают как техника (kind: 'appliance', spec.obj = true): ставятся из каталога, двигаются, поворачиваются, меняют размер и цвет.
// Размеры в мм: w — ширина, h — высота, d — глубина. Модель — в своих координатах x 0…w, y 0…h, z 0…d, лицом к нам (z = d), к стене — z = 0.
// mount: free — на пол, table — на столешницу / полку, wall — на стену (y0 — высота низа от пола), ceil — на потолок, led — под выбранную полку или шкаф.
import * as THREE from 'three';

export const OBJ_CATS = [
  ['elec', '🔌 Электрика'], ['light', '💡 Светильники'], ['led', '✨ LED-подсветка'], ['wall', '🧱 Стеновые панели и рейки'],
  ['decor', '🏺 Декор'], ['seat', '🪑 Стулья и мебель'], ['window', '🪟 Жалюзи и шторы'],
];
export const OBJ_MOUNTS = { free: 'на пол', table: 'на столешницу / полку', wall: 'на стену', ceil: 'на потолок', led: 'под полку / шкаф' };

// Цвета (finish): общий список, у каждого предмета — свои варианты (fins)
const OF = {
  white: ['белый', 0xf3f2ee], black: ['чёрный', 0x1d1d1f], brass: ['латунь', 0xc8a25a], gold: ['золото', 0xd6b25e], chrome: ['хром', 0xd5d8db],
  graphite: ['графит', 0x3f4246], beige: ['бежевый', 0xe2d5bf], ivory: ['слоновая кость', 0xf1e8d6], grey: ['серый', 0x9a9b98], oak: ['дуб', 0xc9a374],
  walnut: ['орех', 0x6b4a33], green: ['зелёный', 0x5d7a5c], terracotta: ['терракота', 0xb46a4a], blue: ['синий', 0x3f5a7a], velvet: ['велюр бежевый', 0xe0d4c0],
  velvetGrey: ['велюр серый', 0xa8a6a1], velvetGreen: ['велюр зелёный', 0x3f6b58], leather: ['кожа карамель', 0xa8703f],
  warm: ['тёплый свет 3000K', 0xffd9a0], neutral: ['нейтральный 4000K', 0xfff1d8], cold: ['холодный 6000K', 0xe4f0ff], rgb: ['цветной RGB', 0xb48cff],
};
export const objFinishColor = f => '#' + ((OF[f] || OF.white)[1]).toString(16).padStart(6, '0');
export const objFinishes = e => (e.fins || ['white']).map(f => [f, (OF[f] || OF.white)[0]]);

// ---------------------------------------------------------------- каталог
export const OBJECTS = [];
let seq = 0;
function O(cat, mount, name, w, h, d, shape, o = {}) { const e = { id: 'o' + (++seq), obj: true, cat, mount, name, w, h, d, shape, src: 'std', ...o }; e.finish = e.finish || e.fins[0]; OBJECTS.push(e); return e; }
const EL = ['white', 'black', 'gold', 'beige', 'graphite', 'chrome'], LM = ['black', 'white', 'brass', 'gold', 'chrome'], LD = ['warm', 'neutral', 'cold', 'rgb'];
const WP = ['oak', 'walnut', 'white', 'black', 'beige', 'grey', 'green'], DC = ['white', 'black', 'beige', 'terracotta', 'gold', 'green', 'grey'];
const ST = ['velvet', 'velvetGrey', 'velvetGreen', 'leather', 'black', 'white'], WN = ['black', 'white', 'beige', 'grey', 'oak'];
// Электрика: рамки 86 мм (стандарт), высоты по правилам: розетка у пола 300, над столешницей 1100, выключатель 900
O('elec', 'wall', 'Розетка одинарная', 86, 86, 12, 'socket', { n: 1, y0: 300, fins: EL, note: 'Обычно 300 мм от пола; на кухне над столешницей — 1050…1150 мм' });
O('elec', 'wall', 'Розетка двойная', 157, 86, 12, 'socket', { n: 2, y0: 300, fins: EL });
O('elec', 'wall', 'Розетка тройная', 228, 86, 12, 'socket', { n: 3, y0: 300, fins: EL });
O('elec', 'wall', 'Розетки над столешницей (блок из 3)', 228, 86, 12, 'socket', { n: 3, y0: 1100, fins: EL });
O('elec', 'wall', 'Розетка с USB', 86, 86, 12, 'socket', { n: 1, usb: true, y0: 300, fins: EL });
O('elec', 'wall', 'Розетка влагозащищённая с крышкой', 86, 86, 30, 'socket', { n: 1, lid: true, y0: 1100, fins: EL, note: 'Рядом с мойкой — с крышкой, IP44' });
O('elec', 'wall', 'Розетка ТВ + интернет', 86, 86, 12, 'tvnet', { y0: 300, fins: EL });
O('elec', 'wall', 'Выключатель одноклавишный', 86, 86, 12, 'switch', { n: 1, y0: 900, fins: EL, note: 'Обычно 900 мм от пола, у двери со стороны ручки' });
O('elec', 'wall', 'Выключатель двухклавишный', 86, 86, 12, 'switch', { n: 2, y0: 900, fins: EL });
O('elec', 'wall', 'Выключатель трёхклавишный', 86, 86, 12, 'switch', { n: 3, y0: 900, fins: EL });
O('elec', 'wall', 'Диммер поворотный', 86, 86, 18, 'dimmer', { y0: 900, fins: EL });
O('elec', 'wall', 'Блок: выключатель + розетка', 157, 86, 12, 'combo', { y0: 900, fins: EL });
O('elec', 'wall', 'Кабель-канал 1 м', 1000, 20, 12, 'duct', { y0: 100, fins: ['white', 'black', 'beige'] });
O('elec', 'table', 'Выдвижной блок розеток в столешницу', 60, 230, 60, 'popup', { fins: ['chrome', 'black', 'white'], note: 'Вырез в столешнице Ø60 мм, под ней нужно 230 мм' });
O('elec', 'table', 'Беспроводная зарядка в столешницу', 80, 6, 80, 'qi', { fins: ['black', 'white'], note: 'Встраивается в столешницу, вырез Ø80' });
// Светильники
O('light', 'ceil', 'Точечный встроенный (круглый)', 90, 12, 90, 'downlight', { fins: LM, lm: 'warm', note: 'Вырез в потолке Ø75…80 мм' });
O('light', 'ceil', 'Точечный встроенный (квадратный)', 90, 12, 90, 'downlightSq', { fins: LM, lm: 'warm' });
O('light', 'ceil', 'Накладной спот-цилиндр', 80, 100, 80, 'surfSpot', { fins: LM, lm: 'warm' });
O('light', 'ceil', 'Накладной спот высокий', 80, 160, 80, 'surfSpot', { fins: LM, lm: 'warm' });
O('light', 'ceil', 'Трек с тремя спотами 1 м', 1000, 160, 60, 'track', { fins: LM, lm: 'warm' });
O('light', 'ceil', 'Подвесной линейный светильник-трубка 1,2 м', 1200, 650, 40, 'tube', { fins: ['brass', 'gold', 'black', 'chrome', 'white'], lm: 'warm', note: 'Высота — от потолка до трубки; меняйте в размерах' });
O('light', 'ceil', 'Подвесной линейный профиль 1,5 м', 1500, 700, 50, 'linear', { fins: LM, lm: 'neutral' });
O('light', 'ceil', 'Подвес шар (стекло)', 250, 900, 250, 'ball', { fins: LM, lm: 'warm' });
O('light', 'ceil', 'Подвес конус', 300, 800, 300, 'cone', { fins: LM, lm: 'warm' });
O('light', 'ceil', 'Подвес цилиндр', 120, 800, 120, 'pcyl', { fins: LM, lm: 'warm' });
O('light', 'ceil', 'Люстра на 6 плафонов', 700, 600, 700, 'chandelier', { fins: LM, lm: 'warm' });
O('light', 'wall', 'Бра', 150, 250, 180, 'sconce', { y0: 1550, fins: LM, lm: 'warm' });
O('light', 'wall', 'Бра вверх-вниз', 80, 200, 110, 'updown', { y0: 1700, fins: LM, lm: 'warm' });
O('light', 'wall', 'Подсветка картины', 500, 60, 120, 'picLight', { y0: 1900, fins: LM, lm: 'warm' });
O('light', 'table', 'Настольная лампа-грибок', 160, 250, 160, 'mushroom', { fins: ['white', 'beige', 'black', 'terracotta'], lm: 'warm' });
O('light', 'table', 'Настольная лампа с абажуром', 280, 480, 280, 'tableLamp', { fins: ['beige', 'white', 'black', 'brass'], lm: 'warm' });
O('light', 'free', 'Торшер', 400, 1650, 400, 'floorLamp', { fins: ['black', 'brass', 'white'], lm: 'warm' });
// LED-подсветка: ставится под выбранную полку или шкаф по всей её ширине
O('led', 'led', 'LED-лента в накладном профиле', 1000, 8, 16, 'ledSurf', { fins: LD, note: 'Длина — по ширине выбранной полки / шкафа; профиль 16×8 мм' });
O('led', 'led', 'LED-лента во врезном профиле', 1000, 6, 20, 'ledRec', { fins: LD, note: 'Нужен паз 12×8 мм (фрезеровка «Паз под LED-профиль»)' });
O('led', 'led', 'Угловой профиль 45°', 1000, 16, 16, 'ledCorner', { fins: LD });
O('led', 'led', 'Вертикальная подсветка в стойке', 12, 1000, 16, 'ledVert', { fins: LD, note: 'Ставится к боковине: высота — по выбранному' });
O('led', 'led', 'Неоновая лента', 1000, 10, 10, 'neon', { fins: LD });
O('led', 'led', 'Подсветка полки с торца', 1000, 16, 10, 'ledEdge', { fins: LD });
O('led', 'free', 'Подсветка цоколя', 1000, 10, 16, 'ledSurf', { fins: LD });
O('led', 'free', 'Блок питания LED 60 Вт', 160, 40, 60, 'driver', { fins: ['grey'], note: 'Прячется в шкаф или за цоколь, нужна вентиляция' });
// Стеновые панели и рейки
O('wall', 'wall', 'Рейки на стену (с зазором)', 600, 2400, 20, 'slats', { y0: 0, slat: 30, gap: 15, fins: WP, note: 'Ширина рейки 30, зазор 15 мм; размеры панели — в свойствах' });
O('wall', 'wall', 'Рейки на войлоке (акустические)', 600, 2400, 22, 'slatsFelt', { y0: 0, slat: 27, gap: 13, fins: WP });
O('wall', 'wall', 'Рейки частые (узкие)', 600, 2400, 18, 'slats', { y0: 0, slat: 15, gap: 8, fins: WP });
O('wall', 'wall', '3D-панель «волна»', 600, 600, 25, 'wave', { y0: 900, fins: ['white', 'beige', 'grey', 'black'] });
O('wall', 'wall', 'Мягкие панели (квадраты)', 1200, 600, 40, 'soft', { y0: 900, fins: ['velvet', 'velvetGrey', 'velvetGreen', 'leather', 'beige'] });
O('wall', 'wall', 'Буазери (молдинги-рамки)', 1200, 2400, 15, 'boiserie', { y0: 0, fins: ['white', 'beige', 'grey', 'green', 'black'] });
O('wall', 'wall', 'Зеркальная панель', 600, 1800, 6, 'mirror', { y0: 300, fins: ['chrome', 'gold'] });
O('wall', 'wall', 'Мраморная плита', 1200, 2400, 12, 'marble', { y0: 0, fins: ['white', 'beige', 'black', 'grey'] });
O('wall', 'wall', 'Декоративный кирпич', 1200, 1200, 15, 'brick', { y0: 0, fins: ['white', 'terracotta', 'grey', 'beige'] });
// Декор
O('decor', 'table', 'Ваза с сухоцветом (пампас)', 140, 650, 140, 'pampas', { fins: ['white', 'beige', 'terracotta', 'black', 'grey'] });
O('decor', 'table', 'Ваза высокая', 140, 320, 140, 'vaseTall', { fins: ['black', 'white', 'beige', 'terracotta', 'gold'] });
O('decor', 'table', 'Ваза-кольцо', 220, 230, 70, 'vaseRing', { fins: ['black', 'white', 'beige', 'terracotta'] });
O('decor', 'table', 'Ваза-бутылка', 100, 280, 100, 'vaseBottle', { fins: DC });
O('decor', 'table', 'Стопка книг', 220, 90, 160, 'bookStack', { fins: ['beige', 'white', 'grey', 'green', 'blue'] });
O('decor', 'table', 'Книги в ряд', 250, 230, 160, 'bookRow', { fins: ['beige', 'white', 'grey', 'green', 'blue'] });
O('decor', 'table', 'Ноутбук', 310, 220, 215, 'laptop', { fins: ['grey', 'black', 'white'] });
O('decor', 'table', 'Стакан кофе', 85, 120, 85, 'cup', { fins: ['terracotta', 'white', 'black'] });
O('decor', 'table', 'Растение в горшке', 220, 400, 220, 'plant', { fins: ['white', 'terracotta', 'black', 'beige'] });
O('decor', 'free', 'Большое растение в кадке', 500, 1400, 500, 'plantBig', { fins: ['white', 'terracotta', 'black', 'beige'] });
O('decor', 'table', 'Свечи (3 шт.)', 200, 150, 90, 'candles', { fins: ['ivory', 'white', 'black'] });
O('decor', 'table', 'Чаша', 260, 90, 260, 'bowl', { fins: DC });
O('decor', 'table', 'Статуэтка', 120, 260, 100, 'sculpt', { fins: ['white', 'black', 'gold', 'beige'] });
O('decor', 'wall', 'Картина в раме', 600, 800, 30, 'picture', { y0: 1300, fins: ['black', 'white', 'gold', 'oak'] });
O('decor', 'wall', 'Часы настенные', 400, 400, 40, 'clock', { y0: 1700, fins: ['black', 'white', 'gold', 'oak'] });
// Стулья и мебель
O('seat', 'free', 'Барный стул велюр, латунные ножки', 460, 1000, 480, 'barVelvet', { seat: 720, fins: ST, legs: 'brass' });
O('seat', 'free', 'Полубарный стул велюр (под 90 см)', 450, 900, 470, 'barVelvet', { seat: 650, fins: ST, legs: 'brass' });
O('seat', 'free', 'Барный стул металл', 400, 1000, 420, 'barMetal', { seat: 750, fins: ['black', 'white', 'oak', 'walnut'] });
O('seat', 'free', 'Стул обеденный', 450, 820, 520, 'chair', { seat: 460, fins: ST });
O('seat', 'free', 'Табурет', 350, 450, 350, 'stool', { fins: ['oak', 'walnut', 'black', 'white'] });
O('seat', 'free', 'Кресло', 750, 800, 780, 'armchair', { fins: ST });
O('seat', 'free', 'Стол круглый Ø900', 900, 750, 900, 'roundTable', { fins: ['oak', 'walnut', 'white', 'black'] });
// Жалюзи и шторы (на окно: поставьте перед стеклом)
O('window', 'wall', 'Жалюзи горизонтальные (ламели 25 мм)', 1200, 1500, 40, 'blinds', { y0: 900, slat: 25, fins: WN });
O('window', 'wall', 'Жалюзи горизонтальные (ламели 50 мм)', 1200, 1500, 50, 'blinds', { y0: 900, slat: 50, fins: WN });
O('window', 'wall', 'Рулонная штора', 1200, 1600, 50, 'roller', { y0: 850, fins: ['white', 'beige', 'grey', 'black'] });
O('window', 'wall', 'Шторы на карнизе (2 полотна)', 2400, 2600, 120, 'curtains', { y0: 0, fins: ['beige', 'white', 'grey', 'velvetGreen', 'velvetGrey'] });
O('window', 'wall', 'Тюль', 2400, 2600, 60, 'sheer', { y0: 0, fins: ['white', 'ivory', 'beige'] });
O('window', 'wall', 'Карниз', 2400, 50, 100, 'cornice', { y0: 2550, fins: ['black', 'white', 'brass', 'chrome'] });

// ---------------------------------------------------------------- 3D
const cache = new Map();
function M(key, color, o = {}) { if (!cache.has(key)) cache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0, ...o })); return cache.get(key); }
const col = f => (OF[f] || OF.white)[1];
const metal = f => ['brass', 'gold', 'chrome'].includes(f);
const fin = f => M('f' + f, col(f), metal(f) ? { metalness: 0.75, roughness: 0.28 } : /velvet|leather/.test(f) ? { roughness: 0.92 } : { roughness: 0.45 });
const MS = {
  brass: () => M('brass', 0xc8a25a, { metalness: 0.8, roughness: 0.3 }), black: () => M('blk', 0x1d1d1f, { roughness: 0.5 }), white: () => M('wht', 0xf3f2ee, { roughness: 0.4 }),
  alu: () => M('alu', 0xc4c7ca, { metalness: 0.6, roughness: 0.35 }), plastic: () => M('pl', 0x2b2c2e, { roughness: 0.6 }), glass: () => M('gl', 0xe8eef0, { roughness: 0.05, transparent: true, opacity: 0.3, depthWrite: false }),
  green: () => M('leaf', 0x5f7f52, { roughness: 0.8 }), straw: () => M('straw', 0xd9c3a0, { roughness: 0.95 }), paper: () => M('paper', 0xf2ede3, { roughness: 0.9 }),
  felt: () => M('felt', 0x2a2a2a, { roughness: 1 }), mirror: () => M('mir', 0xdfe8ec, { metalness: 0.95, roughness: 0.05 }), screen: () => M('scr', 0x0d0f12, { roughness: 0.2 }),
};
// светящийся материал: цвет света по finish (для LED) или тёплый
const glowMat = f => M('glow' + f, col(OF[f] && /K|RGB/.test(OF[f][0]) ? f : 'warm'), { emissive: col(OF[f] && /K|RGB/.test(OF[f][0]) ? f : 'warm'), emissiveIntensity: 1.6, roughness: 0.4 });
const unit = new THREE.BoxGeometry(1, 1, 1);
function box(g, x0, y0, z0, w, h, d, m) { const o = new THREE.Mesh(unit, m); o.scale.set(Math.max(w, 0.3), Math.max(h, 0.3), Math.max(d, 0.3)); o.position.set(x0 + w / 2, y0 + h / 2, z0 + d / 2); g.add(o); return o; }
function cyl(g, r, len, axis, cx, cy, cz, m, r2 = r, seg = 28, open = false) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r2, r, len, seg, 1, open), m);
  if (axis === 'x') o.rotation.z = Math.PI / 2; if (axis === 'z') o.rotation.x = Math.PI / 2;
  o.position.set(cx, cy, cz); g.add(o); return o;
}
function sph(g, r, cx, cy, cz, m, sx = 1, sy = 1, sz = 1) { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), m); o.scale.set(sx, sy, sz); o.position.set(cx, cy, cz); g.add(o); return o; }
function torus(g, R, r, cx, cy, cz, m, rx = Math.PI / 2) { const o = new THREE.Mesh(new THREE.TorusGeometry(R, r, 12, 48), m); o.rotation.x = rx; o.position.set(cx, cy, cz); g.add(o); return o; }
function lathe(g, pts, m, cx, cy, cz, seg = 32) { const o = new THREE.Mesh(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg), m); o.position.set(cx, cy, cz); g.add(o); return o; }
// палка между двумя точками
function rod(g, r, a, b, m) { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), L = A.distanceTo(B), o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 10), m); o.position.copy(A).add(B).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); g.add(o); return o; }
// источник света: виден, когда в комнате выключен общий свет (editor включает лампы — userData.lamp)
function lamp(g, x, y, z, f, power = 1, dist = 2600) { const c = col(OF[f] && /K|RGB/.test(OF[f][0]) ? f : 'warm'), L = new THREE.PointLight(c, 0, dist, 1); L.position.set(x, y, z); L.userData.lamp = power; g.add(L); return L; }

const B = {
  socket(g, e, F) { const { w, h, d } = e, n = e.n || 1, fr = fin(F); box(g, 0, 0, 0, w, h, Math.min(d, 10), fr); const pw = (w - 8) / n;
    for (let k = 0; k < n; k++) { const cx = 4 + pw * (k + 0.5), cy = h / 2; cyl(g, 25, 4, 'z', cx, cy, 10, fr); cyl(g, 3, 3, 'z', cx - 10, cy, 12.5, MS.plastic()); cyl(g, 3, 3, 'z', cx + 10, cy, 12.5, MS.plastic());
      if (e.usb) { box(g, cx - 7, cy - 32, 10, 14, 5, 2, MS.plastic()); } }
    if (e.lid) box(g, 2, 4, 10, w - 4, h - 8, d - 10, M('lid' + F, col(F), { transparent: true, opacity: 0.55 })); },
  tvnet(g, e, F) { const fr = fin(F); box(g, 0, 0, 0, e.w, e.h, 10, fr); cyl(g, 7, 3, 'z', e.w * 0.33, e.h / 2, 11, MS.plastic()); box(g, e.w * 0.6, e.h / 2 - 7, 10, 14, 12, 2, MS.plastic()); },
  switch(g, e, F) { const fr = fin(F), n = e.n || 1; box(g, 0, 0, 0, e.w, e.h, 9, fr); const kw = (e.w - 18) / n; for (let k = 0; k < n; k++) box(g, 9 + k * kw + 1, 9, 9, kw - 2, e.h - 18, 4, fr); },
  dimmer(g, e, F) { const fr = fin(F); box(g, 0, 0, 0, e.w, e.h, 9, fr); cyl(g, 22, 10, 'z', e.w / 2, e.h / 2, 14, fr); },
  combo(g, e, F) { B.switch(g, { ...e, w: e.w / 2, n: 1 }, F); const s = new THREE.Group(); s.position.x = e.w / 2; g.add(s); B.socket(s, { ...e, w: e.w / 2, n: 1 }, F); },
  duct(g, e, F) { box(g, 0, 0, 0, e.w, e.h, e.d, fin(F)); },
  popup(g, e, F) { const fr = fin(F); cyl(g, e.w / 2, e.h, 'y', e.w / 2, e.h / 2, e.d / 2, fr); for (let k = 0; k < 3; k++) cyl(g, 14, 2, 'z', e.w / 2, 45 + k * 60, e.d, MS.plastic()); cyl(g, e.w / 2 + 6, 6, 'y', e.w / 2, e.h, e.d / 2, fr); },
  qi(g, e, F) { cyl(g, e.w / 2, e.h, 'y', e.w / 2, e.h / 2, e.d / 2, fin(F)); torus(g, e.w * 0.3, 1.2, e.w / 2, e.h + 0.5, e.d / 2, glowMat('cold')); },
  downlight(g, e, F) { cyl(g, e.w / 2, 4, 'y', e.w / 2, e.h - 2, e.d / 2, fin(F)); cyl(g, e.w * 0.33, 3, 'y', e.w / 2, e.h - 5, e.d / 2, glowMat(e.lm)); lamp(g, e.w / 2, -60, e.d / 2, e.lm, 0.7, 2600); },
  downlightSq(g, e, F) { box(g, 0, e.h - 4, 0, e.w, 4, e.d, fin(F)); box(g, e.w * 0.18, e.h - 7, e.d * 0.18, e.w * 0.64, 3, e.d * 0.64, glowMat(e.lm)); lamp(g, e.w / 2, -60, e.d / 2, e.lm, 0.7, 2600); },
  surfSpot(g, e, F) { cyl(g, e.w / 2, e.h, 'y', e.w / 2, e.h / 2, e.d / 2, fin(F), e.w / 2, 32, true); cyl(g, e.w / 2, 3, 'y', e.w / 2, e.h - 1.5, e.d / 2, fin(F)); cyl(g, e.w * 0.32, 3, 'y', e.w / 2, e.h * 0.35, e.d / 2, glowMat(e.lm)); lamp(g, e.w / 2, -40, e.d / 2, e.lm, 0.8, 2800); },
  track(g, e, F) { const fr = fin(F); box(g, 0, e.h - 35, e.d / 2 - 17, e.w, 35, 34, fr); for (let k = 0; k < 3; k++) { const x = e.w * (0.2 + 0.3 * k); rod(g, 6, [x, e.h - 35, e.d / 2], [x, e.h - 70, e.d / 2], fr); cyl(g, 28, 90, 'y', x, e.h - 115, e.d / 2, fr); cyl(g, 20, 2, 'y', x, e.h - 161, e.d / 2, glowMat(e.lm)); lamp(g, x, e.h - 200, e.d / 2, e.lm, 0.5, 2400); } },
  tube(g, e, F) { // трубка со светящейся серединой, латунные торцы, два подвеса до потолка с чашками
    const fr = fin(F), r = e.d / 2, y = r, L = e.w; cyl(g, r, L - 30, 'x', L / 2, y, r, glowMat(e.lm)); cyl(g, r + 1, 15, 'x', 7.5, y, r, fr); cyl(g, r + 1, 15, 'x', L - 7.5, y, r, fr);
    for (const x of [L * 0.18, L * 0.82]) { rod(g, 1.2, [x, y + r, r], [x, e.h - 8, r], fr); cyl(g, 30, 8, 'y', x, e.h - 4, r, fr); }
    for (const x of [L * 0.3, L * 0.7]) lamp(g, x, y - 30, r, e.lm, 0.9, 2600); },
  linear(g, e, F) { const fr = fin(F); box(g, 0, 0, 0, e.w, 50, e.d, fr); box(g, 5, -1, 5, e.w - 10, 2, e.d - 10, glowMat(e.lm)); for (const x of [e.w * 0.15, e.w * 0.85]) rod(g, 1, [x, 50, e.d / 2], [x, e.h, e.d / 2], fr); for (const x of [e.w * 0.3, e.w * 0.7]) lamp(g, x, -40, e.d / 2, e.lm, 1, 2800); },
  ball(g, e, F) { const r = e.w / 2; rod(g, 2, [r, 2 * r, r], [r, e.h, r], MS.black()); cyl(g, 25, 15, 'y', r, e.h - 7, r, fin(F)); sph(g, r, r, r, r, MS.glass()); sph(g, 18, r, r, r, glowMat(e.lm)); lamp(g, r, r, r, e.lm, 1, 3000); },
  cone(g, e, F) { const r = e.w / 2, fr = M('cone' + F, col(F), { side: THREE.DoubleSide, roughness: 0.45, metalness: metal(F) ? 0.7 : 0 }); rod(g, 2, [r, 220, r], [r, e.h, r], MS.black()); cyl(g, 18, 220, 'y', r, 110, r, fr, r, 32, true); sph(g, 22, r, 30, r, glowMat(e.lm)); lamp(g, r, -20, r, e.lm, 1, 3000); },
  pcyl(g, e, F) { const r = e.w / 2; rod(g, 2, [r, 300, r], [r, e.h, r], MS.black()); cyl(g, r, 300, 'y', r, 150, r, fin(F), r, 32, true); cyl(g, r * 0.7, 3, 'y', r, 8, r, glowMat(e.lm)); lamp(g, r, -20, r, e.lm, 1, 3000); },
  chandelier(g, e, F) { const fr = fin(F), r = e.w / 2, cy = 120; rod(g, 6, [r, cy, r], [r, e.h, r], fr); cyl(g, 50, 10, 'y', r, e.h - 5, r, fr);
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, x = r + Math.cos(a) * (r - 60), z = r + Math.sin(a) * (r - 60); rod(g, 6, [r, cy, r], [x, cy + 40, z], fr); cyl(g, 45, 90, 'y', x, cy + 85, z, MS.glass(), 35); sph(g, 15, x, cy + 70, z, glowMat(e.lm)); }
    lamp(g, r, cy, r, e.lm, 1.6, 3500); },
  sconce(g, e, F) { const fr = fin(F); box(g, e.w / 2 - 40, e.h / 2 - 40, 0, 80, 80, 10, fr); rod(g, 6, [e.w / 2, e.h / 2, 10], [e.w / 2, e.h / 2, e.d - 70], fr); cyl(g, 70, 140, 'y', e.w / 2, e.h / 2 + 30, e.d - 70, M('shade', 0xf1e8d6, { side: THREE.DoubleSide, roughness: 0.9, emissive: 0x3a2a10 }), 55, 32, true); lamp(g, e.w / 2, e.h / 2, e.d - 70, e.lm, 0.6, 2000); },
  updown(g, e, F) { const fr = fin(F); box(g, 0, 0, 0, e.w, e.h, e.d, fr); box(g, 8, -1, 8, e.w - 16, 2, e.d - 16, glowMat(e.lm)); box(g, 8, e.h - 1, 8, e.w - 16, 2, e.d - 16, glowMat(e.lm)); lamp(g, e.w / 2, -50, e.d / 2, e.lm, 0.5, 1800); lamp(g, e.w / 2, e.h + 50, e.d / 2, e.lm, 0.4, 1800); },
  picLight(g, e, F) { const fr = fin(F); box(g, e.w / 2 - 25, 0, 0, 50, e.h, 12, fr); rod(g, 5, [e.w / 2, e.h / 2, 12], [e.w / 2, e.h / 2, e.d - 20], fr); cyl(g, 18, e.w, 'x', e.w / 2, e.h / 2, e.d - 20, fr); box(g, 10, e.h / 2 - 18, e.d - 30, e.w - 20, 2, 20, glowMat(e.lm)); lamp(g, e.w / 2, -100, e.d, e.lm, 0.5, 1500); },
  mushroom(g, e, F) { const fr = fin(F), r = e.w / 2; lathe(g, [[0, 0], [r * 0.6, 0], [r * 0.62, 8], [r * 0.3, 20], [r * 0.25, e.h * 0.55]], fr, r, 0, r); lathe(g, [[0, e.h], [r * 0.5, e.h - 8], [r, e.h * 0.62], [r * 0.95, e.h * 0.56], [0, e.h * 0.58]], M('mush' + F, col(F), { emissive: 0x3a2610, roughness: 0.6, side: THREE.DoubleSide }), r, 0, r); lamp(g, r, e.h * 0.5, r, e.lm, 0.35, 1200); },
  tableLamp(g, e, F) { const r = e.w / 2; lathe(g, [[0, 0], [r * 0.45, 0], [r * 0.5, 20], [r * 0.35, e.h * 0.35], [r * 0.12, e.h * 0.55], [0, e.h * 0.55]], fin(F), r, 0, r); cyl(g, r * 0.6, e.h * 0.4, 'y', r, e.h * 0.8, r, M('shd', 0xf1e8d6, { side: THREE.DoubleSide, roughness: 0.9, emissive: 0x3a2a10 }), r, 32, true); lamp(g, r, e.h * 0.75, r, e.lm, 0.5, 1600); },
  floorLamp(g, e, F) { const r = e.w / 2, fr = fin(F); cyl(g, 140, 15, 'y', r, 7, r, fr); rod(g, 8, [r, 15, r], [r, e.h - 300, r], fr); cyl(g, 120, 300, 'y', r, e.h - 150, r, M('shd', 0xf1e8d6, { side: THREE.DoubleSide, roughness: 0.9, emissive: 0x3a2a10 }), 190, 32, true); lamp(g, r, e.h - 200, r, e.lm, 0.9, 2600); },
  // LED: профиль алюминиевый, светящийся рассеиватель цвета finish
  ledSurf(g, e, F) { box(g, 0, 0, 0, e.w, e.h, e.d, MS.alu()); box(g, 1, -0.5, 2, e.w - 2, 1, e.d - 4, glowMat(F)); ledLights(g, e, F, -40); },
  ledRec(g, e, F) { box(g, 0, 0, 0, e.w, e.h, e.d, MS.alu()); box(g, 1, -0.5, 3, e.w - 2, 1, e.d - 6, glowMat(F)); ledLights(g, e, F, -40); },
  ledCorner(g, e, F) { box(g, 0, 0, 0, e.w, e.h, e.d, MS.alu()); const o = box(g, 1, e.h * 0.2, e.d * 0.2, e.w - 2, 2, e.d * 0.9, glowMat(F)); o.rotation.x = -Math.PI / 4; ledLights(g, e, F, -30); },
  ledVert(g, e, F) { box(g, 0, 0, 0, e.w, e.h, e.d, MS.alu()); box(g, -0.5, 1, 2, 1, e.h - 2, e.d - 4, glowMat(F)); const n = Math.max(1, Math.round(e.h / 800)); for (let k = 0; k < n; k++) lamp(g, -40, e.h * (k + 0.5) / n, e.d / 2, F, 0.25, 900); },
  neon(g, e, F) { box(g, 0, 0, 0, e.w, e.h, e.d, glowMat(F)); ledLights(g, e, F, -20); },
  ledEdge(g, e, F) { box(g, 0, 0, 0, e.w, e.h, e.d, MS.alu()); box(g, 1, 2, e.d - 0.5, e.w - 2, e.h - 4, 1, glowMat(F)); ledLights(g, e, F, e.h / 2, e.d + 40); },
  driver(g, e) { box(g, 0, 0, 0, e.w, e.h, e.d, MS.alu()); box(g, -10, e.h / 2 - 4, e.d / 2 - 4, 10, 8, 8, MS.black()); },
  // Стеновые панели
  slats(g, e, F) { const s = e.slat || 30, gp = e.gap || 15, n = Math.max(1, Math.floor((e.w + gp) / (s + gp))), off = (e.w - (n * s + (n - 1) * gp)) / 2, fr = fin(F); for (let k = 0; k < n; k++) box(g, off + k * (s + gp), 0, 0, s, e.h, e.d, fr); },
  slatsFelt(g, e, F) { box(g, 0, 0, 0, e.w, e.h, 9, MS.felt()); const s = e.slat || 27, gp = e.gap || 13, n = Math.max(1, Math.floor((e.w + gp) / (s + gp))), fr = fin(F); for (let k = 0; k < n; k++) box(g, k * (s + gp), 0, 9, s, e.h, e.d - 9, fr); },
  wave(g, e, F) { const fr = fin(F), n = Math.max(2, Math.round(e.w / 50)); box(g, 0, 0, 0, e.w, e.h, 8, fr); for (let k = 0; k < n; k++) { const c = cyl(g, e.w / n / 2, e.h, 'y', (k + 0.5) * e.w / n, e.h / 2, 8, fr, e.w / n / 2, 16); c.scale.z = (e.d - 8) / (e.w / n / 2); } },
  soft(g, e, F) { const fr = fin(F), s = 300, nx = Math.max(1, Math.round(e.w / s)), ny = Math.max(1, Math.round(e.h / s)), cw = e.w / nx, ch = e.h / ny; for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { box(g, i * cw + 2, j * ch + 2, 0, cw - 4, ch - 4, e.d - 12, fr); box(g, i * cw + 10, j * ch + 10, e.d - 14, cw - 20, ch - 20, 14, fr); } },
  boiserie(g, e, F) { const fr = fin(F); box(g, 0, 0, 0, e.w, e.h, 3, fr); const fx = (x0, y0, w, h) => { const t = 25; box(g, x0, y0, 3, w, t, e.d - 3, fr); box(g, x0, y0 + h - t, 3, w, t, e.d - 3, fr); box(g, x0, y0 + t, 3, t, h - 2 * t, e.d - 3, fr); box(g, x0 + w - t, y0 + t, 3, t, h - 2 * t, e.d - 3, fr); };
    const nx = Math.max(1, Math.round(e.w / 600)), cw = e.w / nx; for (let i = 0; i < nx; i++) { fx(i * cw + 60, 100, cw - 120, Math.min(800, e.h * 0.3)); if (e.h > 1400) fx(i * cw + 60, Math.min(800, e.h * 0.3) + 220, cw - 120, e.h - Math.min(800, e.h * 0.3) - 340); } },
  mirror(g, e, F) { box(g, 0, 0, 0, e.w, e.h, 2, fin(F)); box(g, 3, 3, 2, e.w - 6, e.h - 6, e.d - 2, MS.mirror()); },
  marble(g, e, F) { const t = texStone(F); box(g, 0, 0, 0, e.w, e.h, e.d, t); },
  brick(g, e, F) { const fr = fin(F), bh = 65, bw = 250; box(g, 0, 0, 0, e.w, e.h, 4, M('mortar', 0xd9d4ca, { roughness: 1 })); for (let r = 0, y = 0; y + bh <= e.h; r++, y += bh + 10) for (let x = r % 2 ? -bw / 2 : 0; x < e.w; x += bw + 10) { const x0 = Math.max(0, x), x1 = Math.min(e.w, x + bw); if (x1 - x0 > 20) box(g, x0, y, 4, x1 - x0, bh, e.d - 4, fr); } },
  // Декор
  pampas(g, e, F) { const r = e.w / 2; lathe(g, [[0, 0], [r * 0.55, 0], [r, e.h * 0.12], [r * 0.85, e.h * 0.25], [r * 0.35, e.h * 0.32], [r * 0.3, e.h * 0.36], [0, e.h * 0.36]], fin(F), r, 0, r);
    for (let k = 0; k < 9; k++) { const a = k * 2.39, len = e.h * (0.45 + 0.2 * ((k * 37) % 10) / 10), lean = 0.18 + 0.06 * (k % 3), x = r + Math.cos(a) * lean * len, z = r + Math.sin(a) * lean * len, y = e.h * 0.34 + len * 0.9;
      rod(g, 1.5, [r, e.h * 0.34, r], [x, y, z], MS.straw()); const p = sph(g, 22, x, y + 40, z, MS.straw(), 0.7, 3, 0.7); p.lookAt(new THREE.Vector3(r + (x - r) * 3, y + 300, r + (z - r) * 3)); p.rotateX(Math.PI / 2); } },
  vaseTall(g, e, F) { const r = e.w / 2; lathe(g, [[0, 0], [r * 0.6, 0], [r, e.h * 0.3], [r * 0.9, e.h * 0.6], [r * 0.4, e.h * 0.85], [r * 0.35, e.h], [0, e.h]], fin(F), r, 0, r); },
  vaseRing(g, e, F) { const R = Math.min(e.w, e.h) / 2 - e.d / 2; const t = new THREE.Mesh(new THREE.TorusGeometry(R, e.d / 2, 20, 48), fin(F)); t.position.set(e.w / 2, R + e.d / 2, e.d / 2); g.add(t); box(g, e.w / 2 - 35, 0, e.d / 2 - 25, 70, 12, 50, fin(F)); },
  vaseBottle(g, e, F) { const r = e.w / 2; lathe(g, [[0, 0], [r * 0.9, 0], [r, e.h * 0.4], [r * 0.3, e.h * 0.65], [r * 0.25, e.h], [0, e.h]], fin(F), r, 0, r); },
  bookStack(g, e, F) { const cs = [col(F), 0xe9e2d4, 0x9a8f80, 0xcfc4b0]; let y = 0; for (let k = 0; k < 4; k++) { const t = 18 + (k % 2) * 6; box(g, (k % 2) * 10, y, (k % 3) * 6, e.w - 15, t, e.d - 15, M('book' + cs[k], cs[k], { roughness: 0.8 })); box(g, (k % 2) * 10 + 3, y + 2, (k % 3) * 6 + 3, e.w - 18, t - 4, e.d - 15, MS.paper()); y += t + 1; } },
  bookRow(g, e, F) { const cs = [col(F), 0xe9e2d4, 0x7d7469, 0xcfc4b0, 0x5f6b5a]; let x = 0, k = 0; while (x < e.w - 15) { const t = 20 + (k * 7) % 15, hh = e.h * (0.82 + ((k * 13) % 18) / 100); box(g, x, 0, 0, t, hh, e.d, M('book' + cs[k % 5], cs[k % 5], { roughness: 0.8 })); x += t + 1; k++; } },
  laptop(g, e, F) { const fr = fin(F); box(g, 0, 0, 0, e.w, 10, e.d, fr); box(g, 15, 10, 30, e.w - 30, 1, e.d * 0.45, MS.plastic()); const lid = new THREE.Group(); lid.position.set(0, 10, 5); lid.rotation.x = -0.32; g.add(lid); box(lid, 0, 0, 0, e.w, e.h - 20, 6, fr); box(lid, 10, 10, 6, e.w - 20, e.h - 40, 0.5, MS.screen()); cyl(lid, 12, 0.6, 'z', e.w / 2, (e.h - 20) / 2, -0.3, MS.white()); },
  cup(g, e, F) { const r = e.w / 2; lathe(g, [[0, 0], [r * 0.75, 0], [r, e.h * 0.92], [0, e.h * 0.92]], M('cupbody', 0xf5f2ec, { roughness: 0.6 }), r, 0, r); cyl(g, r * 0.88, e.h * 0.35, 'y', r, e.h * 0.45, r, fin(F), r * 0.95); cyl(g, r + 2, e.h * 0.1, 'y', r, e.h * 0.96, r, MS.white()); },
  plant(g, e, F) { const r = e.w / 2; lathe(g, [[0, 0], [r * 0.6, 0], [r * 0.75, e.h * 0.35], [0, e.h * 0.35]], fin(F), r, 0, r); for (let k = 0; k < 14; k++) { const a = k * 2.4, l = sph(g, r * 0.32, r + Math.cos(a) * r * 0.35, e.h * (0.5 + 0.35 * ((k * 7) % 10) / 10), r + Math.sin(a) * r * 0.35, MS.green(), 0.45, 1.2, 0.25); l.rotation.set(Math.cos(a) * 0.6, a, Math.sin(a) * 0.6); } },
  plantBig(g, e, F) { B.plant(g, e, F); },
  candles(g, e, F) { const fr = fin(F); [[35, 130], [100, 100], [165, 70]].forEach(([x, h]) => { cyl(g, 25, h, 'y', x, h / 2, e.d / 2, fr); sph(g, 5, x, h + 8, e.d / 2, glowMat('warm'), 1, 1.8, 1); }); },
  bowl(g, e, F) { const r = e.w / 2; lathe(g, [[0, 0], [r * 0.4, 0], [r, e.h], [r * 0.94, e.h], [r * 0.35, 6], [0, 6]], M('bowl' + F, col(F), { side: THREE.DoubleSide, roughness: 0.4, metalness: metal(F) ? 0.7 : 0 }), r, 0, r); },
  sculpt(g, e, F) { const fr = fin(F); box(g, 10, 0, 10, e.w - 20, 30, e.d - 20, fr); sph(g, e.w * 0.32, e.w / 2, e.h * 0.45, e.d / 2, fr, 0.8, 1.6, 0.7); sph(g, e.w * 0.18, e.w / 2, e.h * 0.85, e.d / 2, fr); },
  picture(g, e, F) { box(g, 0, 0, 0, e.w, e.h, e.d, fin(F)); box(g, 30, 30, e.d, e.w - 60, e.h - 60, 1, MS.paper()); box(g, e.w * 0.25, e.h * 0.3, e.d + 1, e.w * 0.5, e.h * 0.4, 1, M('art', 0xb9a58a, { roughness: 0.9 })); },
  clock(g, e, F) { const r = e.w / 2; cyl(g, r, e.d, 'z', r, r, e.d / 2, fin(F)); cyl(g, r - 12, 2, 'z', r, r, e.d + 1, MS.white()); box(g, r - 2, r, e.d + 2, 4, r * 0.6, 2, MS.black()); box(g, r, r - 2, e.d + 2, r * 0.45, 4, 2, MS.black()); },
  // Стулья
  barVelvet(g, e, F) { // сиденье-чаша на тонких латунных ножках с подножкой (как в проекте у окна)
    const fr = fin(F), lg = MS.brass(), cx = e.w / 2, cz = e.d / 2, sy = e.seat || 720, r = Math.min(e.w, e.d) / 2 - 10;
    const seat = cyl(g, r, 70, 'y', cx, sy - 35, cz, fr, r - 15); seat.scale.z = 0.95;
    // спинка — дуга вокруг заднего края (к нам, z = d): человек сидит лицом к столешнице у стены
    const L = Math.PI * 1.24, back = new THREE.Mesh(new THREE.CylinderGeometry(r - 5, r - 25, e.h - sy, 40, 1, true, -L / 2, L), M('vb' + F, col(F), { side: THREE.DoubleSide, roughness: 0.92 })); back.position.set(cx, sy + (e.h - sy) / 2 - 10, cz); g.add(back);
    const rg = new THREE.TorusGeometry(r - 5, 18, 10, 40, L); rg.rotateZ(Math.PI / 2 - L / 2); rg.rotateX(Math.PI / 2); const rim = new THREE.Mesh(rg, fr); rim.position.set(cx, e.h - 18, cz); g.add(rim);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) rod(g, 9, [cx + sx * r * 0.45, sy - 70, cz + sz * r * 0.45], [cx + sx * (e.w / 2 - 15), 0, cz + sz * (e.d / 2 - 15)], lg);
    torus(g, r * 0.72, 7, cx, sy * 0.38, cz, lg); },
  barMetal(g, e, F) { const fr = fin(F), cx = e.w / 2, cz = e.d / 2, sy = e.seat || 750; cyl(g, e.w / 2 - 20, 40, 'y', cx, sy - 20, cz, fr); for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) rod(g, 10, [cx + sx * 80, sy - 40, cz + sz * 80], [cx + sx * (e.w / 2 - 15), 0, cz + sz * (e.d / 2 - 15)], MS.black()); box(g, cx - 140, sy + 120, 15, 280, 120, 20, fr); rod(g, 8, [cx - 100, sy, 25], [cx - 100, sy + 120, 25], MS.black()); rod(g, 8, [cx + 100, sy, 25], [cx + 100, sy + 120, 25], MS.black()); torus(g, 150, 8, cx, 280, cz, MS.black()); },
  chair(g, e, F) { const fr = fin(F), sy = e.seat || 460; box(g, 20, sy - 60, 20, e.w - 40, 60, e.d - 60, fr); box(g, 30, sy, 10, e.w - 60, e.h - sy, 50, fr); for (const [x, z] of [[40, 40], [e.w - 40, 40], [40, e.d - 60], [e.w - 40, e.d - 60]]) rod(g, 12, [x, sy - 60, z], [x, 0, z], MS.black()); },
  stool(g, e, F) { const fr = fin(F), r = e.w / 2; cyl(g, r, 35, 'y', r, e.h - 17, r, fr); for (let k = 0; k < 3; k++) { const a = k * 2.094; rod(g, 14, [r + Math.cos(a) * r * 0.5, e.h - 35, r + Math.sin(a) * r * 0.5], [r + Math.cos(a) * (r - 15), 0, r + Math.sin(a) * (r - 15)], fr); } },
  armchair(g, e, F) { const fr = fin(F); box(g, 60, 100, 60, e.w - 120, 330, e.d - 120, fr); box(g, 0, 100, 40, 90, 520, e.d - 60, fr); box(g, e.w - 90, 100, 40, 90, 520, e.d - 60, fr); box(g, 60, 100, 0, e.w - 120, e.h - 100, 140, fr); for (const [x, z] of [[40, 40], [e.w - 40, 40], [40, e.d - 40], [e.w - 40, e.d - 40]]) cyl(g, 15, 100, 'y', x, 50, z, MS.black()); },
  roundTable(g, e, F) { const fr = fin(F), r = e.w / 2; cyl(g, r, 30, 'y', r, e.h - 15, r, fr); cyl(g, 50, e.h - 30, 'y', r, (e.h - 30) / 2, r, MS.black()); cyl(g, 250, 20, 'y', r, 10, r, MS.black()); },
  // Окно
  blinds(g, e, F) { const fr = fin(F), s = e.slat || 25, n = Math.floor((e.h - 50) / (s * 0.85)); box(g, 0, e.h - 40, 0, e.w, 40, e.d, fr); for (let k = 0; k < n; k++) { const o = box(g, 5, e.h - 50 - k * s * 0.85, e.d / 2 - s / 2, e.w - 10, 0.8, s, fr); o.rotation.x = 0.35; } for (const x of [e.w * 0.15, e.w * 0.5, e.w * 0.85]) rod(g, 1, [x, e.h - 40, e.d / 2], [x, 0, e.d / 2], M('cord', 0x777777)); box(g, 0, 0, e.d / 2 - s / 2, e.w, 12, s, fr); },
  roller(g, e, F) { const fr = fin(F); cyl(g, 25, e.w, 'x', e.w / 2, e.h - 25, 25, fr); box(g, 0, 0, 22, e.w, e.h - 40, 1, M('rl' + F, col(F), { roughness: 0.95, transparent: true, opacity: 0.92 })); box(g, 0, 0, 18, e.w, 20, 10, fr); },
  curtains(g, e, F) { const fr = M('cur' + F, col(F), { roughness: 0.95, side: THREE.DoubleSide }); cyl(g, 12, e.w, 'x', e.w / 2, e.h - 30, e.d - 20, MS.black()); for (const side of [0, 1]) { const pw = e.w * 0.32, x0 = side ? e.w - pw : 0, n = 7; for (let k = 0; k < n; k++) { const c = cyl(g, pw / n / 1.6, e.h - 50, 'y', x0 + (k + 0.5) * pw / n, (e.h - 50) / 2, e.d / 2, fr, pw / n / 1.6, 12, true); c.scale.z = 1.4; } } },
  sheer(g, e, F) { const fr = M('sh' + F, col(F), { roughness: 0.95, transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }), n = Math.max(4, Math.round(e.w / 120)); cyl(g, 10, e.w, 'x', e.w / 2, e.h - 25, e.d / 2, MS.white()); for (let k = 0; k < n; k++) cyl(g, e.w / n / 1.7, e.h - 40, 'y', (k + 0.5) * e.w / n, (e.h - 40) / 2, e.d / 2, fr, e.w / n / 1.7, 12, true); },
  cornice(g, e, F) { const fr = fin(F); cyl(g, 12, e.w, 'x', e.w / 2, e.h / 2, e.d - 30, fr); for (const x of [60, e.w - 60]) { rod(g, 8, [x, e.h / 2, 0], [x, e.h / 2, e.d - 30], fr); sph(g, 22, x === 60 ? 15 : e.w - 15, e.h / 2, e.d - 30, fr); } },
};
function ledLights(g, e, F, dy, dz) { const n = Math.max(1, Math.round(e.w / 900)); for (let k = 0; k < n; k++) lamp(g, e.w * (k + 0.5) / n, dy, dz ?? e.d / 2, F, 0.3, 1000); }
function texStone(F) {
  const key = 'stone' + F; if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.fillStyle = '#' + col(F).toString(16).padStart(6, '0'); x.fillRect(0, 0, 512, 512);
  x.strokeStyle = F === 'black' ? 'rgba(220,200,150,.55)' : 'rgba(110,110,110,.35)'; for (let i = 0; i < 26; i++) { x.lineWidth = Math.random() * 2 + 0.4; x.beginPath(); let px = Math.random() * 512, py = 0; x.moveTo(px, py); while (py < 512) { px += (Math.random() - 0.4) * 40; py += 20 + Math.random() * 30; x.lineTo(px, py); } x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.18 }); cache.set(key, m); return m;
}

export function buildObject(e, finish) {
  const g = new THREE.Group(); (B[e.shape] || ((gg, ee, F) => box(gg, 0, 0, 0, ee.w, ee.h, ee.d, fin(F))))(g, e, finish || e.finish || (e.fins || ['white'])[0]);
  return g;
}
export function objInfo(e) {
  const out = [`Габарит ${e.w} × ${e.h} × ${e.d} мм (Ш × В × Г) — ${OBJ_MOUNTS[e.mount] || ''}`];
  if (e.y0 != null && e.mount === 'wall') out.push(`Обычно низ на ${e.y0} мм от пола`);
  if (e.lm) out.push('Светится, когда общий свет выключен (💡 Свет)');
  if (e.note) out.push(e.note);
  return out;
}
// Значок для каталога: силуэт по разделу
const ICO = { elec: '🔌', light: '💡', led: '✨', wall: '🧱', decor: '🏺', seat: '🪑', window: '🪟' };
const ICO_SH = { tube: '➖', ball: '🔮', pampas: '🌾', plant: '🪴', plantBig: '🪴', laptop: '💻', cup: '☕', bookStack: '📚', bookRow: '📚', candles: '🕯️', clock: '🕰️', picture: '🖼️', mirror: '🪞', switch: '🎚️', dimmer: '🎛️', blinds: '🪟', curtains: '🎭', mushroom: '🍄', floorLamp: '🛋️', chandelier: '💡', roundTable: '🍽️' };
export function objIcon(e, size = 64) { return `<div style="width:${size}px;height:${size}px;display:grid;place-items:center;font-size:${Math.round(size * 0.55)}px;background:#f4efe6;border-radius:10px">${ICO_SH[e.shape] || ICO[e.cat] || '•'}</div>`; }
