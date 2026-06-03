import random
import requests
from datetime import datetime, timezone
from .conftest import BASE_URL

def test_import_orders(admin_headers):
    order_id = random.randint(100000, 999999)
    payload = {"data": [{"order_id": order_id, "weight": 10.0, "region": 1, "delivery_hours": ["10:00-12:00"]}]}
    resp = requests.post(f"{BASE_URL}/orders", json=payload, headers=admin_headers)
    assert resp.status_code == 201

def test_assign_orders(courier_headers, courier_auth):
    courier_id = courier_auth[1]
    payload = {"courier_id": courier_id}
    resp = requests.post(f"{BASE_URL}/orders/assign", json=payload, headers=courier_headers)
    assert resp.status_code == 200

def test_complete_order_invalid_state(courier_headers, courier_auth):
    courier_id = courier_auth[1]
    payload = {"courier_id": courier_id, "order_id": 99999, "complete_time": datetime.now(timezone.utc).isoformat()}
    resp = requests.post(f"{BASE_URL}/orders/complete", json=payload, headers=courier_headers)
    assert resp.status_code == 400