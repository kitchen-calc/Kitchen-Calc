import os
import re
import json
import html
import time
import uuid
import base64
import asyncio
import urllib.request
from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.templating import Jinja2Templates

app = FastAPI()
templates = Jinja2Templates(directory="templates")

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
    file_path = os.path.join(os.path.dirname(__file__), "templates", "index.html")
    return FileResponse(file_path)


@app.get("/health")
async def health():
    # Лёгкая страница для сервисов-пингов (UptimeRobot и т.п.)
    return {"status": "ok"}


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
    parts = [f"{prefix}-{_esc(sec.get('id'), 4)} {_esc(sec.get('name'), 60)}"]
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
    source = _esc(data.get("source"), 200) or "прямой заход"

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
            lines.append(f"{_esc(label, 40)}: {_esc(value, 120)}")

    for key, title, tier in (("lower", "Нижние модули", "lower"), ("upper", "Верхние модули", "upper")):
        items = data.get(key)
        if isinstance(items, list) and items:
            lines.append("")
            lines.append(f"<b>{title}</b>")
            for sec in items[:12]:
                line = _section_line(sec, tier)
                if line:
                    lines.append(line)

    lines.append("")
    lines.append(f"🔗 Источник: {source}")

    text = "\n".join(lines)
    return text[:3900]


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
    advance_val = int(clean_price) * 0.75 if clean_price.isdigit() else 0
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
