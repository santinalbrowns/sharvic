'use client';

import { useState, useEffect } from 'react';

interface Transaction {
  id: string;
  transactionNo: string;
  type: string;
  amount: number;
  direction: 'credit' | 'debit';
  description: string;
  performedAt: string;
}

interface CashFlow {
  period: {
    startDate: string;
    endDate: string;
  };
  operatingActivities: {
    transactions: Transaction[];
    netCashFlow: number;
  };
  financingActivities: {
    transactions: Transaction[];
    netCashFlow: number;
  };
  netCashChange: number;
}

export default function CashFlowPage() {
  const [cashFlow, setCashFlow] = useState<CashFlow | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchCashFlow();
  }, []);

  const fetchCashFlow = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:4000/api/reports/cash-flow?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setCashFlow(data);
    } catch (error) {
      console.error('Failed to fetch cash flow:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency: 'ZMW',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cash flow statement...</p>
        </div>
      </div>
    );
  }

  if (!cashFlow) {
    return (
      <div className="p-8">
        <p className="text-red-600">Failed to load cash flow statement</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Cash Flow Statement</h1>
        <p className="text-gray-600">Analysis of cash movements</p>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="font-medium block mb-1">Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="font-medium block mb-1">End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={fetchCashFlow}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Generate Report
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Print
          </button>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Period Header */}
        <div className="bg-gray-800 text-white px-6 py-4">
          <p className="text-center text-lg">
            For the period: {formatDate(cashFlow.period.startDate)} to {formatDate(cashFlow.period.endDate)}
          </p>
        </div>

        {/* Operating Activities */}
        <div className="border-b border-gray-200">
          <div className="bg-blue-50 px-6 py-3">
            <h2 className="text-xl font-bold text-blue-900">CASH FLOWS FROM OPERATING ACTIVITIES</h2>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {cashFlow.operatingActivities.transactions.map((tx) => (
                <div key={tx.id} className="flex justify-between py-2 text-sm">
                  <span className="text-gray-700">
                    {tx.description}
                    <span className="text-xs text-gray-500 ml-2">({tx.type.replace(/_/g, ' ')})</span>
                  </span>
                  <span className={tx.direction === 'credit' ? 'text-green-600' : 'text-red-600'}>
                    {tx.direction === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                  </span>
                </div>
              ))}
              <div className="flex justify-between py-3 border-t-2 border-gray-300">
                <span className="font-bold text-lg">Net Cash from Operating Activities</span>
                <span className={`font-bold text-lg ${cashFlow.operatingActivities.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(cashFlow.operatingActivities.netCashFlow)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Financing Activities */}
        <div className="border-b border-gray-200">
          <div className="bg-purple-50 px-6 py-3">
            <h2 className="text-xl font-bold text-purple-900">CASH FLOWS FROM FINANCING ACTIVITIES</h2>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {cashFlow.financingActivities.transactions.map((tx) => (
                <div key={tx.id} className="flex justify-between py-2 text-sm">
                  <span className="text-gray-700">
                    {tx.description}
                    <span className="text-xs text-gray-500 ml-2">({tx.type.replace(/_/g, ' ')})</span>
                  </span>
                  <span className={tx.direction === 'credit' ? 'text-green-600' : 'text-red-600'}>
                    {tx.direction === 'credit' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                  </span>
                </div>
              ))}
              <div className="flex justify-between py-3 border-t-2 border-gray-300">
                <span className="font-bold text-lg">Net Cash from Financing Activities</span>
                <span className={`font-bold text-lg ${cashFlow.financingActivities.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(cashFlow.financingActivities.netCashFlow)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Cash Change */}
        <div className={`${cashFlow.netCashChange >= 0 ? 'bg-green-50' : 'bg-red-50'} px-6 py-6`}>
          <div className="flex justify-between items-center">
            <span className="font-bold text-2xl">NET CHANGE IN CASH</span>
            <span className={`font-bold text-3xl ${cashFlow.netCashChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(cashFlow.netCashChange)}
            </span>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>
              {cashFlow.netCashChange >= 0 
                ? '✓ Positive cash flow - Cash increased during this period'
                : '⚠ Negative cash flow - Cash decreased during this period'}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm mb-2">Operating Cash Flow</p>
          <p className={`text-2xl font-bold ${cashFlow.operatingActivities.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(cashFlow.operatingActivities.netCashFlow)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {cashFlow.operatingActivities.transactions.length} transactions
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm mb-2">Financing Cash Flow</p>
          <p className={`text-2xl font-bold ${cashFlow.financingActivities.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(cashFlow.financingActivities.netCashFlow)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {cashFlow.financingActivities.transactions.length} transactions
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm mb-2">Net Cash Change</p>
          <p className={`text-2xl font-bold ${cashFlow.netCashChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(cashFlow.netCashChange)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Period: {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days
          </p>
        </div>
      </div>

      <div className="mt-8 text-sm text-gray-600">
        <p>Generated on: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}
