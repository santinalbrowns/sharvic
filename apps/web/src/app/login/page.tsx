'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Landmark,
  Lock,
  Mail,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';

const highlights = [
  {
    icon: Users,
    title: 'One shared ledger',
    description: 'Members, savings and loans kept in sync for the whole group.',
  },
  {
    icon: TrendingUp,
    title: 'Smarter lending',
    description: 'Credit scores and savings-based limits guide every decision.',
  },
  {
    icon: ShieldCheck,
    title: 'Audit-ready records',
    description: 'Every contribution, repayment and expense is traceable.',
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-slate-950 p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.06),transparent_45%)]" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-lg shadow-brand-600/30">
              <Landmark className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-white">Sharvic</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Micro-Finance
              </p>
            </div>
          </div>

          <h1 className="mt-16 max-w-md text-4xl font-semibold leading-tight tracking-tight text-white">
            Banking that strengthens the whole community.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            A modern operating system for village banking groups — from the first
            contribution to the final repayment.
          </p>

          <div className="mt-12 space-y-5">
            {highlights.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/5 ring-1 ring-inset ring-white/10">
                  <item.icon className="h-4 w-4 text-brand-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-500">
          © {new Date().getFullYear()} Sharvic Micro-Finance Group. All rights reserved.
        </p>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-600/20">
                <Landmark className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight text-slate-900">Sharvic</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Micro-Finance
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6 sm:p-8">
            <div className="mb-6">
              <p className="eyebrow">Welcome back</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                Sign in to your workspace
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Use the account provided by your group administrator.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && <div className="alert-danger">{error}</div>}

              <div>
                <label htmlFor="email" className="label">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="input pl-10"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="label">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    className="input pl-10 pr-11"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Signing in…' : 'Sign in'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400 lg:hidden">
            © {new Date().getFullYear()} Sharvic Micro-Finance Group
          </p>
        </div>
      </div>
    </div>
  );
}
