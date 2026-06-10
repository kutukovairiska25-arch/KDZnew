import requests
from .conftest import BASE_URL

def test_login_success_admin():
    """
    Проверка: Успешный вход администратора.
    Ожидаемый результат: Статус 200, наличие access_token и role == "admin".
    """
    resp = requests.post(f"{BASE_URL}/api/login", json={"username": "admin", "password": "123"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data, "В ответе отсутствует access_token"
    assert data["role"] == "admin", "Неверная роль пользователя"

def test_login_success_courier():
    """
    Проверка: Успешный вход курьера.
    Ожидаемый результат: Статус 200, наличие access_token, role == "courier" и courier_id.
    """
    resp = requests.post(f"{BASE_URL}/api/login", json={"username": "courier1", "password": "123"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["role"] == "courier"
    assert "courier_id" in data, "Для курьера в ответе должен быть указан courier_id"

def test_login_invalid_password():
    """
    Проверка: Попытка входа с неверным паролем.
    Ожидаемый результат: Статус 401 Unauthorized.
    """
    resp = requests.post(f"{BASE_URL}/api/login", json={"username": "admin", "password": "wrong_password"})
    assert resp.status_code == 401

def test_login_nonexistent_user():
    """
    Проверка: Попытка входа под несуществующим пользователем.
    Ожидаемый результат: Статус 401 Unauthorized (без раскрытия информации о существовании пользователя).
    """
    resp = requests.post(f"{BASE_URL}/api/login", json={"username": "ghost_user_999", "password": "123"})
    assert resp.status_code == 401