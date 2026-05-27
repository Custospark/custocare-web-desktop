import React from 'react';
import { Navigate, Route, type RouteObject } from 'react-router-dom';
import { WithThemeProp, SuspenseWrapper, type ThemeProp } from './shared/routeUtils';
import { BILLING_ROUTES } from '../routeConstants';

import BillingFrontDesk from '../../../modules/billling/ui/patients/BillingFrontDesk';
import BillingActionCenter from '../../../modules/billling/ui/action-center/BillingActionCenter';
import BillingRevenueWorkspace from '../../../modules/billling/ui/revenue/BillingRevenueWorkspace';
import MRPatientQueue from '../../../modules/medical-records/ui/patients/views/MRPatientQueue';
import MRPatientWalkIn from '../../../modules/medical-records/ui/patients/views/MRPatientWalkIn';
import MRBilling from '../../../modules/medical-records/ui/visit-action-center/billing-space/MRBilling';
import RedirectToForwardPatientFocus from '../../../modules/medical-records/ui/visit-action-center/RedirectToForwardPatientFocus';
import VisitStatus from '../../../modules/medical-records/ui/visit-action-center/VisitStatus';
import { MRBillingReview } from '../../../modules/medical-records/ui/revenue/MRBillingReview';
import RevenueStats from '../../../modules/medical-records/ui/revenue/stats/RevenueStats';
import BillingInvoicesFromReceipts from '../../../modules/billling/ui/revenue/BillingInvoicesFromReceipts';
import ClinicalReportsView from '../../../modules/medical-records/ui/patients/views/ClinicalReportsView';
import { PatientBillPage } from '../../../modules/billling/ui/action-center/PatientBillPage';

const billingTablePage = <P extends ThemeProp,>(Component: React.ComponentType<P>): RouteObject['element'] => (
  <SuspenseWrapper variant="table">
    <WithThemeProp Component={Component} />
  </SuspenseWrapper>
);

export const billingRoutes = [
  <Route key="billing-index" index element={<Navigate to={BILLING_ROUTES.OVERVIEW} replace />} />,

  <Route key="billing-overview" path="overview" element={billingTablePage(RevenueStats)} />,

  <Route key="billing-patients" path="patients" element={billingTablePage(BillingFrontDesk)}>
    <Route index element={<Navigate to={BILLING_ROUTES.PATIENT_QUEUE} replace />} />
    <Route
      path="queue"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientQueue} props={{ intakeModule: 'billing' }} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="walk-in"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientWalkIn} props={{ intakeModule: 'billing' }} />
        </SuspenseWrapper>
      }
    />
  </Route>,

  <Route key="billing-action-center" path="action-center" element={billingTablePage(BillingActionCenter)}>
    <Route index element={<Navigate to={BILLING_ROUTES.BILLING_SPACE} replace />} />
    <Route
      path="forward-patient"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp
            Component={RedirectToForwardPatientFocus}
            props={{
              cancelTo: BILLING_ROUTES.BILLING_SPACE,
              queueRedirectTo: BILLING_ROUTES.PATIENT_QUEUE,
            }}
          />
        </SuspenseWrapper>
      }
    />
    <Route
      path="visit-status"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp
            Component={VisitStatus}
            props={{ queueRedirectPath: BILLING_ROUTES.PATIENT_QUEUE }}
          />
        </SuspenseWrapper>
      }
    />
    <Route path="billing-space" element={billingTablePage(MRBilling)} />
    <Route path="clinical-reports" element={billingTablePage(ClinicalReportsView)} />
    <Route path="patient-bill" element={billingTablePage(PatientBillPage)} />
  </Route>,

  <Route key="billing-revenue" path="revenue" element={billingTablePage(BillingRevenueWorkspace)}>
    <Route index element={<Navigate to={BILLING_ROUTES.RECEIPTS_RECONCILIATION} replace />} />
    <Route path="receipts-reconciliation" element={billingTablePage(MRBillingReview)} />
    <Route path="invoices" element={billingTablePage(BillingInvoicesFromReceipts)} />
    <Route path="intelligence" element={billingTablePage(RevenueStats)} />
  </Route>,
];
