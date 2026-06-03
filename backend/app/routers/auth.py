from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import jwt
from ..database import get_db
from .. import crud, schemas
from ..config import settings

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/login", response_model=schemas.TokenResponse)
def login(req: schemas.UserLogin, db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, req.username)

    # Проверка без хэша, как указано в задаче
    if not user or user.password != req.password:
        raise HTTPException(status_code=401, detail="Неверное имя пользователя или пароль")

    # Генерация JWT токена
    expire = datetime.utcnow() + timedelta(minutes=60)
    to_encode = {"sub": user.username, "role": user.role, "exp": expire}
    token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role
    }