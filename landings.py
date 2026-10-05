"""Посадочные страницы под поисковые запросы и страница для партнёров — оформлены так же, как главная.

Все тексты — здесь. Чтобы добавить страницу, добавьте запись в PAGES: адрес появится в sitemap, в меню и в списке «Другие услуги».
Не пишите сюда того, чего нет (цены, опыт, количество работ) — клиенты это проверяют.
Фото берутся из static/home/ (ph-*.webp, hero.webp); подписи к ним такие же, как на главной.
"""
import html
import json

SITE_URL = "https://kitchen-calc.uz"
PHONE = "+998 92 093-45-10"
PHONE_TEL = "+998920934510"
TG = "Kitchencalc"

# Подписи к фото (код, подпись) — те же, что на главной
PH = {
    "k1": "Тёмное дерево и рейки", "k2": "Графит и встроенная техника", "k3": "Камень, остров и подвесная полка",
    "k4": "Светлая современная кухня", "k5": "Классика со стеклянными светильниками", "k6": "Угловая кухня у окна",
    "b1": "Спальня с панорамным остеклением и деревянной стеной", "b2": "Спальня со стеновыми панелями и встроенным шкафом",
    "b3": "Мягкие стеновые панели и подсветка", "b4": "Акцентная стена из дерева и шкаф до потолка",
    "w1": "Гардеробная с туалетным столиком", "w2": "Гардеробная в тёмных тонах с подсветкой",
    "w3": "Выдвижные ящики и открытые полки", "w4": "Шкаф-купе до потолка",
    "h1": "Прихожая со шкафом до потолка и лавкой", "h2": "Шкаф с нишей для обуви",
}

COMMON_STEPS = [
    ("Заявка и бесплатный замер", "Напишите или позвоните, мы приедем, снимем размеры и обсудим пожелания."),
    ("Проект и расчёт", "Готовим проект, спецификацию и точную стоимость. Всё согласуем до начала работ."),
    ("Договор", "Цена, сроки, порядок оплаты и гарантия фиксируются в договоре."),
    ("Изготовление", "Делаем мебель по вашим размерам. Срок указываем в договоре."),
    ("Доставка и монтаж", "Привозим, собираем и устанавливаем по Ташкенту, регулируем фасады и фурнитуру, сдаём по акту."),
]

TG_URL = "https://t.me/" + TG

# Секции: ("list", заголовок, [пункты]) · ("text", заголовок, текст) · ("steps", заголовок) · ("cards", заголовок, [(название, текст)])
PAGES = {
    "kuhni-na-zakaz-tashkent": {
        "nav": "Кухни", "hero": "hero.webp", "eyebrow": "Кухни · Ташкент",
        "title": "Кухни на заказ в Ташкенте под ключ — расчёт онлайн | Kitchen Calc",
        "description": "Кухни на заказ в Ташкенте: бесплатный замер, проект, изготовление, доставка и монтаж. Соберите кухню в онлайн-калькуляторе и узнайте цену за 2 минуты. Работаем по договору, гарантия 12 месяцев.",
        "h1": "Кухни на заказ в Ташкенте <em>под ключ</em>",
        "h1_plain": "Кухни на заказ в Ташкенте под ключ",
        "lead": "Делаем кухни по вашим размерам: от замера до монтажа. Соберите свой вариант в онлайн-калькуляторе — сразу увидите цену и чертёж, а мастер получит все размеры для проекта.",
        "cta_label": "Рассчитать кухню онлайн", "cta_url": "/calc",
        "gallery": ["k1", "k2", "k3", "k4", "k5", "k6"],
        "sections": [
            ("list", "Что вы можете выбрать", [
                "Форму кухни: прямая, угловая (Г-образная), П-образная, а также остров.",
                "Материалы фасадов и корпуса: ЛДСП, ЛМДФ, акрил, несколько ценовых уровней — от эконом до премиум.",
                "Открывание: с ручками, без ручек (Push-to-Open) или гола-профиль.",
                "Фурнитуру: от экономной до Blum (петли, ящики, подъёмники).",
                "Встроенную технику: холодильник, духовой шкаф, микроволновая печь, посудомоечная и стиральная машины, варочная панель.",
                "Пенал до потолка под технику, верхние шкафы в один или два яруса, подсветку, столешницу.",
            ]),
            ("text", "Как работает онлайн-калькулятор",
             "Вы выбираете форму кухни и размеры стен, расставляете шкафы и технику, подбираете цвета и материалы. Калькулятор сразу показывает визуализацию, чертежи спереди и сверху и ориентировочную стоимость. Результат можно отправить мастеру в Telegram или скопировать ссылкой. Итоговая цена уточняется после замера и фиксируется в договоре."),
            ("steps", "Как мы работаем"),
            ("list", "Что входит в стоимость", [
                "Замер помещения, проект и спецификация.",
                "Изготовление кухни, доставка по Ташкенту, сборка и установка.",
                "Регулировка фасадов и фурнитуры и подписание акта приёмки.",
                "Подключение техники, воды и электричества, демонтаж старой мебели и выравнивание стен обычно не входят — это уточняется в договоре.",
            ]),
        ],
        "faq": [
            ("Сколько стоит кухня на заказ?", "Цена зависит от размеров, материалов фасадов и корпуса, фурнитуры, столешницы и техники. Ориентировочную стоимость вы получите сразу в калькуляторе, точную — после замера и согласования проекта."),
            ("Сколько времени занимает изготовление?", "Срок изготовления зависит от материалов и сложности проекта: обычно от 3 до 30 рабочих дней. Конкретный срок фиксируется в договоре."),
            ("Замер платный?", "Нет, замер бесплатный."),
            ("Какая гарантия?", "Гарантия на изделие и монтаж — 12 месяцев со дня подписания акта приёмки; на фурнитуру и технику действует гарантия производителя."),
            ("Вы устанавливаете встроенную технику?", "Мы изготавливаем ниши под технику и устанавливаем её в мебель. Модели и габариты уточняем до запуска в производство. Покупка самой техники и её подключение обсуждаются отдельно."),
        ],
    },
    "shkafy-kupe-na-zakaz-tashkent": {
        "nav": "Шкафы-купе", "hero": "ph-w4.webp", "eyebrow": "Шкафы-купе · Ташкент",
        "title": "Шкафы-купе на заказ в Ташкенте — замер, изготовление, монтаж | Kitchen Calc",
        "description": "Шкафы-купе на заказ в Ташкенте по вашим размерам: бесплатный замер, проект, изготовление, доставка и установка. Работаем по договору, гарантия 12 месяцев.",
        "h1": "Шкафы-купе на заказ <em>в Ташкенте</em>",
        "h1_plain": "Шкафы-купе на заказ в Ташкенте",
        "lead": "Шкаф-купе по вашим размерам: в нишу, от стены до стены или отдельно стоящий. Приедем на бесплатный замер, предложим внутреннее наполнение и согласуем проект и стоимость в договоре.",
        "cta_label": "Заказать замер в Telegram", "cta_url": TG_URL,
        "gallery": ["w4", "h1", "b4", "b2"],
        "sections": [
            ("list", "Что мы делаем", [
                "Шкафы-купе под размер вашей ниши или комнаты, с раздвижными дверями.",
                "Внутреннее наполнение: полки, штанги, ящики, выдвижные системы — под ваши вещи.",
                "Материалы и цвета фасадов и корпуса подбираем по образцам на замере.",
                "Доставка и установка по Ташкенту.",
            ]),
            ("list", "На что обратить внимание при заказе", [
                "Точные размеры по месту: стены и потолки редко бывают ровными, поэтому мы снимаем размеры сами.",
                "Расположение розеток, батарей и вентиляции: их нужно учесть до изготовления.",
                "Наполнение: заранее решите, что будете хранить, чтобы шкаф был удобным.",
            ]),
            ("steps", "Как мы работаем"),
        ],
        "faq": [
            ("Сколько стоит шкаф-купе на заказ?", "Стоимость зависит от размеров, материалов, количества дверей и внутреннего наполнения. Точную цену называем после бесплатного замера и фиксируем в договоре."),
            ("Можно ли сделать шкаф-купе в нишу нестандартного размера?", "Да, изготавливаем по индивидуальным размерам после замера."),
            ("Сколько времени занимает изготовление?", "Срок зависит от проекта и материалов, указываем его в договоре."),
            ("Какая гарантия на шкаф?", "Гарантия на изделие и монтаж — 12 месяцев со дня подписания акта приёмки."),
        ],
    },
    "garderobnye-na-zakaz-tashkent": {
        "nav": "Гардеробные", "hero": "ph-w1.webp", "eyebrow": "Гардеробные · Ташкент",
        "title": "Гардеробные на заказ в Ташкенте — проект и монтаж | Kitchen Calc",
        "description": "Гардеробные комнаты на заказ в Ташкенте: бесплатный замер, проект под ваши вещи, изготовление, доставка и монтаж. Работаем по договору, гарантия 12 месяцев.",
        "h1": "Гардеробные на заказ <em>в Ташкенте</em>",
        "h1_plain": "Гардеробные на заказ в Ташкенте",
        "lead": "Гардеробная под ваши вещи и размеры помещения: открытые системы хранения или закрытые шкафы, штанги, полки, ящики. Приедем на замер, предложим планировку и согласуем стоимость в договоре.",
        "cta_label": "Заказать замер в Telegram", "cta_url": TG_URL,
        "gallery": ["w1", "w2", "w3", "w4"],
        "sections": [
            ("list", "Что входит в проект гардеробной", [
                "Планировка с учётом ваших вещей: платья, рубашки, обувь, сумки, бельё.",
                "Зоны хранения: штанги разной высоты, полки, выдвижные ящики, обувницы.",
                "Материалы, цвета и фурнитура, подобранные по вашему вкусу и бюджету.",
                "Доставка и монтаж по Ташкенту.",
            ]),
            ("list", "Как подготовиться к замеру", [
                "Освободите помещение или покажите, где что должно стоять.",
                "Заранее прикиньте, сколько вещей и какой длины нужно разместить.",
                "Подумайте об освещении и зеркале — это тоже можно предусмотреть в проекте.",
            ]),
            ("steps", "Как мы работаем"),
        ],
        "faq": [
            ("Сколько стоит гардеробная на заказ?", "Цена зависит от размеров помещения, материалов и наполнения. После бесплатного замера делаем расчёт и фиксируем стоимость в договоре."),
            ("Можно ли сделать гардеробную в маленькой комнате или нише?", "Да, проект подбирается под размеры помещения; в небольшом пространстве важно продумать вместимость."),
            ("Вы делаете гардеробные с подсветкой?", "Подсветку можно предусмотреть в проекте; детали обсуждаем на замере."),
            ("Какая гарантия?", "Гарантия на изделие и монтаж — 12 месяцев со дня подписания акта приёмки."),
        ],
    },
    "prihozhie-na-zakaz-tashkent": {
        "nav": "Прихожие", "hero": "ph-h2.webp", "eyebrow": "Прихожие · Ташкент",
        "title": "Прихожие на заказ в Ташкенте — шкаф, вешалка, обувница | Kitchen Calc",
        "description": "Прихожие на заказ в Ташкенте по вашим размерам: шкафы, открытые вешалки, обувницы, зеркала. Бесплатный замер, изготовление, доставка и монтаж, работа по договору.",
        "h1": "Прихожие на заказ <em>в Ташкенте</em>",
        "h1_plain": "Прихожие на заказ в Ташкенте",
        "lead": "Прихожая, которая помещается именно в ваш коридор: шкаф для одежды, место для обуви, вешалка и зеркало. Приедем на бесплатный замер, предложим решение и согласуем проект и цену в договоре.",
        "cta_label": "Заказать замер в Telegram", "cta_url": TG_URL,
        "gallery": ["h1", "h2"],
        "sections": [
            ("list", "Что можно предусмотреть", [
                "Шкаф для верхней одежды, с распашными или раздвижными дверями.",
                "Обувница, полки для головных уборов и сумок, выдвижные ящики.",
                "Открытая вешалка, скамья, зеркало.",
                "Материалы и цвета, подходящие к остальной мебели в квартире.",
            ]),
            ("list", "Особенности небольших коридоров", [
                "В узком коридоре важна глубина шкафа: подбираем размеры так, чтобы проход оставался комфортным.",
                "Если места мало, можно использовать высоту стены и верхние антресоли.",
            ]),
            ("steps", "Как мы работаем"),
        ],
        "faq": [
            ("Сколько стоит прихожая на заказ?", "Цена зависит от размеров, материалов и наполнения. Точную стоимость называем после замера и фиксируем в договоре."),
            ("Можно ли сделать прихожую в узком коридоре?", "Да, проект подбирается под размеры коридора, мы предложим подходящую глубину и конструкцию."),
            ("Сколько занимает изготовление?", "Срок зависит от проекта и материалов, указываем его в договоре."),
            ("Вы привозите и устанавливаете мебель?", "Да, доставка и монтаж по Ташкенту входят в услугу."),
        ],
    },
    "mebel-dlya-spalni-na-zakaz-tashkent": {
        "nav": "Спальни", "hero": "ph-b2.webp", "eyebrow": "Спальни · Ташкент",
        "title": "Мебель для спальни на заказ в Ташкенте — шкафы, изголовья, тумбы | Kitchen Calc",
        "description": "Мебель для спальни на заказ в Ташкенте: шкафы, изголовья, тумбы, комоды, встроенные решения. Бесплатный замер, изготовление, доставка и монтаж, работа по договору.",
        "h1": "Мебель для спальни на заказ <em>в Ташкенте</em>",
        "h1_plain": "Мебель для спальни на заказ в Ташкенте",
        "lead": "Шкафы, изголовья, тумбы, комоды и встроенные системы хранения для спальни — по вашим размерам и в нужных цветах. Приедем на замер, предложим проект и согласуем цену в договоре.",
        "cta_label": "Заказать замер в Telegram", "cta_url": TG_URL,
        "gallery": ["b1", "b2", "b3", "b4"],
        "sections": [
            ("list", "Что мы делаем для спальни", [
                "Шкафы: распашные и купе, до потолка или отдельно стоящие.",
                "Изголовья кровати, прикроватные тумбы и комоды.",
                "Встроенные системы хранения вокруг кровати или в нише.",
                "Отделку стеновыми панелями и другие решения по проекту — обсудим на замере.",
            ]),
            ("list", "Что обсудим на замере", [
                "Расположение кровати, розеток и светильников.",
                "Что именно нужно хранить и какой объём шкафа вам комфортен.",
                "Стиль и цвета, чтобы мебель подошла к интерьеру.",
            ]),
            ("steps", "Как мы работаем"),
        ],
        "faq": [
            ("Сколько стоит мебель для спальни на заказ?", "Цена зависит от набора мебели, размеров, материалов и фурнитуры. Точную стоимость называем после замера."),
            ("Можно ли заказать только шкаф или только изголовье?", "Да, можно заказать отдельные предметы или комплект."),
            ("Сколько ждать готовую мебель?", "Срок зависит от проекта и материалов, указываем его в договоре."),
            ("Есть ли гарантия?", "Да, 12 месяцев на изделие и монтаж со дня подписания акта приёмки."),
        ],
    },
}

PARTNERS = {
    "nav": "Партнёрам", "hero": "ph-k2.webp", "eyebrow": "Партнёрам · Ташкент",
    "title": "Для дизайнеров и строителей — кухни и мебель на заказ | Kitchen Calc",
    "description": "Сотрудничество с дизайнерами интерьеров и ремонтными бригадами в Ташкенте: бесплатный замер, расчёт кухни онлайн за 2 минуты, работа по договору, доставка и монтаж.",
    "h1": "Кухни и мебель для ваших клиентов — <em>без хлопот</em>",
    "h1_plain": "Для дизайнеров и строителей",
    "lead": "Если вы ведёте ремонт или проект интерьера, мы берём на себя кухню и корпусную мебель: замер, проект, изготовление, доставку и монтаж. Работаем по договору, цену клиенту называем сразу.",
    "cta_label": "Написать в Telegram", "cta_url": TG_URL,
    "gallery": ["k2", "k3", "w2", "b2"],
    "gallery_title": "Примеры решений, которые можно заказать",
    "sections": [
        ("cards", "Что вы получаете", [
            ("Бесплатный замер", "Выезжаем к вашему клиенту, фиксируем размеры и пожелания, делаем проект и спецификацию."),
            ("Цена за 2 минуты", "В онлайн-калькуляторе клиент сам собирает кухню: холодильник, духовку, пенал до потолка — и сразу видит цену и чертёж."),
            ("Договор и гарантия", "Цена, сроки и порядок оплаты фиксируются в договоре до начала работ. Гарантия на изделие и монтаж — 12 месяцев."),
            ("Доставка и монтаж", "Привозим, собираем и устанавливаем по Ташкенту, регулируем фасады и фурнитуру, сдаём по акту."),
            ("Чертежи для проектов", "Размеры ниш под технику, высоты, схемы шкафов — всё в спецификации, чтобы дизайнеру и строителям было удобно согласовывать."),
            ("Благодарность за рекомендацию", "Условия вознаграждения партнёру обсуждаем индивидуально и фиксируем заранее — напишите, и мы предложим вариант."),
        ]),
        ("psteps", "Как это работает", [
            ("Вы передаёте контакт клиента", "Сообщением в Telegram или звонком. Можно отправить ссылку на расчёт из калькулятора."),
            ("Мы связываемся с клиентом", "Уточняем размеры и технику, договариваемся о бесплатном замере."),
            ("Проект, договор и предоплата", "Согласуем эскиз и спецификацию, подписываем договор."),
            ("Изготовление и монтаж", "Сроки фиксируются в договоре. Сдаём работу по акту приёмки."),
        ]),
    ],
    "faq": [
        ("Как оформляется вознаграждение партнёру?", "Условия мы обсуждаем индивидуально и фиксируем заранее в переписке или в простом договоре. Напишите нам в Telegram, и мы предложим вариант."),
        ("Кто заключает договор с клиентом?", "Договор на изготовление, доставку и установку мебели заключается между нами и клиентом."),
        ("Можно ли передать клиента, не звоня?", "Да: достаточно прислать контакт или ссылку на расчёт из калькулятора в Telegram."),
    ],
}

CSS = """
:root { --bg:#11100e; --bg-2:#191714; --bg-3:#221f1b; --line:rgba(236,226,210,.10); --text:#ece4d8; --muted:#a79d8f; --gold:#c8a46b; --gold-2:#e2c48f; --serif:'Cormorant Garamond',Georgia,serif; --sans:'Manrope','Segoe UI',system-ui,sans-serif; --script:'Marck Script',cursive; }
* { box-sizing:border-box; margin:0; padding:0; }
html { scroll-behavior:smooth; }
body { background:var(--bg); color:var(--text); font-family:var(--sans); line-height:1.6; -webkit-font-smoothing:antialiased; }
a { color:inherit; text-decoration:none; }
img { display:block; max-width:100%; }
.wrap { max-width:1240px; margin:0 auto; padding:0 24px; }
.hdr { position:fixed; inset:0 0 auto 0; z-index:50; transition:background .3s,border-color .3s; border-bottom:1px solid transparent; }
.hdr.solid { background:rgba(17,16,14,.92); backdrop-filter:blur(10px); border-color:var(--line); }
.hdr .wrap { display:flex; align-items:center; justify-content:space-between; gap:20px; height:84px; }
.logo { display:flex; align-items:center; gap:14px; }
.logo-mark { font-family:var(--script); font-size:2.3rem; line-height:1; color:#f6efe3; letter-spacing:.5px; white-space:nowrap; }
.logo-sub { font-family:var(--serif); font-style:italic; font-size:.95rem; line-height:1.15; color:var(--muted); max-width:150px; border-left:1px solid var(--line); padding-left:14px; }
.logo-sub b { display:block; font-style:normal; font-family:var(--sans); font-size:.78rem; letter-spacing:.14em; text-transform:uppercase; color:var(--gold); font-weight:700; }
.nav { display:flex; align-items:center; gap:24px; }
.nav > a, .nav .has-sub > a { font-size:.92rem; font-weight:600; color:#e9e1d4; position:relative; white-space:nowrap; }
.nav > a::after, .nav .has-sub > a::after { content:''; position:absolute; left:0; right:0; bottom:-6px; height:1px; background:var(--gold); transform:scaleX(0); transition:transform .25s; }
.nav > a:hover::after, .nav .has-sub:hover > a::after, .nav a.on::after { transform:scaleX(1); }
@media (max-width:1620px) { .logo-sub { display:none; } .nav { gap:18px; } .hdr-right { flex-wrap:nowrap; gap:10px; } }
.has-sub { position:relative; padding:28px 0; }
.has-sub > a::before { content:'▾'; font-size:.7rem; margin-left:6px; order:2; float:right; color:var(--gold); }
.sub { display:none; position:absolute; top:100%; left:-16px; min-width:230px; background:rgba(17,16,14,.97); border:1px solid var(--line); padding:8px 0; box-shadow:0 20px 40px rgba(0,0,0,.5); z-index:60; }
.has-sub:hover .sub, .has-sub:focus-within .sub { display:block; }
.sub a { display:block; padding:11px 20px; font-size:.9rem; font-weight:600; color:#e9e1d4; white-space:nowrap; }
.sub a:hover { background:var(--bg-2); color:var(--gold-2); }
.hdr-right { display:flex; align-items:center; gap:14px; }
.btn { display:inline-flex; align-items:center; justify-content:center; gap:10px; font:700 .82rem var(--sans); letter-spacing:.12em; text-transform:uppercase; padding:15px 26px; border-radius:2px; cursor:pointer; transition:all .25s; border:1px solid var(--gold); white-space:nowrap; }
.btn-gold { background:var(--gold); color:#1b1408; }
.btn-gold:hover { background:var(--gold-2); border-color:var(--gold-2); }
.btn-line { background:transparent; color:var(--text); border-color:rgba(236,226,210,.45); }
.btn-line:hover { border-color:var(--gold); color:var(--gold-2); }
.btn-sm { padding:10px 16px; font-size:.74rem; }
.pill { border:1px solid var(--gold); color:var(--gold-2); padding:8px 14px; font:700 .74rem var(--sans); letter-spacing:.1em; text-transform:uppercase; border-radius:999px; white-space:nowrap; }
.pill:hover { background:var(--gold); color:#1b1408; }
.burger { display:none; background:none; border:1px solid var(--line); color:var(--text); width:42px; height:42px; border-radius:2px; font-size:1.2rem; cursor:pointer; }
.hero { position:relative; min-height:78vh; display:flex; align-items:center; overflow:hidden; }
.hero-photo { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center; }
.hero::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,rgba(17,16,14,.92) 0%,rgba(17,16,14,.78) 34%,rgba(17,16,14,.4) 58%,rgba(17,16,14,.12) 100%),linear-gradient(180deg,rgba(17,16,14,.5) 0%,rgba(17,16,14,0) 26%,rgba(17,16,14,0) 66%,var(--bg) 100%); }
.hero .wrap { position:relative; z-index:2; padding-top:130px; padding-bottom:80px; }
.hero .wrap > div { max-width:680px; }
.eyebrow { font:700 .76rem var(--sans); letter-spacing:.22em; text-transform:uppercase; color:var(--gold); display:flex; align-items:center; gap:14px; }
.eyebrow::before { content:''; width:40px; height:1px; background:var(--gold); }
.hero h1 { font-family:var(--serif); font-weight:600; font-size:clamp(2.4rem,5vw,4.2rem); line-height:1.06; margin:22px 0; color:#f7f0e4; text-shadow:0 2px 24px rgba(0,0,0,.45); }
.hero h1 em { font-style:italic; color:var(--gold-2); font-weight:500; }
.hero p.lead { font-size:1.08rem; color:#ddd3c4; max-width:560px; text-shadow:0 1px 14px rgba(0,0,0,.65); }
.hero-cta { display:flex; gap:14px; flex-wrap:wrap; margin-top:32px; }
.facts { border-top:1px solid var(--line); border-bottom:1px solid var(--line); background:var(--bg-2); }
.facts .wrap { display:grid; grid-template-columns:repeat(4,1fr); }
.fact { padding:28px 24px; border-left:1px solid var(--line); }
.fact:first-child { border-left:0; }
.fact b { display:block; font-family:var(--serif); font-size:2rem; font-weight:600; color:var(--gold-2); line-height:1.1; }
.fact span { font-size:.86rem; color:var(--muted); }
section.block { padding:90px 0; }
.sec-head { display:flex; align-items:flex-end; justify-content:space-between; gap:30px; margin-bottom:44px; flex-wrap:wrap; }
.sec-head h2 { font-family:var(--serif); font-weight:600; font-size:clamp(2rem,3.8vw,3rem); line-height:1.08; margin-top:16px; color:#f4ecdf; }
.sec-head p { color:var(--muted); max-width:440px; }
.mosaic { display:grid; grid-template-columns:repeat(3,1fr); grid-auto-rows:250px; gap:14px; }
.mosaic .ph:first-child { grid-column:span 2; grid-row:span 2; }
.mosaic.two { grid-template-columns:repeat(2,1fr); grid-auto-rows:380px; }
.mosaic.two .ph:first-child { grid-column:auto; grid-row:auto; }
.mosaic.four { grid-template-columns:repeat(2,1fr); grid-auto-rows:300px; }
.mosaic.four .ph:first-child { grid-column:auto; grid-row:auto; }
.ph { position:relative; overflow:hidden; background:var(--bg-3); border:0; padding:0; cursor:zoom-in; display:block; width:100%; height:100%; color:inherit; font:inherit; text-align:left; }
.ph img { width:100%; height:100%; object-fit:cover; transition:transform .9s cubic-bezier(.2,.7,.2,1); }
.ph:hover img { transform:scale(1.05); }
.ph::after { content:''; position:absolute; inset:0; background:linear-gradient(180deg,transparent 55%,rgba(10,9,8,.82)); pointer-events:none; }
.ph span { position:absolute; left:18px; right:18px; bottom:14px; z-index:2; font-family:var(--serif); font-size:1.2rem; font-weight:600; line-height:1.2; color:#f6efe3; text-shadow:0 1px 12px rgba(0,0,0,.6); }
.gal-cta { display:flex; align-items:center; gap:22px; flex-wrap:wrap; margin-top:30px; color:var(--muted); }
.split { display:grid; grid-template-columns:5fr 7fr; gap:56px; align-items:start; }
.split h2 { font-family:var(--serif); font-weight:600; font-size:clamp(1.9rem,3.2vw,2.6rem); line-height:1.1; color:#f4ecdf; margin-top:14px; }
.split p { color:#cfc5b6; margin-bottom:12px; max-width:640px; }
.ticks { list-style:none; display:grid; gap:14px; }
.ticks li { display:flex; gap:14px; color:#e3dacb; }
.ticks li::before { content:''; flex:0 0 18px; height:1px; background:var(--gold); margin-top:13px; }
.alt { background:var(--bg-2); border-top:1px solid var(--line); border-bottom:1px solid var(--line); }
.steps { display:grid; grid-template-columns:repeat(5,1fr); border-top:1px solid var(--line); }
.steps.four { grid-template-columns:repeat(4,1fr); }
.step { padding:34px 22px 10px 0; position:relative; }
.step::before { content:''; position:absolute; top:-4px; left:0; width:7px; height:7px; background:var(--gold); transform:rotate(45deg); }
.step b { display:block; font-family:var(--serif); font-size:3rem; line-height:1; color:rgba(200,164,107,.35); font-weight:600; }
.step h3 { font-family:var(--serif); font-size:1.45rem; font-weight:600; margin:14px 0 8px; color:#f4ecdf; }
.step p { font-size:.88rem; color:var(--muted); }
.fgrid { display:grid; grid-template-columns:repeat(3,1fr); gap:2px; background:var(--line); border:1px solid var(--line); }
.fcard { background:var(--bg); padding:32px 26px 28px; display:flex; flex-direction:column; gap:10px; transition:background .3s; }
.fcard:hover { background:var(--bg-2); }
.fcard h3 { font-family:var(--serif); font-size:1.55rem; line-height:1.15; font-weight:600; color:#f4ecdf; }
.fcard p { font-size:.92rem; color:var(--muted); }
.qa { border-top:1px solid var(--line); }
.qa:last-child { border-bottom:1px solid var(--line); }
.qa summary { list-style:none; cursor:pointer; display:flex; justify-content:space-between; align-items:center; gap:24px; padding:22px 0; font-family:var(--serif); font-size:1.4rem; font-weight:600; color:#f1e9dc; line-height:1.25; }
.qa summary::-webkit-details-marker { display:none; }
.qa summary::after { content:'+'; flex:0 0 auto; font:400 1.8rem var(--sans); color:var(--gold); transition:transform .25s; }
.qa[open] summary::after { transform:rotate(45deg); }
.qa summary:hover { color:var(--gold-2); }
.qa p { padding:0 48px 24px 0; color:#cfc5b6; max-width:760px; }
.faq-wrap { max-width:900px; }
.others { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:14px; }
.other { position:relative; display:block; height:190px; overflow:hidden; background:var(--bg-3); }
.other img { width:100%; height:100%; object-fit:cover; transition:transform .8s; }
.other:hover img { transform:scale(1.06); }
.other::after { content:''; position:absolute; inset:0; background:linear-gradient(180deg,rgba(10,9,8,.1) 30%,rgba(10,9,8,.85)); }
.other span { position:absolute; left:16px; bottom:14px; z-index:2; font-family:var(--serif); font-size:1.4rem; font-weight:600; color:#f6efe3; }
.visit { position:relative; padding:120px 0; text-align:center; overflow:hidden; }
.visit-bg { position:absolute; inset:-40px; background-size:cover; background-position:center; filter:blur(10px) brightness(.28); transform:scale(1.1); }
.visit .wrap { position:relative; z-index:2; max-width:780px; }
.visit h2 { font-family:var(--serif); font-weight:600; font-size:clamp(2.1rem,4.4vw,3.4rem); line-height:1.08; margin:18px 0; color:#f7f0e4; }
.visit p { color:#d3c9ba; font-size:1.05rem; }
.visit .hero-cta { justify-content:center; }
.eyebrow.center { justify-content:center; }
.eyebrow.center::after { content:''; width:40px; height:1px; background:var(--gold); }
footer { border-top:1px solid var(--line); background:#0c0b0a; padding:56px 0 34px; }
.foot { display:grid; grid-template-columns:1.3fr 1fr 1fr; gap:40px; }
.foot h4 { font:700 .74rem var(--sans); letter-spacing:.18em; text-transform:uppercase; color:var(--gold); margin-bottom:16px; }
.foot p, .foot a { color:var(--muted); font-size:.92rem; }
.foot a:hover { color:var(--gold-2); }
.foot ul { list-style:none; display:grid; gap:10px; }
.social { margin-top:40px; padding-top:24px; border-top:1px solid var(--line); font-size:.8rem; color:#6f675c; }
.lb { position:fixed; inset:0; z-index:300; display:none; align-items:center; justify-content:center; background:rgba(8,7,6,.94); padding:24px; }
.lb.open { display:flex; }
.lb-box { position:relative; max-width:min(1280px,100%); max-height:100%; display:flex; flex-direction:column; gap:14px; }
.lb-box img { max-width:100%; max-height:calc(100vh - 150px); object-fit:contain; margin:0 auto; box-shadow:0 30px 80px rgba(0,0,0,.6); }
.lb-cap b { font-family:var(--serif); font-size:1.3rem; font-weight:600; color:#f4ecdf; }
.lb-btn { position:absolute; top:50%; transform:translateY(-50%); width:48px; height:48px; border-radius:50%; border:1px solid rgba(236,226,210,.35); background:rgba(17,16,14,.7); color:#f6efe3; font-size:1.3rem; cursor:pointer; }
.lb-prev { left:12px; } .lb-next { right:12px; }
.lb-close { position:absolute; top:14px; right:14px; width:44px; height:44px; border-radius:50%; border:1px solid rgba(236,226,210,.35); background:rgba(17,16,14,.7); color:#f6efe3; font-size:1.2rem; cursor:pointer; z-index:2; }
@media (max-width:1280px) {
  .nav { display:none; }
  .burger { display:inline-flex; align-items:center; justify-content:center; }
  .hdr.open .nav { display:flex; position:absolute; top:84px; left:0; right:0; flex-direction:column; align-items:flex-start; gap:0; background:rgba(17,16,14,.97); border-bottom:1px solid var(--line); padding:8px 24px 18px; max-height:calc(100vh - 84px); overflow:auto; }
  .hdr.open .nav > a, .hdr.open .has-sub > a { padding:12px 0; width:100%; border-bottom:1px solid var(--line); display:block; }
  .hdr.open .has-sub { padding:0; width:100%; }
  .hdr.open .has-sub > a::before { display:none; }
  .hdr.open .sub { display:block; position:static; border:0; box-shadow:none; background:transparent; padding:0 0 0 14px; }
  .hdr.open .sub a { padding:10px 0; border-bottom:1px solid var(--line); }
}
@media (max-width:900px) {
  .hero::after { background:linear-gradient(180deg,rgba(17,16,14,.78) 0%,rgba(17,16,14,.6) 50%,rgba(17,16,14,.3) 75%,var(--bg) 100%); }
  .steps, .steps.four { grid-template-columns:repeat(2,1fr); gap:0 30px; }
  .split { grid-template-columns:1fr; gap:24px; }
  .fgrid { grid-template-columns:repeat(2,1fr); }
  .mosaic { grid-auto-rows:200px; }
  .foot { grid-template-columns:1fr; }
}
@media (max-width:680px) {
  .wrap { padding:0 16px; }
  .hdr .wrap { height:70px; }
  .hdr.open .nav { top:70px; padding:8px 16px 18px; }
  .logo-mark { font-size:1.85rem; }
  .logo-sub { display:none; }
  .hdr-right .btn, .hdr-right .pill { display:none; }
  .hero .wrap { padding-top:108px; padding-bottom:60px; }
  .facts .wrap { grid-template-columns:1fr 1fr; padding:0; }
  .fact { padding:20px 16px; border-top:1px solid var(--line); }
  .fact:nth-child(odd) { border-left:0; }
  section.block { padding:60px 0; }
  .steps, .steps.four, .fgrid { grid-template-columns:1fr; }
  .mosaic, .mosaic.four { grid-template-columns:1fr 1fr; grid-auto-rows:150px; gap:8px; }
  .mosaic .ph:first-child { grid-column:span 2; grid-row:span 2; }
  .mosaic.two { grid-template-columns:1fr; grid-auto-rows:230px; }
  .mosaic.four .ph:first-child { grid-column:auto; grid-row:auto; }
  .ph span { left:12px; right:12px; bottom:10px; font-size:1rem; }
  .qa summary { font-size:1.2rem; }
  .qa p { padding-right:0; }
  .btn { padding:14px 20px; }
}
"""

JS = """
(function () {
  var hdr = document.getElementById('hdr');
  function onScroll() { hdr.classList.toggle('solid', window.scrollY > 40 || hdr.classList.contains('open')); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  document.getElementById('burger').addEventListener('click', function () { hdr.classList.toggle('open'); onScroll(); });
  var G = window.__GAL || [], lb = document.getElementById('lb'), img = document.getElementById('lbImg'), cap = document.getElementById('lbCap'), cur = 0;
  function show(i) { cur = (i + G.length) % G.length; img.src = G[cur][0]; img.alt = G[cur][1]; cap.textContent = G[cur][1]; }
  function close() { lb.classList.remove('open'); document.body.style.overflow = ''; }
  document.querySelectorAll('.ph').forEach(function (b) { b.addEventListener('click', function () { show(+b.getAttribute('data-i')); lb.classList.add('open'); document.body.style.overflow = 'hidden'; }); });
  document.getElementById('lbClose').addEventListener('click', close);
  document.getElementById('lbPrev').addEventListener('click', function () { show(cur - 1); });
  document.getElementById('lbNext').addEventListener('click', function () { show(cur + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
  document.addEventListener('keydown', function (e) { if (!lb.classList.contains('open')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
})();
"""


def _e(s):
    return html.escape(s, quote=True)


def _all():
    d = dict(PAGES)
    d["partners"] = PARTNERS
    return d


def _nav(active):
    sub = "".join(f'<a href="/{s}">{_e(v["nav"])}</a>' for s, v in PAGES.items())
    cls = lambda s: ' class="on"' if s == active else ""
    return (
        '<nav class="nav" id="nav">'
        f'<div class="has-sub"><a href="/kuhni-na-zakaz-tashkent"{cls("kuhni-na-zakaz-tashkent")}>Кухни</a><div class="sub">{sub}</div></div>'
        '<a href="/#furniture">Мебель</a><a href="/#contract">Договор</a><a href="/#materials">Материалы</a>'
        '<a href="/#process">Как мы работаем</a><a href="/#contacts">Контакты</a><a href="/calc">Калькулятор</a>'
        "</nav>"
    )


def render_landing(slug):
    p = _all().get(slug)
    if not p:
        return None
    url = f"{SITE_URL}/{slug}"
    is_partner = slug == "partners"
    gallery = p.get("gallery", [])
    gal_items = [(f"/static/home/ph-{c}.webp", PH[c]) for c in gallery]
    gcls = {2: "two", 4: "four"}.get(len(gal_items), "")
    gal_html = "".join(
        f'<button type="button" class="ph" data-i="{i}" aria-label="{_e(cap)}"><img src="{src}" alt="{_e(cap)}" loading="lazy" decoding="async"><span>{_e(cap)}</span></button>'
        for i, (src, cap) in enumerate(gal_items)
    )
    parts = []
    alt = False
    for sec in p["sections"]:
        kind, heading = sec[0], sec[1]
        cls = "block alt" if alt else "block"
        alt = not alt
        if kind == "list":
            parts.append(f'<section class="{cls}"><div class="wrap split"><div><div class="eyebrow">{_e(p["nav"])}</div><h2>{_e(heading)}</h2></div>'
                         '<ul class="ticks">' + "".join(f"<li>{_e(x)}</li>" for x in sec[2]) + "</ul></div></section>")
        elif kind == "text":
            parts.append(f'<section class="{cls}"><div class="wrap split"><div><div class="eyebrow">{_e(p["nav"])}</div><h2>{_e(heading)}</h2></div><div><p>{_e(sec[2])}</p></div></div></section>')
        elif kind == "steps":
            parts.append(f'<section class="{cls}"><div class="wrap"><div class="sec-head"><div><div class="eyebrow">Процесс</div><h2>{_e(heading)}</h2></div>'
                         '<p>Цену, сроки и гарантию фиксируем в договоре до начала работ.</p></div><div class="steps">'
                         + "".join(f'<div class="step"><b>{i:02d}</b><h3>{_e(t)}</h3><p>{_e(d)}</p></div>' for i, (t, d) in enumerate(COMMON_STEPS, 1))
                         + "</div></div></section>")
        elif kind == "psteps":
            parts.append(f'<section class="{cls}"><div class="wrap"><div class="sec-head"><div><div class="eyebrow">Сотрудничество</div><h2>{_e(heading)}</h2></div></div><div class="steps four">'
                         + "".join(f'<div class="step"><b>{i:02d}</b><h3>{_e(t)}</h3><p>{_e(d)}</p></div>' for i, (t, d) in enumerate(sec[2], 1))
                         + "</div></div></section>")
        elif kind == "cards":
            parts.append(f'<section class="{cls}"><div class="wrap"><div class="sec-head"><div><div class="eyebrow">Партнёрам</div><h2>{_e(heading)}</h2></div></div><div class="fgrid">'
                         + "".join(f"<div class=\"fcard\"><h3>{_e(t)}</h3><p>{_e(d)}</p></div>" for t, d in sec[2]) + "</div></div></section>")
    faq_html = "".join(f'<details class="qa"><summary>{_e(q)}</summary><p>{_e(a)}</p></details>' for q, a in p["faq"])
    others = "".join(
        f'<a class="other" href="/{s}"><img src="/static/home/{v["hero"]}" alt="{_e(v["nav"])}" loading="lazy"><span>{_e(v["nav"])}</span></a>'
        for s, v in _all().items() if s != slug
    )
    cta_ext = p["cta_url"].startswith("http")
    cta_attr = ' target="_blank" rel="noopener"' if cta_ext else ""
    h1_plain = p["h1_plain"]
    jsonld = []
    if not is_partner:
        jsonld.append({"@context": "https://schema.org", "@type": "Service", "name": h1_plain, "serviceType": p["nav"], "description": p["description"],
                       "areaServed": {"@type": "City", "name": "Ташкент"}, "url": url,
                       "provider": {"@type": "LocalBusiness", "name": "Kitchen Calc", "url": SITE_URL + "/", "telephone": PHONE_TEL}})
    jsonld.append({"@context": "https://schema.org", "@type": "FAQPage",
                   "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in p["faq"]]})
    jsonld.append({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Kitchen Calc", "item": SITE_URL + "/"},
        {"@type": "ListItem", "position": 2, "name": p["nav"], "item": url}]})
    ld = "".join('<script type="application/ld+json">' + json.dumps(x, ensure_ascii=False).replace("</", "<\\/") + "</script>" for x in jsonld)
    gal_js = "window.__GAL=" + json.dumps(gal_items, ensure_ascii=False).replace("</", "<\\/") + ";"
    gal_title = p.get("gallery_title", "Примеры решений и стилей, которые можно заказать")
    gallery_section = ""
    if gal_items:
        gallery_section = (f'<section class="block"><div class="wrap"><div class="sec-head"><div><div class="eyebrow">Идеи и стили</div><h2>{_e(gal_title)}</h2></div>'
                           '<p>Нажмите на фото, чтобы рассмотреть. Подберём материалы, фурнитуру и размеры под ваш проект.</p></div>'
                           f'<div class="mosaic {gcls}">{gal_html}</div>'
                           f'<div class="gal-cta"><a class="btn btn-gold" href="{_e(p["cta_url"])}"{cta_attr}>{_e(p["cta_label"])}</a><span>Замер и консультация бесплатно.</span></div></div></section>')
    visit_bg = f"/static/home/{p['hero']}"
    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{_e(p['title'])}</title>
<meta name="description" content="{_e(p['description'])}">
<meta name="theme-color" content="#11100e">
<link rel="canonical" href="{url}">
<link rel="icon" type="image/svg+xml" href="/static/home/favicon.svg">
<link rel="icon" href="/favicon.ico" sizes="any">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Kitchen Calc">
<meta property="og:title" content="{_e(p['title'])}">
<meta property="og:description" content="{_e(p['description'])}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE_URL}/static/home/og-image.png">
{ld}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700&family=Marck+Script&display=swap" rel="stylesheet">
<style>{CSS}</style>
</head>
<body>
<header class="hdr" id="hdr"><div class="wrap">
<a class="logo" href="/"><span class="logo-mark">Kitchen Calc</span><span class="logo-sub"><b>Ташкент</b><span>кухни и мебель на заказ</span></span></a>
{_nav(slug)}
<div class="hdr-right"><a class="pill" href="/partners">Партнёрам</a><a class="btn btn-gold btn-sm" href="/calc">Рассчитать</a><button class="burger" id="burger" aria-label="Меню">☰</button></div>
</div></header>
<main>
<section class="hero"><img class="hero-photo" src="/static/home/{p['hero']}" alt="{_e(h1_plain)}" fetchpriority="high"><div class="wrap"><div>
<div class="eyebrow">{_e(p['eyebrow'])}</div><h1>{p['h1']}</h1><p class="lead">{_e(p['lead'])}</p>
<div class="hero-cta"><a class="btn btn-gold" href="{_e(p['cta_url'])}"{cta_attr}>{_e(p['cta_label'])}</a><a class="btn btn-line" href="tel:{PHONE_TEL}">{PHONE}</a></div>
</div></div></section>
<div class="facts"><div class="wrap">
<div class="fact"><b>3–30</b><span>рабочих дней на изготовление</span></div>
<div class="fact"><b>12 мес.</b><span>гарантия по договору</span></div>
<div class="fact"><b>0 сум</b><span>замер и консультация</span></div>
<div class="fact"><b>Договор</b><span>цена и сроки — до начала работ</span></div>
</div></div>
{gallery_section}
{''.join(parts)}
<section class="block"><div class="wrap faq-wrap"><div class="sec-head"><div><div class="eyebrow">Вопросы и ответы</div><h2>Частые вопросы</h2></div></div>{faq_html}</div></section>
<section class="block alt"><div class="wrap"><div class="sec-head"><div><div class="eyebrow">Ещё</div><h2>Другие услуги</h2></div></div><div class="others">{others}</div></div></section>
<section class="visit"><div class="visit-bg" style="background-image:url('{visit_bg}')" aria-hidden="true"></div><div class="wrap">
<div class="eyebrow center">Бесплатный замер</div><h2>Приедем, измерим и покажем образцы</h2>
<p>Позвоните или напишите в Telegram — договоримся об удобном времени. Замер и консультация бесплатно.</p>
<div class="hero-cta"><a class="btn btn-gold" href="tel:{PHONE_TEL}">{PHONE}</a><a class="btn btn-line" href="{TG_URL}" target="_blank" rel="noopener">Telegram</a></div>
</div></section>
</main>
<footer><div class="wrap"><div class="foot">
<div><div class="logo-mark" style="margin-bottom:12px">Kitchen Calc</div><p>Кухни и мебель на заказ в Ташкенте. Замер, производство, доставка и монтаж. Гарантия 12 месяцев по договору.</p></div>
<div><h4>Разделы</h4><ul><li><a href="/">Главная</a></li><li><a href="/calc">Калькулятор</a></li><li><a href="/partners">Для дизайнеров и строителей</a></li><li><a href="/#contract">Договор</a></li></ul></div>
<div><h4>Контакты</h4><ul><li><a href="tel:{PHONE_TEL}">{PHONE}</a></li><li><a href="{TG_URL}" target="_blank" rel="noopener">Telegram: @{TG}</a></li><li><p>Ташкент</p></li></ul></div>
</div><div class="social">© Kitchen Calc · кухни и мебель на заказ в Ташкенте</div></div></footer>
<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="Фото"><button type="button" class="lb-close" id="lbClose" aria-label="Закрыть">✕</button>
<div class="lb-box"><button type="button" class="lb-btn lb-prev" id="lbPrev" aria-label="Назад">‹</button><img id="lbImg" src="" alt=""><button type="button" class="lb-btn lb-next" id="lbNext" aria-label="Вперёд">›</button><div class="lb-cap"><b id="lbCap"></b></div></div></div>
<script>{gal_js}{JS}</script>
</body>
</html>"""
