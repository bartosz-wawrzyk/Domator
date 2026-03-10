import { useState, useEffect } from 'react';
import Logo    from '../components/Logo';
import UserMenu from '../components/profile/UserMenu';
import * as userApi from '../api/user';
import '../assets/styles/dashboard.css';

const menuConfig = [
  { id: 'pojazdy', label: 'Pojazdy' },
  { id: 'finanse', label: 'Finanse' },
  { id: 'kredyty', label: 'Kredyty' },
  { id: 'planer',  label: 'Planer posiłków' },
];

function DashboardLayout({ children, onLogout, onMenuSelect, activeMenu }) {
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [userLogin, setUserLogin] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await userApi.getMe();
      if (res.ok) setUserLogin(res.data.login);
    };
    fetchUser();
  }, []);

  const handleLogoClick = () => {
    onMenuSelect?.('');
    setMenuOpen(false);
  };

  const handleMenuClick = (id) => {
    onMenuSelect?.(id);
    setMenuOpen(false);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo-section" onClick={handleLogoClick}>
            <Logo />
            <span className="app-name">DOMATOR</span>
          </div>

          <nav className={`menu-section ${menuOpen ? 'active' : ''}`}>
            {menuConfig.map((item) => (
              <div
                key={item.id}
                className={`menu-item ${activeMenu === item.id ? 'active' : ''}`}
                onClick={() => handleMenuClick(item.id)}
              >
                {item.label}
              </div>
            ))}
          </nav>
        </div>

        <div className="header-right">
          <UserMenu
            userLogin={userLogin}
            onProfile={() => handleMenuClick('profile')}
            onLogout={onLogout}
          />

          <div
            className="hamburger-btn"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </div>
        </div>
      </header>

      <main className="dashboard-content">{children}</main>

      <footer className="dashboard-footer">
        Domator &copy; {new Date().getFullYear()} — System Zarządzania Domem
      </footer>
    </div>
  );
}

export default DashboardLayout;