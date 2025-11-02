import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Package, 
  Calendar,
  Download,
  RefreshCw,
  PieChart
} from 'lucide-react';

interface ReportData {
  sales: {
    totalAmount: number;
    totalCount: number;
    monthlyData: Array<{ month: string; amount: number; count: number }>;
    productBreakdown: Array<{ product: string; amount: number; count: number }>;
  };
  purchases: {
    totalAmount: number;
    totalCount: number;
    monthlyData: Array<{ month: string; amount: number; count: number }>;
    productBreakdown: Array<{ product: string; amount: number; count: number }>;
  };
  expenses: {
    totalAmount: number;
    totalCount: number;
    categoryBreakdown: Array<{ category: string; amount: number; count: number }>;
    monthlyData: Array<{ month: string; amount: number; count: number }>;
  };
  users: {
    totalUsers: number;
    activeUsers: number;
    usersByRole: Array<{ role: string; count: number }>;
    monthlyRegistrations: Array<{ month: string; count: number }>;
  };
  employees: {
    totalEmployees: number;
    activeEmployees: number;
    employeesByType: Array<{ type: string; count: number }>;
    employeesByDepartment: Array<{ department: string; count: number }>;
  };
}

interface DateRange {
  startDate: string;
  endDate: string;
}

const ReportsManagement: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedReport, setSelectedReport] = useState<'overview' | 'sales' | 'purchases' | 'expenses' | 'users' | 'employees'>('overview');

  // Fetch report data
  const fetchReportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      // Fetch all data in parallel
      const [salesResponse, purchasesResponse, expensesResponse, usersResponse, employeesResponse] = await Promise.all([
  fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/admin/reports/sales?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
  fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/admin/reports/purchases?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
  fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/admin/reports/expenses?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
  fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/admin/reports/users?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
  fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/admin/reports/employees?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [salesData, purchasesData, expensesData, usersData, employeesData] = await Promise.all([
        salesResponse.json(),
        purchasesResponse.json(),
        expensesResponse.json(),
        usersResponse.json(),
        employeesResponse.json()
      ]);

      setReportData({
        sales: salesData.success ? salesData.data : { totalAmount: 0, totalCount: 0, monthlyData: [], productBreakdown: [] },
        purchases: purchasesData.success ? purchasesData.data : { totalAmount: 0, totalCount: 0, monthlyData: [], productBreakdown: [] },
        expenses: expensesData.success ? expensesData.data : { totalAmount: 0, totalCount: 0, categoryBreakdown: [], monthlyData: [] },
        users: usersData.success ? usersData.data : { totalUsers: 0, activeUsers: 0, usersByRole: [], monthlyRegistrations: [] },
        employees: employeesData.success ? employeesData.data : { totalEmployees: 0, activeEmployees: 0, employeesByType: [], employeesByDepartment: [] }
      });
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate PDF report
  const generatePDF = async (reportType: string, productName?: string) => {
    try {
      const token = localStorage.getItem('adminToken');
  let url = `${import.meta.env.VITE_API_URL ?? '/api'}/admin/reports/pdf/${reportType}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
      
      // Add product name for specific product reports
      if (productName) {
        url += `&productName=${encodeURIComponent(productName)}`;
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        
        const filename = productName 
          ? `${reportType}-${productName}-report-${dateRange.startDate}-to-${dateRange.endDate}.pdf`
          : `${reportType}-report-${dateRange.startDate}-to-${dateRange.endDate}.pdf`;
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        console.error('PDF generation failed:', errorData);
        alert('Failed to generate PDF: ' + (errorData.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error generating PDF: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR'
    }).format(amount);
  };

  // Format number
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-PK').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive business insights and analytics</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchReportData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => generatePDF('overview')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Download className="h-5 w-5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-4">
          <Calendar className="h-5 w-5 text-gray-500" />
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">From:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Report Navigation */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'sales', label: 'Sales', icon: TrendingUp },
              { id: 'purchases', label: 'Purchases', icon: TrendingDown },
              { id: 'expenses', label: 'Expenses', icon: DollarSign },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'employees', label: 'Employees', icon: Package }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedReport(id as 'overview' | 'sales' | 'purchases' | 'expenses' | 'users' | 'employees')}
                className={`flex items-center space-x-2 py-2 px-3 rounded-lg transition-colors ${
                  selectedReport === id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Overview Report */}
          {selectedReport === 'overview' && reportData && (
            <div className="space-y-6">
              {/* Overview Header with Comprehensive Report Button */}
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Business Overview</h3>
                <button
                  onClick={() => generatePDF('comprehensive')}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg flex items-center space-x-2 shadow-lg"
                >
                  <Download className="h-5 w-5" />
                  <span>Download Comprehensive Report</span>
                </button>
              </div>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Total Sales</p>
                      <p className="text-3xl font-bold">{formatCurrency(reportData.sales.totalAmount)}</p>
                      <p className="text-green-100 text-sm">{formatNumber(reportData.sales.totalCount)} transactions</p>
                    </div>
                    <TrendingUp className="h-12 w-12 text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Purchases</p>
                      <p className="text-3xl font-bold">{formatCurrency(reportData.purchases.totalAmount)}</p>
                      <p className="text-blue-100 text-sm">{formatNumber(reportData.purchases.totalCount)} transactions</p>
                    </div>
                    <TrendingDown className="h-12 w-12 text-blue-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm">Total Expenses</p>
                      <p className="text-3xl font-bold">{formatCurrency(reportData.expenses.totalAmount)}</p>
                      <p className="text-red-100 text-sm">{formatNumber(reportData.expenses.totalCount)} transactions</p>
                    </div>
                    <DollarSign className="h-12 w-12 text-red-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Total Users</p>
                      <p className="text-3xl font-bold">{formatNumber(reportData.users.totalUsers)}</p>
                      <p className="text-purple-100 text-sm">{formatNumber(reportData.users.activeUsers)} active</p>
                    </div>
                    <Users className="h-12 w-12 text-purple-200" />
                  </div>
                </div>
              </div>

              {/* Charts Placeholder */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales vs Purchases Trend</h3>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                      <p>Chart visualization would go here</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Categories</h3>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <PieChart className="h-12 w-12 mx-auto mb-2" />
                      <p>Pie chart visualization would go here</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sales Report */}
          {selectedReport === 'sales' && reportData && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Sales Report</h3>
                <button
                  onClick={() => generatePDF('sales')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Sales PDF</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Total Sales</h4>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(reportData.sales.totalAmount)}</p>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Total Transactions</h4>
                  <p className="text-3xl font-bold text-blue-600">{formatNumber(reportData.sales.totalCount)}</p>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Average Sale</h4>
                  <p className="text-3xl font-bold text-purple-600">
                    {formatCurrency(reportData.sales.totalCount > 0 ? reportData.sales.totalAmount / reportData.sales.totalCount : 0)}
                  </p>
                </div>
              </div>

              {/* Product Breakdown */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Sales by Product</h4>
                  <button
                    onClick={() => generatePDF('sales')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                  >
                    <Download className="h-4 w-4" />
                    <span>All Sales PDF</span>
                  </button>
                </div>
                <div className="space-y-3">
                  {reportData.sales.productBreakdown.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-900">{item.product}</span>
                        <button
                          onClick={() => generatePDF('sales', item.product)}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                        >
                          <Download className="h-3 w-3" />
                          <span>PDF</span>
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(item.amount)}</p>
                        <p className="text-sm text-gray-500">{formatNumber(item.count)} sales</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Purchases Report */}
          {selectedReport === 'purchases' && reportData && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Purchases Report</h3>
                <button
                  onClick={() => generatePDF('purchases')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Purchases PDF</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Total Purchases</h4>
                  <p className="text-3xl font-bold text-blue-600">{formatCurrency(reportData.purchases.totalAmount)}</p>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Total Transactions</h4>
                  <p className="text-3xl font-bold text-green-600">{formatNumber(reportData.purchases.totalCount)}</p>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Average Purchase</h4>
                  <p className="text-3xl font-bold text-purple-600">
                    {formatCurrency(reportData.purchases.totalCount > 0 ? reportData.purchases.totalAmount / reportData.purchases.totalCount : 0)}
                  </p>
                </div>
              </div>

              {/* Product Breakdown */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Purchases by Product</h4>
                  <button
                    onClick={() => generatePDF('purchases')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                  >
                    <Download className="h-4 w-4" />
                    <span>All Purchases PDF</span>
                  </button>
                </div>
                <div className="space-y-3">
                  {reportData.purchases.productBreakdown.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-900">{item.product}</span>
                        <button
                          onClick={() => generatePDF('purchases', item.product)}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                        >
                          <Download className="h-3 w-3" />
                          <span>PDF</span>
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(item.amount)}</p>
                        <p className="text-sm text-gray-500">{formatNumber(item.count)} purchases</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Expenses Report */}
          {selectedReport === 'expenses' && reportData && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Expenses Report</h3>
                <button
                  onClick={() => generatePDF('expenses')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Expenses PDF</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Total Expenses</h4>
                  <p className="text-3xl font-bold text-red-600">{formatCurrency(reportData.expenses.totalAmount)}</p>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Total Transactions</h4>
                  <p className="text-3xl font-bold text-blue-600">{formatNumber(reportData.expenses.totalCount)}</p>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Average Expense</h4>
                  <p className="text-3xl font-bold text-purple-600">
                    {formatCurrency(reportData.expenses.totalCount > 0 ? reportData.expenses.totalAmount / reportData.expenses.totalCount : 0)}
                  </p>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Expenses by Category</h4>
                <div className="space-y-3">
                  {reportData.expenses.categoryBreakdown.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-900 capitalize">{item.category}</span>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(item.amount)}</p>
                        <p className="text-sm text-gray-500">{formatNumber(item.count)} expenses</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users Report */}
          {selectedReport === 'users' && reportData && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Users Report</h3>
                <button
                  onClick={() => generatePDF('users')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Users PDF</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Total Users</h4>
                  <p className="text-3xl font-bold text-blue-600">{formatNumber(reportData.users.totalUsers)}</p>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Active Users</h4>
                  <p className="text-3xl font-bold text-green-600">{formatNumber(reportData.users.activeUsers)}</p>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Activity Rate</h4>
                  <p className="text-3xl font-bold text-purple-600">
                    {reportData.users.totalUsers > 0 ? Math.round((reportData.users.activeUsers / reportData.users.totalUsers) * 100) : 0}%
                  </p>
                </div>
              </div>

              {/* Users by Role */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Users by Role</h4>
                <div className="space-y-3">
                  {reportData.users.usersByRole.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="font-medium text-gray-900 capitalize">{item.role}</span>
                      <span className="text-lg font-semibold text-gray-900">{formatNumber(item.count)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Employees Report */}
          {selectedReport === 'employees' && reportData && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Employees Report</h3>
                <button
                  onClick={() => generatePDF('employees')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Employees PDF</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Total Employees</h4>
                  <p className="text-3xl font-bold text-blue-600">{formatNumber(reportData.employees.totalEmployees)}</p>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Active Employees</h4>
                  <p className="text-3xl font-bold text-green-600">{formatNumber(reportData.employees.activeEmployees)}</p>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Active Rate</h4>
                  <p className="text-3xl font-bold text-purple-600">
                    {reportData.employees.totalEmployees > 0 ? Math.round((reportData.employees.activeEmployees / reportData.employees.totalEmployees) * 100) : 0}%
                  </p>
                </div>
              </div>

              {/* Employees by Type */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Employees by Type</h4>
                  <div className="space-y-3">
                    {reportData.employees.employeesByType.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-900 capitalize">{item.type.replace('-', ' ')}</span>
                        <span className="text-lg font-semibold text-gray-900">{formatNumber(item.count)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Employees by Department</h4>
                  <div className="space-y-3">
                    {reportData.employees.employeesByDepartment.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-900">{item.department}</span>
                        <span className="text-lg font-semibold text-gray-900">{formatNumber(item.count)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsManagement;
