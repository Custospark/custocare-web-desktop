import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import type {
  CreateReferralRequest,
  Referral,
  ReferralCollection,
  UpdateReferralRequest,
} from './referralTypes';

export const referralKeys = {
  all: ['referrals'] as const,
  lists: () => [...referralKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...referralKeys.lists(), filters] as const,
  pending: (filters?: Record<string, unknown>) => [...referralKeys.all, 'pending', filters] as const,
  patient: (patientId: number) => [...referralKeys.all, 'patient', patientId] as const,
  facility: (facilityId: number, filters?: Record<string, unknown>) =>
    [...referralKeys.all, 'facility', facilityId, filters] as const,
  fromFacility: (facilityId: number, filters?: Record<string, unknown>) =>
    [...referralKeys.all, 'from-facility', facilityId, filters] as const,
  toFacility: (facilityId: number, filters?: Record<string, unknown>) =>
    [...referralKeys.all, 'to-facility', facilityId, filters] as const,
  detail: (uuid: string) => [...referralKeys.all, 'detail', uuid] as const,
};

export const useReferrals = (filters?: Record<string, unknown>, perPage = 15) =>
  useQuery<ReferralCollection>({
    queryKey: referralKeys.list(filters),
    queryFn: async () => {
      const { data } = await axiosInstance.get('/referrals', {
        params: { ...filters, per_page: perPage },
      });
      return data;
    },
  });

export const usePendingReferrals = (filters?: Record<string, unknown>, perPage = 15) =>
  useQuery<ReferralCollection>({
    queryKey: referralKeys.pending(filters),
    queryFn: async () => {
      const { data } = await axiosInstance.get('/referrals/pending', {
        params: { ...filters, per_page: perPage },
      });
      return data;
    },
    refetchInterval: 60_000,
  });

export const usePatientReferrals = (patientId: number, filters?: Record<string, unknown>) =>
  useQuery<ReferralCollection>({
    queryKey: referralKeys.patient(patientId),
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/referrals/patient/${patientId}`, {
        params: filters,
      });
      return data;
    },
    enabled: patientId > 0,
  });

export const useReferralsFromFacility = (facilityId: number, filters?: Record<string, unknown>) =>
  useQuery<ReferralCollection>({
    queryKey: referralKeys.fromFacility(facilityId, filters),
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/referrals/from-facility/${facilityId}`, {
        params: filters,
      });
      return data;
    },
    enabled: facilityId > 0,
  });

export const useReferralsToFacility = (facilityId: number, filters?: Record<string, unknown>) =>
  useQuery<ReferralCollection>({
    queryKey: referralKeys.toFacility(facilityId, filters),
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/referrals/to-facility/${facilityId}`, {
        params: filters,
      });
      return data;
    },
    enabled: facilityId > 0,
  });

export const useReferral = (uuid: string) =>
  useQuery<Referral>({
    queryKey: referralKeys.detail(uuid),
    queryFn: async () => {
      const { data } = await axiosInstance.get(`/referrals/${uuid}`);
      return data;
    },
    enabled: !!uuid,
  });

export const useCreateReferral = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateReferralRequest) => {
      const { data } = await axiosInstance.post('/referrals', payload);
      return data as Referral;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: referralKeys.all }),
  });
};

export const useUpdateReferral = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ uuid, payload }: { uuid: string; payload: UpdateReferralRequest }) => {
      const { data } = await axiosInstance.put(`/referrals/${uuid}`, payload);
      return data as Referral;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: referralKeys.all }),
  });
};

export const useAcceptReferral = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ uuid, receiving_staff_id }: { uuid: string; receiving_staff_id: number }) => {
      const { data } = await axiosInstance.post(`/referrals/${uuid}/accept`, { receiving_staff_id });
      return data as Referral;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: referralKeys.all }),
  });
};

export const useRejectReferral = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ uuid, reason }: { uuid: string; reason?: string }) => {
      const { data } = await axiosInstance.post(`/referrals/${uuid}/reject`, { reason });
      return data as Referral;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: referralKeys.all }),
  });
};

export const useCompleteReferral = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (uuid: string) => {
      const { data } = await axiosInstance.post(`/referrals/${uuid}/complete`);
      return data as Referral;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: referralKeys.all }),
  });
};

export const useCancelReferral = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ uuid, reason }: { uuid: string; reason?: string }) => {
      const { data } = await axiosInstance.post(`/referrals/${uuid}/cancel`, { reason });
      return data as Referral;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: referralKeys.all }),
  });
};

export const useDeleteReferral = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (uuid: string) => {
      await axiosInstance.delete(`/referrals/${uuid}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: referralKeys.all }),
  });
};
