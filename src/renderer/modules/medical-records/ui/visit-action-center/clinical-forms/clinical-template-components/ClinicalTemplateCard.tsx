import React, { useState } from 'react';
import { Activity, FileText, Pencil, RefreshCw, Trash2, Stethoscope, FileCheck, Users, AlertTriangle } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { ClinicalTemplate } from '../../../../api/clinical-templates/ClinicalTemplateTypes';
import  { TemplateVisibility } from '../../../../api/clinical-templates/ClinicalTemplateTypes';
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
      card: string;
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
  currentUserId?: number | null;
  isDeleting?: boolean;
}

export const ClinicalTemplateCard: React.FC<ClinicalTemplateCardProps> = ({
  template,
  isDark,
  colors,
  isBusy,
  onEdit,
  onDelete,
  onToggleStatus,
  currentUserId,
  isDeleting = false,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Check if current user is the creator of the template
  const isCreator = template.created_by?.id === currentUserId;
  
  // Determine if template can be deleted
  // Can delete if:
  // 1. User is the creator (created_by.id === currentUserId)
  // 2. Template is not a system/public template (visibility !== 'PUBLIC')
  // 3. Template has never been used (usage_count === 0) - optional, based on business rules
  const canDelete = isCreator && template.visibility !== TemplateVisibility.SYSTEM_WIDE;
  
  // Determine if template can be deactivated/activated
  // Can toggle status if:
  // 1. User is the creator OR template is not a system template
  const canToggleStatus = isCreator || template.visibility !== TemplateVisibility.SYSTEM_WIDE;
  
  // Determine if template can be edited
  // Can edit if:
  // 1. User is the creator OR template is not a system template
  const canEdit = isCreator || template.visibility !== TemplateVisibility.SYSTEM_WIDE;
  
  const isSystemTemplate = template.visibility === TemplateVisibility.SYSTEM_WIDE;
  const hasBeenUsed = template.usage_count > 0;

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(template);
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleToggleStatus = () => {
    if (canToggleStatus) {
      onToggleStatus(template);
    }
  };

  const handleEdit = () => {
    if (canEdit) {
      onEdit(template);
    }
  };

  return (
    <>
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

                {isSystemTemplate && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
                      isDark
                        ? 'border-purple-800/50 bg-purple-900/20 text-purple-300'
                        : 'border-purple-200 bg-purple-100 text-purple-700'
                    )}
                  >
                    System Template
                  </span>
                )}

                {isCreator && !isSystemTemplate && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
                      isDark
                        ? 'border-blue-800/50 bg-blue-900/20 text-blue-300'
                        : 'border-blue-200 bg-blue-100 text-blue-700'
                    )}
                  >
                    My Template
                  </span>
                )}

                {hasBeenUsed && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
                      isDark
                        ? 'border-amber-800/50 bg-amber-900/20 text-amber-300'
                        : 'border-amber-200 bg-amber-100 text-amber-700'
                    )}
                  >
                    Used {template.usage_count} time{template.usage_count !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {template.description && (
                <p className={cn('mb-4 text-sm', colors.text.secondary)}>{template.description}</p>
              )}

              {/* Created by info */}
              {template.created_by && (
                <div className="mb-3 text-xs">
                  <span className={colors.text.tertiary}>
                    Created by: {template.created_by.full_name}
                  </span>
                </div>
              )}

              {/* Default Diagnosis Row */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Stethoscope className={cn('h-3.5 w-3.5', colors.text.tertiary)} />
                  <span className={cn('text-xs font-medium uppercase tracking-wide', colors.text.tertiary)}>
                    Default Diagnosis
                  </span>
                </div>
                <p className={cn('text-sm leading-relaxed', colors.text.primary)}>
                  {template.default_diagnosis || '—'}
                </p>
                <div className={cn(
                  'mt-1 w-full border-t border-dashed',
                  isDark ? 'border-gray-600' : 'border-gray-300'
                )} />
              </div>

              {/* Default Notes Row */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <FileCheck className={cn('h-3.5 w-3.5', colors.text.tertiary)} />
                  <span className={cn('text-xs font-medium uppercase tracking-wide', colors.text.tertiary)}>
                    Default Notes
                  </span>
                </div>
                <p className={cn('text-sm leading-relaxed whitespace-pre-wrap', colors.text.primary)}>
                  {template.default_notes || '—'}
                </p>
                <div className={cn(
                  'mt-1 w-full border-t border-dashed',
                  isDark ? 'border-gray-600' : 'border-gray-300'
                )} />
              </div>

              {/* Patient Instructions Row */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users className={cn('h-3.5 w-3.5', colors.text.tertiary)} />
                  <span className={cn('text-xs font-medium uppercase tracking-wide', colors.text.tertiary)}>
                    Patient Instructions
                  </span>
                </div>
                <p className={cn('text-sm leading-relaxed whitespace-pre-wrap', colors.text.primary)}>
                  {template.patient_instructions || '—'}
                </p>
                <div className={cn(
                  'mt-1 w-full border-t border-dashed',
                  isDark ? 'border-gray-600' : 'border-gray-300'
                )} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span className={colors.text.tertiary}>
                  Medications: {template.default_medications?.length || 0}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Activate/Deactivate Button */}
              {canToggleStatus && (
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  disabled={isBusy}
                  className={cn(
                    'inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    colors.bg.hover,
                    colors.text.secondary,
                    isBusy && 'cursor-not-allowed opacity-60'
                  )}
                  title={!canToggleStatus ? "Only the creator can modify this template" : hasBeenUsed ? "Template has been used, but can still be deactivated" : ""}
                >
                  <RefreshCw className="h-4 w-4" />
                  {template.is_active ? 'Deactivate' : 'Activate'}
                </button>
              )}

              {/* Edit Button */}
              {canEdit && (
                <button
                  type="button"
                  onClick={handleEdit}
                  disabled={isBusy}
                  className={cn(
                    'inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    isDark
                      ? 'bg-amber-900/20 text-amber-300 hover:bg-amber-900/30'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
                    isBusy && 'cursor-not-allowed opacity-60'
                  )}
                  title={!canEdit ? "Only the creator can edit this template" : ""}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              )}

              {/* Delete Button */}
              {canDelete && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={isBusy || isDeleting}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    isBusy || isDeleting
                      ? 'cursor-not-allowed bg-gray-400 text-white'
                      : isDark
                        ? 'cursor-pointer bg-red-900/20 text-red-300 hover:bg-red-900/30'
                        : 'cursor-pointer bg-red-50 text-red-700 hover:bg-red-100'
                  )}
                  title={!canDelete ? "Cannot delete: You must be the creator, template must not be a system template, and it must have never been used" : ""}
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              )}
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
                Delete Template
              </h3>
            </div>

            <div className="p-5">
              <p className={cn('text-sm', colors.text.primary)}>
                Are you sure you want to delete "{template.name}"?
              </p>
              <p className={cn('mt-2 text-sm', colors.text.secondary)}>
                This action cannot be undone. The template will be permanently removed.
              </p>
              
              <div className={cn('mt-4 rounded-lg border p-3', colors.border.primary, colors.bg.subtle)}>
                <p className={cn('text-sm font-medium', colors.text.primary)}>
                  {template.name}
                </p>
                <p className={cn('mt-1 text-xs', colors.text.secondary)}>
                  Category: {template.category} • Visibility: {template.visibility}
                </p>
                {template.created_by && (
                  <p className={cn('mt-1 text-xs', colors.text.secondary)}>
                    Created by: {template.created_by.name}
                  </p>
                )}
                {template.usage_count > 0 && (
                  <p className={cn('mt-2 text-xs text-amber-600 dark:text-amber-400')}>
                    Warning: This template has been used {template.usage_count} time{template.usage_count !== 1 ? 's' : ''}.
                  </p>
                )}
              </div>
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

export default ClinicalTemplateCard;