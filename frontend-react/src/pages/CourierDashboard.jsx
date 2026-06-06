import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import Sidebar from '../components/Sidebar';

export default function CourierDashboard() {
  const [activeSection, setActiveSection] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
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
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.get(`/couriers/${courierId}`);
      setProfile(data);
    } catch (error) {
      alert('Ошибка загрузки профиля: ' + error.message);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await api.get(`/couriers/${courierId}/orders`);
      const assignedOrders = data.filter(order => order.status === 'assigned');
      setOrders(assignedOrders);
    } catch (error) {
      alert('Ошибка загрузки заказов: ' + error.message);
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
    } catch (error) {
      alert('Ошибка завершения заказа: ' + error.message);
    }
  };

  const menuItems = [
    { section: 'profile', label: 'Профиль' },
    { section: 'orders', label: 'Мои заказы' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        title="Candy Courier"
        menuItems={menuItems}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <main style={{ flex: 1, padding: '30px', backgroundColor: '#f4f6f9' }}>
        {activeSection === 'profile' && profile && (
          <section>
            <h1>Профиль курьера</h1>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', marginTop: '20px' }}>
              <p style={{ marginBottom: '10px' }}><strong>ID:</strong> {profile.courier_id}</p>
              <p style={{ marginBottom: '10px' }}><strong>Тип:</strong> {profile.courier_type}</p>
              <p style={{ marginBottom: '10px' }}><strong>Рейтинг:</strong> {profile.rating || '-'}</p>
              <p style={{ marginBottom: '10px' }}><strong>Заработок:</strong> {profile.earnings || 0} ₽</p>
            </div>
            <button
              onClick={handleGetOrders}
              style={{ padding: '12px 24px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
            >
              Получить заказы
            </button>
          </section>
        )}

        {activeSection === 'orders' && (
          <section>
            <h1>Мои заказы</h1>
            {orders.length === 0 ? (
              <p style={{ textAlign: 'center', marginTop: '20px' }}>Нет назначенных заказов</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', marginTop: '20px' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>ID</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Вес</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Регион</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Время доставки</th>
                    <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.order_id}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{order.order_id}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{order.weight} кг</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{order.region}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{order.delivery_hours || '-'}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                        <button
                          onClick={() => handleCompleteOrder(order.order_id)}
                          style={{ padding: '8px 16px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Завершить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}
      </main>
    </div>
  );
}