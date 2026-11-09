'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/format';
import { CheckCircle2, Plus, Receipt, X } from 'lucide-react';

const statusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return 'badge-warning';
    case 'approved':
      return 'badge-info';
    case 'paid':
      return 'badge-success';
    case 'rejected':
      return 'badge-danger';
    default:
      return 'badge-neutral';
  }
};

const emptyForm = {
  description: '',
  category: '',
  amount: '',
  paidTo: '',
  notes: '',
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () =>
    api
      .get('/expenses')
      .then((r) => setExpenses(r.data))
      .catch(() => setExpenses([]));

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/expenses', { ...form, amount: parseFloat(form.amount) });
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not record expense.');
    } finally {
      setSaving(false);
    }
  };

  const approve = async (id: string) => {
    await api.post(`/expenses/${id}/approve`, {});
    load();
  };

  const filtered =
    filter === 'all' ? expenses : expenses.filter((e) => e.status === filter);

  const total = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const pending = expenses.filter((e) => e.status === 'pending');
  const approved = expenses.filter((e) => e.status === 'approved');

  const stats = [
    { label: 'Total expenses', value: formatCurrency(total) },
    { label: 'Pending approval', value: formatNumber(pending.length) },
    { label: 'Approved', value: formatNumber(approved.length) },
    {
      label: 'Pending value',
      value: formatCurrency(
        pending.reduce((sum, e) => sum + Number(e.amount || 0), 0)
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Finance</p>
          <h1 className="page-title mt-2">Expenses</h1>
          <p className="page-description">
            Track group spending, submit expenses and approve them for payment.
          </p>
        </div>
        <button
          onClick={() => setShowForm((open) => !open)}
          className="btn-primary"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Close form' : 'Add expense'}
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
              <span className="stat-icon bg-rose-50 text-rose-600">
                <Receipt className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Record an expense
                </h2>
                <p className="text-sm text-slate-500">
                  New expenses start as pending until approved.
                </p>
              </div>
            </div>
          </div>
          <form onSubmit={submit} className="card-body grid grid-cols-1 gap-5 md:grid-cols-2">
            {error && <div className="alert-danger md:col-span-2">{error}</div>}
            <div className="md:col-span-2">
              <label className="label">Description *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Stationery for monthly meeting"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label">Category *</label>
              <select
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
              >
                <option value="">Select a category</option>
                <option value="Stationery">Stationery</option>
                <option value="Transport">Transport</option>
                <option value="Food">Food</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Amount (K) *</label>
              <input
                type="number"
                className="input"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Paid to</label>
              <input
                type="text"
                className="input"
                value={form.paidTo}
                onChange={(e) => setForm({ ...form, paidTo: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Notes</label>
              <input
                type="text"
                className="input"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Submitting…' : 'Submit expense'}
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
              <Receipt className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Expense list
              </h2>
              <p className="text-sm text-slate-500">
                {filtered.length} of {expenses.length} expenses
              </p>
            </div>
          </div>
          <select
            className="input w-full sm:w-44"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Expense no.</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td className="whitespace-nowrap font-medium text-slate-900">
                    {e.expenseNo}
                  </td>
                  <td>
                    <p className="font-medium text-slate-900">{e.description}</p>
                    {e.paidTo && (
                      <p className="text-xs text-slate-400">Paid to {e.paidTo}</p>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-slate-600">
                    {e.category}
                  </td>
                  <td className="whitespace-nowrap font-semibold text-slate-900">
                    {formatCurrency(e.amount)}
                  </td>
                  <td>
                    <span className={statusBadge(e.status)}>{e.status}</span>
                  </td>
                  <td>
                    <div className="flex justify-end">
                      {e.status === 'pending' && (
                        <button
                          onClick={() => approve(e.id)}
                          className="btn-ghost text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Approve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              {expenses.length === 0
                ? 'No expenses recorded yet.'
                : 'No expenses match this filter.'}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
