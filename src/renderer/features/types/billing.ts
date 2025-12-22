export interface BillingItem {
  id: string;
  code: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  serviceDate: string;
  providerId?: string;
  visitId: string;
}

export interface InsuranceClaim {
  id: string;
  patientId: string;
  visitId: string;
  insuranceProvider: string;
  policyNumber: string;
  claimNumber: string;
  totalAmount: number;
  coveredAmount: number;
  patientResponsibility: number;
  status: 'PENDING' | 'SUBMITTED' | 'PROCESSING' | 'PAID' | 'DENIED' | 'APPEALED';
  submissionDate?: string;
  paymentDate?: string;
  denialReason?: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  visitId: string;
  invoiceNumber: string;
  items: BillingItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  balanceDue: number;
  status: 'DRAFT' | 'ISSUED' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'WRITTEN_OFF';
  issueDate: string;
  dueDate: string;
  payments: Payment[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'INSURANCE' | 'CHECK';
  transactionId?: string;
  paidBy?: string;
  receivedBy: string;
  paymentDate: string;
  notes?: string;
}

export interface BillingSummary {
  patientId: string;
  totalInvoices: number;
  totalBilled: number;
  totalPaid: number;
  totalDue: number;
  overdueAmount: number;
  insurancePending: number;
  recentInvoices: Invoice[];
}