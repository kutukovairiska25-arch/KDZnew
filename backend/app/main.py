from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from sqlalchemy import text  # <-- Добавлен импорт text
from .database import engine, Base, SessionLocal
from .routers import couriers, orders, auth
from . import crud

# Создаём таблицы в БД при старте
Base.metadata.create_all(bind=engine)

# АВТОМАТИЧЕСКАЯ МИГРАЦИЯ: Добавляем колонку courier_id, если её нет
# Это нужно, потому что create_all не обновляет уже существующие таблицы
with engine.connect() as conn:
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS courier_id INTEGER"))
    conn.commit()


# Инициализация тестовых пользователей
def init_db():
    db = SessionLocal()
    try:
        if not crud.get_user_by_username(db, "admin"):
            crud.create_user(db, username="admin", password="123", role="admin")

        from . import models
        # Создаем тестового курьера, если его нет
        if not db.query(models.Courier).filter(models.Courier.courier_id == 1).first():
            db.add(models.Courier(courier_id=1, courier_type="bike", regions=[1, 2], working_hours=["09:00-18:00"]))
            db.commit()

        # Привязываем пользователя courier1 к курьеру с ID 1
        user_courier = crud.get_user_by_username(db, "courier1")
        if not user_courier:
            crud.create_user(db, username="courier1", password="123", role="courier", courier_id=1)
        else:
            # ИСПРАВЛЕНИЕ: Если пользователь уже существует, но courier_id не проставлен (NULL), обновляем его
            if user_courier.courier_id is None:
                user_courier.courier_id = 1
                db.commit()
    finally:
        db.close()


init_db()

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