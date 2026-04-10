import React, { useState } from 'react';
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
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Users, 
  Award,
  ChevronRight,
  UserPlus
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
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState<string | null>(null);

  const panelClass = getPanelClass(isDark);
  const subtlePanelClass = getSubtlePanelClass(isDark);

  const topRoles = [...roleDistribution]
    .sort((a, b) => b.count - a.count)
    .slice(0, 2);

  const topWorkload = [...highWorkloadStaff]
    .sort((a, b) => b.workload_percentage - a.workload_percentage)
    .slice(0, 2);

  // Navigation handler with loading state
  const handleNavigate = (url: string, sectionName: string) => {
    setIsNavigating(sectionName);
    navigate(url);
  };

  // Show loading skeleton if navigating
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
        <div className={cn(subtlePanelClass, 'p-4', 'cursor-default')}>
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

        <div className={cn(subtlePanelClass, 'p-4', 'cursor-default')}>
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

        <div className={cn(subtlePanelClass, 'p-4', 'cursor-default')}>
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

        <div className={cn(subtlePanelClass, 'p-4', 'cursor-default')}>
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
        {/* Role Distribution Section */}
        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
              Role Distribution
            </h3>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold cursor-default',
                  isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-700'
                )}
              >
                {formatNumber(roleDistribution.length)} roles
              </span>
            </div>
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

          {/* Action Buttons for Role Distribution */}
          <div className={cn('mt-4 pt-4 border-t grid grid-cols-1 gap-3', isDark ? 'border-white/10' : 'border-slate-200')}>
            <button
              onClick={() => handleNavigate(ADMIN_ROUTES.TEAM, 'Team Directory')}
              className={cn(
                'rounded-xl px-4 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer',
                isDark
                  ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              )}
            >
              <Users className="h-4 w-4" />
              <span>Team Directory</span>
              <ChevronRight className="h-4 w-4" />
            </button>
           
          </div>
        </div>

        {/* High Workload Staff Section */}
        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
              High Workload Staff
            </h3>
            <div
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold cursor-default',
                isDark ? 'bg-rose-500/10 text-rose-300' : 'bg-rose-50 text-rose-700'
              )}
            >
              <Award className="h-3.5 w-3.5" />
              Top performers
            </div>
          </div>

          {topWorkload.length ? (
            <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {topWorkload.map((staff) => (
                <div
                  key={staff.staff_uuid}
                  className={cn(
                    'rounded-2xl border p-4 cursor-default',
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
                        'rounded-full px-3 py-1 text-xs font-semibold cursor-default',
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

                  {/* Additional metrics */}
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className={cn(isDark ? 'text-slate-400' : 'text-slate-500')}>
                        Patients Treated:
                      </span>
                      <span className={cn('ml-2 font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                        {formatNumber(staff.total_patients_treated)}
                      </span>
                    </div>
                    {staff.patient_satisfaction && (
                      <div>
                        <span className={cn(isDark ? 'text-slate-400' : 'text-slate-500')}>
                          Satisfaction:
                        </span>
                        <span className={cn('ml-2 font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                          {staff.patient_satisfaction.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
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

          {/* Action Buttons for Workforce */}
          <div className={cn('mt-4 pt-4 border-t grid grid-cols-1 gap-3', isDark ? 'border-white/10' : 'border-slate-200')}>
           
            
            <button
              onClick={() => handleNavigate(ADMIN_ROUTES.TEAM, 'Performance Review')}
              className={cn(
                'rounded-xl px-4 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer',
                isDark
                  ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30'
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
              )}
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Staff</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f1f1'};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(255, 255, 255, 0.2)' : '#cbd5e1'};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? 'rgba(255, 255, 255, 0.3)' : '#94a3b8'};
        }
      `}</style>
    </motion.section>
  );
};

export default FacilityAdminWorkforceSection;