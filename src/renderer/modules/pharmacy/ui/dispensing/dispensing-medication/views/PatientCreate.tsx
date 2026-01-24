import React, { useCallback, useMemo, useState } from 'react';
import { UserPlus, AlertCircle, CheckCircle, Copy, Download, X } from 'lucide-react';
import type { AxiosError } from 'axios';

import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import { useConfirm } from '../../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { useToast } from '../../../../../../app/store/contexts/toast/useToast';

import type {
  ApiErrorResponse,
  CreatePatientRequest,
  PatientSearchResult,
  PatientCreateResponse,
} from '../../../../api/dispensing/patient-search/usePatientTypes';
import {
  BiologicalSex,
  validatePatientFormData,
  isPatientCreateConflictResponse,
  isPossibleDuplicateResponse,
  isExistingUserResponse,
  DuplicateAction,
  ExistingUserAction,
} from '../../../../api/dispensing/patient-search/usePatientTypes';
import { useCreatePatientByStaff } from '../../../../api/dispensing/patient-search/usePatientQueries';
import { formatPatientName } from '../../../../api/dispensing/patient-search/usePatientTypes';

type Theme = 'light' | 'dark';

export interface PatientCreateProps {
  theme: Theme;
  title?: string;
  subtitle?: string;
  initialValues?: Partial<CreatePatientRequest>;
  onCreated?: (patient: PatientSearchResult) => void;
  onCancel?: () => void;
  className?: string;
}

function errorToMessage(error: unknown): string {
  const axiosErr = error as AxiosError<ApiErrorResponse>;
  const apiMsg = axiosErr?.response?.data?.message;
  if (typeof apiMsg === 'string' && apiMsg.trim().length > 0) return apiMsg;
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return 'Failed to create patient.';
}

interface PatientNumberModalProps {
  theme: Theme;
  patientNumber: string;
  patientName: string;
  onProceed: () => void;
}

const PatientNumberModal: React.FC<PatientNumberModalProps> = ({ theme, patientNumber, patientName, onProceed }) => {
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(patientNumber);
      setCopied(true);
      showToast('success', 'Patient number copied to clipboard', 3000);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      showToast('error', 'Failed to copy patient number', 3000);
    }
  }, [patientNumber, showToast]);

  const handleDownload = useCallback(() => {
    const content = `Patient Name: ${patientName}\nPatient Number: ${patientNumber}\nGenerated: ${new Date().toLocaleString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Patient_${patientNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('success', 'Patient details downloaded', 3000);
  }, [patientName, patientNumber, showToast]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={cn('relative w-full max-w-md rounded-2xl shadow-2xl', isDark ? 'bg-gray-800' : 'bg-white')}>
        {/* Success Icon */}
        <div className="flex flex-col items-center p-8">
          <div className={cn('w-20 h-20 rounded-full flex items-center justify-center mb-4', isDark ? 'bg-green-900/30' : 'bg-green-100')}>
            <CheckCircle className={cn('w-12 h-12', isDark ? 'text-green-400' : 'text-green-600')} />
          </div>

          <h2 className={cn('text-2xl font-bold mb-2', isDark ? 'text-white' : 'text-gray-900')}>Patient Created Successfully</h2>
          <p className={cn('text-center mb-6', isDark ? 'text-gray-400' : 'text-gray-600')}>Please provide this patient number to the patient</p>

          {/* Patient Details */}
          <div className={cn('w-full rounded-xl border p-6 mb-6', isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200')}>
            <div className="text-center mb-4">
              <div className={cn('text-sm font-medium mb-1', isDark ? 'text-gray-400' : 'text-gray-600')}>Patient Name</div>
              <div className={cn('text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>{patientName}</div>
            </div>

            <div className="text-center">
              <div className={cn('text-sm font-medium mb-2', isDark ? 'text-gray-400' : 'text-gray-600')}>Patient Number (UUID)</div>
              <div
                className={cn(
                  'font-mono text-sm p-4 rounded-lg break-all',
                  isDark ? 'bg-gray-800 text-blue-300 border border-gray-700' : 'bg-white text-blue-600 border border-gray-300'
                )}
              >
                {patientNumber}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  'flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors',
                  copied
                    ? isDark
                      ? 'bg-green-900/30 text-green-300 border border-green-700'
                      : 'bg-green-50 text-green-700 border border-green-200'
                    : isDark
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                )}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className={cn(
                  'flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors',
                  isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                )}
              >
                <Download className="w-5 h-5" />
                Download
              </button>
            </div>

            <button
              type="button"
              onClick={onProceed}
              className="w-full py-3 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
            >
              Proceed
            </button>
          </div>

          <p className={cn('text-xs text-center mt-4', isDark ? 'text-gray-500' : 'text-gray-500')}>
            ⚠️ Important: Ensure patient receives this number for future visits
          </p>
        </div>
      </div>
    </div>
  );
};

const PatientCreate: React.FC<PatientCreateProps> = ({ theme, title = 'Create New Patient', subtitle = 'Enter patient details to create a new record', initialValues, onCreated, onCancel, className }) => {
  const isDark = theme === 'dark';
  const { confirm } = useConfirm();

  const [form, setForm] = useState<Partial<CreatePatientRequest>>({
    first_name: initialValues?.first_name ?? '',
    last_name: initialValues?.last_name ?? '',
    email: initialValues?.email ?? '',
    phone: initialValues?.phone ?? '',
    date_of_birth: initialValues?.date_of_birth ?? '',
    biological_sex: initialValues?.biological_sex ?? BiologicalSex.UNKNOWN,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdPatient, setCreatedPatient] = useState<PatientSearchResult | null>(null);

  const validation = useMemo(() => validatePatientFormData(form), [form]);

  const handleConflictResolution = useCallback(
    async (response: PatientCreateResponse, originalData: CreatePatientRequest): Promise<boolean> => {
      if (!isPatientCreateConflictResponse(response)) return false;

      const { meta } = response;

      if (isPossibleDuplicateResponse(response) && meta.possible_duplicate) {
        const duplicate = meta.possible_duplicate;
        const ok = await confirm({
          title: 'Possible Duplicate Patient',
          message: `A similar patient already exists:\n\nName: ${duplicate.name}\nDOB: ${duplicate.date_of_birth}\nPatient Number: ${duplicate.patient_number}\n\nDo you want to create this patient anyway?`,
          confirmText: 'Yes, Create New Patient',
          cancelText: 'Cancel',
          variant: 'warning',
          theme,
        });

        if (ok) {
          const forceData: CreatePatientRequest = {
            ...originalData,
            action_on_possible_duplicate: DuplicateAction.ALLOW,
          };
          createMutation.mutate(forceData);
          return true;
        }
      } else if (isExistingUserResponse(response)) {
        const ok = await confirm({
          title: 'User Already Exists',
          message: 'A user with this email/phone already exists in the system. Would you like to link this patient record to the existing user?',
          confirmText: 'Yes, Link to Existing User',
          cancelText: 'Cancel',
          variant: 'info',
          theme,
        });

        if (ok) {
          const forceData: CreatePatientRequest = {
            ...originalData,
            existing_user_action: ExistingUserAction.USE_EXISTING,
          };
          createMutation.mutate(forceData);
          return true;
        }
      }

      return false;
    },
    [confirm, theme]
  );

  const createMutation = useCreatePatientByStaff({
    onSuccess: async (response, variables) => {
      if (response.success && response.data) {
        setCreatedPatient(response.data);
        setShowSuccessModal(true);
      } else if (isPatientCreateConflictResponse(response)) {
        await handleConflictResolution(response, variables);
      }
    },
  });

  const isSubmitting = createMutation.isPending;

  const colors = useMemo(
    () => ({
      textPrimary: isDark ? 'text-white' : 'text-gray-900',
      textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
      bg: isDark ? 'bg-gray-800' : 'bg-white',
      border: isDark ? 'border-gray-700' : 'border-gray-200',
      inputBg: isDark ? 'bg-gray-900' : 'bg-white',
      inputBorder: isDark ? 'border-gray-700' : 'border-gray-300',
      inputText: isDark ? 'text-white' : 'text-gray-900',
    }),
    [isDark]
  );

  const setField = useCallback(<K extends keyof CreatePatientRequest>(key: K, value: CreatePatientRequest[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormError(null);
  }, []);

  const submit = useCallback(async () => {
    const v = validatePatientFormData(form);
    if (!v.isValid) {
      const firstKey = Object.keys(v.errors)[0] as keyof typeof v.errors | undefined;
      const firstMsg = firstKey ? v.errors[firstKey]?.[0] : 'Please correct the form errors.';
      setFormError(firstMsg ?? 'Please correct the form errors.');
      return;
    }

    const ok = await confirm({
      title: 'Confirm Patient Creation',
      message: 'You are about to create a new patient record. Continue?',
      confirmText: 'Create Patient',
      cancelText: 'Cancel',
      variant: 'info',
      theme,
    });

    if (!ok) return;

    setFormError(null);

    const payload: CreatePatientRequest = {
      first_name: String(form.first_name ?? '').trim(),
      last_name: String(form.last_name ?? '').trim(),
      email: form.email?.trim() ? String(form.email).trim() : undefined,
      phone: form.phone?.trim() ? String(form.phone).trim() : undefined,
      date_of_birth: String(form.date_of_birth ?? '').trim(),
      biological_sex: form.biological_sex ?? BiologicalSex.UNKNOWN,
    };

    createMutation.mutate(payload);
  }, [confirm, createMutation, form, theme]);

  const handleProceed = useCallback(() => {
    if (createdPatient) {
      setShowSuccessModal(false);
      onCreated?.(createdPatient);
    }
  }, [createdPatient, onCreated]);

  return (
    <>
      <div className={cn('p-6', className)}>
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h2 className={cn('text-2xl font-bold mb-2', colors.textPrimary)}>{title}</h2>
            <p className={colors.textSecondary}>{subtitle}</p>
          </div>

          <div className={cn('rounded-xl border p-6', colors.bg, colors.border)}>
            {isSubmitting && (
              <div className="mb-6">
                <LoadingSkeleton variant="form" theme={theme} message="Creating patient..." />
              </div>
            )}

            {formError && (
              <div className={cn('rounded-lg border p-4 mb-6 flex gap-3 items-start', isDark ? 'bg-red-900/10 border-red-800' : 'bg-red-50 border-red-200')}>
                <AlertCircle className={cn('w-5 h-5 mt-0.5', isDark ? 'text-red-400' : 'text-red-600')} />
                <div className={cn('text-sm', colors.textSecondary)}>{formError}</div>
              </div>
            )}

            {createMutation.isError && (
              <div className={cn('rounded-lg border p-4 mb-6 flex gap-3 items-start', isDark ? 'bg-red-900/10 border-red-800' : 'bg-red-50 border-red-200')}>
                <AlertCircle className={cn('w-5 h-5 mt-0.5', isDark ? 'text-red-400' : 'text-red-600')} />
                <div className={cn('text-sm', colors.textSecondary)}>{errorToMessage(createMutation.error)}</div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className={cn('block text-sm font-medium mb-1', isDark ? 'text-gray-300' : 'text-gray-700')}>First Name *</label>
                <input
                  value={form.first_name ?? ''}
                  onChange={(e) => setField('first_name', e.target.value)}
                  disabled={isSubmitting}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50',
                    colors.inputBg,
                    colors.inputBorder,
                    colors.inputText
                  )}
                />
                {validation.errors.first_name?.[0] ? <div className={cn('text-xs mt-1', isDark ? 'text-red-300' : 'text-red-600')}>{validation.errors.first_name[0]}</div> : null}
              </div>

              <div>
                <label className={cn('block text-sm font-medium mb-1', isDark ? 'text-gray-300' : 'text-gray-700')}>Last Name *</label>
                <input
                  value={form.last_name ?? ''}
                  onChange={(e) => setField('last_name', e.target.value)}
                  disabled={isSubmitting}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50',
                    colors.inputBg,
                    colors.inputBorder,
                    colors.inputText
                  )}
                />
                {validation.errors.last_name?.[0] ? <div className={cn('text-xs mt-1', isDark ? 'text-red-300' : 'text-red-600')}>{validation.errors.last_name[0]}</div> : null}
              </div>

              <div>
                <label className={cn('block text-sm font-medium mb-1', isDark ? 'text-gray-300' : 'text-gray-700')}>Email (optional if phone provided)</label>
                <input
                  type="email"
                  value={form.email ?? ''}
                  onChange={(e) => setField('email', e.target.value)}
                  disabled={isSubmitting}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50',
                    colors.inputBg,
                    colors.inputBorder,
                    colors.inputText
                  )}
                />
                {validation.errors.email?.[0] ? <div className={cn('text-xs mt-1', isDark ? 'text-red-300' : 'text-red-600')}>{validation.errors.email[0]}</div> : null}
              </div>

              <div>
                <label className={cn('block text-sm font-medium mb-1', isDark ? 'text-gray-300' : 'text-gray-700')}>Phone (optional if email provided)</label>
                <input
                  type="tel"
                  value={form.phone ?? ''}
                  onChange={(e) => setField('phone', e.target.value)}
                  disabled={isSubmitting}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50',
                    colors.inputBg,
                    colors.inputBorder,
                    colors.inputText
                  )}
                />
              </div>

              <div>
                <label className={cn('block text-sm font-medium mb-1', isDark ? 'text-gray-300' : 'text-gray-700')}>Date of Birth *</label>
                <input
                  type="date"
                  value={form.date_of_birth ?? ''}
                  onChange={(e) => setField('date_of_birth', e.target.value)}
                  disabled={isSubmitting}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50',
                    colors.inputBg,
                    colors.inputBorder,
                    colors.inputText
                  )}
                />
                {validation.errors.date_of_birth?.[0] ? <div className={cn('text-xs mt-1', isDark ? 'text-red-300' : 'text-red-600')}>{validation.errors.date_of_birth[0]}</div> : null}
              </div>

              <div>
                <label className={cn('block text-sm font-medium mb-1', isDark ? 'text-gray-300' : 'text-gray-700')}>Biological Sex *</label>
                <select
                  value={form.biological_sex ?? BiologicalSex.UNKNOWN}
                  onChange={(e) => setField('biological_sex', e.target.value as BiologicalSex)}
                  disabled={isSubmitting}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50',
                    colors.inputBg,
                    colors.inputBorder,
                    colors.inputText
                  )}
                >
                  <option value={BiologicalSex.UNKNOWN}>Unknown</option>
                  <option value={BiologicalSex.MALE}>Male</option>
                  <option value={BiologicalSex.FEMALE}>Female</option>
                  <option value={BiologicalSex.INTERSEX}>Intersex</option>
                </select>
                {validation.errors.biological_sex?.[0] ? <div className={cn('text-xs mt-1', isDark ? 'text-red-300' : 'text-red-600')}>{validation.errors.biological_sex[0]}</div> : null}
              </div>
            </div>

            {validation.errors.contact?.[0] ? <div className={cn('text-sm mb-4', isDark ? 'text-red-300' : 'text-red-600')}>{validation.errors.contact[0]}</div> : null}

            <div className="flex gap-3">
              {onCancel ? (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className={cn(
                    'flex-1 py-2 rounded-lg font-medium transition-colors disabled:opacity-50',
                    isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  )}
                >
                  Cancel
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => void submit()}
                disabled={!validation.isValid || isSubmitting}
                className={cn(
                  'flex-1 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                  'bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2'
                )}
              >
                <UserPlus className="w-5 h-5" />
                Create Patient
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSuccessModal && createdPatient && (
        <PatientNumberModal theme={theme} patientNumber={createdPatient.patient_number} patientName={formatPatientName(createdPatient)} onProceed={handleProceed} />
      )}
    </>
  );
};

PatientCreate.displayName = 'PatientCreate';
export default PatientCreate;
