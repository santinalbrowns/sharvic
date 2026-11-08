'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { BarChart3, Users, CreditCard, DollarSign } from 'lucide-react';
export default function ReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loans, setLoans] = useState<any[]>([]);
  useEffect(()=>{
    api.get('/reports/summary').then(r=>setSummary(r.data));
    api.get('/reports/loan-performance').then(r=>setLoans(r.data));
  },[]);
  const cards = [
    { name: 'Total Members', value: summary?.totalMembers || 0, icon: Users, color: 'text-blue-600' },
    { name: 'Total Contributions', value: `K ${(summary?.totalContributions||0).toLocaleString()}`, icon: DollarSign, color: 'text-green-600' },
    { name: 'Loans Disbursed', value: `K ${(summary?.totalLoanAmount||0).toLocaleString()}`, icon: CreditCard, color: 'text-purple-600' },
    { name: 'Outstanding', value: `K ${(summary?.totalOutstanding||0).toLocaleString()}`, icon: DollarSign, color: 'text-red-600' },
  ];
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
        <p className="mt-1 text-sm text-gray-600">Comprehensive financial overview</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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
        <div className="px-6 py-4 border-b border-gray-200 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Loan Performance</h3>
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loans.map(l=>(
                <tr key={l.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{l.loanNo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">K {l.principalAmount?.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{l.interestRate}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">K {l.totalRepayable?.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">K {l.outstandingBalance?.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{l.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
