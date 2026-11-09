'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/format';
import {
  AlertCircle,
  ArrowUpRight,
  CreditCard,
  PiggyBank,
  Receipt,
  Users,
  Wallet,
} from 'lucide-react';

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    api
      .get('/reports/summary')
      .then((res) => setSummary(res.data))
      .catch(console.error);
  }, []);

  const stats = [
    {
      name: 'Total members',
      value: formatNumber(summary?.totalMembers),
      subtext: `${formatNumber(summary?.activeMembers)} active`,
      icon: Users,
      tint: 'bg-brand-50 text-brand-600',
      href: '/members',
    },
    {
      name: 'Active loans',
      value: formatNumber(summary?.disbursedLoans),
      subtext: `${formatNumber(summary?.pendingLoans)} pending approval`,
      icon: CreditCard,
      tint: 'bg-emerald-50 text-emerald-600',
      href: '/loans',
    },
    {
      name: 'Total contributions',
      value: formatCurrency(summary?.totalContributions),
      subtext: 'All time savings',
      icon: PiggyBank,
      tint: 'bg-amber-50 text-amber-600',
      href: '/savings',
    },
    {
      name: 'Outstanding loans',
      value: formatCurrency(summary?.totalOutstanding),
      subtext: 'Still to collect',
      icon: AlertCircle,
      tint: 'bg-rose-50 text-rose-600',
      href: '/loans',
    },
  ];

  const quickActions = [
    {
      name: 'Add member',
      description: 'Register a new group member',
      href: '/members',
      icon: Users,
      tint: 'bg-brand-50 text-brand-600 group-hover:bg-brand-600',
    },
    {
      name: 'New loan',
      description: 'Check eligibility and apply',
      href: '/loans',
      icon: CreditCard,
      tint: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600',
    },
    {
      name: 'Record contribution',
      description: 'Capture member savings',
      href: '/savings',
      icon: PiggyBank,
      tint: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600',
    },
    {
      name: 'Add expense',
      description: 'Log a group expenditure',
      href: '/expenses',
      icon: Receipt,
      tint: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600',
    },
  ];

  const contributions = Number(summary?.totalContributions || 0);
  const repayments = Number(summary?.totalRepayments || 0);
  const expenses = Number(summary?.totalExpenses || 0);
  const netPosition = contributions + repayments - expenses;
  const loanBook = Number(summary?.totalLoanAmount || 0);
  const collectionRate =
    loanBook > 0
      ? Math.min(100, Math.round((repayments / loanBook) * 100))
      : 0;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 className="page-title mt-2">Group overview</h1>
          <p className="page-description">
            A live snapshot of your village banking group&apos;s members, savings
            and lending activity.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/reports" className="btn-secondary">
            View reports
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link href="/loans" className="btn-primary">
            <CreditCard className="h-4 w-4" />
            New loan
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.href} className="stat-card group">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-slate-900">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-slate-400">{stat.subtext}</p>
              </div>
              <span className={`stat-icon ${stat.tint}`}>
                <stat.icon className="h-5 w-5" />
              </span>
            </div>
            <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 scale-x-0 bg-gradient-to-r from-brand-500 to-brand-300 transition-transform duration-300 group-hover:scale-x-100" />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="card xl:col-span-2">
          <div className="card-header">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Quick actions
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                The tasks your team reaches for most.
              </p>
            </div>
          </div>
          <div className="card-body grid grid-cols-1 gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition duration-150 hover:border-slate-300 hover:bg-slate-50/60"
              >
                <span
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-colors duration-150 group-hover:text-white ${action.tint}`}
                >
                  <action.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">
                    {action.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                    {action.description}
                  </span>
                </span>
                <ArrowUpRight className="ml-auto h-4 w-4 flex-shrink-0 text-slate-300 transition group-hover:text-slate-500" />
              </Link>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Financial summary
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Group position at a glance.
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <Wallet className="h-4 w-4" />
            </span>
          </div>
          <div className="card-body space-y-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-500">Loans disbursed</span>
              <span className="text-sm font-semibold text-slate-900">
                {formatCurrency(summary?.totalLoanAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-500">Total repayments</span>
              <span className="text-sm font-semibold text-emerald-600">
                {formatCurrency(summary?.totalRepayments)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-500">Total expenses</span>
              <span className="text-sm font-semibold text-rose-600">
                {formatCurrency(summary?.totalExpenses)}
              </span>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Loan collection rate</span>
                <span className="font-semibold text-slate-900">
                  {collectionRate}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-500"
                  style={{ width: `${collectionRate}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
              <span className="text-sm font-medium text-slate-900">
                Net position
              </span>
              <span className="text-lg font-semibold text-brand-600">
                {formatCurrency(netPosition)}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
