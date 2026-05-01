// lab-results/labresult-form-components/LabResultPreviewMetaInfo.tsx
import React from 'react';
import {
  Calendar,
  Clock,
  User,
  Fingerprint,
  Stethoscope,
  CalendarDays,
  Beaker,
  CheckCircle2,
  ClipboardCheck,
  Users,
} from 'lucide-react';
import type { LabRequest, LabRequestItem } from '../../../../api/lab/LabTypes';
import type { LabResultPreviewRow } from './labResultForm.types';
import {
  formatDisplayDate,
  formatDisplayDateTime,
} from './labResultForm.utils';

interface LabResultPreviewMetaInfoProps {
  request: LabRequest;
  rows: LabResultPreviewRow[];
}

const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 print:py-1.5">
    <span className="flex items-center gap-2 text-xs font-medium text-gray-500 print:text-[10px]">
      <span className="print:hidden">{icon}</span>
      {label}
    </span>
    <span className="text-xs font-semibold text-gray-800 text-right print:text-[10px]">
      {value}
    </span>
  </div>
);

export const LabResultPreviewMetaInfo: React.FC<LabResultPreviewMetaInfoProps> = ({
  request,
  rows,
}) => {
  const totalTests = rows.length;
  const verifiedTests = request.items?.filter(
    (i: LabRequestItem) => i.status === 'verified'
  ).length || 0;

  return (
    <div className="my-6 bg-gray-50 rounded-lg p-4 space-y-2 print:my-4 print:bg-transparent print:p-0 print:border print:border-gray-200 print:rounded-lg print:p-3">
      {/* Report Information */}
      <InfoRow
        icon={<Calendar className="h-3.5 w-3.5" />}
        label="Report Date"
        value={formatDisplayDate(request.requested_at)}
      />
      <InfoRow
        icon={<Clock className="h-3.5 w-3.5" />}
        label="Report Time"
        value={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      />

      {/* Patient Information */}
      <InfoRow
        icon={<User className="h-3.5 w-3.5" />}
        label="Patient Name"
        value={request.patient?.full_name || 'Unknown patient'}
      />
      <InfoRow
        icon={<Fingerprint className="h-3.5 w-3.5" />}
        label="Patient Number"
        value={request.patient?.patient_uuid || 'N/A'}
      />

      {/* Request Information */}
      <InfoRow
        icon={<Stethoscope className="h-3.5 w-3.5" />}
        label="Requested By"
        value={
          request.requested_by?.name
            ? request.requested_by.name.startsWith('Dr.')
              ? request.requested_by.name
              : `Dr. ${request.requested_by.name}`
            : 'N/A'
        }
      />
      <InfoRow
        icon={<CalendarDays className="h-3.5 w-3.5" />}
        label="Request Date"
        value={formatDisplayDate(request.requested_at)}
      />
      <InfoRow
        icon={<Beaker className="h-3.5 w-3.5" />}
        label="Tests Ordered"
        value={totalTests}
      />
      <InfoRow
        icon={<CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
        label="Results Verified"
        value={
          <span className="inline-flex items-center gap-1">
            {verifiedTests}/{totalTests}
          </span>
        }
      />

      {/* Completion / Review Status */}
      {request.reviewed_at && (
        <InfoRow
          icon={<ClipboardCheck className="h-3.5 w-3.5" />}
          label="Reviewed On"
          value={formatDisplayDateTime(request.reviewed_at)}
        />
      )}
      {request.reviewed_by?.name && (
        <InfoRow
          icon={<Users className="h-3.5 w-3.5" />}
          label="Reviewed By"
          value={request.reviewed_by.name}
        />
      )}
    </div>
  );
};

export default LabResultPreviewMetaInfo;