import random
import requests
from datetime import datetime, timezone
from .conftest import BASE_URL

def test_get_all_orders(admin_headers):
    """
    Проверка: Получение списка всех заказов администратором.
    Ожидаемый результат: Статус 200, ответ является списком.
    """
    resp = requests.get(f"{BASE_URL}/orders", headers=admin_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)

def test_import_orders_valid(admin_headers):
    """
    Проверка: Успешный импорт валидных данных заказа.
    Ожидаемый результат: Статус 201 Created, ID заказа присутствует в ответе.
    """
    order_id = random.randint(100000, 999999)
    payload = {"data": [{"order_id": order_id, "weight": 10.0, "region": 1, "delivery_hours": ["10:00-12:00"]}]}
    resp = requests.post(f"{BASE_URL}/orders", json=payload, headers=admin_headers)
    assert resp.status_code == 201
    assert order_id in [o["id"] for o in resp.json()["orders"]]

def test_import_orders_invalid_data(admin_headers):
    """
    Проверка: Импорт заведомо невалидных данных заказа (отрицательный вес, ID).
    Ожидаемый результат: Статус 400 Bad Request (валидация на уровне Pydantic).
    """
    payload = {"data": [{"order_id": -5, "weight": -10.0, "region": 0, "delivery_hours": []}]}
    resp = requests.post(f"{BASE_URL}/orders", json=payload, headers=admin_headers)
    assert resp.status_code == 400

def test_assign_orders_success(courier_headers, courier_auth):
    """
    Проверка: Курьер запрашивает назначение заказов на себя.
    Ожидаемый результат: Статус 200, в ответе присутствует ключ "orders" (даже если список пустой, 
    что нормально, если нет подходящих заказов в БД).
    """
    courier_id = courier_auth[1]
    payload = {"courier_id": courier_id}
    resp = requests.post(f"{BASE_URL}/orders/assign", json=payload, headers=courier_headers)
    assert resp.status_code == 200
    assert "orders" in resp.json(), "В ответе должен быть ключ 'orders'"

def test_complete_order_invalid_state(courier_headers, courier_auth):
    """
    Проверка: Попытка завершить несуществующий или не назначенный данному курьеру заказ.
    Ожидаемый результат: Статус 400 Bad Request (бизнес-логика запрещает это действие).
    """
    courier_id = courier_auth[1]
    payload = {
        "courier_id": courier_id, 
        "order_id": 999999, # Заведомо несуществующий заказ
        "complete_time": datetime.now(timezone.utc).isoformat()
    }
    resp = requests.post(f"{BASE_URL}/orders/complete", json=payload, headers=courier_headers)
    assert resp.status_code == 400

def test_cancel_order_not_found(admin_headers):
    """
    Проверка: Попытка отменить несуществующий заказ.
    Ожидаемый результат: Статус 404 Not Found.
    """
    resp = requests.patch(f"{BASE_URL}/orders/999999/cancel", headers=admin_headers)
    assert resp.status_code == 404

def test_delete_order_not_found(admin_headers):
    """
    Проверка: Попытка удалить несуществующий заказ администратором.
    Ожидаемый результат: Статус 404 Not Found.
    """
    resp = requests.delete(f"{BASE_URL}/orders/999999", headers=admin_headers)
    assert resp.status_code == 404