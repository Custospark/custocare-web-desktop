import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';
import type { Facility } from '../../statistics/api/platform-control/PlatformControlTypes';
import {
  cn,
  FACILITY_STATUS_OPTIONS,
  formatStatusLabel,
} from './facilityGovernance.utils';

interface FacilityGovernanceStatusModalProps {
  isDark: boolean;
  open: boolean;
  facility: Facility | null;
  isSubmitting: boolean;
  errorMessage?: string;
  onClose: () => void;
  onSubmit: (payload: { status: Facility['status']; reason?: string }) => Promise<void> | void;
}

const FacilityGovernanceStatusModal: React.FC<FacilityGovernanceStatusModalProps> = ({
  isDark,
  open,
  facility,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}) => {
  const [status, setStatus] = useState<Facility['status']>('active');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (facility && open) {
      setStatus(facility.status);
      setReason(facility.status_reason ?? '');
    }
  }, [facility, open]);

  const handleSubmit = async () => {
    if (!facility) return;
    await onSubmit({
      status,
      reason: reason.trim() || undefined,
    });
  };

  return (
    <AnimatePresence>
      {open && facility && (
        <>
          <motion.div
            className={cn(
              'fixed inset-0 z-50 cursor-pointer bg-slate-950/55 backdrop-blur-sm',
              !isSubmitting && 'cursor-pointer'
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isSubmitting ? undefined : onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.24 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          >
            <div
              className={cn(
                'w-full max-w-xl rounded-3xl border p-6 shadow-2xl',
                isDark
                  ? 'border-white/10 bg-slate-950 text-white'
                  : 'border-slate-200 bg-white text-slate-900'
              )}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div
                    className={cn(
                      'mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]',
                      isDark ? 'border-white/10 text-slate-300' : 'border-slate-200 text-slate-600'
                    )}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Status Governance
                  </div>

                  <h3 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-blue-950')}>
                    Update Facility Status
                  </h3>
                  <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
                    {facility.name} • current status: {formatStatusLabel(facility.status)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className={cn(
                    'cursor-pointer inline-flex h-11 w-11 items-center justify-center rounded-2xl transition-all',
                    isDark
                      ? 'bg-white/5 text-slate-200 hover:bg-white/10'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                    isSubmitting && 'cursor-not-allowed opacity-60'
                  )}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {errorMessage && (
                <div
                  className={cn(
                    'mb-4 flex items-start gap-3 rounded-2xl border px-4 py-3',
                    isDark
                      ? 'border-rose-500/20 bg-rose-500/10 text-rose-200'
                      : 'border-rose-200 bg-rose-50 text-rose-700'
                  )}
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-sm">{errorMessage}</p>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label
                    className={cn(
                      'mb-2 block text-xs font-semibold uppercase tracking-[0.14em]',
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    )}
                  >
                    New Status
                  </label>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {FACILITY_STATUS_OPTIONS.map((option) => {
                      const active = status === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setStatus(option.value)}
                          className={cn(
                            'cursor-pointer rounded-2xl px-4 py-3 text-sm font-semibold transition-all',
                            active
                              ? isDark
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-900 text-white'
                              : isDark
                              ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    className={cn(
                      'mb-2 block text-xs font-semibold uppercase tracking-[0.14em]',
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    )}
                  >
                    Status Reason
                  </label>
                  <textarea
                    rows={5}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter governance rationale for this status change"
                    className={cn(
                      'w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all',
                      isDark
                        ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500'
                        : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
                    )}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className={cn(
                    'cursor-pointer rounded-2xl px-5 py-3 text-sm font-semibold transition-all',
                    isDark
                      ? 'bg-white/5 text-slate-200 hover:bg-white/10'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                    isSubmitting && 'cursor-not-allowed opacity-60'
                  )}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={cn(
                    'cursor-pointer rounded-2xl px-5 py-3 text-sm font-semibold transition-all',
                    isSubmitting
                      ? isDark
                        ? 'cursor-not-allowed bg-blue-600/60 text-white'
                        : 'cursor-not-allowed bg-slate-800/70 text-white'
                      : isDark
                      ? 'bg-blue-600 text-white hover:bg-blue-500'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  )}
                >
                  {isSubmitting ? 'Updating Status...' : 'Confirm Status Update'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FacilityGovernanceStatusModal;