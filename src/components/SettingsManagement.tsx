import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Bell, 
  Shield, 
  Database, 
  Globe, 
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface SystemSettings {
  general: {
    companyName: string;
    companyEmail: string;
    companyPhone: string;
    companyAddress: string;
    timezone: string;
    currency: string;
    dateFormat: string;
    language: string;
  };
  security: {
    sessionTimeout: number;
    passwordMinLength: number;
    requireTwoFactor: boolean;
    allowPasswordReset: boolean;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    salesAlerts: boolean;
    purchaseAlerts: boolean;
    expenseAlerts: boolean;
    userRegistrationAlerts: boolean;
    systemMaintenanceAlerts: boolean;
  };
  database: {
    backupFrequency: string;
    backupRetention: number;
    autoBackup: boolean;
    compressionEnabled: boolean;
  };
  appearance: {
    theme: string;
    sidebarCollapsed: boolean;
    showNotifications: boolean;
    itemsPerPage: number;
  };
}

const SettingsManagement: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    general: {
      companyName: 'Factory Management System',
      companyEmail: 'admin@factory.com',
      companyPhone: '+92 9876543210',
      companyAddress: '123 Industrial Area, Karachi, Sindh 400001',
      timezone: 'Asia/Karachi',
      currency: 'PKR',
      dateFormat: 'DD/MM/YYYY',
      language: 'en'
    },
    security: {
      sessionTimeout: 30,
      passwordMinLength: 8,
      requireTwoFactor: false,
      allowPasswordReset: true,
      maxLoginAttempts: 5,
      lockoutDuration: 15
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      salesAlerts: true,
      purchaseAlerts: true,
      expenseAlerts: true,
      userRegistrationAlerts: true,
      systemMaintenanceAlerts: true
    },
    database: {
      backupFrequency: 'daily',
      backupRetention: 30,
      autoBackup: true,
      compressionEnabled: true
    },
    appearance: {
      theme: 'light',
      sidebarCollapsed: false,
      showNotifications: true,
      itemsPerPage: 10
    }
  });

  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'database' | 'appearance'>('general');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { authenticatedFetch } = await import('../utils/apiClient');
      const result = await authenticatedFetch<{ success: boolean; data?: SystemSettings }>('/admin/settings');
      if (result.success && result.data) {
        setSettings(result.data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { authenticatedFetch } = await import('../utils/apiClient');
      const result = await authenticatedFetch<{ success: boolean }>('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });

      if (result.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (category: keyof SystemSettings, field: string, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'appearance', label: 'Appearance', icon: Globe }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure system preferences and settings</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadSettings}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Reset</span>
          </button>
          <button
            onClick={saveSettings}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            <span>{loading ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          Settings saved successfully!
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Settings Tabs */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-8">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as 'general' | 'security' | 'notifications' | 'database' | 'appearance')}
                className={`flex items-center space-x-2 py-2 px-3 rounded-lg transition-colors ${
                  activeTab === id
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
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={settings.general.companyName}
                    onChange={(e) => handleSettingChange('general', 'companyName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Email</label>
                  <input
                    type="email"
                    value={settings.general.companyEmail}
                    onChange={(e) => handleSettingChange('general', 'companyEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Phone</label>
                  <input
                    type="tel"
                    value={settings.general.companyPhone}
                    onChange={(e) => handleSettingChange('general', 'companyPhone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <select
                    value={settings.general.currency}
                    onChange={(e) => handleSettingChange('general', 'currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PKR">Pakistani Rupee (PKR)</option>
                    <option value="USD">US Dollar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="GBP">British Pound (GBP)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select
                    value={settings.general.timezone}
                    onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                  <select
                    value={settings.general.dateFormat}
                    onChange={(e) => handleSettingChange('general', 'dateFormat', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Address</label>
                <textarea
                  value={settings.general.companyAddress}
                  onChange={(e) => handleSettingChange('general', 'companyAddress', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                    min="5"
                    max="480"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password Minimum Length</label>
                  <input
                    type="number"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
                    min="6"
                    max="32"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
                  <input
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                    min="3"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lockout Duration (minutes)</label>
                  <input
                    type="number"
                    value={settings.security.lockoutDuration}
                    onChange={(e) => handleSettingChange('security', 'lockoutDuration', parseInt(e.target.value))}
                    min="5"
                    max="60"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requireTwoFactor"
                    checked={settings.security.requireTwoFactor}
                    onChange={(e) => handleSettingChange('security', 'requireTwoFactor', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requireTwoFactor" className="ml-2 text-sm text-gray-700">
                    Require Two-Factor Authentication
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allowPasswordReset"
                    checked={settings.security.allowPasswordReset}
                    onChange={(e) => handleSettingChange('security', 'allowPasswordReset', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="allowPasswordReset" className="ml-2 text-sm text-gray-700">
                    Allow Password Reset
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-500">Send notifications via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                    <p className="text-sm text-gray-500">Send notifications via SMS</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.smsNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'smsNotifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Push Notifications</h4>
                    <p className="text-sm text-gray-500">Send browser push notifications</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.pushNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Sales Alerts</h4>
                    <p className="text-sm text-gray-500">Get notified about new sales</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.salesAlerts}
                    onChange={(e) => handleSettingChange('notifications', 'salesAlerts', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Purchase Alerts</h4>
                    <p className="text-sm text-gray-500">Get notified about new purchases</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.purchaseAlerts}
                    onChange={(e) => handleSettingChange('notifications', 'purchaseAlerts', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Expense Alerts</h4>
                    <p className="text-sm text-gray-500">Get notified about new expenses</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.expenseAlerts}
                    onChange={(e) => handleSettingChange('notifications', 'expenseAlerts', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">User Registration Alerts</h4>
                    <p className="text-sm text-gray-500">Get notified about new user registrations</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.userRegistrationAlerts}
                    onChange={(e) => handleSettingChange('notifications', 'userRegistrationAlerts', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">System Maintenance Alerts</h4>
                    <p className="text-sm text-gray-500">Get notified about system maintenance</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.systemMaintenanceAlerts}
                    onChange={(e) => handleSettingChange('notifications', 'systemMaintenanceAlerts', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Database Settings */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                  <select
                    value={settings.database.backupFrequency}
                    onChange={(e) => handleSettingChange('database', 'backupFrequency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Backup Retention (days)</label>
                  <input
                    type="number"
                    value={settings.database.backupRetention}
                    onChange={(e) => handleSettingChange('database', 'backupRetention', parseInt(e.target.value))}
                    min="7"
                    max="365"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoBackup"
                    checked={settings.database.autoBackup}
                    onChange={(e) => handleSettingChange('database', 'autoBackup', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="autoBackup" className="ml-2 text-sm text-gray-700">
                    Enable Automatic Backups
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="compressionEnabled"
                    checked={settings.database.compressionEnabled}
                    onChange={(e) => handleSettingChange('database', 'compressionEnabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="compressionEnabled" className="ml-2 text-sm text-gray-700">
                    Enable Backup Compression
                  </label>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <Info className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">Database Backup Information</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Automatic backups help protect your data. Backups are stored securely and can be restored if needed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Appearance Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                  <select
                    value={settings.appearance.theme}
                    onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Items Per Page</label>
                  <select
                    value={settings.appearance.itemsPerPage}
                    onChange={(e) => handleSettingChange('appearance', 'itemsPerPage', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sidebarCollapsed"
                    checked={settings.appearance.sidebarCollapsed}
                    onChange={(e) => handleSettingChange('appearance', 'sidebarCollapsed', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sidebarCollapsed" className="ml-2 text-sm text-gray-700">
                    Collapse Sidebar by Default
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showNotifications"
                    checked={settings.appearance.showNotifications}
                    onChange={(e) => handleSettingChange('appearance', 'showNotifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showNotifications" className="ml-2 text-sm text-gray-700">
                    Show Notification Badges
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsManagement;
