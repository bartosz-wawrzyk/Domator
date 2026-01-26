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
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.title = 'Domator – Logowanie';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()|| !password.trim()) {
      setError('Wszystkie pola muszą być wypełnione');
      return;
    }

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

        <form onSubmit={handleSubmit} className="auth-form">
          <Input
            placeholder="Login lub email"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
          />
          <Input
            isPassword={true}
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