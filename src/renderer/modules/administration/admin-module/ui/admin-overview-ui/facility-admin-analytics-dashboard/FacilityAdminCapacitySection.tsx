import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BedDouble,
  Building2,
  ChevronRight,
  DoorOpen,
  LayoutDashboard,
  MapIcon,
  PlusCircle,
  Settings,
  Timer,
} from 'lucide-react';

import type {
  CapacitySummary,
  DepartmentCapacityItem,
  SpaceTypeSummary,
  WardDetail,
} from '../../../api/admin-overview/FacilityAdminAnalyticsTypes';
import {
  EmptyChartState,
  ProgressRow,
} from '../../../../../medical-records/ui/overview/medical-records-dashboard/dashboard.primitives';
import {
  clampPercentage,
  cn,
  formatMinutes,
  formatNumber,
  formatPercent,
  getPanelClass,
  getSubtlePanelClass,
} from './facilityAdminDashboard.utils';
import { ADMIN_ROUTES } from '../../../../../../app/routes/constants/administration.paths';
import { ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES } from '../../../../../../app/routes/constants/administration.paths';
import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';
import { formatText } from '../../../../../medical-records/ui/revenue/stats/billing-revenue-stats-component/revenueDashboardUtils';

interface FacilityAdminCapacitySectionProps {
  isDark: boolean;
  summary?: CapacitySummary | null;
  departments?: DepartmentCapacityItem[] | null;
  wards?: WardDetail[] | null;
  spaceTypes?: SpaceTypeSummary[] | null;
}

const EMPTY_SUMMARY: CapacitySummary = {
  total_beds: 0,
  total_treatment_rooms: 0,
  total_concurrent_capacity: 0, 
  occupied_spaces: 0,
  total_active_spaces: 0,
  space_utilization_rate: 0,
  wards: { 
    total_wards: 0,
    total_declared_capacity: 0,
    total_operational_capacity: 0,
    wards_by_type: [],
  },
};

function FacilityAdminCapacitySection({
  isDark,
  summary,
  departments,
  wards,
  spaceTypes,
}: FacilityAdminCapacitySectionProps) {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState<string | null>(null);

  const panelClass = getPanelClass(isDark);
  const subtlePanelClass = getSubtlePanelClass(isDark);

  const safeSummary = summary ?? EMPTY_SUMMARY;
  const safeDepartments = Array.isArray(departments) ? departments : [];
  const safeWards = Array.isArray(wards) ? wards : [];
  const safeSpaceTypes = Array.isArray(spaceTypes) ? spaceTypes : [];

  const topDepartments = useMemo(() => safeDepartments.slice(0, 6), [safeDepartments]);

  const topWards = useMemo(
    () =>
      [...safeWards]
        .filter((ward) => ward.utilization_percentage !== null && ward.utilization_percentage !== undefined)
        .sort(
          (a, b) =>
            Number(b.utilization_percentage ?? 0) - Number(a.utilization_percentage ?? 0)
        )
        .slice(0, 5),
    [safeWards]
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
        <div className={cn(subtlePanelClass, 'cursor-default p-4')}>
          <div className="flex items-center gap-3">
            <BedDouble className={cn('h-5 w-5', isDark ? 'text-blue-300' : 'text-blue-700')} />
            <div>
              <p className="text-xs text-slate-500">Total Beds</p>
              <p className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {formatNumber(safeSummary.total_beds)}
              </p>
            </div>
          </div>
        </div>

        <div className={cn(subtlePanelClass, 'cursor-default p-4')}>
          <div className="flex items-center gap-3">
            <DoorOpen className={cn('h-5 w-5', isDark ? 'text-violet-300' : 'text-violet-700')} />
            <div>
              <p className="text-xs text-slate-500">Treatment Rooms</p>
              <p className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {formatNumber(safeSummary.total_treatment_rooms)}
              </p>
            </div>
          </div>
        </div>

        <div className={cn(subtlePanelClass, 'cursor-default p-4')}>
          <div className="flex items-center gap-3">
            <Building2 className={cn('h-5 w-5', isDark ? 'text-emerald-300' : 'text-emerald-700')} />
            <div>
              <p className="text-xs text-slate-500">Active Spaces</p>
              <p className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {formatNumber(safeSummary.occupied_spaces)} / {formatNumber(safeSummary.total_active_spaces)}
              </p>
            </div>
          </div>
        </div>

        <div className={cn(subtlePanelClass, 'cursor-default p-4')}>
          <div className="flex items-center gap-3">
            <Timer className={cn('h-5 w-5', isDark ? 'text-amber-300' : 'text-amber-700')} />
            <div>
              <p className="text-xs text-slate-500">Space Utilization</p>
              <p className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
                {formatPercent(safeSummary.space_utilization_rate)}
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
              {formatNumber(safeDepartments.length)} departments
            </span>
          </div>

          <div className="max-h-[600px] space-y-3 overflow-y-auto pr-2">
            {topDepartments.length ? (
              topDepartments.map((department) => (
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
                      <p className="text-xs text-slate-500">Beds</p>
                      <p className={cn('mt-1 text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                        {formatNumber(department.bed_count)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Rooms</p>
                      <p className={cn('mt-1 text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                        {formatNumber(department.treatment_rooms)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Staff</p>
                      <p className={cn('mt-1 text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                        {formatNumber(department.assigned_staff_count)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Wait Time</p>
                      <p className={cn('mt-1 text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                        {formatMinutes(department.avg_wait_time_minutes)}
                      </p>
                    </div>
                  </div>

                  <p className={cn('mt-3 text-xs leading-5', isDark ? 'text-slate-400' : 'text-slate-600')}>
                    {department.capacity_utilization_hint || 'No department readiness note available.'}
                  </p>
                </div>
              ))
            ) : (
              <EmptyChartState
                title="No department capacity data"
                subtitle="Departmental capacity insights will appear here when available."
                isDark={isDark}
              />
            )}
          </div>

        <div
              className={cn(
                'mt-4 border-t pt-4',
                isDark ? 'border-white/10' : 'border-slate-200'
              )}
            >
              <button
                onClick={() => handleNavigate(ADMIN_ROUTES.FACILITY_SETUP, 'Departments')}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all',
                  isDark
                    ? safeDepartments.length === 0
                      ? 'border border-blue-500/40 bg-blue-600/30 text-blue-200 hover:bg-blue-600/40'
                      : 'border border-blue-500/30 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                    : safeDepartments.length === 0
                    ? 'border border-blue-600 bg-blue-600 text-white hover:bg-blue-700'
                    : 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                )}
              >
                {safeDepartments.length === 0 ? (
                  <PlusCircle className="h-4 w-4" />
                ) : (
                  <Settings className="h-4 w-4" />
                )}
                <span>{safeDepartments.length === 0 ? 'Configure Departments' : 'Manage Departments'}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
        </div>

        <div className={cn(subtlePanelClass, 'p-4')}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
              Ward Utilization Hotspots
            </h3>
          </div>

          <div className="max-h-[500px] space-y-4 overflow-y-auto pr-2">
            {topWards.length ? (
              topWards.map((ward) => (
                <div key={ward.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
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
              ))
            ) : (
              <EmptyChartState
                title="No ward utilization data"
                subtitle="Ward occupancy pressure indicators will appear here."
                isDark={isDark}
              />
            )}
          </div>

         <div
            className={cn(
              'mt-4 border-t pt-4',
              isDark ? 'border-white/10' : 'border-slate-200'
            )}
          >
            <button
              onClick={() =>
                handleNavigate(
                  ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES.WARD_MANAGEMENT,
                  'Wards'
                )
              }
              className={cn(
                'flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all',
                isDark
                  ? safeWards.length === 0
                    ? 'border border-violet-500/40 bg-violet-600/30 text-violet-200 hover:bg-violet-600/40'
                    : 'border border-violet-500/30 bg-violet-500/20 text-violet-300 hover:bg-violet-500/30'
                  : safeWards.length === 0
                  ? 'border border-violet-600 bg-violet-600 text-white hover:bg-violet-700'
                  : 'border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100'
              )}
            >
              {safeWards.length === 0 ? <PlusCircle className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
              <span>{safeWards.length === 0 ? 'Configure Wards' : 'Manage Wards'}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h4 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                Space Types
              </h4>
            </div>

            <div className="max-h-[200px] overflow-y-auto pr-2">
              {safeSpaceTypes.length ? (
                <div className="flex flex-wrap gap-2">
                  {safeSpaceTypes.slice(0, 10).map((item) => (
                    <div
                      key={item.space_type}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium',
                        isDark
                          ? 'border-white/10 bg-white/[0.03] text-slate-300'
                          : 'border-slate-200 bg-white text-slate-700'
                      )}
                    >
                      {formatText(item.space_type)} • {formatNumber(item.total)}
                    </div>
                  ))}
                  {safeSpaceTypes.length > 10 && (
                    <div
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium',
                        isDark
                          ? 'border-white/10 bg-white/[0.03] text-slate-300'
                          : 'border-slate-200 bg-white text-slate-700'
                      )}
                    >
                      +{safeSpaceTypes.length - 10} more
                    </div>
                  )}
                </div>
              ) : (
                <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  No space type summary available.
                </p>
              )}
            </div>

         <div
            className={cn(
              'mt-4 border-t pt-4',
              isDark ? 'border-white/10' : 'border-slate-200'
            )}
          >
            <button
              onClick={() =>
                handleNavigate(
                  ADMINISTRATION_CLINICAL_SPACE_MGT_ROUTES.CLINICAL_ROOMS,
                  'Spaces'
                )
              }
              className={cn(
                'flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all',
                isDark
                  ? safeSpaceTypes.length === 0
                    ? 'border border-emerald-500/40 bg-emerald-600/30 text-emerald-200 hover:bg-emerald-600/40'
                    : 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                  : safeSpaceTypes.length === 0
                  ? 'border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              )}
            >
              {safeSpaceTypes.length === 0 ? (
                <PlusCircle className="h-4 w-4" />
              ) : (
                <LayoutDashboard className="h-4 w-4" />
              )}
              <span>{safeSpaceTypes.length === 0 ? 'Configure Spaces' : 'Manage Spaces'}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export default FacilityAdminCapacitySection;
