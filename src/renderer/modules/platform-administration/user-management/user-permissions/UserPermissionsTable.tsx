import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Shield } from 'lucide-react';
import type {
  User,
  UsersResponse,
} from '../../statistics/api/platform-control/PlatformControlTypes';
import { InfoPill, PaginationControls } from './userPermissions.primitives';
import {
  cn,
  formatDate,
  formatDateTime,
  formatNumber,
  formatStatusLabel,
  getUserDisplayName,
  getUserFullName,
  getUserStatusStyles,
  getVerificationBadgeStyles,
  getPanelClass,
  getSubtlePanelClass,
  safeText,
} from './userPermissions.utils';

interface UserPermissionsTableProps {
  isDark: boolean;
  users: User[];
  meta?: UsersResponse['meta'];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  isFetching: boolean;
  onPageChange: (page: number) => void;
  onViewDetails: (user: User) => void;
  onOpenStatus: (user: User) => void;
}

const UserPermissionsTable: React.FC<UserPermissionsTableProps> = ({
  isDark,
  users,
  meta,
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  isFetching,
  onPageChange,
  onViewDetails,
  onOpenStatus,
}) => {
  const panelClass = getPanelClass(isDark);
  const subtlePanelClass = getSubtlePanelClass(isDark);
  const counts = meta?.user_counts;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08 }}
      className={cn(panelClass, 'p-6')}
    >
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
            Platform Users Registry
          </h2>
          <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
            Review all platform users, account identity, verification posture, login activity,
            and governance status actions.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <InfoPill
            isDark={isDark}
            label="Total"
            value={formatNumber(counts?.total ?? totalItems)}
          />
          <InfoPill
            isDark={isDark}
            label="Active"
            value={formatNumber(counts?.active ?? 0)}
          />
          <InfoPill
            isDark={isDark}
            label="Suspended"
            value={formatNumber(counts?.suspended ?? 0)}
          />
          <InfoPill
            isDark={isDark}
            label="Banned"
            value={formatNumber(counts?.banned ?? 0)}
          />
        </div>
      </div>

      <div className={cn(subtlePanelClass, 'overflow-hidden')}>
        <div className="overflow-x-auto">
          <table className="min-w-[1380px] w-full">
            <thead>
              <tr className={cn(isDark ? 'bg-white/[0.03]' : 'bg-slate-50')}>
                {[
                  'User',
                  'Contact',
                  'User UUID',
                  'Verification / Activity',
                  'Status',
                  'Registered On',
                  'Actions',
                ].map((header) => (
                  <th
                    key={header}
                    className={cn(
                      'px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em]',
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    )}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {users.map((user) => {
                const verified = Boolean(user.email_verified_at);

                return (
                  <tr
                    key={user.id}
                    className={cn(
                      'border-t align-top',
                      isDark
                        ? 'border-white/10 hover:bg-white/[0.02]'
                        : 'border-slate-200 hover:bg-slate-50/70'
                    )}
                  >
                    <td className="px-5 py-4">
                      <div className="min-w-[220px]">
                        <p
                          className={cn(
                            'text-sm font-semibold',
                            isDark ? 'text-white' : 'text-slate-900'
                          )}
                        >
                          {getUserDisplayName(user)}
                        </p>

                        <p
                          className={cn(
                            'mt-1 text-xs',
                            isDark ? 'text-slate-400' : 'text-slate-600'
                          )}
                        >
                          Legal name: {getUserFullName(user)}
                        </p>

                        <p
                          className={cn(
                            'mt-1 text-xs',
                            isDark ? 'text-slate-500' : 'text-slate-500'
                          )}
                        >
                          User ID: {user.id}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="min-w-[220px] space-y-1">
                        <p
                          className={cn(
                            'break-all text-sm',
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          )}
                        >
                          {safeText(user.email)}
                        </p>
                        <p
                          className={cn(
                            'text-xs',
                            isDark ? 'text-slate-400' : 'text-slate-600'
                          )}
                        >
                          {safeText(user.phone)}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="min-w-[220px]">
                        <p
                          className={cn(
                            'break-all font-mono text-xs',
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          )}
                        >
                          {safeText(user.global_user_uuid)}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="min-w-[220px] space-y-3">
                        <span
                          className={cn(
                            'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                            getVerificationBadgeStyles(verified, isDark)
                          )}
                        >
                          {verified ? 'Email Verified' : 'Email Unverified'}
                        </span>

                        <div
                          className={cn(
                            'space-y-1 text-xs',
                            isDark ? 'text-slate-400' : 'text-slate-600'
                          )}
                        >
                          <p>Verified At: {formatDateTime(user.email_verified_at)}</p>
                          <p>Last Login: {formatDateTime(user.last_login_at)}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="min-w-[220px] space-y-3">
                        <span
                          className={cn(
                            'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                            getUserStatusStyles(user.status, isDark)
                          )}
                        >
                          {formatStatusLabel(user.status)}
                        </span>

                        <div
                          className={cn(
                            'space-y-1 text-xs',
                            isDark ? 'text-slate-500' : 'text-slate-500'
                          )}
                        >
                          <p>Reason: {safeText(user.status_reason)}</p>
                          <p>Updated: {formatDateTime(user.status_set_at)}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="min-w-[120px]">
                        <p
                          className={cn(
                            'text-sm',
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          )}
                        >
                          {formatDate(user.created_at)}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex min-w-[180px] flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => onViewDetails(user)}
                          className={cn(
                            'inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all',
                            isDark
                              ? 'bg-white/5 text-slate-200 hover:bg-white/10'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          )}
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenStatus(user)}
                          className={cn(
                            'inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition-all',
                            'bg-blue-600 hover:bg-blue-700'
                          )}
                        >
                          <Shield className="h-4 w-4" />
                          Update Status
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {isFetching && (
          <div
            className={cn(
              'border-t px-5 py-3 text-sm',
              isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'
            )}
          >
            Refreshing user records...
          </div>
        )}
      </div>

      <PaginationControls
        isDark={isDark}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </motion.section>
  );
};

export default UserPermissionsTable;
