import { Route,Navigate } from "react-router-dom";
import { MEDICAL_RECORDS_ROUTES } from "../routeConstants";
import { SuspenseWrapper } from "./shared/routeUtils";
import { WithThemeProp } from "./shared/routeUtils";
import FrontDesk from '../../../modules/medical-records/ui/patients/FrontDesk';
import MedicalRecordsOverView from '../../../modules/medical-records/ui/overview/MedicalRecordsOverView';
import MRVisitActionCenter from '../../../modules/medical-records/ui/visit-action-center/MRVisitActionCenter';
import MRPatientSearch from '../../../modules/medical-records/ui/patients/views/MRPatientSearch';
import MRPatientCreate from '../../../modules/medical-records/ui/patients/views/MRPatientCreate';
import MRPatientQueue from '../../../modules/medical-records/ui/patients/views/MRPatientQueue';
import MRPatientWalkIn from '../../../modules/medical-records/ui/patients/views/MRPatientWalkIn';
import Appearance from "../../../modules/account/apearance/Appearance";
import ForwardPatient from "../../../modules/medical-records/ui/visit-action-center/ForwardPatient";
import PatientComplaints from "../../../modules/medical-records/ui/visit-action-center/PatientComplaints";
import VisitStatus from "../../../modules/medical-records/ui/visit-action-center/VisitStatus";
import ChargeEntry from "../../../modules/medical-records/ui/visit-action-center/ChargeEntry";
import BillingSummary from "../../../modules/medical-records/ui/visit-action-center/BillingSummary";
import { BillingSpace } from "../../../modules/medical-records/ui/visit-action-center/billing-new";
import MRBilling from "../../../modules/medical-records/ui/visit-action-center/billing-newest/MRBilling";
export const medicalRecordsRoutes = [
  <Route
    key="overview"
    path={MEDICAL_RECORDS_ROUTES.OVERVIEW}
    element={
      <SuspenseWrapper variant="table">
        <MedicalRecordsOverView />
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
    <Route index element={<Navigate to={MEDICAL_RECORDS_ROUTES.PATIENTS_SEARCH} replace />} />
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
    <Route path={MEDICAL_RECORDS_ROUTES.PATIENT_CHARGE_ENTRY} element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={ChargeEntry} />
        </SuspenseWrapper>
      } />
    <Route path={MEDICAL_RECORDS_ROUTES.PATIENT_BILLING_SUMMARY} element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRBilling} />
        </SuspenseWrapper>
      } />
    </Route>,
  <Route
    key="account-appearance"
    path="appearance"
    element={
      <SuspenseWrapper variant="table">
        <Appearance />
      </SuspenseWrapper>
    }
  />,
];