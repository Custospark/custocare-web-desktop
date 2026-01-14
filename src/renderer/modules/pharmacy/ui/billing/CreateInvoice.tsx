import React, { useState, useCallback, useEffect } from 'react';
import { FileText, ArrowLeft, Plus, Trash2, Check } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { cn } from '../../../../shared/utils/classNameUtils';
import type { RootState } from '../../../../app/store/store';
import { type AppDispatch } from '../../../../app/store/store';

interface StockItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  unitCost?: number;
  batchNumber?: string;
  supplierId?: string;
  invoiceNumber?: string;
}

interface CreateInvoiceProps {
  theme: 'light' | 'dark';
}

interface InvoiceItem extends StockItem {
  total: number;
}

const CreateInvoice: React.FC<CreateInvoiceProps> = ({ theme }) => {
  const dispatch = useDispatch<AppDispatch>();
  const isDark = theme === 'dark';

  // Get current navigation state from Redux
  const navigationState = useSelector((state: RootState) => 
    state.moduleNavigation.current
  );

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Process stock data from Redux navigation payload
  useEffect(() => {
    console.log('CreateInvoice: Current navigation state:', navigationState);
    
    if (navigationState.payload) {
      console.log('CreateInvoice: Navigation payload found:', navigationState.payload);
      
      // Extract stockData from payload
      const payload = navigationState.payload as { stockData?: StockItem | StockItem[] };
      
      if (payload.stockData) {
        console.log('CreateInvoice: Processing stockData:', payload.stockData);
        
        try {
          const items: StockItem[] = Array.isArray(payload.stockData) 
            ? payload.stockData 
            : [payload.stockData];
          
          const newInvoiceItems = items.map(item => ({
            ...item,
            total: (item.price || item.unitCost || 0) * item.quantity
          }));

          console.log('CreateInvoice: Setting invoice items:', newInvoiceItems);
          setInvoiceItems(newInvoiceItems);
          
          // Clear payload after processing to avoid reprocessing
          dispatch({
            type: 'moduleNavigation/clearPayload'
          });
          
        } catch (error) {
          console.error('Error processing stock data:', error);
        }
      }
    }
  }, [navigationState.payload, dispatch]);

  const handleBackToAddStock = useCallback(() => {
    // Navigate using Redux dispatch
    dispatch({
      type: 'moduleNavigation/navigate',
      payload: {
        operation: 'inventory',
        action: 'add_stock',
        timestamp: Date.now(),
      }
    });
  }, [dispatch]);

  const handleAddMoreItems = useCallback(() => {
    // Navigate back to add stock with existing items
    dispatch({
      type: 'moduleNavigation/navigate',
      payload: {
        operation: 'inventory',
        action: 'add_stock',
        payload: {
          returnToInvoice: true,
          existingItems: invoiceItems,
        },
        timestamp: Date.now(),
      }
    });
  }, [dispatch, invoiceItems]);

  const handleRemoveItem = useCallback((itemId: number) => {
    setInvoiceItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const handleUpdateQuantity = useCallback((itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setInvoiceItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, total: (item.price || 0) * newQuantity }
        : item
    ));
  }, []);

  const handleUpdatePrice = useCallback((itemId: number, newPrice: number) => {
    if (newPrice < 0) return;
    
    setInvoiceItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, price: newPrice, total: newPrice * item.quantity }
        : item
    ));
  }, []);

  const calculateSubtotal = useCallback(() => {
    return invoiceItems.reduce((sum, item) => sum + item.total, 0);
  }, [invoiceItems]);

  const calculateTax = useCallback(() => {
    const subtotal = calculateSubtotal();
    return subtotal * 0.1; // 10% tax
  }, [calculateSubtotal]);

  const calculateTotal = useCallback(() => {
    return calculateSubtotal() + calculateTax();
  }, [calculateSubtotal, calculateTax]);

  const handleProcessInvoice = useCallback(async () => {
    if (invoiceItems.length === 0) {
      alert('Please add items to the invoice');
      return;
    }

    if (!customerName.trim()) {
      alert('Please enter customer name');
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const invoiceData = {
        id: Date.now(),
        customerName,
        customerEmail,
        items: invoiceItems,
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        total: calculateTotal(),
        notes,
        date: new Date().toISOString(),
      };

      // Navigate to invoice preview
      dispatch({
        type: 'moduleNavigation/navigate',
        payload: {
          operation: 'billing',
          action: 'invoice_preview',
          payload: { invoiceData },
          timestamp: Date.now(),
        }
      });
      
    } catch (error) {
      console.error('Error processing invoice:', error);
      alert('Failed to process invoice. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [invoiceItems, customerName, customerEmail, notes, calculateSubtotal, calculateTax, calculateTotal, dispatch]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Debug info - Remove in production */}
      

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-500" />
          <div>
            <h2 className="text-xl font-semibold">Create Invoice</h2>
            <p className="text-sm text-gray-500">
              Generate invoice from stock items
            </p>
          </div>
        </div>
        
        <button
          onClick={handleBackToAddStock}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
            isDark
              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Add Stock
        </button>
      </div>

      {/* Customer Information */}
      <div className={cn(
        'p-4 rounded-lg border',
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      )}>
        <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={cn(
              'block text-sm font-medium mb-2',
              isDark ? 'text-gray-300' : 'text-gray-700'
            )}>
              Customer Name *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className={cn(
                'w-full px-4 py-2 rounded-lg border text-sm',
                'focus:outline-none focus:ring-2 focus:ring-offset-1',
                isDark
                  ? 'bg-gray-800 border-gray-700 text-gray-300 focus:ring-blue-500'
                  : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
              )}
              placeholder="Enter customer name"
              required
            />
          </div>
          <div>
            <label className={cn(
              'block text-sm font-medium mb-2',
              isDark ? 'text-gray-300' : 'text-gray-700'
            )}>
              Customer Email
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className={cn(
                'w-full px-4 py-2 rounded-lg border text-sm',
                'focus:outline-none focus:ring-2 focus:ring-offset-1',
                isDark
                  ? 'bg-gray-800 border-gray-700 text-gray-300 focus:ring-blue-500'
                  : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
              )}
              placeholder="customer@example.com"
            />
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      <div className={cn(
        'p-4 rounded-lg border',
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      )}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Invoice Items</h3>
          <button
            onClick={handleAddMoreItems}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
              isDark
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
            type="button"
          >
            <Plus className="w-4 h-4" />
            Add More Items
          </button>
        </div>

        {invoiceItems.length === 0 ? (
          <div className="text-center py-8">
            <p className={cn(
              'mb-4',
              isDark ? 'text-gray-400' : 'text-gray-600'
            )}>
              No items added to invoice yet.
            </p>
            <button
              onClick={handleAddMoreItems}
              className={cn(
                'px-4 py-2 rounded-lg font-medium',
                isDark
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              Add Items from Stock
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={cn(
                  'border-b',
                  isDark ? 'border-gray-800' : 'border-gray-200'
                )}>
                  <th className="py-3 px-4 text-left font-semibold">Item</th>
                  <th className="py-3 px-4 text-left font-semibold">Quantity</th>
                  <th className="py-3 px-4 text-left font-semibold">Unit Price</th>
                  <th className="py-3 px-4 text-left font-semibold">Total</th>
                  <th className="py-3 px-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoiceItems.map((item) => (
                  <tr 
                    key={item.id} 
                    className={cn(
                      'border-b hover:bg-opacity-50',
                      isDark 
                        ? 'border-gray-800 hover:bg-gray-800/30' 
                        : 'border-gray-100 hover:bg-gray-50'
                    )}
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.batchNumber && (
                          <p className="text-xs text-gray-500">
                            Batch: {item.batchNumber}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                        className={cn(
                          'w-20 px-2 py-1 rounded border text-sm',
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-gray-300'
                            : 'bg-white border-gray-300 text-gray-700'
                        )}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => handleUpdatePrice(item.id, parseFloat(e.target.value) || 0)}
                          className={cn(
                            'w-32 pl-8 pr-2 py-1 rounded border text-sm',
                            isDark
                              ? 'bg-gray-800 border-gray-700 text-gray-300'
                              : 'bg-white border-gray-300 text-gray-700'
                          )}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {formatCurrency(item.total)}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className={cn(
                          'p-2 rounded-lg transition-colors',
                          isDark
                            ? 'text-red-400 hover:bg-red-900/30 hover:text-red-300'
                            : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                        )}
                        type="button"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Summary */}
      {invoiceItems.length > 0 && (
        <div className={cn(
          'p-4 rounded-lg border',
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        )}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Notes */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={cn(
                  'w-full h-32 px-4 py-3 rounded-lg border text-sm resize-none',
                  'focus:outline-none focus:ring-2 focus:ring-offset-1',
                  isDark
                    ? 'bg-gray-800 border-gray-700 text-gray-300 focus:ring-blue-500'
                    : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500'
                )}
                placeholder="Add any notes or special instructions..."
              />
            </div>

            {/* Totals */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Invoice Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Subtotal</span>
                  <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Tax (10%)</span>
                  <span className="font-medium">{formatCurrency(calculateTax())}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className={cn(
                    'text-lg font-semibold',
                    isDark ? 'text-gray-300' : 'text-gray-800'
                  )}>
                    Total
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>

              <button
                onClick={handleProcessInvoice}
                disabled={isProcessing || invoiceItems.length === 0 || !customerName.trim()}
                className={cn(
                  'w-full mt-6 px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2',
                  isDark
                    ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-600/50'
                    : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-600/50'
                )}
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Process Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateInvoice;