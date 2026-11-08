'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { PiggyBank } from 'lucide-react';
export default function SavingsPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [form, setForm] = useState({ memberId:'', amount:'', contributionMonth:new Date().toISOString().slice(0,7), notes:'' });
  const load = () => api.get('/members').then(r=>setMembers(r.data));
  useEffect(()=>{load();},[]);
  const submit = async (e:any)=>{e.preventDefault(); await api.post('/savings/contribute',{...form, amount:parseFloat(form.amount)}); alert('Contribution recorded successfully'); setForm({...form, amount:'', notes:''});};
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Savings & Contributions</h1>
        <p className="mt-1 text-sm text-gray-600">Record and track member monthly contributions</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center"><PiggyBank className="h-5 w-5 mr-2 text-amber-600" />Record Monthly Contribution</h3>
          </div>
          <form onSubmit={submit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Member *</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.memberId} onChange={e=>setForm({...form, memberId:e.target.value})} required><option value="">Choose a member</option>{members.map(m=><option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.memberNo})</option>)}</select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contribution Month *</label>
              <input type="month" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.contributionMonth} onChange={e=>setForm({...form, contributionMonth:e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (K) *</label>
              <input type="number" placeholder="45000" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})}></textarea>
            </div>
            <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Record Contribution</button>
          </form>
        </div>
      </div>
    </div>
  );
}
