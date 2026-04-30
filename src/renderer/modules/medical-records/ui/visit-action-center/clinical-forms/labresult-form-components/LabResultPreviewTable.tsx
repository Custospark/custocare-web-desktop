// lab-results/labresult-form-components/LabResultPreviewTable.tsx
import React from 'react';
import type { LabResultPreviewRow } from './labResultForm.types';

interface LabResultPreviewTableProps {
  rows: LabResultPreviewRow[];
}

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

  if (normalized.includes('critical')) return 'text-red-700';
  if (normalized.includes('high') || normalized.includes('abnormal')) return 'text-amber-700';
  if (normalized.includes('low')) return 'text-blue-700';
  if (normalized.includes('normal')) return 'text-emerald-700';
  return 'text-gray-700';
};

export const LabResultPreviewTable: React.FC<LabResultPreviewTableProps> = ({
  rows,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse">
        <thead>
          <tr>
            <th className="border border-blue-200 bg-blue-50 px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-blue-700">
              Test
            </th>
            <th className="border border-blue-200 bg-blue-50 px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-blue-700">
              Parameter
            </th>
            <th className="border border-blue-200 bg-blue-50 px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-blue-700">
              Result
            </th>
            <th className="border border-blue-200 bg-blue-50 px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-blue-700">
              Unit
            </th>
            <th className="border border-blue-200 bg-blue-50 px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-blue-700">
              Reference Range
            </th>
            <th className="border border-blue-200 bg-blue-50 px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-blue-700">
              Flag
            </th>
            <th className="border border-blue-200 bg-blue-50 px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-blue-700">
              Interpretation
            </th>
            <th className="border border-blue-200 bg-blue-50 px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-blue-700">
              Comments
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.rowId} className={getFlagRowClass(row.flag)}>
              <td className="border border-gray-200 px-3 py-3 text-xs font-semibold text-gray-900">
                <div>{row.testName}</div>
                <div className="mt-1 text-[11px] font-medium text-gray-500">
                  {row.testCode} • {row.category}
                </div>
              </td>
              <td className="border border-gray-200 px-3 py-3 text-xs text-gray-800">
                {row.parameter}
              </td>
              <td className="border border-gray-200 px-3 py-3 text-xs font-bold text-gray-900">
                {row.value}
              </td>
              <td className="border border-gray-200 px-3 py-3 text-xs text-gray-800">
                {row.unit}
              </td>
              <td className="border border-gray-200 px-3 py-3 text-xs text-gray-800">
                {row.referenceRange}
              </td>
              <td className={`border border-gray-200 px-3 py-3 text-xs font-bold ${getFlagTextClass(row.flag)}`}>
                {row.flag}
              </td>
              <td className="border border-gray-200 px-3 py-3 text-xs text-gray-800">
                {row.interpretation}
              </td>
              <td className="border border-gray-200 px-3 py-3 text-xs text-gray-800">
                {row.comments}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LabResultPreviewTable;
