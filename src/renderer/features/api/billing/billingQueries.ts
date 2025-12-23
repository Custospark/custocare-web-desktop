import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { billingApi } from './billingApi';
import {
  Invoice,
  InvoiceCreateData,
  InvoiceUpdateData,
  InvoiceFilterParams,
  Payment,
  PaymentCreateData,
  PaymentFilterParams,
  InsuranceClaim,
  InsuranceClaimCreateData,
  ClaimFilterParams,
  BillingSummary,
  BillingStatistics,
  PaginatedResponse,
  ApiResponse,
} from '../../types/billing';
import { visitQueryKeys } from '../visits/visitQueries';

// ============================================
// QUERY KEY DEFINITIONS
// ============================================

/**
 * Billing query keys for React Query cache management
 * 
 * Each key follows a hierarchical pattern for optimal cache invalidation:
 * - Root: ['billing']
 * - Resource type: ['billing', 'invoices']
 * - Specific resource: ['billing', 'invoices', 'detail', id]
 * - Lists with params: ['billing', 'invoices', 'list', params]
 * 
 * Using `as const` ensures TypeScript treats these as tuple literals
 */

export const billingQueryKeys = {
  // Root key for all billing queries
  all: ['billing'] as const,
  
  // Invoice query keys
  invoices: () => ['billing', 'invoices'] as const,
  invoiceList: (params: InvoiceFilterParams) => 
    ['billing', 'invoices', 'list', params] as const,
  invoiceDetail: (id: string) => 
    ['billing', 'invoices', 'detail', id] as const,
  
  // Payment query keys
  payments: () => ['billing', 'payments'] as const,
  paymentList: (params: PaymentFilterParams) => 
    ['billing', 'payments', 'list', params] as const,
  paymentDetail: (id: string) => 
    ['billing', 'payments', 'detail', id] as const,
  
  // Claim query keys
  claims: () => ['billing', 'claims'] as const,
  claimList: (params: ClaimFilterParams) => 
    ['billing', 'claims', 'list', params] as const,
  claimDetail: (id: string) => 
    ['billing', 'claims', 'detail', id] as const,
  
  // Summary and statistics
  summary: (patientId: string) => 
    ['billing', 'summary', patientId] as const,
  statistics: (facilityId?: string) => 
    ['billing', 'statistics', facilityId].filter(Boolean) as readonly string[],
  
  // Visit-specific queries
  visitInvoice: (visitId: string) => 
    ['billing', 'visit', visitId, 'invoice'] as const,
  
  // Patient-specific invoice queries
  patientInvoices: {
    // Base key for patient invoices
    all: (patientId: string) => 
      ['billing', 'patient', patientId, 'invoices'] as const,
    
    // List key with optional filter parameters
    list: (patientId: string, params?: Partial<InvoiceFilterParams>) => 
      ['billing', 'patient', patientId, 'invoices', 'list', params] as const,
  },
};

// ============================================
// INVOICE QUERY HOOKS
// ============================================

/**
 * Hook to fetch paginated list of invoices
 * @param params - Filter parameters for invoice retrieval
 * @param options - React Query options
 * @returns Query result with paginated invoice data
 */
export const useInvoices = (
  params: InvoiceFilterParams,
  options?: UseQueryOptions<PaginatedResponse<Invoice>, Error>
) => {
  return useQuery<PaginatedResponse<Invoice>, Error>({
    queryKey: billingQueryKeys.invoiceList(params),
    queryFn: () => billingApi.getInvoices(params),
    ...options,
  });
};

/**
 * Hook to fetch a single invoice by ID
 * @param id - Invoice ID (string)
 * @param options - React Query options
 * @returns Query result with single invoice data
 */
export const useInvoice = (
  id: string,
  options?: UseQueryOptions<ApiResponse<Invoice>, Error>
) => {
  return useQuery<ApiResponse<Invoice>, Error>({
    queryKey: billingQueryKeys.invoiceDetail(id),
    queryFn: () => billingApi.getInvoiceById(id),
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook to fetch invoice associated with a visit
 * @param visitId - Visit ID
 * @param options - React Query options
 * @returns Query result with visit invoice or null
 */
export const useVisitInvoice = (
  visitId: string,
  options?: UseQueryOptions<ApiResponse<Invoice | null>, Error>
) => {
  return useQuery<ApiResponse<Invoice | null>, Error>({
    queryKey: billingQueryKeys.visitInvoice(visitId),
    queryFn: () => billingApi.getVisitInvoice(visitId),
    enabled: !!visitId,
    ...options,
  });
};

/**
 * Hook to fetch invoices for a specific patient
 * @param patientId - Patient ID
 * @param params - Optional filter parameters
 * @param options - React Query options
 * @returns Query result with patient's invoices
 */
export const usePatientInvoices = (
  patientId: string,
  params?: Partial<InvoiceFilterParams>,
  options?: UseQueryOptions<PaginatedResponse<Invoice>, Error>
) => {
  return useQuery<PaginatedResponse<Invoice>, Error>({
    queryKey: billingQueryKeys.patientInvoices.list(patientId, params),
    queryFn: () => billingApi.getPatientInvoices(patientId, params),
    enabled: !!patientId,
    ...options,
  });
};

// ============================================
// PAYMENT QUERY HOOKS
// ============================================

/**
 * Hook to fetch paginated list of payments
 * @param params - Filter parameters for payment retrieval
 * @param options - React Query options
 * @returns Query result with paginated payment data
 */
export const usePayments = (
  params: PaymentFilterParams,
  options?: UseQueryOptions<PaginatedResponse<Payment>, Error>
) => {
  return useQuery<PaginatedResponse<Payment>, Error>({
    queryKey: billingQueryKeys.paymentList(params),
    queryFn: () => billingApi.getPayments(params),
    ...options,
  });
};

/**
 * Hook to fetch a single payment by ID
 * @param id - Payment ID
 * @param options - React Query options
 * @returns Query result with single payment data
 */
export const usePayment = (
  id: string,
  options?: UseQueryOptions<ApiResponse<Payment>, Error>
) => {
  return useQuery<ApiResponse<Payment>, Error>({
    queryKey: billingQueryKeys.paymentDetail(id),
    queryFn: () => billingApi.getPaymentById(id),
    enabled: !!id,
    ...options,
  });
};

// ============================================
// CLAIM QUERY HOOKS
// ============================================

/**
 * Hook to fetch paginated list of insurance claims
 * @param params - Filter parameters for claim retrieval
 * @param options - React Query options
 * @returns Query result with paginated claim data
 */
export const useClaims = (
  params: ClaimFilterParams,
  options?: UseQueryOptions<PaginatedResponse<InsuranceClaim>, Error>
) => {
  return useQuery<PaginatedResponse<InsuranceClaim>, Error>({
    queryKey: billingQueryKeys.claimList(params),
    queryFn: () => billingApi.getClaims(params),
    ...options,
  });
};

/**
 * Hook to fetch a single insurance claim by ID
 * @param id - Claim ID
 * @param options - React Query options
 * @returns Query result with single claim data
 */
export const useClaim = (
  id: string,
  options?: UseQueryOptions<ApiResponse<InsuranceClaim>, Error>
) => {
  return useQuery<ApiResponse<InsuranceClaim>, Error>({
    queryKey: billingQueryKeys.claimDetail(id),
    queryFn: () => billingApi.getClaimById(id),
    enabled: !!id,
    ...options,
  });
};

// ============================================
// SUMMARY & STATISTICS QUERY HOOKS
// ============================================

/**
 * Hook to fetch billing summary for a patient
 * @param patientId - Patient ID
 * @param options - React Query options
 * @returns Query result with billing summary
 */
export const useBillingSummary = (
  patientId: string,
  options?: UseQueryOptions<ApiResponse<BillingSummary>, Error>
) => {
  return useQuery<ApiResponse<BillingSummary>, Error>({
    queryKey: billingQueryKeys.summary(patientId),
    queryFn: () => billingApi.getBillingSummary(patientId),
    enabled: !!patientId,
    ...options,
  });
};

/**
 * Hook to fetch billing statistics
 * @param facilityId - Optional facility ID for filtering
 * @param dateRange - Optional date range for filtering
 * @returns Query result with billing statistics
 */
export const useBillingStatistics = (
  facilityId?: string,
  dateRange?: { start: string; end: string }
) => {
  return useQuery<ApiResponse<BillingStatistics>, Error>({
    queryKey: billingQueryKeys.statistics(facilityId),
    queryFn: () => billingApi.getBillingStatistics(facilityId, dateRange),
  });
};

// ============================================
// INVOICE MUTATION HOOKS
// ============================================

/**
 * Hook to create a new invoice
 * @returns Mutation function and state for creating invoices
 */
export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<Invoice>, Error, InvoiceCreateData>({
    mutationFn: billingApi.createInvoice,
    onSuccess: (data, variables) => {
      // Invalidate invoice lists
      queryClient.invalidateQueries({ queryKey: billingQueryKeys.invoices() });
      
      // Invalidate patient-specific invoice queries
      queryClient.invalidateQueries({ 
        queryKey: billingQueryKeys.patientInvoices.all(variables.patientId) 
      });
      
      // Invalidate visit invoice query
      if (variables.visitId) {
        queryClient.invalidateQueries({ 
          queryKey: billingQueryKeys.visitInvoice(variables.visitId) 
        });
      }
      
      // Invalidate patient billing summary
      queryClient.invalidateQueries({ 
        queryKey: billingQueryKeys.summary(variables.patientId) 
      });
      
      // Update visit cache to reflect billing status
      if (variables.visitId) {
        queryClient.invalidateQueries({ 
          queryKey: visitQueryKeys.detail(variables.visitId) 
        });
      }
      
      // Cache the new invoice
      queryClient.setQueryData(billingQueryKeys.invoiceDetail(data.data.id), data);
    },
  });
};

/**
 * Hook to update an existing invoice
 * @returns Mutation function and state for updating invoices
 */
export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    ApiResponse<Invoice>,
    Error,
    { id: string; data: InvoiceUpdateData }
  >({
    mutationFn: ({ id, data }) => billingApi.updateInvoice(id, data),
    onSuccess: (data, variables) => {
      // Update the specific invoice in cache
      queryClient.setQueryData(billingQueryKeys.invoiceDetail(variables.id), data);
      
      // Invalidate all invoice lists
      queryClient.invalidateQueries({ queryKey: billingQueryKeys.invoices() });
      
      // Update patient summary if invoice status changed
      if (data.data.patientId) {
        queryClient.invalidateQueries({ 
          queryKey: billingQueryKeys.summary(data.data.patientId) 
        });
        
        // Invalidate patient invoice lists
        queryClient.invalidateQueries({ 
          queryKey: billingQueryKeys.patientInvoices.all(data.data.patientId) 
        });
      }
    },
  });
};

/**
 * Hook to delete an invoice
 * @returns Mutation function and state for deleting invoices
 */
export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<void>, Error, { id: string; patientId?: string; visitId?: string }>({
    mutationFn: ({ id }) => billingApi.deleteInvoice(id),
    onSuccess: (_, variables) => {
      // Remove the deleted invoice from cache
      queryClient.removeQueries({ queryKey: billingQueryKeys.invoiceDetail(variables.id) });
      
      // Invalidate all invoice lists
      queryClient.invalidateQueries({ queryKey: billingQueryKeys.invoices() });
      
      // Invalidate patient-specific queries if patientId is provided
      if (variables.patientId) {
        queryClient.invalidateQueries({ 
          queryKey: billingQueryKeys.patientInvoices.all(variables.patientId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: billingQueryKeys.summary(variables.patientId) 
        });
      }
      
      // Invalidate visit-specific queries if visitId is provided
      if (variables.visitId) {
        queryClient.invalidateQueries({ 
          queryKey: billingQueryKeys.visitInvoice(variables.visitId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: visitQueryKeys.detail(variables.visitId) 
        });
      }
    },
  });
};

// ============================================
// PAYMENT MUTATION HOOKS
// ============================================

// Interface for optimistic update context
interface CreatePaymentContext {
  previousInvoice?: ApiResponse<Invoice>;
}

/**
 * Hook to create a new payment
 * @returns Mutation function and state for creating payments
 */
export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<Payment>, Error, PaymentCreateData, CreatePaymentContext>({
    mutationFn: billingApi.createPayment,
    onSuccess: (data, variables) => {
      // Invalidate payment lists
      queryClient.invalidateQueries({ queryKey: billingQueryKeys.payments() });
      
      // Update invoice cache
      queryClient.invalidateQueries({ 
        queryKey: billingQueryKeys.invoiceDetail(variables.invoiceId) 
      });
      
      // Update patient billing summary
      const invoice = queryClient.getQueryData<ApiResponse<Invoice>>(
        billingQueryKeys.invoiceDetail(variables.invoiceId)
      );
      if (invoice?.data.patientId) {
        queryClient.invalidateQueries({ 
          queryKey: billingQueryKeys.summary(invoice.data.patientId) 
        });
      }
      
      // Update visit billing status
      if (invoice?.data.visitId) {
        queryClient.invalidateQueries({ 
          queryKey: visitQueryKeys.detail(invoice.data.visitId) 
        });
      }
      
      // Cache the new payment
      queryClient.setQueryData(billingQueryKeys.paymentDetail(data.data.id), data);
    },
    
    // Optimistic update for immediate UI feedback
    onMutate: async (variables): Promise<CreatePaymentContext> => {
      // Cancel any outgoing refetches for this invoice
      await queryClient.cancelQueries({ 
        queryKey: billingQueryKeys.invoiceDetail(variables.invoiceId) 
      });
      
      // Snapshot the previous value
      const previousInvoice = queryClient.getQueryData<ApiResponse<Invoice>>(
        billingQueryKeys.invoiceDetail(variables.invoiceId)
      );
      
      // Create optimistic update
      if (previousInvoice) {
        const optimisticInvoice: ApiResponse<Invoice> = {
          ...previousInvoice,
          data: {
            ...previousInvoice.data,
            balanceDue: Math.max(0, previousInvoice.data.balanceDue - variables.amount),
            status: previousInvoice.data.balanceDue - variables.amount <= 0 ? 'PAID' : 'PARTIAL',
            payments: [
              ...(previousInvoice.data.payments || []),
              {
                id: `temp-${Date.now()}`,
                invoiceId: variables.invoiceId,
                visitId: previousInvoice.data.visitId,
                patientId: previousInvoice.data.patientId,
                amount: variables.amount,
                paymentMethod: variables.paymentMethod,
                status: 'PENDING',
                receiptNumber: `TEMP-${Date.now()}`,
                receivedBy: 'system',
                paymentDate: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'system',
                updatedBy: 'system',
              } as Payment,
            ],
          },
        };
        
        // Update cache with optimistic data
        queryClient.setQueryData(
          billingQueryKeys.invoiceDetail(variables.invoiceId),
          optimisticInvoice
        );
      }
      
      // Return context for rollback on error
      return { previousInvoice };
    },
    
    // FIXED: Correct parameter order - context is the third parameter
    onError: (error, variables, context) => {
      // Rollback to previous state on error
      if (context?.previousInvoice) {
        queryClient.setQueryData(
          billingQueryKeys.invoiceDetail(variables.invoiceId),
          context.previousInvoice
        );
      }
    },
  });
};
/**
 * Hook to process a refund for a payment
 * @returns Mutation function and state for processing refunds
 */
export const useProcessRefund = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    ApiResponse<Payment>,
    Error,
    { paymentId: string; refundData: { amount: number; reason: string } }
  >({
    mutationFn: ({ paymentId, refundData }) => 
      billingApi.processRefund(paymentId, refundData),
    onSuccess: (data, variables) => {
      // Update the payment in cache
      queryClient.setQueryData(
        billingQueryKeys.paymentDetail(variables.paymentId), 
        data
      );
      
      // Invalidate payment lists
      queryClient.invalidateQueries({ queryKey: billingQueryKeys.payments() });
      
      // Update invoice balance
      const payment = data.data;
      queryClient.invalidateQueries({ 
        queryKey: billingQueryKeys.invoiceDetail(payment.invoiceId) 
      });
      
      // Update patient summary
      if (payment.patientId) {
        queryClient.invalidateQueries({ 
          queryKey: billingQueryKeys.summary(payment.patientId) 
        });
      }
    },
  });
};

// ============================================
// INSURANCE CLAIM MUTATION HOOKS
// ============================================

/**
 * Hook to create a new insurance claim
 * @returns Mutation function and state for creating claims
 */
export const useCreateClaim = () => {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<InsuranceClaim>, Error, InsuranceClaimCreateData>({
    mutationFn: billingApi.createClaim,
    onSuccess: (data, variables) => {
      // Invalidate claim lists
      queryClient.invalidateQueries({ queryKey: billingQueryKeys.claims() });
      
      // Update invoice cache
      queryClient.invalidateQueries({ 
        queryKey: billingQueryKeys.invoiceDetail(variables.invoiceId) 
      });
      
      // Update visit billing status
      const invoice = queryClient.getQueryData<ApiResponse<Invoice>>(
        billingQueryKeys.invoiceDetail(variables.invoiceId)
      );
      if (invoice?.data.visitId) {
        queryClient.invalidateQueries({ 
          queryKey: visitQueryKeys.detail(invoice.data.visitId) 
        });
      }
      
      // Cache the new claim
      queryClient.setQueryData(billingQueryKeys.claimDetail(data.data.id), data);
    },
  });
};

/**
 * Hook to submit an insurance claim
 * @returns Mutation function and state for submitting claims
 */
export const useSubmitClaim = () => {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<InsuranceClaim>, Error, string>({
    mutationFn: billingApi.submitClaim,
    onSuccess: (data, claimId) => {
      // Update the claim in cache
      queryClient.setQueryData(billingQueryKeys.claimDetail(claimId), data);
      
      // Invalidate claim lists
      queryClient.invalidateQueries({ queryKey: billingQueryKeys.claims() });
      
      // Update invoice status
      const claim = data.data;
      queryClient.invalidateQueries({ 
        queryKey: billingQueryKeys.invoiceDetail(claim.invoiceId) 
      });
    },
  });
};

// ============================================
// INVOICE GENERATION HOOKS
// ============================================

/**
 * Hook to generate an invoice for a visit
 * @returns Mutation function and state for generating visit invoices
 */
export const useGenerateVisitInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse<Invoice>, Error, string>({
    mutationFn: billingApi.generateVisitInvoice,
    onSuccess: (data, visitId) => {
      // Invalidate all billing queries for this visit
      queryClient.invalidateQueries({ 
        queryKey: billingQueryKeys.visitInvoice(visitId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: billingQueryKeys.invoices() 
      });
      
      // Update visit cache with billing status
      queryClient.invalidateQueries({ 
        queryKey: visitQueryKeys.detail(visitId) 
      });
      
      // Cache the generated invoice
      queryClient.setQueryData(
        billingQueryKeys.invoiceDetail(data.data.id), 
        data
      );
    },
  });
};