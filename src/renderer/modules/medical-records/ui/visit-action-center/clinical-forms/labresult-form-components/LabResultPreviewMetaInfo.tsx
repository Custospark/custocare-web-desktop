// lab-results/labresult-form-components/LabResultPreviewMetaInfo.tsx
import React from 'react';
import {
  Calendar,
  ClipboardList,
  Clock3,
  FileDigit,
  FlaskConical,
  ShieldCheck,
  User,
} from 'lucide-react';
import type { LabRequest } from '../../../../api/lab/LabTypes';
import type { LabResultPreviewRow } from './labResultForm.types';
import {
  formatDisplayDate,
  formatDisplayDateTime,
  formatDisplayTime,
} from './labResultForm.utils';

interface LabResultPreviewMetaInfoProps {
  request: LabRequest;
  rows: LabResultPreviewRow[];
}

const MetaRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
    <span className="flex items-center gap-1 text-xs font-semibold text-gray-600">
      {icon}
      {label}
    </span>
    <span className="text-xs font-bold text-gray-900 break-all sm:text-right">
      {value}
    </span>
  </div>
);

export const LabResultPreviewMetaInfo: React.FC<LabResultPreviewMetaInfoProps> = ({
  request,
  rows,
}) => {
  return (
    <div className="my-5 space-y-4 border-y-2 border-gray-200 py-4">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-2.5">
          <MetaRow
            icon={<FileDigit className="h-3.5 w-3.5" />}
            label="Request Number"
            value={request.request_uuid || 'N/A'}
          />
          <MetaRow
            icon={<User className="h-3.5 w-3.5" />}
            label="Patient Name"
            value={request.patient?.full_name || 'Unknown patient'}
          />
          <MetaRow
            icon={<ClipboardList className="h-3.5 w-3.5" />}
            label="Patient Number"
            value={request.patient?.medical_record_number || request.patient?.patient_uuid || 'N/A'}
          />
          <MetaRow
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Visit Number"
            value={request.visit?.visit_uuid || request.visit_id || 'N/A'}
          />
          <MetaRow
            icon={<FlaskConical className="h-3.5 w-3.5" />}
            label="Reported Tests"
            value={rows.length}
          />
        </div>

        <div className="space-y-2.5">
          <MetaRow
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Request Date"
            value={formatDisplayDate(request.requested_at)}
          />
          <MetaRow
            icon={<Clock3 className="h-3.5 w-3.5" />}
            label="Request Time"
            value={formatDisplayTime(request.requested_at)}
          />
          <MetaRow
            icon={<FlaskConical className="h-3.5 w-3.5" />}
            label="Completed At"
            value={formatDisplayDateTime(request.completed_at)}
          />
          <MetaRow
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
            label="Reviewed At"
            value={formatDisplayDateTime(request.reviewed_at)}
          />
          <MetaRow
            icon={<User className="h-3.5 w-3.5" />}
            label="Requested By"
            value={request.requested_by?.name || 'N/A'}
          />
        </div>
      </div>
    </div>
  );
};

export default LabResultPreviewMetaInfo;
