import { useState, useRef, useEffect } from 'react';

function UserMenu({ userLogin, onProfile, onLogout }) {
  const [open, setOpen] = useState(false);
  const wrapperRef      = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleProfile = () => {
    setOpen(false);
    onProfile?.();
  };

  const handleLogout = () => {
    setOpen(false);
    onLogout?.();
  };

  return (
    <div className="user-menu-wrapper" ref={wrapperRef}>
      <button
        className={`user-menu-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {userLogin ?? 'Konto'}
        <span className="chevron">▾</span>
      </button>

      {open && (
        <div className="user-menu-dropdown" role="menu">
          <div className="user-menu-item" onClick={handleProfile} role="menuitem">
            👤 Profil
          </div>
          <div className="user-menu-divider" />
          <div className="user-menu-item danger" onClick={handleLogout} role="menuitem">
            🚪 Wyloguj
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMenu;