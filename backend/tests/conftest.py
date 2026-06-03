import requests
import pytest

BASE_URL = "http://127.0.0.1:8000"

@pytest.fixture(scope="module")
def admin_token():
    resp = requests.post(f"{BASE_URL}/api/login", json={"username": "admin", "password": "123"})
    assert resp.status_code == 200
    return resp.json()["access_token"]

@pytest.fixture(scope="module")
def courier_auth():
    resp = requests.post(f"{BASE_URL}/api/login", json={"username": "courier1", "password": "123"})
    assert resp.status_code == 200
    data = resp.json()
    return data["access_token"], data.get("courier_id")

@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}

@pytest.fixture(scope="module")
def courier_headers(courier_auth):
    return {"Authorization": f"Bearer {courier_auth[0]}", "Content-Type": "application/json"}