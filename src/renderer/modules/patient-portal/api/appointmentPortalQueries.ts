import type { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { axiosInstance } from '../../../app/api/axiosConfig';
import { useToast } from '../../../app/store/contexts/toast/useToast';

export const PORTAL_APPOINTMENT_TYPES = [
  { value: 'followup_visit', label: 'Follow-up visit' },
  { value: 'new_patient_consultation', label: 'New patient consultation' },
  { value: 'annual_physical', label: 'Annual physical' },
  { value: 'telehealth', label: 'Telehealth' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'diagnostic_test', label: 'Diagnostic test' },
  { value: 'therapy_session', label: 'Therapy session' },
  { value: 'vaccination', label: 'Vaccination' },
] as const;

export type PortalAppointmentType = (typeof PORTAL_APPOINTMENT_TYPES)[number]['value'];

export interface PortalAppointmentFacility {
  id: number;
  name: string;
  type?: string | null;
}

export interface PortalAppointmentProvider {
  id: number;
  first_name: string;
  last_name: string;
  title?: string | null;
  specialty?: string | null;
}

export interface PortalAppointmentRow {
  id: number;
  facility?: PortalAppointmentFacility | null;
  provider?: PortalAppointmentProvider | null;
  appointment_type: string;
  appointment_type_display?: string | null;
  scheduled_start_time: string | null;
  scheduled_start_time_display?: string | null;
  duration_minutes: number | null;
  status: string;
  status_display?: string | null;
  reason_for_visit?: string | null;
  is_upcoming?: boolean;
}

interface AppointmentsListEnvelope {
  success?: boolean;
  data?: PortalAppointmentRow[] | { data?: PortalAppointmentRow[] };
  message?: string;
}

export function extractAppointmentsList(res: unknown): PortalAppointmentRow[] {
  if (!res || typeof res !== 'object') return [];
  const envelope = res as AppointmentsListEnvelope;
  if (!envelope.data) return [];
  const inner = envelope.data;
  if (Array.isArray(inner)) return inner;
  if (typeof inner === 'object' && inner !== null && Array.isArray((inner as { data?: unknown }).data)) {
    return (inner as { data: PortalAppointmentRow[] }).data;
  }
  return [];
}

export const appointmentPortalKeys = {
  all: ['patient-portal', 'appointments'] as const,
  list: (patientId: number) => [...appointmentPortalKeys.all, 'list', patientId] as const,
};

export function usePatientPortalAppointmentsList(
  patientId: number,
  options?: Omit<
    UseQueryOptions<AppointmentsListEnvelope, AxiosError<{ message?: string }>>,
    'queryKey' | 'queryFn'
  > & { perPage?: number }
) {
  const { perPage = 40, ...queryOptions } = options ?? {};
  return useQuery<AppointmentsListEnvelope, AxiosError<{ message?: string }>>({
    queryKey: appointmentPortalKeys.list(patientId),
    queryFn: async () => {
      const { data } = await axiosInstance.get<AppointmentsListEnvelope>('/appointments', {
        params: { patient_id: patientId, per_page: perPage },
      });
      return data;
    },
    enabled: patientId > 0,
    staleTime: 30_000,
    ...queryOptions,
  });
}

export interface CreatePortalAppointmentPayload {
  facility_id: number;
  patient_id: number;
  provider_staff_id: number;
  appointment_type: PortalAppointmentType | string;
  scheduled_start_time: string;
  duration_minutes: number;
  reason_for_visit?: string | null;
}

interface CreateAppointmentResponse {
  success: boolean;
  message?: string;
  data?: unknown;
}

export function formatAppointmentMutationError(
  err: AxiosError<{ message?: string; errors?: Record<string, string[] | string> }>
): string {
  const data = err.response?.data;
  const lines: string[] = [];
  if (data?.errors && typeof data.errors === 'object') {
    for (const msgs of Object.values(data.errors)) {
      if (Array.isArray(msgs)) {
        for (const m of msgs) {
          if (typeof m === 'string' && m.trim()) lines.push(m.trim());
        }
      } else if (typeof msgs === 'string' && msgs.trim()) {
        lines.push(msgs.trim());
      }
    }
  }
  if (lines.length > 0) {
    return lines.join(' ');
  }
  if (data?.message && typeof data.message === 'string' && data.message.trim()) {
    return data.message.trim();
  }
  return err.message?.trim() || 'Could not schedule appointment.';
}

export function useCreatePortalAppointment(patientId: number) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<CreateAppointmentResponse, AxiosError<{ message?: string; errors?: Record<string, string[]> }>, CreatePortalAppointmentPayload>({
    mutationFn: async (body) => {
      const { data } = await axiosInstance.post<CreateAppointmentResponse>('/appointments', body);
      return data;
    },
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: appointmentPortalKeys.list(patientId) });
      showToast('success', res.message ?? 'Appointment requested successfully.');
    },
    onError: (err) => {
      showToast('error', formatAppointmentMutationError(err));
    },
  });
}
