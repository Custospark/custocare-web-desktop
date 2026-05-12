import type { PatientMedicalHistoryPayload } from './patientMedicalHistoryTypes';

const toTimestamp = (value?: string | null): number => {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

/** Pick the visit with the most recent clinical timeline signal. */
export function pickLatestVisitId(visits: PatientMedicalHistoryPayload['visits']): number | null {
  if (!visits?.length) return null;
  const sorted = sortVisitsNewestFirst(visits);
  return sorted[0]?.id ?? null;
}

/** Newest-first by occurred_at / arrived_at / discharged_at (same ranking as {@link pickLatestVisitId}). */
export function sortVisitsNewestFirst(
  visits: PatientMedicalHistoryPayload['visits']
): PatientMedicalHistoryPayload['visits'] {
  if (!visits?.length) return [];
  const scored = visits.map((v) => ({
    v,
    t: Math.max(
      toTimestamp(v.occurred_at),
      toTimestamp(v.arrived_at),
      toTimestamp(v.discharged_at)
    ),
  }));
  scored.sort((a, b) => b.t - a.t);
  return scored.map((row) => row.v);
}

/** Narrow aggregate payload to a single visit (read-only report scope). */
export function filterMedicalHistoryPayloadByVisitId(
  data: PatientMedicalHistoryPayload,
  visitId: number
): PatientMedicalHistoryPayload {
  return {
    ...data,
    visits: data.visits.filter((v) => v.id === visitId),
    allergies: data.allergies.filter((a) => a.visit_id === visitId),
    prescriptions: data.prescriptions.filter((p) => p.visit_id === visitId),
    clinical_notes: data.clinical_notes.filter((n) => n.visit_id === visitId),
    vitals: data.vitals.filter((v) => v.visit_id === visitId),
    diagnoses: data.diagnoses.filter((d) => d.visit_id === visitId),
    consultations: data.consultations.filter((c) => c.visit_id === visitId),
    lab_requests: data.lab_requests.filter((l) => l.visit_id === visitId),
    lab_results: data.lab_results.filter((r) => r.visit_id === visitId),
  };
}
