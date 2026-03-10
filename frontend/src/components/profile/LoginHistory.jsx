import { useState, useEffect } from 'react';
import * as userApi from '../../api/user';

const ACTION_ICONS = {
  LOGIN:    '🔐',
  LOGOUT:   '🚪',
  DEFAULT:  '📋',
};

function LoginHistory() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const res = await userApi.getActivity(50);
      if (res.ok) {
        setActivity(res.data);
      } else {
        setError('Nie udało się pobrać historii aktywności.');
      }
      setLoading(false);
    };

    fetch();
  }, []);

  const formatDate = (iso) =>
    new Date(iso).toLocaleString('pl-PL', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });

  const parseUA = (ua) => {
    if (!ua) return '—';
    if (/Chrome/i.test(ua))  return 'Chrome';
    if (/Firefox/i.test(ua)) return 'Firefox';
    if (/Safari/i.test(ua))  return 'Safari';
    if (/Edge/i.test(ua))    return 'Edge';
    return ua.slice(0, 40) + '…';
  };

  if (loading) return <div className="profile-loading">Ładowanie historii...</div>;
  if (error)   return <div className="profile-alert error">{error}</div>;

  return (
    <div className="profile-card">
      <p className="profile-card-label">Historia aktywności ({activity.length})</p>

      {activity.length === 0 ? (
        <div className="profile-empty">Brak zapisanej aktywności.</div>
      ) : (
        <div className="activity-list">
          {activity.map((item, i) => {
            const isSuccess = item.status === 'SUCCESS';
            const icon = ACTION_ICONS[item.action] ?? ACTION_ICONS.DEFAULT;

            return (
              <div key={i} className="activity-item">
                <div className={`activity-icon ${isSuccess ? 'success' : 'failed'}`}>
                  {icon}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div className="activity-action">
                    {item.action}
                    <span className={`activity-status ${isSuccess ? 'success' : 'failed'}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="activity-meta">
                    {item.ip_address}
                    {item.location && item.location !== 'Unknown' ? ` · ${item.location}` : ''}
                    {' · '}
                    {parseUA(item.user_agent)}
                  </div>
                </div>

                <div className="activity-timestamp">
                  {formatDate(item.timestamp)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LoginHistory;