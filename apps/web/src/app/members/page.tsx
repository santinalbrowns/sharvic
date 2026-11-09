'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatDate, initials } from '@/lib/format';
import { Eye, Phone, Plus, Search, User, Users, X } from 'lucide-react';

const emptyForm = {
  firstName: '',
  lastName: '',
  phone: '',
  memberType: 'member',
  nationalId: '',
  address: '',
  gender: 'male',
  email: '',
  password: '',
};

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () =>
    api
      .get('/members')
      .then((res) => setMembers(res.data))
      .catch(() => setMembers([]));

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/members', form);
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not register member.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = members.filter((m) =>
    `${m.firstName} ${m.lastName} ${m.memberNo} ${m.phone}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const activeCount = members.filter((m) => m.status === 'active').length;
  const memberCount = members.filter((m) => m.memberType === 'member').length;

  const stats = [
    { label: 'Total members', value: members.length },
    { label: 'Active', value: activeCount },
    { label: 'Members (10%)', value: memberCount },
    { label: 'Non-members (20%)', value: members.length - memberCount },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Members</p>
          <h1 className="page-title mt-2">Member directory</h1>
          <p className="page-description">
            Manage village banking members, their contact details and account
            status.
          </p>
        </div>
        <button onClick={() => setShowForm((open) => !open)} className="btn-primary">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Close form' : 'Add member'}
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
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Register a new member
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Required fields are marked with an asterisk.
              </p>
            </div>
            <span className="stat-icon bg-brand-50 text-brand-600">
              <User className="h-5 w-5" />
            </span>
          </div>
          <form onSubmit={submit} className="card-body grid grid-cols-1 gap-5 md:grid-cols-2">
            {error && <div className="alert-danger md:col-span-2">{error}</div>}

            <div>
              <label className="label">First name *</label>
              <input
                type="text"
                className="input"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Last name *</label>
              <input
                type="text"
                className="input"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Phone number *</label>
              <input
                type="tel"
                className="input"
                placeholder="+265 991 234 567"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">National ID</label>
              <input
                type="text"
                className="input"
                value={form.nationalId}
                onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Member type *</label>
              <select
                className="input"
                value={form.memberType}
                onChange={(e) => setForm({ ...form, memberType: e.target.value })}
              >
                <option value="member">Member (10%)</option>
                <option value="non_member">Non-member (20%)</option>
              </select>
            </div>
            <div>
              <label className="label">Gender</label>
              <select
                className="input"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Address</label>
              <input
                type="text"
                className="input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div>
              <label className="label">
                Login email{' '}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                type="email"
                className="input"
                placeholder="member@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">
                Mobile app password{' '}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="Set to create a member login"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : 'Save member'}
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
              <Users className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Member list
              </h2>
              <p className="text-sm text-slate-500">
                {filtered.length} of {members.length} members
              </p>
            </div>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, number or phone…"
              className="input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Member no.</th>
                <th>Contact</th>
                <th>Type</th>
                <th>Status</th>
                <th>Joined</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700 ring-1 ring-inset ring-brand-600/10">
                        {initials(m.firstName, m.lastName)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {m.firstName} {m.lastName}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {m.nationalId || 'No national ID'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap font-medium text-slate-900">
                    {m.memberNo}
                  </td>
                  <td className="whitespace-nowrap">
                    <span className="inline-flex items-center gap-2 text-slate-600">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {m.phone}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        m.memberType === 'member' ? 'badge-info' : 'badge-purple'
                      }
                    >
                      {m.memberType === 'member' ? 'Member' : 'Non-member'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        m.status === 'active'
                          ? 'badge-success'
                          : m.status === 'suspended'
                            ? 'badge-danger'
                            : 'badge-neutral'
                      }
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-slate-500">
                    {formatDate(m.joinedAt)}
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/members/${m.id}`}
                      className="icon-btn ml-auto"
                      aria-label={`View ${m.firstName} ${m.lastName}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              {members.length === 0
                ? 'No members registered yet. Add your first member to get started.'
                : 'No members match your search.'}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
