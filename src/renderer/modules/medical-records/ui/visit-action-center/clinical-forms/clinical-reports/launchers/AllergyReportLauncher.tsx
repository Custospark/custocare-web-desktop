/**
 * AllergyReportLauncher.tsx
 * ============================================================================
 * ALLERGY REPORT LAUNCHER
 * ============================================================================
 * 
 * This component fetches allergy data for the active patient and displays
 * the preview/print/download modal for allergy reports.
 * 
 * @module AllergyReportLauncher
 */

import React, { useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectActivePatient, selectActiveVisitPatientId } from '../../../../../../../app/store/slices/visitSlice';
import { useGetAllergies } from '../../../../../api/allergies/AllergyQueries';

import { AllergiesPreviewModal, normalizeAllergyResponse } from '../../allergies-form-components';
import { useToast } from '../../../../../../../app/store/contexts/toast/useToast';

interface AllergyReportLauncherProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Initial action to perform when modal opens */
  initialAction?: 'preview' | 'print' | 'download';
  /** Theme for the modal */
  theme?: 'light' | 'dark';
}

export const AllergyReportLauncher: React.FC<AllergyReportLauncherProps> = ({
  isOpen,
  onClose,
  initialAction = 'preview',
  theme = 'light',
}) => {
  const patientId = useSelector(selectActiveVisitPatientId);
  const activePatient = useSelector(selectActivePatient);
  const { showToast } = useToast();

  // Fetch allergies data - only when modal is open and we have a patient
  const allergiesQuery = useGetAllergies(patientId ?? '', {}, {
    enabled: !!patientId && isOpen,
    refetchOnMount: true,
    staleTime: 0, // Always fetch fresh data for reports
  });

  const normalized = useMemo(
    () => normalizeAllergyResponse(allergiesQuery.data),
    [allergiesQuery.data]
  );

  const allergies = normalized.allergies;
  const isLoading = allergiesQuery.isLoading;
  const isError = allergiesQuery.isError;
  const error = allergiesQuery.error;

  // Get patient info from first allergy record
  const patientName = useMemo(() => {
    const activePatientFromVisit = allergies[0]?.patient;
    return (
      activePatient?.name?.trim() ||
      activePatientFromVisit?.name?.trim() ||
      'this patient'
    );
  }, [activePatient?.name, allergies]);

  const patientNumber = useMemo(() => {
    if (allergies.length > 0 && allergies[0]?.patient?.patient_number) {
      return allergies[0].patient.patient_number;
    }
    return 'N/A';
  }, [allergies]);

  // Show error toast if fetch fails
  useEffect(() => {
    if (isError && isOpen) {
      const errorMessage = (error as Error)?.message || 'Failed to load allergy data';
      showToast('error', errorMessage, 3000);
    }
  }, [isError, isOpen, error, showToast]);

  // Don't render if no patient selected
  if (!patientId) {
    if (isOpen) {
      showToast('warning', 'No active patient selected', 3000);
      onClose();
    }
    return null;
  }

  // Pass isLoading to modal - modal handles all UI states
  return (
    <AllergiesPreviewModal
      open={isOpen}
      onClose={onClose}
      allergies={allergies}
      patientName={patientName}
      patientNumber={patientNumber}
      initialAction={initialAction}
      isLoading={isLoading}
      theme={theme}
    />
  );
};

export default AllergyReportLauncher;