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
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-[10px] font-medium text-gray-500 min-w-[65px]">{label}:</span>
      <span className="text-[10px] text-gray-700">{formattedDate}</span>
      {staffName && (
        <span 
          className="text-[9px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full"
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
    <tr className="bg-gray-100">
      <th className="border border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
        Test / Parameter
      </th>
      <th className="border border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
        Result
      </th>
      <th className="border border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
        Unit
      </th>
      <th className="border border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
        Reference Range
      </th>
      <th className="border border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
        Flag
      </th>
      <th className="border border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
        Interpretation
      </th>
      <th className="border border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
        Audit Trail
      </th>
    </tr>
  </thead>
);

// ============================================
// Table Row Component
// ============================================

const TableRow: React.FC<{ row: LabResultPreviewRow }> = ({ row }) => (
  <tr className={getFlagRowClass(row.flag)}>
    {/* Test / Parameter Column */}
    <td className="border border-gray-200 px-4 py-3">
      <div className="text-sm font-semibold text-gray-900">{row.testName}</div>
      <div className="mt-0.5 text-[11px] font-medium text-gray-500">
        {row.testCode} • {row.category}
      </div>
      <div className="mt-1 text-[11px] text-gray-400 italic">{row.parameter}</div>
    </td>
    
    {/* Result Column */}
    <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900">
      {row.value}
    </td>
    
    {/* Unit Column */}
    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">
      {row.unit}
    </td>
    
    {/* Reference Range Column */}
    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">
      {row.referenceRange}
    </td>
    
    {/* Flag Column */}
    <td className={`border border-gray-200 px-4 py-3 text-sm ${getFlagTextClass(row.flag)}`}>
      {row.flag.toUpperCase()}
    </td>
    
    {/* Interpretation Column */}
    <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">
      {row.interpretation || '—'}
    </td>
    
    {/* Audit Trail Column */}
    <td className="border border-gray-200 px-4 py-3">
      <div className="space-y-1">
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
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full min-w-[1200px] border-collapse">
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