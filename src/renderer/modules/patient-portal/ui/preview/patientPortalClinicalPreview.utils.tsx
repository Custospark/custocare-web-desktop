import { formatDate, formatDateTime } from '../../../medical-records/ui/visit-action-center/clinical-forms/allergies-form-components/allergiesForm.utils';
import type { FacilitySnapshot } from '../../../medical-records/api/patient-medical-history/patientMedicalHistoryTypes';

export { formatDate, formatDateTime };

export const formatPreviewText = (text?: string | null): string =>
  (text ?? '')
    .replace(/[,-]/g, ' ')
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

export const previewClinicianLabel = (name?: string | null): string => {
  if (!name) return 'Clinician not specified';
  return name;
};

export function PreviewFacilityCell({ facility }: { facility: FacilitySnapshot | null | undefined }) {
  if (!facility?.name) {
    return <span className="text-slate-500">—</span>;
  }
  return (
    <div className="text-xs">
      <span className="font-semibold text-slate-800 dark:text-slate-100">{facility.name}</span>
      {facility.code ? <span className="ml-1 text-slate-600 dark:text-slate-400">({facility.code})</span> : null}
      {facility.address?.formatted ? (
        <p className="mt-0.5 text-[10px] leading-snug text-slate-600 dark:text-slate-400">{facility.address.formatted}</p>
      ) : null}
    </div>
  );
}
