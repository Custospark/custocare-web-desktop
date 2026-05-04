/**
 * Reuses Medical Records PrescriptionPreviewModal for preview / print / download / patient handoff,
 * scoped to a single prescription that belongs to the active visit + patient + facility.
 */
import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useGetPrescriptionById } from '../../../medical-records/api/prescription/PrescriptionQueries';
import { useGetPrescriptionItems } from '../../../medical-records/api/prescription-items/PrescriptionItemsQueries';
import {
  selectActivePatient,
  selectActiveVisitId,
  selectActiveVisitPatientId,
} from '../../../../app/store/slices/visitSlice';
import type { RootState } from '../../../../app/store/store';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';
import { PrescriptionPreviewModal } from '../../../medical-records/ui/visit-action-center/clinical-forms/prescription-form-components/PrescriptionPreviewModal';
import { toPrescriptionFormData } from '../../../medical-records/ui/visit-action-center/clinical-forms/prescription-form-components/prescriptionForm.types';
import { buildPreviewItems } from '../../../medical-records/ui/visit-action-center/clinical-forms/prescription-form-components/prescriptionInstructionsUtils';
import { useToast } from '../../../../app/store/contexts/toast/useToast';

export interface PharmacyPrescriptionReportModalProps {
  prescriptionId: number | null;
  open: boolean;
  onClose: () => void;
  initialAction?: 'preview' | 'print' | 'download';
  theme?: 'light' | 'dark';
}

export const PharmacyPrescriptionReportModal: React.FC<PharmacyPrescriptionReportModalProps> = ({
  prescriptionId,
  open,
  onClose,
  initialAction = 'preview',
}) => {
  const patientId = useSelector(selectActiveVisitPatientId);
  const activeVisitId = useSelector(selectActiveVisitId);
  const facilityId = useSelector((s: RootState) => getActiveFacilityId(s));
  const activePatient = useSelector(selectActivePatient);
  const { showToast } = useToast();

  const pid = patientId ? Number(patientId) : 0;
  const enabled = open && prescriptionId != null && prescriptionId > 0 && !!pid;

  const rxQuery = useGetPrescriptionById(prescriptionId ?? 0, {
    enabled,
    refetchOnMount: true,
    staleTime: 0,
  });

  const rx = rxQuery.data?.data ?? null;

  const accessAllowed = useMemo(() => {
    if (!rx || activeVisitId == null || !facilityId) return false;
    return (
      Number(rx.patient_id) === pid &&
      rx.visit_id != null &&
      Number(rx.visit_id) === Number(activeVisitId) &&
      Number(rx.facility_id) === Number(facilityId)
    );
  }, [rx, pid, activeVisitId, facilityId]);

  const itemsQuery = useGetPrescriptionItems(prescriptionId ?? 0, {
    enabled: enabled && accessAllowed,
    refetchOnMount: true,
    staleTime: 0,
  });

  const medications = useMemo(() => itemsQuery.data?.data ?? [], [itemsQuery.data]);

  const formData = useMemo(() => toPrescriptionFormData(rx), [rx]);

  const previewItems = useMemo(() => buildPreviewItems(medications), [medications]);

  const isLoading =
    rxQuery.isLoading ||
    (accessAllowed && itemsQuery.isLoading) ||
    rxQuery.isFetching ||
    (accessAllowed && itemsQuery.isFetching);

  const displayPatientName =
    activePatient?.name?.trim() || rx?.patient?.name?.trim() || 'this patient';

  useEffect(() => {
    if (!open || !enabled) return;
    if (rxQuery.isSuccess && rx && !accessAllowed) {
      showToast('error', 'This prescription is not part of the current visit or facility.', 4000);
      onClose();
    }
  }, [open, enabled, rxQuery.isSuccess, rx, accessAllowed, showToast, onClose]);

  useEffect(() => {
    if ((rxQuery.isError || itemsQuery.isError) && open) {
      const msg =
        (rxQuery.error as Error)?.message ||
        (itemsQuery.error as Error)?.message ||
        'Failed to load prescription';
      showToast('error', msg, 3500);
    }
  }, [rxQuery.error, rxQuery.isError, itemsQuery.error, itemsQuery.isError, open, showToast]);

  if (!open) return null;

  return (
    <PrescriptionPreviewModal
      open={open}
      onClose={onClose}
      prescription={accessAllowed ? rx : null}
      formData={formData}
      previewItems={previewItems}
      patientName={displayPatientName}
      initialAction={initialAction}
      isLoading={isLoading || (!accessAllowed && rxQuery.isLoading)}
    />
  );
};

export default PharmacyPrescriptionReportModal;
