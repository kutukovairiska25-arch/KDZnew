"""
Содержит функции для взаимодействия с базой данных (Create, Read, Update, Delete).
Изолирует логику работы с SQLAlchemy от маршрутов (роутеров), делая код чище и тестируемее.
"""

from sqlalchemy.orm import Session
from . import models, schemas
from typing import List

def get_user_by_username(db: Session, username: str):
    # Метод .first() возвращает первый найденный объект или None, если такого пользователя нет.
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, username: str, password: str, role: str, courier_id: int = None) -> models.User:
    # Создаем объект
    db_user = models.User(username=username, password=password, role=role, courier_id=courier_id)
    db.add(db_user) # добавляем его в текущую сессию
    db.commit() # отправляем команду INSERT в реальную базу данных PostgresSQL.
    db.refresh(db_user) # обновляем объект в памяти данными из БД
    return db_user

# Получение списков
def get_all_couriers(db: Session) -> List[models.Courier]:
    # запросы .all() возвращают список всех объектов из соответствующих таблиц.
    return db.query(models.Courier).all()

def get_all_orders(db: Session) -> List[models.Order]:
    return db.query(models.Order).all()

# Массовое создание
# Получаем список валидированных объектов Pydantic (data).
def create_couriers(db: Session, data: list[schemas.CourierItem]) -> list[int]:
    ids = []
    for c in data:
        # c.model_dump() превращает объект схемы в обычный словарь
        # (например, {"courier_id": 1, "courier_type": "bike", ...}).
        db.add(models.Courier(**c.model_dump()))
        ids.append(c.courier_id)
    # Мы собираем все ID в список и делаем один db.commit() в конце цикла.
    # Это гораздо быстрее и безопаснее, чем делать commit на каждой итерации.
    db.commit()
    return ids

# Обновление данных
def update_courier(db: Session, courier_id: int, update_data: schemas.CourierUpdateRequest) -> models.Courier | None:
    courier = db.query(models.Courier).filter(models.Courier.courier_id == courier_id).first()
    if not courier:
        return None
    # exclude_unset=True значит, что Если админ отправляет только {"courier_type": "car"},
    # то в словаре будет только это поле.

    # Без него Pydantic добавил бы regions: None и working_hours: None,
    # и мы бы случайно стерли эти данные в бд
    for k, v in update_data.model_dump(exclude_unset=True).items():
        # встроенная функция Python, которая позволяет динамически установить атрибут объекта.
        # Она делает то же самое, что и courier.courier_type = "car", но работает для любого поля,
        # которое пришло в запросе. Это избавляет от огромных if-конструкций.
        setattr(courier, k, v)
    db.commit()
    db.refresh(courier)
    return courier

def create_orders(db: Session, data: list[schemas.OrderItem]) -> list[int]:
    ids = []
    for o in data:
        db.add(models.Order(**o.model_dump()))
        ids.append(o.order_id)
    db.commit()
    return ids

def get_courier_orders(db: Session, courier_id: int) -> list[models.Order]:
    # Возвращаем заказы, которые назначены курьеру ИЛИ которые он отменил
    return db.query(models.Order).filter(
        (models.Order.assigned_courier_id == courier_id) |
        (models.Order.cancelled_by_courier_id == courier_id)
    ).all()