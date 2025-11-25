import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../utils/api';
import { fetchProductTypes, type ProductType } from '../utils/productTypes';

// Types
interface Transaction {
  _id: string;
  transactionType: 'sale' | 'purchase';
  clientName: string;
  weight: number;
  weightUnit: string;
  rate: number;
  rateUnit: string;
  remainingAmount: number;
  totalBalance: number;
  paymentStatus: 'pending' | 'full' | 'advance' | 'overpaid';
  advanceAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Filters {
  transactionType: string;
  clientName: string;
  paymentStatus: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  total: number;
}

interface PaymentStatusInfo {
  status: 'advance' | 'overpaid' | 'full' | 'pending';
  text: string;
}

interface Product {
  name: string;
  color: string;
  productType: string;
}

interface EditFormData {
  clientName: string;
  weight: string;
  rate: string;
  remainingAmount: string;
  totalBalance: string;
  notes: string;
}

// Icons
const ArrowLeftIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const SearchIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const EyeIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EditIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const DownloadIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PackageIcon: React.FC = () => (
  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
  </svg>
);

const LoadingSpinner: React.FC = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
);

const getApiBaseUrl = () => getApiUrl();

const TransactionsPage: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [filters, setFilters] = useState<Filters>({
    transactionType: '',
    clientName: '',
    paymentStatus: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [showEdit, setShowEdit] = useState<boolean>(false);
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    clientName: '',
    weight: '',
    rate: '',
    remainingAmount: '',
    totalBalance: '',
    notes: ''
  });
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);

  // Fetch product types on component mount
  useEffect(() => {
    fetchProductTypesData();
  }, []);

  // Fetch transactions when product or filters change
  useEffect(() => {
    if (selectedProduct) {
      fetchTransactions();
    }
  }, [selectedProduct, filters, pagination.currentPage]);

  const fetchProductTypesData = async (): Promise<void> => {
    try {
      const types = await fetchProductTypes();
      setProductTypes(types);
    } catch (error) {
      console.error('Error fetching product types:', error);
      setError('Failed to load product types. Please refresh the page.');
    }
  };

  // Generate products list from fetched product types
  // Calculate summary for filtered transactions
  const calculateSummary = () => {
    if (!filters.clientName || transactions.length === 0) return null;
    
    const summary = {
      totalWeight: 0,
      totalAmount: 0,
      totalReceived: 0,
      totalOutstanding: 0
    };
    
    transactions.forEach(txn => {
      summary.totalWeight += txn.weight || 0;
      summary.totalAmount += txn.totalBalance || 0;
      summary.totalReceived += txn.remainingAmount || 0;
    });
    
    summary.totalOutstanding = summary.totalAmount - summary.totalReceived;
    
    return summary;
  };

  const getProducts = (): Product[] => {
    const colors = [
      'bg-blue-500 hover:bg-blue-600',
      'bg-yellow-500 hover:bg-yellow-600',
      'bg-green-500 hover:bg-green-600',
      'bg-amber-500 hover:bg-amber-600',
      'bg-red-500 hover:bg-red-600',
      'bg-purple-500 hover:bg-purple-600',
      'bg-indigo-500 hover:bg-indigo-600',
      'bg-pink-500 hover:bg-pink-600'
    ];
    
    return productTypes.map((productType, index) => ({
      name: productType.name,
      color: colors[index % colors.length],
      productType: productType.value
    }));
  };

  const fetchTransactions = async (): Promise<void> => {
    if (!selectedProduct) return;

    setLoading(true);
    setError('');
    
    try {
      // When filtering by client name, fetch all transactions (no pagination)
      // Otherwise use normal pagination
      const limit = filters.clientName ? '1000' : '10';
      
      const queryParams = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: limit,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });

      const { authenticatedFetch } = await import('../utils/apiClient');
      const result = await authenticatedFetch<{ success: boolean; data?: any; pagination?: any; total?: number }>(`/products/${selectedProduct.productType}?${queryParams}`);

      if (result.success) {
        setTransactions(result.data);
        setPagination({
          currentPage: result.pagination.currentPage,
          totalPages: result.pagination.totalPages,
          total: result.total
        });
      } else {
        setError('Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Network error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product: Product): void => {
    setSelectedProduct(product);
    setError('');
    setTransactions([]);
    setPagination({ currentPage: 1, totalPages: 1, total: 0 });
    
    // Reset filters when changing products
    setFilters({
      transactionType: '',
      clientName: '',
      paymentStatus: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  const handleFilterChange = (field: keyof Filters, value: string): void => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const getPaymentStatusColor = (status: string): string => {
    switch (status) {
      case 'advance':
      case 'overpaid':
        return 'bg-blue-100 text-blue-800';
      case 'full':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplay = (transaction: Transaction): PaymentStatusInfo => {
    const total = transaction.totalBalance;
    const received = transaction.remainingAmount;
    
    if (transaction.transactionType === 'sale') {
      if (received > total) {
        return { status: 'advance', text: `Advance: PKR${(received - total).toFixed(2)}` };
      } else if (received === total) {
        return { status: 'full', text: 'Full Payment' };
      } else {
        return { status: 'pending', text: `Pending: PKR${(total - received).toFixed(2)}` };
      }
    } else {
      if (received > total) {
        return { status: 'overpaid', text: `Overpaid: PKR${(received - total).toFixed(2)}` };
      } else if (received === total) {
        return { status: 'full', text: 'Full Payment' };
      } else {
        return { status: 'pending', text: `Remaining: PKR${(total - received).toFixed(2)}` };
      }
    }
  };

  const handleViewDetails = (transaction: Transaction): void => {
    setSelectedTransaction(transaction);
    setShowDetails(true);
  };

  const handleEdit = (transaction: Transaction): void => {
    setSelectedTransaction(transaction);
    setEditFormData({
      clientName: transaction.clientName,
      weight: transaction.weight.toString(),
      rate: transaction.rate.toString(),
      remainingAmount: transaction.remainingAmount.toString(),
      totalBalance: transaction.totalBalance.toString(),
      notes: transaction.notes || ''
    });
    setShowEdit(true);
    setError('');
    setSuccess('');
  };

  const handleEditInputChange = (field: keyof EditFormData, value: string): void => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-calculate total balance when weight and rate change
    if (field === 'weight' || field === 'rate') {
      const weight = field === 'weight' ? parseFloat(value) || 0 : parseFloat(editFormData.weight) || 0;
      const rate = field === 'rate' ? parseFloat(value) || 0 : parseFloat(editFormData.rate) || 0;
      const calculatedTotal = weight * rate;
      
      setEditFormData(prev => ({
        ...prev,
        [field]: value,
        totalBalance: calculatedTotal.toFixed(2)
      }));
    }
  };

  const validateEditForm = (): boolean => {
    if (!editFormData.clientName.trim()) {
      setError('Client/Supplier name is required');
      return false;
    }
    
    if (!editFormData.weight || parseFloat(editFormData.weight) <= 0) {
      setError('Weight must be greater than 0');
      return false;
    }
    
    if (!editFormData.rate || parseFloat(editFormData.rate) <= 0) {
      setError('Rate must be greater than 0');
      return false;
    }
    
    if (editFormData.remainingAmount === '' || parseFloat(editFormData.remainingAmount) < 0) {
      setError('Amount received/paid cannot be negative');
      return false;
    }
    
    if (!editFormData.totalBalance || parseFloat(editFormData.totalBalance) < 0) {
      setError('Total balance cannot be negative');
      return false;
    }
    
    return true;
  };

  const handleUpdateTransaction = async (): Promise<void> => {
    if (!selectedTransaction || !selectedProduct) return;
    
    setError('');
    setSuccess('');
    
    if (!validateEditForm()) {
      return;
    }
    
    setEditLoading(true);
    
    try {
      const payload = {
        clientName: editFormData.clientName.trim(),
        weight: parseFloat(editFormData.weight),
        rate: parseFloat(editFormData.rate),
        remainingAmount: parseFloat(editFormData.remainingAmount),
        totalBalance: parseFloat(editFormData.totalBalance),
        notes: editFormData.notes.trim()
      };

      const { authenticatedFetch } = await import('../utils/apiClient');
      const result = await authenticatedFetch<{ success: boolean; data?: any }>(`/products/${selectedProduct.productType}/${selectedTransaction._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (result.success) {
        setSuccess('Transaction updated successfully!');
        
        // Refresh transactions
        await fetchTransactions();
        
        // Close edit modal after 2 seconds
        setTimeout(() => {
          setShowEdit(false);
          setSelectedTransaction(null);
          setSuccess('');
        }, 2000);
      } else {
        setError(result.message || 'Failed to update transaction');
        if (result.errors && result.errors.length > 0) {
          setError(result.errors.join(', '));
        }
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      setError('Network error. Please check if the server is running.');
    } finally {
      setEditLoading(false);
    }
  };

  const closeModals = (): void => {
    setShowDetails(false);
    setShowEdit(false);
    setSelectedTransaction(null);
    setError('');
    setSuccess('');
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePageChange = (newPage: number): void => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handleBackToProductSelection = (): void => {
    setSelectedProduct(null);
    setTransactions([]);
    setError('');
  };

  const handleDownloadInvoice = async (transaction: Transaction): Promise<void> => {
    if (!selectedProduct || !transaction) return;
    
    setLoading(true);
    setError('');
    try {
      const { getApiUrl } = await import('../utils/apiClient');
      const apiUrl = getApiUrl();
      const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
      
      const response = await fetch(
        `${apiUrl}/products/${selectedProduct.productType}/${transaction._id}/invoice`,
        {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }
      
      // Get the PDF blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${transaction.clientName.toLowerCase().replace(/\s+/g, '-')}-invoice.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      setError('Failed to download invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadClientReport = async (): Promise<void> => {
    if (!selectedProduct || !filters.clientName) return;
    
    console.log('🔍 [Frontend] Starting client report download...');
    console.log('🔍 [Frontend] Product Type:', selectedProduct.productType);
    console.log('🔍 [Frontend] Client Name:', filters.clientName);
    
    setLoading(true);
    try {
      const { getApiUrl } = await import('../utils/apiClient');
      const apiUrl = getApiUrl();
      const token = localStorage.getItem('adminToken') || localStorage.getItem('userToken');
      
      const url = `${apiUrl}/products/${selectedProduct.productType}/client-report?clientName=${encodeURIComponent(filters.clientName)}`;
      console.log('🔍 [Frontend] Full URL:', url);
      console.log('🔍 [Frontend] Has Token:', !!token);
      
      const response = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      console.log('🔍 [Frontend] Response Status:', response.status);
      console.log('🔍 [Frontend] Response OK:', response.ok);
      console.log('🔍 [Frontend] Content-Type:', response.headers.get('content-type'));
      
      if (!response.ok) {
        // Try to get error message from response
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('🔍 [Frontend] Error Response:', errorData);
          throw new Error(errorData.message || 'Failed to download client report');
        }
        throw new Error('Failed to download client report');
      }
      
      // Get the PDF blob
      const blob = await response.blob();
      console.log('🔍 [Frontend] Blob size:', blob.size);
      
      const url2 = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url2;
      a.download = `${filters.clientName.toLowerCase().replace(/\s+/g, '-')}-report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url2);
      
      console.log('✅ [Frontend] PDF downloaded successfully');
      setSuccess('Client report downloaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('❌ [Frontend] Error downloading client report:', error);
      setError('Failed to download client report');
    } finally {
      setLoading(false);
    }
  };

  // Delete transaction
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const handleDeleteTransaction = async (transaction: Transaction) : Promise<void> => {
    if (!selectedProduct) return;
    const confirmed = window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.');
    if (!confirmed) return;

    setError('');
    setSuccess('');
    setDeleteLoadingId(transaction._id);

    try {
      const { authenticatedFetch } = await import('../utils/apiClient');
      // Use generic product endpoint to delete transaction
      const result = await authenticatedFetch<{ success: boolean; message?: string }>(`/products/${selectedProduct.productType}/${transaction._id}`, {
        method: 'DELETE'
      });

      if (result.success) {
        setSuccess('Transaction deleted successfully');
        // Refresh list
        await fetchTransactions();
        // Close modals if the deleted transaction was open
        if (selectedTransaction && selectedTransaction._id === transaction._id) {
          closeModals();
        }
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message || 'Failed to delete transaction');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setError('Network error. Please check if the server is running.');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeftIcon />
              <span>Back to Dashboard</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {selectedProduct ? `${selectedProduct.name} Transactions` : 'Transaction Management'}
              </h1>
              <p className="text-gray-600 mt-1">
                {selectedProduct 
                  ? `Manage all ${selectedProduct.name} sales and purchases`
                  : 'Select a product to view its transactions'
                }
              </p>
            </div>
          </div>
          
          {selectedProduct && (
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <PackageIcon />
                  <span className="font-semibold">{selectedProduct.name}</span>
                </div>
              </div>
              <button
                onClick={handleBackToProductSelection}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Change Product
              </button>
            </div>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Product Selection */}
        {!selectedProduct && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Select Product</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {getProducts().map((product, index) => (
                <div
                  key={index}
                  onClick={() => handleProductSelect(product)}
                  className={`${product.color} cursor-pointer rounded-lg shadow-lg p-6 text-white transform transition-all duration-200 hover:scale-105 hover:shadow-xl`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                      <p className="text-white/80 text-sm">
                        Click to view transactions
                      </p>
                    </div>
                    <PackageIcon />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transactions Content */}
        {selectedProduct && (
          <>
            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Transaction Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction Type
                  </label>
                  <select
                    value={filters.transactionType}
                    onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="sale">Sales</option>
                    <option value="purchase">Purchases</option>
                  </select>
                </div>

                {/* Client Name Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client/Supplier Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={filters.clientName}
                      onChange={(e) => handleFilterChange('clientName', e.target.value)}
                      placeholder="Search by name..."
                      className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="absolute left-3 top-3 text-gray-400">
                      <SearchIcon />
                    </div>
                  </div>
                </div>

                {/* Payment Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={filters.paymentStatus}
                    onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="full">Full Payment</option>
                    <option value="advance">Advance</option>
                    <option value="overpaid">Overpaid</option>
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="createdAt">Date</option>
                    <option value="clientName">Client Name</option>
                    <option value="totalBalance">Amount</option>
                    <option value="weight">Weight</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order
                  </label>
                  <select
                    value={filters.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {selectedProduct.name} Transactions ({pagination.total} total)
                  </h2>
                  <div className="flex items-center space-x-4">
                    {filters.clientName && (
                      <button
                        onClick={handleDownloadClientReport}
                        disabled={loading || transactions.length === 0}
                        className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <DownloadIcon />
                        <span>Download Client Report PDF</span>
                      </button>
                    )}
                    <div className="text-sm text-gray-500">
                      All transactions are for {selectedProduct.name}
                    </div>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No transactions found for {selectedProduct.name}. Try adjusting your filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Client/Supplier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Weight
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rate
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount Received/Paid
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => {
                        const statusInfo = getStatusDisplay(transaction);
                        return (
                          <tr key={transaction._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(transaction.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                transaction.transactionType === 'sale' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {transaction.transactionType === 'sale' ? 'Sale' : 'Purchase'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {transaction.clientName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction.weight} kg
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              PKR{transaction.rate}/kg
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              PKR{transaction.totalBalance.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              PKR{transaction.remainingAmount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                getPaymentStatusColor(statusInfo.status)
                              }`}>
                                {statusInfo.text}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleViewDetails(transaction)}
                                  className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                                  title="View Details"
                                >
                                  <EyeIcon />
                                  <span>View</span>
                                </button>
                                <button
                                  onClick={() => handleEdit(transaction)}
                                  className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                                  title="Edit Transaction"
                                >
                                  <EditIcon />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDownloadInvoice(transaction)}
                                  className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                                  title="Download Invoice PDF"
                                  disabled={loading}
                                >
                                  <DownloadIcon />
                                  <span>PDF</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteTransaction(transaction)}
                                  className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                                  title="Delete Transaction"
                                  disabled={deleteLoadingId === transaction._id}
                                >
                                  {deleteLoadingId === transaction._id ? (
                                    <span className="text-sm">Deleting...</span>
                                  ) : (
                                    <span>Delete</span>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {/* Summary Row */}
                    {filters.clientName && calculateSummary() && (() => {
                      const summary = calculateSummary()!;
                      return (
                        <tfoot className="bg-gray-100 border-t-2 border-gray-400">
                          <tr className="font-bold">
                            <td className="px-6 py-4 text-right" colSpan={3}>
                              TOTAL:
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {summary.totalWeight.toFixed(2)} kg
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              -
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              PKR {summary.totalAmount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              PKR {summary.totalReceived.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  summary.totalOutstanding > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {summary.totalOutstanding > 0 ? 'Pending' : 'Paid'}
                                </span>
                                {summary.totalOutstanding > 0 && (
                                  <span className="text-xs text-red-600 font-semibold mt-1">
                                    PKR {summary.totalOutstanding.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4"></td>
                          </tr>
                        </tfoot>
                      );
                    })()}
                  </table>
                </div>
              )}

              {/* Pagination - Hidden when filtering by client name */}
              {!filters.clientName && pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing page {pagination.currentPage} of {pagination.totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Transaction Details Modal */}
      {showDetails && selectedTransaction && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">{selectedProduct.name} Transaction Details</h2>
              <button
                onClick={closeModals}
                className="text-gray-500 hover:text-gray-700"
              >
                <CloseIcon />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Transaction Type</label>
                  <p className="text-lg font-semibold capitalize">{selectedTransaction.transactionType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Client/Supplier</label>
                  <p className="text-lg font-semibold">{selectedTransaction.clientName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Weight</label>
                  <p className="text-lg">{selectedTransaction.weight} kg</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Rate</label>
                  <p className="text-lg">PKR{selectedTransaction.rate}/kg</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Amount</label>
                  <p className="text-lg font-semibold">PKR{selectedTransaction.totalBalance.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {selectedTransaction.transactionType === 'sale' ? 'Amount Received' : 'Amount Paid'}
                  </label>
                  <p className="text-lg font-semibold">PKR{selectedTransaction.remainingAmount.toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">Payment Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      getPaymentStatusColor(getStatusDisplay(selectedTransaction).status)
                    }`}>
                      {getStatusDisplay(selectedTransaction).text}
                    </span>
                  </div>
                </div>
              </div>
              
              {selectedTransaction.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-lg">{selectedTransaction.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t flex space-x-3">
                <button
                  onClick={() => {
                    setShowDetails(false);
                    handleEdit(selectedTransaction);
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Edit Transaction
                </button>
                <button
                  onClick={() => {
                    if (selectedTransaction) {
                      handleDownloadInvoice(selectedTransaction);
                    }
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  disabled={loading}
                >
                  <DownloadIcon />
                  <span>Download Invoice</span>
                </button>
                <button
                  onClick={() => {
                    if (selectedTransaction) handleDeleteTransaction(selectedTransaction);
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  disabled={deleteLoadingId === selectedTransaction?._id}
                >
                  {deleteLoadingId === selectedTransaction?._id ? 'Deleting...' : 'Delete Transaction'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showEdit && selectedTransaction && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">Edit {selectedProduct.name} Transaction</h2>
              <button
                onClick={closeModals}
                className="text-gray-500 hover:text-gray-700"
                disabled={editLoading}
              >
                <CloseIcon />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Error/Success Messages */}
              {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                  {success}
                </div>
              )}

              {/* Client/Supplier Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {selectedTransaction.transactionType === 'sale' ? 'Client Name' : 'Supplier Name'} *
                </label>
                <input
                  type="text"
                  value={editFormData.clientName}
                  onChange={(e) => handleEditInputChange('clientName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={editLoading}
                />
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (in kg) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.weight}
                  onChange={(e) => handleEditInputChange('weight', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={editLoading}
                />
              </div>

              {/* Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rate (per kg) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.rate}
                  onChange={(e) => handleEditInputChange('rate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={editLoading}
                />
              </div>

              {/* Amount Received/Paid */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {selectedTransaction.transactionType === 'sale' ? 'Amount Received' : 'Amount Paid'} *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.remainingAmount}
                  onChange={(e) => handleEditInputChange('remainingAmount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={editLoading}
                />
              </div>

              {/* Total Balance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Balance *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.totalBalance}
                  onChange={(e) => handleEditInputChange('totalBalance', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={editLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-calculated: Weight × Rate = {((parseFloat(editFormData.weight) || 0) * (parseFloat(editFormData.rate) || 0)).toFixed(2)}
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => handleEditInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add any notes..."
                  disabled={editLoading}
                />
              </div>

              {/* Form Buttons */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={closeModals}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTransaction}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <>
                      <LoadingSpinner />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Transaction</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;