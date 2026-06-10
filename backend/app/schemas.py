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
    def validate_working_hours(cls, v: List[str] | None) -> List[str] | None:
        """Проверяет, что время работы строго в диапазоне 07:00-22:00"""
        if v is None:
            return v

        WORK_START = 7 * 60  # 07:00 = 420 минут
        WORK_END = 22 * 60  # 22:00 = 1320 минут

        for hours in v:
            try:
                start_str, end_str = hours.split('-')
                start_hour = int(start_str.split(':')[0])
                start_minute = int(start_str.split(':')[1])
                end_hour = int(end_str.split(':')[0])
                end_minute = int(end_str.split(':')[1])

                if not (0 <= start_hour <= 23 and 0 <= start_minute <= 59):
                    raise ValueError(f"Неверное время начала: {start_str}")
                if not (0 <= end_hour <= 23 and 0 <= end_minute <= 59):
                    raise ValueError(f"Неверное время окончания: {end_str}")

                start_total = start_hour * 60 + start_minute
                end_total = end_hour * 60 + end_minute

                # Строгая проверка диапазона
                if start_total < WORK_START:
                    raise ValueError(
                        f"Время начала {hours} раньше 07:00. Рабочее время должно быть строго в диапазоне с 07:00 до 22:00.")
                if end_total > WORK_END:
                    raise ValueError(
                        f"Время окончания {hours} позже 22:00. Рабочее время должно быть строго в диапазоне с 07:00 до 22:00.")

                if start_total >= end_total:
                    raise ValueError(f"Время начала ({start_str}) должно быть раньше времени окончания ({end_str})")

            except ValueError as e:
                if "время" in str(e).lower() or "раньше" in str(e).lower() or "позже" in str(e).lower():
                    raise ValueError(str(e))
                raise ValueError(f"Неверный формат времени: {hours}. Ожидается HH:MM-HH:MM")

        return v


# схема редактирования курьера
class CourierUpdateRequest(BaseModel):
    courier_type: Optional[str] = None
    regions: Optional[List[int]] = None
    working_hours: Optional[List[str]] = None

    @field_validator('working_hours')
    @classmethod
    def validate_working_hours(cls, v: List[str] | None) -> List[str] | None:
        """Проверяет, что время работы строго в диапазоне 07:00-22:00"""
        if v is None:
            return v

        WORK_START = 7 * 60  # 07:00 = 420 минут
        WORK_END = 22 * 60  # 22:00 = 1320 минут

        for hours in v:
            try:
                start_str, end_str = hours.split('-')
                start_hour = int(start_str.split(':')[0])
                start_minute = int(start_str.split(':')[1])
                end_hour = int(end_str.split(':')[0])
                end_minute = int(end_str.split(':')[1])

                if not (0 <= start_hour <= 23 and 0 <= start_minute <= 59):
                    raise ValueError(f"Неверное время начала: {start_str}")
                if not (0 <= end_hour <= 23 and 0 <= end_minute <= 59):
                    raise ValueError(f"Неверное время окончания: {end_str}")

                start_total = start_hour * 60 + start_minute
                end_total = end_hour * 60 + end_minute

                # Строгая проверка диапазона
                if start_total < WORK_START:
                    raise ValueError(
                        f"Время начала {hours} раньше 07:00. Рабочее время должно быть строго в диапазоне с 07:00 до 22:00.")
                if end_total > WORK_END:
                    raise ValueError(
                        f"Время окончания {hours} позже 22:00. Рабочее время должно быть строго в диапазоне с 07:00 до 22:00.")

                if start_total >= end_total:
                    raise ValueError(f"Время начала ({start_str}) должно быть раньше времени окончания ({end_str})")

            except ValueError as e:
                if "время" in str(e).lower() or "раньше" in str(e).lower() or "позже" in str(e).lower():
                    raise ValueError(str(e))
                raise ValueError(f"Неверный формат времени: {hours}. Ожидается HH:MM-HH:MM")

        return v

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
        Поддерживает ночные интервалы (переход через полночь), например "20:00-02:00".
        """
        WORK_START = 7 * 60  # 07:00 = 420 минут
        WORK_END = 22 * 60  # 22:00 = 1320 минут

        for hours in v:
            try:
                start_str, end_str = hours.split('-')
                start_hour = int(start_str.split(':')[0])
                start_minute = int(start_str.split(':')[1])
                end_hour = int(end_str.split(':')[0])
                end_minute = int(end_str.split(':')[1])

                # Проверка формата времени
                if not (0 <= start_hour <= 23 and 0 <= start_minute <= 59):
                    raise ValueError(f"Неверное время начала: {start_str}. Ожидается формат HH:MM")
                if not (0 <= end_hour <= 23 and 0 <= end_minute <= 59):
                    raise ValueError(f"Неверное время окончания: {end_str}. Ожидается формат HH:MM")

                start_total = start_hour * 60 + start_minute
                end_total = end_hour * 60 + end_minute

                # Проверяем пересечение с рабочим временем [07:00, 22:00]
                # Обычный интервал (start < end): нет пересечения, если end <= 07:00 или start >= 22:00
                # Ночной интервал (start >= end, переход через полночь): нет пересечения,
                # только если start >= 22:00 И end <= 07:00 (полностью в "ночной зоне")
                if start_total < end_total:
                    # Обычный интервал
                    no_overlap = (end_total <= WORK_START or start_total >= WORK_END)
                else:
                    # Ночной интервал (переход через полночь)
                    no_overlap = (start_total >= WORK_END and end_total <= WORK_START)

                if no_overlap:
                    raise ValueError(
                        f"Время доставки {hours} не пересекается с рабочим временем курьеров (07:00-22:00). "
                        f"Курьеры не смогут доставить заказ в этот интервал."
                    )

            except ValueError as e:
                if "время" in str(e).lower() or "неверное" in str(e).lower() or "пересекается" in str(e).lower():
                    raise ValueError(str(e))
                raise ValueError(f"Неверный формат времени: {hours}. Ожидается формат HH:MM-HH:MM")

        return v


# схема назначения заказов
class OrdersAssignPostRequest(BaseModel):
    courier_id: int = Field(..., gt=0)

# схема завершения заказа
class OrdersCompletePostRequest(BaseModel):
    courier_id: int = Field(..., gt=0)
    order_id: int = Field(..., gt=0)
    complete_time: str