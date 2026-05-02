import type { LucideIcon } from 'lucide-react';
import type { ClinicalNoteListSuccessResponse } from '../../../../api/clinical-notes/clinicalNoteTypes';

export type ClinicalNoteListItem =
  ClinicalNoteListSuccessResponse['data'] extends Array<infer Item> ? Item : never;

export interface ClinicalNotesFormValues {
  chiefComplaint: string;
  historyOfPresentIllness: string;
  pastMedicalHistory: string;
  observations: string;
  clinicalNotes: string;
}

export type ClinicalNotesFormData = ClinicalNotesFormValues;

export type ClinicalNotesMode = 'idle' | 'create' | 'edit';
export type ClinicalNotesPreviewAction = 'preview' | 'print' | 'download';

export interface ClinicalNotesThemeTokens {
  bg: {
    page: string;
    card: string;
    subtle: string;
    hover: string;
    input: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    brand: string;
  };
  border: {
    primary: string;
    focus: string;
  };
  state: {
    success: string;
    successSoft: string;
    warning: string;
    warningSoft: string;
    info: string;
    infoSoft: string;
    danger: string;
    dangerSoft: string;
  };
}

export interface ClinicalNotesSectionDefinition {
  key: keyof ClinicalNotesFormValues;
  label: string;
  description: string;
  placeholder: string;
  rows: number;
  required?: boolean;
  previewFallback: string;
  icon: LucideIcon;
}
