from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from .database import engine, Base
from .routers import couriers, orders

# Создаём таблицы в БД при старте
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Candy Delivery API", version="1.0")

# CORS для фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Путь к статике (универсальный)
STATIC_DIR = Path(__file__).resolve().parents[2] / "frontend" / "static"

@app.get("/")
async def main():
    index_path = STATIC_DIR / "index.html"
    return FileResponse(index_path)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Подключаем роутеры (это регистрирует /couriers, /orders и т.д.)
app.include_router(couriers.router)
app.include_router(orders.router)