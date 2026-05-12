import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../../app/store/store';
import {
  setPatientPortalVisitFacilityContext,
  type PatientPortalFacilitySnapshot,
} from '../../../app/store/slices/activeContextSlice';
import { getPatientId } from '../../../app/store/utils/contextSelectors';
import { usePatientLatestVisitContext } from '../../medical-records/api/patient-medical-history/patientMedicalHistoryQueries';
import type { FacilitySnapshot } from '../../medical-records/api/patient-medical-history/patientMedicalHistoryTypes';

function toPortalFacilitySnapshot(f: FacilitySnapshot | null | undefined): PatientPortalFacilitySnapshot | null {
  if (!f?.id || !f.name) return null;
  return {
    id: f.id,
    uuid: f.uuid,
    code: f.code,
    name: f.name,
  };
}

/**
 * Keeps Redux + localStorage patient-portal facility/visit in sync with GET …/latest-visit-context
 * so axios can attach X-Facility-Id like staff sessions.
 */
export function PatientPortalFacilityContextSync() {
  const dispatch = useDispatch<AppDispatch>();
  const patientId = useSelector((state: RootState) => getPatientId(state));
  const numericId = patientId ?? 0;

  const query = usePatientLatestVisitContext(numericId, {
    enabled: numericId > 0,
  });

  useEffect(() => {
    if (!patientId) return;
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
      toPortalFacilitySnapshot(payload.facility ?? undefined) ??
      toPortalFacilitySnapshot(payload.visit?.facility ?? undefined);

    dispatch(
      setPatientPortalVisitFacilityContext({
        visitId,
        facilityId,
        facility,
      })
    );
  }, [dispatch, patientId, query.data, query.isPending, query.isError]);

  return null;
}
