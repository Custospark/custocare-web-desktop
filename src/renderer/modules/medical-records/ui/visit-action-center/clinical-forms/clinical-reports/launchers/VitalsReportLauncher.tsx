import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectActivePatient, selectActiveVisitId } from '../../../../../../../app/store/slices/visitSlice';
import { useGetActiveVisitVitals } from '../../../../../api/vitals/vitalQueries';
import { VitalsPreviewModal } from '../../vitals-form-components';
import {
  extractVitalsFormValues,
  pickPrimaryVitals,
} from '../../vitals-form-components/vitalsForm.utils';
import { useToast } from '../../../../../../../app/store/contexts/toast/useToast';

interface VitalsReportLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  initialAction?: 'preview' | 'print' | 'download';
  theme?: 'light' | 'dark';
}

export const VitalsReportLauncher: React.FC<VitalsReportLauncherProps> = ({
  isOpen,
  onClose,
  initialAction = 'preview',
}) => {
  const activeVisitId = useSelector(selectActiveVisitId);
  const activePatient = useSelector(selectActivePatient);
  const { showToast } = useToast();

  const vitalsQuery = useGetActiveVisitVitals({
    enabled: !!activeVisitId && isOpen,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
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
    activePatient?.name?.trim() ||
    activePatientFromVisit?.full_name?.trim() ||
    'this patient';

  useEffect(() => {
    if (vitalsQuery.isError && isOpen) {
      const errorMessage = (vitalsQuery.error as Error)?.message || 'Failed to load vitals data';
      showToast('error', errorMessage, 3000);
    }
  }, [isOpen, showToast, vitalsQuery.error, vitalsQuery.isError]);

  if (!activeVisitId) {
    if (isOpen) {
      showToast('warning', 'No active visit selected', 3000);
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
