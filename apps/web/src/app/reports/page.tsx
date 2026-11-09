'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CreditCard,
  DollarSign,
  Landmark,
  TrendingUp,
  Users,
} from 'lucide-react';

const statusBadge = (status: string) => {
  switch (status) {
    case 'pending':
    case 'under_review':
      return 'badge-warning';
    case 'approved':
      return 'badge-info';
    case 'disbursed':
      return 'badge-success';
    case 'rejected':
    case 'defaulted':
      return 'badge-danger';
    default:
      return 'badge-neutral';
  }
};

const reportLinks = [
  {
    name: 'Balance sheet',
    description: 'Assets, liabilities and equity at a point in time.',
    href: '/reports/balance-sheet',
    icon: Landmark,
    tint: 'bg-brand-50 text-brand-600',
  },
  {
    name: 'Income statement',
    description: 'Revenue, expenses and net income for a period.',
    href: '/reports/income-statement',
    icon: TrendingUp,
    tint: 'bg-emerald-50 text-emerald-600',
  },
  {
    name: 'Cash flow',
    description: 'Operating and financing cash movements.',
    href: '/reports/cash-flow',
    icon: DollarSign,
    tint: 'bg-amber-50 text-amber-600',
  },
  {
    name: 'General ledger',
    description: 'Every transaction with running balances.',
    href: '/reports/general-ledger',
    icon: BookOpen,
    tint: 'bg-violet-50 text-violet-600',
  },
];

export default function ReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loans, setLoans] = useState<any[]>([]);

  useEffect(() => {
    api.get('/reports/summary').then((r) => setSummary(r.data));
    api.get('/reports/loan-performance').then((r) => setLoans(r.data));
  }, []);

  const cards = [
    {
      name: 'Total members',
      value: summary?.totalMembers || 0,
      icon: Users,
      tint: 'bg-brand-50 text-brand-600',
    },
    {
      name: 'Total contributions',
      value: formatCurrency(summary?.totalContributions),
      icon: DollarSign,
      tint: 'bg-emerald-50 text-emerald-600',
    },
    {
      name: 'Loans disbursed',
      value: formatCurrency(summary?.totalLoanAmount),
      icon: CreditCard,
      tint: 'bg-violet-50 text-violet-600',
    },
    {
      name: 'Outstanding',
      value: formatCurrency(summary?.totalOutstanding),
      icon: BarChart3,
      tint: 'bg-rose-50 text-rose-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Insights</p>
          <h1 className="page-title mt-2">Financial reports</h1>
          <p className="page-description">
            Statements and performance views for the whole group.
          </p>
        </div>
        <button onClick={() => window.print()} className="btn-secondary no-print">
          Print overview
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.name} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">{card.name}</p>
                <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-slate-900">
                  {card.value}
                </p>
              </div>
              <span className={`stat-icon ${card.tint}`}>
                <card.icon className="h-5 w-5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {reportLinks.map((report) => (
          <Link
            key={report.name}
            href={report.href}
            className="card group p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <div className="flex items-start justify-between gap-3">
              <span className={`stat-icon ${report.tint}`}>
                <report.icon className="h-5 w-5" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-slate-500" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-900">
              {report.name}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {report.description}
            </p>
          </Link>
        ))}
      </div>

      <section className="card overflow-hidden">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <span className="stat-icon bg-slate-100 text-slate-500">
              <BarChart3 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Loan performance
              </h2>
              <p className="text-sm text-slate-500">
                {loans.length} loans in the portfolio
              </p>
            </div>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Loan no.</th>
                <th>Principal</th>
                <th>Rate</th>
                <th>Total repayable</th>
                <th>Outstanding</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap font-medium text-slate-900">
                    {l.loanNo}
                  </td>
                  <td className="whitespace-nowrap text-slate-600">
                    {formatCurrency(l.principalAmount)}
                  </td>
                  <td className="whitespace-nowrap text-slate-600">
                    {l.interestRate}%
                  </td>
                  <td className="whitespace-nowrap text-slate-600">
                    {formatCurrency(l.totalRepayable)}
                  </td>
                  <td className="whitespace-nowrap font-semibold text-rose-600">
                    {formatCurrency(l.outstandingBalance)}
                  </td>
                  <td>
                    <span className={statusBadge(l.status)}>{l.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loans.length === 0 && (
            <div className="empty-state">No loan performance data yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
