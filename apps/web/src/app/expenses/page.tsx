'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Plus, CheckCircle } from 'lucide-react';
export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ description:'', category:'', amount:'', paidTo:'', notes:'' });
  const load = () => api.get('/expenses').then(r=>setExpenses(r.data));
  useEffect(()=>{load();},[]);
  const submit = async (e:any)=>{e.preventDefault(); await api.post('/expenses',{...form, amount:parseFloat(form.amount)}); setShowForm(false); setForm({description:'',category:'',amount:'',paidTo:'',notes:''}); load();};
  const approve = async (id:string)=>{ await api.post(`/expenses/${id}/approve`,{}); load(); };
  const filtered = filter === 'all' ? expenses : expenses.filter(e => e.status === filter);
  const getStatusColor = (status:string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="mt-1 text-sm text-gray-600">Track and manage group expenditures</p>
        </div>
        <button onClick={()=>setShowForm(!showForm)} className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />Add Expense
        </button>
      </div>
      {showForm && (
        <div className="mb-6 bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200"><h3 className="text-lg font-medium text-gray-900">Record Expense</h3></div>
          <form onSubmit={submit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Description *</label><input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Category *</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.category} onChange={e=>setForm({...form, category:e.target.value})} required><option value="">Select</option><option value="Stationery">Stationery</option><option value="Transport">Transport</option><option value="Food">Food</option><option value="Other">Other</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount (K) *</label><input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Paid To</label><input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.paidTo} onChange={e=>setForm({...form, paidTo:e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} /></div>
            <div className="md:col-span-2 flex space-x-3"><button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">Submit</button><button type="button" onClick={()=>setShowForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Cancel</button></div>
          </form>
        </div>
      )}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Expense List</h3>
          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All</option><option value="pending">Pending</option><option value="approved">Approved</option></select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expense No.</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th></tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(e=>(
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{e.expenseNo}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{e.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">K {e.amount?.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusColor(e.status)}`}>{e.status}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">{e.status==='pending' && <button onClick={()=>approve(e.id)} className="text-green-600"><CheckCircle className="h-4 w-4 inline" /></button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
