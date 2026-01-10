import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import Button from '../components/Button';
import Input from '../components/Input';
import { registerUser } from '../api/http';
import '../assets/styles/auth.css';
import AuthLayout from '../layouts/AuthLayout';

function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Domator – Rejestracja';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await registerUser({ email, login, password });
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Błąd rejestracji');
    }
  };

  return (
    <AuthLayout>
      <div className="auth-box">
        <Logo />
        <div className="app-name">Domator</div>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <Input
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <Input
            placeholder="Login"
            value={login}
            onChange={e => setLogin(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          {error && (
            <div className="auth-error">
              Nie udało się utworzyć konta. Sprawdź dane i spróbuj ponownie.
            </div>
          )}

          <Button type="submit">Zarejestruj</Button>
        </form>

        <div className="link">
          Masz konto? <a href="/login">Zaloguj się</a>
        </div>
      </div>
    </AuthLayout>
  );
}

export default Register;
