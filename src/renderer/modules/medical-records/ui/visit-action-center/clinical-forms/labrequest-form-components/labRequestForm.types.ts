// labrequest-form-components/labRequestForm.types.ts

import type {
  CreateLabRequestItemRequest,
  DiagnosisContext,
  LabRequest,
  LabRequestItem,
  LabTemplate,
  LabTest,
  UpdateLabRequestItemRequest,
} from '../../../../api/lab/LabTypes';
import {
  LabRequestItemStatus,
  LabRequestPriority,
  LabResultFlag,
} from '../../../../api/lab/LabTypes';

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

export interface LabRequestFormData {
  priority: LabRequestPriority;
  clinical_notes: string;
  diagnosis_notes: string;
  suspected_conditions: string;
  icd_codes: string;
}

// Helper to format dates consistently
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const diffDays = Math.floor(diffMs / 86400000);
  
  // Today: show time only
  if (diffDays === 0 && date.toDateString() === now.toDateString()) {
    return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Within last 7 days: show day name
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' });
  }
  
  // Older: show full date
  return date.toLocaleDateString([], { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
// Helper function to calculate time difference between two dates
export const getTimeDifference = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours % 24}h`;
  }
  if (diffHours > 0) {
    return `${diffHours}h ${diffMins % 60}m`;
  }
  return `${diffMins}m`;
};
export type LabRequestItemSource = 'lab_test' | 'inventory' | 'template';

export interface LabRequestDraftItem {
  id: number;
  item_uuid?: string | null;
  display_name: string;
  lab_test_id: number | null;
  source: LabRequestItemSource;
  source_inventory_item_id?: number | null;
  sample_type?: string | null;
  notes?: string | null;
  template_id?: number | null;
  template_name?: string | null;
  code?: string | null;
  category?: string | null;
  turnaround_time_hours?: number | null;
  requires_fasting?: boolean;
  is_from_inventory?: boolean;
  inventory_display_unit?: string | null;
  inventory_available_quantity?: number | null;
  status?: LabRequestItemStatus;
  result_flag?: LabResultFlag;
  lab_test?: LabTest | null;
  
  // NEW: Draft tracking fields
  isDraft?: boolean;      // Whether this item is a draft (not yet saved to DB)
  tempId?: string;        // Temporary ID for draft items
}

export interface LabRequestItemEditorData {
  id: number | null;
  item_uuid: string | null;
  display_name: string;
  lab_test_id: number | null;
  source: LabRequestItemSource;
  source_inventory_item_id: number | null;
  sample_type: string;
  notes: string;
  template_id: number | null;
  template_name: string;
  code: string;
  category: string;
  turnaround_time_hours: number | null;
  requires_fasting: boolean;
  is_from_inventory: boolean;
  inventory_display_unit: string;
  inventory_available_quantity: number | null;
}

export interface LabTemplateSelectionResult {
  template: LabTemplate;
  items: LabRequestDraftItem[];
}

export const EMPTY_LAB_REQUEST: LabRequestFormData = {
  priority: LabRequestPriority.ROUTINE,
  clinical_notes: '',
  diagnosis_notes: '',
  suspected_conditions: '',
  icd_codes: '',
};

export const EMPTY_LAB_REQUEST_ITEM: LabRequestItemEditorData = {
  id: null,
  item_uuid: null,
  display_name: '',
  lab_test_id: null,
  source: 'lab_test',
  source_inventory_item_id: null,
  sample_type: '',
  notes: '',
  template_id: null,
  template_name: '',
  code: '',
  category: '',
  turnaround_time_hours: null,
  requires_fasting: false,
  is_from_inventory: false,
  inventory_display_unit: '',
  inventory_available_quantity: null,
};

const splitCsvText = (value: string): string[] => {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

export const buildDiagnosisContextPayload = (
  formData: LabRequestFormData
): DiagnosisContext | null => {
  const icdCodes = splitCsvText(formData.icd_codes);
  const suspectedConditions = splitCsvText(formData.suspected_conditions);
  const notes = formData.diagnosis_notes.trim();

  if (!icdCodes.length && !suspectedConditions.length && !notes) {
    return null;
  }

  return {
    icd_codes: icdCodes.length ? icdCodes : undefined,
    suspected_conditions: suspectedConditions.length ? suspectedConditions : undefined,
    notes: notes || undefined,
  };
};

export const toLabRequestFormData = (
  request?: LabRequest | null
): LabRequestFormData => {
  if (!request) return EMPTY_LAB_REQUEST;

  return {
    priority: request.priority,
    clinical_notes: request.clinical_notes || '',
    diagnosis_notes: request.diagnosis_context?.notes || '',
    suspected_conditions: request.diagnosis_context?.suspected_conditions?.join(', ') || '',
    icd_codes: request.diagnosis_context?.icd_codes?.join(', ') || '',
  };
};

export const toLabRequestDraftItems = (
  items?: LabRequestItem[] | null
): LabRequestDraftItem[] => {
  if (!items?.length) return [];

  return items.map((item) => ({
    id: item.id,
    item_uuid: item.item_uuid,
    display_name: item.lab_test?.name || `Lab Test #${item.id}`,
    lab_test_id: item.lab_test_id,
    source: 'lab_test',
    sample_type: item.sample_type || '',
    notes: item.notes || '',
    template_id: item.lab_test?.template_id || null,
    template_name: item.lab_test?.template?.name || '',
    code: item.lab_test?.code || '',
    category: item.lab_test?.category || '',
    turnaround_time_hours: item.lab_test?.turnaround_time_hours ?? null,
    requires_fasting: !!item.lab_test?.requires_fasting,
    is_from_inventory: false,
    inventory_display_unit: '',
    inventory_available_quantity: null,
    status: item.status,
    result_flag: item.result_flag,
    lab_test: item.lab_test || null,
    isDraft: false,  // Saved items are not drafts
    tempId: undefined,
  }));
};

// NEW: Helper to identify draft items
export const isDraftItem = (item: LabRequestDraftItem): boolean => {
  return item.isDraft === true;
};

// NEW: Generate a temporary ID for draft items
export const generateTempId = (): string => {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const buildLocalLabRequestDraftItem = (
  data: LabRequestItemEditorData,
  localId: number
): LabRequestDraftItem => {
  const tempId = generateTempId();
  
  return {
    id: localId,
    item_uuid: data.item_uuid,
    display_name: data.display_name.trim(),
    lab_test_id: data.lab_test_id,
    source: data.source,
    source_inventory_item_id: data.source_inventory_item_id,
    sample_type: data.sample_type.trim() || null,
    notes: data.notes.trim() || null,
    template_id: data.template_id,
    template_name: data.template_name.trim() || null,
    code: data.code.trim() || null,
    category: data.category.trim() || null,
    turnaround_time_hours: data.turnaround_time_hours,
    requires_fasting: data.requires_fasting,
    is_from_inventory: data.is_from_inventory,
    inventory_display_unit: data.inventory_display_unit.trim() || null,
    inventory_available_quantity: data.inventory_available_quantity,
    status: LabRequestItemStatus.PENDING,
    result_flag: LabResultFlag.PENDING,
    isDraft: true,  // Mark as draft
    tempId: tempId,  // Set temporary ID
    lab_test: {
      id: data.lab_test_id!,
      test_uuid: '',
      name: data.display_name.trim(),
      code: data.code.trim() || null,
      template_id: data.template_id!,
      facility_id: null,
      is_shared: false,
      category: data.category.trim() || null,
      description: data.notes.trim() || null,
      is_active: true,
      requires_fasting: data.requires_fasting,
      turnaround_time_hours: data.turnaround_time_hours,
      metadata: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      status: 'active',
      formatted_turnaround_time: data.turnaround_time_hours ? `${data.turnaround_time_hours} hour(s)` : null,
      fasting_required: data.requires_fasting,
      fasting_instruction: data.requires_fasting ? 'Fasting required for this test' : 'No fasting required',
    },
  };
};

export const isLabRequestDraftItemPersistable = (
  item: LabRequestDraftItem
): boolean => !!item.lab_test_id;

export const toLabRequestItemCreatePayload = (
  data: LabRequestItemEditorData
): Omit<CreateLabRequestItemRequest, 'lab_request_id'> => ({
  lab_test_id: data.lab_test_id as number,
  sample_type: data.sample_type.trim() || null,
  notes: data.notes.trim() || null,
  metadata: {
    source: data.source,
    source_inventory_item_id: data.source_inventory_item_id,
    template_id: data.template_id,
    template_name: data.template_name || null,
    display_name: data.display_name || null,
    is_from_inventory: data.is_from_inventory,
    inventory_display_unit: data.inventory_display_unit || null,
    inventory_available_quantity: data.inventory_available_quantity,
  },
});

export const toLabRequestItemUpdatePayload = (
  data: LabRequestItemEditorData,
  requestId: number
): UpdateLabRequestItemRequest => ({
  lab_request_id: requestId,
  lab_test_id: data.lab_test_id as number,
  sample_type: data.sample_type.trim() || null,
  notes: data.notes.trim() || null,
  metadata: {
    source: data.source,
    source_inventory_item_id: data.source_inventory_item_id,
    template_id: data.template_id,
    template_name: data.template_name || null,
    display_name: data.display_name || null,
    is_from_inventory: data.is_from_inventory,
    inventory_display_unit: data.inventory_display_unit || null,
    inventory_available_quantity: data.inventory_available_quantity,
  },
});