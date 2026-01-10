import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
  const context = useContext(AuthContext);

  if (!context) return <Navigate to="/login" />;

  const { user, loading } = context;

  if (loading) return <p>Ładowanie...</p>;

  if (!user) return <Navigate to="/login" />;

  return children;
}
