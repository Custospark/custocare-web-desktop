import React from 'react';
import {
  AlertCircle,
  Box,
  Building,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit2,
  Layers,
  Trash2,
  XCircle,
} from 'lucide-react';
import type {
  FacilitySpace as FacilitySpaceEntity,
  FacilitySpaceType,
} from '../../../api/facility-space/FacilitySpaceTypes';

interface SpaceTypeOption {
  value: FacilitySpaceType;
  label: string;
  icon: React.ElementType;
  color: string;
}

interface FacilitySpaceListProps {
  theme: 'light' | 'dark';
  viewMode: 'list' | 'grid';
  spaces: FacilitySpaceEntity[];
  expandedRows: Set<number>;
  isLoading: boolean;
  error: unknown;
  hasActiveFilters: boolean;
  spaceTypeOptions: SpaceTypeOption[];
  onRetry: () => void | Promise<void>;
  onToggleExpand: (id: number) => void;
  onEdit: (space: FacilitySpaceEntity) => void;
  onDelete: (space: FacilitySpaceEntity) => void | Promise<void>;
}

const safeDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getErrorMessage = (error: unknown): string => {
  if (!error) return 'Unable to load spaces. Please try again.';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;

  if (typeof error === 'object') {
    const maybeError = error as Record<string, unknown>;
    if (typeof maybeError.message === 'string' && maybeError.message.trim()) {
      return maybeError.message;
    }
    if (typeof maybeError.error === 'string' && maybeError.error.trim()) {
      return maybeError.error;
    }
    if (typeof maybeError.statusText === 'string' && maybeError.statusText.trim()) {
      return maybeError.statusText;
    }
  }

  return 'Unable to load spaces. Please try again.';
};

const getSpaceTypeOption = (
  type: FacilitySpaceType,
  options: SpaceTypeOption[]
): SpaceTypeOption | undefined => {
  return options.find((option) => option.value === type);
};

export const FacilitySpaceList: React.FC<FacilitySpaceListProps> = ({
  theme,
  viewMode,
  spaces,
  expandedRows,
  isLoading,
  error,
  hasActiveFilters,
  spaceTypeOptions,
  onRetry,
  onToggleExpand,
  onEdit,
  onDelete,
}) => {
  const isDark = theme === 'dark';
  const hasError = Boolean(error);
  const errorMessage = getErrorMessage(error);

  const handleRetry = (): void => {
    void onRetry();
  };

  const handleDelete = (space: FacilitySpaceEntity): void => {
    void onDelete(space);
  };

  if (isLoading) {
    return (
      <div
        className={`rounded-xl border p-8 text-center ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        <div
          className={`w-8 h-8 mx-auto border-2 border-t-transparent rounded-full animate-spin ${
            isDark ? 'border-gray-600' : 'border-gray-400'
          }`}
        />
        <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Loading facility spaces...
        </p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/30">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-500">Error Loading Spaces</p>
            <p className={isDark ? 'text-sm text-gray-400' : 'text-sm text-gray-600'}>
              {errorMessage}
            </p>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="ml-auto px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (spaces.length === 0) {
    return (
      <div className={`rounded-xl p-12 text-center ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <Building2 className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
          {hasActiveFilters ? 'No Spaces Found' : 'No Spaces Yet'}
        </h3>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          {hasActiveFilters
            ? 'Try adjusting your filters or search criteria.'
            : 'Get started by creating your first facility space.'}
        </p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {spaces.map((space) => {
          const option = getSpaceTypeOption(space.type, spaceTypeOptions);
          const Icon = option?.icon || Box;
          const iconColor = option?.color || 'text-gray-500';

          return (
            <div
              key={space.id}
              className={`rounded-xl p-6 border transition-all hover:shadow-lg hover:scale-[1.02] ${
                isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                  </div>

                  <div>
                    <h3 className={isDark ? 'font-semibold text-gray-100' : 'font-semibold text-gray-900'}>
                      {space.name || '—'}
                    </h3>
                    <p className={isDark ? 'text-sm text-gray-400' : 'text-sm text-gray-600'}>
                      {space.type_label || option?.label || space.type}
                    </p>
                  </div>
                </div>

                {space.is_active ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>

              <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className={isDark ? 'w-4 h-4 text-gray-500' : 'w-4 h-4 text-gray-400'} />
                  <span className={isDark ? 'text-sm text-gray-400' : 'text-sm text-gray-600'}>
                    {space.building || 'No building'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Layers className={isDark ? 'w-4 h-4 text-gray-500' : 'w-4 h-4 text-gray-400'} />
                  <span className={isDark ? 'text-sm text-gray-400' : 'text-sm text-gray-600'}>
                    {space.floor || 'No floor'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(space)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors cursor-pointer ${
                    isDark
                      ? 'border-gray-800 hover:bg-gray-800 text-gray-200'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(space)}
                  className="p-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden border ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
      <div
        className={`grid grid-cols-12 gap-4 p-4 font-medium border-b ${
          isDark ? 'bg-gray-800 border-gray-800 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'
        }`}
      >
        <div className="col-span-3">Space Name</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-3">Building</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      <div className={isDark ? 'bg-gray-900' : 'bg-white'}>
        {spaces.map((space) => {
          const isExpanded = expandedRows.has(space.id);
          const option = getSpaceTypeOption(space.type, spaceTypeOptions);
          const Icon = option?.icon || Box;
          const iconColor = option?.color || 'text-gray-500';

          const created = safeDate(space.created_at);
          const updated = safeDate(space.updated_at);

          return (
            <div key={space.id} className={`border-b last:border-b-0 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <div
                className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                }`}
                onClick={() => onToggleExpand(space.id)}
              >
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span className={isDark ? 'font-medium text-gray-100' : 'font-medium text-gray-900'}>
                      {space.name || '—'}
                    </span>
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                      {space.type_label || option?.label || space.type}
                    </span>
                  </div>
                </div>

                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    <Building className={isDark ? 'w-4 h-4 text-gray-500' : 'w-4 h-4 text-gray-400'} />
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                      {space.building || 'Not specified'}
                    </span>
                  </div>
                </div>

                <div className="col-span-2">
                  {space.is_active ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-sm">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-500 text-sm">
                      <XCircle className="w-3 h-3" />
                      Inactive
                    </span>
                  )}
                </div>

                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(space);
                    }}
                    className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                      isDark
                        ? 'border-gray-800 hover:bg-gray-800 text-gray-300'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(space);
                    }}
                    className="p-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isExpanded ? (
                <div className={`p-4 border-t ${isDark ? 'bg-gray-800 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className={isDark ? 'text-sm font-medium mb-1 text-gray-400' : 'text-sm font-medium mb-1 text-gray-600'}>
                        Building
                      </p>
                      <p className={isDark ? 'text-gray-100' : 'text-gray-900'}>{space.building || '—'}</p>
                    </div>

                    <div>
                      <p className={isDark ? 'text-sm font-medium mb-1 text-gray-400' : 'text-sm font-medium mb-1 text-gray-600'}>
                        Floor
                      </p>
                      <p className={isDark ? 'text-gray-100' : 'text-gray-900'}>{space.floor || '—'}</p>
                    </div>

                    <div>
                      <p className={isDark ? 'text-sm font-medium mb-1 text-gray-400' : 'text-sm font-medium mb-1 text-gray-600'}>
                        Created
                      </p>
                      <p className={isDark ? 'text-gray-100' : 'text-gray-900'}>
                        {created ? created.toLocaleDateString() : '—'}
                      </p>
                    </div>

                    <div>
                      <p className={isDark ? 'text-sm font-medium mb-1 text-gray-400' : 'text-sm font-medium mb-1 text-gray-600'}>
                        Updated
                      </p>
                      <p className={isDark ? 'text-gray-100' : 'text-gray-900'}>
                        {updated ? updated.toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FacilitySpaceList;
