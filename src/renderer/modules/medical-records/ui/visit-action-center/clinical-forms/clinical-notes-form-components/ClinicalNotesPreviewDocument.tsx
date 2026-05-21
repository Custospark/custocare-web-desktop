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
  CalendarDays,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import { useGetFacilityIdentity } from '../../../../api/facility/FacilityQueries';
import type { RootState } from '../../../../../../app/store/rootReducer';
import {
  CLINICAL_NOTES_SECTIONS,
  formatClinicalNoteDate,
  getClinicalNoteMeta,
  getPreviewSectionText,
} from './clinicalNotesForm.utils';
import type {
  ClinicalNoteResponse,
  ClinicalNotesFormValues,
} from './clinicalNotesForm.types';

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

interface ClinicalNotesPreviewDocumentProps {
  note: ClinicalNoteResponse | null;
  values: ClinicalNotesFormValues;
  noteTitle: string;
}

export const ClinicalNotesPreviewDocument: React.FC<ClinicalNotesPreviewDocumentProps> = ({
  note,
  values,
}) => {
  const meta = getClinicalNoteMeta(note);

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
        name: note?.facility?.name || 'MEDICAL FACILITY',
        code: 'N/A',
        email: null,
        phone: null,
        address: 'Address not available',
      };

  // Get patient name from note or fallback
  const patientName = note?.patient?.full_name || meta.patientName || 'Unknown Patient';
  const patientNumber = note?.patient_number || meta.patientNumber || 'N/A';
  const clinicianName = `Dr. ${note?.staff?.full_name || meta.author || meta.staffName || 'Not specified'}`;
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
        {/* Icon - hidden in print */}
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
            Clinical Note
          </span>
          {meta.status && (
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-700 print:bg-transparent print:p-0 print:text-gray-600">
              {meta.status.toUpperCase()}
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

        {/* Facility Number */}
        <div className="mt-3 print:mt-2">
          <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500 print:bg-transparent print:p-0 print:text-gray-400">
            Facility Number: <span className="text-gray-700 print:text-gray-900">{facility.code}</span>
          </span>
        </div>

        {/* Clinical Note Title Banner */}
        <div className="mt-4 rounded-xl bg-gradient-to-r from-blue-50 to-emerald-50 px-4 py-3 print:mt-3 print:rounded-none print:bg-transparent print:border-y print:border-gray-200 print:py-2">
          <p className="text-lg font-black tracking-wide text-blue-700 print:text-base print:text-slate-900">
            CLINICAL NOTE
          </p>
          
        </div>
      </div>

      {/* Meta Info Section - Clean Grid Layout */}
      <div className="my-6 bg-gray-50 rounded-lg p-4 space-y-2 print:my-4 print:bg-transparent print:p-0 print:border print:border-gray-200 print:rounded-lg print:p-3">
        {/* Report Information */}
        <InfoRow
          icon={<Calendar className="h-3.5 w-3.5" />}
          label="Report Date"
          value={formatClinicalNoteDate(new Date().toISOString())}
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
          value={patientName}
        />
        <InfoRow
          icon={<Fingerprint className="h-3.5 w-3.5" />}
          label="Patient Number"
          value={patientNumber}
        />

        {/* Clinical Note Information */}
        <InfoRow
          icon={<Stethoscope className="h-3.5 w-3.5" />}
          label="Clinician Name"
          value={clinicianName}
        />
        <InfoRow
          icon={<CalendarDays className="h-3.5 w-3.5" />}
          label="Note Created"
          value={formatClinicalNoteDate(meta.createdAt)}
        />
        {/* Last Updated */}
        {(meta.updatedAt || meta.createdAt) && (
          <InfoRow
            icon={<Clock className="h-3.5 w-3.5" />}
            label="Last Updated"
            value={formatClinicalNoteDate(meta.updatedAt || meta.createdAt)}
          />
        )}
      </div>

      {/* SOAP Note Sections */}
      <div className="space-y-5 print:mt-4">
        {CLINICAL_NOTES_SECTIONS.map((section) => {
          const Icon = section.icon;
          const displayValue = getPreviewSectionText(values, section.key, section.previewFallback);
          const isValueEmpty = !values[section.key]?.trim();

          return (
            <section
              key={section.key}
              className="rounded-xl border border-slate-200 p-4 print:break-inside-avoid print:border-0 print:p-0"
            >
              <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2 print:border-b-0 print:pb-0">
                <Icon className="h-4 w-4 text-slate-500 print:hidden" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700 print:text-base">
                  {section.label}
                </h2>
              </div>

              <div
                className={cn(
                  'whitespace-pre-wrap break-words text-sm leading-7 text-slate-800 print:text-base',
                  isValueEmpty && 'italic text-slate-500'
                )}
              >
                {displayValue}
              </div>
            </section>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 border-t-2 border-gray-200 pt-4 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Electronically Generated Clinical Note
          </span>
        </div>

        <p className="mx-auto max-w-3xl text-[11px] leading-5 text-gray-600">
          This clinical note is part of the patient's medical record and must be interpreted 
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

        {note?.uuid && (
          <p className="mt-2 text-[9px] font-mono text-gray-400 break-all">
            Document ID: {note.uuid}
          </p>
        )}
      </div>
    </div>
  );
};

export default ClinicalNotesPreviewDocument;