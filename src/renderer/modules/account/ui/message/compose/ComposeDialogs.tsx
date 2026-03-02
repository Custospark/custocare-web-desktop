/**
 * ============================================================================
 * COMPOSE DIALOGS COMPONENT
 * ============================================================================
 * Renders:
 *  1. Discard Confirmation modal
 *  2. Schedule Send picker modal (with quick-select presets)
 */

import React, { useState, useCallback } from 'react';
import {
  AlertCircle, Clock, X, Calendar, ChevronRight, Trash2, Send,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../../../../shared/utils/classNameUtils';
/* ─────────────────────────────────────────────────────────────────
   1. DISCARD CONFIRMATION DIALOG
───────────────────────────────────────────────────────────────── */
interface DiscardDialogProps {
  theme: 'light' | 'dark';
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DiscardDialog: React.FC<DiscardDialogProps> = ({
  theme,
  open,
  onConfirm,
  onCancel,
}) => {
  const isDark = theme === 'dark';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className={cn(
              'max-w-sm w-full rounded-2xl border-2 p-6 shadow-2xl',
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
            )}
          >
            {/* Header */}
            <div className="flex items-start gap-3 mb-5">
              <div
                className={cn(
                  'p-2.5 rounded-full shrink-0',
                  isDark ? 'bg-red-900/30' : 'bg-red-100',
                )}
              >
                <Trash2
                  className={cn(
                    'w-5 h-5',
                    isDark ? 'text-red-400' : 'text-red-600',
                  )}
                />
              </div>

              <div className="min-w-0">
                <h3 className="text-base font-semibold">Discard this draft?</h3>
                <p
                  className={cn(
                    'text-sm mt-1 leading-relaxed',
                    isDark ? 'text-gray-400' : 'text-gray-600',
                  )}
                >
                  Your message and all attached files will be permanently
                  removed. This cannot be undone.
                </p>
              </div>

              <button
                onClick={onCancel}
                className={cn(
                  'ml-auto p-1 rounded-lg shrink-0 cursor-pointer transition-colors',
                  isDark
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700',
                )}
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={onCancel}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium border-2 cursor-pointer transition-colors',
                  isDark
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-100',
                )}
              >
                Keep editing
              </button>
              <button
                onClick={onConfirm}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-colors',
                  'bg-red-600 hover:bg-red-700 text-white',
                )}
              >
                Yes, discard
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ─────────────────────────────────────────────────────────────────
   2. SCHEDULE SEND DIALOG
───────────────────────────────────────────────────────────────── */
interface ScheduleDialogProps {
  theme: 'light' | 'dark';
  open: boolean;
  currentSchedule?: Date | null;
  onSchedule: (date: Date) => void;
  onRemoveSchedule: () => void;
  onCancel: () => void;
}

const QUICK_PRESETS = [
  {
    label: 'In 1 hour',
    getDate: () => {
      const d = new Date();
      d.setHours(d.getHours() + 1, 0, 0, 0);
      return d;
    },
  },
  {
    label: 'Later today (5 PM)',
    getDate: () => {
      const d = new Date();
      d.setHours(17, 0, 0, 0);
      if (d <= new Date()) d.setDate(d.getDate() + 1);
      return d;
    },
  },
  {
    label: 'Tomorrow morning (9 AM)',
    getDate: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d;
    },
  },
  {
    label: 'Monday morning (9 AM)',
    getDate: () => {
      const d = new Date();
      const day = d.getDay();
      const daysUntilMonday = day === 0 ? 1 : 8 - day;
      d.setDate(d.getDate() + daysUntilMonday);
      d.setHours(9, 0, 0, 0);
      return d;
    },
  },
  {
    label: 'Next week (Mon 9 AM)',
    getDate: () => {
      const d = new Date();
      const day = d.getDay();
      const daysUntilMonday = day === 0 ? 1 : 8 - day;
      d.setDate(d.getDate() + daysUntilMonday + 7);
      d.setHours(9, 0, 0, 0);
      return d;
    },
  },
];

const toInputDate = (d: Date) => d.toISOString().split('T')[0];
const toInputTime = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export const ScheduleDialog: React.FC<ScheduleDialogProps> = ({
  theme,
  open,
  currentSchedule,
  onSchedule,
  onRemoveSchedule,
  onCancel,
}) => {
  const isDark = theme === 'dark';
  const todayStr = toInputDate(new Date());

  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [customDate, setCustomDate] = useState<string>(
    currentSchedule ? toInputDate(currentSchedule) : todayStr,
  );
  const [customTime, setCustomTime] = useState<string>(
    currentSchedule ? toInputTime(currentSchedule) : '09:00',
  );

  const buildCustomDate = useCallback((): Date | null => {
    if (!customDate) return null;
    const [hours, minutes] = customTime.split(':').map(Number);
    const d = new Date(customDate);
    d.setHours(hours, minutes, 0, 0);
    return d;
  }, [customDate, customTime]);

  const handlePreset = (preset: typeof QUICK_PRESETS[0]) => {
    onSchedule(preset.getDate());
  };

  const handleCustomSubmit = () => {
    const d = buildCustomDate();
    if (d && d > new Date()) onSchedule(d);
  };

  const customDateValid = (() => {
    const d = buildCustomDate();
    return d !== null && d > new Date();
  })();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className={cn(
              'max-w-sm w-full rounded-2xl border-2 shadow-2xl overflow-hidden',
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
            )}
          >
            {/* Header */}
            <div
              className={cn(
                'flex items-center justify-between px-5 py-4 border-b',
                isDark ? 'border-gray-700' : 'border-gray-100',
              )}
            >
              <div className="flex items-center gap-2">
                <Clock className={cn('w-4 h-4', isDark ? 'text-blue-400' : 'text-blue-600')} />
                <h3 className="text-base font-semibold">Schedule Send</h3>
              </div>
              <button
                onClick={onCancel}
                className={cn(
                  'p-1 rounded-lg cursor-pointer transition-colors',
                  isDark
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                    : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700',
                )}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode tabs */}
            <div
              className={cn(
                'flex border-b',
                isDark ? 'border-gray-700' : 'border-gray-100',
              )}
            >
              {(['preset', 'custom'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'flex-1 py-2.5 text-sm font-medium cursor-pointer transition-colors',
                    mode === m
                      ? isDark
                        ? 'text-blue-400 border-b-2 border-blue-500'
                        : 'text-blue-600 border-b-2 border-blue-500'
                      : isDark
                        ? 'text-gray-400 hover:text-gray-200'
                        : 'text-gray-500 hover:text-gray-700',
                  )}
                >
                  {m === 'preset' ? '⚡ Quick' : '🗓 Custom'}
                </button>
              ))}
            </div>

            <div className="p-4">
              {/* Quick presets */}
              {mode === 'preset' && (
                <div className="space-y-1.5">
                  {QUICK_PRESETS.map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => handlePreset(preset)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm cursor-pointer transition-colors',
                        isDark
                          ? 'hover:bg-blue-600/20 text-gray-200 hover:text-blue-300'
                          : 'hover:bg-blue-50 text-gray-700 hover:text-blue-700',
                      )}
                    >
                      <span>{preset.label}</span>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </button>
                  ))}
                </div>
              )}

              {/* Custom date/time picker */}
              {mode === 'custom' && (
                <div className="space-y-3">
                  <div>
                    <label
                      className={cn(
                        'block text-xs font-semibold mb-1.5',
                        isDark ? 'text-gray-400' : 'text-gray-600',
                      )}
                    >
                      <Calendar className="inline w-3.5 h-3.5 mr-1" />
                      Date
                    </label>
                    <input
                      type="date"
                      value={customDate}
                      onChange={e => setCustomDate(e.target.value)}
                      min={todayStr}
                      className={cn(
                        'w-full px-3 py-2 rounded-xl border-2 text-sm outline-none cursor-pointer',
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                          : 'bg-white border-gray-200 text-gray-900 focus:border-blue-400',
                      )}
                    />
                  </div>
                  <div>
                    <label
                      className={cn(
                        'block text-xs font-semibold mb-1.5',
                        isDark ? 'text-gray-400' : 'text-gray-600',
                      )}
                    >
                      <Clock className="inline w-3.5 h-3.5 mr-1" />
                      Time
                    </label>
                    <input
                      type="time"
                      value={customTime}
                      onChange={e => setCustomTime(e.target.value)}
                      className={cn(
                        'w-full px-3 py-2 rounded-xl border-2 text-sm outline-none cursor-pointer',
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                          : 'bg-white border-gray-200 text-gray-900 focus:border-blue-400',
                      )}
                    />
                  </div>

                  {!customDateValid && customDate && (
                    <p className="text-xs text-amber-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Please select a future date and time.
                    </p>
                  )}

                  <button
                    onClick={handleCustomSubmit}
                    disabled={!customDateValid}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-colors',
                      'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed',
                    )}
                  >
                    <Send className="w-4 h-4" />
                    Schedule for {customDate
                      ? new Date(`${customDate}T${customTime}`).toLocaleString([], {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })
                      : '…'}
                  </button>
                </div>
              )}
            </div>

            {/* Remove schedule footer */}
            {currentSchedule && (
              <div
                className={cn(
                  'px-4 pb-4 pt-0',
                )}
              >
                <button
                  onClick={onRemoveSchedule}
                  className={cn(
                    'w-full text-sm py-2 rounded-xl border cursor-pointer transition-colors flex items-center justify-center gap-1.5',
                    isDark
                      ? 'border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700',
                  )}
                >
                  <X className="w-3.5 h-3.5" /> Remove schedule
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
