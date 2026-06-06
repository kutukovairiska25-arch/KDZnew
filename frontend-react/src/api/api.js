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

      if (!response.ok) {
        let errorMessage = `Ошибка ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      if (response.status === 204) {
        return null;
      }

      return await response.json();

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