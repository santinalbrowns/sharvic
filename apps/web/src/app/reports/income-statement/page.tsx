'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  Printer,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';

interface IncomeStatement {
  period: {
    startDate: string;
    endDate: string;
  };
  revenue: {
    interestIncome: number;
    membershipFees: number;
    total: number;
  };
  expenses: {
    operatingExpenses: number;
    total: number;
  };
  netIncome: number;
}

export default function IncomeStatementPage() {
  const [statement, setStatement] = useState<IncomeStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchStatement = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/reports/income-statement', {
        params: { startDate, endDate },
      });
      setStatement(res.data);
    } catch {
      setError('Failed to load the income statement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, []);

  const margin =
    statement && statement.revenue.total > 0
      ? ((statement.netIncome / statement.revenue.total) * 100).toFixed(2)
      : '0.00';
  const profitable = (statement?.netIncome ?? 0) >= 0;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/reports"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 transition hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to reports
        </Link>
      </div>

      <div className="page-header">
        <div>
          <p className="eyebrow">Statement</p>
          <h1 className="page-title mt-2">Income statement</h1>
          <p className="page-description">
            Revenue, expenses and net income for the selected period.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="btn-secondary no-print"
        >
          <Printer className="h-4 w-4" />
          Print
        </button>
      </div>

      <div className="card no-print">
        <div className="card-body flex flex-wrap items-end gap-4">
          <div>
            <label className="label">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input w-auto"
            />
          </div>
          <div>
            <label className="label">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input w-auto"
            />
          </div>
          <button onClick={fetchStatement} className="btn-primary">
            <RefreshCw className="h-4 w-4" />
            Generate report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="empty-state">Loading income statement…</div>
        </div>
      ) : error || !statement ? (
        <div className="alert-danger">
          {error || 'Income statement unavailable.'}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Total revenue
                </p>
                <span className="stat-icon bg-emerald-50 text-emerald-600">
                  <TrendingUp className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                {formatCurrency(statement.revenue.total)}
              </p>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Total expenses
                </p>
                <span className="stat-icon bg-rose-50 text-rose-600">
                  <TrendingDown className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                {formatCurrency(statement.expenses.total)}
              </p>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  {profitable ? 'Net income' : 'Net loss'}
                </p>
                <span
                  className={`stat-icon ${
                    profitable
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  <Wallet className="h-5 w-5" />
                </span>
              </div>
              <p
                className={`mt-2 text-2xl font-semibold tracking-tight ${
                  profitable ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatCurrency(Math.abs(statement.netIncome))}
              </p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-900">
                  Profit & loss statement
                </p>
                <p className="text-xs text-slate-500">
                  {formatDate(statement.period.startDate)} —{' '}
                  {formatDate(statement.period.endDate)}
                </p>
              </div>
            </div>

            <div className="card-body space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Revenue
                  </h2>
                </div>
                <dl className="mt-3 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-sm text-slate-600">
                      Interest income from loans
                    </dt>
                    <dd className="text-sm font-medium text-slate-900">
                      {formatCurrency(statement.revenue.interestIncome)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-sm text-slate-600">Membership fees</dt>
                    <dd className="text-sm font-medium text-slate-900">
                      {formatCurrency(statement.revenue.membershipFees)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
                    <dt className="text-sm font-semibold text-slate-900">
                      Total revenue
                    </dt>
                    <dd className="text-base font-semibold text-emerald-600">
                      {formatCurrency(statement.revenue.total)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Expenses
                  </h2>
                </div>
                <dl className="mt-3 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-sm text-slate-600">
                      Operating expenses
                    </dt>
                    <dd className="text-sm font-medium text-slate-900">
                      {formatCurrency(statement.expenses.operatingExpenses)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
                    <dt className="text-sm font-semibold text-slate-900">
                      Total expenses
                    </dt>
                    <dd className="text-base font-semibold text-rose-600">
                      {formatCurrency(statement.expenses.total)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div
              className={`flex flex-col gap-3 border-t px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${
                profitable
                  ? 'border-emerald-100 bg-emerald-50/60'
                  : 'border-rose-100 bg-rose-50/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    profitable
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-rose-100 text-rose-600'
                  }`}
                >
                  {profitable ? (
                    <ArrowUpRight className="h-5 w-5" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5" />
                  )}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {profitable ? 'Net income' : 'Net loss'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Profit margin {margin}%
                  </p>
                </div>
              </div>
              <p
                className={`text-2xl font-semibold tracking-tight ${
                  profitable ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatCurrency(Math.abs(statement.netIncome))}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Generated on {new Date().toLocaleString()}
          </p>
        </>
      )}
    </div>
  );
}
