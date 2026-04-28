import React from 'react';
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  Pencil,
  Plus,
  Stethoscope,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { LabRequest } from '../../../../api/lab/LabTypes';
import { LabRequestPriority } from '../../../../api/lab/LabTypes';
import type { ColorTokens, LabRequestFormData } from './labRequestForm.types';

interface LabRequestDetailsCardProps {
  isDark: boolean;
  colors: ColorTokens;
  request: LabRequest | null;
  formData: LabRequestFormData;
  isEditorOpen: boolean;
  onOpenEditor: () => void;
  onCloseEditor: () => void;
  onChange: (field: keyof LabRequestFormData, value: string | LabRequestPriority) => void;
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
        <p className={cn('text-xs font-medium uppercase tracking-wide', colors.text.tertiary)}>{label}</p>
        <p className={cn('mt-1 text-sm break-words', value ? colors.text.primary : colors.text.secondary)}>
          {value || 'Not provided yet'}
        </p>
      </div>
    </div>
  </div>
);

export const LabRequestDetailsCard: React.FC<LabRequestDetailsCardProps> = ({
  isDark,
  colors,
  request,
  formData,
  isEditorOpen,
  onOpenEditor,
  onCloseEditor,
  onChange,
}) => {
  const priorityOptions = Object.values(LabRequestPriority);

  return (
    <div className={cn('rounded-2xl border p-5', colors.border.primary, colors.bg.card)}>
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className={cn('text-base font-semibold', colors.text.primary)}>Request Details</h3>
          {request?.requested_by?.name && (
            <p className={cn('mt-1 text-xs', colors.text.secondary)}>
              Requested by: {request.requested_by.name}
            </p>
          )}
        </div>

        {!isEditorOpen ? (
          <button
            type="button"
            onClick={onOpenEditor}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
              colors.bg.hover,
              colors.text.brand,
            )}
          >
            {request ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {request ? 'Edit Details' : 'Add Details'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onCloseEditor}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
              colors.bg.hover,
              colors.text.secondary,
            )}
          >
            <CheckCircle2 className="h-4 w-4" />
            Done
          </button>
        )}
      </div>

      {!isEditorOpen ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <SummaryRow
              icon={<ClipboardList className={cn('h-4 w-4', isDark ? 'text-blue-300' : 'text-blue-600')} />}
              label="Priority"
              value={formData.priority || request?.priority_label}
              colors={colors}
            />
            <SummaryRow
              icon={<Stethoscope className={cn('h-4 w-4', isDark ? 'text-green-300' : 'text-green-600')} />}
              label="Suspected Conditions"
              value={formData.suspected_conditions_text}
              colors={colors}
            />
            <SummaryRow
              icon={<ClipboardList className={cn('h-4 w-4', isDark ? 'text-purple-300' : 'text-purple-600')} />}
              label="ICD Codes"
              value={formData.icd_codes_text}
              colors={colors}
            />
            <SummaryRow
              icon={<FileText className={cn('h-4 w-4', isDark ? 'text-amber-300' : 'text-amber-600')} />}
              label="Diagnosis Notes"
              value={formData.diagnosis_notes}
              colors={colors}
            />
          </div>

          <SummaryRow
            icon={<FileText className={cn('h-4 w-4', isDark ? 'text-cyan-300' : 'text-cyan-600')} />}
            label="Clinical Notes"
            value={formData.clinical_notes}
            colors={colors}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.priority}
              onChange={(e) => onChange('priority', e.target.value as LabRequestPriority)}
              className={cn(
                'w-full rounded-lg border p-2.5 text-sm',
                colors.bg.input,
                colors.text.primary,
                colors.border.primary,
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
              )}
            >
              {priorityOptions.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
              Suspected Conditions
            </label>
            <input
              type="text"
              value={formData.suspected_conditions_text}
              onChange={(e) => onChange('suspected_conditions_text', e.target.value)}
              placeholder="Comma separated conditions"
              className={cn(
                'w-full rounded-lg border p-2.5 text-sm',
                colors.bg.input,
                colors.text.primary,
                colors.border.primary,
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
              )}
            />
          </div>

          <div>
            <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
              ICD Codes
            </label>
            <input
              type="text"
              value={formData.icd_codes_text}
              onChange={(e) => onChange('icd_codes_text', e.target.value)}
              placeholder="Comma separated ICD codes"
              className={cn(
                'w-full rounded-lg border p-2.5 text-sm',
                colors.bg.input,
                colors.text.primary,
                colors.border.primary,
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
              )}
            />
          </div>

          <div>
            <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
              Diagnosis Notes
            </label>
            <textarea
              rows={2}
              value={formData.diagnosis_notes}
              onChange={(e) => onChange('diagnosis_notes', e.target.value)}
              placeholder="Context for why these tests are being requested"
              className={cn(
                'w-full rounded-lg border p-2.5 text-sm resize-y',
                colors.bg.input,
                colors.text.primary,
                colors.border.primary,
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
              )}
            />
          </div>

          <div>
            <label className={cn('mb-1 block text-sm font-medium', colors.text.primary)}>
              Clinical Notes
            </label>
            <textarea
              rows={3}
              value={formData.clinical_notes}
              onChange={(e) => onChange('clinical_notes', e.target.value)}
              placeholder="Clinical notes, preparation instructions, or request context"
              className={cn(
                'w-full rounded-lg border p-2.5 text-sm resize-y',
                colors.bg.input,
                colors.text.primary,
                colors.border.primary,
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LabRequestDetailsCard;