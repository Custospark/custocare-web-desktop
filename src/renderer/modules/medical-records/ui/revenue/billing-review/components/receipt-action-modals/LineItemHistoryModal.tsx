import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, X, User, CalendarClock, Info } from 'lucide-react';
import type { AuditLogEntry } from '../../../../../api/billing-review/BillingReviewTypes';

interface LineItemHistoryModalProps {
  open: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  itemName?: string;
  logs?: AuditLogEntry[];
}

export const LineItemHistoryModal: React.FC<LineItemHistoryModalProps> = ({
  open,
  onClose,
  theme = 'light',
  itemName,
  logs = [],
}) => {
  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[130] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className={`fixed left-1/2 top-1/2 z-[131] w-[95vw] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border shadow-2xl ${
              isDark ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-900'
            }`}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
          >
            <div className={`flex items-center justify-between border-b px-5 py-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`rounded-xl p-2 ${isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Line Item History</h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {itemName || 'Charge item'} activity timeline
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

            <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
              {logs.length === 0 ? (
                <div className={`rounded-xl border p-6 text-center text-sm ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                  No audit history available for this line item yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div
                      key={log.audit_uuid}
                      className={`rounded-xl border p-4 ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}
                    >
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold">{log.title}</h4>
                          {log.description && (
                            <p className={`mt-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                              {log.description}
                            </p>
                          )}
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          isDark ? 'bg-gray-700 text-gray-200' : 'bg-white border border-gray-200 text-gray-700'
                        }`}>
                          {log.action}
                        </span>
                      </div>

                      <div className={`grid gap-2 text-xs sm:grid-cols-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5" />
                          <span>{log.performed_by?.display || log.performed_by?.name || 'System'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <CalendarClock className="h-3.5 w-3.5" />
                          <span>{log.performed_at ? new Date(log.performed_at).toLocaleString() : 'Unknown time'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Info className="h-3.5 w-3.5" />
                          <span>{log.why || 'No reason provided'}</span>
                        </div>
                      </div>

                      {!!log.changed_fields?.length && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {log.changed_fields.map((field) => (
                            <span
                              key={field}
                              className={`rounded-full px-2 py-1 text-[11px] ${
                                isDark ? 'bg-gray-700 text-gray-200' : 'bg-white border border-gray-200 text-gray-700'
                              }`}
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LineItemHistoryModal;
