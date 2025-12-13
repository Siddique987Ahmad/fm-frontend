import React, { useState, useEffect } from "react";
import { getApiUrl } from "../utils/apiClient";

interface ProductCatalogItem {
  _id: string;
  name: string;
  description: string;
  unit: string;
  pricePerUnit: number;
  allowedTransactions: ("sale" | "purchase")[];
  enableNugCalculation?: boolean;
  createdAt: string;
}

const API_BASE_URL = `${import.meta.env.VITE_API_URL ?? "/api"}/admin`;

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [showAddProductForm, setShowAddProductForm] = useState<boolean>(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    unit: "",
    pricePerUnit: 0,
    allowedTransactions: ["sale", "purchase"] as ("sale" | "purchase")[],
    enableNugCalculation: false,
  });
  const [editingProduct, setEditingProduct] =
    useState<ProductCatalogItem | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const { authenticatedFetch } = await import("../utils/apiClient");
      const result = await authenticatedFetch<{
        success: boolean;
        data?: ProductCatalogItem[];
        message?: string;
      }>("/admin/products");

      if (result.success && result.data) {
        setProducts(result.data);
      } else {
        setError(result.message || "Failed to fetch products.");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Network error or failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewProductChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name]: name === "pricePerUnit" ? parseFloat(value) || 0 : value,
    });
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const token = localStorage.getItem("adminToken");

    // Validate that at least one transaction type is selected
    if (newProduct.allowedTransactions.length === 0) {
      setError(
        "Please select at least one transaction type (Sale or Purchase)"
      );
      setLoading(false);
      return;
    }

    try {
      console.log("Creating product with data:", newProduct);
      const { authenticatedFetch } = await import("../utils/apiClient");
      const data = await authenticatedFetch<{
        success: boolean;
        message?: string;
      }>("/admin/products", {
        method: "POST",
        body: JSON.stringify(newProduct),
      });

      if (data.success) {
        alert("Product added successfully!");
        setShowAddProductForm(false);
        setNewProduct({
          name: "",
          description: "",
          unit: "",
          pricePerUnit: 0,
          allowedTransactions: ["sale", "purchase"],
          enableNugCalculation: false,
        });
        fetchProducts(); // Refresh list
      } else {
        setError(data.message || "Failed to add product.");
      }
    } catch (err) {
      console.error("Error adding product:", err);
      setError("Network error or failed to add product.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditProductChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    if (!editingProduct) return;

    const { name, value } = e.target;
    setEditingProduct({
      ...editingProduct,
      [name]: name === "pricePerUnit" ? parseFloat(value) || 0 : value,
    });
  };

  const handleUpdateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setLoading(true);
    setError("");
    const token = localStorage.getItem("adminToken");

    // Validate that at least one transaction type is selected
    if (editingProduct.allowedTransactions.length === 0) {
      setError(
        "Please select at least one transaction type (Sale or Purchase)"
      );
      setLoading(false);
      return;
    }

    try {
      const updateData = {
        name: editingProduct.name,
        description: editingProduct.description,
        unit: editingProduct.unit,
        pricePerUnit: editingProduct.pricePerUnit,
        allowedTransactions: editingProduct.allowedTransactions,
        enableNugCalculation: editingProduct.enableNugCalculation || false,
      };
      console.log("Updating product with data:", updateData);
      const { authenticatedFetch } = await import("../utils/apiClient");
      const data = await authenticatedFetch<{
        success: boolean;
        message?: string;
      }>(`/admin/products/${editingProduct._id}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      if (data.success) {
        alert("Product updated successfully!");
        setEditingProduct(null);
        fetchProducts(); // Refresh list
      } else {
        setError(data.message || "Failed to update product.");
      }
    } catch (err) {
      console.error("Error updating product:", err);
      setError("Network error or failed to update product.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;

    setLoading(true);
    setError("");
    const token = localStorage.getItem("adminToken");

    try {
      const { authenticatedFetch } = await import("../utils/apiClient");
      const data = await authenticatedFetch<{
        success: boolean;
        message?: string;
      }>(`/admin/products/${productId}`, {
        method: "DELETE",
      });

      if (data.success) {
        alert("Product deleted successfully!");
        fetchProducts(); // Refresh list
      } else {
        setError(data.message || "Failed to delete product.");
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      setError("Network error or failed to delete product.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          Product Catalog Management
        </h3>
        <button
          onClick={() => setShowAddProductForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add New Product
        </button>
      </div>

      {showAddProductForm && (
        <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-lg font-medium text-gray-800 mb-4">
            Add New Product
          </h4>
          <form onSubmit={handleAddProductSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={newProduct.name}
                  onChange={handleNewProductChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., White Oil"
                />
              </div>
              <div>
                <label
                  htmlFor="unit"
                  className="block text-sm font-medium text-gray-700"
                >
                  Unit
                </label>
                <select
                  name="unit"
                  id="unit"
                  value={newProduct.unit}
                  onChange={handleNewProductChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select Unit</option>
                  <option value="Liters">Liters</option>
                  <option value="Gallons">Gallons</option>
                  <option value="Barrels">Barrels</option>
                  <option value="Tons">Tons</option>
                  <option value="Kilograms">Kilograms</option>
                  <option value="Pieces">Pieces</option>
                </select>
              </div>
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                name="description"
                id="description"
                value={newProduct.description}
                onChange={handleNewProductChange}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Describe the product..."
              />
            </div>
            <div>
              <label
                htmlFor="pricePerUnit"
                className="block text-sm font-medium text-gray-700"
              >
                Price per Unit (PKR)
              </label>
              <input
                type="number"
                name="pricePerUnit"
                id="pricePerUnit"
                value={newProduct.pricePerUnit}
                onChange={handleNewProductChange}
                required
                min="0"
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed Transactions
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newProduct.allowedTransactions.includes("sale")}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewProduct({
                          ...newProduct,
                          allowedTransactions: [
                            ...newProduct.allowedTransactions,
                            "sale",
                          ],
                        });
                      } else {
                        setNewProduct({
                          ...newProduct,
                          allowedTransactions:
                            newProduct.allowedTransactions.filter(
                              (t) => t !== "sale"
                            ),
                        });
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Sale</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newProduct.allowedTransactions.includes(
                      "purchase"
                    )}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewProduct({
                          ...newProduct,
                          allowedTransactions: [
                            ...newProduct.allowedTransactions,
                            "purchase",
                          ],
                        });
                      } else {
                        setNewProduct({
                          ...newProduct,
                          allowedTransactions:
                            newProduct.allowedTransactions.filter(
                              (t) => t !== "purchase"
                            ),
                        });
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Purchase</span>
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Select which transaction types are allowed for this product
              </p>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newProduct.enableNugCalculation}
                  onChange={(e) => {
                    setNewProduct({
                      ...newProduct,
                      enableNugCalculation: e.target.checked,
                    });
                  }}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Enable Nug Calculation
                </span>
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Allow container-based weight calculations (gross weight - tare
                weight = net weight)
              </p>
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                type="button"
                onClick={() => setShowAddProductForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading ? "Adding..." : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      )}

      {editingProduct && (
        <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-yellow-50">
          <h4 className="text-lg font-medium text-gray-800 mb-4">
            Edit Product: {editingProduct.name}
          </h4>
          <form onSubmit={handleUpdateProductSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="editName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="editName"
                  value={editingProduct.name}
                  onChange={handleEditProductChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="editUnit"
                  className="block text-sm font-medium text-gray-700"
                >
                  Unit
                </label>
                <select
                  name="unit"
                  id="editUnit"
                  value={editingProduct.unit}
                  onChange={handleEditProductChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="Liters">Liters</option>
                  <option value="Gallons">Gallons</option>
                  <option value="Barrels">Barrels</option>
                  <option value="Tons">Tons</option>
                  <option value="Kilograms">Kilograms</option>
                  <option value="Pieces">Pieces</option>
                </select>
              </div>
            </div>
            <div>
              <label
                htmlFor="editDescription"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                name="description"
                id="editDescription"
                value={editingProduct.description}
                onChange={handleEditProductChange}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="editPricePerUnit"
                className="block text-sm font-medium text-gray-700"
              >
                Price per Unit (PKR)
              </label>
              <input
                type="number"
                name="pricePerUnit"
                id="editPricePerUnit"
                value={editingProduct.pricePerUnit}
                onChange={handleEditProductChange}
                required
                min="0"
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed Transactions
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingProduct.allowedTransactions.includes(
                      "sale"
                    )}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEditingProduct({
                          ...editingProduct,
                          allowedTransactions: [
                            ...editingProduct.allowedTransactions,
                            "sale",
                          ],
                        });
                      } else {
                        setEditingProduct({
                          ...editingProduct,
                          allowedTransactions:
                            editingProduct.allowedTransactions.filter(
                              (t) => t !== "sale"
                            ),
                        });
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Sale</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingProduct.allowedTransactions.includes(
                      "purchase"
                    )}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEditingProduct({
                          ...editingProduct,
                          allowedTransactions: [
                            ...editingProduct.allowedTransactions,
                            "purchase",
                          ],
                        });
                      } else {
                        setEditingProduct({
                          ...editingProduct,
                          allowedTransactions:
                            editingProduct.allowedTransactions.filter(
                              (t) => t !== "purchase"
                            ),
                        });
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Purchase</span>
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Select which transaction types are allowed for this product
              </p>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingProduct.enableNugCalculation || false}
                  onChange={(e) => {
                    setEditingProduct({
                      ...editingProduct,
                      enableNugCalculation: e.target.checked,
                    });
                  }}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Enable Nug Calculation
                </span>
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Allow container-based weight calculations (gross weight - tare
                weight = net weight)
              </p>
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading ? "Updating..." : "Update Product"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price per Unit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Allowed Transactions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nug Enabled
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {product.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                  {product.description || "No description"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.unit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  PKR {product.pricePerUnit.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-1">
                    {product.allowedTransactions.includes("sale") && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Sale
                      </span>
                    )}
                    {product.allowedTransactions.includes("purchase") && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Purchase
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {product.enableNugCalculation ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      No
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(product.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => {
                      console.log("Editing product:", product);
                      setEditingProduct(product);
                    }}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No products found. Add your first product to get started.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManagement;
