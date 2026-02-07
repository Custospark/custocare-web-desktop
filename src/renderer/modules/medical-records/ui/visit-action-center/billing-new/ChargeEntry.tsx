// ChargeEntry.tsx
// Embedded charge entry component for use inside overlay

import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Search, Plus, Minus, Trash2, X } from 'lucide-react';
import { 
  addCharge, 
  increaseQty, 
  decreaseQty, 
  removeLine, 
  clearCharges, 
  setStep,
  selectCharges,
  selectSubtotal 
} from './billingSlice';
import { MOCK_SERVICES, formatCurrency } from '../billing/billing-types';

interface ChargeEntryProps {
  theme?: 'light' | 'dark';
}

export const ChargeEntry: React.FC<ChargeEntryProps> = ({ theme = 'light' }) => {
  const dispatch = useDispatch();
  const charges = useSelector(selectCharges);
  const subtotal = useSelector(selectSubtotal);
  const isDark = theme === 'dark';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  
  const filteredServices = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return MOCK_SERVICES.filter(s => 
      s.name.toLowerCase().includes(term) || 
      s.code.toLowerCase().includes(term)
    ).slice(0, 8);
  }, [searchTerm]);
  
  const handleAddService = (service: typeof MOCK_SERVICES[0]) => {
    dispatch(addCharge(service));
    setSearchTerm('');
    setShowResults(false);
  };
  
  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
    },
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
    },
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Search */}
      <div className="relative">
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${colors.text.secondary}`} />
          <input
            type="text"
            placeholder="Search services by name or code..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            className={`w-full pl-10 pr-10 py-3 rounded-lg border ${colors.border} ${colors.bg.primary} ${colors.text.primary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setShowResults(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Search Results */}
        {showResults && filteredServices.length > 0 && (
          <div className={`absolute z-10 w-full mt-1 ${colors.bg.primary} border ${colors.border} rounded-lg shadow-xl max-h-64 overflow-y-auto`}>
            {filteredServices.map(service => (
              <div
                key={service.id}
                onClick={() => handleAddService(service)}
                className={`p-3 border-b last:border-b-0 ${colors.border} hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${colors.text.primary}`}>{service.name}</p>
                    <p className={`text-sm ${colors.text.secondary}`}>
                      {service.code} • {service.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${colors.text.primary}`}>{formatCurrency(service.unitPrice)}</p>
                    <Plus className="w-4 h-4 text-blue-500 ml-auto" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Charges List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-semibold ${colors.text.primary}`}>
            Selected Items ({charges.length})
          </h3>
          {charges.length > 0 && (
            <button
              onClick={() => dispatch(clearCharges())}
              className={`text-sm text-red-500 hover:text-red-600`}
            >
              Clear All
            </button>
          )}
        </div>
        
        {charges.length === 0 ? (
          <div className={`text-center py-12 ${colors.bg.secondary} rounded-lg`}>
            <p className={colors.text.secondary}>No items added yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {charges.map(charge => (
              <div
                key={charge.id}
                className={`flex items-center gap-4 p-4 border ${colors.border} rounded-lg`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${colors.text.primary}`}>{charge.service.name}</p>
                  <p className={`text-sm ${colors.text.secondary}`}>
                    {charge.service.code} • {formatCurrency(charge.service.unitPrice)} each
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => dispatch(decreaseQty(charge.id))}
                    className={`p-1 rounded border ${colors.border} hover:bg-gray-100 dark:hover:bg-gray-800`}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  
                  <span className={`w-12 text-center font-medium ${colors.text.primary}`}>
                    {charge.quantity}
                  </span>
                  
                  <button
                    onClick={() => dispatch(increaseQty(charge.id))}
                    className={`p-1 rounded border ${colors.border} hover:bg-gray-100 dark:hover:bg-gray-800`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="w-32 text-right">
                  <p className={`font-bold ${colors.text.primary}`}>
                    {formatCurrency(charge.totalAmount)}
                  </p>
                </div>
                
                <button
                  onClick={() => dispatch(removeLine(charge.id))}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Summary Footer */}
      <div className={`${colors.bg.secondary} rounded-lg p-4`}>
        <div className="flex items-center justify-between mb-4">
          <span className={`font-semibold ${colors.text.primary}`}>Subtotal</span>
          <span className={`text-2xl font-bold ${colors.text.primary}`}>
            {formatCurrency(subtotal)}
          </span>
        </div>
        
        <button
          onClick={() => dispatch(setStep('billing_summary'))}
          disabled={charges.length === 0}
          className={`w-full py-3 rounded-lg font-medium ${
            charges.length > 0
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700'
          }`}
        >
          Proceed to Summary
        </button>
      </div>
    </div>
  );
};

export default ChargeEntry;