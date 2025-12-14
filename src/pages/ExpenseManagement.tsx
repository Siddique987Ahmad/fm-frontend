import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";

// TypeScript interfaces
interface CategorySpecific {
  homeType?: string;
  employeeId?: string;
  employeeName?: string;
  employeeType?: string;
  employeeDepartment?: string;
  employeePosition?: string;
  salaryMonth?: string;
  advanceReason?: string;
  factoryType?: string;
  zakatType?: string;
  zakatYear?: number;
  personalType?: string;
}

interface Expense {
  _id: string;
  expenseCategory: "home" | "labour" | "factory" | "zakat" | "personal";
  title: string;
  description?: string;
  amount: number;
  amountPaid: number;
  paymentStatus: "paid" | "pending" | "advance";
  expenseDate: string;
  dueDate?: string;
  vendor?: string;
  notes?: string;
  categorySpecific: CategorySpecific;
  outstandingAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface ExpenseStats {
  category: string;
  totalAmount: number;
  totalPaid: number;
  count: number;
  pendingAmount: number;
  paymentPercentage: number;
}

interface FormData {
  title: string;
  description: string;
  amount: string;
  amountPaid: string;
  expenseDate: string;
  vendor: string;
  notes: string;
  categorySpecific: CategorySpecific;
}

interface FormField {
  key: string;
  label: string;
  type: "text" | "select" | "number" | "month" | "employee-select";
  options?: string[];
  required?: boolean;
  min?: number;
  max?: number;
}

interface ExpenseCategory {
  id: "home" | "labour" | "factory" | "zakat" | "personal";
  name: string;
  description: string;
  color: string;
  icon: React.ComponentType;
  fields: FormField[];
  showTitle?: boolean;
  showVendor?: boolean;
  showNotes?: boolean;
  showDescription?: boolean;
  showAmountPaid?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

interface ExpenseListResponse {
  expenses: Expense[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  summary: {
    totalAmount: number;
    totalPaid: number;
    totalOutstanding: number;
    paidCount: number;
    pendingCount: number;
    advanceCount: number;
  };
}

interface StatsResponse {
  summary: ExpenseStats[];
  totalExpenses: number;
  overdueExpenses: number;
  generatedAt: string;
}

// Icons as simple SVG components
const HomeIcon: React.FC = () => (
  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
  </svg>
);

const UserGroupIcon: React.FC = () => (
  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
  </svg>
);

const OfficeBuildingIcon: React.FC = () => (
  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
      clipRule="evenodd"
    />
  </svg>
);

const CurrencyDollarIcon: React.FC = () => (
  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
      clipRule="evenodd"
    />
  </svg>
);

const UserIcon: React.FC = () => (
  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
      clipRule="evenodd"
    />
  </svg>
);

const PlusIcon: React.FC = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4v16m8-8H4"
    />
  </svg>
);

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

const EyeIcon: React.FC = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const EditIcon: React.FC = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const LoadingSpinner: React.FC = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
);

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

const ExpenseManagement: React.FC = () => {
  const [selectedCategory, setSelectedCategory] =
    useState<ExpenseCategory | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [stats, setStats] = useState<Record<string, ExpenseStats>>({});
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [employees, setEmployees] = useState<
    Array<{
      _id: string;
      employeeId: string;
      firstName: string;
      lastName: string;
      department: string;
      position: string;
      employeeType: string;
    }>
  >([]);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  // New state for view/edit operations (removed delete functionality)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [actionMode, setActionMode] = useState<"add" | "view" | "edit">("add");

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    amount: "",
    amountPaid: "",
    expenseDate: new Date().toISOString().split("T")[0],
    vendor: "",
    notes: "",
    categorySpecific: {},
  });

  const navigate = useNavigate();

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      const userToken = localStorage.getItem("userToken");
      const adminToken = localStorage.getItem("adminToken");

      if (!userToken && !adminToken) {
        navigate("/login");
        return;
      }

      try {
        const { authenticatedFetch } = await import("../utils/apiClient");
        const result = await authenticatedFetch<{
          success: boolean;
          data?: any;
        }>(`/admin/auth/me`);

        if (!result?.success) {
          localStorage.removeItem("userToken");
          localStorage.removeItem("adminToken");
          localStorage.removeItem("userData");
          localStorage.removeItem("adminUser");
          navigate("/login");
          return;
        }
        localStorage.setItem("userData", JSON.stringify(result.data));
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("userToken");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("userData");
        localStorage.removeItem("adminUser");
        navigate("/login");
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Expense categories configuration
  const expenseCategories: ExpenseCategory[] = [
    {
      id: "home",
      name: "Home Expenses",
      description: "Household and domestic expenses",
      color: "bg-blue-500 hover:bg-blue-600",
      icon: HomeIcon,
      showTitle: false,
      showVendor: false,
      showNotes: false,
      showAmountPaid: false,
      fields: [
        {
          key: "homeType",
          label: "Expense Type",
          type: "select",
          options: [
            "groceries",
            "utilities",
            "maintenance",
            "furniture",
            "electronics",
            "other",
          ],
          required: true,
        },
      ],
    },
    {
      id: "labour",
      name: "Labour Expenses",
      description: "Employee salaries and advances",
      color: "bg-green-500 hover:bg-green-600",
      icon: UserGroupIcon,
      showTitle: true,
      showVendor: true,
      showNotes: true,
      showAmountPaid: false,
      fields: [
        {
          key: "employeeId",
          label: "Select Employee",
          type: "employee-select",
          required: true,
        },
        { key: "salaryMonth", label: "Salary Month (YYYY-MM)", type: "month" },
        { key: "advanceReason", label: "Advance Reason", type: "text" },
      ],
    },
    {
      id: "factory",
      name: "Factory Expenses",
      description: "Factory operations and maintenance",
      color: "bg-orange-500 hover:bg-orange-600",
      icon: OfficeBuildingIcon,
      showTitle: false,
      showVendor: false,
      showNotes: false,
      showAmountPaid: false,
      fields: [
        {
          key: "factoryType",
          label: "Expense Type",
          type: "select",
          options: [
            "rent",
            "electricity",
            "maintenance",
            "equipment",
            "raw-materials",
            "transportation",
            "chai",
            "other",
          ],
          required: true,
        },
      ],
    },
    {
      id: "zakat",
      name: "Zakat",
      description: "Zakat and charitable expenses",
      color: "bg-purple-500 hover:bg-purple-600",
      icon: CurrencyDollarIcon,
      showTitle: false,
      showVendor: false,
      showNotes: false,
      showDescription: false,
      showAmountPaid: false,
      fields: [],
    },
    {
      id: "personal",
      name: "Personal Expenses",
      description: "Personal and miscellaneous expenses",
      color: "bg-red-500 hover:bg-red-600",
      icon: UserIcon,
      showTitle: false,
      showVendor: false,
      showNotes: false,
      showAmountPaid: false,
      fields: [
        {
          key: "personalType",
          label: "Expense Type",
          type: "select",
          options: [
            "medical",
            "education",
            "transportation",
            "entertainment",
            "clothing",
            "other",
          ],
          required: true,
        },
      ],
    },
  ];

  // Fetch expense statistics and employees on component mount
  useEffect(() => {
    fetchExpenseStats();
    fetchEmployees();
  }, []);

  // Fetch category expenses when a category is selected
  useEffect(() => {
    if (selectedCategory && !showForm) {
      fetchCategoryExpenses(selectedCategory.id);
    }
  }, [selectedCategory, showForm]);

  const fetchExpenseStats = async (): Promise<void> => {
    try {
      const { authenticatedFetch } = await import("../utils/apiClient");
      const result = await authenticatedFetch<ApiResponse<StatsResponse>>(
        `/expenses/stats`
      );

      if (result.success && result.data) {
        const statsData: Record<string, ExpenseStats> = {};
        result.data.summary.forEach((stat) => {
          statsData[stat.category] = stat;
        });
        setStats(statsData);
      }
    } catch (error: any) {
      console.error("Error fetching expense stats:", error);
    }
  };

  const fetchEmployees = async (): Promise<void> => {
    try {
      const { authenticatedFetch } = await import("../utils/apiClient");
      const result = await authenticatedFetch<{ success: boolean; data?: any }>(
        `/admin/employees/for-expense`
      );

      if (result.success && result.data) {
        setEmployees(result.data);
      }
    } catch (error: any) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchCategoryExpenses = async (category: string): Promise<void> => {
    try {
      setLoading(true);
      const { authenticatedFetch } = await import("../utils/apiClient");
      const result = await authenticatedFetch<ApiResponse<ExpenseListResponse>>(
        `/expenses/category/${category}`
      );

      if (result.success && result.data) {
        setExpenses(result.data.expenses || []);
      }
    } catch (error: any) {
      console.error("Error fetching category expenses:", error);
      setError("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: ExpenseCategory): void => {
    setSelectedCategory(category);
    setShowForm(false);
    setError("");
    setSuccess("");
    resetFormData();
  };

  const handleAddExpense = (): void => {
    setActionMode("add");
    setSelectedExpense(null);
    setShowForm(true);
    setError("");
    setSuccess("");
    resetFormData();
  };

  // FIXED: Updated handleViewExpense to populate form data
  const handleViewExpense = (expense: Expense): void => {
    setSelectedExpense(expense);
    setActionMode("view");
    setShowForm(true);
    setError("");
    setSuccess("");

    // Populate form with existing data for viewing
    setFormData({
      title: expense.title || "",
      description: expense.description || "",
      amount: expense.amount.toString(),
      amountPaid: expense.amountPaid.toString(),
      expenseDate: expense.expenseDate
        ? expense.expenseDate.split("T")[0]
        : new Date().toISOString().split("T")[0],
      vendor: expense.vendor || "",
      notes: expense.notes || "",
      categorySpecific: expense.categorySpecific || {},
    });

    console.log("View expense called:", { expense, actionMode: "view" }); // Debug log
  };

  const handleEditExpense = (expense: Expense): void => {
    setSelectedExpense(expense);
    setActionMode("edit");
    setShowForm(true);
    setError("");
    setSuccess("");

    // Populate form with existing data
    setFormData({
      title: expense.title || "",
      description: expense.description || "",
      amount: expense.amount.toString(),
      amountPaid: expense.amountPaid.toString(),
      expenseDate: expense.expenseDate
        ? expense.expenseDate.split("T")[0]
        : new Date().toISOString().split("T")[0],
      vendor: expense.vendor || "",
      notes: expense.notes || "",
      categorySpecific: expense.categorySpecific || {},
    });
  };

  const handleDeleteExpense = async (expense: Expense): Promise<void> => {
    if (!expense || !expense._id) return;

    const ok = window.confirm(
      `Are you sure you want to delete the expense "${expense.title}"? This action cannot be undone.`
    );
    if (!ok) return;

    try {
      setError("");
      setSuccess("");
      setDeleteLoadingId(expense._id);

      const { authenticatedFetch } = await import("../utils/apiClient");
      const result = await authenticatedFetch<ApiResponse<null>>(
        `/expenses/${expense._id}`,
        {
          method: "DELETE",
        }
      );

      if (result && (result as any).success) {
        setSuccess("Expense deleted successfully");
        // Refresh stats and list
        await fetchExpenseStats();
        if (selectedCategory) {
          await fetchCategoryExpenses(selectedCategory.id);
        }
        // If currently viewing this expense, close the form
        if (selectedExpense && selectedExpense._id === expense._id) {
          setShowForm(false);
          setSelectedExpense(null);
          setActionMode("add");
        }
      } else {
        setError((result as any)?.message || "Failed to delete expense");
      }
    } catch (err: any) {
      console.error("Error deleting expense:", err);
      setError(err?.message || "Network error while deleting expense");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const resetFormData = (): void => {
    setFormData({
      title: "",
      description: "",
      amount: "",
      amountPaid: "",
      expenseDate: new Date().toISOString().split("T")[0],
      vendor: "",
      notes: "",
      categorySpecific: {},
    });
  };

  const handleInputChange = (field: string, value: string): void => {
    if (field.startsWith("categorySpecific.")) {
      const specificField = field.replace("categorySpecific.", "");
      setFormData((prev) => ({
        ...prev,
        categorySpecific: {
          ...prev.categorySpecific,
          [specificField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const validateForm = (): boolean => {
    const { title, amount } = formData;

    // Check if title is required for this category
    if (selectedCategory?.showTitle !== false && !title.trim()) {
      setError("Expense title is required");
      return false;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Valid expense amount is required");
      return false;
    }

    // Validate category-specific required fields
    if (selectedCategory && selectedCategory.fields) {
      for (const field of selectedCategory.fields) {
        if (
          field.required &&
          !formData.categorySpecific[field.key as keyof CategorySpecific]
        ) {
          setError(`${field.label} is required`);
          return false;
        }
      }
    }

    return true;
  };

  const handleFormSubmit = async (): Promise<void> => {
    setError("");
    setSuccess("");

    if (!validateForm() || !selectedCategory) {
      return;
    }

    setLoading(true);

    try {
      // Generate title if not shown in form
      let title = formData.title;
      if (selectedCategory.showTitle === false) {
        // Generate default title based on category
        switch (selectedCategory.id) {
          case "home":
            title = formData.categorySpecific.homeType
              ? `${formData.categorySpecific.homeType
                  .replace("-", " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())} Expense`
              : "Home Expense";
            break;
          case "factory":
            title = formData.categorySpecific.factoryType
              ? `${formData.categorySpecific.factoryType
                  .replace("-", " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())} Expense`
              : "Factory Expense";
            break;
          case "personal":
            title = formData.categorySpecific.personalType
              ? `${formData.categorySpecific.personalType
                  .replace("-", " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())} Expense`
              : "Personal Expense";
            break;
          case "zakat":
            title = `Zakat - ${new Date(formData.expenseDate).getFullYear()}`;
            break;
          default:
            title = `${selectedCategory.name}`;
        }
      }

      // Prepare category-specific data with defaults for Zakat and Labour
      let categorySpecificData = formData.categorySpecific;
      if (selectedCategory.id === "zakat") {
        categorySpecificData = {
          zakatType: "money", // Default zakat type
          zakatYear: new Date(formData.expenseDate).getFullYear(), // Auto-calculate year from date
        };
      } else if (
        selectedCategory.id === "labour" &&
        formData.categorySpecific.employeeId
      ) {
        // Find the selected employee and add their details
        const selectedEmployee = employees.find(
          (emp) => emp._id === formData.categorySpecific.employeeId
        );
        if (selectedEmployee) {
          categorySpecificData = {
            ...formData.categorySpecific,
            employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
            employeeType: selectedEmployee.employeeType,
            employeeDepartment: selectedEmployee.department,
            employeePosition: selectedEmployee.position,
          };
        }
      }

      const payload = {
        ...formData,
        title: title,
        amount: parseFloat(formData.amount),
        amountPaid: parseFloat(formData.amount), // Always fully paid - amount paid equals total amount
        expenseCategory: selectedCategory.id,
        categorySpecific: categorySpecificData,
        // Clear fields that shouldn't be sent for certain categories
        vendor:
          selectedCategory.showVendor === false ? undefined : formData.vendor,
        notes:
          selectedCategory.showNotes === false ? undefined : formData.notes,
        description:
          selectedCategory.showDescription === false
            ? undefined
            : formData.description,
      };

      const isEditing = actionMode === "edit" && selectedExpense;
      const endpoint = isEditing
        ? `/expenses/${selectedExpense!._id}`
        : `/expenses`;
      const method = isEditing ? "PUT" : "POST";

      // Use shared authenticatedFetch helper so the correct API base URL is used
      // and Authorization header is attached consistently (works both locally and in Vercel)
      const { authenticatedFetch } = await import("../utils/apiClient");
      const result: ApiResponse<{ expense: Expense }> =
        await authenticatedFetch(endpoint, {
          method,
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
          },
        });

      if (result.success) {
        setSuccess(
          `${selectedCategory.name} ${
            isEditing ? "updated" : "added"
          } successfully!`
        );

        // Refresh data
        await fetchExpenseStats();
        await fetchCategoryExpenses(selectedCategory.id);

        // Close form after 2 seconds
        setTimeout(() => {
          setShowForm(false);
          setActionMode("add");
          setSelectedExpense(null);
          setSuccess("");
        }, 2000);
      } else {
        setError(
          result.message ||
            `Failed to ${isEditing ? "update" : "create"} expense`
        );
        if (result.errors && result.errors.length > 0) {
          setError(result.errors.join(", "));
        }
      }
    } catch (error) {
      console.error(
        `Error ${actionMode === "edit" ? "updating" : "submitting"} form:`,
        error
      );
      setError("Network error. Please check if the server is running.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `PKR${amount.toLocaleString()}`;
  };

  const getPaymentStatusColor = (status: string): string => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "advance":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleBackToDashboard = (): void => {
    window.location.href = "/user/main-dashboard";
  };

  const handleBackToCategories = (): void => {
    if (showForm) {
      // If we're in a form, go back to the category expense list
      setShowForm(false);
      setActionMode("add");
      setSelectedExpense(null);
      setError("");
      setSuccess("");
    } else {
      // If we're in the category list, go back to main categories
      setSelectedCategory(null);
      setShowForm(false);
      setError("");
      setSuccess("");
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Expense Management...</p>
        </div>
      </div>
    );
  }

  // Main expense categories view
  if (!selectedCategory) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToDashboard}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeftIcon />
                <span>Back to Dashboard</span>
              </button>
              <h1 className="text-3xl font-bold text-gray-800">
                Expense Management
              </h1>
            </div>
          </div>

          {/* Overview Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">
                Total Expenses
              </h3>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(stats).reduce(
                  (sum, stat) => sum + (stat.count || 0),
                  0
                )}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">
                Total Amount
              </h3>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(
                  Object.values(stats).reduce(
                    (sum, stat) => sum + (stat.totalAmount || 0),
                    0
                  )
                )}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">
                Pending Amount
              </h3>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(
                  Object.values(stats).reduce(
                    (sum, stat) => sum + (stat.pendingAmount || 0),
                    0
                  )
                )}
              </p>
            </div>
          </div>

          {/* Expense Categories */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {expenseCategories.map((category) => {
              const categoryStats = stats[category.id] || ({} as ExpenseStats);
              const IconComponent = category.icon;

              return (
                <div
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  className={`${category.color} rounded-lg shadow-lg p-6 text-white cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">
                        {category.name}
                      </h3>
                      <p className="text-white/80 text-sm">
                        {category.description}
                      </p>
                    </div>
                    <IconComponent />
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="flex justify-between text-sm">
                      <span>Count: {categoryStats.count || 0}</span>
                      <span>
                        Amount: {formatCurrency(categoryStats.totalAmount || 0)}
                      </span>
                    </div>
                    {(categoryStats.pendingAmount || 0) > 0 && (
                      <div className="text-sm mt-1 text-white/90">
                        Pending: {formatCurrency(categoryStats.pendingAmount)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Category detail view or form
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToCategories}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeftIcon />
              <span>
                {showForm
                  ? `Back to ${selectedCategory.name}`
                  : "Back to Categories"}
              </span>
            </button>
            <h1 className="text-3xl font-bold text-gray-800">
              {selectedCategory.name}
            </h1>
          </div>

          {!showForm && (
            <button
              onClick={handleAddExpense}
              className={`${selectedCategory.color} text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2`}
            >
              <PlusIcon />
              <span>Add Expense</span>
            </button>
          )}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {showForm ? (
          // Expense Form
          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* FIXED: Dynamic form title based on action mode */}
            <h2 className="text-2xl font-semibold mb-6">
              {actionMode === "view"
                ? "View"
                : actionMode === "edit"
                ? "Edit"
                : "Add New"}{" "}
              {selectedCategory.name}
            </h2>

            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Expense Title - Only for Labour */}
                {selectedCategory.showTitle !== false && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expense Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter expense title"
                      disabled={loading || actionMode === "view"}
                      readOnly={actionMode === "view"}
                    />
                  </div>
                )}

                {/* Amount - Always Required */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedCategory.id === "zakat"
                      ? "Zakat Amount *"
                      : "Total Amount *"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      handleInputChange("amount", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      selectedCategory.id === "zakat"
                        ? "Enter zakat amount"
                        : "Enter total amount"
                    }
                    disabled={loading || actionMode === "view"}
                    readOnly={actionMode === "view"}
                  />
                </div>

                {/* Expense Date - Always shown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedCategory.id === "zakat"
                      ? "Zakat Date"
                      : "Expense Date"}
                  </label>
                  <input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) =>
                      handleInputChange("expenseDate", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading || actionMode === "view"}
                    readOnly={actionMode === "view"}
                  />
                </div>

                {/* Vendor/Supplier - Only for Labour */}
                {selectedCategory.showVendor !== false && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor/Supplier
                    </label>
                    <input
                      type="text"
                      value={formData.vendor}
                      onChange={(e) =>
                        handleInputChange("vendor", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Vendor or supplier name"
                      disabled={loading || actionMode === "view"}
                      readOnly={actionMode === "view"}
                    />
                  </div>
                )}

                {/* Category-specific fields */}
                {selectedCategory.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label} {field.required && "*"}
                    </label>
                    {field.type === "employee-select" ? (
                      <select
                        value={
                          formData.categorySpecific[
                            field.key as keyof CategorySpecific
                          ] || ""
                        }
                        onChange={(e) =>
                          handleInputChange(
                            `categorySpecific.${field.key}`,
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading || actionMode === "view"}
                      >
                        <option value="">Select Employee</option>
                        {employees.map((employee) => (
                          <option key={employee._id} value={employee._id}>
                            {employee.firstName} {employee.lastName} (
                            {employee.employeeId}) - {employee.department}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "select" ? (
                      <select
                        value={
                          formData.categorySpecific[
                            field.key as keyof CategorySpecific
                          ] || ""
                        }
                        onChange={(e) =>
                          handleInputChange(
                            `categorySpecific.${field.key}`,
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading || actionMode === "view"}
                      >
                        <option value="">Select {field.label}</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option}>
                            {option
                              .replace("-", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={
                          formData.categorySpecific[
                            field.key as keyof CategorySpecific
                          ] || ""
                        }
                        onChange={(e) =>
                          handleInputChange(
                            `categorySpecific.${field.key}`,
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        min={field.min}
                        max={field.max}
                        disabled={loading || actionMode === "view"}
                        readOnly={actionMode === "view"}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Description - Optional for Home, Factory, Personal; Required for Labour; Hidden for Zakat */}
              {selectedCategory.showDescription !== false && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description{" "}
                    {selectedCategory.id === "labour" ? "" : "(Optional)"}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      selectedCategory.id === "home"
                        ? "Optional description of home expense"
                        : selectedCategory.id === "factory"
                        ? "Optional description of factory expense"
                        : selectedCategory.id === "personal"
                        ? "Optional description of personal expense"
                        : "Expense description"
                    }
                    disabled={loading || actionMode === "view"}
                    readOnly={actionMode === "view"}
                  />
                </div>
              )}

              {/* Notes - Only for Labour */}
              {selectedCategory.showNotes !== false && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes"
                    disabled={loading || actionMode === "view"}
                    readOnly={actionMode === "view"}
                  />
                </div>
              )}

              {/* FIXED: Form Buttons - Different for each mode */}
              <div className="flex space-x-4 mt-6">
                {actionMode === "view" ? (
                  // View mode buttons
                  <>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setActionMode("add");
                        setSelectedExpense(null);
                      }}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() =>
                        selectedExpense && handleDeleteExpense(selectedExpense)
                      }
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                      disabled={deleteLoadingId === selectedExpense?._id}
                    >
                      {deleteLoadingId === selectedExpense?._id ? (
                        <LoadingSpinner />
                      ) : (
                        "Delete Expense"
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (selectedExpense) {
                          handleEditExpense(selectedExpense);
                        }
                      }}
                      className={`flex-1 ${selectedCategory.color} text-white font-semibold py-2 px-4 rounded-lg transition-colors`}
                    >
                      Edit Expense
                    </button>
                  </>
                ) : (
                  // Add/Edit mode buttons
                  <>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setActionMode("add");
                        setSelectedExpense(null);
                      }}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleFormSubmit}
                      className={`flex-1 ${selectedCategory.color} text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2`}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner />
                          <span>
                            {actionMode === "edit"
                              ? "Updating..."
                              : "Adding..."}
                          </span>
                        </>
                      ) : (
                        <span>
                          {actionMode === "edit"
                            ? "Update Expense"
                            : "Add Expense"}
                        </span>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Expense List
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                Recent {selectedCategory.name}
              </h2>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <LoadingSpinner />
                <p className="mt-2 text-gray-600">Loading expenses...</p>
              </div>
            ) : expenses.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No expenses found for this category.</p>
                <button
                  onClick={handleAddExpense}
                  className={`mt-4 ${selectedCategory.color} text-white px-4 py-2 rounded-lg`}
                >
                  Add First Expense
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {selectedCategory.id === "labour"
                          ? "Employee"
                          : "Title"}
                      </th>
                      {selectedCategory.id === "labour" && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Salary Month
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Outstanding
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expenses.map((expense) => (
                      <tr key={expense._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {selectedCategory.id === "labour"
                                ? expense.categorySpecific?.employeeName ||
                                  expense.title
                                : expense.title}
                            </div>
                            {expense.description && (
                              <div className="text-sm text-gray-500">
                                {expense.description}
                              </div>
                            )}
                          </div>
                        </td>
                        {selectedCategory.id === "labour" && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {expense.categorySpecific?.salaryMonth || "-"}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(
                              expense.paymentStatus
                            )}`}
                          >
                            {expense.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(expense.expenseDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {expense.outstandingAmount > 0
                            ? formatCurrency(expense.outstandingAmount)
                            : "Paid"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewExpense(expense)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                              title="View Details"
                            >
                              <EyeIcon />
                            </button>
                            <button
                              onClick={() => handleEditExpense(expense)}
                              className="text-green-600 hover:text-green-900 p-1 rounded transition-colors"
                              title="Edit Expense"
                            >
                              <EditIcon />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense)}
                              className="text-red-600 hover:text-red-900 p-1 rounded transition-colors flex items-center"
                              title="Delete Expense"
                              disabled={deleteLoadingId === expense._id}
                            >
                              {deleteLoadingId === expense._id ? (
                                <LoadingSpinner />
                              ) : (
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4l1 2H9l1-2z"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
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
  );
};

export default ExpenseManagement;
