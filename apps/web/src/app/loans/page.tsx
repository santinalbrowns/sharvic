'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Plus, Eye, CheckCircle, XCircle, DollarSign, ShieldCheck, Gauge } from 'lucide-react';
export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ memberId:'', principalAmount:'', termMonths:'6', purpose:'' });
  const [eligibility, setEligibility] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [applyError, setApplyError] = useState('');
  const load = () => { api.get('/loans').then(r=>setLoans(r.data)); api.get('/members').then(r=>setMembers(r.data)); };
  useEffect(()=>{load();},[]);
  useEffect(()=>{
    if(!form.memberId){ setEligibility(null); return; }
    let cancelled = false;
    const timer = setTimeout(async ()=>{
      setChecking(true);
      try{
        const r = await api.post('/loans/check-eligibility',{ memberId: form.memberId, requestedAmount: parseFloat(form.principalAmount) || 0 });
        if(!cancelled) setEligibility(r.data);
      }catch(e){
        if(!cancelled) setEligibility(null);
      }finally{
        if(!cancelled) setChecking(false);
      }
    }, 400);
    return ()=>{ cancelled = true; clearTimeout(timer); };
  },[form.memberId, form.principalAmount]);
  const apply = async (e:any)=>{
    e.preventDefault();
    setApplyError('');
    try{
      await api.post('/loans/apply',{...form, principalAmount:parseFloat(form.principalAmount), termMonths:parseInt(form.termMonths)});
      setShowForm(false);
      load();
    }catch(err:any){
      setApplyError(err.response?.data?.reasons?.join(' • ') || err.response?.data?.error || 'Failed to submit loan application');
    }
  };
  const approve = async (id:string)=>{ await api.post(`/loans/${id}/approve`,{}); load(); };
  const reject = async (id:string)=>{ const reason = prompt('Reason for rejection:'); if(reason) await api.post(`/loans/${id}/reject`,{reason}); load(); };
  const disburse = async (id:string)=>{ await api.post(`/loans/${id}/disburse`,{}); load(); };
  const filtered = filter === 'all' ? loans : loans.filter(l => l.status === filter);
  const getStatusColor = (status:string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'disbursed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loans</h1>
          <p className="mt-1 text-sm text-gray-600">Manage loan applications, approvals and repayments</p>
        </div>
        <button onClick={()=>setShowForm(!showForm)} className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />New Loan Application
        </button>
      </div>
      {showForm && (
        <div className="mb-6 bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200"><h3 className="text-lg font-medium text-gray-900">Loan Application</h3></div>
          <form onSubmit={apply} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Member *</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.memberId} onChange={e=>setForm({...form, memberId:e.target.value})} required><option value="">Select Member</option>{members.map(m=><option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.memberNo}) - {m.memberType}</option>)}</select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Principal Amount (K) *</label>
              <input type="number" min="0" max={eligibility?.maxLoanAmount} className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.principalAmount} onChange={e=>setForm({...form, principalAmount:e.target.value})} required />
              {eligibility && (
                <p className="mt-1 text-xs text-gray-500">Maximum available: K {eligibility.maxLoanAmount?.toLocaleString()}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term (Months) *</label>
              <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.termMonths} onChange={e=>setForm({...form, termMonths:e.target.value})} required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Loan Purpose *</label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.purpose} onChange={e=>setForm({...form, purpose:e.target.value})} required />
            </div>
            {form.memberId && (
              <div className={`md:col-span-2 rounded-lg border p-4 ${
                checking ? 'border-gray-200 bg-gray-50'
                  : eligibility?.eligible ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
              }`}>
                {checking ? (
                  <p className="flex items-center text-sm text-gray-600"><Gauge className="h-4 w-4 mr-2 animate-pulse" />Checking credit score and eligibility...</p>
                ) : eligibility && (
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <ShieldCheck className={`h-5 w-5 ${eligibility.eligible ? 'text-green-600' : 'text-red-600'}`} />
                      <span className={`text-sm font-semibold ${eligibility.eligible ? 'text-green-800' : 'text-red-800'}`}>
                        {eligibility.eligible ? 'Eligible for this loan' : 'Not eligible for this loan'}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-white text-gray-700 border border-gray-200">
                        Credit score: {eligibility.creditScore}/100
                      </span>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-white text-gray-700 border border-gray-200">
                        Max loan: K {eligibility.maxLoanAmount?.toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-600">
                      Limit = score × savings × {eligibility.loanToSavingsMultiplier} (savings balance: K {eligibility.savingsBalance?.toLocaleString()})
                    </p>
                    {eligibility.reasons?.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {eligibility.reasons.map((reason:string)=>(
                          <li key={reason} className="flex items-start text-xs text-red-700">
                            <XCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />{reason}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
            {applyError && <div className="md:col-span-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{applyError}</div>}
            <div className="md:col-span-2 flex space-x-3">
              <button type="submit" disabled={checking || (eligibility && !eligibility.eligible)} className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed">Submit Application</button>
              <button type="button" onClick={()=>setShowForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Cancel</button>
            </div>
          </form>
        </div>
      )}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Loan Applications</h3>
          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="disbursed">Disbursed</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Principal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(l=>(
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600"><a href={`/loans/${l.id}`}>{l.loanNo}</a></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">K {l.principalAmount?.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{l.interestRate}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">K {l.totalRepayable?.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">K {l.outstandingBalance?.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusColor(l.status)}`}>{l.status}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    {l.status==='pending' && (<><button onClick={()=>approve(l.id)} className="text-green-600"><CheckCircle className="h-4 w-4 inline" /></button><button onClick={()=>reject(l.id)} className="text-red-600"><XCircle className="h-4 w-4 inline" /></button></>)}
                    {l.status==='approved' && <button onClick={()=>disburse(l.id)} className="text-blue-600"><DollarSign className="h-4 w-4 inline" /></button>}
                    <a href={`/loans/${l.id}`} className="text-gray-600"><Eye className="h-4 w-4 inline" /></a>
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
