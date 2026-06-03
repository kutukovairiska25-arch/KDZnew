from sqlalchemy.orm import Session
from .database import SessionLocal
from . import crud, models


def create_users():
    db: Session = SessionLocal()
    try:
        if not crud.get_user_by_username(db, "admin"):
            crud.create_user(db, username="admin", password="123", role="admin")

        if not db.query(models.Courier).filter(models.Courier.courier_id == 1).first():
            db.add(models.Courier(courier_id=1, courier_type="bike", regions=[1, 2], working_hours=["09:00-18:00"]))
            db.commit()

        user_courier = crud.get_user_by_username(db, "courier1")
        if not user_courier:
            crud.create_user(db, username="courier1", password="123", role="courier", courier_id=1)
        elif user_courier.courier_id is None:
            user_courier.courier_id = 1
            db.commit()
    finally:
        db.close()