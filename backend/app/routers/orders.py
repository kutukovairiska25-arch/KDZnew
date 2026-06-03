from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from .. import crud, schemas, models, utils

router = APIRouter()


@router.post("/orders", status_code=201)
def import_orders(req: dict, db: Session = Depends(get_db)):
    data = req.get("data", [])
    valid, invalid = [], []
    for item in data:
        try:
            schemas.OrderItem(**item)
            valid.append(item)
        except Exception:
            invalid.append(item)

    if invalid:
        return JSONResponse(status_code=400, content={"validation_error": {"orders": invalid}})

    ids = crud.create_orders(db, [schemas.OrderItem(**o) for o in valid])
    return {"orders": [{"id": i} for i in ids]}


@router.post("/orders/assign")
def assign_orders(req: schemas.OrdersAssignPostRequest, db: Session = Depends(get_db)):
    courier = db.query(models.Courier).filter(models.Courier.courier_id == req.courier_id).first()
    if not courier:
        raise HTTPException(400, "Courier not found")

    assigned = crud.get_courier_orders(db, req.courier_id)
    active = [o for o in assigned if o.status == "assigned"]
    if active:
        return {"orders": [{"id": o.order_id} for o in active], "assign_time": assigned[0].assign_time.isoformat()}

    capacity = utils.COURIER_CAPACITY.get(courier.courier_type, 10)
    available = db.query(models.Order).filter(models.Order.status == "new").all()
    to_assign = [o for o in available if o.weight <= capacity and o.region in courier.regions and any(
        utils.hours_overlap(cw, oh) for cw in courier.working_hours for oh in o.delivery_hours)]

    if not to_assign:
        return {"orders": []}

    now = datetime.utcnow()
    for o in to_assign:
        o.status, o.assigned_courier_id, o.assign_time, o.courier_type_at_assign = "assigned", courier.courier_id, now, courier.courier_type

    db.commit()
    return {"orders": [{"id": o.order_id} for o in to_assign], "assign_time": now.isoformat()}


@router.post("/orders/complete")
def complete_order(req: schemas.OrdersCompletePostRequest, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.order_id == req.order_id).first()
    if not order or order.assigned_courier_id != req.courier_id or order.status != "assigned":
        raise HTTPException(400, "Invalid order or state")

    order.status = "completed"
    order.completion_time = datetime.fromisoformat(req.complete_time.replace("Z", "+00:00"))
    db.commit()
    return {"order_id": order.order_id}