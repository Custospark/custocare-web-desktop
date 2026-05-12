import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectActivePatient, selectActiveVisitId } from '../../../../../../../app/store/slices/visitSlice';
import { useGetVisitDiagnoses } from '../../../../../api/diagnosis/diagnosisQueries';
import DiagnosesPreviewModal from '../../diagnoses-form-components/DiagnosesPreviewModal';
import {
  extractDiagnosesFormValues,
  pickPrimaryDiagnosis,
} from '../../diagnoses-form-components/diagnosesForm.utils';
import { useToast } from '../../../../../../../app/store/contexts/toast/useToast';
import { getActiveFacilityId } from '../../../../../../../app/store/utils/contextSelectors';
import type { ClinicalReportPortalContext } from './clinicalReportPortalContext';

interface DiagnosisReportLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  initialAction?: 'preview' | 'print' | 'download';
  theme?: 'light' | 'dark';
  portalContext?: ClinicalReportPortalContext | null;
}

export const DiagnosisReportLauncher: React.FC<DiagnosisReportLauncherProps> = ({
  isOpen,
  onClose,
  initialAction = 'preview',
  portalContext = null,
}) => {
  const activeVisitId = useSelector(selectActiveVisitId);
  const facilityFromStore = useSelector(getActiveFacilityId);
  const activePatient = useSelector(selectActivePatient);
  const { showToast } = useToast();

  const visitId = portalContext?.visitId ?? activeVisitId ?? null;
  const resolvedFacilityId =
    portalContext != null ? portalContext.facilityId ?? facilityFromStore : facilityFromStore;

  const diagnosesQuery = useGetVisitDiagnoses(visitId ?? 0, {
    enabled: !!visitId && isOpen && !!resolvedFacilityId,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    ...(portalContext != null ? { facilityId: portalContext.facilityId ?? undefined } : {}),
  });

  const visitDiagnoses = useMemo(() => diagnosesQuery.data?.data ?? [], [diagnosesQuery.data]);
  const activeDiagnosis = useMemo(() => pickPrimaryDiagnosis(visitDiagnoses), [visitDiagnoses]);
  const isLoading = diagnosesQuery.isLoading || diagnosesQuery.isFetching;
  const hydratedValues = useMemo(
    () => extractDiagnosesFormValues(activeDiagnosis),
    [activeDiagnosis]
  );
  const activePatientFromVisit = activeDiagnosis?.patient;
  const displayPatientName =
    portalContext?.patientDisplayName?.trim() ||
    activePatient?.name?.trim() ||
    activePatientFromVisit?.full_name?.trim() ||
    'this patient';

  useEffect(() => {
    if (diagnosesQuery.isError && isOpen) {
      const errorMessage = (diagnosesQuery.error as Error)?.message || 'Failed to load diagnosis data';
      showToast('error', errorMessage, 3000);
    }
  }, [diagnosesQuery.error, diagnosesQuery.isError, isOpen, showToast]);

  if (!visitId) {
    if (isOpen) {
      showToast('warning', 'No visit selected', 3000);
      onClose();
    }
    return null;
  }

  return (
    <DiagnosesPreviewModal
      open={isOpen}
      onClose={onClose}
      diagnosis={activeDiagnosis}
      values={hydratedValues}
      patientName={displayPatientName}
      initialAction={initialAction}
      isLoading={isLoading}
    />
  );
};

export default DiagnosisReportLauncher;
