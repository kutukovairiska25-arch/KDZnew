from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from .database import engine, Base
from .routers import couriers, orders, auth
from .createDbUsers import create_users

# Создаём таблицы в БД при старте
Base.metadata.create_all(bind=engine)

# АВТОМАТИЧЕСКАЯ МИГРАЦИЯ: Добавляем колонку courier_id, если её нет
with engine.connect() as conn:
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS courier_id INTEGER"))
    conn.commit()

# Инициализация тестовых пользователей
create_users()

app = FastAPI(title="Candy Delivery API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # React dev server
        "http://127.0.0.1:5173",  # React dev server (альтернатива)
        "http://localhost:3000",  # если будешь использовать другой порт
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(auth.router)
app.include_router(couriers.router)
app.include_router(orders.router)