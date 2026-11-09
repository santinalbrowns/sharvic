'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  ArrowLeft,
  Landmark,
  Printer,
  RefreshCw,
  Scale,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface BalanceSheet {
  asOfDate: string;
  assets: {
    cash: number;
    loansReceivable: number;
    total: number;
  };
  liabilities: {
    memberSavings: number;
    total: number;
  };
  equity: {
    retainedEarnings: number;
    total: number;
  };
}

export default function BalanceSheetPage() {
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [asOfDate, setAsOfDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const fetchBalanceSheet = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/reports/balance-sheet', {
        params: { asOfDate },
      });
      setBalanceSheet(res.data);
    } catch {
      setError('Failed to load the balance sheet.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalanceSheet();
  }, [asOfDate]);

  const balanced =
    balanceSheet &&
    Math.abs(
      balanceSheet.assets.total -
        (balanceSheet.liabilities.total + balanceSheet.equity.total)
    ) < 0.01;

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
          <h1 className="page-title mt-2">Balance sheet</h1>
          <p className="page-description">
            The group&apos;s financial position at a specific point in time.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <button onClick={fetchBalanceSheet} className="btn-secondary">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button onClick={() => window.print()} className="btn-primary">
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>

      <div className="card no-print">
        <div className="card-body flex flex-wrap items-end gap-4">
          <div>
            <label className="label">As of date</label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="input w-auto"
            />
          </div>
          <button onClick={fetchBalanceSheet} className="btn-primary">
            <RefreshCw className="h-4 w-4" />
            Generate report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="empty-state">Loading balance sheet…</div>
        </div>
      ) : error || !balanceSheet ? (
        <div className="alert-danger">{error || 'Balance sheet unavailable.'}</div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-900">
                  Financial position
                </p>
                <p className="text-xs text-slate-500">
                  As of {formatDate(balanceSheet.asOfDate)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 divide-y divide-slate-100 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2.5">
                  <span className="stat-icon bg-brand-50 text-brand-600">
                    <Landmark className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Assets
                    </h2>
                    <p className="text-xs text-slate-400">What the group owns</p>
                  </div>
                </div>
                <dl className="mt-5 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-sm text-slate-500">Cash</dt>
                    <dd className="text-sm font-medium text-slate-900">
                      {formatCurrency(balanceSheet.assets.cash)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-sm text-slate-500">Loans receivable</dt>
                    <dd className="text-sm font-medium text-slate-900">
                      {formatCurrency(balanceSheet.assets.loansReceivable)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
                    <dt className="text-sm font-semibold text-slate-900">
                      Total assets
                    </dt>
                    <dd className="text-base font-semibold text-slate-900">
                      {formatCurrency(balanceSheet.assets.total)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2.5">
                  <span className="stat-icon bg-rose-50 text-rose-600">
                    <TrendingDown className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Liabilities
                    </h2>
                    <p className="text-xs text-slate-400">What the group owes</p>
                  </div>
                </div>
                <dl className="mt-5 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-sm text-slate-500">Member savings</dt>
                    <dd className="text-sm font-medium text-slate-900">
                      {formatCurrency(balanceSheet.liabilities.memberSavings)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
                    <dt className="text-sm font-semibold text-slate-900">
                      Total liabilities
                    </dt>
                    <dd className="text-base font-semibold text-slate-900">
                      {formatCurrency(balanceSheet.liabilities.total)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2.5">
                  <span className="stat-icon bg-emerald-50 text-emerald-600">
                    <TrendingUp className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Equity
                    </h2>
                    <p className="text-xs text-slate-400">Net group value</p>
                  </div>
                </div>
                <dl className="mt-5 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-sm text-slate-500">Retained earnings</dt>
                    <dd className="text-sm font-medium text-slate-900">
                      {formatCurrency(balanceSheet.equity.retainedEarnings)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
                    <dt className="text-sm font-semibold text-slate-900">
                      Total equity
                    </dt>
                    <dd className="text-base font-semibold text-slate-900">
                      {formatCurrency(balanceSheet.equity.total)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div
              className={`flex flex-col gap-2 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${
                balanced
                  ? 'border-emerald-100 bg-emerald-50/60'
                  : 'border-rose-100 bg-rose-50/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Scale
                  className={`h-4 w-4 ${balanced ? 'text-emerald-600' : 'text-rose-600'}`}
                />
                <span className="text-sm font-medium text-slate-900">
                  Liabilities + equity
                </span>
                <span
                  className={`badge ${balanced ? 'badge-success' : 'badge-danger'}`}
                >
                  {balanced ? 'Balanced' : 'Out of balance'}
                </span>
              </div>
              <span className="text-lg font-semibold text-slate-900">
                {formatCurrency(
                  balanceSheet.liabilities.total + balanceSheet.equity.total
                )}
              </span>
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
