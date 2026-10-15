// Фурнитура: каталог, проверки установки, отверстия под неё, 3D-вид и действия (открыть / выдвинуть / поднять …).
// Всё считается от закрытого положения детали. Движение — список шагов, которые применяются при t от 0 до 1:
//   { rot: 'x' | 'y', p: [x, y, z], a: угол в радианах }  — поворот вокруг оси через точку p
//   { move: [dx, dy, dz] }                                 — сдвиг
// Правила направлений (чтобы фасад никогда не уходил внутрь корпуса): фасад смотрит на +Z (к нам),
// петли слева — поворот вокруг Y на −угол, справа — на +угол; петли сверху — вокруг X на −угол, снизу — на +угол.
import * as THREE from 'three';
import { thinAxis } from './machining.js';

const D2R = Math.PI / 180;
const r1 = v => Math.round(v * 10) / 10;
const f = v => String(r1(v)).replace('.', ',');

export const HW_CATEGORIES = [
  ['hinges', 'Петли'], ['lifts', 'Подъёмники и газлифты'], ['slides', 'Направляющие ящиков'], ['sliding', 'Раздвижные двери (купе)'],
  ['handles', 'Ручки'], ['legs', 'Ножки и колёса'], ['kitchen', 'Кухонные выдвижные системы'], ['wardrobe', 'Гардеробные системы'],
  ['transform', 'Трансформация (кровати, столы)'], ['other', 'Прочее: свет, замки, крепёж'],
];

// ---------------------------------------------------------------- поля настроек
const F = {
  side: { label: 'Сторона петель', options: [['L', 'слева'], ['R', 'справа'], ['T', 'сверху (откидывается вверх)'], ['B', 'снизу (откидывается вниз)']], def: 'L' },
  model: { label: 'Производитель', options: [['blum', 'Blum'], ['hettich', 'Hettich'], ['gtv', 'GTV'], ['boyard', 'Boyard'], ['mini', 'Мини-петля Ø26']], def: 'blum' },
  angle: { label: 'Угол открывания, °', num: true, def: 110 },
  count: { label: 'Количество (0 — авто)', num: true, def: 0 },
  place: { label: 'Расстановка', options: [['auto', 'автоматически'], ['manual', 'вручную — свои позиции']], def: 'auto' },
  positions: { label: 'Позиции, мм от низа/лева (через запятую)', text: true, def: '' },
  plate: { label: 'Планка на боковине', options: [['1', 'сверлить 2 × Ø5'], ['0', 'не сверлить']], def: '1' },
  off: { label: 'От края фасада, мм', num: true, def: 100 },
  damper: { label: 'Доводчик', options: [['1', 'есть'], ['0', 'нет']], def: '1' },
  drill: { label: 'Сверлить отверстия', options: [['1', 'да'], ['0', 'нет']], def: '1' },
  dir: { label: 'Открывание', options: [['up', 'вверх (петли сверху)'], ['down', 'вниз (петли снизу)']], def: 'up' },
  force: { label: 'Усилие, Н', options: [['60', '60 Н'], ['80', '80 Н'], ['100', '100 Н'], ['120', '120 Н'], ['150', '150 Н']], def: '80' },
  sides: { label: 'Где ставить', options: [['LR', 'с двух сторон'], ['L', 'только слева'], ['R', 'только справа']], def: 'LR' },
  len: { label: 'Длина, мм (0 — по ящику)', num: true, def: 0 },
  slideDir: { label: 'Куда едет', options: [['L', 'влево'], ['R', 'вправо']], def: 'L' },
  travel: { label: 'Ход, мм (0 — на ширину)', num: true, def: 0 },
  centers: { label: 'Межцентровое, мм', options: [96, 128, 160, 192, 224, 256, 320, 448].map(v => [String(v), v + ' мм']), def: '128' },
  orient: { label: 'Положение', options: [['auto', 'авто'], ['h', 'горизонтально'], ['v', 'вертикально']], def: 'auto' },
  pos: { label: 'Где на фасаде', options: [['auto', 'авто (у свободного края)'], ['center', 'по центру'], ['top', 'сверху по центру'], ['manual', 'вручную (X, Y)']], def: 'auto' },
  u: { label: 'X центра, мм', num: true, def: 0 },
  v: { label: 'Y центра, мм', num: true, def: 0 },
  height: { label: 'Высота, мм', num: true, def: 100 },
  legCount: { label: 'Количество', options: [['4', '4 шт.'], ['6', '6 шт.'], ['8', '8 шт.']], def: '4' },
  size: { label: 'Диаметр колеса, мм', options: [['40', '40'], ['50', '50'], ['75', '75'], ['100', '100']], def: '50' },
  brake: { label: 'Тормоз', options: [['1', 'есть'], ['0', 'нет']], def: '1' },
  h: { label: 'Высота корзины, мм', num: true, def: 150 },
  levels: { label: 'Ярусов', options: [['1', '1'], ['2', '2'], ['3', '3']], def: '2' },
  width: { label: 'Ширина, мм', options: [['150', '150'], ['200', '200'], ['300', '300']], def: '150' },
  drop: { label: 'Опускается на, мм', num: true, def: 480 },
  dia: { label: 'Диаметр, мм', num: true, def: 60 },
  color: { label: 'Свет', options: [['warm', 'тёплый 3000K'], ['neutral', 'нейтральный 4000K'], ['cold', 'холодный 6000K']], def: 'warm' },
  finish: { label: 'Покрытие', options: [['chrome', 'хром'], ['black', 'чёрный матовый'], ['gold', 'золото / латунь'], ['steel', 'сталь']], def: 'black' },
};

// ---------------------------------------------------------------- каталог
// target: 'front' — фасад (деталь лицом к нам), 'horizontal' — горизонтальная (дно, полка, столешница), 'any' — любая
// motion: 'part' — двигает деталь (и связанные с ней), 'self' — двигается только сама фурнитура, 'light' — свет
const T = {};
const def = (id, o) => { T[id] = { id, ...o }; };
// Петли
const hingeFields = ['side', 'model', 'angle', 'place', 'count', 'off', 'positions', 'damper', 'drill', 'plate'];
def('hinge', { cat: 'hinges', name: 'Петля накладная', desc: 'Дверь закрывает торец корпуса полностью. Открывается от стороны петель наружу.', target: 'front', fields: hingeFields, motion: 'part', angle: 110 });
def('hingeHalf', { cat: 'hinges', name: 'Петля полунакладная', desc: 'Две двери на одну стойку: каждая закрывает половину торца.', target: 'front', fields: hingeFields, motion: 'part', angle: 110 });
def('hingeInset', { cat: 'hinges', name: 'Петля вкладная', desc: 'Дверь утоплена внутрь корпуса, торцы корпуса видны.', target: 'front', fields: hingeFields, motion: 'part', angle: 110 });
def('hinge165', { cat: 'hinges', name: 'Петля 165° (широкое открывание)', desc: 'Для пеналов и угловых шкафов: дверь открывается почти до стены.', target: 'front', fields: hingeFields, motion: 'part', angle: 165 });
def('hinge95', { cat: 'hinges', name: 'Петля 95° (под толстые фасады)', desc: 'Для фасадов 22–35 мм и рамочных фасадов.', target: 'front', fields: hingeFields, motion: 'part', angle: 95 });
def('hinge45', { cat: 'hinges', name: 'Петля угловая 45°', desc: 'Для скошенных угловых шкафов.', target: 'front', fields: hingeFields, motion: 'part', angle: 95 });
def('hingeGlass', { cat: 'hinges', name: 'Петля для стеклянной двери', desc: 'Без сверления стекла под чашку — крепится прижимом.', target: 'front', fields: ['side', 'angle', 'count', 'off'], motion: 'part', angle: 110, noCup: true });
def('hingeFalse', { cat: 'hinges', name: 'Петля для фальшпанели (неподвижная)', desc: 'Держит декоративную панель, дверь не открывается.', target: 'front', fields: ['side', 'model', 'count', 'off', 'drill'], motion: null });
// Подъёмники
def('gasLift', { cat: 'lifts', name: 'Газлифт (газовый амортизатор)', desc: 'Корпус газлифта крепится к боковине и не двигается, шток толкает фасад. Вверх — для верхних шкафов, вниз — для откидных.', target: 'front', fields: ['dir', 'force', 'sides', 'angle'], motion: 'part', angle: 90 });
def('aventosHK', { cat: 'lifts', name: 'Подъёмник Aventos HK (поворотный)', desc: 'Фасад поворачивается вверх и останавливается в любом положении.', target: 'front', fields: ['sides', 'angle'], motion: 'part', angle: 107 });
def('aventosHKXS', { cat: 'lifts', name: 'Подъёмник Aventos HK-XS (малый)', desc: 'Для небольших и лёгких верхних фасадов.', target: 'front', fields: ['sides', 'angle'], motion: 'part', angle: 90 });
def('aventosHL', { cat: 'lifts', name: 'Подъёмник Aventos HL (параллельный)', desc: 'Фасад поднимается вверх параллельно корпусу — удобно под потолком.', target: 'front', fields: ['sides'], motion: 'part' });
def('aventosHS', { cat: 'lifts', name: 'Подъёмник Aventos HS (вверх и над корпусом)', desc: 'Фасад поднимается и уходит над корпусом.', target: 'front', fields: ['sides'], motion: 'part' });
def('aventosHF', { cat: 'lifts', name: 'Подъёмник Aventos HF (складной)', desc: 'Для двухсекционных фасадов; здесь показан как подъём вверх.', target: 'front', fields: ['sides', 'angle'], motion: 'part', angle: 90 });
def('flapStay', { cat: 'lifts', name: 'Откидной кронштейн (секретер, бар)', desc: 'Фасад откидывается вниз и держится горизонтально.', target: 'front', fields: ['sides'], motion: 'part', angle: 90 });
// Направляющие
const slideFields = ['len', 'damper'];
def('ballFull', { cat: 'slides', name: 'Шариковые полного выдвижения', desc: 'Три шины: внешняя на корпусе, средняя проходит половину пути, внутренняя едет с ящиком. Ящик выдвигается полностью.', target: 'front', fields: slideFields, motion: 'part', ext: 1 });
def('roller', { cat: 'slides', name: 'Роликовые (частичное выдвижение)', desc: 'Две шины, ящик выдвигается на 3/4 длины.', target: 'front', fields: ['len'], motion: 'part', ext: 0.75 });
def('tandem', { cat: 'slides', name: 'Скрытого монтажа (Tandem, Movento)', desc: 'Направляющие под дном ящика, не видны. Полное выдвижение.', target: 'front', fields: slideFields, motion: 'part', ext: 1, under: true });
def('metabox', { cat: 'slides', name: 'Metabox (металлические борта)', desc: 'Металлические борта вместо боков ящика, выдвижение 3/4.', target: 'front', fields: ['len'], motion: 'part', ext: 0.75, boxSides: true });
def('legrabox', { cat: 'slides', name: 'Legrabox / Tandembox (премиум)', desc: 'Тонкие металлические борта, полное выдвижение, доводчик.', target: 'front', fields: slideFields, motion: 'part', ext: 1, boxSides: true });
def('tipOnDrawer', { cat: 'slides', name: 'Push-to-open для ящика (Tip-On)', desc: 'Ящик без ручки: нажал — выехал. Ставится вместе с направляющими.', target: 'front', fields: [], motion: null, staticBehind: true });
// Купе
def('slidingDoor', { cat: 'sliding', name: 'Система купе (верхние и нижние ролики)', desc: 'Дверь едет вдоль шкафа по направляющим. Выберите, в какую сторону она уезжает.', target: 'front', fields: ['slideDir', 'travel'], motion: 'part' });
def('slidingTop', { cat: 'sliding', name: 'Подвесная система (верхние ролики)', desc: 'Дверь висит на верхней направляющей, нижний рельс не нужен.', target: 'front', fields: ['slideDir', 'travel'], motion: 'part' });
def('foldingDoor', { cat: 'sliding', name: 'Складная дверь (гармошка)', desc: 'Створка складывается к стороне крепления.', target: 'front', fields: ['side'], motion: 'part', angle: 90 });
// Ручки
def('handleBar', { cat: 'handles', name: 'Ручка-рейлинг (скоба)', desc: 'Крепится двумя винтами — отверстия Ø5 сквозные с межцентровым расстоянием.', target: 'front', fields: ['centers', 'orient', 'pos', 'u', 'v', 'finish', 'drill'], motion: null });
def('handleKnob', { cat: 'handles', name: 'Ручка-кнопка', desc: 'Одно отверстие Ø5 сквозное.', target: 'front', fields: ['pos', 'u', 'v', 'finish', 'drill'], motion: null });
def('handleProfile', { cat: 'handles', name: 'Профиль Gola / торцевой профиль', desc: 'Алюминиевый профиль по верхнему краю фасада, без сверления.', target: 'front', fields: ['finish'], motion: null });
def('handleEdge', { cat: 'handles', name: 'Торцевая ручка (на верхний торец)', desc: 'Крепится в верхний торец фасада двумя винтами.', target: 'front', fields: ['centers', 'finish', 'drill'], motion: null });
def('handleRecess', { cat: 'handles', name: 'Врезная ручка', desc: 'Фрезеруется паз в фасаде, ручка вставляется заподлицо.', target: 'front', fields: ['pos', 'u', 'v', 'finish'], motion: null });
def('pushOpen', { cat: 'handles', name: 'Толкатель push-to-open (без ручки)', desc: 'Ставится в корпус за фасадом: нажал на дверь — открылась.', target: 'front', fields: [], motion: null, staticBehind: true });
// Ножки и колёса
def('legAdjust', { cat: 'legs', name: 'Ножка регулируемая (пластик)', desc: 'Кухонная ножка под цоколь, регулировка по высоте.', target: 'horizontal', fields: ['height', 'legCount'], motion: null });
def('legMetal', { cat: 'legs', name: 'Ножка металлическая', desc: 'Открытая опора — хром, чёрный или золото.', target: 'horizontal', fields: ['height', 'legCount', 'finish'], motion: null });
def('legDecor', { cat: 'legs', name: 'Ножка декоративная (конус)', desc: 'Скандинавский стиль, дерево или металл.', target: 'horizontal', fields: ['height', 'legCount'], motion: null });
def('castor', { cat: 'legs', name: 'Колесо мебельное поворотное', desc: 'Для тумб, тележек и выкатных модулей.', target: 'horizontal', fields: ['size', 'brake', 'legCount'], motion: null });
def('plinthClip', { cat: 'legs', name: 'Клипса цоколя', desc: 'Крепит цоколь к ножкам.', target: 'horizontal', fields: ['legCount'], motion: null });
// Кухня
def('basket', { cat: 'kitchen', name: 'Выдвижная корзина', desc: 'Ставится на дно или полку, выдвигается на себя.', target: 'horizontal', fields: ['h'], motion: 'self' });
def('cargo', { cat: 'kitchen', name: 'Карго (бутылочница)', desc: 'Узкий выдвижной модуль с ярусами для бутылок и специй.', target: 'horizontal', fields: ['width', 'levels', 'height'], motion: 'self' });
def('trash', { cat: 'kitchen', name: 'Выдвижное мусорное ведро', desc: 'Ставится в шкаф под мойкой.', target: 'horizontal', fields: ['height'], motion: 'self' });
def('carousel', { cat: 'kitchen', name: 'Угловая карусель', desc: 'Вращающиеся полки в угловом шкафу.', target: 'horizontal', fields: ['levels'], motion: 'self' });
def('magicCorner', { cat: 'kitchen', name: 'Волшебный уголок (Magic corner)', desc: 'Корзины выезжают на себя и уходят в сторону.', target: 'horizontal', fields: ['h'], motion: 'self' });
def('dishRack', { cat: 'kitchen', name: 'Сушка для посуды', desc: 'Две решётки в верхнем шкафу.', target: 'horizontal', fields: [], motion: null });
def('roofRail', { cat: 'kitchen', name: 'Рейлинг на стену', desc: 'Труба для крючков над столешницей.', target: 'horizontal', fields: ['finish'], motion: null });
// Гардероб
def('rod', { cat: 'wardrobe', name: 'Штанга с держателями', desc: 'Овальная или круглая труба под полкой.', target: 'horizontal', fields: ['finish'], motion: null });
def('pantograph', { cat: 'wardrobe', name: 'Пантограф (лифт для одежды)', desc: 'Штанга опускается вниз и вперёд за ручку.', target: 'horizontal', fields: ['drop'], motion: 'self' });
def('trouserRack', { cat: 'wardrobe', name: 'Выдвижная брючница', desc: 'Рамка с перекладинами, выдвигается на себя.', target: 'horizontal', fields: [], motion: 'self' });
def('shoeRack', { cat: 'wardrobe', name: 'Выдвижная обувница', desc: 'Наклонные перекладины для обуви.', target: 'horizontal', fields: [], motion: 'self' });
def('tieRack', { cat: 'wardrobe', name: 'Галстучница / ремни', desc: 'Узкая выдвижная планка с крючками.', target: 'horizontal', fields: [], motion: 'self' });
def('mirrorPull', { cat: 'wardrobe', name: 'Выдвижное зеркало', desc: 'Узкое зеркало выезжает из шкафа.', target: 'horizontal', fields: ['height'], motion: 'self' });
// Трансформация
def('bedLift', { cat: 'transform', name: 'Подъёмный механизм кровати', desc: 'Основание кровати поднимается от изголовья на газлифтах — под ним ящик для вещей.', target: 'horizontal', fields: ['force', 'angle'], motion: 'part', angle: 45 });
def('wallBed', { cat: 'transform', name: 'Шкаф-кровать (откидная вниз)', desc: 'Кровать стоит в шкафу вертикально и откидывается вниз.', target: 'front', fields: [], motion: 'part', angle: 90 });
def('tableFold', { cat: 'transform', name: 'Откидной столик (кронштейн)', desc: 'Столешница складывается вниз к стене.', target: 'horizontal', fields: [], motion: 'part', angle: 90, labels: ['Сложить', 'Разложить'] });
def('tableSlide', { cat: 'transform', name: 'Выдвижная столешница', desc: 'Дополнительная столешница выезжает из тумбы.', target: 'horizontal', fields: ['travel'], motion: 'part' });
// Прочее
def('led', { cat: 'other', name: 'LED-подсветка (профиль с лентой)', desc: 'Профиль под передним краем детали. Действие — включить свет.', target: 'any', fields: ['color'], motion: 'light', labels: ['Включить свет', 'Выключить свет'] });
def('lock', { cat: 'other', name: 'Замок мебельный', desc: 'Сверление Ø19 сквозное в верхней части фасада.', target: 'front', fields: ['drill'], motion: null });
def('damper', { cat: 'other', name: 'Доводчик двери (накладной)', desc: 'Ставится в корпус у кромки двери — дверь закрывается мягко.', target: 'front', fields: [], motion: null, staticBehind: true });
def('magnet', { cat: 'other', name: 'Магнитная защёлка', desc: 'Держит дверь закрытой.', target: 'front', fields: [], motion: null, staticBehind: true });
def('hanger', { cat: 'other', name: 'Навес для шкафа (Camar)', desc: 'Регулируемые навесы для верхних шкафов — по одному в каждом верхнем углу.', target: 'any', fields: [], motion: null });
def('shelfPins', { cat: 'other', name: 'Полкодержатели (4 шт.)', desc: 'Металлические полкодержатели под полкой.', target: 'horizontal', fields: [], motion: null });
def('grommet', { cat: 'other', name: 'Заглушка для проводов', desc: 'Круглое отверстие в столешнице или стенке для кабелей.', target: 'any', fields: ['dia', 'drill'], motion: null });
def('socket', { cat: 'other', name: 'Встраиваемый блок розеток', desc: 'Выдвижной блок розеток в столешнице, отверстие Ø60.', target: 'horizontal', fields: [], motion: 'self', labels: ['Выдвинуть', 'Убрать'] });
export const HW_TYPES = T;

export function newHardware(type, target, id) {
  const t = T[type], hw = { id, type, target };
  for (const k of t.fields) hw[k] = F[k].def;
  if (t.fields.includes('angle')) hw.angle = t.angle;
  if (t.motion === 'part' && type.startsWith('aventos')) hw.angle = t.angle;
  return hw;
}
export const FIELDS = F;

// ---------------------------------------------------------------- проверки: куда можно ставить и что с чем не совместимо
export function checkTarget(type, it) {
  const t = T[type], ax = thinAxis(it);
  if (t.target === 'front' && ax !== 'z') return 'Ставится на фасад — деталь, которая стоит лицом к вам (самая тонкая сторона — глубина).';
  if (t.target === 'horizontal' && ax !== 'y') return 'Ставится на горизонтальную деталь: дно, полку, крышу или столешницу.';
  return '';
}
// «Подпись» движения детали: две фурнитуры на одной детали допустимы, только если двигают её одинаково
export function motionKey(hw) {
  const t = T[hw.type];
  if (t.motion !== 'part') return null;
  if (t.cat === 'hinges' || hw.type === 'foldingDoor') return 'swing' + hw.side;
  if (hw.type === 'gasLift') return hw.dir === 'down' ? 'swingB' : 'swingT';
  if (hw.type === 'aventosHK' || hw.type === 'aventosHKXS' || hw.type === 'aventosHF') return 'swingT';
  if (hw.type === 'flapStay' || hw.type === 'wallBed') return 'swingB';
  if (t.cat === 'slides') return 'slideZ';
  if (t.cat === 'sliding') return 'slideX' + hw.slideDir;
  return hw.type;
}
const MOTION_NAMES = { swingL: 'дверь на петлях слева', swingR: 'дверь на петлях справа', swingT: 'фасад поднимается вверх', swingB: 'фасад откидывается вниз', slideZ: 'выдвигается на себя', slideXL: 'едет влево', slideXR: 'едет вправо' };
export function conflict(newHw, existing) {
  const k = motionKey(newHw);
  if (!k) return '';
  for (const h of existing) {
    const k2 = motionKey(h);
    if (k2 && k2 !== k) return `На этой детали уже стоит «${T[h.type].name}» (${MOTION_NAMES[k2] || k2}). Деталь не может одновременно двигаться по-разному — удалите старый механизм или выберите совместимый.`;
  }
  return '';
}
// Какие детали двигаются вместе с этой фурнитурой: сама деталь и связанные с ней («Двигать вместе»)
export function movingIds(hw, items) {
  const t = T[hw.type];
  if (t.motion !== 'part') return [];
  const it = items.find(i => i.id === hw.target);
  if (!it) return [];
  const k = motionKey(hw) || '';
  // петли, подъёмники, купе: двигается только сам фасад — связь не действует (иначе с дверью поедет корпус)
  if (!it.link || /^(swing|slideX)/.test(k) || ['aventosHL', 'aventosHS'].includes(hw.type)) return [it.id];
  return [it.id, ...linkedParts(it, items).map(i => i.id)];
}
// Связанные детали, которые реально могут ехать с деталью: для фасада ящика — короб за ним в пределах фасада,
// для горизонтальной детали (кровать, стол) — то, что лежит на ней в её габарите. Корпус не поедет, даже если связан.
const CARCASS = new Set(['sideL', 'sideR', 'bottom', 'top', 'railF', 'railB', 'shelf', 'back', 'door']);
function linkedParts(it, items) {
  const tol = 0.5, front = thinAxis(it) === 'z';
  return items.filter(i => i.id !== it.id && i.link === it.link && !CARCASS.has(i.role) && (front
    ? i.x >= it.x - tol && i.x + i.w <= it.x + it.w + tol && i.y >= it.y - tol && i.y + i.h <= it.y + it.h + tol && i.z + i.d <= it.z + tol
    : i.x >= it.x - tol && i.x + i.w <= it.x + it.w + tol && i.z >= it.z - tol && i.z + i.d <= it.z + it.d + tol && i.y >= it.y + it.h - tol));
}
function linkedBox(it, items) {
  if (!it.link) return null;
  const list = linkedParts(it, items);
  if (!list.length) return null;
  const b = { x0: Infinity, y0: Infinity, z0: Infinity, x1: -Infinity, y1: -Infinity, z1: -Infinity };
  for (const i of list) {
    b.x0 = Math.min(b.x0, i.x); b.y0 = Math.min(b.y0, i.y); b.z0 = Math.min(b.z0, i.z);
    b.x1 = Math.max(b.x1, i.x + i.w); b.y1 = Math.max(b.y1, i.y + i.h); b.z1 = Math.max(b.z1, i.z + i.d);
  }
  return b;
}
function slideLen(hw, it, items) {
  if (+hw.len > 0) return +hw.len;
  const b = linkedBox(it, items);
  return b ? Math.max(250, Math.round((b.z1 - b.z0) / 50) * 50) : 450;
}

// ---------------------------------------------------------------- движение
export function steps(hw, it, items) {
  const t = T[hw.type], A = (+hw.angle || t.angle || 90) * D2R;
  const top = it.y + it.h, back = it.z;
  const mk = (motionKey(hw) || '').match(/^(swing[LRTB]|slideZ|slideX)/);
  switch (mk ? mk[1] : hw.type) {
    case 'swingL': return [{ rot: 'y', p: [it.x, 0, back], a: -A }];
    case 'swingR': return [{ rot: 'y', p: [it.x + it.w, 0, back], a: A }];
    case 'swingT': return [{ rot: 'x', p: [0, top, back], a: -A }];
    case 'swingB': return [{ rot: 'x', p: [0, it.y, back], a: A }];
    case 'slideZ': return [{ move: [0, 0, slideLen(hw, it, items) * t.ext] }];
    case 'slideX': {
      const tr = +hw.travel > 0 ? +hw.travel : it.w - 40;
      return [{ move: [hw.slideDir === 'R' ? tr : -tr, 0, 0] }];
    }
    case 'aventosHL': return [{ move: [0, 0, 30] }, { move: [0, it.h + 20, 0] }];
    case 'aventosHS': return [{ rot: 'x', p: [0, top, back], a: -90 * D2R }, { move: [0, 40, -it.h * 0.5] }];
    case 'bedLift': return [{ rot: 'x', p: [0, it.y, it.z], a: -A }];
    case 'tableFold': return [{ rot: 'x', p: [0, top, it.z], a: 90 * D2R }];
    case 'tableSlide': return [{ move: [0, 0, +hw.travel > 0 ? +hw.travel : Math.round(it.d * 0.8)] }];
    // двигается только сама фурнитура
    case 'basket': case 'trouserRack': case 'shoeRack': case 'tieRack': case 'trash': return [{ move: [0, 0, Math.round(it.d * 0.85)] }];
    case 'cargo': case 'mirrorPull': return [{ move: [0, 0, Math.round(it.d * 0.9)] }];
    case 'carousel': return [{ rot: 'y', p: [it.x + it.w / 2, 0, it.z + it.d / 2], a: Math.PI }];
    case 'magicCorner': return [{ move: [0, 0, Math.round(it.d * 0.7)] }, { move: [Math.round(it.w * 0.35), 0, 0] }];
    case 'pantograph': return [{ move: [0, -(+hw.drop || 480), 180] }];
    case 'socket': return [{ move: [0, 200, 0] }];
    default: return [];
  }
}
export function actionLabels(type) { return T[type].labels || ['Открыть', 'Закрыть']; }
export function hasAction(type) { return !!T[type].motion; }

const _m = new THREE.Matrix4(), _r = new THREE.Matrix4(), _t = new THREE.Matrix4();
export function poseMatrix(list, t, out = new THREE.Matrix4()) {
  out.identity();
  if (!t) return out;
  for (const s of list) {
    if (s.move) _m.makeTranslation(s.move[0] * t, s.move[1] * t, s.move[2] * t);
    else {
      (s.rot === 'x' ? _r.makeRotationX(s.a * t) : _r.makeRotationY(s.a * t));
      _m.makeTranslation(s.p[0], s.p[1], s.p[2]).multiply(_r).multiply(_t.makeTranslation(-s.p[0], -s.p[1], -s.p[2]));
    }
    out.premultiply(_m);
  }
  return out;
}

// ---------------------------------------------------------------- петли: где стоят и сколько
const CUPS = { blum: { dia: 35, depth: 13, C: 5 }, hettich: { dia: 35, depth: 13, C: 5 }, gtv: { dia: 35, depth: 12, C: 4 }, boyard: { dia: 35, depth: 11.5, C: 4 }, mini: { dia: 26, depth: 11, C: 4 } };
function hingeSpots(hw, it) {
  const along = hw.side === 'L' || hw.side === 'R' ? it.h : it.w;
  let ps = hw.place === 'manual' ? String(hw.positions || '').split(/[;, ]+/).map(v => parseFloat(v.replace(',', '.'))).filter(v => v > 0 && v < along) : [];
  if (!ps.length) {
    const n = +hw.count || (along <= 900 ? 2 : along <= 1600 ? 3 : along <= 2000 ? 4 : 5);
    const off = Math.min(+hw.off || 100, along / 2);
    ps = n === 1 ? [along / 2] : Array.from({ length: n }, (_, k) => off + (along - 2 * off) * k / (n - 1));
  }
  const c = CUPS[hw.model] || CUPS.blum, cu = c.C + c.dia / 2;
  return ps.map(p => {
    if (hw.side === 'L') return { u: cu, v: p, c };
    if (hw.side === 'R') return { u: it.w - cu, v: p, c };
    if (hw.side === 'T') return { u: p, v: it.h - cu, c };
    return { u: p, v: cu, c };
  });
}
// Боковина корпуса, к которой крепится петля: стоит за фасадом у кромки петель
export function hingeSide(hw, it, items) {
  if (hw.side !== 'L' && hw.side !== 'R') return null;
  const ex = hw.side === 'L' ? [it.x - 5, it.x + 60] : [it.x + it.w - 60, it.x + it.w + 5];
  return items.find(i => i.id !== it.id && thinAxis(i) === 'x' && Math.abs(i.z + i.d - it.z) <= 4
    && i.x + i.w >= ex[0] && i.x <= ex[1] && i.y < it.y + it.h && i.y + i.h > it.y) || null;
}
export function plateOps(hw, it, items) {
  const t = T[hw.type];
  if (t.cat !== 'hinges' || hw.plate === '0' || hw.drill === '0' || !t.motion) return [];
  const side = hingeSide(hw, it, items); if (!side) return [];
  return hingeSpots(hw, it).map(s => ({ id: side.id, op: { tag: 'hw' + hw.id, type: 'hole', face: hw.side === 'L' ? 'A' : 'B', u: r1(side.d - 37), v: r1(it.y - side.y + s.v - 16), dia: 5, depth: 12, count: 2, step: 32, dir: 'v' } }));
}
export function hardwareCount(hw, it) {
  const t = T[hw.type];
  if (t.cat === 'hinges' && it) return hingeSpots(hw, it).length;
  if (['gasLift', 'aventosHK', 'aventosHKXS', 'aventosHL', 'aventosHS', 'aventosHF', 'flapStay'].includes(hw.type)) return hw.sides === 'LR' || !hw.sides ? 2 : 1;
  if (t.cat === 'legs') return +hw.legCount || 4;
  if (hw.type === 'hanger') return 2;
  if (hw.type === 'bedLift') return 2;
  return 1;
}
function handleSpot(hw, it, siblings) {
  if (hw.pos === 'manual') return { u: +hw.u || it.w / 2, v: +hw.v || it.h / 2 };
  if (hw.pos === 'center') return { u: it.w / 2, v: it.h / 2 };
  if (hw.pos === 'top') return { u: it.w / 2, v: it.h - 60 };
  const hinge = siblings.find(h => T[h.type].cat === 'hinges' && T[h.type].motion);
  if (hinge && hinge.side === 'L') return { u: it.w - 50, v: it.h - 140 };
  if (hinge && hinge.side === 'R') return { u: 50, v: it.h - 140 };
  if (hinge && hinge.side === 'T') return { u: it.w / 2, v: 50 };
  if (hinge && hinge.side === 'B') return { u: it.w / 2, v: it.h - 50 };
  return { u: it.w / 2, v: it.h > it.w ? it.h - 140 : it.h / 2 };
}
function handleVertical(hw, it, siblings) {
  if (hw.orient === 'h') return false;
  if (hw.orient === 'v') return true;
  const hinge = siblings.find(h => T[h.type].cat === 'hinges' && T[h.type].motion);
  return !!hinge && (hinge.side === 'L' || hinge.side === 'R');
}

// ---------------------------------------------------------------- отверстия под фурнитуру (на фасаде: U — по X, V — по Y; пласть A — лицевая)
export function drillOps(hw, it, siblings) {
  const t = T[hw.type], tag = 'hw' + hw.id, ops = [];
  if (hw.drill === '0') return ops;
  const base = { tag, count: 1, step: 32, dir: 'u' };
  if (t.cat === 'hinges' && !t.noCup) {
    for (const s of hingeSpots(hw, it)) ops.push({ ...base, type: 'hole', face: 'B', u: r1(s.u), v: r1(s.v), dia: s.c.dia, depth: s.c.depth });
  } else if (hw.type === 'handleBar') {
    const c = +hw.centers || 128, p = handleSpot(hw, it, siblings), vert = handleVertical(hw, it, siblings);
    ops.push({ ...base, type: 'hole', face: 'A', u: r1(vert ? p.u : p.u - c / 2), v: r1(vert ? p.v - c / 2 : p.v), dia: 5, depth: it.d, through: true, count: 2, step: c, dir: vert ? 'v' : 'u' });
  } else if (hw.type === 'handleKnob') {
    const p = handleSpot(hw, it, siblings);
    ops.push({ ...base, type: 'hole', face: 'A', u: r1(p.u), v: r1(p.v), dia: 5, depth: it.d, through: true });
  } else if (hw.type === 'handleEdge') {
    const c = +hw.centers || 128;
    ops.push({ ...base, type: 'hole', face: 'V1', s: r1(it.w / 2 - c / 2), o: r1(it.d / 2), dia: 4, depth: 12, count: 2, step: c });
  } else if (hw.type === 'handleRecess') {
    const p = handleSpot(hw, it, siblings);
    ops.push({ ...base, type: 'cut', face: 'A', u: r1(p.u - 60), v: r1(p.v - 15), cw: 120, ch: 30, r: 15, depth: 10, through: false, angle: 0 });
  } else if (hw.type === 'lock') {
    ops.push({ ...base, type: 'hole', face: 'A', u: r1(it.w / 2), v: r1(it.h - 40), dia: 19, depth: it.d, through: true });
  } else if (hw.type === 'grommet') {
    const ax = thinAxis(it), dia = +hw.dia || 60;
    const SU = ax === 'x' ? it.d : it.w, SV = ax === 'y' ? it.d : it.h;
    ops.push({ ...base, type: 'hole', face: 'A', u: r1(SU / 2), v: r1(SV - Math.min(100, SV / 2)), dia, depth: 0, through: true });
  } else if (hw.type === 'socket') {
    ops.push({ ...base, type: 'hole', face: 'A', u: r1(it.w - 150), v: r1(it.d - 120), dia: 60, depth: 0, through: true });
  }
  return ops;
}

// ---------------------------------------------------------------- 3D-вид фурнитуры
const MAT = {
  metal: new THREE.MeshStandardMaterial({ color: 0xb4b8be, metalness: 0.35, roughness: 0.4 }),
  chrome: new THREE.MeshStandardMaterial({ color: 0xdfe2e6, metalness: 0.4, roughness: 0.25 }),
  black: new THREE.MeshStandardMaterial({ color: 0x232323, metalness: 0.3, roughness: 0.6 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xcfa85a, metalness: 0.45, roughness: 0.3 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x9da2a8, metalness: 0.35, roughness: 0.45 }),
  plastic: new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.8 }),
  grey: new THREE.MeshStandardMaterial({ color: 0x6f737a, metalness: 0.4, roughness: 0.5 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.9 }),
  red: new THREE.MeshStandardMaterial({ color: 0xb33a2e, roughness: 0.6 }),
  wood: new THREE.MeshStandardMaterial({ color: 0xa57a4c, roughness: 0.8 }),
  glass: new THREE.MeshStandardMaterial({ color: 0xbfd6e0, metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.45 }),
  mirror: new THREE.MeshStandardMaterial({ color: 0xe6eef2, metalness: 0.5, roughness: 0.05 }),
};
const WIRE = new THREE.LineBasicMaterial({ color: 0x9aa0a6 });
const finishMat = hw => MAT[hw.finish] || MAT.black;
const unitBox = new THREE.BoxGeometry(1, 1, 1);
function box(x0, y0, z0, w, h, d, mat) {
  const m = new THREE.Mesh(unitBox, mat);
  m.scale.set(Math.max(w, 0.5), Math.max(h, 0.5), Math.max(d, 0.5));
  m.position.set(x0 + w / 2, y0 + h / 2, z0 + d / 2);
  return m;
}
function wireBox(x0, y0, z0, w, h, d) {
  const g = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d));
  const l = new THREE.LineSegments(g, WIRE); l.position.set(x0 + w / 2, y0 + h / 2, z0 + d / 2);
  return l;
}
function cyl(r, len, axis, cx, cy, cz, mat, r2) {
  const g = new THREE.CylinderGeometry(r2 ?? r, r, len, 20);
  if (axis === 'x') g.rotateZ(Math.PI / 2);
  if (axis === 'z') g.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(g, mat); m.position.set(cx, cy, cz);
  return m;
}
// Поставить цилиндр между точками a и b (для газлифтов)
const _up = new THREE.Vector3(0, 1, 0), _dir = new THREE.Vector3();
export function placeBetween(mesh, a, b) {
  _dir.subVectors(b, a); const len = Math.max(_dir.length(), 0.5);
  mesh.position.copy(a).addScaledVector(_dir, 0.5);
  mesh.quaternion.setFromUnitVectors(_up, _dir.normalize());
  mesh.scale.set(1, len, 1);
}
const strutGeo = r => new THREE.CylinderGeometry(r, r, 1, 14);

// Вид фурнитуры. Каждый объект помечен: attach — едет вместе с деталью; self — едет по своему движению (factor — доля хода);
// strut — газлифт (пересчитывается каждый кадр между неподвижной точкой и точкой на детали).
export function visuals(hw, it, items, siblings) {
  const t = T[hw.type], out = [];
  const add = (obj, mode = 'static', extra = {}) => { out.push({ obj, mode, ...extra }); return obj; };
  const front = it.z + it.d, back = it.z, top = it.y + it.h;
  if (t.cat === 'hinges') {
    const side = hingeSide(hw, it, items), nickel = MAT.chrome;
    for (const s of hingeSpots(hw, it)) {
      const x = it.x + s.u, y = it.y + s.v, R = s.c.dia / 2;
      if (!t.noCup) {
        add(cyl(R - 0.5, s.c.depth - 0.5, 'z', x, y, back + (s.c.depth - 0.5) / 2, nickel), 'attach');           // чашка в отверстии
        add(cyl(R + 6, 1.2, 'z', x, y, back - 0.6, nickel), 'attach');                                            // фланец чашки
        for (const k of [-1, 1]) add(cyl(2.2, 1.5, 'z', x + k * (R + 2.5) * (hw.side === 'T' || hw.side === 'B' ? 1 : 0), y + k * (R + 2.5) * (hw.side === 'L' || hw.side === 'R' ? 1 : 0), back - 1.6, MAT.steel), 'attach');  // шурупы чашки
      } else add(box(x - 22, y - 12, back - 6, 44, 24, 6, nickel), 'attach');                                   // прижим стекла
      const dir = hw.side === 'L' ? -1 : 1;
      if (hw.side === 'L' || hw.side === 'R') {
        // колено плеча — у внутренней стороны боковины (где планка), плечо идёт к нему от чашки
        const kx = side ? (hw.side === 'L' ? side.x + side.w + 12 : side.x - 26) : (hw.side === 'L' ? it.x + 28 : it.x + it.w - 42);
        const kc = kx + 7, len = Math.abs(kc - x) + 9;
        add(box(Math.min(x, kc) - (kc < x ? 4.5 : -4.5) * 0, y - 9, back - 16, len, 18, 9, nickel), 'attach');   // плечо петли
        add(box(kx, y - 9, back - 52, 14, 18, 40, nickel), 'attach');                                             // колено к планке
        if (side) {                                                                                             // планка на боковине
          const fx = hw.side === 'L' ? side.x + side.w : side.x - 12;
          add(box(fx, y - 25, side.z + side.d - 37 - 22, 12, 50, 44, MAT.metal));
          for (const k of [-16, 16]) add(cyl(4, 2, 'x', hw.side === 'L' ? fx + 12.5 : fx - 0.5, y + k, side.z + side.d - 37, MAT.steel));
        }
      } else {
        const edgeY = hw.side === 'T' ? top : it.y, d2 = hw.side === 'T' ? 1 : -1, len = Math.abs(edgeY - y) + 22;
        add(box(x - 9, Math.min(y, y + d2 * len), back - 16, 18, len, 9, nickel), 'attach');
      }
      if (hw.damper === '1') add(cyl(5, 22, 'x', x + (hw.side === 'R' ? -6 : 6), y + 14, back - 12, MAT.plastic), 'attach');   // доводчик в плече
    }
  } else if (['gasLift', 'aventosHK', 'aventosHKXS', 'aventosHF', 'flapStay'].includes(hw.type)) {
    const xs = (hw.sides === 'L' ? [30] : hw.sides === 'R' ? [it.w - 30] : [30, it.w - 30]).map(v => it.x + v);
    const down = hw.type === 'flapStay' || hw.dir === 'down';
    for (const x of xs) {
      if (hw.type.startsWith('aventos')) add(box(x - 15, top - 120, back - 120, 30, 110, 100, MAT.grey));   // корпус механизма на боковине
      const fixed = new THREE.Vector3(x, down ? it.y + 260 : top - 260, back - 160);
      const onPart = new THREE.Vector3(x, down ? it.y + 120 : top - 120, back - 2);
      const body = add(new THREE.Mesh(strutGeo(11), MAT.black), 'strut', { fixed, onPart, role: 'body' });
      const rod = add(new THREE.Mesh(strutGeo(4), MAT.chrome), 'strut', { fixed, onPart, role: 'rod' });
      placeBetween(body, fixed, onPart); placeBetween(rod, fixed, onPart);
      add(box(x - 12, fixed.y - 14, fixed.z - 14, 24, 28, 28, MAT.metal));                      // кронштейн на боковине
      add(box(x - 12, onPart.y - 12, back - 20, 24, 24, 18, MAT.metal), 'attach');            // кронштейн на фасаде
    }
  } else if (hw.type === 'aventosHL' || hw.type === 'aventosHS') {
    for (const x of hw.sides === 'L' ? [it.x + 15] : hw.sides === 'R' ? [it.x + it.w - 45] : [it.x + 15, it.x + it.w - 45]) {
      add(box(x, top - 160, back - 140, 30, 150, 120, MAT.grey));
      add(box(x + 5, top - 40, back - 20, 20, 30, 18, MAT.metal), 'attach');
    }
  } else if (t.cat === 'slides') {
    const b = linkedBox(it, items) || { x0: it.x + 20, x1: it.x + it.w - 20, y0: it.y + 40, y1: it.y + it.h - 40, z0: back - 450, z1: back };
    const len = slideLen(hw, it, items), z0 = b.z1 - len;
    if (t.under) {
      for (const x of [b.x0 + 20, b.x1 - 45]) {
        add(box(x, b.y0 - 18, z0, 25, 15, len, MAT.metal));
        add(box(x + 3, b.y0 - 14, z0, 19, 12, len, MAT.steel), 'attach');
      }
    } else {
      for (const [xo, xi] of [[b.x0 - 13, b.x0 - 7], [b.x1 + 6.5, b.x1 + 0.5]]) {
        add(box(xo, b.y0 + 20, z0, 6.5, 40, len, MAT.metal));                              // внешняя шина — на корпусе
        if (t.ext === 1) add(box(xo + (xo < b.x0 ? 2 : -2), b.y0 + 24, z0, 6.5, 32, len, MAT.steel), 'self', { factor: 0.5 });  // средняя — половина хода
        add(box(xi, b.y0 + 27, z0, 6.5, 26, len, MAT.chrome), 'attach');                   // внутренняя — с ящиком
      }
      if (t.boxSides) for (const x of [b.x0, b.x1 - 14]) add(box(x, b.y0, z0 + 10, 14, Math.min(120, b.y1 - b.y0), len - 20, MAT.grey), 'attach');
    }
  } else if (hw.type === 'tipOnDrawer' || hw.type === 'pushOpen' || hw.type === 'magnet' || hw.type === 'damper') {
    const x = hw.type === 'damper' ? it.x + 40 : it.x + it.w / 2 - 15;
    add(box(x, it.y + it.h / 2 - 12, back - 60, 30, 24, 58, hw.type === 'magnet' ? MAT.grey : MAT.plastic));
  } else if (t.cat === 'sliding') {
    const st = steps(hw, it, items), mv = st[0] && st[0].move ? st[0].move[0] : 0;
    const x0 = Math.min(it.x, it.x + mv) - 10, x1 = Math.max(it.x + it.w, it.x + it.w + mv) + 10;
    if (hw.type !== 'foldingDoor') {
      add(box(x0, top + 2, back - 40, x1 - x0, 40, 80, MAT.metal));
      if (hw.type === 'slidingDoor') add(box(x0, it.y - 12, back - 30, x1 - x0, 10, 60, MAT.metal));
      for (const x of [it.x + 40, it.x + it.w - 70]) {
        add(box(x, top - 6, back - 20, 30, 20, 20, MAT.black), 'attach');
        if (hw.type === 'slidingDoor') add(box(x, it.y - 4, back - 20, 30, 14, 20, MAT.black), 'attach');
      }
    } else {
      for (const y of [it.y + 100, top - 100]) add(box(hw.side === 'R' ? it.x + it.w - 5 : it.x - 5, y - 20, back - 10, 10, 40, 10, MAT.metal), 'attach');
    }
  } else if (t.cat === 'handles') {
    const fm = finishMat(hw), p = handleSpot(hw, it, siblings), cx = it.x + p.u, cy = it.y + p.v;
    if (hw.type === 'handleBar') {
      const c = +hw.centers || 128, vert = handleVertical(hw, it, siblings), L = c + 40;
      add(cyl(6, L, vert ? 'y' : 'x', cx, cy, front + 32, fm), 'attach');
      for (const k of [-1, 1]) add(cyl(5, 30, 'z', cx + (vert ? 0 : k * c / 2), cy + (vert ? k * c / 2 : 0), front + 15, fm), 'attach');
    } else if (hw.type === 'handleKnob') {
      add(new THREE.Mesh(new THREE.SphereGeometry(14, 18, 12), fm), 'attach').position.set(cx, cy, front + 32);
      add(cyl(5, 22, 'z', cx, cy, front + 11, fm), 'attach');
    } else if (hw.type === 'handleProfile') add(box(it.x, top - 22, front, it.w, 22, 22, fm), 'attach');
    else if (hw.type === 'handleEdge') add(box(it.x + it.w / 2 - (+hw.centers || 128) / 2 - 20, top, it.z - 8, (+hw.centers || 128) + 40, 14, it.d + 16, fm), 'attach');
    else if (hw.type === 'handleRecess') add(box(cx - 58, cy - 13, front - 9, 116, 26, 9.5, fm), 'attach');
  } else if (t.cat === 'legs') {
    const n = +hw.legCount || 4, xs = [it.x + 50, it.x + it.w - 50], zs = [it.z + 50, it.z + it.d - 50];
    const spots = [];
    const cols = n >= 6 ? [xs[0], it.x + it.w / 2, xs[1]] : xs;
    const rows = n >= 8 ? [zs[0], it.z + it.d / 2, zs[1]] : zs;
    cols.forEach(x => rows.forEach(z => spots.push([x, z])));
    const H = hw.type === 'castor' ? (+hw.size || 50) + 15 : +hw.height || 100;
    for (const [x, z] of spots.slice(0, Math.max(n, 4) === 8 && cols.length * rows.length === 9 ? 8 : spots.length)) {
      if (hw.type === 'legAdjust') {
        add(box(x - 27, it.y - 4, z - 27, 54, 4, 54, MAT.plastic));                              // площадка под дно
        add(cyl(16, H - 26, 'y', x, it.y - 4 - (H - 26) / 2, z, MAT.plastic));                   // корпус ножки
        add(cyl(7, 12, 'y', x, it.y - H + 16, z, MAT.steel));                                     // регулировочный винт
        add(cyl(24, 10, 'y', x, it.y - H + 5, z, MAT.plastic, 20));                               // пятка
        add(box(x - 6, it.y - 28, z + 14, 12, 18, 6, MAT.plastic));                               // зацеп для клипсы цоколя
      } else if (hw.type === 'legMetal') {
        add(cyl(25, 4, 'y', x, it.y - 2, z, finishMat(hw)));                                       // фланец с 4 винтами
        add(cyl(15, H - 12, 'y', x, it.y - 4 - (H - 12) / 2, z, finishMat(hw)));
        add(cyl(16, 8, 'y', x, it.y - H + 4, z, MAT.rubber));                                     // подпятник
      }
      else if (hw.type === 'legDecor') { add(cyl(12, H, 'y', x, it.y - H / 2, z, MAT.wood, 22)); }
      else if (hw.type === 'plinthClip') { add(box(x - 15, it.y - 40, it.z + it.d - 70, 30, 20, 30, MAT.plastic)); }
      else {
        const d = +hw.size || 50;
        add(box(x - 20, it.y - 15, z - 20, 40, 15, 40, MAT.metal));
        add(cyl(d / 2, 18, 'x', x, it.y - 15 - d / 2, z + 6, MAT.rubber));
        if (hw.brake === '1') add(box(x - 8, it.y - 15 - d * 0.55, z + 6 + d / 2 - 2, 16, 10, 14, MAT.red));
      }
    }
  } else if (t.motion === 'self' || ['dishRack', 'roofRail', 'rod'].includes(hw.type)) {
    const x0 = it.x + 13, z0 = it.z + 10, W = it.w - 26, Dp = it.d - 60, y0 = it.y + it.h + 6;
    const self = t.motion === 'self' ? 'self' : 'static';
    if (hw.type === 'basket' || hw.type === 'magicCorner') {
      const H = +hw.h || 150, w = hw.type === 'magicCorner' ? W * 0.55 : W;
      for (const lv of hw.type === 'magicCorner' ? [0, 280] : [0]) {
        add(wireBox(x0, y0 + lv, z0, w, H, Dp), self); add(box(x0, y0 + lv, z0, w, 2, Dp, MAT.metal), self);
      }
    } else if (hw.type === 'cargo') {
      const w = Math.min(+hw.width || 150, W), H = +hw.height || 500, lv = +hw.levels || 2;
      add(box(x0, y0, z0 + Dp - 4, w, H, 4, MAT.metal), self);
      for (let k = 0; k < lv; k++) { const y = y0 + k * H / lv; add(wireBox(x0, y, z0, w, Math.min(120, H / lv - 10), Dp), self); add(box(x0, y, z0, w, 2, Dp, MAT.metal), self); }
    } else if (hw.type === 'trash') {
      const H = +hw.height || 350;
      add(box(x0 + 20, y0, z0 + 20, Math.min(W - 40, 300), H, Math.min(Dp - 40, 350), MAT.grey), self);
    } else if (hw.type === 'carousel') {
      const R = Math.min(it.w, it.d) / 2 - 25, lv = +hw.levels || 2;
      for (let k = 0; k < lv; k++) {
        const y = y0 + 20 + k * 280;
        const g = new THREE.CylinderGeometry(R, R, 4, 40, 1, false, 0, Math.PI * 1.5);
        const m = add(new THREE.Mesh(g, MAT.metal), 'self'); m.position.set(it.x + it.w / 2, y, it.z + it.d / 2);
      }
      add(cyl(12, (lv - 1) * 280 + 60, 'y', it.x + it.w / 2, y0 + (lv - 1) * 140 + 20, it.z + it.d / 2, MAT.chrome));
    } else if (hw.type === 'dishRack') {
      for (const y of [it.y + 60, it.y + 260]) add(wireBox(x0, y, z0, W, 40, Dp));
    } else if (hw.type === 'roofRail') {
      add(cyl(8, it.w - 40, 'x', it.x + it.w / 2, top + 500, it.z + 40, finishMat(hw)));
    } else if (hw.type === 'rod' || hw.type === 'pantograph') {
      const ry = it.y - 60, rz = it.z + it.d / 2;
      const m = hw.type === 'rod' ? finishMat(hw) : MAT.chrome;
      add(cyl(12.5, it.w - 10, 'x', it.x + it.w / 2, ry, rz, m), self);
      for (const x of [it.x + 3, it.x + it.w - 13]) add(box(x, ry - 15, rz - 15, 10, 45, 30, m));
      if (hw.type === 'pantograph') for (const x of [it.x + 20, it.x + it.w - 30]) add(box(x, ry, rz - 5, 10, 400, 10, MAT.chrome), 'self', { factor: 0.6 });
    } else if (hw.type === 'trouserRack' || hw.type === 'tieRack' || hw.type === 'shoeRack') {
      const w = hw.type === 'tieRack' ? 80 : W;
      add(wireBox(x0, y0, z0, w, hw.type === 'shoeRack' ? 160 : 60, Dp), self);
      const n = hw.type === 'tieRack' ? 8 : 6;
      for (let k = 0; k < n; k++) add(cyl(5, w - 10, 'x', x0 + w / 2, y0 + (hw.type === 'shoeRack' ? 40 + (k % 2) * 80 : 50), z0 + 30 + k * (Dp - 60) / (n - 1), MAT.chrome), self);
    } else if (hw.type === 'mirrorPull') {
      const H = +hw.height || 1000;
      add(box(x0, y0, z0, 10, H, Dp, MAT.mirror), self);
    } else if (hw.type === 'socket') {
      add(cyl(29, 220, 'y', it.x + it.w - 150, it.y + it.h - 110, it.z + it.d - 120, MAT.steel), 'self');
    }
  } else if (hw.type === 'bedLift') {
    for (const x of [it.x + 40, it.x + it.w - 40]) {
      const fixed = new THREE.Vector3(x, it.y - 150, it.z + 120), onPart = new THREE.Vector3(x, it.y - 2, it.z + 420);
      const body = add(new THREE.Mesh(strutGeo(11), MAT.black), 'strut', { fixed, onPart, role: 'body' });
      const rod = add(new THREE.Mesh(strutGeo(4), MAT.chrome), 'strut', { fixed, onPart, role: 'rod' });
      placeBetween(body, fixed, onPart); placeBetween(rod, fixed, onPart);
    }
  } else if (hw.type === 'wallBed' || hw.type === 'tableFold') {
    for (const x of [it.x + 20, it.x + it.w - 50]) add(box(x, hw.type === 'wallBed' ? it.y : top - 40, back - 40, 30, 40, 40, MAT.grey));
  } else if (hw.type === 'tableSlide') {
    for (const x of [it.x + 30, it.x + it.w - 50]) add(box(x, it.y - 30, it.z, 20, 28, it.d, MAT.metal));
  } else if (hw.type === 'led') {
    const strip = add(box(it.x + 10, it.y - 9, it.z + it.d - 45, it.w - 20, 8, 16, new THREE.MeshStandardMaterial({ color: 0xe6e6e6, metalness: 0.5, roughness: 0.3 })), 'light');
    strip.userData.color = { warm: 0xffc46b, neutral: 0xfff1d6, cold: 0xdfefff }[hw.color] || 0xffc46b;
  } else if (hw.type === 'lock') {
    add(cyl(9.5, 6, 'z', it.x + it.w / 2, top - 40, front + 3, MAT.chrome), 'attach');
  } else if (hw.type === 'hanger') {
    for (const x of [it.x + 20, it.x + it.w - 60]) add(box(x, top - 70, it.z + 2, 40, 60, 25, MAT.plastic));
  } else if (hw.type === 'shelfPins') {
    for (const x of [it.x - 4, it.x + it.w - 4]) for (const z of [it.z + 37, it.z + it.d - 37]) add(cyl(2.5, 12, 'x', x + 4, it.y - 3, z, MAT.chrome));
  } else if (hw.type === 'grommet') {
    const ax = thinAxis(it), dia = +hw.dia || 60;
    if (ax === 'y') add(cyl(dia / 2 + 4, 3, 'y', it.x + it.w / 2, top + 1.5, it.z + it.d - Math.min(100, it.d / 2), MAT.plastic));
  }
  return out;
}

export function describeHw(hw, it) {
  const t = T[hw.type], parts = [];
  if (t.cat === 'hinges') parts.push(F.side.options.find(o => o[0] === hw.side)[1], `${hardwareCount(hw, it)} шт.`, hw.angle ? hw.angle + '°' : '');
  if (hw.type === 'gasLift') parts.push(hw.dir === 'down' ? 'вниз' : 'вверх', hw.force + ' Н', hw.sides === 'LR' ? '2 шт.' : '1 шт.');
  if (t.cat === 'slides' && t.motion) parts.push(+hw.len > 0 ? hw.len + ' мм' : 'по ящику', t.ext === 1 ? 'полное' : '3/4');
  if (t.cat === 'sliding' && hw.slideDir) parts.push(hw.slideDir === 'L' ? 'влево' : 'вправо');
  if (hw.type === 'handleBar' || hw.type === 'handleEdge') parts.push(hw.centers + ' мм');
  if (t.cat === 'legs') parts.push(`${hw.legCount || 4} шт.`, hw.type === 'castor' ? 'Ø' + hw.size : 'h ' + hw.height);
  return t.name + (parts.filter(Boolean).length ? ' — ' + parts.filter(Boolean).join(', ') : '');
}
