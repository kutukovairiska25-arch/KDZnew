import './CourierDashboard.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import Sidebar from '../components/Sidebar';

export default function CourierDashboard() {
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    cancelled: 0,
    active: 0
  });
  const navigate = useNavigate();
  const courierId = localStorage.getItem('courier_id');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'courier' || !courierId) {
      navigate('/');
      return;
    }

    loadProfile();
    loadOrders();
    loadStats();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.get(`/couriers/${courierId}`);
      setProfile(data);
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await api.get(`/couriers/${courierId}/orders`);
      const activeOrders = data.filter(order => order.status === 'assigned');
      setOrders(activeOrders);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    }
  };

  const loadStats = async () => {
    try {
      // Получаем все заказы курьера (включая завершённые и отменённые)
      const allOrders = await api.get(`/couriers/${courierId}/orders`);

      const statsData = {
        total: allOrders.length,
        completed: allOrders.filter(o => o.status === 'completed').length,
        cancelled: allOrders.filter(o => o.status === 'cancelled').length,
        active: allOrders.filter(o => o.status === 'assigned').length
      };

      setStats(statsData);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  const handleGetOrders = async () => {
    try {
      const response = await api.post('/orders/assign', {
        courier_id: parseInt(courierId),
      });

      const orderIds = response.order_ids || [];

      if (orderIds.length === 0) {
        alert('Нет доступных заказов для назначения');
      } else {
        alert(`Назначено заказов: ${orderIds.length}`);
        loadOrders();
        loadStats();
      }
    } catch (error) {
      alert('Ошибка получения заказов: ' + error.message);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    if (!confirm(`Завершить заказ #${orderId}?`)) {
      return;
    }

    try {
      const completeTime = new Date().toISOString();

      await api.post('/orders/complete', {
        courier_id: parseInt(courierId),
        order_id: parseInt(orderId),
        complete_time: completeTime,
      });

      alert(`Заказ #${orderId} завершён!`);
      loadOrders();
      loadProfile();
      loadStats();
    } catch (error) {
      alert('Ошибка завершения заказа: ' + error.message);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm(`Отменить заказ #${orderId}?`)) {
      return;
    }

    try {
      // Передаём пустой объект, так как бэкенду не нужны данные в теле запроса
      await api.patch(`/orders/${orderId}/cancel`, {});

      alert(`Заказ #${orderId} отменён`);
      loadOrders();
      loadStats();
    } catch (error) {
      alert('Ошибка отмены заказа: ' + error.message);
    }
  };

  const menuItems = [
    { section: 'profile', label: '📊 Профиль' },
    { section: 'orders', label: '📦 Мои заказы' },
    { section: 'stats', label: '📈 Статистика' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        title="🚚 Candy Courier"
        menuItems={menuItems}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <main style={{ flex: 1, padding: '40px', background: 'linear-gradient(135deg, #FFE5EC 0%, #E0F7FF 50%, #FFD6E0 100%)', minHeight: '100vh' }}>
        {activeSection === 'profile' && profile && (
          <section>
            <h1 style={{ marginBottom: '30px' }}>Профиль курьера</h1>
            <div className="card" style={{ marginBottom: '30px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <div style={{ padding: '20px', background: 'linear-gradient(135deg, #FFB6C1 0%, #FFD6E0 100%)', borderRadius: '16px', color: 'white', boxShadow: '0 8px 24px rgba(255, 182, 193, 0.3)' }}>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px' }}>ID курьера</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{profile.courier_id}</div>
                  </div>
                  <div style={{ padding: '20px', background: 'linear-gradient(135deg, #B6E2FF 0%, #E0F7FF 100%)', borderRadius: '16px', color: 'white', boxShadow: '0 8px 24px rgba(182, 226, 255, 0.3)' }}>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px' }}>Тип</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{profile.courier_type}</div>
                  </div>
                  <div style={{ padding: '20px', background: 'linear-gradient(135deg, #FFD6E0 0%, #FFB6C1 100%)', borderRadius: '16px', color: 'white', boxShadow: '0 8px 24px rgba(255, 214, 224, 0.3)' }}>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px' }}>Рейтинг</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{profile.rating || '5.0'} ⭐</div>
                  </div>
                  <div style={{ padding: '20px', background: 'linear-gradient(135deg, #87CEEB 0%, #B6E2FF 100%)', borderRadius: '16px', color: 'white', boxShadow: '0 8px 24px rgba(135, 206, 235, 0.3)' }}>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px' }}>Заработок</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{profile.earnings || 0} ₽</div>
                  </div>
                </div>
            </div>
            <button
              onClick={handleGetOrders}
              style={{
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #FFB6C1 0%, #B6E2FF 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: '600',
                boxShadow: '0 4px 15px rgba(255, 182, 193, 0.4)',
                transition: 'all 0.3s ease'
              }}
            >
              📥 Получить новые заказы
            </button>
          </section>
        )}

        {activeSection === 'orders' && (
          <section>
            <h1 style={{ marginBottom: '30px' }}>Мои заказы</h1>
            {orders.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📭</div>
                <p style={{ fontSize: '1.2rem', color: '#718096' }}>Нет активных заказов</p>
                <button
                  onClick={handleGetOrders}
                  className="gradient-bg"
                  style={{
                    marginTop: '20px',
                    padding: '12px 24px',
                    color: 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  Получить заказы
                </button>
              </div>
            ) : (
              <div className="card">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ padding: '18px 24px', textAlign: 'left' }}>ID</th>
                        <th style={{ padding: '18px 24px', textAlign: 'left' }}>Вес</th>
                        <th style={{ padding: '18px 24px', textAlign: 'left' }}>Регион</th>
                        <th style={{ padding: '18px 24px', textAlign: 'left' }}>Время доставки</th>
                        <th style={{ padding: '18px 24px', textAlign: 'left' }}>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.order_id}>
                          <td style={{ fontWeight: '600', color: '#FF6B9D', padding: '16px 24px' }}>#{order.order_id}</td>
                          <td style={{ padding: '16px 24px' }}>{order.weight} кг</td>
                          <td style={{ padding: '16px 24px' }}>📍 {order.region}</td>
                          <td style={{ padding: '16px 24px' }}>🕐 {order.delivery_hours || '-'}</td>
                          <td style={{ padding: '16px 24px', display: 'flex', gap: '10px' }}>
                            <button
                              onClick={() => handleCompleteOrder(order.order_id)}
                              style={{
                                padding: '10px 20px',
                                background: 'linear-gradient(135deg, #B6E2FF 0%, #87CEEB 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600'
                              }}
                            >
                              ✓ Завершить
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order.order_id)}
                              style={{
                                padding: '10px 20px',
                                background: 'linear-gradient(135deg, #FF6B9D 0%, #FFB6C1 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600'
                              }}
                            >
                              ✕ Отменить
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            )}
          </section>
        )}

        {activeSection === 'stats' && (
          <section>
            <h1 style={{ marginBottom: '30px' }}>Статистика заказов</h1>
            <div className="card">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                <div style={{
                  padding: '30px',
                  background: 'linear-gradient(135deg, #FFB6C1 0%, #FFD6E0 100%)',
                  borderRadius: '16px',
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📦</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px' }}>Всего заказов</div>
                  <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{stats.total}</div>
                </div>

                <div style={{
                  padding: '30px',
                  background: 'linear-gradient(135deg, #B6E2FF 0%, #E0F7FF 100%)',
                  borderRadius: '16px',
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✓</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px' }}>Выполнено</div>
                  <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{stats.completed}</div>
                </div>

                <div style={{
                  padding: '30px',
                  background: 'linear-gradient(135deg, #FF8FB1 0%, #FFB6C1 100%)',
                  borderRadius: '16px',
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✕</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px' }}>Отменено</div>
                  <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{stats.cancelled}</div>
                </div>

                <div style={{
                  padding: '30px',
                  background: 'linear-gradient(135deg, #87CEEB 0%, #B6E2FF 100%)',
                  borderRadius: '16px',
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⏳</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '8px' }}>Активных</div>
                  <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{stats.active}</div>
                </div>
              </div>

              {stats.total > 0 && (
                <div style={{ marginTop: '40px', padding: '24px', background: '#f7fafc', borderRadius: '12px' }}>
                  <h3 style={{ marginBottom: '20px', textAlign: 'center' }}>Процент выполнения</h3>
                  <div style={{
                    height: '30px',
                    background: '#e2e8f0',
                    borderRadius: '15px',
                    overflow: 'hidden',
                    display: 'flex'
                  }}>
                    <div style={{
                      width: `${(stats.completed / stats.total) * 100}%`,
                      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      transition: 'width 0.5s ease'
                    }}>
                      {stats.completed > 0 && `${Math.round((stats.completed / stats.total) * 100)}%`}
                    </div>
                    <div style={{
                      width: `${(stats.cancelled / stats.total) * 100}%`,
                      background: 'linear-gradient(135deg, #f56565 0%, #c53030 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {stats.cancelled > 0 && `${Math.round((stats.cancelled / stats.total) * 100)}%`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '15px', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '20px', height: '20px', background: '#43e97b', borderRadius: '4px' }}></div>
                      <span>Выполнено</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '20px', height: '20px', background: '#f56565', borderRadius: '4px' }}></div>
                      <span>Отменено</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}