'use client';

import { Bell, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Header({
  title,
  onMenuClick,
}: {
  title: string;
  onMenuClick: () => void;
}) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        // Ignore malformed session data.
      }
    }
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl print:hidden">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          onClick={onMenuClick}
          className="icon-btn lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Sharvic Micro-Finance
          </p>
          <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <span className="hidden text-xs font-medium text-slate-400 xl:block">
            {today}
          </span>

          <button className="icon-btn relative" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1 pl-1 pr-2.5 shadow-sm sm:pr-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden leading-tight sm:block">
              <p className="max-w-[9rem] truncate text-xs font-semibold text-slate-900">
                {user?.fullName || 'User'}
              </p>
              <p className="text-[10px] capitalize text-slate-500">
                {user?.role?.replace(/_/g, ' ') || 'Staff'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
