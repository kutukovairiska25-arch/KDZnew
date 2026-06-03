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

    // ==================== ЗАГРУЗКА КУРЬЕРОВ ====================
    async function loadCouriers() {
        try {
            const couriers = await api.get('/couriers');

            const tbody = document.querySelector('#couriersTable tbody');
            tbody.innerHTML = '';

            if (couriers.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Нет курьеров</td></tr>';
                return;
            }

            couriers.forEach(courier => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${courier.courier_id}</td>
                    <td>${courier.courier_type}</td>
                    <td>${courier.regions.join(', ')}</td>
                    <td>${courier.working_hours.join(', ')}</td>
                    <td>${courier.rating || '-'}</td>
                    <td>${courier.earnings || 0} ₽</td>
                    <td>
                        <button class="edit-btn" data-id="${courier.courier_id}">
                            Редактировать
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });

            // Добавляем обработчики для кнопок редактирования
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const courierId = btn.dataset.id;
                    editCourier(courierId);
                });
            });

        } catch (error) {
            alert('Ошибка загрузки курьеров: ' + error.message);
        }
    }

    // ==================== ЗАГРУЗКА ЗАКАЗОВ ====================
    async function loadOrders() {
        try {
            const orders = await api.get('/orders');

            const tbody = document.querySelector('#ordersTable tbody');
            tbody.innerHTML = '';

            if (orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Нет заказов</td></tr>';
                return;
            }

            orders.forEach(order => {
                const row = document.createElement('tr');

                // Цветовая индикация статуса
                let statusClass = '';
                let statusText = order.status;
                if (order.status === 'completed') {
                    statusClass = 'status-completed';
                    statusText = 'Завершён';
                } else if (order.status === 'assigned') {
                    statusClass = 'status-assigned';
                    statusText = 'Назначен';
                } else if (order.status === 'unassigned') {
                    statusClass = 'status-unassigned';
                    statusText = 'Не назначен';
                }

                row.innerHTML = `
                    <td>${order.order_id}</td>
                    <td>${order.weight} кг</td>
                    <td>${order.region}</td>
                    <td class="${statusClass}">${statusText}</td>
                    <td>${order.assigned_courier_id || '-'}</td>
                `;
                tbody.appendChild(row);
            });

        } catch (error) {
            alert('Ошибка загрузки заказов: ' + error.message);
        }
    }

    // ==================== ИМПОРТ КУРЬЕРОВ ====================
    document.getElementById('importCouriersBtn').addEventListener('click', async () => {
        const textarea = document.getElementById('couriersImportData');
        const data = textarea.value.trim();

        if (!data) {
            alert('Введите JSON с данными курьеров');
            return;
        }

        try {
            const parsedData = JSON.parse(data);

            // Проверяем, что это массив
            if (!Array.isArray(parsedData)) {
                alert('JSON должен быть массивом объектов');
                return;
            }

            await api.post('/couriers', { data: parsedData });
            alert('Курьеры успешно импортированы');

            // Очищаем textarea
            textarea.value = '';

            // Перезагружаем таблицу курьеров
            loadCouriers();

        } catch (e) {
            if (e instanceof SyntaxError) {
                alert('Неверный формат JSON');
            } else {
                alert('Ошибка импорта: ' + e.message);
            }
        }
    });

    // ==================== ИМПОРТ ЗАКАЗОВ ====================
    document.getElementById('importOrdersBtn').addEventListener('click', async () => {
        const textarea = document.getElementById('ordersImportData');
        const data = textarea.value.trim();

        if (!data) {
            alert('Введите JSON с данными заказов');
            return;
        }

        try {
            const parsedData = JSON.parse(data);

            // Проверяем, что это массив
            if (!Array.isArray(parsedData)) {
                alert('JSON должен быть массивом объектов');
                return;
            }

            await api.post('/orders', { data: parsedData });
            alert('Заказы успешно импортированы');

            // Очищаем textarea
            textarea.value = '';

            // Перезагружаем таблицу заказов
            loadOrders();

        } catch (e) {
            if (e instanceof SyntaxError) {
                alert('Неверный формат JSON');
            } else {
                alert('Ошибка импорта: ' + e.message);
            }
        }
    });

    // ==================== РЕДАКТИРОВАНИЕ КУРЬЕРА ====================
    function editCourier(courierId) {
        // Получаем текущие данные курьера
        api.get(`/couriers/${courierId}`)
            .then(courier => {
                // Создаём модальное окно
                const modal = document.createElement('div');
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content">
                        <h3>Редактирование курьера ${courierId}</h3>
                        <form id="editCourierForm">
                            <div class="form-group">
                                <label>Тип курьера:</label>
                                <select id="editCourierType" required>
                                    <option value="foot" ${courier.courier_type === 'foot' ? 'selected' : ''}>Пеший</option>
                                    <option value="bike" ${courier.courier_type === 'bike' ? 'selected' : ''}>Велосипед</option>
                                    <option value="car" ${courier.courier_type === 'car' ? 'selected' : ''}>Автомобиль</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Регионы (через запятую):</label>
                                <input type="text" id="editCourierRegions" value="${courier.regions.join(', ')}" required>
                            </div>
                            <div class="form-group">
                                <label>Рабочие часы (через запятую):</label>
                                <input type="text" id="editCourierHours" value="${courier.working_hours.join(', ')}" required>
                            </div>
                            <div class="form-buttons">
                                <button type="submit" class="btn-primary">Сохранить</button>
                                <button type="button" class="btn-secondary" id="cancelEdit">Отмена</button>
                            </div>
                        </form>
                    </div>
                `;

                document.body.appendChild(modal);

                // Обработчик отмены
                document.getElementById('cancelEdit').addEventListener('click', () => {
                    document.body.removeChild(modal);
                });

                // Обработчик сохранения
                document.getElementById('editCourierForm').addEventListener('submit', async (e) => {
                    e.preventDefault();

                    const courierType = document.getElementById('editCourierType').value;
                    const regions = document.getElementById('editCourierRegions').value
                        .split(',')
                        .map(r => parseInt(r.trim()))
                        .filter(r => !isNaN(r));
                    const workingHours = document.getElementById('editCourierHours').value
                        .split(',')
                        .map(h => h.trim())
                        .filter(h => h);

                    try {
                        await api.patch(`/couriers/${courierId}`, {
                            courier_type: courierType,
                            regions: regions,
                            working_hours: workingHours
                        });

                        alert('Данные курьера обновлены');
                        document.body.removeChild(modal);
                        loadCouriers(); // Перезагружаем таблицу

                    } catch (error) {
                        alert('Ошибка обновления: ' + error.message);
                    }
                });
            })
            .catch(error => {
                alert('Ошибка загрузки данных курьера: ' + error.message);
            });
    }

    // Первоначальная загрузка данных
    loadCouriers();
    loadOrders();
});