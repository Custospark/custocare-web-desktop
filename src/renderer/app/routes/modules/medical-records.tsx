import { Route,Navigate } from "react-router-dom";
import { MEDICAL_RECORDS_ROUTES } from "../routeConstants";
import { SuspenseWrapper } from "./shared/routeUtils";
import { WithThemeProp } from "./shared/routeUtils";
import FrontDesk from '../../../modules/medical-records/ui/patients/FrontDesk';
// import { MedicalRecordsDashboard } from '../../../modules/medical-records/ui/overview/MedicalRecordsDashboard';
import MRVisitActionCenter from '../../../modules/medical-records/ui/visit-action-center/MRVisitActionCenter';
import MRPatientSearch from '../../../modules/medical-records/ui/patients/views/MRPatientSearch';
import MRPatientCreate from '../../../modules/medical-records/ui/patients/views/MRPatientCreate';
import MRPatientQueue from '../../../modules/medical-records/ui/patients/views/MRPatientQueue';
import MRPatientWalkIn from '../../../modules/medical-records/ui/patients/views/MRPatientWalkIn';
import ForwardPatient from "../../../modules/medical-records/ui/visit-action-center/ForwardPatient";
import PatientComplaints from "../../../modules/medical-records/ui/visit-action-center/PatientComplaints";
import VisitStatus from "../../../modules/medical-records/ui/visit-action-center/VisitStatus";
import MRBilling from "../../../modules/medical-records/ui/visit-action-center/billing-space/MRBilling";
import MRBillingCycle from "../../../modules/medical-records/ui/revenue/MRBillingCycle";
import { MRBillingReview } from "../../../modules/medical-records/ui/revenue/MRBillingReview";
import RevenueStats from "../../../modules/medical-records/ui/revenue/stats/RevenueStats";
import MedicalRecordsDashboard from "../../../modules/medical-records/ui/overview/MedicalRecordsDashboard";
export const medicalRecordsRoutes = [
  <Route
    key="overview"
    path={MEDICAL_RECORDS_ROUTES.OVERVIEW}
    element={
      <SuspenseWrapper variant="table">
        <MedicalRecordsDashboard />
      </SuspenseWrapper>
    }
  />,
  <Route
    key="medical-records-frontdesk"
    path="patients"
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={FrontDesk} />
      </SuspenseWrapper>
    }
  >
    <Route index element={<Navigate to={MEDICAL_RECORDS_ROUTES.OVERVIEW} replace />} />
    <Route path={MEDICAL_RECORDS_ROUTES.PATIENTS_SEARCH} element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientSearch} />
        </SuspenseWrapper>
      } />
    <Route path={MEDICAL_RECORDS_ROUTES.PATIENTS_REGISTER} element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientCreate} />
        </SuspenseWrapper>
      } />
    <Route path={MEDICAL_RECORDS_ROUTES.PATIENT_QUEUE} element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientQueue} />
        </SuspenseWrapper>
      } />
    <Route path={MEDICAL_RECORDS_ROUTES.WALKIN_PATIENT} element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientWalkIn} />
        </SuspenseWrapper>
      } />
  </Route>,
   <Route
    key="visit-action-center"
    path={MEDICAL_RECORDS_ROUTES.VISIT_ACTION_CENTER}
    element={
      <SuspenseWrapper variant="table">
      <WithThemeProp Component={MRVisitActionCenter} />
      </SuspenseWrapper>
    }>
       <Route index element={<Navigate to={MEDICAL_RECORDS_ROUTES.FORWARD_PATIENT} replace />} />
    <Route path={MEDICAL_RECORDS_ROUTES.FORWARD_PATIENT} element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={ForwardPatient} />
        </SuspenseWrapper>
      } />
    <Route path={MEDICAL_RECORDS_ROUTES.GET_COMPLAINTS} element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={PatientComplaints} />
        </SuspenseWrapper>
      } />
    <Route path={MEDICAL_RECORDS_ROUTES.VISIT_STATUS} element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={VisitStatus} />
        </SuspenseWrapper>
      } />
    <Route path={MEDICAL_RECORDS_ROUTES.PATIENT_BILLING_SPACE} element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRBilling} />
        </SuspenseWrapper>
      } />
    </Route>,
     <Route
    key="billing_cycle"
    path={MEDICAL_RECORDS_ROUTES.REVENUE_INTEGRITY}
    element={
      <SuspenseWrapper variant="table">
      <WithThemeProp Component={MRBillingCycle} />
      </SuspenseWrapper>
    }>
    <Route index element={<Navigate to={MEDICAL_RECORDS_ROUTES.BILLING_CYCLE_REVIEW} replace />} />
    <Route path={MEDICAL_RECORDS_ROUTES.BILLING_CYCLE_REVIEW} element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRBillingReview} />
        </SuspenseWrapper>
      } />
    <Route path={MEDICAL_RECORDS_ROUTES.BILLING_STATS} element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={RevenueStats} />
        </SuspenseWrapper>
      } />
    <Route path={MEDICAL_RECORDS_ROUTES.BILLING_CYCLE_REVIEW} element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRBillingReview} />
        </SuspenseWrapper>
      } />
   
    </Route>,
];