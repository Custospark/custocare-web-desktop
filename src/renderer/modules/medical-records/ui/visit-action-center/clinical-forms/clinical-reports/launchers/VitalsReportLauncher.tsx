import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectActivePatient, selectActiveVisitId } from '../../../../../../../app/store/slices/visitSlice';
import { useGetVisitVitals } from '../../../../../api/vitals/vitalQueries';
import { VitalsPreviewModal } from '../../vitals-form-components';
import {
  extractVitalsFormValues,
  pickPrimaryVitals,
} from '../../vitals-form-components/vitalsForm.utils';
import { useToast } from '../../../../../../../app/store/contexts/toast/useToast';
import { getActiveFacilityId } from '../../../../../../../app/store/utils/contextSelectors';
import type { ClinicalReportPortalContext } from './clinicalReportPortalContext';

interface VitalsReportLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  initialAction?: 'preview' | 'print' | 'download';
  theme?: 'light' | 'dark';
  portalContext?: ClinicalReportPortalContext | null;
}

export const VitalsReportLauncher: React.FC<VitalsReportLauncherProps> = ({
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

  const vitalsQuery = useGetVisitVitals(visitId ?? 0, {
    enabled: !!visitId && isOpen && !!resolvedFacilityId,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    ...(portalContext != null ? { facilityId: portalContext.facilityId ?? undefined } : {}),
  });

  const visitVitals = useMemo(() => vitalsQuery.data?.data ?? [], [vitalsQuery.data]);
  const activeVitals = useMemo(() => pickPrimaryVitals(visitVitals), [visitVitals]);
  const isLoading = vitalsQuery.isLoading || vitalsQuery.isFetching;
  const hydratedValues = useMemo(
    () => extractVitalsFormValues(activeVitals),
    [activeVitals]
  );
  const activePatientFromVisit = activeVitals?.patient;
  const displayPatientName =
    portalContext?.patientDisplayName?.trim() ||
    activePatient?.name?.trim() ||
    activePatientFromVisit?.full_name?.trim() ||
    'this patient';

  useEffect(() => {
    if (vitalsQuery.isError && isOpen) {
      const errorMessage = (vitalsQuery.error as Error)?.message || 'Failed to load vitals data';
      showToast('error', errorMessage, 3000);
    }
  }, [isOpen, showToast, vitalsQuery.error, vitalsQuery.isError]);

  if (!visitId) {
    if (isOpen) {
      showToast('warning', 'No visit selected', 3000);
      onClose();
    }
    return null;
  }

  return (
    <VitalsPreviewModal
      open={isOpen}
      onClose={onClose}
      vitals={activeVitals}
      values={hydratedValues}
      patientName={displayPatientName}
      initialAction={initialAction}
      isLoading={isLoading}
    />
  );
};

export default VitalsReportLauncher;
