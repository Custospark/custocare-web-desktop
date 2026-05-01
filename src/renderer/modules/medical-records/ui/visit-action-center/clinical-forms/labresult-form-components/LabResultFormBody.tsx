// lab-results/labresult-form-components/LabResultFormBody.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { LabRequest, LabRequestItem } from '../../../../api/lab/LabTypes';
import type { ColorTokens, LabResultHydratedMap } from './labResultForm.types';
import {
  isRequestLockedForEditing,
} from './labResultForm.utils';
import { LabResultHeader } from './LabResultHeader';
import { LabResultRequestSummary } from './LabResultRequestSummary';
import { LabResultItemsTable } from './LabResultItemsTable/index';
import { LabResultPreviewModal } from './LabResultPreviewModal';
import { LabResultEmptyState } from './LabResultEmptyState';
import LabResultItemResultEditor from './LabResultItemResultEditor';

interface LabResultFormBodyProps {
  theme: 'light' | 'dark';
  isDark: boolean;
  colors: ColorTokens;
  request: LabRequest;
  facilityId?: number | null;
  patientId?: number | string | null;
  visitId?: number | string | null;
  staffId?: number | null;
  patientNumericId: number;
  visitNumericId: number;
  isRequestFetching: boolean;
  refetchRequest: () => Promise<unknown>;
  onCancel?: () => void;
}

export const LabResultFormBody: React.FC<LabResultFormBodyProps> = ({
  isDark,
  colors,
  request,
  staffId,
  isRequestFetching,
  refetchRequest,
  onCancel,
}) => {
  const [selectedItem, setSelectedItem] = useState<LabRequestItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [resultsMap, setResultsMap] = useState<LabResultHydratedMap>({});

  const requestLocked = useMemo(
    () => isRequestLockedForEditing(request),
    [request]
  );

  const itemCount = Array.isArray(request.items) ? request.items.length : 0;

  // Build results map from the request data (single source of truth)
  const buildResultsMapFromRequest = useCallback((labRequest: LabRequest): LabResultHydratedMap => {
    const map: LabResultHydratedMap = {};

    if (Array.isArray(labRequest.items)) {
      labRequest.items.forEach((item) => {
        if (Array.isArray(item.results) && item.results.length > 0) {
          map[item.item_uuid] = item.results;
        } else {
          map[item.item_uuid] = [];
        }
      });
    }

    return map;
  }, []);

  // Update results map when request changes
  React.useEffect(() => {
    const newMap = buildResultsMapFromRequest(request);
    setResultsMap((prev) => {
      const prevStr = JSON.stringify(prev);
      const newStr = JSON.stringify(newMap);
      if (prevStr === newStr) return prev;
      return newMap;
    });
  }, [request, buildResultsMapFromRequest]);

  const handleOpenEditor = useCallback((item: LabRequestItem) => {
    setSelectedItem(item);
    setIsEditorOpen(true);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setSelectedItem(null);
    setIsEditorOpen(false);
  }, []);

  const handleSaved = useCallback(async () => {
    await refetchRequest();
    setResultsMap({});
  }, [refetchRequest]);

  const handleRefresh = useCallback(async () => {
    await refetchRequest();
  }, [refetchRequest]);

  const handleActionComplete = useCallback(async () => {
    await handleRefresh();
  }, [handleRefresh]);

  return (
    <div
      className={cn(
        'min-h-screen w-full',
        'px-4 py-6',
        'sm:px-6 sm:py-8',
        'md:px-8 md:py-10',
        'lg:px-10 lg:py-12',
        'mx-auto',
        'max-w-[1400px]',
        colors.bg.page,
        'space-y-6',
        'sm:space-y-8',
        'md:space-y-10'
      )}
    >
      {/* Header Section */}
      <div className={cn(
        'w-full',
        'rounded-xl',
        'shadow-sm',
        colors.bg.card,
        colors.border.primary,
        'border'
      )}>
       <LabResultHeader
          isDark={isDark}
          colors={colors}
          request={request}
          isRefreshing={isRequestFetching}
          requestLocked={requestLocked}
          onCancel={onCancel}
          onPreview={() => setIsPreviewOpen(true)}
          onRefresh={() => void handleRefresh()}
        />
      </div>

      {/* Main Content */}
      <div className={cn(
        'w-full',
        'rounded-xl',
        'shadow-sm',
        colors.bg.card,
        colors.border.primary,
        'border',
        'overflow-hidden'
      )}>
        {itemCount === 0 ? (
          <div className="p-8 sm:p-10 md:p-12">
            <LabResultEmptyState
              title="No requested lab tests found"
              description="This request currently has no lab request items attached, so there are no result entry rows to work on yet."
              actionLabel="Refresh request"
              onAction={() => {
                void handleRefresh();
              }}
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {/* Request Summary */}
            <div className="p-6 sm:p-8 md:p-10">
              <LabResultRequestSummary
                isDark={isDark}
                colors={colors}
                request={request}
              />
            </div>

            {/* Results Table */}
            <div className="p-6 sm:p-8 md:p-10">
              <LabResultItemsTable
                isDark={isDark}
                colors={colors}
                request={request}
                requestLocked={requestLocked}
                staffId={staffId}
                onEditItemResults={handleOpenEditor}
                onActionComplete={handleActionComplete}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <LabResultItemResultEditor
        open={isEditorOpen}
        isDark={isDark}
        colors={colors}
        request={request}
        item={selectedItem}
        staffId={staffId}
        requestLocked={requestLocked}
        onClose={handleCloseEditor}
        onSaved={() => {
          void handleSaved();
        }}
      />

      <LabResultPreviewModal
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        request={request}
        resultsMap={resultsMap}
      />
    </div>
  );
};

export default LabResultFormBody;