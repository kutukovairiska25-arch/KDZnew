from pydantic import BaseModel, Field, field_validator
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

    @field_validator('working_hours')
    @classmethod
    def validate_working_hours(cls, v: List[str]) -> List[str]:
        """Проверяет, что время работы в диапазоне 07:00-22:00"""
        for hours in v:
            try:
                start_str, end_str = hours.split('-')
                start_hour = int(start_str.split(':')[0])
                start_minute = int(start_str.split(':')[1])
                end_hour = int(end_str.split(':')[0])
                end_minute = int(end_str.split(':')[1])

                # Проверка формата времени
                if not (0 <= start_hour <= 23 and 0 <= start_minute <= 59):
                    raise ValueError(
                        f"Неверное время начала: {start_str}. Ожидается формат HH:MM (часы 00-23, минуты 00-59)")
                if not (0 <= end_hour <= 23 and 0 <= end_minute <= 59):
                    raise ValueError(
                        f"Неверное время окончания: {end_str}. Ожидается формат HH:MM (часы 00-23, минуты 00-59)")

                # Проверка диапазона 07:00-22:00
                if start_hour < 7:
                    raise ValueError(
                        f"Время начала работы {hours} раньше 07:00. Курьеры могут работать только с 07:00 до 22:00")
                if end_hour > 22:
                    raise ValueError(
                        f"Время окончания работы {hours} позже 22:00. Курьеры могут работать только с 07:00 до 22:00")
                if end_hour == 22 and end_minute > 0:
                    raise ValueError(
                        f"Время окончания работы {hours} позже 22:00. Курьеры могут работать только с 07:00 до 22:00")

                # Проверка, что время начала раньше времени окончания
                start_total = start_hour * 60 + start_minute
                end_total = end_hour * 60 + end_minute
                if start_total >= end_total:
                    raise ValueError(f"Время начала ({start_str}) должно быть раньше времени окончания ({end_str})")

            except ValueError as e:
                if "время" in str(e).lower() or "неверное" in str(e).lower():
                    raise ValueError(str(e))
                raise ValueError(
                    f"Неверный формат времени: {hours}. Ожидается формат HH:MM-HH:MM (например, 09:00-18:00)")

        return v


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
    weight: float = Field(..., ge=0.01, le=50.0)
    region: int = Field(..., gt=0)
    delivery_hours: List[str] = Field(..., min_length=1)

    @field_validator('delivery_hours')
    @classmethod
    def validate_delivery_hours(cls, v: List[str]) -> List[str]:
        """
        Проверяет, что время доставки пересекается с рабочим временем курьеров (07:00-22:00).
        Интервал заказа должен иметь хотя бы одно пересечение с [07:00, 22:00].
        """
        WORK_START = 7 * 60  # 07:00 в минутах (420)
        WORK_END = 22 * 60  # 22:00 в минутах (1320)

        for hours in v:
            try:
                start_str, end_str = hours.split('-')
                start_hour = int(start_str.split(':')[0])
                start_minute = int(start_str.split(':')[1])
                end_hour = int(end_str.split(':')[0])
                end_minute = int(end_str.split(':')[1])

                # Проверка формата времени
                if not (0 <= start_hour <= 23 and 0 <= start_minute <= 59):
                    raise ValueError(
                        f"Неверное время начала: {start_str}. Ожидается формат HH:MM (часы 00-23, минуты 00-59)")
                if not (0 <= end_hour <= 23 and 0 <= end_minute <= 59):
                    raise ValueError(
                        f"Неверное время окончания: {end_str}. Ожидается формат HH:MM (часы 00-23, минуты 00-59)")

                # Переводим в минуты для удобства сравнения
                start_total = start_hour * 60 + start_minute
                end_total = end_hour * 60 + end_minute

                # Проверка, что время начала раньше времени окончания
                if start_total >= end_total:
                    raise ValueError(f"Время начала ({start_str}) должно быть раньше времени окончания ({end_str})")

                # Проверка пересечения с рабочим временем [07:00, 22:00]
                # Пересечение есть, если: start < 22:00 AND end > 07:00
                if start_total >= WORK_END or end_total <= WORK_START:
                    raise ValueError(
                        f"Время доставки {hours} не пересекается с рабочим временем курьеров (07:00-22:00). "
                        f"Курьеры не смогут доставить заказ в этот интервал."
                    )

            except ValueError as e:
                if "время" in str(e).lower() or "неверное" in str(e).lower() or "пересекается" in str(e).lower():
                    raise ValueError(str(e))
                raise ValueError(
                    f"Неверный формат времени: {hours}. Ожидается формат HH:MM-HH:MM (например, 10:00-12:00)")

        return v


# схема назначения заказов
class OrdersAssignPostRequest(BaseModel):
    courier_id: int = Field(..., gt=0)

# схема завершения заказа
class OrdersCompletePostRequest(BaseModel):
    courier_id: int = Field(..., gt=0)
    order_id: int = Field(..., gt=0)
    complete_time: str