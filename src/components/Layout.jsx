import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearSession, getStoredUser } from '../lib/api.js';

const navItems = [
  ['/', 'Overview', '▦'],
  ['/members', 'Members', '◎'],
  ['/loans', 'Loans', '₹'],
  ['/reports', 'Reports', '↗']
];

export default function Layout() {
  const navigate = useNavigate();
  const user = getStoredUser();

  function logout() {
    clearSession();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">₹</div>
          <div>
            <strong>EMI Desk</strong>
            <span>Loan tracker</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary navigation">
          {navItems.map(([to, label, icon]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span className="nav-icon" aria-hidden="true">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">S</div>
            <div className="user-copy">
              <strong>{user?.name || 'Staff User'}</strong>
              <span>{user?.email || 'staff@company.com'}</span>
            </div>
          </div>
          <button className="button ghost full" onClick={logout}>Sign out</button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
