from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, ARRAY
from .database import Base

class Courier(Base):
    __tablename__ = "couriers"
    courier_id = Column(Integer, primary_key=True, index=True)
    courier_type = Column(String, nullable=False)
    regions = Column(ARRAY(Integer), nullable=False)
    working_hours = Column(ARRAY(String), nullable=False)
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
    assign_time = Column(DateTime, nullable=True)
    completion_time = Column(DateTime, nullable=True)
    courier_type_at_assign = Column(String, nullable=True)