import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../app/store/rootReducer';
import { getPatientId } from '../../../../app/store/utils/contextSelectors';
import {
  usePatientLatestVisitContext,
  usePatientMedicalHistory,
} from '../../../medical-records/api/patient-medical-history/patientMedicalHistoryQueries';
import type { PatientMedicalHistoryPayload } from '../../../medical-records/api/patient-medical-history/patientMedicalHistoryTypes';
import {
  filterMedicalHistoryPayloadByVisitId,
  pickLatestVisitId,
} from '../../../medical-records/api/patient-medical-history/patientMedicalHistoryVisitFilter';
import { PatientPortalVisitReportsClinical } from '../visit-reports/PatientPortalVisitReportsClinical';

function visitScopedPayload(data: PatientMedicalHistoryPayload): PatientMedicalHistoryPayload | null {
  if (!data.visits.length) return null;
  const latestId = pickLatestVisitId(data.visits);
  if (latestId == null) return null;
  return filterMedicalHistoryPayloadByVisitId(data, latestId);
}

export interface PatientPortalLatestVisitClinicalProps {
  theme?: 'light' | 'dark';
}

/**
 * Patient portal latest visit — delegates to {@link PatientPortalVisitReportsClinical}
 * with server `latest-visit-context` plus aggregate fallback.
 */
export function PatientPortalLatestVisitClinical({ theme = 'light' }: PatientPortalLatestVisitClinicalProps) {
  const patientId = useSelector((state: RootState) => getPatientId(state));
  const numericId = patientId ?? 0;

  const historyQuery = usePatientMedicalHistory(numericId, {
    enabled: numericId > 0,
  });

  const latestVisitContextQuery = usePatientLatestVisitContext(numericId, {
    enabled: numericId > 0,
  });

  const scoped = useMemo(() => {
    if (!historyQuery.data) return null;
    return visitScopedPayload(historyQuery.data);
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

  return (
    <PatientPortalVisitReportsClinical
      theme={theme}
      patientId={numericId}
      effectiveVisitId={effectiveVisitId}
      effectiveFacilityId={effectiveFacilityId}
      scoped={scopedForEffective}
      patientDisplayName={patientDisplayName}
      headerVisit={headerVisit}
      headerFacility={headerFacility}
      pageTitle="Reports — latest visit"
      pageSubtitle="View printable summaries from your most recent hospital visit. Visit and facility details come from your record — not from a facility you select here."
      loadingMessage="Loading your latest visit…"
      isHistoryLoading={historyQuery.isLoading}
      isHistoryError={historyQuery.isError}
      historyError={(historyQuery.error as Error) ?? null}
      awaitVisitContext
      visitContextQueryPending={latestVisitContextQuery.isPending}
      visitContextQueryFetched={latestVisitContextQuery.isFetched}
      visitContextQuerySuccess={latestVisitContextQuery.isSuccess}
    />
  );
}
