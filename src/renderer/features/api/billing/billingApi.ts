import axiosInstance from '../configs/axiosConfig';
import { ENDPOINTS } from '../endpoints/endpoints';
import {
  Invoice,
  InvoiceCreateData,
  InvoiceUpdateData,
  InvoiceFilterParams,
  Payment,
  PaymentCreateData,
  PaymentUpdateData,
  PaymentFilterParams,
  InsuranceClaim,
  InsuranceClaimCreateData,
  ClaimFilterParams,
  BillingSummary,
  BillingStatistics,
  PaginatedResponse,
  ApiResponse,
} from '../../types/billing';

/**
 * Billing API Service
 * 
 * This module provides a comprehensive interface for all billing-related operations
 * including invoice management, payment processing, insurance claims, and reporting.
 * 
 * All methods follow a consistent pattern:
 * 1. Make HTTP request via axiosInstance
 * 2. Return response data with proper typing
 * 3. Include error handling at the application level
 * 
 * Note: Error handling for network/API errors should be implemented in the axiosInstance
 * configuration or at the component level using try-catch blocks.
 */

export const billingApi = {
  // ============================================
  // INVOICE MANAGEMENT METHODS
  // ============================================

  /**
   * Fetches a paginated list of invoices with optional filtering
   * @param params - Filter parameters for invoice retrieval
   * @returns Paginated response containing invoice data
   */
  getInvoices: async (params: InvoiceFilterParams): Promise<PaginatedResponse<Invoice>> => {
    const response = await axiosInstance.get<PaginatedResponse<Invoice>>(
      ENDPOINTS.BILLING.INVOICES,
      { params }
    );
    return response.data;
  },

  /**
   * Retrieves a single invoice by its unique identifier
   * @param id - Invoice ID
   * @returns Single invoice response
   */
  getInvoiceById: async (id: string): Promise<ApiResponse<Invoice>> => {
    const response = await axiosInstance.get<ApiResponse<Invoice>>(
      ENDPOINTS.BILLING.GET_INVOICE(id)
    );
    return response.data;
  },

  /**
   * Creates a new invoice
   * @param invoiceData - Data required to create an invoice
   * @returns Created invoice response
   */
  createInvoice: async (invoiceData: InvoiceCreateData): Promise<ApiResponse<Invoice>> => {
    const response = await axiosInstance.post<ApiResponse<Invoice>>(
      ENDPOINTS.BILLING.CREATE_INVOICE,
      invoiceData
    );
    return response.data;
  },

  /**
   * Updates an existing invoice
   * @param id - Invoice ID to update
   * @param updateData - Partial invoice data for update
   * @returns Updated invoice response
   */
  updateInvoice: async (
    id: string,
    updateData: InvoiceUpdateData
  ): Promise<ApiResponse<Invoice>> => {
    const response = await axiosInstance.put<ApiResponse<Invoice>>(
      ENDPOINTS.BILLING.UPDATE_INVOICE(id),
      updateData
    );
    return response.data;
  },

  /**
   * Deletes an invoice (soft delete typically)
   * @param id - Invoice ID to delete
   * @returns Success response
   */
  deleteInvoice: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      ENDPOINTS.BILLING.DELETE_INVOICE(id)
    );
    return response.data;
  },

  /**
   * Retrieves invoice associated with a specific visit
   * @param visitId - Visit ID
   * @returns Invoice response or null if no invoice exists
   */
  getVisitInvoice: async (visitId: string): Promise<ApiResponse<Invoice | null>> => {
    const response = await axiosInstance.get<ApiResponse<Invoice | null>>(
      ENDPOINTS.BILLING.GET_VISIT_INVOICE(visitId)
    );
    return response.data;
  },

  /**
   * Fetches all invoices for a specific patient
   * @param patientId - Patient ID
   * @param params - Optional filter parameters
   * @returns Paginated invoice response
   */
  getPatientInvoices: async (
    patientId: string,
    params?: Partial<InvoiceFilterParams>
  ): Promise<PaginatedResponse<Invoice>> => {
    const response = await axiosInstance.get<PaginatedResponse<Invoice>>(
      ENDPOINTS.BILLING.GET_PATIENT_INVOICES(patientId),
      { params }
    );
    return response.data;
  },

  // ============================================
  // PAYMENT MANAGEMENT METHODS
  // ============================================

  /**
   * Fetches a paginated list of payments with optional filtering
   * @param params - Filter parameters for payment retrieval
   * @returns Paginated payment response
   */
  getPayments: async (params: PaymentFilterParams): Promise<PaginatedResponse<Payment>> => {
    const response = await axiosInstance.get<PaginatedResponse<Payment>>(
      ENDPOINTS.BILLING.PAYMENTS,
      { params }
    );
    return response.data;
  },

  /**
   * Retrieves a single payment by its unique identifier
   * @param id - Payment ID
   * @returns Single payment response
   */
  getPaymentById: async (id: string): Promise<ApiResponse<Payment>> => {
    const response = await axiosInstance.get<ApiResponse<Payment>>(
      ENDPOINTS.BILLING.GET_PAYMENT(id)
    );
    return response.data;
  },

  /**
   * Creates a new payment record
   * @param paymentData - Data required to create a payment
   * @returns Created payment response
   */
  createPayment: async (paymentData: PaymentCreateData): Promise<ApiResponse<Payment>> => {
    const response = await axiosInstance.post<ApiResponse<Payment>>(
      ENDPOINTS.BILLING.CREATE_PAYMENT,
      paymentData
    );
    return response.data;
  },

  /**
   * Updates an existing payment record
   * @param id - Payment ID to update
   * @param updateData - Partial payment data for update
   * @returns Updated payment response
   */
  updatePayment: async (
    id: string,
    updateData: PaymentUpdateData
  ): Promise<ApiResponse<Payment>> => {
    const response = await axiosInstance.put<ApiResponse<Payment>>(
      ENDPOINTS.BILLING.UPDATE_PAYMENT(id),
      updateData
    );
    return response.data;
  },

  /**
   * Processes a refund for an existing payment
   * @param paymentId - Payment ID to refund
   * @param refundData - Refund amount and reason
   * @returns Updated payment response with refund details
   */
  processRefund: async (
    paymentId: string,
    refundData: { amount: number; reason: string }
  ): Promise<ApiResponse<Payment>> => {
    const response = await axiosInstance.post<ApiResponse<Payment>>(
      ENDPOINTS.BILLING.REFUND_PAYMENT(paymentId),
      refundData
    );
    return response.data;
  },

  /**
   * Deletes a payment record (typically for administrative purposes)
   * @param id - Payment ID to delete
   * @returns Success response
   */
  deletePayment: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      ENDPOINTS.BILLING.DELETE_PAYMENT(id)
    );
    return response.data;
  },

  // ============================================
  // INSURANCE CLAIMS MANAGEMENT METHODS
  // ============================================

  /**
   * Fetches a paginated list of insurance claims with optional filtering
   * @param params - Filter parameters for claim retrieval
   * @returns Paginated claims response
   */
  getClaims: async (params: ClaimFilterParams): Promise<PaginatedResponse<InsuranceClaim>> => {
    const response = await axiosInstance.get<PaginatedResponse<InsuranceClaim>>(
      ENDPOINTS.BILLING.CLAIMS,
      { params }
    );
    return response.data;
  },

  /**
   * Retrieves a single insurance claim by its unique identifier
   * @param id - Claim ID
   * @returns Single claim response
   */
  getClaimById: async (id: string): Promise<ApiResponse<InsuranceClaim>> => {
    const response = await axiosInstance.get<ApiResponse<InsuranceClaim>>(
      ENDPOINTS.BILLING.GET_CLAIM(id)
    );
    return response.data;
  },

  /**
   * Creates a new insurance claim
   * @param claimData - Data required to create a claim
   * @returns Created claim response
   */
  createClaim: async (claimData: InsuranceClaimCreateData): Promise<ApiResponse<InsuranceClaim>> => {
    const response = await axiosInstance.post<ApiResponse<InsuranceClaim>>(
      ENDPOINTS.BILLING.CREATE_CLAIM,
      claimData
    );
    return response.data;
  },

  /**
   * Updates an existing insurance claim
   * @param id - Claim ID to update
   * @param updateData - Partial claim data for update
   * @returns Updated claim response
   */
  updateClaim: async (
    id: string,
    updateData: Partial<InsuranceClaim>
  ): Promise<ApiResponse<InsuranceClaim>> => {
    const response = await axiosInstance.put<ApiResponse<InsuranceClaim>>(
      ENDPOINTS.BILLING.UPDATE_CLAIM(id),
      updateData
    );
    return response.data;
  },

  /**
   * Submits a claim to the insurance provider
   * @param claimId - Claim ID to submit
   * @returns Updated claim response with submission status
   */
  submitClaim: async (claimId: string): Promise<ApiResponse<InsuranceClaim>> => {
    const response = await axiosInstance.post<ApiResponse<InsuranceClaim>>(
      ENDPOINTS.BILLING.SUBMIT_CLAIM(claimId)
    );
    return response.data;
  },

  /**
   * Deletes an insurance claim (typically before submission)
   * @param id - Claim ID to delete
   * @returns Success response
   */
  deleteClaim: async (id: string): Promise<ApiResponse<void>> => {
    const response = await axiosInstance.delete<ApiResponse<void>>(
      ENDPOINTS.BILLING.DELETE_CLAIM(id)
    );
    return response.data;
  },

  // ============================================
  // BILLING SUMMARY & STATISTICS METHODS
  // ============================================

  /**
   * Retrieves billing summary for a specific patient
   * @param patientId - Patient ID
   * @returns Billing summary including balances, recent invoices, and payments
   */
  getBillingSummary: async (patientId: string): Promise<ApiResponse<BillingSummary>> => {
    const response = await axiosInstance.get<ApiResponse<BillingSummary>>(
      ENDPOINTS.BILLING.GET_SUMMARY(patientId)
    );
    return response.data;
  },

  /**
   * Fetches billing statistics for reporting and analytics
   * @param facilityId - Optional facility ID for filtering
   * @param dateRange - Optional date range for filtering
   * @returns Billing statistics including revenue, pending amounts, etc.
   */
  getBillingStatistics: async (
    facilityId?: string,
    dateRange?: { start: string; end: string }
  ): Promise<ApiResponse<BillingStatistics>> => {
    const response = await axiosInstance.get<ApiResponse<BillingStatistics>>(
      ENDPOINTS.BILLING.STATISTICS,
      { params: { facilityId, ...dateRange } }
    );
    return response.data;
  },

  // ============================================
  // INVOICE GENERATION METHODS
  // ============================================

  /**
   * Generates an invoice for a specific visit
   * @param visitId - Visit ID
   * @returns Generated invoice response
   */
  generateVisitInvoice: async (visitId: string): Promise<ApiResponse<Invoice>> => {
    const response = await axiosInstance.post<ApiResponse<Invoice>>(
      ENDPOINTS.BILLING.GENERATE_VISIT_INVOICE(visitId)
    );
    return response.data;
  },

  /**
   * Regenerates an invoice (useful for corrections or updates)
   * @param invoiceId - Invoice ID to regenerate
   * @returns Regenerated invoice response
   */
  regenerateInvoice: async (invoiceId: string): Promise<ApiResponse<Invoice>> => {
    const response = await axiosInstance.post<ApiResponse<Invoice>>(
      ENDPOINTS.BILLING.REGENERATE_INVOICE(invoiceId)
    );
    return response.data;
  },

  // ============================================
  // RECEIPT & DOCUMENT GENERATION METHODS
  // ============================================

  /**
   * Generates a payment receipt as a PDF
   * @param paymentId - Payment ID
   * @returns PDF URL for download
   */
  generateReceipt: async (paymentId: string): Promise<ApiResponse<{ pdfUrl: string }>> => {
    const response = await axiosInstance.get<ApiResponse<{ pdfUrl: string }>>(
      ENDPOINTS.BILLING.GENERATE_RECEIPT(paymentId)
    );
    return response.data;
  },

  /**
   * Generates an invoice as a PDF document
   * @param invoiceId - Invoice ID
   * @returns PDF URL for download
   */
  generateInvoicePDF: async (invoiceId: string): Promise<ApiResponse<{ pdfUrl: string }>> => {
    const response = await axiosInstance.get<ApiResponse<{ pdfUrl: string }>>(
      ENDPOINTS.BILLING.GENERATE_INVOICE_PDF(invoiceId)
    );
    return response.data;
  },

  /**
   * Generates a claim form as a PDF
   * @param claimId - Claim ID
   * @returns PDF URL for download
   */
  generateClaimForm: async (claimId: string): Promise<ApiResponse<{ pdfUrl: string }>> => {
    const response = await axiosInstance.get<ApiResponse<{ pdfUrl: string }>>(
      ENDPOINTS.BILLING.GENERATE_CLAIM_FORM(claimId)
    );
    return response.data;
  },

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * Processes batch payments for multiple invoices
   * @param payments - Array of payment data objects
   * @returns Batch processing response
   */
  processBatchPayments: async (
    payments: Array<{ invoiceId: string; amount: number; method: string }>
  ): Promise<ApiResponse<{ processed: number; failed: number; results: Payment[] }>> => {
    const response = await axiosInstance.post<
      ApiResponse<{ processed: number; failed: number; results: Payment[] }>
    >(
      ENDPOINTS.BILLING.BATCH_PAYMENTS,
      { payments }
    );
    return response.data;
  },

  /**
   * Submits multiple claims in batch
   * @param claimIds - Array of claim IDs to submit
   * @returns Batch submission response
   */
  submitBatchClaims: async (
    claimIds: string[]
  ): Promise<ApiResponse<{ submitted: number; failed: number }>> => {
    const response = await axiosInstance.post<
      ApiResponse<{ submitted: number; failed: number }>
    >(
      ENDPOINTS.BILLING.BATCH_SUBMIT_CLAIMS,
      { claimIds }
    );
    return response.data;
  },
};