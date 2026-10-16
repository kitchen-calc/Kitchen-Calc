// Техника: каталог (модели из магазинов Узбекистана и типовые размеры), 3D-вид и как открывается.
// Все размеры в мм: w — ширина, h — высота, d — глубина (габарит, как в паспорте). Для встраиваемой — ниша niche [ш, в, г],
// для варочных панелей — вырез cut [ш, г]. src: 'shop' — размеры по карточкам магазинов, 'std' — типовой размер класса.
// Модель строится в своих координатах: x 0…w, y 0…h, z 0…d, лицевая сторона — z = d (к нам).
import * as THREE from 'three';

export const APP_CATS = [
  ['fridge', 'Холодильники'], ['freezer', 'Морозильники, винные шкафы'], ['stove', 'Плиты'], ['oven', 'Духовые шкафы'],
  ['hob', 'Варочные панели'], ['hood', 'Вытяжки'], ['micro', 'Микроволновки'], ['dish', 'Посудомоечные'],
  ['wash', 'Стиральные и сушильные'], ['coffee', 'Кофемашины'], ['small', 'Мелкая техника'], ['tv', 'Телевизоры'],
  ['climate', 'Кондиционеры, обогрев'], ['water', 'Котлы, водонагреватели'], ['home', 'Пылесосы, кулеры, фильтры'],
];
export const MOUNTS = { free: 'отдельностоящая', bi: 'встраиваемая', table: 'настольная', wall: 'настенная' };

// ---------------------------------------------------------------- каталог
export const APPLIANCES = [], APP = {};
let seq = 0;
function A(cat, mount, name, w, h, d, shape, o = {}) {
  const e = { id: 'a' + (++seq), cat, mount, name, w, h, d, shape, src: o.src || 'std', ...o };
  APPLIANCES.push(e); APP[e.id] = e; return e;
}
const S = { src: 'shop' };
// Холодильники отдельностоящие
const frOpen = (side = 'R') => `двери на ${side === 'R' ? 'правых' : 'левых'} петлях (перенавешиваются), открываются на 110°; спереди нужно ≥ 60 см свободного места, сбоку со стороны петель — ≥ 5 см для открывания`;
A('fridge', 'free', 'Artel HD 455 RWENE (No Frost, 350 л)', 595, 1952, 660, 'fridge', { ...S, brand: 'Artel', layout: 'bottom', open: frOpen() });
A('fridge', 'free', 'Artel HD 345 RN (265 л)', 555, 1765, 600, 'fridge', { ...S, brand: 'Artel', layout: 'bottom', open: frOpen() });
A('fridge', 'free', 'Artel HS 228 RN (однокамерный)', 555, 1260, 572, 'fridge', { ...S, brand: 'Artel', layout: 'single', open: frOpen() });
A('fridge', 'free', 'Artel HS 117 RN (мини, 82 л)', 450, 820, 470, 'fridge', { ...S, brand: 'Artel', layout: 'single', open: frOpen() });
A('fridge', 'free', 'Shivaki HD 345 RN (265 л)', 554, 1765, 600, 'fridge', { ...S, brand: 'Shivaki', layout: 'bottom', open: frOpen() });
A('fridge', 'free', 'Samsung RB37A5000WW (367 л)', 595, 2010, 647, 'fridge', { ...S, brand: 'Samsung', layout: 'bottom', open: frOpen() });
A('fridge', 'free', 'Samsung RB38T600ESA (390 л)', 595, 2030, 658, 'fridge', { ...S, brand: 'Samsung', layout: 'bottom', finish: 'inox', open: frOpen() });
A('fridge', 'free', 'LG GA-B509 (DoorCooling)', 595, 2030, 682, 'fridge', { ...S, brand: 'LG', layout: 'bottom', finish: 'graphite', open: frOpen() });
A('fridge', 'free', 'Atlant ХМ-4421 (No Frost)', 595, 1865, 625, 'fridge', { ...S, brand: 'Atlant', layout: 'bottom', open: frOpen() });
A('fridge', 'free', 'Atlant ХМ-4626', 595, 2068, 629, 'fridge', { ...S, brand: 'Atlant', layout: 'bottom', open: frOpen() });
A('fridge', 'free', 'Atlant МХМ-2835 (морозилка сверху)', 600, 1630, 630, 'fridge', { ...S, brand: 'Atlant', layout: 'top', open: frOpen() });
A('fridge', 'free', 'Atlant МХ 2822 (однокамерный)', 600, 1310, 600, 'fridge', { ...S, brand: 'Atlant', layout: 'single', open: frOpen() });
A('fridge', 'free', 'Beko RCNK356E21W', 595, 2010, 600, 'fridge', { ...S, brand: 'Beko', layout: 'bottom', open: frOpen() });
A('fridge', 'free', 'Bosch KGN39VI35', 595, 2035, 663, 'fridge', { ...S, brand: 'Bosch', layout: 'bottom', finish: 'inox', open: frOpen() });
A('fridge', 'free', 'Haier HRF-541DG7RU (Side-by-Side, 504 л)', 908, 1775, 647, 'fridge', { ...S, brand: 'Haier', layout: 'sbs', finish: 'beige', open: 'две двери: левая (морозильная) на левых петлях, правая — на правых; нужно ≥ 70 см спереди' });
A('fridge', 'free', 'LG GC-B257 (Side-by-Side, 643 л)', 913, 1790, 735, 'fridge', { ...S, brand: 'LG', layout: 'sbs', finish: 'graphite', open: 'две двери: левая на левых петлях, правая на правых; нужно ≥ 70 см спереди' });
A('fridge', 'free', 'Side-by-Side 91 см (типовой)', 910, 1780, 710, 'fridge', { layout: 'sbs', finish: 'inox', open: 'две двери в разные стороны; нужно ≥ 70 см спереди' });
A('fridge', 'free', 'French Door, 4 двери (типовой)', 835, 1800, 700, 'fridge', { layout: 'french', finish: 'inox', open: 'две верхние двери в разные стороны, снизу — выдвижные ящики морозилки' });
A('fridge', 'free', 'Двухкамерный 60 см (типовой)', 600, 1850, 630, 'fridge', { layout: 'bottom', open: frOpen() });
A('fridge', 'free', 'Двухкамерный узкий 55 см (типовой)', 550, 1750, 600, 'fridge', { layout: 'bottom', open: frOpen() });
A('fridge', 'free', 'Однокамерный 60×150 (типовой)', 600, 1500, 620, 'fridge', { layout: 'single', open: frOpen() });
A('fridge', 'free', 'Мини-холодильник 45 см (типовой)', 450, 850, 450, 'fridge', { layout: 'single', open: frOpen() });
// Встраиваемые холодильники — дверь закрывается мебельным фасадом
const biFr = 'двери на правых петлях (перенавешиваются); мебельный фасад крепится к двери холодильника — по паспорту на скользящих или неподвижных петлях';
A('fridge', 'bi', 'Bosch KIV86VFE1 (встраиваемый)', 541, 1772, 545, 'fridge', { ...S, brand: 'Bosch', layout: 'built', niche: [560, 1775, 550], open: biFr });
A('fridge', 'bi', 'Electrolux ENN92841AW (встраиваемый)', 540, 1769, 549, 'fridge', { ...S, brand: 'Electrolux', layout: 'built', niche: [560, 1780, 550], open: biFr });
A('fridge', 'bi', 'Liebherr ICUN 3324 (встраиваемый)', 559, 1770, 546, 'fridge', { ...S, brand: 'Liebherr', layout: 'built', niche: [560, 1772, 550], open: biFr });
A('fridge', 'bi', 'Встраиваемый 178 см (типовой)', 540, 1770, 545, 'fridge', { layout: 'built', niche: [560, 1780, 550], open: biFr });
A('fridge', 'bi', 'Встраиваемый под столешницу 82 см (типовой)', 596, 818, 545, 'fridge', { layout: 'builtSingle', niche: [600, 820, 550], open: biFr });
// Морозильники, лари, винные шкафы
A('freezer', 'free', 'Atlant М 7204-100 (морозильник, 243 л)', 595, 1765, 625, 'fridge', { ...S, brand: 'Atlant', layout: 'single', open: frOpen() });
A('freezer', 'free', 'Морозильник 60×150 (типовой)', 600, 1500, 620, 'fridge', { layout: 'single', open: frOpen() });
A('freezer', 'free', 'Морозильник компактный 50 см (типовой)', 500, 850, 560, 'fridge', { layout: 'single', open: frOpen() });
A('freezer', 'free', 'Морозильный ларь 200 л (типовой)', 900, 850, 560, 'chest', { open: 'крышка поднимается вверх на петлях сзади; над ларём нужно ≥ 60 см свободного места' });
A('freezer', 'free', 'Морозильный ларь 300 л (типовой)', 1100, 850, 600, 'chest', { open: 'крышка поднимается вверх на петлях сзади' });
A('freezer', 'free', 'Морозильный ларь 400 л (типовой)', 1300, 850, 650, 'chest', { open: 'крышка поднимается вверх на петлях сзади' });
A('freezer', 'bi', 'Винный шкаф под столешницу 60 см (типовой)', 595, 820, 570, 'wine', { niche: [600, 820, 580], open: 'стеклянная дверь на правых петлях' });
A('freezer', 'free', 'Винный шкаф 18 бутылок (типовой)', 345, 830, 500, 'wine', { open: 'стеклянная дверь на правых петлях' });
// Плиты
const stOpen = 'дверца духовки откидывается вниз на 90° (выступает вперёд примерно на её высоту); ящик снизу выдвигается';
A('stove', 'free', 'Artel Apetito 50 10-G (газ)', 500, 850, 570, 'stove', { ...S, brand: 'Artel', fuel: 'gas', burners: 4, open: stOpen });
A('stove', 'free', 'Artel Apetito 60 00-G (газ)', 600, 850, 600, 'stove', { ...S, brand: 'Artel', fuel: 'gas', burners: 4, open: stOpen });
A('stove', 'free', 'Artel Ottima 50 G (газ)', 500, 850, 570, 'stove', { ...S, brand: 'Artel', fuel: 'gas', burners: 4, open: stOpen });
A('stove', 'free', 'Artel Milagro 00-K (комбинированная)', 600, 850, 600, 'stove', { ...S, brand: 'Artel', fuel: 'gas', burners: 4, finish: 'inox', open: stOpen });
A('stove', 'free', 'Beko FSE62134DCR (электро)', 600, 850, 600, 'stove', { ...S, brand: 'Beko', fuel: 'el', burners: 4, open: stOpen });
A('stove', 'free', 'Beko FSM57300GX (комби, 50 см)', 500, 850, 600, 'stove', { ...S, brand: 'Beko', fuel: 'gas', burners: 4, finish: 'inox', open: stOpen });
A('stove', 'free', 'Beko FSM62330DXT (комби, 72 л)', 600, 850, 600, 'stove', { ...S, brand: 'Beko', fuel: 'gas', burners: 4, finish: 'inox', open: stOpen });
A('stove', 'free', 'Gorenje GI 92293 AX (90 см, 5 конфорок)', 900, 870, 600, 'stove', { ...S, brand: 'Gorenje', fuel: 'gas', burners: 5, finish: 'inox', open: stOpen });
A('stove', 'free', 'Газовая плита 50 см (типовая)', 500, 850, 600, 'stove', { fuel: 'gas', burners: 4, open: stOpen });
A('stove', 'free', 'Газовая плита 60 см (типовая)', 600, 850, 600, 'stove', { fuel: 'gas', burners: 4, open: stOpen });
A('stove', 'free', 'Электроплита 50 см (типовая)', 500, 850, 600, 'stove', { fuel: 'el', burners: 4, open: stOpen });
A('stove', 'table', 'Настольная газовая плита, 2 конфорки (типовая)', 520, 95, 310, 'tablehob', { fuel: 'gas', burners: 2, open: 'не открывается' });
A('stove', 'table', 'Электроплитка, 1 конфорка (типовая)', 280, 80, 300, 'tablehob', { fuel: 'el', burners: 1, open: 'не открывается' });
A('stove', 'table', 'Индукционная плитка настольная (типовая)', 285, 60, 360, 'tablehob', { fuel: 'ind', burners: 1, open: 'не открывается' });
A('stove', 'table', 'Мини-печь (электродуховка) 30 л (типовая)', 520, 330, 400, 'minioven', { open: 'дверца откидывается вниз; сверху нужно ≥ 10 см для вентиляции' });
// Духовые шкафы
const ovOpen = 'дверца откидывается вниз на 90°; лицевая рамка закрывает торцы шкафа, корпус уходит в нишу';
A('oven', 'bi', 'Bosch HBF534EB0R (66 л)', 594, 595, 548, 'ovenbi', { ...S, brand: 'Bosch', finish: 'black', niche: [560, 575, 550], open: ovOpen });
A('oven', 'bi', 'Духовой шкаф 60 см (типовой)', 595, 595, 560, 'ovenbi', { finish: 'inox', niche: [560, 590, 550], open: ovOpen });
A('oven', 'bi', 'Компактный духовой шкаф 45 см / с СВЧ (типовой)', 595, 455, 550, 'ovenbi', { finish: 'black', niche: [560, 450, 550], open: ovOpen });
A('oven', 'bi', 'Шкаф для подогрева посуды 14 см (типовой)', 595, 140, 550, 'warmer', { finish: 'black', niche: [560, 140, 550], open: 'выдвигается на себя как ящик' });
// Варочные панели — сверху на столешнице, корпус уходит в вырез
const hobOpen = 'не открывается; стоит на столешнице, корпус уходит в вырез';
A('hob', 'bi', 'Bosch PUE611BB5E (индукция, 60 см)', 592, 51, 522, 'hob', { ...S, brand: 'Bosch', fuel: 'ind', burners: 4, cut: [560, 490], open: hobOpen });
A('hob', 'bi', 'Газовая панель 60 см, 4 конфорки (типовая)', 590, 45, 510, 'hob', { fuel: 'gas', burners: 4, finish: 'inox', cut: [560, 480], open: hobOpen });
A('hob', 'bi', 'Газовая панель на стекле 60 см (типовая)', 590, 45, 510, 'hob', { fuel: 'gas', burners: 4, finish: 'black', cut: [560, 480], open: hobOpen });
A('hob', 'bi', 'Газовая панель 45 см, 3 конфорки (типовая)', 450, 45, 510, 'hob', { fuel: 'gas', burners: 3, finish: 'inox', cut: [430, 480], open: hobOpen });
A('hob', 'bi', 'Газовая панель 75 см, 5 конфорок (типовая)', 750, 45, 510, 'hob', { fuel: 'gas', burners: 5, finish: 'inox', cut: [560, 480], open: hobOpen });
A('hob', 'bi', 'Газовая панель 90 см, 5 конфорок (типовая)', 900, 45, 510, 'hob', { fuel: 'gas', burners: 5, finish: 'black', cut: [860, 480], open: hobOpen });
A('hob', 'bi', 'Стеклокерамика 60 см (типовая)', 590, 45, 520, 'hob', { fuel: 'el', burners: 4, cut: [560, 490], open: hobOpen });
A('hob', 'bi', 'Индукция 80 см (типовая)', 800, 55, 520, 'hob', { fuel: 'ind', burners: 4, cut: [750, 490], open: hobOpen });
A('hob', 'bi', 'Домино 30 см, газ (типовое)', 300, 45, 510, 'hob', { fuel: 'gas', burners: 2, finish: 'inox', cut: [270, 490], open: hobOpen });
A('hob', 'bi', 'Домино 30 см, индукция (типовое)', 300, 55, 520, 'hob', { fuel: 'ind', burners: 2, cut: [270, 490], open: hobOpen });
// Вытяжки
A('hood', 'bi', 'Встраиваемая телескопическая 60 см (типовая)', 598, 180, 290, 'hood', { kind: 'tele', finish: 'inox', niche: [560, 180, 290], open: 'передняя панель выдвигается на ~17 см — вытяжка включается; ставится в дно навесного шкафа' });
A('hood', 'bi', 'Встраиваемая телескопическая 50 см (типовая)', 498, 180, 290, 'hood', { kind: 'tele', finish: 'inox', niche: [460, 180, 290], open: 'передняя панель выдвигается на ~17 см' });
A('hood', 'bi', 'Полностью встраиваемая 52 см (типовая)', 520, 280, 280, 'hood', { kind: 'box', finish: 'inox', niche: [500, 280, 290], open: 'не открывается; встраивается в навесной шкаф' });
A('hood', 'wall', 'Купольная 60 см (типовая)', 600, 850, 500, 'hood', { kind: 'dome', finish: 'inox', open: 'не открывается; над плитой 65–75 см (газ) / 55–65 см (электро)' });
A('hood', 'wall', 'Купольная 90 см (типовая)', 900, 850, 500, 'hood', { kind: 'dome', finish: 'inox', open: 'не открывается; над плитой 65–75 см' });
A('hood', 'wall', 'Наклонная 60 см (типовая)', 600, 800, 350, 'hood', { kind: 'incl', finish: 'black', open: 'не открывается; над плитой 45–65 см' });
A('hood', 'wall', 'Плоская подвесная 60 см (типовая)', 600, 80, 470, 'hood', { kind: 'flat', finish: 'inox', open: 'не открывается; крепится под навесным шкафом' });
A('hood', 'wall', 'Островная 90 см (типовая)', 900, 750, 600, 'hood', { kind: 'island', finish: 'inox', open: 'не открывается; подвешивается к потолку над островом' });
// Микроволновки
const mwOpen = 'дверца на левых петлях, открывается влево на ~90°; сверху и сзади нужно 10–20 см для вентиляции';
A('micro', 'table', 'Samsung ME83KRW-1 (23 л)', 489, 275, 356, 'micro', { ...S, brand: 'Samsung', open: mwOpen });
A('micro', 'table', 'LG MS2042DB (20 л)', 455, 252, 320, 'micro', { ...S, brand: 'LG', finish: 'black', open: mwOpen });
A('micro', 'table', 'Midea MM720CKE (20 л)', 440, 258, 330, 'micro', { ...S, brand: 'Midea', open: mwOpen });
A('micro', 'table', 'Микроволновка 25 л (типовая)', 485, 290, 400, 'micro', { finish: 'black', open: mwOpen });
A('micro', 'table', 'Микроволновка 30 л с конвекцией (типовая)', 520, 310, 450, 'micro', { finish: 'inox', open: mwOpen });
A('micro', 'bi', 'Bosch BFL524MS0 (встраиваемая, 20 л)', 594, 382, 317, 'microbi', { ...S, brand: 'Bosch', finish: 'inox', niche: [560, 362, 300], open: 'дверца на левых петлях; рамка закрывает торцы шкафа' });
A('micro', 'bi', 'Встраиваемая СВЧ 38 см (типовая)', 595, 382, 320, 'microbi', { finish: 'black', niche: [560, 362, 300], open: 'дверца на левых петлях' });
// Посудомоечные
const dwOpen = 'дверь откидывается вниз на 90°, корзины выдвигаются на себя; спереди нужно ≥ 60 см';
A('dish', 'free', 'Bosch SMS25AW01R (60 см, 12 компл.)', 600, 845, 600, 'dish', { ...S, brand: 'Bosch', open: dwOpen });
A('dish', 'free', 'Midea MFD45S100W (45 см, 9 компл.)', 448, 845, 610, 'dish', { ...S, brand: 'Midea', open: dwOpen });
A('dish', 'bi', 'Встраиваемая 60 см (типовая)', 598, 815, 550, 'dish', { integrated: true, niche: [600, 815, 550], open: dwOpen + '; мебельный фасад ~598×700 крепится к двери машины' });
A('dish', 'bi', 'Встраиваемая 45 см (типовая)', 448, 815, 550, 'dish', { integrated: true, niche: [450, 815, 550], open: dwOpen + '; мебельный фасад ~448×700 крепится к двери машины' });
A('dish', 'table', 'Настольная компактная, 6 компл. (типовая)', 550, 438, 500, 'dish', { open: 'дверь откидывается вниз' });
// Стиральные и сушильные
const wmOpen = 'люк на левых петлях, открывается на ~180°; спереди нужно ≥ 50 см, глубина с открытым люком ≈ +45 см';
A('wash', 'free', 'Artel TG 60 F (полуавтомат, 6 кг)', 735, 880, 435, 'twintub', { ...S, brand: 'Artel', open: 'две крышки сверху (стирка и отжим) поднимаются назад; сверху нужно ≥ 50 см' });
A('wash', 'free', 'Artel WF60F010AW (6 кг)', 600, 850, 450, 'washer', { brand: 'Artel', open: wmOpen, note: 'ширина и высота — по объявлению, глубина — типовая для узких 6 кг' });
A('wash', 'free', 'Samsung WW60J42E0HW (6 кг)', 600, 850, 450, 'washer', { brand: 'Samsung', open: wmOpen, note: 'глубина — класс «стандартная 43–50 см»' });
A('wash', 'free', 'LG F2J3NS0W (6,5 кг)', 600, 850, 440, 'washer', { brand: 'LG', open: wmOpen });
A('wash', 'free', 'Стиральная машина 7–9 кг, полноразмерная (типовая)', 600, 850, 600, 'washer', { open: wmOpen });
A('wash', 'free', 'Стиральная машина узкая 40 см (типовая)', 600, 850, 400, 'washer', { open: wmOpen });
A('wash', 'free', 'Стиральная машина супер-узкая 34 см (типовая)', 600, 850, 340, 'washer', { open: wmOpen });
A('wash', 'free', 'С вертикальной загрузкой (типовая)', 400, 850, 600, 'topload', { open: 'крышка сверху поднимается назад, внутри открываются створки барабана; сверху нужно ≥ 40 см' });
A('wash', 'bi', 'Встраиваемая стиральная машина (типовая)', 595, 820, 545, 'washer', { integrated: true, niche: [600, 820, 580], open: 'люк на левых петлях; мебельный фасад крепится к машине' });
A('wash', 'free', 'Компактная под мойку (типовая)', 510, 700, 440, 'washer', { open: wmOpen });
A('wash', 'free', 'Samsung DV90T5240AT (сушильная, 9 кг)', 600, 850, 600, 'washer', { ...S, brand: 'Samsung', dryer: true, open: 'дверца на петлях (перенавешивается); глубина с открытой дверцей ≈ 1100 мм' });
A('wash', 'free', 'Сушильная машина (типовая)', 600, 850, 600, 'washer', { dryer: true, open: 'дверца на петлях; ставится рядом или колонной на стиральную' });
// Кофемашины
A('coffee', 'table', 'DeLonghi Magnifica S ECAM 22.110', 238, 351, 430, 'coffee', { ...S, brand: 'DeLonghi', finish: 'black', open: 'отсек для зёрен — крышка сверху, поддон выдвигается вперёд; сверху нужно ~10 см' });
A('coffee', 'table', 'Капсульная кофемашина (типовая)', 120, 250, 330, 'coffee', { finish: 'black', open: 'рычаг для капсулы сверху' });
A('coffee', 'table', 'Рожковая кофеварка (типовая)', 300, 300, 280, 'coffee', { finish: 'inox', open: 'рожок вставляется спереди' });
A('coffee', 'table', 'Капельная кофеварка (типовая)', 200, 350, 250, 'coffee', { finish: 'black', open: 'крышка сверху' });
A('coffee', 'bi', 'Встраиваемая кофемашина 45 см (типовая)', 595, 455, 385, 'ovenbi', { finish: 'black', niche: [560, 450, 550], coffeeFront: true, open: 'фронтальная панель; блок обслуживания выдвигается' });
// Мелкая техника
A('small', 'table', 'Электрочайник 1,7 л (типовой)', 230, 250, 160, 'kettle', { open: 'крышка откидывается вверх' });
A('small', 'table', 'Термопот 5 л (типовой)', 230, 330, 280, 'kettle', { pot: true, open: 'крышка откидывается вверх' });
A('small', 'table', 'Philips HD2581 (тостер)', 275, 188, 156, 'toaster', { ...S, brand: 'Philips', open: 'не открывается' });
A('small', 'table', 'Тостер на 4 ломтика (типовой)', 380, 190, 200, 'toaster', { open: 'не открывается' });
A('small', 'table', 'Philips HR2041 (блендер)', 164, 377, 192, 'blender', { ...S, brand: 'Philips', open: 'чаша снимается вверх' });
A('small', 'table', 'KitchenAid 5KSM175 (планетарный миксер)', 221, 358, 371, 'mixer', { brand: 'KitchenAid', open: 'голова откидывается вверх-назад; сверху нужно ~20 см' });
A('small', 'table', 'Redmond RMC-M90 (мультиварка)', 230, 265, 270, 'cooker', { ...S, brand: 'Redmond', open: 'крышка откидывается вверх; сверху нужно ~25 см' });
A('small', 'table', 'Мультиварка 5 л (типовая)', 300, 280, 380, 'cooker', { open: 'крышка откидывается вверх' });
A('small', 'table', 'Аэрогриль (аэрофритюрница) 4 л (типовой)', 290, 320, 370, 'airfryer', { finish: 'black', open: 'корзина выдвигается вперёд' });
A('small', 'table', 'Хлебопечка (типовая)', 260, 380, 390, 'breadmaker', { open: 'крышка откидывается вверх' });
A('small', 'table', 'Кухонный комбайн (типовой)', 280, 400, 230, 'blender', { open: 'чаша и крышка снимаются' });
A('small', 'table', 'Мясорубка электрическая (типовая)', 190, 330, 320, 'grinder', { open: 'не открывается' });
A('small', 'table', 'Соковыжималка шнековая (типовая)', 200, 420, 200, 'blender', { open: 'не открывается' });
A('small', 'table', 'Электрогриль контактный (типовой)', 330, 160, 370, 'grill', { finish: 'black', open: 'верхняя плита откидывается вверх' });
A('small', 'table', 'Вафельница / сэндвичница (типовая)', 230, 100, 250, 'grill', { finish: 'black', open: 'крышка откидывается вверх' });
A('small', 'table', 'Рисоварка (типовая)', 280, 260, 280, 'cooker', { open: 'крышка откидывается вверх' });
A('small', 'table', 'Кофемолка (типовая)', 90, 180, 90, 'kettle', { round: true, open: 'крышка снимается' });
// Телевизоры: экран 16:9 — ширина ≈ 0,872 × диагональ, высота ≈ 0,49 × диагональ, рамка ~1 см
A('tv', 'wall', 'Artel UA43H3502 (43")', 962, 558, 80, 'tv', { ...S, brand: 'Artel', open: 'на подставке высота 615 мм и глубина 230 мм; крепление VESA 200×200' });
for (const dg of [24, 32, 40, 43, 50, 55, 65, 75, 85]) {
  const W = Math.round(dg * 25.4 * 0.872 + 20), H = Math.round(dg * 25.4 * 0.49 + 20);
  A('tv', 'wall', `Телевизор ${dg}" (типовой)`, W, H, dg >= 65 ? 60 : 80, 'tv', { open: `на подставке: высота +${dg >= 55 ? 80 : 60} мм, глубина опоры ~${dg >= 55 ? 280 : 200} мм` });
}
// Кондиционеры и обогрев
A('climate', 'wall', 'Кондиционер 7–9 тыс. BTU, внутренний блок (типовой)', 750, 260, 200, 'ac', { open: 'шторка жалюзи опускается при работе; до потолка ≥ 10–15 см' });
A('climate', 'wall', 'Кондиционер 12 тыс. BTU, внутренний блок (типовой)', 820, 280, 205, 'ac', { open: 'шторка опускается при работе' });
A('climate', 'wall', 'Кондиционер 18 тыс. BTU, внутренний блок (типовой)', 950, 300, 220, 'ac', { open: 'шторка опускается при работе' });
A('climate', 'wall', 'Кондиционер 24 тыс. BTU, внутренний блок (типовой)', 1080, 320, 235, 'ac', { open: 'шторка опускается при работе' });
A('climate', 'free', 'Колонный кондиционер (типовой)', 500, 1750, 330, 'column', { open: 'не открывается' });
A('climate', 'free', 'Мобильный кондиционер (типовой)', 450, 760, 380, 'column', { open: 'не открывается; нужен вывод шланга' });
A('climate', 'wall', 'Наружный блок 9–12 тыс. BTU (типовой)', 720, 540, 260, 'outdoor', { open: 'не открывается' });
A('climate', 'free', 'Масляный радиатор (типовой)', 420, 640, 160, 'radiator', { open: 'не открывается' });
// Котлы и водонагреватели
const blOpen = 'не открывается; снизу нужно ≥ 25–30 см под трубы, сбоку ≥ 5 см для обслуживания';
A('water', 'wall', 'Navien Deluxe 24K (газовый котёл)', 440, 695, 265, 'boiler', { ...S, brand: 'Navien', open: blOpen });
A('water', 'wall', 'Navien Deluxe S Coaxial 24K', 400, 655, 255, 'boiler', { ...S, brand: 'Navien', open: blOpen });
A('water', 'wall', 'Baxi ECO Nova 24 F', 400, 704, 300, 'boiler', { ...S, brand: 'Baxi', open: blOpen });
A('water', 'wall', 'Ariston 24 кВт (настенный котёл)', 400, 745, 319, 'boiler', { ...S, brand: 'Ariston', open: blOpen });
A('water', 'free', 'Напольный газовый котёл (типовой)', 400, 850, 600, 'boiler', { floor: true, open: 'не открывается' });
A('water', 'wall', 'Газовая колонка (типовая)', 350, 600, 180, 'boiler', { geyser: true, open: blOpen });
A('water', 'wall', 'Ariston ABS VLS PRO R 100 (плоский, 100 л)', 511, 1256, 275, 'heater', { ...S, brand: 'Ariston', flat: true, open: 'не открывается; снизу ≥ 30 см под подводку' });
A('water', 'wall', 'Ariston PRO1 R ABS 50 V SLIM (50 л)', 383, 837, 353, 'heater', { ...S, brand: 'Ariston', open: 'не открывается' });
A('water', 'wall', 'Водонагреватель 80 л, круглый (типовой)', 450, 780, 470, 'heater', { open: 'не открывается' });
A('water', 'wall', 'Водонагреватель 100 л, круглый (типовой)', 450, 950, 470, 'heater', { open: 'не открывается' });
A('water', 'wall', 'Водонагреватель 80 л, горизонтальный (типовой)', 870, 450, 470, 'heater', { horiz: true, open: 'не открывается' });
A('water', 'wall', 'Водонагреватель 10–15 л, над мойкой (типовой)', 360, 370, 300, 'heater', { flat: true, open: 'не открывается' });
// Пылесосы, кулеры, фильтры
A('home', 'free', 'Робот-пылесос (типовой)', 350, 95, 350, 'robot', { open: 'под мебелью нужен зазор ≥ 10 см' });
A('home', 'free', 'Робот-пылесос со станцией (типовой)', 330, 430, 450, 'station', { open: 'спереди станции нужно ≥ 50 см свободного пола' });
A('home', 'free', 'Вертикальный пылесос на станции (типовой)', 260, 1200, 220, 'stick', { open: 'не открывается' });
A('home', 'free', 'Пылесос с контейнером (типовой)', 280, 300, 420, 'vacuum', { open: 'не открывается' });
A('home', 'free', 'Кулер для воды напольный (типовой)', 310, 1000, 320, 'cooler', { open: 'бутыль 19 л сверху — над кулером нужно ≥ 50 см' });
A('home', 'table', 'Кулер для воды настольный (типовой)', 300, 500, 330, 'cooler', { small: true, open: 'бутыль сверху' });
A('home', 'bi', 'Фильтр обратного осмоса под мойку (типовой)', 380, 420, 140, 'filter', { open: 'ставится в шкаф под мойкой' });
A('home', 'bi', 'Измельчитель пищевых отходов (типовой)', 200, 350, 200, 'disposer', { open: 'крепится под мойкой' });

// ---------------------------------------------------------------- коробка для столкновений и размещения
// Для встраиваемой духовки/СВЧ: в ниши входит корпус, лицевая рамка (шире ниши) — снаружи; для варочной панели — только стекло на столешнице.
export function appBox(e) {
  if (['ovenbi', 'microbi'].includes(e.shape) && e.niche) {
    const bw = Math.min(e.w - 30, e.niche[0] - 4), bh = Math.min(e.h - 8, e.niche[1] - 2), ft = 22;
    return { w: bw, h: bh, d: e.d - ft, ox: (e.w - bw) / 2, oy: (e.h - bh) / 2, oz: 0 };
  }
  if (e.shape === 'hob') return { w: e.w, h: 6, d: e.d, ox: 0, oy: e.h - 6, oz: 0 };
  if (e.shape === 'hood' && e.kind === 'tele') return { w: e.w, h: e.h, d: e.d, ox: 0, oy: 0, oz: 0 };
  return { w: e.w, h: e.h, d: e.d, ox: 0, oy: 0, oz: 0 };
}
export function appInfo(e) {
  const out = [`Габарит ${e.w} × ${e.h} × ${e.d} мм (Ш × В × Г) — ${MOUNTS[e.mount]}`];
  if (e.niche) out.push(`Ниша: ${e.niche[0]} × ${e.niche[1]} × ${e.niche[2]} мм`);
  if (e.cut) out.push(`Вырез в столешнице: ${e.cut[0]} × ${e.cut[1]} мм`);
  if (e.open) out.push('Как открывается: ' + e.open);
  const r = frontReach(e);
  if (r > 20) out.push(`Открытая выступает вперёд на ≈ ${r} мм (по модели)`);
  if (e.note) out.push(e.note);
  out.push(e.src === 'shop' ? 'Размеры — по карточкам магазинов; перед заказом мебели сверьте с паспортом модели' : e.src === 'own' ? 'Размеры заданы вручную' : 'Типовой размер класса; размеры конкретной модели сверьте с паспортом');
  return out;
}

// ---------------------------------------------------------------- 3D
const FIN = { white: 0xf2f2ef, inox: 0xc9ccce, black: 0x232425, beige: 0xe8dcc4, graphite: 0x4a4c4f, silver: 0xb8bbbe };
export const FINISHES = [['white', 'белый'], ['inox', 'нержавейка'], ['black', 'чёрный'], ['beige', 'бежевый'], ['graphite', 'графит'], ['silver', 'серебристый']];
export const finishColor = f => '#' + (FIN[f] ?? FIN.white).toString(16).padStart(6, '0');
const matCache = new Map();
function M(key, color, o = {}) {
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0, ...o }));
  return matCache.get(key);
}
const mats = fin => ({
  body: M('b' + fin, FIN[fin] ?? FIN.white, fin === 'inox' || fin === 'silver' ? { metalness: 0.2, roughness: 0.3 } : { roughness: 0.4 }),
  liner: M('liner', 0xf3f3f0, { roughness: 0.55 }),                 // белый пластик внутри холодильника
  enamel: M('enamel', 0x2a2c2f, { roughness: 0.45 }),               // эмаль духовки
  steel: M('steel', 0xbfc4c7, { metalness: 0.2, roughness: 0.35 }),  // нержавейка внутри посудомойки, барабан
  dark: M('dark', 0x1b1c1e, { roughness: 0.35 }),
  glass: M('glass', 0x15181b, { roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.88 }),
  clear: M('clear', 0xbfd8e2, { roughness: 0.05, transparent: true, opacity: 0.35, depthWrite: false }),
  chrome: M('chrome', 0xd9dbdd, { metalness: 0.6, roughness: 0.22 }),
  grate: M('grate', 0x2a2a2a, { roughness: 0.6 }),
  burner: M('burner', 0x3b3b3b, { roughness: 0.5 }),
  ring: M('ring', 0x8b2b1f, { roughness: 0.5, emissive: 0x220000 }),
  screen: M('screen', 0x08090a, { roughness: 0.15, metalness: 0.1 }),
  plastic: M('plastic', 0x2c2d2f, { roughness: 0.7 }),
  rubber: M('rubber', 0x101010, { roughness: 0.9 }),
  white: M('white', 0xf4f4f2, { roughness: 0.4 }),
  water: M('water', 0x7fb6dc, { roughness: 0.1, transparent: true, opacity: 0.55 }),
  led: M('led', 0x9fd4ff, { emissive: 0x2a6fa8, roughness: 0.3 }),
});
const unit = new THREE.BoxGeometry(1, 1, 1);
function box(g, x0, y0, z0, w, h, d, m) { const o = new THREE.Mesh(unit, m); o.scale.set(Math.max(w, 0.5), Math.max(h, 0.5), Math.max(d, 0.5)); o.position.set(x0 + w / 2, y0 + h / 2, z0 + d / 2); g.add(o); return o; }
function cyl(g, r, len, axis, cx, cy, cz, m, r2 = r, seg = 28) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r2, r, len, seg), m);
  if (axis === 'x') o.rotation.z = Math.PI / 2; if (axis === 'z') o.rotation.x = Math.PI / 2;
  o.position.set(cx, cy, cz); g.add(o); return o;
}
function torus(g, R, r, cx, cy, cz, m) { const o = new THREE.Mesh(new THREE.TorusGeometry(R, r, 12, 40), m); o.position.set(cx, cy, cz); g.add(o); return o; }
// подвижная часть: группа с движением (поворот вокруг оси через точку или сдвиг)
function part(g, motion) { const p = new THREE.Group(); p.userData.motion = motion; g.add(p); return p; }
const rotY = (x, z, a) => ({ rot: 'y', p: [x, 0, z], a });
const rotX = (y, z, a) => ({ rot: 'x', p: [0, y, z], a });
const D2R = Math.PI / 180;

// Корпус с полостью (видно, когда открыто): снаружи облицовка outer 2 мм, стенки толщиной t и полость — inner.
// Открыта сторона open: 'front' (z = z0 + d) или 'top' (y = y0 + h)
function shell(g, x0, y0, z0, w, h, d, t, outer, inner, open = 'front') {
  const sk = 2;
  box(g, x0, y0, z0, sk, h, d, outer); box(g, x0 + w - sk, y0, z0, sk, h, d, outer); box(g, x0 + sk, y0, z0, w - 2 * sk, h, sk, outer);   // бока и зад снаружи
  box(g, x0 + sk, y0, z0 + sk, t - sk, h, d - sk, inner); box(g, x0 + w - t, y0, z0 + sk, t - sk, h, d - sk, inner);                     // боковые стенки
  box(g, x0 + t, y0, z0 + sk, w - 2 * t, h, t - sk, inner); box(g, x0 + t, y0, z0 + t, w - 2 * t, t, d - t, inner);                       // задняя стенка, дно
  if (open === 'front') { box(g, x0 + t, y0 + h - t, z0 + t, w - 2 * t, t - sk, d - t, inner); box(g, x0 + sk, y0 + h - sk, z0 + sk, w - 2 * sk, sk, d - sk, outer); }
  else { box(g, x0 + t, y0, z0 + d - t, w - 2 * t, h, t - sk, inner); box(g, x0 + sk, y0, z0 + d - sk, w - 2 * sk, h, sk, outer); }     // открыт верх — передняя стенка
}
// Дверь на боковых петлях: hinge 'L' | 'R'; x0..x1, y0..y1, лицевая плоскость корпуса zf; t — толщина двери.
// liner — внутренняя панель двери, balc — балконы на двери (холодильник)
function sideDoor(g, x0, x1, y0, y1, zf, t, hinge, mm, { handle = true, hdl = 'v', glass = null, angle = 110, liner = null, balc = null } = {}) {
  const p = part(g, hinge === 'R' ? rotY(x1, zf, angle * D2R) : rotY(x0, zf, -angle * D2R));
  box(p, x0, y0, zf, x1 - x0, y1 - y0, t, mm.body);
  if (liner) box(p, x0 + 25, y0 + 25, zf - 2, x1 - x0 - 50, y1 - y0 - 50, 2, liner);
  if (balc) { const n = Math.max(1, Math.floor((y1 - y0) / 380)); for (let k = 0; k < n; k++) box(p, x0 + 45, y0 + 70 + k * (y1 - y0 - 100) / n, zf - 62, x1 - x0 - 90, 55, 60, balc); }
  if (glass) box(p, glass[0], glass[1], zf + t, glass[2], glass[3], 2, mm.glass);
  if (handle) {
    const hx = hinge === 'R' ? x0 + 30 : x1 - 50, hl = Math.min(380, (y1 - y0) * 0.45);
    if (hdl === 'v') { const hy = y1 - (y1 - y0) * 0.12 - hl; box(p, hx, hy, zf + t, 20, hl, 6, mm.chrome); box(p, hx, hy, zf + t + 6, 20, 10, 20, mm.chrome); box(p, hx, hy + hl - 10, zf + t + 6, 20, 10, 20, mm.chrome); box(p, hx, hy, zf + t + 20, 20, hl, 8, mm.chrome); }
    else box(p, x0 + (x1 - x0) * 0.25, y1 - 40, zf + t, (x1 - x0) * 0.5, 18, 22, mm.chrome);
  }
  return p;
}
// Дверь, откидывающаяся вниз (духовка, посудомойка): ось — нижняя кромка
function dropDoor(g, x0, x1, y0, y1, zf, t, mm, { window = true, handle = true, angle = 90 } = {}) {
  const p = part(g, rotX(y0, zf, angle * D2R));
  box(p, x0, y0, zf, x1 - x0, y1 - y0, t, mm.body);
  if (window) box(p, x0 + (x1 - x0) * 0.12, y0 + (y1 - y0) * 0.14, zf + t, (x1 - x0) * 0.76, (y1 - y0) * 0.6, 2, mm.glass);
  if (handle) { box(p, x0 + (x1 - x0) * 0.12, y1 - 45, zf + t + 22, (x1 - x0) * 0.76, 14, 12, mm.chrome); for (const k of [0.14, 0.86]) box(p, x0 + (x1 - x0) * k - 6, y1 - 45, zf + t, 12, 14, 24, mm.chrome); }
  return p;
}
// Крышка на петлях сзади (ларь, мультиварка, вертикальная загрузка): ось — задняя верхняя кромка
function lid(g, x0, x1, z0, z1, y, t, m, angle = 100) {
  const p = part(g, rotX(y, z0, -angle * D2R));
  box(p, x0, y, z0, x1 - x0, t, z1 - z0, m);
  return p;
}
function knobs(g, n, x0, x1, y, z, mm) { for (let k = 0; k < n; k++) cyl(g, 15, 22, 'z', x0 + (x1 - x0) * (k + 0.5) / n, y, z + 11, mm.plastic); }
function burnersGas(g, n, w, d, y, mm, inset = 0) {
  const spots = n === 1 ? [[0.5, 0.5]] : n === 2 ? [[0.5, 0.28], [0.5, 0.72]] : n === 3 ? [[0.25, 0.3], [0.25, 0.72], [0.72, 0.5]] : n === 4 ? [[0.27, 0.28], [0.73, 0.28], [0.27, 0.72], [0.73, 0.72]] : [[0.2, 0.28], [0.8, 0.28], [0.2, 0.72], [0.8, 0.72], [0.5, 0.5]];
  for (const [u, v] of spots) {
    const cx = inset + (w - 2 * inset) * u, cz = d * v, r = n === 5 && u === 0.5 ? 55 : 40;
    cyl(g, r, 12, 'y', cx, y + 6, cz, mm.burner); cyl(g, r * 0.55, 6, 'y', cx, y + 14, cz, mm.dark);
    box(g, cx - r - 25, y + 18, cz - 4, 2 * r + 50, 8, 8, mm.grate); box(g, cx - 4, y + 18, cz - r - 25, 8, 8, 2 * r + 50, mm.grate);
  }
}
function burnersFlat(g, n, w, d, y, mm, ind) {
  const spots = n === 1 ? [[0.5, 0.5, 90]] : n === 2 ? [[0.5, 0.3, 80], [0.5, 0.72, 95]] : [[0.27, 0.3, 90], [0.73, 0.3, 75], [0.27, 0.72, 100], [0.73, 0.72, 85]];
  for (const [u, v, r] of spots) { const o = torus(g, r, 2.2, w * u, y + 1, d * v, ind ? M('indring', 0x9a9a9a, { roughness: 0.4 }) : mats('white').ring); o.rotation.x = Math.PI / 2; }
}

const BUILD = {
  fridge(g, e, mm) {
    const { w, h, d } = e, built = /^built/.test(e.layout), t = built ? 22 : 45, hd = built ? 0 : 32, zf = d - t - hd, gap = 4, base = built ? 0 : 20, wt = 40;
    shell(g, 0, base, 0, w, h - base, zf, wt, built ? mm.white : mm.body, mm.liner);   // внутри — камеры с полками
    if (!built) box(g, 30, 0, 40, w - 60, base, zf - 60, mm.plastic);
    const hinge = e.hinge || 'R', fr = { handle: !built, liner: mm.liner, balc: mm.clear }, fzr = { handle: !built, liner: mm.liner };
    const dm = built ? { ...mm, body: mm.white } : mm;
    const L = e.layout, ix0 = wt, ix1 = w - wt, sd = zf - wt - 75;   // полки не доходят до балконов двери
    const shelves = (x0, x1, y0, y1, n) => { for (let k = 1; k <= n; k++) box(g, x0, y0 + (y1 - y0) * k / (n + 1), wt, x1 - x0, 5, sd, mm.clear); };
    const drawers = (x0, x1, y0, y1, n) => { const hh = (y1 - y0 - 12 * (n + 1)) / n; for (let k = 0; k < n; k++) box(g, x0 + 6, y0 + 12 + k * (hh + 12), wt + 8, x1 - x0 - 12, hh, sd - 8, mm.clear); };
    const divider = y => box(g, ix0, y - 25, wt, ix1 - ix0, 50, zf - wt, mm.liner);
    if (L === 'bottom' || L === 'built') {
      const fz = Math.round((h - base) * (L === 'built' ? 0.36 : 0.34)), ys = base + fz + gap / 2;   // снизу морозилка с ящиками, сверху холодильная камера
      sideDoor(g, 0, w, base + fz + gap, h, zf, t, hinge, dm, fr);
      sideDoor(g, 0, w, base, base + fz, zf, t, hinge, dm, fzr);
      divider(ys); drawers(ix0, ix1, base + wt, ys - 25, 3); shelves(ix0, ix1, ys + 25, h - wt, 4);
    } else if (L === 'top') {
      const fz = Math.round((h - base) * 0.27), ys = h - fz - gap / 2;
      sideDoor(g, 0, w, h - fz, h, zf, t, hinge, dm, fzr);
      sideDoor(g, 0, w, base, h - fz - gap, zf, t, hinge, dm, fr);
      divider(ys); shelves(ix0, ix1, ys + 25, h - wt, 1); shelves(ix0, ix1, base + wt, ys - 25, 4);
    } else if (L === 'sbs') {
      const xl = Math.round(w * 0.42);
      sideDoor(g, 0, xl - gap / 2, base, h, zf, t, 'L', dm, fr);
      sideDoor(g, xl + gap / 2, w, base, h, zf, t, 'R', dm, fr);
      box(g, xl * 0.25, h * 0.55, zf + t, xl * 0.45, h * 0.13, 4, mm.dark);   // диспенсер
      box(g, xl - 20, base + wt, wt, 40, h - base - 2 * wt, zf - wt, mm.liner);   // слева морозильная, справа холодильная
      shelves(ix0, xl - 20, base + wt, h - wt, 5); shelves(xl + 20, ix1, base + wt, h - wt, 4);
    } else if (L === 'french') {
      const fz = Math.round((h - base) * 0.32), ys = base + fz + gap / 2;
      sideDoor(g, 0, w / 2 - gap / 2, base + fz + gap, h, zf, t, 'L', dm, fr);
      sideDoor(g, w / 2 + gap / 2, w, base + fz + gap, h, zf, t, 'R', dm, fr);
      divider(ys); shelves(ix0, ix1, ys + 25, h - wt, 4);
      const dr = part(g, { move: [0, 0, Math.round(zf * 0.6)] });   // ящик морозилки выдвигается
      box(dr, 0, base, zf, w, fz, t, mm.body); box(dr, wt + 5, base + wt, wt + 10, w - 2 * wt - 10, fz - wt - 30, zf - wt - 10, mm.clear);
      box(dr, w * 0.3, base + fz - 40, zf + t, w * 0.4, 16, 22, mm.chrome);
    } else { sideDoor(g, 0, w, base, h, zf, t, hinge, dm, fr); shelves(ix0, ix1, base + wt, h - wt, Math.max(1, Math.round((h - base) / 380))); }   // single, builtSingle
  },
  chest(g, e, mm) {
    const { w, h, d } = e;
    shell(g, 0, 40, 0, w, h - 40 - 60, d, 50, mm.body, mm.liner, 'top'); box(g, 30, 0, 30, w - 60, 40, d - 60, mm.plastic);
    box(g, 60, h - 340, 60, w * 0.4, 220, d - 120, mm.clear);   // корзина
    const l = lid(g, 0, w, 0, d, h - 60, 60, mm.body, 80);
    box(l, w * 0.35, h - 30, d - 2, w * 0.3, 20, 22, mm.plastic);
  },
  wine(g, e, mm) {
    const { w, h, d } = e, t = 30, zf = d - t;
    shell(g, 0, 0, 0, w, h, zf, 30, mm.dark, mm.dark);
    for (let y = 120; y < h - 60; y += 110) box(g, 30, y, 30, w - 60, 6, zf - 50, M('wood', 0x8a6a4a));
    sideDoor(g, 0, w, 0, h, zf, t, 'R', { ...mm, body: mm.body }, { glass: [40, 60, w - 80, h - 120], hdl: 'v' });
  },
  stove(g, e, mm) {
    const { w, h, d } = e, t = 30, zf = d - t;
    box(g, 0, 0, 0, w, 140, zf, mm.body); box(g, 0, h - 120, 0, w, 100, zf, mm.body);   // низ (ящик) и верх под панелью
    shell(g, 0, 140, 0, w, h - 260, zf, 40, mm.body, mm.enamel); box(g, 45, 140 + (h - 260) * 0.42, 50, w - 90, 6, zf - 80, mm.grate);   // духовка с решёткой
    box(g, 0, h - 20, 0, w, 20, d, e.fuel === 'gas' ? mm.body : mm.dark);
    if (e.fuel === 'gas') burnersGas(g, e.burners || 4, w, d - 40, h, mm); else burnersFlat(g, e.burners || 4, w, d, h, mm, e.fuel === 'ind');
    box(g, 0, h - 110, zf, w, 90, t, mm.body); knobs(g, (e.burners || 4) + 1, 20, w - 20, h - 65, zf + t, mm);
    dropDoor(g, 8, w - 8, 140, h - 120, zf, t, mm);
    const dr = part(g, { move: [0, 0, Math.round(zf * 0.6)] });
    box(dr, 8, 15, zf, w - 16, 115, t, mm.body); box(dr, 20, 15, 40, w - 40, 100, zf - 40, mm.plastic);
    box(dr, w * 0.3, 100, zf + t, w * 0.4, 12, 16, mm.chrome);
  },
  tablehob(g, e, mm) {
    const { w, h, d } = e;
    box(g, 0, 0, 0, w, h - 15, d, e.fuel === 'gas' ? mm.body : mm.dark);
    box(g, 0, h - 15, 0, w, 15, d, e.fuel === 'gas' ? mm.chrome : mm.dark);
    if (e.fuel === 'gas') burnersGas(g, e.burners, w, d, h - 4, mm); else burnersFlat(g, e.burners, w, d, h, mm, e.fuel === 'ind');
    knobs(g, e.burners, w * 0.25, w * 0.75, h * 0.45, d - 2, mm);
  },
  minioven(g, e, mm) {
    const { w, h, d } = e, t = 25, zf = d - t;
    shell(g, 0, 20, 0, w, h - 20, zf, 25, mm.body, mm.enamel); box(g, 30, 20 + (h - 20) * 0.4, 35, w * 0.7, 5, zf - 60, mm.grate); for (const x of [30, w - 50]) box(g, x, 0, 40, 20, 20, 40, mm.plastic);
    box(g, w * 0.75, 20, zf, w * 0.25, h - 20, t, mm.dark); knobs(g, 3, w * 0.77, w * 0.98, h * 0.5, zf + t, mm);
    dropDoor(g, 0, w * 0.74, 25, h - 10, zf, t, mm);
  },
  ovenbi(g, e, mm) {
    const { w, h, d } = e, b = appBox(e), ft = 22, zf = d - ft;
    if (e.coffeeFront) box(g, b.ox, b.oy, 0, b.w, b.h, zf, mm.dark);
    else { shell(g, b.ox, b.oy, 0, b.w, b.h, zf, 30, mm.dark, mm.enamel); box(g, b.ox + 35, b.oy + b.h * 0.4, 40, b.w - 70, 6, zf - 70, mm.grate); }   // камера с решёткой
    if (e.coffeeFront) {   // встраиваемая кофемашина: панель и выдвижной блок
      box(g, 0, 0, zf, w, h, ft, mm.body); box(g, w * 0.3, h * 0.12, d, w * 0.4, h * 0.35, 3, mm.dark); box(g, w * 0.25, h * 0.8, d, w * 0.5, 30, 3, mm.screen);
      return;
    }
    const ph = Math.min(90, h * 0.17);
    box(g, 0, h - ph, zf, w, ph, ft, mm.body); knobs(g, 2, 40, 140, h - ph / 2, d, mm); box(g, w * 0.4, h - ph * 0.7, d, w * 0.2, ph * 0.4, 2, mm.screen);
    dropDoor(g, 0, w, 0, h - ph - 3, zf, ft, mm);
  },
  warmer(g, e, mm) {
    const { w, h, d } = e, ft = 22, zf = d - ft;
    box(g, 18, 2, 0, w - 36, h - 4, zf, mm.dark);
    const dr = part(g, { move: [0, 0, Math.round(zf * 0.8)] }); box(dr, 0, 0, zf, w, h, ft, mm.body); box(dr, 30, 10, 20, w - 60, h - 30, zf - 20, mm.plastic);
  },
  hob(g, e, mm) {
    const { w, h, d } = e, cut = e.cut || [w - 30, d - 30], top = h - 6;
    box(g, (w - cut[0]) / 2 + 5, 0, (d - cut[1]) / 2 + 5, cut[0] - 10, top, cut[1] - 10, mm.plastic);   // корпус под столешницей
    const glassTop = e.fuel !== 'gas' || e.finish === 'black';
    box(g, 0, top, 0, w, 6, d, glassTop ? mm.glass : mm.body);
    if (e.fuel === 'gas') { burnersGas(g, e.burners, w, d - 50, h - 2, mm, 10); for (let k = 0; k < e.burners; k++) cyl(g, 14, 16, 'y', w * (0.2 + 0.6 * (k + 0.5) / e.burners), h + 8, d - 28, mm.plastic); }
    else burnersFlat(g, e.burners, w, d, h, mm, e.fuel === 'ind');
  },
  hood(g, e, mm) {
    const { w, h, d } = e;
    if (e.kind === 'tele' || e.kind === 'box') {
      box(g, 0, 0, 0, w, h, d * 0.85, mm.body); box(g, w * 0.2, 0, d * 0.2, w * 0.6, 2, d * 0.55, mm.grate);
      if (e.kind === 'tele') { const s = part(g, { move: [0, 0, 170] }); box(s, 0, 0, d * 0.85, w, 45, d * 0.15, mm.body); box(s, 0, 0, d * 0.85 - 120, w, 40, 120, mm.body); }
    } else if (e.kind === 'flat') {
      box(g, 0, 0, 0, w, h, d, mm.body); box(g, w * 0.15, -1, d * 0.2, w * 0.7, 2, d * 0.6, mm.grate);
    } else if (e.kind === 'incl') {
      const bh = 380, ch = h - bh;
      box(g, w * 0.3, bh, 20, w * 0.4, ch, 230, mm.body);
      const panel = box(g, 0, 0, 0, w, bh, 30, mm.glass); panel.rotation.x = -0.45; panel.position.set(w / 2, bh / 2, d - 120);
      box(g, 0, 0, 0, w, 60, d * 0.6, mm.body);
    } else {   // купол и остров
      const ch = h - 260, island = e.kind === 'island';
      box(g, w * 0.32, 260, island ? d * 0.33 : 20, w * 0.36, ch, island ? d * 0.34 : 250, mm.body);
      const shape = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(w, 0), new THREE.Vector2(w * 0.68, 200), new THREE.Vector2(w * 0.32, 200)]);
      const can = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false }), mm.body); can.position.set(0, 60, 0); g.add(can);
      box(g, 0, 0, 0, w, 60, d, mm.body); box(g, w * 0.1, -1, d * 0.15, w * 0.8, 2, d * 0.7, mm.grate);
    }
  },
  micro(g, e, mm) {
    const { w, h, d } = e, t = 25, zf = d - t, dw = Math.round(w * 0.72);
    shell(g, 0, 10, 0, w, h - 10, zf, 25, mm.body, mm.steel); cyl(g, Math.min(dw, zf) * 0.42, 5, 'y', dw / 2, 10 + 25 + 8, zf / 2, mm.clear);   // камера и стеклянный поддон
    for (const x of [30, w - 50]) box(g, x, 0, 40, 20, 10, 20, mm.rubber);
    box(g, dw, 10, zf, w - dw, h - 10, t, mm.dark); knobs(g, 2, dw + 10, w - 10, h * 0.55, zf + t, mm);
    const p = part(g, rotY(0, zf, -95 * D2R)); box(p, 0, 10, zf, dw - 2, h - 10, t, mm.body); box(p, dw * 0.1, h * 0.2, zf + t, dw * 0.7, h * 0.6, 2, mm.glass);
  },
  microbi(g, e, mm) {
    const { w, h, d } = e, b = appBox(e), ft = 22, zf = d - ft, dw = Math.round(w * 0.72);
    shell(g, b.ox, b.oy, 0, b.w, b.h, zf, 25, mm.dark, mm.steel); cyl(g, Math.min(b.w * 0.7, zf) * 0.42, 5, 'y', b.ox + b.w * 0.36, b.oy + 25 + 8, zf / 2, mm.clear);
    box(g, dw, 0, zf, w - dw, h, ft, mm.body); box(g, dw + 20, h * 0.6, d, w - dw - 40, 30, 2, mm.screen);
    const p = part(g, rotY(0, zf, -95 * D2R)); box(p, 0, 0, zf, dw - 2, h, ft, mm.body); box(p, dw * 0.08, h * 0.15, d, dw * 0.8, h * 0.7, 2, mm.glass);
  },
  dish(g, e, mm) {
    const { w, h, d } = e, t = 25, zf = d - t;
    shell(g, 0, 0, 0, w, h, zf, 25, e.integrated ? mm.white : mm.body, mm.steel);
    for (const y of [80, h * 0.5]) { box(g, 35, y, 40, w - 70, 8, zf - 70, mm.grate); box(g, 35, y, zf - 36, w - 70, 90, 6, mm.grate); }   // нижняя и верхняя корзины
    if (!e.integrated) { box(g, 0, h - 90, zf, w, 90, t, mm.body); box(g, w * 0.55, h - 60, zf + t, w * 0.35, 25, 2, mm.screen); }
    const p = part(g, rotX(e.integrated ? 0 : 0, zf, 90 * D2R));
    box(p, 0, 0, zf, w, e.integrated ? h : h - 92, t, e.integrated ? mm.white : mm.body);
    if (!e.integrated) box(p, w * 0.3, h - 140, zf + t, w * 0.4, 14, 16, mm.chrome);
  },
  washer(g, e, mm) {
    const { w, h, d } = e, t = 22, zf = d - t, cy = h * 0.47, R = Math.min(w, h) * 0.3;
    box(g, 0, 0, 0, w, h, zf, mm.body); box(g, 0, 0, zf, w, h, t, mm.body);
    cyl(g, R - 2, 3, 'z', w / 2, cy, zf + t + 1.5, mm.dark); torus(g, R - 2, 7, w / 2, cy, zf + t + 2, mm.rubber);   // барабан и манжета люка
    box(g, 20, h - 110, zf + t, w * 0.35, 70, 3, mm.white);                    // дозатор
    box(g, w * 0.45, h - 90, zf + t, w * 0.48, 40, 2, mm.screen); cyl(g, 22, 18, 'z', w * 0.82, h - 70, zf + t + 9, mm.chrome);
    if (e.integrated) return;
    const p = part(g, rotY(w / 2 - R - 18, zf + t, -170 * D2R));
    torus(p, R + 6, 14, w / 2, cy, zf + t + 14, mm.chrome);
    cyl(p, R, 6, 'z', w / 2, cy, zf + t + 10, mm.glass);
    p.userData.round = true;
  },
  topload(g, e, mm) {
    const { w, h, d } = e;
    shell(g, 0, 0, 0, w, h - 40, d, 30, mm.body, mm.steel, 'top'); box(g, 0, h - 40, d - 120, w, 40, 120, mm.body);
    cyl(g, Math.min(w, d - 120) * 0.42, 6, 'y', w / 2, h - 46, (d - 120) / 2, mm.dark);   // барабан
    box(g, 30, h - 30, d - 100, w - 60, 20, 2, mm.screen);
    lid(g, 0, w, 0, d - 120, h - 40, 20, mm.body, 100);
  },
  twintub(g, e, mm) {
    const { w, h, d } = e, wl = w * 0.6;
    box(g, 0, 0, 0, w, h - 30, d, mm.body); box(g, 0, h - 30, d - 90, w, 30, 90, M('blue', 0x5b8fc9, { roughness: 0.4 }));
    knobs(g, 3, 40, w - 40, h - 15, d - 2, mm);
    lid(g, 0, wl - 5, 0, d - 90, h - 30, 15, mm.clear, 95);
    lid(g, wl + 5, w, 0, d - 90, h - 30, 15, mm.clear, 95);
  },
  coffee(g, e, mm) {
    const { w, h, d } = e;
    box(g, 0, 0, 0, w, h * 0.12, d, mm.dark); box(g, 0, h * 0.12, 0, w, h * 0.88, d * 0.62, mm.body);
    box(g, 0, h * 0.55, d * 0.62, w, h * 0.45, d * 0.38, mm.body); box(g, w * 0.3, h * 0.55 - 30, d * 0.75, w * 0.4, 30, 40, mm.chrome);
    box(g, w * 0.1, h * 0.85, d * 0.98, w * 0.8, h * 0.08, 2, mm.screen);
  },
  kettle(g, e, mm) {
    const { w, h, d } = e, r = Math.min(w, d) / 2 - 10, cx = e.round ? w / 2 : w * 0.45, cz = d / 2;
    cyl(g, r + 8, 18, 'y', cx, 9, cz, mm.plastic);
    cyl(g, r, h * 0.85 - 18, 'y', cx, 18 + (h * 0.85 - 18) / 2, cz, mm.body, r * 0.9);
    if (!e.round) { box(g, cx + r - 5, h * 0.25, cz - 12, 45, h * 0.55, 24, mm.plastic); }
    const l = part(g, rotX(h * 0.85, cz - r * 0.9, -80 * D2R)); cyl(l, r * 0.9, h * 0.08, 'y', cx, h * 0.85 + h * 0.04, cz, mm.plastic, r * 0.7);
  },
  toaster(g, e, mm) {
    const { w, h, d } = e;
    box(g, 0, 0, 0, w, h, d, mm.body);
    const n = w > 330 ? 4 : 2;
    for (let k = 0; k < n; k++) box(g, w * (0.12 + 0.76 * k / n), h - 1, d * 0.25, w * 0.76 / n * 0.6, 2, d * 0.5, mm.dark);
    box(g, w - 6, h * 0.5, d * 0.4, 14, 18, 30, mm.plastic);
  },
  blender(g, e, mm) {
    const { w, h, d } = e;
    box(g, 0, 0, 0, w, h * 0.3, d, mm.body);
    cyl(g, Math.min(w, d) * 0.38, h * 0.62, 'y', w / 2, h * 0.3 + h * 0.31, d / 2, mm.clear, Math.min(w, d) * 0.45);
    cyl(g, Math.min(w, d) * 0.45, h * 0.06, 'y', w / 2, h * 0.97, d / 2, mm.plastic);
  },
  mixer(g, e, mm) {
    const { w, h, d } = e;
    box(g, 0, 0, 0, w, 40, d, mm.body); box(g, w * 0.2, 40, 0, w * 0.6, h * 0.62, d * 0.32, mm.body);
    cyl(g, w * 0.42, h * 0.35, 'y', w / 2, 40 + h * 0.175, d * 0.62, mm.chrome, w * 0.32);
    const head = part(g, rotX(40 + h * 0.62, d * 0.15, -55 * D2R));
    box(head, w * 0.18, 40 + h * 0.62, 0, w * 0.64, h * 0.3, d * 0.9, mm.body);
  },
  cooker(g, e, mm) {
    const { w, h, d } = e, r = Math.min(w, d) / 2 - 5;
    cyl(g, r, h * 0.62, 'y', w / 2, h * 0.31, d / 2, mm.body);
    box(g, w / 2 - 40, h * 0.3, d - 12, 80, 50, 14, mm.screen);
    const l = part(g, rotX(h * 0.62, d / 2 - r, -100 * D2R)); cyl(l, r, h * 0.38, 'y', w / 2, h * 0.62 + h * 0.19, d / 2, mm.body, r * 0.92);
  },
  airfryer(g, e, mm) {
    const { w, h, d } = e;
    box(g, 0, 0, 0, w, h, d * 0.6, mm.body); box(g, 0, h * 0.55, d * 0.6, w, h * 0.45, d * 0.4, mm.body);
    const dr = part(g, { move: [0, 0, d * 0.5] }); box(dr, 15, 10, d * 0.2, w - 30, h * 0.5, d * 0.8, mm.body); box(dr, w * 0.35, h * 0.2, d, w * 0.3, 40, 40, mm.plastic);
  },
  breadmaker(g, e, mm) {
    const { w, h, d } = e;
    box(g, 0, 0, 0, w, h * 0.72, d, mm.body); box(g, w * 0.1, h * 0.5, d - 1, w * 0.8, h * 0.15, 2, mm.screen);
    const l = part(g, rotX(h * 0.72, 0, -100 * D2R)); box(l, 0, h * 0.72, 0, w, h * 0.28, d * 0.8, mm.body); box(l, w * 0.25, h * 0.85, d * 0.2, w * 0.5, 2, d * 0.4, mm.glass);
  },
  grinder(g, e, mm) {
    const { w, h, d } = e;
    box(g, 0, 0, 0, w, h * 0.55, d, mm.body); cyl(g, 30, d * 0.5, 'z', w / 2, h * 0.65, d * 0.75, mm.chrome); cyl(g, 45, h * 0.35, 'y', w / 2, h * 0.82, d * 0.45, mm.chrome, 35);
  },
  grill(g, e, mm) {
    const { w, h, d } = e;
    box(g, 0, 0, 0, w, h * 0.45, d * 0.85, mm.body); box(g, w * 0.4, h * 0.1, d * 0.85, w * 0.2, 25, d * 0.15, mm.plastic);
    const l = part(g, rotX(h * 0.45, 0, -95 * D2R)); box(l, 0, h * 0.45, 0, w, h * 0.55, d * 0.85, mm.body);
  },
  tv(g, e, mm) {
    const { w, h, d } = e;
    const pt = Math.min(30, d);
    box(g, 0, 0, d - pt, w, h, pt - 2, mm.dark); box(g, 8, 8, d - 2, w - 16, h - 16, 2, mm.screen);
    if (d > pt) box(g, w * 0.3, h * 0.3, 0, w * 0.4, h * 0.4, d - pt, mm.dark);   // корпус электроники сзади
  },
  ac(g, e, mm) {
    const { w, h, d } = e;
    box(g, 0, h * 0.3, 0, w, h * 0.7, d, mm.white); box(g, 0, 0, 0, w, h * 0.3, d * 0.7, mm.white);
    box(g, w * 0.82, h * 0.7, d, 60, 14, 2, mm.led);
    const f = part(g, rotX(h * 0.3, d * 0.7, 55 * D2R)); box(f, 20, h * 0.3 - 6, d * 0.7, w - 40, 8, d * 0.3, mm.white);   // шторка: передний край опускается
  },
  column(g, e, mm) { const { w, h, d } = e; box(g, 0, 0, 0, w, h, d, mm.white); box(g, w * 0.15, h * 0.55, d, w * 0.7, h * 0.3, 2, mm.grate); box(g, w * 0.3, h * 0.9, d, w * 0.4, 20, 2, mm.led); },
  outdoor(g, e, mm) { const { w, h, d } = e; box(g, 0, 0, 0, w, h, d, mm.white); cyl(g, h * 0.38, 4, 'z', w * 0.4, h / 2, d + 1, mm.grate); },
  radiator(g, e, mm) { const { w, h, d } = e; const n = Math.max(5, Math.round(w / 55)); for (let k = 0; k < n; k++) box(g, k * w / n + 3, 60, 0, w / n - 6, h - 60, d, mm.white); for (const x of [30, w - 60]) box(g, x, 0, 0, 30, 60, d, mm.plastic); },
  boiler(g, e, mm) {
    const { w, h, d } = e;
    box(g, 0, 0, 0, w, h, d, mm.white); box(g, w * 0.3, h * 0.12, d, w * 0.4, h * 0.08, 2, mm.screen);
    if (!e.floor) for (let k = 0; k < 4; k++) cyl(g, 10, 120, 'y', w * (0.2 + 0.2 * k), -60, d * 0.4, mm.chrome);
    cyl(g, e.geyser ? 55 : 50, 140, 'y', w / 2, h + 70, d * 0.5, mm.chrome);
  },
  heater(g, e, mm) {
    const { w, h, d } = e;
    if (e.flat) box(g, 0, 0, 0, w, h, d, mm.white);
    else if (e.horiz) cyl(g, Math.min(h, d) / 2, w, 'x', w / 2, h / 2, d / 2, mm.white);
    else cyl(g, Math.min(w, d) / 2, h, 'y', w / 2, h / 2, d / 2, mm.white);
    for (const x of [w * 0.4, w * 0.6]) cyl(g, 10, 80, 'y', x, -40, d * 0.5, mm.chrome);
  },
  robot(g, e, mm) { const { w, h, d } = e; cyl(g, w / 2, h - 10, 'y', w / 2, (h - 10) / 2 + 10, d / 2, mm.body); cyl(g, w * 0.12, 12, 'y', w / 2, h, d * 0.4, mm.dark); },
  station(g, e, mm) { const { w, h, d } = e; box(g, 0, 0, 0, w, h, d * 0.4, mm.body); box(g, 0, 0, d * 0.4, w, 20, d * 0.6, mm.body); cyl(g, w * 0.45, 95, 'y', w / 2, 20 + 47, d * 0.6, mm.dark); },
  stick(g, e, mm) { const { w, h, d } = e; box(g, 0, 0, 0, w, 40, d, mm.body); box(g, w * 0.4, 40, d * 0.3, w * 0.2, h - 300, 40, mm.chrome); box(g, w * 0.2, h - 300, d * 0.2, w * 0.6, 260, d * 0.6, mm.body); },
  vacuum(g, e, mm) { const { w, h, d } = e; box(g, 0, 0, 0, w, h, d, mm.body); cyl(g, 50, 30, 'x', 0, 60, d * 0.3, mm.rubber); cyl(g, 50, 30, 'x', w, 60, d * 0.3, mm.rubber); },
  cooler(g, e, mm) {
    const { w, h, d } = e, bh = e.small ? 0 : 0, bottle = 380;
    box(g, 0, 0, 0, w, h - (e.small ? 0 : 0), d, mm.white); box(g, w * 0.25, h * 0.55, d - 1, w * 0.5, h * 0.18, 2, mm.dark);
    cyl(g, 135, bottle, 'y', w / 2, h + bottle / 2 + bh, d / 2, mm.water, 135);
  },
  filter(g, e, mm) { const { w, h, d } = e; box(g, 0, 0, 0, w, 30, d, mm.white); for (let k = 0; k < 4; k++) cyl(g, 35, h - 50, 'y', w * (0.15 + 0.23 * k), 30 + (h - 50) / 2, d / 2, mm.white); },
  disposer(g, e, mm) { const { w, h, d } = e; cyl(g, w / 2, h, 'y', w / 2, h / 2, d / 2, mm.dark, w * 0.42); },
  custom(g, e, mm) {
    const { w, h, d } = e, t = 25, zf = d - t, k = e.openKind || 'none', wt = Math.min(20, w / 4, h / 4);
    if (k === 'none') { box(g, 0, 0, 0, w, h, d, mm.body); return; }
    if (k === 'lid') { shell(g, 0, 0, 0, w, h - 20, d, wt, mm.body, mm.liner, 'top'); lid(g, 0, w, 0, d, h - 20, 20, mm.body, 95); return; }
    if (k === 'drawer') { box(g, 0, 0, 0, w, h, zf, mm.body); const dr = part(g, { move: [0, 0, Math.round(zf * 0.7)] }); box(dr, 0, 0, zf, w, h, t, mm.body); box(dr, 20, 15, 30, w - 40, h - 30, zf - 30, mm.plastic); return; }
    shell(g, 0, 0, 0, w, h, zf, wt, mm.body, mm.liner);
    if (k === 'L' || k === 'R') sideDoor(g, 0, w, 0, h, zf, t, k, mm, { liner: mm.liner });
    else dropDoor(g, 0, w, 0, h, zf, t, mm, { window: false });
  },
};
export const CUSTOM_OPEN = [['none', 'не открывается'], ['R', 'дверь на правых петлях'], ['L', 'дверь на левых петлях'], ['drop', 'дверь вниз (как у духовки)'], ['drawer', 'выдвигается как ящик'], ['lid', 'крышка сверху (вверх-назад)']];

// Модель целиком: группа в координатах модели (0…w, 0…h, 0…d), подвижные части отмечены userData.motion
export function buildAppliance(e, finish) {
  const g = new THREE.Group(), mm = mats(finish || e.finish || 'white');
  (BUILD[e.shape] || BUILD.custom)(g, e, mm);
  g.traverse(o => { if (o.userData.motion) { o.matrixAutoUpdate = false; o.updateMatrix(); o.userData.base = o.matrix.clone(); } });
  return g;
}
export const hasMotion = g => { let m = false; g.traverse(o => { if (o.userData.motion) m = true; }); return m; };
// Положение подвижных частей при открытии t = 0…1
const _m = new THREE.Matrix4(), _r = new THREE.Matrix4(), _t = new THREE.Matrix4();
export function poseAppliance(g, t) {
  g.traverse(o => {
    const mo = o.userData.motion; if (!mo) return;
    if (mo.move) _m.makeTranslation(mo.move[0] * t, mo.move[1] * t, mo.move[2] * t);
    else { (mo.rot === 'x' ? _r.makeRotationX(mo.a * t) : _r.makeRotationY(mo.a * t)); _m.makeTranslation(...mo.p).multiply(_r).multiply(_t.makeTranslation(-mo.p[0], -mo.p[1], -mo.p[2])); }
    o.matrix.copy(_m).multiply(o.userData.base); o.matrixWorldNeedsUpdate = true;
  });
}

// ---------------------------------------------------------------- 2D: чертёж техники и значок для каталога
// Подвижные части берём из той же 3D-модели: коробка части, ось и угол поворота или сдвиг — так чертёж всегда совпадает с моделью
const partsCache = new Map();
function motionParts(e) {
  const key = JSON.stringify(e);
  if (!partsCache.has(key)) {
    const g = buildAppliance(e); g.updateMatrixWorld(true);
    const out = [];
    g.traverse(o => { if (!o.userData.motion) return; const b = new THREE.Box3().setFromObject(o); if (!b.isEmpty()) out.push({ b, m: o.userData.motion, round: !!o.userData.round }); });
    if (partsCache.size > 300) partsCache.clear();
    partsCache.set(key, out);
  }
  return partsCache.get(key);
}
const INK = '#2b2620', BLUE = '#1f5fb4', ORANGE = '#d9770f';
const f1 = v => String(Math.round(v * 10) / 10).replace('.', ',');
// Дверь на петлях в плане (X, Z): дальняя от оси точка и её путь при открывании
function swing(pt, m, ax) {
  const [ka, kb] = ax, pa = m.p[ka === 'x' ? 0 : ka === 'y' ? 1 : 2], pb = m.p[kb === 'x' ? 0 : kb === 'y' ? 1 : 2];
  let far = null;
  for (const a of [pt.b.min[ka], pt.b.max[ka]]) for (const b of [pt.b.min[kb], pt.b.max[kb]]) { const r = Math.hypot(a - pa, b - pb); if (!far || r > far.r) far = { a, b, r }; }
  const path = [];
  for (let k = 0; k <= 24; k++) {
    const t = m.a * k / 24, c = Math.cos(t), s = Math.sin(t), da = far.a - pa, db = far.b - pb;
    path.push([pa + da * c + db * s, pb - da * s + db * c]);   // поворот вокруг Y: (x, z) → (x·c + z·s, −x·s + z·c)
  }
  return { piv: [pa, pb], path, r: far.r };
}
// Дуги открывания в плане (вид сверху: X, Z) и сбоку (Z, Y)
function opening(e) {
  const plan = [], side = [], slide = [];
  for (const pt of motionParts(e)) {
    if (pt.m.move) { slide.push(pt); continue; }
    if (pt.m.rot === 'y') plan.push({ ...swing(pt, pt.m, ['x', 'z']), deg: Math.round(Math.abs(pt.m.a) * 180 / Math.PI) });
    else {
      // вокруг X в осях (z, y): поворот (y, z) → (y·c − z·s, y·s + z·c); пишем точку как (z, y)
      const m = pt.m, py = m.p[1], pz = m.p[2];
      let far = null;
      for (const y of [pt.b.min.y, pt.b.max.y]) for (const z of [pt.b.min.z, pt.b.max.z]) { const r = Math.hypot(y - py, z - pz); if (!far || r > far.r) far = { y, z, r }; }
      const path = [];
      for (let k = 0; k <= 24; k++) { const t = m.a * k / 24, c = Math.cos(t), s = Math.sin(t), dy = far.y - py, dz = far.z - pz; path.push([pz + dy * s + dz * c, py + dy * c - dz * s]); }
      side.push({ piv: [pz, py], path, r: far.r, deg: Math.round(Math.abs(m.a) * 180 / Math.PI) });
    }
  }
  return { plan, side, slide };
}
const line = (x1, y1, x2, y2, o = '') => `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" ${o}/>`;
const rect = (x, y, w, h, o = '') => `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(w, 0.6).toFixed(1)}" height="${Math.max(h, 0.6).toFixed(1)}" ${o}/>`;
const poly = (pts, o = '') => `<polyline points="${pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" fill="none" ${o}/>`;
const txt = (x, y, t, o = '') => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" ${o}>${t}</text>`;
function dimH(x1, x2, y, t, col = INK) { return `<g stroke="${col}" fill="${col}">${line(x1, y, x2, y, `stroke-width=".8" marker-start="url(#aar)" marker-end="url(#aar)"`)}${line(x1, y - 6, x1, y + 6, 'stroke-width=".5"')}${line(x2, y - 6, x2, y + 6, 'stroke-width=".5"')}</g>${txt((x1 + x2) / 2, y - 4, t, `font-size="11" text-anchor="middle" fill="${col}"`)}`; }
function dimV(y1, y2, x, t, col = INK) { return `<g stroke="${col}" fill="${col}">${line(x, y1, x, y2, `stroke-width=".8" marker-start="url(#aar)" marker-end="url(#aar)"`)}${line(x - 6, y1, x + 6, y1, 'stroke-width=".5"')}${line(x - 6, y2, x + 6, y2, 'stroke-width=".5"')}</g>${txt(x - 4, (y1 + y2) / 2, t, `font-size="11" text-anchor="middle" fill="${col}" transform="rotate(-90 ${(x - 4).toFixed(1)} ${((y1 + y2) / 2).toFixed(1)})"`)}`; }
const DEFS = `<defs><marker id="aar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 2L10 5L0 8" fill="none" stroke="context-stroke"/></marker></defs>`;
// Вид спереди: габарит, двери и ящики (контуры подвижных частей), для встраиваемой духовки — корпус в нише пунктиром
function frontShapes(e, X, Y, s, sw = 1) {
  const { w, h } = e;
  let g = rect(X(0), Y(h), w * s, h * s, `fill="#f4f2ee" stroke="${INK}" stroke-width="${sw}"`);
  const b = appBox(e);
  if (['ovenbi', 'microbi'].includes(e.shape) && (b.w !== w || b.h !== h)) g += rect(X(b.ox), Y(b.oy + b.h), b.w * s, b.h * s, `fill="none" stroke="#8a8378" stroke-width=".7" stroke-dasharray="4 3"`);   // корпус в нише
  for (const pt of motionParts(e)) {
    const x0 = Math.max(0, pt.b.min.x), x1 = Math.min(w, pt.b.max.x), y0 = Math.max(0, pt.b.min.y), y1 = Math.min(h, pt.b.max.y);
    if (x1 - x0 < 1 || y1 - y0 < 1) continue;
    g += pt.round ? `<ellipse cx="${X((x0 + x1) / 2).toFixed(1)}" cy="${Y((y0 + y1) / 2).toFixed(1)}" rx="${((x1 - x0) / 2 * s).toFixed(1)}" ry="${((y1 - y0) / 2 * s).toFixed(1)}" fill="#e3e7ea" stroke="${INK}" stroke-width="${sw}"/>`
      : rect(X(x0), Y(y1), (x1 - x0) * s, (y1 - y0) * s, `fill="#fbfaf8" stroke="${INK}" stroke-width="${sw}"`);
  }
  return g;
}
// Значок для каталога: вид спереди в квадрате size×size
const iconCache = new Map();
export function appIcon(e, size = 64) {
  const key = size + JSON.stringify(e);
  if (!iconCache.has(key)) {
    const s = (size - 6) / Math.max(e.w, e.h), ox = (size - e.w * s) / 2, oy = (size + e.h * s) / 2;
    iconCache.set(key, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${frontShapes(e, x => ox + x * s, y => oy - y * s, s, 0.8)}</svg>`);
  }
  return iconCache.get(key);
}
// Чертёж: вид спереди (с нишей), вид сбоку (откидные двери и крышки), вид сверху (двери на петлях, ящики, вырез под панель)
export function appSheetSVG(e, { maxW = 900, maxH = 640 } = {}) {
  const { w, h, d } = e, op = opening(e);
  const nW = e.niche ? e.niche[0] : 0, nH = e.niche ? e.niche[1] : 0, nD = e.niche ? e.niche[2] : 0;
  // границы видов в мм (вместе с дугами открывания и нишей)
  const ext = (pts, lo, hi) => pts.reduce((r, p) => [Math.min(r[0], p), Math.max(r[1], p)], [lo, hi]);
  const fx = ext(nW ? [(w - nW) / 2, (w + nW) / 2] : [], 0, w), fy = ext(nH ? [nH] : [], 0, h);
  const sz = ext(op.side.flatMap(a => a.path.map(p => p[0])).concat(op.slide.map(pt => pt.b.max.z + (pt.m.move[2] || 0)), nD ? [d - nD] : []), 0, d);
  const sy = ext(op.side.flatMap(a => a.path.map(p => p[1])), 0, h);
  const px = ext(op.plan.flatMap(a => a.path.map(p => p[0])), 0, w);
  const pz = ext(op.plan.flatMap(a => a.path.map(p => p[1])).concat(op.slide.map(pt => pt.b.max.z + (pt.m.move[2] || 0))), 0, d);
  const gap = 90, m = 80;
  const cx0 = Math.min(fx[0], px[0]), cx1 = Math.max(fx[1], px[1]);           // левая колонка: вид спереди и под ним вид сверху
  const s = Math.min(1.2, (maxW - 2 * m - gap) / ((cx1 - cx0) + (sz[1] - sz[0])), (maxH - 2 * m - gap) / (Math.max(fy[1], sy[1]) - Math.min(fy[0], sy[0]) + (pz[1] - pz[0])));
  const top = Math.max(fy[1], sy[1]);
  const FX = m - cx0 * s, FY = m + top * s;                                     // начало вида спереди (x = 0, y = 0)
  const SX = m + (cx1 - cx0) * s + gap - sz[0] * s;                             // вид сбоку: Z вправо (перед — справа)
  const PX = FX, PY = FY + (-Math.min(fy[0], sy[0])) * s + gap - pz[0] * s;     // вид сверху: Z вниз (перед — снизу)
  const W = Math.max(SX + sz[1] * s, PX + px[1] * s, 560) + m, H = PY + pz[1] * s + m * 0.8 + 16;
  const X = x => FX + x * s, Y = y => FY - y * s, ZS = z => SX + z * s, ZP = z => PY + z * s;
  let g = '';
  // вид спереди
  g += frontShapes(e, X, Y, s);
  g += txt(X(fx[0]), Y(top) - 40, 'Вид спереди', 'font-size="12" font-weight="600" fill="#5a5348"');
  g += dimH(X(0), X(w), Y(Math.min(0, fy[0])) + 26, f1(w)) + dimV(Y(h), Y(0), X(Math.min(0, fx[0])) - 26, f1(h));
  if (nW) {
    const x0 = (w - nW) / 2;
    g += rect(X(x0), Y(nH), nW * s, nH * s, `fill="none" stroke="${BLUE}" stroke-width="1" stroke-dasharray="6 4"`);
    g += dimH(X(x0), X(x0 + nW), Y(Math.max(nH, h)) - 14, 'ниша ' + f1(nW), BLUE) + dimV(Y(nH), Y(0), X(Math.max(w, x0 + nW)) + 22, 'ниша ' + f1(nH), BLUE);
  }
  // вид сбоку
  g += rect(ZS(0), Y(h), d * s, h * s, `fill="#f4f2ee" stroke="${INK}"`);
  for (const pt of motionParts(e)) if (pt.m.rot !== 'y') g += rect(ZS(Math.max(0, pt.b.min.z)), Y(Math.min(h, pt.b.max.y)), (Math.min(d, pt.b.max.z) - Math.max(0, pt.b.min.z)) * s, (Math.min(h, pt.b.max.y) - Math.max(0, pt.b.min.y)) * s, `fill="#fbfaf8" stroke="${INK}" stroke-width=".7"`);
  for (const a of op.side) {
    const end = a.path[a.path.length - 1], mid = a.path[12];   // подпись — у середины дуги, снаружи
    g += poly(a.path.map(p => [ZS(p[0]), Y(p[1])]), `stroke="${ORANGE}" stroke-width="1" stroke-dasharray="5 3"`) + line(ZS(a.piv[0]), Y(a.piv[1]), ZS(end[0]), Y(end[1]), `stroke="${ORANGE}" stroke-width="2"`);
    g += txt(ZS(mid[0]) + 6, Y(mid[1]) - 6, `${a.deg}°, R ${f1(a.r)}`, `font-size="10.5" fill="${ORANGE}"`);
  }
  for (const pt of op.slide) if (pt.m.move[2]) {
    const mv = pt.m.move[2], z0 = pt.b.min.z + mv, z1 = pt.b.max.z + mv;
    g += rect(ZS(z0), Y(pt.b.max.y), (z1 - z0) * s, (pt.b.max.y - pt.b.min.y) * s, `fill="none" stroke="${ORANGE}" stroke-dasharray="5 3"`);
  }
  if (nD) g += line(ZS(d - nD), Y(0) + 4, ZS(d - nD), Y(Math.max(nH, h)) - 4, `stroke="${BLUE}" stroke-dasharray="6 4"`) + dimH(ZS(d - nD), ZS(d), Y(Math.min(0, sy[0])) + 44, 'ниша ' + f1(nD), BLUE);
  g += dimH(ZS(0), ZS(d), Y(Math.min(0, sy[0])) + 26, f1(d)) + txt(ZS(sz[0]), Y(top) - 40, 'Вид сбоку (перед — справа)', 'font-size="12" font-weight="600" fill="#5a5348"');
  // вид сверху
  g += rect(X(0), ZP(0), w * s, d * s, `fill="#f4f2ee" stroke="${INK}"`);
  if (e.cut) {
    const cx0 = (w - e.cut[0]) / 2, cz0 = (d - e.cut[1]) / 2;
    g += rect(X(cx0), ZP(cz0), e.cut[0] * s, e.cut[1] * s, `fill="none" stroke="${BLUE}" stroke-width="1" stroke-dasharray="6 4"`);
    g += txt(X(w / 2), ZP(d / 2) + 4, `вырез ${f1(e.cut[0])} × ${f1(e.cut[1])}`, `font-size="11" text-anchor="middle" fill="${BLUE}"`);
  }
  for (const a of op.plan) {
    const end = a.path[a.path.length - 1], low = a.path.reduce((p, q) => q[1] > p[1] ? q : p);   // подпись — под самой выступающей точкой
    g += poly(a.path.map(p => [X(p[0]), ZP(p[1])]), `stroke="${ORANGE}" stroke-width="1" stroke-dasharray="5 3"`) + line(X(a.piv[0]), ZP(a.piv[1]), X(end[0]), ZP(end[1]), `stroke="${ORANGE}" stroke-width="2"`);
    g += txt(X(low[0]), ZP(low[1]) + 14, `${a.deg}°, R ${f1(a.r)}`, `font-size="10.5" fill="${ORANGE}" text-anchor="middle"`);
  }
  for (const pt of op.slide) if (pt.m.move[2]) {
    const mv = pt.m.move[2];
    g += rect(X(pt.b.min.x), ZP(pt.b.min.z + mv), (pt.b.max.x - pt.b.min.x) * s, (pt.b.max.z - pt.b.min.z) * s, `fill="none" stroke="${ORANGE}" stroke-dasharray="5 3"`);
    g += txt(X((pt.b.min.x + pt.b.max.x) / 2), ZP(pt.b.max.z + mv) - 6, `выдвигается на ${f1(mv)}`, `font-size="10.5" fill="${ORANGE}" text-anchor="middle"`);
  }
  g += dimV(ZP(0), ZP(d), X(Math.min(0, px[0])) - 26, f1(d)) + txt(X(px[0]), ZP(pz[0]) - 10, 'Вид сверху (перед — снизу)', 'font-size="12" font-weight="600" fill="#5a5348"');
  const reach = Math.max(0, ...op.plan.flatMap(a => a.path.map(p => p[1] - d)), ...op.side.flatMap(a => a.path.map(p => p[0] - d)), ...op.slide.map(pt => pt.b.max.z + (pt.m.move[2] || 0) - d));
  g += txt(m * 0.5, H - (reach > 1 ? 26 : 10), 'Размеры в мм · синий — ниша и вырез · оранжевый — как открывается', 'font-size="10.5" fill="#5a5348"');
  if (reach > 1) g += txt(m * 0.5, H - 10, `Чтобы открыть, спереди нужно не меньше ${f1(Math.round(reach))} мм свободного места`, `font-size="10.5" fill="${ORANGE}"`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W.toFixed(0)} ${H.toFixed(0)}" width="${W.toFixed(0)}" height="${H.toFixed(0)}" font-family="Segoe UI, Arial, sans-serif" fill="${INK}">${DEFS}<rect width="100%" height="100%" fill="#fff"/>${g}</svg>`;
}
// Сколько места нужно спереди, чтобы открыть (мм) — для подсказок
export function frontReach(e) {
  const op = opening(e), d = e.d;
  return Math.round(Math.max(0, ...op.plan.flatMap(a => a.path.map(p => p[1] - d)), ...op.side.flatMap(a => a.path.map(p => p[0] - d)), ...op.slide.map(pt => pt.b.max.z + (pt.m.move[2] || 0) - d)));
}
