import os
import json
from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.templating import Jinja2Templates

app = FastAPI()
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    file_path = os.path.join(os.path.dirname(__file__), "templates", "index.html")
    return FileResponse(file_path)

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
