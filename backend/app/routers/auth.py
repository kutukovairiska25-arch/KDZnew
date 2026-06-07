from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import jwt
from ..db.database import get_db
from .. import schemas
from ..db import crud
from ..config import settings

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/login", response_model=schemas.TokenResponse)
def login(req: schemas.UserLogin, db: Session = Depends(get_db)):
    # FastAPI принимает запрос и проверяет данные через схему валидации schemas.UserLogin.
    # ищем пользователя в таблице users.
    user = crud.get_user_by_username(db, req.username)

    if not user or user.password != req.password:
        raise HTTPException(status_code=401, detail="Неверное имя пользователя или пароль")

    # Генерация JWT
    # Создается словарь данных (Payload), который мы хотим зашифровать в токене
    expire = datetime.utcnow() + timedelta(minutes=60)
    to_encode = {"sub": user.username, "role": user.role, "exp": expire}
    token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "courier_id": user.courier_id  # Возвращаем ID курьера
    }