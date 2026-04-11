import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
import {
  Activity,
  Award,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from 'lucide-react';

import type {
  HighWorkloadStaffItem,
  RoleDistributionItem,
  StaffCurrentSnapshot,
} from '../../../api/admin-overview/FacilityAdminAnalyticsTypes';
import {
  EmptyChartState,
  EnterpriseTooltip,
  ProgressRow,
} from '../../../../../medical-records/ui/overview/medical-records-dashboard/dashboard.primitives';
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
import { ADMIN_ROUTES } from '../../../../../../app/routes/constants/administration.paths';
import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';

interface FacilityAdminWorkforceSectionProps {
  isDark: boolean;
  currentSnapshot?: StaffCurrentSnapshot | null;
  roleDistribution?: RoleDistributionItem[] | null;
  highWorkloadStaff?: HighWorkloadStaffItem[] | null;
}

const EMPTY_CURRENT_SNAPSHOT: StaffCurrentSnapshot = {
  total_active: 0,
  staff_on_duty: 0,
  staff_busy: 0,
  staff_off_duty: 0,
  occupancy_rate: 0,
};

function FacilityAdminWorkforceSection({
  isDark,
  currentSnapshot,
  roleDistribution,
  highWorkloadStaff,
}: FacilityAdminWorkforceSectionProps) {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState<string | null>(null);

  const panelClass = getPanelClass(isDark);
  const subtlePanelClass = getSubtlePanelClass(isDark);

  const safeCurrentSnapshot = currentSnapshot ?? EMPTY_CURRENT_SNAPSHOT;
  const safeRoleDistribution = Array.isArray(roleDistribution) ? roleDistribution : [];
  const safeHighWorkloadStaff = Array.isArray(highWorkloadStaff) ? highWorkloadStaff : [];

  const topRoles = useMemo(
    () =>
      [...safeRoleDistribution]
        .sort((a, b) => Number(b.count ?? 0) - Number(a.count ?? 0))
        .slice(0, 6),
    [safeRoleDistribution]
  );

  const topWorkload = useMemo(
    () =>
      [...safeHighWorkloadStaff]
        .sort(
          (a, b) =>
            Number(b.workload_percentage ?? 0) - Number(a.workload_percentage ?? 0)
        )
        .slice(0, 6),
    [safeHighWorkloadStaff]
  );

  const handleNavigate = (url: string, sectionName: string) => {
    setIsNavigating(sectionName);
    navigate(url);
  };

  if (isNavigating) {
    return (
      <LoadingSkeleton
        variant="dashboard"
        theme={isDark ? 'dark' : 'light'}
        message={`Loading ${isNavigating}...`}
      />
    );
  }

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
        <div className={cn(subtlePanelClass, 'cursor-default p-4')}>
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
              <p className="text-xs text-slate-500">On Duty</p>
              <p className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {formatNumber(safeCurrentSnapshot.staff_on_duty)}
              </p>
            </div>
          </div>
        </div>

        <div className={cn(subtlePanelClass, 'cursor-default p-4')}>
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
              <p className="text-xs text-slate-500">Busy</p>
              <p className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {formatNumber(safeCurrentSnapshot.staff_busy)}
              </p>
            </div>
          </div>
        </div>

        <div className={cn(subtlePanelClass, 'cursor-default p-4')}>
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
              <p className="text-xs text-slate-500">Off Duty</p>
              <p className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {formatNumber(safeCurrentSnapshot.staff_off_duty)}
              </p>
            </div>
          </div>
        </div>

        <div className={cn(subtlePanelClass, 'cursor-default p-4')}>
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
              <p className="text-xs text-slate-500">Occupancy</p>
              <p className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {formatPercent(safeCurrentSnapshot.occupancy_rate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
              Role Distribution
            </h3>
            <span
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold',
                isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-700'
              )}
            >
              {formatNumber(safeRoleDistribution.length)} roles
            </span>
          </div>

          <div className="h-[280px] w-full">
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
                    tickFormatter={(value) => formatNumber(Number(value ?? 0))}
                  />
                  <YAxis
                    type="category"
                    dataKey="role"
                    width={120}
                    tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => formatText(String(value ?? '—'))}
                  />
                  <Tooltip
                    content={
                      <EnterpriseTooltip
                        isDark={isDark}
                        labelFormatter={(label) => formatText(String(label ?? '—'))}
                        valueFormatter={(value) => formatNumber(Number(value ?? 0))}
                      />
                    }
                  />
                  <Bar dataKey="count" name="Staff Count" radius={[0, 10, 10, 0]}>
                    {topRoles.map((item, index) => (
                      <Cell key={`${item.role}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <EmptyChartState
                  title="No role distribution data"
                  subtitle="Role composition will render here when available."
                  isDark={isDark}
                />
              </div>
            )}
          </div>

          <div
            className={cn(
              'mt-4 grid grid-cols-1 gap-3 border-t pt-4',
              isDark ? 'border-white/10' : 'border-slate-200'
            )}
          >
            <button
              onClick={() => handleNavigate(ADMIN_ROUTES.TEAM, 'Team Directory')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
                isDark
                  ? 'border border-blue-500/30 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                  : 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
              )}
            >
              <Users className="h-4 w-4" />
              <span>Team Directory</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
              High Workload Staff
            </h3>
            <div
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                isDark ? 'bg-rose-500/10 text-rose-300' : 'bg-rose-50 text-rose-700'
              )}
            >
              <Award className="h-3.5 w-3.5" />
              Top performers
            </div>
          </div>

          {topWorkload.length ? (
            <div className="max-h-[400px] space-y-4 overflow-y-auto pr-2">
              {topWorkload.map((staff) => (
                <div
                  key={staff.staff_uuid}
                  className={cn(
                    'rounded-2xl border p-4',
                    isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white'
                  )}
                >
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
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
                        Number(staff.workload_percentage ?? 0) >= 85
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
                    tone={Number(staff.workload_percentage ?? 0) >= 85 ? 'rose' : 'amber'}
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

          <div
            className={cn(
              'mt-4 grid grid-cols-1 gap-3 border-t pt-4',
              isDark ? 'border-white/10' : 'border-slate-200'
            )}
          >
            <button
              onClick={() => handleNavigate(ADMIN_ROUTES.TEAM, 'Performance Review')}
              className={cn(
                'flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
                isDark
                  ? 'border border-green-500/30 bg-green-500/20 text-green-300 hover:bg-green-500/30'
                  : 'border border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
              )}
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Staff</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default FacilityAdminWorkforceSection;
