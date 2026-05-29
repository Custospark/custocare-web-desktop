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
  FileText,
} from 'lucide-react';
import { useGetFacilityIdentity } from '../../../../api/facility/FacilityQueries';
import type { RootState } from '../../../../../../app/store/rootReducer';
import type { Prescription } from '../../../../api/prescription/PrescriptionTypes';
import type { PrescriptionFormData } from './prescriptionForm.types';
import type { PreviewMedicationItem } from './prescriptionInstructionsUtils';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import {
  formatDosage,
  formatDuration,
} from '../../../../api/prescription-items/PrescriptionItemsTypes';

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

interface PrescriptionPreviewDocumentProps {
  prescription: Prescription | null;
  formData: PrescriptionFormData;
  previewItems: PreviewMedicationItem[];
}

export const PrescriptionPreviewDocument: React.FC<PrescriptionPreviewDocumentProps> = ({
  prescription,
  formData,
  previewItems,
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
        name: 'MEDICAL FACILITY',
        code: 'N/A',
        email: null,
        phone: null,
        address: 'Address not available',
      };

  // Get patient name from prescription or fallback
  const patientName = prescription?.patient?.name || 'Unknown Patient';
  const patientNumber = prescription?.patient?.number || 'N/A';
  
  // Get prescriber name safely
  const getPrescriberName = (): string => {
    if (!prescription) return 'Not specified';
    if (typeof prescription.prescribed_by === 'object' && prescription.prescribed_by !== null) {
      return `Dr. ${prescription.prescribed_by.name}`;
    }
    return prescription.prescribed_by_user?.name ? `Dr. ${prescription.prescribed_by_user.name}` : 'Not specified';
  };

  const prescriptionDate = prescription?.prescription_date
    ? new Date(prescription.prescription_date).toLocaleDateString()
    : new Date().toLocaleDateString();

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
            Prescription
          </span>
          {formData.priority && (
            <span className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-semibold',
              formData.priority === 'STAT - Fill Immediately' ? 'bg-red-100 text-red-700' :
              formData.priority === 'Urgent - Fill Within 4 Hours' ? 'bg-orange-100 text-orange-700' :
              'bg-blue-100 text-blue-700'
            )}>
              {formData.priority.split(' - ')[0]}
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
            PRESCRIPTION
          </p>
          <p className="text-xs text-gray-600 print:text-gray-500">
            {prescription?.prescription_number || 'Electronic Prescription'}
          </p>
        </div>
      </div>

      {/* Meta Info Section */}
      <div className="my-6 bg-gray-50 rounded-lg p-4 space-y-2 print:my-4 print:bg-transparent print:p-0 print:border print:border-gray-200 print:rounded-lg print:p-3">
        <InfoRow
          icon={<Calendar className="h-3.5 w-3.5" />}
          label="Prescription Date"
          value={prescriptionDate}
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
          label="Prescriber"
          value={getPrescriberName()}
        />
        <InfoRow
          icon={<FileText className="h-3.5 w-3.5" />}
          label="Prescription Type"
          value={formData.prescription_type || prescription?.prescription_type || '—'}
        />
      </div>

      {/* Clinical Indication / Diagnosis */}
      {(formData.diagnosis || prescription?.diagnosis) && (
        <div className="mb-6 rounded-xl border-l-4 border-blue-500 bg-blue-50 p-4 print:border-l-2">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            Clinical Indication / Diagnosis
          </div>
          <div className="text-sm text-slate-700">
            {formData.diagnosis || prescription?.diagnosis}
          </div>
        </div>
      )}

      {/* Medications Table */}
      <div className="mt-6 print:mt-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
          Prescribed Medications ({previewItems.length})
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
              {previewItems.map((med, index) => (
                <tr key={med.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-800">
                    {med.medication_name}
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-sm text-slate-700">
                    {formatDosage(med.dosage_quantity, med.dosage_unit)}
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-sm text-slate-700">
                    {med.frequency || '—'}
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-sm text-slate-700">
                    {med.route || '—'}
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 text-sm text-slate-700">
                    {med.duration_value && med.duration_unit ? formatDuration(med.duration_value, med.duration_unit) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Follow-up Information */}
      {(formData.follow_up_date || formData.follow_up_instructions) && (
        <div className="mt-6 rounded-xl border border-slate-200 p-4">
          <h4 className="mb-2 text-sm font-semibold text-slate-700">Follow-up Information</h4>
          <div className="space-y-2 text-sm text-slate-600">
            {formData.follow_up_date && (
              <div><span className="font-medium">Follow-up Date:</span> {formData.follow_up_date}</div>
            )}
            {formData.follow_up_instructions && (
              <div><span className="font-medium">Instructions:</span> {formData.follow_up_instructions}</div>
            )}
          </div>
        </div>
      )}

      {/* Patient Education Notes */}
      {formData.patient_education_notes && (
        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <h4 className="mb-2 text-sm font-semibold text-slate-700">Patient Education</h4>
          <p className="text-sm text-slate-600">{formData.patient_education_notes}</p>
        </div>
      )}

      {/* Special Instructions */}
      {formData.special_instructions && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h4 className="mb-2 text-sm font-semibold text-amber-700">Special Instructions</h4>
          <p className="text-sm text-amber-700">{formData.special_instructions}</p>
        </div>
      )}

      {/* Clinical Notes */}
      {formData.clinical_notes && (
        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <h4 className="mb-2 text-sm font-semibold text-slate-700">Clinical Notes</h4>
          <p className="text-sm text-slate-600">{formData.clinical_notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 border-t-2 border-gray-200 pt-4 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Electronically Generated Prescription
          </span>
        </div>

        <p className="mx-auto max-w-3xl text-[11px] leading-5 text-gray-600">
          This prescription is part of the patient's medical record. Please dispense as prescribed.
          Any changes must be authorized by the prescriber.
        </p>

        <div className="mt-3 flex items-center justify-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-blue-500" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-600">
            Safe Medication • Better Outcomes
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

        {prescription?.prescription_number && (
          <p className="mt-2 text-[9px] font-mono text-gray-400 break-all">
            Prescription Number: {prescription.prescription_number}
          </p>
        )}
      </div>
    </div>
  );
};

export default PrescriptionPreviewDocument;