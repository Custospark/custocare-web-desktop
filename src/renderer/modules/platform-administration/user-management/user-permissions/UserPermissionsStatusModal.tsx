import React, { useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';
import type { User } from '../../statistics/api/platform-control/PlatformControlTypes';
import {
  cn,
  formatStatusLabel,
  USER_STATUS_OPTIONS,
} from './userPermissions.utils';

interface UserPermissionsStatusModalProps {
  isDark: boolean;
  open: boolean;
  user: User | null;
  isSubmitting: boolean;
  errorMessage?: string;
  onClose: () => void;
  onSubmit: (payload: { status: User['status']; reason?: string }) => Promise<void> | void;
}

const UserPermissionsStatusModal: React.FC<UserPermissionsStatusModalProps> = ({
  isDark,
  open,
  user,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}) => {
  const [status, setStatus] = useState<User['status']>('active');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (user && open) {
      setStatus(user.status);
      setReason(user.status_reason ?? '');
    }
  }, [user, open]);

  if (!open || !user) {
    return null;
  }

  const handleSubmit = async () => {
    await onSubmit({
      status,
      reason: reason.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        aria-label="Close"
        onClick={isSubmitting ? undefined : onClose}
        className="absolute inset-0 cursor-pointer bg-slate-950/55 backdrop-blur-sm"
      />

      <div className="absolute inset-0 flex items-center justify-center p-4">
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
                User Governance
              </div>

              <h3 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-blue-950')}>
                Update User Status
              </h3>

              <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
                {user.display_name || user.first_name || user.email || `User #${user.id}`} •
                current status: {formatStatusLabel(user.status)}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={cn(
                'inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl transition-all',
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
                {USER_STATUS_OPTIONS.map((option) => {
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
                placeholder="Enter a governance reason for this user status change"
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
      </div>
    </div>
  );
};

export default UserPermissionsStatusModal;
