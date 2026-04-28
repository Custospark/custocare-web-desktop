import type {
  CreateLabRequestWithItemsRequest,
  DiagnosisContext,
  LabRequest,
  LabRequestItem,
  LabRequestPriority,
  LabTest,
} from '../../../../api/lab/LabTypes';
import { LabRequestItemStatus } from '../../../../api/lab/LabTypes';
import { LabRequestPriority as LabRequestPriorityEnum }  from '../../../../api/lab/LabTypes';

export interface LabRequestFormData {
  priority: LabRequestPriority;
  clinical_notes: string;
  diagnosis_notes: string;
  icd_codes_text: string;
  suspected_conditions_text: string;
}

export interface LabRequestTestFormData {
  local_id: number;
  item_uuid?: string | null;
  lab_test_id: number;
  test_uuid?: string | null;
  test_name: string;
  code: string;
  category: string;
  sample_type: string;
  notes: string;
  requires_fasting: boolean;
  turnaround_time_hours: number | null;
  status: string;
  is_existing: boolean;
}

export interface ColorTokens {
  bg: {
    card: string;
    input: string;
    subtle: string;
    hover: string;
    muted: string;
    modal: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    brand: string;
  };
  border: {
    primary: string;
    subtle: string;
    focus: string;
  };
}

export const EMPTY_LAB_REQUEST: LabRequestFormData = {
  priority: LabRequestPriorityEnum.ROUTINE,
  clinical_notes: '',
  diagnosis_notes: '',
  icd_codes_text: '',
  suspected_conditions_text: '',
};

export const EMPTY_LAB_REQUEST_TEST: LabRequestTestFormData = {
  local_id: 0,
  item_uuid: null,
  lab_test_id: 0,
  test_uuid: null,
  test_name: '',
  code: '',
  category: '',
  sample_type: '',
  notes: '',
  requires_fasting: false,
  turnaround_time_hours: null,
  status: LabRequestItemStatus.PENDING,
  is_existing: false,
};

const splitCsv = (value: string): string[] =>
  value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

export const toLabRequestFormData = (request?: LabRequest | null): LabRequestFormData => ({
  priority: request?.priority ?? LabRequestPriorityEnum.ROUTINE,
  clinical_notes: request?.clinical_notes ?? '',
  diagnosis_notes: request?.diagnosis_context?.notes ?? '',
  icd_codes_text: request?.diagnosis_context?.icd_codes?.join(', ') ?? '',
  suspected_conditions_text: request?.diagnosis_context?.suspected_conditions?.join(', ') ?? '',
});

export const toLabRequestTestFormData = (item: LabRequestItem): LabRequestTestFormData => ({
  local_id: item.id,
  item_uuid: item.item_uuid,
  lab_test_id: item.lab_test_id,
  test_uuid: item.lab_test?.test_uuid ?? null,
  test_name: item.lab_test?.name ?? 'Unknown Test',
  code: item.lab_test?.code ?? '',
  category: item.lab_test?.category ?? '',
  sample_type: item.sample_type ?? '',
  notes: item.notes ?? '',
  requires_fasting: item.lab_test?.requires_fasting ?? false,
  turnaround_time_hours: item.lab_test?.turnaround_time_hours ?? null,
  status: item.status,
  is_existing: true,
});

export const buildDiagnosisContext = (
  form: LabRequestFormData,
): DiagnosisContext | null => {
  const diagnosisContext: DiagnosisContext = {
    icd_codes: splitCsv(form.icd_codes_text),
    suspected_conditions: splitCsv(form.suspected_conditions_text),
    notes: form.diagnosis_notes.trim() || undefined,
  };

  const hasContent =
    Boolean(diagnosisContext.icd_codes?.length) ||
    Boolean(diagnosisContext.suspected_conditions?.length) ||
    Boolean(diagnosisContext.notes);

  return hasContent ? diagnosisContext : null;
};

export const applySelectedLabTest = (
  current: LabRequestTestFormData,
  labTest: LabTest,
): LabRequestTestFormData => ({
  ...current,
  lab_test_id: labTest.id,
  test_uuid: labTest.test_uuid,
  test_name: labTest.name,
  code: labTest.code ?? '',
  category: labTest.category ?? '',
  requires_fasting: labTest.requires_fasting,
  turnaround_time_hours: labTest.turnaround_time_hours,
});

export const buildLocalLabRequestTest = (
  form: LabRequestTestFormData,
): LabRequestTestFormData => ({
  ...form,
  local_id: form.local_id || Date.now(),
  status: form.status || LabRequestItemStatus.PENDING,
  is_existing: false,
});

export const toCreateLabRequestPayload = (params: {
  form: LabRequestFormData;
  tests: LabRequestTestFormData[];
  facilityId: number;
  patientId: number;
  visitId: number;
  userId?: number | null;
}): CreateLabRequestWithItemsRequest => ({
  visit_id: params.visitId,
  patient_id: params.patientId,
  facility_id: params.facilityId,
  requested_by_staff_id: params.userId ?? null,
  priority: params.form.priority,
  clinical_notes: params.form.clinical_notes.trim() || null,
  diagnosis_context: buildDiagnosisContext(params.form),
  items: params.tests.map((test) => ({
    lab_test_id: test.lab_test_id,
    sample_type: test.sample_type.trim() || null,
    notes: test.notes.trim() || null,
  })),
});