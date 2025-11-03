import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import UserLogin from '../pages/UserLogin';
import UserDashboard from '../pages/UserDashboard';
// Dashboard.tsx removed - regular users should only use UserDashboard
// Dashboard.tsx has product creation which should be admin-only
import ExpenseManagement from '../pages/ExpenseManagement';
import ReportsDashboard from '../pages/ReportsDashboard';
import TransactionsPage from '../pages/TransactionsPage';

const UserRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<UserLogin />} />
      <Route path="/dashboard" element={<UserDashboard />} />
      {/* Removed /main-dashboard route - regular users should only use UserDashboard */}
      <Route path="/expenses" element={<ExpenseManagement />} />
      <Route path="/reports" element={<ReportsDashboard />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/" element={<Navigate to="/user/login" replace />} />
    </Routes>
  );
};

export default UserRoutes;