import { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser as apiLogin, logout as apiLogout, refreshToken as apiRefreshToken, setAuthContext } from '../api/http';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    const currentRefreshToken = localStorage.getItem('refresh_token');
    if (currentRefreshToken) {
      try {
        await apiLogout(currentRefreshToken);
      } catch (err) {
        console.error("Błąd podczas wylogowywania w API", err);
      }
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');

    setUser(null);
    navigate('/login');
  }, [navigate]);

  const refresh = useCallback(async () => {
    const currentRefreshToken = localStorage.getItem('refresh_token');

    if (!currentRefreshToken) {
      await logout();
      return null;
    }

    try {
      const response = await apiRefreshToken(currentRefreshToken);
      
      if (!response.ok) {
        await logout();
        return null;
      }
      
      const { access_token, refresh_token } = response.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      setUser(prev => ({ ...prev, access_token, refresh_token }));
      
      return access_token;
    } catch (err) {
      await logout();
      return null;
    }
  }, [logout]);

  useEffect(() => {
    setAuthContext({ user, refresh });
  }, [user, refresh]);

  useEffect(() => {
    const access_token = localStorage.getItem('access_token');
    const refresh_token = localStorage.getItem('refresh_token');
    const user_id = localStorage.getItem('user_id');

    if (access_token && refresh_token && user_id) {
      setUser({ access_token, refresh_token, user_id });
    }
    
    setLoading(false);
  }, []);

  const login = async ({ identifier, password }) => {
    try {
      const result = await apiLogin({ identifier, password });

      if (!result.ok) {
        return { ok: false, data: result.data };
      }

      const { access_token, refresh_token, user_id } = result.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user_id', user_id);

      setUser({ access_token, refresh_token, user_id });

      navigate('/dashboard');
      return { ok: true, data: result.data };
    } catch (err) {
      return { ok: false, error: 'Błąd połączenia' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refresh, loading }}>
      {children}
    </AuthContext.Provider>
  );
}