const API_BASE_URL = '';

export const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('access_token');

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      if (response.status === 401) {
        localStorage.clear();
        window.location.href = '/';
        throw new Error('Сессия истекла. Войдите снова.');
      }

      // Читаем тело ответа ОДИН РАЗ и сохраняем в переменную
      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = `Ошибка ${response.status}`;
        try {
          // Пытаемся распарсить сохранённый текст как JSON
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          // Если не JSON - используем как есть
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      if (response.status === 204) {
        return null;
      }

      // Парсим сохранённый текст как JSON
      try {
        return responseText ? JSON.parse(responseText) : null;
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        return null;
      }

    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  get: (endpoint) => api.request(endpoint, { method: 'GET' }),

  post: (endpoint, data) => api.request(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  patch: (endpoint, data) => api.request(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
};