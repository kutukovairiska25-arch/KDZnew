document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');
    const courierId = localStorage.getItem('courier_id');

    if (!token || role !== 'courier' || !courierId) {
        window.location.href = '/';
        return;
    }

    const navLinks = document.querySelectorAll('.sidebar nav a');
    const sections = document.querySelectorAll('.content-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            link.classList.add('active');
            document.getElementById(`${targetId}-section`).classList.add('active');
        });
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '/';
    });

    async function loadCourierProfile() {
        try {
            const response = await fetch(`http://127.0.0.1:8000/couriers/${courierId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                document.getElementById('courierId').textContent = data.courier_id;
                document.getElementById('courierType').textContent = data.courier_type;
                document.getElementById('courierRating').textContent = data.rating !== null ? data.rating : '-'; // Исправлено с data.rate
                document.getElementById('courierEarnings').textContent = `${data.earnings} ₽`;
            } else {
                alert('Ошибка загрузки профиля');
            }
        } catch (error) {
            console.error('Ошибка сети:', error);
            alert('Ошибка сети');
        }
    }

    document.getElementById('getOrdersBtn').addEventListener('click', async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/orders/assign', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ courier_id: parseInt(courierId) })
            });

            if (response.ok) {
                const data = await response.json();
                alert(`Назначено заказов: ${data.orders ? data.orders.length : 0}`);
                loadMyOrders();
            } else {
                const error = await response.json();
                alert('Ошибка получения заказов: ' + (error.detail || 'Нет доступных заказов'));
            }
        } catch (error) {
            console.error('Ошибка сети:', error);
            alert('Ошибка сети');
        }
    });

    async function loadMyOrders() {
        try {
            const response = await fetch(`http://127.0.0.1:8000/couriers/${courierId}/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const orders = await response.json();
                const tbody = document.querySelector('#orders-section tbody');
                tbody.innerHTML = '';

                const activeOrders = orders.filter(o => o.status === 'assigned');

                if (activeOrders.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Нет активных заказов</td></tr>';
                    return;
                }

                activeOrders.forEach(o => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${o.order_id}</td>
                        <td>${o.weight} кг</td>
                        <td>${o.region}</td>
                        <td>${o.delivery_hours.join(', ')}</td>
                        <td>
                            <button class="complete-btn" data-order-id="${o.order_id}">Завершить</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });

                // Навешиваем обработчики на новые кнопки
                document.querySelectorAll('.complete-btn').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const orderId = btn.getAttribute('data-order-id');
                        await completeOrder(orderId);
                    });
                });
            }
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
            alert('Ошибка сети при загрузке заказов');
        }
    }

    async function completeOrder(orderId) {
        if (!confirm(`Подтвердить выполнение заказа #${orderId}?`)) return;

        try {
            const response = await fetch('http://127.0.0.1:8000/orders/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    courier_id: parseInt(courierId),
                    order_id: parseInt(orderId),
                    complete_time: new Date().toISOString()
                })
            });

            if (response.ok) {
                alert('Заказ успешно завершен');
                loadMyOrders();
                loadCourierProfile(); // Обновляем рейтинг и заработок
            } else {
                const error = await response.json();
                alert('Ошибка: ' + (error.detail || 'Не удалось завершить заказ'));
            }
        } catch (error) {
            console.error('Ошибка сети:', error);
            alert('Ошибка сети');
        }
    }

    loadCourierProfile();
    loadMyOrders();
});