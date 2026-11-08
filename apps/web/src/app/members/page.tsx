'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Plus, Search, User, Phone, Eye } from 'lucide-react';
export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', memberType: 'member', nationalId: '', address: '', gender: 'male', email: '', password: '' });
  const load = () => api.get('/members').then(res => setMembers(res.data));
  useEffect(() => { load(); }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/members', form);
    setShowForm(false);
    setForm({ firstName: '', lastName: '', phone: '', memberType: 'member', nationalId: '', address: '', gender: 'male', email: '', password: '' });
    load();
  };
  const filtered = members.filter(m => 
    `${m.firstName} ${m.lastName} ${m.memberNo} ${m.phone}`.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="mt-1 text-sm text-gray-600">Manage village banking members and their accounts</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </button>
      </div>
      {showForm && (
        <div className="mb-6 bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200"><h3 className="text-lg font-medium text-gray-900">Register New Member</h3></div>
          <form onSubmit={submit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label><input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label><input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label><input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">National ID</label><input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.nationalId} onChange={e => setForm({...form, nationalId: e.target.value})} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Member Type *</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.memberType} onChange={e => setForm({...form, memberType: e.target.value})}><option value="member">Member (10%)</option><option value="non_member">Non-Member (20%)</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Gender</label><select className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Login Email <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="member@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile App Password <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Set to create a member login" />
            </div>
            <div className="md:col-span-2 flex space-x-3"><button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">Save</button><button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">Cancel</button></div>
          </form>
        </div>
      )}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Member List</h3>
          <div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm" value={search} onChange={e => setSearch(e.target.value)} /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center"><User className="h-5 w-5 text-blue-600" /></div><div className="ml-4"><div className="text-sm font-medium text-gray-900">{m.firstName} {m.lastName}</div><div className="text-sm text-gray-500">{m.nationalId || 'No ID'}</div></div></div></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{m.memberNo}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center text-sm text-gray-900"><Phone className="h-4 w-4 mr-2 text-gray-400" />{m.phone}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${m.memberType === 'member' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>{m.memberType === 'member' ? 'Member' : 'Non-Member'}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{m.status}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(m.joinedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><a href={`/members/${m.id}`} className="text-blue-600 hover:text-blue-900"><Eye className="h-4 w-4 inline" /></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
