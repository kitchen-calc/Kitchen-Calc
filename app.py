import os
import threading
import telebot
from telebot import types
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse

# Инициализация приложения и бота
app = FastAPI()

# Вставьте сюда токен вашего нового бота
BOT_TOKEN = "8924842939:AAGjTKqOscxHyNH4OYbHkZDtj1MyGqSqPwA"
bot = telebot.TeleBot(BOT_TOKEN)

# Динамически берем ссылку из окружения Render или ставим дефолтную
WEB_APP_URL = os.environ.get("WEB_APP_URL", "https://kitchen-calc.onrender.com")

@bot.message_handler(commands=['start'])
def send_welcome(message):
    markup = types.InlineKeyboardMarkup()
    web_app = types.WebAppInfo(url=WEB_APP_URL)
    markup.add(types.InlineKeyboardButton("📐 Рассчитать стоимость мебели", web_app=web_app))
    
    welcome_text = (
        "<b>Добро пожаловать в мебельную мастерскую!</b> 🪚✨\n\n"
        "Мы изготавливаем кухни, шкафы и гардеробные под ваши индивидуальные размеры.\n\n"
        "Нажмите на кнопку ниже, чтобы открыть интерактивный калькулятор:"
    )
    bot.send_message(message.chat.id, welcome_text, parse_mode="HTML", reply_markup=markup)

@app.get("/", response_class=HTMLResponse)
async def read_root():
    return """
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Калькулятор мебели</title>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100 p-4">
        <div class="max-w-md mx-auto bg-white rounded-xl shadow-md p-6 mt-10">
            <h1 class="text-xl font-bold text-gray-800 mb-4">Калькулятор стоимости</h1>
            <p class="text-gray-600 mb-4">Выберите параметры вашей мебели:</p>
            <!-- Здесь интерфейс калькулятора -->
        </div>
    </body>
    </html>
    """

def run_telegram_bot():
    print("🤖 Telegram-бот успешно запущен и слушает команды...")
    bot.infinity_polling()

if __name__ == "__main__":
    import uvicorn
    
    # 1. Запускаем телеграм-бота в фоновом потоке
    bot_thread = threading.Thread(target=run_telegram_bot, daemon=True)
    bot_thread.start()
    
    # 2. Получаем порт от Render (или 5000 для локальных тестов)
    port = int(os.environ.get("PORT", 10000))
    
    # 3. Запускаем FastAPI сервер
    print(f"🚀 FastAPI сервер запущен на порту {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
