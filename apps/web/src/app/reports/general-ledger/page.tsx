'use client';

import { useState, useEffect } from 'react';

interface Transaction {
  id: string;
  transactionNo: string;
  type: string;
  amount: number;
  direction: 'credit' | 'debit';
  description: string;
  balanceAfter: number;
  performedAt: string;
}

interface GeneralLedger {
  period: {
    startDate?: string;
    endDate?: string;
  };
  transactions: Transaction[];
  totalCount: number;
}

export default function GeneralLedgerPage() {
  const [ledger, setLedger] = useState<GeneralLedger | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchLedger();
  }, []);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = 'http://localhost:4000/api/reports/general-ledger';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setLedger(data);
    } catch (error) {
      console.error('Failed to fetch general ledger:', error);
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      contribution: 'bg-blue-100 text-blue-800',
      loan_disbursement: 'bg-purple-100 text-purple-800',
      loan_repayment: 'bg-green-100 text-green-800',
      expense: 'bg-red-100 text-red-800',
      fee: 'bg-yellow-100 text-yellow-800',
      adjustment: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const filteredTransactions = ledger?.transactions.filter(
    (t) => filterType === 'all' || t.type === filterType
  ) || [];

  const totalDebits = filteredTransactions
    .filter((t) => t.direction === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCredits = filteredTransactions
    .filter((t) => t.direction === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading general ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">General Ledger</h1>
        <p className="text-gray-600">Complete transaction history</p>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center gap-4">
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
          <div>
            <label className="font-medium block mb-1">Filter Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="all">All Types</option>
              <option value="contribution">Contributions</option>
              <option value="loan_disbursement">Loan Disbursements</option>
              <option value="loan_repayment">Loan Repayments</option>
              <option value="expense">Expenses</option>
              <option value="fee">Fees</option>
              <option value="adjustment">Adjustments</option>
            </select>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={fetchLedger}
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
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setFilterType('all');
              fetchLedger();
            }}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Transactions</p>
          <p className="text-3xl font-bold">{filteredTransactions.length}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Credits</p>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(totalCredits)}</p>
        </div>
        <div className="bg-red-50 p-6 rounded-lg shadow">
          <p className="text-gray-600 text-sm">Total Debits</p>
          <p className="text-3xl font-bold text-red-600">{formatCurrency(totalDebits)}</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Debit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(transaction.performedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                      {transaction.transactionNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(transaction.type)}`}>
                        {transaction.type.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                      {transaction.direction === 'debit' ? formatCurrency(transaction.amount) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                      {transaction.direction === 'credit' ? formatCurrency(transaction.amount) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold">
                      {transaction.balanceAfter != null ? formatCurrency(transaction.balanceAfter) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredTransactions.length > 0 && (
              <tfoot className="bg-gray-100">
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-right font-bold">
                    TOTALS:
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-red-600">
                    {formatCurrency(totalDebits)}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-green-600">
                    {formatCurrency(totalCredits)}
                  </td>
                  <td className="px-6 py-4 text-right font-bold">
                    {formatCurrency(totalCredits - totalDebits)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="mt-8 text-sm text-gray-600">
        <p>Generated on: {new Date().toLocaleString()}</p>
        <p>Total entries: {filteredTransactions.length} of {ledger?.totalCount || 0}</p>
      </div>
    </div>
  );
}
