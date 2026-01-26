import { Navigate, Route } from "react-router-dom";
import { PlaceholderPanel, WithThemeProp, SuspenseWrapper } from "./shared/routeUtils";
import { PHARMACY_ROUTES } from "../routeConstants";

// Main Pharmacy Components
import PharmacyOverview from '../../../modules/pharmacy/ui/overview/PharmacyOverview';
import Inventory from '../../../modules/pharmacy/ui/inventory/Inventory';
import Dispensing from '../../../modules/pharmacy/ui/dispensing/Dispensing';
import Prescriptions from "../../../modules/pharmacy/ui/precriptions/Prescriptions";
import Billing from "../../../modules/pharmacy/ui/billing/Billing";
// Dispensing Components
import DispenseMedication from '../../../modules/pharmacy/ui/dispensing/dispensing-medication/DispenseMedication';
import ValidatePrescription from '../../../modules/pharmacy/ui/dispensing/ValidatePrescription';
import SearchPrescription from '../../../modules/pharmacy/ui/dispensing/SearchPrescription';
import DispensingHistory from '../../../modules/pharmacy/ui/dispensing/DispensingHistory';
import IssuesQueue from '../../../modules/pharmacy/ui/dispensing/IssuesQueue';

// Dispensing Sub-components
import CustomerWalkIn from '../../../modules/pharmacy/ui/dispensing/dispensing-medication/views/CustomerWalkIn';
import PatientSearch from '../../../modules/pharmacy/ui/dispensing/dispensing-medication/views/PhamarcyPatientSearch';
import QuickPatientCreate from '../../../modules/pharmacy/ui/dispensing/dispensing-medication/views/QuickPatientCreate';
import DispensingQueue from '../../../modules/pharmacy/ui/dispensing/dispensing-medication/views/DispensingQueue';

// Inventory Components
import AddStock from '../../../modules/pharmacy/ui/inventory/AddStock';
import SearchStock from '../../../modules/pharmacy/ui/inventory/views/SearchStock';

/**
 * Pharmacy Inventory Routes Configuration
 */
export const pharmacyInventoryRoutes = [
  <Route
    key="inventory-overview"
    path="overview"
    element={<PlaceholderPanel title="Inventory Stock Overview" />}
  />,
  <Route
    key="inventory-add-stock"
    path="add-stock"
    element={<WithThemeProp Component={AddStock} />}
  />,
  <Route
    key="inventory-search-item"
    path="search-item"
    element={<WithThemeProp Component={SearchStock} />}
  />,
  <Route
    key="inventory-adjust-stock"
    path="adjust-stock"
    element={<PlaceholderPanel title="Adjust Existing Stock" />}
  />,
  <Route
    key="inventory-expired-items"
    path="expired-items"
    element={<PlaceholderPanel title="Expired / Near-Expiry Items" />}
  />,
];

/**
 * Pharmacy Dispensing Routes Configuration
 */
export const pharmacyDispensingRoutes = [
  <Route
    key="dispense-medication"
    path="dispense-medication"
    element={<WithThemeProp Component={DispenseMedication} />}
  >
    <Route index element={<Navigate to={PHARMACY_ROUTES.DISPENSING_WALK_IN} replace />} />
    <Route
      key="walk-in"
      path="walk-in"
      element={<WithThemeProp Component={CustomerWalkIn} />}
    />
    <Route
      key="patient-search"
      path="patient-search"
      element={<WithThemeProp Component={PatientSearch} />}
    />
    <Route
      key="quick-create"
      path="quick-create"
      element={<WithThemeProp Component={QuickPatientCreate} />}
    />
    <Route
      key="queue"
      path="queue"
      element={<WithThemeProp Component={DispensingQueue} />}
    />
  </Route>,
  <Route
    key="validate-prescription"
    path="validate-prescription"
    element={<WithThemeProp Component={ValidatePrescription} />}
  />,
  <Route
    key="search-prescription"
    path="search-prescription"
    element={<WithThemeProp Component={SearchPrescription} />}
  />,
  <Route
    key="history"
    path="history"
    element={<WithThemeProp Component={DispensingHistory} />}
  />,
  <Route
    key="issues-queue"
    path="issues-queue"
    element={<WithThemeProp Component={IssuesQueue} />}
  />,
];

/**
 * Main Pharmacy Routes Configuration
 */
export const pharmacyRoutes = [
  <Route
    key="pharmacy-index"
    index
    element={<Navigate to={PHARMACY_ROUTES.OVERVIEW} replace />}
  />,

  <Route
    key="pharmacy-overview"
    path="overview"
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={PharmacyOverview} />
      </SuspenseWrapper>
    }
  />,

  <Route
    key="pharmacy-prescriptions"
    path="prescriptions"
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={Prescriptions} />
      </SuspenseWrapper>
    }
  />,

  <Route
    key="pharmacy-inventory"
    path="inventory"
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={Inventory} />
      </SuspenseWrapper>
    }
  >
    <Route
      index
      element={<Navigate to={PHARMACY_ROUTES.INVENTORY_OVERVIEW} replace />}
    />
    {pharmacyInventoryRoutes}
  </Route>,

  <Route
    key="pharmacy-dispensing"
    path="dispensing"
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={Dispensing} />
      </SuspenseWrapper>
    }
  >
    <Route
      index
      element={<Navigate to={PHARMACY_ROUTES.DISPENSING_DISPENSE_MEDICATION} replace />}
    />
    {pharmacyDispensingRoutes}
  </Route>,

  <Route
    key="pharmacy-billing"
    path="billing"
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={Billing} />
      </SuspenseWrapper>
    }
  />,
];

