import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import Logo from '../components/Logo';
import '../assets/styles/auth.css';
import AuthLayout from '../layouts/AuthLayout';
import { Link } from 'react-router-dom';

function Login() {
  const { login } = useContext(AuthContext);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Domator – Logowanie';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const result = await login({ identifier, password });

    if (!result.ok) {
      setError('Nieprawidłowy login lub hasło');
      return;
    }
  };

  return (
    <AuthLayout>
      <div className="auth-box">
        <Logo />
        <div className="app-name">Domator</div>
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <Input
            placeholder="Login lub email"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {error && <div className="auth-error">{error}</div>}
          <Button type="submit">Zaloguj</Button>
        </form>
        <div className="link">
          Nie masz konta? <Link to="/register">Zarejestruj się</Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export default Login;
