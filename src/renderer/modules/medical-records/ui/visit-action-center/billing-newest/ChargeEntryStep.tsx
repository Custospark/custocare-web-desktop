// ChargeEntryStep.tsx
import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, Calculator, X, AlertCircle, ArrowRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addChargeItem,
  increaseQuantity,
  decreaseQuantity,
  removeChargeItem,
  clearCharges,
  setStep,
  selectChargeItems,
} from './billing-slice';
import { MOCK_SERVICES, ServiceItem, formatCurrency } from './billing-types';

interface ChargeEntryStepProps {
  theme?: 'light' | 'dark';
}

export const ChargeEntryStep: React.FC<ChargeEntryStepProps> = ({
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const dispatch = useDispatch();
  
  // Select data from Redux store
  const chargeItems = useSelector(selectChargeItems);
  
  // Local state for search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ServiceItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Colors based on theme
  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      hover: isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50',
    },
    border: {
      primary: isDark ? 'border-gray-800' : 'border-gray-200',
      secondary: isDark ? 'border-gray-700' : 'border-gray-300',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
    },
    accent: {
      primary: isDark ? 'bg-blue-600' : 'bg-blue-600',
      hover: isDark ? 'hover:bg-blue-700' : 'hover:bg-blue-700',
      text: 'text-white',
    },
  };

  // Calculate subtotal
  const subtotal = chargeItems.reduce((sum, item) => sum + item.totalAmount, 0);

  // Filter services based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const results = MOCK_SERVICES.filter(service =>
      service.name.toLowerCase().includes(term) ||
      service.code.toLowerCase().includes(term) ||
      service.category.toLowerCase().includes(term)
    ).slice(0, 6);
    
    setSearchResults(results);
    setShowSearchResults(results.length > 0);
  }, [searchTerm]);

  const handleAddItem = (service: ServiceItem) => {
    dispatch(addChargeItem(service));
    setSearchTerm('');
    setShowSearchResults(false);
  };

  const handleIncreaseQuantity = (itemId: string) => {
    dispatch(increaseQuantity(itemId));
  };

  const handleDecreaseQuantity = (itemId: string) => {
    dispatch(decreaseQuantity(itemId));
  };

  const handleRemoveItem = (itemId: string) => {
    dispatch(removeChargeItem(itemId));
  };

  const handleClearAll = () => {
    if (chargeItems.length === 0) return;
    
    if (confirm('Are you sure you want to clear all items?')) {
      dispatch(clearCharges());
    }
  };

  const handleProceedToBilling = () => {
    dispatch(setStep('billing_summary'));
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Search & Add Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search Section */}
          <div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Search className={`w-5 h-5 ${colors.text.tertiary}`} />
                <label className={`text-sm font-medium ${colors.text.secondary}`}>
                  Search Services/Items
                </label>
              </div>
              
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${colors.text.tertiary}`} />
                <input
                  type="text"
                  placeholder="Type service name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
              
              {/* Search Results */}
              {showSearchResults && searchResults.length > 0 && (
                <div className={`absolute z-10 w-full mt-1 rounded-lg border shadow-xl ${colors.border.primary} ${colors.bg.primary} max-h-64 overflow-y-auto`}>
                  {searchResults.map((service) => (
                    <div
                      key={service.id}
                      className={`p-3 border-b last:border-b-0 ${colors.border.primary} ${colors.bg.hover} cursor-pointer transition-colors`}
                      onClick={() => handleAddItem(service)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-medium ${colors.text.primary}`}>{service.name}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${colors.bg.secondary} ${colors.text.secondary}`}>
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
                        <Plus className={`w-4 h-4 ml-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Items Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${colors.text.primary}`}>
                Selected Items ({chargeItems.length})
              </h3>
              {chargeItems.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${colors.bg.hover} ${colors.text.secondary}`}
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              )}
            </div>
            
            {chargeItems.length === 0 ? (
              <div className={`py-12 text-center rounded-lg border ${colors.border.primary}`}>
                <Calculator className={`w-12 h-12 mx-auto mb-4 ${colors.text.tertiary}`} />
                <h3 className={`text-lg font-medium mb-2 ${colors.text.primary}`}>No Items Added</h3>
                <p className={colors.text.secondary}>
                  Search and add services or items to create a bill
                </p>
              </div>
            ) : (
              <div className={`rounded-lg border overflow-hidden ${colors.border.primary}`}>
                {/* Table Header */}
                <div className={`grid grid-cols-12 gap-4 p-4 font-medium border-b ${colors.bg.secondary} ${colors.border.primary}`}>
                  <div className="col-span-5">Item/Service</div>
                  <div className="col-span-2">Unit Price</div>
                  <div className="col-span-3">Quantity</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                
                {/* Table Rows */}
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {chargeItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center">
                      {/* Item Details */}
                      <div className="col-span-5">
                        <div>
                          <p className={`font-medium ${colors.text.primary}`}>{item.service.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${colors.bg.secondary} ${colors.text.secondary}`}>
                              {item.service.code}
                            </span>
                            <span className={`text-xs ${colors.text.secondary}`}>{item.service.category}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Unit Price */}
                      <div className="col-span-2">
                        <p className={`font-medium ${colors.text.primary}`}>
                          {formatCurrency(item.service.unitPrice)}
                        </p>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="col-span-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleDecreaseQuantity(item.id)}
                            className={`p-1.5 rounded-lg border ${colors.border.primary} ${colors.bg.hover}`}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          
                          <div className={`min-w-[60px] text-center px-3 py-1.5 rounded-lg border ${colors.border.primary} ${colors.bg.secondary}`}>
                            <span className={`font-medium ${colors.text.primary}`}>{item.quantity}</span>
                          </div>
                          
                          <button
                            onClick={() => handleIncreaseQuantity(item.id)}
                            className={`p-1.5 rounded-lg border ${colors.border.primary} ${colors.bg.hover}`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className={`ml-2 p-1.5 rounded-lg ${colors.bg.hover} ${colors.text.secondary}`}
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Total Amount */}
                      <div className="col-span-2 text-right">
                        <p className={`font-bold ${colors.text.primary}`}>
                          {formatCurrency(item.totalAmount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column - Summary & Actions */}
        <div className="space-y-6">
          {/* Summary Card */}
          <div className={`p-5 rounded-lg border ${colors.border.primary} ${colors.bg.secondary}`}>
            <h3 className={`text-lg font-semibold mb-4 ${colors.text.primary}`}>Bill Summary</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={colors.text.secondary}>Subtotal</span>
                <span className={`font-medium ${colors.text.primary}`}>
                  {formatCurrency(subtotal)}
                </span>
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
                  <span className={`text-2xl font-bold text-green-500`}>
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Proceed Button */}
          <div className={`p-5 rounded-lg border ${colors.border.primary} ${colors.bg.secondary}`}>
            <button
              onClick={handleProceedToBilling}
              disabled={chargeItems.length === 0}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                chargeItems.length === 0
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : `${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text}`
              }`}
            >
              <span>Proceed to Billing Summary</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <p className={`text-xs mt-3 text-center ${colors.text.tertiary}`}>
              Taxes, discounts, and payment methods will be configured in the next step
            </p>
          </div>
          
          {/* Quick Tips */}
          <div className={`p-4 rounded-lg border ${colors.border.primary} ${colors.bg.secondary}`}>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className={`text-xs ${colors.text.secondary}`}>
                  <span className="font-medium">Tip:</span> Items are automatically saved. 
                  You can return to this step anytime to modify charges.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};