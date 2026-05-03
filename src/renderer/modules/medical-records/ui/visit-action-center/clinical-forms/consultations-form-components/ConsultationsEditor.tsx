import React, { useState, useMemo } from 'react';
import {
  Eye,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  SquarePen,
  X,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Send,
  Ban,
  CalendarCheck,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import { ConsultationsField } from './ConsultationsField';
import {
  addCustomField,
  removeCustomField,
  updateCustomField,
} from './consultationsForm.utils';
import {
  CONSULTATION_TYPE_OPTIONS,
  CONSULTATION_PRIORITY_OPTIONS,
  ConsultationPriority,
  ConsultationStatus,
} from '../../../../api/consultations/consultationTypes';
import type {
  ConsultationsFormValues,
  ConsultationsMode,
  ConsultationsThemeTokens,
  DynamicCustomFields,
  DynamicCustomField,
  CustomFieldValueType,
} from './consultationsForm.types';

// Predefined specialties list (can be expanded)
const PREDEFINED_SPECIALTIES = [
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'Hematology',
  'Infectious Disease',
  'Nephrology',
  'Neurology',
  'Obstetrics and Gynecology',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Otolaryngology (ENT)',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Radiology',
  'Rheumatology',
  'Surgery',
  'Urology',
];

// Searchable combobox component for specialty
interface SpecialtyComboboxProps {
  value: string;
  error?: string;
  colors: ConsultationsThemeTokens;
  autoFocus?: boolean;
  onChange: (value: string) => void;
}

const SpecialtyCombobox: React.FC<SpecialtyComboboxProps> = ({
  value,
  error,
  colors,
  autoFocus,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);

  const filteredSpecialties = useMemo(() => {
    if (!searchTerm) return PREDEFINED_SPECIALTIES;
    const term = searchTerm.toLowerCase();
    return PREDEFINED_SPECIALTIES.filter(specialty =>
      specialty.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const handleSelect = (specialty: string) => {
    onChange(specialty);
    setSearchTerm(specialty);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            setTimeout(() => setIsOpen(false), 200);
          }}
          placeholder="e.g., Cardiology, Neurology, or enter custom specialty"
          autoFocus={autoFocus}
          className={cn(
            'w-full rounded-lg border px-3 py-2 pl-9 text-sm outline-none transition-all',
            colors.bg.input,
            colors.text.primary,
            colors.border.primary,
            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            error && 'border-red-500 focus:ring-red-500'
          )}
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <FileText className="h-4 w-4 text-slate-400" />
        </div>
      </div>

      {isOpen && filteredSpecialties.length > 0 && (
        <div
          className={cn(
            'absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border shadow-lg',
            colors.bg.card,
            colors.border.primary
          )}
        >
          {filteredSpecialties.map((specialty) => (
            <button
              key={specialty}
              type="button"
              onClick={() => handleSelect(specialty)}
              className={cn(
                'w-full px-3 py-2 text-left text-sm transition-colors cursor-pointer',
                colors.text.primary,
                colors.bg.hover
              )}
            >
              {specialty}
            </button>
          ))}
        </div>
      )}

      {isOpen && filteredSpecialties.length === 0 && (
        <div
          className={cn(
            'absolute z-10 mt-1 w-full rounded-lg border p-3 text-center text-sm shadow-lg',
            colors.bg.card,
            colors.border.primary,
            colors.text.secondary
          )}
        >
          No matching specialties. You can enter a custom specialty.
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

// Field definitions for consultations form
const CONSULTATIONS_FIELD_DEFINITIONS = [
  // Request Details
  {
    key: 'specialtyRequired' as const,
    label: 'Specialty Required',
    type: 'text' as const,
    description: 'Medical specialty needed for consultation',
    required: true,
    previewFallback: 'No specialty specified',
    colSpan: 1,
  },
  {
    key: 'clinicalQuestion' as const,
    label: 'Clinical Question',
    type: 'textarea' as const,
    placeholder: 'What specific question do you need answered?',
    description: 'Specific question or reason for consultation',
    required: true,
    previewFallback: 'No clinical question recorded',
    colSpan: 2,
  },
  {
    key: 'backgroundInformation' as const,
    label: 'Background Information',
    type: 'textarea' as const,
    placeholder: 'Relevant history, previous workup, current medications...',
    description: 'Relevant clinical background',
    previewFallback: 'No background information provided',
    colSpan: 2,
  },
  // Consultation Type & Priority
  {
    key: 'consultationType' as const,
    label: 'Consultation Type',
    type: 'select' as const,
    description: 'Type of consultation',
    options: CONSULTATION_TYPE_OPTIONS,
    previewFallback: 'No consultation type selected',
    colSpan: 1,
  },
  {
    key: 'priority' as const,
    label: 'Priority',
    type: 'select' as const,
    description: 'Priority level',
    options: CONSULTATION_PRIORITY_OPTIONS,
    previewFallback: 'No priority selected',
    colSpan: 1,
  },
  // Scheduling
  {
    key: 'scheduledFor' as const,
    label: 'Scheduled For',
    type: 'datetime-local' as const,
    description: 'Date and time of consultation',
    previewFallback: 'Not scheduled',
    colSpan: 1,
  },
  {
    key: 'location' as const,
    label: 'Location',
    type: 'text' as const,
    placeholder: 'e.g., Room 301, Virtual meeting link',
    description: 'Physical location or virtual meeting link',
    previewFallback: 'No location specified',
    colSpan: 1,
  },
  {
    key: 'durationMinutes' as const,
    label: 'Duration (minutes)',
    type: 'number' as const,
    description: 'Expected consultation duration',
    min: 5,
    max: 480,
    step: 5,
    previewFallback: '30 minutes',
    colSpan: 1,
  },
  // Follow-up
  {
    key: 'requiresFollowup' as const,
    label: 'Requires Follow-up',
    type: 'checkbox' as const,
    description: 'Whether follow-up consultation is needed',
    previewFallback: 'No follow-up required',
    colSpan: 1,
  },
  {
    key: 'followupBy' as const,
    label: 'Follow-up By',
    type: 'date' as const,
    description: 'Recommended follow-up date',
    previewFallback: 'No follow-up date set',
    colSpan: 1,
  },
  {
    key: 'followupInstructions' as const,
    label: 'Follow-up Instructions',
    type: 'textarea' as const,
    placeholder: 'Specific follow-up instructions...',
    description: 'Instructions for follow-up consultation',
    previewFallback: 'No follow-up instructions',
    colSpan: 2,
  },
];

// Consultant response fields (for accepted consultations)
const RESPONSE_FIELD_DEFINITIONS = [
  {
    key: 'findings' as const,
    label: 'Clinical Findings',
    type: 'textarea' as const,
    placeholder: 'Describe clinical findings...',
    description: 'Consultant\'s clinical findings',
    previewFallback: 'No findings recorded',
    colSpan: 2,
  },
  {
    key: 'recommendations' as const,
    label: 'Recommendations',
    type: 'textarea' as const,
    placeholder: 'Provide recommendations...',
    description: 'Consultant\'s recommendations and plan',
    previewFallback: 'No recommendations recorded',
    colSpan: 2,
  },
  {
    key: 'consultantNotes' as const,
    label: 'Consultant Notes',
    type: 'textarea' as const,
    placeholder: 'Additional notes...',
    description: 'Additional notes from consultant',
    previewFallback: 'No consultant notes',
    colSpan: 2,
  },
];

interface ConsultationsEditorProps {
  isDark: boolean;
  colors: ConsultationsThemeTokens;
  mode: ConsultationsMode;
  formData: ConsultationsFormValues;
  customFields: DynamicCustomFields;
  fieldErrors: Partial<Record<keyof ConsultationsFormValues, string>>;
  formError: string | null;
  isSubmitting: boolean;
  isAccepting?: boolean;
  isDeclining?: boolean;
  isCompleting?: boolean;
  isCancelling?: boolean;
  isScheduling?: boolean;
  onChange: (field: keyof ConsultationsFormValues, value: string | number | boolean | string[] | null) => void;
  onCustomFieldsChange: (fields: DynamicCustomFields) => void;
  onCancel: () => void;
  onPreview: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onComplete?: () => void;
  onCancelRequest?: () => void;
  onSchedule?: () => void;
}

export const ConsultationsEditor: React.FC<ConsultationsEditorProps> = ({
  isDark,
  colors,
  mode,
  formData,
  customFields,
  fieldErrors,
  formError,
  isSubmitting,
  isAccepting,
  isDeclining,
  isCompleting,
  isCancelling,
  isScheduling,
  onChange,
  onCustomFieldsChange,
  onCancel,
  onPreview,
  onSubmit,
  onAccept,
  onDecline,
  onComplete,
  onCancelRequest,
  onSchedule,
}) => {
  const isEditing = mode === 'edit';
  const isAccepted = formData.request_status === ConsultationStatus.ACCEPTED;
  const isPending = formData.request_status === ConsultationStatus.PENDING;
  const isCompleted = formData.request_status === ConsultationStatus.COMPLETED;

  const handleAddCustomField = () => {
    onCustomFieldsChange(addCustomField(customFields, 'text'));
  };

  const handleUpdateCustomField = (index: number, updates: Partial<DynamicCustomField>) => {
    onCustomFieldsChange(updateCustomField(customFields, index, updates));
  };

  const handleRemoveCustomField = (index: number) => {
    onCustomFieldsChange(removeCustomField(customFields, index));
  };

  // Group fields for grid layout
  const requestFields = CONSULTATIONS_FIELD_DEFINITIONS.slice(0, 3);
  const typePriorityFields = CONSULTATIONS_FIELD_DEFINITIONS.slice(3, 5);
  const schedulingFields = CONSULTATIONS_FIELD_DEFINITIONS.slice(5, 8);
  const followupFields = CONSULTATIONS_FIELD_DEFINITIONS.slice(8, 11);

  return (
    <section
      className={cn(
        'rounded-2xl border mb-6',
        colors.border.primary,
        colors.bg.card
      )}
    >
      {/* Header */}
      <div className={cn('border-b p-5', colors.border.primary)}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'rounded-xl p-2.5',
                isDark ? 'bg-blue-950/40' : 'bg-blue-50'
              )}
            >
              <SquarePen
                className={cn('h-5 w-5', isDark ? 'text-blue-300' : 'text-blue-700')}
              />
            </div>

            <div>
              <h3 className={cn('text-base font-semibold', colors.text.primary)}>
                {isEditing ? 'Edit Consultation' : 'Request Consultation'}
              </h3>
              <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                Request a specialist consultation. Fill in the required details.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Workflow Action Buttons */}
            {isEditing && onAccept && isPending && (
              <button
                type="button"
                onClick={onAccept}
                disabled={isAccepting}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  'bg-green-600 text-white hover:bg-green-700',
                  isAccepting && 'cursor-not-allowed opacity-50'
                )}
              >
                {isAccepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                Accept
              </button>
            )}

            {isEditing && onDecline && isPending && (
              <button
                type="button"
                onClick={onDecline}
                disabled={isDeclining}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  'border border-red-300 bg-red-50 text-red-700 hover:bg-red-100',
                  isDark && 'border-red-800/50 bg-red-950/30 text-red-300 hover:bg-red-950/50',
                  isDeclining && 'cursor-not-allowed opacity-50'
                )}
              >
                {isDeclining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                Decline
              </button>
            )}

            {isEditing && onComplete && !isCompleted && (isAccepted || isPending) && (
              <button
                type="button"
                onClick={onComplete}
                disabled={isCompleting}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  'bg-teal-600 text-white hover:bg-teal-700',
                  isCompleting && 'cursor-not-allowed opacity-50'
                )}
              >
                {isCompleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
                Complete
              </button>
            )}

            {isEditing && onSchedule && (isAccepted || isPending) && (
              <button
                type="button"
                onClick={onSchedule}
                disabled={isScheduling}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  'bg-amber-600 text-white hover:bg-amber-700',
                  isScheduling && 'cursor-not-allowed opacity-50'
                )}
              >
                {isScheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                Schedule
              </button>
            )}

            {isEditing && onCancelRequest && !isCompleted && (
              <button
                type="button"
                onClick={onCancelRequest}
                disabled={isCancelling}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  'bg-gray-600 text-white hover:bg-gray-700',
                  isCancelling && 'cursor-not-allowed opacity-50'
                )}
              >
                {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Cancel
              </button>
            )}

            <button
              type="button"
              onClick={onPreview}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                colors.border.primary,
                colors.text.primary,
                colors.bg.hover
              )}
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>

            <button
              type="button"
              onClick={onCancel}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                colors.border.primary,
                colors.text.secondary,
                colors.bg.hover
              )}
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={onSubmit} className="p-5 sm:p-6">
        {formError && (
          <div
            className={cn(
              'mb-6 rounded-xl border p-4 text-sm',
              isDark
                ? 'border-red-800/60 bg-red-950/30 text-red-300'
                : 'border-red-200 bg-red-50 text-red-700'
            )}
          >
            {formError}
          </div>
        )}

        {/* Specialty Required - Custom Combobox */}
        <div className="mb-6">
          <label className={cn('mb-1 flex items-center gap-1 text-sm font-medium', colors.text.primary)}>
            Specialty Required <span className="text-red-500 text-xs">*</span>
          </label>
          <p className={cn('mb-2 text-xs', colors.text.tertiary)}>
            Search from predefined specialties or enter your own
          </p>
          <SpecialtyCombobox
            value={formData.specialtyRequired}
            error={fieldErrors.specialtyRequired}
            colors={colors}
            autoFocus={true}
            onChange={(value) => onChange('specialtyRequired', value)}
          />
        </div>

        {/* Clinical Question & Background */}
        <div className="mb-6 space-y-4">
          {requestFields.slice(1).map((field) => (
            <ConsultationsField
              key={field.key}
              field={field}
              value={formData[field.key] as string | number | boolean | string[] | null}
              error={fieldErrors[field.key]}
              isDark={isDark}
              colors={colors}
              onChange={onChange}
            />
          ))}
        </div>

        {/* Consultation Type & Priority */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {typePriorityFields.map((field) => (
            <ConsultationsField
              key={field.key}
              field={field}
              value={formData[field.key] as string | number | boolean | string[] | null}
              error={fieldErrors[field.key]}
              isDark={isDark}
              colors={colors}
              onChange={onChange}
            />
          ))}
        </div>

        {/* Scheduling */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {schedulingFields.map((field) => (
            <ConsultationsField
              key={field.key}
              field={field}
              value={formData[field.key] as string | number | boolean | string[] | null}
              error={fieldErrors[field.key]}
              isDark={isDark}
              colors={colors}
              onChange={onChange}
            />
          ))}
        </div>

        {/* Follow-up */}
        <div className="mb-6">
          <div className="mb-4">
            <ConsultationsField
              key={followupFields[0].key}
              field={followupFields[0]}
              value={formData[followupFields[0].key] as string | number | boolean | string[] | null}
              error={fieldErrors[followupFields[0].key]}
              isDark={isDark}
              colors={colors}
              onChange={onChange}
            />
          </div>
          {formData.requiresFollowup && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {followupFields.slice(1).map((field) => (
                <ConsultationsField
                  key={field.key}
                  field={field}
                  value={formData[field.key] as string | number | boolean | string[] | null}
                  error={fieldErrors[field.key]}
                  isDark={isDark}
                  colors={colors}
                  onChange={onChange}
                />
              ))}
            </div>
          )}
        </div>

        {/* Consultant Response Section (for edit mode when accepted) */}
        {isEditing && (isAccepted || isPending) && (
          <div className="mt-8 border-t pt-6">
            <h4 className={cn('mb-4 text-sm font-semibold', colors.text.primary)}>
              Consultant Response
            </h4>
            <div className="space-y-4">
              {RESPONSE_FIELD_DEFINITIONS.map((field) => (
                <ConsultationsField
                  key={field.key}
                  field={field}
                  value={formData[field.key] as string | number | boolean | string[] | null}
                  error={fieldErrors[field.key]}
                  isDark={isDark}
                  colors={colors}
                  onChange={onChange}
                />
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Custom Fields Section */}
        <div className="mt-8 border-t pt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h4 className={cn('text-sm font-semibold', colors.text.primary)}>
                Additional Information
              </h4>
              <p className={cn('text-xs', colors.text.tertiary)}>
                Add custom fields specific to this consultation
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddCustomField}
              className={cn(
                'inline-flex cursor-pointer items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                'text-blue-600 hover:bg-blue-50',
                isDark && 'hover:bg-blue-950/40'
              )}
            >
              <Plus className="h-4 w-4" />
              Add Field
            </button>
          </div>

          <div className="space-y-3">
            {customFields.map((field, index) => (
              <div
                key={field.id}
                className={cn(
                  'flex flex-wrap items-center gap-2 rounded-lg border p-3',
                  colors.border.primary
                )}
              >
                <input
                  type="text"
                  placeholder="Field name (e.g., Insurance Approval)"
                  value={field.label}
                  onChange={(e) => handleUpdateCustomField(index, { label: e.target.value })}
                  className={cn(
                    'flex-1 min-w-[150px] rounded-lg border px-3 py-2 text-sm outline-none transition-all',
                    colors.bg.input,
                    colors.text.primary,
                    colors.border.primary,
                    'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  )}
                />

                <select
                  value={field.type}
                  onChange={(e) => handleUpdateCustomField(index, { type: e.target.value as CustomFieldValueType })}
                  className={cn(
                    'cursor-pointer rounded-lg border px-3 py-2 text-sm outline-none transition-all',
                    colors.bg.input,
                    colors.text.primary,
                    colors.border.primary,
                    'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  )}
                >
                  <option value="text">Text</option>
                  <option value="textarea">Text Area</option>
                  <option value="date">Date</option>
                </select>

                {field.type === 'date' ? (
                  <input
                    type="date"
                    value={field.value ?? ''}
                    onChange={(e) => handleUpdateCustomField(index, { value: e.target.value })}
                    className={cn(
                      'flex-1 min-w-[150px] rounded-lg border px-3 py-2 text-sm outline-none transition-all',
                      colors.bg.input,
                      colors.text.primary,
                      colors.border.primary,
                      'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    )}
                  />
                ) : field.type === 'textarea' ? (
                  <textarea
                    placeholder="Value"
                    value={field.value ?? ''}
                    onChange={(e) => handleUpdateCustomField(index, { value: e.target.value })}
                    rows={2}
                    className={cn(
                      'flex-1 min-w-[200px] rounded-lg border px-3 py-2 text-sm outline-none transition-all resize-y',
                      colors.bg.input,
                      colors.text.primary,
                      colors.border.primary,
                      'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    )}
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="Value"
                    value={field.value ?? ''}
                    onChange={(e) => handleUpdateCustomField(index, { value: e.target.value })}
                    className={cn(
                      'flex-1 min-w-[150px] rounded-lg border px-3 py-2 text-sm outline-none transition-all',
                      colors.bg.input,
                      colors.text.primary,
                      colors.border.primary,
                      'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    )}
                  />
                )}

                <button
                  type="button"
                  onClick={() => handleRemoveCustomField(index)}
                  className={cn(
                    'cursor-pointer rounded-lg p-2 transition-all',
                    'text-red-500 hover:bg-red-50',
                    isDark && 'hover:bg-red-950/40'
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {customFields.length === 0 && (
            <p className={cn('py-4 text-center text-sm', colors.text.tertiary)}>
              No additional fields. Click "Add Field" to add custom information.
            </p>
          )}
        </div>

        {/* Form Actions */}
        <div className={cn('mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5', colors.border.primary)}>
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
              colors.text.secondary,
              colors.bg.hover
            )}
          >
            <RotateCcw className="h-4 w-4" />
            Discard Changes
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'inline-flex cursor-pointer items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all',
              isSubmitting
                ? 'cursor-not-allowed bg-slate-400'
                : 'bg-blue-600 hover:bg-blue-700'
            )}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {isSubmitting
              ? 'Saving...'
              : isEditing
              ? 'Update Consultation'
              : 'Submit Request'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default ConsultationsEditor;