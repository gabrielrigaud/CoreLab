import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>CoreLab Admin</h2>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            Tableau de bord
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            Étudiants & Cohortes
          </NavLink>
          <NavLink to="/admin/courses" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            Cours & Contenus
          </NavLink>
          <NavLink to="/admin/grades" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            Notes & Résultats
          </NavLink>
        </nav>
        
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            Se déconnecter
          </button>
        </div>
      </aside>
      
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
