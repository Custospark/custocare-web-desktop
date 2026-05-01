import React, { useMemo, useState } from 'react';
import { cn } from '../../../../../../../../shared/utils/classNameUtils';
import type { LabRequestItem } from '../../../../../../api/lab/LabTypes';
import { LabRequestItemStatus } from '../../../../../../api/lab/LabTypes';
import type { ColorTokens } from '../../labResultForm.types';
import {
  formatLabel,
  getPrimaryFlag,
  getResultFlagClasses,
} from '../../labResultForm.utils';
import { LabResultItemStatusActions } from '../../LabResultItemStatusActions';
import { LabResultStatusIndicator } from './LabResultStatusIndicator';
import { LabResultViewButton } from './LabResultViewButton';
import { LabResultViewModal } from './LabResultViewModal';

interface LabResultTableRowProps {
  item: LabRequestItem;
  index: number;
  isDark: boolean;
  colors: ColorTokens;
  staffId?: number | null;
  requestLocked: boolean;
  onEditItemResults: (item: LabRequestItem) => void;
  onActionComplete: () => void;
}

const badgeBase = 'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold';

export const LabResultTableRow: React.FC<LabResultTableRowProps> = ({
  item,
  index,
  isDark,
  colors,
  staffId,
  requestLocked,
  onEditItemResults,
  onActionComplete,
}) => {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const results = useMemo(() => item.results || [], [item.results]);
  const primaryFlag = useMemo(() => getPrimaryFlag(results), [results]);
  const hasResults = results.length > 0;

  const handleViewResults = () => {
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
  };

  return (
    <React.Fragment>
      <tr className={cn('border-b align-top transition-colors', colors.border.primary, isDark ? 'hover:bg-gray-800/40' : 'hover:bg-slate-50')}>
        {/* # Column - Reduced width */}
        <td className="px-2 py-3 text-center whitespace-nowrap">
          <span className={cn('text-sm font-semibold', colors.text.secondary)}>{index + 1}</span>
        </td>

        {/* Test Column - Reduced padding */}
        <td className="px-3 py-3 whitespace-nowrap">
          <div className="flex items-start gap-2">
            <div className="space-y-0.5">
              <div className={cn('font-semibold text-sm', colors.text.primary)}>
                {item.lab_test?.name || 'Unnamed test'}
              </div>
              <div className={cn('text-xs', colors.text.secondary)}>
                {item.lab_test?.code || 'No code'} • {item.lab_test?.category || 'Uncategorized'}
              </div>
              {item.notes && (
                <div className={cn('text-xs italic', colors.text.tertiary)}>
                  Note: {item.notes}
                </div>
              )}
            </div>
          </div>
        </td>

        {/* Status Column - Reduced padding */}
        <td className="px-3 py-3 whitespace-nowrap">
          <div className="space-y-1.5">
            <LabResultStatusIndicator item={item} isDark={isDark} />
            {item.sample_type && (
              <div className={cn('text-xs', colors.text.secondary)}>
                Sample: {item.sample_type}
              </div>
            )}
          </div>
        </td>

        {/* Results Column - Reduced padding */}
        <td className="px-3 py-3">
          <div className="flex flex-col items-start gap-1.5">
            <span className={cn(badgeBase, getResultFlagClasses(primaryFlag, isDark))}>
              {formatLabel(primaryFlag)}
            </span>
            
            {hasResults && (
              <LabResultViewButton
                onClick={handleViewResults}
                hasResults={hasResults}
                isDark={isDark}
                colors={colors}
                disabled={item.status === LabRequestItemStatus.CANCELLED}
              />
            )}
            
            {!hasResults && (
              <span className={cn('text-xs', colors.text.tertiary)}>
                No results recorded
              </span>
            )}
          </div>
        </td>

        {/* Actions Column - Reduced padding */}
        <td className="px-3 py-3 whitespace-nowrap">
          <div className="flex flex-col items-start gap-1.5">
            <button
              type="button"
              onClick={() => onEditItemResults(item)}
              disabled={item.status === LabRequestItemStatus.CANCELLED || requestLocked}
              className={cn(
                'cursor-pointer inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all',
                colors.border.primary,
                colors.bg.hover,
                colors.text.primary,
                (item.status === LabRequestItemStatus.CANCELLED || requestLocked) && 'cursor-not-allowed opacity-50'
              )}
            >
              Enter / Edit Results
            </button>

            <LabResultItemStatusActions
              item={item}
              results={results}
              staffId={staffId}
              requestLocked={requestLocked}
              onActionComplete={onActionComplete}
            />
          </div>
        </td>
      </tr>

      {isViewModalOpen && (
        <LabResultViewModal
          isOpen={isViewModalOpen}
          onClose={handleCloseModal}
          item={item}
          results={results}
          isDark={isDark}
          colors={colors}
        />
      )}
    </React.Fragment>
  );
};