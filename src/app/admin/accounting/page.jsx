'use client';

import { useState, useMemo } from 'react';
import AdminLayout from '../AdminLayout';
import { useTheme } from '../../providers';
import { 
  useGetExpensesQuery, 
  useCreateExpenseMutation, 
  useUpdateExpenseMutation, 
  useDeleteExpenseMutation,
  useGetExpenseAnalyticsQuery,
  useGetProfitLossStatementQuery,
  useGetCashFlowStatementQuery,
  useGetRevenueAnalysisQuery,
  useGetTaxSummaryQuery
} from '../../../services/api';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaFilter,
  FaChartLine,
  FaFileDownload,
  FaMoneyBillWave,
  FaReceipt,
  FaCalculator,
  FaArrowUp
} from 'react-icons/fa';

export default function AccountingPage() {
  const { colors, theme } = useTheme();
  const [activeTab, setActiveTab] = useState('expenses');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // API Queries
  const { data: expenses = [], isLoading: expensesLoading } = useGetExpensesQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    category: categoryFilter || undefined,
    limit: 100
  });

  const { data: expenseAnalytics } = useGetExpenseAnalyticsQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  });

  const { data: profitLoss } = useGetProfitLossStatementQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  });

  const { data: cashFlow } = useGetCashFlowStatementQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  });

  const { data: revenueAnalysis } = useGetRevenueAnalysisQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  });

  const { data: taxSummary } = useGetTaxSummaryQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  });

  // Mutations
  const [createExpense] = useCreateExpenseMutation();
  const [updateExpense] = useUpdateExpenseMutation();
  const [deleteExpense] = useDeleteExpenseMutation();

  // Expense categories
  const expenseCategories = [
    'inventory', 'rent', 'utilities', 'salaries', 'marketing', 
    'maintenance', 'insurance', 'taxes', 'supplies', 'professional', 
    'transportation', 'other'
  ];

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || expense.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchTerm, categoryFilter]);

  const handleCreateExpense = async (expenseData) => {
    try {
      await createExpense(expenseData).unwrap();
      setShowExpenseModal(false);
    } catch (error) {
      console.error('Error creating expense:', error);
    }
  };

  const handleUpdateExpense = async (expenseData) => {
    try {
      await updateExpense({ id: editingExpense._id, ...expenseData }).unwrap();
      setEditingExpense(null);
      setShowExpenseModal(false);
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id).unwrap();
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const exportToCSV = (data, filename) => {
    // Simple CSV export functionality
    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(data[0]).join(",") + "\n" +
      data.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout title="Accounting & Finance" active="accounting">
      <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Accounting & Finance</h1>
            <p className="text-gray-600 mt-1">Manage expenses, view financial reports, and track business performance</p>
          </div>
          
          {/* Date Range Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">From:</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">To:</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <nav className="flex overflow-x-auto">
          {[
            { id: 'expenses', name: 'Expenses', icon: FaReceipt },
            { id: 'reports', name: 'Financial Reports', icon: FaChartLine },
            { id: 'analytics', name: 'Analytics', icon: FaArrowUp },
            { id: 'taxes', name: 'Tax Summary', icon: FaCalculator }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-500'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          {/* Expense Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-sm border border-red-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-red-500 rounded-xl shadow-sm">
                  <FaMoneyBillWave className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-red-700">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-900">
                    {formatCurrency(expenseAnalytics?.totalExpenses || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-blue-500 rounded-xl shadow-sm">
                  <FaReceipt className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-700">This Month</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(
                      expenseAnalytics?.monthlyTrend?.find(m => 
                        m.month === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
                      )?.total || 0
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-green-500 rounded-xl shadow-sm">
                  <FaChartLine className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-700">Top Category</p>
                  <p className="text-lg font-bold text-green-900 capitalize">
                    {expenseAnalytics?.expensesByCategory?.[0]?.category || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-purple-500 rounded-xl shadow-sm">
                  <FaCalculator className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-700">Avg per Day</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatCurrency(
                      expenseAnalytics?.totalExpenses 
                        ? expenseAnalytics.totalExpenses / Math.max(1, Math.ceil((new Date(dateRange.endDate) - new Date(dateRange.startDate)) / (1000 * 60 * 60 * 24)))
                        : 0
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Expense Management */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                <h2 className="text-xl font-semibold text-gray-900">Expense Management</h2>
                <button
                  onClick={() => {
                    setEditingExpense(null);
                    setShowExpenseModal(true);
                  }}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-orange-700 flex items-center space-x-2 shadow-sm transition-all duration-200 transform hover:scale-105"
                >
                  <FaPlus className="w-4 h-4" />
                  <span>Add Expense</span>
                </button>
              </div>

              {/* Filters */}
              <div className="mt-6 flex flex-col lg:flex-row gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search expenses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors duration-200"
                    />
                  </div>
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors duration-200"
                >
                  <option value="">All Categories</option>
                  {expenseCategories.map(category => (
                    <option key={category} value={category} className="capitalize">
                      {category.replace('_', ' ')}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => exportToCSV(filteredExpenses, `expenses-${dateRange.startDate}-to-${dateRange.endDate}.csv`)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 flex items-center space-x-2 transition-colors duration-200"
                >
                  <FaFileDownload className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Expense Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expensesLoading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        Loading expenses...
                      </td>
                    </tr>
                  ) : filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                        No expenses found
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((expense) => (
                      <tr key={expense._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{expense.description}</div>
                            {expense.vendor && (
                              <div className="text-sm text-gray-500">{expense.vendor}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                            {expense.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(expense.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {expense.paymentMethod}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingExpense(expense);
                                setShowExpenseModal(true);
                              }}
                              className="p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-colors duration-200"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense._id)}
                              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Financial Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Profit & Loss Statement */}
          {profitLoss && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
                <h3 className="text-xl font-semibold text-gray-900">Profit & Loss Statement</h3>
                <button
                  onClick={() => window.print()}
                  className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 flex items-center space-x-2 transition-all duration-200"
                >
                  <FaFileDownload className="w-4 h-4" />
                  <span>Print/Export</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Revenue</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Revenue</span>
                      <span className="font-medium">{formatCurrency(profitLoss.revenue.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Orders: {profitLoss.revenue.orderCount}</span>
                    </div>
                  </div>

                  <h4 className="font-medium text-gray-900 mb-3 mt-6">Cost of Goods Sold</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">COGS</span>
                      <span className="font-medium text-red-600">-{formatCurrency(profitLoss.cogs.totalCogs)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">% of Revenue: {profitLoss.cogs.cogsPercentage.toFixed(1)}%</span>
                    </div>
                  </div>

                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between font-medium">
                      <span>Gross Profit</span>
                      <span className={profitLoss.grossProfit.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(profitLoss.grossProfit.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Margin: {profitLoss.grossProfit.margin.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Operating Expenses</h4>
                  <div className="space-y-2">
                    {Object.entries(profitLoss.operatingExpenses.byCategory).map(([category, amount]) => (
                      <div key={category} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{category.replace('_', ' ')}</span>
                        <span className="font-medium text-red-600">-{formatCurrency(amount)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-medium">
                        <span>Total Operating Expenses</span>
                        <span className="text-red-600">-{formatCurrency(profitLoss.operatingExpenses.total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3 mt-6">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Net Profit</span>
                      <span className={profitLoss.netProfit.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(profitLoss.netProfit.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Margin: {profitLoss.netProfit.margin.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cash Flow Statement */}
          {cashFlow && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Cash Flow Statement</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Cash Inflows</h4>
                  <div className="space-y-2">
                    {Object.entries(cashFlow.cashInflows.byPaymentMethod).map(([method, amount]) => (
                      <div key={method} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{method}</span>
                        <span className="font-medium text-green-600">+{formatCurrency(amount)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-medium">
                        <span>Total Inflows</span>
                        <span className="text-green-600">+{formatCurrency(cashFlow.cashInflows.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Cash Outflows</h4>
                  <div className="space-y-2">
                    {Object.entries(cashFlow.cashOutflows.byPaymentMethod).map(([method, amount]) => (
                      <div key={method} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{method}</span>
                        <span className="font-medium text-red-600">-{formatCurrency(amount)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-medium">
                        <span>Total Outflows</span>
                        <span className="text-red-600">-{formatCurrency(cashFlow.cashOutflows.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Net Cash Flow</h4>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${cashFlow.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(cashFlow.netCashFlow)}
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      {cashFlow.netCashFlow >= 0 ? 'Positive Cash Flow' : 'Negative Cash Flow'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && revenueAnalysis && (
        <div className="space-y-6">
          {/* Revenue Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-green-500 rounded-xl shadow-sm">
                  <FaMoneyBillWave className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-700">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(revenueAnalysis.totalRevenue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-blue-500 rounded-xl shadow-sm">
                  <FaReceipt className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-700">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {revenueAnalysis.orderCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm border border-purple-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-purple-500 rounded-xl shadow-sm">
                  <FaCalculator className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-700">Avg Order Value</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatCurrency(revenueAnalysis.averageOrderValue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-sm border border-orange-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center">
                <div className="p-3 bg-orange-500 rounded-xl shadow-sm">
                  <FaArrowUp className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-orange-700">Top Category</p>
                  <p className="text-lg font-bold text-orange-900">
                    {revenueAnalysis.topCategories?.[0]?.name || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performing Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Top Performing Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity Sold
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {revenueAnalysis.topItems.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tax Summary Tab */}
      {activeTab === 'taxes' && taxSummary && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Tax Summary</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Income Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Revenue</span>
                    <span className="font-medium">{formatCurrency(taxSummary.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Expenses</span>
                    <span className="font-medium text-red-600">-{formatCurrency(taxSummary.totalExpenses)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>Taxable Income</span>
                      <span className={taxSummary.taxableIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(taxSummary.taxableIncome)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Estimated Taxes</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Corporate Tax (30%)</span>
                    <span className="font-medium text-red-600">{formatCurrency(taxSummary.estimatedTaxes.corporateTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">VAT (7.5%)</span>
                    <span className="font-medium text-red-600">{formatCurrency(taxSummary.estimatedTaxes.vat)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-medium text-lg">
                      <span>Total Estimated Tax</span>
                      <span className="text-red-600">{formatCurrency(taxSummary.estimatedTaxes.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> {taxSummary.note}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <ExpenseModal
          expense={editingExpense}
          onSave={editingExpense ? handleUpdateExpense : handleCreateExpense}
          onClose={() => {
            setShowExpenseModal(false);
            setEditingExpense(null);
          }}
          categories={expenseCategories}
        />
      )}
      </div>
    </AdminLayout>
  );
}

// Expense Modal Component
function ExpenseModal({ expense, onSave, onClose, categories }) {
  const [formData, setFormData] = useState({
    description: expense?.description || '',
    amount: expense?.amount || '',
    category: expense?.category || 'other',
    paymentMethod: expense?.paymentMethod || 'transfer',
    vendor: expense?.vendor || '',
    date: expense?.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    notes: expense?.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {expense ? 'Edit Expense' : 'Add New Expense'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter expense description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₦) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category} className="capitalize">
                  {category.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method *
            </label>
            <select
              required
              value={formData.paymentMethod}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="cash">Cash</option>
              <option value="transfer">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="check">Check</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor/Supplier
            </label>
            <input
              type="text"
              value={formData.vendor}
              onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter vendor name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              rows="3"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              {expense ? 'Update' : 'Create'} Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
