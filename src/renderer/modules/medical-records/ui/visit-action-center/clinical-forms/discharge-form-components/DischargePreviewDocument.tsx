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
  DoorOpen,
  FileText,
  ListChecks,
  Pill,
} from 'lucide-react';
import { useGetFacilityIdentity } from '../../../../api/facility/FacilityQueries';
import type { RootState } from '../../../../../../app/store/rootReducer';
import type { DischargeData } from '../../../../api/discharge/DischargeTypes';

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return 'N/A';
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

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

interface DischargePreviewDocumentProps {
  dischargeData: DischargeData | null;
  patientName?: string;
}

export const DischargePreviewDocument: React.FC<DischargePreviewDocumentProps> = ({
  dischargeData,
  patientName: patientNameProp,
}) => {
  const activeFacilityId = useSelector((state: RootState) => state.activeContext.activeFacilityId);
  const activeFacility = useSelector((state: RootState) => {
    const staffCapability = state.activeContext.capabilities.staff;
    if (!staffCapability || !activeFacilityId) return null;
    return staffCapability.facilities.find(f => f.facility_id === activeFacilityId);
  });

  const shouldFetch = !activeFacility || !activeFacility.facility_name;
  const { data, isLoading } = useGetFacilityIdentity({ enabled: shouldFetch });

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
        name: 'MEDICAL FACILITY',
        code: 'N/A',
        email: null,
        phone: null,
        address: 'Address not available',
      };

  const activePatient = useSelector((state: RootState) => state.visits.activeVisit?.patient);
  const patientName = patientNameProp || activePatient?.name || 'Unknown Patient';
  const patientNumber = activePatient?.patient_number || `#${dischargeData?.patient_id || ''}`;

  const hasMedications = dischargeData?.discharge_medications && dischargeData.discharge_medications.length > 0;
  const hasDisposition = !!dischargeData?.discharge_disposition;

  const getDispositionLabel = (d: string): string => {
    const labels: Record<string, string> = {
      home: 'Home / Self-Care',
      admitted_to_hospital: 'Admitted to Hospital',
      transferred_to_facility: 'Transferred to Another Facility',
      left_ama: 'Left Against Medical Advice (AMA)',
      left_without_seen: 'Left Without Being Seen',
      expired: 'Expired',
      hospice: 'Hospice Care',
      skilled_nursing_facility: 'Skilled Nursing Facility',
      rehabilitation_facility: 'Rehabilitation Facility',
      psychiatric_facility: 'Psychiatric Facility',
      law_enforcement_custody: 'Law Enforcement Custody',
    };
    return labels[d] || d;
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0">
        <div className="mb-6 border-b-2 border-teal-600 pb-5 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50">
            <Building2 className="h-7 w-7 text-teal-600" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!dischargeData) {
    return (
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0">
        <div className="mb-6 border-b-2 border-teal-600 pb-5 text-center">
          <h1 className="text-xl font-black tracking-tight text-slate-900">No Discharge Data</h1>
        </div>
        <p className="text-center text-sm text-slate-500">
          This patient has not been discharged yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <div className="mb-6 border-b-2 border-teal-600 pb-5 text-center print:mb-4 print:pb-4">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 print:hidden">
          <Building2 className="h-7 w-7 text-teal-600" />
        </div>

        <h1 className="text-2xl font-black tracking-tight text-slate-900 print:text-xl">
          {facility.name.toUpperCase()}
        </h1>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 print:mt-1">
          <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[11px] font-semibold text-teal-700 print:bg-transparent print:p-0 print:text-gray-600">
            Clinical Documentation
          </span>
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700 print:bg-transparent print:p-0 print:text-gray-600">
            Discharge Summary
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

        <div className="mt-4 rounded-xl bg-gradient-to-r from-teal-50 to-blue-50 px-4 py-3 print:mt-3 print:rounded-none print:bg-transparent print:border-y print:border-gray-200 print:py-2">
          <p className="text-lg font-black tracking-wide text-teal-700 print:text-base print:text-slate-900">
            DISCHARGE SUMMARY
          </p>
        </div>
      </div>

      <div className="my-6 bg-gray-50 rounded-lg p-4 space-y-2 print:my-4 print:bg-transparent print:p-0 print:border print:border-gray-200 print:rounded-lg print:p-3">
        <InfoRow
          icon={<Calendar className="h-3.5 w-3.5" />}
          label="Report Date"
          value={formatDateTime(new Date().toISOString())}
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
          icon={<Calendar className="h-3.5 w-3.5" />}
          label="Discharge Date"
          value={formatDateTime(dischargeData.discharged_at)}
        />
        <InfoRow
          icon={<Stethoscope className="h-3.5 w-3.5" />}
          label="Discharged By"
          value={dischargeData.discharged_by?.staff_name
            ? `Dr. ${dischargeData.discharged_by.staff_name}`
            : 'Pending'}
        />
      </div>

      {hasDisposition && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <DoorOpen className="h-4 w-4 text-slate-400" />
            Disposition
          </h3>
          <span className="inline-block rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">
            {getDispositionLabel(dischargeData.discharge_disposition!)}
          </span>
        </div>
      )}

      {dischargeData.discharge_diagnosis && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-slate-400" />
            Discharge Diagnosis
          </h3>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            {dischargeData.discharge_diagnosis}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-400" />
          Discharge Instructions
        </h3>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-line">
          {dischargeData.discharge_instructions}
        </div>
      </div>

      {hasMedications && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Pill className="h-4 w-4 text-slate-400" />
            Discharge Medications ({dischargeData.discharge_medications.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600">Medication</th>
                  <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600">Dosage</th>
                  <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600">Frequency</th>
                  <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600">Route</th>
                  <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600">Duration</th>
                </tr>
              </thead>
              <tbody>
                {dischargeData.discharge_medications.map((med, idx) => (
                  <tr key={idx} className="even:bg-slate-50">
                    <td className="border border-slate-200 px-3 py-2 font-medium text-slate-800">{med.name}</td>
                    <td className="border border-slate-200 px-3 py-2 text-slate-600">{med.dosage}</td>
                    <td className="border border-slate-200 px-3 py-2 text-slate-600">{med.frequency}</td>
                    <td className="border border-slate-200 px-3 py-2 text-slate-600">{med.route}</td>
                    <td className="border border-slate-200 px-3 py-2 text-slate-600">
                      {med.duration_days ? `${med.duration_days} days` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(dischargeData.followup_scheduled_at || dischargeData.followup_provider) && (
        <div className="mt-6 rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Follow-up Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {dischargeData.followup_scheduled_at && (
              <div>
                <span className="text-xs font-medium text-slate-500">Scheduled Follow-up</span>
                <p className="text-sm font-medium text-slate-800">
                  {formatDateTime(dischargeData.followup_scheduled_at)}
                </p>
              </div>
            )}
            {dischargeData.followup_provider && (
              <div>
                <span className="text-xs font-medium text-slate-500">Provider</span>
                <p className="text-sm font-medium text-slate-800">
                  Dr. {dischargeData.followup_provider.staff_name}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 border-t-2 border-gray-200 pt-4 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Electronically Generated Discharge Summary
          </span>
        </div>

        <p className="mx-auto max-w-3xl text-[11px] leading-5 text-gray-600">
          This discharge summary is part of the patient&apos;s medical record and must be interpreted
          in the full clinical context by an authorized healthcare professional.
        </p>

        <div className="mt-3 flex items-center justify-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-teal-500" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-teal-600">
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
      </div>
    </div>
  );
};

export default DischargePreviewDocument;
