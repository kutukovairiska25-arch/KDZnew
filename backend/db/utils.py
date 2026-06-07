"""
бизнес-логика: расчет рейтинга, подсчет заработка и
проверка пересечения временных интервалов.
"""

from datetime import datetime
from db import models

COURIER_COEFF = {"foot": 2, "bike": 5, "car": 9}
COURIER_CAPACITY = {"foot": 10, "bike": 15, "car": 50}

# Работа со временем
def parse_time_range(r: str) -> tuple:
    # Берет строку вида "09:00-18:00", разбивает её по дефису и превращает в объекты datetime.time Python,
    # с которыми можно математически сравнивать время.
    s, e = r.split("-")
    return (datetime.strptime(s, "%H:%M").time(), datetime.strptime(e, "%H:%M").time())

def hours_overlap(a: str, b: str) -> bool:
    # Проверка пересечения интервалов
    a_s, a_e = parse_time_range(a)
    b_s, b_e = parse_time_range(b)
    return a_s <= b_e and b_s <= a_e

# Расчет рейтинга
def calculate_rating(orders: list[models.Order]) -> float | None:
    if not orders:
        return None

    # Фильтруем только завершенные заказы
    completed = [o for o in orders if o.status == "completed"]
    if not completed:
        return None

    # Группируем заказы по регионам
    region_orders = {}
    for o in completed:
        region_orders.setdefault(o.region, []).append(o)

    region_avgs = []
    for region, reg_ords in region_orders.items():
        # Сортируем заказы в регионе по времени завершения
        reg_ords.sort(key=lambda x: x.completion_time)

        times = []
        for i, o in enumerate(reg_ords):
            if i == 0:
                # Для первого заказа в регионе: время от назначения до завершения
                if o.assign_time is None:
                    continue
                diff = (o.completion_time - o.assign_time).total_seconds()
            else:
                # Для последующих: от завершения предыдущего заказа в этом регионе
                prev_o = reg_ords[i - 1]
                diff = (o.completion_time - prev_o.completion_time).total_seconds()
            times.append(diff)

        if times:
            region_avgs.append(sum(times) / len(times))

    if not region_avgs:
        return None

    # t - минимальное из средних времен доставки по районам
    t_min = min(region_avgs)

    # Формула из ТЗ: (60*60 - min(t, 60*60))/(60*60) * 5
    rating = (3600 - min(t_min, 3600)) / 3600 * 5
    return round(rating, 2)

# Расчет заработка
def calculate_earnings(orders: list[models.Order]) -> int:
    return sum(500 * COURIER_COEFF.get(o.courier_type_at_assign, 2) for o in orders if o.status == "completed")