'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { initials } from '@/lib/format';
import {
  AlertTriangle,
  Eye,
  Gauge,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react';

const scoreText = (score: number) =>
  score >= 80
    ? 'text-emerald-600'
    : score >= 60
      ? 'text-brand-600'
      : score >= 40
        ? 'text-amber-600'
        : 'text-rose-600';

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

export default function ScoresPage() {
  const [scores, setScores] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/reports/credit-scores')
      .then((res) => setScores(res.data))
      .catch(() => setError('Failed to load credit scores'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = scores.filter((s) =>
    `${s.firstName} ${s.lastName} ${s.memberNo}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const averageScore = scores.length
    ? Math.round(
        scores.reduce((sum, s) => sum + s.creditScore, 0) / scores.length
      )
    : 0;
  const excellentCount = scores.filter((s) => s.creditScore >= 80).length;
  const atRiskCount = scores.filter((s) => s.creditScore < 40).length;

  const cards = [
    {
      name: 'Average score',
      value: `${averageScore}/100`,
      icon: Gauge,
      tint: 'bg-violet-50 text-violet-600',
    },
    {
      name: 'Excellent (80+)',
      value: excellentCount,
      icon: TrendingUp,
      tint: 'bg-emerald-50 text-emerald-600',
    },
    {
      name: 'At risk (<40)',
      value: atRiskCount,
      icon: AlertTriangle,
      tint: 'bg-rose-50 text-rose-600',
    },
    {
      name: 'Scored members',
      value: scores.length,
      icon: Users,
      tint: 'bg-brand-50 text-brand-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <p className="eyebrow">Risk</p>
          <h1 className="page-title mt-2">Credit scores</h1>
          <p className="page-description">
            Member credit health based on repayments, savings, membership and
            guarantor history.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.name} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.name}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {card.value}
                </p>
              </div>
              <span className={`stat-icon ${card.tint}`}>
                <card.icon className="h-5 w-5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      <section className="card overflow-hidden">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <span className="stat-icon bg-slate-100 text-slate-500">
              <Gauge className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Member scores
              </h2>
              <p className="text-sm text-slate-500">
                {filtered.length} of {scores.length} members
              </p>
            </div>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search members…"
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
                <th>Type</th>
                <th>Score</th>
                <th>Rating</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="empty-state">
                    Loading credit scores…
                  </td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-rose-600">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-state">
                    No members found.
                  </td>
                </tr>
              )}
              {filtered.map((s) => (
                <tr key={s.memberId}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-bold text-violet-700 ring-1 ring-inset ring-violet-600/10">
                        {initials(s.firstName, s.lastName)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {s.firstName} {s.lastName}
                        </p>
                        <p className="truncate text-xs capitalize text-slate-400">
                          {s.status}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap font-medium text-slate-900">
                    {s.memberNo}
                  </td>
                  <td>
                    <span
                      className={
                        s.memberType === 'member' ? 'badge-info' : 'badge-purple'
                      }
                    >
                      {s.memberType === 'member' ? 'Member' : 'Non-member'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 text-sm font-bold ${scoreText(s.creditScore)}`}
                      >
                        {s.creditScore}
                      </span>
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100 sm:w-36">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${scoreBar(s.creditScore)}`}
                          style={{ width: `${s.creditScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={ratingBadge(s.rating)}>{s.rating}</span>
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/members/${s.memberId}`}
                      className="icon-btn ml-auto"
                      aria-label={`View ${s.firstName} ${s.lastName}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
