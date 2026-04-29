import React from 'react';
import { Building2, User, X } from 'lucide-react';

import { cn } from '../../../../../../shared/utils/classNameUtils';
import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';

import type { ColorTokens } from './labRequestForm.types';

interface LabRequestStateGuardProps {
  isLoading: boolean;
  isDark: boolean;
  colors: ColorTokens;
  patientId: string | number | null | undefined;
  facilityId: number | null | undefined;
  onCancel?: () => void;
  children: React.ReactNode;
}

export const LabRequestStateGuard: React.FC<LabRequestStateGuardProps> = ({
  isLoading,
  isDark,
  colors,
  patientId,
  facilityId,
  onCancel,
  children,
}) => {
  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSkeleton
          variant="dashboard"
          theme={isDark ? 'dark' : 'light'}
          message="Loading lab request data..."
        />
      </div>
    );
  }

  if (!patientId) {
    return (
      <div className="p-6">
        <div
          className={cn(
            'rounded-xl border p-6 text-center',
            colors.border.primary,
            colors.bg.card
          )}
        >
          <div
            className={cn(
              'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full',
              colors.bg.muted
            )}
          >
            <User className={cn('h-6 w-6', colors.text.secondary)} />
          </div>
          <h2 className={cn('mb-2 text-lg font-semibold', colors.text.primary)}>
            No active patient selected
          </h2>
          <p className={cn('text-sm', colors.text.secondary)}>
            Open this form from an active visit to create or edit a lab request.
          </p>
          {onCancel && (
            <div className="mt-5">
              <button
                type="button"
                onClick={onCancel}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  colors.bg.hover,
                  colors.text.secondary
                )}
              >
                <X className="h-4 w-4" /> Close
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!facilityId) {
    return (
      <div className="p-6">
        <div
          className={cn(
            'rounded-xl border p-6 text-center',
            colors.border.primary,
            colors.bg.card
          )}
        >
          <div
            className={cn(
              'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full',
              colors.bg.muted
            )}
          >
            <Building2 className={cn('h-6 w-6', colors.text.secondary)} />
          </div>
          <h2 className={cn('mb-2 text-lg font-semibold', colors.text.primary)}>
            No facility selected
          </h2>
          <p className={cn('text-sm', colors.text.secondary)}>
            Please select a facility before creating or editing a lab request.
          </p>
          {onCancel && (
            <div className="mt-5">
              <button
                type="button"
                onClick={onCancel}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  colors.bg.hover,
                  colors.text.secondary
                )}
              >
                <X className="h-4 w-4" /> Close
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};