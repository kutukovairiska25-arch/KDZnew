import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import Sidebar from '../components/Sidebar';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('couriers');
  const [couriers, setCouriers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [couriersImport, setCouriersImport] = useState(`[
  {
    "courier_id": 1,
    "courier_type": "bike",
    "regions": [1, 2],
    "working_hours": ["09:00-18:00"]
  }
]`);

const [ordersImport, setOrdersImport] = useState(`[
  {
    "order_id": 1,
    "weight": 2.5,
    "region": 1,
    "delivery_hours": ["10:00-12:00"]
  }
]`);
  const [editingCourier, setEditingCourier] = useState(null);
  const [editForm, setEditForm] = useState({
    courier_type: '',
    regions: '',
    working_hours: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
      const token = sessionStorage.getItem('access_token');
      const role = sessionStorage.getItem('role');
      if (!token || role !== 'admin') {
        navigate('/');
        return;
      }
      loadCouriers();
      loadOrders();
  }, []);

  const loadCouriers = async () => {
    try {
      const data = await api.get('/couriers');
      setCouriers(data);
    } catch (error) {
      alert('Ошибка загрузки курьеров: ' + error.message);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await api.get('/orders');
      setOrders(data);
    } catch (error) {
      alert('Ошибка загрузки заказов: ' + error.message);
    }
  };

  const handleImportCouriers = async () => {
      if (!couriersImport.trim()) {
        alert('Введите JSON с данными курьеров');
        return;
      }

      try {
        const parsedData = JSON.parse(couriersImport);

        // Проверка времени работы на фронтенде
        for (const courier of parsedData) {
          if (courier.working_hours) {
            for (const hours of courier.working_hours) {
              const [start, end] = hours.split('-');
              const [startHour, startMinute] = start.split(':').map(Number);
              const [endHour, endMinute] = end.split(':').map(Number);

              if (startHour < 7  || endHour > 22 || (endHour === 22 && endMinute > 0)) {
                alert(`Ошибка для курьера #${courier.courier_id}: курьеры могут работать только с 07:00 до 22:00`);
                return;
              }
            }
          }
        }

        await api.post('/couriers', { data: parsedData });
        alert('Курьеры успешно импортированы');
        loadCouriers();
      } catch (e) {
        alert('Ошибка: ' + e.message);
      }
  };

  const handleImportOrders = async () => {
      if (!ordersImport.trim()) {
        alert('Введите JSON с данными заказов');
        return;
      }

      try {
        const parsedData = JSON.parse(ordersImport);

        // Проверка времени доставки на фронтенде
        // Рабочее время курьеров: 07:00-22:00
        const WORK_START = 7 * 60;  // 420 минут
        const WORK_END = 22 * 60;   // 1320 минут

        for (const order of parsedData) {
          if (order.delivery_hours) {
            for (const hours of order.delivery_hours) {
              const [start, end] = hours.split('-');
              const [startHour, startMinute] = start.split(':').map(Number);
              const [endHour, endMinute] = end.split(':').map(Number);

              const startTotal = startHour * 60 + startMinute;
              const endTotal = endHour * 60 + endMinute;

              // Проверка пересечения с рабочим временем [07:00, 22:00]
              // Пересечение есть, если: start < 22:00 AND end > 07:00
              if (startTotal >= WORK_END || endTotal <= WORK_START) {
                alert(`Ошибка для заказа #${order.order_id}: время доставки "${hours}" не пересекается с рабочим временем курьеров (07:00-22:00). Курьеры не смогут доставить заказ в этот интервал.`);
                return;
              }
            }
          }
        }

        await api.post('/orders', { data: parsedData });
        alert('Заказы успешно импортированы');
        loadOrders();
      } catch (e) {
        alert('Ошибка: ' + e.message);
      }
  };


    const handleDeleteOrder = async (orderId) => {
      if (!confirm(`Удалить заказ #${orderId}? Это действие нельзя отменить.`)) {
        return;
      }

      try {
        await api.delete(`/orders/${orderId}`);
        alert(`Заказ #${orderId} удалён`);
        loadOrders();
      } catch (error) {
        alert('Ошибка удаления заказа: ' + error.message);
      }
    };
  const handleEditCourier = (courier) => {
    setEditingCourier(courier);
    setEditForm({
      courier_type: courier.courier_type,
      regions: courier.regions.join(', '),
      working_hours: courier.working_hours.join(', ')
    });
  };

  const handleCloseModal = () => {
    setEditingCourier(null);
  };

  const handleSaveCourier = async (e) => {
    e.preventDefault();

    const regionsArray = editForm.regions
      .split(',')
      .map(r => parseInt(r.trim()))
      .filter(r => !isNaN(r));

    const hoursArray = editForm.working_hours
      .split(',')
      .map(h => h.trim())
      .filter(h => h);

    try {
      await api.patch(`/couriers/${editingCourier.courier_id}`, {
        courier_type: editForm.courier_type,
        regions: regionsArray,
        working_hours: hoursArray,
      });

      alert('Данные курьера обновлены');
      handleCloseModal();
      loadCouriers();
    } catch (error) {
      alert('Ошибка обновления: ' + error.message);
    }
  };

  const menuItems = [
    { section: 'couriers', label: '👥 Курьеры' },
    { section: 'orders', label: '📦 Заказы' },
    { section: 'import', label: '📥 Импорт данных' },
  ];

  return (
    <div className="admin-page">
      <Sidebar
        title="🍬 Candy Admin"
        menuItems={menuItems}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <main className="main-content">
        {activeSection === 'couriers' && (
          <section>
            <h1>Курьеры</h1>
            <div className="glass-card">
              {couriers.length === 0 ? (
                <div className="empty-state">
                  <p>Нет курьеров. Импортируйте данные в разделе "Импорт данных"</p>
                </div>
              ) : (
                <table className="glass-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Тип</th>
                      <th>Регионы</th>
                      <th>Часы работы</th>
                      <th>Рейтинг</th>
                      <th>Заработок</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {couriers.map(courier => (
                      <tr key={courier.courier_id}>
                        <td>{courier.courier_id}</td>
                        <td>{courier.courier_type}</td>
                        <td>{courier.regions.join(', ')}</td>
                        <td>{courier.working_hours.join(', ')}</td>
                        <td>{courier.rating || '-'}</td>
                        <td>{courier.earnings || 0} ₽</td>
                        <td>
                          <button
                            className="action-btn"
                            onClick={() => handleEditCourier(courier)}
                          >
                            ✏️ Редактировать
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {activeSection === 'orders' && (
          <section>
            <h1>Заказы</h1>
            <div className="glass-card">
              {orders.length === 0 ? (
                <div className="empty-state">
                  <p>Нет заказов. Импортируйте данные в разделе "Импорт данных"</p>
                </div>
              ) : (
                <table className="glass-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Вес</th>
                      <th>Регион</th>
                      <th>Статус</th>
                      <th>Курьер</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.order_id}>
                        <td>{order.order_id}</td>
                        <td>{order.weight} кг</td>
                        <td>{order.region}</td>
                        <td>{order.status}</td>
                        <td>{order.assigned_courier_id || '-'}</td>
                        <td>
                          <button
                            onClick={() => handleDeleteOrder(order.order_id)}
                            className="action-btn"
                            style={{
                              background: 'linear-gradient(135deg, #FF6B9D 0%, #FF8FB1 100%)'
                            }}
                          >
                            🗑️ Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {activeSection === 'import' && (
          <section>
            <h1>Импорт данных</h1>
            <div className="import-container">
              <div className="import-block">
                <h3>📥 Импорт курьеров</h3>
                <textarea
                  value={couriersImport}
                  onChange={(e) => setCouriersImport(e.target.value)}
                  placeholder='Введите JSON с курьерами...'
                />
                <button
                  onClick={handleImportCouriers}
                  className="import-btn"
                >
                  Импортировать курьеров
                </button>
              </div>

              <div className="import-block">
                <h3>📥 Импорт заказов</h3>
                <textarea
                  value={ordersImport}
                  onChange={(e) => setOrdersImport(e.target.value)}
                  placeholder='Введите JSON с заказами...'
                />
                <button
                  onClick={handleImportOrders}
                  className="import-btn"
                >
                  Импортировать заказы
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {editingCourier && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Редактирование курьера #{editingCourier.courier_id}</h3>
            <form onSubmit={handleSaveCourier}>
              <div className="form-group">
                <label>Тип курьера:</label>
                <select
                  value={editForm.courier_type}
                  onChange={(e) => setEditForm({...editForm, courier_type: e.target.value})}
                  required
                >
                  <option value="foot">Пеший</option>
                  <option value="bike">Велосипед</option>
                  <option value="car">Автомобиль</option>
                </select>
              </div>

              <div className="form-group">
                <label>Регионы (через запятую):</label>
                <input
                  type="text"
                  value={editForm.regions}
                  onChange={(e) => setEditForm({...editForm, regions: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Рабочие часы (через запятую):</label>
                <input
                  type="text"
                  value={editForm.working_hours}
                  onChange={(e) => setEditForm({...editForm, working_hours: e.target.value})}
                  required
                />
              </div>

              <div className="modal-buttons">
                <button type="submit" className="btn-primary">
                  💾 Сохранить
                </button>
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}