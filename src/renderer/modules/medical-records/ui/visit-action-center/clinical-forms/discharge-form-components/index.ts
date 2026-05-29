export { DischargeHeader } from './DischargeHeader';
export { DischargeEmptyState } from './DischargeEmptyState';
export { DischargeSummaryCard } from './DischargeSummaryCard';
export { DischargeEditor } from './DischargeEditor';
export { DischargePreviewDocument } from './DischargePreviewDocument';
export { DischargePreviewModal } from './DischargePreviewModal';

export type {
  DischargeFormValues,
  DischargeMode,
  DischargePreviewAction,
  DischargeMedicationFormItem,
  ColorTokens,
  DischargeData,
  DischargeDisposition,
} from './dischargeForm.types';

export { getColors } from './dischargeForm.types';

export {
  EMPTY_DISCHARGE_FORM,
  EMPTY_MEDICATION_ITEM,
  DISCHARGE_DISPOSITION_OPTIONS,
  MEDICATION_ROUTE_OPTIONS,
} from './dischargeForm.types';

export {
  normalizeDischargeResponse,
  buildCreateDischargePayload,
  buildUpdateDischargePayload,
  extractFormErrors,
  extractDischargeErrorMessage,
} from './dischargeForm.utils';
