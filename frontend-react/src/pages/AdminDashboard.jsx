import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import Sidebar from '../components/Sidebar';

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('couriers');
  const [couriers, setCouriers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [couriersImport, setCouriersImport] = useState('');
  const [ordersImport, setOrdersImport] = useState('');
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

  const menuItems = [
    { section: 'couriers', label: 'Курьеры' },
    { section: 'orders', label: 'Заказы' },
    { section: 'import', label: 'Импорт данных' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        title="Candy Admin"
        menuItems={menuItems}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <main style={{ flex: 1, padding: '30px', backgroundColor: '#f4f6f9' }}>
        {activeSection === 'couriers' && (
          <section>
            <h1>Курьеры</h1>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', marginTop: '20px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Тип</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Регионы</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Часы</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Рейтинг</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Заработок</th>
                </tr>
              </thead>
              <tbody>
                {couriers.map(courier => (
                  <tr key={courier.courier_id}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{courier.courier_id}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{courier.courier_type}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{courier.regions.join(', ')}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{courier.working_hours.join(', ')}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{courier.rating || '-'}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{courier.earnings || 0} ₽</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeSection === 'orders' && (
          <section>
            <h1>Заказы</h1>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', marginTop: '20px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Вес</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Регион</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Статус</th>
                  <th style={{ padding: '12px', borderBottom: '2px solid #ddd', textAlign: 'left' }}>Курьер</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.order_id}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{order.order_id}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{order.weight} кг</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{order.region}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{order.status}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{order.assigned_courier_id || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeSection === 'import' && (
          <section>
            <h1>Импорт данных</h1>
            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
              <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
                <h3>Импорт курьеров</h3>
                <textarea
                  value={couriersImport}
                  onChange={(e) => setCouriersImport(e.target.value)}
                  placeholder='Введите JSON с курьерами...'
                  style={{ width: '100%', height: '200px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'monospace', marginTop: '10px' }}
                />
                <button
                  onClick={handleImportCouriers}
                  style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Импортировать курьеров
                </button>
              </div>

              <div style={{ flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
                <h3>Импорт заказов</h3>
                <textarea
                  value={ordersImport}
                  onChange={(e) => setOrdersImport(e.target.value)}
                  placeholder='Введите JSON с заказами...'
                  style={{ width: '100%', height: '200px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontFamily: 'monospace', marginTop: '10px' }}
                />
                <button
                  onClick={handleImportOrders}
                  style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Импортировать заказы
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}