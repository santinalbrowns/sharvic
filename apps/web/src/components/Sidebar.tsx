'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  CreditCard,
  Gauge,
  Landmark,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Receipt,
  Users,
  X,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Loans', href: '/loans', icon: CreditCard },
  { name: 'Savings', href: '/savings', icon: PiggyBank },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Credit Scores', href: '/scores', icon: Gauge },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
];

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
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

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  const role = user?.role?.replace(/_/g, ' ') || 'Staff';
  const initial = user?.fullName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950 text-slate-300 transition-transform duration-300 ease-out print:hidden lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/5 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-lg shadow-brand-600/30">
            <Landmark className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-white">
              Sharvic
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Micro-Finance
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">
            Workspace
          </p>
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' &&
                pathname?.startsWith(item.href + '/'));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition duration-150 ${
                  isActive
                    ? 'bg-white/10 text-white shadow-inner ring-1 ring-inset ring-white/10'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-400" />
                )}
                <item.icon
                  className={`h-5 w-5 flex-shrink-0 transition ${
                    isActive
                      ? 'text-brand-300'
                      : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/5 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 text-sm font-bold text-white">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {user?.fullName || 'User'}
              </p>
              <p className="truncate text-[11px] capitalize text-slate-400">
                {role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
