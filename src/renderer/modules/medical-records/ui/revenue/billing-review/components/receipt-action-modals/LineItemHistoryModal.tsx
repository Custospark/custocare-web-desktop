import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { History, X, User, CalendarClock, Info, CheckCircle, AlertCircle, Clock, Edit, Plus, RefreshCw, Trash2, Minus } from 'lucide-react';
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

  // Helper function to format text (capitalize first letter of each word and replace underscores with spaces)
  const formatText = (text: string): string => {
    if (!text) return '';
    return text
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get icon based on event type
  const getEventIcon = (log: AuditLogEntry) => {
    const eventKey = log.event_key || log.action || '';
    
    if (eventKey.includes('create') || eventKey.includes('add') || eventKey.includes('appended')) 
      return <Plus className="h-4 w-4" />;
    
    if (eventKey.includes('increase')) 
      return <Plus className="h-4 w-4" />;
    
    if (eventKey.includes('decrease')) 
      return <Minus className="h-4 w-4" />;
    
    if (eventKey.includes('remove') || eventKey.includes('delete')) 
      return <Trash2 className="h-4 w-4" />;
    
    if (eventKey.includes('update') || eventKey.includes('edit') || eventKey.includes('adjust')) 
      return <Edit className="h-4 w-4" />;
    
    if (eventKey.includes('refund')) 
      return <RefreshCw className="h-4 w-4" />;
    
    if (eventKey.includes('success') || eventKey.includes('complete')) 
      return <CheckCircle className="h-4 w-4" />;
    
    if (eventKey.includes('error') || eventKey.includes('fail')) 
      return <AlertCircle className="h-4 w-4" />;
    
    return <Clock className="h-4 w-4" />;
  };

  // Get status color based on event type
  const getEventColor = (log: AuditLogEntry) => {
    const eventKey = log.event_key || log.action || '';
    
    if (eventKey.includes('create') || eventKey.includes('add') || eventKey.includes('appended')) 
      return isDark ? 'text-emerald-400' : 'text-emerald-600';
    
    if (eventKey.includes('increase')) 
      return isDark ? 'text-blue-400' : 'text-blue-600';
    
    if (eventKey.includes('decrease')) 
      return isDark ? 'text-amber-400' : 'text-amber-600';
    
    if (eventKey.includes('remove') || eventKey.includes('delete')) 
      return isDark ? 'text-red-400' : 'text-red-600';
    
    if (eventKey.includes('update') || eventKey.includes('edit') || eventKey.includes('adjust')) 
      return isDark ? 'text-purple-400' : 'text-purple-600';
    
    if (eventKey.includes('refund')) 
      return isDark ? 'text-orange-400' : 'text-orange-600';
    
    if (eventKey.includes('success') || eventKey.includes('complete')) 
      return isDark ? 'text-emerald-400' : 'text-emerald-600';
    
    if (eventKey.includes('error') || eventKey.includes('fail')) 
      return isDark ? 'text-red-400' : 'text-red-600';
    
    return isDark ? 'text-gray-400' : 'text-gray-600';
  };

  // Get the display action text
  const getDisplayAction = (log: AuditLogEntry): string => {
    const eventKey = log.event_key || log.action || '';
    
    const actionMap: Record<string, string> = {
      'line_item_created': 'Created',
      'line_item_appended': 'Appended',
      'line_item_quantity_increased': 'Increased',
      'line_item_quantity_decreased': 'Decreased',
      'line_item_removed': 'Removed',
      'line_item_updated': 'Updated',
      'billing_cycle_created': 'Created',
      'billing_cycle_updated': 'Updated',
      'billing_cycle_updated_after_line_item_adjustment': 'Adjusted',
    };
    
    return actionMap[eventKey] || formatText(eventKey);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            className="fixed inset-0 z-[120] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className={`fixed left-1/2 top-1/2 z-[121] w-[95vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border shadow-2xl ${
              isDark ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-900'
            }`}
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
          >
            {/* Header */}
            <div className={`flex items-center justify-between border-b px-6 py-5 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`rounded-xl p-2 ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Line Item History</h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {itemName || 'Charge item'} - Full activity timeline
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

            {/* Content */}
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              {logs.length === 0 ? (
                <div className={`rounded-xl border p-8 text-center text-sm ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                  <div className="flex flex-col items-center gap-3">
                    <div className={`rounded-full p-3 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <History className="h-6 w-6 opacity-50" />
                    </div>
                    <div>
                      <p className="font-medium">No audit history available</p>
                      <p className="text-xs mt-1">This line item has no recorded changes yet.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Vertical timeline line */}
                  <div className={`absolute left-[19px] top-0 h-full w-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                  
                  <div className="space-y-6">
                    {logs.map((log, index) => (
                      <motion.div
                        key={log.audit_uuid || index}
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
                              <h4 className="text-sm font-bold">{log.title || formatText(log.event_key || '')}</h4>
                            </div>
                            
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {getDisplayAction(log)}
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
                              <span className="truncate">{log.reason || log.why || 'No reason provided'}</span>
                            </div>
                          </div>

                          {/* Quantity and pricing change indicator */}
                          {log.before && log.after && (log.before.quantity !== undefined || log.after.quantity !== undefined) && (
                            <div className={`mt-3 pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                              <div className="flex flex-wrap items-center gap-4 text-xs">
                                {log.before.quantity !== undefined && log.after.quantity !== undefined && (
                                  <div className="flex items-center gap-2">
                                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Quantity:</span>
                                    <span className="line-through opacity-60">{log.before.quantity}</span>
                                    <span>→</span>
                                    <span className="font-semibold text-sm">{log.after.quantity}</span>
                                  </div>
                                )}
                                {log.before.unit_price_at_time !== undefined && log.after.unit_price_at_time !== undefined && (
                                  <div className="flex items-center gap-2">
                                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Unit Price:</span>
                                    <span className="line-through opacity-60">{formatCurrency(log.before.unit_price_at_time)}</span>
                                    <span>→</span>
                                    <span className="font-semibold text-sm">{formatCurrency(log.after.unit_price_at_time)}</span>
                                  </div>
                                )}
                                {log.before.line_total_amount !== undefined && log.after.line_total_amount !== undefined && (
                                  <div className="flex items-center gap-2">
                                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Total:</span>
                                    <span className="line-through opacity-60">{formatCurrency(log.before.line_total_amount)}</span>
                                    <span>→</span>
                                    <span className="font-semibold text-sm">{formatCurrency(log.after.line_total_amount)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Changed fields - COMMENTED OUT */}
                          {/* {log.changed_fields && log.changed_fields.length > 0 && (
                            <div className="mt-3">
                              <p className={`mb-2 text-[11px] font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Changed Fields
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {log.changed_fields.map((field) => (
                                  <span
                                    key={field}
                                    className={`rounded-full px-2 py-1 text-[10px] ${
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

            {/* Footer */}
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

export default LineItemHistoryModal;