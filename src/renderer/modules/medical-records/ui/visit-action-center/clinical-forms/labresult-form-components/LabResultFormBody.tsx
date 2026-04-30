// lab-results/labresult-form-components/LabResultFormBody.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { LabRequest, LabRequestItem, LabResult } from '../../../../api/lab/LabTypes';
import type { ColorTokens, LabResultHydratedMap } from './labResultForm.types';
import {
  buildLabResultFileName,
  buildLabResultReportHtml,
  downloadHtmlDocument,
  isRequestLockedForEditing,
  triggerPrintWindow,
} from './labResultForm.utils';
import { LabResultHeader } from './LabResultHeader';
import { LabResultRequestSummary } from './LabResultRequestSummary';
import { LabResultItemsTable } from './LabResultItemsTable';
import { LabResultItemResultEditor } from './LabResultItemResultEditor';
import { LabResultPreviewModal } from './LabResultPreviewModal';
import { LabResultEmptyState } from './LabResultEmptyState';

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
  const [refreshToken, setRefreshToken] = useState(0);

  const requestLocked = useMemo(
    () => isRequestLockedForEditing(request),
    [request]
  );

  const itemCount = Array.isArray(request.items) ? request.items.length : 0;

  const handleResultsHydrated = useCallback((itemUuid: string, results: LabResult[]) => {
    setResultsMap((prev) => {
      const current = prev[itemUuid] || [];
      const nextSerialized = JSON.stringify(results);
      const currentSerialized = JSON.stringify(current);

      if (nextSerialized === currentSerialized) return prev;

      return {
        ...prev,
        [itemUuid]: results,
      };
    });
  }, []);

  const handleOpenEditor = useCallback((item: LabRequestItem) => {
    setSelectedItem(item);
    setIsEditorOpen(true);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setSelectedItem(null);
    setIsEditorOpen(false);
  }, []);

  const handleSaved = useCallback(async () => {
    setRefreshToken((prev) => prev + 1);
    await refetchRequest();
  }, [refetchRequest]);

  const handleRefresh = useCallback(async () => {
    setRefreshToken((prev) => prev + 1);
    await refetchRequest();
  }, [refetchRequest]);

  const handlePrint = useCallback(() => {
    const html = buildLabResultReportHtml(request, resultsMap, {
      name: request.facility?.facility_name || 'Medical Facility',
      address: request.facility?.facility_name || 'Address not available',
      phone: null,
      email: null,
      code: request.facility?.facility_uuid || null,
    });

    triggerPrintWindow(html);
  }, [request, resultsMap]);

  const handleDownload = useCallback(() => {
    const html = buildLabResultReportHtml(request, resultsMap, {
      name: request.facility?.facility_name || 'Medical Facility',
      address: request.facility?.facility_name || 'Address not available',
      phone: null,
      email: null,
      code: request.facility?.facility_uuid || null,
    });

    downloadHtmlDocument(buildLabResultFileName(request), html);
  }, [request, resultsMap]);

  return (
    <div 
      className={cn(
        // Base layout
        'min-h-screen w-full',
        
        // Responsive padding - breathing room on all sides
        'px-4 py-6',
        'sm:px-6 sm:py-8',
        'md:px-8 md:py-10',
        'lg:px-10 lg:py-12',
        
        // Content width constraint for readability
        'mx-auto',
        'max-w-[1400px]',
        
        // Background and spacing
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
          onPrint={handlePrint}
          onDownload={handleDownload}
          onRefresh={() => {
            void handleRefresh();
          }}
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
                refreshToken={refreshToken}
                requestLocked={requestLocked}
                staffId={staffId}
                onEditItemResults={handleOpenEditor}
                onResultsHydrated={handleResultsHydrated}
                onActionComplete={() => {
                  void handleRefresh();
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals - These should be portaled, but styling handled inside */}
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
          handleCloseEditor();
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