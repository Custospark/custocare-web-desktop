import React from 'react';
import { useSelector } from 'react-redux';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  User,
  Fingerprint,
  Stethoscope,
  ShieldCheck,
  Sparkles,
  FlaskConical,
} from 'lucide-react';
import { useGetFacilityIdentity } from '../../../../api/facility/FacilityQueries';
import type { RootState } from '../../../../../../app/store/rootReducer';
import type { LabRequest } from '../../../../api/lab/LabTypes';
import {
  formatDisplayDate,
  formatDisplayDateTime,
  formatLabel,
  getPriorityClasses,
  getRequestStatusClasses,
} from '../labresult-form-components/labResultForm.utils';
import { cn } from '../../../../../../shared/utils/classNameUtils';

// Helper component for info rows
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

interface LabRequestPreviewDocumentProps {
  request: LabRequest | null;
}

export const LabRequestPreviewDocument: React.FC<LabRequestPreviewDocumentProps> = ({
  request,
}) => {
  // Get facility info from Redux
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
        name: request?.facility?.facility_name || 'MEDICAL FACILITY',
        code: 'N/A',
        email: null,
        phone: null,
        address: 'Address not available',
      };

  // Get patient name from request or fallback
  const patientName = request?.patient?.full_name || 'Unknown Patient';
  const patientNumber = request?.patient?.patient_uuid || 'N/A';

  // Format clinician name with Dr. prefix
  const clinicianName = request?.requested_by?.name || 'Not specified';
  const formattedClinicianName = clinicianName !== 'Not specified' && !clinicianName.startsWith('Dr.')
    ? `Dr. ${clinicianName}`
    : clinicianName;

  const priorityClasses = request ? getPriorityClasses(request.priority, false) : '';
  const statusClasses = request ? getRequestStatusClasses(request.status, false) : '';

  const requestedTests = request?.items || [];
  const hasTests = requestedTests.length > 0;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0">
        <div className="mb-6 border-b-2 border-blue-600 pb-5 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
            <Building2 className="h-7 w-7 text-blue-600" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
      {/* Facility Header */}
      <div className="mb-6 border-b-2 border-blue-600 pb-5 text-center print:mb-4 print:pb-4">
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
            Laboratory Request Report
          </span>
          {request?.priority && (
            <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', priorityClasses)}>
              {formatLabel(request.priority)}
            </span>
          )}
          {request?.status && (
            <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', statusClasses)}>
              {formatLabel(request.status)}
            </span>
          )}
        </div>

        <div className="mt-3 space-y-1 text-xs text-gray-600 print:mt-2">
          <p className="inline-flex items-center gap-1 print:gap-1.5">
            <MapPin className="h-3.5 w-3.5 print:hidden" />
            {facility.address}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 print:gap-3">
            {facility.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 print:hidden" />
                {facility.phone}
              </span>
            )}
            {facility.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 print:hidden" />
                {facility.email}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 print:mt-2">
          <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500 print:bg-transparent print:p-0 print:text-gray-400">
            Facility Number: <span className="text-gray-700 print:text-gray-900">{facility.code}</span>
          </span>
        </div>

        <div className="mt-4 rounded-xl bg-gradient-to-r from-blue-50 to-emerald-50 px-4 py-3 print:mt-3 print:rounded-none print:bg-transparent print:border-y print:border-gray-200 print:py-2">
          <p className="text-lg font-black tracking-wide text-blue-700 print:text-base print:text-slate-900">
            LABORATORY REQUEST REPORT
          </p>
         
        </div>
      </div>

      {/* Meta Info Section */}
      <div className="my-6 bg-gray-50 rounded-lg p-4 space-y-2 print:my-4 print:bg-transparent print:p-0 print:border print:border-gray-200 print:rounded-lg print:p-3">
        <InfoRow
          icon={<Calendar className="h-3.5 w-3.5" />}
          label="Report Date"
          value={formatDisplayDate(new Date().toISOString())}
        />
        <InfoRow
          icon={<Clock className="h-3.5 w-3.5" />}
          label="Report Time"
          value={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        />

        <InfoRow
          icon={<User className="h-3.5 w-3.5" />}
          label="Patient Name"
          value={patientName}
        />
        <InfoRow
          icon={<Fingerprint className="h-3.5 w-3.5" />}
          label="Patient Number"
          value={patientNumber}
        />

        <InfoRow
          icon={<Stethoscope className="h-3.5 w-3.5" />}
          label="Requested By"
          value={formattedClinicianName}
        />
        <InfoRow
          icon={<Calendar className="h-3.5 w-3.5" />}
          label="Request Date"
          value={formatDisplayDateTime(request?.requested_at)}
        />
      </div>

      {/* Clinical Context Section */}
      {(request?.clinical_notes ||
        request?.diagnosis_context?.notes ||
        request?.diagnosis_context?.suspected_conditions?.length ||
        request?.diagnosis_context?.icd_codes?.length) && (
        <div className="mb-6 rounded-xl border border-slate-200 p-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
            Clinical Context
          </h3>
          <div className="space-y-3">
            {request?.clinical_notes && (
              <div>
                <p className="text-xs font-medium text-slate-500">Clinical Notes</p>
                <p className="mt-1 text-sm text-slate-700">{request.clinical_notes}</p>
              </div>
            )}
            {request?.diagnosis_context?.notes && (
              <div>
                <p className="text-xs font-medium text-slate-500">Diagnosis Notes</p>
                <p className="mt-1 text-sm text-slate-700">{request.diagnosis_context.notes}</p>
              </div>
            )}
           {request?.diagnosis_context?.suspected_conditions && request.diagnosis_context.suspected_conditions.length > 0 && (
            <div>
                <p className="text-xs font-medium text-slate-500">Suspected Conditions</p>
                <div className="mt-1 flex flex-wrap gap-2">
                {request.diagnosis_context.suspected_conditions.map((condition) => (
                    <span key={condition} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                    {condition}
                    </span>
                ))}
                </div>
            </div>
            )}

            {request?.diagnosis_context?.icd_codes && request.diagnosis_context.icd_codes.length > 0 && (
            <div>
                <p className="text-xs font-medium text-slate-500">ICD Codes</p>
                <div className="mt-1 flex flex-wrap gap-2">
                {request.diagnosis_context.icd_codes.map((code) => (
                    <span key={code} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                    {code}
                    </span>
                ))}
                </div>
            </div>
            )}
          </div>
        </div>
      )}

      {/* Requested Tests Table */}
      <div className="mt-6 print:mt-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
          Requested Laboratory Tests
        </h3>

        {!hasTests ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <FlaskConical className="mx-auto mb-3 h-12 w-12 text-slate-400" />
            <p className="text-slate-500">No tests have been requested for this lab request.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700">#</th>
                  <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700">Test Name</th>
                  <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700">Code / Category</th>
                  <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700">Sample Type</th>
                  <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700">Fasting</th>
                  <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700">Turnaround</th>
                  <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {requestedTests.map((item, index) => (
                  <tr key={item.item_uuid} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-200 px-3 py-2 text-center text-sm text-slate-600">
                      {index + 1}
                    </td>
                    <td className="border border-slate-200 px-3 py-2">
                      <div className="text-sm font-medium text-slate-800">
                        {item.lab_test?.name || 'Unknown Test'}
                      </div>
                      {item.notes && (
                        <div className="mt-1 text-xs italic text-slate-500">{item.notes}</div>
                      )}
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-sm text-slate-600">
                      <div>{item.lab_test?.code || '—'}</div>
                      <div className="text-xs text-slate-400">{item.lab_test?.category || '—'}</div>
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-sm text-slate-600">
                      {item.sample_type || '—'}
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-sm text-slate-600">
                      {item.lab_test?.requires_fasting ? (
                        <span className="text-amber-600">Required</span>
                      ) : (
                        <span className="text-slate-400">Not required</span>
                      )}
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-sm text-slate-600">
                      {item.lab_test?.turnaround_time_hours
                        ? `${item.lab_test.turnaround_time_hours} hours`
                        : '—'}
                    </td>
                    <td className="border border-slate-200 px-3 py-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                          item.status === 'verified'
                            ? 'bg-purple-100 text-purple-700'
                            : item.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : item.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-700'
                            : item.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {formatLabel(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancellation Notice */}
      {request?.cancellation_reason && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">Cancelled</span>
          </div>
          <p className="mt-1 text-sm text-red-700">Reason: {request.cancellation_reason}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 border-t-2 border-gray-200 pt-4 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Electronically Generated Laboratory Request
          </span>
        </div>

        <p className="mx-auto max-w-3xl text-[11px] leading-5 text-gray-600">
          This laboratory request report is part of the patient's medical record and must be interpreted
          in the full clinical context by an authorized healthcare professional.
        </p>

        <div className="mt-3 flex items-center justify-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-blue-500" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-600">
            Continuous Care • Clinical Excellence
          </p>
        </div>

        <p className="mt-3 text-[10px] font-mono text-gray-500">
          PRINT TIME:{' '}
          <span className="font-bold text-gray-900">
            {new Date()
              .toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })
              .replace(/,/g, '')}
          </span>
        </p>

        {request?.request_uuid && (
          <p className="mt-2 text-[9px] font-mono text-gray-400 break-all">
            Request ID: {request.request_uuid}
          </p>
        )}
      </div>
    </div>
  );
};

export default LabRequestPreviewDocument;