// AdminServiceCatalog/components/ServiceCatalogList.tsx
import React, {useMemo, useEffect } from 'react';
import {
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit2,
  RefreshCw,
  Shield,
  Tag,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import type {
  RiskLevel,
  ServiceCatalog,
  ServiceCategory,
  CodeSystem,
  ServiceStatus,
} from '../../../api/service-catalog/serviceCatalogTypes';
import {
  formatPrice,
  getRiskLevelColor,
  getStatusBgColor,
  getStatusColor,
} from '../../service-catalog-ui/utils/serviceCatalogUiUtils';
import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';

// ─── cn helper ──────────────────────────────────────────────────────────────
const cn = (...classes: (string | false | null | undefined)[]): string =>
  classes.filter(Boolean).join(' ');

// ─── Types ────────────────────────────────────────────────────────────────────
type ViewMode = 'list' | 'grid';

interface FilterState {
  searchTerm: string;
  categoryFilter: ServiceCategory | 'all';
  codeSystemFilter: CodeSystem | 'all';
  statusFilter: ServiceStatus | 'all';
  effectiveDate: string;
  showDeleted: boolean;
}

interface Props {
  theme: 'light' | 'dark';
  viewMode: ViewMode;
  isLoading: boolean;
  error: Error | null;
  services: ServiceCatalog[];
  expandedServices: Set<string>;
  onToggleExpand: (uuid: string) => void;
  onEdit: (service: ServiceCatalog) => void;
  onDuplicate: (service: ServiceCatalog) => void;
  onDelete: (service: ServiceCatalog) => void;
  onRestore: (service: ServiceCatalog) => void;
  onRetry: () => void;
  serviceCategoryOptions: {
    value: ServiceCategory;
    label: string;
    icon: React.ElementType;
    color: string;
  }[];
  
  // Filter state from parent
  filters: FilterState;
  
  // Pagination state from parent
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
}

// ─── Sub-components (defined OUTSIDE main component) ─────────────────────────

interface BadgeProps {
  size?: 'sm' | 'md';
  isDark: boolean;
}

const RiskBadge: React.FC<BadgeProps & { riskLevel: string }> = ({ riskLevel, size = 'sm', isDark }) => {
  const cls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const colorClass = getRiskLevelColor(riskLevel as RiskLevel, isDark);
  
  return (
    <div className="relative group">
      <Shield className={cn(cls, colorClass)} />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
        Risk Level: {riskLevel}
      </span>
    </div>
  );
};

interface RowActionsProps {
  service: ServiceCatalog;
  size?: 'sm' | 'md';
  isDark: boolean;
  onDuplicate: (service: ServiceCatalog) => void;
  onEdit: (service: ServiceCatalog) => void;
  onDelete: (service: ServiceCatalog) => void;
  onRestore: (service: ServiceCatalog) => void;
}

const RowActions: React.FC<RowActionsProps> = ({
  service,
  size = 'md',
  isDark,
  onDuplicate,
  onEdit,
  onDelete,
  onRestore,
}) => {
  const btn = cn(
    'rounded-lg transition-colors cursor-pointer',
    size === 'sm' ? 'p-1.5' : 'p-2',
    isDark
      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
  );
  const iconCls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onDuplicate(service)} className={btn} title="Duplicate">
        <Copy className={iconCls} />
      </button>
      <button onClick={() => onEdit(service)} className={btn} title="Edit">
        <Edit2 className={iconCls} />
      </button>
      {service.deleted_at ? (
        <button
          onClick={() => onRestore(service)}
          className={cn(
            'rounded-lg transition-colors cursor-pointer',
            size === 'sm' ? 'p-1.5' : 'p-2',
            isDark
              ? 'text-green-400 hover:text-green-200 hover:bg-gray-700'
              : 'text-green-600 hover:text-green-800 hover:bg-gray-200'
          )}
          title="Restore"
        >
          <RefreshCw className={iconCls} />
        </button>
      ) : (
        <button
          onClick={() => onDelete(service)}
          className={cn(
            'rounded-lg transition-colors cursor-pointer',
            size === 'sm' ? 'p-1.5' : 'p-2',
            isDark
              ? 'text-red-400 hover:text-red-200 hover:bg-gray-700'
              : 'text-red-600 hover:text-red-800 hover:bg-gray-200'
          )}
          title="Delete"
        >
          <Trash2 className={iconCls} />
        </button>
      )}
    </div>
  );
};

interface ExpandedDetailsProps {
  service: ServiceCatalog;
  isDark: boolean;
}

const ExpandedDetails: React.FC<ExpandedDetailsProps> = ({ service, isDark }) => (
  <div
    className={cn(
      'mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4',
      isDark ? 'border-gray-800' : 'border-gray-200'
    )}
  >
    <div>
      <h4 className="text-sm font-semibold mb-2">Service Details</h4>
      <dl
        className={cn(
          'text-xs space-y-1.5',
          isDark ? 'text-gray-400' : 'text-gray-600'
        )}
      >
        <div>
          <dt className="inline font-medium">Department: </dt>
          <dd className="inline">{service.department_specialty || 'General'}</dd>
        </div>
        <div className="flex items-center gap-1">
          <Shield className={cn('w-3.5 h-3.5', getRiskLevelColor(service.risk_level, isDark))} />
          <span>
            <span className="font-medium">Risk Level: </span>
            {service.risk_level}
          </span>
        </div>
        {service.requires_informed_consent && (
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            <span>Requires Informed Consent</span>
          </div>
        )}
      </dl>
    </div>

    <div>
      <h4 className="text-sm font-semibold mb-2">Validity Period</h4>
      <div
        className={cn(
          'text-xs space-y-1.5',
          isDark ? 'text-gray-400' : 'text-gray-600'
        )}
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          From: <strong>{service.effective_from}</strong>
        </div>
        {service.effective_to && (
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            To: <strong>{service.effective_to}</strong>
          </div>
        )}
        <div>
          <span className="font-medium">Duration: </span>
          {service.default_duration_minutes ? `${service.default_duration_minutes} minutes` : 'Not specified'}
        </div>
      </div>
    </div>

    <div>
      <h4 className="text-sm font-semibold mb-2">Notes & Metadata</h4>
      <dl
        className={cn(
          'text-xs space-y-1.5',
          isDark ? 'text-gray-400' : 'text-gray-600'
        )}
      >
        <div>
          <dt className="inline font-medium">Description: </dt>
          <dd className="inline">{service.service_description || 'No description'}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Created: </dt>
          <dd className="inline">{new Date(service.created_at).toLocaleDateString()}</dd>
        </div>
        {service.updated_at !== service.created_at && (
          <div>
            <dt className="inline font-medium">Updated: </dt>
            <dd className="inline">{new Date(service.updated_at).toLocaleDateString()}</dd>
          </div>
        )}
      </dl>
    </div>
  </div>
);

interface PaginationBarProps {
  paginationData: {
    safePage: number;
    totalPages: number;
    from: number;
    to: number;
    totalItems: number;
  };
  pageNumbers: (number | '...')[];
  goToPage: (page: number) => void;
  isDark: boolean;
}

const PaginationBar: React.FC<PaginationBarProps> = ({
  paginationData,
  pageNumbers,
  goToPage,
  isDark,
}) => (
  <div
    className={cn(
      'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border',
      isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
    )}
  >
    <span className={cn('text-xs sm:text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
      Showing{' '}
      <span className="font-medium">{paginationData.from}</span>–
      <span className="font-medium">{paginationData.to}</span>{' '}
      of{' '}
      <span className="font-medium">{paginationData.totalItems}</span> services
    </span>

    <div className="flex items-center gap-1 sm:gap-1.5">
      <button
        onClick={() => goToPage(1)}
        disabled={paginationData.safePage === 1}
        aria-label="First page"
        className={cn(
          'p-2 rounded-lg transition-colors cursor-pointer',
          paginationData.safePage === 1
            ? isDark ? 'text-gray-700 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
            : isDark
              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        )}
      >
        <ChevronsLeft className="w-4 h-4" />
      </button>

      <button
        onClick={() => goToPage(paginationData.safePage - 1)}
        disabled={paginationData.safePage === 1}
        aria-label="Previous page"
        className={cn(
          'p-2 rounded-lg transition-colors cursor-pointer',
          paginationData.safePage === 1
            ? isDark ? 'text-gray-700 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
            : isDark
              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        )}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pageNumbers.map((p, i) =>
        p === '...' ? (
          <span
            key={`dots-${i}`}
            className={cn(
              'px-2 py-1 text-xs',
              isDark ? 'text-gray-500' : 'text-gray-400'
            )}
          >
            …
          </span>
        ) : (
          <button
            key={`page-${p}`}
            onClick={() => goToPage(p)}
            aria-label={`Page ${p}`}
            aria-current={paginationData.safePage === p ? 'page' : undefined}
            className={cn(
              'min-w-[32px] sm:min-w-[36px] px-2 py-1 sm:px-3 sm:py-1.5 rounded text-xs sm:text-sm font-medium transition-colors cursor-pointer',
              paginationData.safePage === p
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : isDark
                  ? 'text-gray-300 hover:bg-gray-800'
                  : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => goToPage(paginationData.safePage + 1)}
        disabled={paginationData.safePage === paginationData.totalPages}
        aria-label="Next page"
        className={cn(
          'p-2 rounded-lg transition-colors cursor-pointer',
          paginationData.safePage === paginationData.totalPages
            ? isDark ? 'text-gray-700 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
            : isDark
              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        )}
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      <button
        onClick={() => goToPage(paginationData.totalPages)}
        disabled={paginationData.safePage === paginationData.totalPages}
        aria-label="Last page"
        className={cn(
          'p-2 rounded-lg transition-colors cursor-pointer',
          paginationData.safePage === paginationData.totalPages
            ? isDark ? 'text-gray-700 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
            : isDark
              ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        )}
      >
        <ChevronsRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);

// ─── Filter function ─────────────────────────────────────────────────────────
const filterServices = (
  services: ServiceCatalog[],
  filters: FilterState
): ServiceCatalog[] => {
  return services.filter((service) => {
    // Filter by deleted status
    if (!filters.showDeleted && service.deleted_at) {
      return false;
    }

    // Filter by category
    if (filters.categoryFilter !== 'all' && service.service_category !== filters.categoryFilter) {
      return false;
    }

    // Filter by code system
    if (filters.codeSystemFilter !== 'all' && service.code_system !== filters.codeSystemFilter) {
      return false;
    }

    // Filter by status
    if (filters.statusFilter !== 'all' && service.status !== filters.statusFilter) {
      return false;
    }

    // Filter by effective date (if provided)
    if (filters.effectiveDate) {
      const serviceDate = new Date(service.effective_from);
      const filterDate = new Date(filters.effectiveDate);
      if (serviceDate > filterDate) {
        return false;
      }
    }

    // Search term filtering (case-insensitive)
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      const matchesSearch = 
        service.service_name.toLowerCase().includes(term) ||
        service.service_code.toLowerCase().includes(term) ||
        (service.service_description?.toLowerCase() || '').includes(term) ||
        service.code_system.toLowerCase().includes(term);
      
      if (!matchesSearch) {
        return false;
      }
    }

    return true;
  });
};

// ─── Smart page numbers with ellipsis ────────────────────────────────────────
const getPageNumbers = (currentPage: number, totalPages: number): (number | '...')[] => {
  const delta = 2;
  const range: number[] = [];
  
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      range.push(i);
    }
  }
  
  const result: (number | '...')[] = [];
  let prev: number | undefined;
  
  for (const page of range) {
    if (prev !== undefined) {
      if (page - prev === 2) result.push(prev + 1);
      else if (page - prev > 2) result.push('...');
    }
    result.push(page);
    prev = page;
  }
  
  return result;
};

// ─── Main Component ────────────────────────────────────────────────────────────
export const ServiceCatalogList: React.FC<Props> = ({
  theme,
  viewMode,
  isLoading,
  error,
  services,
  expandedServices,
  onToggleExpand,
  onEdit,
  onDuplicate,
  onDelete,
  onRestore,
  onRetry,
  serviceCategoryOptions,
  filters,
  currentPage,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
}) => {
  const isDark = theme === 'dark';

  // Apply filters to services
  const filteredServices = useMemo(() => {
    return filterServices(services, filters);
  }, [services, filters]);

  // Calculate pagination
  const paginationData = useMemo(() => {
    const totalItems = filteredServices.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    
    return {
      totalItems,
      totalPages,
      safePage,
      startIndex,
      endIndex,
      currentItems: filteredServices.slice(startIndex, endIndex),
      from: totalItems > 0 ? startIndex + 1 : 0,
      to: endIndex,
    };
  }, [filteredServices, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    onPageChange(1);
  }, [filters, itemsPerPage, onPageChange]);

  const goToPage = (page: number) => {
    onPageChange(Math.max(1, Math.min(page, paginationData.totalPages)));
  };

  const pageNumbers = useMemo(() => 
    getPageNumbers(paginationData.safePage, paginationData.totalPages),
    [paginationData.safePage, paginationData.totalPages]
  );

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div
        className={cn(
          'rounded-xl border',
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        )}
      >
        <LoadingSkeleton
          variant="dashboard"
          theme={theme}
          message="Loading services..."
        />
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        className={cn(
          'rounded-xl p-6 border text-center',
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        )}
      >
        <p className={cn('font-medium', isDark ? 'text-gray-200' : 'text-gray-900')}>
          Error loading services
        </p>
        <p className={cn('mt-1 text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
          {error.message}
        </p>
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  // ─── Empty ────────────────────────────────────────────────────────────────
  if (filteredServices.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl p-10 text-center border',
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        )}
      >
        <Tag
          className={cn(
            'w-12 h-12 mx-auto',
            isDark ? 'text-gray-600' : 'text-gray-400'
          )}
        />
        <h3 className="mt-4 text-lg font-medium">No services found</h3>
        <p className={cn('mt-1 text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
          {services.length === 0 
            ? 'No services available. Create your first service to get started.'
            : 'Try adjusting your filters to see more results.'}
        </p>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Items-per-page + summary row */}
      <div
        className={cn(
          'flex items-center justify-between p-3 sm:p-4 rounded-xl border',
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        )}
      >
        <span className={cn('text-xs sm:text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
          Showing{' '}
          <span className="font-medium">{paginationData.from}</span>–
          <span className="font-medium">{paginationData.to}</span>{' '}
          of{' '}
          <span className="font-medium">{paginationData.totalItems}</span> services
          {filters.searchTerm && (
            <span className="ml-1">(filtered)</span>
          )}
        </span>

        <div className="flex items-center gap-2">
          <span className={cn('text-xs sm:text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
            Show:
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className={cn(
              'px-2 py-1 rounded border text-xs sm:text-sm cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              isDark
                ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
                : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
            )}
          >
            {[5, 10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── LIST VIEW ─────────────────────────────────────────────────────── */}
      {viewMode === 'list' ? (
        <div
          className={cn(
            'rounded-xl border',
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          )}
        >
          {/* Table header */}
          <div
            className={cn(
              'hidden sm:grid grid-cols-12 gap-4 px-4 py-3 border-b text-xs font-semibold uppercase tracking-wide',
              isDark
                ? 'border-gray-800 text-gray-500'
                : 'border-gray-200 text-gray-400'
            )}
          >
            <div className="col-span-6">Service</div>
            <div className="col-span-2 hidden md:block">Category</div>
            <div className="col-span-2">Price / Duration</div>
            <div className="col-span-2 text-center">Actions</div>
          </div>

          {/* Rows */}
          {paginationData.currentItems.map((service) => {
            const category = serviceCategoryOptions.find(
              (c) => c.value === service.service_category
            );
            const CategoryIcon = category?.icon ?? Tag;
            const isExpanded = expandedServices.has(service.service_uuid);
            const isDeleted = !!service.deleted_at;

            return (
              <div
                key={service.service_uuid}
                className={cn(
                  'border-b last:border-b-0 transition-colors',
                  isDark
                    ? 'border-gray-800 hover:bg-gray-800/50'
                    : 'border-gray-200 hover:bg-gray-50',
                  isDeleted && (isDark ? 'opacity-60' : 'opacity-70')
                )}
              >
                {/* Mobile view */}
                <div className="sm:hidden p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <button
                        onClick={() => onToggleExpand(service.service_uuid)}
                        aria-label="Toggle details"
                        className={cn(
                          'p-1 shrink-0 cursor-pointer',
                          isDark
                            ? 'text-gray-400 hover:text-gray-200'
                            : 'text-gray-500 hover:text-gray-700'
                        )}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <div
                            className={cn(
                              'p-1.5 rounded shrink-0',
                              isDark ? 'bg-gray-800' : 'bg-gray-100'
                            )}
                          >
                            <CategoryIcon
                              className={cn('w-3.5 h-3.5', category?.color ?? '')}
                            />
                          </div>
                          <span className="font-medium text-sm truncate">
                            {service.service_name}
                          </span>
                        </div>
                        <p
                          className={cn(
                            'text-xs truncate',
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          )}
                        >
                          {service.service_code} • {service.code_system}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="font-semibold text-sm">
                        {formatPrice(service.price_amount, service.currency_code)}
                      </span>
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded-full text-xs font-medium',
                          getStatusBgColor(service.status, isDark),
                          getStatusColor(service.status, isDark)
                        )}
                      >
                        {service.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <RiskBadge riskLevel={service.risk_level} isDark={isDark} />
                      {service.default_duration_minutes && (
                        <span
                          className={cn(
                            'text-xs',
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          )}
                        >
                          {service.default_duration_minutes}m
                        </span>
                      )}
                    </div>
                    <RowActions
                      service={service}
                      size="sm"
                      isDark={isDark}
                      onDuplicate={onDuplicate}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onRestore={onRestore}
                    />
                  </div>
                </div>

                {/* Desktop view */}
                <div className="hidden sm:grid grid-cols-12 gap-4 items-center px-4 py-3">
                  <div className="col-span-6 flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => onToggleExpand(service.service_uuid)}
                      aria-label="Toggle details"
                      className={cn(
                        'p-1 shrink-0 cursor-pointer rounded',
                        isDark
                          ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    <div
                      className={cn(
                        'p-2 rounded-lg shrink-0',
                        isDark ? 'bg-gray-800' : 'bg-gray-100'
                      )}
                    >
                      <CategoryIcon
                        className={cn('w-4 h-4', category?.color ?? '')}
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="font-medium truncate">{service.service_name}</p>
                      <p
                        className={cn(
                          'text-xs truncate',
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        )}
                      >
                        Code: {service.service_code} • {service.code_system}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-2 hidden md:block">
                    <span
                      className={cn(
                        'inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                        isDark
                          ? 'bg-blue-900/30 text-blue-300'
                          : 'bg-blue-100 text-blue-800'
                      )}
                    >
                      {service.service_category.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <p className="font-semibold text-sm">
                      {formatPrice(service.price_amount, service.currency_code)}
                    </p>
                    {service.default_duration_minutes ? (
                      <p
                        className={cn(
                          'text-xs',
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        )}
                      >
                        {service.default_duration_minutes} mins
                      </p>
                    ) : null}
                    <span
                      className={cn(
                        'inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium',
                        getStatusBgColor(service.status, isDark),
                        getStatusColor(service.status, isDark)
                      )}
                    >
                      {service.status}
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    <RiskBadge riskLevel={service.risk_level} size="md" isDark={isDark} />
                    <RowActions
                      service={service}
                      size="md"
                      isDark={isDark}
                      onDuplicate={onDuplicate}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onRestore={onRestore}
                    />
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-3 sm:px-4 pb-4">
                    <ExpandedDetails service={service} isDark={isDark} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── GRID VIEW ──────────────────────────────────────────────────── */
        <div
          className={cn(
            'rounded-xl border p-3 sm:p-4',
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          )}
        >
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {paginationData.currentItems.map((service) => {
              const category = serviceCategoryOptions.find(
                (c) => c.value === service.service_category
              );
              const CategoryIcon = category?.icon ?? Tag;
              const isDeleted = !!service.deleted_at;

              return (
                <div
                  key={service.service_uuid}
                  className={cn(
                    'rounded-lg border p-3 sm:p-4 transition-all hover:shadow-md',
                    isDark
                      ? 'border-gray-800 hover:border-gray-700'
                      : 'border-gray-200 hover:border-gray-300',
                    isDeleted && 'opacity-60'
                  )}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={cn(
                          'p-2 rounded-lg shrink-0',
                          isDark ? 'bg-gray-800' : 'bg-gray-100'
                        )}
                      >
                        <CategoryIcon
                          className={cn('w-4 h-4', category?.color ?? '')}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {service.service_name}
                        </h4>
                        <p
                          className={cn(
                            'text-xs truncate',
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          )}
                        >
                          {service.service_code}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 px-1.5 py-0.5 rounded-full text-xs font-medium',
                        getStatusBgColor(service.status, isDark),
                        getStatusColor(service.status, isDark)
                      )}
                    >
                      {service.status}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'text-base font-bold',
                          isDark ? 'text-gray-100' : 'text-gray-900'
                        )}
                      >
                        {formatPrice(service.price_amount, service.currency_code)}
                      </span>
                      {service.default_duration_minutes && (
                        <span
                          className={cn(
                            'text-xs',
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          )}
                        >
                          {service.default_duration_minutes}m
                        </span>
                      )}
                    </div>

                    {service.service_description && (
                      <p
                        className={cn(
                          'text-xs line-clamp-2',
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        )}
                      >
                        {service.service_description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded',
                          isDark
                            ? 'bg-gray-800 text-gray-300'
                            : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {service.service_category.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded',
                          isDark
                            ? 'bg-gray-800 text-gray-300'
                            : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {service.code_system}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <RiskBadge riskLevel={service.risk_level} isDark={isDark} />
                      <span
                        className={cn(
                          'text-xs',
                          isDark ? 'text-gray-500' : 'text-gray-500'
                        )}
                      >
                        Valid from: {service.effective_from}
                      </span>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div
                    className={cn(
                      'flex items-center justify-between mt-3 pt-3 border-t',
                      isDark ? 'border-gray-800' : 'border-gray-200'
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(service)}
                        title="Edit"
                        className={cn(
                          'p-1.5 rounded cursor-pointer transition-colors',
                          isDark
                            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                        )}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDuplicate(service)}
                        title="Duplicate"
                        className={cn(
                          'p-1.5 rounded cursor-pointer transition-colors',
                          isDark
                            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                        )}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {service.deleted_at ? (
                      <button
                        onClick={() => onRestore(service)}
                        className={cn(
                          'px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors',
                          isDark
                            ? 'bg-green-900/30 text-green-300 hover:bg-green-900/50'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        )}
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        onClick={() => onDelete(service)}
                        className={cn(
                          'px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors',
                          isDark
                            ? 'bg-red-900/30 text-red-300 hover:bg-red-900/50'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        )}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom pagination */}
      {paginationData.totalPages > 1 && (
        <PaginationBar
          paginationData={paginationData}
          pageNumbers={pageNumbers}
          goToPage={goToPage}
          isDark={isDark}
        />
      )}
    </div>
  );
};

ServiceCatalogList.displayName = 'ServiceCatalogList';