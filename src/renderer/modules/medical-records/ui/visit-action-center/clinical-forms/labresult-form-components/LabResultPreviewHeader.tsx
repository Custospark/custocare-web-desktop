// lab-results/labresult-form-components/LabResultPreviewHeader.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import {
  MapPin,
  Phone,
  Mail,
  Building2,
} from 'lucide-react';
import type { LabRequest } from '../../../../api/lab/LabTypes';
import type { RootState } from '../../../../../../app/store/rootReducer';
import { useGetFacilityIdentity } from '../../../../api/facility/FacilityQueries';

interface LabResultPreviewHeaderProps {
  request: LabRequest;
}

export const LabResultPreviewHeader: React.FC<LabResultPreviewHeaderProps> = ({
  request,
}) => {
  // Redux slice data
  const activeFacilityId = useSelector((state: RootState) => state.activeContext.activeFacilityId);
  const activeFacility = useSelector((state: RootState) => {
    const staffCapability = state.activeContext.capabilities.staff;
    if (!staffCapability || !activeFacilityId) return null;
    return staffCapability.facilities.find(f => f.facility_id === activeFacilityId);
  });

  const shouldFetch = !activeFacility || !activeFacility.facility_name;
  const { data, isLoading } = useGetFacilityIdentity({ enabled: shouldFetch });

  // Determine which facility data to use
  const facility = activeFacility && activeFacility.facility_name
    ? {
        name: activeFacility.facility_name,
        code: activeFacility.facility_code || 'N/A',
        email: activeFacility.email,
        phone: activeFacility.main_phone,
        address: [
          activeFacility.address_line1,
          activeFacility.address_line2,
          activeFacility.city,
          activeFacility.state_province,
        ].filter(Boolean).join(', ') || 'Address not available',
      }
    : data?.data?.facility
    ? {
        name: data.data.facility.name,
        code: data.data.facility.code || 'N/A',
        email: data.data.facility.email,
        phone: data.data.facility.phone,
        address: typeof data.data.facility.address === 'string'
          ? data.data.facility.address
          : data.data.facility.address?.formatted || 'Address not available',
      }
    : {
        name: request.facility?.facility_name || 'MEDICAL FACILITY',
        code: request.facility?.facility_uuid || 'N/A',
        email: null,
        phone: null,
        address: request.facility?.facility_name || 'Address not available',
      };

  if (isLoading) {
    return (
      <div className="mb-6 border-b-2 border-blue-600 pb-5 text-center print:mb-4 print:pb-4">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 print:hidden">
          <Building2 className="h-7 w-7 text-blue-600" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="mb-6 border-b-2 border-blue-600 pb-5 text-center print:mb-4 print:pb-4 print:border-blue-800">
      {/* Icon - hidden in print */}
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 print:hidden">
        <Building2 className="h-7 w-7 text-blue-600" />
      </div>

      <h1 className="text-2xl font-black tracking-tight text-slate-900 print:text-xl">
        {facility.name.toUpperCase()}
      </h1>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 print:mt-1">
        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700 print:bg-transparent print:p-0 print:text-gray-600">
          Laboratory Services
        </span>
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 print:bg-transparent print:p-0 print:text-gray-600">
          Official Result Report
        </span>
      </div>

      <div className="mt-3 space-y-1 text-xs text-gray-600 print:mt-2">
        <p className="inline-flex items-center gap-1 print:gap-1.5">
          <MapPin className="h-3.5 w-3.5 print:hidden" />
          {facility.address}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 print:gap-3">
          <span className="inline-flex items-center gap-1">
            <Phone className="h-3.5 w-3.5 print:hidden" />
            {facility.phone || 'N/A'}
          </span>
          {facility.email && (
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 print:hidden" />
              {facility.email}
            </span>
          )}
        </div>
      </div>

      {/* Facility Number - Cleaner formatting */}
      <div className="mt-3 print:mt-2">
        <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500 print:bg-transparent print:p-0 print:text-gray-400">
          Facility Number: <span className="text-gray-700 print:text-gray-900">{facility.code}</span>
        </span>
      </div>

      {/* Report Title Banner */}
      <div className="mt-4 rounded-xl bg-gradient-to-r from-blue-50 to-emerald-50 px-4 py-3 print:mt-3 print:rounded-none print:bg-transparent print:border-y print:border-gray-200 print:py-2">
        <p className="text-lg font-black tracking-wide text-blue-700 print:text-base print:text-slate-900">
          LABORATORY RESULT REPORT
        </p>
      </div>
    </div>
  );
};

export default LabResultPreviewHeader;