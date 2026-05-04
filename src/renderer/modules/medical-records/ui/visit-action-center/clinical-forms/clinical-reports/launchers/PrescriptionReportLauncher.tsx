import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetPatientPrescriptions,
  useGetPrescriptionById,
} from '../../../../../api/prescription/PrescriptionQueries';
import { PrescriptionStatus, type Prescription } from '../../../../../api/prescription/PrescriptionTypes';
import { useGetPrescriptionItems } from '../../../../../api/prescription-items/PrescriptionItemsQueries';
import { selectActiveVisitPatientId } from '../../../../../../../app/store/slices/visitSlice';
import { PrescriptionPreviewModal } from '../../prescription-form-components/PrescriptionPreviewModal';
import { toPrescriptionFormData } from '../../prescription-form-components/prescriptionForm.types';
import { buildPreviewItems } from '../../prescription-form-components/prescriptionInstructionsUtils';
import { useToast } from '../../../../../../../app/store/contexts/toast/useToast';

interface PrescriptionReportLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  initialAction?: 'preview' | 'print' | 'download';
  theme?: 'light' | 'dark';
}

export const PrescriptionReportLauncher: React.FC<PrescriptionReportLauncherProps> = ({
  isOpen,
  onClose,
  initialAction = 'preview',
}) => {
  const patientId = useSelector(selectActiveVisitPatientId);
  const patientNumericId = patientId ? Number(patientId) : 0;
  const { showToast } = useToast();

  const patientPrescriptionsQuery = useGetPatientPrescriptions(patientNumericId, [], {
    enabled: !!patientNumericId && isOpen,
    refetchOnMount: true,
    staleTime: 0,
  });

  const resolvedExistingPrescription = useMemo<Prescription | null>(() => {
    const prescriptions = patientPrescriptionsQuery.data?.data ?? [];
    if (!prescriptions.length) return null;

    const drafts = prescriptions.filter((item) => item.status === PrescriptionStatus.DRAFT);
    const activePrescriptions = drafts.length ? drafts : prescriptions;
    const sorted = [...activePrescriptions].sort((a, b) => {
      const aTime = new Date(a.updated_at || a.created_at).getTime();
      const bTime = new Date(b.updated_at || b.created_at).getTime();
      return bTime - aTime;
    });

    return sorted[0] ?? null;
  }, [patientPrescriptionsQuery.data]);

  const currentPrescriptionId = resolvedExistingPrescription?.id ?? null;

  const currentPrescriptionQuery = useGetPrescriptionById(currentPrescriptionId ?? 0, {
    enabled: !!currentPrescriptionId && isOpen,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const currentPrescription = currentPrescriptionQuery.data?.data ?? resolvedExistingPrescription;

  const itemsQuery = useGetPrescriptionItems(currentPrescriptionId ?? 0, {
    enabled: !!currentPrescriptionId && isOpen,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const medications = useMemo(() => itemsQuery.data?.data ?? [], [itemsQuery.data]);
  const formData = useMemo(
    () => toPrescriptionFormData(currentPrescription),
    [currentPrescription]
  );
  const previewItems = useMemo(() => buildPreviewItems(medications), [medications]);

  useEffect(() => {
    if ((patientPrescriptionsQuery.isError || currentPrescriptionQuery.isError || itemsQuery.isError) && isOpen) {
      const errorMessage =
        (patientPrescriptionsQuery.error as Error)?.message ||
        (currentPrescriptionQuery.error as Error)?.message ||
        (itemsQuery.error as Error)?.message ||
        'Failed to load prescription data';
      showToast('error', errorMessage, 3000);
    }
  }, [
    currentPrescriptionQuery.error,
    currentPrescriptionQuery.isError,
    isOpen,
    itemsQuery.error,
    itemsQuery.isError,
    patientPrescriptionsQuery.error,
    patientPrescriptionsQuery.isError,
    showToast,
  ]);

  if (!patientNumericId) {
    if (isOpen) {
      showToast('warning', 'No active patient selected', 3000);
      onClose();
    }
    return null;
  }

  return (
    <PrescriptionPreviewModal
      open={isOpen}
      onClose={onClose}
      prescription={currentPrescription}
      formData={formData}
      previewItems={previewItems}
      initialAction={initialAction}
    />
  );
};

export default PrescriptionReportLauncher;
