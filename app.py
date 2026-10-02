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
        <title>Калькулятор мебели в Ташкенте</title>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <style>
            .bg-custom {
                background-size: cover;
                background-position: center;
                transition: background-image 0.5s ease-in-out;
            }
        </style>
    </head>
    <body id="bodyBg" class="bg-custom bg-slate-950 text-white min-h-screen p-3 pb-12 font-sans" style="background-image: linear-gradient(to bottom, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.95)), url('https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1200');">
        
        <div class="max-w-xl mx-auto bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/60 p-5 mt-2">
            
            <!-- Контакты мастера -->
            <div class="bg-indigo-950/80 border border-indigo-500/40 rounded-xl p-3 mb-4 flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <span class="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span class="text-xs text-slate-300 font-medium">Консультация и замер:</span>
                </div>
                <a href="tel:+998920934510" class="text-indigo-300 font-bold text-sm tracking-wide">+998 (92) 093-45-10 | Мастер (А)</a>
            </div>

            <!-- Заголовок -->
            <div class="text-center mb-5">
                <span class="bg-indigo-500/20 text-indigo-400 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">Мебель на заказ в Ташкенте</span>
                <h1 class="text-2xl font-black mt-2 bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">Калькулятор стоимости кухни</h1>
                <p class="text-slate-400 text-xs mt-1">Рассчитайте точную цену под ваше пространство за 1 минуту</p>
            </div>

            <!-- Шаг 1: Тип планировки -->
            <div class="mb-4">
                <label class="block text-sm font-medium text-indigo-300 mb-2">1. Форма кухни:</label>
                <div class="grid grid-cols-2 gap-2" id="layoutType">
                    <button type="button" onclick="setLayout('straight', this)" class="layout-btn p-2.5 rounded-xl border border-indigo-500 bg-indigo-600/40 text-center transition font-medium text-xs">Прямая</button>
                    <button type="button" onclick="setLayout('l-shape', this)" class="layout-btn p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 text-center transition font-medium text-xs text-slate-300">Г-образная</button>
                    <button type="button" onclick="setLayout('u-shape', this)" class="layout-btn p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 text-center transition font-medium text-xs text-slate-300">П-образная</button>
                    <button type="button" onclick="setLayout('island', this)" class="layout-btn p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 text-center transition font-medium text-xs text-slate-300">С островом</button>
                </div>
            </div>

            <!-- Шаг 2: Размеры пространства -->
            <div class="mb-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
                <label class="block text-sm font-medium text-indigo-300 mb-3">2. Размеры помещения (см):</label>
                
                <div class="space-y-3">
                    <div>
                        <div class="flex justify-between text-xs text-slate-400 mb-1">
                            <span id="labelSide1">Длина (Стена 1):</span>
                            <span id="valSide1" class="text-indigo-400 font-bold">300 см</span>
                        </div>
                        <input type="range" id="side1" min="150" max="600" step="10" value="300" oninput="updateCalc()" class="w-full accent-indigo-500 bg-slate-700 rounded-lg h-2">
                    </div>

                    <div id="side2Container">
                        <div class="flex justify-between text-xs text-slate-400 mb-1">
                            <span id="labelSide2">Ширина / Стена 2:</span>
                            <span id="valSide2" class="text-indigo-400 font-bold">180 см</span>
                        </div>
                        <input type="range" id="side2" min="100" max="400" step="10" value="180" oninput="updateCalc()" class="w-full accent-indigo-500 bg-slate-700 rounded-lg h-2">
                    </div>

                    <div id="side3Container" class="hidden">
                        <div class="flex justify-between text-xs text-slate-400 mb-1">
                            <span id="labelSide3">Высота / Стена 3:</span>
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

                    <!-- Дополнительные параметры острова -->
                    <div id="islandContainer" class="hidden pt-3 border-t border-slate-700/60 space-y-2">
                        <span class="text-xs text-indigo-300 font-semibold block">Размеры кухонного острова:</span>
                        <div class="grid grid-cols-3 gap-2 text-center">
                            <div class="bg-slate-900/60 p-2 rounded-lg border border-slate-700">
                                <span class="text-[10px] text-slate-400 block">Длина</span>
                                <input type="number" id="islandL" value="120" min="80" max="250" oninput="updateCalc()" class="w-full bg-slate-800 text-white text-center rounded text-xs p-1 mt-1">
                            </div>
                            <div class="bg-slate-900/60 p-2 rounded-lg border border-slate-700">
                                <span class="text-[10px] text-slate-400 block">Ширина</span>
                                <input type="number" id="islandW" value="80" min="65" max="120" oninput="updateCalc()" class="w-full bg-slate-800 text-white text-center rounded text-xs p-1 mt-1">
                            </div>
                            <div class="bg-slate-900/60 p-2 rounded-lg border border-slate-700">
                                <span class="text-[10px] text-slate-400 block">Высота</span>
                                <input type="number" id="islandH" value="85" min="80" max="95" oninput="updateCalc()" class="w-full bg-slate-800 text-white text-center rounded text-xs p-1 mt-1">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Шаг 3: Фурнитура и комплектация -->
            <div class="mb-5 bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-3">
                <label class="block text-sm font-medium text-indigo-300">3. Класс фурнитуры и комплектация:</label>

                <!-- Класс фурнитуры -->
                <div>
                    <span class="text-xs text-slate-400 block mb-1.5">Качество фурнитуры:</span>
                    <div class="grid grid-cols-3 gap-1.5">
                        <label class="flex flex-col items-center justify-center bg-slate-900/60 p-2 rounded-lg border border-slate-700 cursor-pointer text-xs text-center">
                            <input type="radio" name="hardwareClass" value="economy" onchange="updateCalc()" class="accent-indigo-500 mb-1">
                            <span class="font-medium text-slate-300">Эконом</span>
                        </label>
                        <label class="flex flex-col items-center justify-center bg-slate-900/60 p-2 rounded-lg border border-indigo-500 cursor-pointer text-xs text-center">
                            <input type="radio" name="hardwareClass" value="standard" checked onchange="updateCalc()" class="accent-indigo-500 mb-1">
                            <span class="font-medium text-indigo-300">Средний</span>
                        </label>
                        <label class="flex flex-col items-center justify-center bg-slate-900/60 p-2 rounded-lg border border-slate-700 cursor-pointer text-xs text-center">
                            <input type="radio" name="hardwareClass" value="premium" onchange="updateCalc()" class="accent-indigo-500 mb-1">
                            <span class="font-medium text-slate-300">Премиум</span>
                        </label>
                    </div>
                </div>

                <!-- Открывание -->
                <div>
                    <span class="text-xs text-slate-400 block mb-1.5">Система фасадов:</span>
                    <div class="grid grid-cols-2 gap-2">
                        <label class="flex items-center space-x-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-700 cursor-pointer text-xs">
                            <input type="radio" name="handleType" value="handles" checked onchange="updateCalc()" class="accent-indigo-500">
                            <span>С ручками</span>
                        </label>
                        <label class="flex items-center space-x-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-700 cursor-pointer text-xs">
                            <input type="radio" name="handleType" value="push" onchange="updateCalc()" class="accent-indigo-500">
                            <span>Без ручек (Push)</span>
                        </label>
                    </div>
                </div>

                <!-- Галочка выреза -->
                <div class="pt-2 border-t border-slate-700/60">
                    <label class="flex items-center justify-between text-xs cursor-pointer bg-slate-900/40 p-2.5 rounded-lg border border-slate-700">
                        <span class="text-slate-300 font-medium">Вырез под мойку / варочную панель</span>
                        <input type="checkbox" id="cutout" onchange="updateCalc()" class="w-4 h-4 accent-indigo-500 rounded">
                    </label>
                </div>
            </div>

            <!-- Итог -->
            <div class="bg-indigo-950/80 border border-indigo-500/40 rounded-xl p-4 mb-4 text-center shadow-lg">
                <span class="text-xs text-indigo-300 uppercase tracking-wider font-semibold">Итоговая стоимость проекта</span>
                <div id="totalPrice" class="text-2xl sm:text-3xl font-black text-white mt-1">0 UZS</div>
                <p class="text-[11px] text-slate-400 mt-1">С учетом замера, доставки и установки по Ташкенту</p>
            </div>

            <!-- Кнопки -->
            <div class="space-y-2.5">
                <button onclick="generatePDF()" class="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2 text-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    <span>Скачать PDF-проект и смету</span>
                </button>
                <button onclick="sendToTelegram()" class="w-full bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/40 font-semibold py-2.5 px-4 rounded-xl transition text-xs">
                    Отправить мастеру в Telegram
                </button>
            </div>

        </div>

        <script>
            let currentLayout = 'straight';

            const bgImages = {
                'straight': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1200',
                'l-shape': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200',
                'u-shape': 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=80&w=1200',
                'island': 'https://images.unsplash.com/photo-1565183997392-2f6f122e5912?q=80&w=1200'
            };

            function setLayout(type, btn) {
                currentLayout = type;
                document.querySelectorAll('.layout-btn').forEach(b => {
                    b.classList.remove('border-indigo-500', 'bg-indigo-600/40');
                    b.classList.add('border-slate-700', 'bg-slate-800/60', 'text-slate-300');
                });
                btn.classList.add('border-indigo-500', 'bg-indigo-600/40');
                btn.classList.remove('border-slate-700', 'bg-slate-800/60', 'text-slate-300');

                // Меняем фоновое фото
                document.getElementById('bodyBg').style.backgroundImage = `linear-gradient(to bottom, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.95)), url('${bgImages[type]}')`;

                const side2Cont = document.getElementById('side2Container');
                const side3Cont = document.getElementById('side3Container');
                const islandCont = document.getElementById('islandContainer');
                const labelSide1 = document.getElementById('labelSide1');
                const labelSide2 = document.getElementById('labelSide2');
                const labelSide3 = document.getElementById('labelSide3');

                if (type === 'straight') {
                    side2Cont.classList.add('hidden');
                    side3Cont.classList.add('hidden');
                    islandCont.classList.add('hidden');
                    labelSide1.innerText = "Длина кухни:";
                } else if (type === 'l-shape') {
                    side2Cont.classList.remove('hidden');
                    side3Cont.classList.add('hidden');
                    islandCont.classList.add('hidden');
                    labelSide1.innerText = "Стена 1 (Длина):";
                    labelSide2.innerText = "Стена 2 (Ширина):";
                } else if (type === 'u-shape') {
                    side2Cont.classList.remove('hidden');
                    side3Cont.classList.remove('hidden');
                    islandCont.classList.add('hidden');
                    labelSide1.innerText = "Стена 1 (Левая):";
                    labelSide2.innerText = "Стена 2 (Средняя):";
                    labelSide3.innerText = "Стена 3 (Правая):";
                } else if (type === 'island') {
                    side2Cont.classList.remove('hidden');
                    side3Cont.classList.add('hidden');
                    islandCont.classList.remove('hidden');
                    labelSide1.innerText = "Стена 1 (Основная):";
                    labelSide2.innerText = "Стена 2 (Дополнительная):";
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

                let totalLengthCm = s1;
                if (currentLayout === 'l-shape') totalLengthCm += s2;
                if (currentLayout === 'u-shape') totalLengthCm += s2 + s3;
                if (currentLayout === 'island') {
                    totalLengthCm += s2;
                    const islandL = parseInt(document.getElementById('islandL').value) || 0;
                    totalLengthCm += islandL; // остров тоже добавляется в погонаж
                }

                let totalMeters = totalLengthCm / 100;

                // Средняя цена за погонный метр по Ташкенту в суммах с учетом маржи мастера
                const hwClass = document.querySelector('input[name="hardwareClass"]:checked').value;
                let ratePerMeter = 4200000; // Средняя база
                if (hwClass === 'economy') ratePerMeter = 3600000;
                if (hwClass === 'premium') ratePerMeter = 5600000;

                let price = totalMeters * ratePerMeter * (height / 260);

                // Доплата за систему открывания
                const handleType = document.querySelector('input[name="handleType"]:checked').value;
                if (handleType === 'push') price *= 1.12;

                // Вырез под мойку / варочную
                if (document.getElementById('cutout').checked) {
                    price += 250000; // фиксированная стоимость выреза и обработки
                }

                document.getElementById('totalPrice').innerText = Math.round(price).toLocaleString('ru-RU') + " UZS";
            }

            function getProjectData() {
                return {
                    master: "+998 (92) 093-45-10 (Мастер А)",
                    layout: currentLayout,
                    s1: document.getElementById('side1').value,
                    s2: document.getElementById('side2').value,
                    s3: document.getElementById('side3').value,
                    height: document.getElementById('ceilingHeight').value,
                    hardware: document.querySelector('input[name="hardwareClass"]:checked').value,
                    handles: document.querySelector('input[name="handleType"]:checked').value,
                    cutout: document.getElementById('cutout').checked ? 'Да' : 'Нет',
                    price: document.getElementById('totalPrice').innerText
                };
            }

            function generatePDF() {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                const data = getProjectData();

                doc.setFont("helvetica", "bold");
                doc.setFontSize(18);
                doc.text("KITCHEN PROJECT - TASHKENT", 20, 20);

                doc.setFontSize(11);
                doc.setFont("helvetica", "normal");
                doc.text(`Master Contact: ${data.master}`, 20, 28);

                doc.line(20, 34, 190, 34);

                let y = 44;
                doc.text(`Layout Type: ${data.layout.toUpperCase()}`, 20, y);
                y += 9;
                doc.text(`Wall Side 1: ${data.s1} cm`, 20, y);
                y += 9;
                if(data.layout !== 'straight') {
                    doc.text(`Wall Side 2: ${data.s2} cm`, 20, y);
                    y += 9;
                }
                if(data.layout === 'u-shape') {
                    doc.text(`Wall Side 3: ${data.s3} cm`, 20, y);
                    y += 9;
                }
                doc.text(`Ceiling Height: ${data.height} cm`, 20, y);
                y += 9;
                doc.text(`Hardware Class: ${data.hardware}`, 20, y);
                y += 9;
                doc.text(`Facades / Handles: ${data.handles}`, 20, y);
                y += 9;
                doc.text(`Sink/Hob Cutout: ${data.cutout}`, 20, y);

                doc.line(20, y + 4, 190, y + 4);
                
                y += 14;
                doc.setFont("helvetica", "bold");
                doc.setFontSize(15);
                doc.text(`Total Estimated Price: ${data.price}`, 20, y);

                doc.save("kitchen-project-tashkent.pdf");
            }

            function sendToTelegram() {
                const data = getProjectData();
                const text = `🪚 Заявка на кухню (Ташкент)\\nФорма: ${data.layout}\\nСтены: ${data.s1}x${data.s2}x${data.s3} см\\nФурнитура: ${data.hardware} (${data.handles})\\nСмета: ${data.price}`;
                
                if (window.Telegram && window.Telegram.WebApp) {
                    Telegram.WebApp.sendData(JSON.stringify(data));
                    Telegram.WebApp.close();
                } else {
                    alert("Проект успешно сформирован! Свяжитесь с нами по номеру +998 (92) 093-45-10 для подтверждения.");
                }
            }

            updateCalc();
        </script>
    </body>
    </html>
