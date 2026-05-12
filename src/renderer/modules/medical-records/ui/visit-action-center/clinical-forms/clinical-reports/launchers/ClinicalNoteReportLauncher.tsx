/**
 * ClinicalNoteReportLauncher.tsx
 * ============================================================================
 * CLINICAL NOTE REPORT LAUNCHER
 * ============================================================================
 * 
 * This component fetches clinical note data for the active visit and displays
 * the preview/print/download modal for clinical notes reports.
 * 
 * @module ClinicalNoteReportLauncher
 */

import React, { useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectActivePatient, selectActiveVisitId } from '../../../../../../../app/store/slices/visitSlice';
import { ClinicalNotesPreviewModal } from '../../clinical-notes-form-components';
import {
  pickPrimaryClinicalNote,
  extractClinicalNotesFormValues,
  getClinicalNoteTitle,
} from '../../clinical-notes-form-components/clinicalNotesForm.utils';
import { useToast } from '../../../../../../../app/store/contexts/toast/useToast';
import { useGetVisitClinicalNotes } from '../../../../../api/clinical-notes/clinicalNoteQueries';
import { getActiveFacilityId } from '../../../../../../../app/store/utils/contextSelectors';
import type { ClinicalReportPortalContext } from './clinicalReportPortalContext';

interface ClinicalNoteReportLauncherProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Initial action to perform when modal opens */
  initialAction?: 'preview' | 'print' | 'download';
  /** Theme for the modal */
  theme?: 'light' | 'dark';
  portalContext?: ClinicalReportPortalContext | null;
}

export const ClinicalNoteReportLauncher: React.FC<ClinicalNoteReportLauncherProps> = ({
  isOpen,
  onClose,
  initialAction = 'preview',
  theme = 'light',
  portalContext = null,
}) => {
  const activeVisitId = useSelector(selectActiveVisitId);
  const facilityFromStore = useSelector(getActiveFacilityId);
  const activePatient = useSelector(selectActivePatient);
  const { showToast } = useToast();

  const visitId = portalContext?.visitId ?? activeVisitId ?? null;
  const resolvedFacilityId =
    portalContext != null ? portalContext.facilityId ?? facilityFromStore : facilityFromStore;

  const notesQuery = useGetVisitClinicalNotes(visitId ?? 0, {
    enabled: !!visitId && isOpen && !!resolvedFacilityId,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    ...(portalContext != null ? { facilityId: portalContext.facilityId ?? undefined } : {}),
  });

  const visitNotes = useMemo(() => notesQuery.data?.data ?? [], [notesQuery.data]);
  const activeVisitNote = useMemo(() => pickPrimaryClinicalNote(visitNotes), [visitNotes]);
  const hydratedValues = useMemo(
    () => extractClinicalNotesFormValues(activeVisitNote),
    [activeVisitNote]
  );

  const noteTitle = useMemo(
    () => getClinicalNoteTitle(activeVisitNote, hydratedValues),
    [activeVisitNote, hydratedValues]
  );
  const activePatientFromVisit = activeVisitNote?.patient;
  const displayPatientName =
    portalContext?.patientDisplayName?.trim() ||
    activePatient?.name?.trim() ||
    activePatientFromVisit?.full_name?.trim() ||
    activeVisitNote?.patient_name?.trim() ||
    'this patient';

  const isLoading = notesQuery.isLoading;
  const isError = notesQuery.isError;
  const error = notesQuery.error;

  // Show error toast if fetch fails
  useEffect(() => {
    if (isError && isOpen) {
      const errorMessage = (error as Error)?.message || 'Failed to load clinical note data';
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

  // Pass isLoading to modal - modal handles all UI states
  return (
    <ClinicalNotesPreviewModal
      open={isOpen}
      onClose={onClose}
      note={activeVisitNote}
      values={hydratedValues}
      noteTitle={noteTitle}
      patientName={displayPatientName}
      initialAction={initialAction}
      isLoading={isLoading}
      theme={theme}
    />
  );
};

export default ClinicalNoteReportLauncher;