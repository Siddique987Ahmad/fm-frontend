import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProductTypes, type ProductType } from '../utils/productTypes';

// TypeScript interfaces
interface Product {
  name: string;
  color: string;
  productType: string;
  isExpense?: boolean;
}

interface FormData {
  clientName: string;
  weight: string;
  rate: string;
  remainingAmount: string;
  totalBalance: string;
}

interface DashboardStats {
  totalTransactions: number;
  salesCount: number;
  purchaseCount: number;
  totalValue: number;
}

interface PaymentStatus {
  type: 'pending' | 'advance' | 'full' | 'overpaid';
  amount: number;
  message: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: {
    productType?: string;
    totalTransactions?: number;
    totalSales?: number;
    totalPurchases?: number;
    totalSalesAmount?: number;
    totalPurchasesAmount?: number;
    totalAmount?: number;
  };
  errors?: string[];
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: {
    name: string;
    displayName: string;
    permissions: Array<{
      name: string;
    }>;
  };
  employeeId?: string;
  department?: string;
  position?: string;
  isActive: boolean;
}

// Icons as simple SVG components
const PackageIcon: React.FC = () => (
  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
  </svg>
);

const TrendingUpIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendingDownIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const LoadingSpinner: React.FC = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
);

// API base URL - Update this to match your backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    clientName: '',
    weight: '',
    rate: '',
    remainingAmount: '',
    totalBalance: ''
  });

  // State for dashboard statistics
  const [stats, setStats] = useState<DashboardStats>({
    totalTransactions: 0,
    salesCount: 0,
    purchaseCount: 0,
    totalValue: 0
  });
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('userData');
      const token = localStorage.getItem('userToken');

      if (!token || !storedUser) {
        navigate('/login');
        return;
      }

      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);

        // Verify token with server
        const response = await fetch(`${API_BASE_URL}/admin/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem('userToken');
          localStorage.removeItem('userData');
          navigate('/login');
          return;
        }

        const data = await response.json();
        if (data.success) {
          setUser(data.data);
          localStorage.setItem('userData', JSON.stringify(data.data));
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        navigate('/login');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Helper functions for role-based access
  const isAdmin = (): boolean => {
    return user?.role?.name === 'super-admin' || user?.role?.name === 'admin';
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  // Generate dashboard boxes dynamically from product types
  const getDashboardBoxes = (): Product[] => {
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
    
    const dynamicBoxes = productTypes.map((productType, index) => ({
      name: productType.name,
      color: colors[index % colors.length],
      productType: productType.value
    }));
    
    // Add expenses box
    dynamicBoxes.push({
      name: 'Other Expenses',
      color: 'bg-orange-500 hover:bg-orange-600',
      productType: 'expenses',
      isExpense: true
    } as Product);
    
    return dynamicBoxes;
  };

  // Fetch dashboard statistics and product types on component mount
  useEffect(() => {
    fetchStats();
    fetchProductTypesData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProductTypesData = async (): Promise<void> => {
    try {
      const types = await fetchProductTypes();
      setProductTypes(types);
    } catch (error) {
      console.error('Error fetching product types:', error);
    }
  };

  const fetchStats = async (): Promise<void> => {
    try {
      // Use dynamic product types if available, otherwise fallback to static ones
      const typesToFetch = productTypes.length > 0 
        ? productTypes.map(pt => pt.value)
        : ['white-oil', 'yellow-oil', 'crude-oil', 'diesel', 'petrol', 'kerosene'];
      
      let totalTransactions = 0;
      let totalSales = 0;
      let totalPurchases = 0;
      let totalSalesAmount = 0;
      let totalPurchasesAmount = 0;
      
      // Fetch stats for each product type
      for (const productType of typesToFetch) {
        try {
          const response = await fetch(`${API_BASE_URL}/products/${productType}/stats`);
          const result = await response.json();
          
          if (result.success && result.data) {
            totalTransactions += result.data.totalTransactions || 0;
            totalSales += result.data.totalSales || 0;
            totalPurchases += result.data.totalPurchases || 0;
            totalSalesAmount += result.data.totalSalesAmount || 0;
            totalPurchasesAmount += result.data.totalPurchasesAmount || 0;
          }
        } catch (error) {
          console.error(`Error fetching stats for ${productType}:`, error);
        }
      }
      
      // Update stats with combined data
      setStats({
        totalTransactions,
        salesCount: totalSales,
        purchaseCount: totalPurchases,
        totalValue: totalSalesAmount + totalPurchasesAmount
      });
      
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleBoxClick = (box: Product): void => {
    // Handle expense management routing
    if (box.isExpense) {
      window.location.href = '/user/expenses';
      return;
    }
    
    setSelectedProduct(box);
    setIsPopupOpen(true);
    setSelectedAction('');
    setShowForm(false);
    setError('');
    setSuccess('');
  };

  const handleActionSelect = (action: string): void => {
    setSelectedAction(action);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const closePopup = (): void => {
    setIsPopupOpen(false);
    setSelectedAction('');
    setSelectedProduct(null);
    setShowForm(false);
    setError('');
    setSuccess('');
    setFormData({
      clientName: '',
      weight: '',
      rate: '',
      remainingAmount: '',
      totalBalance: ''
    });
  };

  // Helper function to determine payment status
  const getPaymentStatus = (): PaymentStatus => {
    const total = parseFloat(formData.totalBalance) || 0;
    const remaining = parseFloat(formData.remainingAmount) || 0;
    
    if (!selectedAction) {
      return { type: 'pending', amount: 0, message: '' };
    }
    
    if (selectedAction === 'sale') {
      if (remaining > total) {
        return {
          type: 'advance',
          amount: remaining - total,
          message: `Advance Payment: PKR${(remaining - total).toFixed(2)}`
        };
      } else if (remaining === total) {
        return {
          type: 'full',
          amount: 0,
          message: 'Full Payment Received'
        };
      } else {
        return {
          type: 'pending',
          amount: total - remaining,
          message: `Pending Amount: PKR${(total - remaining).toFixed(2)}`
        };
      }
    } else { // purchase
      if (remaining > total) {
        return {
          type: 'overpaid',
          amount: remaining - total,
          message: `Overpaid Amount: PKR${(remaining - total).toFixed(2)}`
        };
      } else if (remaining === total) {
        return {
          type: 'full',
          amount: 0,
          message: 'Full Payment Made'
        };
      } else {
        return {
          type: 'pending',
          amount: total - remaining,
          message: `Pending Payment: PKR${(total - remaining).toFixed(2)}`
        };
      }
    }
  };

  const handleInputChange = (field: keyof FormData, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-calculate total balance when weight and rate change
    if (field === 'weight' || field === 'rate') {
      const weight = field === 'weight' ? parseFloat(value) || 0 : parseFloat(formData.weight) || 0;
      const rate = field === 'rate' ? parseFloat(value) || 0 : parseFloat(formData.rate) || 0;
      const calculatedTotal = weight * rate;
      
      setFormData(prev => ({
        ...prev,
        [field]: value,
        totalBalance: calculatedTotal.toFixed(2)
      }));
    }
  };

  const validateForm = (): boolean => {
    const { clientName, weight, rate, remainingAmount, totalBalance } = formData;
    
    if (!clientName.trim()) {
      setError('Client/Supplier name is required');
      return false;
    }
    
    if (!weight || parseFloat(weight) <= 0) {
      setError('Weight must be greater than 0');
      return false;
    }
    
    if (!rate || parseFloat(rate) <= 0) {
      setError('Rate must be greater than 0');
      return false;
    }
    
    if (remainingAmount === '' || parseFloat(remainingAmount) < 0) {
      setError('Remaining amount/Amount paid cannot be negative');
      return false;
    }
    
    if (!totalBalance || parseFloat(totalBalance) < 0) {
      setError('Total balance cannot be negative');
      return false;
    }
    
    return true;
  };

  const handleFormSubmit = async (): Promise<void> => {
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }

    // Safety check for selectedProduct
    if (!selectedProduct || !selectedProduct.productType) {
      setError('No product selected. Please try again.');
      return;
    }
    
    setLoading(true);
    
    try {
      const payload = {
        transactionType: selectedAction,
        clientName: formData.clientName.trim(),
        weight: parseFloat(formData.weight),
        weightUnit: 'kg',
        rate: parseFloat(formData.rate),
        rateUnit: 'per_kg',
        remainingAmount: parseFloat(formData.remainingAmount),
        totalBalance: parseFloat(formData.totalBalance)
      };

      // Use the new generic API endpoint
      const response = await fetch(`${API_BASE_URL}/products/${selectedProduct.productType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        setSuccess(`${selectedProduct.name} ${selectedAction} transaction created successfully!`);
        
        // Refresh stats
        await fetchStats();
        
        // Close popup after 2 seconds
        setTimeout(() => {
          closePopup();
        }, 2000);
      } else {
        setError(result.message || 'Failed to create transaction');
        if (result.errors && result.errors.length > 0) {
          setError(result.errors.join(', '));
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Network error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToActions = (): void => {
    setShowForm(false);
    setSelectedAction('');
    setError('');
    setSuccess('');
  };

  const handleTransactionsClick = (): void => {
    window.location.href = '/user/transactions';
  };

  const handleReportsClick = (): void => {
    window.location.href = '/user/reports';
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading Dashboard...</div>
      </div>
    );
  }

  // If no user, they should be redirected by now
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with user info */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Al Hamad Oil Factory Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Welcome back, {user.firstName} {user.lastName} • {user.role.displayName}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-500">{user.department} • {user.position}</p>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex justify-end space-x-4 mb-6">
          <button
            onClick={handleReportsClick}
            className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Reports & Analytics</span>
          </button>
          <button
            onClick={handleTransactionsClick}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>View Transactions</span>
          </button>
          {isAdmin() && (
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Admin Panel</span>
            </button>
          )}
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Sales</h3>
            <p className="text-2xl font-bold text-green-600">{stats.salesCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Purchases</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.purchaseCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
            <p className="text-2xl font-bold text-purple-600">PKR{stats.totalValue.toLocaleString()}</p>
          </div>
        </div>
        
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {getDashboardBoxes().map((box, index) => (
            <div
              key={index}
              onClick={() => handleBoxClick(box)}
              className={`${box.color} rounded-lg shadow-lg p-6 text-white cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{box.name}</h3>
                  <p className="text-white/80 text-sm">
                    {box.isExpense ? 'Manage expenses' : 'Click to manage'}
                  </p>
                </div>
                <PackageIcon />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popup Modal */}
      {isPopupOpen && selectedProduct && !selectedProduct.isExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">{selectedProduct.name} Management</h2>
              <button
                onClick={closePopup}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-lg hover:bg-gray-100"
                disabled={loading}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Error/Success Messages */}
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                  {success}
                </div>
              )}

              {!showForm ? (
                // Action Selection
                <div className="space-y-4">
                  <p className="text-gray-600 mb-6">Select an action for {selectedProduct.name}:</p>
                  
                  {(() => {
                    // Find the product type to get allowed transactions
                    const productType = productTypes.find(pt => pt.value === selectedProduct.productType);
                    const allowedTransactions = productType?.allowedTransactions || ['sale', 'purchase'];
                    
                    return (
                      <>
                        {allowedTransactions.includes('sale') && (
                          <button
                            onClick={() => handleActionSelect('sale')}
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                            disabled={loading}
                          >
                            <TrendingUpIcon />
                            <span>Sale</span>
                          </button>
                        )}
                        
                        {allowedTransactions.includes('purchase') && (
                          <button
                            onClick={() => handleActionSelect('purchase')}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                            disabled={loading}
                          >
                            <TrendingDownIcon />
                            <span>Purchase</span>
                          </button>
                        )}
                        
                        {allowedTransactions.length === 0 && (
                          <div className="text-center py-8">
                            <p className="text-gray-500 mb-2">No transactions allowed for this product</p>
                            <p className="text-sm text-gray-400">Contact admin to enable transactions</p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                // Form
                <div className="space-y-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 capitalize mb-4">
                      {selectedProduct.name} {selectedAction} Form
                    </h3>
                  </div>

                  {/* Client/Supplier Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {selectedAction === 'sale' ? 'Client Name' : 'Supplier Name'} *
                    </label>
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(e) => handleInputChange('clientName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Enter ${selectedAction === 'sale' ? 'client' : 'supplier'} name`}
                      disabled={loading}
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
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter weight in kg"
                      disabled={loading}
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
                      value={formData.rate}
                      onChange={(e) => handleInputChange('rate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter rate per kg"
                      disabled={loading}
                    />
                  </div>

                  {/* Remaining Amount / Amount Paid */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {selectedAction === 'sale' ? 'Amount Received' : 'Amount Paid'} *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.remainingAmount}
                      onChange={(e) => handleInputChange('remainingAmount', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`Enter ${selectedAction === 'sale' ? 'amount received' : 'amount paid'}`}
                      disabled={loading}
                    />
                  </div>

                  {/* Payment Status Indicator */}
                  {formData.remainingAmount && formData.totalBalance && (
                    <div className={`p-3 rounded-lg border ${
                      getPaymentStatus().type === 'advance' || getPaymentStatus().type === 'overpaid'
                        ? 'bg-blue-50 border-blue-200'
                        : getPaymentStatus().type === 'full'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          getPaymentStatus().type === 'advance' || getPaymentStatus().type === 'overpaid'
                            ? 'bg-blue-500'
                            : getPaymentStatus().type === 'full'
                            ? 'bg-green-500'
                            : 'bg-yellow-500'
                        }`}></div>
                        <span className={`text-sm font-medium ${
                          getPaymentStatus().type === 'advance' || getPaymentStatus().type === 'overpaid'
                            ? 'text-blue-700'
                            : getPaymentStatus().type === 'full'
                            ? 'text-green-700'
                            : 'text-yellow-700'
                        }`}>
                          {getPaymentStatus().message}
                        </span>
                      </div>
                      {(getPaymentStatus().type === 'advance' || getPaymentStatus().type === 'overpaid') && (
                        <p className="text-xs text-gray-600 mt-1">
                          {selectedAction === 'sale' 
                            ? 'This will be recorded as advance payment for future orders'
                            : 'This overpayment will be credited to your account'
                          }
                        </p>
                      )}
                    </div>
                  )}

                  {/* Total Balance */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Balance *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.totalBalance}
                      onChange={(e) => handleInputChange('totalBalance', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Auto-calculated or enter manually"
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Auto-calculated: Weight × Rate = {((parseFloat(formData.weight) || 0) * (parseFloat(formData.rate) || 0)).toFixed(2)}
                    </p>
                  </div>

                  {/* Form Buttons */}
                  <div className="flex space-x-3 mt-6">
                    <button
                      onClick={handleBackToActions}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                      disabled={loading}
                    >
                      Back
                    </button>
                    <button
                      onClick={handleFormSubmit}
                      className={`flex-1 ${
                        selectedAction === 'sale' 
                          ? 'bg-green-500 hover:bg-green-600' 
                          : 'bg-blue-500 hover:bg-blue-600'
                      } text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2`}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <span>Submit {selectedAction === 'sale' ? 'Sale' : 'Purchase'}</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;