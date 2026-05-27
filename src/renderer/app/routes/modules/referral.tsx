/* eslint-disable react-refresh/only-export-components -- route table */
import { type ComponentType } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { REFERRAL_ROUTES } from '../routeConstants';
import { SuspenseWrapper, WithThemeProp } from './shared/routeUtils';

import ReferralOverview from '../../../modules/referral/ui/overview/ReferralOverview';
import ReferralFrontDesk from '../../../modules/referral/ui/patients/ReferralFrontDesk';
import MRPatientSearch from '../../../modules/medical-records/ui/patients/views/MRPatientSearch';
import MRPatientCreate from '../../../modules/medical-records/ui/patients/views/MRPatientCreate';
import MRPatientQueue from '../../../modules/medical-records/ui/patients/views/MRPatientQueue';
import MRPatientWalkIn from '../../../modules/medical-records/ui/patients/views/MRPatientWalkIn';
import MRPatientRecords from '../../../modules/medical-records/ui/patients/views/MRPatientRecords';
import ReferralActionCenter from '../../../modules/referral/ui/action-center/ReferralActionCenter';
import VisitReferralStatus from '../../../modules/referral/ui/action-center/VisitReferralStatus';
import VisitReferralCreate from '../../../modules/referral/ui/action-center/VisitReferralCreate';
import ReferralNetworkWorkspace from '../../../modules/referral/ui/network/ReferralNetworkWorkspace';
import ReferralNetworkHub from '../../../modules/referral/ui/network/ReferralNetworkHub';
import { MRBillingReview } from '../../../modules/medical-records/ui/revenue/MRBillingReview';
import RedirectToForwardPatientFocus from '../../../modules/medical-records/ui/visit-action-center/RedirectToForwardPatientFocus';
import ClinicalReportsView from '../../../modules/medical-records/ui/patients/views/ClinicalReportsView';

const tablePage = <P extends { theme: 'light' | 'dark' }>(Component: ComponentType<P>) => (
  <SuspenseWrapper variant="table">
    <WithThemeProp Component={Component} />
  </SuspenseWrapper>
);

export const referralRoutes = [
  <Route key="referral-index" index element={<Navigate to={REFERRAL_ROUTES.OVERVIEW} replace />} />,

  <Route key="referral-overview" path="overview" element={tablePage(ReferralOverview)} />,

  <Route key="referral-patients" path="patients" element={tablePage(ReferralFrontDesk)}>
    <Route index element={<Navigate to={REFERRAL_ROUTES.PATIENT_QUEUE} replace />} />
    <Route
      path="search"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientSearch} props={{ intakeModule: 'referral' }} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="register"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientCreate} props={{ intakeModule: 'referral' }} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="queue"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientQueue} props={{ intakeModule: 'referral' }} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="walk-in"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientWalkIn} props={{ intakeModule: 'referral' }} />
        </SuspenseWrapper>
      }
    />
  </Route>,

  <Route key="referral-action-center" path="action-center" element={tablePage(ReferralActionCenter)}>
    <Route index element={<Navigate to={REFERRAL_ROUTES.ACTION_CENTER_REFERRAL_STATUS} replace />} />
    <Route
      path="forward-patient"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp
            Component={RedirectToForwardPatientFocus}
            props={{
              cancelTo: REFERRAL_ROUTES.ACTION_CENTER_REFERRAL_STATUS,
              queueRedirectTo: REFERRAL_ROUTES.PATIENT_QUEUE,
            }}
          />
        </SuspenseWrapper>
      }
    />
    <Route path="referral-status" element={tablePage(VisitReferralStatus)} />
    <Route path="create-referral" element={tablePage(VisitReferralCreate)} />
    <Route
      path="patient-info"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={MRPatientRecords} props={{ presentation: 'referral' }} />
        </SuspenseWrapper>
      }
    />
    <Route path="clinical-reports" element={tablePage(ClinicalReportsView)} />
  </Route>,

  <Route key="referral-network" path="network" element={tablePage(ReferralNetworkWorkspace)}>
    <Route index element={<Navigate to={REFERRAL_ROUTES.NETWORK_PENDING} replace />} />
    <Route
      path="pending"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={ReferralNetworkHub} props={{ initialTab: 'pending' }} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="incoming"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={ReferralNetworkHub} props={{ initialTab: 'incoming' }} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="outgoing"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={ReferralNetworkHub} props={{ initialTab: 'outgoing' }} />
        </SuspenseWrapper>
      }
    />
  </Route>,

  <Route key="referral-receipts" path="receipts" element={tablePage(MRBillingReview)} />,
];
