import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useSelector } from 'react-redux';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';
import { selectActiveVisitUuid } from '../../../../app/store/slices/visitSlice';
import type {
  DischargeRequest,
  UpdateDischargeRequest,
  DischargeSingleSuccessResponse,
  DischargeNotFoundResponse,
  DischargeValidationErrorResponse,
  DischargeSystemErrorResponse,
} from './DischargeTypes';

export const dischargeKeys = {
  all: (visitId: string) => ['visits', visitId, 'discharge'] as const,
  detail: (visitId: string) => [...dischargeKeys.all(visitId), 'detail'] as const,
};

export const useGetDischargeData = (
  visitId?: string | null,
  options?: Omit<
    UseQueryOptions<DischargeSingleSuccessResponse, AxiosError<DischargeNotFoundResponse | DischargeSystemErrorResponse>>,
    'queryKey' | 'queryFn'
  >
) => {
  const activeVisitUuid = useSelector(selectActiveVisitUuid);
  const effectiveVisitId = visitId ?? activeVisitUuid;
  const facilityId = useSelector(getActiveFacilityId);
  const { showToast } = useToast();

  return useQuery<DischargeSingleSuccessResponse, AxiosError<DischargeNotFoundResponse | DischargeSystemErrorResponse>>({
    queryKey: dischargeKeys.detail(effectiveVisitId ?? '0'),
    queryFn: async () => {
      if (!effectiveVisitId) {
        throw new Error('Visit ID is required');
      }
      try {
        const response = await axiosInstance.get<DischargeSingleSuccessResponse>(
          `/visits/${effectiveVisitId}/discharge`,
          { params: { facility_id: facilityId } }
        );
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<DischargeNotFoundResponse>;
        if (axiosError.response?.status !== 404) {
          showToast('error', axiosError.response?.data?.message || 'Failed to fetch discharge data', 5000);
        }
        throw error;
      }
    },
    enabled: !!effectiveVisitId && !!facilityId,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useCreateDischarge = (callbacks?: {
  onSuccess?: (data: DischargeSingleSuccessResponse) => void;
  onError?: (error: AxiosError<DischargeValidationErrorResponse | DischargeSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    DischargeSingleSuccessResponse,
    AxiosError<DischargeValidationErrorResponse | DischargeSystemErrorResponse>,
    { visitId: string; data: DischargeRequest }
  >({
    mutationFn: async ({ visitId: targetVisitId, data }) => {
      const response = await axiosInstance.post<DischargeSingleSuccessResponse>(
        `/visits/${targetVisitId}/discharge`,
        data
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: dischargeKeys.all(variables.visitId) });
      queryClient.invalidateQueries({ queryKey: ['visits', variables.visitId] });
      showToast('success', _data.message || 'Discharge record created successfully');
      callbacks?.onSuccess?.(_data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create discharge record';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};

export const useUpdateDischarge = (callbacks?: {
  onSuccess?: (data: DischargeSingleSuccessResponse) => void;
  onError?: (error: AxiosError<DischargeValidationErrorResponse | DischargeNotFoundResponse | DischargeSystemErrorResponse>) => void;
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    DischargeSingleSuccessResponse,
    AxiosError<DischargeValidationErrorResponse | DischargeNotFoundResponse | DischargeSystemErrorResponse>,
    { visitId: string; data: UpdateDischargeRequest }
  >({
    mutationFn: async ({ visitId: targetVisitId, data }) => {
      const response = await axiosInstance.put<DischargeSingleSuccessResponse>(
        `/visits/${targetVisitId}/discharge`,
        data
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: dischargeKeys.all(variables.visitId) });
      queryClient.invalidateQueries({ queryKey: ['visits', variables.visitId] });
      showToast('success', _data.message || 'Discharge record updated successfully');
      callbacks?.onSuccess?.(_data);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update discharge record';
      showToast('error', message);
      callbacks?.onError?.(error);
    },
  });
};
