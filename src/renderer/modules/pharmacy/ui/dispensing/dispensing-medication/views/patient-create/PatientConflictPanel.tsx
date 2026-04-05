import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Fingerprint,
  Info,
  Mail,
  Phone,
  Search,
  Shield,
  User,
} from 'lucide-react';

import { cn } from '../../../../../../../shared/utils/classNameUtils';

import type {
  ContactMatchField,
  CreatePatientRequest,
  PatientConflictCode,
  PatientSearchResult,
} from '../../../../../api/dispensing/patient-search/usePatientTypes';
import {
  calculateAge,
  formatPatientName,
  getBiologicalSexDisplayText,
  getPatientInitials,
  getStatusColor,
  getStatusDisplayText,
  requiresSpecialHandling,
} from '../../../../../api/dispensing/patient-search/usePatientTypes';

type ConflictType = 'duplicate' | 'existing_user' | null;

export interface ConflictState {
  type: ConflictType;
  originalData: CreatePatientRequest;
  data: {
    duplicatePatient?: PatientSearchResult;
    existingPatient?: PatientSearchResult;
    existingUserGlobalId?: string;
    matchedContactFields?: ContactMatchField[];
    matchedFields?: string[];
    demographicMatch?: boolean;
    conflictCode?: PatientConflictCode | null;
  };
}

export interface PatientConflictPanelProps {
  theme: 'light' | 'dark';
  conflict: ConflictState | null;
  form: Partial<CreatePatientRequest>;
  isSubmitting: boolean;
  onGoToPatientSearch: () => void;
  onDismiss: () => void;
}

function formatDisplayValue(value?: string | null): string {
  return value && value.trim().length > 0 ? value : 'Not provided';
}

function formatBooleanValue(value?: boolean | null): string {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return 'Not available';
}

function formatDateValue(value?: string | null): string {
  if (!value) return 'Not provided';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

function formatDateTimeValue(value?: string | null): string {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatMatchedContactFields(fields?: ContactMatchField[]): string {
  if (!fields || fields.length === 0) return '';

  if (fields.includes('email') && fields.includes('phone')) {
    return 'email address and phone number';
  }
  if (fields.includes('email')) {
    return 'email address';
  }
  if (fields.includes('phone')) {
    return 'phone number';
  }

  return '';
}

function getConflictHeadline(conflict: ConflictState): string {
  if (conflict.type === 'duplicate') {
    return 'We found a similar patient record';
  }

  if (conflict.type === 'existing_user') {
    const matchedFields = conflict.data.matchedContactFields || [];

    if (matchedFields.includes('email') && matchedFields.includes('phone')) {
      return 'A patient with this email address and phone number already exist on Custocare.';
    }
    if (matchedFields.includes('email')) {
      return 'A patient with this email address already exist on Custocare.';
    }
    if (matchedFields.includes('phone')) {
      return 'A patient with this phone number already exist on Custocare.';
    }

    return 'This contact information is already in use';
  }

  return 'Please review this information';
}

function getConflictDescription(conflict: ConflictState): string {
  const matchedFields = conflict.data.matchedContactFields || [];

  if (conflict.type === 'duplicate') {
    return 'Before creating a new patient, please review the similar record below. This helps prevent duplicate patient records and supports safer clinical workflows.';
  }

  if (conflict.type === 'existing_user') {
    if (conflict.data.conflictCode === 'IDENTITY_MISMATCH') {
      if (matchedFields.includes('email') && matchedFields.includes('phone')) {
        return 'The email address and phone number entered are already linked to a different person. Review the existing patient record carefully before proceeding.';
      }
      if (matchedFields.includes('email')) {
        return 'The email address entered is already linked to a different person. Review the existing patient record carefully before proceeding.';
      }
      if (matchedFields.includes('phone')) {
        return 'The phone number entered is already linked to a different person. Review the existing patient record carefully before proceeding.';
      }

      return 'The contact information entered is already linked to a different person. Review the existing patient record carefully before proceeding.';
    }

    if (matchedFields.includes('email') && matchedFields.includes('phone')) {
      return 'A patient with this email address and phone number already exists on Custocare. Review the existing record to avoid creating a duplicate chart.';
    }
    if (matchedFields.includes('email')) {
      return 'A patient with this email address already exists on Custocare. Review the existing record to avoid creating a duplicate chart.';
    }
    if (matchedFields.includes('phone')) {
      return 'A patient with this phone number already exists on Custocare. Review the existing record to avoid creating a duplicate chart.';
    }
  }

  return 'Please review the information below before continuing.';
}

function getConflictGuidance(conflict: ConflictState): string[] {
  const matchedFields = conflict.data.matchedContactFields || [];

  if (conflict.type === 'duplicate') {
    return [
      'Confirm whether the existing patient below is the same person as the patient you are trying to register.',
      'If it is the same person, open patient search and continue with the existing chart instead of creating a new record.',
      'If it is not the same person, correct any inaccurate demographic or contact details and try again.',
    ];
  }

  if (conflict.data.conflictCode === 'IDENTITY_MISMATCH') {
    if (matchedFields.includes('email') && matchedFields.includes('phone')) {
      return [
        'The supplied email address and phone number belong to another patient identity.',
        'Verify the patient\'s correct contact information before continuing.',
        'Use patient search to review the linked record if you need to confirm identity.',
      ];
    }
    if (matchedFields.includes('email')) {
      return [
        'The supplied email address belongs to another patient identity.',
        'Verify the patient\'s correct email address before continuing.',
        'Use patient search to review the linked record if you need to confirm identity.',
      ];
    }
    if (matchedFields.includes('phone')) {
      return [
        'The supplied phone number belongs to another patient identity.',
        'Verify the patient\'s correct phone number before continuing.',
        'Use patient search to review the linked record if you need to confirm identity.',
      ];
    }

    return [
      'The supplied contact details belong to another patient identity.',
      'Verify the patient\'s correct contact details before continuing.',
      'Use patient search to review the linked record if you need to confirm identity.',
    ];
  }

  if (matchedFields.includes('email') && matchedFields.includes('phone')) {
    return [
      'Review the existing patient details shown below.',
      'If this is the same patient, open patient search and use the existing record.',
      'If this is a different patient, update both the email address and phone number before trying again.',
    ];
  }
  if (matchedFields.includes('email')) {
    return [
      'Review the existing patient details shown below.',
      'If this is the same patient, open patient search and use the existing record.',
      'If this is a different patient, update the email address before trying again.',
    ];
  }
  if (matchedFields.includes('phone')) {
    return [
      'Review the existing patient details shown below.',
      'If this is the same patient, open patient search and use the existing record.',
      'If this is a different patient, update the phone number before trying again.',
    ];
  }

  return [
    'Review the matching details below.',
    'Open patient search if you want to continue with an existing record.',
    'Or keep editing if you need to correct the entered information.',
  ];
}

function getStatusBadgeClasses(
  theme: 'light' | 'dark',
  status: PatientSearchResult['status']
): string {
  const isDark = theme === 'dark';
  const color = getStatusColor(status);

  if (color === 'success') {
    return isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700';
  }
  if (color === 'warning') {
    return isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700';
  }
  if (color === 'error') {
    return isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700';
  }
  if (color === 'info') {
    return isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700';
  }

  return isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700';
}

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
  theme: 'light' | 'dark';
  mono?: boolean;
  capitalize?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({
  label,
  value,
  theme,
  mono = false,
  capitalize = false,
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>{label}</span>
      <span
        className={cn(
          'text-sm font-medium break-words',
          isDark ? 'text-gray-100' : 'text-gray-900',
          mono && 'font-mono text-xs sm:text-sm',
          capitalize && 'capitalize'
        )}
      >
        {value}
      </span>
    </div>
  );
};

const PatientConflictPanel: React.FC<PatientConflictPanelProps> = ({
  theme,
  conflict,
  form,
  isSubmitting,
  onGoToPatientSearch,
  onDismiss,
}) => {
  const isDark = theme === 'dark';

  if (!conflict) return null;

  const reviewPatient = conflict.data.duplicatePatient ?? conflict.data.existingPatient;
  const matchedFieldsText = formatMatchedContactFields(conflict.data.matchedContactFields);
  const headline = getConflictHeadline(conflict);
  const description = getConflictDescription(conflict);
  const guidance = getConflictGuidance(conflict);

  const enteredName = `${form.first_name ?? ''} ${form.last_name ?? ''}`.trim();
  const enteredAge = calculateAge(form.date_of_birth ?? null);
  const existingAge = calculateAge(reviewPatient?.date_of_birth ?? null);

  const cardClasses =
    conflict.type === 'duplicate'
      ? isDark
        ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-900/20 to-yellow-800/10'
        : 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50'
      : conflict.data.conflictCode === 'IDENTITY_MISMATCH'
        ? isDark
          ? 'border-red-500/30 bg-gradient-to-br from-red-900/20 to-red-800/10'
          : 'border-red-200 bg-gradient-to-br from-red-50 to-rose-50'
        : isDark
          ? 'border-blue-500/30 bg-gradient-to-br from-blue-900/20 to-blue-800/10'
          : 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50';

  const iconClasses =
    conflict.type === 'duplicate'
      ? isDark
        ? 'bg-yellow-500/20 text-yellow-400'
        : 'bg-yellow-100 text-yellow-700'
      : conflict.data.conflictCode === 'IDENTITY_MISMATCH'
        ? isDark
          ? 'bg-red-500/20 text-red-400'
          : 'bg-red-100 text-red-700'
        : isDark
          ? 'bg-blue-500/20 text-blue-400'
          : 'bg-blue-100 text-blue-700';

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className={cn('relative mb-6 overflow-hidden rounded-2xl border-2 p-4 sm:p-5 w-full', cardClasses)}
    >
      <div
        className={cn(
          'absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl opacity-25 sm:right-0 sm:top-0',
          conflict.type === 'duplicate'
            ? isDark
              ? 'bg-yellow-500/20'
              : 'bg-yellow-400/20'
            : conflict.data.conflictCode === 'IDENTITY_MISMATCH'
              ? isDark
                ? 'bg-red-500/20'
                : 'bg-red-400/20'
              : isDark
                ? 'bg-blue-500/20'
                : 'bg-blue-400/20'
        )}
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className={cn('w-fit rounded-2xl p-3', iconClasses)}>
          {conflict.type === 'duplicate' ? (
            <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : (
            <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className={cn('text-base font-semibold sm:text-lg md:text-xl', isDark ? 'text-white' : 'text-gray-900')}>
            {headline}
          </h4>

          <p className={cn('mt-2 text-sm leading-6', isDark ? 'text-gray-300' : 'text-gray-700')}>
            {description}
          </p>

          <div
            className={cn(
              'mt-4 rounded-xl border p-3 sm:p-4',
              isDark ? 'border-gray-700 bg-gray-900/40' : 'border-white/70 bg-white/80'
            )}
          >
            <div className="flex items-start gap-2">
              <Info className={cn('mt-0.5 h-4 w-4 flex-shrink-0', isDark ? 'text-blue-300' : 'text-blue-600')} />
              <div className={cn('text-sm leading-6', isDark ? 'text-gray-300' : 'text-gray-700')}>
                <span className="font-semibold">Decision support guidance:</span>
                <ul className="mt-2 space-y-1.5">
                  {guidance.map((step) => (
                    <li key={step} className="flex gap-2">
                      <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {conflict.data.conflictCode && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-semibold sm:px-3 sm:py-1',
                  conflict.data.conflictCode === 'IDENTITY_MISMATCH'
                    ? isDark
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-red-100 text-red-700'
                    : isDark
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-blue-100 text-blue-700'
                )}
              >
                Conflict: {conflict.data.conflictCode.replace(/_/g, ' ')}
              </span>
            )}

            {conflict.data.demographicMatch && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-semibold sm:px-3 sm:py-1',
                  isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                )}
              >
                Demographic match
              </span>
            )}

            {(conflict.data.matchedFields ?? []).map((field) => (
              <span
                key={field}
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-semibold sm:px-3 sm:py-1',
                  isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'
                )}
              >
                Matched: {field.replace(/_/g, ' ')}
              </span>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div
              className={cn(
                'rounded-xl border-2 p-3 sm:p-4',
                isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'
              )}
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold sm:h-11 sm:w-11',
                    isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                  )}
                >
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <div className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                    New Record
                  </div>
                  <div className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
                    Information currently entered
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <DetailRow
                  label="Name"
                  value={formatDisplayValue(enteredName)}
                  theme={theme}
                />
                <DetailRow
                  label="Date of birth"
                  value={formatDisplayValue(form.date_of_birth)}
                  theme={theme}
                />
                <DetailRow
                  label="Age"
                  value={enteredAge !== null ? `${enteredAge} years` : 'Not available'}
                  theme={theme}
                />
                <DetailRow
                  label="Biological sex"
                  value={
                    form.biological_sex
                      ? getBiologicalSexDisplayText(form.biological_sex)
                      : 'Not provided'
                  }
                  theme={theme}
                />
                <DetailRow
                  label="Email"
                  value={formatDisplayValue(form.email)}
                  theme={theme}
                />
                <DetailRow
                  label="Phone"
                  value={formatDisplayValue(form.phone)}
                  theme={theme}
                />
              </div>

              <div
                className={cn(
                  'mt-4 rounded-xl border p-3',
                  isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'
                )}
              >
                <div className={cn('mb-2 text-xs font-semibold uppercase tracking-wide', isDark ? 'text-gray-400' : 'text-gray-500')}>
                  Contact entered
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Mail className={cn('mt-0.5 h-4 w-4', isDark ? 'text-gray-400' : 'text-gray-500')} />
                    <span className={cn('break-all', isDark ? 'text-gray-200' : 'text-gray-700')}>
                      {formatDisplayValue(form.email)}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className={cn('mt-0.5 h-4 w-4', isDark ? 'text-gray-400' : 'text-gray-500')} />
                    <span className={cn('break-all', isDark ? 'text-gray-200' : 'text-gray-700')}>
                      {formatDisplayValue(form.phone)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={cn(
                'rounded-xl border-2 p-3 sm:p-4',
                isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white'
              )}
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold sm:h-11 sm:w-11',
                    isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                  )}
                >
                  {reviewPatient ? getPatientInitials(reviewPatient) : 'EP'}
                </div>
                <div className="min-w-0">
                  <div className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                    Existing Record
                  </div>
                  <div className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
                    Review before making a registration decision
                  </div>
                </div>
              </div>

              {reviewPatient ? (
                <>
                  <div className="space-y-2 text-sm">
                    <DetailRow
                      label="Name"
                      value={formatPatientName(reviewPatient)}
                      theme={theme}
                    />
                    <DetailRow
                      label="Patient number"
                      value={
                        <span
                          className={cn(
                            'inline-flex rounded-lg px-2 py-1 font-mono text-xs',
                            isDark ? 'bg-gray-700 text-blue-300' : 'bg-blue-50 text-blue-700'
                          )}
                        >
                          {reviewPatient.patient_number}
                        </span>
                      }
                      theme={theme}
                    />
                    <DetailRow
                      label="Date of birth"
                      value={formatDateValue(reviewPatient.date_of_birth)}
                      theme={theme}
                    />
                    <DetailRow
                      label="Age"
                      value={existingAge !== null ? `${existingAge} years` : 'Not available'}
                      theme={theme}
                    />
                    <DetailRow
                      label="Biological sex"
                      value={
                        reviewPatient.biological_sex
                          ? getBiologicalSexDisplayText(reviewPatient.biological_sex)
                          : 'Not provided'
                      }
                      theme={theme}
                    />
                    <DetailRow
                      label="Status"
                      value={
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                            getStatusBadgeClasses(theme, reviewPatient.status)
                          )}
                        >
                          {getStatusDisplayText(reviewPatient.status)}
                        </span>
                      }
                      theme={theme}
                    />
                    <DetailRow
                      label="Blood type"
                      value={formatDisplayValue(reviewPatient.blood_type)}
                      theme={theme}
                    />
                    <DetailRow
                      label="Isolation required"
                      value={formatBooleanValue(reviewPatient.requires_isolation)}
                      theme={theme}
                    />
                    <DetailRow
                      label="Created"
                      value={formatDateTimeValue(reviewPatient.created_at)}
                      theme={theme}
                    />
                  </div>

                  {requiresSpecialHandling(reviewPatient) && (
                    <div
                      className={cn(
                        'mt-4 rounded-xl border p-3 text-sm',
                        isDark
                          ? 'border-amber-500/20 bg-amber-900/20 text-amber-200'
                          : 'border-amber-200 bg-amber-50 text-amber-800'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <Shield className="mt-0.5 h-4 w-4 flex-shrink-0" />
                        <div>
                          <span className="font-semibold">Special handling flag:</span>{' '}
                          This patient record may require additional review because of clinical or record-status indicators.
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className={cn('text-sm leading-6', isDark ? 'text-gray-300' : 'text-gray-700')}>
                  {matchedFieldsText ? (
                    <>
                      A patient with this {matchedFieldsText} already exists.
                      <div className="mt-2">
                        Please open patient search to review the existing record before continuing.
                      </div>
                    </>
                  ) : (
                    'We found matching information in another record. Please open patient search to review the existing patient.'
                  )}
                </div>
              )}
            </div>
          </div>

          <div
            className={cn(
              'mt-4 rounded-xl border p-3 sm:p-4',
              isDark ? 'border-gray-700 bg-gray-900/40' : 'border-gray-200 bg-white/90'
            )}
          >
            <div className="mb-3 flex items-center gap-2">
              <Fingerprint className={cn('h-4 w-4', isDark ? 'text-blue-300' : 'text-blue-600')} />
              <span className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                Match assessment
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <div className={cn('rounded-lg p-3', isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-700')}>
                <div className="font-medium">Matched contact fields</div>
                <div className="mt-1 break-words">
                  {matchedFieldsText ? matchedFieldsText : 'No contact field details returned'}
                </div>
              </div>

              <div className={cn('rounded-lg p-3', isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-700')}>
                <div className="font-medium">Demographic similarity</div>
                <div className="mt-1">
                  {conflict.data.demographicMatch ? 'Yes, demographic details also match' : 'No explicit demographic match returned'}
                </div>
              </div>

              <div className={cn('rounded-lg p-3', isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-700')}>
                <div className="font-medium">Conflict code</div>
                <div className="mt-1">
                  {conflict.data.conflictCode ? conflict.data.conflictCode.replace(/_/g, ' ') : 'Not specified'}
                </div>
              </div>

              <div className={cn('rounded-lg p-3', isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-700')}>
                <div className="font-medium">Existing linked user</div>
                <div className="mt-1 break-all font-mono text-xs">
                  {formatDisplayValue(conflict.data.existingUserGlobalId)}
                </div>
              </div>
            </div>
          </div>

          {matchedFieldsText && (
            <div
              className={cn(
                'mt-4 rounded-xl px-3 py-3 text-sm sm:px-4',
                conflict.data.conflictCode === 'IDENTITY_MISMATCH'
                  ? isDark
                    ? 'bg-red-950/30 text-red-200'
                    : 'bg-red-50 text-red-700'
                  : isDark
                    ? 'bg-blue-950/30 text-blue-200'
                    : 'bg-blue-50 text-blue-700'
              )}
            >
              <span className="font-semibold">Matching details:</span> A patient with this {matchedFieldsText} already exists on Custocare.
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={onGoToPatientSearch}
              disabled={isSubmitting}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1 sm:py-3',
                isDark
                  ? 'border-blue-500/50 bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/20'
                  : 'border-blue-300 bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/20',
                !isSubmitting && 'cursor-pointer'
              )}
            >
              <Search className="h-4 w-4" />
              Open patient search
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="button"
              onClick={onDismiss}
              disabled={isSubmitting}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1 sm:py-3',
                isDark
                  ? 'border-gray-600 bg-gray-700 text-gray-200 hover:border-gray-500 hover:bg-gray-600'
                  : 'border-gray-300 bg-gray-100 text-gray-700 hover:border-gray-400 hover:bg-gray-200',
                !isSubmitting && 'cursor-pointer'
              )}
            >
              Keep editing
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

PatientConflictPanel.displayName = 'PatientConflictPanel';

export default PatientConflictPanel;