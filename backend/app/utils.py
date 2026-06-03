from datetime import datetime
from . import models

COURIER_COEFF = {"foot": 2, "bike": 5, "car": 9}
COURIER_CAPACITY = {"foot": 10, "bike": 15, "car": 50}

def parse_time_range(r: str) -> tuple:
    s, e = r.split("-")
    return (datetime.strptime(s, "%H:%M").time(), datetime.strptime(e, "%H:%M").time())

def hours_overlap(a: str, b: str) -> bool:
    a_s, a_e = parse_time_range(a)
    b_s, b_e = parse_time_range(b)
    return a_s <= b_e and b_s <= a_e

def calculate_rating(orders: list[models.Order]) -> float | None:
    if not orders:
        return None
    region_times = {}
    for o in orders:
        region_times.setdefault(o.region, []).append(
            (o.completion_time - (orders[orders.index(o)-1].completion_time if orders.index(o) > 0 else o.assign_time)).total_seconds()
        )
    avg_times = [sum(t)/len(t) for t in region_times.values() if t]
    if not avg_times:
        return None
    t_min = min(avg_times)
    return round((3600 - min(t_min, 3600)) / 3600 * 5, 2)

def calculate_earnings(orders: list[models.Order]) -> int:
    return sum(500 * COURIER_COEFF.get(o.courier_type_at_assign, 2) for o in orders if o.status == "completed")