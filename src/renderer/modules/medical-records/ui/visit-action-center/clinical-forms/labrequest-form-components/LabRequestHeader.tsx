// labrequest-form-components/LabRequestHeader.tsx
import React from 'react';
import {
  ClipboardList,
  FolderCog,
  FolderOpen,
  LibraryBig,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { LabRequest } from '../../../../api/lab/LabTypes';
import type { ColorTokens } from './labRequestForm.types';

interface LabRequestHeaderProps {
  isDark: boolean;
  colors: ColorTokens;
  request: LabRequest | null;
  onOpenTemplateSelector: () => void;
  onOpenTemplateManager: () => void;
  onOpenTemplateFieldManager?: () => void;
  onOpenLabItemManager: () => void;
  onAddItem: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const LabRequestHeader: React.FC<LabRequestHeaderProps> = ({
  isDark,
  colors,
  request,
  onOpenTemplateSelector,
  onOpenTemplateManager,
  onOpenLabItemManager,
  onAddItem,
  onRefresh,
  isRefreshing = false,
}) => {
  const hasExistingRequest = !!request;

  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex items-start gap-3">
        <div className={cn('rounded-xl p-2.5', isDark ? 'bg-cyan-900/20' : 'bg-cyan-50')}>
          <ClipboardList className={cn('h-5 w-5', isDark ? 'text-cyan-300' : 'text-cyan-600')} />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={cn('text-lg font-semibold', colors.text.primary)}>
              {hasExistingRequest ? 'Existing Lab Request' : 'Create Lab Request'}
            </h2>

            {request?.status && (
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium',
                  isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                )}
              >
                {request.status_label || request.status}
              </span>
            )}
          </div>

          <p className={cn('mt-1 text-sm', colors.text.secondary)}>
            {hasExistingRequest
              ? 'Review the active lab request, then add or update only what is needed.'
              : 'Build a lab request from Lab Tests, templates, and inventory-aware selections.'}
          </p>

          {request?.updated_at && (
            <p className={cn('mt-1 text-xs', colors.text.tertiary)}>
              Last updated: {new Date(request.updated_at).toLocaleString()}
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
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        )}

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
          onClick={onOpenTemplateManager}
          className={cn(
            'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
            colors.border.primary,
            colors.bg.hover,
            colors.text.primary
          )}
        >
          <FolderCog className="h-4 w-4" />
          Manage Templates
        </button>

        <button
          type="button"
          onClick={onOpenLabItemManager}
          className={cn(
            'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all',
            colors.border.primary,
            colors.bg.hover,
            colors.text.primary
          )}
        >
          <LibraryBig className="h-4 w-4" />
          Manage Lab Tests
        </button>

        <button
          type="button"
          onClick={onAddItem}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Lab Test
        </button>
      </div>
    </div>
  );
};

export default LabRequestHeader;
