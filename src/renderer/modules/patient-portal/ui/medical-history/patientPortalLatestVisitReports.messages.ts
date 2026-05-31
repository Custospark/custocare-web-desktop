/** Patient-facing copy for portal latest-visit reports (not clinician “capture / record” CTAs). */

export function patientPortalReportBadge(hasData: boolean, readyLabel: string, emptyPatientHint: string) {
  return {
    hasData,
    message: hasData ? `${readyLabel} — tap to view` : emptyPatientHint,
  };
}

export const PATIENT_PORTAL_REPORT_ROW_DESCRIPTION = {
  consultations: 'Consultation notes from your visit.',
  prescriptions: 'Prescriptions from this visit when available.',
  labRequests: 'Laboratory test orders from this visit.',
  labResults: 'Laboratory results released for this visit.',
  discharge: 'Discharge summary from your visit when available.',
} as const;

export const PATIENT_PORTAL_REPORT_EMPTY_HINT = {
  consultations: 'No consultation notes are available for this visit yet.',
  prescriptions: 'No prescriptions are on file for this visit yet.',
  labRequests: 'No lab orders are on file for this visit yet.',
  labResults: 'No lab results are available for this visit yet.',
  discharge: 'No discharge summary is available for this visit yet.',
} as const;
