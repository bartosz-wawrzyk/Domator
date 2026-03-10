import { useState } from 'react';
import * as userApi from '../../api/user';

function ChangePassword() {
  const [form, setForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success'|'error', msg: string }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setAlert(null);
  };

  const validate = () => {
    if (!form.old_password) return 'Podaj aktualne hasło.';
    if (form.new_password.length < 8) return 'Nowe hasło musi mieć co najmniej 8 znaków.';
    if (form.new_password !== form.confirm_password) return 'Nowe hasła nie są identyczne.';
    if (form.old_password === form.new_password) return 'Nowe hasło musi być inne niż aktualne.';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setAlert({ type: 'error', msg: validationError });
      return;
    }

    setLoading(true);
    const res = await userApi.changePassword({
      old_password: form.old_password,
      new_password: form.new_password,
    });
    setLoading(false);

    if (res.ok) {
      setAlert({ type: 'success', msg: 'Hasło zostało zmienione.' });
      setForm({ old_password: '', new_password: '', confirm_password: '' });
    } else {
      const detail = res.data?.detail || 'Zmiana hasła nie powiodła się.';
      setAlert({ type: 'error', msg: detail });
    }
  };

  const passwordStrength = (pw) => {
    if (!pw) return null;
    let score = 0;
    if (pw.length >= 8)  score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { label: 'Słabe',    color: '#ff5252' };
    if (score <= 3) return { label: 'Średnie',  color: '#ffb700' };
    return              { label: 'Silne',    color: '#42e695' };
  };

  const strength = passwordStrength(form.new_password);

  return (
    <div className="profile-card">
      <p className="profile-card-label">Zmiana hasła</p>
      <div className="profile-form">
        <div className="profile-form-group">
          <label className="profile-form-label">Aktualne hasło</label>
          <input
            className="profile-input"
            type="password"
            name="old_password"
            value={form.old_password}
            onChange={handleChange}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        <div className="profile-form-group">
          <label className="profile-form-label">Nowe hasło</label>
          <input
            className="profile-input"
            type="password"
            name="new_password"
            value={form.new_password}
            onChange={handleChange}
            placeholder="Minimum 8 znaków"
            autoComplete="new-password"
          />
          {strength && (
            <span style={{ fontSize: '0.75rem', color: strength.color, marginTop: '4px' }}>
              Siła hasła: {strength.label}
            </span>
          )}
        </div>

        <div className="profile-form-group">
          <label className="profile-form-label">Powtórz nowe hasło</label>
          <input
            className="profile-input"
            type="password"
            name="confirm_password"
            value={form.confirm_password}
            onChange={handleChange}
            placeholder="••••••••"
            autoComplete="new-password"
          />

          {form.confirm_password && form.new_password !== form.confirm_password && (
            <span style={{ fontSize: '0.75rem', color: '#ff5252', marginTop: '4px' }}>
              Hasła nie są identyczne
            </span>
          )}
        </div>

        <button
          className="profile-btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Zapisywanie...' : 'Zmień hasło'}
        </button>

        {alert && (
          <div className={`profile-alert ${alert.type}`}>{alert.msg}</div>
        )}
      </div>
    </div>
  );
}

export default ChangePassword;