'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, User, PiggyBank, Gauge, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

const scoreColor = (score: number) =>
  score >= 80 ? 'text-green-600' : score >= 60 ? 'text-blue-600' : score >= 40 ? 'text-amber-600' : 'text-red-600';

const scoreBarColor = (score: number) =>
  score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-blue-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';

const ratingBadgeColor = (rating: string) =>
  rating === 'excellent' ? 'bg-green-100 text-green-800'
    : rating === 'good' ? 'bg-blue-100 text-blue-800'
      : rating === 'fair' ? 'bg-amber-100 text-amber-800'
        : 'bg-red-100 text-red-800';

export default function MemberDetailPage() {
  const params = useParams();
  const [member, setMember] = useState<any>(null);
  const [savings, setSavings] = useState<any>(null);
  const [credit, setCredit] = useState<any>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  const load = async ()=>{
    const m = await api.get(`/members/${params.id}`);
    setMember(m.data);
    try{ const s = await api.get(`/savings/member/${params.id}`); setSavings(s.data); }catch(e){}
    try{ const c = await api.get(`/reports/credit-score/${params.id}`); setCredit(c.data); }catch(e){}
    try{ const e = await api.post('/loans/check-eligibility', { memberId: params.id, requestedAmount: 0 }); setEligibility(e.data); }catch(e){}
  };
  useEffect(()=>{load();},[params.id]);
  if(!member) return <div className="p-6">Loading...</div>;
  return (
    <div>
      <div className="mb-6">
        <a href="/members" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Members
        </a>
        <h1 className="text-2xl font-bold text-gray-900">{member.firstName} {member.lastName}</h1>
        <p className="text-sm text-gray-600">Member No: {member.memberNo}</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200"><h3 className="text-lg font-medium text-gray-900 flex items-center"><User className="h-5 w-5 mr-2 text-blue-600" />Personal Information</h3></div>
          <div className="p-6 space-y-3">
            <div className="flex justify-between"><span className="text-sm text-gray-600">Full Name</span><span className="text-sm font-medium text-gray-900">{member.firstName} {member.lastName}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-600">Phone</span><span className="text-sm font-medium text-gray-900">{member.phone}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-600">National ID</span><span className="text-sm font-medium text-gray-900">{member.nationalId || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-600">Member Type</span><span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{member.memberType}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-600">Status</span><span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">{member.status}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-600">Joined</span><span className="text-sm font-medium text-gray-900">{new Date(member.joinedAt).toLocaleDateString()}</span></div>
          </div>
        </div>
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200"><h3 className="text-lg font-medium text-gray-900 flex items-center"><PiggyBank className="h-5 w-5 mr-2 text-amber-600" />Savings Account</h3></div>
          <div className="p-6">
            {savings ? (
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-sm text-gray-600">Account No.</span><span className="text-sm font-medium text-gray-900">{savings.account.accountNo}</span></div>
                <div className="flex justify-between pt-3 border-t"><span className="text-base font-medium">Balance</span><span className="text-base font-semibold text-green-600">K {savings.account.balance?.toLocaleString()}</span></div>
              </div>
            ) : <p className="text-sm text-gray-500">No savings account</p>}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Gauge className="h-5 w-5 mr-2 text-indigo-600" />Credit Score
          </h3>
          {credit && (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${ratingBadgeColor(credit.rating)}`}>
              {credit.rating}
            </span>
          )}
        </div>
        {credit ? (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-200 pb-6 lg:pb-0 lg:pr-8">
              <p className={`text-6xl font-bold ${scoreColor(credit.score)}`}>{credit.score}</p>
              <p className="mt-1 text-sm text-gray-500">out of 100</p>
              <div className="mt-4 w-full bg-gray-100 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${scoreBarColor(credit.score)}`}
                  style={{ width: `${credit.score}%` }}
                />
              </div>
              {eligibility ? (
                <div className={`mt-5 w-full rounded-lg p-4 ${eligibility.eligible ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center">
                    <ShieldCheck className={`h-5 w-5 mr-2 ${eligibility.eligible ? 'text-green-600' : 'text-red-600'}`} />
                    <span className={`text-sm font-semibold ${eligibility.eligible ? 'text-green-800' : 'text-red-800'}`}>
                      {eligibility.eligible ? 'Eligible for a loan' : 'Not eligible for a loan'}
                    </span>
                  </div>
                  {!eligibility.eligible && eligibility.reasons?.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {eligibility.reasons.map((reason: string) => (
                        <li key={reason} className="flex items-start text-xs text-red-700">
                          <XCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />{reason}
                        </li>
                      ))}
                    </ul>
                  )}
                  {eligibility.eligible && (
                    <p className="mt-2 flex items-center text-xs text-green-700">
                      <CheckCircle2 className="h-4 w-4 mr-2" />Meets all eligibility requirements
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-5 w-full rounded-lg bg-gray-50 p-4 text-sm text-gray-500">Eligibility check unavailable</p>
              )}
            </div>
            <div className="lg:col-span-2 space-y-4">
              <p className="text-sm font-medium text-gray-700">Score Breakdown</p>
              {credit.factors?.map((factor: any) => (
                <div key={factor.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{factor.label}</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {factor.score}/{factor.maxScore}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${scoreBarColor((factor.score / factor.maxScore) * 100)}`}
                      style={{ width: `${Math.min(100, (factor.score / factor.maxScore) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{factor.description}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 text-sm text-gray-500">Credit score unavailable</div>
        )}
      </div>
    </div>
  );
}
