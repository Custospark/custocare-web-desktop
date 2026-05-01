import React from 'react';
import { Eye } from 'lucide-react';
import { cn } from '../../../../../../../../shared/utils/classNameUtils';
import type { ColorTokens } from '../../labResultForm.types';

interface LabResultViewButtonProps {
  onClick: () => void;
  hasResults: boolean;
  isDark?: boolean;
  colors: ColorTokens;
  disabled?: boolean;
}

export const LabResultViewButton: React.FC<LabResultViewButtonProps> = ({
  onClick,
  hasResults,
  colors,
  disabled = false,
}) => {
  const isDisabled = disabled || !hasResults;
  
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all',
        colors.border.primary,
        colors.bg.hover,
        colors.text.primary,
        isDisabled && 'cursor-not-allowed opacity-50',
        !isDisabled && 'cursor-pointer'
      )}
      title={!hasResults ? 'No results to view' : 'View detailed results'}
    >
      <Eye className="h-3.5 w-3.5" />
      View Results
    </button>
  );
};

export default LabResultViewButton;