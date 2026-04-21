import React from 'react';
import { Activity, FileText, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { ClinicalTemplate } from '../../../../api/clinical-templates/ClinicalTemplateTypes';
import {
  getCategoryBadgeColor,
  getVisibilityBadgeColor,
} from '../../../../api/clinical-templates/ClinicalTemplateQueries';
import { ClinicalTemplateMedicationTable } from './ClinicalTemplateMedicationTable';

interface ClinicalTemplateCardProps {
  template: ClinicalTemplate;
  isDark: boolean;
  colors: {
    bg: {
      subtle: string;
      hover: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    border: {
      primary: string;
    };
  };
  isBusy: boolean;
  onEdit: (template: ClinicalTemplate) => void;
  onDelete: (template: ClinicalTemplate) => void;
  onToggleStatus: (template: ClinicalTemplate) => void;
}

export const ClinicalTemplateCard: React.FC<ClinicalTemplateCardProps> = ({
  template,
  isDark,
  colors,
  isBusy,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-200',
        colors.border.primary,
        colors.bg.subtle
      )}
    >
      <div className="border-b p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h4 className={cn('text-base font-semibold', colors.text.primary)}>
                {template.name}
              </h4>

              <span className={getCategoryBadgeColor(template.category)}>
                {template.category}
              </span>

              <span className={getVisibilityBadgeColor(template.visibility)}>
                {template.visibility}
              </span>

              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
                  template.is_active
                    ? isDark
                      ? 'border-green-800/50 bg-green-900/20 text-green-300'
                      : 'border-green-200 bg-green-100 text-green-700'
                    : isDark
                      ? 'border-gray-700 bg-gray-800 text-gray-400'
                      : 'border-gray-200 bg-gray-100 text-gray-600'
                )}
              >
                <Activity className="h-3 w-3" />
                {template.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {template.description && (
              <p className={cn('mb-3 text-sm', colors.text.secondary)}>{template.description}</p>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className={cn('rounded-lg border p-3', colors.border.primary)}>
                <div className={cn('mb-1 text-xs font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                  Default Diagnosis
                </div>
                <div className={cn('text-sm', colors.text.primary)}>
                  {template.default_diagnosis || '—'}
                </div>
              </div>

              <div className={cn('rounded-lg border p-3', colors.border.primary)}>
                <div className={cn('mb-1 text-xs font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                  Default Notes
                </div>
                <div className={cn('text-sm', colors.text.primary)}>
                  {template.default_notes || '—'}
                </div>
              </div>

              <div className={cn('rounded-lg border p-3', colors.border.primary)}>
                <div className={cn('mb-1 text-xs font-semibold uppercase tracking-wide', colors.text.tertiary)}>
                  Patient Instructions
                </div>
                <div className={cn('text-sm', colors.text.primary)}>
                  {template.patient_instructions || '—'}
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span className={colors.text.tertiary}>Usage: {template.usage_count} times</span>
              <span className={colors.text.tertiary}>
                Medications: {template.default_medications?.length || 0}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleStatus(template)}
              disabled={isBusy}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                colors.bg.hover,
                colors.text.secondary,
                isBusy && 'cursor-not-allowed opacity-60'
              )}
            >
              <RefreshCw className="h-4 w-4" />
              {template.is_active ? 'Deactivate' : 'Activate'}
            </button>

            <button
              type="button"
              onClick={() => onEdit(template)}
              disabled={isBusy}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                isDark
                  ? 'bg-amber-900/20 text-amber-300 hover:bg-amber-900/30'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
                isBusy && 'cursor-not-allowed opacity-60'
              )}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>

            <button
              type="button"
              onClick={() => onDelete(template)}
              disabled={isBusy}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                isBusy
                  ? 'cursor-not-allowed bg-gray-400 text-white'
                  : isDark
                    ? 'cursor-pointer bg-red-900/20 text-red-300 hover:bg-red-900/30'
                    : 'cursor-pointer bg-red-50 text-red-700 hover:bg-red-100'
              )}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <FileText className={cn('h-4 w-4', colors.text.secondary)} />
          <h5 className={cn('text-sm font-semibold', colors.text.primary)}>Medications</h5>
        </div>

        <ClinicalTemplateMedicationTable
          isDark={isDark}
          colors={colors}
          medications={template.default_medications || []}
          emptyTitle="No medications in this template"
          emptyDescription="This clinical template does not currently include any default medications."
        />
      </div>
    </div>
  );
};

export default ClinicalTemplateCard;
