'use client';
import { Bell, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Header({ title }: { title: string }) {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
  }, []);
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <div className="flex items-center flex-1">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="flex items-center space-x-4">
        <button className="p-2 text-gray-400 hover:text-gray-500">
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">{user?.fullName?.charAt(0) || 'U'}</span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900">{user?.fullName || 'User'}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
