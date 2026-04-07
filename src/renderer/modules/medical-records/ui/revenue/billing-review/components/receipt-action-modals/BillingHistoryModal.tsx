import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { History, X, User, CalendarClock, Info, CheckCircle, AlertCircle, Clock, Edit, Plus, RefreshCw } from 'lucide-react';
import type { AuditLogEntry } from '../../../../../api/billing-review/BillingReviewTypes';

interface BillingHistoryModalProps {
  open: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  title?: string;
  logs?: AuditLogEntry[];
}

export const BillingHistoryModal: React.FC<BillingHistoryModalProps> = ({
  open,
  onClose,
  theme = 'light',
  title = 'Billing Cycle History',
  logs = [],
}) => {
  const isDark = theme === 'dark';

  // Helper function to capitalize first letter of each word and replace underscores with spaces
  const formatText = (text: string): string => {
    return text
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Get icon based on event type
  const getEventIcon = (log: AuditLogEntry) => {
    const eventKey = log.event_key || '';
    if (eventKey.includes('create') || eventKey.includes('add')) return <Plus className="h-4 w-4" />;
    if (eventKey.includes('update') || eventKey.includes('edit')) return <Edit className="h-4 w-4" />;
    if (eventKey.includes('refund')) return <RefreshCw className="h-4 w-4" />;
    if (eventKey.includes('success') || eventKey.includes('complete')) return <CheckCircle className="h-4 w-4" />;
    if (eventKey.includes('error') || eventKey.includes('fail')) return <AlertCircle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  // Get status color based on event type
  const getEventColor = (log: AuditLogEntry) => {
    const eventKey = log.event_key || '';
    if (eventKey.includes('create') || eventKey.includes('add')) return isDark ? 'text-green-400' : 'text-green-600';
    if (eventKey.includes('update') || eventKey.includes('edit')) return isDark ? 'text-blue-400' : 'text-blue-600';
    if (eventKey.includes('refund')) return isDark ? 'text-orange-400' : 'text-orange-600';
    if (eventKey.includes('success') || eventKey.includes('complete')) return isDark ? 'text-emerald-400' : 'text-emerald-600';
    if (eventKey.includes('error') || eventKey.includes('fail')) return isDark ? 'text-red-400' : 'text-red-600';
    return isDark ? 'text-gray-400' : 'text-gray-600';
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
            className={`fixed left-1/2 top-1/2 z-[121] w-[95vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border shadow-2xl ${
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
                  <h3 className="text-lg font-bold">{title}</h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Full billing cycle activity, including line item actions
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
              {logs.length === 0 ? (
                <div className={`rounded-xl border p-8 text-center text-sm ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                  No audit history available for this billing cycle yet.
                </div>
              ) : (
                <div className="relative">
                  {/* Vertical timeline line */}
                  <div className={`absolute left-[19px] top-0 h-full w-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                  
                  <div className="space-y-6">
                    {logs.map((log, index) => (
                      <motion.div
                        key={log.audit_uuid}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative flex gap-4"
                      >
                        {/* Timeline node */}
                        <div className="relative z-10 flex-shrink-0">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                            isDark 
                              ? `bg-gray-800 border-gray-600 ${getEventColor(log)}`
                              : `bg-white border-gray-300 ${getEventColor(log)}`
                          }`}>
                            {getEventIcon(log)}
                          </div>
                        </div>

                        {/* Timeline content */}
                        <div className={`flex-1 rounded-xl border p-4 transition-all hover:shadow-md ${
                          isDark ? 'border-gray-700 bg-gray-800/50 hover:bg-gray-800/70' : 'border-gray-200 bg-gray-50 hover:bg-white'
                        }`}>
                          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                log.scope === 'line_item'
                                  ? isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'
                                  : isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {log.scope === 'line_item' ? 'Line Item' : 'Billing Cycle'}
                              </span>
                              <h4 className="text-sm font-bold">{log.title}</h4>
                            </div>
                            
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {log.action}
                            </span>
                          </div>

                          {log.description && (
                            <p className={`mb-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                              {log.description}
                            </p>
                          )}

                          <div className={`grid gap-2 text-xs border-t pt-3 ${isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-600'} sm:grid-cols-3`}>
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{log.performed_by?.display || log.performed_by?.name || 'System'}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <CalendarClock className="h-3.5 w-3.5 flex-shrink-0" />
                              <span>{log.performed_at ? new Date(log.performed_at).toLocaleString() : 'Unknown time'}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Info className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{log.why ? formatText(log.why) : 'No reason provided'}</span>
                            </div>
                          </div>

                          {/* {!!log.changed_fields?.length && (
                            <div className="mt-3">
                              <p className={`mb-2 text-[11px] font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Changed Fields
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {log.changed_fields.map((field) => (
                                  <span
                                    key={field}
                                    className={`rounded-full px-2 py-1 text-[11px] ${
                                      isDark ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-700 border border-gray-200'
                                    }`}
                                  >
                                    {formatText(field)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )} */}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BillingHistoryModal;