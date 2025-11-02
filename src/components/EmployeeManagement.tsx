import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  UserCheck,
  UserX,
  Building
} from 'lucide-react';

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  phone?: string;
  email?: string;
  department: string;
  position: string;
  employeeType: 'permanent' | 'temporary' | 'daily-wage' | 'contractor';
  hireDate: string;
  salary?: number;
  salaryType: 'monthly' | 'daily' | 'hourly' | 'contract';
  isActive: boolean;
  status: 'active' | 'inactive' | 'terminated' | 'on-leave';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country: string;
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
    email?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  displayName: string;
  salaryDisplay: string;
  employmentDuration: string;
}

interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  employeesByType: Array<{
    type: string;
    count: number;
  }>;
  employeesByDepartment: Array<{
  department: string;
    count: number
  }>;
}

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    employeeId: '',
    phone: '',
    email: '',
    department: '',
    position: '',
    employeeType: 'permanent' as 'permanent' | 'temporary' | 'daily-wage' | 'contractor',
    hireDate: '',
    salary: '',
    salaryType: 'monthly' as 'monthly' | 'daily' | 'hourly' | 'contract',
    address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
      country: 'India'
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    },
    notes: ''
  });

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(filterDepartment && { department: filterDepartment }),
        ...(filterType && { employeeType: filterType }),
        ...(filterStatus && { status: filterStatus })
      });

      const { authenticatedFetch } = await import('../utils/apiClient');
      const result = await authenticatedFetch<{ success: boolean; data?: any; pagination?: { totalPages: number } }>(`/admin/employees?${params}`);
      
      if (result.success) {
        if (result.data) setEmployees(result.data);
        if (result.pagination) setTotalPages(result.pagination.totalPages);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const { authenticatedFetch } = await import('../utils/apiClient');
      const result = await authenticatedFetch<{ success: boolean; data?: any }>('/admin/employees/stats');
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Error fetching employee stats:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchStats();
  }, [currentPage, searchTerm, filterDepartment, filterType, filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const url = modalType === 'create'
  ? `${import.meta.env.VITE_API_URL ?? '/api'}/admin/employees`
  : `${import.meta.env.VITE_API_URL ?? '/api'}/admin/employees/${selectedEmployee?._id}`;
      
      const method = modalType === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          salary: formData.salary ? parseFloat(formData.salary) : undefined,
          hireDate: formData.hireDate || new Date().toISOString()
        })
      });

      if (response.ok) {
      const result = await response.json();
      if (result.success) {
          setShowModal(false);
        resetForm();
          fetchEmployees();
          fetchStats();
        }
      }
    } catch (err) {
      console.error('Error saving employee:', err);
      setError('Failed to save employee');
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
    try {
      const token = localStorage.getItem('adminToken');
  const response = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/admin/employees/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

        if (response.ok) {
          fetchEmployees();
          fetchStats();
        }
      } catch (err) {
        console.error('Error deleting employee:', err);
        setError('Failed to delete employee');
      }
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (id: string) => {
    try {
      const token = localStorage.getItem('adminToken');
  const response = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/admin/employees/${id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchEmployees();
        fetchStats();
      }
    } catch (err) {
      console.error('Error toggling employee status:', err);
      setError('Failed to toggle employee status');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      employeeId: '',
      phone: '',
      email: '',
      department: '',
      position: '',
      employeeType: 'permanent',
      hireDate: '',
      salary: '',
      salaryType: 'monthly',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India'
      },
      emergencyContact: {
        name: '',
        relationship: '',
        phone: '',
        email: ''
      },
      notes: ''
    });
    setSelectedEmployee(null);
  };

  // Open modal
  const openModal = (type: 'create' | 'edit' | 'view', employee?: Employee) => {
    setModalType(type);
    setSelectedEmployee(employee || null);
    
    if (type === 'create') {
      resetForm();
    } else if (employee) {
      setFormData({
        firstName: employee.firstName,
        lastName: employee.lastName,
        employeeId: employee.employeeId,
        phone: employee.phone || '',
        email: employee.email || '',
        department: employee.department,
        position: employee.position,
        employeeType: employee.employeeType,
        hireDate: employee.hireDate.split('T')[0],
        salary: employee.salary?.toString() || '',
        salaryType: employee.salaryType,
        address: {
          street: employee.address?.street || '',
          city: employee.address?.city || '',
          state: employee.address?.state || '',
          zipCode: employee.address?.zipCode || '',
          country: employee.address?.country || 'India'
        },
        emergencyContact: {
          name: employee.emergencyContact?.name || '',
          relationship: employee.emergencyContact?.relationship || '',
          phone: employee.emergencyContact?.phone || '',
          email: employee.emergencyContact?.email || ''
        },
        notes: employee.notes || ''
      });
    }
    
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      case 'on-leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get type color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'permanent': return 'bg-blue-100 text-blue-800';
      case 'temporary': return 'bg-orange-100 text-orange-800';
      case 'daily-wage': return 'bg-purple-100 text-purple-800';
      case 'contractor': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-600">Manage labor/worker records and information</p>
        </div>
        <button
          onClick={() => openModal('create')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalEmployees}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Employees</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeEmployees}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive Employees</p>
                <p className="text-3xl font-bold text-gray-900">{stats.inactiveEmployees}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-3xl font-bold text-gray-900">{stats.employeesByDepartment.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Building className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search employees..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {stats?.employeesByDepartment.map((dept) => (
                <option key={dept.department} value={dept.department}>
                  {dept.department} ({dept.count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="permanent">Permanent</option>
              <option value="temporary">Temporary</option>
              <option value="daily-wage">Daily Wage</option>
              <option value="contractor">Contractor</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
              <option value="on-leave">On Leave</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Employees List</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading employees...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p>No employees found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hire Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => (
                  <tr key={employee._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {employee.employeeId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.department}</div>
                      <div className="text-sm text-gray-500">{employee.position}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(employee.employeeType)}`}>
                        {employee.employeeType.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(employee.status)}`}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(employee.hireDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal('view', employee)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openModal('edit', employee)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(employee._id)}
                          className={employee.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}
                        >
                          {employee.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(employee._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      )}
      
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
        </div>
      )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeModal}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900">
                      {modalType === 'create' ? 'Add New Employee' : 
                       modalType === 'edit' ? 'Edit Employee' : 'Employee Details'}
                </h3>
                <button
                      type="button"
                      onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                      <span className="sr-only">Close</span>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                </button>
              </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-900 border-b pb-2">Basic Information</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                  <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                            disabled={modalType === 'view'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      required
                    />
                  </div>
                  <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                            disabled={modalType === 'view'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      required
                    />
                        </div>
                  </div>
                  
                  <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                    <input
                          type="text"
                          value={formData.employeeId}
                          onChange={(e) => setFormData({...formData, employeeId: e.target.value.toUpperCase()})}
                          disabled={modalType === 'view'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      required
                    />
                  </div>
                  
                      <div className="grid grid-cols-2 gap-4">
                  <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            disabled={modalType === 'view'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            disabled={modalType === 'view'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                  </div>
                      </div>
                  </div>

                    {/* Work Information */}
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-900 border-b pb-2">Work Information</h4>
                  
                  <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                    <input
                      type="text"
                      value={formData.department}
                          onChange={(e) => setFormData({...formData, department: e.target.value})}
                          disabled={modalType === 'view'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                          required
                    />
                  </div>
                  
                  <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                    <input
                      type="text"
                      value={formData.position}
                          onChange={(e) => setFormData({...formData, position: e.target.value})}
                          disabled={modalType === 'view'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                          required
                    />
                  </div>
                  
                      <div className="grid grid-cols-2 gap-4">
                  <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Employee Type *</label>
                    <select
                      value={formData.employeeType}
                            onChange={(e) => setFormData({...formData, employeeType: e.target.value as 'permanent' | 'temporary' | 'daily-wage' | 'contractor'})}
                            disabled={modalType === 'view'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      required
                    >
                      <option value="permanent">Permanent</option>
                      <option value="temporary">Temporary</option>
                      <option value="daily-wage">Daily Wage</option>
                      <option value="contractor">Contractor</option>
                    </select>
                  </div>
                  <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date *</label>
                    <input
                            type="date"
                            value={formData.hireDate}
                            onChange={(e) => setFormData({...formData, hireDate: e.target.value})}
                            disabled={modalType === 'view'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                            required
                          />
                        </div>
                  </div>
                  
                      <div className="grid grid-cols-2 gap-4">
                  <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                    <input
                            type="number"
                            value={formData.salary}
                            onChange={(e) => setFormData({...formData, salary: e.target.value})}
                            disabled={modalType === 'view'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Salary Type</label>
                          <select
                            value={formData.salaryType}
                            onChange={(e) => setFormData({...formData, salaryType: e.target.value as 'monthly' | 'daily' | 'hourly' | 'contract'})}
                            disabled={modalType === 'view'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                          >
                            <option value="monthly">Monthly</option>
                            <option value="daily">Daily</option>
                            <option value="hourly">Hourly</option>
                            <option value="contract">Contract</option>
                          </select>
                        </div>
                  </div>
                </div>

                {/* Address Information */}
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-900 border-b pb-2">Address</h4>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                      <input
                        type="text"
                          value={formData.address.street}
                          onChange={(e) => setFormData({...formData, address: {...formData.address, street: e.target.value}})}
                          disabled={modalType === 'view'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    
                      <div className="grid grid-cols-2 gap-4">
                    <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                            value={formData.address.city}
                            onChange={(e) => setFormData({...formData, address: {...formData.address, city: e.target.value}})}
                            disabled={modalType === 'view'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                            value={formData.address.state}
                            onChange={(e) => setFormData({...formData, address: {...formData.address, state: e.target.value}})}
                            disabled={modalType === 'view'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                          />
                        </div>
                    </div>
                    
                      <div className="grid grid-cols-2 gap-4">
                    <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                      <input
                        type="text"
                            value={formData.address.zipCode}
                            onChange={(e) => setFormData({...formData, address: {...formData.address, zipCode: e.target.value}})}
                            disabled={modalType === 'view'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                            value={formData.address.country}
                            onChange={(e) => setFormData({...formData, address: {...formData.address, country: e.target.value}})}
                            disabled={modalType === 'view'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-900 border-b pb-2">Emergency Contact</h4>
                      
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                          value={formData.emergencyContact.name}
                          onChange={(e) => setFormData({...formData, emergencyContact: {...formData.emergencyContact, name: e.target.value}})}
                          disabled={modalType === 'view'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                      <input
                        type="text"
                          value={formData.emergencyContact.relationship}
                          onChange={(e) => setFormData({...formData, emergencyContact: {...formData.emergencyContact, relationship: e.target.value}})}
                          disabled={modalType === 'view'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    
                      <div className="grid grid-cols-2 gap-4">
                    <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                            value={formData.emergencyContact.phone}
                            onChange={(e) => setFormData({...formData, emergencyContact: {...formData.emergencyContact, phone: e.target.value}})}
                            disabled={modalType === 'view'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                            value={formData.emergencyContact.email}
                            onChange={(e) => setFormData({...formData, emergencyContact: {...formData.emergencyContact, email: e.target.value}})}
                            disabled={modalType === 'view'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                          />
                        </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      disabled={modalType === 'view'}
                    rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    placeholder="Additional notes about the employee..."
                  />
                  </div>
                </div>

                {modalType !== 'view' && (
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {modalType === 'create' ? 'Create Employee' : 'Update Employee'}
                  </button>
                  <button
                      type="button"
                      onClick={closeModal}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                      Cancel
                  </button>
        </div>
      )}

                {modalType === 'view' && (
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                      type="button"
                      onClick={closeModal}
                      className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm"
                >
                      Close
                </button>
                        </div>
                      )}
              </form>
                        </div>
                        </div>
                        </div>
                      )}
    </div>
  );
};

export default EmployeeManagement;