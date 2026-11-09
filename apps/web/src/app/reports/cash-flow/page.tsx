'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import {
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  Printer,
  RefreshCw,
  TrendingUp,
  Wallet,
} from 'lucide-react';

interface Transaction {
  id: string;
  transactionNo: string;
  type: string;
  amount: number;
  direction: 'credit' | 'debit';
  description: string;
  performedAt: string;
}

interface CashFlow {
  period: {
    startDate: string;
    endDate: string;
  };
  operatingActivities: {
    transactions: Transaction[];
    netCashFlow: number;
  };
  financingActivities: {
    transactions: Transaction[];
    netCashFlow: number;
  };
  netCashChange: number;
}

function ActivitySection({
  title,
  subtitle,
  transactions,
  net,
}: {
  title: string;
  subtitle: string;
  transactions: Transaction[];
  net: number;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <span
          className={`badge ${net >= 0 ? 'badge-success' : 'badge-danger'}`}
        >
          {net >= 0 ? 'Net inflow' : 'Net outflow'}
        </span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Type</th>
              <th>Date</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td className="font-medium text-slate-900">{tx.description}</td>
                <td>
                  <span className="badge-neutral capitalize">
                    {tx.type.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="whitespace-nowrap text-slate-500">
                  {formatDateTime(tx.performedAt)}
                </td>
                <td
                  className={`whitespace-nowrap text-right font-semibold ${
                    tx.direction === 'credit'
                      ? 'text-emerald-600'
                      : 'text-rose-600'
                  }`}
                >
                  {tx.direction === 'credit' ? '+' : '−'}
                  {formatCurrency(Math.abs(tx.amount))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50/80">
              <td colSpan={3} className="px-5 py-3 text-right text-sm font-semibold text-slate-900">
                Net cash flow
              </td>
              <td
                className={`whitespace-nowrap px-5 py-3 text-right text-sm font-semibold ${
                  net >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatCurrency(net)}
              </td>
            </tr>
          </tfoot>
        </table>
        {transactions.length === 0 && (
          <div className="empty-state">No transactions in this category.</div>
        )}
      </div>
    </div>
  );
}

export default function CashFlowPage() {
  const [cashFlow, setCashFlow] = useState<CashFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchCashFlow = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/reports/cash-flow', {
        params: { startDate, endDate },
      });
      setCashFlow(res.data);
    } catch {
      setError('Failed to load the cash flow statement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashFlow();
  }, []);

  const positive = (cashFlow?.netCashChange ?? 0) >= 0;
  const periodDays = Math.max(
    1,
    Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

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
          <h1 className="page-title mt-2">Cash flow</h1>
          <p className="page-description">
            How cash moved through operating and financing activities.
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
          <button onClick={fetchCashFlow} className="btn-primary">
            <RefreshCw className="h-4 w-4" />
            Generate report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="empty-state">Loading cash flow statement…</div>
        </div>
      ) : error || !cashFlow ? (
        <div className="alert-danger">
          {error || 'Cash flow statement unavailable.'}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Operating cash flow
                </p>
                <span className="stat-icon bg-brand-50 text-brand-600">
                  <Wallet className="h-5 w-5" />
                </span>
              </div>
              <p
                className={`mt-2 text-2xl font-semibold tracking-tight ${
                  cashFlow.operatingActivities.netCashFlow >= 0
                    ? 'text-emerald-600'
                    : 'text-rose-600'
                }`}
              >
                {formatCurrency(cashFlow.operatingActivities.netCashFlow)}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {cashFlow.operatingActivities.transactions.length} transactions
              </p>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Financing cash flow
                </p>
                <span className="stat-icon bg-violet-50 text-violet-600">
                  <TrendingUp className="h-5 w-5" />
                </span>
              </div>
              <p
                className={`mt-2 text-2xl font-semibold tracking-tight ${
                  cashFlow.financingActivities.netCashFlow >= 0
                    ? 'text-emerald-600'
                    : 'text-rose-600'
                }`}
              >
                {formatCurrency(cashFlow.financingActivities.netCashFlow)}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {cashFlow.financingActivities.transactions.length} transactions
              </p>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Net cash change
                </p>
                <span
                  className={`stat-icon ${
                    positive
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  {positive ? (
                    <ArrowUpRight className="h-5 w-5" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5" />
                  )}
                </span>
              </div>
              <p
                className={`mt-2 text-2xl font-semibold tracking-tight ${
                  positive ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {formatCurrency(cashFlow.netCashChange)}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Over {periodDays} days
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-body flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="eyebrow">Period</span>
                <span className="text-sm font-medium text-slate-900">
                  {formatDate(cashFlow.period.startDate)} —{' '}
                  {formatDate(cashFlow.period.endDate)}
                </span>
              </div>
              <span className={positive ? 'badge-success' : 'badge-danger'}>
                {positive ? 'Positive cash flow' : 'Negative cash flow'}
              </span>
            </div>
          </div>

          <ActivitySection
            title="Operating activities"
            subtitle="Day-to-day contributions, repayments and expenses."
            transactions={cashFlow.operatingActivities.transactions}
            net={cashFlow.operatingActivities.netCashFlow}
          />

          <ActivitySection
            title="Financing activities"
            subtitle="Loan disbursements and other financing movements."
            transactions={cashFlow.financingActivities.transactions}
            net={cashFlow.financingActivities.netCashFlow}
          />

          <p className="text-xs text-slate-400">
            Generated on {new Date().toLocaleString()}
          </p>
        </>
      )}
    </div>
  );
}
