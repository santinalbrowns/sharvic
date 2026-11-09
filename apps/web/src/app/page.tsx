'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Landmark } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    router.replace(token ? '/dashboard' : '/login');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-2xl shadow-brand-600/40">
          <Landmark className="h-7 w-7 text-white" />
        </div>
        <div>
          <p className="text-lg font-semibold tracking-tight text-white">Sharvic Micro-Finance</p>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.22em] text-slate-500">
            Loading workspace
          </p>
        </div>
      </div>
    </div>
  );
}
