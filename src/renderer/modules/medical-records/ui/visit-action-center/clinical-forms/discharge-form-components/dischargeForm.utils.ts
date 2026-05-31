import type {
  DischargeData,
  DischargeRequest,
  UpdateDischargeRequest,
  DischargeValidationErrorResponse,
} from '../../../../api/discharge/DischargeTypes';
import type { AxiosError } from 'axios';
import type {
  DischargeFormValues,
} from './dischargeForm.types';
import { EMPTY_DISCHARGE_FORM } from './dischargeForm.types';

const generateTempId = (): string => {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
};

export const normalizeDischargeResponse = (data: DischargeData | null): DischargeFormValues => {
  if (!data) {
    return { ...EMPTY_DISCHARGE_FORM };
  }

  return {
    dischargedAt: data.discharged_at?.slice(0, 16) || EMPTY_DISCHARGE_FORM.dischargedAt,
    dischargeDisposition: (data.discharge_disposition || '') as DischargeFormValues['dischargeDisposition'],
    dischargeDiagnosis: data.discharge_diagnosis || '',
    dischargeInstructions: data.discharge_instructions || '',
    dischargeMedications: (data.discharge_medications || []).map((med) => ({
      tempId: generateTempId(),
      name: med.name || '',
      dosage: med.dosage || '',
      frequency: med.frequency || '',
      route: med.route || 'oral',
      durationDays: med.duration_days ?? null,
    })),
    followupScheduledAt: data.followup_scheduled_at?.slice(0, 16) || '',
    followupProviderStaffId: data.followup_provider?.id ?? null,
  };
};

export const buildCreateDischargePayload = (values: DischargeFormValues): DischargeRequest => {
  return {
    discharged_at: values.dischargedAt,
    discharge_disposition: (values.dischargeDisposition || '') as string,
    discharge_diagnosis: values.dischargeDiagnosis || null,
    discharge_instructions: values.dischargeInstructions,
    discharge_medications: values.dischargeMedications
      .filter((m) => m.name.trim())
      .map((m) => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        route: m.route,
        duration_days: m.durationDays,
      })),
    followup_scheduled_at: values.followupScheduledAt || null,
    followup_provider_staff_id: values.followupProviderStaffId,
  };
};

export const buildUpdateDischargePayload = (values: DischargeFormValues): UpdateDischargeRequest => {
  return {
    discharged_at: values.dischargedAt,
    discharge_disposition: (values.dischargeDisposition || '') as string,
    discharge_diagnosis: values.dischargeDiagnosis || null,
    discharge_instructions: values.dischargeInstructions,
    discharge_medications: values.dischargeMedications
      .filter((m) => m.name.trim())
      .map((m) => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        route: m.route,
        duration_days: m.durationDays,
      })),
    followup_scheduled_at: values.followupScheduledAt || null,
    followup_provider_staff_id: values.followupProviderStaffId,
  };
};

export const extractFormErrors = (
  error: AxiosError<DischargeValidationErrorResponse>
): Record<string, string> => {
  const apiErrors = error.response?.data?.errors;
  if (!apiErrors) return {};

  const fieldMap: Record<string, string> = {
    discharged_at: 'dischargedAt',
    discharge_disposition: 'dischargeDisposition',
    discharge_diagnosis: 'dischargeDiagnosis',
    discharge_instructions: 'dischargeInstructions',
    discharge_medications: 'dischargeMedications',
    followup_scheduled_at: 'followupScheduledAt',
    followup_provider_staff_id: 'followupProviderStaffId',
  };

  const result: Record<string, string> = {};
  Object.entries(apiErrors).forEach(([key, messages]) => {
    const formField = fieldMap[key] || key;
    result[formField] = messages[0];
  });

  return result;
};

export const extractDischargeErrorMessage = (
  error: AxiosError<DischargeValidationErrorResponse | { message?: string }>,
  fallbackMessage = 'An unexpected error occurred.'
): string => {
  const apiMessage = error.response?.data?.message;
  if (apiMessage) return apiMessage;

  switch (error.response?.status) {
    case 400: return 'Invalid request. Please check your input.';
    case 401: return 'Unauthorized. Please log in again.';
    case 403: return 'You do not have permission to perform this action.';
    case 404: return 'Discharge record not found.';
    case 422: return 'Validation failed. Please check your input.';
    case 500: return 'Server error. Please try again later.';
    default: return error.message || fallbackMessage;
  }
};
