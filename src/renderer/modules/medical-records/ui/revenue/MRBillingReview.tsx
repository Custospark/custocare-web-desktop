// MRBillingReview.tsx
import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  FileText,
  ChevronRight,
  Search,
  Filter,
  Receipt,
  DollarSign,
  CreditCard,
  Wallet,
  Banknote,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { FaCashRegister } from 'react-icons/fa';
import { formatCurrency } from '../visit-action-center/billing-space';
// Mock data types
interface MockPatient {
  id: number;
  name: string;
  patient_number: string;
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
}

interface MockPaymentMethod {
  type: 'cash' | 'card' | 'insurance' | 'mobile' | 'mixed';
  amount: number;
  details?: string;
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
  };
  additional_notes?: string;
  status: 'settled' | 'ready' | 'draft';
  settled_by?: string;
  settled_at?: string;
}

// Mock data generator
const generateMockTransactions = (): MockTransaction[] => {
  const patients: MockPatient[] = [
    { id: 1, name: 'John Smith', patient_number: 'PT-001' },
    { id: 2, name: 'Mary Johnson', patient_number: 'PT-002' },
    { id: 3, name: 'David Ochieng', patient_number: 'PT-003' },
    { id: 4, name: 'Sarah Akello', patient_number: 'PT-004' },
    { id: 5, name: 'James Otieno', patient_number: 'PT-005' },
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

  // Generate 15 mock transactions with varying dates and amounts
  const transactions: MockTransaction[] = [];
  
  for (let i = 1; i <= 15; i++) {
    const patient = patients[Math.floor(Math.random() * patients.length)];
    const numItems = Math.floor(Math.random() * 4) + 1; // 1-4 items
    const selectedServices: number[] = [];
    const charge_items: MockChargeItem[] = [];
    
    // Select random services
    for (let j = 0; j < numItems; j++) {
      let serviceIndex;
      do {
        serviceIndex = Math.floor(Math.random() * services.length);
      } while (selectedServices.includes(serviceIndex));
      
      selectedServices.push(serviceIndex);
      const service = services[serviceIndex];
      const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
      
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
    
    // Calculate subtotal
    const subtotal = charge_items.reduce((sum, item) => sum + item.totalAmount, 0);
    
    // Apply discount (50% chance)
    const hasDiscount = Math.random() > 0.5;
    const discountType = hasDiscount ? (Math.random() > 0.5 ? 'percentage' : 'fixed') : 'percentage';
    const discountValue = hasDiscount 
      ? (discountType === 'percentage' ? Math.floor(Math.random() * 15) + 5 : Math.floor(Math.random() * 30000) + 5000)
      : 0;
    
    const discountAmount = discountType === 'percentage' 
      ? (subtotal * discountValue) / 100 
      : discountValue;
    
    // Taxes (VAT and Service)
    const taxes = [
      { name: 'VAT (18%)', rate: 18, amount: (subtotal - discountAmount) * 0.18 },
      { name: 'Service Charge (5%)', rate: 5, amount: (subtotal - discountAmount) * 0.05 },
    ];
    
    const taxTotal = taxes.reduce((sum, tax) => sum + tax.amount, 0);
    const grandTotal = subtotal - discountAmount + taxTotal;
    
    // Payment methods (mix of payment types)
    const numPayments = Math.floor(Math.random() * 2) + 1; // 1-2 payment methods
    const payment_methods: MockPaymentMethod[] = [];
    let remainingTotal = grandTotal;
    
    for (let p = 0; p < numPayments; p++) {
      const isLast = p === numPayments - 1;
      const types: Array<'cash' | 'card' | 'insurance' | 'mobile'> = 
        ['cash', 'card', 'insurance', 'mobile'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      const amount = isLast 
        ? remainingTotal 
        : Math.floor(remainingTotal * (Math.random() * 0.6 + 0.2)); // 20-80% of remaining
      
      payment_methods.push({
        type,
        amount,
        details: type === 'mobile' ? `2567${Math.floor(Math.random() * 10000000)}` : undefined,
      });
      
      remainingTotal -= amount;
    }
    
    const totalPaid = payment_methods.reduce((sum, pm) => sum + pm.amount, 0);
    const balance = grandTotal - totalPaid;
    
    // Generate date within last 30 days
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
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
      },
      additional_notes: Math.random() > 0.7 ? 'Patient requested receipt via email' : undefined,
      status: balance === 0 ? 'settled' : Math.random() > 0.7 ? 'draft' : 'ready',
      settled_by: balance === 0 ? 'Admin User' : undefined,
      settled_at: balance === 0 ? new Date().toISOString() : undefined,
    });
  }
  
  // Sort by date descending (most recent first)
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

  // Color scheme based on theme
  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      elevated: isDark ? 'bg-gray-900' : 'bg-white',
      hover: isDark ? 'hover:bg-gray-800/70' : 'hover:bg-gray-50',
      receipt: 'bg-white',
      selected: isDark ? 'bg-blue-900/30' : 'bg-blue-50',
    },
    border: {
      primary: isDark ? 'border-gray-800' : 'border-gray-200',
      receipt: 'border-gray-300',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
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
    },
  };

  // Filter transactions based on search and status
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.patient.patient_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Format date for display
  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get payment icon based on type
  const paymentIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <FaCashRegister className="w-4 h-4 text-green-500" />;
      case 'card':
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      case 'insurance':
        return <Shield className="w-4 h-4 text-purple-500" />;
      case 'mobile':
        return <Banknote className="w-4 h-4 text-yellow-500" />;
      default:
        return <Wallet className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="h-full w-full overflow-hidden p-4 sm:p-5 lg:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 h-full min-h-0">
        {/* LEFT PANEL: Transaction List */}
        <div className={`flex flex-col h-full min-h-0 border ${colors.border.primary} ${colors.bg.primary} rounded-lg shadow-sm overflow-hidden`}>
          {/* Header with filters */}
          <div className={`flex-shrink-0 px-4 py-3 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm sm:text-base font-bold ${colors.text.primary}`}>
                Visit Records
              </h3>
              <span className={`text-xs ${colors.text.secondary} bg-${isDark ? 'gray-700' : 'gray-100'} px-2 py-1 rounded-full`}>
                {filteredTransactions.length} transactions
              </span>
            </div>
            
            {/* Search bar */}
            <div className="relative mb-3">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${colors.text.tertiary}`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by receipt, patient name or ID..."
                className={`w-full pl-9 pr-4 py-2 text-sm border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            
            {/* Status filter */}
            <div className="flex items-center gap-2">
              <Filter className={`w-4 h-4 ${colors.text.secondary}`} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`text-sm border ${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="all">All Status</option>
                <option value="settled">Settled</option>
                <option value="ready">Ready</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
          
          {/* Scrollable transaction list */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" style={{ scrollbarGutter: 'stable' }}>
            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 p-4">
                <FileText className={`w-12 h-12 ${colors.text.tertiary} mb-3`} />
                <p className={`text-sm ${colors.text.secondary} text-center`}>
                  No transactions found
                </p>
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
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-mono font-bold ${colors.text.primary}`}>
                            {transaction.receipt_number}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.status[transaction.status]}`}>
                            {transaction.status}
                          </span>
                        </div>
                        <h4 className={`text-sm font-semibold ${colors.text.primary} truncate`}>
                          {transaction.patient.name}
                        </h4>
                        <p className={`text-xs ${colors.text.secondary}`}>
                          {transaction.patient.patient_number}
                        </p>
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
                        <span className={`text-sm font-bold ${colors.text.primary}`}>
                          {formatCurrency(transaction.billing_data.grandTotal)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {transaction.payment_methods.map((method, idx) => (
                          <div key={idx} className="flex items-center" title={`${method.type}: ${formatCurrency(method.amount)}`}>
                            {paymentIcon(method.type)}
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
          {/* Fixed header */}
          <div className={`flex-shrink-0 px-4 py-3 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
            <div className="flex items-center gap-2">
              <Receipt className={`w-5 h-5 ${colors.text.secondary}`} />
              <h3 className={`text-sm sm:text-base font-bold ${colors.text.primary}`}>
                Receipt Details
              </h3>
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
              <div className="mx-auto w-full max-w-[400px]">
                {/* Receipt Card - Borrowed from BillingSummaryStep */}
                <div className={`border ${colors.border.receipt} bg-white text-black p-5 rounded-lg shadow-lg`}>
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
                    <div className="flex justify-between">
                      <span className="text-gray-600">Patient:</span>
                      <span className="font-semibold">{selectedTransaction.patient.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Patient #:</span>
                      <span>{selectedTransaction.patient.patient_number}</span>
                    </div>
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
                        <div key={item.id} className="flex justify-between text-xs border-b border-gray-100 pb-1.5">
                          <div className="min-w-0 pr-2 flex-1">
                            <p className="font-semibold truncate">{item.service.name}</p>
                            <p className="text-[11px] text-gray-600">
                              {item.quantity} × {formatCurrency(item.service.unitPrice)}
                            </p>
                          </div>
                          <span className="font-extrabold flex-shrink-0">{formatCurrency(item.totalAmount)}</span>
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
                    
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-600">Status</span>
                      <span className={`font-extrabold ${
                        selectedTransaction.billing_data.balance === 0
                          ? 'text-green-700'
                          : 'text-yellow-700'
                      }`}>
                        {selectedTransaction.billing_data.balance === 0 
                          ? 'PAID' 
                          : `DUE ${formatCurrency(selectedTransaction.billing_data.balance)}`}
                      </span>
                    </div>
                  </div>
                  
                  {/* Payment Methods */}
                  <div className="mt-3 pt-3 border-t border-gray-300 text-xs">
                    <h3 className="text-sm font-extrabold mb-2">Payment</h3>
                    <div className="space-y-1.5">
                      {selectedTransaction.payment_methods.map((method, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {paymentIcon(method.type)}
                            <span className="capitalize">{method.type}</span>
                            {method.details && (
                              <span className="text-[10px] text-gray-500">({method.details})</span>
                            )}
                          </div>
                          <span className="font-semibold">{formatCurrency(method.amount)}</span>
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