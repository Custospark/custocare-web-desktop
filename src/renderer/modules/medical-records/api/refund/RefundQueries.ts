/**
 * RefundQueries.ts
 * ============================================================================
 * REFUND & VOID REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains React Query hooks for refund and void operations following
 * the department queries pattern with consistent error handling, toast notifications,
 * and type safety.
 * 
 * @module useRefundQueries
 */

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useSelector } from 'react-redux';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import type {
  VoidTransactionRequest,
  VoidTransactionResponse,
  RefundTransactionRequest,
  RefundTransactionResponse,
  ApiErrorResponse,
} from './RefundTypes';
import { type RootState } from '../../../../app/store/store';
import { 
  getActiveFacilityId, 
  getStaffId 
} from '../../../../app/store/utils/contextSelectors';
import { billingReviewKeys } from '../billing-review/BillingReviewQueries';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Centralized query keys for React Query caching and invalidation.
 * 
 * @example
 * // Invalidate all refund-related queries
 * queryClient.invalidateQueries({ queryKey: refundKeys.all });
 */
export const refundKeys = {
  all: ['refunds'] as const,
  voids: () => [...refundKeys.all, 'voids'] as const,
  void: (billingCycleId: number) => [...refundKeys.voids(), billingCycleId] as const,
  refunds: () => [...refundKeys.all, 'refunds'] as const,
  refund: (billingCycleId: number) => [...refundKeys.refunds(), billingCycleId] as const,
};

/* -------------------------------------------------------------------------- */
/*                            MUTATION HOOKS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Mutation hook for voiding a transaction.
 * 
 * Calls: POST /api/billing-cycles/{billingCycleId}/void
 * 
 * Automatically includes required headers:
 * - X-Facility-Id (from active context)
 * - X-Staff-Id (from active context)
 * 
 * @param options - React Query mutation options for customizing behavior
 * @returns Mutation result with void transaction functionality
 * 
 * @example
 * const { mutate: voidTransaction, isPending } = useVoidTransaction({
 *   onSuccess: (data) => {
 *     toast.success(`Transaction voided: ${data.data.reference_number}`);
 *   },
 *   onError: (error) => {
 *     toast.error(extractErrorMessage(error));
 *   }
 * });
 * 
 * // Usage
 * voidTransaction({
 *   billingCycleId: 123,
 *   data: {
 *     reason: VoidReason.BILLING_ERROR,
 *     reason_notes: 'Incorrect patient billing',
 *     restore_inventory: true
 *   }
 * });
 */
export const useVoidTransaction = (
  options?: Omit<
    UseMutationOptions<
      VoidTransactionResponse,
      AxiosError<ApiErrorResponse>,
      { billingCycleId: number; data: VoidTransactionRequest }
    >,
    'mutationFn'
  >
) => {
  const queryClient = useQueryClient();
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));
  const staffId = useSelector((state: RootState) => getStaffId(state));

  return useMutation<
    VoidTransactionResponse,
    AxiosError<ApiErrorResponse>,
    { billingCycleId: number; data: VoidTransactionRequest }
  >({
    mutationFn: async ({ billingCycleId, data }) => {
      if (!facilityId || !staffId) {
        throw new Error('Missing required context: facility ID and staff ID are required');
      }

      const response = await axiosInstance.post<VoidTransactionResponse>(
        `/billing-cycles/${billingCycleId}/void`,
        data,
        {
          headers: {
            'X-Facility-Id': facilityId,
            'X-Staff-Id': staffId,
          },
        }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate billing review queries to refresh the list
      queryClient.invalidateQueries({ 
        queryKey: billingReviewKeys.lists(facilityId ?? 0) 
      });
      
      // Invalidate specific billing cycle detail if exists
      queryClient.invalidateQueries({ 
        queryKey: billingReviewKeys.detail(facilityId ?? 0, variables.billingCycleId) 
      });
      
      // Call user's onSuccess if provided
      options?.onSuccess?.(data, variables, undefined);
    },
    ...options,
  });
};

/**
 * Mutation hook for refunding a transaction (full or partial - auto-detected).
 * 
 * Calls: POST /api/billing-cycles/{billingCycleId}/refund
 * 
 * The backend automatically detects whether to perform a full or partial refund:
 * - If `line_items` is present in the request → partial refund
 * - If `line_items` is absent → full refund
 * 
 * Automatically includes required headers:
 * - X-Facility-Id (from active context)
 * - X-Staff-Id (from active context)
 * 
 * @param options - React Query mutation options for customizing behavior
 * @returns Mutation result with refund transaction functionality
 * 
 * @example
 * // Full refund
 * const { mutate: refundTransaction } = useRefundTransaction({
 *   onSuccess: (data) => {
 *     if (data.data.refund_type === 'full_refund') {
 *       toast.success('Full refund processed successfully');
 *     } else {
 *       toast.success(`Partial refund: ${data.data.affected_line_items} items`);
 *     }
 *   }
 * });
 * 
 * refundTransaction({
 *   billingCycleId: 123,
 *   data: {
 *     reason: RefundReason.PATIENT_REQUEST,
 *     reason_notes: 'Patient changed mind',
 *     refund_methods: [
 *       { type: RefundMethodType.CASH, amount: 50000 }
 *     ],
 *     restore_inventory: true
 *   }
 * });
 * 
 * @example
 * // Partial refund
 * refundTransaction({
 *   billingCycleId: 123,
 *   data: {
 *     reason: RefundReason.SERVICE_NOT_RENDERED,
 *     line_items: [
 *       { line_item_id: 456, refund_amount: 25000 },
 *       { line_item_id: 457 } // Full line amount
 *     ],
 *     refund_methods: [
 *       { type: RefundMethodType.CARD, amount: 30000, reference: 'TXN123' }
 *     ],
 *     restore_inventory: false
 *   }
 * });
 */
export const useRefundTransaction = (
  options?: Omit<
    UseMutationOptions<
      RefundTransactionResponse,
      AxiosError<ApiErrorResponse>,
      { billingCycleId: number; data: RefundTransactionRequest }
    >,
    'mutationFn'
  >
) => {
  const queryClient = useQueryClient();
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));
  const staffId = useSelector((state: RootState) => getStaffId(state));

  return useMutation<
    RefundTransactionResponse,
    AxiosError<ApiErrorResponse>,
    { billingCycleId: number; data: RefundTransactionRequest }
  >({
    mutationFn: async ({ billingCycleId, data }) => {
      if (!facilityId || !staffId) {
        throw new Error('Missing required context: facility ID and staff ID are required');
      }

      const response = await axiosInstance.post<RefundTransactionResponse>(
        `/billing-cycles/${billingCycleId}/refund`,
        data,
        {
          headers: {
            'X-Facility-Id': facilityId,
            'X-Staff-Id': staffId,
          },
        }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate billing review queries to refresh the list
      queryClient.invalidateQueries({ 
        queryKey: billingReviewKeys.lists(facilityId ?? 0) 
      });
      
      // Invalidate specific billing cycle detail if exists
      queryClient.invalidateQueries({ 
        queryKey: billingReviewKeys.detail(facilityId ?? 0, variables.billingCycleId) 
      });
      
      // Call user's onSuccess if provided
      options?.onSuccess?.(data, variables, undefined);
    },
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                           UTILITY FUNCTIONS                                */
/* -------------------------------------------------------------------------- */

/**
 * Helper function to extract error message from Axios error.
 * Prioritizes API message, falls back to generic error message.
 * 
 * @param error - Axios error from failed request
 * @param fallbackMessage - Default message if API message unavailable
 * @returns Human-readable error message
 * 
 * @example
 * const errorMessage = extractErrorMessage(error, 'Failed to void transaction');
 * toast.error(errorMessage);
 */
export const extractErrorMessage = (
  error: AxiosError<ApiErrorResponse>,
  fallbackMessage = 'An unexpected error occurred.'
): string => {
  return error.response?.data?.message || error.message || fallbackMessage;
};

/**
 * Helper function to format validation errors into readable string.
 * Converts Laravel validation error format to user-friendly display.
 * 
 * @param errors - Validation errors object from API
 * @returns Formatted error string or empty string if no errors
 * 
 * @example
 * const validationErrors = formatValidationErrors(error.response?.data?.errors);
 * if (validationErrors) {
 *   toast.error(validationErrors);
 * }
 */
export const formatValidationErrors = (errors?: Record<string, string[]>): string => {
  if (!errors || Object.keys(errors).length === 0) {
    return '';
  }

  return Object.entries(errors)
    .map(([field, messages]) => {
      const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      return `${fieldName}: ${messages.join(', ')}`;
    })
    .join(' | ');
};

/**
 * Helper to get complete error details for logging/debugging
 * 
 * @param error - Axios error from failed request
 * @returns Detailed error information
 */
export const getErrorDetails = (error: AxiosError<ApiErrorResponse>) => {
  return {
    message: extractErrorMessage(error),
    validationErrors: formatValidationErrors(error.response?.data?.errors),
    statusCode: error.response?.status,
    rawError: error.response?.data?.error,
  };
};

/* -------------------------------------------------------------------------- */
/*                            EXPORT ALL HOOKS                                */
/* -------------------------------------------------------------------------- */

/**
 * Named exports for individual hooks.
 * Preferred method for tree-shaking and explicit imports.
 */
export default {
  // Mutation hooks
  useVoidTransaction,
  useRefundTransaction,
  
  // Utilities
  refundKeys,
  extractErrorMessage,
  formatValidationErrors,
  getErrorDetails,
};