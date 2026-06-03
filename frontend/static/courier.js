document.addEventListener('DOMContentLoaded', () => {
    // Проверка авторизации
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');
    const courierId = localStorage.getItem('courier_id');

    if (!token || role !== 'courier' || !courierId) {
        window.location.href = '/';
        return;
    }

    // Навигация по разделам
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

    // Выход
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('role');
        localStorage.removeItem('courier_id');
        window.location.href = '/';
    });

    // ==================== ЗАГРУЗКА ПРОФИЛЯ КУРЬЕРА ====================
    async function loadCourierProfile() {
        try {
            const data = await api.get(`/couriers/${courierId}`);

            document.getElementById('courierId').textContent = data.courier_id;
            document.getElementById('courierType').textContent = data.courier_type;
            document.getElementById('courierRating').textContent = data.rating || '-';
            document.getElementById('courierEarnings').textContent = data.earnings || '0';

        } catch (error) {
            alert('Ошибка загрузки профиля: ' + error.message);
        }
    }

    // ==================== ЗАГРУЗКА МОИХ ЗАКАЗОВ ====================
    async function loadMyOrders() {
        try {
            const orders = await api.get(`/couriers/${courierId}/orders`);

            const tbody = document.querySelector('#myOrdersTable tbody');
            tbody.innerHTML = '';

            // Фильтруем только назначенные заказы
            const assignedOrders = orders.filter(order => order.status === 'assigned');

            if (assignedOrders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Нет назначенных заказов</td></tr>';
                return;
            }

            assignedOrders.forEach(order => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${order.order_id}</td>
                    <td>${order.weight} кг</td>
                    <td>${order.region}</td>
                    <td>${order.delivery_hours || '-'}</td>
                    <td>
                        <button class="complete-btn" data-id="${order.order_id}">
                            Завершить
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });

            // Обработчики для кнопок завершения
            document.querySelectorAll('.complete-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const orderId = btn.dataset.id;
                    completeOrder(orderId);
                });
            });

        } catch (error) {
            alert('Ошибка загрузки заказов: ' + error.message);
        }
    }

    // ==================== ПОЛУЧЕНИЕ НОВЫХ ЗАКАЗОВ ====================
    document.getElementById('getOrdersBtn').addEventListener('click', async () => {
        try {
            const response = await api.post('/orders/assign', {
                courier_id: parseInt(courierId)
            });

            const orderIds = response.order_ids || [];

            if (orderIds.length === 0) {
                alert('Нет доступных заказов для назначения');
            } else {
                alert(`Назначено заказов: ${orderIds.length}`);
                loadMyOrders(); // Обновляем список заказов
            }

        } catch (error) {
            alert('Ошибка получения заказов: ' + error.message);
        }
    });

    // ==================== ЗАВЕРШЕНИЕ ЗАКАЗА ====================
    async function completeOrder(orderId) {
        if (!confirm(`Завершить заказ #${orderId}?`)) {
            return;
        }

        try {
            // Формируем текущее время в ISO формате
            const completeTime = new Date().toISOString();

            await api.post('/orders/complete', {
                courier_id: parseInt(courierId),
                order_id: parseInt(orderId),
                complete_time: completeTime
            });

            alert(`Заказ #${orderId} завершён!`);

            // Обновляем таблицу заказов
            loadMyOrders();

            // Обновляем профиль (рейтинг и заработок)
            loadCourierProfile();

        } catch (error) {
            alert('Ошибка завершения заказа: ' + error.message);
        }
    }

    // Первоначальная загрузка данных
    loadCourierProfile();
    loadMyOrders();
});