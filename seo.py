"""SEO главной страницы: заголовки, описания, вопросы-ответы и разметка schema.org на двух языках.

Один источник правды: отсюда берутся и мета-теги, и JSON-LD для поисковиков, и блок «Вопросы и ответы»,
который виден на странице (Google требует, чтобы разметка совпадала с видимым текстом).
Адрес сайта и телефон меняются в одном месте — здесь.
"""
import html
import json
import os
from functools import lru_cache

SITE_URL = "https://kitchen-calc.uz"
PHONE = "+998920934510"
TELEGRAM = "https://t.me/Kitchencalc"

SEO = {
    "ru": {
        "lang": "ru",
        "path": "/",
        "locale": "ru_RU",
        "city": "Ташкент",
        "title": "Кухни и корпусная мебель на заказ в Ташкенте — под ключ | Kitchen Calc",
        "desc": "Кухни и корпусная мебель на заказ в Ташкенте под ключ: бесплатный замер, своё производство 3–30 рабочих дней, "
                "доставка и монтаж, гарантия 12 месяцев. Рассчитайте стоимость онлайн за 2 минуты.",
        "biz": "Kitchen Calc — кухни и корпусная мебель на заказ",
        "services": ["Кухни на заказ", "Спальни на заказ", "Гардеробные и шкафы на заказ", "Прихожие на заказ",
                     "Мебель для гостиной и ТВ-зоны на заказ", "Детская мебель на заказ", "Корпусная мебель под ключ"],
        "catalog": "Мебель на заказ",
        "faq": [
            ("Сколько стоит кухня на заказ в Ташкенте?",
             "Цена зависит от размеров, материалов (ЛДСП, ЛМДФ, акрил), столешницы и фурнитуры. "
             "Точную стоимость вашей кухни посчитает онлайн-калькулятор за 2 минуты, "
             "а окончательную цену мастер фиксирует в договоре после замера."),
            ("Сколько времени делается кухня?",
             "Изготовление занимает от 3 до 30 рабочих дней в зависимости от сложности, материалов и загрузки производства. "
             "Срок фиксируем в договоре."),
            ("Замер бесплатный?",
             "Да, выезд на замер и консультация бесплатны. Мастер уточнит размеры, поможет выбрать материалы и покажет образцы."),
            ("Что входит в «под ключ»?",
             "Замер, проект, изготовление, доставка по Ташкенту, сборка и установка. Подключение техники, мойки, воды и "
             "электричества 220 В в стоимость не входит — подскажем проверенных мастеров."),
            ("Вы работаете по договору?",
             "Да, работаем под ключ и только по письменному договору. В нём фиксируются цена и порядок оплаты, сроки изготовления "
             "и монтажа, спецификация (размеры, материалы, фурнитура, техника), порядок приёмки и гарантия 12 месяцев. "
             "Шаблон договора можно скачать на сайте."),
            ("Какая гарантия на мебель?",
             "Гарантия 12 месяцев по договору. На фурнитуру Blum действует официальная гарантия производителя."),
            ("Из каких материалов вы делаете мебель?",
             "ЛДСП и ЛМДФ трёх классов (Эконом, Премиум, Платинум), акрил (Китай и Турция). Столешницы — ЛДСП, искусственный камень "
             "и кварцевый агломерат. Фурнитура — от базовой до Blum."),
            ("Вы делаете только кухни?",
             "Нет. Кроме кухонь мы изготавливаем корпусную мебель по индивидуальным размерам: спальни, шкафы и гардеробные, прихожие, "
             "ТВ-зоны и мебель для гостиной, детские комнаты. "
             "Напишите в Telegram или позвоните — обсудим вашу задачу."),
        ],
    },
    "uz": {
        "lang": "uz",
        "path": "/uz",
        "locale": "uz_UZ",
        "city": "Toshkent",
        "title": "Toshkentda buyurtma asosida oshxona va korpusli mebel — kalit topshirish | Kitchen Calc",
        "desc": "Toshkentda buyurtma asosida oshxona va korpusli mebel, kalit topshirish bilan: bepul oʻlchov, oʻz ishlab chiqarish "
                "3–30 ish kuni, yetkazish va oʻrnatish, 12 oy kafolat. Narxni onlayn 2 daqiqada hisoblang.",
        "biz": "Kitchen Calc — buyurtma asosida oshxona va korpusli mebel",
        "services": ["Buyurtma oshxonalar", "Buyurtma yotoqxonalar", "Shkaf va garderob xonalari", "Prixojaya",
                     "Mehmonxona va TV zonasi mebeli", "Bolalar xonasi mebeli", "Kalit topshirish asosida korpusli mebel"],
        "catalog": "Buyurtma mebel",
        "faq": [
            ("Toshkentda buyurtma asosida oshxona narxi qancha?",
             "Narx oʻlcham, material (LDSP, LMDF, akril), stoleshnitsa va furniturasiga bogʻliq. "
             "Aniq narxni onlayn kalkulyator 2 daqiqada hisoblab beradi, "
             "yakuniy narxni usta oʻlchovdan keyin shartnomada belgilaydi."),
            ("Oshxona necha kunda tayyor boʻladi?",
             "Tayyorlash murakkablik, material va ishlab chiqarish bandligiga qarab 3 dan 30 ish kunigacha davom etadi. "
             "Muddat shartnomada belgilanadi."),
            ("Oʻlchov bepulmi?",
             "Ha, oʻlchovga chiqish va maslahat bepul. Usta oʻlchamlarni aniqlaydi, materiallarni tanlashga yordam beradi va "
             "namunalarni koʻrsatadi."),
            ("«Kalit topshirish» nimalarni oʻz ichiga oladi?",
             "Oʻlchov, loyiha, tayyorlash, Toshkent boʻylab yetkazish, yigʻish va oʻrnatish. Texnika, moyka, suv va 220 V "
             "elektrni ulash narxga kirmaydi — ishonchli ustalarni tavsiya qilamiz."),
            ("Shartnoma asosida ishlaysizmi?",
             "Ha, kalit topshirish asosida va faqat yozma shartnoma bilan ishlaymiz. Shartnomada narx va toʻlov tartibi, tayyorlash va "
             "montaj muddatlari, spetsifikatsiya (oʻlchamlar, materiallar, furnitura, texnika), qabul qilish tartibi va 12 oy kafolat "
             "belgilanadi. Shartnoma namunasini saytdan yuklab olish mumkin."),
            ("Mebelga qanday kafolat berasiz?",
             "Shartnoma boʻyicha 12 oy kafolat. Blum furniturasiga ishlab chiqaruvchining rasmiy kafolati amal qiladi."),
            ("Mebelni qaysi materiallardan tayyorlaysiz?",
             "Uch sinfdagi LDSP va LMDF (Ekonom, Premium, Platinum), akril (Xitoy va Turkiya). Stoleshnitsa — LDSP, sunʼiy tosh "
             "va kvars aglomerat. Furnitura — oddiydan Blumgacha."),
            ("Faqat oshxona tayyorlaysizmi?",
             "Yoʻq. Oshxonadan tashqari individual oʻlchamlar boʻyicha korpusli mebel ham tayyorlaymiz: yotoqxonalar, shkaf va garderob "
             "xonalari, prixojaya, TV zonalari va mehmonxona mebeli, bolalar xonalari. Telegramga yozing yoki qoʻngʻiroq qiling — "
             "vazifangizni muhokama qilamiz."),
        ],
    },
}


def _jsonld(lang):
    s = SEO[lang]
    biz = {
        "@type": ["LocalBusiness", "FurnitureStore"],
        "@id": SITE_URL + "/#business",
        "name": s["biz"],
        "url": SITE_URL + s["path"],
        "telephone": PHONE,
        "image": SITE_URL + "/static/home/og-image.png",
        "logo": SITE_URL + "/static/home/icon-512.png",
        "description": s["desc"],
        "areaServed": {"@type": "City", "name": s["city"]},
        "address": {"@type": "PostalAddress", "addressLocality": s["city"], "addressCountry": "UZ"},
        "sameAs": [TELEGRAM],
        "knowsLanguage": ["ru", "uz"],
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": s["catalog"],
            "itemListElement": [
                {"@type": "Offer", "itemOffered": {"@type": "Service", "name": name}} for name in s["services"]
            ],
        },
    }
    faq = {
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in s["faq"]
        ],
    }
    return {"@context": "https://schema.org", "@graph": [biz, faq]}


def _script_json(obj, attrs):
    # "</" внутри <script> закрыл бы тег раньше времени
    data = json.dumps(obj, ensure_ascii=False).replace("</", "<\\/")
    return f"<script {attrs}>{data}</script>"


@lru_cache(maxsize=4)
def render_home(lang):
    """Главная страница на нужном языке: подставляет мета-теги, JSON-LD и данные для блока вопросов."""
    s = SEO[lang]
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates", "home.html")
    with open(path, encoding="utf-8") as f:
        text = f.read()
    url = SITE_URL + s["path"]
    repl = {
        "__LANG__": s["lang"],
        "__TITLE__": html.escape(s["title"], quote=True),
        "__DESC__": html.escape(s["desc"], quote=True),
        "__URL__": url,
        "__OGLOCALE__": s["locale"],
        "__JSONLD__": _script_json(_jsonld(lang), 'type="application/ld+json"'),
        "__FAQDATA__": _script_json(s["faq"], 'type="application/json" id="faq-data"'),
    }
    for key, value in repl.items():
        text = text.replace(key, value)
    return text
