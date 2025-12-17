import React from 'react';
import { useLocation } from 'react-router-dom';

const Footer: React.FC = () => {
  const location = useLocation();
  const currentYear = new Date().getFullYear();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return null;
  }

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Company Info */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded">
              <span className="text-white font-bold text-xs">AH</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700">
                AL HAMAD OIL FACTORY
              </p>
              <p className="text-xs text-gray-500">
                Factory Management System
              </p>
            </div>
          </div>

          {/* Center Section - Copyright */}
          <div className="text-center">
            <p className="text-xs text-gray-600">
              © {currentYear} <span className="font-medium">AL HAMAD OIL FACTORY</span>. All rights reserved.
            </p>
            <p className="text-xs text-gray-500">
              Developed by <span className="font-medium text-blue-600">Faizan Ahmad Khan</span> - v4.0.6
            </p>
          </div>

          {/* Right Section - Links */}
          <div className="flex items-center space-x-3 text-xs">
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
              Privacy Policy
            </a>
            <span className="text-gray-400">|</span>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
              Terms of Service
            </a>
            <span className="text-gray-400">|</span>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
