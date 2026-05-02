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
} from '../../../../api/clinical-notes/clinicalNoteTypes';
import type {
  ClinicalNoteListItem,
  ClinicalNotesFormValues,
  ClinicalNotesSectionDefinition,
  ClinicalNotesThemeTokens,
} from './clinicalNotesForm.types';

export const EMPTY_CLINICAL_NOTES_FORM: ClinicalNotesFormValues = {
  chiefComplaint: '',
  historyOfPresentIllness: '',
  pastMedicalHistory: '',
  observations: '',
  clinicalNotes: '',
};

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
  },
  {
    key: 'historyOfPresentIllness',
    label: 'Current problem details',
    description: 'When it started, how it changed, and related symptoms',
    placeholder:
      'Describe when the problem started, how it progressed, and what makes it better or worse',
    rows: 4,
    previewFallback: 'No current problem details recorded.',
    icon: FileSearch as LucideIcon,
  },
  {
    key: 'pastMedicalHistory',
    label: 'Past health history',
    description: 'Long-term illnesses, surgeries, allergies, or regular medicines',
    placeholder:
      'Example: Hypertension, asthma, previous surgery, regular medications, allergies',
    rows: 3,
    previewFallback: 'No past health history recorded.',
    icon: HeartPulse as LucideIcon,
  },
  {
    key: 'observations',
    label: 'Exam findings',
    description: 'Important findings from the physical examination',
    placeholder:
      'Example: Alert, mild respiratory distress, temperature 38.4°C, reduced air entry bilaterally',
    rows: 4,
    previewFallback: 'No exam findings recorded.',
    icon: ClipboardList as LucideIcon,
  },
  {
    key: 'clinicalNotes',
    label: 'Assessment and plan',
    description: 'Clinical impression, next steps, and care plan',
    placeholder:
      'Example: Likely lower respiratory tract infection. Start treatment, monitor vitals, review in 48 hours.',
    rows: 4,
    previewFallback: 'No assessment or plan recorded.',
    icon: FileText as LucideIcon,
  },
];

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const readString = (source: unknown, keys: string[]): string => {
  const record = asRecord(source);

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string') {
      return value;
    }
  }

  return '';
};

const readNumber = (source: unknown, keys: string[]): number | null => {
  const record = asRecord(source);

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }

  return null;
};

const readNestedName = (source: unknown, keys: string[]): string => {
  const record = asRecord(source);

  for (const key of keys) {
    const nested = record[key];
    const nestedRecord = asRecord(nested);

    const name =
      (typeof nestedRecord.name === 'string' && nestedRecord.name) ||
      (typeof nestedRecord.full_name === 'string' && nestedRecord.full_name) ||
      (typeof nestedRecord.display_name === 'string' && nestedRecord.display_name);

    if (name) return name;
  }

  return '';
};

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

export const pickPrimaryClinicalNote = (
  notes: ClinicalNoteListItem[] | undefined | null
): ClinicalNoteListItem | null => {
  if (!notes?.length) return null;

  const sorted = [...notes].sort((a, b) => {
    const aDate = new Date(
      readString(a, ['updated_at', 'created_at', 'updatedAt', 'createdAt']) || 0
    ).getTime();
    const bDate = new Date(
      readString(b, ['updated_at', 'created_at', 'updatedAt', 'createdAt']) || 0
    ).getTime();

    return bDate - aDate;
  });

  return sorted[0] ?? null;
};

export const extractClinicalNotesFormValues = (
  note: ClinicalNoteListItem | null | undefined
): ClinicalNotesFormValues => ({
  chiefComplaint: readString(note, ['chief_complaint', 'chiefComplaint', 'title', 'subject']),
  historyOfPresentIllness: readString(note, [
    'history_of_present_illness',
    'historyOfPresentIllness',
    'history_present_illness',
  ]),
  pastMedicalHistory: readString(note, [
    'past_medical_history',
    'pastMedicalHistory',
    'medical_history',
  ]),
  observations: readString(note, ['observations', 'physical_exam', 'physicalExam', 'findings']),
  clinicalNotes: readString(note, [
    'clinical_notes',
    'clinicalNotes',
    'assessment_and_plan',
    'assessmentAndPlan',
    'notes',
    'note',
    'content',
  ]),
});

export const buildCreateClinicalNotePayload = (
  values: ClinicalNotesFormValues
): CreateClinicalNoteRequest =>
  ({
    chief_complaint: values.chiefComplaint.trim(),
    history_of_present_illness: values.historyOfPresentIllness.trim(),
    past_medical_history: values.pastMedicalHistory.trim(),
    observations: values.observations.trim(),
    clinical_notes: values.clinicalNotes.trim(),
  }) as CreateClinicalNoteRequest;

export const buildUpdateClinicalNotePayload = (
  values: ClinicalNotesFormValues
): UpdateClinicalNoteRequest =>
  ({
    chief_complaint: values.chiefComplaint.trim(),
    history_of_present_illness: values.historyOfPresentIllness.trim(),
    past_medical_history: values.pastMedicalHistory.trim(),
    observations: values.observations.trim(),
    clinical_notes: values.clinicalNotes.trim(),
  }) as UpdateClinicalNoteRequest;

export const getClinicalNoteUuid = (note: ClinicalNoteListItem | null | undefined): string | null => {
  const uuid = readString(note, ['uuid', 'id']);
  return uuid || null;
};

export const getClinicalNoteTitle = (
  note: ClinicalNoteListItem | null | undefined,
  values: ClinicalNotesFormValues
): string => {
  const explicitTitle = readString(note, ['title', 'subject']);
  if (explicitTitle) return explicitTitle;

  if (values.chiefComplaint.trim()) {
    return values.chiefComplaint.trim().slice(0, 80);
  }

  return 'Clinical Note';
};

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

export const getClinicalNoteMeta = (note: ClinicalNoteListItem | null | undefined) => ({
  createdAt: readString(note, ['created_at', 'createdAt']),
  updatedAt: readString(note, ['updated_at', 'updatedAt']),
  status: readString(note, ['status', 'note_status']),
  author:
    readNestedName(note, ['staff', 'author', 'created_by', 'clinician']) ||
    readString(note, ['author_name', 'staff_name', 'created_by_name']),
  patientId: readNumber(note, ['patient_id', 'patientId']),
  visitId: readNumber(note, ['visit_id', 'visitId']),
});

export const mapApiFieldErrorsToFormErrors = (
  errors: ClinicalNoteValidationErrorResponse['errors'] | null
): Partial<Record<keyof ClinicalNotesFormValues, string>> => {
  if (!errors) return {};

  return {
    chiefComplaint: errors.chief_complaint?.[0],
    historyOfPresentIllness: errors.history_of_present_illness?.[0],
    pastMedicalHistory: errors.past_medical_history?.[0],
    observations: errors.observations?.[0],
    clinicalNotes: errors.clinical_notes?.[0],
  };
};

export const getSectionCompletion = (values: ClinicalNotesFormValues): number => {
  const total = CLINICAL_NOTES_SECTIONS.length;
  const completed = CLINICAL_NOTES_SECTIONS.filter((section) =>
    values[section.key].trim()
  ).length;

  return Math.round((completed / total) * 100);
};

export const getPreviewSectionText = (
  values: ClinicalNotesFormValues,
  key: keyof ClinicalNotesFormValues,
  fallback: string
): string => {
  const value = values[key]?.trim();
  return value || fallback;
};
