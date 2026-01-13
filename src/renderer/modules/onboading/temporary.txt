import React, { useState } from 'react';
import { PackagePlus, X } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../../app/store/store';
import { navigate } from '../../../../app/store/slices/moduleNavigationSlice'; // Import the action

interface StockItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface AddStockProps {
  theme: 'light' | 'dark';
}

const AddStock: React.FC<AddStockProps> = ({ theme }) => {
  const dispatch = useDispatch<AppDispatch>();
  const isDark = theme === 'dark';

  const [stockName, setStockName] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleSendToInvoice = () => {
    if (!stockName || quantity <= 0 || price <= 0) {
      alert('Please fill all fields with valid values');
      return;
    }

    const stockData: StockItem = {
      id: Date.now(),
      name: stockName,
      quantity,
      price,
    };

    console.log('Dispatching navigation to billing/create_invoice with payload:', stockData);

    // Method 1: Direct dispatch with action import (preferred)
    dispatch(navigate({
      operation: 'billing',
      action: 'create_invoice',
      payload: { stockData },
      timestamp: Date.now(),
    }));

    // Method 2: Or use the action type directly
    // dispatch({
    //   type: 'moduleNavigation/navigate',
    //   payload: {
    //     operation: 'billing',
    //     action: 'create_invoice',
    //     payload: { stockData },
    //     timestamp: Date.now(),
    //   }
    // });

    console.log('Navigation dispatched');
  };

  const handleCancel = () => {
    if (stockName || quantity > 0 || price > 0) {
      setShowCancelConfirm(true);
    } else {
      goBackToInventory();
    }
  };

  const handleConfirmCancel = () => {
    setStockName('');
    setQuantity(0);
    setPrice(0);
    setShowCancelConfirm(false);
    goBackToInventory();
  };

  const handleDismissCancel = () => {
    setShowCancelConfirm(false);
  };

  const goBackToInventory = () => {
    dispatch(navigate({
      operation: 'inventory',
      action: 'overview',
      timestamp: Date.now(),
    }));
  };

  const hasUnsavedChanges = stockName || quantity > 0 || price > 0;

  return (
    <div className={`space-y-4 p-4 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl p-6 max-w-md w-full shadow-2xl ${
            isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
          }`}>
            <h3 className="text-lg font-semibold mb-2">
              Discard Changes?
            </h3>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              You have unsaved changes. Are you sure you want to cancel? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleDismissCancel}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Continue Editing
              </button>
              <button
                onClick={handleConfirmCancel}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isDark
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Cancel Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <PackagePlus className="w-6 h-6" />
          Add Stock
        </h3>
        <button
          onClick={handleCancel}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
            isDark
              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          type="button"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Stock Name *"
          value={stockName}
          onChange={(e) => setStockName(e.target.value)}
          className={`p-2 rounded border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'}`}
          required
        />

        <input
          type="number"
          placeholder="Quantity *"
          min="1"
          value={quantity || ''}
          onChange={(e) => setQuantity(Number(e.target.value) || 0)}
          className={`p-2 rounded border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'}`}
          required
        />

        <input
          type="number"
          placeholder="Price *"
          min="0.01"
          step="0.01"
          value={price || ''}
          onChange={(e) => setPrice(Number(e.target.value) || 0)}
          className={`p-2 rounded border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'}`}
          required
        />

        <div className="flex gap-3 mt-2">
          <button
            onClick={handleCancel}
            className={`flex-1 px-4 py-2 rounded-lg font-medium ${
              isDark
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleSendToInvoice}
            disabled={!stockName || quantity <= 0 || price <= 0}
            className={`flex-1 px-4 py-2 rounded-lg font-medium ${
              (!stockName || quantity <= 0 || price <= 0)
                ? 'bg-gray-400 cursor-not-allowed'
                : isDark 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Send to Invoice
          </button>
        </div>

        {/* Debug info */}
        <div className="mt-4 p-2 bg-gray-800 text-white text-xs rounded">
          <div>Clicking "Send to Invoice" should navigate to billing/create_invoice</div>
          <div>Payload should include: stockData</div>
        </div>

        {/* Unsaved changes indicator */}
        {hasUnsavedChanges && (
          <div className={`text-xs p-2 rounded ${isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-50 text-yellow-700'}`}>
            ⚠️ You have unsaved changes
          </div>
        )}
      </div>
    </div>
  );
};

export default AddStock;