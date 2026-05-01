import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Ban,
  Beaker,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  FlaskConical,
  PackageSearch,
  Plus,
  Save,
  ShieldAlert,
  Syringe,
  TestTubeDiagonal,
  User,
  XCircle,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type {
  LabRequestItemStatus as LabRequestItemStatusType,
  LabRequestWithItems,
  LabRequestItemWithTest,
  LabResult,
} from '../../../../api/lab/LabTypes';
import { LabRequestStatus, LabRequestItemStatus } from '../../../../api/lab/LabTypes';
import type { ColorTokens, LabRequestDraftItem } from './labRequestForm.types';
import { formatDate } from './labRequestForm.types';
import LabResultViewModal from '../labresult-form-components/LabResultItemsTable/components/LabResultViewModal';
import type { ColorTokens as LabResultColorTokens } from '../labresult-form-components/labResultForm.types';


interface LabRequestItemsTableProps {
  isDark: boolean;
  colors: ColorTokens;
  request: LabRequestWithItems | null;
  items: LabRequestDraftItem[];
  onAddItem: () => void;
  onEditItem: (item: LabRequestDraftItem) => void;
  onDeleteItem: (item: LabRequestDraftItem) => void;
  onManageLabItems: () => void;
}

const badgeBase = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';

type TableRow = {
  key: React.Key;
  draftItem: LabRequestDraftItem;
  persistedItem: LabRequestItemWithTest | null;
  index: number;
  isDraft: boolean;
  status: LabRequestItemStatusType;
  isCancelled: boolean;
  isLocked: boolean;
  workflowStep: number;
  results: LabResult[];
  hasResults: boolean;
  hasCriticalResults: boolean;
  hasAbnormalResults: boolean;
  displayName: string;
  category: string | null;
  code: string | null;
  sampleType: string | null;
  sampleIdentifier: string | null;
  requiresFasting: boolean;
  turnaroundTimeHours: number | null;
  notes: string | null;
};

const getItemStatusBadgeColor = (status: LabRequestItemStatusType | undefined, isDark: boolean): string => {
  if (!status) return isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700';

  const statusColors: Record<LabRequestItemStatusType, string> = {
    [LabRequestItemStatus.PENDING]: isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700',
    [LabRequestItemStatus.SAMPLE_COLLECTED]: isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700',
    [LabRequestItemStatus.IN_PROGRESS]: isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700',
    [LabRequestItemStatus.COMPLETED]: isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700',
    [LabRequestItemStatus.VERIFIED]: isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700',
    [LabRequestItemStatus.CANCELLED]: isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700',
  };

  return statusColors[status];
};

const getItemStatusIcon = (status: LabRequestItemStatusType | undefined) => {
  switch (status) {
    case LabRequestItemStatus.PENDING:
      return <Clock3 className="h-3 w-3" />;
    case LabRequestItemStatus.SAMPLE_COLLECTED:
      return <Syringe className="h-3 w-3" />;
    case LabRequestItemStatus.IN_PROGRESS:
      return <Beaker className="h-3 w-3" />;
    case LabRequestItemStatus.COMPLETED:
      return <CheckCircle2 className="h-3 w-3" />;
    case LabRequestItemStatus.VERIFIED:
      return <CheckCircle className="h-3 w-3" />;
    case LabRequestItemStatus.CANCELLED:
      return <XCircle className="h-3 w-3" />;
    default:
      return <Beaker className="h-3 w-3" />;
  }
};
const adaptColorsForResultModal = (colors: ColorTokens, isDark: boolean): LabResultColorTokens => {
  return {
    bg: {
      page: colors.bg?.card ?? (isDark ? '#1f2937' : '#ffffff'), // Using card as fallback for page
      card: colors.bg?.card ?? (isDark ? '#1f2937' : '#ffffff'),
      input: colors.bg?.input ?? (isDark ? '#374151' : '#f9fafb'),
      subtle: colors.bg?.subtle ?? (isDark ? '#374151' : '#f3f4f6'),
      hover: colors.bg?.hover ?? (isDark ? '#4b5563' : '#e5e7eb'),
      muted: colors.bg?.muted ?? (isDark ? '#6b7280' : '#9ca3af'),
      modal: colors.bg?.modal ?? (isDark ? '#1f2937' : '#ffffff'),
      accent: colors.bg?.hover ?? (isDark ? '#4b5563' : '#e5e7eb'),
    },
    text: {
      primary: colors.text?.primary ?? (isDark ? '#f9fafb' : '#111827'),
      secondary: colors.text?.secondary ?? (isDark ? '#d1d5db' : '#6b7280'),
      tertiary: colors.text?.tertiary ?? (isDark ? '#9ca3af' : '#9ca3af'),
      brand: colors.text?.brand ?? '#3b82f6',
      danger: '#ef4444',
      success: '#10b981',
      warning: '#f59e0b',
    },
    border: {
      primary: colors.border?.primary ?? (isDark ? '#374151' : '#e5e7eb'),
      subtle: colors.border?.subtle ?? (isDark ? '#374151' : '#e5e7eb'),
      focus: colors.border?.focus ?? '#3b82f6',
      accent: colors.border?.primary ?? (isDark ? '#374151' : '#e5e7eb'),
    },
  };
};

const getWorkflowStep = (status: LabRequestItemStatusType | undefined): number => {
  switch (status) {
    case LabRequestItemStatus.PENDING:
      return 1;
    case LabRequestItemStatus.SAMPLE_COLLECTED:
      return 2;
    case LabRequestItemStatus.IN_PROGRESS:
      return 3;
    case LabRequestItemStatus.COMPLETED:
      return 4;
    case LabRequestItemStatus.VERIFIED:
      return 5;
    default:
      return 0;
  }
};

const getDraftBadgeColor = (isDark: boolean): string => {
  return isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700';
};

const formatStaffName = (
  staff: { name: string | null; professional_title?: string | null } | null | undefined
): string => {
  if (!staff?.name) return 'Unknown clinician';

  const title = staff.professional_title || 'Dr.';
  const titlePrefix = title.toLowerCase().includes('dr') ? '' : 'Dr. ';
  return `${titlePrefix}${staff.name}`;
};

const formatTurnaroundTimeWithMinutes = (hours: number | null | undefined): string => {
  if (hours == null) return 'N/A';

  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }

  if (hours < 24) {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);

    if (minutes === 0) {
      return `${wholeHours} hr${wholeHours !== 1 ? 's' : ''}`;
    }

    return `${wholeHours} hr${wholeHours !== 1 ? 's' : ''} (${minutes} min${minutes !== 1 ? 's' : ''})`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  const wholeHours = Math.floor(remainingHours);
  const minutes = Math.round((remainingHours - wholeHours) * 60);

  let result = `${days} day${days !== 1 ? 's' : ''}`;
  if (wholeHours > 0) result += ` ${wholeHours} hr${wholeHours !== 1 ? 's' : ''}`;
  if (minutes > 0) result += ` (${minutes} min${minutes !== 1 ? 's' : ''})`;

  return result;
};

const getRowClassName = (
  isDark: boolean,
  colors: ColorTokens,
  isDraft: boolean,
  isCancelled: boolean,
  isLocked: boolean
) => {
  if (isCancelled) {
    return cn(
      'border-b align-top transition-colors opacity-60',
      colors.border.primary,
      isDark ? 'bg-red-900/5 hover:bg-red-900/10' : 'bg-red-50/30 hover:bg-red-50/50'
    );
  }

  if (isLocked) {
    return cn(
      'border-b align-top transition-colors',
      colors.border.primary,
      isDark ? 'bg-gray-800/30 hover:bg-gray-800/40' : 'bg-gray-50/50 hover:bg-gray-50/70'
    );
  }

  return cn(
    'border-b align-top transition-colors',
    colors.border.primary,
    isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50',
    isDraft && 'opacity-75',
    isDraft && (isDark ? 'bg-purple-900/10' : 'bg-purple-50/50')
  );
};

const isLockedStatus = (status: LabRequestItemStatusType): boolean => {
  return (
    status === LabRequestItemStatus.IN_PROGRESS ||
    status === LabRequestItemStatus.COMPLETED ||
    status === LabRequestItemStatus.VERIFIED
  );
};

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

  const rows = useMemo<TableRow[]>(() => {
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

  const stats = useMemo(() => {
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

        if (
          row.status === LabRequestItemStatus.PENDING
        ) {
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

  const renderDetailsContent = (row: TableRow) => {
    if (row.persistedItem && row.hasResults) {
      return (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => handleViewResults(row.persistedItem!)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium transition-all',
              isDark
                ? 'bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50'
                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            View Results
          </button>
          <div className={cn('text-xs', colors.text.tertiary)}>
            {row.results.length} result{row.results.length !== 1 ? 's' : ''}
          </div>
        </div>
      );
    }

    if (row.persistedItem?.sample_identifier) {
      return (
        <div className="space-y-1">
          <div className={cn('text-sm', colors.text.primary)}>{row.sampleType || '—'}</div>
          <div className={cn('text-xs font-mono', colors.text.tertiary)}>
            Sample ID: {row.sampleIdentifier}
          </div>
        </div>
      );
    }

    if (row.sampleType) {
      return <span className={cn('text-sm', colors.text.primary)}>{row.sampleType}</span>;
    }

    if (row.isDraft) {
      return <span className={cn('text-sm', colors.text.tertiary)}>Draft item</span>;
    }

    if (row.isLocked) {
      return (
        <div className="flex items-center gap-1.5">
          <Clock3 className={cn('h-3.5 w-3.5', isDark ? 'text-blue-400' : 'text-blue-600')} />
          <span className={cn('text-sm', colors.text.secondary)}>Processing</span>
        </div>
      );
    }

    return <span className={cn('text-sm', colors.text.tertiary)}>—</span>;
  };

  const renderActionButtons = (row: TableRow) => {
    if (!canModify) return null;
    if (row.isLocked || row.isCancelled) {
      return <span className={cn('text-xs', colors.text.tertiary)}>—</span>;
    }

    return (
      <div className="flex items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => onEditItem(row.draftItem)}
          className={cn(
            'rounded-lg border p-1.5 transition-colors',
            colors.border.primary,
            isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'
          )}
          title="Edit test details"
        >
          <Edit3 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDeleteItem(row.draftItem)}
          className={cn(
            'rounded-lg border p-1.5 transition-colors',
            colors.border.primary,
            isDark ? 'text-red-300 hover:bg-red-950/40' : 'text-red-700 hover:bg-red-50'
          )}
          title={request ? 'Cancel this test' : 'Remove this test'}
        >
          <Ban className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  return (
    <>
      <section className={cn('rounded-2xl border', colors.border.primary, colors.bg.card)}>
        <div
          className={cn(
            'flex flex-wrap items-start justify-between gap-4 border-b p-5',
            colors.border.primary
          )}
        >
          <div className="space-y-2">
            <div>
              <h3 className={cn('text-base font-semibold', colors.text.primary)}>
                Lab Request Tests
              </h3>

              {requestedByName && (
                <div className={cn('mt-1 flex items-center gap-1.5 text-xs', colors.text.secondary)}>
                  <User className="h-3 w-3" />
                  <span>Ordered by: {requestedByName}</span>
                </div>
              )}
            </div>

            {request && (
              <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs', colors.text.tertiary)}>
                {request.requested_at && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    <span>Requested: {formatDate(request.requested_at)}</span>
                  </div>
                )}

                {request.collected_at && (
                  <div className="flex items-center gap-1.5">
                    <Syringe className="h-3 w-3" />
                    <span>Collected: {formatDate(request.collected_at)}</span>
                  </div>
                )}

                {request.completed_at && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Completed: {formatDate(request.completed_at)}</span>
                  </div>
                )}

                {request.reviewed_at && (
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="h-3 w-3" />
                    <span>Reviewed: {formatDate(request.reviewed_at)}</span>
                  </div>
                )}
              </div>
            )}

            <div className={cn('flex flex-wrap gap-4 text-sm', colors.text.secondary)}>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                <span>{stats.pendingItems} Pending</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span>{stats.inProgressItems} In Progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span>{stats.completedItems} Completed</span>
              </div>

              {stats.cancelledItems > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span>{stats.cancelledItems} Cancelled</span>
                </div>
              )}

              {stats.draftItems > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                  <span>{stats.draftItems} Draft</span>
                </div>
              )}
            </div>

            {isReadOnly && request && (
              <div
                className={cn(
                  'mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs',
                  isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
                )}
              >
                <ShieldAlert className="h-3 w-3" />
                <span>Read-only - Request is {request.status_label}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onManageLabItems}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                colors.border.primary,
                colors.bg.hover,
                colors.text.primary
              )}
            >
              <PackageSearch className="h-4 w-4" />
              Browse Tests
            </button>

            {canModify && (
              <button
                type="button"
                onClick={onAddItem}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Add Test
              </button>
            )}
          </div>
        </div>

        <div className="p-5">
          {rows.length === 0 ? (
            <div
              className={cn(
                'rounded-xl border border-dashed p-12 text-center',
                colors.border.primary,
                colors.bg.subtle
              )}
            >
              <FlaskConical className={cn('mx-auto mb-4 h-12 w-12', colors.text.tertiary)} />
              <p className={cn('text-base font-medium', colors.text.primary)}>
                No Lab Tests added yet
              </p>
              <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                Add one or more Lab Tests to prepare this request for processing
              </p>

              {canModify && (
                <button
                  type="button"
                  onClick={onAddItem}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Test
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1000px] border-collapse">
                  <thead>
                    <tr className={cn('border-b', colors.border.primary)}>
                      <th className={cn('w-12 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>
                        #
                      </th>
                      <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>
                        Test Name
                      </th>
                      <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>
                        Status
                      </th>
                      <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>
                        Details
                      </th>
                      <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>
                        Requirements
                      </th>
                      <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>
                        Turnaround
                      </th>
                      <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>
                        Category / Code
                      </th>
                      {canModify && (
                        <th className={cn('px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.key}
                        className={getRowClassName(isDark, colors, row.isDraft, row.isCancelled, row.isLocked)}
                      >
                        <td className="px-3 py-4 text-center">
                          <span className={cn('text-sm font-medium', colors.text.secondary)}>
                            {row.index + 1}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-start gap-2.5">
                            {row.hasCriticalResults ? (
                              <AlertCircle className={cn('mt-0.5 h-4 w-4', isDark ? 'text-red-400' : 'text-red-600')} />
                            ) : row.hasAbnormalResults ? (
                              <AlertCircle className={cn('mt-0.5 h-4 w-4', isDark ? 'text-amber-400' : 'text-amber-600')} />
                            ) : (
                              <TestTubeDiagonal className={cn('mt-0.5 h-4 w-4', isDark ? 'text-cyan-300' : 'text-cyan-600')} />
                            )}

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className={cn('font-semibold', colors.text.primary)}>
                                  {row.displayName}
                                </div>

                                {row.isDraft && (
                                  <span className={cn(badgeBase, getDraftBadgeColor(isDark))}>
                                    <Save className="mr-1 h-2.5 w-2.5" />
                                    Draft
                                  </span>
                                )}

                                {row.isCancelled && (
                                  <span
                                    className={cn(
                                      badgeBase,
                                      isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
                                    )}
                                  >
                                    <XCircle className="mr-1 h-2.5 w-2.5" />
                                    Cancelled
                                  </span>
                                )}

                                {row.isLocked && !row.isCancelled && (
                                  <span
                                    className={cn(
                                      badgeBase,
                                      isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                                    )}
                                  >
                                    <Clock3 className="mr-1 h-2.5 w-2.5" />
                                    In Progress
                                  </span>
                                )}
                              </div>

                              {row.notes && (
                                <div className={cn('mt-1 text-xs italic', colors.text.tertiary)}>
                                  Note: {row.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="space-y-2">
                            <span className={cn(badgeBase, getItemStatusBadgeColor(row.status, isDark))}>
                              {getItemStatusIcon(row.status)}
                              <span className="ml-1 capitalize">
                                {row.status.replace(/_/g, ' ')}
                              </span>
                            </span>

                            {!row.isDraft &&
                              !row.isCancelled &&
                              row.status !== LabRequestItemStatus.PENDING && (
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 flex-1 rounded-full bg-gray-200 dark:bg-gray-700">
                                    <div
                                      className="h-1.5 rounded-full bg-blue-500 transition-all"
                                      style={{ width: `${(row.workflowStep / 5) * 100}%` }}
                                    />
                                  </div>
                                  <span className={cn('text-xs', colors.text.tertiary)}>
                                    Step {row.workflowStep}/5
                                  </span>
                                </div>
                              )}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          {renderDetailsContent(row)}
                        </td>

                        <td className="px-4 py-4">
                          {row.requiresFasting ? (
                            <div className="flex items-center gap-1.5">
                              <ShieldAlert
                                className={cn(
                                  'h-3.5 w-3.5',
                                  isDark ? 'text-orange-300' : 'text-orange-600'
                                )}
                              />
                              <span
                                className={cn(
                                  'text-xs',
                                  isDark ? 'text-orange-300' : 'text-orange-700'
                                )}
                              >
                                Fasting required
                              </span>
                            </div>
                          ) : (
                            <span className={cn('text-xs', colors.text.tertiary)}>No fasting</span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Clock3
                              className={cn(
                                'h-3.5 w-3.5',
                                isDark ? 'text-green-300' : 'text-green-600'
                              )}
                            />
                            <span className={cn('text-sm', colors.text.primary)}>
                              {formatTurnaroundTimeWithMinutes(row.turnaroundTimeHours)}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="space-y-0.5">
                            {row.category && (
                              <div className={cn('text-sm', colors.text.primary)}>
                                {row.category}
                              </div>
                            )}
                            {row.code && (
                              <div className={cn('text-xs font-mono', colors.text.secondary)}>
                                {row.code}
                              </div>
                            )}
                            {!row.category && !row.code && (
                              <span className={cn('text-xs', colors.text.tertiary)}>—</span>
                            )}
                          </div>
                        </td>

                        {canModify && (
                          <td className="px-4 py-4 text-center">{renderActionButtons(row)}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 lg:hidden">
                {rows.map((row) => (
                  <div
                    key={row.key}
                    className={cn(
                      'rounded-xl border p-4',
                      colors.border.primary,
                      colors.bg.subtle,
                      row.isDraft && (isDark ? 'bg-purple-900/10' : 'bg-purple-50/50'),
                      row.isCancelled && (isDark ? 'bg-red-900/5' : 'bg-red-50/30'),
                      row.isLocked && (isDark ? 'bg-gray-800/30' : 'bg-gray-50/50')
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-sm font-medium', colors.text.secondary)}>
                          #{row.index + 1}
                        </span>
                        <div className={cn('font-semibold', colors.text.primary)}>
                          {row.displayName}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className={cn(badgeBase, getItemStatusBadgeColor(row.status, isDark))}>
                          {getItemStatusIcon(row.status)}
                          <span className="ml-1 capitalize">
                            {row.status.replace(/_/g, ' ')}
                          </span>
                        </span>

                        {canModify && !row.isLocked && !row.isCancelled && (
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => onEditItem(row.draftItem)}
                              className={cn(
                                'rounded-lg border p-1.5 transition-colors',
                                colors.border.primary,
                                isDark
                                  ? 'text-slate-200 hover:bg-slate-700'
                                  : 'text-slate-700 hover:bg-slate-100'
                              )}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteItem(row.draftItem)}
                              className={cn(
                                'rounded-lg border p-1.5 transition-colors',
                                colors.border.primary,
                                isDark
                                  ? 'text-red-300 hover:bg-red-950/40'
                                  : 'text-red-700 hover:bg-red-50'
                              )}
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2.5">
                      <div className="space-y-0.5">
                        <div className={cn('text-xs font-medium', colors.text.secondary)}>Category</div>
                        <div className={cn('text-sm', colors.text.primary)}>{row.category || '—'}</div>
                      </div>

                      <div className="space-y-0.5">
                        <div className={cn('text-xs font-medium', colors.text.secondary)}>Code</div>
                        <div className={cn('text-sm font-mono', colors.text.primary)}>{row.code || '—'}</div>
                      </div>

                      <div className="space-y-0.5">
                        <div className={cn('text-xs font-medium', colors.text.secondary)}>Details</div>
                        <div>{renderDetailsContent(row)}</div>
                      </div>

                      <div className="space-y-0.5">
                        <div className={cn('text-xs font-medium', colors.text.secondary)}>Turnaround</div>
                        <div className="flex items-center gap-1">
                          <Clock3 className="h-3 w-3" />
                          <span className={cn('text-sm', colors.text.primary)}>
                            {formatTurnaroundTimeWithMinutes(row.turnaroundTimeHours)}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2 space-y-0.5">
                        <div className={cn('text-xs font-medium', colors.text.secondary)}>Fasting</div>
                        <div>
                          {row.requiresFasting ? (
                            <div className="flex items-center gap-1.5">
                              <ShieldAlert
                                className={cn(
                                  'h-3.5 w-3.5',
                                  isDark ? 'text-orange-300' : 'text-orange-600'
                                )}
                              />
                              <span
                                className={cn(
                                  'text-xs',
                                  isDark ? 'text-orange-300' : 'text-orange-700'
                                )}
                              >
                                Required
                              </span>
                            </div>
                          ) : (
                            <span className={cn('text-xs', colors.text.tertiary)}>Not required</span>
                          )}
                        </div>
                      </div>

                      {row.notes && (
                        <div className="col-span-2 space-y-0.5">
                          <div className={cn('text-xs font-medium', colors.text.secondary)}>Notes</div>
                          <div className={cn('text-sm', colors.text.primary)}>{row.notes}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
        colors={adaptColorsForResultModal(colors)}
      />
    </>
  );
};

export default LabRequestItemsTable;
