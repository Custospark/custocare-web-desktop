import React, { useState } from 'react';
import { useWorkspaceNavigation } from '../../../../app/store/hooks/useWorkspaceNavigation';
import { PackagePlus } from 'lucide-react';

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
  const navigation = useWorkspaceNavigation();
  const isDark = theme === 'dark';

  const [stockName, setStockName] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [price, setPrice] = useState(0);

  const handleSendToInvoice = () => {
    if (!stockName || quantity <= 0 || price <= 0) {
      console.error('Validation failed:', { stockName, quantity, price });
      alert('Please fill all fields with valid values');
      return;
    }

    const stockData: StockItem = {
      id: Date.now(),
      name: stockName,
      quantity,
      price,
    };

    console.log('Navigating to billing:create_invoice with data:', stockData);
    console.log('Current navigation state before:', navigation.current);

    // Send stock data to CreateInvoice view
    try {
      navigation.navigateTo('billing', 'create_invoice', { stockData });
      console.log('Navigation called successfully');
      
      // Check if navigation state changed
      setTimeout(() => {
        console.log('Current navigation state after:', navigation.current);
      }, 100);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <div className={`space-y-4 p-4 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <PackagePlus className="w-6 h-6" />
        Add Stock
      </h3>

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

        <button
          onClick={handleSendToInvoice}
          disabled={!stockName || quantity <= 0 || price <= 0}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            (!stockName || quantity <= 0 || price <= 0)
              ? 'bg-gray-400 cursor-not-allowed'
              : isDark 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Send to Invoice
        </button>

        {/* Debug info */}
        <div className="mt-4 p-2 bg-gray-800 text-white text-xs rounded">
          <div>Current Operation: {navigation.current?.operation}</div>
          <div>Current Action: {navigation.current?.action}</div>
          <div>Can go back: {navigation.canGoBack?.() ? 'Yes' : 'No'}</div>
        </div>
      </div>
    </div>
  );
};

export default AddStock;