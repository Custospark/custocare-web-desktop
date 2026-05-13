import { useSelector } from 'react-redux';
import type { RootState } from '../../../../app/store/rootReducer';
import { getPatientId } from '../../../../app/store/utils/contextSelectors';
import { PatientPortalVisitReportsClinical } from '../visit-reports/PatientPortalVisitReportsClinical';
import { usePatientPortalLatestEncounter } from '../../hooks/usePatientPortalLatestEncounter';

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

  const {
    historyQuery,
    latestVisitContextQuery,
    effectiveVisitId,
    effectiveFacilityId,
    scopedForEffective,
    headerVisit,
    headerFacility,
    patientDisplayName,
  } = usePatientPortalLatestEncounter(numericId);

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
