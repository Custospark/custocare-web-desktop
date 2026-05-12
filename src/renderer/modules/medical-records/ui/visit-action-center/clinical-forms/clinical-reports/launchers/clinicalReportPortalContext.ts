/**
 * Explicit patient + visit + facility for clinical report launchers when Redux "active visit"
 * is not set (e.g. patient portal latest visit).
 */
export interface ClinicalReportPortalContext {
  patientId: number;
  visitId: number;
  /** Used for API params on visit-scoped clinical endpoints; may be null if only visit id is known. */
  facilityId: number | null;
  patientDisplayName?: string | null;
}
