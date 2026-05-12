import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../../app/store/store';
import { setPatientPortalVisitFacilityContext } from '../../../app/store/slices/activeContextSlice';
import { getPatientId } from '../../../app/store/utils/contextSelectors';
import { usePatientLatestVisitContext } from '../../medical-records/api/patient-medical-history/patientMedicalHistoryQueries';
import { toPatientPortalFacilitySnapshot } from '../utils/patientPortalFacilitySnapshot';

/**
 * Keeps Redux + localStorage patient-portal facility/visit in sync with GET …/latest-visit-context
 * so axios can attach X-Facility-Id like staff sessions.
 *
 * Skipped on **Downloads & reports** — that screen sets visit/facility from the visit the patient selects.
 */
export function PatientPortalFacilityContextSync() {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const patientId = useSelector((state: RootState) => getPatientId(state));
  const numericId = patientId ?? 0;

  const isDownloadsReportsRoute = location.pathname.includes('/downloads-reports');

  const query = usePatientLatestVisitContext(numericId, {
    enabled: numericId > 0 && !isDownloadsReportsRoute,
  });

  useEffect(() => {
    if (!patientId) return;
    if (isDownloadsReportsRoute) return;
    if (query.isPending) return;
    if (query.isError) return;

    const payload = query.data;
    if (payload === undefined) return;

    if (payload === null) {
      dispatch(
        setPatientPortalVisitFacilityContext({
          visitId: null,
          facilityId: null,
          facility: null,
        })
      );
      return;
    }

    const visitId = payload.visit?.id ?? null;
    const facilityId =
      payload.facility_id ?? payload.visit?.facility_id ?? payload.facility?.id ?? null;
    const facility =
      toPatientPortalFacilitySnapshot(payload.facility ?? undefined) ??
      toPatientPortalFacilitySnapshot(payload.visit?.facility ?? undefined);

    dispatch(
      setPatientPortalVisitFacilityContext({
        visitId,
        facilityId,
        facility,
      })
    );
  }, [dispatch, patientId, query.data, query.isPending, query.isError, isDownloadsReportsRoute]);

  return null;
}
