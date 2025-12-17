import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = React.useState<{ name: string; role: string } | null>(null);

  React.useEffect(() => {
    // Get user info from localStorage
    const adminToken = localStorage.getItem('adminToken');
    const userToken = localStorage.getItem('userToken');
    
    if (adminToken) {
      // Get admin user data
      const adminUserData = localStorage.getItem('adminUser');
      if (adminUserData) {
        try {
          const user = JSON.parse(adminUserData);
          const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Admin';
          const roleName = user.role?.displayName || user.role?.name || 'Owner';
          setUserInfo({ name: fullName, role: roleName });
        } catch (error) {
          setUserInfo({ name: 'Admin', role: 'Owner' });
        }
      } else {
        setUserInfo({ name: 'Admin', role: 'Owner' });
      }
    } else if (userToken) {
      // Get regular user data
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
          const roleName = user.role?.displayName || user.role?.name || 'User';
          setUserInfo({ name: fullName, role: roleName });
        } catch (error) {
          setUserInfo({ name: 'User', role: 'User' });
        }
      } else {
        setUserInfo({ name: 'User', role: 'User' });
      }
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return null;
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/src/assets/Logo2.png" 
              alt="AL HAMAD OIL FACTORY" 
              className="h-12 w-auto"
              onError={(e) => {
                // Fallback if image doesn't load
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* Center - Welcome Message */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
            <span className="text-gray-700 text-base">Welcome back,</span>
            {userInfo && (
              <>
                <span className="text-gray-900 font-semibold text-base">{userInfo.name}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-600 text-base">{userInfo.role}</span>
              </>
            )}
          </div>

          {/* Right Side - User Avatar and Logout */}
          {userInfo && (
            <div className="flex items-center space-x-3">
              {/* User Avatar with Initials */}
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {userInfo.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors shadow-sm"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
