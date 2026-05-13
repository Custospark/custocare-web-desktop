import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useOutletContext } from 'react-router-dom';
import type { RootState } from '../../../../app/store/rootReducer';
import type { AppDispatch } from '../../../../app/store/store';
import { setPatientPortalVisitFacilityContext } from '../../../../app/store/slices/activeContextSlice';
import { getPatientId } from '../../../../app/store/utils/contextSelectors';
import { usePatientMedicalHistory } from '../../../medical-records/api/patient-medical-history/patientMedicalHistoryQueries';
import {
  filterMedicalHistoryPayloadByVisitId,
  pickLatestVisitId,
  sortVisitsNewestFirst,
} from '../../../medical-records/api/patient-medical-history/patientMedicalHistoryVisitFilter';
import type { MedicalHistoryVisit } from '../../../medical-records/api/patient-medical-history/patientMedicalHistoryTypes';
import { PatientPortalVisitReportsClinical } from '../visit-reports/PatientPortalVisitReportsClinical';
import { toPatientPortalFacilitySnapshot } from '../../utils/patientPortalFacilitySnapshot';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';

type Ctx = { theme: 'light' | 'dark' };

function visitOptionLabel(v: MedicalHistoryVisit): string {
  const raw = v.occurred_at ?? v.arrived_at ?? v.discharged_at;
  const date =
    raw && Number.isFinite(new Date(raw).getTime())
      ? new Date(raw).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'Date unknown';
  const facility = v.facility?.name ?? 'Facility';
  return `${date} — ${facility} (Visit ${v.id})`;
}

export function PatientPortalDownloadsReportsPage() {
  const { theme } = useOutletContext<Ctx>();
  const dispatch = useDispatch<AppDispatch>();
  const patientId = useSelector((state: RootState) => getPatientId(state));
  const numericId = patientId ?? 0;

  const historyQuery = usePatientMedicalHistory(numericId, {
    enabled: numericId > 0,
  });

  const visits = useMemo(() => {
    const raw = historyQuery.data?.visits ?? [];
    return sortVisitsNewestFirst(raw);
  }, [historyQuery.data]);

  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!visits.length) {
      setSelectedVisitId(null);
      return;
    }
    setSelectedVisitId((cur) => {
      if (cur != null && visits.some((v) => v.id === cur)) return cur;
      return pickLatestVisitId(visits) ?? visits[0]!.id;
    });
  }, [visits]);

  const selectedVisit = useMemo(
    () => (selectedVisitId != null ? visits.find((v) => v.id === selectedVisitId) ?? null : null),
    [visits, selectedVisitId]
  );

  useEffect(() => {
    if (!patientId || selectedVisitId == null || !selectedVisit) return;
    const facilityId = selectedVisit.facility_id ?? selectedVisit.facility?.id ?? null;
    dispatch(
      setPatientPortalVisitFacilityContext({
        visitId: selectedVisitId,
        facilityId,
        facility: toPatientPortalFacilitySnapshot(selectedVisit.facility),
      })
    );
  }, [dispatch, patientId, selectedVisit, selectedVisitId]);

  const scoped = useMemo(() => {
    if (!historyQuery.data || selectedVisitId == null) return null;
    return filterMedicalHistoryPayloadByVisitId(historyQuery.data, selectedVisitId);
  }, [historyQuery.data, selectedVisitId]);

  const effectiveFacilityId = selectedVisit?.facility_id ?? selectedVisit?.facility?.id ?? null;

  const patientDisplayName = historyQuery.data?.patient?.full_name ?? null;

  const isDark = theme === 'dark';
  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-gray-50',
      secondary: isDark ? 'bg-gray-800' : 'bg-white',
    },
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    text: isDark ? 'text-gray-100' : 'text-gray-900',
    muted: isDark ? 'text-gray-400' : 'text-gray-600',
  };

  if (!numericId) {
    return (
      <div className={`h-full w-full p-6 ${colors.bg.primary}`}>
        <div className={`rounded-xl border p-12 text-center ${colors.border} ${colors.bg.secondary}`}>
          <p className={`text-sm ${colors.muted}`}>
            Patient record could not be loaded. Please sign in again or contact support.
          </p>
        </div>
      </div>
    );
  }

  if (historyQuery.isLoading) {
    return (
      <div className="p-6">
        <LoadingSkeleton variant="dashboard" theme={theme} message="Loading your visits…" />
      </div>
    );
  }

  if (historyQuery.isError) {
    return (
      <div className={`rounded-xl border p-6 ${colors.border} ${colors.bg.secondary}`}>
        <p className="text-sm text-red-600">
          {(historyQuery.error as Error)?.message ?? 'Unable to load visit information.'}
        </p>
      </div>
    );
  }

  if (!visits.length) {
    return (
      <div className={`h-full w-full p-6 ${colors.bg.primary}`}>
        <div className={`rounded-xl border p-12 text-center ${colors.border} ${colors.bg.secondary}`}>
          <p className={`text-sm ${colors.muted}`}>
            You do not have any hospital visits on file yet. When visits are recorded, you can choose one here to view
            and download reports for that encounter.
          </p>
        </div>
      </div>
    );
  }

  if (selectedVisitId == null || !selectedVisit) {
    return (
      <div className="p-6">
        <LoadingSkeleton variant="dashboard" theme={theme} message="Preparing visit list…" />
      </div>
    );
  }

  return (
    <div className={`min-h-full ${colors.bg.primary}`}>
      <div className={`border-b px-4 py-3 sm:px-5 lg:px-6 ${colors.border} ${colors.bg.secondary}`}>
        <label htmlFor="pp-downloads-visit" className={`mb-1 block text-xs font-medium uppercase tracking-wide ${colors.muted}`}>
          Select visit
        </label>
        <select
          id="pp-downloads-visit"
          value={selectedVisitId}
          onChange={(e) => setSelectedVisitId(Number(e.target.value))}
          className={`w-full max-w-xl cursor-pointer rounded-lg border px-3 py-2 text-sm outline-none transition-colors sm:max-w-2xl ${colors.border} ${colors.bg.secondary} ${colors.text} focus:ring-2 focus:ring-blue-500/30`}
        >
          {visits.map((v) => (
            <option key={v.id} value={v.id}>
              {visitOptionLabel(v)}
            </option>
          ))}
        </select>
        <p className={`mt-2 text-xs ${colors.muted}`}>
          Reports and downloads use the facility linked to this visit so previews match what was recorded during that
          encounter.
        </p>
      </div>

      <PatientPortalVisitReportsClinical
        theme={theme}
        patientId={numericId}
        effectiveVisitId={selectedVisitId}
        effectiveFacilityId={effectiveFacilityId}
        scoped={scoped}
        patientDisplayName={patientDisplayName}
        headerVisit={selectedVisit}
        headerFacility={selectedVisit.facility}
        pageTitle="Reports & downloads"
        pageSubtitle="Choose a visit above, then open a report to preview, print, or download."
        loadingMessage="Loading reports…"
        isHistoryLoading={false}
        isHistoryError={false}
        historyError={null}
      />
    </div>
  );
}
