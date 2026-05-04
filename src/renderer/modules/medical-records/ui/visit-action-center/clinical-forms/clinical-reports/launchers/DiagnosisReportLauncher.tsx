import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectActiveVisitId } from '../../../../../../../app/store/slices/visitSlice';
import { useGetActiveVisitDiagnoses } from '../../../../../api/diagnosis/diagnosisQueries';
import DiagnosesPreviewModal from '../../diagnoses-form-components/DiagnosesPreviewModal';
import {
  extractDiagnosesFormValues,
  pickPrimaryDiagnosis,
} from '../../diagnoses-form-components/diagnosesForm.utils';
import { useToast } from '../../../../../../../app/store/contexts/toast/useToast';

interface DiagnosisReportLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  initialAction?: 'preview' | 'print' | 'download';
  theme?: 'light' | 'dark';
}

export const DiagnosisReportLauncher: React.FC<DiagnosisReportLauncherProps> = ({
  isOpen,
  onClose,
  initialAction = 'preview',
}) => {
  const activeVisitId = useSelector(selectActiveVisitId);
  const { showToast } = useToast();

  const diagnosesQuery = useGetActiveVisitDiagnoses({
    enabled: !!activeVisitId && isOpen,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const visitDiagnoses = useMemo(() => diagnosesQuery.data?.data ?? [], [diagnosesQuery.data]);
  const activeDiagnosis = useMemo(() => pickPrimaryDiagnosis(visitDiagnoses), [visitDiagnoses]);
  const isLoading = diagnosesQuery.isLoading || diagnosesQuery.isFetching;
  const hydratedValues = useMemo(
    () => extractDiagnosesFormValues(activeDiagnosis),
    [activeDiagnosis]
  );

  useEffect(() => {
    if (diagnosesQuery.isError && isOpen) {
      const errorMessage = (diagnosesQuery.error as Error)?.message || 'Failed to load diagnosis data';
      showToast('error', errorMessage, 3000);
    }
  }, [diagnosesQuery.error, diagnosesQuery.isError, isOpen, showToast]);

  if (!activeVisitId) {
    if (isOpen) {
      showToast('warning', 'No active visit selected', 3000);
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
      initialAction={initialAction}
      isLoading={isLoading}
    />
  );
};

export default DiagnosisReportLauncher;
