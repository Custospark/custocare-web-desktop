import { type ComponentType } from "react";
import { Navigate, Route } from "react-router-dom";
import { WithThemeProp, SuspenseWrapper, type ThemeProp } from "./shared/routeUtils";
import { PHARMACY_ROUTES } from "../routeConstants";

import PharmacyOverview from '../../../modules/pharmacy/ui/overview/PharmacyOverview';
import Prescriptions from "../../../modules/pharmacy/ui/precriptions/Prescriptions";
import PrescriptionWorkbench from '../../../modules/pharmacy/ui/precriptions/views/PrescriptionWorkbench';
import { MRBillingReview } from '../../../modules/medical-records/ui/revenue/MRBillingReview';
import { AdminInventoryItem } from '../../../modules/administration/admin-module/ui/inventory/AdminInventoryItems';

import MRPatientSearch from '../../../modules/medical-records/ui/patients/views/MRPatientSearch';
import MRPatientCreate from '../../../modules/medical-records/ui/patients/views/MRPatientCreate';
import MRPatientWalkIn from '../../../modules/medical-records/ui/patients/views/MRPatientWalkIn';
import PharmacyFrontDesk from '../../../modules/pharmacy/ui/patients/PharmacyFrontDesk';
import PharmacyPatientQueue from '../../../modules/pharmacy/ui/patients/views/PharmacyPatientQueue';
import PharmacyActionCenter from '../../../modules/pharmacy/ui/action-center/PharmacyActionCenter';
import PharmacyDispenseMedication from '../../../modules/pharmacy/ui/action-center/PharmacyDispenseMedication';

/** Standard pharmacy page shell: table layout + theme from module outlet. */
const pharmacyTablePage = (Component: ComponentType<ThemeProp>) => (
  <SuspenseWrapper variant="table">
    <WithThemeProp Component={Component} />
  </SuspenseWrapper>
);

/**
 * Pharmacy Prescriptions Routes Configuration
 */
export const pharmacyPrescriptionRoutes = [
  <Route
    key="prescriptions-index"
    index
    element={<Navigate to={PHARMACY_ROUTES.PRESCRIPTIONS_QUEUE} replace />}
  />,
  <Route
    key="prescriptions-queue"
    path="queue"
    element={<WithThemeProp Component={PrescriptionWorkbench} props={{ mode: 'queue' }} />}
  />,
  <Route
    key="prescriptions-create"
    path="create"
    element={<WithThemeProp Component={PrescriptionWorkbench} props={{ mode: 'create' }} />}
  />,
  <Route
    key="prescriptions-review"
    path="review"
    element={<WithThemeProp Component={PrescriptionWorkbench} props={{ mode: 'review' }} />}
  />,
  <Route
    key="prescriptions-search"
    path="search"
    element={<WithThemeProp Component={PrescriptionWorkbench} props={{ mode: 'search' }} />}
  />,
  <Route
    key="prescriptions-flagged"
    path="flagged"
    element={<WithThemeProp Component={PrescriptionWorkbench} props={{ mode: 'flagged' }} />}
  />,
  <Route
    key="prescriptions-approved"
    path="approved"
    element={<WithThemeProp Component={PrescriptionWorkbench} props={{ mode: 'approved' }} />}
  />,
];

/**
 * Main Pharmacy Routes Configuration
 */
export const pharmacyRoutes = [
  <Route
    key="pharmacy-index"
    index
    element={<Navigate to={PHARMACY_ROUTES.PATIENTS_SEARCH} replace />}
  />,

  <Route
    key="pharmacy-overview"
    path="overview"
    element={pharmacyTablePage(PharmacyOverview)}
  />,

  <Route key="pharmacy-patients" path="patients" element={pharmacyTablePage(PharmacyFrontDesk)}>
    <Route index element={<Navigate to={PHARMACY_ROUTES.PATIENTS_SEARCH} replace />} />
    <Route
      path="search"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientSearch} props={{ intakeModule: 'pharmacy' }} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="register"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientCreate} props={{ intakeModule: 'pharmacy' }} />
        </SuspenseWrapper>
      }
    />
    <Route path="queue" element={pharmacyTablePage(PharmacyPatientQueue)} />
    <Route
      path="walk-in"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientWalkIn} props={{ intakeModule: 'pharmacy' }} />
        </SuspenseWrapper>
      }
    />
  </Route>,

  <Route
    key="pharmacy-action-center"
    path="action-center"
    element={pharmacyTablePage(PharmacyActionCenter)}
  >
    <Route
      index
      element={<Navigate to={PHARMACY_ROUTES.ACTION_CENTER_DISPENSING} replace />}
    />
    <Route
      key="pharmacy-ac-dispensing"
      path="dispensing"
      element={pharmacyTablePage(PharmacyDispenseMedication)}
    />
    <Route
      key="pharmacy-ac-prescription-search"
      path="prescription-search"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp
            Component={PrescriptionWorkbench}
            props={{ mode: 'search', scope: 'activeVisit' }}
          />
        </SuspenseWrapper>
      }
    />
  </Route>,

  <Route
    key="pharmacy-workstation-redirect"
    path="workstation"
    element={<Navigate to={PHARMACY_ROUTES.ACTION_CENTER_DISPENSING} replace />}
  />,

  <Route
    key="pharmacy-legacy-dispensing"
    path="dispensing/*"
    element={<Navigate to={PHARMACY_ROUTES.PATIENTS_SEARCH} replace />}
  />,

  <Route
    key="pharmacy-prescriptions"
    path="prescriptions"
    element={pharmacyTablePage(Prescriptions)}
  >
    {pharmacyPrescriptionRoutes}
  </Route>,

  <Route
    key="pharmacy-inventory"
    path="inventory"
    element={pharmacyTablePage(AdminInventoryItem)}
  />,
  <Route
    key="pharmacy-receipts"
    path="receipts"
    element={pharmacyTablePage(MRBillingReview)}
  />,
];
