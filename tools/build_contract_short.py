"""Короткий двусторонний договор (2–3 листа) с поэтапными подписями:
этап 1 — Исполнитель получил предоплату 70% (невозвратная, уходит на материал);
этап 2 — Заказчик принял мебель/работу;
этап 3 — Исполнитель получил остаток.

Собирает static/docs/dogovor-korotkiy.pdf и .docx:
    pip install python-docx reportlab
    python tools/build_contract_short.py
Пустые линии ____ вписываются от руки; для ФИО линии длиннее.
"""
import os

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "static", "docs")
NAME = "dogovor-korotkiy"
FONTS = r"C:\Windows\Fonts"
FONT_FILES = {"R": "times.ttf", "B": "timesbd.ttf", "I": "timesi.ttf"}
if not os.path.isdir(FONTS):
    FONTS = "/usr/share/fonts/truetype/liberation"
    FONT_FILES = {"R": "LiberationSerif-Regular.ttf", "B": "LiberationSerif-Bold.ttf", "I": "LiberationSerif-Italic.ttf"}

S = "_" * 14          # сумма
SW = "_" * 46         # сумма прописью
FIO = "_" * 62        # ФИО — длинная линия
D = "«____» ______________ 20____ г."
SIGN = "Подпись ________________"

# ("title"|"sub"|"row"|"h"|"p"|"stage"|"line"|"sp") — блоки документа
DOC = [
    ("title", "ДОГОВОР № ________"),
    ("sub", "на изготовление и установку мебели"),
    ("row", "г. Ташкент", D),
    ("p", "<b>Исполнитель:</b> " + FIO),
    ("p", "тел.: ______________________, с одной стороны, и"),
    ("p", "<b>Заказчик:</b> " + FIO),
    ("p", "паспорт: ____________________, тел.: ______________________,"),
    ("p", "адрес установки: " + "_" * 66 + ","),
    ("p", "с другой стороны, заключили настоящий договор о нижеследующем."),

    ("h", "1. Предмет договора"),
    ("p", "1.1. Исполнитель изготавливает по индивидуальным размерам и устанавливает мебель:"),
    ("p", "_" * 88),
    ("p", "_" * 88),
    ("p", "1.2. Внешний вид, размеры, цвета и наполнение — по согласованному с Заказчиком проекту (эскизу), "
          "который является частью договора."),

    ("h", "2. Цена и порядок оплаты"),
    ("p", "2.1. Общая стоимость: <b>" + S + " сум</b>"),
    ("p", "(" + SW + "_" * 38 + ")."),
    ("p", "2.2. <b>Предоплата 70%</b> — " + S + " сум — вносится при подписании договора. "
          "<b>Предоплата не возвращается</b>, так как сразу расходуется на закупку материалов и фурнитуры "
          "и раскрой под индивидуальный заказ."),
    ("p", "2.3. <b>Остаток 30%</b> — " + S + " сум — оплачивается после завершения работ и приёмки мебели Заказчиком."),
    ("p", "2.4. Получение каждой суммы подтверждается подписью в разделе «Поэтапное подписание»."),

    ("h", "3. Сроки и приёмка"),
    ("p", "3.1. Срок изготовления и установки — ______ рабочих дней со дня получения предоплаты."),
    ("p", "3.2. После установки Заказчик осматривает мебель. Замечания указываются письменно, Исполнитель "
          "устраняет их в разумный срок. Подпись Заказчика на этапе 2 означает, что мебель получена, "
          "работа выполнена и претензий нет."),
    ("p", "3.3. Изменения проекта после внесения предоплаты оформляются отдельно и могут изменить цену и срок."),

    ("h", "4. Гарантия и прочие условия"),
    ("p", "4.1. Гарантия на мебель — ______ месяцев со дня приёмки при правильной эксплуатации. Гарантия не "
          "распространяется на механические повреждения, попадание воды и самостоятельные переделки."),
    ("p", "4.2. При отказе Заказчика от договора после внесения предоплаты предоплата не возвращается."),
    ("p", "4.3. Споры решаются переговорами, а при недостижении согласия — в суде по законодательству "
          "Республики Узбекистан. Договор составлен в 2 экземплярах, по одному для каждой стороны."),

    ("pagebreak",),
    ("h", "5. Подписи сторон"),
    ("sign2",),
    ("sp",),
    ("title2", "ПОЭТАПНОЕ ПОДПИСАНИЕ"),
    ("sub", "к договору № ________ от " + D),

    ("stage", "Этап 1. Получение предоплаты 70%",
     ["Я, Исполнитель, получил(а) от Заказчика предоплату в размере <b>" + S + " сум</b>",
      "(" + "_" * 72 + ").",
      "Сумма <b>невозвратная</b> — она направляется на закупку материалов для заказа."],
     ["Исполнитель (ФИО): " + FIO, SIGN + "        Дата: " + D]),

    ("stage", "Этап 2. Приёмка мебели и работы",
     ["Я, Заказчик, мебель получил(а). Работы по изготовлению и установке выполнены полностью,",
      "претензий по качеству, комплектности и срокам не имею."],
     ["Заказчик (ФИО): " + FIO, SIGN + "        Дата: " + D]),

    ("stage", "Этап 3. Получение остатка",
     ["Я, Исполнитель, получил(а) от Заказчика остаток оплаты в размере <b>" + S + " сум</b>",
      "(" + "_" * 72 + ").",
      "Расчёт по договору произведён полностью, взаимных претензий стороны не имеют."],
     ["Исполнитель (ФИО): " + FIO, SIGN + "        Дата: " + D]),
]


def build_pdf(path):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.lib.fonts import addMapping
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
    from reportlab.lib import colors

    for k, f in FONT_FILES.items():
        pdfmetrics.registerFont(TTFont("T" + k, os.path.join(FONTS, f)))
    addMapping("TR", 0, 0, "TR"); addMapping("TR", 1, 0, "TB"); addMapping("TR", 0, 1, "TI"); addMapping("TR", 1, 1, "TB")
    base = ParagraphStyle("p", fontName="TR", fontSize=10.5, leading=15, alignment=0, spaceAfter=2.5)
    st = {
        "title": ParagraphStyle("t", parent=base, fontName="TB", fontSize=15, alignment=TA_CENTER, spaceAfter=2),
        "title2": ParagraphStyle("t2", parent=base, fontName="TB", fontSize=14, alignment=TA_CENTER, spaceAfter=2),
        "sub": ParagraphStyle("s", parent=base, alignment=TA_CENTER, spaceAfter=10),
        "h": ParagraphStyle("h", parent=base, fontName="TB", spaceBefore=8, spaceAfter=4),
        "p": base,
        "sh": ParagraphStyle("sh", parent=base, fontName="TB", fontSize=12, spaceAfter=6),
        "sl": ParagraphStyle("sl", parent=base, alignment=0, spaceAfter=2),
        "sg": ParagraphStyle("sg", parent=base, alignment=0, leading=20, spaceAfter=0),
    }
    W = A4[0] - 40 * mm
    story = []
    for b in DOC:
        k = b[0]
        if k == "row":
            t = Table([[Paragraph(b[1], base), Paragraph(b[2], ParagraphStyle("r", parent=base, alignment=2))]], colWidths=[W * .4, W * .6])
            t.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
            story.append(t)
        elif k == "sp":
            story.append(Spacer(1, 6))
        elif k == "pagebreak":
            story.append(PageBreak())
        elif k == "sign2":
            cell = lambda who: [Paragraph("<b>" + who + "</b>", st["sl"]), Spacer(1, 4),
                                Paragraph("ФИО: " + "_" * 34, st["sg"]), Paragraph("_" * 40, st["sg"]),
                                Paragraph(SIGN, st["sg"]), Paragraph("Дата: «___» ___________ 20___ г.", st["sg"])]
            t = Table([[cell("Исполнитель"), cell("Заказчик")]], colWidths=[W / 2, W / 2])
            t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 0)]))
            story.append(KeepTogether([t]))
        elif k == "stage":
            inner = [Paragraph(b[1], st["sh"])] + [Paragraph(x, st["sl"]) for x in b[2]] + [Spacer(1, 10)] + \
                    [Paragraph(x, st["sg"]) for x in b[3]]
            t = Table([[inner]], colWidths=[W])
            t.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), .8, colors.black),
                                   ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                                   ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 12)]))
            story += [KeepTogether([t]), Spacer(1, 16)]
        else:
            story.append(Paragraph(b[1], st[k]))
    doc = SimpleDocTemplate(path, pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=13 * mm, bottomMargin=13 * mm,
                            title="Договор на изготовление и установку мебели")
    doc.build(story, onLaterPages=_num, onFirstPage=_num)


def _num(c, doc):
    c.setFont("TR", 9)
    c.drawRightString(doc.pagesize[0] - doc.rightMargin, 9 * 2.835, "стр. %d" % doc.page)


def build_docx(path):
    import re
    from docx import Document
    from docx.shared import Pt, Mm
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement

    d = Document()
    sec = d.sections[0]
    sec.page_width, sec.page_height = Mm(210), Mm(297)
    sec.left_margin = sec.right_margin = Mm(20)
    sec.top_margin = sec.bottom_margin = Mm(16)
    nst = d.styles["Normal"]
    nst.font.name = "Times New Roman"; nst.font.size = Pt(11)
    nst.element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
    nst.paragraph_format.space_after = Pt(3)

    def para(html, align=WD_ALIGN_PARAGRAPH.JUSTIFY, bold=False, size=None, after=None, cell=None, line=None):
        p = (cell.add_paragraph() if cell is not None else d.add_paragraph())
        p.alignment = align
        if after is not None:
            p.paragraph_format.space_after = Pt(after)
        if line:
            p.paragraph_format.line_spacing = Pt(line)
        for part in re.split(r"(<b>.*?</b>)", html):
            if not part:
                continue
            r = p.add_run(re.sub(r"</?b>", "", part))
            r.bold = bold or part.startswith("<b>")
            if size:
                r.font.size = Pt(size)
        return p

    def box(cell):
        tcPr = cell._tc.get_or_add_tcPr()
        b = OxmlElement("w:tcBorders")
        for side in ("top", "left", "bottom", "right"):
            e = OxmlElement("w:" + side)
            e.set(qn("w:val"), "single"); e.set(qn("w:sz"), "8"); e.set(qn("w:color"), "000000")
            b.append(e)
        tcPr.append(b)

    C = WD_ALIGN_PARAGRAPH.CENTER
    for b in DOC:
        k = b[0]
        if k in ("title", "title2"):
            para(b[1], C, True, 15 if k == "title" else 14, 2)
        elif k == "sub":
            para(b[1], C, after=10)
        elif k == "row":
            t = d.add_table(rows=1, cols=2)
            t.cell(0, 0).paragraphs[0].add_run(b[1])
            p = t.cell(0, 1).paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.RIGHT; p.add_run(b[2])
        elif k == "sp":
            d.add_paragraph()
        elif k == "pagebreak":
            d.add_page_break()
        elif k == "h":
            p = para(b[1], bold=True, after=4); p.paragraph_format.space_before = Pt(8)
        elif k == "p":
            para(b[1])
        elif k == "sign2":
            t = d.add_table(rows=1, cols=2)
            for i, who in enumerate(("Исполнитель", "Заказчик")):
                c = t.cell(0, i); c.paragraphs[0].add_run(who).bold = True
                for x in ("ФИО: " + "_" * 30, "_" * 36, SIGN, "Дата: «___» __________ 20___ г."):
                    para(x, WD_ALIGN_PARAGRAPH.LEFT, cell=c, line=22)
        elif k == "stage":
            t = d.add_table(rows=1, cols=1)
            c = t.cell(0, 0); box(c)
            r = c.paragraphs[0].add_run(b[1]); r.bold = True; r.font.size = Pt(12)
            for x in b[2]:
                para(x, WD_ALIGN_PARAGRAPH.LEFT, cell=c)
            c.add_paragraph()
            for x in b[3]:
                para(x, WD_ALIGN_PARAGRAPH.LEFT, cell=c, line=22)
            d.add_paragraph()
    d.save(path)


if __name__ == "__main__":
    os.makedirs(OUT_DIR, exist_ok=True)
    build_pdf(os.path.join(OUT_DIR, NAME + ".pdf"))
    build_docx(os.path.join(OUT_DIR, NAME + ".docx"))
    print("ok:", os.path.join(OUT_DIR, NAME + ".pdf"), os.path.join(OUT_DIR, NAME + ".docx"))
