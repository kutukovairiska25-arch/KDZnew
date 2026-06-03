// frontend/static/courier.js

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

    // Загрузка профиля курьера
    async function loadCourierProfile() {
        try {
            const response = await fetch(`http://127.0.0.1:8000/couriers/${courierId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                document.getElementById('courierId').textContent = data.courier_id;
                document.getElementById('courierType').textContent = data.courier_type;
                document.getElementById('courierRating').textContent = data.rate || '-';
                document.getElementById('courierEarnings').textContent = data.earnings || '0';
            } else {
                alert('Ошибка загрузки профиля');
            }
        } catch (error) {
            console.error('Ошибка сети:', error);
            alert('Ошибка сети');
        }
    }

    // Получение заказов
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
                alert(`Назначено заказов: ${data.order_ids ? data.order_ids.length : 0}`);
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

    // Загрузка моих заказов (заглушка для будущей реализации)
    async function loadMyOrders() {
        console.log('Загрузка заказов курьера...');
        // TODO: Добавить GET запрос к API для получения списка назначенных заказов
    }

    // Первоначальная загрузка данных
    loadCourierProfile();
    loadMyOrders();
});