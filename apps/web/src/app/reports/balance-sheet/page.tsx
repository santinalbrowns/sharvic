'use client';

import { useState, useEffect } from 'react';

interface BalanceSheet {
  asOfDate: string;
  assets: {
    cash: number;
    loansReceivable: number;
    total: number;
  };
  liabilities: {
    memberSavings: number;
    total: number;
  };
  equity: {
    retainedEarnings: number;
    total: number;
  };
}

export default function BalanceSheetPage() {
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchBalanceSheet();
  }, [asOfDate]);

  const fetchBalanceSheet = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:4000/api/reports/balance-sheet?asOfDate=${asOfDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setBalanceSheet(data);
    } catch (error) {
      console.error('Failed to fetch balance sheet:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading balance sheet...</p>
        </div>
      </div>
    );
  }

  if (!balanceSheet) {
    return (
      <div className="p-8">
        <p className="text-red-600">Failed to load balance sheet</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Balance Sheet</h1>
        <p className="text-gray-600">Financial position statement</p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <label className="font-medium">As of Date:</label>
        <input
          type="date"
          value={asOfDate}
          onChange={(e) => setAsOfDate(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <button
          onClick={fetchBalanceSheet}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Refresh
        </button>
        <button
          onClick={() => window.print()}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Print
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Assets Section */}
        <div className="border-b border-gray-200">
          <div className="bg-blue-50 px-6 py-3">
            <h2 className="text-xl font-bold text-blue-900">ASSETS</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Cash</span>
                <span className="font-medium">{formatCurrency(balanceSheet.assets.cash)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Loans Receivable</span>
                <span className="font-medium">{formatCurrency(balanceSheet.assets.loansReceivable)}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-gray-300">
                <span className="font-bold text-lg">Total Assets</span>
                <span className="font-bold text-lg">{formatCurrency(balanceSheet.assets.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Liabilities Section */}
        <div className="border-b border-gray-200">
          <div className="bg-red-50 px-6 py-3">
            <h2 className="text-xl font-bold text-red-900">LIABILITIES</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Member Savings</span>
                <span className="font-medium">{formatCurrency(balanceSheet.liabilities.memberSavings)}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-gray-300">
                <span className="font-bold text-lg">Total Liabilities</span>
                <span className="font-bold text-lg">{formatCurrency(balanceSheet.liabilities.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Equity Section */}
        <div>
          <div className="bg-green-50 px-6 py-3">
            <h2 className="text-xl font-bold text-green-900">EQUITY</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-gray-700">Retained Earnings</span>
                <span className="font-medium">{formatCurrency(balanceSheet.equity.retainedEarnings)}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-gray-300">
                <span className="font-bold text-lg">Total Equity</span>
                <span className="font-bold text-lg">{formatCurrency(balanceSheet.equity.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Check */}
        <div className="bg-gray-100 px-6 py-4 border-t-4 border-gray-400">
          <div className="flex justify-between">
            <span className="font-bold text-xl">Total Liabilities + Equity</span>
            <span className="font-bold text-xl">
              {formatCurrency(balanceSheet.liabilities.total + balanceSheet.equity.total)}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {balanceSheet.assets.total === (balanceSheet.liabilities.total + balanceSheet.equity.total)
              ? '✓ Balance sheet is balanced'
              : '⚠ Warning: Balance sheet is not balanced'}
          </p>
        </div>
      </div>

      <div className="mt-8 text-sm text-gray-600">
        <p>Generated on: {new Date().toLocaleString()}</p>
        <p>As of: {new Date(balanceSheet.asOfDate).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
