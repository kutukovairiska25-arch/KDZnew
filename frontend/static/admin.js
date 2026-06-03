document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'admin') {
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
                document.getElementById('couriersImportData').value = '';
                loadCouriers();
            } else {
                const error = await response.json();
                alert('Ошибка импорта: ' + (error.detail || JSON.stringify(error)));
            }
        } catch (e) {
            alert('Неверный формат JSON');
        }
    });

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
                document.getElementById('ordersImportData').value = '';
                loadOrders();
            } else {
                const error = await response.json();
                alert('Ошибка импорта: ' + (error.detail || JSON.stringify(error)));
            }
        } catch (e) {
            alert('Неверный формат JSON');
        }
    });

    async function loadCouriers() {
        try {
            const response = await fetch('http://127.0.0.1:8000/couriers', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const couriers = await response.json();
                const tbody = document.querySelector('#couriers-section tbody');
                tbody.innerHTML = '';
                couriers.forEach(c => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${c.courier_id}</td>
                        <td>${c.courier_type}</td>
                        <td>${c.regions.join(', ')}</td>
                        <td>${c.working_hours.join(', ')}</td>
                        <td>${c.rating !== null ? c.rating : '-'}</td>
                        <td>${c.earnings} ₽</td>
                        <td><button onclick="alert('Функция редактирования в разработке')">Изменить</button></td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        } catch (error) {
            console.error('Ошибка загрузки курьеров:', error);
            alert('Ошибка сети при загрузке курьеров');
        }
    }

    async function loadOrders() {
        try {
            const response = await fetch('http://127.0.0.1:8000/orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const orders = await response.json();
                const tbody = document.querySelector('#orders-section tbody');
                tbody.innerHTML = '';
                orders.forEach(o => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${o.order_id}</td>
                        <td>${o.weight} кг</td>
                        <td>${o.region}</td>
                        <td>${o.status}</td>
                        <td>${o.assigned_courier_id || '-'}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
            alert('Ошибка сети при загрузке заказов');
        }
    }

    loadCouriers();
    loadOrders();
});