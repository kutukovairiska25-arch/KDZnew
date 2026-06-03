from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas, models, utils

router = APIRouter()

@router.post("/couriers", status_code=201)
def import_couriers(req: dict, db: Session = Depends(get_db)):
    data = req.get("data", [])
    valid, invalid = [], []
    for item in data:
        try:
            schemas.CourierItem(**item)
            valid.append(item)
        except Exception:
            invalid.append(item)
    if invalid:
        return {"validation_error": {"couriers": invalid}}, 400
    ids = crud.create_couriers(db, [schemas.CourierItem(**c) for c in valid])
    return {"couriers": [{"id": i} for i in ids]}

@router.patch("/couriers/{courier_id}")
def update_courier(courier_id: int, req: schemas.CourierUpdateRequest, db: Session = Depends(get_db)):
    courier = crud.update_courier(db, courier_id, req)
    if not courier:
        raise HTTPException(404, "Courier not found")
    # Снятие заказов при изменении параметров
    new_cap = utils.COURIER_CAPACITY.get(courier.courier_type, 10)
    for order in db.query(models.Order).filter(models.Order.assigned_courier_id == courier_id, models.Order.status == "assigned").all():
        if order.weight > new_cap or order.region not in courier.regions:
            order.status, order.assigned_courier_id, order.assign_time, order.courier_type_at_assign = "new", None, None, None
    db.commit()
    return {**courier.__dict__, "rating": None, "earnings": courier.earnings}

@router.get("/couriers/{courier_id}")
def get_courier(courier_id: int, db: Session = Depends(get_db)):
    courier = db.query(models.Courier).filter(models.Courier.courier_id == courier_id).first()
    if not courier:
        raise HTTPException(404, "Courier not found")
    completed = [o for o in crud.get_courier_orders(db, courier_id) if o.status == "completed"]
    courier.rating = utils.calculate_rating(completed)
    courier.earnings = utils.calculate_earnings(completed)
    db.commit()
    return {**courier.__dict__, "rating": courier.rating, "earnings": courier.earnings}