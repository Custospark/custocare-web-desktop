import React, { useState, useMemo } from 'react';
import { Search, X, ChevronLeft, ChevronRight, RefreshCw, FolderOpen } from 'lucide-react';
import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { ClinicalTemplate } from '../../../../api/clinical-templates/ClinicalTemplateTypes';
import { ClinicalTemplateCard } from './ClinicalTemplateCard';

interface ClinicalTemplatesListProps {
  isDark: boolean;
  colors: {
    bg: {
      card: string;
      subtle: string;
      input: string;
      hover: string;
    };
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
      brand?: string;
    };
    border: {
      primary: string;
      subtle?: string;
    };
  };
  templates: ClinicalTemplate[];
  isFetching: boolean;
  isMutating: boolean;
  onEditTemplate: (template: ClinicalTemplate) => void;
  onDeleteTemplate: (template: ClinicalTemplate) => void;
  onToggleStatus: (template: ClinicalTemplate) => void;
  onRefresh?: () => void;
  totalCount?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  // Search prop from parent
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

const PAGE_SIZE_OPTIONS = [2, 5, 10, 20, 50];

// Consistent focus ring style matching MedicationAutocomplete
const focusRingClass = "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

export const ClinicalTemplatesList: React.FC<ClinicalTemplatesListProps> = ({
  isDark,
  colors,
  templates,
  isFetching,
  isMutating,
  onEditTemplate,
  onDeleteTemplate,
  onToggleStatus,
  onRefresh,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  // Search prop with defaults
  searchTerm: externalSearchTerm = '',
  onSearchChange,
}) => {
  // Use external state if provided, otherwise use internal state
  const [internalSearchTerm, setInternalSearchTerm] = useState('');

  const searchTerm = onSearchChange ? externalSearchTerm : internalSearchTerm;

  const handleSearchChange = (term: string) => {
    if (onSearchChange) {
      onSearchChange(term);
    } else {
      setInternalSearchTerm(term);
    }
  };

  const handleClearSearch = () => {
    handleSearchChange('');
  };

  // Filter templates based on search
  const filteredTemplates = useMemo(() => {
    let filtered = [...templates];

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(term) ||
        template.category.toLowerCase().includes(term) ||
        (template.description && template.description.toLowerCase().includes(term)) ||
        (template.default_diagnosis && template.default_diagnosis.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [templates, searchTerm]);

  const totalPages = Math.ceil(filteredTemplates.length / pageSize);

  const handlePageChange = (newPage: number) => {
    if (onPageChange && newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    }
  };

  const hasActiveSearch = searchTerm.trim() !== '';

  // Get the current page of templates (client-side pagination)
  const currentPageTemplates = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredTemplates.slice(start, end);
  }, [filteredTemplates, currentPage, pageSize]);

  return (
    <div className={cn('rounded-2xl border', colors.border.primary, colors.bg.card)}>
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 border-b p-5',
          colors.border.primary
        )}
      >
        <div>
          <h3 className={cn('text-base font-semibold', colors.text.primary)}>
            Saved Templates
          </h3>
          <p className={cn('text-sm', colors.text.secondary)}>
            View, edit, activate/deactivate, and delete existing templates
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isFetching || isMutating}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                colors.border.primary,
                colors.bg.hover,
                colors.text.secondary,
                (isFetching || isMutating) && 'cursor-not-allowed opacity-50'
              )}
            >
              <RefreshCw className={cn('h-4 w-4', (isFetching || isMutating) && 'animate-spin')} />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className={cn('border-b p-5', colors.border.primary)}>
        <div className="flex flex-col gap-4">
          {/* Search Input with Clear Button */}
          <div className="relative flex-1">
            <Search className={cn('absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', colors.text.tertiary)} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search templates by name, category, diagnosis..."
              className={cn(
                'w-full rounded-lg border pl-9 pr-10 py-2.5 text-sm transition-all duration-200',
                colors.bg.input,
                colors.text.primary,
                colors.border.primary,
                focusRingClass
              )}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className={cn(
                  'absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition-all duration-200 hover:scale-110',
                  colors.bg.hover,
                  colors.text.secondary
                )}
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Results count */}
        <div className="mt-3 flex items-center justify-between">
          <div className={cn('text-sm', colors.text.secondary)}>
            Showing {currentPageTemplates.length} of {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            {hasActiveSearch && ` matching "${searchTerm}"`}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {(isFetching || isMutating) && (
        <div className="px-5 pt-4">
          <LoadingSkeleton
            variant="minimal"
            theme={isDark ? 'dark' : 'light'}
            message={isMutating ? "Updating..." : "Loading templates..."}
          />
        </div>
      )}

      {/* Templates List */}
      <div className="p-5">
        {!isFetching && currentPageTemplates.length === 0 ? (
          <div
            className={cn(
              'rounded-xl border border-dashed p-8 text-center',
              colors.border.primary,
              colors.bg.subtle
            )}
          >
            {hasActiveSearch ? (
              <>
                <Search className={cn('mx-auto mb-3 h-10 w-10', colors.text.tertiary)} />
                <h4 className={cn('mb-1 text-base font-semibold', colors.text.primary)}>
                  No matching templates
                </h4>
                <p className={cn('text-sm', colors.text.secondary)}>
                  No templates found matching "{searchTerm}"
                </p>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className={cn(
                    'mt-4 cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-all',
                    colors.bg.hover,
                    colors.text.brand || colors.text.primary
                  )}
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <FolderOpen className={cn('mx-auto mb-3 h-10 w-10', colors.text.tertiary)} />
                <h4 className={cn('mb-1 text-base font-semibold', colors.text.primary)}>
                  No templates yet
                </h4>
                <p className={cn('text-sm', colors.text.secondary)}>
                  Click <span className="font-medium">Add Clinical Template</span> to create your first
                  one.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {currentPageTemplates.map((template) => (
               <ClinicalTemplateCard
                key={template.id}
                template={template}
                isDark={isDark}
                colors={{
                  bg: {
                    subtle: colors.bg.subtle,
                    hover: colors.bg.hover || colors.bg.subtle,
                    card: colors.bg.card, 
                  },
                  text: {
                    primary: colors.text.primary,
                    secondary: colors.text.secondary,
                    tertiary: colors.text.tertiary,
                  },
                  border: {
                    primary: colors.border.primary,
                  }
                }}
                isBusy={isMutating}
                onEdit={onEditTemplate}
                onDelete={onDeleteTemplate}
                onToggleStatus={onToggleStatus}
              />
              ))}
            </div>

            {/* Pagination Controls */}
            {filteredTemplates.length > pageSize && (
              <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm', colors.text.secondary)}>Show:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className={cn(
                      'cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-all duration-200',
                      colors.bg.input,
                      colors.text.primary,
                      colors.border.primary,
                      focusRingClass
                    )}
                  >
                    {PAGE_SIZE_OPTIONS.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  <span className={cn('text-sm', colors.text.secondary)}>per page</span>
                </div>

                {/* Pagination Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isFetching}
                    className={cn(
                      'cursor-pointer rounded-lg border p-2 transition-all duration-200',
                      colors.border.primary,
                      colors.bg.hover,
                      colors.text.secondary,
                      (currentPage === 1 || isFetching) && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handlePageChange(pageNum)}
                          className={cn(
                            'cursor-pointer rounded-lg px-3 py-1.5 text-sm transition-all duration-200',
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : cn(colors.bg.hover, colors.text.secondary),
                            isFetching && 'cursor-not-allowed opacity-50'
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0 || isFetching}
                    className={cn(
                      'cursor-pointer rounded-lg border p-2 transition-all duration-200',
                      colors.border.primary,
                      colors.bg.hover,
                      colors.text.secondary,
                      (currentPage === totalPages || totalPages === 0 || isFetching) && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Page Info */}
                <div className={cn('text-sm', colors.text.secondary)}>
                  Page {currentPage} of {totalPages || 1}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ClinicalTemplatesList;