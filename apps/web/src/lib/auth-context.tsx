'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, AuthUser } from './api';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (phone: string, pin: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

interface RegisterData {
  phone: string;
  pin: string;
  name: string;
  role: string;
  langPref?: string;
  address?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    const stored = localStorage.getItem('grv_token');
    if (!stored) { setLoading(false); return; }
    try {
      const me = await api.get<{ user: AuthUser }>('/api/v1/auth/me');
      setUser(me.user);
      setToken(stored);
    } catch {
      localStorage.removeItem('grv_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { bootstrap(); }, [bootstrap]);

  const login = async (phone: string, pin: string) => {
    const res = await api.post<{ user: AuthUser; token: string }>('/api/v1/auth/login', { phone, pin });
    localStorage.setItem('grv_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (data: RegisterData) => {
    const res = await api.post<{ user: AuthUser; token: string }>('/api/v1/auth/register', data);
    localStorage.setItem('grv_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('grv_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
