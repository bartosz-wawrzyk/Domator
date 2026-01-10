import React, { useState, useRef, useEffect } from 'react';
import Logo from '../components/Logo';
import '../assets/styles/dashboard.css';

const menuConfig = [
  { id: 'auto', label: 'Auto' },
  { id: 'finanse', label: 'Finanse' },
  { id: 'kredyty', label: 'Kredyty' },
  { id: 'planer', label: 'Planer posiłków' },
];

const profileOptions = [
  { id: 'myProfile', label: 'Mój profil' },
  { id: 'settings', label: 'Ustawienia' },
  { id: 'logout', label: 'Wyloguj' },
];

function DashboardLayout({ children, onLogout, onMenuSelect, activeMenu }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoClick = () => {
    onMenuSelect?.('');
    setMenuOpen(false);
  };

  const handleMenuClick = (id) => {
    onMenuSelect?.(id);
    setMenuOpen(false);
  };

  const handleProfileOption = (id) => {
    if (id === 'logout') {
      onLogout();
    }
    setProfileOpen(false);
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
          <div className="profile-menu" ref={profileRef}>
            <div
              className="menu-item"
              onClick={() => setProfileOpen((prev) => !prev)}
            >
              Profil
            </div>

            {profileOpen && (
              <div className="submenu">
                {profileOptions.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => handleProfileOption(opt.id)}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>

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
