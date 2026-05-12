import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../app/store/store';
import {
  getPatientPortalResolvedFacilityId,
  getPatientPortalResolvedFacilitySnapshot,
  getPatientPortalResolvedVisitId,
} from '../../../app/store/utils/contextSelectors';
import { BaseModuleWorkspace } from '../../../shared/components/workspace/BaseModuleWorkspace';
import { PATIENT_PORTAL_MODULE_OPERATIONS } from '../../../shared/navigation/moduleWorkspaceOperations';
import { ROUTES, PATIENT_PORTAL_ROUTES } from '../../../app/routes/routeConstants';
import { PatientPortalFacilityContextSync } from './PatientPortalFacilityContextSync';

const PatientPortalModule = () => {
  const facilitySnap = useSelector((state: RootState) => getPatientPortalResolvedFacilitySnapshot(state));
  const facilityId = useSelector((state: RootState) => getPatientPortalResolvedFacilityId(state));
  const visitId = useSelector((state: RootState) => getPatientPortalResolvedVisitId(state));

  const contextSubtitle = useMemo(() => {
    if (!facilitySnap && facilityId == null && visitId == null) return undefined;
    const parts: string[] = [];
    if (facilitySnap?.name) {
      parts.push(facilitySnap.code ? `${facilitySnap.name} (${facilitySnap.code})` : facilitySnap.name);
    }
    if (facilityId != null) {
      parts.push(`Facility ID ${facilityId}`);
    }
    if (visitId != null) {
      parts.push(`Visit ${visitId}`);
    }
    return parts.join(' · ');
  }, [facilityId, facilitySnap, visitId]);

  return (
    <>
      <PatientPortalFacilityContextSync />
      <BaseModuleWorkspace
        contextTitle="Patient Portal"
        contextSubtitle={contextSubtitle}
        operations={PATIENT_PORTAL_MODULE_OPERATIONS}
        basePath={ROUTES.PATIENT_DASHBOARD}
        defaultOperationPath={PATIENT_PORTAL_ROUTES.DASHBOARD}
      />
    </>
  );
};

export default PatientPortalModule;
