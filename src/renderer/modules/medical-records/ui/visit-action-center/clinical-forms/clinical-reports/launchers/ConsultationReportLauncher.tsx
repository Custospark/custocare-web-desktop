import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectActiveVisitId } from '../../../../../../../app/store/slices/visitSlice';
import { useGetActiveVisitConsultations } from '../../../../../api/consultations/consultationQueries';
import ConsultationsPreviewModal from '../../consultations-form-components/ConsultationsPreviewModal';
import {
  extractConsultationsFormValues,
  pickPrimaryConsultation,
} from '../../consultations-form-components/consultationsForm.utils';
import { useToast } from '../../../../../../../app/store/contexts/toast/useToast';

interface ConsultationReportLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  initialAction?: 'preview' | 'print' | 'download';
  theme?: 'light' | 'dark';
}

export const ConsultationReportLauncher: React.FC<ConsultationReportLauncherProps> = ({
  isOpen,
  onClose,
  initialAction = 'preview',
}) => {
  const activeVisitId = useSelector(selectActiveVisitId);
  const { showToast } = useToast();

  const consultationsQuery = useGetActiveVisitConsultations({
    enabled: !!activeVisitId && isOpen,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  const visitConsultations = useMemo(
    () => consultationsQuery.data?.data ?? [],
    [consultationsQuery.data]
  );
  const activeConsultation = useMemo(
    () => pickPrimaryConsultation(visitConsultations),
    [visitConsultations]
  );
  const hydratedValues = useMemo(
    () => extractConsultationsFormValues(activeConsultation),
    [activeConsultation]
  );

  useEffect(() => {
    if (consultationsQuery.isError && isOpen) {
      const errorMessage =
        (consultationsQuery.error as Error)?.message || 'Failed to load consultation data';
      showToast('error', errorMessage, 3000);
    }
  }, [consultationsQuery.error, consultationsQuery.isError, isOpen, showToast]);

  if (!activeVisitId) {
    if (isOpen) {
      showToast('warning', 'No active visit selected', 3000);
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
      initialAction={initialAction}
    />
  );
};

export default ConsultationReportLauncher;
