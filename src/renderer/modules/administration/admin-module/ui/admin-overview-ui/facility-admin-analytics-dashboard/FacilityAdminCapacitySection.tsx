import React from 'react';
import { motion } from 'framer-motion';
import { BedDouble, Building2, DoorOpen, Timer } from 'lucide-react';

import type {
  CapacitySummary,
  DepartmentCapacityItem,
  SpaceTypeSummary,
  WardDetail,
}  from '../../../api/admin-overview/FacilityAdminAnalyticsTypes';
import { EmptyChartState, ProgressRow } from '../../../../../medical-records/ui/overview/medical-records-dashboard/dashboard.primitives';
import {
  clampPercentage,
  cn,
  formatMinutes,
  formatNumber,
  formatPercent,
  getPanelClass,
  getSubtlePanelClass,
} from './facilityAdminDashboard.utils';

interface FacilityAdminCapacitySectionProps {
  isDark: boolean;
  summary: CapacitySummary;
  departments: DepartmentCapacityItem[];
  wards: WardDetail[];
  spaceTypes: SpaceTypeSummary[];
}

const FacilityAdminCapacitySection: React.FC<FacilityAdminCapacitySectionProps> = ({
  isDark,
  summary,
  departments,
  wards,
  spaceTypes,
}) => {
  const panelClass = getPanelClass(isDark);
  const subtlePanelClass = getSubtlePanelClass(isDark);

  const topWards = [...wards]
    .filter((ward) => ward.utilization_percentage !== null)
    .sort(
      (a, b) =>
        Number(b.utilization_percentage ?? 0) - Number(a.utilization_percentage ?? 0)
    )
    .slice(0, 5);

  const topDepartments = [...departments].slice(0, 6);

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      className={cn(panelClass, 'p-6')}
    >
      <div className="mb-6">
        <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
          Capacity Utilization
        </h2>
        <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
          Departmental readiness, operational spaces, and ward utilization pressure.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="flex items-center gap-3">
            <BedDouble
              className={cn('h-5 w-5', isDark ? 'text-blue-300' : 'text-blue-700')}
            />
            <div>
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                Total Beds
              </p>
              <p className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {formatNumber(summary.total_beds)}
              </p>
            </div>
          </div>
        </div>

        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="flex items-center gap-3">
            <DoorOpen
              className={cn('h-5 w-5', isDark ? 'text-violet-300' : 'text-violet-700')}
            />
            <div>
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                Treatment Rooms
              </p>
              <p className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {formatNumber(summary.total_treatment_rooms)}
              </p>
            </div>
          </div>
        </div>

        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="flex items-center gap-3">
            <Building2
              className={cn('h-5 w-5', isDark ? 'text-emerald-300' : 'text-emerald-700')}
            />
            <div>
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                Active Spaces
              </p>
              <p className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {formatNumber(summary.occupied_spaces)} / {formatNumber(summary.total_active_spaces)}
              </p>
            </div>
          </div>
        </div>

        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="flex items-center gap-3">
            <Timer
              className={cn('h-5 w-5', isDark ? 'text-amber-300' : 'text-amber-700')}
            />
            <div>
              <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                Space Utilization
              </p>
              <p className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {formatPercent(summary.space_utilization_rate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
              Department Readiness
            </h3>
            <span
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold',
                isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-700'
              )}
            >
              {formatNumber(departments.length)} departments
            </span>
          </div>

          {topDepartments.length ? (
            <div className="space-y-3">
              {topDepartments.map((department) => (
                <div
                  key={`${department.department_name}-${department.department_type}`}
                  className={cn(
                    'rounded-2xl border p-4',
                    isDark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white'
                  )}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                        {department.department_name}
                      </p>
                      <p className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                        {department.department_type}
                      </p>
                    </div>

                    <div
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-semibold',
                        isDark ? 'bg-blue-500/10 text-blue-300' : 'bg-blue-50 text-blue-700'
                      )}
                    >
                      Capacity {formatNumber(department.max_capacity)}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                        Beds
                      </p>
                      <p className={cn('mt-1 text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                        {formatNumber(department.bed_count)}
                      </p>
                    </div>

                    <div>
                      <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                        Rooms
                      </p>
                      <p className={cn('mt-1 text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                        {formatNumber(department.treatment_rooms)}
                      </p>
                    </div>

                    <div>
                      <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                        Staff
                      </p>
                      <p className={cn('mt-1 text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                        {formatNumber(department.assigned_staff_count)}
                      </p>
                    </div>

                    <div>
                      <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                        Wait Time
                      </p>
                      <p className={cn('mt-1 text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                        {formatMinutes(department.avg_wait_time_minutes)}
                      </p>
                    </div>
                  </div>

                  <p className={cn('mt-3 text-xs leading-5', isDark ? 'text-slate-400' : 'text-slate-600')}>
                    {department.capacity_utilization_hint}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyChartState
              title="No department capacity data"
              subtitle="Departmental capacity insights will appear here when available."
              isDark={isDark}
            />
          )}
        </div>

        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="mb-4">
            <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
              Ward Utilization Hotspots
            </h3>
          </div>

          {topWards.length ? (
            <div className="space-y-4">
              {topWards.map((ward) => (
                <div key={ward.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className={cn('truncate text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                        {ward.name}
                      </p>
                      <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                        {ward.ward_type}
                        {ward.building ? ` • ${ward.building}` : ''}
                        {ward.floor ? ` • ${ward.floor}` : ''}
                      </p>
                    </div>

                    <span className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                      {formatPercent(ward.utilization_percentage)}
                    </span>
                  </div>

                  <ProgressRow
                    label={`Occupied ${formatNumber(ward.estimated_occupied_beds ?? 0)} / ${formatNumber(
                      ward.capacity_operational
                    )}`}
                    value={clampPercentage(ward.utilization_percentage)}
                    isDark={isDark}
                    tone={
                      Number(ward.utilization_percentage ?? 0) >= 85
                        ? 'rose'
                        : Number(ward.utilization_percentage ?? 0) >= 70
                        ? 'amber'
                        : 'green'
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyChartState
              title="No ward utilization data"
              subtitle="Ward occupancy pressure indicators will appear here."
              isDark={isDark}
            />
          )}

          <div className="mt-6">
            <h4 className={cn('mb-3 text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
              Space Types
            </h4>

            {spaceTypes.length ? (
              <div className="flex flex-wrap gap-2">
                {spaceTypes.map((item) => (
                  <div
                    key={item.space_type}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium',
                      isDark
                        ? 'border-white/10 bg-white/[0.03] text-slate-300'
                        : 'border-slate-200 bg-white text-slate-700'
                    )}
                  >
                    {item.space_type} • {formatNumber(item.total)}
                  </div>
                ))}
              </div>
            ) : (
              <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
                No space type summary available.
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default FacilityAdminCapacitySection;
