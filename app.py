import os
import re
import json
import html
import time
import uuid
import base64
import asyncio
import urllib.request
from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse, RedirectResponse, PlainTextResponse
from fastapi.templating import Jinja2Templates
from seo import SITE_URL, render_home
from landings import PAGES as LANDINGS, render_landing

app = FastAPI()
templates = Jinja2Templates(directory="templates")

# Основной адрес сайта (SITE_URL, см. seo.py). Старый адрес на onrender.com перекидывает сюда
# (кроме /health — его пингует GitHub Actions).


@app.middleware("http")
async def redirect_old_host(request: Request, call_next):
    host = request.headers.get("host", "").split(":")[0].lower()
    if host.endswith(".onrender.com") and request.method == "GET" and request.url.path != "/health":
        query = ("?" + request.url.query) if request.url.query else ""
        return RedirectResponse(SITE_URL + request.url.path + query, status_code=301)
    return await call_next(request)


@app.get("/robots.txt", response_class=PlainTextResponse)
async def robots():
    return "User-agent: *\nDisallow: /raskroy\nSitemap: " + SITE_URL + "/sitemap.xml\n"


@app.get("/sitemap.xml")
async def sitemap():
    # главная на русском и узбекском (с указанием версий друг для друга) и калькулятор
    def alt(url):
        return (f'<xhtml:link rel="alternate" hreflang="ru" href="{SITE_URL}/"/>'
                f'<xhtml:link rel="alternate" hreflang="uz" href="{SITE_URL}/uz"/>'
                f'<xhtml:link rel="alternate" hreflang="x-default" href="{SITE_URL}/"/>')
    alt_shkaf = (f'<xhtml:link rel="alternate" hreflang="ru" href="{SITE_URL}/shkaf"/>'
                 f'<xhtml:link rel="alternate" hreflang="uz" href="{SITE_URL}/uz/shkaf"/>'
                 f'<xhtml:link rel="alternate" hreflang="x-default" href="{SITE_URL}/shkaf"/>')
    urls = (f"<url><loc>{SITE_URL}/</loc>{alt('/')}<priority>1.0</priority></url>"
            f"<url><loc>{SITE_URL}/uz</loc>{alt('/uz')}<priority>0.9</priority></url>"
            f"<url><loc>{SITE_URL}/calc</loc><priority>0.8</priority></url>"
            f"<url><loc>{SITE_URL}/shkaf</loc>{alt_shkaf}<priority>0.8</priority></url>"
            f"<url><loc>{SITE_URL}/uz/shkaf</loc>{alt_shkaf}<priority>0.7</priority></url>"
            f"<url><loc>{SITE_URL}/partners</loc><priority>0.6</priority></url>"
            + "".join(f"<url><loc>{SITE_URL}/{s}</loc><priority>0.8</priority></url>" for s in LANDINGS))
    xml = ('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
           'xmlns:xhtml="http://www.w3.org/1999/xhtml">' + urls + "</urlset>")
    return HTMLResponse(xml, media_type="application/xml")

# --- Настройки Telegram (задаются в Render -> Environment, в код НЕ вписывать) ---
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")

# Антиспам: не более LEAD_LIMIT заявок с одного IP за LEAD_WINDOW секунд
LEAD_LIMIT = 5
LEAD_WINDOW = 3600
_lead_log = {}

# Максимальный размер картинки спецификации
MAX_IMAGE_BYTES = 8 * 1024 * 1024


@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    # Главная — витрина; калькулятор переехал на /calc
    return HTMLResponse(render_home("ru"))


@app.get("/uz", response_class=HTMLResponse)
async def read_root_uz(request: Request):
    # Та же главная на узбекском: отдельный адрес, чтобы её находили по запросам на узбекском
    return HTMLResponse(render_home("uz"))


@app.get("/uz/")
async def read_root_uz_slash():
    return RedirectResponse("/uz", status_code=301)


@app.get("/favicon.ico")
async def favicon_ico():
    # Браузеры и поисковики запрашивают иконку по этому адресу, даже если она не указана в странице
    return FileResponse(os.path.join(HOME_DIR, "favicon.ico"), media_type="image/x-icon", headers={"Cache-Control": "public, max-age=86400"})


@app.get("/yandex_c4a2d69f3e5cf5ea.html", response_class=HTMLResponse)
async def yandex_verification():
    # Подтверждение прав на сайт в Яндекс.Вебмастере
    return ('<html>\n    <head>\n        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">\n'
            '    </head>\n    <body>Verification: c4a2d69f3e5cf5ea</body>\n</html>')


@app.get("/googled74069028bb9f909.html", response_class=PlainTextResponse)
async def google_verification():
    # Подтверждение прав на сайт в Google Search Console
    return "google-site-verification: googled74069028bb9f909.html"


def _make_landing(slug):
    async def landing():
        return HTMLResponse(render_landing(slug))
    return landing


# Посадочные страницы под поисковые запросы (см. landings.py): по одному явному адресу на страницу
for _slug in LANDINGS:
    app.add_api_route("/" + _slug, _make_landing(_slug), methods=["GET"], response_class=HTMLResponse)


@app.get("/partners", response_class=HTMLResponse)
async def partners():
    # Страница для дизайнеров и строителей (сотрудничество), оформлена как и остальные посадочные
    return HTMLResponse(render_landing("partners"))


SHKAF_UZ_TITLE = "Buyurtma shkaf-kupe, garderob xonasi va prixojaya kalkulyatori | Kitchen Calc"
SHKAF_UZ_DESC = ("Toshkentda buyurtma asosida shkaf-kupe, garderob xonasi va prixojaya onlayn kalkulyatori: o'lcham, eshik, "
                 "oyna va ichki to'ldirishni tanlang — narx va chizma 2 daqiqada. Ekonom, Standart, Premium.")


def render_shkaf(lang):
    # Один шаблон на двух языках: узбекская версия по адресу /uz/shkaf (текст переводит static/js/shkaf-uz.js)
    with open(os.path.join(os.path.dirname(__file__), "templates", "wardrobe.html"), encoding="utf-8") as f:
        page = f.read()
    hre = (f'<link rel="alternate" hreflang="ru" href="{SITE_URL}/shkaf">'
           f'<link rel="alternate" hreflang="uz" href="{SITE_URL}/uz/shkaf">'
           f'<link rel="alternate" hreflang="x-default" href="{SITE_URL}/shkaf">')
    if lang == "uz":
        page = page.replace('<html lang="ru">', '<html lang="uz">', 1)
        page = page.replace("<!--LANGHEAD-->", f'<link rel="canonical" href="{SITE_URL}/uz/shkaf">' + hre, 1)
        page = page.replace("<!--LANGLINK-->", '<a class="lk" id="langLink" href="/shkaf">RU</a>', 1)
        page = page.replace("<!--LANGSCRIPT-->", '<script>window.KC_LANG="uz";</script>\n<script src="/static/js/shkaf-uz.js?v=8"></script>', 1)
        page = page.replace('href="/">← Главная', 'href="/uz">← Главная', 1)
        page = re.sub(r"<title>.*?</title>", f"<title>{SHKAF_UZ_TITLE}</title>", page, count=1, flags=re.S)
        page = re.sub(r'(<meta name="description" content=")[^"]*(")', lambda m: m.group(1) + SHKAF_UZ_DESC + m.group(2), page, count=1)
        page = page.replace('content="https://kitchen-calc.uz/shkaf"', f'content="{SITE_URL}/uz/shkaf"')
    else:
        page = page.replace("<!--LANGHEAD-->", f'<link rel="canonical" href="{SITE_URL}/shkaf">' + hre, 1)
        page = page.replace("<!--LANGLINK-->", '<a class="lk" id="langLink" href="/uz/shkaf">UZ</a>', 1)
        page = page.replace("<!--LANGSCRIPT-->", "", 1)
    return page


@app.get("/shkaf", response_class=HTMLResponse)
async def wardrobe_calc():
    # Калькулятор шкафов-купе, гардеробных и прихожих
    return HTMLResponse(render_shkaf("ru"))


@app.get("/uz/shkaf", response_class=HTMLResponse)
async def wardrobe_calc_uz():
    return HTMLResponse(render_shkaf("uz"))


PRIVACY_HTML = """<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Политика конфиденциальности | Kitchen Calc</title><link rel="canonical" href="https://kitchen-calc.uz/privacy">
<style>body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:760px;margin:0 auto;padding:32px 18px 60px;line-height:1.6;color:#1f2937;background:#fbf8f2}
h1{font-size:1.7rem;color:#2a2013}h2{font-size:1.1rem;margin-top:26px;color:#7a5500}a{color:#9a6e1c}</style></head><body>
<p><a href="/">← kitchen-calc.uz</a></p>
<h1>Политика конфиденциальности</h1>
<p>Kitchen Calc (kitchen-calc.uz) — изготовление мебели на заказ в Ташкенте. Мы уважаем вашу приватность и собираем только те данные, которые нужны, чтобы связаться с вами по заказу.</p>
<h2>Какие данные мы получаем</h2>
<p>Имя, номер телефона и, по желанию, комментарий, размеры и параметры мебели — когда вы оставляете заявку на сайте, в форме рекламы Instagram/Facebook или пишете нам в мессенджер.</p>
<h2>Зачем</h2>
<p>Чтобы перезвонить, ответить на вопросы, рассчитать стоимость, договориться о замере и выполнить заказ. Мы не отправляем рекламные рассылки без вашего согласия.</p>
<h2>Кому передаём</h2>
<p>Никому не продаём и не передаём ваши данные, кроме случаев, предусмотренных законодательством Республики Узбекистан. Для статистики посещений сайта используется Яндекс Метрика (обезличенные данные).</p>
<h2>Хранение и удаление</h2>
<p>Данные хранятся столько, сколько нужно для выполнения заказа и гарантийных обязательств. Чтобы удалить свои данные, напишите или позвоните нам — удалим в течение 7 дней.</p>
<h2>Контакты</h2>
<p>Телефон: <a href="tel:+998920934510">+998 92 093-45-10</a> · Telegram: <a href="https://t.me/Kitchencalc">@Kitchencalc</a> · Сайт: <a href="https://kitchen-calc.uz">kitchen-calc.uz</a></p>
</body></html>"""


@app.get("/privacy", response_class=HTMLResponse)
async def privacy():
    # Политика конфиденциальности — нужна для моментальных форм рекламы Meta
    return HTMLResponse(PRIVACY_HTML)


@app.get("/calc", response_class=HTMLResponse)
async def calculator(request: Request):
    file_path = os.path.join(os.path.dirname(__file__), "templates", "index.html")
    return FileResponse(file_path)


HOME_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "home")
HOME_TYPES = {"svg": "image/svg+xml", "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp", "ico": "image/x-icon"}


DOCS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "docs")
DOC_TYPES = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


@app.get("/docs/{filename}")
async def download_doc(filename: str):
    # Шаблон договора для скачивания: только простые имена файлов .pdf / .docx из static/docs
    m = re.fullmatch(r"[a-z0-9_-]{1,50}\.(pdf|docx)", filename)
    path = os.path.join(DOCS_DIR, filename)
    if not m or not os.path.isfile(path):
        return JSONResponse({"error": "not found"}, status_code=404)
    disposition = "inline" if m.group(1) == "pdf" else "attachment"
    return FileResponse(path, media_type=DOC_TYPES[m.group(1)],
                        headers={"Content-Disposition": f'{disposition}; filename="{filename}"', "Cache-Control": "public, max-age=3600"})


@app.get("/static/home/{filename}")
async def home_asset(filename: str):
    # Картинки главной: только простые имена файлов (latin, цифры, - _) с картиночным расширением
    m = re.fullmatch(r"[a-z0-9_-]{1,40}\.(svg|jpg|jpeg|png|webp|ico)", filename)
    path = os.path.join(HOME_DIR, filename)
    if not m or not os.path.isfile(path):
        return JSONResponse({"error": "not found"}, status_code=404)
    return FileResponse(path, media_type=HOME_TYPES[m.group(1)], headers={"Cache-Control": "public, max-age=604800"})


@app.get("/raskroy", response_class=HTMLResponse)
async def raskroy(request: Request):
    # Раскрой листов для мастера: страница скрыта, поисковики её не индексируют
    file_path = os.path.join(os.path.dirname(__file__), "templates", "raskroy.html")
    return FileResponse(file_path, headers={"X-Robots-Tag": "noindex, nofollow"})


@app.get("/health")
async def health():
    # Лёгкая страница для сервисов-пингов (UptimeRobot и т.п.)
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# КАТАЛОГ ЦВЕТОВ: картинки из папки static/catalog/<раздел>/NN.webp
# ---------------------------------------------------------------------------
CATALOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "catalog")


@app.get("/static/js/{filename}")
async def static_js(filename: str):
    # Общие скрипты (данные калькулятора шкафов и раскроя)
    if not re.fullmatch(r"[a-z0-9_-]{1,40}\.js", filename):
        raise HTTPException(status_code=404)
    path = os.path.join(os.path.dirname(__file__), "static", "js", filename)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404)
    return FileResponse(path, media_type="application/javascript", headers={"Cache-Control": "public, max-age=300"})


@app.get("/static/catalog/{section}/{filename}")
async def catalog_image(section: str, filename: str):
    # Пропускаем только безопасные имена: латиница в названии раздела и NN.webp
    if not re.fullmatch(r"[a-z]{2,20}", section) or not re.fullmatch(r"\d{1,3}\.webp", filename):
        return JSONResponse({"error": "not found"}, status_code=404)
    path = os.path.join(CATALOG_DIR, section, filename)
    if not os.path.isfile(path):
        return JSONResponse({"error": "not found"}, status_code=404)
    return FileResponse(path, media_type="image/webp", headers={"Cache-Control": "public, max-age=604800"})


# ---------------------------------------------------------------------------
# ЗАЯВКИ В TELEGRAM
# ---------------------------------------------------------------------------
def _clip(value, limit):
    return str(value if value is not None else "").strip()[:limit]


def _esc(value, limit=200):
    return html.escape(_clip(value, limit))


def _client_ip(request: Request):
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _rate_ok(ip):
    now = time.time()
    if len(_lead_log) > 2000:
        for key in list(_lead_log.keys()):
            if not [t for t in _lead_log[key] if now - t < LEAD_WINDOW]:
                _lead_log.pop(key, None)
    hits = [t for t in _lead_log.get(ip, []) if now - t < LEAD_WINDOW]
    if len(hits) >= LEAD_LIMIT:
        _lead_log[ip] = hits
        return False
    hits.append(now)
    _lead_log[ip] = hits
    return True


def _section_line(sec, tier):
    if not isinstance(sec, dict):
        return ""
    prefix = "Н" if tier == "lower" else "В"
    parts = [f"{prefix}-{_esc(sec.get('id'), 4)} {_esc(sec.get('name'), 150)}"]
    parts.append(f"{_esc(sec.get('width'), 6)} см")
    if sec.get("shelves"):
        parts.append(f"полки {_esc(sec.get('shelves'), 3)}")
    if tier == "lower" and sec.get("drawers"):
        parts.append(f"ящики {_esc(sec.get('drawers'), 3)}")
    if tier == "upper" and sec.get("gasLifts"):
        parts.append(f"газлифт {_esc(sec.get('gasLifts'), 3)}")
    open_map = {"push": "push", "gola": "гола", "handles": "ручки"}
    parts.append(open_map.get(sec.get("openType"), "ручки"))
    return ", ".join(parts)


def build_lead_text(data):
    name = _esc(data.get("name"), 100) or "не указано"
    phone = _esc(data.get("phone"), 30)
    notes = _esc(data.get("notes"), 300) or "—"
    price = _esc(data.get("price"), 30) or "—"
    source = _clip(data.get("source"), 2000)

    lines = [
        "🔔 <b>Новая заявка с калькулятора</b>",
        "",
        f"👤 {name}",
        f"📞 {phone}",
        f"📍 {notes}",
        f"💰 Ориентировочно: <b>{price} UZS</b>",
    ]

    details = data.get("details")
    if isinstance(details, dict) and details:
        lines.append("")
        lines.append("<b>Параметры</b>")
        for label, value in list(details.items())[:20]:
            lines.append(f"{_esc(label, 40)}: {_esc(value, 200)}")

    for key, title, tier in (("lower", "Нижние модули", "lower"), ("upper", "Верхние модули", "upper")):
        items = data.get(key)
        if isinstance(items, list) and items:
            lines.append("")
            lines.append(f"<b>{title}</b>")
            for sec in items[:16]:
                line = _section_line(sec, tier)
                if line:
                    lines.append(line)

    blocks = data.get("blocks")
    if isinstance(blocks, list):
        for blk in blocks[:5]:
            if not isinstance(blk, dict) or not isinstance(blk.get("items"), list):
                continue
            lines.append("")
            lines.append(f"<b>{_esc(blk.get('title'), 60)}</b>")
            for it in blk["items"][:20]:
                lines.append("• " + _esc(it, 160))

    # Ссылка открывает на сайте ровно ту кухню, которую собрал клиент
    if source.startswith(("https://", "http://")):
        link_line = f'🔗 <a href="{html.escape(source, quote=True)}">Открыть расчёт клиента на сайте</a>'
    else:
        link_line = "🔗 Источник: прямой заход"

    # Обрезаем по целым строкам, чтобы не порвать HTML-теги (лимит Telegram 4096 символов)
    limit = 3900 - len(link_line) - 2
    out, size = [], 0
    for line in lines:
        if size + len(line) + 1 > limit:
            out.append("…")
            break
        out.append(line)
        size += len(line) + 1
    return "\n".join(out) + "\n\n" + link_line


def _send_telegram(text):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = json.dumps({
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.status == 200


def _decode_image(value):
    """Картинка спецификации приходит как data:image/jpeg;base64,... Возвращает (байты, имя файла) или None."""
    if not isinstance(value, str) or not value.startswith("data:image/"):
        return None
    header, _, b64 = value.partition(",")
    if ";base64" not in header or len(b64) > MAX_IMAGE_BYTES * 4 // 3 + 16:
        return None
    try:
        raw = base64.b64decode(b64, validate=True)
    except Exception:
        return None
    if raw[:3] == b"\xff\xd8\xff":
        return raw, "specifikaciya.jpg"
    if raw[:8] == b"\x89PNG\r\n\x1a\n":
        return raw, "specifikaciya.png"
    return None


def _send_document(file_bytes, filename, caption):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendDocument"
    boundary = "----kitchencalc" + uuid.uuid4().hex
    ctype = "image/png" if filename.endswith(".png") else "image/jpeg"
    parts = []
    for name, value in (("chat_id", TELEGRAM_CHAT_ID), ("caption", caption)):
        parts.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode("utf-8")
        )
    parts.append(
        f'--{boundary}\r\nContent-Disposition: form-data; name="document"; filename="{filename}"\r\n'
        f"Content-Type: {ctype}\r\n\r\n".encode("utf-8") + file_bytes + b"\r\n"
    )
    parts.append(f"--{boundary}--\r\n".encode("utf-8"))
    req = urllib.request.Request(
        url, data=b"".join(parts), headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.status == 200


@app.post("/lead")
async def receive_lead(request: Request):
    try:
        data = await request.json()
    except Exception:
        return JSONResponse({"ok": False, "error": "bad_request"}, status_code=400)
    if not isinstance(data, dict):
        return JSONResponse({"ok": False, "error": "bad_request"}, status_code=400)

    # Скрытое поле-ловушка для ботов: людям оно не видно, боты его заполняют
    if data.get("website"):
        return {"ok": True}

    phone = _clip(data.get("phone"), 30)
    if len(re.sub(r"\D", "", phone)) < 9:
        return JSONResponse({"ok": False, "error": "bad_phone"}, status_code=400)

    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return JSONResponse({"ok": False, "error": "not_configured"}, status_code=503)

    if not _rate_ok(_client_ip(request)):
        return JSONResponse({"ok": False, "error": "rate_limited"}, status_code=429)

    text = build_lead_text(data)
    try:
        await asyncio.to_thread(_send_telegram, text)
    except Exception as exc:
        print("telegram send failed:", type(exc).__name__)
        return JSONResponse({"ok": False, "error": "send_failed"}, status_code=502)

    # Картинка спецификации отдельным файлом. Если не получилось, заявка (текст) всё равно уже у мастера.
    image_sent = False
    image = _decode_image(data.get("image"))
    if image:
        caption = f"📋 Спецификация: {_clip(data.get('name'), 60) or 'без имени'}, {phone}"
        try:
            await asyncio.to_thread(_send_document, image[0], image[1], caption)
            image_sent = True
        except Exception as exc:
            print("telegram image send failed:", type(exc).__name__)

    return {"ok": True, "image": image_sent}


# ---------------------------------------------------------------------------
# ПРЕЖНИЙ МАРШРУТ /summary (без изменений)
# ---------------------------------------------------------------------------
@app.post("/summary", response_class=HTMLResponse)
async def show_summary(
    request: Request,
    clientName: str = Form(""),
    clientPhone: str = Form(""),
    clientNotes: str = Form(""),
    totalPrice: str = Form("0"),
    kitchenType: str = Form("Прямая"),
    dimensionsText: str = Form(""),
    upperModeText: str = Form(""),
    fittingsText: str = Form(""),
    doorTypeText: str = Form(""),
    facadeText: str = Form(""),
    facadeEdgeText: str = Form(""),
    bodyText: str = Form(""),
    bodyEdgeText: str = Form(""),
    countertopText: str = Form(""),
    hardwareText: str = Form(""),
    islandText: str = Form(""),
    sectionsJson: str = Form("[]")
):
    try:
        sections = json.loads(sectionsJson)
    except:
        sections = []

    clean_price = totalPrice.replace(" ", "")
    advance_val = int(clean_price) * 0.70 if clean_price.isdigit() else 0
    final_val = int(clean_price) - int(advance_val) if clean_price.isdigit() else 0

    context = {
        "request": request,
        "clientName": clientName,
        "clientPhone": clientPhone,
        "clientNotes": clientNotes,
        "totalPrice": totalPrice,
        "advance": f"{int(advance_val):,}".replace(",", " "),
        "final_sum": f"{int(final_val):,}".replace(",", " "),
        "kitchenType": kitchenType,
        "dimensionsText": dimensionsText,
        "upperModeText": upperModeText,
        "fittingsText": fittingsText,
        "doorTypeText": doorTypeText,
        "facadeText": facadeText,
        "facadeEdgeText": facadeEdgeText,
        "bodyText": bodyText,
        "bodyEdgeText": bodyEdgeText,
        "countertopText": countertopText,
        "hardwareText": hardwareText,
        "islandText": islandText,
        "sections": sections
    }

    return templates.TemplateResponse("summary.html", context)
