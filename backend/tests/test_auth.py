import requests
from .conftest import BASE_URL

def test_login_success():
    resp = requests.post(f"{BASE_URL}/api/login", json={"username": "admin", "password": "123"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()

def test_login_invalid_password():
    resp = requests.post(f"{BASE_URL}/api/login", json={"username": "admin", "password": "wrong"})
    assert resp.status_code == 401

def test_login_nonexistent_user():
    resp = requests.post(f"{BASE_URL}/api/login", json={"username": "nobody", "password": "123"})
    assert resp.status_code == 401