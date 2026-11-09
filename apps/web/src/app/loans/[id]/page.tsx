'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Percent,
  ShieldCheck,
  User,
  Wallet,
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
    case 'completed':
      return 'badge-neutral';
    case 'rejected':
    case 'defaulted':
      return 'badge-danger';
    default:
      return 'badge-neutral';
  }
};

const scheduleBadge = (status: string) => {
  switch (status) {
    case 'paid':
      return 'badge-success';
    case 'overdue':
      return 'badge-danger';
    case 'partial':
      return 'badge-warning';
    default:
      return 'badge-neutral';
  }
};

export default function LoanDetailPage() {
  const params = useParams();
  const [loan, setLoan] = useState<any>(null);
  const [member, setMember] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const res = await api.get(`/loans/${params.id}`);
    setLoan(res.data);
    if (res.data?.memberId) {
      try {
        const m = await api.get(`/members/${res.data.memberId}`);
        setMember(m.data);
      } catch {}
    }
  };

  useEffect(() => {
    load();
  }, [params.id]);

  const repay = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post(`/loans/${params.id}/repay`, {
        amount,
        paymentMethod: 'cash',
      });
      setAmount('');
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not record repayment.');
    } finally {
      setSaving(false);
    }
  };

  if (!loan) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
          <p className="text-sm font-medium">Loading loan…</p>
        </div>
      </div>
    );
  }

  const totalRepayable = Number(loan.totalRepayable || 0);
  const outstanding = Number(loan.outstandingBalance || 0);
  const repaid = Math.max(0, totalRepayable - outstanding);
  const progress =
    totalRepayable > 0
      ? Math.min(100, Math.round((repaid / totalRepayable) * 100))
      : 0;

  const summary = [
    {
      label: 'Principal',
      value: formatCurrency(loan.principalAmount),
      icon: Wallet,
      tint: 'bg-brand-50 text-brand-600',
    },
    {
      label: 'Interest',
      value: formatCurrency(loan.interestAmount),
      icon: Percent,
      tint: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Total repayable',
      value: formatCurrency(loan.totalRepayable),
      icon: CreditCard,
      tint: 'bg-slate-100 text-slate-500',
    },
    {
      label: 'Outstanding',
      value: formatCurrency(loan.outstandingBalance),
      icon: DollarSign,
      tint: 'bg-rose-50 text-rose-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/loans"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 transition hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to loans
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-brand-950 px-5 py-6 sm:px-6">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge-neutral bg-white/10 text-slate-200 ring-white/15">
                  Loan
                </span>
                <span
                  className={`badge ${statusBadge(loan.status)} bg-white/10 ring-white/20`}
                >
                  {loan.status}
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                {loan.loanNo}
              </h1>
              <p className="mt-1 text-sm text-slate-400">{loan.purpose}</p>
              {member && (
                <Link
                  href={`/members/${member.id}`}
                  className="mt-3 inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
                >
                  <User className="h-4 w-4 text-brand-300" />
                  {member.firstName} {member.lastName}
                  <span className="text-slate-500">· {member.memberNo}</span>
                </Link>
              )}
            </div>
            <div className="lg:w-80">
              <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                <span>Repaid</span>
                <span className="text-white">
                  {formatCurrency(repaid)}{' '}
                  <span className="text-slate-500">of {formatCurrency(totalRepayable)}</span>
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {progress}% collected · Applied {formatDate(loan.appliedAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-slate-100 sm:grid-cols-4 sm:divide-x">
          {summary.map((item) => (
            <div key={item.label} className="flex items-start gap-3 border-b border-slate-100 p-5 sm:border-b-0">
              <span className={`stat-icon ${item.tint}`}>
                <item.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {item.label}
                </p>
                <p className="mt-1 truncate text-lg font-semibold text-slate-900">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <span className="stat-icon bg-slate-100 text-slate-500">
                <CreditCard className="h-5 w-5" />
              </span>
              <h2 className="text-base font-semibold text-slate-900">
                Loan information
              </h2>
            </div>
            <span className={statusBadge(loan.status)}>{loan.status}</span>
          </div>
          <div className="card-body grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Interest rate
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {loan.interestRate}% flat
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Term
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {loan.termMonths} months
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Applied
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatDate(loan.appliedAt)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Disbursed
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {loan.disbursedAt ? formatDate(loan.disbursedAt) : 'Not yet'}
              </p>
            </div>
            {loan.rejectionReason && (
              <div className="sm:col-span-2">
                <div className="alert-danger">
                  Rejected: {loan.rejectionReason}
                </div>
              </div>
            )}
            {loan.notes && (
              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Notes
                </p>
                <p className="mt-1 text-sm text-slate-600">{loan.notes}</p>
              </div>
            )}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <span className="stat-icon bg-emerald-50 text-emerald-600">
                <DollarSign className="h-5 w-5" />
              </span>
              <h2 className="text-base font-semibold text-slate-900">
                Record repayment
              </h2>
            </div>
          </div>
          <form onSubmit={repay} className="card-body space-y-4">
            {error && <div className="alert-danger">{error}</div>}
            <div>
              <label className="label">Amount (K)</label>
              <input
                type="number"
                className="input"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <p className="field-hint">
                Outstanding balance: {formatCurrency(loan.outstandingBalance)}
              </p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="btn-success w-full"
            >
              <CheckCircle2 className="h-4 w-4" />
              {saving ? 'Recording…' : 'Record payment'}
            </button>
          </form>
        </section>
      </div>

      {loan.schedule?.length > 0 && (
        <section className="card overflow-hidden">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <span className="stat-icon bg-violet-50 text-violet-600">
                <CalendarDays className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Repayment schedule
                </h2>
                <p className="text-sm text-slate-500">
                  {loan.schedule.length} installments
                </p>
              </div>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Due date</th>
                  <th>Principal</th>
                  <th>Interest</th>
                  <th>Total due</th>
                  <th>Paid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loan.schedule.map((s: any) => (
                  <tr key={s.id}>
                    <td className="font-medium text-slate-900">
                      {s.installmentNumber}
                    </td>
                    <td className="whitespace-nowrap text-slate-500">
                      {formatDate(s.dueDate)}
                    </td>
                    <td className="whitespace-nowrap text-slate-600">
                      {formatCurrency(s.principalDue)}
                    </td>
                    <td className="whitespace-nowrap text-slate-600">
                      {formatCurrency(s.interestDue)}
                    </td>
                    <td className="whitespace-nowrap font-medium text-slate-900">
                      {formatCurrency(s.totalDue)}
                    </td>
                    <td className="whitespace-nowrap text-emerald-600">
                      {formatCurrency(s.totalPaid)}
                    </td>
                    <td>
                      <span className={scheduleBadge(s.status)}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {loan.guarantors?.length > 0 && (
        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <span className="stat-icon bg-brand-50 text-brand-600">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <h2 className="text-base font-semibold text-slate-900">
                Guarantors
              </h2>
            </div>
          </div>
          <div className="card-body grid grid-cols-1 gap-3 sm:grid-cols-2">
            {loan.guarantors.map((g: any) => (
              <div
                key={g.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 p-4"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <User className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {g.guarantorName}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {g.guarantorPhone}
                    {g.relationship ? ` · ${g.relationship}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card overflow-hidden">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <span className="stat-icon bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Repayment history
              </h2>
              <p className="text-sm text-slate-500">
                {loan.repayments?.length || 0} payments recorded
              </p>
            </div>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Receipt no.</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loan.repayments?.map((r: any) => (
                <tr key={r.id}>
                  <td className="font-medium text-slate-900">{r.receiptNo}</td>
                  <td className="whitespace-nowrap font-semibold text-emerald-600">
                    {formatCurrency(r.amount)}
                  </td>
                  <td className="whitespace-nowrap capitalize text-slate-600">
                    {r.paymentMethod?.replace(/_/g, ' ') || 'Cash'}
                  </td>
                  <td className="whitespace-nowrap text-slate-500">
                    {formatDate(r.receivedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loan.repayments?.length && (
            <div className="empty-state">No repayments recorded yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
