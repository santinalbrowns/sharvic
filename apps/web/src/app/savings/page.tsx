'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  CheckCircle2,
  Clock,
  Info,
  PiggyBank,
  Receipt,
  Wallet,
} from 'lucide-react';

const emptyForm = {
  memberId: '',
  amount: '',
  contributionMonth: new Date().toISOString().slice(0, 7),
  notes: '',
};

export default function SavingsPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [savings, setSavings] = useState<any>(null);
  const [loadingSavings, setLoadingSavings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadMembers = () =>
    api
      .get('/members')
      .then((r) => setMembers(r.data))
      .catch(() => setMembers([]));

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    if (!form.memberId) {
      setSavings(null);
      return;
    }
    let cancelled = false;
    setLoadingSavings(true);
    api
      .get(`/savings/member/${form.memberId}`)
      .then((r) => {
        if (!cancelled) setSavings(r.data);
      })
      .catch(() => {
        if (!cancelled) setSavings(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingSavings(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.memberId]);

  const submit = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await api.post('/savings/contribute', {
        ...form,
        amount: parseFloat(form.amount),
      });
      setMessage('Contribution recorded successfully.');
      setForm((current) => ({ ...current, amount: '', notes: '' }));
      if (form.memberId) {
        const refreshed = await api
          .get(`/savings/member/${form.memberId}`)
          .catch(() => null);
        if (refreshed) setSavings(refreshed.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not record contribution.');
    } finally {
      setSaving(false);
    }
  };

  const account = savings?.account;
  const contributions = savings?.contributions || [];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Savings</p>
          <h1 className="page-title mt-2">Savings & contributions</h1>
          <p className="page-description">
            Record member contributions and keep an eye on account balances.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <section className="card xl:col-span-3">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <span className="stat-icon bg-amber-50 text-amber-600">
                <PiggyBank className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Record monthly contribution
                </h2>
                <p className="text-sm text-slate-500">
                  Cash contributions are posted immediately.
                </p>
              </div>
            </div>
          </div>
          <form onSubmit={submit} className="card-body grid grid-cols-1 gap-5 sm:grid-cols-2">
            {message && (
              <div className="alert-success flex items-center gap-2 sm:col-span-2">
                <CheckCircle2 className="h-4 w-4" />
                {message}
              </div>
            )}
            {error && <div className="alert-danger sm:col-span-2">{error}</div>}

            <div className="sm:col-span-2">
              <label className="label">Select member *</label>
              <select
                className="input"
                value={form.memberId}
                onChange={(e) => setForm({ ...form, memberId: e.target.value })}
                required
              >
                <option value="">Choose a member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} ({m.memberNo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Contribution month *</label>
              <input
                type="month"
                className="input"
                value={form.contributionMonth}
                onChange={(e) =>
                  setForm({ ...form, contributionMonth: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label">Amount (K) *</label>
              <input
                type="number"
                className="input"
                placeholder="45,000"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Notes</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Optional note about this contribution"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={saving} className="btn-primary">
                <Receipt className="h-4 w-4" />
                {saving ? 'Recording…' : 'Record contribution'}
              </button>
            </div>
          </form>
        </section>

        <div className="space-y-6 xl:col-span-2">
          <section className="card">
            <div className="card-header">
              <div className="flex items-center gap-3">
                <span className="stat-icon bg-brand-50 text-brand-600">
                  <Wallet className="h-5 w-5" />
                </span>
                <h2 className="text-base font-semibold text-slate-900">
                  Member account
                </h2>
              </div>
            </div>
            <div className="card-body">
              {!form.memberId ? (
                <p className="text-sm text-slate-500">
                  Select a member to preview their savings balance and recent
                  contributions.
                </p>
              ) : loadingSavings ? (
                <p className="text-sm text-slate-500">Loading account…</p>
              ) : account ? (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white shadow-glow">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-brand-100">
                      Current balance
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">
                      {formatCurrency(account.balance)}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs text-brand-100">
                      <span>Account no.</span>
                      <span className="font-semibold text-white">
                        {account.accountNo}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Recent contributions
                    </p>
                    {contributions.length > 0 ? (
                      <ul className="divide-y divide-slate-100">
                        {contributions.slice(0, 4).map((c: any) => (
                          <li
                            key={c.id}
                            className="flex items-center justify-between gap-3 py-2.5"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                <Receipt className="h-3.5 w-3.5" />
                              </span>
                              <div>
                                <p className="text-sm font-medium text-slate-900">
                                  {c.contributionMonth}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {formatDate(c.receivedAt)}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-emerald-600">
                              +{formatCurrency(c.amount)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">
                        No contributions recorded yet.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="alert-warning flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  This member does not have a savings account yet.
                </div>
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-body flex items-start gap-3">
              <span className="stat-icon bg-slate-100 text-slate-500">
                <Clock className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Monthly contribution reminder
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Members can also pay contributions from the mobile app using
                  Airtel Money or TNM Mpamba. Mobile payments appear here once
                  confirmed.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
