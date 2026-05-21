/**
 * ============================================================================
 * REFUND REACT QUERY HOOKS
 * ============================================================================
 * 
 * This file contains React Query hooks for refund and void operations following
 * the department queries pattern with consistent error handling, toast notifications,
 * and type safety.
 * 
 * @module useRefundQueries
 */

import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useSelector } from 'react-redux';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import type { 
  VoidRequest,
  VoidResponse,
  BaseRefundResponse,
  ValidationErrorResponse,
  FullRefundResponseData,
  PartialRefundResponseData,
  BaseRefundRequest,
} from './RefundTypes';
import { type RootState } from '../../../../app/store/store';
import { getStaffId, getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';

/* -------------------------------------------------------------------------- */
/*                               QUERY KEYS                                   */
/* -------------------------------------------------------------------------- */

/**
 * Centralized query keys for React Query caching and invalidation.
 */
export const refundKeys = {
  all: ['refunds'] as const,
  voids: (facilityId: number) => [...refundKeys.all, 'voids', facilityId] as const,
  void: (facilityId: number, billingCycleId: number) => 
    [...refundKeys.voids(facilityId), billingCycleId] as const,
  refunds: (facilityId: number) => [...refundKeys.all, 'refunds', facilityId] as const,
  refund: (facilityId: number, billingCycleId: number) => 
    [...refundKeys.refunds(facilityId), billingCycleId] as const,
  adjustments: (facilityId: number) => [...refundKeys.all, 'adjustments', facilityId] as const,
};

/* -------------------------------------------------------------------------- */
/*                              MUTATION HOOKS                                */
/* -------------------------------------------------------------------------- */

/**
 * Hook to void a transaction.
 * Calls: POST /api/billing-cycles/{billingCycleId}/void
 * 
 * @param billingCycleId - ID of the billing cycle to void
 * @param options - React Query mutation options
 * @returns Mutation object with void function
 * 
 * @example
 * const { mutate: voidTransaction, isLoading } = useVoidTransaction(123, {
 *   onSuccess: (data) => {
 *     toast.success(`Transaction voided: ${data.data?.reference_number}`);
 *   }
 * });
 * 
 * voidTransaction({
 *   reason: 'billing_error',
 *   reason_notes: 'Duplicate charge',
 *   restore_inventory: true
 * });
 */
export const useVoidTransaction = (
  billingCycleId: number,
  options?: Omit<UseMutationOptions<
    VoidResponse,
    AxiosError<ValidationErrorResponse>,
    VoidRequest
  >, 'onSuccess'> & {
    onSuccess?: (data: VoidResponse, variables: VoidRequest, context: unknown) => void;
  }
) => {
  const queryClient = useQueryClient();
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));
  const staffId = useSelector((state: RootState) => getStaffId(state));

  return useMutation<VoidResponse, AxiosError<ValidationErrorResponse>, VoidRequest>({
    mutationFn: async (voidData: VoidRequest) => {
      if (!facilityId) {
        throw new Error('No active facility selected');
      }
      if (!staffId) {
        throw new Error('No staff ID available');
      }

      const response = await axiosInstance.post<VoidResponse>(
        `/billing-cycles/${billingCycleId}/void`,
        voidData,
        {
          headers: {
            'X-Facility-Id': facilityId,
            'X-Staff-Id': staffId,
          },
        }
      );
      return response.data;
    },
    onSuccess: (data, variables, _onMutateResult, context) => {
      // Invalidate relevant queries
      if (facilityId) {
        queryClient.invalidateQueries({ 
          queryKey: refundKeys.void(facilityId, billingCycleId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['billing-review', 'list', facilityId] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['billing-review', 'detail', facilityId] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['billing-review', 'facility-visit', facilityId] 
        });
      }
      
      // Call user's onSuccess if provided - we ignore the onMutateResult parameter
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

/**
 * Hook to refund a transaction (full or partial, auto-detected by backend).
 * Calls: POST /api/billing-cycles/{billingCycleId}/refund
 * 
 * @param billingCycleId - ID of the billing cycle to refund
 * @param options - React Query mutation options
 * @returns Mutation object with refund function
 * 
 * @example
 * // Full refund
 * const { mutate: refund } = useRefundTransaction(123);
 * refund({
 *   reason: 'patient_request',
 *   refund_methods: [{ type: 'cash', amount: 50000 }],
 *   restore_inventory: true
 * });
 * 
 * @example
 * // Partial refund
 * refund({
 *   reason: 'service_not_rendered',
 *   line_items: [{ line_item_id: 456, refund_amount: 25000 }],
 *   refund_methods: [{ type: 'cash', amount: 25000 }],
 *   restore_inventory: true
 * });
 */
export const useRefundTransaction = (
  billingCycleId: number,
  options?: Omit<UseMutationOptions<
    BaseRefundResponse,
    AxiosError<ValidationErrorResponse>,
    BaseRefundRequest
  >, 'onSuccess'> & {
    onSuccess?: (data: BaseRefundResponse, variables: BaseRefundRequest, context: unknown) => void;
  }
) => {
  const queryClient = useQueryClient();
  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));
  const staffId = useSelector((state: RootState) => getStaffId(state));

  return useMutation<BaseRefundResponse, AxiosError<ValidationErrorResponse>, BaseRefundRequest>({
    mutationFn: async (refundData: BaseRefundRequest) => {
      if (!facilityId) {
        throw new Error('No active facility selected');
      }
      if (!staffId) {
        throw new Error('No staff ID available');
      }

      const response = await axiosInstance.post<BaseRefundResponse>(
        `/billing-cycles/${billingCycleId}/refund`,
        refundData,
        {
          headers: {
            'X-Facility-Id': facilityId,
            'X-Staff-Id': staffId,
          },
        }
      );
      return response.data;
    },
    onSuccess: (data, variables, _onMutateResult, context) => {
      // Invalidate relevant queries
      if (facilityId) {
        queryClient.invalidateQueries({ 
          queryKey: refundKeys.refund(facilityId, billingCycleId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['billing-review', 'list', facilityId] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['billing-review', 'detail', facilityId] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['billing-review', 'facility-visit', facilityId] 
        });
      }
      
      // Call user's onSuccess if provided - ignore the onMutateResult parameter
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                           UTILITY FUNCTIONS                                */
/* -------------------------------------------------------------------------- */

/**
 * Helper function to extract error message from Axios error.
 * 
 * @param error - Axios error from failed request
 * @param fallbackMessage - Default message if API message unavailable
 * @returns Human-readable error message
 */
export const extractRefundErrorMessage = (
  error: AxiosError<ValidationErrorResponse>,
  fallbackMessage = 'An unexpected error occurred.'
): string => {
  return error.response?.data?.message || error.message || fallbackMessage;
};

/**
 * Helper function to format validation errors into readable string.
 * 
 * @param errors - Validation errors object from API
 * @returns Formatted error string or empty string if no errors
 */
export const formatRefundValidationErrors = (errors?: Record<string, string[]>): string => {
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
 * Check if a refund response indicates a full refund
 */
export function isFullRefundResponse(response: FullRefundResponseData): boolean {
  return response.refund_type === 'full_refund';
}

/**
 * Check if a refund response indicates a partial refund
 */
export function isPartialRefundResponse(response: PartialRefundResponseData): boolean {
  return response.refund_type === 'partial_refund';
}

/* -------------------------------------------------------------------------- */
/*                            EXPORT ALL HOOKS                                */
/* -------------------------------------------------------------------------- */

export default {
  useVoidTransaction,
  useRefundTransaction,
  refundKeys,
  extractRefundErrorMessage,
  formatRefundValidationErrors,
};