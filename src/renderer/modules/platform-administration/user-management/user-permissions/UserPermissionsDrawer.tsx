import React, { useEffect } from 'react';
import {
  Activity,
  CalendarClock,
  Fingerprint,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  User2,
  X,
} from 'lucide-react';
import type { User } from '../../statistics/api/platform-control/PlatformControlTypes';
import {
  cn,
  formatDate,
  formatDateTime,
  formatStatusLabel,
  getInitials,
  getUserDisplayName,
  getUserFullName,
  getUserStatusStyles,
  getVerificationBadgeStyles,
  safeText,
} from './userPermissions.utils';

interface UserPermissionsDrawerProps {
  isDark: boolean;
  user: User | null;
  open: boolean;
  onClose: () => void;
  onOpenStatus: (user: User) => void;
}

const SectionCard: React.FC<{
  isDark: boolean;
  title: string;
  helper?: string;
  children: React.ReactNode;
}> = ({ isDark, title, helper, children }) => (
  <div
    className={cn(
      'rounded-xl border',
      isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-white'
    )}
  >
    <div
      className={cn(
        'border-b px-4 py-3',
        isDark ? 'border-gray-800' : 'border-gray-200'
      )}
    >
      <h4 className="text-sm font-semibold">{title}</h4>
      {helper ? (
        <p className={cn('mt-1 text-xs', isDark ? 'text-gray-500' : 'text-gray-600')}>
          {helper}
        </p>
      ) : null}
    </div>

    <div className="p-4">{children}</div>
  </div>
);

const KeyValue: React.FC<{
  label: string;
  value: React.ReactNode;
  isDark: boolean;
}> = ({ label, value, isDark }) => (
  <div>
    <p
      className={cn(
        'mb-1 text-[11px] font-semibold uppercase tracking-[0.14em]',
        isDark ? 'text-gray-500' : 'text-gray-500'
      )}
    >
      {label}
    </p>
    <div className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-700')}>{value}</div>
  </div>
);

const UserPermissionsDrawer: React.FC<UserPermissionsDrawerProps> = ({
  isDark,
  user,
  open,
  onClose,
  onOpenStatus,
}) => {
  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, open]);

  if (!open || !user) {
    return null;
  }

  const verified = Boolean(user.email_verified_at);

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-black/50"
      />

      <div
        className={cn(
          'absolute right-0 top-0 h-full w-full overflow-y-auto border-l sm:w-[720px]',
          isDark
            ? 'border-gray-800 bg-gray-950 text-white'
            : 'border-gray-200 bg-white text-gray-900'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="User details"
      >
        <div
          className={cn(
            'flex items-start justify-between gap-4 border-b p-5',
            isDark ? 'border-gray-800' : 'border-gray-200'
          )}
        >
          <div className="min-w-0">
            <div className="mb-4 flex items-start gap-4">
              <div
                className={cn(
                  'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-bold',
                  isDark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-100 text-blue-700'
                )}
              >
                {getInitials(getUserDisplayName(user))}
              </div>

              <div className="min-w-0">
                <h3 className="text-lg font-semibold leading-6">
                  {getUserDisplayName(user)}
                </h3>
                <p className={cn('mt-1 text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  {getUserFullName(user)}
                </p>
                <p className={cn('mt-1 text-xs', isDark ? 'text-gray-500' : 'text-gray-600')}>
                  Platform user profile and status governance
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={cn(
                  'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                  getUserStatusStyles(user.status, isDark)
                )}
              >
                {formatStatusLabel(user.status)}
              </span>

              <span
                className={cn(
                  'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                  getVerificationBadgeStyles(verified, isDark)
                )}
              >
                {verified ? 'Email Verified' : 'Email Unverified'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className={cn(
              'rounded-lg border p-2 transition cursor-pointer',
              isDark
                ? 'border-gray-800 hover:bg-gray-900'
                : 'border-gray-200 hover:bg-gray-100'
            )}
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <SectionCard
            isDark={isDark}
            title="Identity Overview"
            helper="Primary name attributes and user identifiers."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <KeyValue
                label="Display Name"
                value={
                  <div className="flex items-center gap-2">
                    <User2 className="h-4 w-4" />
                    {getUserDisplayName(user)}
                  </div>
                }
                isDark={isDark}
              />
              <KeyValue
                label="Legal Name"
                value={getUserFullName(user)}
                isDark={isDark}
              />
              <KeyValue
                label="First Name"
                value={safeText(user.first_name)}
                isDark={isDark}
              />
              <KeyValue
                label="Last Name"
                value={safeText(user.last_name)}
                isDark={isDark}
              />
              <div className="sm:col-span-2">
                <KeyValue
                  label="Global User UUID"
                  value={
                    <div className="flex items-center gap-2 break-all font-mono text-xs sm:text-sm">
                      <Fingerprint className="h-4 w-4 shrink-0" />
                      {safeText(user.global_user_uuid)}
                    </div>
                  }
                  isDark={isDark}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            isDark={isDark}
            title="Contact Information"
            helper="Primary communication channels available for this user."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <KeyValue
                label="Email Address"
                value={
                  <div className="flex items-center gap-2 break-all">
                    <Mail className="h-4 w-4 shrink-0" />
                    {safeText(user.email)}
                  </div>
                }
                isDark={isDark}
              />
              <KeyValue
                label="Phone Number"
                value={
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0" />
                    {safeText(user.phone)}
                  </div>
                }
                isDark={isDark}
              />
            </div>
          </SectionCard>

          <SectionCard
            isDark={isDark}
            title="Verification & Activity"
            helper="Email verification and sign-in recency indicators."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <KeyValue
                label="Verification Status"
                value={
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    {verified ? 'Verified' : 'Not verified'}
                  </div>
                }
                isDark={isDark}
              />
              <KeyValue
                label="Verified At"
                value={formatDateTime(user.email_verified_at)}
                isDark={isDark}
              />
              <KeyValue
                label="Last Login"
                value={
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 shrink-0" />
                    {formatDateTime(user.last_login_at)}
                  </div>
                }
                isDark={isDark}
              />
              <KeyValue
                label="Registered On"
                value={
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 shrink-0" />
                    {formatDate(user.created_at)}
                  </div>
                }
                isDark={isDark}
              />
            </div>
          </SectionCard>

          <SectionCard
            isDark={isDark}
            title="Governance Status"
            helper="Platform moderation and status audit information."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <KeyValue
                label="Current Status"
                value={
                  <span
                    className={cn(
                      'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                      getUserStatusStyles(user.status, isDark)
                    )}
                  >
                    {formatStatusLabel(user.status)}
                  </span>
                }
                isDark={isDark}
              />
              <KeyValue
                label="Status Updated At"
                value={formatDateTime(user.status_set_at)}
                isDark={isDark}
              />
              <div className="sm:col-span-2">
                <KeyValue
                  label="Status Reason"
                  value={safeText(user.status_reason)}
                  isDark={isDark}
                />
              </div>
            </div>
          </SectionCard>
        </div>

        <div
          className={cn(
            'sticky bottom-0 border-t p-5 backdrop-blur',
            isDark
              ? 'border-gray-800 bg-gray-950/90'
              : 'border-gray-200 bg-white/90'
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-600')}>
              Review user identity, verification, and status before making governance changes.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className={cn(
                  'rounded-lg border px-4 py-2 font-medium transition-colors cursor-pointer',
                  isDark
                    ? 'border-gray-800 bg-gray-950 text-gray-300 hover:bg-gray-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                )}
              >
                Close
              </button>

              <button
                onClick={() => onOpenStatus(user)}
                className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
              >
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Update Status
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

UserPermissionsDrawer.displayName = 'UserPermissionsDrawer';

export default UserPermissionsDrawer;
