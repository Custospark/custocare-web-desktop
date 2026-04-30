// lab-results/labresult-form-components/LabResultItemResultEditor/EditorInfoBar.tsx
import React from 'react';
import { cn } from '../../../../../../../shared/utils/classNameUtils';
import type { ColorTokens } from '../labResultForm.types';

interface EditorInfoBarProps {
  colors: ColorTokens;
  testName: string;
  requestUuid: string;
  sampleType: string | null;
  status: string;
}

export const EditorInfoBar: React.FC<EditorInfoBarProps> = ({
  colors,
  testName,
  requestUuid,
  sampleType,
  status,
}) => {
  return (
    <div className="mb-4 grid gap-4 lg:grid-cols-4">
      <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
        <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
          Test Name
        </p>
        <p className={cn('mt-1 text-sm font-semibold', colors.text.primary)}>
          {testName || 'N/A'}
        </p>
      </div>

      <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
        <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
          Request UUID
        </p>
        <p className={cn('mt-1 text-sm font-semibold break-all', colors.text.primary)}>
          {requestUuid}
        </p>
      </div>

      <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
        <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
          Sample Type
        </p>
        <p className={cn('mt-1 text-sm font-semibold', colors.text.primary)}>
          {sampleType || 'N/A'}
        </p>
      </div>

      <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
        <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
          Current Status
        </p>
        <p className={cn('mt-1 text-sm font-semibold', colors.text.primary)}>
          {status}
        </p>
      </div>
    </div>
  );
};