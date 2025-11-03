import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserManagement from '../components/UserManagement';
import RoleManagement from '../components/RoleManagement';
import ProductManagement from '../components/ProductManagement';
import EmployeeManagement from '../components/EmployeeManagement';
import ReportsManagement from '../components/ReportsManagement';
import SettingsManagement from '../components/SettingsManagement';
import {
  LayoutDashboard, 
  Users,
  Shield,
  Package,
  ShoppingCart, 
  TrendingUp, 
  Menu,
  X,
  LogOut,
  ChevronRight,
  BarChart3,
  UserCheck,
  Settings,
  FileText
} from 'lucide-react';


interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: Array<{
    roleName: string;
    count: number;
  }>;
  usersByDepartment: Array<{
    _id: string;
    count: number;
  }>;
}

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: {
    name: string;
    displayName: string;
  };
}

interface Purchase {
  _id: string;
  productType: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  amountPaid: number;
  paymentStatus: 'pending' | 'paid' | 'advance';
  vendor?: string;
  notes?: string;
  createdAt: string;
}

interface Sale {
  _id: string;
  productType: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  amountReceived: number;
  paymentStatus: 'pending' | 'paid' | 'advance';
  customer?: string;
  notes?: string;
  createdAt: string;
}

interface ProductType {
  id: string;
  name: string;
  value: string;
}

interface TransactionData {
  _id: string;
  productType: string;
  transactionType: string;
  clientName: string;
  weight: number;
  rate: number;
  totalBalance: number;
  remainingAmount: number;
  notes?: string;
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'roles' | 'products' | 'purchases' | 'sales' | 'employees' | 'reports' | 'settings'>('dashboard');
  const [purchaseSubTab, setPurchaseSubTab] = useState<'create' | 'list'>('create');
  const [salesSubTab, setSalesSubTab] = useState<'create' | 'list'>('create');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Purchase form state
  const [purchaseForm, setPurchaseForm] = useState({
    productType: '',
    quantity: '',
    rate: '',
    totalAmount: '',
    amountPaid: '',
    paymentStatus: 'pending' as 'pending' | 'paid' | 'advance',
    vendor: '',
    notes: ''
  });
  
  // Sales form state
  const [salesForm, setSalesForm] = useState({
    productType: '',
    quantity: '',
    rate: '',
    totalAmount: '',
    amountReceived: '',
    paymentStatus: 'pending' as 'pending' | 'paid' | 'advance',
    customer: '',
    notes: ''
  });

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const userData = localStorage.getItem('adminUser');

    if (!token || !userData) {
      navigate('/admin/login');
      return;
    }

    try {
      const user = JSON.parse(userData);
      setAdminUser(user);
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/admin/login');
    }
  }, [navigate]);

  // Load dashboard data
  useEffect(() => {
    if (adminUser) {
      loadDashboardData();
      fetchProductTypes();
    }
  }, [adminUser]);

  // Load purchases when switching to purchases tab
  useEffect(() => {
    if (activeTab === 'purchases' && purchaseSubTab === 'list') {
      fetchPurchases();
    }
  }, [activeTab, purchaseSubTab]);

  // Load sales when switching to sales tab
  useEffect(() => {
    if (activeTab === 'sales' && salesSubTab === 'list') {
      fetchSales();
    }
  }, [activeTab, salesSubTab]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const { authenticatedFetch } = await import('../utils/apiClient');

      // Load user stats
      try {
        const statsResult = await authenticatedFetch<{ success: boolean; data?: any }>('/admin/users/stats');
        if (statsResult.success && statsResult.data) {
          setUserStats(statsResult.data);
        }
      } catch (err) {
        console.error('Error loading user stats:', err);
      }

      // Load users list
      try {
        const usersResult = await authenticatedFetch<{ success: boolean; data?: any }>('/admin/users?limit=10');
        if (usersResult.success) {
          // Users data loaded successfully
        }
      } catch (err) {
        console.error('Error loading users:', err);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  // Fetch product types
  const fetchProductTypes = async () => {
    try {
      const { fetchProductTypes: fetchTypes } = await import('../utils/productTypes');
      const types = await fetchTypes();
      setProductTypes(types);
    } catch (error) {
      console.error('Error fetching product types:', error);
      // Fallback types are returned by fetchProductTypes utility
    }
  };

  // Auto-calculate total amount and payment status for purchases
  const handlePurchaseFormChange = (field: string, value: string) => {
    const updated = { ...purchaseForm, [field]: value };
    
    // Auto-calculate total amount
    if (field === 'quantity' || field === 'rate') {
      const quantity = parseFloat(field === 'quantity' ? value : updated.quantity);
      const rate = parseFloat(field === 'rate' ? value : updated.rate);
      if (!isNaN(quantity) && !isNaN(rate)) {
        updated.totalAmount = (quantity * rate).toString();
      }
    }
    
    // Auto-calculate payment status
    if (field === 'amountPaid' || field === 'totalAmount') {
      const amountPaid = parseFloat(field === 'amountPaid' ? value : updated.amountPaid);
      const totalAmount = parseFloat(field === 'totalAmount' ? value : updated.totalAmount);
      
      if (amountPaid === 0) {
        updated.paymentStatus = 'pending';
      } else if (amountPaid < totalAmount) {
        updated.paymentStatus = 'pending';
      } else if (amountPaid === totalAmount) {
        updated.paymentStatus = 'advance';
      } else {
        updated.paymentStatus = 'paid';
      }
    }
    
    setPurchaseForm(updated);
  };

  // Auto-calculate total amount and payment status for sales
  const handleSalesFormChange = (field: string, value: string) => {
    const updated = { ...salesForm, [field]: value };
    
    // Auto-calculate total amount
    if (field === 'quantity' || field === 'rate') {
      const quantity = parseFloat(field === 'quantity' ? value : updated.quantity);
      const rate = parseFloat(field === 'rate' ? value : updated.rate);
      if (!isNaN(quantity) && !isNaN(rate)) {
        updated.totalAmount = (quantity * rate).toString();
      }
    }
    
    // Auto-calculate payment status
    if (field === 'amountReceived' || field === 'totalAmount') {
      const amountReceived = parseFloat(field === 'amountReceived' ? value : updated.amountReceived);
      const totalAmount = parseFloat(field === 'totalAmount' ? value : updated.totalAmount);
      
      if (amountReceived === 0) {
        updated.paymentStatus = 'pending';
      } else if (amountReceived < totalAmount) {
        updated.paymentStatus = 'pending';
      } else if (amountReceived === totalAmount) {
        updated.paymentStatus = 'advance';
      } else {
        updated.paymentStatus = 'paid';
      }
    }
    
    setSalesForm(updated);
  };

  // Create purchase
  const handleCreatePurchase = async () => {
    try {
      setPurchaseLoading(true);
      const { authenticatedFetch } = await import('../utils/apiClient');
      const result = await authenticatedFetch<{ success: boolean; data?: any }>(`/products/${purchaseForm.productType.toLowerCase().replace(/\s+/g, '-')}`, {
        method: 'POST',
        body: JSON.stringify({
          transactionType: 'purchase',
          clientName: purchaseForm.vendor || 'Vendor',
          weight: parseFloat(purchaseForm.quantity),
          rate: parseFloat(purchaseForm.rate),
          remainingAmount: parseFloat(purchaseForm.totalAmount) - parseFloat(purchaseForm.amountPaid),
          totalBalance: parseFloat(purchaseForm.totalAmount),
          notes: purchaseForm.notes
        })
      });

      if (result.success) {
        setPurchaseForm({
          productType: '',
          quantity: '',
          rate: '',
          totalAmount: '',
          amountPaid: '',
          paymentStatus: 'pending',
          vendor: '',
          notes: ''
        });
        // Refresh purchases list
        fetchPurchases();
        alert('Purchase created successfully!');
      } else {
        const errorMsg = (result as any).message || 'Failed to create purchase';
        alert(`Error: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error('Error creating purchase:', error);
      const errorMessage = error?.message || error?.toString() || 'Network error. Please check if the server is running.';
      if (errorMessage.includes('Permission') || errorMessage.includes('403')) {
        alert(`Permission Denied: ${errorMessage}`);
      } else {
        alert(`Error creating purchase: ${errorMessage}`);
      }
    } finally {
      setPurchaseLoading(false);
    }
  };

  // Create sale
  const handleCreateSales = async () => {
    try {
      setSalesLoading(true);
      const { authenticatedFetch } = await import('../utils/apiClient');
      const result = await authenticatedFetch<{ success: boolean; data?: any }>(`/products/${salesForm.productType.toLowerCase().replace(/\s+/g, '-')}`, {
        method: 'POST',
        body: JSON.stringify({
          transactionType: 'sale',
          clientName: salesForm.customer || 'Customer',
          weight: parseFloat(salesForm.quantity),
          rate: parseFloat(salesForm.rate),
          remainingAmount: parseFloat(salesForm.totalAmount) - parseFloat(salesForm.amountReceived),
          totalBalance: parseFloat(salesForm.totalAmount),
          notes: salesForm.notes
        })
      });

      if (result.success) {
        setSalesForm({
          productType: '',
          quantity: '',
          rate: '',
          totalAmount: '',
          amountReceived: '',
          paymentStatus: 'pending',
          customer: '',
          notes: ''
        });
        // Refresh sales list
        fetchSales();
        alert('Sale created successfully!');
      } else {
        const errorMsg = (result as any).message || 'Failed to create sale';
        alert(`Error: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error('Error creating sale:', error);
      const errorMessage = error?.message || error?.toString() || 'Network error. Please check if the server is running.';
      if (errorMessage.includes('Permission') || errorMessage.includes('403')) {
        alert(`Permission Denied: ${errorMessage}`);
      } else {
        alert(`Error creating sale: ${errorMessage}`);
      }
    } finally {
      setSalesLoading(false);
    }
  };

  // Fetch all purchases
  const fetchPurchases = async () => {
    try {
      setPurchaseLoading(true);
      // Fetch all product types first
      const { authenticatedFetch } = await import('../utils/apiClient');
      const { fetchProductTypes: fetchTypes } = await import('../utils/productTypes');
      const productTypes = await fetchTypes();
      
      if (productTypes.length > 0) {
        const allPurchases: Purchase[] = [];
        
        // Fetch transactions for each product type
        for (const productType of productTypes) {
          console.log('Fetching transactions for product type:', productType.name);
          try {
            const transactionsResult = await authenticatedFetch<{ success: boolean; data?: TransactionData[] }>(`/products/${productType.value}`);
            console.log('Transactions result for', productType.name, ':', transactionsResult);
            if (transactionsResult.success && transactionsResult.data) {
              const purchases = transactionsResult.data
                .filter((t: TransactionData) => t.transactionType === 'purchase')
                .map((t: TransactionData) => {
                  const amountPaid = t.totalBalance - t.remainingAmount;
                  let paymentStatus: 'pending' | 'paid' | 'advance' = 'pending';
                  
                  if (amountPaid === 0) {
                    paymentStatus = 'pending';
                  } else if (amountPaid < t.totalBalance) {
                    paymentStatus = 'pending';
                  } else if (amountPaid === t.totalBalance) {
                    paymentStatus = 'advance';
                  } else {
                    paymentStatus = 'paid';
                  }
                  
                  return {
                    _id: t._id,
                    productType: productType.name,
                    quantity: t.weight,
                    rate: t.rate,
                    totalAmount: t.totalBalance,
                    amountPaid: amountPaid,
                    paymentStatus: paymentStatus,
                    vendor: t.clientName,
                    notes: t.notes || '',
                    createdAt: t.createdAt
                  };
                });
              allPurchases.push(...purchases);
              console.log('Found purchases for', productType.name, ':', purchases.length);
            }
          } catch (err) {
            console.error(`Error fetching transactions for ${productType.name}:`, err);
          }
        }
        
        console.log('Total purchases found:', allPurchases.length);
        setPurchases(allPurchases);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setPurchaseLoading(false);
    }
  };

  // Fetch all sales
  const fetchSales = async () => {
    try {
      setSalesLoading(true);
      // Fetch all product types first
      const { authenticatedFetch } = await import('../utils/apiClient');
      const { fetchProductTypes: fetchTypes } = await import('../utils/productTypes');
      const productTypes = await fetchTypes();
      
      if (productTypes.length > 0) {
        const allSales: Sale[] = [];
        
        // Fetch transactions for each product type
        for (const productType of productTypes) {
          console.log('Fetching sales for product type:', productType.name);
          try {
            const transactionsResult = await authenticatedFetch<{ success: boolean; data?: TransactionData[] }>(`/products/${productType.value}`);
            console.log('Sales result for', productType.name, ':', transactionsResult);
            if (transactionsResult.success && transactionsResult.data) {
              const sales = transactionsResult.data
                .filter((t: TransactionData) => t.transactionType === 'sale')
                .map((t: TransactionData) => {
                  const amountReceived = t.totalBalance - t.remainingAmount;
                  let paymentStatus: 'pending' | 'paid' | 'advance' = 'pending';
                  
                  if (amountReceived === 0) {
                    paymentStatus = 'pending';
                  } else if (amountReceived < t.totalBalance) {
                    paymentStatus = 'pending';
                  } else if (amountReceived === t.totalBalance) {
                    paymentStatus = 'advance';
                  } else {
                    paymentStatus = 'paid';
                  }
                  
                  return {
                    _id: t._id,
                    productType: productType.name,
                    quantity: t.weight,
                    rate: t.rate,
                    totalAmount: t.totalBalance,
                    amountReceived: amountReceived,
                    paymentStatus: paymentStatus,
                    customer: t.clientName,
                    notes: t.notes || '',
                    createdAt: t.createdAt
                  };
                });
              allSales.push(...sales);
              console.log('Found sales for', productType.name, ':', sales.length);
            }
          } catch (err) {
            console.error(`Error fetching transactions for ${productType.name}:`, err);
          }
        }
        
        console.log('Total sales found:', allSales.length);
        setSales(allSales);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setSalesLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };


  // Sidebar navigation items
  const sidebarItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      activeBgColor: 'bg-blue-100'
    },
    {
      id: 'users',
      label: 'Users',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      activeBgColor: 'bg-green-100'
    },
    {
      id: 'employees',
      label: 'Employees',
      icon: UserCheck,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      activeBgColor: 'bg-cyan-100'
    },
    {
      id: 'roles',
      label: 'Roles',
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      activeBgColor: 'bg-purple-100'
    },
    {
      id: 'products',
      label: 'Products',
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      activeBgColor: 'bg-orange-100'
    },
    {
      id: 'purchases',
      label: 'Purchases',
      icon: ShoppingCart,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      activeBgColor: 'bg-indigo-100'
    },
    {
      id: 'sales',
      label: 'Sales',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      activeBgColor: 'bg-emerald-100'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      activeBgColor: 'bg-pink-100'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      activeBgColor: 'bg-gray-100'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-white" />
            <span className="ml-2 text-xl font-bold text-white">Admin Panel</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* User Info */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {adminUser?.firstName?.charAt(0)}{adminUser?.lastName?.charAt(0)}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {adminUser?.firstName} {adminUser?.lastName}
              </p>
              <p className="text-xs text-gray-500">{adminUser?.role?.displayName || 'Admin'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as 'dashboard' | 'users' | 'roles' | 'products' | 'purchases' | 'sales' | 'employees' | 'reports' | 'settings');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                    isActive
                      ? `${item.activeBgColor} ${item.color} shadow-sm`
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <IconComponent className={`mr-3 h-5 w-5 ${isActive ? item.color : 'text-gray-400 group-hover:text-gray-500'}`} />
                  {item.label}
                  {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
            </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-600"
            >
              <Menu className="h-6 w-6" />
            </button>
              <h1 className="ml-2 text-xl font-semibold text-gray-900">
                {sidebarItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">
                    {adminUser?.firstName?.charAt(0)}{adminUser?.lastName?.charAt(0)}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {adminUser?.firstName} {adminUser?.lastName}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {activeTab === 'dashboard' && (
                <div className="space-y-8">
              {/* Welcome Section */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-3xl font-bold mb-2">Welcome back, {adminUser?.firstName}!</h1>
                        <p className="text-blue-100 text-lg">Here's what's happening with your factory management system today.</p>
                      </div>
                      <div className="hidden md:block">
                        <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                          <BarChart3 className="w-10 h-10 text-white" />
                        </div>
                      </div>
                </div>
              </div>

              {/* Stats Cards */}
                  {userStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Users</p>
                            <p className="text-3xl font-bold text-gray-900">{userStats.totalUsers}</p>
                      </div>
                          <div className="p-3 bg-blue-100 rounded-full">
                            <Users className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                        <div className="mt-4">
                          <span className="text-sm text-gray-500">All registered users</span>
                        </div>
                  </div>

                      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Active Users</p>
                            <p className="text-3xl font-bold text-gray-900">{userStats.activeUsers}</p>
                      </div>
                          <div className="p-3 bg-green-100 rounded-full">
                            <Users className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                        <div className="mt-4">
                          <span className="text-sm text-green-600 font-medium">
                            {Math.round((userStats.activeUsers / userStats.totalUsers) * 100)}% of total
                          </span>
                        </div>
                  </div>

                      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Inactive Users</p>
                            <p className="text-3xl font-bold text-gray-900">{userStats.inactiveUsers}</p>
                          </div>
                          <div className="p-3 bg-red-100 rounded-full">
                            <Users className="h-6 w-6 text-red-600" />
                          </div>
                        </div>
                        <div className="mt-4">
                          <span className="text-sm text-red-600 font-medium">
                            {Math.round((userStats.inactiveUsers / userStats.totalUsers) * 100)}% of total
                          </span>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">User Roles</p>
                            <p className="text-3xl font-bold text-gray-900">{userStats.usersByRole.length}</p>
                          </div>
                          <div className="p-3 bg-purple-100 rounded-full">
                            <Shield className="h-6 w-6 text-purple-600" />
                          </div>
                        </div>
                        <div className="mt-4">
                          <span className="text-sm text-gray-500">Different role types</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <button
                        onClick={() => setActiveTab('users')}
                        className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                      >
                        <Users className="h-8 w-8 text-blue-600 mr-3" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">Manage Users</p>
                          <p className="text-sm text-gray-500">Add, edit, or remove users</p>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab('products')}
                        className="flex items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group"
                      >
                        <Package className="h-8 w-8 text-orange-600 mr-3" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">Manage Products</p>
                          <p className="text-sm text-gray-500">Add or update product types</p>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab('purchases')}
                        className="flex items-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors group"
                      >
                        <ShoppingCart className="h-8 w-8 text-indigo-600 mr-3" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">Create Purchase</p>
                          <p className="text-sm text-gray-500">Record new purchase</p>
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab('sales')}
                        className="flex items-center p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors group"
                      >
                        <TrendingUp className="h-8 w-8 text-emerald-600 mr-3" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">Create Sale</p>
                          <p className="text-sm text-gray-500">Record new sale</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
                    <div className="space-y-4">
                      <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                      </div>
                      <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">User Management</p>
                          <p className="text-sm text-gray-500">Manage user accounts and permissions</p>
                      </div>
                      </div>

                      <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-orange-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">Product Management</p>
                          <p className="text-sm text-gray-500">Add and manage product types</p>
                    </div>
                  </div>

                      <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-indigo-600" />
                          </div>
                      </div>
                      <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">Purchase Management</p>
                          <p className="text-sm text-gray-500">Track and manage purchases</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="bg-white rounded-xl shadow-lg">
                  <UserManagement />
                </div>
              )}

              {activeTab === 'roles' && (
                <div className="bg-white rounded-xl shadow-lg">
                  <RoleManagement />
                </div>
              )}

              {activeTab === 'products' && (
                <div className="bg-white rounded-xl shadow-lg">
                  <ProductManagement />
                </div>
              )}

              {activeTab === 'employees' && (
                <div className="bg-white rounded-xl shadow-lg">
                  <EmployeeManagement />
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="bg-white rounded-xl shadow-lg">
                  <ReportsManagement />
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="bg-white rounded-xl shadow-lg">
                  <SettingsManagement />
                </div>
              )}

              {activeTab === 'purchases' && (
                <div className="space-y-6">
                  {/* Purchases Sub Navigation */}
                  <div className="bg-white rounded-xl shadow-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex space-x-8">
                        <button
                          onClick={() => setPurchaseSubTab('create')}
                          className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            purchaseSubTab === 'create'
                              ? 'border-indigo-500 text-indigo-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Create Purchase
                        </button>
                        <button
                          onClick={() => setPurchaseSubTab('list')}
                          className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            purchaseSubTab === 'list'
                              ? 'border-indigo-500 text-indigo-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          All Purchases
                        </button>
                      </div>
                    </div>

                    {/* Create Purchase Form */}
                    {purchaseSubTab === 'create' && (
                      <div className="p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Purchase</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Product Type *
                            </label>
                            <select
                              value={purchaseForm.productType}
                              onChange={(e) => handlePurchaseFormChange('productType', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">Select Product Type</option>
                              {productTypes.map((type) => (
                                <option key={type.id} value={type.name}>
                                  {type.name}
                                </option>
                              ))}
                            </select>
                </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Quantity *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={purchaseForm.quantity}
                              onChange={(e) => handlePurchaseFormChange('quantity', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Enter quantity"
                            />
                </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Rate per Unit *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={purchaseForm.rate}
                              onChange={(e) => handlePurchaseFormChange('rate', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Enter rate per unit"
                            />
              </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Total Amount
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={purchaseForm.totalAmount}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                              placeholder="Auto-calculated"
                            />
                </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Amount Paid *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={purchaseForm.amountPaid}
                              onChange={(e) => handlePurchaseFormChange('amountPaid', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Enter amount paid"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Payment Status
                            </label>
                            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                              <div className="flex items-center justify-between">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  purchaseForm.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                  purchaseForm.paymentStatus === 'advance' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {purchaseForm.paymentStatus === 'paid' ? 'Paid' :
                                   purchaseForm.paymentStatus === 'advance' ? 'Advance' :
                                   'Pending'}
                                </span>
                                <div className="text-right text-sm">
                                  <div className="text-gray-600">
                                    Paid: PKR {parseFloat(purchaseForm.amountPaid || '0').toLocaleString()}
                                  </div>
                                  <div className="text-gray-500">
                                    Total: PKR {parseFloat(purchaseForm.totalAmount || '0').toLocaleString()}
                                  </div>
                                  {purchaseForm.paymentStatus === 'advance' && (
                                    <div className="text-orange-600 font-medium">
                                      Remaining: PKR{(parseFloat(purchaseForm.totalAmount || '0') - parseFloat(purchaseForm.amountPaid || '0')).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="mt-2 text-xs text-gray-500">(Auto-calculated)</div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Vendor
                            </label>
                            <input
                              type="text"
                              value={purchaseForm.vendor}
                              onChange={(e) => handlePurchaseFormChange('vendor', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Enter vendor name"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Notes
                            </label>
                            <textarea
                              value={purchaseForm.notes}
                              onChange={(e) => handlePurchaseFormChange('notes', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              placeholder="Enter any additional notes"
                            />
                          </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                          <button
                            onClick={handleCreatePurchase}
                            disabled={purchaseLoading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {purchaseLoading ? 'Creating...' : 'Create Purchase'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* All Purchases List */}
                    {purchaseSubTab === 'list' && (
                      <div className="p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">All Purchases</h2>
                        
                        {purchaseLoading ? (
                          <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Loading purchases...</p>
                          </div>
                        ) : purchases.length === 0 ? (
                          <div className="p-8 text-center text-gray-500">
                            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p>No purchases found.</p>
                          </div>
                        ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product Type
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rate
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Amount
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount Paid
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Vendor
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                  </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                                {purchases.map((purchase) => (
                                  <tr key={purchase._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {purchase.productType}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {purchase.quantity}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      PKR{purchase.rate.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      PKR{purchase.totalAmount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      PKR{purchase.amountPaid.toLocaleString()}
                                    </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        purchase.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                        purchase.paymentStatus === 'advance' ? 'bg-blue-100 text-blue-800' :
                                        'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {purchase.paymentStatus}
                                  </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {purchase.vendor || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {formatDate(purchase.createdAt)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                                </div>
                        )}
                              </div>
                    )}
                                </div>
                </div>
              )}

              {activeTab === 'sales' && (
                <div className="space-y-6">
                  {/* Sales Sub Navigation */}
                  <div className="bg-white rounded-xl shadow-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex space-x-8">
                        <button
                          onClick={() => setSalesSubTab('create')}
                          className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            salesSubTab === 'create'
                              ? 'border-emerald-500 text-emerald-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Create Sales
                        </button>
                        <button
                          onClick={() => setSalesSubTab('list')}
                          className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            salesSubTab === 'list'
                              ? 'border-emerald-500 text-emerald-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          All Sales
                        </button>
                              </div>
                            </div>

                    {/* Create Sales Form */}
                    {salesSubTab === 'create' && (
                      <div className="p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Sales</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Product Type *
                            </label>
                            <select
                              value={salesForm.productType}
                              onChange={(e) => handleSalesFormChange('productType', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="">Select Product Type</option>
                              {productTypes.map((type) => (
                                <option key={type.id} value={type.name}>
                                  {type.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Quantity *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={salesForm.quantity}
                              onChange={(e) => handleSalesFormChange('quantity', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              placeholder="Enter quantity"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Rate per Unit *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={salesForm.rate}
                              onChange={(e) => handleSalesFormChange('rate', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              placeholder="Enter rate per unit"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Total Amount
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={salesForm.totalAmount}
                              readOnly
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                              placeholder="Auto-calculated"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Amount Received *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={salesForm.amountReceived}
                              onChange={(e) => handleSalesFormChange('amountReceived', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              placeholder="Enter amount received"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Payment Status
                            </label>
                            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                              <div className="flex items-center justify-between">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  salesForm.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                  salesForm.paymentStatus === 'advance' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {salesForm.paymentStatus === 'paid' ? 'Paid' :
                                   salesForm.paymentStatus === 'advance' ? 'Advance' :
                                   'Pending'}
                                </span>
                                <div className="text-right text-sm">
                                  <div className="text-gray-600">
                                    Received: PKR{parseFloat(salesForm.amountReceived || '0').toLocaleString()}
                                  </div>
                                  <div className="text-gray-500">
                                    Total: PKR{parseFloat(salesForm.totalAmount || '0').toLocaleString()}
                                  </div>
                                  {salesForm.paymentStatus === 'advance' && (
                                    <div className="text-orange-600 font-medium">
                                      Remaining: PKR{(parseFloat(salesForm.totalAmount || '0') - parseFloat(salesForm.amountReceived || '0')).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="mt-2 text-xs text-gray-500">(Auto-calculated)</div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Customer
                            </label>
                            <input
                              type="text"
                              value={salesForm.customer}
                              onChange={(e) => handleSalesFormChange('customer', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              placeholder="Enter customer name"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Notes
                            </label>
                            <textarea
                              value={salesForm.notes}
                              onChange={(e) => handleSalesFormChange('notes', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              placeholder="Enter any additional notes"
                            />
                          </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                          <button
                            onClick={handleCreateSales}
                            disabled={salesLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {salesLoading ? 'Creating...' : 'Create Sales'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* All Sales List */}
                    {salesSubTab === 'list' && (
                      <div className="p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">All Sales</h2>
                        
                        {salesLoading ? (
                          <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Loading sales...</p>
                          </div>
                        ) : sales.length === 0 ? (
                          <div className="p-8 text-center text-gray-500">
                            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p>No sales found.</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product Type
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rate
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Amount
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount Received
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {sales.map((sale) => (
                                  <tr key={sale._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {sale.productType}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {sale.quantity}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      PKR{sale.rate.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      PKR{sale.totalAmount.toLocaleString()}
                          </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      PKR{sale.amountReceived.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        sale.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                        sale.paymentStatus === 'advance' ? 'bg-blue-100 text-blue-800' :
                                        'bg-yellow-100 text-yellow-800'
                            }`}>
                                        {sale.paymentStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {sale.customer || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {formatDate(sale.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
            </div>
          )}
              </div>
                    )}
            </div>
            </div>
          )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
