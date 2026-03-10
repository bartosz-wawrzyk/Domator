import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
  const context = useContext(AuthContext);

  if (!context) return <Navigate to="/login" replace />;

  const { user, loading, sessionExpired } = context;

  if (loading) return <p>Ładowanie...</p>;

  if (!user) {
    return <Navigate to={sessionExpired ? '/login?expired=1' : '/login'} replace />;
  }

  return children;
}