import { useNavigate } from 'react-router-dom';

export default function Sidebar({ title, menuItems, activeSection, onSectionChange }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('courier_id');
    // или
    sessionStorage.clear();
    navigate('/');
  };

  return (
    <aside className="sidebar">
      <h2>{title}</h2>
      <nav>
        <ul>
          {menuItems.map((item, index) => (
            <li key={index}>
              <button
                onClick={() => onSectionChange(item.section)}
                className={activeSection === item.section ? 'active' : ''}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <button onClick={handleLogout} className="logout-btn">
        🚪 Выйти
      </button>
    </aside>
  );
}