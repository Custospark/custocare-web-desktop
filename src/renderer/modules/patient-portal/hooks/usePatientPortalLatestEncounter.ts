import { useMemo } from 'react';
import {
  usePatientLatestVisitContext,
  usePatientMedicalHistory,
} from '../../medical-records/api/patient-medical-history/patientMedicalHistoryQueries';
import type { PatientMedicalHistoryPayload } from '../../medical-records/api/patient-medical-history/patientMedicalHistoryTypes';
import {
  filterMedicalHistoryPayloadByVisitId,
  pickLatestVisitId,
} from '../../medical-records/api/patient-medical-history/patientMedicalHistoryVisitFilter';

function visitScopedLatestPayload(data: PatientMedicalHistoryPayload): PatientMedicalHistoryPayload | null {
  if (!data.visits.length) return null;
  const latestId = pickLatestVisitId(data.visits);
  if (latestId == null) return null;
  return filterMedicalHistoryPayloadByVisitId(data, latestId);
}

/**
 * Shared resolution for “latest encounter” in the patient portal: medical-history aggregate
 * plus optional `latest-visit-context` override (visit / facility ids).
 */
export function usePatientPortalLatestEncounter(patientId: number) {
  const historyQuery = usePatientMedicalHistory(patientId, {
    enabled: patientId > 0,
  });

  const latestVisitContextQuery = usePatientLatestVisitContext(patientId, {
    enabled: patientId > 0,
  });

  const scoped = useMemo(() => {
    if (!historyQuery.data) return null;
    return visitScopedLatestPayload(historyQuery.data);
  }, [historyQuery.data]);

  const latestVisitMeta = useMemo(() => {
    if (!scoped?.visits?.length) return null;
    return scoped.visits[0];
  }, [scoped]);

  const effectiveVisitId = useMemo(() => {
    const fromCtx = latestVisitContextQuery.data?.visit?.id;
    if (fromCtx != null) return fromCtx;
    if (!scoped?.visits?.length) return null;
    return pickLatestVisitId(scoped.visits);
  }, [latestVisitContextQuery.data, scoped]);

  const effectiveFacilityId = useMemo(() => {
    const resolved = latestVisitContextQuery.data;
    return (
      resolved?.facility_id ??
      resolved?.visit?.facility_id ??
      latestVisitMeta?.facility_id ??
      latestVisitMeta?.facility?.id ??
      null
    );
  }, [latestVisitContextQuery.data, latestVisitMeta]);

  const scopedForEffective = useMemo(() => {
    if (!historyQuery.data || effectiveVisitId == null) return scoped;
    return filterMedicalHistoryPayloadByVisitId(historyQuery.data, effectiveVisitId);
  }, [historyQuery.data, effectiveVisitId, scoped]);

  const headerFacility = latestVisitContextQuery.data?.facility ?? latestVisitMeta?.facility ?? null;
  const headerVisit =
    latestVisitContextQuery.data?.visit ??
    (effectiveVisitId != null && historyQuery.data?.visits
      ? historyQuery.data.visits.find((v) => v.id === effectiveVisitId) ?? latestVisitMeta
      : latestVisitMeta);

  const patientDisplayName =
    historyQuery.data?.patient?.full_name ?? latestVisitContextQuery.data?.patient?.full_name ?? null;

  return {
    historyQuery,
    latestVisitContextQuery,
    effectiveVisitId,
    effectiveFacilityId,
    scopedForEffective,
    headerVisit,
    headerFacility,
    patientDisplayName,
  };
}
