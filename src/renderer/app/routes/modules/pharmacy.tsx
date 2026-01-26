import { Navigate,Route } from "react-router-dom";
import { PlaceholderPanel } from "./routeUtils";
import { WithThemeProp } from "./routeUtils";
import { PHARMACY_ROUTES } from "../routeConstants";
import DispenseMedication from '../../../modules/pharmacy/ui/dispensing/dispensing-medication/DispenseMedication';
import ValidatePrescription from '../../../modules/pharmacy/ui/dispensing/ValidatePrescription';
import SearchPrescription from '../../../modules/pharmacy/ui/dispensing/SearchPrescription';
import DispensingHistory from '../../../modules/pharmacy/ui/dispensing/DispensingHistory';
import IssuesQueue from '../../../modules/pharmacy/ui/dispensing/IssuesQueue';

// Pharmacy Dispensing Sub-components
import CustomerWalkIn from '../../../modules/pharmacy/ui/dispensing/dispensing-medication/views/CustomerWalkIn';
import PatientSearch from '../../../modules/pharmacy/ui/dispensing/dispensing-medication/views/PhamarcyPatientSearch';
import QuickPatientCreate from '../../../modules/pharmacy/ui/dispensing/dispensing-medication/views/QuickPatientCreate';
import DispensingQueue from '../../../modules/pharmacy/ui/dispensing/dispensing-medication/views/DispensingQueue';
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


