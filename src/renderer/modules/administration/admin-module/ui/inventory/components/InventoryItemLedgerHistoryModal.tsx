import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  History, X, User, CalendarClock, Info,
  Plus, Edit, Clock, AlertCircle, RefreshCw, Trash2,
} from 'lucide-react';
import type { LedgerHistoryEntry } from '../../../api/admin-inventory/inventoryItemTypes';

interface Props {
  open: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  itemName?: string;
  logs?: LedgerHistoryEntry[];
  isLoading?: boolean;
}

export const InventoryItemLedgerHistoryModal: React.FC<Props> = ({
  open,
  onClose,
  theme = 'light',
  itemName,
  logs = [],
  isLoading = false,
}) => {
  const isDark = theme === 'dark';

  const getTransactionIcon = (entry: LedgerHistoryEntry) => {
    if (entry.is_incoming) return <Plus className="h-4 w-4" />;
    if (entry.transaction_type === 'adjustment_decrease') return <Edit className="h-4 w-4" />;
    if (['expired', 'damaged', 'stolen', 'recalled'].includes(entry.transaction_type))
      return <AlertCircle className="h-4 w-4" />;
    if (entry.transaction_type === 'cycle_count') return <RefreshCw className="h-4 w-4" />;
    if (entry.transaction_type === 'return_to_supplier') return <Trash2 className="h-4 w-4" />;
    if (entry.transaction_type === 'consumption_waste') return <AlertCircle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const getTransactionColor = (entry: LedgerHistoryEntry) => {
    if (entry.is_incoming) return isDark ? 'text-emerald-400' : 'text-emerald-600';
    if (['expired', 'damaged', 'stolen', 'recalled'].includes(entry.transaction_type))
      return isDark ? 'text-red-400' : 'text-red-600';
    if (entry.transaction_type === 'cycle_count') return isDark ? 'text-purple-400' : 'text-purple-600';
    return isDark ? 'text-amber-400' : 'text-amber-600';
  };

  const getActionBadge = (entry: LedgerHistoryEntry): string => {
    const labels: Record<string, string> = {
      purchase: 'Purchase',
      adjustment_increase: 'Stock Added',
      adjustment_decrease: 'Adjusted',
      consumption_visit: 'Consumed',
      consumption_waste: 'Wasted',
      return_to_supplier: 'Returned',
      transfer_in: 'Transfer In',
      transfer_out: 'Transfer Out',
      cycle_count: 'Counted',
      expired: 'Expired',
      damaged: 'Damaged',
      stolen: 'Stolen',
      recalled: 'Recalled',
    };
    return labels[entry.transaction_type] || entry.transaction_type_label || entry.transaction_type;
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[120] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className={`fixed left-1/2 top-1/2 z-[121] w-[95vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border shadow-2xl ${
              isDark ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-900'
            }`}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
          >
            <div className={`flex items-center justify-between border-b px-6 py-5 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`rounded-xl p-2 ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Stock Movement History</h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {itemName || 'Inventory item'} - Full transaction timeline
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className={`rounded-lg p-2 transition ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              {isLoading ? (
                <div className={`flex items-center justify-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Clock className="h-5 w-5 animate-spin mr-2" />
                  Loading history...
                </div>
              ) : logs.length === 0 ? (
                <div className={`rounded-xl border p-8 text-center text-sm ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                  <div className="flex flex-col items-center gap-3">
                    <div className={`rounded-full p-3 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <History className="h-6 w-6 opacity-50" />
                    </div>
                    <div>
                      <p className="font-medium">No transaction history available</p>
                      <p className="text-xs mt-1">This item has no recorded stock movements yet.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className={`absolute left-[19px] top-0 h-full w-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />

                  <div className="space-y-6">
                    {logs.map((entry, index) => (
                      <motion.div
                        key={entry.transaction_uuid || entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative flex gap-4"
                      >
                        <div className="relative z-10 flex-shrink-0">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                            isDark
                              ? `bg-gray-800 border-gray-600 ${getTransactionColor(entry)}`
                              : `bg-white border-gray-300 ${getTransactionColor(entry)}`
                          }`}>
                            {getTransactionIcon(entry)}
                          </div>
                        </div>

                        <div className={`flex-1 rounded-xl border p-4 transition-all hover:shadow-md ${
                          isDark ? 'border-gray-700 bg-gray-800/50 hover:bg-gray-800/70' : 'border-gray-200 bg-gray-50 hover:bg-white'
                        }`}>
                          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                entry.is_incoming
                                  ? isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                                  : isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {entry.transaction_type_label || entry.transaction_type}
                              </span>
                              <span className={`text-sm font-bold tabular-nums ${
                                entry.is_incoming
                                  ? isDark ? 'text-emerald-300' : 'text-emerald-700'
                                  : isDark ? 'text-red-300' : 'text-red-700'
                              }`}>
                                {entry.is_incoming ? '+' : ''}{entry.quantity_change}
                                <span className={`text-xs ml-1 font-normal ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {entry.unit_of_measure}
                                </span>
                              </span>
                              <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                → Balance: {entry.balance_after_transaction}
                              </span>
                            </div>

                            <span className={`text-xs px-2 py-0.5 rounded ${
                              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {getActionBadge(entry)}
                            </span>
                          </div>

                          {entry.transaction_notes && (
                            <p className={`mb-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                              {entry.transaction_notes}
                            </p>
                          )}

                          <div className={`grid gap-2 text-xs border-t pt-3 ${isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'} sm:grid-cols-3`}>
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">
                                {entry.performed_by_staff
                                  ? `${entry.performed_by_staff.staff_name || 'Unknown'} (${entry.performed_by_staff.staff_uuid})`
                                  : entry.performed_by_staff_id
                                    ? `Staff #${entry.performed_by_staff_id}`
                                    : 'System'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <CalendarClock className="h-3.5 w-3.5 flex-shrink-0" />
                              <span>
                                {entry.transaction_timestamp
                                  ? new Date(entry.transaction_timestamp).toLocaleString()
                                  : 'Unknown'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Info className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">
                                {entry.transaction_cause_label || entry.transaction_cause || 'No reason provided'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={`border-t px-6 py-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={onClose}
                className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InventoryItemLedgerHistoryModal;
