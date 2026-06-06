import { useNavigate } from 'react-router-dom';

export default function Sidebar({ title, menuItems, activeSection, onSectionChange }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    localStorage.removeItem('courier_id');
    navigate('/');
  };

  return (
    <aside style={{ width: '250px', backgroundColor: '#2c3e50', color: 'white', padding: '20px', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: '30px', textAlign: 'center' }}>{title}</h2>
      <nav>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {menuItems.map((item, index) => (
            <li key={index} style={{ marginBottom: '10px' }}>
              <button
                onClick={() => onSectionChange(item.section)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: activeSection === item.section ? '#34495e' : 'transparent',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <button
        onClick={handleLogout}
        style={{ marginTop: '20px', width: '100%', padding: '10px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Выйти
      </button>
    </aside>
  );
}