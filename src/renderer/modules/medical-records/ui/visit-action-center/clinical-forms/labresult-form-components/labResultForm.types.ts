// lab-results/labresult-form-components/labResultForm.types.ts
import type { LabRequest, LabRequestItem, LabResult } from '../../../../api/lab/LabTypes';
import type { LabResultFlag } from '../../../../api/lab/LabTypes';

export interface ColorTokens {
  bg: {
    page: string;
    card: string;
    input: string;
    subtle: string;
    hover: string;
    muted: string;
    modal: string;
    accent: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    brand: string;
    danger: string;
    success: string;
    warning: string;
  };
  border: {
    primary: string;
    subtle: string;
    focus: string;
    accent: string;
  };
}

export interface LabResultFieldDraft {
  localId: string;
  result_uuid?: string;
  template_field_id: number | null;
  field_uuid?: string | null;
  field_name: string;
  field_code?: string | null;
  data_type?: string | null;
  display_order: number;
  is_required: boolean;
  is_critical: boolean;
  value: string;
  numeric_value: string;
  unit: string;
  reference_min: string;
  reference_max: string;
  flag: LabResultFlag;
  interpretation: string;
  comments: string;
  existingResult?: LabResult | null;
  isNew: boolean;
}

export interface LabResultHydratedMap {
  [itemUuid: string]: LabResult[];
}

export interface LabResultPreviewRow {
  rowId: string;
  itemUuid: string;
  testName: string;
  testCode: string;
  category: string;
  sampleType: string;
  itemStatus: string;
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: string;
  interpretation: string;
  comments: string;
  recordedAt: string;
  verifiedAt: string;
  recordedBy: string;
  verifiedBy: string;
}

export interface LabResultResolvedRequestScopeRenderPayload {
  request: LabRequest;
  refetch: () => Promise<unknown>;
  isFetching: boolean;
}

export interface LabResultEditorModalProps {
  open: boolean;
  isDark: boolean;
  colors: ColorTokens;
  request: LabRequest;
  item: LabRequestItem | null;
  staffId?: number | null;
  requestLocked: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export interface LabResultStatusActionsProps {
  item: LabRequestItem;
  results: LabResult[];
  staffId?: number | null;
  requestLocked: boolean;
  onActionComplete: () => void;
}

export interface LabResultPreviewModalProps {
  open: boolean;
  onClose: () => void;
  request: LabRequest;
  resultsMap: LabResultHydratedMap;
}

export interface LabResultItemResultsHydratedPayload {
  itemUuid: string;
  results: LabResult[];
}

export interface LabResultEmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface LabResultErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export interface LabResultLoadingStateProps {
  message?: string;
  theme?: 'light' | 'dark';
}

export interface FacilityPreviewMeta {
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  code?: string | null;
}
