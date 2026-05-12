/** Patient-facing copy for portal latest-visit reports (not clinician “capture / record” CTAs). */

export function patientPortalReportBadge(hasData: boolean, readyLabel: string, emptyPatientHint: string) {
  return {
    hasData,
    message: hasData ? `${readyLabel} — tap to view` : emptyPatientHint,
  };
}

export const PATIENT_PORTAL_REPORT_ROW_DESCRIPTION = {
  allergy:
    'Allergies documented during your care at this visit (when your hospital has shared them here).',
  clinicalNotes: 'Clinical notes from your visit when available.',
  vitals: 'Vital signs recorded during your visit.',
  diagnoses: 'Diagnoses documented for this visit.',
  consultations: 'Consultation notes from your visit.',
  prescriptions: 'Prescriptions from this visit when available.',
  labRequests: 'Laboratory test orders from this visit.',
  labResults: 'Laboratory results released for this visit.',
} as const;

export const PATIENT_PORTAL_REPORT_EMPTY_HINT = {
  allergies: 'Nothing about allergies has been added to your chart for this visit yet.',
  clinicalNotes: 'No clinical notes are available for this visit yet.',
  vitals: 'No vital signs are on file for this visit yet.',
  diagnoses: 'No diagnoses are listed for this visit yet.',
  consultations: 'No consultation notes are available for this visit yet.',
  prescriptions: 'No prescriptions are on file for this visit yet.',
  labRequests: 'No lab orders are on file for this visit yet.',
  labResults: 'No lab results are available for this visit yet.',
} as const;
