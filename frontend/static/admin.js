// frontend/static/admin.js

document.addEventListener('DOMContentLoaded', () => {
    // Проверка авторизации
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'admin') {
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
        window.location.href = '/';
    });

    // Импорт курьеров
    document.getElementById('importCouriersBtn').addEventListener('click', async () => {
        const data = document.getElementById('couriersImportData').value;
        try {
            const parsedData = JSON.parse(data);
            const response = await fetch('http://127.0.0.1:8000/couriers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ data: parsedData })
            });

            if (response.ok) {
                alert('Курьеры успешно импортированы');
                loadCouriers();
            } else {
                const error = await response.json();
                alert('Ошибка импорта: ' + (error.detail || 'Неизвестная ошибка'));
            }
        } catch (e) {
            alert('Неверный формат JSON');
        }
    });

    // Импорт заказов
    document.getElementById('importOrdersBtn').addEventListener('click', async () => {
        const data = document.getElementById('ordersImportData').value;
        try {
            const parsedData = JSON.parse(data);
            const response = await fetch('http://127.0.0.1:8000/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ data: parsedData })
            });

            if (response.ok) {
                alert('Заказы успешно импортированы');
                loadOrders();
            } else {
                const error = await response.json();
                alert('Ошибка импорта: ' + (error.detail || 'Неизвестная ошибка'));
            }
        } catch (e) {
            alert('Неверный формат JSON');
        }
    });

    // Загрузка курьеров (заглушка для будущей реализации)
    async function loadCouriers() {
        console.log('Загрузка курьеров...');
        // TODO: Добавить GET запрос к API для получения списка курьеров
    }

    // Загрузка заказов (заглушка для будущей реализации)
    async function loadOrders() {
        console.log('Загрузка заказов...');
        // TODO: Добавить GET запрос к API для получения списка заказов
    }

    // Первоначальная загрузка данных
    loadCouriers();
    loadOrders();
});