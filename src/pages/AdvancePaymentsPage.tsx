import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getApiUrl } from "../utils/api";
import { fetchProductTypes, type ProductType } from "../utils/productTypes";

// Types
interface Transaction {
  _id: string;
  transactionType: "sale" | "purchase";
  clientName: string;
  weight: number;
  weightUnit: string;
  rate: number;
  rateUnit: string;
  remainingAmount: number;
  totalBalance: number;
  paymentStatus: "pending" | "full" | "advance" | "overpaid";
  advanceAmount: number;
  netAdvance?: number; // Net advance calculated by backend
  status: "pending" | "completed" | "cancelled";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Filters {
  transactionType: string;
  clientName: string;
}

interface Summary {
  totalSalesAdvances: number;
  totalPurchasesAdvances: number;
  totalOutstanding: number;
  salesCount: number;
  purchasesCount: number;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// Icons
const ArrowLeftIcon: React.FC = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 19l-7-7m0 0l7-7m-7 7h18"
    />
  </svg>
);

const SearchIcon: React.FC = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const AdvancePaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductType[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(
    null
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalSalesAdvances: 0,
    totalPurchasesAdvances: 0,
    totalOutstanding: 0,
    salesCount: 0,
    purchasesCount: 0,
  });
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 50,
  });
  const [filters, setFilters] = useState<Filters>({
    transactionType: "all",
    clientName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch product types on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productTypes = await fetchProductTypes();
        setProducts(productTypes);
        if (productTypes.length > 0) {
          setSelectedProduct(productTypes[0]);
        }
      } catch (err) {
        setError("Failed to load product types");
        console.error(err);
      }
    };
    loadProducts();
  }, []);

  // Fetch advance payments when product or filters change
  useEffect(() => {
    if (selectedProduct) {
      fetchAdvancePayments();
    }
  }, [selectedProduct, filters, pagination.currentPage]);

  const fetchAdvancePayments = async () => {
    if (!selectedProduct) return;

    setLoading(true);
    setError(null);

    try {
      const apiUrl = getApiUrl();
      const token = localStorage.getItem("userToken");

      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.itemsPerPage.toString(),
      });

      if (filters.transactionType !== "all") {
        params.append("transactionType", filters.transactionType);
      }

      if (filters.clientName.trim()) {
        params.append("clientName", filters.clientName.trim());
      }

      const response = await fetch(
        `${apiUrl}/products/${selectedProduct.value}/advances?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch advance payments");
      }

      const data = await response.json();

      if (data.success) {
        setTransactions(data.data.transactions);
        setSummary(data.data.summary);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.message || "Failed to fetch advance payments");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      console.error("Error fetching advance payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to first page
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  const formatCurrency = (amount: number) => {
    return `PKR ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getAdvanceAmount = (transaction: Transaction) => {
    // Debug: Log transaction data to see if netAdvance is present
    console.log(
      `[AdvancePayments] Transaction for ${transaction.clientName}:`,
      {
        netAdvance: transaction.netAdvance,
        remaining: transaction.remainingAmount,
        total: transaction.totalBalance,
        calculated: transaction.remainingAmount - transaction.totalBalance,
      }
    );

    // Use netAdvance from backend if available (accounts for offsetting transactions)
    // Otherwise calculate from individual transaction
    return transaction.netAdvance !== undefined
      ? transaction.netAdvance
      : transaction.remainingAmount - transaction.totalBalance;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/user/main-dashboard")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeftIcon />
          <span className="ml-2">Back to Dashboard</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Advance Payments</h1>
        <p className="text-gray-600 mt-2">
          Track partial payments for sales and purchases
        </p>
      </div>

      {/* Product Selector */}
      {!selectedProduct && products.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Select a Product</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <h3 className="font-semibold text-lg">{product.name}</h3>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      {selectedProduct && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Transaction Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type
                </label>
                <select
                  value={filters.transactionType}
                  onChange={(e) =>
                    handleFilterChange("transactionType", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All</option>
                  <option value="sale">Sales</option>
                  <option value="purchase">Purchases</option>
                </select>
              </div>

              {/* Client Name Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client/Supplier Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.clientName}
                    onChange={(e) =>
                      handleFilterChange("clientName", e.target.value)
                    }
                    placeholder="Search by name..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <SearchIcon />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
              <h3 className="text-sm font-medium opacity-90">Sales Advances</h3>
              <p className="text-3xl font-bold mt-2">
                {formatCurrency(summary.totalSalesAdvances)}
              </p>
              <p className="text-sm opacity-75 mt-1">
                {summary.salesCount} transactions
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
              <h3 className="text-sm font-medium opacity-90">
                Purchase Advances
              </h3>
              <p className="text-3xl font-bold mt-2">
                {formatCurrency(summary.totalPurchasesAdvances)}
              </p>
              <p className="text-sm opacity-75 mt-1">
                {summary.purchasesCount} transactions
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
              <h3 className="text-sm font-medium opacity-90">
                Total Advance Amount
              </h3>
              <p className="text-3xl font-bold mt-2">
                {formatCurrency(summary.totalOutstanding)}
              </p>
              <p className="text-sm opacity-75 mt-1">Total excess payments</p>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12 text-red-600">
                  <p>{error}</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No advance payments found</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client/Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Weight
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount Paid
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Advance Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {transaction.clientName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              transaction.transactionType === "sale"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {transaction.transactionType === "sale"
                              ? "Sale"
                              : "Purchase"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.weight} {transaction.weightUnit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(transaction.totalBalance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(transaction.remainingAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          {formatCurrency(getAdvanceAmount(transaction))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {!loading && transactions.length > 0 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page{" "}
                      <span className="font-medium">
                        {pagination.currentPage}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium">
                        {pagination.totalPages}
                      </span>{" "}
                      ({pagination.totalItems} total)
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() =>
                          handlePageChange(pagination.currentPage - 1)
                        }
                        disabled={pagination.currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          handlePageChange(pagination.currentPage + 1)
                        }
                        disabled={
                          pagination.currentPage === pagination.totalPages
                        }
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdvancePaymentsPage;
