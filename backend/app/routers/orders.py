from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from db.database import get_db
from .. import schemas
from db import models, crud, utils

# Позволяет вынести маршруты, связанные с курьерами, в отдельный файл
router = APIRouter()


@router.get("/orders")
def get_all_orders(db: Session = Depends(get_db)):
    orders = db.query(models.Order).all()
    return [{
        "order_id": o.order_id,
        "weight": o.weight,
        "region": o.region,
        "delivery_hours": o.delivery_hours,
        "status": o.status,
        "assigned_courier_id": o.assigned_courier_id,
        # Преобразуем объекты datetime в строки, иначе JSON-сериализатор выдаст ошибку
        "assign_time": str(o.assign_time) if o.assign_time else None,
        "completion_time": str(o.completion_time) if o.completion_time else None
    } for o in orders]


@router.post("/orders", status_code=201)
def import_orders(req: dict, db: Session = Depends(get_db)):
    data = req.get("data", [])
    valid, invalid = [], []
    for item in data:
        try:
            # 1. Валидация через схему Pydantic
            schemas.OrderItem(**item)

            # 2. Проверка на дубликаты в БД
            if db.query(models.Order).filter(models.Order.order_id == item["order_id"]).first():
                invalid.append({**item, "error": "Заказ с таким ID уже существует"})
            else:
                valid.append(item)
        except Exception as e:
            invalid.append({**item, "error": str(e)})

    # 3. Если есть хоть одна ошибка, отклоняем весь импорт с кодом 400
    if invalid:
        return JSONResponse(status_code=400, content={"validation_error": {"orders": invalid}})

    # 4. Сохраняем только валидные заказы одним коммитом
    ids = crud.create_orders(db, [schemas.OrderItem(**o) for o in valid])
    return {"orders": [{"id": i} for i in ids]}


# Назначение заказов курьеру
@router.post("/orders/assign")
def assign_orders(req: schemas.OrdersAssignPostRequest, db: Session = Depends(get_db)):
    # 1. Проверяем, существует ли курьер
    courier = db.query(models.Courier).filter(models.Courier.courier_id == req.courier_id).first()
    if not courier:
        raise HTTPException(400, "Courier not found")

    # Если у курьера уже есть активные ("assigned") заказы,
    # просто возвращаем их, не назначая новые. Время назначения остается старым
    assigned = crud.get_courier_orders(db, req.courier_id)
    active = [o for o in assigned if o.status == "assigned"]

    MAX_ACTIVE_ORDERS = 3
    if len(active) >= MAX_ACTIVE_ORDERS:
        raise HTTPException(
            status_code=400,
            detail=f"Курьер уже имеет максимальное количество активных заказов ({MAX_ACTIVE_ORDERS}). Сначала завершите или отмените существующие заказы."
        )

    if active:
        return {"orders": [{"id": o.order_id} for o in active], "assign_time": active[0].assign_time.isoformat(),
                "newly_assigned": False}

    # Определяем, сколько еще заказов можно назначить
    slots_available = MAX_ACTIVE_ORDERS - len(active)

    # 3. Определяем грузоподъемность курьера из utils.py
    capacity = utils.COURIER_CAPACITY.get(courier.courier_type, 10)

    # 4. Берем все заказы со статусом "new"
    available = db.query(models.Order).filter(models.Order.status == "new").all()
    to_assign = [o for o in available if o.weight <= capacity and o.region in courier.regions and any(
        utils.hours_overlap(cw, oh) for cw in courier.working_hours for oh in o.delivery_hours)]
    to_assign = to_assign[:slots_available]

    if not to_assign:
        return {"orders": []}

    # 6. Назначаем заказы: меняем статус, привязываем курьера, фиксируем время и тип курьера
    now = datetime.now(timezone.utc)
    for o in to_assign:
        o.status = "assigned"
        o.assigned_courier_id = courier.courier_id
        o.assign_time = now
        o.courier_type_at_assign = courier.courier_type

    db.commit()
    return {"orders": [{"id": o.order_id} for o in to_assign], "assign_time": now.isoformat(), "newly_assigned": True}


# Завершение заказа
@router.post("/orders/complete")
def complete_order(req: schemas.OrdersCompletePostRequest, db: Session = Depends(get_db)):
    # Находим заказ в базе данных
    order = db.query(models.Order).filter(models.Order.order_id == req.order_id).first()

    # Проверяем, что заказ существует, назначен именно этому курьеру и находится в статусе "assigned"
    if not order or order.assigned_courier_id != req.courier_id or order.status != "assigned":
        raise HTTPException(400, "Invalid order or state")

    order.status = "completed"

    # Фронтенд присылает время в формате ISO с 'Z' на конце (UTC).
    # Python лучше понимает '+00:00', поэтому делаем замену перед парсингом.
    order.completion_time = datetime.fromisoformat(req.complete_time.replace("Z", "+00:00"))

    # Сохраняем изменения в базе данных
    db.commit()
    return {"order_id": order.order_id}


@router.patch("/orders/{order_id}/cancel")
async def cancel_order(
        order_id: int,
        db: Session = Depends(get_db)
):
    order = db.query(models.Order).filter(models.Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    if order.status != "assigned":
        raise HTTPException(status_code=400, detail="Можно отменить только назначенный заказ")

    # Запоминаем, кто отменил заказ (для статистики)
    order.cancelled_by_courier_id = order.assigned_courier_id

    # Возвращаем заказ в общий пул
    order.status = "new"
    order.assigned_courier_id = None
    order.assign_time = None

    db.commit()
    db.refresh(order)

    return {"message": "Заказ отменён", "order_id": order_id}


@router.delete("/orders/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    """
    Удаление заказа администратором
    """
    order = db.query(models.Order).filter(models.Order.order_id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    # Проверяем, что заказ не назначен курьеру (нельзя удалить активный заказ)
    if order.status == "assigned":
        raise HTTPException(
            status_code=400,
            detail="Нельзя удалить назначенный заказ. Сначала отмените его."
        )

    db.delete(order)
    db.commit()

    return {"message": f"Заказ #{order_id} удалён", "order_id": order_id}