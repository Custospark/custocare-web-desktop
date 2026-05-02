/**
 * clinicalNotesForm.utils.ts
 * ============================================================================
 * CLINICAL NOTES FORM UTILITIES
 * ============================================================================
 * 
 * This file contains utility functions for the clinical notes form.
 * All mappings align with the backend ClinicalNoteResponse structure.
 * 
 * BACKEND MAPPING:
 * - chiefComplaint        → subjective
 * - historyOfPresentIllness → review_of_systems
 * - pastMedicalHistory    → past_medical_history
 * - observations          → objective
 * - clinicalNotes         → assessment + plan (handled intelligently to prevent duplication)
 * 
 * ASSESSMENT & PLAN HANDLING:
 * - When both fields have SAME content → store in both, display once
 * - When both fields have DIFFERENT content → store separately, display with headers
 * - When only one field has content → store in both, display that content
 * 
 * @module clinicalNotesForm.utils
 */

import {
  Activity,
  ClipboardList,
  FileSearch,
  FileText,
  HeartPulse,
  type LucideIcon,
} from 'lucide-react';
import type {
  ClinicalNoteValidationErrorResponse,
  CreateClinicalNoteRequest,
  UpdateClinicalNoteRequest,
  ClinicalNoteResponse,
} from '../../../../api/clinical-notes/clinicalNoteTypes';
import type {
  ClinicalNotesFormValues,
  ClinicalNotesSectionDefinition,
  ClinicalNotesThemeTokens,
  ClinicalNoteListItem,
} from './clinicalNotesForm.types';

// Re-export types for convenience
export type { ClinicalNoteListItem, ClinicalNotesFormValues };

/* -------------------------------------------------------------------------- */
/*                              FORM CONSTANTS                                */
/* -------------------------------------------------------------------------- */

/**
 * Empty form values for creating a new clinical note
 */
export const EMPTY_CLINICAL_NOTES_FORM: ClinicalNotesFormValues = {
  chiefComplaint: '',
  historyOfPresentIllness: '',
  pastMedicalHistory: '',
  observations: '',
  clinicalNotes: '',
};

/**
 * Form section definitions with backend field mapping documentation
 */
export const CLINICAL_NOTES_SECTIONS: ClinicalNotesSectionDefinition[] = [
  {
    key: 'chiefComplaint',
    label: 'Reason for visit',
    description: 'Main concern or symptom reported today',
    placeholder: 'Example: Fever, cough, and chest tightness for 3 days',
    rows: 3,
    required: true,
    previewFallback: 'No reason for visit recorded.',
    icon: Activity as LucideIcon,
    backendField: 'subjective',
  },
  {
    key: 'historyOfPresentIllness',
    label: 'Current problem details',
    description: 'When it started, how it changed, and related symptoms',
    placeholder: 'Describe when the problem started, how it progressed, and what makes it better or worse',
    rows: 4,
    previewFallback: 'No current problem details recorded.',
    icon: FileSearch as LucideIcon,
    backendField: 'review_of_systems',
  },
  {
    key: 'pastMedicalHistory',
    label: 'Past health history',
    description: 'Long-term illnesses, surgeries, allergies, or regular medicines',
    placeholder: 'Example: Hypertension, asthma, previous surgery, regular medications, allergies',
    rows: 3,
    previewFallback: 'No past health history recorded.',
    icon: HeartPulse as LucideIcon,
    backendField: 'past_medical_history',
  },
  {
    key: 'observations',
    label: 'Exam findings',
    description: 'Important findings from the physical examination',
    placeholder: 'Example: Alert, mild respiratory distress, temperature 38.4°C, reduced air entry bilaterally',
    rows: 4,
    previewFallback: 'No exam findings recorded.',
    icon: ClipboardList as LucideIcon,
    backendField: 'objective',
  },
  {
    key: 'clinicalNotes',
    label: 'Assessment and plan',
    description: 'Clinical impression, next steps, and care plan',
    placeholder: 'Example: Likely lower respiratory tract infection. Start treatment, monitor vitals, review in 48 hours.',
    rows: 4,
    previewFallback: 'No assessment or plan recorded.',
    icon: FileText as LucideIcon,
    backendField: 'assessment + plan',
  },
];

/* -------------------------------------------------------------------------- */
/*                              THEME FUNCTIONS                               */
/* -------------------------------------------------------------------------- */

/**
 * Get theme tokens for light/dark mode
 */
export const getClinicalNotesTheme = (theme: 'light' | 'dark'): ClinicalNotesThemeTokens => {
  const isDark = theme === 'dark';

  return {
    bg: {
      page: isDark ? 'bg-slate-950' : 'bg-slate-50',
      card: isDark ? 'bg-slate-900' : 'bg-white',
      subtle: isDark ? 'bg-slate-800/70' : 'bg-slate-50',
      hover: isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50',
      input: isDark ? 'bg-slate-950/60' : 'bg-white',
    },
    text: {
      primary: isDark ? 'text-slate-100' : 'text-slate-900',
      secondary: isDark ? 'text-slate-300' : 'text-slate-600',
      tertiary: isDark ? 'text-slate-400' : 'text-slate-500',
      brand: isDark ? 'text-blue-300' : 'text-blue-700',
    },
    border: {
      primary: isDark ? 'border-slate-800' : 'border-slate-200',
      focus: isDark ? 'focus:border-blue-500' : 'focus:border-blue-500',
    },
    state: {
      success: isDark ? 'text-emerald-300' : 'text-emerald-700',
      successSoft: isDark ? 'bg-emerald-950/40' : 'bg-emerald-50',
      warning: isDark ? 'text-amber-300' : 'text-amber-700',
      warningSoft: isDark ? 'bg-amber-950/40' : 'bg-amber-50',
      info: isDark ? 'text-blue-300' : 'text-blue-700',
      infoSoft: isDark ? 'bg-blue-950/40' : 'bg-blue-50',
      danger: isDark ? 'text-red-300' : 'text-red-700',
      dangerSoft: isDark ? 'bg-red-950/40' : 'bg-red-50',
    },
  };
};

/* -------------------------------------------------------------------------- */
/*                          NOTE SELECTION HELPERS                            */
/* -------------------------------------------------------------------------- */

/**
 * Pick the primary (most recent) clinical note from a list
 */
export const pickPrimaryClinicalNote = (
  notes: ClinicalNoteResponse[] | undefined | null
): ClinicalNoteResponse | null => {
  if (!notes?.length) return null;

  const sorted = [...notes].sort((a, b) => {
    const aDate = new Date(a.updated_at || a.created_at || 0).getTime();
    const bDate = new Date(b.updated_at || b.created_at || 0).getTime();
    return bDate - aDate;
  });

  return sorted[0] ?? null;
};

/**
 * Format clinical note datetime for display
 */
export const formatClinicalNoteDateTime = (value: string | null | undefined): string => {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
};

/**
 * Get clinical note UUID from a note object
 */
export const getClinicalNoteUuid = (note: ClinicalNoteResponse | null | undefined): string | null => {
  if (!note) return null;
  return note.uuid || null;
};

/**
 * Get clinical note title (uses chief complaint or subjective)
 */
export const getClinicalNoteTitle = (
  note: ClinicalNoteResponse | null | undefined,
  values: ClinicalNotesFormValues
): string => {
  if (values.chiefComplaint.trim()) {
    return values.chiefComplaint.trim().slice(0, 80);
  }
  if (note?.subjective) {
    return note.subjective.slice(0, 80);
  }
  return 'Clinical Note';
};

/**
 * Format clinical note date for display
 */
export const formatClinicalNoteDate = (value: string | null | undefined): string => {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Get clinical note metadata for display
 */
export const getClinicalNoteMeta = (note: ClinicalNoteResponse | null | undefined) => ({
  createdAt: note?.created_at || null,
  updatedAt: note?.updated_at || null,
  status: note?.note_status || null,
  author: note?.staff?.full_name || note?.staff_name || null,
  patientId: note?.patient_id || null,
  patientNumber: note?.patient_number || null,
  patientName: note?.patient_name || null,
  staffName: note?.staff_name || note?.staff_name || null,
  visitId: note?.visit_id || null,
  noteType: note?.note_type || null,
});

/* -------------------------------------------------------------------------- */
/*                    ASSESSMENT & PLAN HELPERS (FIX)                         */
/* -------------------------------------------------------------------------- */

/**
 * Combine assessment and plan for display in the form
 * Prevents duplicate content when both fields contain the same value
 * 
 * @param assessment - Backend assessment field
 * @param plan - Backend plan field
 * @returns Combined string for form display
 * 
 * BEHAVIOR:
 * - Both empty → empty string
 * - Only assessment exists → assessment content
 * - Only plan exists → plan content
 * - Same content → show once
 * - Different content → show with **ASSESSMENT** and **PLAN** headers
 */
const combineAssessmentAndPlan = (
  assessment: string | null | undefined,
  plan: string | null | undefined
): string => {
  const hasAssessment = assessment && assessment.trim();
  const hasPlan = plan && plan.trim();

  // Neither field has content
  if (!hasAssessment && !hasPlan) {
    return '';
  }

  // Only assessment exists
  if (hasAssessment && !hasPlan) {
    return assessment!.trim();
  }

  // Only plan exists
  if (!hasAssessment && hasPlan) {
    return plan!.trim();
  }

  // Both exist - check if they are the same
  const isDuplicate = assessment!.trim() === plan!.trim();
  
  if (isDuplicate) {
    // Same content - show once
    return assessment!.trim();
  }

  // Different content - combine with section headers
  return `**ASSESSMENT**\n${assessment!.trim()}\n\n**PLAN**\n${plan!.trim()}`;
};

/**
 * Split combined clinical notes into assessment and plan for backend
 * Reverses the combineAssessmentAndPlan operation
 * 
 * @param clinicalNotes - Combined string from form
 * @returns Object with assessment and plan fields
 */
const splitAssessmentAndPlan = (clinicalNotes: string): { assessment: string | null; plan: string | null } => {
  if (!clinicalNotes.trim()) {
    return { assessment: null, plan: null };
  }

  const trimmed = clinicalNotes.trim();
  
  // Check if the text contains section headers (from combined display with different content)
  const assessmentMatch = trimmed.match(/\*\*ASSESSMENT\*\*\n([\s\S]*?)(?=\n\n\*\*PLAN\*\*|\n\*\*PLAN\*\*|$)/);
  const planMatch = trimmed.match(/\*\*PLAN\*\*\n([\s\S]*?)$/);

  if (assessmentMatch && planMatch) {
    // This was a combined display with different content
    return {
      assessment: assessmentMatch[1].trim() || null,
      plan: planMatch[1].trim() || null,
    };
  }

  // No section headers - treat entire content as both assessment and plan
  // This handles:
  // - New notes created with this system (same content)
  // - Existing notes from legacy systems
  // - Notes where user entered content without using headers
  const content = trimmed;
  return {
    assessment: content,
    plan: content,
  };
};

/* -------------------------------------------------------------------------- */
/*                          FORM VALUE EXTRACTION                             */
/* -------------------------------------------------------------------------- */

/**
 * Extract form values from backend note response
 * Maps backend SOAP fields to form fields
 */
export const extractClinicalNotesFormValues = (
  note: ClinicalNoteResponse | null | undefined
): ClinicalNotesFormValues => ({
  // MAP: backend.subjective → form.chiefComplaint
  chiefComplaint: note?.subjective || '',
  
  // MAP: backend.review_of_systems → form.historyOfPresentIllness
  historyOfPresentIllness: note?.review_of_systems || '',
  
  // MAP: backend.past_medical_history → form.pastMedicalHistory
  pastMedicalHistory: note?.past_medical_history || '',
  
  // MAP: backend.objective → form.observations
  observations: note?.objective || '',
  
  // FIX: Intelligently combine assessment and plan
  clinicalNotes: combineAssessmentAndPlan(note?.assessment, note?.plan),
});

/* -------------------------------------------------------------------------- */
/*                          PAYLOAD BUILDERS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Build create payload from form values
 * Maps form fields to backend CreateClinicalNoteRequest
 * 
 * Note: facility_id, visit_id, patient_id, staff_id are added by the mutation hook
 */
export const buildCreateClinicalNotePayload = (
  values: ClinicalNotesFormValues
): Partial<CreateClinicalNoteRequest> => {
  // FIX: Split clinicalNotes into assessment and plan intelligently
  const { assessment, plan } = splitAssessmentAndPlan(values.clinicalNotes);
  
  return {
    // MAP: form.chiefComplaint → backend.subjective
    subjective: values.chiefComplaint.trim() || null,
    
    // MAP: form.observations → backend.objective
    objective: values.observations.trim() || null,
    
    // MAP: form.clinicalNotes → backend.assessment (split if needed)
    assessment: assessment || values.clinicalNotes.trim() || null,
    
    // MAP: form.clinicalNotes → backend.plan (split if needed)
    plan: plan || values.clinicalNotes.trim() || null,
    
    // MAP: form.pastMedicalHistory → backend.past_medical_history
    past_medical_history: values.pastMedicalHistory.trim() || null,
    
    // MAP: form.historyOfPresentIllness → backend.review_of_systems
    review_of_systems: values.historyOfPresentIllness.trim() || null,
  };
};

/**
 * Build update payload from form values
 * Maps form fields to backend UpdateClinicalNoteRequest
 */
export const buildUpdateClinicalNotePayload = (
  values: ClinicalNotesFormValues
): Partial<UpdateClinicalNoteRequest> => {
  // FIX: Split clinicalNotes into assessment and plan intelligently
  const { assessment, plan } = splitAssessmentAndPlan(values.clinicalNotes);
  
  return {
    subjective: values.chiefComplaint.trim() || null,
    objective: values.observations.trim() || null,
    assessment: assessment || values.clinicalNotes.trim() || null,
    plan: plan || values.clinicalNotes.trim() || null,
    past_medical_history: values.pastMedicalHistory.trim() || null,
    review_of_systems: values.historyOfPresentIllness.trim() || null,
  };
};

/* -------------------------------------------------------------------------- */
/*                          ERROR MAPPING                                     */
/* -------------------------------------------------------------------------- */

/**
 * Map API field errors to form field errors
 * Converts backend validation errors to frontend-friendly format
 */
export const mapApiFieldErrorsToFormErrors = (
  errors: ClinicalNoteValidationErrorResponse['errors'] | null
): Partial<Record<keyof ClinicalNotesFormValues, string>> => {
  if (!errors) return {};

  return {
    // MAP: backend.subjective error → form.chiefComplaint
    chiefComplaint: errors.subjective?.[0],
    
    // MAP: backend.review_of_systems error → form.historyOfPresentIllness
    historyOfPresentIllness: errors.review_of_systems?.[0],
    
    // MAP: backend.past_medical_history error → form.pastMedicalHistory
    pastMedicalHistory: errors.past_medical_history?.[0],
    
    // MAP: backend.objective error → form.observations
    observations: errors.objective?.[0],
    
    // MAP: backend.assessment or plan error → form.clinicalNotes
    clinicalNotes: errors.assessment?.[0] || errors.plan?.[0],
  };
};

/* -------------------------------------------------------------------------- */
/*                          PREVIEW & COMPLETION                              */
/* -------------------------------------------------------------------------- */

/**
 * Get preview section text (returns value or fallback)
 */
export const getPreviewSectionText = (
  values: ClinicalNotesFormValues,
  key: keyof ClinicalNotesFormValues,
  fallback: string
): string => {
  const value = values[key]?.trim();
  return value || fallback;
};

/**
 * Calculate form completion percentage
 */
export const getSectionCompletion = (values: ClinicalNotesFormValues): number => {
  const total = CLINICAL_NOTES_SECTIONS.length;
  const completed = CLINICAL_NOTES_SECTIONS.filter((section) =>
    values[section.key]?.trim()
  ).length;

  return Math.round((completed / total) * 100);
};

/* -------------------------------------------------------------------------- */
/*                          SOAP NOTE FORMATTING                              */
/* -------------------------------------------------------------------------- */

/**
 * Format clinical note as SOAP format for display
 */
export const formatAsSoapNote = (note: ClinicalNoteResponse): string => {
  const sections: string[] = [];

  if (note.subjective) {
    sections.push(`**SUBJECTIVE**\n${note.subjective}`);
  }
  if (note.objective) {
    sections.push(`**OBJECTIVE**\n${note.objective}`);
  }
  if (note.assessment) {
    sections.push(`**ASSESSMENT**\n${note.assessment}`);
  }
  if (note.plan) {
    sections.push(`**PLAN**\n${note.plan}`);
  }

  return sections.join('\n\n');
};

/**
 * Get note summary (first 200 characters of assessment or plan)
 */
export const getNoteSummary = (note: ClinicalNoteResponse, maxLength: number = 200): string => {
  const content = note.assessment || note.plan || note.subjective || '';
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
};

/**
 * Check if assessment and plan are different (for UI hints)
 */
export const hasDistinctAssessmentAndPlan = (note: ClinicalNoteResponse | null | undefined): boolean => {
  if (!note) return false;
  const hasAssessment = note.assessment && note.assessment.trim();
  const hasPlan = note.plan && note.plan.trim();
  if (!hasAssessment || !hasPlan) return false;
  return note.assessment!.trim() !== note.plan!.trim();
};

/* -------------------------------------------------------------------------- */
/*                            EXPORT DEFAULTS                                 */
/* -------------------------------------------------------------------------- */

export default {
  EMPTY_CLINICAL_NOTES_FORM,
  CLINICAL_NOTES_SECTIONS,
  getClinicalNotesTheme,
  pickPrimaryClinicalNote,
  getClinicalNoteUuid,
  getClinicalNoteTitle,
  formatClinicalNoteDate,
  getClinicalNoteMeta,
  extractClinicalNotesFormValues,
  buildCreateClinicalNotePayload,
  buildUpdateClinicalNotePayload,
  mapApiFieldErrorsToFormErrors,
  getPreviewSectionText,
  getSectionCompletion,
  formatAsSoapNote,
  getNoteSummary,
  hasDistinctAssessmentAndPlan,
};