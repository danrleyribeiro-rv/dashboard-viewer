import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '@/lib/api/client';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  isClient: boolean | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  isClient: null,
  loading: true,
  login: async () => ({ id: '', email: '', role: '' }),
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    setUser(null);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const result = await authApi.login(email, password);
    localStorage.setItem('auth_token', result.token);
    setUser(result.user);
    return result.user;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }

    authApi.me()
      .then((userData) => {
        setUser(userData);
      })
      .catch(() => {
        localStorage.removeItem('auth_token');
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const userRole = user?.role ?? null;
  const isClient = user ? user.role === 'client' : null;

  return (
    <AuthContext.Provider value={{ user, userRole, isClient, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
