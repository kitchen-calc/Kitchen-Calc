import os
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
    import json
    try:
        sections = json.loads(sectionsJson)
    except:
        sections = []

    advance = int(totalPrice.replace(" ", "")) * 0.75 if totalPrice.replace(" ", "").isdigit() else 0
    final_sum = int(totalPrice.replace(" ", "")) - int(advance) if totalPrice.replace(" ", "").isdigit() else 0

    return templates.TemplateResponse("summary.html", {
        "request": request,
        "clientName": clientName,
        "clientPhone": clientPhone,
        "clientNotes": clientNotes,
        "totalPrice": totalPrice,
        "advance": f"{int(advance):,}".replace(",", " "),
        "final_sum": f"{int(final_sum):,}".replace(",", " "),
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
    })
