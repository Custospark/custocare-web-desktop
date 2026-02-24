import React, { useMemo, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit2,
  Package,
  RefreshCw,
  Shield,
  Thermometer,
  Trash2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import type {
  InventoryItem,
  ItemCategory,
} from '../../../api/admin-inventory/inventoryItemTypes';
import {
  formatPrice,
  getStatusBgColor,
  getStatusColor,
} from '../utils/inventoryItemUiUtils';
import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';

// ─── cn helper ──────────────────────────────────────────────────────────────
const cn = (...classes: (string | false | null | undefined)[]): string =>
  classes.filter(Boolean).join(' ');

// ─── Types ────────────────────────────────────────────────────────────────────
type ViewMode = 'list' | 'grid';

interface Props {
  theme: 'light' | 'dark';
  viewMode: ViewMode;
  isLoading: boolean;
  error: Error | null;
  items: InventoryItem[];
  expandedItems: Set<string>;
  onToggleExpand: (uuid: string) => void;
  onEdit: (item: InventoryItem) => void;
  onDuplicate: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onRestore: (item: InventoryItem) => void;
  onRetry: () => void;
  itemCategoryOptions: {
    value: ItemCategory;
    label: string;
    icon: React.ElementType;
    color: string;
  }[];
  // Pagination props from parent
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  // Optional fallback if parent doesn't provide pagination props
  defaultPageSize?: number;
}

// ─── Sub-components (defined OUTSIDE main component) ─────────────────────────

interface BadgeProps {
  size?: 'sm' | 'md';
  isDark: boolean;
}

const HazardBadge: React.FC<BadgeProps> = ({ size = 'sm', isDark }) => {
  const cls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return (
    <div className="relative group">
      <AlertTriangle className={cn(cls, isDark ? 'text-red-400' : 'text-red-600')} />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
        Hazardous
      </span>
    </div>
  );
};

const RefrigBadge: React.FC<BadgeProps> = ({ size = 'sm', isDark }) => {
  const cls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return (
    <div className="relative group">
      <Thermometer className={cn(cls, isDark ? 'text-blue-400' : 'text-blue-600')} />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
        Requires Refrigeration
      </span>
    </div>
  );
};

const PrescriptionBadge: React.FC<BadgeProps> = ({ size = 'sm', isDark }) => {
  const cls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return (
    <div className="relative group">
      <Shield className={cn(cls, isDark ? 'text-purple-400' : 'text-purple-600')} />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
        Requires Prescription
      </span>
    </div>
  );
};

interface RowActionsProps {
  item: InventoryItem;
  size?: 'sm' | 'md';
  isDark: boolean;
  onDuplicate: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onRestore: (item: InventoryItem) => void;
}

const RowActions: React.FC<RowActionsProps> = ({
  item,
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
      <button onClick={() => onDuplicate(item)} className={btn} title="Duplicate">
        <Copy className={iconCls} />
      </button>
      <button onClick={() => onEdit(item)} className={btn} title="Edit">
        <Edit2 className={iconCls} />
      </button>
      {item.deleted_at ? (
        <button
          onClick={() => onRestore(item)}
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
          onClick={() => onDelete(item)}
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
  item: InventoryItem;
  isDark: boolean;
}

const ExpandedDetails: React.FC<ExpandedDetailsProps> = ({ item, isDark }) => (
  <div
    className={cn(
      'mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4',
      isDark ? 'border-gray-800' : 'border-gray-200'
    )}
  >
    <div>
      <h4 className="text-sm font-semibold mb-2">Item Details</h4>
      <dl
        className={cn(
          'text-xs space-y-1.5',
          isDark ? 'text-gray-400' : 'text-gray-600'
        )}
      >
        <div>
          <dt className="inline font-medium">Manufacturer: </dt>
          <dd className="inline">{item.manufacturer || 'Not specified'}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Supplier: </dt>
          <dd className="inline">{item.supplier || 'Not specified'}</dd>
        </div>
        <div>
          <dt className="inline font-medium">NDC Code: </dt>
          <dd className="inline">{item.ndc_code || 'N/A'}</dd>
        </div>
        {item.drug_class && (
          <div>
            <dt className="inline font-medium">Drug Class: </dt>
            <dd className="inline">{item.drug_class}</dd>
          </div>
        )}
        {item.strength && (
          <div>
            <dt className="inline font-medium">Strength: </dt>
            <dd className="inline">{item.strength}</dd>
          </div>
        )}
        {item.dosage_form && (
          <div>
            <dt className="inline font-medium">Dosage Form: </dt>
            <dd className="inline">{item.dosage_form}</dd>
          </div>
        )}
      </dl>
    </div>

    <div>
      <h4 className="text-sm font-semibold mb-2">Storage & Safety</h4>
      <div
        className={cn(
          'text-xs space-y-1.5',
          isDark ? 'text-gray-400' : 'text-gray-600'
        )}
      >
        <div className="flex items-center gap-2">
          {item.requires_refrigeration ? (
            <Thermometer className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          )}
          Refrigeration:{' '}
          <strong>{item.requires_refrigeration ? 'Required' : 'Not Required'}</strong>
        </div>
        <div className="flex items-center gap-2">
          {item.requires_prescription ? (
            <Shield className="w-3.5 h-3.5 text-purple-500 shrink-0" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          )}
          Prescription:{' '}
          <strong>{item.requires_prescription ? 'Required' : 'Not Required'}</strong>
        </div>
        <div className="flex items-center gap-2">
          {item.is_hazardous ? (
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
          ) : (
            <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
          )}
          Hazardous: <strong>{item.is_hazardous ? 'Yes' : 'No'}</strong>
        </div>
        {item.storage_location_type && (
          <div>
            <span className="font-medium">Storage: </span>
            {item.storage_location_type}
          </div>
        )}
      </div>
    </div>

    <div>
      <h4 className="text-sm font-semibold mb-2">Stock Management</h4>
      <dl
        className={cn(
          'text-xs space-y-1.5',
          isDark ? 'text-gray-400' : 'text-gray-600'
        )}
      >
        <div>
          <dt className="inline font-medium">Reorder Point: </dt>
          <dd className="inline">{item.reorder_point ?? 'Not set'}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Reorder Qty: </dt>
          <dd className="inline">{item.reorder_quantity ?? 'Not set'}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Safety Stock: </dt>
          <dd className="inline">{item.safety_stock_level ?? 'Not set'}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Max Stock: </dt>
          <dd className="inline">{item.max_stock_level ?? 'Not set'}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Billable: </dt>
          <dd className="inline">{item.is_billable ? 'Yes' : 'No'}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Track by Lot: </dt>
          <dd className="inline">{item.track_by_lot ? 'Yes' : 'No'}</dd>
        </div>
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
      <span className="font-medium">{paginationData.totalItems}</span> items
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

// ─── Main Component ────────────────────────────────────────────────────────────
export const InventoryCatalogList: React.FC<Props> = ({
  theme,
  viewMode,
  isLoading,
  error,
  items,
  expandedItems,
  onToggleExpand,
  onEdit,
  onDuplicate,
  onDelete,
  onRestore,
  onRetry,
  itemCategoryOptions,
  currentPage,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
}) => {
  const isDark = theme === 'dark';

  // Calculate pagination based on props
  const paginationData = useMemo(() => {
    const totalItems = items.length;
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
      currentItems: items.slice(startIndex, endIndex),
      from: totalItems > 0 ? startIndex + 1 : 0,
      to: endIndex,
    };
  }, [items, currentPage, itemsPerPage]);

  const goToPage = (page: number) => {
    onPageChange(Math.max(1, Math.min(page, paginationData.totalPages)));
  };

  const changeItemsPerPage = (n: number) => {
    onItemsPerPageChange(n);
  };

  // Reset to page 1 when items change (e.g., after filtering)
  useEffect(() => {
    onPageChange(1);
  }, [items, onPageChange]);

  // ── Smart page numbers with ellipsis ──────────────────────────────────────
  const pageNumbers = useMemo<(number | '...')[]>(() => {
    const { totalPages, safePage } = paginationData;
    const delta = 2;
    const range: number[] = [];
    
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= safePage - delta && i <= safePage + delta)
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
  }, [paginationData]);

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
          message="Loading inventory items..."
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
          Error loading inventory items
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
  if (items.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl p-10 text-center border',
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        )}
      >
        <Package
          className={cn(
            'w-12 h-12 mx-auto',
            isDark ? 'text-gray-600' : 'text-gray-400'
          )}
        />
        <h3 className="mt-4 text-lg font-medium">No inventory items found</h3>
        <p className={cn('mt-1 text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
          Try adjusting your filters or create your first inventory item.
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
          <span className="font-medium">{paginationData.totalItems}</span>
        </span>

        <div className="flex items-center gap-2">
          <span className={cn('text-xs sm:text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
            Show:
          </span>
          <select
            value={itemsPerPage}
            onChange={(e) => changeItemsPerPage(Number(e.target.value))}
            className={cn(
              'px-2 py-1 rounded border text-xs sm:text-sm cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              isDark
                ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
                : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
            )}
          >
            {[5, 10, 20, 50, 100].map((n) => (
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
            <div className="col-span-6">Item</div>
            <div className="col-span-2 hidden md:block">Category</div>
            <div className="col-span-2">Cost / Qty</div>
            <div className="col-span-2 text-center">Actions</div>
          </div>

          {/* Rows */}
          {paginationData.currentItems.map((item) => {
            const category = itemCategoryOptions.find(
              (c) => c.value === item.item_category
            );
            const CategoryIcon = category?.icon ?? Package;
            const isExpanded = expandedItems.has(item.item_uuid);
            const isDeleted = !!item.deleted_at;

            return (
              <div
                key={item.item_uuid}
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
                        onClick={() => onToggleExpand(item.item_uuid)}
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
                            {item.item_name}
                          </span>
                        </div>
                        <p
                          className={cn(
                            'text-xs truncate',
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          )}
                        >
                          {item.item_code}
                          {(item.generic_name || item.brand_name) &&
                            ` • ${item.generic_name || item.brand_name}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="font-semibold text-sm">
                        {formatPrice(item.unit_cost ?? 0, item.currency_code)}
                      </span>
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded-full text-xs font-medium',
                          getStatusBgColor(item.status, isDark),
                          getStatusColor(item.status, isDark)
                        )}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {item.is_hazardous && <HazardBadge isDark={isDark} />}
                      {item.requires_refrigeration && <RefrigBadge isDark={isDark} />}
                      {item.requires_prescription && <PrescriptionBadge isDark={isDark} />}
                      <span
                        className={cn(
                          'text-xs',
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        )}
                      >
                        {item.package_quantity} {item.unit_of_measure}
                      </span>
                    </div>
                    <RowActions
                      item={item}
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
                      onClick={() => onToggleExpand(item.item_uuid)}
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
                      <p className="font-medium truncate">{item.item_name}</p>
                      <p
                        className={cn(
                          'text-xs truncate',
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        )}
                      >
                        {item.item_code}
                        {(item.generic_name || item.brand_name) && (
                          <> · {item.generic_name || item.brand_name}</>
                        )}
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
                      {item.item_category.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <p className="font-semibold text-sm">
                      {formatPrice(item.unit_cost ?? 0, item.currency_code)}
                    </p>
                    <p
                      className={cn(
                        'text-xs',
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      )}
                    >
                      {item.package_quantity} {item.unit_of_measure}
                    </p>
                    <span
                      className={cn(
                        'inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium',
                        getStatusBgColor(item.status, isDark),
                        getStatusColor(item.status, isDark)
                      )}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-1.5">
                    {item.is_hazardous && <HazardBadge size="md" isDark={isDark} />}
                    {item.requires_refrigeration && <RefrigBadge size="md" isDark={isDark} />}
                    {item.requires_prescription && <PrescriptionBadge size="md" isDark={isDark} />}
                    <RowActions
                      item={item}
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
                    <ExpandedDetails item={item} isDark={isDark} />
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
            {paginationData.currentItems.map((item) => {
              const category = itemCategoryOptions.find(
                (c) => c.value === item.item_category
              );
              const CategoryIcon = category?.icon ?? Package;
              const isDeleted = !!item.deleted_at;

              return (
                <div
                  key={item.item_uuid}
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
                          {item.item_name}
                        </h4>
                        <p
                          className={cn(
                            'text-xs truncate',
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          )}
                        >
                          {item.item_code}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 px-1.5 py-0.5 rounded-full text-xs font-medium',
                        getStatusBgColor(item.status, isDark),
                        getStatusColor(item.status, isDark)
                      )}
                    >
                      {item.status}
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
                        {formatPrice(item.unit_cost ?? 0, item.currency_code)}
                      </span>
                      <span
                        className={cn(
                          'text-xs',
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        )}
                      >
                        {item.package_quantity} {item.unit_of_measure}
                      </span>
                    </div>

                    {(item.generic_name || item.brand_name) && (
                      <p
                        className={cn(
                          'text-xs truncate',
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        )}
                      >
                        {item.generic_name || item.brand_name}
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
                        {item.item_category.replace(/_/g, ' ')}
                      </span>
                      {item.requires_refrigeration && (
                        <span
                          className={cn(
                            'text-xs flex items-center gap-0.5',
                            isDark ? 'text-blue-400' : 'text-blue-600'
                          )}
                        >
                          <Thermometer className="w-3 h-3" />
                          Cold
                        </span>
                      )}
                      {item.is_hazardous && (
                        <span
                          className={cn(
                            'text-xs flex items-center gap-0.5',
                            isDark ? 'text-red-400' : 'text-red-600'
                          )}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          Hazard
                        </span>
                      )}
                    </div>

                    <p
                      className={cn(
                        'text-xs',
                        isDark ? 'text-gray-500' : 'text-gray-500'
                      )}
                    >
                      {item.manufacturer
                        ? `Mfr: ${item.manufacturer}`
                        : 'Manufacturer not specified'}
                    </p>
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
                        onClick={() => onEdit(item)}
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
                        onClick={() => onDuplicate(item)}
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

                    {item.deleted_at ? (
                      <button
                        onClick={() => onRestore(item)}
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
                        onClick={() => onDelete(item)}
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

InventoryCatalogList.displayName = 'InventoryCatalogList';