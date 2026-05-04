import React from 'react';
import { FolderOpen, Pill, Plus, RefreshCw } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { ColorTokens } from './prescriptionForm.types';
import type { Prescription } from '../../../../api/prescription/PrescriptionTypes';

interface PrescriptionHeaderProps {
  isDark: boolean;
  colors: ColorTokens;
  prescription: Prescription | null;
  onOpenTemplateSelector: () => void;
  onAddMedication: () => void;
  /** When false, template and add-medication actions are hidden (dispensed / locked Rx). */
  allowMedicationMutations?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const PrescriptionHeader: React.FC<PrescriptionHeaderProps> = ({
  isDark,
  colors,
  prescription,
  onOpenTemplateSelector,
  onAddMedication,
  allowMedicationMutations = true,
  onRefresh,
  isRefreshing = false,
}) => {
  const hasExistingPrescription = !!prescription;

  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex items-start gap-3">
        <div className={cn('rounded-xl p-2.5', isDark ? 'bg-green-900/20' : 'bg-green-50')}>
          <Pill className={cn('h-5 w-5', isDark ? 'text-green-300' : 'text-green-600')} />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={cn('text-lg font-semibold', colors.text.primary)}>
              {hasExistingPrescription ? 'Existing Prescription' : 'Create Prescription'}
            </h2>

            {prescription?.prescription_number && (
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium',
                  isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'
                )}
              >
                #{prescription.prescription_number}
              </span>
            )}

            {prescription?.status && (
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium',
                  isDark 
                    ? 'bg-yellow-900/30 text-yellow-300' 
                    : 'bg-yellow-50 text-yellow-700'
                )}
              >
                {prescription.status}
              </span>
            )}
          </div>

          <p className={cn('mt-1 text-sm', colors.text.secondary)}>
            {hasExistingPrescription
              ? 'Review the current prescription first, then edit only what is needed.'
              : 'No existing prescription found. Start with details or add medications when ready.'}
          </p>
          
          {hasExistingPrescription && prescription?.updated_at && (
            <p className={cn('mt-1 text-xs', colors.text.tertiary)}>
              Last updated: {new Date(prescription.updated_at).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className={cn(
              'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
              colors.border.primary,
              colors.bg.hover,
              colors.text.secondary,
              isRefreshing && 'cursor-not-allowed opacity-50'
            )}
            title="Refresh prescription data"
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        )}

        {allowMedicationMutations && (
          <>
            <button
              type="button"
              onClick={onOpenTemplateSelector}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
                colors.border.primary,
                colors.bg.hover,
                colors.text.brand
              )}
            >
              <FolderOpen className="h-4 w-4" />
              Use Template
            </button>

            <button
              type="button"
              onClick={onAddMedication}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Medication
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PrescriptionHeader;