from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from sqlalchemy import text
from .database import engine, Base, SessionLocal
from .routers import couriers, orders, auth
from . import crud
from .createDbUsers import create_users

# Создаём таблицы в БД при старте
Base.metadata.create_all(bind=engine)

# Добавляем колонку courier_id, если её нет
# Это нужно, потому что create_all не обновляет уже существующие таблицы
with engine.connect() as conn:
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS courier_id INTEGER"))
    conn.commit()


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

STATIC_DIR = Path(__file__).resolve().parents[2] / "frontend" / "static"


@app.get("/")
async def main():
    index_path = STATIC_DIR / "index.html"
    return FileResponse(index_path)


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

app.include_router(auth.router)
app.include_router(couriers.router)
app.include_router(orders.router)