import random
import requests
from .conftest import BASE_URL

def test_import_couriers(admin_headers):
    courier_id = random.randint(10000, 99999)
    payload = {"data": [{"courier_id": courier_id, "courier_type": "bike", "regions": [1, 2], "working_hours": ["08:00-20:00"]}]}
    resp = requests.post(f"{BASE_URL}/couriers", json=payload, headers=admin_headers)
    assert resp.status_code == 201
    assert courier_id in [c["id"] for c in resp.json()["couriers"]]

def test_import_couriers_invalid_data(admin_headers):
    payload = {"data": [{"courier_id": -1, "courier_type": "invalid", "regions": [], "working_hours": []}]}
    resp = requests.post(f"{BASE_URL}/couriers", json=payload, headers=admin_headers)
    assert resp.status_code == 400

def test_get_courier(admin_headers):
    courier_id = 1
    resp = requests.get(f"{BASE_URL}/couriers/{courier_id}", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["courier_id"] == courier_id

def test_get_courier_not_found(admin_headers):
    resp = requests.get(f"{BASE_URL}/couriers/99999", headers=admin_headers)
    assert resp.status_code == 404

def test_update_courier(admin_headers):
    courier_id = 1
    payload = {"courier_type": "car", "regions": [1, 2, 3]}
    resp = requests.patch(f"{BASE_URL}/couriers/{courier_id}", json=payload, headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["courier_type"] == "car"