import React, { useState, useEffect, useRef } from 'react';
import { Package, Plus, Minus, X, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../../../../../../shared/types/cn';
import { useGetCurrentStockBalance, useAdjustStock } from '../../../api/admin-inventory/useInventoryItemQueries';
import type { InventoryItem } from '../../../api/admin-inventory/inventoryItemTypes';

interface Props {
  theme: 'light' | 'dark';
  open: boolean;
  item: InventoryItem | null;
  facilityId: number | null;
  staffId: number | null;
  onClose: () => void;
}

export const InventoryStockAdjustModal: React.FC<Props> = ({
  theme,
  open,
  item,
  facilityId,
  staffId,
  onClose,
}) => {
  const isDark = theme === 'dark';
  const [quantityInput, setQuantityInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isIncrease, setIsIncrease] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const itemId = item?.id ?? 0;
  const facId = facilityId ?? 0;

  const balanceQuery = useGetCurrentStockBalance(
    { facility_id: facId, inventory_item_id: itemId },
    { enabled: open && facId > 0 && itemId > 0 }
  );

  const adjustMutation = useAdjustStock({
    onSuccess: () => {
      onClose();
    },
  });

  const currentBalance = balanceQuery.data?.data?.current_balance ?? 0;
  const isBalanceLoading = balanceQuery.isLoading;
  const numericQuantity = parseFloat(quantityInput) || 0;
  const signedQuantity = isIncrease ? numericQuantity : -numericQuantity;
  const newBalance = currentBalance + signedQuantity;

  const canSubmit =
    numericQuantity > 0 &&
    staffId != null &&
    facId > 0 &&
    itemId > 0 &&
    !adjustMutation.isPending &&
    !balanceQuery.isLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !item) return;
    adjustMutation.mutate({
      facility_id: facId,
      inventory_item_id: itemId,
      quantity: signedQuantity,
      unit_of_measure: item.unit_of_measure,
      performed_by_staff_id: staffId!,
      transaction_notes: notes.trim() || undefined,
    });
  };

  useEffect(() => {
    if (open) {
      setQuantityInput('');
      setNotes('');
      setIsIncrease(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  if (!open || !item) return null;

  const overlay = isDark ? 'bg-black/60' : 'bg-black/40';
  const panel = isDark
    ? 'bg-slate-900 border-slate-700 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900';
  const muted = isDark ? 'text-slate-400' : 'text-slate-600';
  const inputTheme = isDark
    ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400';

  return (
    <div
      className={cn('fixed inset-0 z-50 flex items-center justify-center p-4', overlay)}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={cn('w-full max-w-md rounded-2xl border shadow-2xl', panel)}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-xl',
              isDark ? 'bg-blue-500/20' : 'bg-blue-100'
            )}>
              <Package className={cn('w-5 h-5', isDark ? 'text-blue-400' : 'text-blue-600')} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Adjust Stock</h2>
              <p className={cn('text-xs truncate max-w-60', muted)}>{item.item_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={cn(
              'p-2 rounded-lg transition-colors cursor-pointer',
              isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          {/* Current Balance */}
          <div className={cn(
            'p-4 rounded-xl border text-center',
            isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
          )}>
            <p className={cn('text-xs font-medium uppercase tracking-wide', muted)}>Current Stock</p>
            {isBalanceLoading ? (
              <div className="flex justify-center mt-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              </div>
            ) : (
              <p className={cn(
                'mt-1 text-3xl font-black tabular-nums',
                currentBalance === 0
                  ? 'text-red-500'
                  : currentBalance <= (item.reorder_point ?? 0)
                    ? 'text-amber-500'
                    : isDark ? 'text-emerald-400' : 'text-emerald-600'
              )}>{currentBalance}</p>
            )}
            <p className={cn('text-xs mt-1', muted)}>{item.unit_of_measure}</p>
          </div>

          {/* Direction toggle */}
          <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
            <button
              type="button"
              onClick={() => setIsIncrease(true)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors cursor-pointer',
                isIncrease
                  ? isDark
                    ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-500'
                  : isDark
                    ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
              )}
            >
              <Plus className="w-4 h-4" /> Add Stock
            </button>
            <div className="w-px" style={{ backgroundColor: isDark ? '#334155' : '#e2e8f0' }} />
            <button
              type="button"
              onClick={() => setIsIncrease(false)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors cursor-pointer',
                !isIncrease
                  ? isDark
                    ? 'bg-red-600/30 text-red-300 border-red-500'
                    : 'bg-red-50 text-red-700 border-red-500'
                  : isDark
                    ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
              )}
            >
              <Minus className="w-4 h-4" /> Remove Stock
            </button>
          </div>

          {/* Quantity input */}
          <div>
            <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-slate-300' : 'text-slate-700')}>
              Quantity to {isIncrease ? 'add' : 'remove'}
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="number"
                step="any"
                min="0"
                value={quantityInput}
                onChange={(e) => setQuantityInput(e.target.value)}
                placeholder="e.g., 50"
                className={cn(
                  'w-full px-4 py-3 rounded-xl border-2 text-lg font-bold tabular-nums text-center',
                  'focus:outline-none focus:ring-2 transition-all',
                  isIncrease
                    ? 'focus:border-emerald-500 focus:ring-emerald-500/30'
                    : 'focus:border-red-500 focus:ring-red-500/30',
                  inputTheme
                )}
                disabled={adjustMutation.isPending}
                autoFocus
              />
            </div>
          </div>

          {/* Preview */}
          {numericQuantity > 0 && (
            <div className={cn(
              'p-3 rounded-xl border text-sm',
              isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
            )}>
              <div className="flex justify-between">
                <span className={muted}>After adjustment:</span>
                <span className="font-bold tabular-nums">{newBalance} {item.unit_of_measure}</span>
              </div>
            </div>
          )}

          {/* New balance warning */}
          {numericQuantity > 0 && newBalance < 0 && (
            <div className={cn(
              'flex items-start gap-2 p-3 rounded-xl border text-sm',
              isDark ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
            )}>
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Warning: Stock will go negative. Ensure this adjustment is intentional.</span>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className={cn('block text-sm font-medium mb-1.5', isDark ? 'text-slate-300' : 'text-slate-700')}>
              Reason / Notes <span className={cn('text-xs', muted)}>(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g., Physical count correction, damaged goods, etc."
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm outline-none transition resize-none',
                'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                inputTheme
              )}
              disabled={adjustMutation.isPending}
            />
          </div>

          {/* Error */}
          {adjustMutation.isError && (
            <div className={cn(
              'flex items-start gap-2 p-3 rounded-xl border text-sm',
              isDark ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
            )}>
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{adjustMutation.error?.response?.data?.message || 'Failed to adjust stock.'}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={adjustMutation.isPending}
              className={cn(
                'flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all border-2 cursor-pointer',
                isDark
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                'flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2',
                canSubmit
                  ? cn('cursor-pointer', isIncrease
                    ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700'
                    : 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700')
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              )}
            >
              {adjustMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Adjusting...</>
              ) : (
                <>{isIncrease ? 'Add to Stock' : 'Remove from Stock'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryStockAdjustModal;
