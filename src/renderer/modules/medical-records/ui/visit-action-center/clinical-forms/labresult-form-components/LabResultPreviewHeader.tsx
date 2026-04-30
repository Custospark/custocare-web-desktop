// lab-results/labresult-form-components/LabResultPreviewHeader.tsx
import React from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Building2,
} from 'lucide-react';
import type { LabRequest } from '../../../../api/lab/LabTypes';

interface LabResultPreviewHeaderProps {
  request: LabRequest;
}

export const LabResultPreviewHeader: React.FC<LabResultPreviewHeaderProps> = ({
  request,
}) => {
  const facilityName = request.facility?.facility_name || 'MEDICAL FACILITY';
  const facilityCode = request.facility?.facility_uuid || 'N/A';

  return (
    <div className="mb-6 border-b-2 border-blue-600 pb-5 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
        <Building2 className="h-7 w-7 text-blue-600" />
      </div>

      <h1 className="text-2xl font-black tracking-tight text-slate-900">
        {facilityName.toUpperCase()}
      </h1>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
          Laboratory Services
        </span>
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          Official Result Report
        </span>
      </div>

      <div className="mt-3 space-y-1 text-xs text-gray-600">
        <p className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {request.facility?.facility_name || 'Address not available'}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <span className="inline-flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" />
            N/A
          </span>
          <span className="inline-flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" />
            N/A
          </span>
        </div>
      </div>

      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
        Facility Number: {facilityCode}
      </p>

      <div className="mt-4 rounded-xl bg-gradient-to-r from-blue-50 to-emerald-50 px-4 py-3">
        <p className="text-lg font-black tracking-wide text-blue-700">
          LABORATORY RESULT REPORT
        </p>
      </div>
    </div>
  );
};

export default LabResultPreviewHeader;
