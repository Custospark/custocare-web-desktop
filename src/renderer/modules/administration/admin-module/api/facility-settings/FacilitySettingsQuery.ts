/**
 * ============================================================================
 * FACILITY SETTINGS REACT QUERY HOOKS
 * ============================================================================
 *
 * Endpoints (baseURL = API_BASE_URL):
 *   GET  /facilities/{facility}/settings
 *   PUT  /facilities/{facility}/settings
 *   POST /facilities/{facility}/settings/logo
 *
 * IMPORTANT:
 * Facility ID is injected from activeContextSlice (activeFacilityId).
 */

import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useSelector } from 'react-redux';

/**
 * Adjust these imports ONLY if your folder depth differs.
 * (Kept consistent with your ProfileQueries example.)
 */
import type { RootState } from '../../../../../app/store/rootReducer';
import { axiosInstance } from '../../../../../app/api/axiosConfig';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';

import type {
  ApiErrorResponse,
  GetFacilitySettingsResponse,
  MutationCallbacks,
  UpdateFacilitySettingsRequest,
  UpdateFacilitySettingsResponse,
  UploadFacilityLogoResponse,
} from './FacilitySettingsTypes';

/* -------------------------------------------------------------------------- */
/*                                    Keys                                    */
/* -------------------------------------------------------------------------- */

export const facilitySettingsKeys = {
  all: ['facilitySettings'] as const,
  details: () => [...facilitySettingsKeys.all, 'detail'] as const,
  detail: (facilityId: number) => [...facilitySettingsKeys.details(), facilityId] as const,
};

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

export const formatValidationErrors = (errors?: Record<string, string[]>): string => {
  if (!errors || Object.keys(errors).length === 0) return '';
  return Object.entries(errors)
    .map(([field, messages]) => {
      const label = field.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      return `${label}: ${messages.join(', ')}`;
    })
    .join(' | ');
};

export const extractErrorMessage = (
  error: AxiosError<ApiErrorResponse>,
  fallback = 'An unexpected error occurred.',
): string => error.response?.data?.message || error.message || fallback;

const useActiveFacilityId = (): number | null =>
  useSelector((state: RootState) => state.activeContext.activeFacilityId);

/* -------------------------------------------------------------------------- */
/*                                   Query                                    */
/* -------------------------------------------------------------------------- */

export const useGetFacilitySettings = (
  options?: Omit<
    UseQueryOptions<GetFacilitySettingsResponse, AxiosError<ApiErrorResponse>>,
    'queryKey' | 'queryFn'
  >,
) => {
  const facilityId = useActiveFacilityId();

  return useQuery<GetFacilitySettingsResponse, AxiosError<ApiErrorResponse>>({
    queryKey: facilityId ? facilitySettingsKeys.detail(facilityId) : facilitySettingsKeys.details(),
    enabled: !!facilityId,
    queryFn: async () => {
      const res = await axiosInstance.get<GetFacilitySettingsResponse>(
        `/facilities/${facilityId}/settings`,
      );
      return res.data;
    },
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                                 Mutations                                  */
/* -------------------------------------------------------------------------- */

export const useUpdateFacilitySettings = (
  callbacks: MutationCallbacks<
    UpdateFacilitySettingsResponse,
    AxiosError<ApiErrorResponse>
  > = {},
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const facilityId = useActiveFacilityId();

  return useMutation<
    UpdateFacilitySettingsResponse,
    AxiosError<ApiErrorResponse>,
    { data: UpdateFacilitySettingsRequest }
  >({
    mutationFn: async ({ data }) => {
      if (!facilityId) {
        // keep error shape simple (will be shown via onError fallback)
        throw new Error('No active facility selected.');
      }
      const res = await axiosInstance.put<UpdateFacilitySettingsResponse>(
        `/facilities/${facilityId}/settings`,
        data,
      );
      return res.data;
    },

    onSuccess: (data) => {
      showToast('success', data.message || 'Facility settings updated successfully!', 6000);

      if (facilityId) {
        // Patch cache immediately for a snappier UI
        queryClient.setQueryData(facilitySettingsKeys.detail(facilityId), data);

        // And refetch to ensure backend-computed fields are synced
        queryClient.invalidateQueries({ queryKey: facilitySettingsKeys.detail(facilityId) });
      }

      callbacks.onSuccess?.(data);
    },

    onError: (error: any) => {
      const axiosErr = error as AxiosError<ApiErrorResponse>;
      const base = extractErrorMessage(axiosErr, 'Failed to update facility settings.');
      const details = formatValidationErrors(axiosErr.response?.data?.errors);
      showToast('error', details ? `${base} (${details})` : base, 9000);
      callbacks.onError?.(axiosErr);
    },
  });
};

export const useUploadFacilityLogo = (
  callbacks: MutationCallbacks<
    UploadFacilityLogoResponse,
    AxiosError<ApiErrorResponse>
  > = {},
) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const facilityId = useActiveFacilityId();

  return useMutation<
    UploadFacilityLogoResponse,
    AxiosError<ApiErrorResponse>,
    { file: File }
  >({
    mutationFn: async ({ file }) => {
      if (!facilityId) {
        throw new Error('No active facility selected.');
      }

      const form = new FormData();
      form.append('logo', file);

      // IMPORTANT: Do NOT set Content-Type manually; axios will set boundary.
      const res = await axiosInstance.post<UploadFacilityLogoResponse>(
        `/facilities/${facilityId}/settings/logo`,
        form,
      );

      return res.data;
    },

    onSuccess: (data) => {
      showToast('success', data.message || 'Facility logo uploaded successfully!', 6000);

      if (facilityId) {
        // Patch Branding fields in cache immediately
        queryClient.setQueryData(facilitySettingsKeys.detail(facilityId), (prev: any) => {
          if (!prev?.data) return prev;

          return {
            ...prev,
            data: {
              ...prev.data,
              Branding: {
                ...prev.data.Branding,
                facility_logo_path: data.data.facility_logo_path,
                facility_logo_url: data.data.facility_logo_url,
              },
            },
          };
        });

        queryClient.invalidateQueries({ queryKey: facilitySettingsKeys.detail(facilityId) });
      }

      callbacks.onSuccess?.(data);
    },

    onError: (error) => {
      const base = extractErrorMessage(error, 'Logo upload failed.');
      const details = formatValidationErrors(error.response?.data?.errors);
      showToast('error', details ? `${base} (${details})` : base, 9000);
      callbacks.onError?.(error);
    },
  });
};
