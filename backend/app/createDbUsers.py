from sqlalchemy.orm import Session
from .database import SessionLocal, Base, engine
from . import crud, models


def create_users():
    db: Session = SessionLocal()
    try:
        # Создаем администратора, если его нет
        if not crud.get_user_by_username(db, "admin"):
            crud.create_user(db, username="admin", password="123", role="admin")

        # Создаем 3 курьеров с разным типом транспорта
        couriers_data = [
            {"courier_id": 1, "courier_type": "foot", "regions": [1, 2], "working_hours": ["09:00-18:00"]},
            {"courier_id": 2, "courier_type": "bike", "regions": [1, 2, 3], "working_hours": ["10:00-20:00"]},
            {"courier_id": 3, "courier_type": "car", "regions": [1, 2, 3, 4, 5], "working_hours": ["08:00-22:00"]},
        ]

        for c in couriers_data:
            # Создаем профиль курьера, если его нет
            if not db.query(models.Courier).filter(models.Courier.courier_id == c["courier_id"]).first():
                db.add(models.Courier(**c))
                db.commit()

            # Создаем учетную запись для входа, если её нет
            username = f"courier{c['courier_id']}"
            user = crud.get_user_by_username(db, username)
            if not user:
                crud.create_user(db, username=username, password="123", role="courier", courier_id=c["courier_id"])
            elif user.courier_id is None:
                user.courier_id = c["courier_id"]
                db.commit()

        # Создаем 10 тестовых заказов с разными параметрами
        orders_data = [
            {"order_id": 1, "weight": 2.5, "region": 1, "delivery_hours": ["10:00-12:00"]},
            {"order_id": 2, "weight": 5.0, "region": 2, "delivery_hours": ["14:00-16:00"]},
            {"order_id": 3, "weight": 8.0, "region": 1, "delivery_hours": ["09:00-11:00"]},
            {"order_id": 4, "weight": 12.0, "region": 3, "delivery_hours": ["11:00-13:00"]},
            {"order_id": 5, "weight": 3.5, "region": 2, "delivery_hours": ["15:00-17:00"]},
            {"order_id": 6, "weight": 20.0, "region": 4, "delivery_hours": ["10:00-14:00"]},
            {"order_id": 7, "weight": 1.0, "region": 1, "delivery_hours": ["12:00-14:00"]},
            {"order_id": 8, "weight": 15.0, "region": 3, "delivery_hours": ["16:00-18:00"]},
            {"order_id": 9, "weight": 4.0, "region": 5, "delivery_hours": ["09:00-12:00"]},
            {"order_id": 10, "weight": 25.0, "region": 2, "delivery_hours": ["13:00-15:00"]},
        ]

        for o in orders_data:
            if not db.query(models.Order).filter(models.Order.order_id == o["order_id"]).first():
                db.add(models.Order(**o))
                db.commit()

    finally:
        db.close()


def reset_database():
    """Удаляет все таблицы и создает их заново (для разработки)"""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)