import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectActivePatient, selectActiveVisitId } from '../../../../../../../app/store/slices/visitSlice';
import { useGetVisitConsultations } from '../../../../../api/consultations/consultationQueries';
import ConsultationsPreviewModal from '../../consultations-form-components/ConsultationsPreviewModal';
import {
  extractConsultationsFormValues,
  pickPrimaryConsultation,
} from '../../consultations-form-components/consultationsForm.utils';
import { useToast } from '../../../../../../../app/store/contexts/toast/useToast';
import { getActiveFacilityId } from '../../../../../../../app/store/utils/contextSelectors';
import type { ClinicalReportPortalContext } from './clinicalReportPortalContext';

interface ConsultationReportLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  initialAction?: 'preview' | 'print' | 'download';
  theme?: 'light' | 'dark';
  portalContext?: ClinicalReportPortalContext | null;
}

export const ConsultationReportLauncher: React.FC<ConsultationReportLauncherProps> = ({
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

  const consultationsQuery = useGetVisitConsultations(visitId ?? 0, {
    enabled: !!visitId && isOpen && !!resolvedFacilityId,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    ...(portalContext != null ? { facilityId: portalContext.facilityId ?? undefined } : {}),
  });

  const visitConsultations = useMemo(
    () => consultationsQuery.data?.data ?? [],
    [consultationsQuery.data]
  );
  const activeConsultation = useMemo(
    () => pickPrimaryConsultation(visitConsultations),
    [visitConsultations]
  );
  const isLoading = consultationsQuery.isLoading || consultationsQuery.isFetching;
  const hydratedValues = useMemo(
    () => extractConsultationsFormValues(activeConsultation),
    [activeConsultation]
  );
  const activePatientFromVisit = activeConsultation?.patient;
  const displayPatientName =
    portalContext?.patientDisplayName?.trim() ||
    activePatient?.name?.trim() ||
    activePatientFromVisit?.full_name?.trim() ||
    'this patient';

  useEffect(() => {
    if (consultationsQuery.isError && isOpen) {
      const errorMessage =
        (consultationsQuery.error as Error)?.message || 'Failed to load consultation data';
      showToast('error', errorMessage, 3000);
    }
  }, [consultationsQuery.error, consultationsQuery.isError, isOpen, showToast]);

  if (!visitId) {
    if (isOpen) {
      showToast('warning', 'No visit selected', 3000);
      onClose();
    }
    return null;
  }

  return (
    <ConsultationsPreviewModal
      open={isOpen}
      onClose={onClose}
      consultation={activeConsultation}
      values={hydratedValues}
      patientName={displayPatientName}
      initialAction={initialAction}
      isLoading={isLoading}
    />
  );
};

export default ConsultationReportLauncher;
