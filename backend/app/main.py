from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from fastapi.responses import FileResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import jwt
from datetime import datetime, timedelta
from typing import Optional

from .config import settings
from .database import get_db, Base
from . import crud
from . import models

app = FastAPI(title="Login System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Раздача статических файлов (CSS, JS, картинки)
STATIC_DIR = Path(__file__).resolve().parents[2] / "frontend" / "static"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# --- Модели запросов/ответов ---
class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    user_type: str = "customer"
    role: Optional[str] = "courier"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# --- Эндпоинты ---
@app.get("/")
def main():
    return FileResponse("static/index.html")

@app.post("/api/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    # 1. Ищем пользователя через ORM
    user = crud.get_user_by_login(db, data.username)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 2. Проверяем пароль
    if not crud.verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 3. Генерируем JWT токен
    token = jwt.encode(
        {
            "sub": user.login,
            "user_id": user.id,
            "role": user.role,
            "exp": datetime.utcnow() + timedelta(hours=1)
        },
        settings.SECRET_KEY,
        algorithm="HS256"
    )

    return TokenResponse(access_token=token)

@app.post("/api/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    # Заглушка. Регистрация через API добавим позже.
    # Сейчас пользователей создавай через SQL-скрипты, как договаривались.
    return {"message": "Регистрация через API пока не реализована."}

'''
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn

app = FastAPI()

# 1. Говорим FastAPI, где лежат файлы
# А FastAPI говорит серверу: "Если просят картинки или стили — отдай их из папки static".
app.mount("/static", StaticFiles(directory="static"), name="static")

# 2. Главная страница
@app.get("/")
async def main():
    # Отдаем файл index.html
    return FileResponse("static/index.html")

if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
'''