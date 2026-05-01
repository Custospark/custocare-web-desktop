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
import { RootState } from '../../../../../../app/store/rootReducer';
import { useGetFacilityIdentity } from '../../../../api/facility/FacilityQueries';

interface LabResultPreviewHeaderProps {
  request: LabRequest;
}

export const LabResultPreviewHeader: React.FC<LabResultPreviewHeaderProps> = ({
  request,
}) => {
  // First, try to get facility data from Redux slice
  const activeFacilityId = useSelector((state: RootState) => state.activeContext.activeFacilityId);
  const activeFacility = useSelector((state: RootState) => {
    const staffCapability = state.activeContext.capabilities.staff;
    if (!staffCapability || !activeFacilityId) return null;
    return staffCapability.facilities.find(f => f.facility_id === activeFacilityId);
  });

  // Only fetch if Redux slice doesn't have the facility data
  const shouldFetch = !activeFacility || !activeFacility.facility_name;
  const { data, isLoading, error } = useGetFacilityIdentity({
    enabled: shouldFetch,
  });

  // Helper to get address string
  const getAddressString = (facility: typeof activeFacility): string => {
    if (!facility) return 'Address not available';
    const parts = [
      facility.state_province,
      facility.city,
      facility.address_line1,
      facility.address_line2,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  };

  // If we have data in Redux, use it
  if (activeFacility && activeFacility.facility_name) {
    return (
      <div className="mb-6 border-b-2 border-blue-600 pb-5 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
          <Building2 className="h-7 w-7 text-blue-600" />
        </div>

        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          {activeFacility.facility_name.toUpperCase()}
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
            {getAddressString(activeFacility)}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {activeFacility.main_phone || 'N/A'}
            </span>
            {activeFacility.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {activeFacility.email}
              </span>
            )}
          </div>
        </div>

        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
          Facility Number: {activeFacility.facility_code || 'N/A'}
        </p>

        <div className="mt-4 rounded-xl bg-gradient-to-r from-blue-50 to-emerald-50 px-4 py-3">
          <p className="text-lg font-black tracking-wide text-blue-700">
            LABORATORY RESULT REPORT
          </p>
        </div>
      </div>
    );
  }

  // Fallback to fetching if Redux slice is empty
  if (isLoading) {
    return (
      <div className="mb-6 border-b-2 border-blue-600 pb-5 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
          <Building2 className="h-7 w-7 text-blue-600" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          LOADING...
        </h1>
      </div>
    );
  }

  if (error || !data?.data?.facility) {
    // Final fallback to request.facility data
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
  }

  const facility = data.data.facility;

  const getFetchedAddressString = (): string => {
    if (!facility.address) return 'Address not available';

    if (typeof facility.address === 'string') return facility.address;

    if (typeof facility.address === 'object' && facility.address !== null) {
      if ('formatted' in facility.address && facility.address.formatted) {
        return facility.address.formatted;
      }

      const addr = facility.address as any;
      const parts = [
        addr.street,
        addr.city,
        addr.state,
        addr.country,
      ].filter(Boolean);

      if (parts.length > 0) return parts.join(', ');
    }

    return 'Address not available';
  };

  return (
    <div className="mb-6 border-b-2 border-blue-600 pb-5 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
        <Building2 className="h-7 w-7 text-blue-600" />
      </div>

      <h1 className="text-2xl font-black tracking-tight text-slate-900">
        {facility.name.toUpperCase()}
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
          {getFetchedAddressString()}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <span className="inline-flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" />
            {facility.phone || 'N/A'}
          </span>
          {facility.email && (
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              {facility.email}
            </span>
          )}
        </div>
      </div>

          <p className="mt-3 inline-block rounded-full bg-gray-100 font-bold px-3 py-1 text-2xl uppercase text-black">
        Facility Number: <span className="text-gray-700">{facility.code || 'N/A'}</span>
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