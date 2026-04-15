import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Shield } from 'lucide-react';
import type {
  Facility,
  FacilitiesResponse,
} from  '../../statistics/api/platform-control/PlatformControlTypes';
import { InfoPill, PaginationControls } from './facilityGovernance.primitives';
import { formatCurrency } from '../../../medical-records/ui/visit-action-center/billing-space';
import { formatText } from '../../../medical-records/ui/revenue/stats/billing-revenue-stats-component/revenueDashboardUtils';
import {
  cn,
  formatAddress,
  formatDate,
  formatNumber,
  formatStatusLabel,
  getFacilityStatusStyles,
  getOperationalStatusStyles,
  getPanelClass,
  getSubtlePanelClass,
  safeText,
} from './facilityGovernance.utils';

interface FacilityGovernanceFacilityTableProps {
  isDark: boolean;
  facilities: Facility[];
  meta?: FacilitiesResponse['meta'];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  isFetching: boolean;
  onPageChange: (page: number) => void;
  onViewDetails: (facility: Facility) => void;
  onOpenStatus: (facility: Facility) => void;
}

const FacilityGovernanceFacilityTable: React.FC<FacilityGovernanceFacilityTableProps> = ({
  isDark,
  facilities,
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
            Facility Registry
          </h2>
          <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
            Review all facilities, ownership, staffing footprint, lifecycle status, and billing posture.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <InfoPill
            isDark={isDark}
            label="Total"
            value={formatNumber(meta?.facility_counts.total ?? totalItems)}
          />
          <InfoPill
            isDark={isDark}
            label="Active"
            value={formatNumber(meta?.facility_counts.active)}
          />
          <InfoPill
            isDark={isDark}
            label="Suspended"
            value={formatNumber(meta?.facility_counts.suspended)}
          />
          <InfoPill
            isDark={isDark}
            label="Banned"
            value={formatNumber(meta?.facility_counts.banned)}
          />
        </div>
      </div>

      <div className={cn(subtlePanelClass, 'overflow-hidden')}>
        <div className="overflow-x-auto">
          <table className="min-w-[1400px] w-full">
            <thead>
              <tr className={cn(isDark ? 'bg-white/[0.03]' : 'bg-slate-50')}>
                {[
                  'Facility',
                  'Owner',
                  'Location / Contact',
                  'Statuses',
                  'Staff',
                  'Billing',
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
              {facilities.map((facility) => (
                <tr
                  key={facility.id}
                  className={cn(
                    'border-t align-top',
                    isDark
                      ? 'border-white/10 hover:bg-white/[0.02]'
                      : 'border-slate-200 hover:bg-slate-50/70'
                  )}
                >
                  <td className="px-5 py-4">
                    <div className="min-w-[220px]">
                      <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                        {facility.name}
                      </p>
                      <p className={cn('mt-1 text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                        Facility No: {safeText(facility.facility_code)}
                      </p>
                    
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="min-w-[180px] space-y-1">
                      <p className={cn('text-sm font-medium', isDark ? 'text-slate-200' : 'text-slate-800')}>
                        {safeText(facility.owner?.name)}
                      </p>
                      <p className={cn('text-xs break-all', isDark ? 'text-slate-400' : 'text-slate-600')}>
                        {safeText(facility.owner?.email)}
                      </p>
                      <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-slate-600')}>
                        {safeText(facility.owner?.phone)}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="min-w-[260px] space-y-2">
                      <p className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-700')}>
                        {formatAddress(facility.location)}
                      </p>
                      <div className="space-y-1">
                        <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                          Phone: {safeText(facility.phone)}
                        </p>
                        <p className={cn('text-xs break-all', isDark ? 'text-slate-500' : 'text-slate-500')}>
                          Email: {safeText(facility.email)}
                        </p>
                      </div>
                    </div>
                  </td>

              <td className="px-5 py-4">
                <div className="min-w-[220px] space-y-3">
                    {/* Platform Status */}
                    <div className="flex items-center justify-between">
                    <span className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-slate-500')}>
                        Platform Status:
                    </span>
                    <span
                        className={cn(
                        'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                        getFacilityStatusStyles(facility.status, isDark)
                        )}
                    >
                        {formatStatusLabel(facility.status)}
                    </span>
                    </div>

                    {/* Clinical Status */}
                    <div className="flex items-center justify-between">
                    <span className={cn('text-xs font-medium', isDark ? 'text-slate-400' : 'text-slate-500')}>
                        Clinical Status:
                    </span>
                    <span
                        className={cn(
                        'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                        getOperationalStatusStyles(facility.operational_status, isDark)
                        )}
                    >
                        {formatStatusLabel(facility.operational_status)}
                    </span>
                                </div>

                                {/* Reason & Set Date */}
                                <div className={cn('mt-2 space-y-1 text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                                <p>Reason: {safeText(facility.status_reason)}</p>
                                <p>Set: {formatDate(facility.status_set_at)}</p>
                                </div>
                            </div>
            </td>

                  <td className="px-5 py-4">
                    <div className="min-w-[180px]">
                      <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                        {formatNumber(facility.staff_count)}
                      </p>
                      <p className={cn('mt-1 text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                        listed staff members
                      </p>

                      {!!facility.staff?.length && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {facility.staff.slice(0, 3).map((staffMember, index) => (
                            <span
                              key={`${staffMember.name}-${index}`}
                              className={cn(
                                'rounded-full px-2.5 py-1 text-[11px] font-medium',
                                isDark
                                  ? 'bg-white/5 text-slate-300'
                                  : 'bg-slate-100 text-slate-700'
                              )}
                            >
                              {formatText(staffMember.role)}
                            </span>
                          ))}
                          {facility.staff.length > 3 && (
                            <span
                              className={cn(
                                'rounded-full px-2.5 py-1 text-[11px] font-medium',
                                isDark
                                  ? 'bg-white/5 text-slate-300'
                                  : 'bg-slate-100 text-slate-700'
                              )}
                            >
                              +{facility.staff.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="min-w-[160px] space-y-2">
                      <div>
                        <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                          Total Paid
                        </p>
                        <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                          {formatCurrency(facility.billing?.total_paid,facility.facility_currency)}
                        </p>
                      </div>

                      <div>
                        <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                          Balance
                        </p>
                        <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                          {formatCurrency(facility.billing?.balance,facility.facility_currency)}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="min-w-[120px]">
                      <p className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-700')}>
                        {formatDate(facility.created_at)}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                <div className="flex min-w-[180px] flex-col gap-2">
                    <button
                    type="button"
                    onClick={() => onViewDetails(facility)}
                    className={cn(
                        'cursor-pointer inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all',
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
                    onClick={() => onOpenStatus(facility)}
                    className={cn(
                        'cursor-pointer inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all',
                        isDark
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    )}
                    >
                    <Shield className="h-4 w-4" />
                    Update Status
                    </button>
                </div>
                </td>
                </tr>
              ))}
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
            Refreshing facility records...
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

export default FacilityGovernanceFacilityTable;
