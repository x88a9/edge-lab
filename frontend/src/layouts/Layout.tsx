import Sidebar from './Sidebar';
import Topbar from './Topbar';
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { token } = useAuth();
  const isLogin = location.pathname === '/login';
  const showChrome = !!token && !isLogin;
  if (!showChrome) {
    return (
      <div className="min-h-screen bg-surface text-text">
        <main className="p-4">{children}</main>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-surface text-text grid grid-cols-[260px_1fr]">
      <Sidebar />
      <div className="flex flex-col border-l border-neutral-800">
        <Topbar />
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}
