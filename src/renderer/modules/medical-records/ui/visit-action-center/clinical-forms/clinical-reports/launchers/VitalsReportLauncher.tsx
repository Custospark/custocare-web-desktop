import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectActiveVisitId } from '../../../../../../../app/store/slices/visitSlice';
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
  const { showToast } = useToast();

  const vitalsQuery = useGetActiveVisitVitals({
    enabled: !!activeVisitId && isOpen,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const visitVitals = useMemo(() => vitalsQuery.data?.data ?? [], [vitalsQuery.data]);
  const activeVitals = useMemo(() => pickPrimaryVitals(visitVitals), [visitVitals]);
  const hydratedValues = useMemo(
    () => extractVitalsFormValues(activeVitals),
    [activeVitals]
  );

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
      initialAction={initialAction}
    />
  );
};

export default VitalsReportLauncher;
