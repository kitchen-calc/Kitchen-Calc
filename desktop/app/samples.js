// Примеры проектов: собираются кодом из тех же деталей, корпусов и предметов, что и в программе — потом всё можно менять.
// build(api) заполняет текущий проект api.P; api: { P, nid, buildCabinet, attachCabinetHardware, HINGES, OBJECTS }.
// Координаты: X — вдоль задней стены слева направо, Y — от пола, Z — от задней стены к нам. Всё в мм.

// «Кабинет у окна»: ниша 3150 × 2650 мм, глубина 390. Слева — стеллаж до потолка с подсветкой полок и рейками на задней стенке,
// дальше — длинная столешница-стол из дуба на высоте 1000 мм с четырьмя барными стульями, рейки над столом и под ним,
// навесные шкафы без ручек до потолка с подсвеченной нишей, LED под шкафами, подвесной светильник-трубка, накладные споты,
// напротив — окна в пол с горизонтальными жалюзи, в торце — чёрная дверь.
function studyNook(api) {
  const { P, nid, buildCabinet, attachCabinetHardware, HINGES, OBJECTS } = api;
  const L = 3150, H = 2650, D = 390, ROOM_D = 1650, TOP = 1000, CT = 38, UB = 1750;
  P.name = 'Кабинет у окна';
  P.room = { pts: [[0, 0], [L, 0], [L, ROOM_D], [0, ROOM_D]], h: H, t: 120, floor: 'fl46', wall: 'wl1', wallMats: {}, columns: [],
    openings: [{ wall: 2, type: 'window', off: 150, w: 1350, h: 2300, sill: 150 }, { wall: 2, type: 'window', off: 1650, w: 1350, h: 2300, sill: 150 },
      { wall: 3, type: 'door', off: 450, w: 800, h: 2150, sill: 0, color: '#1c1c1e' }] };
  P.materials.push({ id: 'gaia18', name: 'ЛДСП Дуб Гайя', color: '#c4af88', t: 18, decor: 'pl11' },
    { id: 'gaiatop', name: 'Столешница Дуб Гайя 38', color: '#c4af88', t: 38, decor: 'pl11' },
    { id: 'cashbeige18', name: 'ЛДСП Кашемир-Беж', color: '#ccc7bb', t: 18, decor: 'pl19' });
  const hinge = { type: (HINGES[0] || {}).id, side: 'L', off: 100, count: 0 };
  const cabinet = (name, kind, x, y, p) => {
    const p2 = { plinth: 0, shelves: 1, doors: 0, drawers: 0, topType: 'solid', back: true, mat: 'cashbeige18', facadeMat: 'cashbeige18', drill: true, confCount: 0, pinOff: 37, hinge, sideCut: { where: 'none', a: 0, deg: 0 }, ...p };
    const g = { id: nid(), name, kind, params: p2 }; P.groups.push(g);
    const parts = buildCabinet(p2, x, y, 0, g.id); P.items.push(...parts); attachCabinetHardware(parts, p2); return parts;
  };
  const panel = (kind, name, mat, x, y, z, w, h, d) => { const it = { id: nid(), kind, name, mat, x, y, z, w, h, d, g: 0, ops: [] }; P.items.push(it); return it; };
  const obj = (name, x, y, z, o = {}) => {
    const e = OBJECTS.find(q => q.name === name); if (!e) throw new Error('нет предмета ' + name);
    const spec = JSON.parse(JSON.stringify(e)); delete spec.id; for (const k of ['w', 'h', 'd', 'seat', 'slat', 'gap']) if (o[k] != null) spec[k] = o[k];
    const r = o.rot || 0, it = { id: nid(), kind: 'appliance', name: o.name || '', spec, finish: o.finish || spec.finish, rot: r, x, y, z, w: r % 2 ? spec.d : spec.w, h: spec.h, d: r % 2 ? spec.w : spec.d, g: 0 };
    P.items.push(it); return it;
  };

  // ---- стеллаж слева: дуб, 5 отделений, рейки на задней стенке, подсветка под каждой полкой
  const SW = 620, SH = 2400, shelves = cabinet('Стеллаж с подсветкой', 'rack', 0, 0, { W: SW, H: SH, D, shelves: 4, mat: 'gaia18', facadeMat: 'gaia18' });
  obj('Рейки на стену (с зазором)', 18, 18, 3, { w: SW - 36, h: SH - 36, d: 14, slat: 22, gap: 12, finish: 'oak', name: 'Рейки в стеллаже' });
  const levels = [SH - 18, ...shelves.filter(i => i.kind === 'shelf').map(i => i.y).sort((a, b) => b - a)];   // низ крыши и низ полок
  levels.forEach((y, k) => obj('LED-лента в накладном профиле', 30, y - 8, D - 70, { w: SW - 60, finish: 'warm', name: `Подсветка полки ${k + 1}` }));
  const shelfTop = [0, ...shelves.filter(i => i.kind === 'shelf').map(i => i.y + i.h)].sort((a, b) => a - b).map((y, k) => k === 0 ? 18 : y);   // дно и верх полок
  const [s1, s2, s3, s4, s5] = shelfTop;
  obj('Стопка книг', 190, s1, 120, { finish: 'beige' });
  obj('Ваза-кольцо', 200, s2, 160, { finish: 'black' });
  obj('Настольная лампа-грибок', 150, s3, 120, { finish: 'white' }); obj('Книги в ряд', 330, s3, 120, { w: 150, finish: 'beige' });
  obj('Ваза с сухоцветом (пампас)', 170, s4, 130, { h: 420, w: 110, d: 110, finish: 'beige' }); obj('Ваза-бутылка', 330, s4, 140, { finish: 'white', h: 200 });
  obj('Стопка книг', 190, s5, 120, { finish: 'white' }); obj('Статуэтка', 330, s5, 140, { finish: 'beige', h: 180 });

  // ---- стол: столешница дуб 38 мм по всей нише справа от стеллажа, верх на 1000 мм
  const X0 = SW, X1 = L;
  panel('countertop', 'Столешница-стол', 'gaiatop', X0, TOP - CT, 0, X1 - X0, CT, D);
  // рейки: колонна по центру — под столом и над ним до шкафов, вторая опора под столом у стеллажа
  const RX = 1760, RW = 300;
  obj('Рейки на стену (с зазором)', RX, 0, 0, { w: RW, h: TOP - CT, d: 20, slat: 30, gap: 15, finish: 'oak', name: 'Рейки под столом (опора)' });
  obj('Рейки на стену (с зазором)', RX, TOP, 0, { w: RW, h: UB - TOP, d: 20, slat: 30, gap: 15, finish: 'oak', name: 'Рейки над столом' });
  obj('Рейки на стену (с зазором)', X0 + 120, 0, 0, { w: RW, h: TOP - CT, d: 20, slat: 30, gap: 15, finish: 'oak', name: 'Рейки под столом у стеллажа' });

  // ---- навесные шкафы до потолка без ручек (кашемир-беж) и ниша из дуба с подсветкой
  const UH = H - UB, UD = 350;
  cabinet('Навесной шкаф 1', 'wall', X0, UB, { W: 560, H: UH, D: UD, doors: 2 });
  cabinet('Навесной шкаф 2', 'wall', X0 + 560, UB, { W: 520, H: UH, D: UD, doors: 2 });
  const NX = X0 + 1080, NW = 420, NY = UB + 60, NH = 520;
  panel('panel', 'Фасад под нишей', 'cashbeige18', NX, UB, UD - 18, NW, NY - UB, 18);
  cabinet('Ниша с подсветкой', 'shelf', NX, NY, { W: NW, H: NH, D: UD, shelves: 0, mat: 'gaia18', facadeMat: 'gaia18' });
  cabinet('Навесной шкаф над нишей', 'wall', NX, NY + NH, { W: NW, H: H - NY - NH, D: UD, doors: 1, shelves: 0 });
  obj('LED-лента в накладном профиле', NX + 30, NY + NH - 26, UD - 70, { w: NW - 60, finish: 'warm', name: 'Подсветка ниши' });
  obj('LED-лента во врезном профиле', NX + 30, NY + NH - 18, 40, { w: NW - 60, finish: 'warm', name: 'Подсветка ниши (задняя)' });
  obj('Ваза высокая', NX + 150, NY + 18, 110, { finish: 'black', h: 300, w: 130, d: 130 });
  obj('Стопка книг', NX + 40, NY + 18, 120, { finish: 'white', w: 180 });
  const RX2 = NX + NW, rest = X1 - RX2;
  cabinet('Навесной шкаф 3', 'wall', RX2, UB, { W: Math.round(rest / 2), H: UH, D: UD, doors: 1 });
  cabinet('Навесной шкаф 4', 'wall', RX2 + Math.round(rest / 2), UB, { W: rest - Math.round(rest / 2), H: UH, D: UD, doors: 1 });
  // подсветка под шкафами по всей длине (кроме ниши — у неё своя)
  obj('LED-лента в накладном профиле', X0 + 20, UB - 8, UD - 60, { w: NX - X0 - 40, finish: 'warm', name: 'Подсветка под шкафами слева' });
  obj('LED-лента в накладном профиле', RX2 + 20, UB - 8, UD - 60, { w: X1 - RX2 - 40, finish: 'warm', name: 'Подсветка под шкафами справа' });

  // ---- свет: трубка на подвесах вдоль стола, накладные споты по потолку
  obj('Подвесной линейный светильник-трубка 1,2 м', 1050, 1600, 520, { w: 1700, h: H - 1600, d: 40, finish: 'brass', name: 'Светильник-трубка над столом' });
  for (const [x, z] of [[1150, 1000], [2550, 1000], [250, 800]]) obj('Накладной спот-цилиндр', x, H - 100, z, { finish: 'black' });

  // ---- на столе
  obj('Ваза с сухоцветом (пампас)', X0 + 120, TOP, 110, { finish: 'white', h: 560 });
  obj('Ваза-бутылка', X0 + 330, TOP, 150, { finish: 'white', h: 230 });
  obj('Свечи (3 шт.)', X0 + 470, TOP, 170, { finish: 'ivory' });
  obj('Стопка книг', X0 + 700, TOP, 140, { finish: 'white' });
  obj('Стопка книг', 2150, TOP, 130, { finish: 'beige' });
  obj('Ваза с сухоцветом (пампас)', 2200, TOP + 70, 140, { finish: 'white', h: 520, w: 120, d: 120 });
  obj('Ноутбук', 2580, TOP, 90, { finish: 'grey' });
  obj('Стакан кофе', 2950, TOP, 240, { finish: 'terracotta' });
  // четыре барных стула велюр на латунных ножках, лицом к столу
  for (const cx of [1150, 1580, 2330, 2780]) obj('Барный стул велюр, латунные ножки', cx - 230, 0, D + 60, { finish: 'velvet', seat: 760, h: 1040 });

  // ---- напротив: жалюзи на окнах (смотрят в комнату), розетки и выключатель
  for (const off of [150, 1650]) obj('Жалюзи горизонтальные (ламели 25 мм)', L - off - 1350, 150, ROOM_D - 60, { w: 1350, h: 2300, d: 40, finish: 'black', rot: 2 });
  obj('Розетки над столешницей (блок из 3)', 2650, TOP + 120, 0, { finish: 'white', name: 'Розетки над столом' });
  obj('Розетка двойная', 1250, TOP + 120, 0, { finish: 'white', name: 'Розетка над столом' });
  obj('Выключатель двухклавишный', 40, 900, ROOM_D - 400, { finish: 'white', rot: 1, name: 'Выключатель у двери' });
}

export const SAMPLES = [
  { id: 'study', name: 'Кабинет у окна', note: 'Ниша 3150 × 2650 × 390 мм: стол из дуба на 4 места, рейки, шкафы до потолка с подсвеченной нишей, стеллаж с подсветкой, светильник-трубка, жалюзи', build: studyNook },
];
