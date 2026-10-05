"""Посадочные страницы под поисковые запросы (кухни, шкафы-купе, гардеробные и т. д.).

Все тексты — здесь. Чтобы добавить страницу, добавьте запись в PAGES: адрес появится в sitemap и в списке ссылок внизу страниц.
Не пишите сюда того, чего нет (цены, опыт, количество работ) — клиенты это проверяют.
"""
import html
import json

SITE_URL = "https://kitchen-calc.uz"
PHONE = "+998 92 093-45-10"
PHONE_TEL = "+998920934510"
TG = "Kitchencalc"

COMMON_STEPS = [
    ("Заявка и бесплатный замер", "Напишите или позвоните, мы приедем, снимем размеры и обсудим пожелания."),
    ("Проект и расчёт", "Готовим проект, спецификацию и точную стоимость. Всё согласуем до начала работ."),
    ("Договор", "Цена, сроки, порядок оплаты и гарантия фиксируются в договоре."),
    ("Изготовление", "Делаем мебель по вашим размерам. Срок указываем в договоре."),
    ("Доставка и монтаж", "Привозим, собираем и устанавливаем по Ташкенту, регулируем фасады и фурнитуру, сдаём по акту."),
]

PAGES = {
    "kuhni-na-zakaz-tashkent": {
        "nav": "Кухни",
        "title": "Кухни на заказ в Ташкенте под ключ — расчёт онлайн | Kitchen Calc",
        "description": "Кухни на заказ в Ташкенте: бесплатный замер, проект, изготовление, доставка и монтаж. Соберите кухню в онлайн-калькуляторе и узнайте цену за 2 минуты. Работаем по договору, гарантия 12 месяцев.",
        "h1": "Кухни на заказ в Ташкенте под ключ",
        "lead": "Делаем кухни по вашим размерам: от замера до монтажа. Соберите свой вариант в онлайн-калькуляторе — сразу увидите цену и чертёж, а мастер получит все размеры для проекта.",
        "cta_label": "Рассчитать кухню онлайн",
        "cta_url": "/calc",
        "sections": [
            ("Что вы можете выбрать", [
                "Форму кухни: прямая, угловая (Г-образная), П-образная, а также остров.",
                "Материалы фасадов и корпуса: ЛДСП, ЛМДФ, акрил, несколько ценовых уровней — от эконом до премиум.",
                "Открывание: с ручками, без ручек (Push-to-Open) или гола-профиль.",
                "Фурнитуру: от экономной до Blum (петли, ящики, подъёмники).",
                "Встроенную технику: холодильник, духовой шкаф, микроволновая печь, посудомоечная и стиральная машины, варочная панель.",
                "Пенал до потолка под технику, верхние шкафы в один или два яруса, подсветку, столешницу.",
            ]),
            ("Как работает онлайн-калькулятор", [
                "Вы выбираете форму кухни и размеры стен, расставляете шкафы и технику, подбираете цвета и материалы. Калькулятор сразу показывает визуализацию, чертежи спереди и сверху и ориентировочную стоимость. Результат можно отправить мастеру в Telegram или скопировать ссылкой. Итоговая цена уточняется после замера и фиксируется в договоре.",
            ]),
            ("Как мы работаем", None),
            ("Что входит в стоимость", [
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
        "nav": "Шкафы-купе",
        "title": "Шкафы-купе на заказ в Ташкенте — замер, изготовление, монтаж | Kitchen Calc",
        "description": "Шкафы-купе на заказ в Ташкенте по вашим размерам: бесплатный замер, проект, изготовление, доставка и установка. Работаем по договору, гарантия 12 месяцев.",
        "h1": "Шкафы-купе на заказ в Ташкенте",
        "lead": "Шкаф-купе по вашим размерам: в нишу, от стены до стены или отдельно стоящий. Приедем на бесплатный замер, предложим внутреннее наполнение и согласуем проект и стоимость в договоре.",
        "cta_label": "Заказать замер в Telegram",
        "cta_url": "https://t.me/" + TG,
        "sections": [
            ("Что мы делаем", [
                "Шкафы-купе под размер вашей ниши или комнаты, с раздвижными дверями.",
                "Внутреннее наполнение: полки, штанги, ящики, выдвижные системы — под ваши вещи.",
                "Материалы и цвета фасадов и корпуса подбираем по образцам на замере.",
                "Доставка и установка по Ташкенту.",
            ]),
            ("На что обратить внимание при заказе", [
                "Точные размеры по месту: стены и потолки редко бывают ровными, поэтому мы снимаем размеры сами.",
                "Расположение розеток, батарей и вентиляции: их нужно учесть до изготовления.",
                "Наполнение: заранее решите, что будете хранить, чтобы шкаф был удобным.",
            ]),
            ("Как мы работаем", None),
        ],
        "faq": [
            ("Сколько стоит шкаф-купе на заказ?", "Стоимость зависит от размеров, материалов, количества дверей и внутреннего наполнения. Точную цену называем после бесплатного замера и фиксируем в договоре."),
            ("Можно ли сделать шкаф-купе в нишу нестандартного размера?", "Да, изготавливаем по индивидуальным размерам после замера."),
            ("Сколько времени занимает изготовление?", "Срок зависит от проекта и материалов, указываем его в договоре."),
            ("Какая гарантия на шкаф?", "Гарантия на изделие и монтаж — 12 месяцев со дня подписания акта приёмки."),
        ],
    },
    "garderobnye-na-zakaz-tashkent": {
        "nav": "Гардеробные",
        "title": "Гардеробные на заказ в Ташкенте — проект и монтаж | Kitchen Calc",
        "description": "Гардеробные комнаты на заказ в Ташкенте: бесплатный замер, проект под ваши вещи, изготовление, доставка и монтаж. Работаем по договору, гарантия 12 месяцев.",
        "h1": "Гардеробные на заказ в Ташкенте",
        "lead": "Гардеробная под ваши вещи и размеры помещения: открытые системы хранения или закрытые шкафы, штанги, полки, ящики. Приедем на замер, предложим планировку и согласуем стоимость в договоре.",
        "cta_label": "Заказать замер в Telegram",
        "cta_url": "https://t.me/" + TG,
        "sections": [
            ("Что входит в проект гардеробной", [
                "Планировка с учётом ваших вещей: платья, рубашки, обувь, сумки, бельё.",
                "Зоны хранения: штанги разной высоты, полки, выдвижные ящики, обувницы.",
                "Материалы, цвета и фурнитура, подобранные по вашему вкусу и бюджету.",
                "Доставка и монтаж по Ташкенту.",
            ]),
            ("Как подготовиться к замеру", [
                "Освободите помещение или покажите, где что должно стоять.",
                "Заранее прикиньте, сколько вещей и какой длины нужно разместить.",
                "Подумайте об освещении и зеркале — это тоже можно предусмотреть в проекте.",
            ]),
            ("Как мы работаем", None),
        ],
        "faq": [
            ("Сколько стоит гардеробная на заказ?", "Цена зависит от размеров помещения, материалов и наполнения. После бесплатного замера делаем расчёт и фиксируем стоимость в договоре."),
            ("Можно ли сделать гардеробную в маленькой комнате или нише?", "Да, проект подбирается под размеры помещения; в небольшом пространстве важно продумать вместимость."),
            ("Вы делаете гардеробные с подсветкой?", "Подсветку можно предусмотреть в проекте; детали обсуждаем на замере."),
            ("Какая гарантия?", "Гарантия на изделие и монтаж — 12 месяцев со дня подписания акта приёмки."),
        ],
    },
    "prihozhie-na-zakaz-tashkent": {
        "nav": "Прихожие",
        "title": "Прихожие на заказ в Ташкенте — шкаф, вешалка, обувница | Kitchen Calc",
        "description": "Прихожие на заказ в Ташкенте по вашим размерам: шкафы, открытые вешалки, обувницы, зеркала. Бесплатный замер, изготовление, доставка и монтаж, работа по договору.",
        "h1": "Прихожие на заказ в Ташкенте",
        "lead": "Прихожая, которая помещается именно в ваш коридор: шкаф для одежды, место для обуви, вешалка и зеркало. Приедем на бесплатный замер, предложим решение и согласуем проект и цену в договоре.",
        "cta_label": "Заказать замер в Telegram",
        "cta_url": "https://t.me/" + TG,
        "sections": [
            ("Что можно предусмотреть", [
                "Шкаф для верхней одежды, с распашными или раздвижными дверями.",
                "Обувница, полки для головных уборов и сумок, выдвижные ящики.",
                "Открытая вешалка, скамья, зеркало.",
                "Материалы и цвета, подходящие к остальной мебели в квартире.",
            ]),
            ("Особенности небольших коридоров", [
                "В узком коридоре важна глубина шкафа: подбираем размеры так, чтобы проход оставался комфортным.",
                "Если места мало, можно использовать высоту стены и верхние антресоли.",
            ]),
            ("Как мы работаем", None),
        ],
        "faq": [
            ("Сколько стоит прихожая на заказ?", "Цена зависит от размеров, материалов и наполнения. Точную стоимость называем после замера и фиксируем в договоре."),
            ("Можно ли сделать прихожую в узком коридоре?", "Да, проект подбирается под размеры коридора, мы предложим подходящую глубину и конструкцию."),
            ("Сколько занимает изготовление?", "Срок зависит от проекта и материалов, указываем его в договоре."),
            ("Вы привозите и устанавливаете мебель?", "Да, доставка и монтаж по Ташкенту входят в услугу."),
        ],
    },
    "mebel-dlya-spalni-na-zakaz-tashkent": {
        "nav": "Спальни",
        "title": "Мебель для спальни на заказ в Ташкенте — шкафы, изголовья, тумбы | Kitchen Calc",
        "description": "Мебель для спальни на заказ в Ташкенте: шкафы, изголовья, тумбы, комоды, встроенные решения. Бесплатный замер, изготовление, доставка и монтаж, работа по договору.",
        "h1": "Мебель для спальни на заказ в Ташкенте",
        "lead": "Шкафы, изголовья, тумбы, комоды и встроенные системы хранения для спальни — по вашим размерам и в нужных цветах. Приедем на замер, предложим проект и согласуем цену в договоре.",
        "cta_label": "Заказать замер в Telegram",
        "cta_url": "https://t.me/" + TG,
        "sections": [
            ("Что мы делаем для спальни", [
                "Шкафы: распашные и купе, до потолка или отдельно стоящие.",
                "Изголовья кровати, прикроватные тумбы и комоды.",
                "Встроенные системы хранения вокруг кровати или в нише.",
                "Отделку стеновыми панелями и другие решения по проекту — обсудим на замере.",
            ]),
            ("Что обсудим на замере", [
                "Расположение кровати, розеток и светильников.",
                "Что именно нужно хранить и какой объём шкафа вам комфортен.",
                "Стиль и цвета, чтобы мебель подошла к интерьеру.",
            ]),
            ("Как мы работаем", None),
        ],
        "faq": [
            ("Сколько стоит мебель для спальни на заказ?", "Цена зависит от набора мебели, размеров, материалов и фурнитуры. Точную стоимость называем после замера."),
            ("Можно ли заказать только шкаф или только изголовье?", "Да, можно заказать отдельные предметы или комплект."),
            ("Сколько ждать готовую мебель?", "Срок зависит от проекта и материалов, указываем его в договоре."),
            ("Есть ли гарантия?", "Да, 12 месяцев на изделие и монтаж со дня подписания акта приёмки."),
        ],
    },
}

CSS = """
:root { --bg:#11100e; --bg-2:#191714; --line:rgba(236,226,210,.10); --text:#ece4d8; --muted:#a79d8f; --gold:#c8a46b; --gold-2:#e2c48f; --serif:'Cormorant Garamond',Georgia,serif; --sans:'Manrope','Segoe UI',system-ui,sans-serif; --script:'Marck Script',cursive; }
* { box-sizing:border-box; margin:0; padding:0; }
body { background:var(--bg); color:var(--text); font-family:var(--sans); line-height:1.7; -webkit-font-smoothing:antialiased; }
a { color:inherit; text-decoration:none; }
.wrap { max-width:960px; margin:0 auto; padding:0 24px; }
header { border-bottom:1px solid var(--line); }
header .wrap { display:flex; align-items:center; justify-content:space-between; height:76px; gap:16px; }
.logo { font-family:var(--script); font-size:2.1rem; color:#f6efe3; white-space:nowrap; }
@media (max-width:560px) { .hdr-links a:last-child { display:none; } .logo { font-size:1.8rem; } }
.hdr-links { display:flex; gap:18px; align-items:center; font-size:.9rem; font-weight:600; color:var(--muted); }
.hdr-links a:hover { color:var(--gold); }
.hero { padding:64px 0 32px; }
h1 { font-family:var(--serif); font-weight:600; font-size:clamp(2rem,5vw,3.2rem); line-height:1.12; margin-bottom:18px; }
.lead { color:var(--muted); font-size:1.08rem; max-width:720px; }
.btns { display:flex; flex-wrap:wrap; gap:12px; margin-top:26px; }
.btn { display:inline-flex; align-items:center; justify-content:center; font:700 .82rem var(--sans); letter-spacing:.12em; text-transform:uppercase; padding:15px 26px; border-radius:2px; border:1px solid var(--gold); }
.btn-gold { background:var(--gold); color:#1b1408; }
.btn-gold:hover { background:var(--gold-2); }
.btn-line:hover { background:rgba(200,164,107,.12); }
section { padding:34px 0; border-top:1px solid var(--line); }
h2 { font-family:var(--serif); font-weight:600; font-size:clamp(1.5rem,3.2vw,2rem); margin-bottom:16px; }
section p { color:var(--muted); max-width:760px; margin-bottom:10px; }
ul.list { list-style:none; display:grid; gap:10px; max-width:760px; }
ul.list li { position:relative; padding-left:22px; color:var(--muted); }
ul.list li::before { content:''; position:absolute; left:0; top:.7em; width:8px; height:8px; border-radius:50%; background:var(--gold); }
ol.steps { list-style:none; counter-reset:s; display:grid; gap:14px; max-width:760px; }
ol.steps li { counter-increment:s; position:relative; padding-left:54px; color:var(--muted); }
ol.steps li b { color:var(--text); display:block; }
ol.steps li::before { content:counter(s); position:absolute; left:0; top:0; width:38px; height:38px; border:1px solid var(--gold); border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--gold); font-weight:700; }
details { background:var(--bg-2); border:1px solid var(--line); border-radius:4px; padding:14px 18px; margin-bottom:10px; max-width:760px; }
summary { cursor:pointer; font-weight:600; }
details p { margin-top:10px; }
.more { display:flex; flex-wrap:wrap; gap:10px; }
.more a { border:1px solid var(--line); padding:8px 14px; border-radius:999px; font-size:.9rem; color:var(--muted); }
.more a:hover { border-color:var(--gold); color:var(--gold); }
footer { padding:30px 0 46px; border-top:1px solid var(--line); color:var(--muted); font-size:.9rem; }
footer a { color:var(--gold); }
"""


def _e(s):
    return html.escape(s, quote=True)


def render_landing(slug):
    p = PAGES.get(slug)
    if not p:
        return None
    url = f"{SITE_URL}/{slug}"
    parts = []
    for heading, body in p["sections"]:
        parts.append(f"<section><h2>{_e(heading)}</h2>")
        if body is None:
            parts.append('<ol class="steps">' + "".join(f"<li><b>{_e(t)}</b>{_e(d)}</li>" for t, d in COMMON_STEPS) + "</ol>")
        elif len(body) == 1 and len(body[0]) > 140:
            parts.append(f"<p>{_e(body[0])}</p>")
        else:
            parts.append('<ul class="list">' + "".join(f"<li>{_e(x)}</li>" for x in body) + "</ul>")
        parts.append("</section>")
    faq_html = "".join(f"<details><summary>{_e(q)}</summary><p>{_e(a)}</p></details>" for q, a in p["faq"])
    links = "".join(f'<a href="/{s}">{_e(v["nav"])}</a>' for s, v in PAGES.items() if s != slug)
    cta_ext = p["cta_url"].startswith("http")
    cta_attr = ' target="_blank" rel="noopener"' if cta_ext else ""
    jsonld = [
        {"@context": "https://schema.org", "@type": "Service", "name": p["h1"], "serviceType": p["nav"], "description": p["description"],
         "areaServed": {"@type": "City", "name": "Ташкент"}, "url": url,
         "provider": {"@type": "LocalBusiness", "name": "Kitchen Calc", "url": SITE_URL + "/", "telephone": PHONE_TEL}},
        {"@context": "https://schema.org", "@type": "FAQPage",
         "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in p["faq"]]},
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Kitchen Calc", "item": SITE_URL + "/"},
            {"@type": "ListItem", "position": 2, "name": p["nav"], "item": url}]},
    ]
    ld = "".join('<script type="application/ld+json">' + json.dumps(x, ensure_ascii=False).replace("</", "<\\/") + "</script>" for x in jsonld)
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
<header><div class="wrap"><a class="logo" href="/">Kitchen Calc</a>
<div class="hdr-links"><a href="/calc">Калькулятор</a><a href="tel:{PHONE_TEL}">{PHONE}</a></div></div></header>
<main class="wrap">
<div class="hero"><h1>{_e(p['h1'])}</h1><p class="lead">{_e(p['lead'])}</p>
<div class="btns"><a class="btn btn-gold" href="{_e(p['cta_url'])}"{cta_attr}>{_e(p['cta_label'])}</a><a class="btn btn-line" href="tel:{PHONE_TEL}">{PHONE}</a></div></div>
{''.join(parts)}
<section><h2>Частые вопросы</h2>{faq_html}</section>
<section><h2>Другие услуги</h2><div class="more"><a href="/">Главная</a><a href="/calc">Калькулятор кухни</a>{links}</div></section>
</main>
<footer><div class="wrap">© Kitchen Calc · кухни и мебель на заказ в Ташкенте · <a href="https://t.me/{TG}" target="_blank" rel="noopener">Telegram @{TG}</a> · <a href="/">Главная</a></div></footer>
</body>
</html>"""
