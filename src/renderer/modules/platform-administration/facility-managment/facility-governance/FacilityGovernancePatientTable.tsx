import React from 'react';
import { motion } from 'framer-motion';
import type {
  PatientsResponse,
  Patient,
} from '../../statistics/api/platform-control/PlatformControlTypes';
import { InfoPill, PaginationControls } from './facilityGovernance.primitives';
import { formatText } from '../../../medical-records/ui/revenue/stats/billing-revenue-stats-component/revenueDashboardUtils';
import {
  cn,
  formatDate,
  formatNumber,
  getPanelClass,
  getPatientStatusStyles,
  getSubtlePanelClass,
  safeText,
} from './facilityGovernance.utils';

interface FacilityGovernancePatientTableProps {
  isDark: boolean;
  patients: Patient[];
  meta?: PatientsResponse['meta'];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  isFetching: boolean;
  onPageChange: (page: number) => void;
}

const FacilityGovernancePatientTable: React.FC<FacilityGovernancePatientTableProps> = ({
  isDark,
  patients,
  meta,
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  isFetching,
  onPageChange,
}) => {
  const panelClass = getPanelClass(isDark);
  const subtlePanelClass = getSubtlePanelClass(isDark);

  // Calculate the starting index for the current page
  const startIndex = (currentPage - 1) * pageSize;

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
            Patient Registry Oversight
          </h2>
          <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
            Platform-wide patient record visibility including demographics, identifiers, and lifecycle status.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <InfoPill
            isDark={isDark}
            label="Total"
            value={formatNumber(meta?.counts.total ?? totalItems)}
          />
          <InfoPill
            isDark={isDark}
            label="Active"
            value={formatNumber(meta?.counts.active)}
          />
          <InfoPill
            isDark={isDark}
            label="Inactive"
            value={formatNumber(meta?.counts.inactive)}
          />
          <InfoPill
            isDark={isDark}
            label="Deceased"
            value={formatNumber(meta?.counts.deceased)}
          />
        </div>
      </div>

      <div className={cn(subtlePanelClass, 'overflow-hidden')}>
        <div className="overflow-x-auto">
          <table className="min-w-[1300px] w-full">
            <thead>
              <tr className={cn(isDark ? 'bg-white/[0.03]' : 'bg-slate-50')}>
                {/* Added # column */}
                <th
                  className={cn(
                    'px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] w-16',
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  )}
                >
                  #
                </th>
                {[
                  'Patient',
                  'Contacts',
                  'Patient No.',
                  'Birth / Sex',
                  'Status',
                  'Created',
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
              {patients.map((patient, index) => {
                const rowNumber = startIndex + index + 1;
                return (
                  <tr
                    key={patient.id}
                    className={cn(
                      'border-t',
                      isDark
                        ? 'border-white/10 hover:bg-white/[0.02]'
                        : 'border-slate-200 hover:bg-slate-50/70'
                    )}
                  >
                    {/* Row number cell */}
                    <td className="px-4 py-4 text-center">
                      <span
                        className={cn(
                          'text-sm font-mono',
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        )}
                      >
                        {rowNumber}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="min-w-[220px]">
                        <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-slate-900')}>
                          {patient.name}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="min-w-[220px] space-y-1">
                        <p className={cn('text-sm break-all', isDark ? 'text-slate-300' : 'text-slate-700')}>
                          {safeText(patient.email)}
                        </p>
                        <p className={cn('text-xs', isDark ? 'text-slate-500' : 'text-slate-500')}>
                          {safeText(patient.phone)}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="min-w-[260px]">
                        <p className={cn('text-xs break-all', isDark ? 'text-slate-400' : 'text-slate-600')}>
                          {safeText(patient.patient_uuid)}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="min-w-[150px] space-y-1">
                        <p className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-700')}>
                          {formatDate(patient.date_of_birth)}
                        </p>
                        <p className={cn('text-xs capitalize', isDark ? 'text-slate-500' : 'text-slate-500')}>
                          {safeText(patient.biological_sex)}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="min-w-[140px]">
                        <span
                          className={cn(
                            'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                            getPatientStatusStyles(patient.status, isDark)
                          )}
                        >
                          {formatText(patient.status ?? "")}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="min-w-[120px]">
                        <p className={cn('text-sm', isDark ? 'text-slate-300' : 'text-slate-700')}>
                          {formatDate(patient.created_at)}
                        </p>
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
            Refreshing patient registry...
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

export default FacilityGovernancePatientTable;