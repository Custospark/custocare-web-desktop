import { BaseEntity} from './shared';
import { InsuranceType, PaginatedResponse,
  ApiResponse, } from './shared';
  export { PaginatedResponse,
  ApiResponse}

// Payment types
export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  INSURANCE = 'INSURANCE',
  CHECK = 'CHECK',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_MONEY = 'MOBILE_MONEY',
  OTHER = 'OTHER'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED'
}

export interface Payment extends BaseEntity {
  id: string;
  invoiceId: string;
  visitId: string;
  patientId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  receiptNumber: string;
  paidBy?: string;
  receivedBy: string;
  paymentDate: string;
  notes?: string;
  refundDetails?: {
    amount: number;
    reason: string;
    refundedBy: string;
    refundedAt: string;
  };
}

export interface PaymentCreateData {
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paidBy?: string;
  notes?: string;
  transactionId?: string;
}

export interface PaymentUpdateData {
  status?: PaymentStatus;
  notes?: string;
  refundDetails?: {
    amount: number;
    reason: string;
  };
}

export interface BillingItem extends BaseEntity {
  id: string;
  invoiceId: string;
  visitId: string;
  patientId: string;
  code: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  serviceDate: string;
  providerId?: string;
  category: 'CONSULTATION' | 'PROCEDURE' | 'LAB_TEST' | 'MEDICATION' | 'EQUIPMENT' | 'OTHER';
  insuranceCovered: boolean;
  coveredAmount?: number;
  patientResponsibility: number;
}

export interface BillingItemCreateData {
  visitId: string;
  patientId: string;
  code: string;
  description: string;
  quantity: number;
  unitPrice: number;
  category: BillingItem['category'];
  serviceDate: string;
  providerId?: string;
}

export enum InsuranceClaimStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  DENIED = 'DENIED',
  APPEALED = 'APPEALED',
  SETTLED = 'SETTLED'
}

export interface InsuranceClaim extends BaseEntity {
  id: string;
  claimNumber: string;
  patientId: string;
  visitId: string;
  invoiceId: string;
  insuranceProvider: string;
  policyNumber: string;
  type: InsuranceType;
  totalAmount: number;
  coveredAmount: number;
  patientResponsibility: number;
  status: InsuranceClaimStatus;
  submissionDate?: string;
  processingDate?: string;
  paymentDate?: string;
  denialReason?: string;
  appealNotes?: string;
  documents: string[]; // Document IDs or URLs
}

export interface InsuranceClaimCreateData {
  visitId: string;
  invoiceId: string;
  insuranceProvider: string;
  policyNumber: string;
  type: InsuranceType;
  documents?: string[];
}

export interface Invoice extends BaseEntity {
  id: string;
  invoiceNumber: string;
  patientId: string;
  visitId: string;
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
  insuranceClaims: InsuranceClaim[];
  notes?: string;
  isEmergency: boolean;
  requiresInsurance: boolean;
}

export interface InvoiceCreateData {
  visitId: string;
  patientId: string;
  items: BillingItemCreateData[];
  discount?: number;
  tax?: number;
  notes?: string;
  dueDate?: string;
}

export interface InvoiceUpdateData {
  items?: BillingItemCreateData[];
  discount?: number;
  tax?: number;
  status?: Invoice['status'];
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
  paymentHistory: Payment[];
  insuranceClaims: InsuranceClaim[];
}

// Filter types
export interface InvoiceFilterParams {
  patientId?: string;
  visitId?: string;
  status?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  facilityId?: string;
  page: number;
  limit: number;
}

export interface PaymentFilterParams {
  patientId?: string;
  visitId?: string;
  invoiceId?: string;
  status?: PaymentStatus[];
  paymentMethod?: PaymentMethod[];
  dateRange?: {
    start: string;
    end: string;
  };
  page: number;
  limit: number;
}

export interface ClaimFilterParams {
  patientId?: string;
  visitId?: string;
  status?: InsuranceClaimStatus[];
  dateRange?: {
    start: string;
    end: string;
  };
  page: number;
  limit: number;
}

// Statistics types
export interface BillingStatistics {
  totalRevenue: number;
  outstandingBalance: number;
  averagePaymentTime: number; // days
  byPaymentMethod: Record<PaymentMethod, number>;
  byInsuranceStatus: Record<InsuranceClaimStatus, number>;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    claims: number;
    payments: number;
  }>;
  topServices: Array<{
    code: string;
    description: string;
    count: number;
    revenue: number;
  }>;
}