'use client';
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { ArrowLeft, DollarSign } from 'lucide-react';

export default function LoanDetailPage() {
  const params = useParams();
  const [loan, setLoan] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const load = () => api.get(`/loans/${params.id}`).then(r=>setLoan(r.data));
  useEffect(()=>{load();},[params.id]);
  const repay = async (e:any)=>{e.preventDefault(); await api.post(`/loans/${params.id}/repay`,{amount, paymentMethod:"cash"}); setAmount(""); load();};
  if(!loan) return <div className="p-6">Loading...</div>;
  return (
    <div>
      <div className="mb-6">
        <a href="/loans" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Loans
        </a>
        <h1 className="text-2xl font-bold text-gray-900">Loan {loan.loanNo}</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200"><h3 className="text-lg font-medium text-gray-900">Loan Information</h3></div>
          <div className="p-6 space-y-3">
            <div className="flex justify-between"><span className="text-sm text-gray-600">Principal Amount</span><span className="text-sm font-semibold text-gray-900">K {loan.principalAmount?.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-600">Interest Rate</span><span className="text-sm font-semibold text-gray-900">{loan.interestRate}%</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-600">Total Repayable</span><span className="text-base font-semibold text-gray-900">K {loan.totalRepayable?.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-600">Outstanding Balance</span><span className="text-sm font-semibold text-red-600">K {loan.outstandingBalance?.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-600">Status</span><span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">{loan.status}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-600">Purpose</span><span className="text-sm text-gray-900 text-right">{loan.purpose}</span></div>
          </div>
        </div>
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200"><h3 className="text-lg font-medium text-gray-900 flex items-center"><DollarSign className="h-5 w-5 mr-2 text-green-600" />Record Repayment</h3></div>
          <form onSubmit={repay} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (K)</label>
              <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={amount} onChange={e=>setAmount(e.target.value)} required />
            </div>
            <button type="submit" className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Record Payment</button>
          </form>
        </div>
      </div>
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200"><h3 className="text-lg font-medium text-gray-900">Repayment History</h3></div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loan.repayments?.map((r:any)=>(
                <tr key={r.id}><td className="px-6 py-4 text-sm font-medium">{r.receiptNo}</td><td className="px-6 py-4 text-sm text-green-600 font-semibold">K {r.amount?.toLocaleString()}</td><td className="px-6 py-4 text-sm text-gray-500">{new Date(r.receivedAt).toLocaleDateString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
