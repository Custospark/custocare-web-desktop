import React from 'react';
import { cn } from '../../../../../../../shared/utils/classNameUtils';
import type { LabRequest } from '../../../../../api/lab/LabTypes';
import { LabRequestItemStatus } from '../../../../../api/lab/LabTypes';
import type { ColorTokens } from '../labResultForm.types';
import { LabResultTableHeader } from './components/LabResultTableHeader';
import { LabResultTableRow } from './components/LabResultTableRow';
import { LabResultMobileCard } from './components/LabResultMobileCard';

interface LabResultItemsTableProps {
  isDark: boolean;
  colors: ColorTokens;
  request: LabRequest;
  staffId?: number | null;
  requestLocked: boolean;
  refreshToken: number;
  onEditItemResults: (item: any) => void;
  onResultsHydrated: (itemUuid: string, results: any[]) => void;
  onActionComplete: () => void;
}

export const LabResultItemsTable: React.FC<LabResultItemsTableProps> = ({
  isDark,
  colors,
  request,
  staffId,
  requestLocked,
  refreshToken,
  onEditItemResults,
  onResultsHydrated,
  onActionComplete,
}) => {
  const items = Array.isArray(request.items) ? request.items : [];
  
  const pendingCount = items.filter((item) => item.status === LabRequestItemStatus.PENDING).length;
  const inProgressCount = items.filter(
    (item) =>
      item.status === LabRequestItemStatus.SAMPLE_COLLECTED ||
      item.status === LabRequestItemStatus.IN_PROGRESS
  ).length;
  const completedCount = items.filter(
    (item) =>
      item.status === LabRequestItemStatus.COMPLETED ||
      item.status === LabRequestItemStatus.VERIFIED
  ).length;

  return (
    <section className={cn('rounded-2xl border overflow-hidden', colors.border.primary, colors.bg.card)}>
      <LabResultTableHeader
        isDark={isDark}
        colors={colors}
        requestLocked={requestLocked}
        pendingCount={pendingCount}
        inProgressCount={inProgressCount}
        completedCount={completedCount}
      />

      {/* Desktop Table */}
      <div className="hidden xl:block overflow-x-auto">
        <table className="w-full border-collapse min-w-[1000px]">
          <thead>
            <tr className={cn('border-b', colors.border.primary)}>
              <th className={cn('w-12 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>#</th>
              <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>Test</th>
              <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>Status</th>
              <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>Results</th>
              <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>Timing</th>
              <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <LabResultTableRow
                key={item.item_uuid}
                item={item}
                index={index}
                isDark={isDark}
                colors={colors}
                staffId={staffId}
                requestLocked={requestLocked}
                refreshToken={refreshToken}
                onEditItemResults={onEditItemResults}
                onResultsHydrated={onResultsHydrated}
                onActionComplete={onActionComplete}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="xl:hidden">
        {items.length === 0 ? (
          <div className={cn('p-8 text-center', colors.text.secondary)}>
            No lab tests requested yet.
          </div>
        ) : (
          items.map((item, index) => (
            <LabResultMobileCard
              key={item.item_uuid}
              item={item}
              index={index}
              isDark={isDark}
              colors={colors}
              staffId={staffId}
              requestLocked={requestLocked}
              refreshToken={refreshToken}
              onEditItemResults={onEditItemResults}
              onResultsHydrated={onResultsHydrated}
              onActionComplete={onActionComplete}
            />
          ))
        )}
      </div>
    </section>
  );
};

export default LabResultItemsTable;