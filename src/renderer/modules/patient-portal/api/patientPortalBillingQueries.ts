import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useSelector } from 'react-redux';
import { axiosInstance } from '../../../app/api/axiosConfig';
import type { RootState } from '../../../app/store/rootReducer';
import { getPatientId } from '../../../app/store/utils/contextSelectors';
import type {
  ApiErrorResponse,
  BillingReviewItem,
  Pagination,
} from '../../medical-records/api/billing-review/BillingReviewTypes';

export interface PatientPortalBillingSummary {
  receipt_count: number;
  total_billed: number;
  total_paid: number;
  total_balance: number;
}

export interface PatientPortalBillingParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

export interface PatientPortalBillingResponse {
  success: boolean;
  message: string;
  data: {
    items: BillingReviewItem[];
    pagination: Pagination;
    summary: PatientPortalBillingSummary;
    filters_applied: Record<string, unknown>;
    search_term: string | null;
  };
}

export const patientPortalBillingKeys = {
  all: ['patient-portal-billing'] as const,
  list: (patientId: number, params: PatientPortalBillingParams) =>
    [...patientPortalBillingKeys.all, 'list', patientId, params] as const,
};

export function usePatientPortalBilling(
  params: PatientPortalBillingParams = {},
  options?: Omit<
    UseQueryOptions<PatientPortalBillingResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) {
  const patientId = useSelector((state: RootState) => getPatientId(state));
  const numericId = patientId ?? 0;
  const page = params.page ?? 1;
  const per_page = params.per_page ?? 25;

  return useQuery<PatientPortalBillingResponse, AxiosError<ApiErrorResponse>>({
    queryKey: patientPortalBillingKeys.list(numericId, { ...params, page, per_page }),
    queryFn: async () => {
      const response = await axiosInstance.get<PatientPortalBillingResponse>('/billing/patient-portal', {
        params: {
          page,
          per_page,
          search: params.search?.trim() || undefined,
          status: params.status || undefined,
          date_from: params.date_from || undefined,
          date_to: params.date_to || undefined,
        },
      });
      return response.data;
    },
    enabled: numericId > 0,
    staleTime: 60_000,
    ...options,
  });
}
