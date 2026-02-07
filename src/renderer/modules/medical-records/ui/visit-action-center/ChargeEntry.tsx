import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Calculator,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MEDICAL_RECORDS_ROUTES } from '../../../../app/routes/routeConstants';
import {
  ServiceItem,
  ChargeItem,
  Theme,
  getColorConfig,
  formatCurrency,
  searchServices,
} from './billing-types';

/**
 * Props for ChargeEntry component
 */
interface ChargeEntryProps {
  visitId?: string;
  onProceedToBilling?: (items: ChargeItem[], totalAmount: number) => void;
  theme?: Theme;
}

/**
 * ChargeEntry Component
 * Allows users to search and add services/items to a patient bill
 */
export const ChargeEntry: React.FC<ChargeEntryProps> = ({
  visitId = 'VIS-2024-001',
  onProceedToBilling,
  theme = 'light',
}) => {
  const navigate = useNavigate();
  const colors = getColorConfig(theme);

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<ChargeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<ServiceItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Filter services based on search term
  useEffect(() => {
    const results = searchServices(searchTerm);
    setSearchResults(results);
    setShowSearchResults(results.length > 0);
  }, [searchTerm]);

  // Calculate totals
  const { subtotal, grandTotal } = useMemo(() => {
    const subtotal = selectedItems.reduce((sum, item) => sum + item.totalAmount, 0);
    const grandTotal = subtotal; // Taxes/discounts handled in billing summary
    return { subtotal, grandTotal };
  }, [selectedItems]);

  /**
   * Add item to selected items or increase quantity if exists
   */
  const addItem = useCallback((service: ServiceItem) => {
    setSelectedItems(prev => {
      const existingItem = prev.find(item => item.service.id === service.id);

      if (existingItem) {
        return prev.map(item =>
          item.service.id === service.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                totalAmount: (item.quantity + 1) * service.unitPrice,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          service,
          quantity: 1,
          totalAmount: service.unitPrice,
        },
      ];
    });

    setSearchTerm('');
    setShowSearchResults(false);
  }, []);

  /**
   * Update quantity of an item
   */
  const updateQuantity = useCallback((itemId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }

    setSelectedItems(prev =>
      prev.map(item => {
        if (item.service.id === itemId) {
          return {
            ...item,
            quantity: newQuantity,
            totalAmount: newQuantity * item.service.unitPrice,
          };
        }
        return item;
      })
    );
  }, []);

  /**
   * Remove item from selected items
   */
  const removeItem = useCallback((itemId: number) => {
    setSelectedItems(prev => prev.filter(item => item.service.id !== itemId));
  }, []);

  /**
   * Increase quantity of an item
   */
  const increaseQuantity = useCallback(
    (itemId: number) => {
      const item = selectedItems.find(item => item.service.id === itemId);
      if (item) {
        updateQuantity(itemId, item.quantity + 1);
      }
    },
    [selectedItems, updateQuantity]
  );

  /**
   * Decrease quantity of an item
   */
  const decreaseQuantity = useCallback(
    (itemId: number) => {
      const item = selectedItems.find(item => item.service.id === itemId);
      if (item) {
        updateQuantity(itemId, item.quantity - 1);
      }
    },
    [selectedItems, updateQuantity]
  );

  /**
   * Clear all selected items
   */
  const clearAllItems = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all items?')) {
      setSelectedItems([]);
    }
  }, []);

  /**
   * Handle proceed to billing
   */
  const handleProceedToBilling = useCallback(() => {
    if (selectedItems.length === 0) {
      alert('Please add at least one item before proceeding to billing.');
      return;
    }

    setIsLoading(true);

    // Store billing data in sessionStorage for sharing with BillingSummary
    sessionStorage.setItem(
      'billingChargeItems',
      JSON.stringify({
        items: selectedItems,
        subtotal: grandTotal,
        timestamp: Date.now(),
      })
    );

    setTimeout(() => {
      setIsLoading(false);
      onProceedToBilling?.(selectedItems, grandTotal);
      navigate(MEDICAL_RECORDS_ROUTES.PATIENT_BILLING_SUMMARY);
    }, 500);
  }, [selectedItems, grandTotal, onProceedToBilling, navigate]);

  return (
    <div className={`rounded-xl border ${colors.border.primary} ${colors.bg.primary} overflow-hidden`}>
      {/* Header */}
      <div className={`p-6 border-b ${colors.border.primary}`}>
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <ShoppingCart className={`w-6 h-6 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
            <div>
              <h2 className={`text-xl font-bold ${colors.text.primary}`}>Charge Entry</h2>
              <p className={colors.text.secondary}>Add services and items to patient bill</p>
            </div>
          </div>

          <div className={`px-4 py-2 rounded-lg ${colors.bg.secondary}`}>
            <div className="text-sm">
              <span className={colors.text.secondary}>Total: </span>
              <span className={`text-lg font-bold ${colors.status.success}`}>
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Visit ID */}
        <div className={`p-3 rounded-lg ${colors.bg.secondary}`}>
          <p className={`text-xs ${colors.text.secondary}`}>Visit ID</p>
          <p className={`font-medium ${colors.text.primary}`}>{visitId}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Search Section */}
        <div className="mb-8">
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Search className={`w-5 h-5 ${colors.text.tertiary}`} />
              <label className={`text-sm font-medium ${colors.text.secondary}`}>
                Search Services/Items by Name or Code
              </label>
            </div>

            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${colors.text.tertiary}`} />
              <input
                type="text"
                placeholder="Type service name or code (e.g., 'Consultation', 'LAB001')..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onFocus={() => searchTerm.trim() && setShowSearchResults(true)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />

              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setShowSearchResults(false);
                  }}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded ${colors.bg.hover}`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div
                className={`absolute z-10 w-full mt-1 rounded-lg border shadow-xl ${colors.border.primary} ${colors.bg.elevated} max-h-64 overflow-y-auto`}
              >
                {searchResults.map(service => (
                  <div
                    key={service.id}
                    className={`p-3 border-b last:border-b-0 ${colors.border.primary} ${colors.bg.hover} cursor-pointer transition-colors`}
                    onClick={() => addItem(service)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium ${colors.text.primary}`}>{service.name}</span>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${colors.bg.secondary} ${colors.text.secondary}`}
                          >
                            {service.code}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className={colors.text.secondary}>{service.category}</span>
                          <span className={`font-medium ${colors.text.primary}`}>
                            {formatCurrency(service.unitPrice)}
                          </span>
                        </div>
                      </div>
                      <Plus className={`w-4 h-4 ml-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results Message */}
            {showSearchResults && searchResults.length === 0 && searchTerm.trim() && (
              <div
                className={`absolute z-10 w-full mt-1 p-4 rounded-lg border ${colors.border.primary} ${colors.bg.elevated}`}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span className={colors.text.secondary}>No services found matching "{searchTerm}"</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Items Table */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-semibold ${colors.text.primary}`}>
              Selected Items ({selectedItems.length})
            </h3>
            {selectedItems.length > 0 && (
              <button
                onClick={clearAllItems}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${colors.bg.hover} ${colors.text.secondary}`}
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>

          {selectedItems.length === 0 ? (
            <div className={`py-12 text-center rounded-lg border ${colors.border.primary}`}>
              <Calculator className={`w-12 h-12 mx-auto mb-4 ${colors.text.tertiary}`} />
              <h3 className={`text-lg font-medium mb-2 ${colors.text.primary}`}>No Items Added</h3>
              <p className={colors.text.secondary}>Search and add services or items to create a bill</p>
            </div>
          ) : (
            <div className={`rounded-lg border overflow-hidden ${colors.border.primary}`}>
              {/* Table Header */}
              <div
                className={`grid grid-cols-12 gap-4 p-4 font-medium border-b ${colors.bg.secondary} ${colors.border.primary}`}
              >
                <div className="col-span-4">Item/Service</div>
                <div className="col-span-2">Unit Price</div>
                <div className="col-span-3">Quantity</div>
                <div className="col-span-2">Total Amount</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {selectedItems.map(item => (
                  <div key={item.service.id} className="grid grid-cols-12 gap-4 p-4 items-center">
                    {/* Item Details */}
                    <div className="col-span-4">
                      <div>
                        <p className={`font-medium ${colors.text.primary}`}>{item.service.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${colors.bg.secondary} ${colors.text.secondary}`}
                          >
                            {item.service.code}
                          </span>
                          <span className={`text-xs ${colors.text.secondary}`}>{item.service.category}</span>
                        </div>
                      </div>
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-2">
                      <p className={`font-medium ${colors.text.primary}`}>{formatCurrency(item.service.unitPrice)}</p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="col-span-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => decreaseQuantity(item.service.id)}
                          className={`p-1.5 rounded-lg border ${colors.border.primary} ${colors.bg.hover} disabled:opacity-30 disabled:cursor-not-allowed`}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>

                        <div
                          className={`min-w-[60px] text-center px-3 py-1.5 rounded-lg border ${colors.border.primary} ${colors.bg.secondary}`}
                        >
                          <span className={`font-medium ${colors.text.primary}`}>{item.quantity}</span>
                        </div>

                        <button
                          onClick={() => increaseQuantity(item.service.id)}
                          className={`p-1.5 rounded-lg border ${colors.border.primary} ${colors.bg.hover}`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Total Amount */}
                    <div className="col-span-2">
                      <p className={`font-bold ${colors.text.primary}`}>{formatCurrency(item.totalAmount)}</p>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => removeItem(item.service.id)}
                        className={`p-2 rounded-lg ${colors.bg.hover} ${colors.text.secondary}`}
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary Section */}
        <div className={`p-6 rounded-lg border ${colors.border.primary} ${colors.bg.secondary}`}>
          <h3 className={`text-lg font-semibold mb-4 ${colors.text.primary}`}>Bill Summary</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={colors.text.secondary}>Subtotal</span>
              <span className={`font-medium ${colors.text.primary}`}>{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className={colors.text.secondary}>Tax (0%)</span>
              <span className={colors.text.secondary}>-</span>
            </div>

            <div className="flex items-center justify-between">
              <span className={colors.text.secondary}>Discount (0%)</span>
              <span className={colors.text.secondary}>-</span>
            </div>

            <div className="pt-3 border-t border-gray-700 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className={`text-lg font-semibold ${colors.text.primary}`}>Grand Total</span>
                <span className={`text-2xl font-bold ${colors.status.success}`}>{formatCurrency(grandTotal)}</span>
              </div>
              <p className={`text-xs mt-1 ${colors.text.tertiary}`}>
                Taxes and discounts will be applied in the billing summary page
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-700 dark:border-gray-700">
            <button
              onClick={clearAllItems}
              disabled={selectedItems.length === 0 || isLoading}
              className={`px-6 py-2.5 rounded-lg font-medium transition-colors border ${colors.border.primary} ${colors.bg.hover} ${colors.text.secondary} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Clear All
            </button>

            <button
              onClick={handleProceedToBilling}
              disabled={selectedItems.length === 0 || isLoading}
              className={`px-8 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                selectedItems.length === 0 || isLoading
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : `${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text}`
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Proceed to Billing'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className={`p-4 border-t ${colors.border.primary} ${colors.bg.secondary}`}>
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className={`text-xs ${colors.text.secondary}`}>
              <span className="font-medium">Tip:</span> Search by service name, code, or category. You can adjust
              quantities after adding items. All taxes, discounts, and payment methods will be handled in the billing
              summary page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChargeEntry;