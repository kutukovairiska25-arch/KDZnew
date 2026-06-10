import random
import requests
from .conftest import BASE_URL

def test_get_all_couriers(admin_headers):
    """
    Проверка: Получение списка всех курьеров администратором.
    Ожидаемый результат: Статус 200, ответ является списком.
    """
    resp = requests.get(f"{BASE_URL}/couriers", headers=admin_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list), "Ответ должен быть списком курьеров"

def test_import_couriers_valid(admin_headers):
    """
    Проверка: Успешный импорт валидных данных курьера.
    Ожидаемый результат: Статус 201 Created, ID нового курьера присутствует в ответе.
    """
    courier_id = random.randint(10000, 99999)
    payload = {"data": [{"courier_id": courier_id, "courier_type": "bike", "regions": [1, 2], "working_hours": ["08:00-20:00"]}]}
    resp = requests.post(f"{BASE_URL}/couriers", json=payload, headers=admin_headers)
    assert resp.status_code == 201
    assert courier_id in [c["id"] for c in resp.json()["couriers"]], "ID созданного курьера не найден в ответе"

def test_import_couriers_invalid_data(admin_headers):
    """
    Проверка (BUG-01): Импорт заведомо невалидных данных (отрицательный ID, неверный тип, пустые массивы).
    ПОЧЕМУ ЭТО ВАЖНО: Ранее сервер возвращал 201 из-за некорректного return {...}, 400.
    Теперь используется JSONResponse(status_code=400).
    Ожидаемый результат: Статус 400 Bad Request, наличие ключа "validation_error" в ответе.
    """
    payload = {"data": [{"courier_id": -1, "courier_type": "invalid_type", "regions": [], "working_hours": []}]}
    resp = requests.post(f"{BASE_URL}/couriers", json=payload, headers=admin_headers)
    assert resp.status_code == 400, f"Ожидался 400, но получен {resp.status_code}"
    assert "validation_error" in resp.json(), "В ответе должно быть описание ошибки валидации"

def test_get_courier_success(admin_headers):
    """
    Проверка (BUG-02): Получение данных существующего курьера.
    ПОЧЕМУ ЭТО ВАЖНО: Ранее использование **courier.__dict__ добавляло служебные поля SQLAlchemy
    (например, _sa_instance_state), что ломало JSON и вызывало KeyError.
    Теперь словарь формируется вручную.
    Ожидаемый результат: Статус 200, явное наличие ключей courier_id, courier_type, rating, earnings.
    """
    courier_id = 1
    resp = requests.get(f"{BASE_URL}/couriers/{courier_id}", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "courier_id" in data, "Отсутствует обязательное поле courier_id (признак бага с __dict__)"
    assert "courier_type" in data
    assert "rating" in data
    assert "earnings" in data
    assert data["courier_id"] == courier_id

def test_get_courier_not_found(admin_headers):
    """
    Проверка: Попытка получить данные несуществующего курьера.
    Ожидаемый результат: Статус 404 Not Found.
    """
    resp = requests.get(f"{BASE_URL}/couriers/999999", headers=admin_headers)
    assert resp.status_code == 404

def test_update_courier_success(admin_headers):
    """
    Проверка (BUG-03): Успешное обновление данных курьера.
    ПОЧЕМУ ЭТО ВАЖНО: Та же проблема с __dict__, что и в BUG-02, но в эндпоинте PATCH.
    Ожидаемый результат: Статус 200, ответ содержит обновленные данные в явном виде.
    """
    courier_id = 1
    payload = {"courier_type": "car", "regions": [1, 2, 3, 4]}
    resp = requests.patch(f"{BASE_URL}/couriers/{courier_id}", json=payload, headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "courier_id" in data, "Отсутствует courier_id в ответе обновления"
    assert data["courier_type"] == "car", "Тип курьера не обновился"
    assert data["regions"] == [1, 2, 3, 4], "Регионы не обновились корректно"

def test_get_courier_orders(admin_headers):
    """
    Проверка: Получение списка заказов, связанных с конкретным курьером.
    Ожидаемый результат: Статус 200, ответ является списком.
    """
    courier_id = 1
    resp = requests.get(f"{BASE_URL}/couriers/{courier_id}/orders", headers=admin_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)