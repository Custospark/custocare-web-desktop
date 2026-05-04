/**
 * Pharmacy — edit prescription notes and structured fields using the same PrescriptionForm as Medical Records.
 * Access is limited to the prescription matching active patient, visit, and facility in Redux.
 */
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useGetPrescriptionById } from '../../../medical-records/api/prescription/PrescriptionQueries';
import { PrescriptionForm } from '../../../medical-records/ui/visit-action-center/clinical-forms/PrescriptionForm';
import {
  selectActivePatient,
  selectActiveVisitId,
  selectActiveVisitPatientId,
} from '../../../../app/store/slices/visitSlice';
import type { RootState } from '../../../../app/store/store';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';
import { PHARMACY_ROUTES } from '../../../../app/routes/routeConstants';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';
import { useToast } from '../../../../app/store/contexts/toast/useToast';

interface PharmacyPrescriptionNotesPageProps {
  theme: 'light' | 'dark';
}

const PharmacyPrescriptionNotesPage: React.FC<PharmacyPrescriptionNotesPageProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const { prescriptionId: prescriptionIdParam } = useParams<{ prescriptionId: string }>();
  const { showToast } = useToast();

  const patientId = useSelector(selectActiveVisitPatientId);
  const activeVisitId = useSelector(selectActiveVisitId);
  const facilityId = useSelector((s: RootState) => getActiveFacilityId(s));
  const activePatient = useSelector(selectActivePatient);

  const prescriptionId = prescriptionIdParam ? Number(prescriptionIdParam) : NaN;
  const pid = patientId ? Number(patientId) : 0;

  const rxQuery = useGetPrescriptionById(Number.isFinite(prescriptionId) ? prescriptionId : 0, {
    enabled: Number.isFinite(prescriptionId) && prescriptionId > 0,
    refetchOnMount: true,
    staleTime: 0,
  });

  const rx = rxQuery.data?.data ?? null;

  const accessAllowed = useMemo(() => {
    if (!rx || activeVisitId == null || !facilityId || !pid) return false;
    return (
      Number(rx.patient_id) === pid &&
      rx.visit_id != null &&
      Number(rx.visit_id) === Number(activeVisitId) &&
      Number(rx.facility_id) === Number(facilityId)
    );
  }, [rx, pid, activeVisitId, facilityId]);

  const goBackToList = () => {
    navigate(PHARMACY_ROUTES.ACTION_CENTER_PRESCRIPTION_SEARCH);
  };

  const shellClass = isDark ? 'border-gray-700 bg-gray-900 text-gray-100' : 'border-slate-200 bg-white text-slate-900';

  if (!Number.isFinite(prescriptionId) || prescriptionId <= 0) {
    return (
      <div className={`rounded-xl border p-6 ${shellClass}`}>
        <p className="text-sm">Invalid prescription.</p>
        <button
          type="button"
          onClick={goBackToList}
          className="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to prescriptions
        </button>
      </div>
    );
  }

  if (rxQuery.isLoading) {
    return (
      <div className="p-4">
        <LoadingSkeleton variant="dashboard" theme={isDark ? 'dark' : 'light'} message="Loading prescription…" />
      </div>
    );
  }

  if (rxQuery.isError || !rx) {
    return (
      <div className={`rounded-xl border p-6 ${shellClass}`}>
        <p className="text-sm">Could not load this prescription.</p>
        <button type="button" onClick={goBackToList} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>
    );
  }

  if (!accessAllowed) {
    return (
      <div className={`rounded-xl border p-6 ${shellClass}`}>
        <p className="text-sm">
          This prescription does not belong to the active patient, visit, or facility. Open the correct encounter from
          the queue.
        </p>
        <button type="button" onClick={goBackToList} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600">
          <ArrowLeft className="h-4 w-4" />
          Back to prescriptions
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${shellClass}`}>
        <div className="min-w-0">
          <button
            type="button"
            onClick={goBackToList}
            className={`mb-1 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium hover:underline ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Prescriptions for this visit
          </button>
          <h2 className="text-lg font-semibold">Prescription notes · {rx.prescription_number}</h2>
          <p className={`mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Patient: {activePatient?.name ?? rx.patient?.name ?? '—'} · Visit #{activeVisitId} · Edit, then save. Use
            preview from the list to print or download for the patient.
          </p>
        </div>
      </div>

      <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-gray-700' : 'border-slate-200'}`}>
        <PrescriptionForm
          theme={theme}
          existingPrescription={rx}
          onCancel={goBackToList}
          onSuccess={() => {
            showToast('success', 'Prescription saved.', 3500);
          }}
        />
      </div>
    </div>
  );
};

export default PharmacyPrescriptionNotesPage;
