from sqlalchemy.orm import Session
from . import models, schemas

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, username: str, password: str, role: str) -> models.User:
    db_user = models.User(username=username, password=password, role=role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_couriers(db: Session, data: list[schemas.CourierItem]) -> list[int]:
    ids = []
    for c in data:
        db.add(models.Courier(**c.model_dump()))
        ids.append(c.courier_id)
    db.commit()
    return ids

def update_courier(db: Session, courier_id: int, update_data: schemas.CourierUpdateRequest) -> models.Courier | None:
    courier = db.query(models.Courier).filter(models.Courier.courier_id == courier_id).first()
    if not courier:
        return None
    for k, v in update_data.model_dump(exclude_unset=True).items():
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
    return db.query(models.Order).filter(models.Order.assigned_courier_id == courier_id).all()