import React, { useState } from 'react';
import { Search, Package, Eye, Edit, Trash2, Plus, AlertCircle, Filter } from 'lucide-react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../../../../app/store/store';
import { navigate } from '../../../../../app/store/slices/moduleNavigationSlice';
import { formatCurrency as formatCurrencyShared } from '../../../../../shared/utils/formatCurrency';
import { useSearchInventoryItems, useDeleteInventoryItem } from '../api/useInventoryItemQueries';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import type { InventoryItem, InventoryItemCategory, InventoryItemStatus } from  '../api/InventoryItemTypes';

interface SearchStockProps {
  theme: 'light' | 'dark';
}

const SearchStock: React.FC<SearchStockProps> = ({ theme }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const isDark = theme === 'dark';

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<InventoryItemCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<InventoryItemStatus | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: searchResponse, isLoading, refetch } = useSearchInventoryItems(
    {
      q: searchTerm,
      category: categoryFilter === 'all' ? undefined : categoryFilter,
      status: statusFilter === 'all' ? undefined : statusFilter,
      per_page: 20,
      page: 1,
    },
    {
      enabled: false, // We'll trigger manually on form submit
    }
  );

  const deleteMutation = useDeleteInventoryItem({
    onSuccess: () => {
      showToast('success', 'Stock item deleted successfully!');
      setShowDeleteConfirm(false);
      setSelectedItem(null);
      refetch(); // Refresh the search results
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to delete stock item';
      showToast('error', errorMessage);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      refetch();
    }
  };

  const handleViewDetails = (item: InventoryItem) => {
    dispatch(navigate({
      operation: 'inventory',
      action: 'view_details',
      payload: { itemId: item.id, itemUuid: item.item_uuid },
      timestamp: Date.now(), // This is OK - called inside event handler
    }));
  };

  const handleEditItem = (item: InventoryItem) => {
    dispatch(navigate({
      operation: 'inventory',
      action: 'edit_stock',
      payload: { itemId: item.id, itemUuid: item.item_uuid },
      timestamp: Date.now(), // This is OK - called inside event handler
    }));
  };

  const handleDeleteItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (selectedItem) {
      deleteMutation.mutate({ uuid: selectedItem.item_uuid });
    }
  };

  const handleAddStock = () => {
    dispatch(navigate({
      operation: 'inventory',
      action: 'add_stock',
      timestamp: Date.now(), // This is OK - called inside event handler
    }));
  };

  const stockItems = searchResponse?.data || [];

  // Category options for filter
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'medication', label: 'Medication' },
    { value: 'medical_supply', label: 'Medical Supply' },
    { value: 'surgical_instrument', label: 'Surgical Instrument' },
    { value: 'diagnostic_equipment', label: 'Diagnostic Equipment' },
    { value: 'implantable_device', label: 'Implantable Device' },
  ];

  // Status options for filter
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'discontinued', label: 'Discontinued' },
  ];

  // Format currency
  const formatCurrency = (amount: number | null | undefined, currencyCode: string = 'USD') => {
    if (amount === null || amount === undefined) return 'N/A';
    return formatCurrencyShared(amount, currencyCode);
  };

  return (
    <div className={`space-y-4 p-4 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl p-6 max-w-md w-full shadow-2xl ${
            isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className={`w-6 h-6 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  Delete Stock Item?
                </h3>
                <p className={`mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Are you sure you want to delete <strong>{selectedItem.item_name}</strong>?
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  This action cannot be undone. The item will be soft-deleted and can be restored later.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className={`px-4 py-2 rounded-lg font-medium ${
                  deleteMutation.isPending
                    ? 'bg-red-400 cursor-not-allowed'
                    : isDark
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Search className="w-6 h-6" />
            Search Stock Items
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Search and manage inventory items
          </p>
        </div>
        <button
          onClick={handleAddStock}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
            isDark
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Plus className="w-4 h-4" />
          Add New Stock
        </button>
      </div>

      {/* Search Form */}
      <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="Search by item name, code, manufacturer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                isDark
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <Filter className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Filters:</span>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as InventoryItemCategory | 'all')}
              className={`px-3 py-2 rounded-lg border ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InventoryItemStatus | 'all')}
              className={`px-3 py-2 rounded-lg border ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </form>
      </div>

      {/* Results */}
      <div className={`rounded-lg border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        {isLoading ? (
          <LoadingSkeleton variant="table" theme={theme} />
        ) : searchTerm ? (
          stockItems.length === 0 ? (
            <div className="p-12 text-center">
              <Package className={`w-12 h-12 mx-auto mb-4 ${
                isDark ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <h3 className="text-lg font-medium mb-2">No Stock Items Found</h3>
              <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No items match your search "{searchTerm}". Try a different search term or filters.
              </p>
              <button
                onClick={handleAddStock}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add New Stock Item
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className={isDark ? 'bg-gray-800/50' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Item Code
                    </th>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Item Name
                    </th>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Category
                    </th>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Quantity
                    </th>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Unit Cost
                    </th>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Status
                    </th>
                    <th className={`px-4 py-3 text-left text-sm font-medium ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-200'}`}>
                  {stockItems.map((item) => (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <code className={`px-2 py-1 rounded text-sm ${
                          isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.item_code}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{item.item_name}</div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {item.manufacturer}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs capitalize ${
                          isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.item_category.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{item.package_quantity}</div>
                          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {item.unit_of_measure}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{formatCurrency(item.unit_cost, item.currency_code)}</div>
                          {item.reorder_point && (
                            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              Reorder: {item.reorder_point}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'active'
                            ? isDark
                              ? 'bg-green-900/30 text-green-300'
                              : 'bg-green-100 text-green-800'
                            : item.status === 'inactive'
                            ? isDark
                              ? 'bg-yellow-900/30 text-yellow-300'
                              : 'bg-yellow-100 text-yellow-800'
                            : isDark
                              ? 'bg-red-900/30 text-red-300'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(item)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark
                                ? 'hover:bg-gray-700 text-gray-400 hover:text-blue-400'
                                : 'hover:bg-gray-200 text-gray-600 hover:text-blue-600'
                            }`}
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditItem(item)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark
                                ? 'hover:bg-gray-700 text-gray-400 hover:text-green-400'
                                : 'hover:bg-gray-200 text-gray-600 hover:text-green-600'
                            }`}
                            title="Edit item"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark
                                ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400'
                                : 'hover:bg-gray-200 text-gray-600 hover:text-red-600'
                            }`}
                            title="Delete item"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="p-12 text-center">
            <Search className={`w-12 h-12 mx-auto mb-4 ${
              isDark ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h3 className="text-lg font-medium mb-2">Search for Stock Items</h3>
            <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Enter a search term above to find inventory items
            </p>
            <div className="inline-flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setSearchTerm('paracetamol');
                  // Use setTimeout to avoid calling Date.now() during render
                  setTimeout(() => refetch(), 100);
                }}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Try: "paracetamol"
              </button>
              <button
                onClick={handleAddStock}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isDark
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Add New Stock
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search Results Info */}
      {searchTerm && stockItems.length > 0 && (
        <div className={`text-sm p-3 rounded ${
          isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-600'
        }`}>
          Found {stockItems.length} item{stockItems.length !== 1 ? 's' : ''} matching "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default SearchStock;