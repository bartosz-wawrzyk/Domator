import { useState, useEffect } from 'react';
import * as userApi from '../../api/user';

function AccountInfo() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAccount = async () => {
      setLoading(true);
      const res = await userApi.getMeAccount();
      if (res.ok) {
        setAccount(res.data);
      } else {
        setError('Nie udało się pobrać danych konta.');
      }
      setLoading(false);
    };

    fetchAccount();
  }, []);

  if (loading) return <div className="profile-loading">Ładowanie danych...</div>;
  if (error)   return <div className="profile-alert error">{error}</div>;
  if (!account) return null;

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('pl-PL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <>
      <div className="profile-card">
        <p className="profile-card-label">Dane podstawowe</p>
        <div className="profile-data-grid">
          <div className="profile-data-item">
            <div className="profile-data-item-label">Login</div>
            <div className="profile-data-item-value">{account.login}</div>
          </div>
          <div className="profile-data-item">
            <div className="profile-data-item-label">E-mail</div>
            <div className="profile-data-item-value">{account.email}</div>
          </div>
        </div>
      </div>

      <div className="profile-card">
        <p className="profile-card-label">Status konta</p>
        <div className="profile-data-grid">
          <div className="profile-data-item">
            <div className="profile-data-item-label">Aktywność</div>
            <div className="profile-data-item-value">
              <span className={`profile-badge ${account.is_active ? 'status-active' : 'unverified'}`}>
                {account.is_active ? 'Aktywne' : 'Nieaktywne'}
              </span>
            </div>
          </div>
          <div className="profile-data-item">
            <div className="profile-data-item-label">Weryfikacja e-mail</div>
            <div className="profile-data-item-value">
              <span className={`profile-badge ${account.is_verified ? 'verified' : 'unverified'}`}>
                {account.is_verified ? 'Zweryfikowany' : 'Niezweryfikowany'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-card">
        <p className="profile-card-label">Daty</p>
        <div className="profile-data-grid">
          <div className="profile-data-item">
            <div className="profile-data-item-label">Data rejestracji</div>
            <div className="profile-data-item-value">{formatDate(account.created_at)}</div>
          </div>
          <div className="profile-data-item">
            <div className="profile-data-item-label">Ostatnia aktualizacja</div>
            <div className="profile-data-item-value">{formatDate(account.updated_at)}</div>
          </div>
          <div className="profile-data-item">
            <div className="profile-data-item-label">Ostatnie logowanie</div>
            <div className="profile-data-item-value">{formatDate(account.last_login_at)}</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AccountInfo;