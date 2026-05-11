import { Navigate, Route } from 'react-router-dom';
import { LABORATORY_ROUTES } from '../routeConstants';
import { SuspenseWrapper, WithThemeProp } from './shared/routeUtils';
import { FOCUS_MODE_ROUTES } from '../../../modules/administration/onboarding/routes/focusModeRouteConstants';

import LaboratoryOverview from '../../../modules/laboratory/ui/overview/LaboratoryOverview';
import LaboratoryFrontDesk from '../../../modules/laboratory/ui/patients/LaboratoryFrontDesk';
import MRPatientSearch from '../../../modules/medical-records/ui/patients/views/MRPatientSearch';
import MRPatientCreate from '../../../modules/medical-records/ui/patients/views/MRPatientCreate';
import MRPatientQueue from '../../../modules/medical-records/ui/patients/views/MRPatientQueue';
import MRPatientWalkIn from '../../../modules/medical-records/ui/patients/views/MRPatientWalkIn';
import MRPatientRecords from '../../../modules/medical-records/ui/patients/views/MRPatientRecords';
import LaboratoryActionCenter from '../../../modules/laboratory/ui/action-center/LaboratoryActionCenter';
import LabFocusLauncher from '../../../modules/laboratory/ui/action-center/LabFocusLauncher';
import MRBilling from '../../../modules/medical-records/ui/visit-action-center/billing-space/MRBilling';
import LaboratoryCatalogWorkspace from '../../../modules/laboratory/ui/catalog/LaboratoryCatalogWorkspace';
import { AdminServiceCatalog } from '../../../modules/administration/admin-module/ui/service-catalog-ui/AdminServiceCatalog';
import { AdminInventoryItem } from '../../../modules/administration/admin-module/ui/inventory/AdminInventoryItems';
import { MRBillingReview } from '../../../modules/medical-records/ui/revenue/MRBillingReview';
import RedirectToForwardPatientFocus from '../../../modules/medical-records/ui/visit-action-center/RedirectToForwardPatientFocus';

export const laboratoryRoutes = [
  <Route
    key="laboratory-index"
    index
    element={<Navigate to={LABORATORY_ROUTES.OVERVIEW} replace />}
  />,

  <Route
    key="laboratory-overview"
    path="overview"
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={LaboratoryOverview} />
      </SuspenseWrapper>
    }
  />,

  <Route
    key="laboratory-patients"
    path="patients"
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={LaboratoryFrontDesk} />
      </SuspenseWrapper>
    }
  >
    <Route index element={<Navigate to={LABORATORY_ROUTES.PATIENT_QUEUE} replace />} />
    <Route
      path="search"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientSearch} props={{ intakeModule: 'laboratory' }} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="register"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientCreate} props={{ intakeModule: 'laboratory' }} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="queue"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientQueue} props={{ intakeModule: 'laboratory' }} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="walk-in"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientWalkIn} props={{ intakeModule: 'laboratory' }} />
        </SuspenseWrapper>
      }
    />
  </Route>,

  <Route
    key="laboratory-action-center"
    path="action-center"
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={LaboratoryActionCenter} />
      </SuspenseWrapper>
    }
  >
    <Route index element={<Navigate to={LABORATORY_ROUTES.ACTION_CENTER_REQUEST} replace />} />
    <Route
      path="forward-patient"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp
            Component={RedirectToForwardPatientFocus}
            props={{
              cancelTo: LABORATORY_ROUTES.ACTION_CENTER_REQUEST,
              queueRedirectTo: LABORATORY_ROUTES.PATIENT_QUEUE,
            }}
          />
        </SuspenseWrapper>
      }
    />
    <Route
      path="patient-info"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientRecords} props={{ presentation: 'laboratory' }} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="lab-request"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp
            Component={LabFocusLauncher}
            props={{
              title: 'Laboratory Request',
              description: 'Select a request form below. It opens in focus mode for maximum workspace.',
              forms: [
                {
                  key: 'lab-request-form',
                  label: 'Lab Request Form',
                  description: 'Create and manage laboratory requests for this active visit.',
                  focusPath: FOCUS_MODE_ROUTES.LABORATORY_REQUEST_FOCUS,
                },
              ],
            }}
          />
        </SuspenseWrapper>
      }
    />
    <Route
      path="lab-results"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp
            Component={LabFocusLauncher}
            props={{
              title: 'Laboratory Results',
              description: 'Select a results form below. It opens in focus mode for maximum workspace.',
              forms: [
                {
                  key: 'lab-results-form',
                  label: 'Lab Results Form',
                  description: 'Enter and update results for the selected laboratory request.',
                  focusPath: FOCUS_MODE_ROUTES.LABORATORY_RESULT_FOCUS,
                },
              ],
            }}
          />
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
    key="laboratory-catalog"
    path="catalog"
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={LaboratoryCatalogWorkspace} />
      </SuspenseWrapper>
    }
  >
    <Route index element={<Navigate to={LABORATORY_ROUTES.CATALOG_SERVICES} replace />} />
    <Route
      path="services"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={AdminServiceCatalog} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="inventory"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={AdminInventoryItem} />
        </SuspenseWrapper>
      }
    />
  </Route>,

  <Route
    key="laboratory-receipts"
    path="receipts"
    element={
      <SuspenseWrapper variant="table">
        <WithThemeProp Component={MRBillingReview} />
      </SuspenseWrapper>
    }
  />,
];
