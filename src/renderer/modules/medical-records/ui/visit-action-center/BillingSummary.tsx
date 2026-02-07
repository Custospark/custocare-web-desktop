import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Wallet,
  Banknote,
  Percent,
  Receipt,
  Printer,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Shield,
  X,
  Loader2,
} from 'lucide-react';
import { FaCashRegister } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { MEDICAL_RECORDS_ROUTES } from '../../../../app/routes/routeConstants';

// Mock data types
interface ChargeItem {
  service: {
    id: number;
    code: string;
    name: string;
    unitPrice: number;
    category: string;
  };
  quantity: number;
  totalAmount: number;
}

interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
  reason?: string;
}

interface Tax {
  name: string;
  rate: number;
  amount: number;
}

interface PaymentMethod {
  type: 'cash' | 'card' | 'insurance' | 'mobile' | 'mixed';
  amount: number;
  reference?: string;
  details?: string;
}

interface BillingSummaryProps {
  chargeItems?: ChargeItem[];
  initialTotal?: number;
  patientName?: string;
  patientId?: string;
  visitId?: string;
  onBack?: () => void;
  theme?: 'light' | 'dark';
}

export const BillingSummary: React.FC<BillingSummaryProps> = ({
  chargeItems = [],
  initialTotal = 0,
  patientName = 'John Doe',
  patientId = 'PT-2024-001',
  visitId = 'VIS-2024-001',
  onBack,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  
  // State
  const [subtotal, setSubtotal] = useState(initialTotal);
  const [discount, setDiscount] = useState<Discount>({ type: 'percentage', value: 0 });
  const [taxes, setTaxes] = useState<Tax[]>([
    { name: 'VAT (16%)', rate: 16, amount: 0 },
    { name: 'Service Charge', rate: 2, amount: 0 },
  ]);
  const [grandTotal, setGrandTotal] = useState(initialTotal);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod[]>([
    { type: 'cash', amount: 0, details: '' },
  ]);
  const [balance, setBalance] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setIsPrinted] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  
  // Colors based on theme
  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      elevated: isDark ? 'bg-gray-800' : 'bg-white',
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
    status: {
      success: isDark ? 'text-green-400' : 'text-green-600',
      warning: isDark ? 'text-yellow-400' : 'text-yellow-600',
      error: isDark ? 'text-red-400' : 'text-red-600',
      info: isDark ? 'text-blue-400' : 'text-blue-600',
    },
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };
      const navigate = useNavigate();
  
      /**
       * 
       * Note: On back,navigate to this route: "MEDICAL_RECORDS_ROUTES.ENTRY_CHAGRES."
       */
  // Generate receipt number
  const generateReceiptNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `REC-${year}${month}${day}-${random}`;
  };
  
  // Calculate totals
  useEffect(() => {
    // Calculate discount amount
    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = subtotal * (discount.value / 100);
    } else {
      discountAmount = discount.value;
    }
    
    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);
    
    // Calculate taxable amount
    const taxableAmount = subtotal - discountAmount;
    
    // Calculate taxes
    const updatedTaxes = taxes.map(tax => ({
      ...tax,
      amount: taxableAmount * (tax.rate / 100),
    }));
    setTaxes(updatedTaxes);
    
    // Calculate tax total
    const taxTotal = updatedTaxes.reduce((sum, tax) => sum + tax.amount, 0);
    
    // Calculate grand total
    const newGrandTotal = taxableAmount + taxTotal;
    setGrandTotal(newGrandTotal);
    
    // Calculate balance
    const totalPaid = paymentMethod.reduce((sum, method) => sum + method.amount, 0);
    setBalance(newGrandTotal - totalPaid);
  }, [subtotal, discount, paymentMethod, taxes]);
  
  // Initialize with charge items
  useEffect(() => {
    if (chargeItems.length > 0) {
      const total = chargeItems.reduce((sum, item) => sum + item.totalAmount, 0);
      setSubtotal(total);
    }
  }, [chargeItems]);
  
  // Initialize receipt number
  useEffect(() => {
    setReceiptNumber(generateReceiptNumber());
  }, []);
  
  // Handle discount change
  const handleDiscountChange = (type: 'percentage' | 'fixed', value: string) => {
    const numValue = parseFloat(value) || 0;
    setDiscount({ type, value: numValue });
  };
  
  // Handle payment method change
  const handlePaymentMethodChange = (index: number, field: keyof PaymentMethod, value: any) => {
    const updatedMethods = [...paymentMethod];
    updatedMethods[index] = {
      ...updatedMethods[index],
      [field]: value,
    };
    setPaymentMethod(updatedMethods);
  };
  
  // Add payment method
  const addPaymentMethod = () => {
    if (paymentMethod.length >= 3) return;
    setPaymentMethod([...paymentMethod, { type: 'cash', amount: 0, details: '' }]);
  };
  
  // Remove payment method
  const removePaymentMethod = (index: number) => {
    if (paymentMethod.length <= 1) return;
    setPaymentMethod(paymentMethod.filter((_, i) => i !== index));
  };
  
  // Auto-calculate remaining payment
  const autoCalculatePayment = (index: number) => {
    const totalPaid = paymentMethod.reduce((sum, method, i) => 
      i === index ? sum : sum + method.amount, 0
    );
    const remaining = Math.max(0, grandTotal - totalPaid);
    
    const updatedMethods = [...paymentMethod];
    updatedMethods[index].amount = remaining;
    setPaymentMethod(updatedMethods);
  };
  
  // Handle print receipt
  const handlePrintReceipt = () => {
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      setIsPrinted(true);
      setShowReceiptPreview(true);
      
      // In real app, this would trigger actual print
      window.print();
    }, 1000);
  };
  
  // Handle finalize payment
  const handleFinalizePayment = () => {
    if (balance > 0) {
      alert(`Balance of ${formatCurrency(balance)} still pending. Please adjust payment.`);
      return;
    }
    
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      alert('Payment processed successfully!');
      // In real app, navigate to success page or clear form
    }, 1500);
  };
  
  // Render receipt preview
  const renderReceiptPreview = () => (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50`}>
      <div className={`w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl ${colors.bg.elevated}`}>
        {/* Receipt Header */}
        <div className={`p-6 border-b ${colors.border.primary}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-bold ${colors.text.primary}`}>Receipt Preview</h3>
            <button
              onClick={() => setShowReceiptPreview(false)}
              className={`p-2 rounded-lg ${colors.bg.hover}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className={colors.text.secondary}>Review before printing</p>
        </div>
        
        {/* Receipt Content */}
        <div className="p-6">
          <div className={`p-6 border ${colors.border.primary} rounded-lg bg-white text-black`}>
            {/* Clinic Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-1">MEDICAL CLINIC</h2>
              <p className="text-sm text-gray-600">123 Health Street, Nairobi</p>
              <p className="text-sm text-gray-600">Phone: (254) 712-345-678</p>
            </div>
            
            <div className="border-t border-b border-gray-300 py-3 my-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Receipt:</span>
                <span className="font-bold">{receiptNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Date:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Time:</span>
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            
            {/* Patient Info */}
            <div className="mb-4">
              <h3 className="font-bold text-lg mb-2">Patient Information</h3>
              <div className="text-sm">
                <p><span className="font-medium">Name:</span> {patientName}</p>
                <p><span className="font-medium">ID:</span> {patientId}</p>
                <p><span className="font-medium">Visit:</span> {visitId}</p>
              </div>
            </div>
            
            {/* Items */}
            <div className="mb-4">
              <h3 className="font-bold text-lg mb-2">Services Rendered</h3>
              <div className="space-y-2">
                {chargeItems.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm border-b border-gray-100 pb-1">
                    <div>
                      <p className="font-medium">{item.service.name}</p>
                      <p className="text-xs text-gray-600">
                        {item.quantity} × {formatCurrency(item.service.unitPrice)}
                      </p>
                    </div>
                    <span className="font-bold">{formatCurrency(item.totalAmount)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Totals */}
            <div className="border-t border-gray-300 pt-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount.value > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(discount.type === 'percentage' ? subtotal * (discount.value / 100) : discount.value)}</span>
                </div>
              )}
              {taxes.map((tax, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{tax.name}:</span>
                  <span>{formatCurrency(tax.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-gray-300">
                <span>TOTAL:</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
            
            {/* Payment */}
            <div className="mt-4 pt-4 border-t border-gray-300">
              <h3 className="font-bold mb-2">Payment</h3>
              {paymentMethod.map((method, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="capitalize">{method.type}:</span>
                  <span>{formatCurrency(method.amount)}</span>
                </div>
              ))}
              {balance === 0 && (
                <div className="text-center mt-4 pt-4 border-t border-gray-300">
                  <p className="text-green-600 font-bold">PAID IN FULL</p>
                  <p className="text-xs text-gray-600 mt-1">Thank you for your payment</p>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="text-center mt-6 pt-4 border-t border-gray-300">
              <p className="text-xs text-gray-600">This is a computer generated receipt</p>
              <p className="text-xs text-gray-600">Valid without signature</p>
            </div>
          </div>
          
          {/* Print Actions */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={() => setShowReceiptPreview(false)}
              className={`px-4 py-2 rounded-lg border ${colors.border.primary} ${colors.bg.hover} ${colors.text.secondary}`}
            >
              Close
            </button>
            <button
              onClick={handlePrintReceipt}
              className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text}`}
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className={`rounded-xl border ${colors.border.primary} ${colors.bg.primary} overflow-hidden`}>
      {/* Header */}
      <div className={`p-6 border-b ${colors.border.primary}`}>
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Receipt className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <div>
              <h2 className={`text-xl font-bold ${colors.text.primary}`}>Billing Summary</h2>
              <p className={colors.text.secondary}>Apply discounts, taxes, and process payment</p>
            </div>
          </div>
          
          <div className={`px-4 py-2 rounded-lg ${colors.bg.secondary}`}>
            <div className="text-sm">
              <span className={colors.text.secondary}>Receipt: </span>
              <span className={`font-mono font-bold ${colors.text.primary}`}>{receiptNumber}</span>
            </div>
          </div>
        </div>
        
        {/* Patient Info and Navigation */}
        <div className="flex items-center justify-between gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
            <div className={`p-3 rounded-lg ${colors.bg.secondary}`}>
              <p className={`text-xs ${colors.text.secondary}`}>Patient</p>
              <p className={`font-medium ${colors.text.primary}`}>{patientName}</p>
            </div>
            <div className={`p-3 rounded-lg ${colors.bg.secondary}`}>
              <p className={`text-xs ${colors.text.secondary}`}>Patient ID</p>
              <p className={`font-medium ${colors.text.primary}`}>{patientId}</p>
            </div>
            <div className={`p-3 rounded-lg ${colors.bg.secondary}`}>
              <p className={`text-xs ${colors.text.secondary}`}>Visit ID</p>
              <p className={`font-medium ${colors.text.primary}`}>{visitId}</p>
            </div>
          </div>
          
          <button
            onClick={onBack}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${colors.border.primary} ${colors.bg.hover} ${colors.text.secondary} whitespace-nowrap`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Charges
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Items & Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items List */}
            <div className={`rounded-lg border ${colors.border.primary}`}>
              <div className={`p-4 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
                <h3 className={`font-semibold ${colors.text.primary}`}>
                  Selected Items ({chargeItems.length})
                </h3>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {chargeItems.length === 0 ? (
                  <div className="p-8 text-center">
                    <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${colors.text.tertiary}`} />
                    <p className={colors.text.secondary}>No items selected</p>
                  </div>
                ) : (
                  chargeItems.map((item, index) => (
                    <div key={index} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className={`font-medium ${colors.text.primary}`}>{item.service.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded ${colors.bg.secondary} ${colors.text.secondary}`}>
                              {item.service.code}
                            </span>
                            <span className={`text-xs ${colors.text.secondary}`}>
                              {item.quantity} × {formatCurrency(item.service.unitPrice)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${colors.text.primary}`}>
                            {formatCurrency(item.totalAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Discount & Tax Configuration */}
            <div className={`rounded-lg border ${colors.border.primary}`}>
              <div className={`p-4 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
                <h3 className={`font-semibold ${colors.text.primary}`}>Adjustments</h3>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Discount */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${colors.text.secondary}`}>
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      Discount
                    </div>
                  </label>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={discount.value}
                        onChange={(e) => handleDiscountChange(discount.type, e.target.value)}
                        min="0"
                        max={discount.type === 'percentage' ? 100 : subtotal}
                        className={`w-full px-4 py-2 rounded-lg border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary}`}
                      />
                    </div>
                    
                    <div className="flex border rounded-lg overflow-hidden">
                      <button
                        onClick={() => handleDiscountChange('percentage', discount.value.toString())}
                        className={`px-3 py-2 text-sm ${discount.type === 'percentage' ? colors.accent.primary + ' ' + colors.accent.text : colors.bg.hover + ' ' + colors.text.secondary}`}
                      >
                        %
                      </button>
                      <button
                        onClick={() => handleDiscountChange('fixed', discount.value.toString())}
                        className={`px-3 py-2 text-sm ${discount.type === 'fixed' ? colors.accent.primary + ' ' + colors.accent.text : colors.bg.hover + ' ' + colors.text.secondary}`}
                      >
                        Fixed
                      </button>
                    </div>
                  </div>
                  
                  {discount.value > 0 && (
                    <p className={`text-sm mt-2 ${colors.status.success}`}>
                      Discount: {formatCurrency(
                        discount.type === 'percentage' 
                          ? subtotal * (discount.value / 100)
                          : discount.value
                      )}
                    </p>
                  )}
                </div>
                
                {/* Taxes */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${colors.text.secondary}`}>
                    Taxes Applied
                  </label>
                  
                  <div className="space-y-2">
                    {taxes.map((tax, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-700 dark:border-gray-700">
                        <div>
                          <p className={`font-medium ${colors.text.primary}`}>{tax.name}</p>
                          <p className={`text-sm ${colors.text.secondary}`}>{tax.rate}% rate</p>
                        </div>
                        <p className={`font-bold ${colors.text.primary}`}>
                          {formatCurrency(tax.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Payment & Totals */}
          <div className="space-y-6">
            {/* Payment Methods */}
            <div className={`rounded-lg border ${colors.border.primary}`}>
              <div className={`p-4 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold ${colors.text.primary}`}>Payment Methods</h3>
                  {paymentMethod.length < 3 && (
                    <button
                      onClick={addPaymentMethod}
                      className={`text-xs px-2 py-1 rounded ${colors.bg.hover} ${colors.text.secondary}`}
                    >
                      + Add
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                {paymentMethod.map((method, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${colors.border.primary}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {method.type === 'cash' && <FaCashRegister className="w-4 h-4 text-green-500" />}
                        {method.type === 'card' && <CreditCard className="w-4 h-4 text-blue-500" />}
                        {method.type === 'insurance' && <Shield className="w-4 h-4 text-purple-500" />}
                        {method.type === 'mobile' && <Banknote className="w-4 h-4 text-yellow-500" />}
                        {method.type === 'mixed' && <Wallet className="w-4 h-4 text-gray-500" />}
                        
                        <select
                          value={method.type}
                          onChange={(e) => handlePaymentMethodChange(index, 'type', e.target.value)}
                          className={`text-sm bg-transparent ${colors.text.primary} capitalize`}
                        >
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                          <option value="insurance">Insurance</option>
                          <option value="mobile">Mobile Money</option>
                          <option value="mixed">Mixed</option>
                        </select>
                      </div>
                      
                      {paymentMethod.length > 1 && (
                        <button
                          onClick={() => removePaymentMethod(index)}
                          className={`p-1 rounded ${colors.bg.hover}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <input
                          type="number"
                          value={method.amount}
                          onChange={(e) => handlePaymentMethodChange(index, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="Amount"
                          className={`w-full px-3 py-1.5 rounded border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary}`}
                        />
                      </div>
                      
                      <button
                        onClick={() => autoCalculatePayment(index)}
                        className={`w-full text-xs px-2 py-1 rounded ${colors.bg.hover} ${colors.text.secondary}`}
                      >
                        Fill Remaining Balance
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className={`p-3 rounded-lg ${balance === 0 ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${balance === 0 ? 'text-green-500' : 'text-yellow-500'}`}>
                      Balance
                    </span>
                    <span className={`font-bold ${balance === 0 ? 'text-green-500' : 'text-yellow-500'}`}>
                      {balance === 0 ? 'Paid' : formatCurrency(balance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Totals Summary */}
            <div className={`rounded-lg border ${colors.border.primary}`}>
              <div className={`p-4 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
                <h3 className={`font-semibold ${colors.text.primary}`}>Bill Summary</h3>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={colors.text.secondary}>Subtotal</span>
                  <span className={`font-medium ${colors.text.primary}`}>
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                
                {discount.value > 0 && (
                  <div className="flex items-center justify-between text-green-500">
                    <span>Discount</span>
                    <span className="font-medium">
                      -{formatCurrency(
                        discount.type === 'percentage'
                          ? subtotal * (discount.value / 100)
                          : discount.value
                      )}
                    </span>
                  </div>
                )}
                
                {taxes.map((tax, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className={colors.text.secondary}>{tax.name}</span>
                    <span className={colors.text.secondary}>{formatCurrency(tax.amount)}</span>
                  </div>
                ))}
                
                <div className="pt-3 border-t border-gray-700 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-lg font-semibold ${colors.text.primary}`}>Grand Total</span>
                    <span className={`text-2xl font-bold ${colors.status.success}`}>
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${colors.text.secondary}`}>Total Paid</span>
                    <span className={`font-medium ${colors.text.primary}`}>
                      {formatCurrency(paymentMethod.reduce((sum, method) => sum + method.amount, 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Additional Notes */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${colors.text.secondary}`}>
                Additional Notes
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Add any notes about this payment..."
                rows={2}
                className={`w-full px-4 py-2 rounded-lg border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary}`}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setShowReceiptPreview(true)}
                disabled={chargeItems.length === 0}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium border ${colors.border.primary} ${colors.bg.hover} ${colors.text.secondary} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Receipt className="w-4 h-4" />
                Preview Receipt
              </button>
              
              <button
                onClick={handleFinalizePayment}
                disabled={isProcessing || chargeItems.length === 0 || balance > 0}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isProcessing || chargeItems.length === 0 || balance > 0
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : `${colors.accent.primary} ${colors.accent.hover} ${colors.accent.text}`
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Finalize Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Receipt Preview Modal */}
      {showReceiptPreview && renderReceiptPreview()}
    </div>
  );
};

export default BillingSummary;