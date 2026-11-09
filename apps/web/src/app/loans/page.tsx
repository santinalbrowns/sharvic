'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/format';
import {
  CheckCircle2,
  DollarSign,
  Eye,
  Gauge,
  Plus,
  ShieldCheck,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';

const statusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return 'badge-warning';
    case 'approved':
      return 'badge-info';
    case 'disbursed':
      return 'badge-success';
    case 'completed':
      return 'badge-neutral';
    case 'rejected':
      return 'badge-danger';
    default:
      return 'badge-neutral';
  }
};

const emptyForm = {
  memberId: '',
  principalAmount: '',
  termMonths: '6',
  purpose: '',
};

export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState(emptyForm);
  const [eligibility, setEligibility] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api.get('/loans').then((r) => setLoans(r.data));
    api.get('/members').then((r) => setMembers(r.data));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!form.memberId) {
      setEligibility(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const r = await api.post('/loans/check-eligibility', {
          memberId: form.memberId,
          requestedAmount: parseFloat(form.principalAmount) || 0,
        });
        if (!cancelled) setEligibility(r.data);
      } catch {
        if (!cancelled) setEligibility(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.memberId, form.principalAmount]);

  const apply = async (e: any) => {
    e.preventDefault();
    setApplyError('');
    setSubmitting(true);
    try {
      await api.post('/loans/apply', {
        ...form,
        principalAmount: parseFloat(form.principalAmount),
        termMonths: parseInt(form.termMonths),
      });
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err: any) {
      setApplyError(
        err.response?.data?.reasons?.join(' • ') ||
          err.response?.data?.error ||
          'Failed to submit loan application'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const approve = async (id: string) => {
    await api.post(`/loans/${id}/approve`, {});
    load();
  };
  const reject = async (id: string) => {
    const reason = prompt('Reason for rejection:');
    if (reason) await api.post(`/loans/${id}/reject`, { reason });
    load();
  };
  const disburse = async (id: string) => {
    await api.post(`/loans/${id}/disburse`, {});
    load();
  };

  const filtered =
    filter === 'all' ? loans : loans.filter((l) => l.status === filter);

  const totalPortfolio = loans.reduce(
    (sum, l) => sum + Number(l.principalAmount || 0),
    0
  );
  const totalOutstanding = loans.reduce(
    (sum, l) => sum + Number(l.outstandingBalance || 0),
    0
  );
  const pendingCount = loans.filter((l) => l.status === 'pending').length;
  const disbursedCount = loans.filter((l) => l.status === 'disbursed').length;

  const stats = [
    { label: 'Loan portfolio', value: formatCurrency(totalPortfolio) },
    { label: 'Outstanding', value: formatCurrency(totalOutstanding) },
    { label: 'Pending review', value: formatNumber(pendingCount) },
    { label: 'Active loans', value: formatNumber(disbursedCount) },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Lending</p>
          <h1 className="page-title mt-2">Loan management</h1>
          <p className="page-description">
            Review applications, approve and disburse loans, and keep repayments
            on track.
          </p>
        </div>
        <button
          onClick={() => setShowForm((open) => !open)}
          className="btn-primary"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Close form' : 'New application'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {stat.label}
            </p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {showForm && (
        <section className="card animate-slide-up">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <span className="stat-icon bg-brand-50 text-brand-600">
                <Wallet className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Loan application
                </h2>
                <p className="text-sm text-slate-500">
                  Eligibility is checked automatically against the member&apos;s
                  savings and credit score.
                </p>
              </div>
            </div>
          </div>
          <form onSubmit={apply} className="card-body grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="label">Member *</label>
              <select
                className="input"
                value={form.memberId}
                onChange={(e) => setForm({ ...form, memberId: e.target.value })}
                required
              >
                <option value="">Select a member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} ({m.memberNo}) — {m.memberType}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Principal amount (K) *</label>
              <input
                type="number"
                min="0"
                max={eligibility?.maxLoanAmount}
                className="input"
                value={form.principalAmount}
                onChange={(e) =>
                  setForm({ ...form, principalAmount: e.target.value })
                }
                required
              />
              {eligibility && (
                <p className="field-hint">
                  Maximum available: {formatCurrency(eligibility.maxLoanAmount)}
                </p>
              )}
            </div>
            <div>
              <label className="label">Term (months) *</label>
              <input
                type="number"
                className="input"
                value={form.termMonths}
                onChange={(e) => setForm({ ...form, termMonths: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Loan purpose *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Stock for small business"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                required
              />
            </div>

            {form.memberId && (
              <div
                className={`md:col-span-2 rounded-xl border p-4 ${
                  checking
                    ? 'border-slate-200 bg-slate-50'
                    : eligibility?.eligible
                      ? 'border-emerald-200 bg-emerald-50/70'
                      : 'border-rose-200 bg-rose-50/70'
                }`}
              >
                {checking ? (
                  <p className="flex items-center gap-2 text-sm text-slate-600">
                    <Gauge className="h-4 w-4 animate-pulse" />
                    Checking credit score and eligibility…
                  </p>
                ) : (
                  eligibility && (
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <ShieldCheck
                          className={`h-5 w-5 ${
                            eligibility.eligible
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }`}
                        />
                        <span
                          className={`text-sm font-semibold ${
                            eligibility.eligible
                              ? 'text-emerald-800'
                              : 'text-rose-800'
                          }`}
                        >
                          {eligibility.eligible
                            ? 'Eligible for this loan'
                            : 'Not eligible for this loan'}
                        </span>
                        <span className="badge-neutral bg-white">
                          Credit score: {eligibility.creditScore}/100
                        </span>
                        <span className="badge-neutral bg-white">
                          Max loan: {formatCurrency(eligibility.maxLoanAmount)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-600">
                        Limit = score × savings ×{' '}
                        {eligibility.loanToSavingsMultiplier} (savings balance:{' '}
                        {formatCurrency(eligibility.savingsBalance)})
                      </p>
                      {eligibility.reasons?.length > 0 && (
                        <ul className="mt-3 space-y-2">
                          {eligibility.reasons.map((reason: string) => (
                            <li
                              key={reason}
                              className="flex items-start gap-2 text-xs text-rose-700"
                            >
                              <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )
                )}
              </div>
            )}

            {applyError && (
              <div className="alert-danger md:col-span-2">{applyError}</div>
            )}

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={
                  submitting || checking || (eligibility && !eligibility.eligible)
                }
                className="btn-primary"
              >
                {submitting ? 'Submitting…' : 'Submit application'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="card overflow-hidden">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <span className="stat-icon bg-slate-100 text-slate-500">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Loan applications
              </h2>
              <p className="text-sm text-slate-500">
                {filtered.length} of {loans.length} loans
              </p>
            </div>
          </div>
          <select
            className="input w-full sm:w-48"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="disbursed">Disbursed</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
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
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td>
                    <Link
                      href={`/loans/${l.id}`}
                      className="font-semibold text-brand-600 transition hover:text-brand-700"
                    >
                      {l.loanNo}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap font-medium text-slate-900">
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
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      {l.status === 'pending' && (
                        <>
                          <button
                            onClick={() => approve(l.id)}
                            className="icon-btn text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            aria-label="Approve loan"
                            title="Approve"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => reject(l.id)}
                            className="icon-btn text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            aria-label="Reject loan"
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {l.status === 'approved' && (
                        <button
                          onClick={() => disburse(l.id)}
                          className="icon-btn text-brand-600 hover:bg-brand-50 hover:text-brand-700"
                          aria-label="Disburse loan"
                          title="Disburse"
                        >
                          <DollarSign className="h-4 w-4" />
                        </button>
                      )}
                      <Link
                        href={`/loans/${l.id}`}
                        className="icon-btn"
                        aria-label="View loan"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              {loans.length === 0
                ? 'No loan applications yet. Create one to get started.'
                : 'No loans match this filter.'}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
