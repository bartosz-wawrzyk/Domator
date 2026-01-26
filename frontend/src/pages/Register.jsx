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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    document.title = 'Domator – Rejestracja';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !login.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Wszystkie pola muszą być wypełnione');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Podaj poprawny adres email');
      return;
    }

    if (password.length < 6) {
      setError('Hasło musi mieć minimum 6 znaków');
      return;
    }

    if (password !== confirmPassword) {
      setError('Hasło i potwierdzenie hasła muszą być takie same');
      return;
    }

    const result = await registerUser({ email, login, password });

    if (result.ok) {
      setSuccess('Konto zostało utworzone pomyślnie!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(result.data?.detail || 'Błąd rejestracji. Sprawdź dane.');
    }
  };

  return (
    <AuthLayout>
      <div className="auth-box">
        <Logo />
        <div className="app-name">Domator</div>

        <form onSubmit={handleSubmit} className="auth-form">
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
            isPassword={true}
            placeholder="Hasło"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <Input
            isPassword={true}
            placeholder="Potwierdź hasło"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

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