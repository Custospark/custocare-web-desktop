import React, { useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Pencil,
  Plus,
  Stethoscope,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type {
  Prescription,
} from '../../../../api/prescription/PrescriptionTypes';
import {
  PrescriptionPriority,
  PrescriptionType,
  PrescriptionStatus,
} from '../../../../api/prescription/PrescriptionTypes';
import type { ColorTokens, PrescriptionFormData } from './prescriptionForm.types';

interface PrescriptionDetailsCardProps {
  isDark: boolean;
  colors: ColorTokens;
  prescription: Prescription | null;
  formData: PrescriptionFormData;
  isEditorOpen: boolean;
  onOpenEditor: () => void;
  onCloseEditor: () => void;
  onChange: (
    field: keyof PrescriptionFormData,
    value: string | PrescriptionType | PrescriptionPriority
  ) => void;
  onDelete?: () => void;
  currentUserId?: number | null;
  isDeleting?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const SummaryRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  colors: ColorTokens;
}> = ({ icon, label, value, colors }) => (
  <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className={cn('text-xs font-medium uppercase tracking-wide', colors.text.tertiary)}>
          {label}
        </p>
        <p className={cn('mt-1 text-sm break-words', value ? colors.text.primary : colors.text.secondary)}>
          {value || 'Not provided yet'}
        </p>
      </div>
    </div>
  </div>
);

export const PrescriptionDetailsCard: React.FC<PrescriptionDetailsCardProps> = ({
  isDark,
  colors,
  prescription,
  formData,
  isEditorOpen,
  onOpenEditor,
  onCloseEditor,
  onChange,
  onDelete,
  currentUserId,
  isDeleting = false,
  onRefresh,
  isRefreshing = false,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isExistingPrescription = !!prescription;
  
  // Check if current user is the prescriber and prescription is in DRAFT status
  const canDelete = isExistingPrescription
   && 
    prescription.prescribed_by.id === currentUserId &&
    prescription?.status === PrescriptionStatus.DRAFT;

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete?.();
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className={cn('rounded-2xl border p-5', colors.border.primary, colors.bg.card)}>
        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className={cn('text-base font-semibold', colors.text.primary)}>
              Prescription Details
            </h3>
            {isExistingPrescription && prescription?.prescribed_by_user && (
              <p className={cn('mt-1 text-xs', colors.text.secondary)}>
                Prescribed by: {prescription.prescribed_by_user.name}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                  colors.bg.hover,
                  colors.text.secondary,
                  isRefreshing && 'cursor-not-allowed opacity-50'
                )}
                title="Refresh prescription details"
              >
                <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            )}

            {!isEditorOpen ? (
              <>
                <button
                  type="button"
                  onClick={onOpenEditor}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                    colors.bg.hover,
                    colors.text.brand
                  )}
                >
                  {isExistingPrescription ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {isExistingPrescription ? 'Edit Details' : 'Add Details'}
                </button>

                {canDelete && (
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                      colors.bg.hover,
                      'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40',
                      isDeleting && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={onCloseEditor}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                  colors.bg.hover,
                  colors.text.secondary
                )}
              >
                <CheckCircle2 className="h-4 w-4" />
                Done
              </button>
            )}
          </div>
        </div>

        {!isEditorOpen ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <SummaryRow
                icon={<ShieldCheck className={cn('h-4 w-4', isDark ? 'text-blue-300' : 'text-blue-600')} />}
                label="Prescription Type"
                value={formData.prescription_type || prescription?.prescription_type}
                colors={colors}
              />
              <SummaryRow
                icon={<Clock className={cn('h-4 w-4', isDark ? 'text-orange-300' : 'text-orange-600')} />}
                label="Priority"
                value={formData.priority || prescription?.priority}
                colors={colors}
              />
              <SummaryRow
                icon={<Stethoscope className={cn('h-4 w-4', isDark ? 'text-green-300' : 'text-green-600')} />}
                label="Diagnosis"
                value={formData.diagnosis || prescription?.diagnosis}
                colors={colors}
              />
              <SummaryRow
                icon={<CalendarDays className={cn('h-4 w-4', isDark ? 'text-purple-300' : 'text-purple-600')} />}
                label="Follow-up Date"
                value={formData.follow_up_date || prescription?.follow_up_date}
                colors={colors}
              />
              <SummaryRow
                icon={<Clock className={cn('h-4 w-4', isDark ? 'text-cyan-300' : 'text-cyan-600')} />}
                label="Valid Until"
                value={formData.valid_until || prescription?.valid_until}
                colors={colors}
              />
              <SummaryRow
                icon={<FileText className={cn('h-4 w-4', isDark ? 'text-pink-300' : 'text-pink-600')} />}
                label="Patient Education"
                value={formData.patient_education_notes || prescription?.patient_education_notes}
                colors={colors}
              />
            </div>

            <SummaryRow
              icon={<FileText className={cn('h-4 w-4', isDark ? 'text-indigo-300' : 'text-indigo-600')} />}
              label="Clinical Notes"
              value={formData.clinical_notes || prescription?.clinical_notes}
              colors={colors}
            />

            <SummaryRow
              icon={<FileText className={cn('h-4 w-4', isDark ? 'text-amber-300' : 'text-amber-600')} />}
              label="Special Instructions"
              value={formData.special_instructions || prescription?.special_instructions}
              colors={colors}
            />

            <SummaryRow
              icon={<FileText className={cn('h-4 w-4', isDark ? 'text-teal-300' : 'text-teal-600')} />}
              label="Follow-up Instructions"
              value={formData.follow_up_instructions || prescription?.follow_up_instructions}
              colors={colors}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {!isExistingPrescription && (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                      Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.prescription_type}
                      onChange={(e) => onChange('prescription_type', e.target.value as PrescriptionType)}
                      className={cn(
                        'w-full rounded-lg border p-2 text-sm',
                        colors.bg.input,
                        colors.text.primary,
                        colors.border.primary,
                        'focus:outline-none focus:ring-2 focus:ring-blue-500'
                      )}
                    >
                      {Object.values(PrescriptionType).map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
                      Priority <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.priority}
                      onChange={(e) => onChange('priority', e.target.value as PrescriptionPriority)}
                      className={cn(
                        'w-full rounded-lg border p-2 text-sm',
                        colors.bg.input,
                        colors.text.primary,
                        colors.border.primary,
                        'focus:outline-none focus:ring-2 focus:ring-blue-500'
                      )}
                    >
                      {Object.values(PrescriptionPriority).map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={cn('mb-1 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
                    <Clock className="h-4 w-4" />
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => onChange('valid_until', e.target.value)}
                    className={cn(
                      'w-full rounded-lg border p-2 text-sm',
                      colors.bg.input,
                      colors.text.primary,
                      colors.border.primary,
                      'focus:outline-none focus:ring-2 focus:ring-blue-500'
                    )}
                  />
                </div>
              </>
            )}


            <div>
              <label className={cn('mb-1 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
                <Stethoscope className="h-4 w-4" />
                Diagnosis
              </label>
              <textarea
                value={formData.diagnosis}
                onChange={(e) => onChange('diagnosis', e.target.value)}
                rows={2}
                placeholder="Primary diagnosis or indication for prescription..."
                className={cn(
                  'w-full rounded-lg border p-2 text-sm',
                  colors.bg.input,
                  colors.text.primary,
                  colors.border.primary,
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'resize-y'
                )}
              />
            </div>

            <div>
              <label className={cn('mb-1 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
                <FileText className="h-4 w-4" />
                Clinical Notes
              </label>
              <textarea
                value={formData.clinical_notes}
                onChange={(e) => onChange('clinical_notes', e.target.value)}
                rows={3}
                placeholder="Clinical notes, plan, rationale..."
                className={cn(
                  'w-full rounded-lg border p-2 text-sm',
                  colors.bg.input,
                  colors.text.primary,
                  colors.border.primary,
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'resize-y'
                )}
              />
            </div>

            <div>
              <label className={cn('mb-1 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
                <FileText className="h-4 w-4" />
                Special Instructions
              </label>
              <textarea
                value={formData.special_instructions}
                onChange={(e) => onChange('special_instructions', e.target.value)}
                rows={2}
                placeholder="Special instructions for dispensing or patient use..."
                className={cn(
                  'w-full rounded-lg border p-2 text-sm',
                  colors.bg.input,
                  colors.text.primary,
                  colors.border.primary,
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'resize-y'
                )}
              />
            </div>

            <div>
              <label className={cn('mb-1 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
                <FileText className="h-4 w-4" />
                Patient Education Notes
              </label>
              <textarea
                value={formData.patient_education_notes}
                onChange={(e) => onChange('patient_education_notes', e.target.value)}
                rows={2}
                placeholder="What the patient should know about this prescription..."
                className={cn(
                  'w-full rounded-lg border p-2 text-sm',
                  colors.bg.input,
                  colors.text.primary,
                  colors.border.primary,
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'resize-y'
                )}
              />
            </div>

            <div>
              <label className={cn('mb-1 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
                <FileText className="h-4 w-4" />
                Follow-up Instructions
              </label>
              <textarea
                value={formData.follow_up_instructions}
                onChange={(e) => onChange('follow_up_instructions', e.target.value)}
                rows={2}
                placeholder="Follow-up plan and review advice..."
                className={cn(
                  'w-full rounded-lg border p-2 text-sm',
                  colors.bg.input,
                  colors.text.primary,
                  colors.border.primary,
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'resize-y'
                )}
              />
            </div>

            <div>
              <label className={cn('mb-1 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
                <CalendarDays className="h-4 w-4" />
                Follow-up Date
              </label>
              <input
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => onChange('follow_up_date', e.target.value)}
                className={cn(
                  'w-full rounded-lg border p-2 text-sm',
                  colors.bg.input,
                  colors.text.primary,
                  colors.border.primary,
                  'focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
              />
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && handleCancelDelete()}
        >
          <div
            className={cn(
              'w-full max-w-md rounded-2xl border shadow-xl',
              colors.border.primary,
              colors.bg.card
            )}
          >
            <div className={cn('flex items-center gap-3 border-b p-5', colors.border.primary)}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className={cn('text-lg font-semibold', colors.text.primary)}>
                Delete Prescription
              </h3>
            </div>

            <div className="p-5">
              <p className={cn('text-sm', colors.text.primary)}>
                Are you sure you want to delete this prescription?
              </p>
              <p className={cn('mt-2 text-sm', colors.text.secondary)}>
                This action cannot be undone. The prescription will be permanently removed from the system.
              </p>
              
              {prescription && (
                <div className={cn('mt-4 rounded-lg border p-3', colors.border.primary, colors.bg.subtle)}>
                  <p className={cn('text-sm font-medium', colors.text.primary)}>
                    {prescription.prescription_number}
                  </p>
                  <p className={cn('mt-1 text-xs', colors.text.secondary)}>
                    {prescription.prescription_type} • {prescription.priority}
                  </p>
                  {prescription.diagnosis && (
                    <p className={cn('mt-2 text-xs', colors.text.secondary)}>
                      Diagnosis: {prescription.diagnosis}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className={cn('flex justify-end gap-3 border-t p-5', colors.border.primary)}>
              <button
                type="button"
                onClick={handleCancelDelete}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  colors.bg.hover,
                  colors.text.secondary
                )}
                disabled={isDeleting}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium text-white transition-all',
                  isDeleting
                    ? 'cursor-not-allowed bg-gray-400'
                    : 'cursor-pointer bg-red-600 hover:bg-red-700'
                )}
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PrescriptionDetailsCard;