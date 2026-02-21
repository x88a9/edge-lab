import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface AuthContextValue {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
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

  useEffect(() => {
    try {
      if (token) localStorage.setItem('token', token);
      else localStorage.removeItem('token');
    } catch {}
  }, [token]);

  const login = (t: string) => {
    setToken(t);
  };

  const logout = () => {
    setToken(null);
    try { localStorage.removeItem('token'); } catch {}
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  };

  const value = useMemo(() => ({ token, login, logout }), [token]);

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