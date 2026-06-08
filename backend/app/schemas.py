from pydantic import BaseModel, Field
from typing import List, Optional
# Optional: Указывает, что поле может быть пустым


# Схемы для авторизации

# схема для входа в систему
class UserLogin(BaseModel):
    username: str
    password: str
# ответ после успешного логина
class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    courier_id: Optional[int] = None


# Схемы для Курьеров

# схема импорта курьера
class CourierItem(BaseModel):
    courier_id: int = Field(..., gt=0)
    courier_type: str = Field(..., pattern="^(foot|bike|car)$")
    regions: List[int] = Field(..., min_length=1)
    working_hours: List[str] = Field(..., min_length=1)

# схема редактирования курьера
class CourierUpdateRequest(BaseModel):
    courier_type: Optional[str] = None
    regions: Optional[List[int]] = None
    working_hours: Optional[List[str]] = None

#
class CourierGetResponse(BaseModel):
    courier_id: int
    courier_type: str
    regions: List[int]
    working_hours: List[str]
    earnings: int
    rating: Optional[float] = None


# Схемы для Заказов

# схема импорта заказа
class OrderItem(BaseModel):
    order_id: int = Field(..., gt=0)
    weight: float = Field(..., gt=0.0, le=50.0)
    region: int = Field(..., gt=0)
    delivery_hours: List[str] = Field(..., min_length=1)

# схема назначения заказов
class OrdersAssignPostRequest(BaseModel):
    courier_id: int = Field(..., gt=0)

# схема завершения заказа
class OrdersCompletePostRequest(BaseModel):
    courier_id: int = Field(..., gt=0)
    order_id: int = Field(..., gt=0)
    complete_time: str