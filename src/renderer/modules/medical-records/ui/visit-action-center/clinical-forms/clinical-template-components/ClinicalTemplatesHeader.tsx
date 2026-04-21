import React from 'react';
import { FolderOpen, Plus, RefreshCw } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';

interface ClinicalTemplatesHeaderProps {
  isDark: boolean;
  colors: {
    bg: {
      subtle: string;
    };
    text: {
      primary: string;
      secondary: string;
    };
    border: {
      primary: string;
    };
  };
  totalTemplates: number;
  activeTemplates: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  onAddTemplate: () => void;
}

export const ClinicalTemplatesHeader: React.FC<ClinicalTemplatesHeaderProps> = ({
  isDark,
  colors,
  totalTemplates,
  activeTemplates,
  isRefreshing,
  onRefresh,
  onAddTemplate,
}) => {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex items-start gap-3">
        <div className={cn('rounded-xl p-2.5', isDark ? 'bg-blue-900/20' : 'bg-blue-50')}>
          <FolderOpen className={cn('h-5 w-5', isDark ? 'text-blue-300' : 'text-blue-600')} />
        </div>

        <div>
          <h2 className={cn('text-lg font-semibold', colors.text.primary)}>Clinical Templates</h2>
          <p className={cn('text-sm', colors.text.secondary)}>
            Create and manage reusable prescription templates
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div
          className={cn(
            'rounded-lg border px-3 py-2 text-sm',
            colors.border.primary,
            colors.bg.subtle
          )}
        >
          <span className={cn('font-semibold', colors.text.primary)}>Total:</span>{' '}
          <span className={colors.text.secondary}>{totalTemplates}</span>
        </div>

        <div
          className={cn(
            'rounded-lg border px-3 py-2 text-sm',
            colors.border.primary,
            colors.bg.subtle
          )}
        >
          <span className={cn('font-semibold', colors.text.primary)}>Active:</span>{' '}
          <span className={colors.text.secondary}>{activeTemplates}</span>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
            colors.border.primary,
            colors.text.secondary,
            isRefreshing ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
          )}
        >
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          Refresh
        </button>

        <button
          type="button"
          onClick={onAddTemplate}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white transition-all',
            'bg-blue-600 hover:bg-blue-700'
          )}
        >
          <Plus className="h-4 w-4" />
          Add Clinical Template
        </button>
      </div>
    </div>
  );
};

export default ClinicalTemplatesHeader;
