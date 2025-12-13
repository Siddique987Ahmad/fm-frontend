import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProductTypes, type ProductType } from "../utils/productTypes";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: {
    name: string;
    displayName: string;
  };
  employeeId?: string;
  department?: string;
  position?: string;
  isActive: boolean;
}

interface DashboardStats {
  totalTransactions: number;
  salesCount: number;
  purchaseCount: number;
  totalValue: number;
}

const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [stats, setStats] = useState<DashboardStats>({
    totalTransactions: 0,
    salesCount: 0,
    purchaseCount: 0,
    totalValue: 0,
  });
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  const API_BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

  useEffect(() => {
    const storedUser = localStorage.getItem("userData");
    const token = localStorage.getItem("userToken");

    if (!token || !storedUser) {
      navigate("/login");
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
      fetchUserData(token);
      fetchStats();
      fetchProductTypesData();
    } catch (e) {
      console.error("Failed to parse user data from localStorage", e);
      navigate("/login");
    }
  }, [navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProductTypesData = async () => {
    try {
      const types = await fetchProductTypes();
      setProductTypes(types);
    } catch (error) {
      console.error("Error fetching product types:", error);
    }
  };

  const fetchUserData = async (token: string) => {
    try {
      // Get API URL - handle relative paths
      const apiUrl =
        API_BASE_URL && !API_BASE_URL.startsWith("/")
          ? API_BASE_URL
          : "https://fm-backend-six.vercel.app/api";

      const response = await fetch(`${apiUrl}/admin/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setError(`HTTP ${response.status}: ${response.statusText}`);
        navigate("/login");
        return;
      }

      // Check content type before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error(
          "Non-JSON response from auth/me:",
          text.substring(0, 100)
        );
        setError("Invalid response format from server");
        navigate("/login");
        return;
      }

      const data = await response.json();
      if (data.success) {
        setUser(data.data);
      } else {
        setError(data.message || "Failed to fetch user data.");
        navigate("/login");
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Network error or failed to connect to server.");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (): Promise<void> => {
    try {
      // Use dynamic product types if available, otherwise fallback to static ones
      const typesToFetch =
        productTypes.length > 0
          ? productTypes.map((pt) => pt.value)
          : [
              "white-oil",
              "yellow-oil",
              "crude-oil",
              "diesel",
              "petrol",
              "kerosene",
            ];

      let totalTransactions = 0;
      let totalSales = 0;
      let totalPurchases = 0;
      let totalSalesAmount = 0;
      let totalPurchasesAmount = 0;

      // Get API URL - handle relative paths
      const apiUrl =
        API_BASE_URL && !API_BASE_URL.startsWith("/")
          ? API_BASE_URL
          : "https://fm-backend-six.vercel.app/api";

      // Fetch stats for each product type
      const { authenticatedFetch } = await import("../utils/apiClient");
      for (const productType of typesToFetch) {
        try {
          const result = await authenticatedFetch<{
            success: boolean;
            data?: any;
          }>(`/products/${productType}/stats`);

          if (result.success && result.data) {
            totalTransactions += result.data.totalTransactions || 0;
            totalSales += result.data.totalSales || 0;
            totalPurchases += result.data.totalPurchases || 0;
            totalSalesAmount += result.data.totalSalesAmount || 0;
            totalPurchasesAmount += result.data.totalPurchasesAmount || 0;
          }
        } catch (error) {
          console.error(`Error fetching stats for ${productType}:`, error);
          // Continue to next product type
        }
      }

      // Update stats with combined data
      setStats({
        totalTransactions,
        salesCount: totalSales,
        purchaseCount: totalPurchases,
        totalValue: totalSalesAmount + totalPurchasesAmount,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userData");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">
          Loading Dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <button
            onClick={() => navigate("/login")}
            className="ml-4 text-blue-700 hover:underline"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">
            Factory Management
          </h1>
          <p className="text-sm text-gray-600">{user.role.displayName}</p>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full text-left py-3 px-4 rounded-lg transition-colors duration-200 ${
              activeTab === "dashboard"
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5a2 2 0 012-2h4a2 2 0 012 2v4H8V5z"
                />
              </svg>
              Dashboard
            </div>
          </button>

          <button
            onClick={() => setActiveTab("transactions")}
            className={`w-full text-left py-3 px-4 rounded-lg transition-colors duration-200 ${
              activeTab === "transactions"
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Transactions
            </div>
          </button>

          <button
            onClick={() => setActiveTab("expenses")}
            className={`w-full text-left py-3 px-4 rounded-lg transition-colors duration-200 ${
              activeTab === "expenses"
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
              Expenses
            </div>
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`w-full text-left py-3 px-4 rounded-lg transition-colors duration-200 ${
              activeTab === "reports"
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Reports
            </div>
          </button>
        </nav>

        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user.firstName.charAt(0)}
              {user.lastName.charAt(0)}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500">{user.department}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            {activeTab === "dashboard" && "Dashboard Overview"}
            {activeTab === "transactions" && "Transaction Management"}
            {activeTab === "expenses" && "Expense Management"}
            {activeTab === "reports" && "Reports & Analytics"}
          </h2>
          <p className="text-gray-600 mt-2">
            Welcome back, {user.firstName}! Here's what's happening today.
          </p>
        </header>

        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Transactions
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.totalTransactions}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 11l5-5m0 0l5 5m-5-5v12"
                        />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Sales
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.salesCount}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 13l-5 5m0 0l-5-5m5 5V6"
                        />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Purchases
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.purchaseCount}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Value
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          PKR{stats.totalValue.toLocaleString()}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab("transactions")}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg
                    className="w-8 h-8 text-blue-600 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">New Transaction</p>
                    <p className="text-sm text-gray-500">
                      Record sale or purchase
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("expenses")}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg
                    className="w-8 h-8 text-green-600 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Add Expense</p>
                    <p className="text-sm text-gray-500">
                      Record business expense
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("reports")}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg
                    className="w-8 h-8 text-purple-600 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">View Reports</p>
                    <p className="text-sm text-gray-500">
                      Analytics & insights
                    </p>
                  </div>
                </button>

                <div className="flex items-center p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <svg
                    className="w-8 h-8 text-gray-400 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <div className="text-left">
                    <p className="font-medium text-gray-500">Profile</p>
                    <p className="text-sm text-gray-400">Coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Transaction Management
            </h3>
            <p className="text-gray-600">
              Transaction management features will be available here.
            </p>
            <div className="mt-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                Add New Transaction
              </button>
            </div>
          </div>
        )}

        {activeTab === "expenses" && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Expense Management
            </h3>
            <p className="text-gray-600">
              Expense management features will be available here.
            </p>
            <div className="mt-4">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                Add New Expense
              </button>
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Reports & Analytics
            </h3>
            <p className="text-gray-600">
              Reporting features will be available here.
            </p>
            <div className="mt-4">
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">
                Generate Report
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserDashboard;
