import React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Activity,
  Shield,
  FileText,
  CalendarDays,
  User,
  Pencil,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { AllergySeverity } from '../../../../api/allergies/AllergyTypes';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import {
  formatDate,
  getSeverityBadgeClasses,
} from './allergiesForm.utils';
import type { Allergy } from '../../../../api/allergies/AllergyTypes';
import type { AllergiesThemeTokens } from './allergiesForm.types';

interface AllergiesSummaryCardProps {
  isDark: boolean;
  colors: AllergiesThemeTokens;
  allergy: Allergy;
  isEditing: boolean;
  isMutating: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export const AllergiesSummaryCard: React.FC<AllergiesSummaryCardProps> = ({
  isDark,
  colors,
  allergy,
  isEditing,
  isMutating,
  canDelete,
  onEdit,
  onDelete,
}) => {
  const isSevere = allergy.severity === AllergySeverity.SEVERE;
  const severityLabel = allergy.severity.charAt(0).toUpperCase() + allergy.severity.slice(1);

  // Get the appropriate icon based on severity
  const getSeverityIcon = () => {
    if (isSevere) {
      return <AlertTriangle className={cn('h-5 w-5', isDark ? 'text-red-400' : 'text-red-600')} />;
    }
    if (allergy.severity === AllergySeverity.MODERATE) {
      return <AlertCircle className={cn('h-5 w-5', isDark ? 'text-yellow-400' : 'text-yellow-600')} />;
    }
    return <Shield className={cn('h-5 w-5', isDark ? 'text-blue-400' : 'text-blue-600')} />;
  };

  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-200',
        colors.border.primary,
        isEditing
          ? isDark
            ? 'bg-blue-900/10 ring-2 ring-blue-700/40'
            : 'bg-blue-50 ring-2 ring-blue-200'
          : colors.bg.subtle,
        isSevere && !isEditing && (isDark ? 'border-red-800/30' : 'border-red-200')
      )}
    >
      {/* Header Section */}
      <div className="p-4 pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          {/* Left side - Main info */}
          <div className="min-w-0 flex-1">
            {/* Title row with allergen and badges */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                {getSeverityIcon()}
                <h4 className={cn('text-base font-semibold', colors.text.primary)}>
                  {allergy.allergen}
                </h4>
              </div>

              {/* Severity badge */}
              <span className={getSeverityBadgeClasses(allergy.severity, isDark)}>
                {severityLabel}
              </span>

              {/* Status badge */}
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
                  allergy.is_active
                    ? isDark
                      ? 'border-green-800/50 bg-green-900/20 text-green-300'
                      : 'border-green-200 bg-green-100 text-green-700'
                    : isDark
                    ? 'border-gray-700 bg-gray-800 text-gray-400'
                    : 'border-gray-200 bg-gray-100 text-gray-600'
                )}
              >
                <Activity className="h-3 w-3" />
                {allergy.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Reaction section */}
            {allergy.reaction && (
              <div className="mb-3 flex items-start gap-2">
                <AlertCircle className={cn('mt-0.5 h-4 w-4 flex-shrink-0', colors.text.tertiary)} />
                <div className="flex-1">
                  <span className={cn('text-sm font-medium', colors.text.secondary)}>Reaction:</span>
                  <p className={cn('text-sm', colors.text.primary)}>{allergy.reaction}</p>
                </div>
              </div>
            )}

            {/* Clinical notes section */}
            {allergy.clinical_notes && (
              <div className="mb-3 flex items-start gap-2">
                <FileText className={cn('mt-0.5 h-4 w-4 flex-shrink-0', colors.text.tertiary)} />
                <div className="flex-1">
                  <span className={cn('text-sm font-medium', colors.text.secondary)}>Notes:</span>
                  <p className={cn('text-sm', colors.text.primary)}>{allergy.clinical_notes}</p>
                </div>
              </div>
            )}

            {/* Metadata footer */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3 text-xs">
              {/* Diagnosis date */}
              {allergy.diagnosed_at && (
                <div className="flex items-center gap-1.5">
                  <CalendarDays className={cn('h-3.5 w-3.5', colors.text.tertiary)} />
                  <span className={colors.text.tertiary}>
                    Diagnosed: {formatDate(allergy.diagnosed_at)}
                  </span>
                </div>
              )}

              {/* Recording doctor */}
              {allergy.recorded_by?.name && (
                <div className="flex items-center gap-1.5">
                  <User className={cn('h-3.5 w-3.5', colors.text.tertiary)} />
                  <span className={colors.text.tertiary}>
                    Recorded by: Dr. {allergy.recorded_by.name}
                  </span>
                </div>
              )}

              {/* Facility info */}
              {allergy.visit?.facility_name && (
                <div className="flex items-center gap-1.5">
                  <div className={cn('h-3.5 w-3.5', colors.text.tertiary)}>🏥</div>
                  <span className={colors.text.tertiary}>
                    {allergy.visit.facility_name}
                    {allergy.visit?.facility_main_phone && (
                      <span className="ml-1">
                        ({allergy.visit.facility_main_phone})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              disabled={isMutating}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                isDark
                  ? 'bg-amber-900/20 text-amber-300 hover:bg-amber-900/30'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
                isMutating && 'cursor-not-allowed opacity-50'
              )}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>

            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isMutating}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  isMutating
                    ? 'cursor-not-allowed bg-gray-400 text-white'
                    : isDark
                    ? 'cursor-pointer bg-red-900/20 text-red-300 hover:bg-red-900/30'
                    : 'cursor-pointer bg-red-50 text-red-700 hover:bg-red-100'
                )}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editing indicator */}
      {isEditing && (
        <div
          className={cn(
            'mx-4 mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
            isDark
              ? 'border-blue-800/40 bg-blue-900/20 text-blue-300'
              : 'border-blue-200 bg-blue-50 text-blue-700'
          )}
        >
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          Currently editing this allergy record - changes will update the existing record
        </div>
      )}

      {/* Severe allergy warning banner */}
      {isSevere && allergy.is_active && !isEditing && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-b-xl border-t px-4 py-2 text-xs',
            isDark
              ? 'border-red-800/30 bg-red-900/20 text-red-300'
              : 'border-red-200 bg-red-50 text-red-700'
          )}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span className="font-medium">Severe Allergy Alert:</span>
          <span>This allergy requires immediate attention and precautions</span>
        </div>
      )}
    </div>
  );
};

export default AllergiesSummaryCard;