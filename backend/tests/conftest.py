import requests
import pytest

# Базовый URL запущенного FastAPI сервера
BASE_URL = "http://127.0.0.1:8000"

@pytest.fixture(scope="module")
def admin_token():
    """
    Получает JWT-токен администратора для авторизации в тестах.
    Scope="module" означает, что запрос выполнится один раз для всего файла тестов,
    что ускоряет прогон и экономит ресурсы.
    """
    resp = requests.post(f"{BASE_URL}/api/login", json={"username": "admin", "password": "123"})
    assert resp.status_code == 200, "Не удалось получить токен админа. Проверьте, запущен ли сервер и создана ли БД."
    return resp.json()["access_token"]

@pytest.fixture(scope="module")
def courier_auth():
    """
    Получает JWT-токен и ID курьера (courier1 создается в createDbUsers.py).
    Возвращает кортеж: (token, courier_id).
    """
    resp = requests.post(f"{BASE_URL}/api/login", json={"username": "courier1", "password": "123"})
    assert resp.status_code == 200, "Не удалось получить токен курьера."
    data = resp.json()
    return data["access_token"], data.get("courier_id")

@pytest.fixture(scope="module")
def admin_headers(admin_token):
    """Формирует заголовки для запросов от имени администратора."""
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}

@pytest.fixture(scope="module")
def courier_headers(courier_auth):
    """Формирует заголовки для запросов от имени курьера."""
    return {"Authorization": f"Bearer {courier_auth[0]}", "Content-Type": "application/json"}