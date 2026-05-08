import { Navigate, Route } from 'react-router-dom';
import { CLINICAL_ROUTES } from '../routeConstants';
import { SuspenseWrapper, WithThemeProp } from './shared/routeUtils';

import MedicalRecordsDashboard from '../../../modules/medical-records/ui/overview/MedicalRecordsDashboard';
import ClinicalFrontDesk from '../../../modules/clinical/ui/patients/ClinicalFrontDesk';
import MRPatientSearch from '../../../modules/medical-records/ui/patients/views/MRPatientSearch';
import MRPatientCreate from '../../../modules/medical-records/ui/patients/views/MRPatientCreate';
import MRPatientQueue from '../../../modules/medical-records/ui/patients/views/MRPatientQueue';
import MRPatientWalkIn from '../../../modules/medical-records/ui/patients/views/MRPatientWalkIn';
import MRVisitActionCenter from '../../../modules/medical-records/ui/visit-action-center/MRVisitActionCenter';
import MRPatientRecords from '../../../modules/medical-records/ui/patients/views/MRPatientRecords';
import MRClinicalCare from '../../../modules/medical-records/ui/patients/views/MRClinicalCare';
import ForwardPatient from '../../../modules/medical-records/ui/visit-action-center/ForwardPatient';
import VisitStatus from '../../../modules/medical-records/ui/visit-action-center/VisitStatus';
import MRBilling from '../../../modules/medical-records/ui/visit-action-center/billing-space/MRBilling';
import ClinicalBillingCycle from '../../../modules/clinical/ui/revenue/ClinicalBillingCycle';
import { MRBillingReview } from '../../../modules/medical-records/ui/revenue/MRBillingReview';
import RevenueStats from '../../../modules/medical-records/ui/revenue/stats/RevenueStats';

export const clinicalRoutes = [
  <Route
    key="clinical-overview"
    path={CLINICAL_ROUTES.OVERVIEW}
    element={
      <SuspenseWrapper variant="table">
        <MedicalRecordsDashboard mode="clinical" />
      </SuspenseWrapper>
    }
  />,

  <Route
    key="clinical-frontdesk"
    path="patients"
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={ClinicalFrontDesk} />
      </SuspenseWrapper>
    }
  >
    <Route index element={<Navigate to={CLINICAL_ROUTES.PATIENTS_SEARCH} replace />} />
    <Route
      path="search"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientSearch} props={{ intakeModule: 'clinical' }} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="register"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientCreate} props={{ intakeModule: 'clinical' }} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="queue"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientQueue} props={{ intakeModule: 'clinical' }} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="walk-in"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientWalkIn} props={{ intakeModule: 'clinical' }} />
        </SuspenseWrapper>
      }
    />
  </Route>,

  <Route
    key="clinical-visit-action-center"
    path="visit-action-center"
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={MRVisitActionCenter} props={{ intakeModule: 'clinical' }} />
      </SuspenseWrapper>
    }
  >
    <Route index element={<Navigate to={CLINICAL_ROUTES.FORWARD_PATIENT} replace />} />
    <Route
      path="patient-records"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientRecords} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="clinical-care"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRClinicalCare} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="forward-patient"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={ForwardPatient} props={{ queueRedirectTo: CLINICAL_ROUTES.PATIENT_QUEUE }} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="visit-status"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={VisitStatus} props={{ queueRedirectPath: CLINICAL_ROUTES.PATIENT_QUEUE }} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="billing-space"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRBilling} />
        </SuspenseWrapper>
      }
    />
  </Route>,

  <Route
    key="clinical-revenue"
    path="revenue"
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={ClinicalBillingCycle} />
      </SuspenseWrapper>
    }
  >
    <Route index element={<Navigate to={CLINICAL_ROUTES.BILLING_CYCLE_REVIEW} replace />} />
    <Route
      path="billing-cycle/review"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRBillingReview} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="billing-stats"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={RevenueStats} />
        </SuspenseWrapper>
      }
    />
  </Route>,
];
