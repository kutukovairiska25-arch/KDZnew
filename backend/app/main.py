from fastapi import FastAPI     # основной фреймворк для создания REST API
from fastapi.middleware.cors import CORSMiddleware  # для запросов с других адресов
from fastapi.staticfiles import StaticFiles   # позволяет FastAPI раздавать статические файлы
from fastapi.responses import FileResponse  # возвращает клиенту файл (например, index.html)
from pathlib import Path

from .database import engine, Base
from .routers import couriers, orders, auth
from .createDbUsers import create_users   # создаёт тестовых пользователей


# Создаём таблицы в БД при старте
Base.metadata.create_all(bind=engine)

# Инициализация тестовых пользователей
create_users()

app = FastAPI(title="Candy Delivery API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# __file__ — это путь к текущему файлу (main.py).
# .resolve() — превращает относительный путь в абсолютный.
# .parents[2] — поднимаемся на 2 уровня вверх:
# Затем спускаемся в frontend/static.
staticDir = Path(__file__).resolve().parents[2] / "frontend" / "static"

# Эндпоинт GET / — корень сайта.
# Когда пользователь открывает http://127.0.0.1:8000/, он получает файл index.html.
# FileResponse — это специальный ответ FastAPI, который просто отдаёт файл.
@app.get("/")
async def main():
    index_path = staticDir / "index.html"
    return FileResponse(index_path)

# Монтируем папку static по адресу /static.
# Если браузер запросит http://127.0.0.1:8000/static/newlogin.css,
# FastAPI найдёт файл frontend/static/newlogin.css и отдаст его.
# name="static" — внутреннее имя для этого "маршрута".
app.mount("/static", StaticFiles(directory=staticDir), name="static")

# Подключаем роутер авторизации, курьеров и заказов
app.include_router(auth.router)
app.include_router(couriers.router)
app.include_router(orders.router)