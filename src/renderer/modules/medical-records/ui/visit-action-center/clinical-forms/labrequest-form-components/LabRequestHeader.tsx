import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  ClipboardList,
  FolderCog,
  FolderOpen,
  LibraryBig,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { LabRequest } from '../../../../api/lab/LabTypes';
import { LabRequestStatus } from '../../../../api/lab/LabTypes';
import { formatDate, getTimeDifference, type ColorTokens } from './labRequestForm.types';
import { FOCUS_MODE_ROUTES } from '../../../../../administration/onboarding/routes/focusModeRouteConstants';

interface LabRequestHeaderProps {
  isDark: boolean;
  colors: ColorTokens;
  request: LabRequest | null;
  onOpenTemplateSelector: () => void;
  onOpenTemplateManager: () => void;
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
  const navigate = useNavigate();
  const hasExistingRequest = !!request;
  
  // Check if request is in a finalized state
  const isFinalized = request && (
    request.status === LabRequestStatus.COMPLETED ||
    request.status === LabRequestStatus.REVIEWED ||
    request.status === LabRequestStatus.CANCELLED
  );
  
  // Permission rules based on request status
  const canModifyRequest = !!request && !isFinalized;
  const canAddItems = !hasExistingRequest || canModifyRequest;
  
  // Check if request has results to view
  const hasResults = request && request.items && request.items.length > 0;
  
  const handleViewResults = () => {
    if (request?.request_uuid) {
      // Navigate to results view page
      navigate(FOCUS_MODE_ROUTES.LAB_RESULT_FOCUS);
    }
  };
  
  const getAddItemTooltip = (): string => {
    if (!hasExistingRequest) return 'Add a lab test to this request';
    if (!canModifyRequest) {
      switch (request?.status) {
        case LabRequestStatus.COMPLETED:
          return 'Cannot add items to completed requests';
        case LabRequestStatus.REVIEWED:
          return 'Cannot add items to reviewed requests';
        case LabRequestStatus.CANCELLED:
          return 'Cannot add items to cancelled requests';
        default:
          return 'Cannot modify this request in its current state';
      }
    }
    return 'Add a lab test to this request';
  };

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
                  'rounded-full px-2.5 py-1 text-xs font-medium cursor-default',
                  request.status === 'completed' ? (isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-700') :
                  request.status === 'reviewed' ? (isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-50 text-purple-700') :
                  request.status === 'cancelled' ? (isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700') :
                  isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                )}
              >
                {request.status_label || request.status}
              </span>
            )}
          </div>

          <p className={cn('mt-1 text-sm cursor-default', colors.text.secondary)}>
            {hasExistingRequest
              ? canModifyRequest
                ? 'Review the active lab request, then add or update only what is needed.'
                : 'This request is finalized and cannot be modified.'
              : 'Build a lab request from Lab Tests, templates, and inventory-aware selections.'}
          </p>

          {/* Time state transitions */}
          <div className="mt-2 space-y-1">
            {request?.created_at && (
              <p className={cn('flex items-center gap-1.5 text-xs', colors.text.tertiary)}>
                <Calendar className="h-3 w-3" />
                <span>Request Made: {formatDate(request.created_at)}</span>
              </p>
            )}

            {request?.reviewed_at && (
              <p className={cn('flex items-center gap-1.5 text-xs', colors.text.tertiary)}>
                <CheckCircle2 className="h-3 w-3 text-purple-500" />
                <span>Reviewed: {formatDate(request.reviewed_at)}</span>
                {request?.created_at && (
                  <span className="text-[10px] opacity-70">
                    ({getTimeDifference(request.created_at, request.reviewed_at)})
                  </span>
                )}
              </p>
            )}

            {request?.completed_at && (
              <p className={cn('flex items-center gap-1.5 text-xs', colors.text.tertiary)}>
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>Completed: {formatDate(request.completed_at)}</span>
                {request?.created_at && !request?.reviewed_at && (
                  <span className="text-[10px] opacity-70">
                    ({getTimeDifference(request.created_at, request.completed_at)})
                  </span>
                )}
                {request?.reviewed_at && (
                  <span className="text-[10px] opacity-70">
                    (from review: {getTimeDifference(request.reviewed_at, request.completed_at)})
                  </span>
                )}
              </p>
            )}

            {request?.cancelled_at && (
              <p className={cn('flex items-center gap-1.5 text-xs', colors.text.tertiary)}>
                <XCircle className="h-3 w-3 text-red-500" />
                <span>Cancelled: {formatDate(request.cancelled_at)}</span>
                {request?.cancellation_reason && (
                  <span className="text-[10px] opacity-70">- {request.cancellation_reason}</span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Refresh Button - Always visible */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className={cn(
              'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
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

        {/* Manage Lab Tests - Always visible */}
        <button
          type="button"
          onClick={onOpenLabItemManager}
          className={cn(
            'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            colors.border.primary,
            colors.bg.hover,
            colors.text.primary
          )}
        >
          <LibraryBig className="h-4 w-4" />
          Manage Lab Tests
        </button>

        {/* Manage Templates - Always visible */}
        <button
          type="button"
          onClick={onOpenTemplateManager}
          className={cn(
            'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            colors.border.primary,
            colors.bg.hover,
            colors.text.primary
          )}
        >
          <FolderCog className="h-4 w-4" />
          Manage Templates
        </button>

        {/* Use Template - Hide when request is finalized */}
        {!isFinalized && (
          <button
            type="button"
            onClick={onOpenTemplateSelector}
            disabled={!canAddItems}
            title={!canAddItems ? getAddItemTooltip() : undefined}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              canAddItems
                ? cn('cursor-pointer', colors.border.primary, colors.bg.hover, colors.text.brand)
                : 'cursor-not-allowed opacity-50',
              colors.border.primary
            )}
          >
            <FolderOpen className="h-4 w-4" />
            Use Template
          </button>
        )}

        {/* Add Lab Test - Hide when request is finalized */}
        {!isFinalized && (
          <button
            type="button"
            onClick={onAddItem}
            disabled={!canAddItems}
            title={!canAddItems ? getAddItemTooltip() : undefined}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              canAddItems
                ? 'cursor-pointer bg-blue-600 hover:bg-blue-700'
                : 'cursor-not-allowed bg-gray-400'
            )}
          >
            <Plus className="h-4 w-4" />
            Add Lab Test
          </button>
        )}

        {/* View Results - Show when request is finalized and has results */}
        {isFinalized && hasResults && (
          <button
            type="button"
            onClick={handleViewResults}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              'cursor-pointer bg-emerald-600 text-white hover:bg-emerald-700'
            )}
          >
            <Eye className="h-4 w-4" />
            View Results
          </button>
        )}
      </div>
    </div>
  );
};

export default LabRequestHeader;