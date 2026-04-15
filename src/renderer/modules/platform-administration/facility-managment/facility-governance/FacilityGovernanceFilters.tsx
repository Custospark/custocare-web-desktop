import React from 'react';
import { CalendarRange, RotateCcw, Search } from 'lucide-react';
import type {
  FacilityFilters,
  PatientFilters,
}  from '../../statistics/api/platform-control/PlatformControlTypes';
import {
  cn,
  FACILITY_OPERATIONAL_STATUS_OPTIONS,
  FACILITY_STATUS_OPTIONS,
  getPanelClass,
  PATIENT_STATUS_OPTIONS,
  PERIOD_OPTIONS,
} from './facilityGovernance.utils';

interface FacilityGovernanceFiltersPanelProps {
  isDark: boolean;
  activeTab: 'facilities' | 'patients';
  facilityFilters: FacilityFilters;
  patientFilters: PatientFilters;
  onFacilityFilterChange: (
    key: keyof FacilityFilters,
    value: string | number | undefined
  ) => void;
  onPatientFilterChange: (
    key: keyof PatientFilters,
    value: string | number | undefined
  ) => void;
  onResetFacilityFilters: () => void;
  onResetPatientFilters: () => void;
}

const inputClass = (isDark: boolean) =>
  cn(
    'w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all',
    isDark
      ? 'border-white/10 bg-white/5 text-white placeholder:text-slate-500'
      : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
  );

const selectClass = inputClass;

const FacilityGovernanceFiltersPanel: React.FC<FacilityGovernanceFiltersPanelProps> = ({
  isDark,
  activeTab,
  facilityFilters,
  patientFilters,
  onFacilityFilterChange,
  onPatientFilterChange,
  onResetFacilityFilters,
  onResetPatientFilters,
}) => {
  const panelClass = getPanelClass(isDark);

  const isFacilityTab = activeTab === 'facilities';

  return (
    <section className={cn(panelClass, 'p-6')}>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-slate-950')}>
            Governance Filters
          </h2>
          <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
            Narrow platform records by period, date, lifecycle state, and search attributes.
          </p>
        </div>

        <button
          type="button"
          onClick={isFacilityTab ? onResetFacilityFilters : onResetPatientFilters}
          className={cn(
            'inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all',
            isDark
              ? 'bg-white/5 text-slate-200 hover:bg-white/10'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          )}
        >
          <RotateCcw className="h-4 w-4" />
          Reset Filters
        </button>
      </div>

      {isFacilityTab ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <label className={cn('mb-2 block text-xs font-semibold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-slate-500')}>
              Search
            </label>
            <div className="relative">
              <Search className={cn('pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-slate-400')} />
              <input
                value={facilityFilters.search ?? ''}
                onChange={(e) => onFacilityFilterChange('search', e.target.value)}
                placeholder="Search by facility name, code, phone, or email"
                className={cn(inputClass(isDark), 'pl-11')}
              />
            </div>
          </div>

          <div>
            <label className={cn('mb-2 block text-xs font-semibold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-slate-500')}>
              Status
            </label>
            <select
              value={facilityFilters.status ?? ''}
              onChange={(e) => onFacilityFilterChange('status', e.target.value || undefined)}
              className={selectClass(isDark)}
            >
              <option value="">All statuses</option>
              {FACILITY_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={cn('mb-2 block text-xs font-semibold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-slate-500')}>
              Operational Status
            </label>
            <select
              value={facilityFilters.operational_status ?? ''}
              onChange={(e) =>
                onFacilityFilterChange('operational_status', e.target.value || undefined)
              }
              className={selectClass(isDark)}
            >
              <option value="">All operational states</option>
              {FACILITY_OPERATIONAL_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={cn('mb-2 block text-xs font-semibold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-slate-500')}>
              Reg. Date or Period
            </label>
            <select
              value={facilityFilters.period ?? ''}
              onChange={(e) => onFacilityFilterChange('period', e.target.value || undefined)}
              className={selectClass(isDark)}
            >
              <option value="">Custom / none</option>
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={cn('mb-2 block text-xs font-semibold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-slate-500')}>
              Date From
            </label>
            <div className="relative">
              <CalendarRange className={cn('pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-slate-400')} />
              <input
                type="date"
                value={facilityFilters.date_from ?? ''}
                onChange={(e) => onFacilityFilterChange('date_from', e.target.value || undefined)}
                className={cn(inputClass(isDark), 'pl-11')}
              />
            </div>
          </div>

          <div>
            <label className={cn('mb-2 block text-xs font-semibold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-slate-500')}>
              Date To
            </label>
            <div className="relative">
              <CalendarRange className={cn('pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-slate-400')} />
              <input
                type="date"
                value={facilityFilters.date_to ?? ''}
                onChange={(e) => onFacilityFilterChange('date_to', e.target.value || undefined)}
                className={cn(inputClass(isDark), 'pl-11')}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <label className={cn('mb-2 block text-xs font-semibold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-slate-500')}>
              Search
            </label>
            <div className="relative">
              <Search className={cn('pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-slate-400')} />
              <input
                value={patientFilters.search ?? ''}
                onChange={(e) => onPatientFilterChange('search', e.target.value)}
                placeholder="Search by patient name, phone, or email"
                className={cn(inputClass(isDark), 'pl-11')}
              />
            </div>
          </div>

          <div>
            <label className={cn('mb-2 block text-xs font-semibold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-slate-500')}>
              Patient Status
            </label>
            <select
              value={patientFilters.status ?? ''}
              onChange={(e) => onPatientFilterChange('status', e.target.value || undefined)}
              className={selectClass(isDark)}
            >
              <option value="">All patient statuses</option>
              {PATIENT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={cn('mb-2 block text-xs font-semibold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-slate-500')}>
              Period
            </label>
            <select
              value={patientFilters.period ?? ''}
              onChange={(e) => onPatientFilterChange('period', e.target.value || undefined)}
              className={selectClass(isDark)}
            >
              <option value="">Custom / none</option>
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={cn('mb-2 block text-xs font-semibold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-slate-500')}>
              Date From
            </label>
            <div className="relative">
              <CalendarRange className={cn('pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-slate-400')} />
              <input
                type="date"
                value={patientFilters.date_from ?? ''}
                onChange={(e) => onPatientFilterChange('date_from', e.target.value || undefined)}
                className={cn(inputClass(isDark), 'pl-11')}
              />
            </div>
          </div>

          <div>
            <label className={cn('mb-2 block text-xs font-semibold uppercase tracking-[0.14em]', isDark ? 'text-slate-400' : 'text-slate-500')}>
              Date To
            </label>
            <div className="relative">
              <CalendarRange className={cn('pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2', isDark ? 'text-slate-500' : 'text-slate-400')} />
              <input
                type="date"
                value={patientFilters.date_to ?? ''}
                onChange={(e) => onPatientFilterChange('date_to', e.target.value || undefined)}
                className={cn(inputClass(isDark), 'pl-11')}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default FacilityGovernanceFiltersPanel;
