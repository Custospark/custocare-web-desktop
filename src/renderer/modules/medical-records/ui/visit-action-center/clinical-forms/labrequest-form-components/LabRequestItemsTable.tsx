import React, { useMemo, useState } from 'react';
import { LabRequestStatus, LabRequestItemStatus } from '../../../../api/lab/LabTypes';
import type { LabRequestItemWithTest } from '../../../../api/lab/LabTypes';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { LabRequestItemsTableRow, LabRequestItemsTableStats, LabRequestItemsTableProps } from './labrequest-items-table-components/types';
import {
  adaptColorsForResultModal,
  formatStaffName,
  getWorkflowStep,
  isLockedStatus,
} from './labrequest-items-table-components/utils';
import { LabRequestItemsTableHeader } from './labrequest-items-table-components/LabRequestItemsTableHeader';
import { LabRequestItemsEmptyState } from './labrequest-items-table-components/LabRequestItemsEmptyState';
import { LabRequestItemsDesktopTable } from './labrequest-items-table-components/LabRequestItemsDesktopTable';
import { LabRequestItemsMobileCards } from './labrequest-items-table-components/LabRequestItemsMobileCards';
import LabResultViewModal from '../labresult-form-components/LabResultItemsTable/components/LabResultViewModal';

export const LabRequestItemsTable: React.FC<LabRequestItemsTableProps> = ({
  isDark,
  colors,
  request,
  items,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onManageLabItems,
}) => {
  const [selectedPersistedItem, setSelectedPersistedItem] = useState<LabRequestItemWithTest | null>(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);

  const canModify =
    !request ||
    (request.status !== LabRequestStatus.CANCELLED &&
      request.status !== LabRequestStatus.COMPLETED &&
      request.status !== LabRequestStatus.REVIEWED);

  const isReadOnly = !canModify;
  const requestedByName = request?.requested_by ? formatStaffName(request.requested_by) : null;

  const persistedItemsById = useMemo(() => {
    const map = new Map<number, LabRequestItemWithTest>();

    for (const item of request?.items ?? []) {
      map.set(item.id, item);
    }

    return map;
  }, [request]);

  const rows = useMemo<LabRequestItemsTableRow[]>(() => {
    return items.map((draftItem, index) => {
      const isDraft = draftItem.isDraft === true;

      const persistedItem =
        !isDraft && draftItem.id != null
          ? persistedItemsById.get(Number(draftItem.id)) ?? null
          : null;

      const status =
        persistedItem?.status ??
        (isDraft ? LabRequestItemStatus.PENDING : draftItem.status ?? LabRequestItemStatus.PENDING);

      const results = persistedItem?.results ?? [];
      const hasResults = results.length > 0;
      const hasCriticalResults =
        persistedItem?.is_result_critical === true ||
        results.some((result) => result.flag === 'critical');
      const hasAbnormalResults =
        persistedItem?.is_result_abnormal === true ||
        results.some((result) => result.flag === 'abnormal' || result.flag === 'high' || result.flag === 'low');

      return {
        key:
          draftItem.tempId ??
          persistedItem?.item_uuid ??
          draftItem.id ??
          `${draftItem.display_name}-${index}`,
        draftItem,
        persistedItem,
        index,
        isDraft,
        status,
        isCancelled: status === LabRequestItemStatus.CANCELLED,
        isLocked: !isDraft && isLockedStatus(status),
        workflowStep: getWorkflowStep(status),
        results,
        hasResults,
        hasCriticalResults,
        hasAbnormalResults,
        displayName: persistedItem?.lab_test?.name ?? draftItem.display_name,
        category: persistedItem?.lab_test?.category ?? draftItem.category ?? null,
        code: persistedItem?.lab_test?.code ?? draftItem.code ?? null,
        sampleType: persistedItem?.sample_type ?? draftItem.sample_type ?? null,
        sampleIdentifier: persistedItem?.sample_identifier ?? null,
        requiresFasting: persistedItem?.lab_test?.requires_fasting ?? draftItem.requires_fasting ?? false,
        turnaroundTimeHours:
          persistedItem?.lab_test?.turnaround_time_hours ?? draftItem.turnaround_time_hours ?? null,
        notes: persistedItem?.notes ?? draftItem.notes ?? null,
      };
    });
  }, [items, persistedItemsById]);

  const stats = useMemo<LabRequestItemsTableStats>(() => {
    return rows.reduce(
      (acc, row) => {
        if (row.isDraft) {
          acc.draftItems += 1;
          acc.pendingItems += 1;
          return acc;
        }

        if (row.status === LabRequestItemStatus.CANCELLED) {
          acc.cancelledItems += 1;
          return acc;
        }

        if (row.status === LabRequestItemStatus.PENDING) {
          acc.pendingItems += 1;
        } else if (
          row.status === LabRequestItemStatus.SAMPLE_COLLECTED ||
          row.status === LabRequestItemStatus.IN_PROGRESS
        ) {
          acc.inProgressItems += 1;
        } else if (
          row.status === LabRequestItemStatus.COMPLETED ||
          row.status === LabRequestItemStatus.VERIFIED
        ) {
          acc.completedItems += 1;
        }

        return acc;
      },
      {
        pendingItems: 0,
        inProgressItems: 0,
        completedItems: 0,
        cancelledItems: 0,
        draftItems: 0,
      }
    );
  }, [rows]);

  const handleViewResults = (persistedItem: LabRequestItemWithTest) => {
    setSelectedPersistedItem(persistedItem);
    setIsResultsModalOpen(true);
  };

  return (
    <>
      <section className={cn('rounded-2xl border', colors.border.primary, colors.bg.card)}>
        <LabRequestItemsTableHeader
          isDark={isDark}
          colors={colors}
          request={request}
          requestedByName={requestedByName}
          stats={stats}
          isReadOnly={isReadOnly}
          canModify={canModify}
          onAddItem={onAddItem}
          onManageLabItems={onManageLabItems}
        />

        <div className="p-5">
          {rows.length === 0 ? (
            <LabRequestItemsEmptyState
              isDark={isDark}
              colors={colors}
              canModify={canModify}
              onAddItem={onAddItem}
            />
          ) : (
            <>
              <LabRequestItemsDesktopTable
                isDark={isDark}
                colors={colors}
                rows={rows}
                canModify={canModify}
                request={request}
                onEditItem={onEditItem}
                onDeleteItem={onDeleteItem}
                onViewResults={handleViewResults}
              />

              <LabRequestItemsMobileCards
                isDark={isDark}
                colors={colors}
                rows={rows}
                canModify={canModify}
                onEditItem={onEditItem}
                onDeleteItem={onDeleteItem}
                onViewResults={handleViewResults}
              />
            </>
          )}
        </div>
      </section>

      <LabResultViewModal
        isOpen={isResultsModalOpen}
        onClose={() => setIsResultsModalOpen(false)}
        item={selectedPersistedItem}
        results={selectedPersistedItem?.results ?? []}
        isDark={isDark}
        colors={adaptColorsForResultModal(colors, isDark)}
      />
    </>
  );
};

export default LabRequestItemsTable;
