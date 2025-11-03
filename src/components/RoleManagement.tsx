import React, { useState, useEffect } from 'react';

interface Role {
  _id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: Permission[];
  createdAt: string;
  isSystemRole?: boolean;
}

interface Permission {
  _id: string;
  name: string;
  description: string;
}

const API_BASE_URL = `${import.meta.env.VITE_API_URL ?? '/api'}/admin`;

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showAddRoleForm, setShowAddRoleForm] = useState<boolean>(false);
  const [newRole, setNewRole] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: [] as string[]
  });
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  const fetchRolesAndPermissions = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setError('Authentication token not found. Please log in.');
      setLoading(false);
      return;
    }

    try {
      const { authenticatedFetch } = await import('../utils/apiClient');
      const [rolesData, permissionsData] = await Promise.all([
        authenticatedFetch<{ success: boolean; data?: any[]; message?: string }>('/admin/roles'),
        authenticatedFetch<{ success: boolean; data?: any[]; message?: string }>('/admin/permissions')
      ]);

      if (rolesData.success && rolesData.data) {
        setRoles(rolesData.data);
      } else {
        setError(rolesData.message || 'Failed to fetch roles.');
      }

      if (permissionsData.success && permissionsData.data) {
        setPermissions(permissionsData.data);
      } else {
        setError(permissionsData.message || 'Failed to fetch permissions.');
      }

    } catch (err) {
      console.error('Error fetching roles or permissions:', err);
      setError('Network error or failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewRoleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewRole({ ...newRole, [e.target.name]: e.target.value });
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setNewRole({ ...newRole, permissions: [...newRole.permissions, permissionId] });
    } else {
      setNewRole({ ...newRole, permissions: newRole.permissions.filter(id => id !== permissionId) });
    }
  };

  const handleAddRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const token = localStorage.getItem('adminToken');

    try {
      const { authenticatedFetch } = await import('../utils/apiClient');
      const data = await authenticatedFetch<{ success: boolean; message?: string }>('/admin/roles', {
        method: 'POST',
        body: JSON.stringify(newRole),
      });

      if (data.success) {
        alert('Role added successfully!');
        setShowAddRoleForm(false);
        setNewRole({
          name: '',
          displayName: '',
          description: '',
          permissions: []
        });
        fetchRolesAndPermissions(); // Refresh list
      } else {
        setError(data.message || 'Failed to add role.');
      }
    } catch (err) {
      console.error('Error adding role:', err);
      setError('Network error or failed to add role.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRoleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (editingRole) {
      setEditingRole({ ...editingRole, [e.target.name]: e.target.value });
    }
  };

  const handleEditPermissionChange = (permissionId: string, checked: boolean) => {
    if (!editingRole) return;

    if (checked) {
      setEditingRole({ 
        ...editingRole, 
        permissions: [...editingRole.permissions, permissions.find(p => p._id === permissionId)!]
      });
    } else {
      setEditingRole({ 
        ...editingRole, 
        permissions: editingRole.permissions.filter(p => p._id !== permissionId)
      });
    }
  };

  const handleUpdateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;

    setLoading(true);
    setError('');
    const token = localStorage.getItem('adminToken');

    try {
      const { authenticatedFetch } = await import('../utils/apiClient');
      const data = await authenticatedFetch<{ success: boolean; message?: string }>(`/admin/roles/${editingRole._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editingRole.name,
          displayName: editingRole.displayName,
          description: editingRole.description,
          permissions: editingRole.permissions.map(p => p._id),
        }),
      });

      if (data.success) {
        alert('Role updated successfully!');
        setEditingRole(null);
        fetchRolesAndPermissions(); // Refresh list
      } else {
        setError(data.message || 'Failed to update role.');
      }
    } catch (err: any) {
      console.error('Error updating role:', err);
      // Extract error message from the error object
      const errorMessage = err?.message || err?.toString() || 'Network error or failed to update role.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;

    setLoading(true);
    setError('');
    const token = localStorage.getItem('adminToken');

    try {
      const { authenticatedFetch } = await import('../utils/apiClient');
      const data = await authenticatedFetch<{ success: boolean; message?: string }>(`/admin/roles/${roleId}`, {
        method: 'DELETE'
      });

      if (data.success) {
        alert('Role deleted successfully!');
        fetchRolesAndPermissions(); // Refresh list
      } else {
        setError(data.message || 'Failed to delete role.');
      }
    } catch (err) {
      console.error('Error deleting role:', err);
      setError('Network error or failed to delete role.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading roles...</div>;
  }

  if (error) {
    return <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Role Management</h3>
        <button
          onClick={() => setShowAddRoleForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add New Role
        </button>
      </div>

      {showAddRoleForm && (
        <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-lg font-medium text-gray-800 mb-4">Add New Role</h4>
          <form onSubmit={handleAddRoleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Role Name (lowercase)</label>
                <input 
                  type="text" 
                  name="name" 
                  id="name" 
                  value={newRole.name} 
                  onChange={handleNewRoleChange} 
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., sales-manager"
                />
              </div>
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">Display Name</label>
                <input 
                  type="text" 
                  name="displayName" 
                  id="displayName" 
                  value={newRole.displayName} 
                  onChange={handleNewRoleChange} 
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., Sales Manager"
                />
              </div>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea 
                name="description" 
                id="description" 
                value={newRole.description} 
                onChange={handleNewRoleChange}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Describe the role's responsibilities..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3">
                {permissions.map(permission => (
                  <label key={permission._id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newRole.permissions.includes(permission._id)}
                      onChange={(e) => handlePermissionChange(permission._id, e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">
                      {permission.name}
                      <span className="text-xs text-gray-500 block">{permission.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button 
                type="button" 
                onClick={() => setShowAddRoleForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading ? 'Adding...' : 'Add Role'}
              </button>
            </div>
          </form>
        </div>
      )}

      {editingRole && (
        <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-yellow-50">
          <h4 className="text-lg font-medium text-gray-800 mb-4">Edit Role: {editingRole.displayName}</h4>
          <form onSubmit={handleUpdateRoleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="editName" className="block text-sm font-medium text-gray-700">Role Name (lowercase)</label>
                <input 
                  type="text" 
                  name="name" 
                  id="editName" 
                  value={editingRole.name} 
                  onChange={handleEditRoleChange} 
                  required
                  disabled={editingRole.isSystemRole}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed bg-gray-50"
                />
                {editingRole.isSystemRole && (
                  <p className="mt-1 text-xs text-amber-600">System role names cannot be changed</p>
                )}
              </div>
              <div>
                <label htmlFor="editDisplayName" className="block text-sm font-medium text-gray-700">Display Name</label>
                <input 
                  type="text" 
                  name="displayName" 
                  id="editDisplayName" 
                  value={editingRole.displayName} 
                  onChange={handleEditRoleChange} 
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="editDescription" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea 
                name="description" 
                id="editDescription" 
                value={editingRole.description} 
                onChange={handleEditRoleChange}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions
                {editingRole.isSystemRole && (
                  <span className="ml-2 text-xs text-amber-600 font-normal">
                    (System role - be careful when modifying permissions)
                  </span>
                )}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3">
                {permissions.map(permission => (
                  <label key={permission._id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editingRole.permissions.some(p => p._id === permission._id)}
                      onChange={(e) => handleEditPermissionChange(permission._id, e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">
                      {permission.name}
                      <span className="text-xs text-gray-500 block">{permission.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button 
                type="button" 
                onClick={() => setEditingRole(null)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading ? 'Updating...' : 'Update Role'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Roles List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.map((role) => (
              <tr key={role._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {role.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {role.displayName}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((permission) => (
                      <span key={permission._id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {permission.name}
                      </span>
                    ))}
                    {role.permissions.length > 3 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        +{role.permissions.length - 3} more
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(role.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => setEditingRole(role)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoleManagement;
