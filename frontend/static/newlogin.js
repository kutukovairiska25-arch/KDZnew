// Это событие говорит: "DOM полностью построен, можно вешать обработчики".
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');

    //  Когда пользователь вводит логин и нажимает кнопку "Sign In", срабатывает событие submit
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        submitBtn.innerText = 'Verifying...';
        submitBtn.disabled = true;

        // JavaScript перехватывает его, достает значения из DOM-элементов (document.getElementById('username').value),
        // формирует JSON и отправляет fetch-запрос на бэкенд.
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Скрипт формирует HTTP-запрос:
        try {
            const response = await fetch('http://127.0.0.1:8000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();

                // Если бэкенд вернул токен, JS сохраняет его в локальном хранилище браузера localStorage

                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('role', data.role);

                if (data.courier_id) {
                    localStorage.setItem('courier_id', data.courier_id);
                }

                // Браузер загружает новую страницу, строит новое DOM-дерево
                // Скрипт проверяет роль и перенаправляет пользователя

                if (data.role === 'admin') {
                    window.location.href = '/static/admin.html';
                } else if (data.role === 'courier') {
                    window.location.href = '/static/courier.html';
                } else {
                    alert('Неизвестная роль пользователя');
                    resetForm();
                }
            } else {
                const error = await response.json();
                alert(error.detail || 'Ошибка авторизации');
                resetForm();
            }
        } catch (err) {
            console.error('Ошибка соединения:', err);
            alert('Не удалось подключиться к серверу');
            resetForm();
        }
    });

    function resetForm() {
        submitBtn.innerText = 'Sign In';
        submitBtn.disabled = false;
        loginForm.reset();
    }
});