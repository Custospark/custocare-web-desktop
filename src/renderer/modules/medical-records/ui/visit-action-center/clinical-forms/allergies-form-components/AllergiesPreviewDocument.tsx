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
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  Shield,
  Activity,
  FileText,
} from 'lucide-react';
import { AllergySeverity, type Allergy } from '../../../../api/allergies/AllergyTypes';
import type { RootState } from '../../../../../../app/store/rootReducer';
import { useGetFacilityIdentity } from '../../../../api/facility/FacilityQueries';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import {
  formatDate,
  getSeverityLabel,
} from './allergiesForm.utils';

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

// Helper component for severity badge in print
const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const getBadgeClass = () => {
    switch (severity) {
      case AllergySeverity.SEVERE:
        return 'bg-red-100 text-red-800 print:border print:border-red-300 print:bg-transparent';
      case AllergySeverity.MODERATE:
        return 'bg-yellow-100 text-yellow-800 print:border print:border-yellow-300 print:bg-transparent';
      default:
        return 'bg-blue-100 text-blue-800 print:border print:border-blue-300 print:bg-transparent';
    }
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getBadgeClass()}`}>
      {getSeverityLabel(severity)}
    </span>
  );
};

interface AllergiesPreviewDocumentProps {
  allergies: Allergy[];
  patientName: string;
  patientNumber: string;
  generatedAt?: string;
}

export const AllergiesPreviewDocument: React.FC<AllergiesPreviewDocumentProps> = ({
  allergies,
  patientName,
  patientNumber,
  generatedAt,
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

  // Calculate statistics
  const activeCount = allergies.filter(a => a.is_active).length;
  const severeCount = allergies.filter(a => a.severity === AllergySeverity.SEVERE).length;
  const hasSevereAllergies = severeCount > 0;

  const reportDate = generatedAt || new Date().toISOString();

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
            Allergy Report
          </span>
          {hasSevereAllergies && (
            <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700 print:bg-transparent print:p-0 print:text-gray-600">
              Severe Allergy Alert
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
            ALLERGY REPORT
          </p>
        </div>
      </div>

      {/* Meta Info Section */}
      <div className="my-6 bg-gray-50 rounded-lg p-4 space-y-2 print:my-4 print:bg-transparent print:p-0 print:border print:border-gray-200 print:rounded-lg print:p-3">
        <InfoRow
          icon={<Calendar className="h-3.5 w-3.5" />}
          label="Report Date"
          value={formatDate(reportDate)}
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
          icon={<Activity className="h-3.5 w-3.5" />}
          label="Allergy Summary"
          value={
            <div className="flex flex-wrap gap-2 justify-end">
              <span>Total: {allergies.length}</span>
              <span>Active: {activeCount}</span>
              {severeCount > 0 && <span className="text-red-600">Severe: {severeCount}</span>}
            </div>
          }
        />
      </div>

      {/* Allergies Table */}
      <div className="mt-6 print:mt-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
          Recorded Allergies
        </h3>

        {allergies.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <Shield className="mx-auto mb-3 h-12 w-12 text-slate-400" />
            <p className="text-slate-500">No allergies recorded for this patient.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700">Allergen</th>
                  <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700">Severity</th>
                  <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700">Reaction</th>
                  <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700">Status</th>
                  <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700">Diagnosed</th>
                  <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700">Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {allergies.map((allergy) => (
                  <tr key={allergy.id} className="border-b border-slate-200">
                    <td className="border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800">
                      {allergy.allergen}
                    </td>
                    <td className="border border-slate-200 px-3 py-2">
                      <SeverityBadge severity={allergy.severity} />
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-sm text-slate-600">
                      {allergy.reaction || '—'}
                    </td>
                    <td className="border border-slate-200 px-3 py-2">
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                        allergy.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      )}>
                        <Activity className="h-3 w-3" />
                        {allergy.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-sm text-slate-600">
                      {formatDate(allergy.diagnosed_at)}
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-sm text-slate-600">
                      {allergy.recorded_by?.name ? `Dr. ${allergy.recorded_by.name}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clinical Notes Section (if any have notes) */}
      {allergies.some(a => a.clinical_notes) && (
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-700">
            Clinical Notes
          </h3>
          <div className="space-y-3">
            {allergies
              .filter(a => a.clinical_notes)
              .map((allergy) => (
                <div key={allergy.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-xs font-medium text-slate-600">{allergy.allergen}</span>
                  </div>
                  <p className="text-sm text-slate-700">{allergy.clinical_notes}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Severe Allergy Warning */}
      {hasSevereAllergies && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h4 className="text-sm font-semibold text-red-700">Severe Allergy Alert</h4>
          </div>
          <p className="text-sm text-red-700">
            This patient has documented severe allergies to: {allergies.filter(a => a.severity === AllergySeverity.SEVERE).map(a => a.allergen).join(', ')}.
            Please exercise extreme caution when prescribing medications or administering treatments.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 border-t-2 border-gray-200 pt-4 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Electronically Generated Allergy Report
          </span>
        </div>

        <p className="mx-auto max-w-3xl text-[11px] leading-5 text-gray-600">
          This allergy report is part of the patient's medical record and must be considered
          in the full clinical context by an authorized healthcare professional.
        </p>

        <div className="mt-3 flex items-center justify-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-blue-500" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-600">
            Safe Care • Informed Decisions
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

export default AllergiesPreviewDocument;