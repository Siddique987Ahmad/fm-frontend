import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import UserLogin from "../pages/UserLogin";
import UserDashboard from "../pages/UserDashboard";
import Dashboard from "../pages/Dashboard";
import ExpenseManagement from "../pages/ExpenseManagement";
import ReportsDashboard from "../pages/ReportsDashboard";
import TransactionsPage from "../pages/TransactionsPage";
import AdvancePaymentsPage from "../pages/AdvancePaymentsPage";

const UserRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<UserLogin />} />
      <Route path="/dashboard" element={<UserDashboard />} />
      <Route path="/main-dashboard" element={<Dashboard />} />
      <Route path="/expenses" element={<ExpenseManagement />} />
      <Route path="/reports" element={<ReportsDashboard />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/advance-payments" element={<AdvancePaymentsPage />} />
      <Route path="/" element={<Navigate to="/user/login" replace />} />
    </Routes>
  );
};

export default UserRoutes;
