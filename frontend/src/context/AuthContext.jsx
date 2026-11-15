import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('stip_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/api/users/me')
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem('stip_token'))
      .finally(() => setLoading(false));
  }, []);

  const handleAuthSuccess = (data) => {
    localStorage.setItem('stip_token', data.token);
    setUser({ username: data.username, email: data.email, role: data.role });
  };

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    handleAuthSuccess(res.data);
  };

  const register = async (username, email, password) => {
    const res = await api.post('/api/auth/register', { username, email, password });
    handleAuthSuccess(res.data);
  };

  const logout = () => {
    localStorage.removeItem('stip_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);