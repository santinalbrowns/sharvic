'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Gauge, Search, Users, AlertTriangle, TrendingUp, Eye } from 'lucide-react';

const scoreColor = (score: number) =>
  score >= 80 ? 'text-green-600' : score >= 60 ? 'text-blue-600' : score >= 40 ? 'text-amber-600' : 'text-red-600';

const scoreBarColor = (score: number) =>
  score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-blue-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';

const ratingBadgeColor = (rating: string) =>
  rating === 'excellent' ? 'bg-green-100 text-green-800'
    : rating === 'good' ? 'bg-blue-100 text-blue-800'
      : rating === 'fair' ? 'bg-amber-100 text-amber-800'
        : 'bg-red-100 text-red-800';

export default function ScoresPage() {
  const [scores, setScores] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/reports/credit-scores')
      .then(res => setScores(res.data))
      .catch(() => setError('Failed to load credit scores'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = scores.filter((s) =>
    `${s.firstName} ${s.lastName} ${s.memberNo}`.toLowerCase().includes(search.toLowerCase())
  );

  const averageScore = scores.length
    ? Math.round(scores.reduce((sum, s) => sum + s.creditScore, 0) / scores.length)
    : 0;
  const excellentCount = scores.filter((s) => s.creditScore >= 80).length;
  const atRiskCount = scores.filter((s) => s.creditScore < 40).length;

  const cards = [
    { name: 'Average Score', value: `${averageScore}/100`, icon: Gauge, color: 'text-indigo-600' },
    { name: 'Excellent (80+)', value: excellentCount, icon: TrendingUp, color: 'text-green-600' },
    { name: 'At Risk (<40)', value: atRiskCount, icon: AlertTriangle, color: 'text-red-600' },
    { name: 'Scored Members', value: scores.length, icon: Users, color: 'text-blue-600' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Credit Scores</h1>
        <p className="mt-1 text-sm text-gray-600">Member credit health based on repayments, savings, membership and guarantor history</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {cards.map((card) => (
          <div key={card.name} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
              </div>
              <card.icon className={`h-8 w-8 ${card.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Member Scores</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search members..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">Loading credit scores...</td>
                </tr>
              )}
              {error && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-red-600">{error}</td>
                </tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No members found</td>
                </tr>
              )}
              {filtered.map((s) => (
                <tr key={s.memberId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Gauge className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{s.firstName} {s.lastName}</div>
                        <div className="text-sm text-gray-500 capitalize">{s.status}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.memberNo}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${s.memberType === 'member' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                      {s.memberType === 'member' ? 'Member' : 'Non-Member'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-bold w-10 ${scoreColor(s.creditScore)}`}>{s.creditScore}</span>
                      <div className="w-32 bg-gray-100 rounded-full h-2 ml-2">
                        <div className={`h-2 rounded-full ${scoreBarColor(s.creditScore)}`} style={{ width: `${s.creditScore}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${ratingBadgeColor(s.rating)}`}>
                      {s.rating}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href={`/members/${s.memberId}`} className="text-blue-600 hover:text-blue-900">
                      <Eye className="h-4 w-4 inline" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
