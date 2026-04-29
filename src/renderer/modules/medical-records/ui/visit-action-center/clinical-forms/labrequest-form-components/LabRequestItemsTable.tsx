// labrequest-form-components/LabRequestItemsTable.tsx
import React from 'react';
import {
  Beaker,
  Clock3,
  Edit3,
  FlaskConical,
  PackageSearch,
  Plus,
  ShieldAlert,
  TestTubeDiagonal,
  Trash2,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { LabRequest } from '../../../../api/lab/LabTypes';
import type { ColorTokens, LabRequestDraftItem } from './labRequestForm.types';

interface LabRequestItemsTableProps {
  isDark: boolean;
  colors: ColorTokens;
  request: LabRequest | null;
  items: LabRequestDraftItem[];
  onAddItem: () => void;
  onEditItem: (item: LabRequestDraftItem) => void;
  onDeleteItem: (item: LabRequestDraftItem) => void;
  onManageLabItems: () => void;
}

const badgeBase =
  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';

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
  // Determine if we can modify items based on request status
  const canModify = request ? request.status === 'pending' : true;

  return (
    <section className={cn('rounded-2xl border', colors.border.primary, colors.bg.card)}>
      <div className={cn('flex flex-wrap items-center justify-between gap-3 border-b p-4', colors.border.primary)}>
        <div>
          <h3 className={cn('text-base font-semibold', colors.text.primary)}>
            Lab Request Tests
          </h3>
          <p className={cn('text-sm', colors.text.secondary)}>
            {items.length} lab test{items.length === 1 ? '' : 's'} linked to this request
          </p>
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
            Manage Lab Tests
          </button>

          {canModify && (
            <button
              type="button"
              onClick={onAddItem}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-blue-800"
            >
              <Plus className="h-4 w-4" />
              Add Lab Test
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {items.length === 0 ? (
          <div className={cn('rounded-xl border border-dashed p-8 text-center', colors.border.primary, colors.bg.subtle)}>
            <FlaskConical className={cn('mx-auto mb-3 h-10 w-10', colors.text.tertiary)} />
            <p className={cn('text-sm font-medium', colors.text.primary)}>
              No Lab Tests added yet
            </p>
            <p className={cn('mt-1 text-sm', colors.text.secondary)}>
              Add one or more Lab Tests to prepare this request for submission.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[980px] border-collapse">
                <thead>
                  <tr className={cn('border-b', colors.border.primary)}>
                    <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>Lab Test</th>
                    <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>Source</th>
                    <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>Category / Code</th>
                    <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>Sample / Fasting</th>
                    <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>Turnaround</th>
                    <th className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>Notes</th>
                    {canModify && (
                      <th className={cn('px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide', colors.text.secondary)}>Actions</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className={cn(
                        'border-b align-top transition-colors',
                        colors.border.primary,
                        isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                      )}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-2">
                          <TestTubeDiagonal className={cn('mt-0.5 h-4 w-4', isDark ? 'text-cyan-300' : 'text-cyan-600')} />
                          <div className="min-w-0">
                            <div className={cn('font-semibold', colors.text.primary)}>{item.display_name}</div>
                          </div>
                        </div>
                       </td>

                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            badgeBase,
                            item.source === 'inventory'
                              ? isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-700'
                              : item.source === 'template'
                              ? isDark ? 'bg-violet-900/30 text-violet-300' : 'bg-violet-100 text-violet-700'
                              : isDark ? 'bg-cyan-900/30 text-cyan-300' : 'bg-cyan-100 text-cyan-700'
                          )}
                        >
                          {item.source}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className={cn('text-sm', colors.text.primary)}>{item.category || '—'}</div>
                          <div className={cn('text-xs', colors.text.secondary)}>Code: {item.code || '—'}</div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className={cn('text-sm', colors.text.primary)}>
                            {item.sample_type || 'Not specified'}
                          </div>
                          <div className="text-xs">
                            {item.requires_fasting ? (
                              <span className={cn('inline-flex items-center gap-1', isDark ? 'text-orange-300' : 'text-orange-700')}>
                                <ShieldAlert className="h-3.5 w-3.5" />
                                Fasting required
                              </span>
                            ) : (
                              <span className={colors.text.secondary}>No fasting requirement</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Clock3 className={cn('h-4 w-4', isDark ? 'text-green-300' : 'text-green-600')} />
                          <span className={cn('text-sm', colors.text.primary)}>
                            {item.turnaround_time_hours ? `${item.turnaround_time_hours} hrs` : 'N/A'}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className={cn('max-w-xs text-sm whitespace-pre-wrap break-words', item.notes ? colors.text.primary : colors.text.secondary)}>
                          {item.notes || '—'}
                        </div>
                      </td>

                      {canModify && (
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditItem(item)}
                              className={cn(
                                'rounded-lg border p-2 transition-colors',
                                colors.border.primary,
                                isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'
                              )}
                              title="Edit item"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onDeleteItem(item)}
                              className={cn(
                                'rounded-lg border p-2 transition-colors',
                                colors.border.primary,
                                isDark ? 'text-red-300 hover:bg-red-950/40' : 'text-red-700 hover:bg-red-50'
                              )}
                              title={request ? 'Cancel item' : 'Remove item'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="grid gap-3 md:hidden">
              {items.map((item) => (
                <div key={item.id} className={cn('rounded-xl border p-4', colors.border.primary, colors.bg.subtle)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <Beaker className={cn('mt-0.5 h-4 w-4', isDark ? 'text-cyan-300' : 'text-cyan-600')} />
                        <div>
                          <div className={cn('font-semibold', colors.text.primary)}>{item.display_name}</div>
                          <div className={cn('mt-1 text-xs', colors.text.secondary)}>
                            {item.category || 'No category'} • {item.code || 'No code'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {canModify && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => onEditItem(item)}
                          className={cn(
                            'rounded-lg border p-2 transition-colors',
                            colors.border.primary,
                            isDark ? 'text-slate-200 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'
                          )}
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteItem(item)}
                          className={cn(
                            'rounded-lg border p-2 transition-colors',
                            colors.border.primary,
                            isDark ? 'text-red-300 hover:bg-red-950/40' : 'text-red-700 hover:bg-red-50'
                          )}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid gap-2">
                    <div className={cn('text-sm', colors.text.primary)}>
                      <span className="font-medium">Source:</span> {item.source}
                    </div>
                    <div className={cn('text-sm', colors.text.primary)}>
                      <span className="font-medium">Sample:</span> {item.sample_type || 'Not specified'}
                    </div>
                    <div className={cn('text-sm', colors.text.primary)}>
                      <span className="font-medium">Fasting:</span> {item.requires_fasting ? 'Required' : 'Not required'}
                    </div>
                    <div className={cn('text-sm', colors.text.primary)}>
                      <span className="font-medium">Turnaround:</span> {item.turnaround_time_hours ? `${item.turnaround_time_hours} hrs` : 'N/A'}
                    </div>
                    {item.notes && (
                      <div className={cn('text-sm', colors.text.primary)}>
                        <span className="font-medium">Notes:</span> {item.notes}
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
  );
};

export default LabRequestItemsTable;