'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/format';
import {
  ArrowLeft,
  BookOpen,
  Filter,
  Printer,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';

interface Transaction {
  id: string;
  transactionNo: string;
  type: string;
  amount: number;
  direction: 'credit' | 'debit';
  description: string;
  balanceAfter: number;
  performedAt: string;
}

interface GeneralLedger {
  period: {
    startDate?: string;
    endDate?: string;
  };
  transactions: Transaction[];
  totalCount: number;
}

const typeBadge = (type: string) => {
  switch (type) {
    case 'contribution':
      return 'badge-info';
    case 'loan_disbursement':
      return 'badge-purple';
    case 'loan_repayment':
      return 'badge-success';
    case 'expense':
      return 'badge-danger';
    case 'fee':
      return 'badge-warning';
    default:
      return 'badge-neutral';
  }
};

export default function GeneralLedgerPage() {
  const [ledger, setLedger] = useState<GeneralLedger | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState('all');

  const fetchLedger = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get('/reports/general-ledger', { params });
      setLedger(res.data);
    } catch {
      setError('Failed to load the general ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const filteredTransactions =
    ledger?.transactions.filter(
      (t) => filterType === 'all' || t.type === filterType
    ) || [];

  const totalDebits = filteredTransactions
    .filter((t) => t.direction === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCredits = filteredTransactions
    .filter((t) => t.direction === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setFilterType('all');
    fetchLedger();
  };

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
          <p className="eyebrow">Ledger</p>
          <h1 className="page-title mt-2">General ledger</h1>
          <p className="page-description">
            Every transaction with running balances, newest activity included.
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
          <div>
            <label className="label">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input w-auto"
            >
              <option value="all">All types</option>
              <option value="contribution">Contributions</option>
              <option value="loan_disbursement">Loan disbursements</option>
              <option value="loan_repayment">Loan repayments</option>
              <option value="expense">Expenses</option>
              <option value="fee">Fees</option>
              <option value="adjustment">Adjustments</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={fetchLedger} className="btn-primary">
              <RefreshCw className="h-4 w-4" />
              Generate report
            </button>
            <button onClick={clearFilters} className="btn-secondary">
              <RotateCcw className="h-4 w-4" />
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Transactions shown
            </p>
            <span className="stat-icon bg-slate-100 text-slate-500">
              <Filter className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {filteredTransactions.length}
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Total credits</p>
            <span className="stat-icon bg-emerald-50 text-emerald-600">
              <BookOpen className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-emerald-600">
            {formatCurrency(totalCredits)}
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Total debits</p>
            <span className="stat-icon bg-rose-50 text-rose-600">
              <BookOpen className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-rose-600">
            {formatCurrency(totalDebits)}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="empty-state">Loading general ledger…</div>
        </div>
      ) : error || !ledger ? (
        <div className="alert-danger">{error || 'General ledger unavailable.'}</div>
      ) : (
        <>
          <section className="card overflow-hidden">
            <div className="card-header">
              <div className="flex items-center gap-3">
                <span className="stat-icon bg-slate-100 text-slate-500">
                  <BookOpen className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Transactions
                  </h2>
                  <p className="text-sm text-slate-500">
                    {filteredTransactions.length} of {ledger.totalCount} entries
                  </p>
                </div>
              </div>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date & time</th>
                    <th>Transaction no.</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th className="text-right">Debit</th>
                    <th className="text-right">Credit</th>
                    <th className="text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-state">
                        No transactions found for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="whitespace-nowrap text-slate-500">
                          {formatDateTime(transaction.performedAt)}
                        </td>
                        <td className="whitespace-nowrap font-mono text-xs text-slate-500">
                          {transaction.transactionNo}
                        </td>
                        <td>
                          <span className={typeBadge(transaction.type)}>
                            {transaction.type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="min-w-[12rem] text-slate-700">
                          {transaction.description}
                        </td>
                        <td className="whitespace-nowrap text-right font-medium text-rose-600">
                          {transaction.direction === 'debit'
                            ? formatCurrency(transaction.amount)
                            : '—'}
                        </td>
                        <td className="whitespace-nowrap text-right font-medium text-emerald-600">
                          {transaction.direction === 'credit'
                            ? formatCurrency(transaction.amount)
                            : '—'}
                        </td>
                        <td className="whitespace-nowrap text-right font-semibold text-slate-900">
                          {transaction.balanceAfter != null
                            ? formatCurrency(transaction.balanceAfter)
                            : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredTransactions.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-slate-50/80">
                      <td colSpan={4} className="px-5 py-3 text-right text-sm font-semibold text-slate-900">
                        Totals
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right text-sm font-semibold text-rose-600">
                        {formatCurrency(totalDebits)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right text-sm font-semibold text-emerald-600">
                        {formatCurrency(totalCredits)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right text-sm font-semibold text-slate-900">
                        {formatCurrency(totalCredits - totalDebits)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>

          <p className="text-xs text-slate-400">
            Generated on {new Date().toLocaleString()} · {filteredTransactions.length}{' '}
            of {ledger.totalCount} entries
          </p>
        </>
      )}
    </div>
  );
}
