import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.post('/api/login', { username, password });

      // Сохраняем данные
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('role', data.role);

      if (data.courier_id) {
        localStorage.setItem('courier_id', data.courier_id.toString());
      }

      // Перенаправляем в зависимости от роли
      if (data.role === 'admin') {
        navigate('/admin');
      } else if (data.role === 'courier') {
        navigate('/courier');
      } else {
        setError('Неизвестная роль пользователя');
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Не удалось подключиться к серверу');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <form onSubmit={handleSubmit}>
          <h2>LOGIN</h2>

          {error && <div className="error-message">{error}</div>}

          <div className="input-group">
            <i className="fas fa-user"></i>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder=" "
              required
            />
            <label>Username</label>
          </div>

          <div className="input-group">
            <i className="fas fa-lock"></i>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              required
            />
            <label>Password</label>
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Sign In'}
          </button>

        </form>
      </div>
    </div>
  );
}