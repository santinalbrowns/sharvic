'use client';

import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export default function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-72">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-[1600px] animate-fade-in px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
