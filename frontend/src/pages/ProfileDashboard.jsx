import { useState, useEffect } from 'react';
import AccountInfo    from '../components/profile/AccountInfo';
import ChangePassword from '../components/profile/ChangePassword';
import LoginHistory   from '../components/profile/LoginHistory';
import DeleteAccount  from '../components/profile/DeleteAccount';
import * as userApi   from '../api/user';
import '../assets/styles/profile.css';

const TABS = [
  { id: 'account',  label: '👤 Dane konta' },
  { id: 'password', label: '🔑 Zmiana hasła' },
  { id: 'history',  label: '📋 Historia logowania' },
  { id: 'delete',   label: '🗑 Kasowanie konta' },
];

function ProfileDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('account');
  const [userLogin, setUserLogin] = useState(null);

  useEffect(() => {
    document.title = 'Domator – Profil';
    const fetch = async () => {
      const res = await userApi.getMe();
      if (res.ok) setUserLogin(res.data.login);
    };
    fetch();
  }, []);

  const initial = userLogin ? userLogin[0].toUpperCase() : '?';

  return (
    <div className="profile-page-container">

      <div className="profile-page-header">
        <div className="profile-header-info">
          <div className="profile-avatar">{initial}</div>
          <div>
            <h2>{userLogin ?? '...'}</h2>
            <p>Ustawienia konta</p>
          </div>
        </div>
      </div>

      <div className="profile-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`profile-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="profile-page-content">
        {activeTab === 'account'  && <AccountInfo />}
        {activeTab === 'password' && <ChangePassword />}
        {activeTab === 'history'  && <LoginHistory />}
        {activeTab === 'delete'   && <DeleteAccount onLogout={onLogout} />}
      </div>

    </div>
  );
}

export default ProfileDashboard;