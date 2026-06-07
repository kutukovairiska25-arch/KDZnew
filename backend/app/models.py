"""
Описывает ORM-модели SQLAlchemy, которые маппятся на таблицы PostgresSQL.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, ARRAY
# ForeignKey: Механизм связывания таблиц. Гарантирует целостность данных
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    courier_id = Column(Integer, nullable=True) # Связь с профилем курьера

class Courier(Base):
    __tablename__ = "couriers"
    courier_id = Column(Integer, primary_key=True, index=True)
    courier_type = Column(String, nullable=False)   # Тип: "foot", "bike" или "car".
    regions = Column(ARRAY(Integer), nullable=False)    # Массив целых чисел. Пример: [1, 2, 5].
    working_hours = Column(ARRAY(String), nullable=False)   # Массив строк. Пример: ["09:00-13:00", "14:00-18:00"].
    rating = Column(Float, nullable=True)
    earnings = Column(Integer, default=0)

class Order(Base):
    __tablename__ = "orders"
    order_id = Column(Integer, primary_key=True, index=True)
    weight = Column(Float, nullable=False)
    region = Column(Integer, nullable=False)
    delivery_hours = Column(ARRAY(String), nullable=False)
    status = Column(String, default="new")
    assigned_courier_id = Column(Integer, ForeignKey("couriers.courier_id"), nullable=True)
    assign_time = Column(DateTime, nullable=True)   # Время, когда заказ был назначен.
    completion_time = Column(DateTime, nullable=True)
    # ID курьера, который отменил заказ (для статистики)
    cancelled_by_courier_id = Column(Integer, nullable=True)
    courier_type_at_assign = Column(String, nullable=True)
    # Например, курьер получил заказ как "car" (коэффициент 9).
    # Пока он вез заказ, админ изменил его тип на "foot".
    # Если считать заработок по текущему типу, курьер получит меньше.
    # Это поле "замораживает" тип курьера на момент назначения, гарантируя честный расчет заработка