from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from ..database import get_db
from .. import crud, schemas, models, utils

router = APIRouter()


@router.get("/couriers")
def get_all_couriers(db: Session = Depends(get_db)):
    couriers = db.query(models.Courier).all()
    result = []
    for c in couriers:
        completed = [o for o in crud.get_courier_orders(db, c.courier_id) if o.status == "completed"]
        c.rating = utils.calculate_rating(completed)
        c.earnings = utils.calculate_earnings(completed)
        result.append({
            "courier_id": c.courier_id,
            "courier_type": c.courier_type,
            "regions": c.regions,
            "working_hours": c.working_hours,
            "rating": c.rating,
            "earnings": c.earnings
        })
    return result


@router.post("/couriers", status_code=201)
def import_couriers(req: dict, db: Session = Depends(get_db)):
    data = req.get("data", [])
    valid, invalid = [], []

    for item in data:
        try:
            schemas.CourierItem(**item)
            if db.query(models.Courier).filter(models.Courier.courier_id == item["courier_id"]).first():
                invalid.append({**item, "error": "Курьер с таким ID уже существует"})
            else:
                valid.append(item)

                # АВТОМАТИЧЕСКОЕ СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ ДЛЯ КУРЬЕРА
                username = f"courier{item['courier_id']}"
                if not crud.get_user_by_username(db, username):
                    crud.create_user(
                        db,
                        username=username,
                        password="123",
                        role="courier",
                        courier_id=item["courier_id"]
                    )
        except Exception as e:
            invalid.append({**item, "error": str(e)})

    if invalid:
        return JSONResponse(status_code=400, content={"validation_error": {"couriers": invalid}})

    ids = crud.create_couriers(db, [schemas.CourierItem(**c) for c in valid])
    return {"couriers": [{"id": i} for i in ids]}


@router.patch("/couriers/{courier_id}")
def update_courier(courier_id: int, req: schemas.CourierUpdateRequest, db: Session = Depends(get_db)):
    courier = crud.update_courier(db, courier_id, req)
    if not courier:
        raise HTTPException(404, "Courier not found")

    new_cap = utils.COURIER_CAPACITY.get(courier.courier_type, 10)
    for order in db.query(models.Order).filter(
            models.Order.assigned_courier_id == courier_id,
            models.Order.status == "assigned"
    ).all():
        if order.weight > new_cap or order.region not in courier.regions:
            order.status, order.assigned_courier_id, order.assign_time, order.courier_type_at_assign = "new", None, None, None
    db.commit()

    return {
        "courier_id": courier.courier_id,
        "courier_type": courier.courier_type,
        "regions": courier.regions,
        "working_hours": courier.working_hours,
        "rating": None,
        "earnings": courier.earnings
    }


@router.get("/couriers/{courier_id}")
def get_courier(courier_id: int, db: Session = Depends(get_db)):
    courier = db.query(models.Courier).filter(models.Courier.courier_id == courier_id).first()
    if not courier:
        raise HTTPException(404, "Courier not found")

    completed = [o for o in crud.get_courier_orders(db, courier_id) if o.status == "completed"]
    courier.rating = utils.calculate_rating(completed)
    courier.earnings = utils.calculate_earnings(completed)
    db.commit()

    return {
        "courier_id": courier.courier_id,
        "courier_type": courier.courier_type,
        "regions": courier.regions,
        "working_hours": courier.working_hours,
        "rating": courier.rating,
        "earnings": courier.earnings
    }

@router.get("/couriers/{courier_id}/orders")
def get_courier_orders(courier_id: int, db: Session = Depends(get_db)):
    orders = crud.get_courier_orders(db, courier_id)
    return [{
        "order_id": o.order_id,
        "weight": o.weight,
        "region": o.region,
        "delivery_hours": o.delivery_hours,
        "status": o.status,
        "assign_time": str(o.assign_time) if o.assign_time else None
    } for o in orders]