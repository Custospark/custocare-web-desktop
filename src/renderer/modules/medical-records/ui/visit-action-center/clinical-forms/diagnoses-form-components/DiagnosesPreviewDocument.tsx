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
  CheckCircle,
  AlertTriangle,
  Info,
  Activity,
} from 'lucide-react';
import { useGetFacilityIdentity } from '../../../../api/facility/FacilityQueries';
import type { RootState } from '../../../../../../app/store/rootReducer';
import {
  formatDiagnosisDate,
  formatDiagnosisDateTime,
  getDiagnosisMeta,
} from './diagnosesForm.utils';
import {
  DIAGNOSIS_TYPE_LABELS,
  DIAGNOSIS_CERTAINTY_LABELS,
  DIAGNOSIS_CLINICAL_STATUS_LABELS,
  DIAGNOSIS_VERIFICATION_STATUS_LABELS,
} from '../../../../api/diagnosis/diagnosisTypes';
import type {
  DiagnosisResponse,
  DiagnosesFormValues,
} from './diagnosesForm.types';

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

interface DiagnosesPreviewDocumentProps {
  diagnosis: DiagnosisResponse | null;
  values: DiagnosesFormValues;
}

export const DiagnosesPreviewDocument: React.FC<DiagnosesPreviewDocumentProps> = ({
  diagnosis,
}) => {
  const meta = getDiagnosisMeta(diagnosis);

  // Format clinician name with Dr. prefix
  const clinicianName = diagnosis?.staff?.full_name || meta.staffName || 'Not specified';
  const formattedClinicianName = clinicianName !== 'Not specified' ? `Dr. ${clinicianName}` : clinicianName;

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
        name: diagnosis?.facility?.name || 'MEDICAL FACILITY',
        code: 'N/A',
        email: null,
        phone: null,
        address: 'Address not available',
      };

  // Get patient name from diagnosis or fallback
  const patientName = diagnosis?.patient?.full_name || meta.patientName || 'Unknown Patient';
  const patientNumber = diagnosis?.patient_number?.toString() || 'N/A';

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
            Clinical Documentation
          </span>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 print:bg-transparent print:p-0 print:text-gray-600">
            Diagnosis Report
          </span>
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
            DIAGNOSIS REPORT
          </p>
        </div>
      </div>

      {/* Meta Info Section */}
      <div className="my-6 bg-gray-50 rounded-lg p-4 space-y-2 print:my-4 print:bg-transparent print:p-0 print:border print:border-gray-200 print:rounded-lg print:p-3">
        <InfoRow
          icon={<Calendar className="h-3.5 w-3.5" />}
          label="Report Date"
          value={formatDiagnosisDate(new Date().toISOString())}
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
          label="Clinician Name"
          value={formattedClinicianName}
        />
        <InfoRow
          icon={<Calendar className="h-3.5 w-3.5" />}
          label="Recorded Date"
          value={formatDiagnosisDate(meta.createdAt)}
        />
      </div>

      {/* Diagnosis Details */}
      <div className="mt-6 print:mt-4">
        {/* Diagnosis Header */}
        <div className="mb-4 border-b border-slate-200 pb-3">
          <h2 className="text-sm font-bold text-slate-800 print:text-lg">
            {diagnosis?.diagnosis_code} - {diagnosis?.diagnosis_description}
          </h2>
        </div>

        {/* Diagnosis Grid - ALL FIELDS NOW VISIBLE */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Diagnosis Type */}
          <div className="rounded-xl border border-slate-200 p-3">
            <span className="text-xs font-medium text-slate-500">Diagnosis Type</span>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {diagnosis ? DIAGNOSIS_TYPE_LABELS[diagnosis.diagnosis_type] : '—'}
            </p>
          </div>

          {/* Certainty */}
          <div className="rounded-xl border border-slate-200 p-3">
            <span className="text-xs font-medium text-slate-500">Certainty</span>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {diagnosis ? DIAGNOSIS_CERTAINTY_LABELS[diagnosis.certainty] : '—'}
            </p>
          </div>

          {/* Clinical Status */}
          <div className="rounded-xl border border-slate-200 p-3">
            <span className="text-xs font-medium text-slate-500">Clinical Status</span>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {diagnosis ? DIAGNOSIS_CLINICAL_STATUS_LABELS[diagnosis.clinical_status] : '—'}
            </p>
          </div>

          {/* Verification Status */}
          <div className="rounded-xl border border-slate-200 p-3">
            <span className="text-xs font-medium text-slate-500">Verification Status</span>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {diagnosis ? DIAGNOSIS_VERIFICATION_STATUS_LABELS[diagnosis.verification_status] : '—'}
            </p>
          </div>

          {/* Onset Date */}
          <div className="rounded-xl border border-slate-200 p-3">
            <span className="text-xs font-medium text-slate-500">Onset Date</span>
            <p className="mt-1 text-sm text-slate-700">
              {diagnosis?.onset_date ? formatDiagnosisDate(diagnosis.onset_date) : 'Not recorded'}
            </p>
          </div>

          {/* Abatement Date */}
          <div className="rounded-xl border border-slate-200 p-3">
            <span className="text-xs font-medium text-slate-500">Abatement Date</span>
            <p className="mt-1 text-sm text-slate-700">
              {diagnosis?.abatement_date ? formatDiagnosisDate(diagnosis.abatement_date) : 'Not recorded'}
            </p>
          </div>
        </div>

        {/* Clinical Notes */}
        {diagnosis?.clinical_notes && (
          <div className="mt-4 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700">Clinical Notes</span>
            </div>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{diagnosis.clinical_notes}</p>
          </div>
        )}

        {/* Diagnostic Criteria Met */}
        {diagnosis?.diagnostic_criteria_met && (
          <div className="mt-4 rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700">Diagnostic Criteria Met</span>
            </div>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{diagnosis.diagnostic_criteria_met}</p>
          </div>
        )}

        {/* Verification Info */}
        {diagnosis?.verified_at && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Verified</span>
            </div>
            <p className="mt-1 text-sm text-green-700">
              Verified on {formatDiagnosisDateTime(diagnosis.verified_at)}
              {diagnosis?.verifier?.full_name && ` by Dr. ${diagnosis.verifier.full_name}`}
            </p>
          </div>
        )}

        {/* Dispute Info */}
        {diagnosis?.dispute_reason && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">Disputed</span>
            </div>
            <p className="mt-1 text-sm text-red-700">Reason: {diagnosis.dispute_reason}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 border-t-2 border-gray-200 pt-4 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Electronically Generated Diagnosis Report
          </span>
        </div>

        <p className="mx-auto max-w-3xl text-[11px] leading-5 text-gray-600">
          This diagnosis report is part of the patient's medical record and must be interpreted 
          in the full clinical context by an authorized healthcare professional.
        </p>

        <p className="mt-3 text-[11px] font-semibold text-gray-700">
          Custocare
        </p>
        <p className="text-[10px] italic text-gray-400">
          &ldquo;Continuous Care. Clinical Excellence.&rdquo;
        </p>

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

        {diagnosis?.id && (
          <p className="mt-2 text-[9px] font-mono text-gray-400 break-all">
            Document ID: {diagnosis.id}
          </p>
        )}
      </div>
    </div>
  );
};

export default DiagnosesPreviewDocument;