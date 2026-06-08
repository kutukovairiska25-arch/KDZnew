from fastapi import FastAPI     # основной фреймворк для создания REST API
from fastapi.middleware.cors import CORSMiddleware  # для запросов с других адресов
from .routers import couriers, orders, auth
from .db.database import engine, Base
from .db.createDbUsers import create_users, reset_database    # создаёт тестовых пользователей

# Создаём таблицы в БД при старте
Base.metadata.create_all(bind=engine)

# Сброс базы данных (для разработки)
reset_database()

# Инициализация тестовых пользователей
create_users()

app = FastAPI(title="Candy Delivery API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # React dev server
        "http://127.0.0.1:5173",  # React dev server (альтернатива)
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Подключаем роутер авторизации, курьеров и заказов
app.include_router(auth.router)
app.include_router(couriers.router)
app.include_router(orders.router)
