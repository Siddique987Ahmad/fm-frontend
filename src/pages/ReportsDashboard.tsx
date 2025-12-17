import React, { useState, useEffect } from 'react';
import { fetchProductTypes, type ProductType } from '../utils/productTypes';
import { getApiUrl } from '../utils/api';

// TypeScript interfaces
interface ReportFilters {
  category?: string;
  productType?: string;
  transactionType?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  clientName?: string;
}

interface BulkActionData {
  selectedIds: string[];
  action: 'approve' | 'reject' | 'delete' | 'status';
  approvalStatus?: 'approved' | 'rejected' | 'pending';
  status?: 'active' | 'cancelled' | 'completed';
  paymentStatus?: 'paid' | 'pending' | 'advance';
  notes?: string;
}

interface Expense {
  _id: string;
  title: string;
  amount: number;
  paymentStatus: string;
  approvalStatus: string;
  expenseCategory: string;
  expenseDate: string;
}

// Icons
const DownloadIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FileTextIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const TrashIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const LoadingSpinner: React.FC = () => (
  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
);

// Use getApiUrl() to ensure we always point to the backend, not the frontend
const getApiBaseUrl = () => getApiUrl();

const ReportsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'products'>('expenses');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [reportFilters, setReportFilters] = useState<ReportFilters>({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  
  // Bulk actions state
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showBulkActions, setShowBulkActions] = useState<boolean>(false);
  const [bulkActionData, setBulkActionData] = useState<BulkActionData>({
    selectedIds: [],
    action: 'approve'
  });

  const expenseCategories = [
    { id: '', name: 'All Categories' },
    { id: 'home', name: 'Home Expenses' },
    { id: 'labour', name: 'Labour Expenses' },
    { id: 'factory', name: 'Factory Expenses' },
    { id: 'zakat', name: 'Zakat' },
    { id: 'personal', name: 'Personal Expenses' }
  ];

  // Fetch product types on component mount
  useEffect(() => {
    fetchProductTypesData();
  }, []);

  const fetchProductTypesData = async () => {
    try {
      const types = await fetchProductTypes();
      setProductTypes(types);
    } catch (error) {
      console.error('Error fetching product types:', error);
    }
  };

  // Fetch expenses for bulk actions
  useEffect(() => {
    if (activeTab === 'expenses') {
      fetchExpenses();
    }
  }, [activeTab, reportFilters.category]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (reportFilters.category) params.append('category', reportFilters.category);
      const { authenticatedFetch } = await import('../utils/apiClient');
      const result = await authenticatedFetch<{ success: boolean; data?: any }>(`/expenses?${params.toString()}`);
      
      if (result.success && result.data) {
        setExpenses(result.data.expenses || []);
      }
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof ReportFilters, value: string) => {
    setReportFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateReport = async (format: 'download' | 'save' = 'download') => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Validate filters
      if (!reportFilters.startDate || !reportFilters.endDate) {
        setError('Please select start date and end date');
        setLoading(false);
        return;
      }

      if (activeTab === 'products' && !reportFilters.productType) {
        setError('Please select a product type');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      Object.entries(reportFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append('download', format === 'download' ? 'true' : 'false');

      const API_BASE_URL = getApiBaseUrl();
      let url = '';
      if (activeTab === 'expenses') {
        url = `${API_BASE_URL}/reports/expenses/pdf?${params}`;
      } else {
        if (!reportFilters.productType) {
          setError('Please select a product type');
          return;
        }
        url = `${API_BASE_URL}/reports/products/${reportFilters.productType}/pdf?${params}`;
      }

      // Use Authorization header for both flows (works for user and admin)
      const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');

      if (format === 'download') {
        // Download PDF as blob with auth header
        console.log('Fetching PDF from:', url);
        const response = await fetch(url, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
        });
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers.get('content-type'));
        if (!response.ok) {
          const text = await response.text();
          console.error('Error response:', text);
          throw new Error(`Failed to generate PDF (HTTP ${response.status}). ${text?.slice(0,200)}`);
        }
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        const filePrefix = activeTab === 'expenses' ? 'expenses' : `products-${reportFilters.productType}`;
        a.download = `${filePrefix}-report-${reportFilters.startDate}-to-${reportFilters.endDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
        setSuccess('PDF report downloaded successfully!');
        
        // Auto-clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        // Save to server; expect JSON
        const response = await fetch(url, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
        });
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          const text = await response.text();
          throw new Error(`Expected JSON, got ${contentType}. ${text?.slice(0,120)}`);
        }
        const result = await response.json();
        if (result.success) {
          setSuccess(`Report saved successfully: ${result.data.filename}`);
        } else {
          setError(result.message || 'Failed to save report');
        }
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      setError(error?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseSelection = (expenseId: string, selected: boolean) => {
    if (selected) {
      setSelectedExpenses(prev => [...prev, expenseId]);
    } else {
      setSelectedExpenses(prev => prev.filter(id => id !== expenseId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedExpenses(expenses.map(expense => expense._id));
    } else {
      setSelectedExpenses([]);
    }
  };

  const handleBulkAction = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (selectedExpenses.length === 0) {
        setError('Please select expenses to perform bulk action');
        return;
      }

      const API_BASE_URL = getApiBaseUrl();
      let url = '';
      let payload: any = { expenseIds: selectedExpenses };

      switch (bulkActionData.action) {
        case 'approve':
          url = `${API_BASE_URL}/reports/expenses/bulk/approve`;
          payload.approvalStatus = bulkActionData.approvalStatus || 'approved';
          if (bulkActionData.notes) payload.notes = bulkActionData.notes;
          break;
        case 'reject':
          url = `${API_BASE_URL}/reports/expenses/bulk/approve`;
          payload.approvalStatus = 'rejected';
          if (bulkActionData.notes) payload.notes = bulkActionData.notes;
          break;
        case 'status':
          url = `${API_BASE_URL}/reports/expenses/bulk/status`;
          if (bulkActionData.status) payload.status = bulkActionData.status;
          if (bulkActionData.paymentStatus) payload.paymentStatus = bulkActionData.paymentStatus;
          break;
        case 'delete':
          url = `${API_BASE_URL}/reports/expenses/bulk`;
          break;
      }

      const method = bulkActionData.action === 'delete' ? 'DELETE' : 'POST';
      
      // Get authentication token
      const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success) {
        setSuccess(`Successfully ${bulkActionData.action}d ${result.data.modifiedCount || result.data.deletedCount} expenses`);
        setSelectedExpenses([]);
        setShowBulkActions(false);
        await fetchExpenses(); // Refresh data
      } else {
        setError(result.message || 'Failed to perform bulk action');
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      setError('Failed to perform bulk action');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Reports & Bulk Actions</h1>
          <p className="text-gray-600">Generate PDF reports and manage records in bulk</p>
        </div>

        {/* Toast Messages - Fixed Position Right Side */}
        {error && (
          <div className="fixed top-6 right-6 z-50 animate-slide-in-right">
            <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center space-x-3 max-w-md">
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{error}</span>
              <button 
                onClick={() => setError('')}
                className="ml-4 text-white hover:text-red-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {success && (
          <div className="fixed top-6 right-6 z-50 animate-slide-in-right">
            <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center space-x-3 max-w-md">
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{success}</span>
              <button 
                onClick={() => setSuccess('')}
                className="ml-4 text-white hover:text-green-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('expenses')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'expenses'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileTextIcon />
                  <span>Expense Reports</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                  </svg>
                  <span>Product Reports</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Report Filters */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Category/Product Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {activeTab === 'expenses' ? 'Category' : 'Product Type'}
                </label>
                <select
                  value={activeTab === 'expenses' ? (reportFilters.category || '') : (reportFilters.productType || '')}
                  onChange={(e) => handleFilterChange(activeTab === 'expenses' ? 'category' : 'productType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {activeTab === 'expenses' ? (
                    expenseCategories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))
                  ) : (
                    <>
                      <option value="">Select Product Type</option>
                      {productTypes.map(product => (
                        <option key={product.id} value={product.id}>{product.name}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* Transaction Type (Products only) */}
              {activeTab === 'products' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction Type
                  </label>
                  <select
                    value={reportFilters.transactionType || ''}
                    onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="sale">Sales</option>
                    <option value="purchase">Purchases</option>
                  </select>
                </div>
              )}

              {/* Payment Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={reportFilters.paymentStatus || ''}
                  onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="advance">Advance</option>
                  {activeTab === 'products' && <option value="overpaid">Overpaid</option>}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={reportFilters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={reportFilters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Client Name (Products only) */}
              {activeTab === 'products' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client/Supplier Name
                  </label>
                  <input
                    type="text"
                    value={reportFilters.clientName || ''}
                    onChange={(e) => handleFilterChange('clientName', e.target.value)}
                    placeholder="Search by name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="flex items-end">
                <button
                  onClick={() => generateReport('download')}
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {loading ? <LoadingSpinner /> : <DownloadIcon />}
                  <span>Generate PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions (Expenses only) */}
        {activeTab === 'expenses' && (
          <div className="bg-white rounded-lg shadow-lg mb-6">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Bulk Actions</h2>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {selectedExpenses.length} expenses selected
                  </span>
                  {selectedExpenses.length > 0 && (
                    <button
                      onClick={() => setShowBulkActions(!showBulkActions)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Bulk Actions
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Bulk Actions Panel */}
            {showBulkActions && (
              <div className="p-6 bg-gray-50 border-b">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Action
                    </label>
                    <select
                      value={bulkActionData.action}
                      onChange={(e) => setBulkActionData(prev => ({ ...prev, action: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="approve">Approve</option>
                      <option value="reject">Reject</option>
                      <option value="status">Update Status</option>
                      <option value="delete">Delete</option>
                    </select>
                  </div>

                  {bulkActionData.action === 'status' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={bulkActionData.status || ''}
                          onChange={(e) => setBulkActionData(prev => ({ ...prev, status: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">No change</option>
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Status
                        </label>
                        <select
                          value={bulkActionData.paymentStatus || ''}
                          onChange={(e) => setBulkActionData(prev => ({ ...prev, paymentStatus: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">No change</option>
                          <option value="paid">Paid</option>
                          <option value="pending">Pending</option>
                          <option value="advance">Advance</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

                {(bulkActionData.action === 'approve' || bulkActionData.action === 'reject') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={bulkActionData.notes || ''}
                      onChange={(e) => setBulkActionData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add notes for this action..."
                    />
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={handleBulkAction}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg text-white font-semibold flex items-center space-x-2 ${
                      bulkActionData.action === 'delete'
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    {loading ? <LoadingSpinner /> : (
                      bulkActionData.action === 'approve' ? <CheckIcon /> :
                      bulkActionData.action === 'reject' ? <XIcon /> :
                      bulkActionData.action === 'delete' ? <TrashIcon /> :
                      <CheckIcon />
                    )}
                    <span>
                      {bulkActionData.action === 'approve' ? 'Approve Selected' :
                       bulkActionData.action === 'reject' ? 'Reject Selected' :
                       bulkActionData.action === 'delete' ? 'Delete Selected' :
                       'Update Selected'}
                    </span>
                  </button>
                  <button
                    onClick={() => setShowBulkActions(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Expense List for Selection */}
            <div className="p-6">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={expenses.length > 0 && selectedExpenses.length === expenses.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="mr-3"
                />
                <label className="text-sm font-medium text-gray-700">
                  Select All ({expenses.length} expenses)
                </label>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {expenses.map(expense => (
                  <div key={expense._id} className="flex items-center p-3 border border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      checked={selectedExpenses.includes(expense._id)}
                      onChange={(e) => handleExpenseSelection(expense._id, e.target.checked)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{expense.title}</h4>
                          <p className="text-sm text-gray-600">
                            {expense.expenseCategory} • PKR{expense.amount.toLocaleString()} • 
                            {new Date(expense.expenseDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            expense.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                            expense.paymentStatus === 'advance' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {expense.paymentStatus}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            expense.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                            expense.approvalStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {expense.approvalStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsDashboard;