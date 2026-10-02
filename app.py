import os
from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI()

@app.get("/", response_class=HTMLResponse)
async def read_root():
    return """
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Калькулятор кухни мечты</title>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    </head>
    <body class="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white min-h-screen p-4 pb-12 font-sans">
        
        <div class="max-w-xl mx-auto bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/50 p-6 mt-4">
            
            <!-- Заголовок -->
            <div class="text-center mb-6">
                <span class="bg-indigo-500/20 text-indigo-400 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">Индивидуальное производство</span>
                <h1 class="text-2xl font-black mt-2 bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">Кухня вашей мечты за 2 минуты</h1>
                <p class="text-slate-400 text-sm mt-1">Рассчитайте точную стоимость и получите PDF-проект со скидкой 10%!</p>
            </div>

            <!-- Шаг 1: Тип планировки -->
            <div class="mb-5">
                <label class="block text-sm font-medium text-indigo-300 mb-2">1. Выберите форму кухни:</label>
                <div class="grid grid-cols-2 gap-2" id="layoutType">
                    <button type="button" onclick="setLayout('straight', this)" class="layout-btn p-3 rounded-xl border border-indigo-500 bg-indigo-600/30 text-center transition font-medium text-sm">Прямая</button>
                    <button type="button" onclick="setLayout('l-shape', this)" class="layout-btn p-3 rounded-xl border border-slate-700 bg-slate-800/50 text-center transition font-medium text-sm text-slate-300">Г-образная</button>
                    <button type="button" onclick="setLayout('u-shape', this)" class="layout-btn p-3 rounded-xl border border-slate-700 bg-slate-800/50 text-center transition font-medium text-sm text-slate-300">П-образная</button>
                    <button type="button" onclick="setLayout('island', this)" class="layout-btn p-3 rounded-xl border border-slate-700 bg-slate-800/50 text-center transition font-medium text-sm text-slate-300">С островом</button>
                </div>
            </div>

            <!-- Шаг 2: Размеры пространства -->
            <div class="mb-5 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                <label class="block text-sm font-medium text-indigo-300 mb-3">2. Размеры помещения (см):</label>
                
                <div class="space-y-3">
                    <div>
                        <div class="flex justify-between text-xs text-slate-400 mb-1">
                            <span id="labelSide1">Длина основной стены:</span>
                            <span id="valSide1" class="text-indigo-400 font-bold">300 см</span>
                        </div>
                        <input type="range" id="side1" min="150" max="600" step="10" value="300" oninput="updateCalc()" class="w-full accent-indigo-500 bg-slate-700 rounded-lg h-2">
                    </div>

                    <div id="side2Container">
                        <div class="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Длина второй стены (вылет):</span>
                            <span id="valSide2" class="text-indigo-400 font-bold">180 см</span>
                        </div>
                        <input type="range" id="side2" min="100" max="400" step="10" value="180" oninput="updateCalc()" class="w-full accent-indigo-500 bg-slate-700 rounded-lg h-2">
                    </div>

                    <div id="side3Container" class="hidden">
                        <div class="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Длина третьей стены / острова:</span>
                            <span id="valSide3" class="text-indigo-400 font-bold">150 см</span>
                        </div>
                        <input type="range" id="side3" min="100" max="300" step="10" value="150" oninput="updateCalc()" class="w-full accent-indigo-500 bg-slate-700 rounded-lg h-2">
                    </div>

                    <div>
                        <div class="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Высота потолков:</span>
                            <span id="valHeight" class="text-indigo-400 font-bold">260 см</span>
                        </div>
                        <input type="range" id="ceilingHeight" min="240" max="320" step="5" value="260" oninput="updateCalc()" class="w-full accent-indigo-500 bg-slate-700 rounded-lg h-2">
                    </div>
                </div>
            </div>

            <!-- Шаг 3: Наполнение и фурнитура -->
            <div class="mb-6 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-4">
                <label class="block text-sm font-medium text-indigo-300">3. Фурнитура и наполнение:</label>

                <!-- Система открывания -->
                <div>
                    <span class="text-xs text-slate-400 block mb-1.5">Система открывания фасадов:</span>
                    <div class="grid grid-cols-2 gap-2">
                        <label class="flex items-center space-x-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-700 cursor-pointer text-sm">
                            <input type="radio" name="handleType" value="handles" checked onchange="updateCalc()" class="accent-indigo-500">
                            <span>С ручками (Классика)</span>
                        </label>
                        <label class="flex items-center space-x-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-700 cursor-pointer text-sm">
                            <input type="radio" name="handleType" value="push" onchange="updateCalc()" class="accent-indigo-500">
                            <span>Push-to-Open (+15%)</span>
                        </label>
                    </div>
                </div>

                <!-- Дополнительные элементы -->
                <div class="space-y-2 pt-2 border-t border-slate-700/60">
                    <label class="flex items-center justify-between text-sm cursor-pointer">
                        <span class="text-slate-300">Дополнительные выдвижные ящики (Blum)</span>
                        <input type="checkbox" id="extraDrawers" onchange="updateCalc()" class="w-4 h-4 accent-indigo-500 rounded">
                    </label>
                    <label class="flex items-center justify-between text-sm cursor-pointer">
                        <span class="text-slate-300">Встроенная подсветка рабочей зоны</span>
                        <input type="checkbox" id="extraLight" onchange="updateCalc()" class="w-4 h-4 accent-indigo-500 rounded">
                    </label>
                </div>
            </div>

            <!-- Блок результатов -->
            <div class="bg-indigo-950/60 border border-indigo-500/30 rounded-xl p-4 mb-5 text-center">
                <span class="text-xs text-indigo-300 uppercase tracking-wider">Итоговая стоимость проекта</span>
                <div id="totalPrice" class="text-3xl font-black text-white mt-1">0 ₽</div>
                <p class="text-xs text-slate-400 mt-1">Включая доставку, сборку и гарантию 3 года</p>
            </div>

            <!-- Кнопки действий -->
            <div class="space-y-3">
                <button onclick="generatePDF()" class="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    <span>Скачать PDF-проект и расчет</span>
                </button>
                <button onclick="sendToTelegram()" class="w-full bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/40 font-semibold py-3 px-4 rounded-xl transition text-sm">
                    Отправить менеджеру в Telegram
                </button>
            </div>

        </div>

        <script>
            let currentLayout = 'straight';

            function setLayout(type, btn) {
                currentLayout = type;
                document.querySelectorAll('.layout-btn').forEach(b => {
                    b.classList.remove('border-indigo-500', 'bg-indigo-600/30');
                    b.classList.add('border-slate-700', 'bg-slate-800/50', 'text-slate-300');
                });
                btn.classList.add('border-indigo-500', 'bg-indigo-600/30');
                btn.classList.remove('border-slate-700', 'bg-slate-800/50', 'text-slate-300');

                // Управление видимостью полей размеров в зависимости от формы
                const side2Cont = document.getElementById('side2Container');
                const side3Cont = document.getElementById('side3Container');
                const labelSide1 = document.getElementById('labelSide1');

                if (type === 'straight') {
                    side2Cont.classList.add('hidden');
                    side3Cont.classList.add('hidden');
                    labelSide1.innerText = "Длина кухни:";
                } else if (type === 'l-shape') {
                    side2Cont.classList.remove('hidden');
                    side3Cont.classList.add('hidden');
                    labelSide1.innerText = "Длина первой стены:";
                } else if (type === 'u-shape') {
                    side2Cont.classList.remove('hidden');
                    side3Cont.classList.remove('hidden');
                    labelSide1.innerText = "Длина левой стены:";
                    document.querySelector('#side3Container span').innerText = "Длина правой стены:";
                } else if (type === 'island') {
                    side2Cont.classList.remove('hidden');
                    side3Cont.classList.remove('hidden');
                    labelSide1.innerText = "Длина основной стены:";
                    document.querySelector('#side2Container span').innerText = "Вылет второй стены:";
                    document.querySelector('#side3Container span').innerText = "Длина острова:";
                }
                updateCalc();
            }

            function updateCalc() {
                const s1 = parseInt(document.getElementById('side1').value);
                const s2 = parseInt(document.getElementById('side2').value);
                const s3 = parseInt(document.getElementById('side3').value);
                const height = parseInt(document.getElementById('ceilingHeight').value);

                document.getElementById('valSide1').innerText = s1 + " см";
                document.getElementById('valSide2').innerText = s2 + " см";
                document.getElementById('valSide3').innerText = s3 + " см";
                document.getElementById('valHeight').innerText = height + " см";

                // Базовый расчет стоимости от погонных метров / площади
                let totalLength = s1;
                if (currentLayout === 'l-shape') totalLength += s2;
                if (currentLayout === 'u-shape') totalLength += s2 + s3;
                if (currentLayout === 'island') totalLength += s2 + s3;

                // Базовая цена за 1 см погонный с учетом высоты потолков
                let basePricePerCm = 850; 
                let price = totalLength * basePricePerCm * (height / 260);

                // Доплаты за фурнитуру
                const handleType = document.querySelector('input[name="handleType"]:checked').value;
                if (handleType === 'push') price *= 1.15;

                if (document.getElementById('extraDrawers').checked) price += 25000;
                if (document.getElementById('extraLight').checked) price += 15000;

                // Форматирование цены
                document.getElementById('totalPrice').innerText = Math.round(price).toLocaleString('ru-RU') + " ₽";
            }

            function getProjectData() {
                return {
                    layout: currentLayout,
                    s1: document.getElementById('side1').value,
                    s2: document.getElementById('side2').value,
                    s3: document.getElementById('side3').value,
                    height: document.getElementById('ceilingHeight').value,
                    handles: document.querySelector('input[name="handleType"]:checked').value,
                    drawers: document.getElementById('extraDrawers').checked ? 'Да' : 'Нет',
                    light: document.getElementById('extraLight').checked ? 'Да' : 'Нет',
                    price: document.getElementById('totalPrice').innerText
                };
            }

            function generatePDF() {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                const data = getProjectData();

                doc.setFont("helvetica", "bold");
                doc.setFontSize(20);
                doc.text("KITCHEN PROJECT SUMMARY", 20, 20);

                doc.setFontSize(12);
                doc.setFont("helvetica", "normal");
                doc.text("Generated via Telegram Web App Calculator", 20, 28);

                doc.line(20, 35, 190, 35);

                let y = 45;
                doc.text(`Layout Type: ${data.layout.toUpperCase()}`, 20, y);
                y += 10;
                doc.text(`Wall Side 1: ${data.s1} cm`, 20, y);
                y += 10;
                if(data.layout !== 'straight') {
                    doc.text(`Wall Side 2 (Wing): ${data.s2} cm`, 20, y);
                    y += 10;
                }
                if(data.layout === 'u-shape' || data.layout === 'island') {
                    doc.text(`Wall Side 3 / Island: ${data.s3} cm`, 20, y);
                    y += 10;
                }
                doc.text(`Ceiling Height: ${data.height} cm`, 20, y);
                y += 10;
                doc.text(`Opening System: ${data.handles}`, 20, y);
                y += 10;
                doc.text(`Extra Drawers: ${data.drawers}`, 20, y);
                y += 10;
                doc.text(`Built-in Lighting: ${data.light}`, 20, y);

                doc.line(20, y + 5, 190, y + 5);
                
                y += 15;
                doc.setFont("helvetica", "bold");
                doc.setFontSize(16);
                doc.text(`Estimated Price: ${data.price}`, 20, y);

                doc.save("kitchen-project.pdf");
            }

            function sendToTelegram() {
                const data = getProjectData();
                const text = `🪚 Новый расчет кухни!\\nФорма: ${data.layout}\\nРазмеры: ${data.s1}x${data.s2}x${data.s3} см (Высота: ${data.height} см)\\nФурнитура: ${data.handles}\\nИтого: ${data.price}`;
                
                if (window.Telegram && window.Telegram.WebApp) {
                    Telegram.WebApp.sendData(JSON.stringify(data));
                    Telegram.WebApp.close();
                } else {
                    alert("Спасибо! Данные подготовлены. Свяжитесь с нами в чате и отправьте скриншот расчета.");
                }
            }

            // Инициализация при загрузке
            updateCalc();
        </script>
    </body>
    </html>
    """
