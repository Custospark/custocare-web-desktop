// MRBillingReview.tsx
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  FileText,
  ChevronRight,
  Search,
  Receipt,
  DollarSign,
  CreditCard,
  Wallet,
  Banknote,
  Shield,
  AlertCircle,
  Printer,
  RotateCcw,
  XCircle,
  CheckCircle,
  Download,
  Mail,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  ArrowUpDown,
} from 'lucide-react';
import { FaCashRegister } from 'react-icons/fa';
import { formatCurrency } from '../visit-action-center/billing-space';

// Mock data types
interface MockPatient {
  id: number;
  name: string;
  patient_number: string;
  email?: string;
  phone?: string;
}

interface MockChargeItem {
  id: number;
  service: {
    id: number;
    name: string;
    code: string;
    unitPrice: number;
    category: string;
  };
  quantity: number;
  totalAmount: number;
  isRefunded?: boolean;
  refundedAmount?: number;
  refundReason?: string;
  refundDate?: string;
}

interface MockPaymentMethod {
  id: string;
  type: 'cash' | 'card' | 'insurance' | 'mobile' | 'mixed' | 'refund';
  amount: number;
  details?: string;
  reference?: string;
  status?: 'completed' | 'pending' | 'failed' | 'refunded';
  refundedAmount?: number;
  refundReference?: string;
  refundDate?: string;
}

interface RefundRecord {
  id: string;
  original_transaction_id: number;
  refund_receipt_number: string;
  refund_date: string;
  refund_time: string;
  amount: number;
  reason: string;
  processed_by: string;
  payment_methods: MockPaymentMethod[];
  items_refunded: number[]; // item ids
  status: 'completed' | 'pending' | 'processing';
}

interface MockTransaction {
  id: number;
  visit_id: number;
  receipt_number: string;
  date: string;
  time: string;
  patient: MockPatient;
  charge_items: MockChargeItem[];
  discount: {
    type: 'percentage' | 'fixed';
    value: number;
    reason?: string;
  };
  taxes: Array<{
    name: string;
    rate: number;
    amount: number;
    isRefunded?: boolean;
  }>;
  payment_methods: MockPaymentMethod[];
  billing_data: {
    subtotal: number;
    discountAmount: number;
    taxableAmount: number;
    taxTotal: number;
    grandTotal: number;
    totalPaid: number;
    balance: number;
    refundedTotal?: number;
    netAmount?: number;
  };
  additional_notes?: string;
  status: 'settled' | 'ready' | 'draft' | 'refunded' | 'partially_refunded';
  settled_by?: string;
  settled_at?: string;
  refunds?: RefundRecord[];
  isRefundable: boolean;
  refundDeadline?: string; // 90 days from settlement
}

// Enhanced mock data generator with refund scenarios
const generateMockTransactions = (): MockTransaction[] => {
  const patients: MockPatient[] = [
    { id: 1, name: 'John Smith', patient_number: 'PT-001', email: 'john.smith@email.com', phone: '+256 701 234567' },
    { id: 2, name: 'Mary Johnson', patient_number: 'PT-002', email: 'mary.j@email.com', phone: '+256 702 345678' },
    { id: 3, name: 'David Ochieng', patient_number: 'PT-003', email: 'david.ochieng@email.com', phone: '+256 703 456789' },
    { id: 4, name: 'Sarah Akello', patient_number: 'PT-004', email: 'sarah.a@email.com', phone: '+256 704 567890' },
    { id: 5, name: 'James Otieno', patient_number: 'PT-005', email: 'james.otieno@email.com', phone: '+256 705 678901' },
  ];

  const services = [
    { id: 1, name: 'Consultation', code: 'CONS', unitPrice: 50000, category: 'Consultation' },
    { id: 2, name: 'Malaria Test', code: 'LAB001', unitPrice: 25000, category: 'Laboratory' },
    { id: 3, name: 'Blood Pressure Check', code: 'VIT001', unitPrice: 15000, category: 'Vitals' },
    { id: 4, name: 'Paracetamol', code: 'PHARM001', unitPrice: 5000, category: 'Pharmacy' },
    { id: 5, name: 'Antibiotics', code: 'PHARM002', unitPrice: 35000, category: 'Pharmacy' },
    { id: 6, name: 'X-Ray Chest', code: 'RAD001', unitPrice: 85000, category: 'Radiology' },
    { id: 7, name: 'COVID-19 Test', code: 'LAB002', unitPrice: 75000, category: 'Laboratory' },
    { id: 8, name: 'Follow-up Visit', code: 'CONS002', unitPrice: 35000, category: 'Consultation' },
  ];

  const transactions: MockTransaction[] = [];
  
  for (let i = 1; i <= 25; i++) {
    const patient = patients[Math.floor(Math.random() * patients.length)];
    const numItems = Math.floor(Math.random() * 5) + 1; // 1-5 items
    const selectedServices: number[] = [];
    const charge_items: MockChargeItem[] = [];
    
    for (let j = 0; j < numItems; j++) {
      let serviceIndex;
      do {
        serviceIndex = Math.floor(Math.random() * services.length);
      } while (selectedServices.includes(serviceIndex));
      
      selectedServices.push(serviceIndex);
      const service = services[serviceIndex];
      const quantity = Math.floor(Math.random() * 3) + 1;
      
      charge_items.push({
        id: j + 1,
        service: {
          id: service.id,
          name: service.name,
          code: service.code,
          unitPrice: service.unitPrice,
          category: service.category,
        },
        quantity,
        totalAmount: service.unitPrice * quantity,
      });
    }
    
    const subtotal = charge_items.reduce((sum, item) => sum + item.totalAmount, 0);
    
    // Apply discount
    const hasDiscount = Math.random() > 0.5;
    const discountType = hasDiscount ? (Math.random() > 0.5 ? 'percentage' : 'fixed') : 'percentage';
    const discountValue = hasDiscount 
      ? (discountType === 'percentage' ? Math.floor(Math.random() * 15) + 5 : Math.floor(Math.random() * 30000) + 5000)
      : 0;
    
    const discountAmount = discountType === 'percentage' 
      ? (subtotal * discountValue) / 100 
      : discountValue;
    
    const taxes = [
      { name: 'VAT (18%)', rate: 18, amount: (subtotal - discountAmount) * 0.18 },
      { name: 'Service Charge (5%)', rate: 5, amount: (subtotal - discountAmount) * 0.05 },
    ];
    
    const taxTotal = taxes.reduce((sum, tax) => sum + tax.amount, 0);
    const grandTotal = subtotal - discountAmount + taxTotal;
    
    // Payment methods
    const numPayments = Math.floor(Math.random() * 2) + 1;
    const payment_methods: MockPaymentMethod[] = [];
    let remainingTotal = grandTotal;
    
    for (let p = 0; p < numPayments; p++) {
      const isLast = p === numPayments - 1;
      const types: Array<'cash' | 'card' | 'insurance' | 'mobile'> = 
        ['cash', 'card', 'insurance', 'mobile'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      const amount = isLast 
        ? remainingTotal 
        : Math.floor(remainingTotal * (Math.random() * 0.6 + 0.2));
      
      payment_methods.push({
        id: `pm_${i}_${p}`,
        type,
        amount,
        details: type === 'mobile' ? `2567${Math.floor(Math.random() * 10000000)}` : undefined,
        reference: type === 'card' ? `TXN${Math.random().toString(36).substr(2, 9)}` : undefined,
        status: 'completed',
      });
      
      remainingTotal -= amount;
    }
    
    const totalPaid = payment_methods.reduce((sum, pm) => sum + pm.amount, 0);
    const balance = grandTotal - totalPaid;
    
    // Generate date within last 90 days
    const date = new Date();
    const daysAgo = Math.floor(Math.random() * 90);
    date.setDate(date.getDate() - daysAgo);
    
    // Randomly make some transactions refunded or partially refunded
    const isRefunded = i % 7 === 0; // Every 7th transaction has refund
    const isPartiallyRefunded = i % 5 === 0; // Every 5th transaction is partially refunded
    
    let refunds: RefundRecord[] = [];
    let refundedTotal = 0;
    let transactionStatus: 'settled' | 'ready' | 'draft' | 'refunded' | 'partially_refunded' = 
      balance === 0 ? 'settled' : Math.random() > 0.7 ? 'draft' : 'ready';
    
    if (isRefunded && daysAgo < 30) { // Only refund if within 30 days
      const refundAmount = grandTotal;
      refundedTotal = refundAmount;
      transactionStatus = 'refunded';
      
      // Mark items as refunded
      charge_items.forEach(item => {
        item.isRefunded = true;
        item.refundedAmount = item.totalAmount;
        item.refundReason = 'Patient cancellation';
        item.refundDate = new Date(date.getTime() + 86400000).toISOString(); // Next day
      });
      
      // Create refund record
      refunds.push({
        id: `ref_${i}_1`,
        original_transaction_id: i,
        refund_receipt_number: `REF-${2024}${String(i).padStart(4, '0')}`,
        refund_date: new Date(date.getTime() + 86400000).toISOString().split('T')[0],
        refund_time: '10:30 AM',
        amount: refundAmount,
        reason: 'Patient requested cancellation',
        processed_by: 'Admin User',
        payment_methods: payment_methods.map(pm => ({
          ...pm,
          id: `ref_pm_${i}_${pm.id}`,
          type: 'refund',
          amount: -pm.amount,
          status: 'refunded',
          refundReference: `REF${Math.random().toString(36).substr(2, 9)}`,
        })),
        items_refunded: charge_items.map(item => item.id),
        status: 'completed',
      });
    } else if (isPartiallyRefunded && daysAgo < 30) {
      const refundAmount = Math.floor(grandTotal * 0.3); // 30% refund
      refundedTotal = refundAmount;
      transactionStatus = 'partially_refunded';
      
      // Mark some items as refunded
      charge_items.slice(0, 1).forEach(item => {
        item.isRefunded = true;
        item.refundedAmount = item.totalAmount;
        item.refundReason = 'Wrong item charged';
        item.refundDate = new Date(date.getTime() + 86400000).toISOString();
      });
      
      refunds.push({
        id: `ref_${i}_1`,
        original_transaction_id: i,
        refund_receipt_number: `REF-${2024}${String(i).padStart(4, '0')}`,
        refund_date: new Date(date.getTime() + 86400000).toISOString().split('T')[0],
        refund_time: '02:15 PM',
        amount: refundAmount,
        reason: 'Partial refund for incorrect charge',
        processed_by: 'Admin User',
        payment_methods: [{
          id: `ref_pm_${i}_1`,
          type: 'refund',
          amount: -refundAmount,
          details: 'Partial refund',
          status: 'completed',
          refundReference: `REF${Math.random().toString(36).substr(2, 9)}`,
        }],
        items_refunded: [1],
        status: 'completed',
      });
    }
    
    transactions.push({
      id: i,
      visit_id: 1000 + i,
      receipt_number: `REC-${2024}${String(i).padStart(4, '0')}`,
      date: date.toISOString().split('T')[0],
      time: `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} ${Math.random() > 0.5 ? 'AM' : 'PM'}`,
      patient,
      charge_items,
      discount: {
        type: discountType,
        value: discountValue,
        reason: hasDiscount ? 'Promotional discount' : undefined,
      },
      taxes,
      payment_methods,
      billing_data: {
        subtotal,
        discountAmount,
        taxableAmount: subtotal - discountAmount,
        taxTotal,
        grandTotal,
        totalPaid,
        balance,
        refundedTotal: refundedTotal || undefined,
        netAmount: grandTotal - refundedTotal,
      },
      additional_notes: Math.random() > 0.7 ? 'Patient requested receipt via email' : undefined,
      status: transactionStatus,
      settled_by: balance === 0 ? 'Admin User' : undefined,
      settled_at: balance === 0 ? new Date().toISOString() : undefined,
      refunds: refunds.length > 0 ? refunds : undefined,
      isRefundable: daysAgo < 90 && transactionStatus !== 'refunded',
      refundDeadline: new Date(date.getTime() + (90 * 86400000)).toISOString().split('T')[0],
    });
  }
  
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

interface MRBillingReviewProps {
  theme?: 'light' | 'dark';
}

export const MRBillingReview: React.FC<MRBillingReviewProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  const [transactions] = useState<MockTransaction[]>(generateMockTransactions);
  const [selectedTransaction, setSelectedTransaction] = useState<MockTransaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'patient'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundData, setRefundData] = useState<{
    transaction: MockTransaction | null;
    amount: number;
    reason: string;
    items: number[];
  }>({
    transaction: null,
    amount: 0,
    reason: '',
    items: [],
  });
  const [processingRefund, setProcessingRefund] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, message: '', type: 'info' });

  const receiptRef = useRef<HTMLDivElement>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Color scheme
  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      elevated: isDark ? 'bg-gray-900' : 'bg-white',
      hover: isDark ? 'hover:bg-gray-800/70' : 'hover:bg-gray-50',
      receipt: 'bg-white',
      selected: isDark ? 'bg-blue-900/30' : 'bg-blue-50',
      success: isDark ? 'bg-green-900/30' : 'bg-green-50',
      warning: isDark ? 'bg-yellow-900/30' : 'bg-yellow-50',
      error: isDark ? 'bg-red-900/30' : 'bg-red-50',
    },
    border: {
      primary: isDark ? 'border-gray-800' : 'border-gray-200',
      receipt: 'border-gray-300',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
      success: isDark ? 'text-green-400' : 'text-green-600',
      warning: isDark ? 'text-yellow-400' : 'text-yellow-600',
      error: isDark ? 'text-red-400' : 'text-red-600',
    },
    accent: {
      primary: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      text: 'text-white',
      light: isDark ? 'bg-blue-900/50' : 'bg-blue-50',
      border: isDark ? 'border-blue-700' : 'border-blue-200',
    },
    status: {
      draft: isDark ? 'bg-gray-600 text-white' : 'bg-gray-600 text-white',
      ready: isDark ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white',
      settled: isDark ? 'bg-green-500 text-white' : 'bg-green-600 text-white',
      refunded: isDark ? 'bg-purple-500 text-white' : 'bg-purple-600 text-white',
      partially_refunded: isDark ? 'bg-orange-500 text-white' : 'bg-orange-600 text-white',
    },
  };

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      // Search filter
      const matchesSearch = 
        transaction.receipt_number.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        transaction.patient.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        transaction.patient.patient_number.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        transaction.patient.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        transaction.patient.phone?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
      
      // Date range filter
      let matchesDateRange = true;
      if (dateRange.start && dateRange.end) {
        const transactionDate = new Date(transaction.date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        matchesDateRange = transactionDate >= startDate && transactionDate <= endDate;
      }
      
      return matchesSearch && matchesStatus && matchesDateRange;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.billing_data.grandTotal - b.billing_data.grandTotal;
          break;
        case 'patient':
          comparison = a.patient.name.localeCompare(b.patient.name);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, debouncedSearchTerm, statusFilter, dateRange, sortBy, sortOrder]);

  // Format date
  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get payment icon
  const paymentIcon = (type: string, status?: string) => {
    const iconClass = status === 'refunded' ? 'text-purple-500' : '';
    switch (type) {
      case 'cash':
        return <FaCashRegister className={`w-4 h-4 text-green-500 ${iconClass}`} />;
      case 'card':
        return <CreditCard className={`w-4 h-4 text-blue-500 ${iconClass}`} />;
      case 'insurance':
        return <Shield className={`w-4 h-4 text-purple-500 ${iconClass}`} />;
      case 'mobile':
        return <Banknote className={`w-4 h-4 text-yellow-500 ${iconClass}`} />;
      case 'refund':
        return <RotateCcw className="w-4 h-4 text-purple-500" />;
      default:
        return <Wallet className={`w-4 h-4 text-gray-500 ${iconClass}`} />;
    }
  };

  // Handle print receipt
  const handlePrintReceipt = useCallback(async () => {
    if (!selectedTransaction) return;
    
    setIsPrinting(true);
    
    try {
      // Simulate print preparation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create print window
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Popup blocked');
      }
      
      // Get receipt HTML
      const receiptContent = receiptRef.current?.innerHTML || '';
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${selectedTransaction.receipt_number}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              @media print {
                body { padding: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="receipt-print">
              ${receiptContent}
            </div>
            <div class="no-print" style="text-align: center; margin-top: 20px;">
              <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Print Receipt
              </button>
              <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                Close
              </button>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
      showNotification('Receipt ready for printing', 'success');
    } catch (error) {
      console.error('Print failed:', error);
      showNotification('Failed to prepare receipt for printing', 'error');
    } finally {
      setIsPrinting(false);
    }
  }, [selectedTransaction]);

  // Handle email receipt
  const handleEmailReceipt = useCallback(async () => {
    if (!selectedTransaction) return;
    
    setIsPrinting(true);
    
    try {
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      showNotification(`Receipt emailed to ${selectedTransaction.patient.email || 'patient'}`, 'success');
    } catch (error) {
      showNotification('Failed to send email', 'error');
    } finally {
      setIsPrinting(false);
    }
  }, [selectedTransaction]);

  // Handle download receipt
  const handleDownloadReceipt = useCallback(async () => {
    if (!selectedTransaction) return;
    
    setIsPrinting(true);
    
    try {
      // Simulate download
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In real implementation, this would generate PDF
      const receiptContent = receiptRef.current?.innerText || '';
      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${selectedTransaction.receipt_number}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      
      showNotification('Receipt downloaded', 'success');
    } catch (error) {
      showNotification('Failed to download receipt', 'error');
    } finally {
      setIsPrinting(false);
    }
  }, [selectedTransaction]);

  // Handle refund
  const handleRefund = useCallback(async () => {
    if (!refundData.transaction || refundData.amount <= 0 || !refundData.reason) {
      showNotification('Please fill all refund details', 'error');
      return;
    }
    
    setProcessingRefund(true);
    
    try {
      // Simulate refund processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, this would call API
      showNotification(
        `Refund of ${formatCurrency(refundData.amount)} processed successfully`,
        'success'
      );
      
      setShowRefundModal(false);
      setRefundData({ transaction: null, amount: 0, reason: '', items: [] });
      
      // Refresh transaction data (mock)
      // In real app, you'd refetch the transaction
    } catch (error) {
      showNotification('Refund failed. Please try again.', 'error');
    } finally {
      setProcessingRefund(false);
    }
  }, [refundData]);

  // Show notification
  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'info' }), 3000);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange({ start: '', end: '' });
    setSortBy('date');
    setSortOrder('desc');
  };

  return (
    <div className="h-full w-full overflow-hidden p-4 sm:p-5 lg:p-6 relative">
      {/* Notification */}
      {notification.show && (
        <div className={`absolute top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border ${
          notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {notification.type === 'error' && <XCircle className="w-5 h-5" />}
            {notification.type === 'info' && <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && refundData.transaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${colors.bg.primary} rounded-lg shadow-xl max-w-md w-full border ${colors.border.primary}`}>
            <div className="p-4 border-b ${colors.border.primary}">
              <h3 className={`text-lg font-bold ${colors.text.primary}`}>Process Refund</h3>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className={`block text-sm font-medium ${colors.text.secondary} mb-1`}>
                  Transaction
                </label>
                <div className={`p-3 ${colors.bg.secondary} rounded-lg border ${colors.border.primary}`}>
                  <p className={`font-medium ${colors.text.primary}`}>
                    {refundData.transaction.receipt_number}
                  </p>
                  <p className={`text-sm ${colors.text.secondary}`}>
                    {formatDisplayDate(refundData.transaction.date)}
                  </p>
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${colors.text.secondary} mb-1`}>
                  Refund Amount
                </label>
                <input
                  type="number"
                  value={refundData.amount}
                  onChange={(e) => setRefundData({
                    ...refundData,
                    amount: Math.min(
                      Number(e.target.value) || 0,
                      refundData.transaction?.billing_data.grandTotal || 0
                    )
                  })}
                  max={refundData.transaction.billing_data.grandTotal}
                  className={`w-full px-3 py-2 border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter amount"
                />
                <p className={`text-xs ${colors.text.tertiary} mt-1`}>
                  Max: {formatCurrency(refundData.transaction.billing_data.grandTotal)}
                </p>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${colors.text.secondary} mb-1`}>
                  Refund Reason
                </label>
                <select
                  value={refundData.reason}
                  onChange={(e) => setRefundData({ ...refundData, reason: e.target.value })}
                  className={`w-full px-3 py-2 border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">Select reason</option>
                  <option value="Patient cancellation">Patient cancellation</option>
                  <option value="Wrong item charged">Wrong item charged</option>
                  <option value="Duplicate payment">Duplicate payment</option>
                  <option value="Insurance adjustment">Insurance adjustment</option>
                  <option value="Service not provided">Service not provided</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${colors.text.secondary} mb-1`}>
                  Items to Refund
                </label>
                <div className={`border ${colors.border.primary} rounded-lg max-h-40 overflow-y-auto`}>
                  {refundData.transaction.charge_items.map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-center p-2 border-b last:border-b-0 ${colors.border.primary} cursor-pointer hover:${colors.bg.hover}`}
                    >
                      <input
                        type="checkbox"
                        checked={refundData.items.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRefundData({
                              ...refundData,
                              items: [...refundData.items, item.id],
                              amount: refundData.amount + item.totalAmount
                            });
                          } else {
                            setRefundData({
                              ...refundData,
                              items: refundData.items.filter(id => id !== item.id),
                              amount: refundData.amount - item.totalAmount
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className={`flex-1 text-sm ${colors.text.primary}`}>
                        {item.service.name}
                      </span>
                      <span className={`text-sm font-medium ${colors.text.primary}`}>
                        {formatCurrency(item.totalAmount)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className={`p-4 border-t ${colors.border.primary} flex justify-end gap-2`}>
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundData({ transaction: null, amount: 0, reason: '', items: [] });
                }}
                className={`px-4 py-2 border ${colors.border.primary} rounded-lg ${colors.text.secondary} hover:${colors.bg.hover}`}
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={processingRefund || refundData.amount <= 0 || !refundData.reason}
                className={`px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {processingRefund ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    Process Refund
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 h-full min-h-0">
        {/* LEFT PANEL: Transaction List */}
        <div className={`flex flex-col h-full min-h-0 border ${colors.border.primary} ${colors.bg.primary} rounded-lg shadow-sm overflow-hidden`}>
          {/* Header with filters */}
          <div className={`flex-shrink-0 px-4 py-3 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm sm:text-base font-bold ${colors.text.primary}`}>
                Visit Records
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg ${colors.bg.hover} ${colors.text.secondary}`}
                  title="Toggle filters"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
                <span className={`text-xs ${colors.text.secondary} px-2 py-1 rounded-full ${
                  isDark ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  {filteredTransactions.length} transactions
                </span>
              </div>
            </div>
            
            {/* Search bar */}
            <div className="relative mb-3">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${colors.text.tertiary}`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by receipt, patient, email, phone..."
                className={`w-full pl-9 pr-4 py-2 text-sm border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            
            {/* Advanced filters */}
            {showFilters && (
              <div className="space-y-3 mt-3 pt-3 border-t ${colors.border.primary}">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-xs ${colors.text.secondary} mb-1`}>From</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className={`w-full px-2 py-1.5 text-sm border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs ${colors.text.secondary} mb-1`}>To</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className={`w-full px-2 py-1.5 text-sm border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className={`text-sm border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="date">Date</option>
                      <option value="amount">Amount</option>
                      <option value="patient">Patient</option>
                    </select>
                    
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className={`p-1.5 rounded-lg ${colors.bg.hover} ${colors.text.secondary}`}
                    >
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={clearFilters}
                    className={`text-xs ${colors.text.secondary} hover:${colors.text.primary} flex items-center gap-1`}
                  >
                    <RefreshCw className="w-3 h-3" />
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Scrollable transaction list */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" style={{ scrollbarGutter: 'stable' }}>
            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 p-4">
                <FileText className={`w-12 h-12 ${colors.text.tertiary} mb-3`} />
                <p className={`text-sm ${colors.text.secondary} text-center`}>
                  No transactions found
                </p>
                {(searchTerm || statusFilter !== 'all' || dateRange.start) && (
                  <button
                    onClick={clearFilters}
                    className="mt-2 text-blue-500 text-sm hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    onClick={() => setSelectedTransaction(transaction)}
                    className={`p-3 border ${colors.border.primary} rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedTransaction?.id === transaction.id
                        ? `${colors.bg.selected} border-blue-300 dark:border-blue-700 shadow-md`
                        : `${colors.bg.hover} hover:shadow-sm`
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs font-mono font-bold ${colors.text.primary}`}>
                            {transaction.receipt_number}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.status[transaction.status]}`}>
                            {transaction.status.replace('_', ' ')}
                          </span>
                          {transaction.refunds && transaction.refunds.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                              Refunded
                            </span>
                          )}
                        </div>
                        <h4 className={`text-sm font-semibold ${colors.text.primary} truncate`}>
                          {transaction.patient.name}
                        </h4>
                        <p className={`text-xs ${colors.text.secondary}`}>
                          {transaction.patient.patient_number}
                        </p>
                        {transaction.patient.email && (
                          <p className={`text-xs ${colors.text.tertiary} truncate`}>
                            {transaction.patient.email}
                          </p>
                        )}
                      </div>
                      <ChevronRight className={`w-5 h-5 ${colors.text.tertiary} flex-shrink-0`} />
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className={`w-3.5 h-3.5 ${colors.text.secondary}`} />
                        <span className={colors.text.secondary}>{formatDisplayDate(transaction.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className={`w-3.5 h-3.5 ${colors.text.secondary}`} />
                        <span className={colors.text.secondary}>{transaction.time}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 pt-2 border-t ${colors.border.primary}">
                      <div className="flex items-center gap-1">
                        <DollarSign className={`w-3.5 h-3.5 ${colors.text.secondary}`} />
                        <span className={`text-sm font-bold ${
                          transaction.billing_data.refundedTotal
                            ? 'text-purple-600 dark:text-purple-400'
                            : colors.text.primary
                        }`}>
                          {formatCurrency(transaction.billing_data.grandTotal)}
                          {transaction.billing_data.refundedTotal && (
                            <span className="text-xs text-purple-500 ml-1">
                              (Ref: {formatCurrency(transaction.billing_data.refundedTotal)})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {transaction.payment_methods.map((method, idx) => (
                          <div
                            key={method.id}
                            className="flex items-center"
                            title={`${method.type}: ${formatCurrency(method.amount)}${method.status === 'refunded' ? ' (Refunded)' : ''}`}
                          >
                            {paymentIcon(method.type, method.status)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer summary */}
          <div className={`flex-shrink-0 px-4 py-3 border-t ${colors.border.primary} ${colors.bg.secondary}`}>
            <div className="flex items-start gap-2">
              <AlertCircle className={`w-4 h-4 ${colors.text.tertiary} flex-shrink-0 mt-0.5`} />
              <p className={`text-xs ${colors.text.secondary} leading-relaxed`}>
                Click on any transaction to view detailed receipt
              </p>
            </div>
          </div>
        </div>
        
        {/* RIGHT PANEL: Receipt View */}
        <div className={`flex flex-col h-full min-h-0 border ${colors.border.primary} ${colors.bg.primary} rounded-lg shadow-sm overflow-hidden`}>
          {/* Fixed header with actions */}
          <div className={`flex-shrink-0 px-4 py-3 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className={`w-5 h-5 ${colors.text.secondary}`} />
                <h3 className={`text-sm sm:text-base font-bold ${colors.text.primary}`}>
                  Receipt Details
                </h3>
              </div>
              
              {selectedTransaction && (
                <div className="flex items-center gap-2">
                  {/* Print button */}
                  <button
                    onClick={handlePrintReceipt}
                    disabled={isPrinting}
                    className={`p-2 rounded-lg ${colors.bg.hover} ${colors.text.secondary} hover:text-blue-500 transition-colors`}
                    title="Print Receipt"
                  >
                    {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                  </button>
                  
                  {/* Email button */}
                  {selectedTransaction.patient.email && (
                    <button
                      onClick={handleEmailReceipt}
                      disabled={isPrinting}
                      className={`p-2 rounded-lg ${colors.bg.hover} ${colors.text.secondary} hover:text-green-500 transition-colors`}
                      title="Email Receipt"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                  )}
                  
                  {/* Download button */}
                  <button
                    onClick={handleDownloadReceipt}
                    disabled={isPrinting}
                    className={`p-2 rounded-lg ${colors.bg.hover} ${colors.text.secondary} hover:text-purple-500 transition-colors`}
                    title="Download Receipt"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  
                  {/* Refund button */}
                  {selectedTransaction.isRefundable && (
                    <button
                      onClick={() => {
                        setRefundData({
                          transaction: selectedTransaction,
                          amount: 0,
                          reason: '',
                          items: [],
                        });
                        setShowRefundModal(true);
                      }}
                      className={`p-2 rounded-lg ${colors.bg.hover} ${colors.text.secondary} hover:text-purple-500 transition-colors`}
                      title="Process Refund"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className={`text-xs ${colors.text.secondary} mt-0.5`}>
              {selectedTransaction ? 'Transaction receipt preview' : 'Select a transaction to view receipt'}
            </p>
          </div>
          
          {/* Scrollable receipt area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0" style={{ scrollbarGutter: 'stable' }}>
            {!selectedTransaction ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Receipt className={`w-16 h-16 ${colors.text.tertiary} mb-3`} />
                <p className={`text-sm ${colors.text.secondary} text-center`}>
                  Select a transaction from the left panel to view the receipt
                </p>
              </div>
            ) : (
              <div className="mx-auto w-full max-w-[400px]" ref={receiptRef}>
                {/* Receipt Card */}
                <div className={`border ${colors.border.receipt} bg-white text-black p-5 rounded-lg shadow-lg relative`}>
                  {/* Refund watermark if applicable */}
                  {selectedTransaction.status === 'refunded' && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-[-30deg] opacity-10 pointer-events-none">
                      <span className="text-6xl font-bold text-purple-600">REFUNDED</span>
                    </div>
                  )}
                  
                  {/* Receipt Header */}
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-extrabold">MEDICAL CLINIC</h2>
                    <p className="text-xs text-gray-600 mt-1">123 Health Street, Kampala</p>
                    <p className="text-xs text-gray-600">Phone: +256 700 000 000</p>
                  </div>
                  
                  {/* Receipt Meta */}
                  <div className="border-t border-b border-gray-300 py-2 my-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Receipt:</span>
                      <span className="font-bold">{selectedTransaction.receipt_number}</span>
                    </div>
                    {selectedTransaction.refunds?.map(refund => (
                      <div key={refund.id} className="flex justify-between text-purple-600">
                        <span>Refund Receipt:</span>
                        <span className="font-bold">{refund.refund_receipt_number}</span>
                      </div>
                    ))}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Patient:</span>
                      <span className="font-semibold">{selectedTransaction.patient.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Patient #:</span>
                      <span>{selectedTransaction.patient.patient_number}</span>
                    </div>
                    {selectedTransaction.patient.email && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="text-xs">{selectedTransaction.patient.email}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span>{formatDisplayDate(selectedTransaction.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span>{selectedTransaction.time}</span>
                    </div>
                    {selectedTransaction.settled_by && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Settled by:</span>
                        <span>{selectedTransaction.settled_by}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Services */}
                  <div className="mb-3">
                    <h3 className="text-sm font-extrabold mb-2">Services rendered</h3>
                    <div className="space-y-2">
                      {selectedTransaction.charge_items.map((item) => (
                        <div key={item.id} className={`flex justify-between text-xs border-b border-gray-100 pb-1.5 ${
                          item.isRefunded ? 'text-gray-400 line-through' : ''
                        }`}>
                          <div className="min-w-0 pr-2 flex-1">
                            <p className="font-semibold truncate">{item.service.name}</p>
                            <p className="text-[11px] text-gray-600">
                              {item.quantity} × {formatCurrency(item.service.unitPrice)}
                              {item.isRefunded && (
                                <span className="text-purple-600 ml-2">(Refunded)</span>
                              )}
                            </p>
                          </div>
                          <span className="font-extrabold flex-shrink-0">
                            {item.isRefunded ? '-' : ''}{formatCurrency(item.totalAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Totals */}
                  <div className="border-t border-gray-300 pt-2 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold">{formatCurrency(selectedTransaction.billing_data.subtotal)}</span>
                    </div>
                    
                    {selectedTransaction.discount.value > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Discount {selectedTransaction.discount.type === 'percentage' 
                          ? `(${selectedTransaction.discount.value}%)` 
                          : ''}</span>
                        <span className="font-semibold">-{formatCurrency(selectedTransaction.billing_data.discountAmount)}</span>
                      </div>
                    )}
                    
                    {selectedTransaction.taxes.map((tax, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{tax.name}</span>
                        <span className="font-semibold">{formatCurrency(tax.amount)}</span>
                      </div>
                    ))}
                    
                    <div className="flex justify-between font-extrabold text-sm mt-2 pt-2 border-t border-gray-300">
                      <span>TOTAL</span>
                      <span>{formatCurrency(selectedTransaction.billing_data.grandTotal)}</span>
                    </div>
                    
                    {selectedTransaction.billing_data.refundedTotal && (
                      <div className="flex justify-between text-purple-600 font-bold">
                        <span>Refunded Amount</span>
                        <span>-{formatCurrency(selectedTransaction.billing_data.refundedTotal)}</span>
                      </div>
                    )}
                    
                    {selectedTransaction.billing_data.netAmount && (
                      <div className="flex justify-between font-bold text-sm pt-2 border-t border-gray-300">
                        <span>NET TOTAL</span>
                        <span>{formatCurrency(selectedTransaction.billing_data.netAmount)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-600">Status</span>
                      <span className={`font-extrabold ${
                        selectedTransaction.status === 'refunded' ? 'text-purple-700' :
                        selectedTransaction.billing_data.balance === 0
                          ? 'text-green-700'
                          : 'text-yellow-700'
                      }`}>
                        {selectedTransaction.status === 'refunded' ? 'REFUNDED' :
                         selectedTransaction.status === 'partially_refunded' ? 'PARTIALLY REFUNDED' :
                         selectedTransaction.billing_data.balance === 0 
                          ? 'PAID' 
                          : `DUE ${formatCurrency(selectedTransaction.billing_data.balance)}`}
                      </span>
                    </div>
                  </div>
                  
                  {/* Payment Methods */}
                  <div className="mt-3 pt-3 border-t border-gray-300 text-xs">
                    <h3 className="text-sm font-extrabold mb-2">Payment</h3>
                    <div className="space-y-1.5">
                      {selectedTransaction.payment_methods.map((method) => (
                        <div key={method.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {paymentIcon(method.type)}
                            <span className="capitalize">{method.type}</span>
                            {method.details && (
                              <span className="text-[10px] text-gray-500">({method.details})</span>
                            )}
                            {method.reference && (
                              <span className="text-[10px] text-gray-500">Ref: {method.reference}</span>
                            )}
                            {method.status === 'refunded' && (
                              <span className="text-[10px] text-purple-600">(Refunded)</span>
                            )}
                          </div>
                          <span className={`font-semibold ${
                            method.type === 'refund' ? 'text-purple-600' : ''
                          }`}>
                            {method.type === 'refund' ? '-' : ''}{formatCurrency(method.amount)}
                          </span>
                        </div>
                      ))}
                      
                      {/* Refund records */}
                      {selectedTransaction.refunds?.map((refund) => (
                        <div key={refund.id} className="mt-2 pt-2 border-t border-gray-200">
                          <div className="flex items-center gap-2 text-purple-600 mb-1">
                            <RotateCcw className="w-3 h-3" />
                            <span className="text-xs font-bold">Refund {refund.refund_receipt_number}</span>
                          </div>
                          <div className="pl-5 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Date:</span>
                              <span>{formatDisplayDate(refund.refund_date)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Amount:</span>
                              <span className="font-semibold text-purple-600">-{formatCurrency(refund.amount)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Reason:</span>
                              <span>{refund.reason}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-600">Processed by:</span>
                              <span>{refund.processed_by}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <div className="flex justify-between pt-2 mt-2 border-t border-gray-200">
                        <span className="text-gray-600">Total Paid</span>
                        <span className="font-extrabold">{formatCurrency(selectedTransaction.billing_data.totalPaid)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Notes */}
                  {selectedTransaction.additional_notes && (
                    <div className="mt-3 pt-3 border-t border-gray-300 text-xs">
                      <h3 className="text-sm font-extrabold mb-1">Notes</h3>
                      <p className="text-gray-700 italic">{selectedTransaction.additional_notes}</p>
                    </div>
                  )}
                  
                  {/* Refund deadline if applicable */}
                  {selectedTransaction.isRefundable && selectedTransaction.refundDeadline && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                      <p className="text-yellow-800">
                        Refund available until {formatDisplayDate(selectedTransaction.refundDeadline)}
                      </p>
                    </div>
                  )}
                  
                  {/* Footer */}
                  <div className="text-center mt-4 pt-3 border-t border-gray-300">
                    <p className="text-[11px] text-gray-600">Computer generated receipt</p>
                    <p className="text-[11px] text-gray-600">Valid without signature</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer with action hints */}
          <div className={`flex-shrink-0 px-4 py-3 border-t ${colors.border.primary} ${colors.bg.secondary}`}>
            <div className="flex items-start gap-2">
              <AlertCircle className={`w-4 h-4 ${colors.text.tertiary} flex-shrink-0 mt-0.5`} />
              <p className={`text-xs ${colors.text.secondary} leading-relaxed`}>
                {selectedTransaction 
                  ? `Viewing receipt for ${selectedTransaction.patient.name}`
                  : 'Select a transaction to view its receipt details'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add the debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default MRBillingReview;