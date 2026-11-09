'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { formatCurrency, formatDate, initials } from '@/lib/format';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Gauge,
  Mail,
  MapPin,
  Phone,
  PiggyBank,
  ShieldCheck,
  User,
  Wallet,
  XCircle,
} from 'lucide-react';

const scoreText = (score: number) =>
  score >= 80
    ? 'text-emerald-600'
    : score >= 60
      ? 'text-brand-600'
      : score >= 40
        ? 'text-amber-600'
        : 'text-rose-600';

const scoreStroke = (score: number) =>
  score >= 80
    ? '#059669'
    : score >= 60
      ? '#2563eb'
      : score >= 40
        ? '#d97706'
        : '#e11d48';

const scoreBar = (score: number) =>
  score >= 80
    ? 'bg-emerald-500'
    : score >= 60
      ? 'bg-brand-500'
      : score >= 40
        ? 'bg-amber-500'
        : 'bg-rose-500';

const ratingBadge = (rating: string) =>
  rating === 'excellent'
    ? 'badge-success'
    : rating === 'good'
      ? 'badge-info'
      : rating === 'fair'
        ? 'badge-warning'
        : 'badge-danger';

export default function MemberDetailPage() {
  const params = useParams();
  const [member, setMember] = useState<any>(null);
  const [savings, setSavings] = useState<any>(null);
  const [credit, setCredit] = useState<any>(null);
  const [eligibility, setEligibility] = useState<any>(null);

  const load = async () => {
    const m = await api.get(`/members/${params.id}`);
    setMember(m.data);
    try {
      const s = await api.get(`/savings/member/${params.id}`);
      setSavings(s.data);
    } catch {}
    try {
      const c = await api.get(`/reports/credit-score/${params.id}`);
      setCredit(c.data);
    } catch {}
    try {
      const e = await api.post('/loans/check-eligibility', {
        memberId: params.id,
        requestedAmount: 0,
      });
      setEligibility(e.data);
    } catch {}
  };

  useEffect(() => {
    load();
  }, [params.id]);

  if (!member) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
          <p className="text-sm font-medium">Loading member…</p>
        </div>
      </div>
    );
  }

  const score = Number(credit?.score || 0);
  const circumference = 2 * Math.PI * 54;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/members"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 transition hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to members
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="relative border-b border-slate-100 bg-gradient-to-r from-slate-950 via-slate-900 to-brand-950 px-5 py-6 sm:px-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-xl font-bold text-white shadow-lg shadow-brand-900/40">
              {initials(member.firstName, member.lastName)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                {member.firstName} {member.lastName}
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Member no. <span className="font-medium text-slate-200">{member.memberNo}</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-neutral bg-white/10 text-slate-200 ring-white/15">
                {member.memberType === 'member' ? 'Member · 10%' : 'Non-member · 20%'}
              </span>
              <span
                className={
                  member.status === 'active'
                    ? 'badge-success bg-emerald-400/10 text-emerald-300 ring-emerald-400/30'
                    : 'badge-danger bg-rose-400/10 text-rose-300 ring-rose-400/30'
                }
              >
                {member.status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="flex items-start gap-3 p-5">
            <span className="stat-icon bg-brand-50 text-brand-600">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Savings balance
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {savings ? formatCurrency(savings.account?.balance) : '—'}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {savings?.account?.accountNo || 'No savings account'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-5">
            <span className="stat-icon bg-emerald-50 text-emerald-600">
              <Gauge className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Credit score
              </p>
              <p className={`mt-1 text-xl font-semibold ${credit ? scoreText(score) : 'text-slate-900'}`}>
                {credit ? `${score}/100` : '—'}
              </p>
              <p className="mt-0.5 text-xs capitalize text-slate-400">
                {credit?.rating || 'Not available'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-5">
            <span className="stat-icon bg-violet-50 text-violet-600">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Loan eligibility
              </p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                {eligibility?.maxLoanAmount != null
                  ? formatCurrency(eligibility.maxLoanAmount)
                  : '—'}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {eligibility?.eligible ? 'Eligible to borrow' : 'Not eligible yet'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <span className="stat-icon bg-slate-100 text-slate-500">
                <User className="h-5 w-5" />
              </span>
              <h2 className="text-base font-semibold text-slate-900">
                Personal information
              </h2>
            </div>
          </div>
          <div className="card-body space-y-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-500">Full name</span>
              <span className="text-sm font-medium text-slate-900">
                {member.firstName} {member.lastName}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-sm text-slate-500">
                <Phone className="h-3.5 w-3.5" /> Phone
              </span>
              <span className="text-sm font-medium text-slate-900">
                {member.phone}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-500">National ID</span>
              <span className="text-sm font-medium text-slate-900">
                {member.nationalId || 'N/A'}
              </span>
            </div>
            {member.email && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-sm text-slate-500">
                  <Mail className="h-3.5 w-3.5" /> Email
                </span>
                <span className="truncate text-sm font-medium text-slate-900">
                  {member.email}
                </span>
              </div>
            )}
            {member.address && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="h-3.5 w-3.5" /> Address
                </span>
                <span className="truncate text-sm font-medium text-slate-900">
                  {member.address}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
              <span className="text-sm text-slate-500">Joined</span>
              <span className="text-sm font-medium text-slate-900">
                {formatDate(member.joinedAt)}
              </span>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <span className="stat-icon bg-amber-50 text-amber-600">
                <PiggyBank className="h-5 w-5" />
              </span>
              <h2 className="text-base font-semibold text-slate-900">
                Savings account
              </h2>
            </div>
            <Link href="/savings" className="btn-ghost text-brand-600">
              <CreditCard className="h-4 w-4" />
              Contribute
            </Link>
          </div>
          <div className="card-body">
            {savings ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white shadow-glow">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand-100">
                    Available balance
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">
                    {formatCurrency(savings.account?.balance)}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs text-brand-100">
                    <span>Account no.</span>
                    <span className="font-semibold text-white">
                      {savings.account?.accountNo}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-sm text-slate-500">Total saved</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {formatCurrency(savings.account?.totalContributions ?? savings.account?.balance)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                No savings account has been opened for this member yet.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <span className="stat-icon bg-violet-50 text-violet-600">
              <Gauge className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Credit score
              </h2>
              <p className="text-sm text-slate-500">
                Based on savings discipline, repayment history and group participation.
              </p>
            </div>
          </div>
          {credit && (
            <span className={`badge ${ratingBadge(credit.rating)}`}>
              {credit.rating}
            </span>
          )}
        </div>

        {credit ? (
          <div className="card-body grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="flex flex-col items-center border-b border-slate-100 pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
              <div className="relative h-36 w-36">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke={scoreStroke(score)}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (circumference * score) / 100}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-bold tracking-tight ${scoreText(score)}`}>
                    {score}
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    out of 100
                  </span>
                </div>
              </div>

              {eligibility ? (
                <div
                  className={`mt-6 w-full rounded-xl border p-4 ${
                    eligibility.eligible
                      ? 'border-emerald-200 bg-emerald-50/70'
                      : 'border-rose-200 bg-rose-50/70'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck
                      className={`h-5 w-5 ${
                        eligibility.eligible ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    />
                    <span
                      className={`text-sm font-semibold ${
                        eligibility.eligible ? 'text-emerald-800' : 'text-rose-800'
                      }`}
                    >
                      {eligibility.eligible
                        ? 'Eligible for a loan'
                        : 'Not eligible for a loan'}
                    </span>
                  </div>
                  {typeof eligibility.maxLoanAmount === 'number' && (
                    <p
                      className={`mt-2 text-xs ${
                        eligibility.eligible ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      Maximum loan: {formatCurrency(eligibility.maxLoanAmount)} (score ×
                      savings × {eligibility.loanToSavingsMultiplier})
                    </p>
                  )}
                  {!eligibility.eligible && eligibility.reasons?.length > 0 && (
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
                  {eligibility.eligible && (
                    <p className="mt-2 flex items-center gap-2 text-xs text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Meets all eligibility requirements
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-6 w-full rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  Eligibility check unavailable
                </p>
              )}
            </div>

            <div className="space-y-5 lg:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Score breakdown
              </p>
              {credit.factors?.map((factor: any) => {
                const pct = Math.min(
                  100,
                  Math.round((factor.score / factor.maxScore) * 100)
                );
                return (
                  <div key={factor.key}>
                    <div className="mb-1.5 flex items-center justify-between gap-4">
                      <span className="text-sm font-medium text-slate-700">
                        {factor.label}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {factor.score}
                        <span className="text-slate-400">/{factor.maxScore}</span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${scoreBar(pct)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      {factor.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            A credit score will appear once this member has savings and loan
            activity.
          </div>
        )}
      </section>
    </div>
  );
}
