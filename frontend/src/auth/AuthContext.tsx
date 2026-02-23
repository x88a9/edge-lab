import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '../api/apiClient';

interface AuthContextValue {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  currentUser: { email?: string; is_admin?: boolean } | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  });
  const [currentUser, setCurrentUser] = useState<{ email?: string; is_admin?: boolean } | null>(null);

  useEffect(() => {
    try {
      if (token) localStorage.setItem('token', token);
      else localStorage.removeItem('token');
    } catch {}
  }, [token]);

  useEffect(() => {
    async function fetchMe() {
      if (!token) { setCurrentUser(null); return; }
      try {
        const { data } = await apiClient.get('/auth/me');
        setCurrentUser({ email: data?.email, is_admin: !!data?.is_admin });
      } catch {
        setCurrentUser(null);
      }
    }
    fetchMe();
  }, [token]);

  const login = (t: string) => {
    try { localStorage.setItem('token', t); } catch {}
    setToken(t);
  };

  const logout = () => {
    setToken(null);
    try { localStorage.removeItem('token'); } catch {}
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  };

  const value = useMemo(() => ({ token, login, logout, currentUser }), [token, currentUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// Protected route wrapper: redirect to /login if no token
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) {
    // Use hard redirect to avoid any flicker
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return null;
  }
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, currentUser } = useAuth();
  const isAdmin = !!token && !!currentUser?.is_admin;
  if (!isAdmin) return null;
  return <>{children}</>;
}
