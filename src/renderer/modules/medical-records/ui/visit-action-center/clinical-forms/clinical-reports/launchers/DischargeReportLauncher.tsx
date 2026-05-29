import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectActivePatient, selectActiveVisitUuid } from '../../../../../../../app/store/slices/visitSlice';
import { useGetDischargeData } from '../../../../../api/discharge/DischargeQueries';
import { DischargePreviewModal } from '../../discharge-form-components';
import { useToast } from '../../../../../../../app/store/contexts/toast/useToast';
import { getActiveFacilityId } from '../../../../../../../app/store/utils/contextSelectors';
import type { ClinicalReportPortalContext } from './clinicalReportPortalContext';

interface DischargeReportLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  initialAction?: 'preview' | 'print' | 'download';
  theme?: 'light' | 'dark';
  portalContext?: ClinicalReportPortalContext | null;
}

export const DischargeReportLauncher: React.FC<DischargeReportLauncherProps> = ({
  isOpen,
  onClose,
  initialAction = 'preview',
  theme = 'light',
  portalContext = null,
}) => {
  const activeVisitUuid = useSelector(selectActiveVisitUuid);
  const facilityFromStore = useSelector(getActiveFacilityId);
  const activePatient = useSelector(selectActivePatient);
  const { showToast } = useToast();

  const visitId = portalContext?.visitId ?? activeVisitUuid ?? null;
  const resolvedFacilityId =
    portalContext != null ? portalContext.facilityId ?? facilityFromStore : facilityFromStore;

  const dischargeQuery = useGetDischargeData(visitId, {
    enabled: !!visitId && isOpen && !!resolvedFacilityId,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const dischargeData = useMemo(
    () => dischargeQuery.data?.data ?? null,
    [dischargeQuery.data]
  );

  const isLoading = dischargeQuery.isLoading || dischargeQuery.isFetching;
  const isError = dischargeQuery.isError;
  const error = dischargeQuery.error;

  const activePatientFromVisit = dischargeData?.patient;
  const displayPatientName =
    portalContext?.patientDisplayName?.trim() ||
    activePatient?.name?.trim() ||
    activePatientFromVisit?.full_name?.trim() ||
    'this patient';

  useEffect(() => {
    if (isError && isOpen) {
      const errorMessage = (error as Error)?.message || 'Failed to load discharge data';
      showToast('error', errorMessage, 3000);
    }
  }, [isError, isOpen, error, showToast]);

  if (!visitId) {
    if (isOpen) {
      showToast('warning', 'No visit selected', 3000);
      onClose();
    }
    return null;
  }

  return (
    <DischargePreviewModal
      isOpen={isOpen}
      onClose={onClose}
      dischargeData={dischargeData}
      patientName={displayPatientName}
      theme={theme}
      initialAction={initialAction}
      isLoading={isLoading}
    />
  );
};

export default DischargeReportLauncher;
