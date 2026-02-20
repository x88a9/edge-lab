import Sidebar from './Sidebar';
import Topbar from './Topbar';
import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
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