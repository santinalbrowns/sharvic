'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Users, CreditCard, PiggyBank, Receipt, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  useEffect(() => {
    api.get('/reports/summary').then(res => setSummary(res.data)).catch(console.error);
  }, []);
  const stats = [
    { name: 'Total Members', value: summary?.totalMembers || 0, subtext: `${summary?.activeMembers || 0} active`, icon: Users, color: 'bg-blue-500' },
    { name: 'Active Loans', value: summary?.disbursedLoans || 0, subtext: `${summary?.pendingLoans || 0} pending`, icon: CreditCard, color: 'bg-green-500' },
    { name: 'Total Contributions', value: `K ${(summary?.totalContributions || 0).toLocaleString()}`, subtext: 'All time', icon: PiggyBank, color: 'bg-amber-500' },
    { name: 'Outstanding Loans', value: `K ${(summary?.totalOutstanding || 0).toLocaleString()}`, subtext: 'To collect', icon: AlertCircle, color: 'bg-red-500' },
  ];
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="mt-1 text-sm text-gray-600">Welcome to Sharvic Micro-Finance Village Banking Dashboard</p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stat.color} rounded-lg p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="text-xl font-semibold text-gray-900">{stat.value}</dd>
                    <dd className="text-xs text-gray-500 mt-1">{stat.subtext}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <a href="/members" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div><p className="font-medium text-gray-900">Add Member</p><p className="text-sm text-gray-500">Register new member</p></div>
            </a>
            <a href="/loans" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <CreditCard className="h-8 w-8 text-green-600 mr-3" />
              <div><p className="font-medium text-gray-900">New Loan</p><p className="text-sm text-gray-500">Apply for loan</p></div>
            </a>
            <a href="/savings" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <PiggyBank className="h-8 w-8 text-amber-600 mr-3" />
              <div><p className="font-medium text-gray-900">Record Contribution</p><p className="text-sm text-gray-500">Add savings</p></div>
            </a>
            <a href="/expenses" className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Receipt className="h-8 w-8 text-red-600 mr-3" />
              <div><p className="font-medium text-gray-900">Add Expense</p><p className="text-sm text-gray-500">Record expenditure</p></div>
            </a>
          </div>
        </div>
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Financial Summary</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between"><span className="text-sm text-gray-600">Total Loans Disbursed</span><span className="text-sm font-semibold text-gray-900">K {(summary?.totalLoanAmount || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-600">Total Repayments</span><span className="text-sm font-semibold text-green-600">K {(summary?.totalRepayments || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-600">Total Expenses</span><span className="text-sm font-semibold text-red-600">K {(summary?.totalExpenses || 0).toLocaleString()}</span></div>
            <div className="pt-4 border-t border-gray-200 flex justify-between"><span className="text-base font-medium text-gray-900">Net Position</span><span className="text-base font-semibold text-blue-600">K {((summary?.totalContributions || 0) + (summary?.totalRepayments || 0) - (summary?.totalExpenses || 0)).toLocaleString()}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
