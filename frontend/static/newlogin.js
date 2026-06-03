document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('http://127.0.0.1:8000/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                if (response.ok) {
                    const data = await response.json();

                    // Сохраняем токен и роль
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('role', data.role);

                    // Если бэкенд возвращает courier_id, сохраняем его
                    if (data.courier_id) {
                        localStorage.setItem('courier_id', data.courier_id.toString());
                    }

                    // Перенаправление в зависимости от роли
                    if (data.role === 'admin') {
                        window.location.href = '/admin';
                    } else if (data.role === 'courier') {
                        window.location.href = '/courier';
                    } else {
                        alert('Неизвестная роль: ' + data.role);
                    }
                } else {
                    const errorData = await response.json();
                    alert('Ошибка входа: ' + (errorData.detail || 'Неверные учетные данные'));
                }
            } catch (error) {
                console.error('Ошибка сети:', error);
                alert('Ошибка сети. Проверьте, запущен ли бэкенд на http://127.0.0.1:8000');
            }
        });
    }
});