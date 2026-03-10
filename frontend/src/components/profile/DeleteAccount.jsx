import { useState } from 'react';
import * as userApi from '../../api/user';

function DeleteAccount({ onLogout }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  const handleDeactivate = async () => {
    setLoading(true);
    setError(null);

    const res = await userApi.deactivateAccount();

    if (res.ok) {
      onLogout?.();
    } else {
      setError(res.data?.detail || 'Nie udało się dezaktywować konta. Spróbuj ponownie.');
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <div className="profile-danger-zone">
        <p className="profile-card-label">Strefa niebezpieczna</p>
        <p className="profile-danger-desc">
          Dezaktywacja konta jest operacją nieodwracalną. Utracisz dostęp do wszystkich
          danych powiązanych z Twoim kontem. Upewnij się, że na pewno chcesz to zrobić.
        </p>
        <button
          className="profile-btn-danger"
          onClick={() => setShowConfirm(true)}
        >
          🗑 Dezaktywuj konto
        </button>

        {error && (
          <div className="profile-alert error" style={{ marginTop: '14px' }}>{error}</div>
        )}
      </div>

      {showConfirm && (
        <div className="profile-confirm-overlay">
          <div className="profile-confirm-box">
            <h3>⚠️ Jesteś pewien?</h3>
            <p>
              Ta operacja <strong>dezaktywuje Twoje konto</strong> i nie można jej cofnąć.
              Wszystkie dane zostaną zablokowane. Zostaniesz automatycznie wylogowany.
            </p>
            <div className="profile-confirm-actions">
              <button
                className="profile-confirm-cancel"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
              >
                Anuluj
              </button>
              <button
                className="profile-btn-danger"
                onClick={handleDeactivate}
                disabled={loading}
              >
                {loading ? 'Dezaktywuję...' : 'Tak, dezaktywuj'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DeleteAccount;