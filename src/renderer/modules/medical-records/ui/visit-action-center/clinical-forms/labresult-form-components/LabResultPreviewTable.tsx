// lab-results/labresult-form-components/LabResultPreviewTable.tsx
import React from 'react';
import type { LabResultPreviewRow } from './labResultForm.types';
import { formatDateTime } from '../../../../../platform-administration/facility-managment/facility-governance/facilityGovernance.utils';

interface LabResultPreviewTableProps {
  rows: LabResultPreviewRow[];
}

// ============================================
// Helper Functions
// ============================================

const getFlagRowClass = (flag: string): string => {
  const normalized = flag.toLowerCase();

  if (normalized.includes('critical')) return 'bg-red-50';
  if (normalized.includes('high') || normalized.includes('abnormal')) return 'bg-amber-50';
  if (normalized.includes('low')) return 'bg-blue-50';
  if (normalized.includes('normal')) return 'bg-emerald-50';
  return 'bg-white';
};

const getFlagTextClass = (flag: string): string => {
  const normalized = flag.toLowerCase();

  if (normalized.includes('critical')) return 'text-red-700 font-bold';
  if (normalized.includes('high') || normalized.includes('abnormal')) return 'text-amber-700 font-semibold';
  if (normalized.includes('low')) return 'text-blue-700 font-semibold';
  if (normalized.includes('normal')) return 'text-emerald-700';
  return 'text-gray-700';
};

const getInitials = (name: string | null | undefined): string => {
  if (!name) return '—';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getDisplayName = (name: string | null | undefined): string => {
  if (!name) return 'Unknown';
  return name.startsWith('Dr.') ? name : `Dr. ${name}`;
};

// ============================================
// Timeline Badge Component
// ============================================

const TimelineBadge: React.FC<{
  label: string;
  date: string | null;
  staffName: string | null | undefined;
}> = ({ label, date, staffName }) => {
  if (!date) return null;

  const initials = getInitials(staffName);
  const displayName = getDisplayName(staffName);
  const formattedDate = formatDateTime(date);

  return (
    <div className="flex items-center gap-2 py-0.5 print:py-0.5 print:gap-1.5">
      <span className="text-[10px] font-medium text-gray-500 min-w-[65px] print:text-[9px]">{label}:</span>
      <span className="text-[10px] text-gray-700 print:text-[9px]">{formattedDate}</span>
      {staffName && (
        <span
          className="text-[9px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full print:bg-transparent print:p-0 print:text-gray-500"
          title={displayName}
        >
          {initials}
        </span>
      )}
    </div>
  );
};

// ============================================
// Table Header Component
// ============================================

const TableHeader: React.FC = () => (
  <thead>
    <tr className="bg-gray-100 print:bg-gray-100">
      <th className="border border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 print:text-[10px] print:py-2 print:px-3">
        Test / Parameter
      </th>
      <th className="border border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 print:text-[10px] print:py-2 print:px-3">
        Result
      </th>
      <th className="border border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 print:text-[10px] print:py-2 print:px-3">
        Unit
      </th>
      <th className="border border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 print:text-[10px] print:py-2 print:px-3">
        Reference Range
      </th>
      <th className="border border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 print:text-[10px] print:py-2 print:px-3">
        Flag
      </th>
      <th className="border border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 print:text-[10px] print:py-2 print:px-3">
        Interpretation
      </th>
      <th className="border border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 print:text-[10px] print:py-2 print:px-3">
        Audit Trail
      </th>
    </tr>
  </thead>
);

// ============================================
// Table Row Component
// ============================================

const TableRow: React.FC<{ row: LabResultPreviewRow }> = ({ row }) => (
  <tr className={`${getFlagRowClass(row.flag)} print:bg-white`}>
    {/* Test / Parameter Column */}
    <td className="border border-gray-200 px-4 py-3 print:px-3 print:py-2">
      <div className="text-sm font-semibold text-gray-900 print:text-xs">{row.testName}</div>
      <div className="mt-0.5 text-[11px] font-medium text-gray-500 print:text-[9px]">
        {row.testCode} • {row.category}
      </div>
      <div className="mt-1 text-[11px] text-gray-400 italic print:text-[9px]">{row.parameter}</div>
    </td>

    {/* Result Column */}
    <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 print:px-3 print:py-2 print:text-xs">
      {row.value}
    </td>

    {/* Unit Column */}
    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600 print:px-3 print:py-2 print:text-xs">
      {row.unit}
    </td>

    {/* Reference Range Column */}
    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600 print:px-3 print:py-2 print:text-xs">
      {row.referenceRange}
    </td>

    {/* Flag Column */}
    <td className={`border border-gray-200 px-4 py-3 text-sm ${getFlagTextClass(row.flag)} print:px-3 print:py-2 print:text-xs`}>
      {row.flag.toUpperCase()}
    </td>

    {/* Interpretation Column */}
    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600 print:px-3 print:py-2 print:text-xs">
      {row.interpretation || '—'}
    </td>

    {/* Audit Trail Column */}
    <td className="border border-gray-200 px-4 py-3 print:px-3 print:py-2">
      <div className="space-y-1 print:space-y-0.5">
        <TimelineBadge
          label="Requested"
          date={row.createdAt}
          staffName={row.createdBy}
        />
        <TimelineBadge
          label="Collected"
          date={row.collectedAt}
          staffName={row.collectedBy}
        />
        <TimelineBadge
          label="Completed"
          date={row.completedAt}
          staffName={row.completedBy}
        />
        {row.verifiedAt && (
          <TimelineBadge
            label="Verified"
            date={row.verifiedAt}
            staffName={row.verifiedBy}
          />
        )}
      </div>
    </td>
  </tr>
);

// ============================================
// Main Component
// ============================================

export const LabResultPreviewTable: React.FC<LabResultPreviewTableProps> = ({ rows }) => {
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg print:overflow-visible print:border-gray-300 print:rounded-none">
      <table className="w-full min-w-[1200px] border-collapse print:min-w-0">
        <TableHeader />
        <tbody>
          {rows.map((row) => (
            <TableRow key={row.rowId} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LabResultPreviewTable;