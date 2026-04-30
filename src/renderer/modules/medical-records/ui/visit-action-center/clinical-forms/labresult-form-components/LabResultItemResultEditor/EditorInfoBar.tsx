// lab-results/labresult-form-components/LabResultItemResultEditor/EditorInfoBar.tsx
import React from 'react';
import { cn } from '../../../../../../../shared/utils/classNameUtils';
import type { ColorTokens } from '../labResultForm.types';

interface EditorInfoBarProps {
  colors: ColorTokens;
  testName: string;
  sampleType: string | null;
  status: string;
}

interface InfoCardProps {
  label: string;
  value: string;
  colors: ColorTokens;
}

const InfoCard: React.FC<InfoCardProps> = ({ label, value, colors }) => {
  return (
    <div className={cn('rounded-xl border p-3', colors.border.primary, colors.bg.subtle)}>
      <p className={cn('text-[11px] font-semibold uppercase tracking-wide', colors.text.tertiary)}>
        {label}
      </p>
      <p className={cn('mt-1 text-sm font-semibold break-words', colors.text.primary)}>
        {value || 'N/A'}
      </p>
    </div>
  );
};

export const EditorInfoBar: React.FC<EditorInfoBarProps> = ({
  colors,
  testName,
  sampleType,
  status,
}) => {
  return (
    <div className="mb-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <InfoCard
        label="Test Name"
        value={testName}
        colors={colors}
      />

      <InfoCard
        label="Sample Type"
        value={sampleType || 'N/A'}
        colors={colors}
      />

      <InfoCard
        label="Current Status"
        value={status}
        colors={colors}
      />
    </div>
  );
};

export default EditorInfoBar;