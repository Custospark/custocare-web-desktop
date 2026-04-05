import React, { useCallback, useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';
import { cn } from '../../../../../../shared/utils/classNameUtils';

import type {
  ApiErrorResponse,
  CreatePatientRequest,
  PatientSearchResult,
} from '../../../../api/dispensing/patient-search/usePatientTypes';
import {
  BiologicalSex,
  formatPatientName,
  isNewPatientCreatedResponse,
  isPatientCreateConflictResponse,
  isPatientCreateSuccessResponse,
  isPossibleDuplicateResponse,
  validatePatientFormData,
} from '../../../../api/dispensing/patient-search/usePatientTypes';
import { useCreatePatientByAdmin } from '../../../../api/dispensing/patient-search/usePatientQueries';

import { MEDICAL_RECORDS_ROUTES } from '../../../../../../app/routes/routeConstants';

import PatientCreateHeader from './patient-create/PatientCreateHeader';
import PatientCreateErrorBanner from './patient-create/PatientCreateErrorBanner';
import PatientConflictPanel from './patient-create/PatientConflictPanel';
import type { ConflictState } from './patient-create/PatientConflictPanel';
import PatientCreateFormFields from './patient-create/PatientCreateFormFields';
import PatientCreateActions from './patient-create/PatientCreateActions';
import PatientSuccessModal from './patient-create/PatientSuccessModal';

type Theme = 'light' | 'dark';

export interface PatientCreateProps {
  theme: Theme;
  title?: string;
  subtitle?: string;
  initialValues?: Partial<CreatePatientRequest>;
  onSuccess?: (patient: PatientSearchResult) => void | Promise<void>;
  onProceed?: (patient: PatientSearchResult) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
}

const INITIAL_FORM_STATE: Partial<CreatePatientRequest> = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  biological_sex: undefined,
};

function getSafeTrimmedValue(value: string | undefined): string {
  return value?.trim() ?? '';
}

function buildSuggestedSearchText(form: Partial<CreatePatientRequest>): string {
  return [
    getSafeTrimmedValue(form.first_name),
    getSafeTrimmedValue(form.last_name),
    getSafeTrimmedValue(form.phone),
    getSafeTrimmedValue(form.email),
    getSafeTrimmedValue(form.date_of_birth),
  ]
    .filter(Boolean)
    .join(' ');
}

function errorToMessage(error: unknown): string {
  if (!error) return 'Something went wrong while saving this patient. Please try again.';

  if (typeof error === 'object' && error && 'isAxiosError' in error) {
    const axiosErr = error as AxiosError<ApiErrorResponse>;
    const apiMsg = axiosErr.response?.data?.message;

    if (typeof apiMsg === 'string' && apiMsg.trim().length > 0) {
      return apiMsg;
    }

    const validationErrors = axiosErr.response?.data?.errors;
    if (validationErrors && typeof validationErrors === 'object') {
      const firstErrorKey = Object.keys(validationErrors)[0];
      const firstError = firstErrorKey
        ? validationErrors[firstErrorKey]?.[0]
        : undefined;

      if (typeof firstError === 'string' && firstError.trim().length > 0) {
        return firstError;
      }
    }

    if (axiosErr.response?.status === 409) {
      return 'We found another record that may already belong to this patient. Please review it before creating a new record.';
    }

    if (axiosErr.response?.status === 422) {
      return 'Please check the patient details and try again.';
    }

    if (axiosErr.response?.status === 500) {
      return 'We could not save this patient right now. Please try again in a moment.';
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'We could not save this patient right now. Please try again.';
}

const PatientCreate: React.FC<PatientCreateProps> = ({
  theme,
  title = 'Create New Patient',
  subtitle = 'Enter patient details to create a new record',
  initialValues,
  onSuccess,
  onProceed,
  onCancel,
  className,
}) => {
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const [form, setForm] = useState<Partial<CreatePatientRequest>>({
    ...INITIAL_FORM_STATE,
    ...initialValues,
  });

  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [formError, setFormError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [createdPatient, setCreatedPatient] = useState<PatientSearchResult | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(true);

  const validation = useMemo(() => validatePatientFormData(form), [form]);

  const resetForm = useCallback(() => {
    setForm({
      ...INITIAL_FORM_STATE,
      ...initialValues,
    });
    setTouchedFields(new Set());
    setFormError(null);
    setConflict(null);
  }, [initialValues]);

  const handleGoToPatientSearch = useCallback(() => {
    navigate(MEDICAL_RECORDS_ROUTES.PATIENTS_SEARCH, {
      state: {
        fromPatientCreate: true,
        suggestedSearch: buildSuggestedSearchText(form),
        draftPatient: {
          first_name: getSafeTrimmedValue(form.first_name),
          last_name: getSafeTrimmedValue(form.last_name),
          email: getSafeTrimmedValue(form.email),
          phone: getSafeTrimmedValue(form.phone),
          date_of_birth: getSafeTrimmedValue(form.date_of_birth),
          biological_sex: form.biological_sex,
        },
      },
    });
  }, [form, navigate]);

  const handleDismissConflict = useCallback(() => {
    setConflict(null);
    setFormError(null);
  }, []);

  const createMutation = useCreatePatientByAdmin({
    onSuccess: async (response, variables) => {
      setFormError(null);

      if (isPatientCreateConflictResponse(response)) {
        setCreatedPatient(null);
        setShowSuccessModal(false);
        setIsNewPatient(true);

        setConflict({
          type: isPossibleDuplicateResponse(response) ? 'duplicate' : 'existing_user',
          originalData: variables,
          data: {
            duplicatePatient: response.meta.possible_duplicate ?? undefined,
            existingPatient: response.meta.existing_patient ?? undefined,
            existingUserGlobalId: response.meta.existing_user_global_user_uuid ?? undefined,
            matchedContactFields: response.meta.matched_contact_fields,
            matchedFields: response.meta.matched_fields,
            demographicMatch: response.meta.demographic_match,
            conflictCode: response.meta.conflict_code ?? null,
          },
        });

        return;
      }

      if (!isPatientCreateSuccessResponse(response)) {
        setFormError('We received an unexpected response while creating this patient.');
        return;
      }

      const patient = response.data;
      const createdFresh = isNewPatientCreatedResponse(response);

      setConflict(null);
      setCreatedPatient(patient);
      setIsNewPatient(createdFresh);
      setShowSuccessModal(true);

      if (onSuccess) {
        await onSuccess(patient);
      }
    },
    onError: (error) => {
      setFormError(errorToMessage(error));
      setConflict(null);
    },
  });

  const isSubmitting = createMutation.isPending;
  const isFormValid = validation.isValid;

  const handleFieldChange = useCallback(
    <K extends keyof CreatePatientRequest>(key: K, value: CreatePatientRequest[K] | undefined) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setTouchedFields((prev) => new Set(prev).add(String(key)));
      setFormError(null);
      setConflict(null);
    },
    []
  );

  const markAllFieldsTouched = useCallback(() => {
    setTouchedFields(
      new Set([
        'first_name',
        'last_name',
        'email',
        'phone',
        'date_of_birth',
        'biological_sex',
      ])
    );
  }, []);

  const buildPayload = useCallback((): CreatePatientRequest => {
    return {
      first_name: getSafeTrimmedValue(form.first_name),
      last_name: getSafeTrimmedValue(form.last_name),
      email: getSafeTrimmedValue(form.email) || undefined,
      phone: getSafeTrimmedValue(form.phone) || undefined,
      date_of_birth: getSafeTrimmedValue(form.date_of_birth),
      biological_sex: form.biological_sex as BiologicalSex,
    };
  }, [form]);

  const submit = useCallback(() => {
    markAllFieldsTouched();

    const currentValidation = validatePatientFormData(form);
    if (!currentValidation.isValid) {
      const firstKey = Object.keys(currentValidation.errors)[0] as keyof typeof currentValidation.errors | undefined;
      const firstMessage = firstKey ? currentValidation.errors[firstKey]?.[0] : undefined;

      setFormError(firstMessage ?? 'Please review the patient details and try again.');

      setTimeout(() => {
        const firstErrorElement = document.querySelector('[aria-invalid="true"]');
        firstErrorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);

      return;
    }

    setFormError(null);
    setConflict(null);
    createMutation.mutate(buildPayload());
  }, [buildPayload, createMutation, form, markAllFieldsTouched]);

  const handleSuccessModalProceed = useCallback(async () => {
    if (createdPatient && onProceed) {
      await onProceed(createdPatient);
    }
    setShowSuccessModal(false);
  }, [createdPatient, onProceed]);

  const handleSuccessModalClose = useCallback(() => {
    setShowSuccessModal(false);
    resetForm();
  }, [resetForm]);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={cn('w-full', className)}>
        <div className="mx-auto w-full space-y-6 px-0 sm:px-2 lg:px-6">
          <PatientCreateHeader
            theme={theme}
            title={title}
            subtitle={subtitle}
          />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className={cn(
              'relative overflow-hidden rounded-2xl border-2 transition-all duration-300',
              isDark
                ? 'border-gray-700/50 bg-gradient-to-br from-gray-800 to-gray-900 hover:border-gray-600'
                : 'border-gray-200 bg-gradient-to-br from-white to-gray-50/50 hover:border-gray-300'
            )}
          >
            <div className="p-4 sm:p-6">
              <AnimatePresence>
                {isSubmitting && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6"
                  >
                    <div
                      className={cn(
                        'rounded-xl border-2 px-4 py-3',
                        isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                      )}
                    >
                      <LoadingSkeleton variant="default" theme={theme} message="Creating patient record..." />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <PatientCreateErrorBanner
                theme={theme}
                error={formError}
                onSearchPatients={handleGoToPatientSearch}
              />

              <AnimatePresence>
                {conflict && (
                  <PatientConflictPanel
                    theme={theme}
                    conflict={conflict}
                    form={form}
                    isSubmitting={isSubmitting}
                    onGoToPatientSearch={handleGoToPatientSearch}
                    onDismiss={handleDismissConflict}
                  />
                )}
              </AnimatePresence>

              <PatientCreateFormFields
                theme={theme}
                form={form}
                validation={validation}
                touchedFields={touchedFields}
                isSubmitting={isSubmitting}
                onFieldChange={handleFieldChange}
              />

              <PatientCreateActions
                theme={theme}
                isSubmitting={isSubmitting}
                isFormValid={isFormValid}
                hasConflict={!!conflict}
                onSubmit={submit}
                onCancel={onCancel}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showSuccessModal && createdPatient && (
          <PatientSuccessModal
            theme={theme}
            patientNumber={createdPatient.patient_number}
            patientName={formatPatientName(createdPatient)}
            onProceed={onProceed ? handleSuccessModalProceed : undefined}
            onClose={handleSuccessModalClose}
            isNewPatient={isNewPatient}
          />
        )}
      </AnimatePresence>
    </>
  );
};

PatientCreate.displayName = 'PatientCreate';

export default PatientCreate;
