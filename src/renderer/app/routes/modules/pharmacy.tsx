/* eslint-disable react-refresh/only-export-components -- route table co-located with a small redirect helper */
import { type ComponentType } from 'react';
import { Navigate, Route, useLocation } from 'react-router-dom';
import { WithThemeProp, SuspenseWrapper, type ThemeProp } from './shared/routeUtils';
import { PHARMACY_ROUTES } from '../routeConstants';

import PharmacyOverview from '../../../modules/pharmacy/ui/overview/PharmacyOverview';
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

const pharmacyTablePage = (Component: ComponentType<ThemeProp>) => (
  <SuspenseWrapper variant="table">
    <WithThemeProp Component={Component} />
  </SuspenseWrapper>
);

/** Old `/pharmacy/prescriptions/...` → medication queue (facility desk removed). */
const PharmacyLegacyPrescriptionsRedirect = () => {
  const { pathname } = useLocation();
  const first =
    pathname.replace(/^.*\/prescriptions\/?/, '').replace(/\/$/, '').split('/')[0] || '';
  if (['search', 'create', 'review'].includes(first)) {
    return <Navigate to={PHARMACY_ROUTES.PATIENTS_SEARCH} replace />;
  }
  return <Navigate to={PHARMACY_ROUTES.PATIENT_QUEUE} replace />;
};

export const pharmacyRoutes = [
  <Route
    key="pharmacy-index"
    index
    element={<Navigate to={PHARMACY_ROUTES.PATIENT_QUEUE} replace />}
  />,

  <Route
    key="pharmacy-overview"
    path="overview"
    element={pharmacyTablePage(PharmacyOverview)}
  />,

  <Route key="pharmacy-patients" path="patients" element={pharmacyTablePage(PharmacyFrontDesk)}>
    <Route index element={<Navigate to={PHARMACY_ROUTES.PATIENT_QUEUE} replace />} />
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
    <Route index element={<Navigate to={PHARMACY_ROUTES.ACTION_CENTER_DISPENSING} replace />} />
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
    <Route
      key="pharmacy-ac-prescription-review"
      path="prescription-review"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp
            Component={PrescriptionWorkbench}
            props={{ mode: 'review', scope: 'activeVisit' }}
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
    element={<Navigate to={PHARMACY_ROUTES.PATIENT_QUEUE} replace />}
  />,

  <Route key="pharmacy-legacy-prescriptions" path="prescriptions/*" element={<PharmacyLegacyPrescriptionsRedirect />} />,

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
