import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ShieldCheck, Users, UserCheck, UserMinus } from 'lucide-react';
import {
  cn,
  formatNumber,
  getPanelClass,
  getSubtlePanelClass,
} from './userPermissions.utils';

interface UserPermissionsHeaderProps {
  isDark: boolean;
  onRefresh: () => void | Promise<void>;
  isFetching: boolean;
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
}

const UserPermissionsHeader: React.FC<UserPermissionsHeaderProps> = ({
  isDark,
  onRefresh,
  isFetching,
  totalUsers,
  activeUsers,
  suspendedUsers,
}) => {
  const panelClass = getPanelClass(isDark);
  const subtlePanelClass = getSubtlePanelClass(isDark);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(panelClass, 'relative overflow-hidden p-6 md:p-8')}
    >
      <div
        className={cn(
          'absolute inset-0 opacity-80',
          isDark
            ? 'bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.14),_transparent_28%)]'
            : 'bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.10),_transparent_28%)]'
        )}
      />

      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                isFetching ? 'animate-pulse bg-amber-500' : 'bg-emerald-500'
              )}
            />
            Platform User Governance
          </div>

          <h1
            className={cn(
              'text-3xl font-bold tracking-tight md:text-4xl',
              isDark ? 'text-white' : 'text-slate-950'
            )}
          >
            User Permissions Console
          </h1>

          <p
            className={cn(
              'mt-3 max-w-3xl text-sm md:text-base',
              isDark ? 'text-slate-400' : 'text-slate-600'
            )}
          >
            Centralized visibility into all platform users, profile identity, contact
            metadata, verification posture, login activity, and account status controls.
          </p>
        </div>

        <div className="flex w-full flex-col gap-4 xl:w-auto xl:min-w-[460px]">
          <div className={cn(subtlePanelClass, 'p-4')}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <span
                className={cn(
                  'text-xs font-semibold uppercase tracking-[0.14em]',
                  isDark ? 'text-slate-400' : 'text-slate-500'
                )}
              >
                Controls
              </span>

              <button
                type="button"
                onClick={onRefresh}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all',
                  isDark
                    ? 'bg-white/5 text-slate-200 hover:bg-white/10'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  label: 'Total Users',
                  value: formatNumber(totalUsers),
                  icon: Users,
                },
                {
                  label: 'Active',
                  value: formatNumber(activeUsers),
                  icon: UserCheck,
                },
                {
                  label: 'Suspended',
                  value: formatNumber(suspendedUsers),
                  icon: UserMinus,
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className={cn(
                      'rounded-2xl border p-4',
                      isDark
                        ? 'border-white/10 bg-white/[0.03]'
                        : 'border-slate-200 bg-white'
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-xl',
                          isDark
                            ? 'bg-blue-500/10 text-blue-300'
                            : 'bg-blue-50 text-blue-700'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <ShieldCheck
                        className={cn(
                          'h-4 w-4',
                          isDark ? 'text-slate-500' : 'text-slate-400'
                        )}
                      />
                    </div>

                    <p
                      className={cn(
                        'text-2xl font-bold',
                        isDark ? 'text-white' : 'text-slate-950'
                      )}
                    >
                      {item.value}
                    </p>
                    <p
                      className={cn(
                        'mt-1 text-xs font-medium',
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      )}
                    >
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default UserPermissionsHeader;
