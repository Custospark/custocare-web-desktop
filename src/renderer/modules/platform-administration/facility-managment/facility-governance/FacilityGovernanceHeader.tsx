import React from 'react';
import { motion } from 'framer-motion';
import { Building2, RefreshCw, Users } from 'lucide-react';
import {
  cn,
  getPanelClass,
  getSubtlePanelClass,
} from './facilityGovernance.utils';

interface FacilityGovernanceHeaderProps {
  isDark: boolean;
  activeTab: 'facilities' | 'patients';
  onTabChange: (tab: 'facilities' | 'patients') => void;
  onRefresh: () => void | Promise<void>;
  isFetching: boolean;
  facilityTotal: number;
  patientTotal: number;
}

const FacilityGovernanceHeader: React.FC<FacilityGovernanceHeaderProps> = ({
  isDark,
  activeTab,
  onTabChange,
  onRefresh,
  isFetching,
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
            Platform Governance
          </div>

          <h1
            className={cn(
              'text-3xl font-bold tracking-tight md:text-4xl',
              isDark ? 'text-white' : 'text-slate-950'
            )}
          >
            Facility Governance Console
          </h1>

          <p
            className={cn(
              'mt-3 max-w-3xl text-sm md:text-base',
              isDark ? 'text-slate-400' : 'text-slate-600'
            )}
          >
            Centralized visibility into facility ownership, staffing, operational posture,
            billing exposure, patient registry breadth, and status governance actions.
          </p>


        </div>

        <div className="flex w-full flex-col gap-4 xl:w-auto xl:min-w-[420px]">
          <div className={cn(subtlePanelClass, 'p-4')}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <span
                className={cn(
                  'text-xs font-semibold uppercase tracking-[0.14em]',
                  isDark ? 'text-slate-400' : 'text-slate-500'
                )}
              >
                View
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

            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'facilities' as const, label: 'Facilities', icon: Building2 },
                { key: 'patients' as const, label: 'Patients', icon: Users },
              ].map((tab) => {
                const active = activeTab === tab.key;
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => onTabChange(tab.key)}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all',
                      active
                        ? isDark
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                          : 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                        : isDark
                        ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default FacilityGovernanceHeader;
