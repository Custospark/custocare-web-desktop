import React from 'react';
import { Plus, RefreshCw } from 'lucide-react';

import { cn } from '../../../../../../shared/types/cn';
import type { SpaceAllocationColors } from './space-allocation.types';

interface SpaceAllocationHeaderProps {
  colors: SpaceAllocationColors;
  isRefreshing: boolean;
  onRefresh: () => void | Promise<void>;
  onAssign: () => void;
}

export const SpaceAllocationHeader: React.FC<SpaceAllocationHeaderProps> = ({
  colors,
  isRefreshing,
  onRefresh,
  onAssign,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex-1 min-w-0">
        <h1 className={cn('text-2xl font-bold mb-2', colors.text.primary)}>
          Room Allocation
        </h1>
        <p className={colors.text.secondary}>
          Manage workspace assignments for staff members across the facility
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => void onRefresh()}
          className={cn(
            'p-2 rounded-lg border transition-colors cursor-pointer',
            colors.border.primary,
            colors.bg.primary,
            colors.bg.hover
          )}
          title="Refresh"
          type="button"
          disabled={isRefreshing}
        >
          <RefreshCw
            className={cn(
              'w-5 h-5 transition-transform duration-300',
              colors.text.secondary,
              isRefreshing && 'animate-spin'
            )}
          />
        </button>

        <button
          onClick={onAssign}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer',
            colors.accent.primary,
            colors.accent.hover,
            colors.accent.text
          )}
          type="button"
        >
          <Plus className="w-5 h-5" />
          <span>Assign Room</span>
        </button>
      </div>
    </div>
  );
};

export default SpaceAllocationHeader;
