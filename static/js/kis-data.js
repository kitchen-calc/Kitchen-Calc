/* Фурнитура на выбор для калькуляторов /calc и /shkaf.
   Цены в сумах за штуку / комплект, розница kis.uz на 06.10.2026 (kis.uz/collections/...). Менять цены — здесь.
   avail: false — товара сейчас нет в наличии на kis.uz (можно выбрать «под заказ», срок уточняет мастер). */
const KIS = {
  date: '06.10.2026',
  // Петли Blum (одна петля) + ответная планка CLIP на шурупы 3 990
  plate: 3990,
  hinges: {
    tier:    { ru: 'По классу комплектации' },
    std_soft: { ru: 'Blum CLIP top BLUMOTION 110° (с доводчиком)', price: 39235 },
    std:      { ru: 'Blum CLIP top 110° (без доводчика)', price: 22100 },
    eco:      { ru: 'Blum CLIP 100° (эконом)', price: 14400 },
    black:    { ru: 'Blum CLIP top BLUMOTION чёрная 110°', price: 55860 },
    inset:    { ru: 'Blum CLIP top BLUMOTION 107° вкладная', price: 46550 },
    wide155:  { ru: 'Blum CLIP top BLUMOTION 155° (нулевое вхождение)', price: 86450 },
    wide170:  { ru: 'Blum CLIP top 170°', price: 46550 },
    frame:    { ru: 'Blum CLIP top BLUMOTION для рамочных фасадов 95°', price: 66500 },
    glass:    { ru: 'Blum CLIP top для стеклянных дверей 94°', price: 36600 }
  },
  // Как открываются двери и ящики
  open: {
    tier:          { ru: 'По классу комплектации' },
    handle_eco:    { ru: 'Ручки: эконом (скоба)', price: 52200, handle: true },
    handle_std:    { ru: 'Ручки: стандарт (Giusti, Marella)', price: 99000, handle: true },
    handle_design: { ru: 'Ручки: дизайнерские (Linea, Scandi)', price: 145600, handle: true },
    tipon_s:       { ru: 'Blum TIP-ON, короткий (без ручек)', price: 38570 + 11970 + 4655, tipon: true },
    tipon_l:       { ru: 'Blum TIP-ON, длинный (без ручек)', price: 51870 + 11970 + 4655, tipon: true }
  },
  // Подъёмные механизмы (на один фасад). HL сейчас нет в наличии.
  lifts: {
    hinge:  { ru: 'Обычные петли (распашные)' },
    hk_xs:  { ru: 'Blum AVENTOS HK-XS (малый поворотный)', price: 231420, short: 'HK-XS' },
    hk_s:   { ru: 'Blum AVENTOS HK-S (малый поворотный)', price: 348460, short: 'HK-S' },
    hk_top: { ru: 'Blum AVENTOS HK top (поворотный)', price: 633080, short: 'HK top' },
    hf:     { ru: 'Blum AVENTOS HF (складной)', price: 1181040, short: 'HF' },
    hf_top: { ru: 'Blum AVENTOS HF top (складной)', price: 1377880, short: 'HF top' },
    hs:     { ru: 'Blum AVENTOS HS (откидной)', price: 1299410, short: 'HS' },
    hl:     { ru: 'Blum AVENTOS HL (вертикальный, под заказ)', price: 1344630, short: 'HL', avail: false }
  },
  // Раздвижные системы шкафа-купе Cinetto: комплект на 2 и 3 створки (4+ — по цене створки)
  sliding: {
    tier:  { ru: 'По классу комплектации' },
    ps48:  { ru: 'Cinetto PS48 (алюминий, шкаф-купе)', p2: 4256000, p3: 5519500, short: 'PS48' },
    ps06:  { ru: 'Cinetto PS06 (шкаф-купе)', p2: 4256000, p3: 5519500, short: 'PS06' },
    ps40:  { ru: 'Cinetto PS40 (премиум, тонкий профиль)', p2: 13034000, p3: 19551000, short: 'PS40' }
  },
  folding: { ru: 'Cinetto PS23 (складные двери «книжка»), 4 створки', p25: 1596000, p50: 1995000 },
  // Гардеробные системы Cabio
  cabio: {
    pant:     { ru: 'Пантограф Cabio, ручной', price: 2125000 },
    pant_e:   { ru: 'Пантограф Cabio с электроприводом', price: 4563000 },
    rod:      { ru: 'Штанга Cabio Premium', price: 565000 },
    trouser:  { ru: 'Вешалка для брюк Cabio', price: 1375000 },
    shoe_rot: { ru: 'Вращающаяся обувница 380° Cabio', price: 5120000 },
    basket:   { ru: 'Корзина для белья Cabio', price: 2500000 },
    leather:  { ru: 'Выдвижной ящик Cabio с кожаным дном', price: 1913000 },
    access:   { ru: 'Ящик для аксессуаров Cabio с кожаным дном', price: 2363000 },
    shoe_box: { ru: 'Ящик для хранения обуви Cabio', price: 3375000 }
  },
  pantSel: {
    tier:    { ru: 'По классу комплектации' },
    cabio:   { ru: 'Пантограф Cabio, ручной', price: 2125000 },
    cabio_e: { ru: 'Пантограф Cabio с электроприводом', price: 4563000 }
  },
  rodSel: {
    tier:  { ru: 'По классу комплектации' },
    cabio: { ru: 'Штанга Cabio Premium', price: 565000 }
  },
  // Кухня: угловые механизмы (Vauth-Sagel), ящик под мойку Blum, карго, конструкции Blum
  corner: {
    none:    { ru: 'Без углового механизма' },
    flex:    { ru: 'Vauth-Sagel VS COR Flex Classic', price: 3990000 },
    cstone:  { ru: 'Vauth-Sagel Cornerstone Maxx', price: 4138960 },
    dynamic: { ru: 'Vauth-Sagel DYNAMIC CORNER', price: 4389000 },
    flexp:   { ru: 'Vauth-Sagel VS COR Flex Premea', price: 5054000 },
    compact: { ru: 'Vauth-Sagel COMPACT', price: 5320000 },
    fold:    { ru: 'Vauth-Sagel VS COR Fold Planero', price: 5309360 },
    space_c: { ru: 'Blum SPACE CORNER (под заказ)', price: 1275200, avail: false }
  },
  sinkbox: {
    none:     { ru: 'Обычная дверца под мойкой' },
    antaro:   { ru: 'Blum TANDEMBOX antaro, ящик под мойку', price: 765550 },
    legrabox: { ru: 'Blum LEGRABOX pure, ящик под мойку', price: 1025700 },
    intivo:   { ru: 'Blum TANDEMBOX intivo, ящик под мойку', price: 2977870 },
    plus:     { ru: 'Blum TANDEMBOX plus, ящик под мойку (под заказ)', price: 754910, avail: false }
  },
  cargo: {
    none:    { ru: 'Без карго' },
    cromat:  { ru: 'Карго CROMATICA (узкий ящик)', price: 598500 },
    sub150:  { ru: 'Карго VS SUB Rack Classic 150 мм', price: 784700 },
    sub200:  { ru: 'Карго VS SUB Rack Classic 200 мм', price: 877800 },
    sub300:  { ru: 'Карго VS SUB Rack Classic 300 мм', price: 1024100 },
    quadro:  { ru: 'Карго QUADRO 2102', price: 1143800 }
  },
  space: {
    none:     { ru: 'Без внутренних конструкций' },
    twin_a:   { ru: 'Blum SPACE TWIN TANDEMBOX antaro (внутренний ящик)', price: 1058150 },
    twin_l:   { ru: 'Blum SPACE TWIN LEGRABOX (внутренний ящик)', price: 1201390 },
    tower_a:  { ru: 'Blum SPACE TOWER antaro (кладовая-пенал)', price: 4573600 },
    tower_l:  { ru: 'Blum SPACE TOWER LEGRABOX (кладовая-пенал)', price: 6022240 },
    bottle:   { ru: 'Бутылочница VS TAL Rack15', price: 2527000 }
  }
};
/* Системы ящиков Blum (комплект на один ящик, kis.uz). vis — как рисовать в 3D: h — высота боковины (см), col — цвет, rail — релинг, slim — тонкая боковина, hidden — скрытые направляющие */
KIS.drawerSys = {
  tier:        { ru: 'По классу комплектации' },
  tandem_fix:  { ru: 'Blum TANDEM на фиксаторах (скрытые направляющие)', price: 151620, vis: { h: 0, col: '#d9cdb8', hidden: true } },
  tandem_lock: { ru: 'Blum TANDEM на замках (скрытые направляющие)', price: 182210, vis: { h: 0, col: '#d9cdb8', hidden: true } },
  movento:     { ru: 'Blum MOVENTO (скрытые направляющие)', price: 315000, vis: { h: 0, col: '#d9cdb8', hidden: true } },
  tbx_m:       { ru: 'Blum TANDEMBOX plus · стандартный (M)', price: 503800, vis: { h: 8.3, col: '#8d9399' } },
  tbx_b:       { ru: 'Blum TANDEMBOX plus · с одинарным релингом (B)', price: 575625, vis: { h: 8.3, col: '#8d9399', rail: 1 } },
  tbx_d:       { ru: 'Blum TANDEMBOX plus · с двойным релингом (D)', price: 662075, vis: { h: 8.3, col: '#8d9399', rail: 2 } },
  tbx_ds:      { ru: 'Blum TANDEMBOX plus · с двусторонней боковиной (D)', price: 776455, vis: { h: 14.4, col: '#8d9399', rail: 1 } },
  tbx_in:      { ru: 'Blum TANDEMBOX plus · внутренний с двойным релингом (D)', price: 973960, vis: { h: 14.4, col: '#8d9399', rail: 2 } },
  lbx_m:       { ru: 'Blum LEGRABOX pure · стандартный (M)', price: 683100, vis: { h: 9, col: '#b9bec2', slim: true } },
  lbx_c:       { ru: 'Blum LEGRABOX pure · с высоким фасадом (C)', price: 849470, vis: { h: 17.7, col: '#b9bec2', slim: true } },
  lbx_fc:      { ru: 'Blum LEGRABOX free · с высоким фасадом (C)', price: 868090, vis: { h: 17.7, col: '#e5e7e9', slim: true } },
  lbx_f:       { ru: 'Blum LEGRABOX pure · с высоким фасадом (F)', price: 1170135, vis: { h: 24.1, col: '#b9bec2', slim: true } },
  mer_m:       { ru: 'MERIVOBOX (M) стандартный ящик, царга 91 мм', price: 611535, vis: { h: 9.1, col: '#aab0b5', slim: true } },
  mer_k:       { ru: 'MERIVOBOX (K) стандартный ящик, царга 129 мм', price: 696000, vis: { h: 12.9, col: '#aab0b5', slim: true } },
  mer_e:       { ru: 'MERIVOBOX (E) с релингом, царга 192 мм', price: 759300, vis: { h: 19.2, col: '#aab0b5', slim: true, rail: 1 } }
};
/* Для кухни: газлифт по классу + подъёмники Blum (без «обычных петель») */
KIS.liftsK = Object.assign({ tier: { ru: 'По классу комплектации (газлифт)' } }, (() => { const o = Object.assign({}, KIS.lifts); delete o.hinge; return o; })());
/* Короткое имя выбранного варианта для чертежей и спецификации */
KIS.name = (grp, key) => { const g = KIS[grp]; return g && g[key] ? g[key].ru : ''; };
