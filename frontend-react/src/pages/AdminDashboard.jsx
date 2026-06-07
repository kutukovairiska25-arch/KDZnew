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
  },
  {
    "courier_id": 2,
    "courier_type": "foot",
    "regions": [1],
    "working_hours": ["10:00-16:00"]
  }
]`);

const [ordersImport, setOrdersImport] = useState(`[
  {
    "order_id": 1,
    "weight": 2.5,
    "region": 1,
    "delivery_hours": ["10:00-12:00"]
  },
  {
    "order_id": 2,
    "weight": 1.0,
    "region": 2,
    "delivery_hours": ["14:00-16:00"]
  },
  {
    "order_id": 3,
    "weight": 3.7,
    "region": 1,
    "delivery_hours": ["09:00-11:00"]
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
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');

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
      await api.post('/couriers', { data: parsedData });
      alert('Курьеры успешно импортированы');
      setCouriersImport('');
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
      await api.post('/orders', { data: parsedData });
      alert('Заказы успешно импортированы');
      setOrdersImport('');
      loadOrders();
    } catch (e) {
      alert('Ошибка: ' + e.message);
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