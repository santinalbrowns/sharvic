'use client';

import { useState, useEffect } from 'react';

interface IncomeStatement {
  period: {
    startDate: string;
    endDate: string;
  };
  revenue: {
    interestIncome: number;
    membershipFees: number;
    total: number;
  };
  expenses: {
    operatingExpenses: number;
    total: number;
  };
  netIncome: number;
}

export default function IncomeStatementPage() {
  const [statement, setStatement] = useState<IncomeStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchStatement();
  }, []);

  const fetchStatement = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:4000/api/reports/income-statement?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setStatement(data);
    } catch (error) {
      console.error('Failed to fetch income statement:', error);
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
          <p className="mt-4 text-gray-600">Loading income statement...</p>
        </div>
      </div>
    );
  }

  if (!statement) {
    return (
      <div className="p-8">
        <p className="text-red-600">Failed to load income statement</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Income Statement</h1>
        <p className="text-gray-600">Profit & Loss Statement</p>
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
            onClick={fetchStatement}
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
            For the period: {formatDate(statement.period.startDate)} to {formatDate(statement.period.endDate)}
          </p>
        </div>

        {/* Revenue Section */}
        <div className="border-b border-gray-200">
          <div className="bg-green-50 px-6 py-3">
            <h2 className="text-xl font-bold text-green-900">REVENUE</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Interest Income from Loans</span>
                <span className="font-medium">{formatCurrency(statement.revenue.interestIncome)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Membership Fees</span>
                <span className="font-medium">{formatCurrency(statement.revenue.membershipFees)}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-gray-300">
                <span className="font-bold text-lg">Total Revenue</span>
                <span className="font-bold text-lg text-green-600">
                  {formatCurrency(statement.revenue.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="border-b border-gray-200">
          <div className="bg-red-50 px-6 py-3">
            <h2 className="text-xl font-bold text-red-900">EXPENSES</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Operating Expenses</span>
                <span className="font-medium">{formatCurrency(statement.expenses.operatingExpenses)}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-gray-300">
                <span className="font-bold text-lg">Total Expenses</span>
                <span className="font-bold text-lg text-red-600">
                  {formatCurrency(statement.expenses.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Income Section */}
        <div className={`${statement.netIncome >= 0 ? 'bg-green-50' : 'bg-red-50'} px-6 py-6`}>
          <div className="flex justify-between items-center">
            <span className="font-bold text-2xl">
              {statement.netIncome >= 0 ? 'NET INCOME' : 'NET LOSS'}
            </span>
            <span className={`font-bold text-3xl ${statement.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(statement.netIncome))}
            </span>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>
              Profit Margin: {statement.revenue.total > 0 
                ? ((statement.netIncome / statement.revenue.total) * 100).toFixed(2) 
                : '0.00'}%
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-sm text-gray-600">
        <p>Generated on: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}
