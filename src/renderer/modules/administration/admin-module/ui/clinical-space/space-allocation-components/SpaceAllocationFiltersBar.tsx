import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Grid3x3,
  List,
  Search,
} from 'lucide-react';

import { cn } from '../../../../../../shared/types/cn';
import { type OccupancyFilterValue, type SpaceAllocationColors, type SpaceAllocationViewMode } from './space-allocation.types';

interface SpaceAllocationFiltersBarProps {
  theme: 'light' | 'dark';
  colors: SpaceAllocationColors;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  viewMode: SpaceAllocationViewMode;
  onViewModeChange: (mode: SpaceAllocationViewMode) => void;
  spaceTypeFilter: string;
  onSpaceTypeFilterChange: (value: string) => void;
  buildingFilter: string;
  onBuildingFilterChange: (value: string) => void;
  floorFilter: string;
  onFloorFilterChange: (value: string) => void;
  occupancyFilter: OccupancyFilterValue;
  onOccupancyFilterChange: (value: OccupancyFilterValue) => void;
  spaceTypes: string[];
  buildings: string[];
  floors: string[];
  onClearFilters: () => void;
}

export const SpaceAllocationFiltersBar: React.FC<SpaceAllocationFiltersBarProps> = ({
  theme,
  colors,
  searchTerm,
  onSearchTermChange,
  showFilters,
  onToggleFilters,
  viewMode,
  onViewModeChange,
  spaceTypeFilter,
  onSpaceTypeFilterChange,
  buildingFilter,
  onBuildingFilterChange,
  floorFilter,
  onFloorFilterChange,
  occupancyFilter,
  onOccupancyFilterChange,
  spaceTypes,
  buildings,
  floors,
  onClearFilters,
}) => {
  const isDark = theme === 'dark';

  return (
    <div className={cn('rounded-xl p-4 border', colors.border.primary, colors.bg.elevated)}>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5',
                colors.text.tertiary
              )}
            />
            <input
              type="text"
              placeholder="Search spaces by name, type, building, floor, or assigned staff..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onSearchTermChange(e.target.value)
              }
              className={cn(
                'w-full pl-10 pr-4 py-2 rounded-lg border transition-colors cursor-text',
                colors.border.primary,
                colors.bg.primary,
                colors.text.primary,
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
            />
          </div>
        </div>

        <button
          onClick={onToggleFilters}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors cursor-pointer',
            colors.border.primary,
            colors.bg.primary,
            colors.bg.hover
          )}
          type="button"
        >
          <Filter className="w-5 h-5" />
          <span>Filters</span>
          {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <div
          className={cn(
            'flex items-center gap-1 p-1 rounded-lg border',
            colors.border.primary,
            colors.bg.secondary
          )}
        >
          <button
            onClick={() => onViewModeChange('list')}
            className={cn(
              'p-2 rounded transition-colors cursor-pointer',
              viewMode === 'list' ? `${colors.accent.primary} text-white` : colors.bg.hover
            )}
            type="button"
            title="List view"
          >
            <List className="w-5 h-5" />
          </button>

          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              'p-2 rounded transition-colors cursor-pointer',
              viewMode === 'grid' ? `${colors.accent.primary} text-white` : colors.bg.hover
            )}
            type="button"
            title="Grid view"
          >
            <Grid3x3 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showFilters && (
        <div
          className={cn(
            'grid grid-cols-1 md:grid-cols-5 gap-4 mt-4 pt-4 border-t',
            isDark ? 'border-gray-800' : 'border-gray-200'
          )}
        >
          <div>
            <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
              Space Type
            </label>
            <select
              value={spaceTypeFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onSpaceTypeFilterChange(e.target.value)
              }
              className={cn(
                'w-full px-3 py-2 rounded-lg border transition-colors cursor-pointer',
                colors.border.primary,
                colors.bg.primary,
                colors.text.primary
              )}
            >
              <option value="all">All Types</option>
              {spaceTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace(/[_-]/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
              Building
            </label>
            <select
              value={buildingFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onBuildingFilterChange(e.target.value)
              }
              className={cn(
                'w-full px-3 py-2 rounded-lg border transition-colors cursor-pointer',
                colors.border.primary,
                colors.bg.primary,
                colors.text.primary
              )}
            >
              <option value="all">All Buildings</option>
              {buildings.map(building => (
                <option key={building} value={building}>
                  {building}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
              Floor
            </label>
            <select
              value={floorFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onFloorFilterChange(e.target.value)
              }
              className={cn(
                'w-full px-3 py-2 rounded-lg border transition-colors cursor-pointer',
                colors.border.primary,
                colors.bg.primary,
                colors.text.primary
              )}
            >
              <option value="all">All Floors</option>
              {floors.map(floor => (
                <option key={floor} value={floor}>
                  {floor}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={cn('block text-sm font-medium mb-2', colors.text.secondary)}>
              Occupancy
            </label>
            <select
              value={occupancyFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                onOccupancyFilterChange(e.target.value as OccupancyFilterValue)
              }
              className={cn(
                'w-full px-3 py-2 rounded-lg border transition-colors cursor-pointer',
                colors.border.primary,
                colors.bg.primary,
                colors.text.primary
              )}
            >
              <option value="all">All Spaces</option>
              <option value="occupied">Occupied</option>
              <option value="available">Available</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={onClearFilters}
              className={cn(
                'w-full px-4 py-2 rounded-lg border transition-colors cursor-pointer',
                colors.border.primary,
                colors.bg.hover
              )}
              type="button"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpaceAllocationFiltersBar;
