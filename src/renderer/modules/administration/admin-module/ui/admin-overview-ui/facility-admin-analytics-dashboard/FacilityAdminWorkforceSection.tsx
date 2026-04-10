import React from 'react';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, ShieldCheck, UserCheck, UserX } from 'lucide-react';

import type {
  HighWorkloadStaffItem,
  RoleDistributionItem,
  StaffCurrentSnapshot,
} from  '../../../api/admin-overview/FacilityAdminAnalyticsTypes';
import {
  EmptyChartState,
  EnterpriseTooltip,
  ProgressRow,
} from  '../../../../../medical-records/ui/overview/medical-records-dashboard/dashboard.primitives';
import {
  PIE_COLORS,
  clampPercentage,
  cn,
  formatNumber,
  formatPercent,
  formatPersonName,
  getPanelClass,
  getSubtlePanelClass,
} from './facilityAdminDashboard.utils';
import { formatText } from '../../../../../medical-records/ui/revenue/stats/billing-revenue-stats-component/revenueDashboardUtils';

interface FacilityAdminWorkforceSectionProps {
  isDark: boolean;
  currentSnapshot: StaffCurrentSnapshot;
  roleDistribution: RoleDistributionItem[];
  highWorkloadStaff: HighWorkloadStaffItem[];
}

const FacilityAdminWorkforceSection: React.FC<FacilityAdminWorkforceSectionProps> = ({
  isDark,
  currentSnapshot,
  roleDistribution,
  highWorkloadStaff,
}) => {
  const panelClass = getPanelClass(isDark);
  const subtlePanelClass = getSubtlePanelClass(isDark);

  const topRoles = [...roleDistribution]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const topWorkload = [...highWorkloadStaff]
    .sort((a, b) => b.workload_percentage - a.workload_percentage)
    .slice(0, 5);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.16 }}
      className={cn(panelClass, 'p-6')}
    >
      <div className="mb-6">
        <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
          Workforce Intelligence
        </h2>
        <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
          Staffing coverage, role composition, and highest-load team members.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-2xl',
                isDark ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-100 text-blue-700'
              )}
            >
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                On Duty
              </p>
              <p className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {formatNumber(currentSnapshot.staff_on_duty)}
              </p>
            </div>
          </div>
        </div>

        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-2xl',
                isDark ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-100 text-amber-700'
              )}
            >
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                Busy
              </p>
              <p className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {formatNumber(currentSnapshot.staff_busy)}
              </p>
            </div>
          </div>
        </div>

        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-2xl',
                isDark ? 'bg-slate-500/10 text-slate-300' : 'bg-slate-100 text-slate-700'
              )}
            >
              <UserX className="h-5 w-5" />
            </div>
            <div>
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                Off Duty
              </p>
              <p className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {formatNumber(currentSnapshot.staff_off_duty)}
              </p>
            </div>
          </div>
        </div>

        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-2xl',
                isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
              )}
            >
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                Occupancy
              </p>
              <p className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {formatPercent(currentSnapshot.occupancy_rate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="mb-4">
            <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
              Role Distribution
            </h3>
          </div>

          <div className="h-[280px]">
            {topRoles.length ? (
              <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topRoles}
                layout="vertical"
                margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? 'rgba(148,163,184,0.12)' : '#E2E8F0'}
                />
                <XAxis
                  type="number"
                  tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => formatText(formatNumber(value))}
                />
                <YAxis
                  type="category"
                  dataKey="role"
                  width={120}
                  tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => formatText(value)}
                />
                <Tooltip
                  content={
                    <EnterpriseTooltip
                      isDark={isDark}
                      labelFormatter={(label) => formatText(label)}
                      valueFormatter={(value) => formatText(formatNumber(value))}
                    />
                  }
                />
                <Bar dataKey="count" name="Staff Count" radius={[0, 10, 10, 0]}>
                  {topRoles.map((item, index) => (
                    <Cell key={item.role} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            ) : (
              <EmptyChartState
                title="No role distribution data"
                subtitle="Role composition will render here when available."
                isDark={isDark}
              />
            )}
          </div>
        </div>

        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="mb-4">
            <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
              High Workload Staff
            </h3>
          </div>

          {topWorkload.length ? (
            <div className="space-y-4">
              {topWorkload.map((staff) => (
                <div
                  key={staff.staff_uuid}
                  className={cn(
                    'rounded-2xl border p-4',
                    isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white'
                  )}
                >
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p
                        className={cn(
                          'truncate text-sm font-semibold',
                          isDark ? 'text-white' : 'text-slate-900'
                        )}
                      >
                        {formatPersonName(staff)}
                      </p>
                      <p
                        className={cn(
                          'mt-1 text-xs',
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        )}
                      >
                        Current Load {formatNumber(staff.current_patient_load)} /{' '}
                        {formatNumber(staff.max_concurrent_patients)}
                      </p>
                    </div>

                    <div
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-semibold',
                        staff.workload_percentage >= 85
                          ? isDark
                            ? 'bg-rose-500/10 text-rose-300'
                            : 'bg-rose-50 text-rose-700'
                          : isDark
                          ? 'bg-amber-500/10 text-amber-300'
                          : 'bg-amber-50 text-amber-700'
                      )}
                    >
                      {formatPercent(staff.workload_percentage)}
                    </div>
                  </div>

                  <ProgressRow
                    label="Utilization"
                    value={clampPercentage(staff.workload_percentage)}
                    isDark={isDark}
                    tone={staff.workload_percentage >= 85 ? 'rose' : 'amber'}
                  />

                </div>
              ))}
            </div>
          ) : (
            <EmptyChartState
              title="No workload outliers"
              subtitle="High-workload staff ranking will appear when present."
              isDark={isDark}
            />
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default FacilityAdminWorkforceSection;
