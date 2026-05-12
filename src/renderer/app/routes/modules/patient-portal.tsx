import React from "react";
import { Navigate, Outlet, Route } from "react-router-dom";
import { PATIENT_PORTAL_ROUTES } from "../routeConstants";
import { ForwardThemeOutlet, PlaceholderPanel, SuspenseWrapper, WithThemeProp } from "./shared/routeUtils";
import PatientPortalMedicalHistoryShell from "../../../modules/patient-portal/ui/medical-history/PatientPortalMedicalHistoryShell";
import {
  PatientPortalMedicalHistoryFullPage,
  PatientPortalMedicalHistoryLatestPage,
} from "../../../modules/patient-portal/ui/medical-history/PatientPortalMedicalHistoryPages";
import { PatientPortalDownloadsReportsPage } from "../../../modules/patient-portal/ui/downloads/PatientPortalDownloadsReportsPage";
import { PatientPortalMedicationsLatestPage } from "../../../modules/patient-portal/ui/medications/PatientPortalMedicationsLatest";
import { PatientPortalLaboratoryResultsLatestPage } from "../../../modules/patient-portal/ui/laboratory/PatientPortalLaboratoryResultsLatest";
import { PatientPortalAppointmentsLatestPage } from "../../../modules/patient-portal/ui/appointments/PatientPortalAppointmentsLatest";
import { PatientPortalAppointmentSchedulePage } from "../../../modules/patient-portal/ui/appointments/PatientPortalAppointmentSchedulePage";
import Message from "../../../modules/account/ui/message/Message";
import Inbox from "../../../modules/account/ui/message/Inbox";
import Sent from "../../../modules/account/ui/message/Sent";
import Draft from "../../../modules/account/ui/message/Draft";
import Trash from "../../../modules/account/ui/message/Trash";
import Compose from "../../../modules/account/ui/message/Compose";

function pp(title: string) {
  return (
    <SuspenseWrapper variant="dashboard">
      <PlaceholderPanel title={title} />
    </SuspenseWrapper>
  );
}

/**
 * Patient Portal child routes (render inside {@link PatientPortalModule} / BaseModuleWorkspace outlet).
 */
export const patientPortalRoutes = [
  <Route
    key="pp-legacy-overview"
    path="overview"
    element={<Navigate to={PATIENT_PORTAL_ROUTES.DASHBOARD} replace />}
  />,
  <Route
    key="pp-index"
    index
    element={<Navigate to={PATIENT_PORTAL_ROUTES.DASHBOARD} replace />}
  />,

  <Route key="pp-dashboard" path="dashboard" element={pp("Dashboard")} />,

  <Route
    key="pp-medical-history"
    path="medical-history"
    element={
      <SuspenseWrapper variant="dashboard">
        <PatientPortalMedicalHistoryShell />
      </SuspenseWrapper>
    }
  >
    <Route index element={<Navigate to="latest-visit" replace />} />
    <Route
      path="latest-visit"
      element={
        <SuspenseWrapper variant="dashboard">
          <PatientPortalMedicalHistoryLatestPage />
        </SuspenseWrapper>
      }
    />
    <Route
      path="full"
      element={
        <SuspenseWrapper variant="dashboard">
          <PatientPortalMedicalHistoryFullPage />
        </SuspenseWrapper>
      }
    />
    <Route path="summary" element={<Navigate to="../full" replace />} />
    <Route path="vitals" element={<Navigate to="../full" replace />} />
    <Route path="conditions" element={<Navigate to="../full" replace />} />
    <Route path="allergies" element={<Navigate to="../full" replace />} />
  </Route>,

  <Route
    key="pp-medications"
    path="medications"
    element={
      <SuspenseWrapper variant="dashboard">
        <PatientPortalMedicationsLatestPage />
      </SuspenseWrapper>
    }
  />,
  <Route
    key="pp-medications-legacy-current"
    path="medications/current"
    element={<Navigate to={PATIENT_PORTAL_ROUTES.MEDICATIONS} replace />}
  />,
  <Route
    key="pp-medications-legacy-history"
    path="medications/history"
    element={<Navigate to={PATIENT_PORTAL_ROUTES.MEDICATIONS} replace />}
  />,
  <Route
    key="pp-medications-legacy-refill"
    path="medications/refill"
    element={<Navigate to={PATIENT_PORTAL_ROUTES.MEDICATIONS} replace />}
  />,
  <Route
    key="pp-medications-legacy-interactions"
    path="medications/interactions"
    element={<Navigate to={PATIENT_PORTAL_ROUTES.MEDICATIONS} replace />}
  />,

  <Route
    key="pp-lab-results"
    path="laboratory-results"
    element={
      <SuspenseWrapper variant="dashboard">
        <PatientPortalLaboratoryResultsLatestPage />
      </SuspenseWrapper>
    }
  />,
  <Route
    key="pp-lab-results-legacy-view"
    path="laboratory-results/view"
    element={<Navigate to={PATIENT_PORTAL_ROUTES.LABORATORY_RESULTS} replace />}
  />,
  <Route
    key="pp-lab-results-legacy-history"
    path="laboratory-results/history"
    element={<Navigate to={PATIENT_PORTAL_ROUTES.LABORATORY_RESULTS} replace />}
  />,
  <Route
    key="pp-lab-results-legacy-compare"
    path="laboratory-results/compare"
    element={<Navigate to={PATIENT_PORTAL_ROUTES.LABORATORY_RESULTS} replace />}
  />,
  <Route
    key="pp-lab-results-legacy-explain"
    path="laboratory-results/explain"
    element={<Navigate to={PATIENT_PORTAL_ROUTES.LABORATORY_RESULTS} replace />}
  />,

  <Route key="pp-billing" path="billing-payments" element={<Outlet />}>
    <Route index element={pp("Billing & payments")} />
    <Route path="overview" element={pp("Billing overview")} />
    <Route path="payments" element={pp("Payments")} />
    <Route path="history" element={pp("Payment history")} />
    <Route path="invoices" element={pp("Invoices")} />
  </Route>,

  <Route key="pp-appointments" path="appointments" element={<ForwardThemeOutlet />}>
    <Route
      index
      element={
        <SuspenseWrapper variant="dashboard">
          <PatientPortalAppointmentsLatestPage />
        </SuspenseWrapper>
      }
    />
    <Route
      path="schedule"
      element={
        <SuspenseWrapper variant="dashboard">
          <PatientPortalAppointmentSchedulePage />
        </SuspenseWrapper>
      }
    />
    <Route path="upcoming" element={<Navigate to={PATIENT_PORTAL_ROUTES.APPOINTMENTS} replace />} />
    <Route path="past" element={<Navigate to={PATIENT_PORTAL_ROUTES.APPOINTMENTS} replace />} />
    <Route path="cancel" element={pp("Cancel appointment")} />
  </Route>,

  <Route
    key="pp-notifications"
    path="notifications"
    element={
      <SuspenseWrapper variant="dashboard">
        <WithThemeProp
          Component={Message}
          props={{
            messageRoutes: {
              inbox: PATIENT_PORTAL_ROUTES.NOTIFICATIONS_INBOX,
              sent: PATIENT_PORTAL_ROUTES.NOTIFICATIONS_SENT,
              draft: PATIENT_PORTAL_ROUTES.NOTIFICATIONS_DRAFT,
              trash: PATIENT_PORTAL_ROUTES.NOTIFICATIONS_TRASH,
              compose: PATIENT_PORTAL_ROUTES.NOTIFICATIONS_COMPOSE,
            },
          }}
        />
      </SuspenseWrapper>
    }
  >
    <Route index element={<Navigate to={PATIENT_PORTAL_ROUTES.NOTIFICATIONS_INBOX} replace />} />
    <Route
      path="inbox"
      element={
        <SuspenseWrapper variant="dashboard">
          <WithThemeProp Component={Inbox} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="sent"
      element={
        <SuspenseWrapper variant="dashboard">
          <WithThemeProp Component={Sent} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="draft"
      element={
        <SuspenseWrapper variant="dashboard">
          <WithThemeProp Component={Draft} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="trash"
      element={
        <SuspenseWrapper variant="dashboard">
          <WithThemeProp Component={Trash} />
        </SuspenseWrapper>
      }
    />
    <Route
      path="compose"
      element={
        <SuspenseWrapper variant="dashboard">
          <WithThemeProp Component={Compose} />
        </SuspenseWrapper>
      }
    />
  </Route>,
  <Route
    key="pp-notifications-legacy-all"
    path="notifications/all"
    element={<Navigate to={PATIENT_PORTAL_ROUTES.NOTIFICATIONS_INBOX} replace />}
  />,
  <Route
    key="pp-notifications-legacy-unread"
    path="notifications/unread"
    element={<Navigate to={PATIENT_PORTAL_ROUTES.NOTIFICATIONS_INBOX} replace />}
  />,
  <Route
    key="pp-notifications-legacy-settings"
    path="notifications/settings"
    element={<Navigate to={PATIENT_PORTAL_ROUTES.NOTIFICATIONS_INBOX} replace />}
  />,

  <Route
    key="pp-downloads"
    path="downloads-reports"
    element={
      <SuspenseWrapper variant="dashboard">
        <PatientPortalDownloadsReportsPage />
      </SuspenseWrapper>
    }
  />,
  <Route
    key="pp-downloads-legacy-all"
    path="downloads-reports/all"
    element={<Navigate to={PATIENT_PORTAL_ROUTES.DOWNLOADS} replace />}
  />,
  <Route
    key="pp-downloads-legacy-medical"
    path="downloads-reports/medical"
    element={<Navigate to={PATIENT_PORTAL_ROUTES.DOWNLOADS} replace />}
  />,
  <Route
    key="pp-downloads-legacy-lab"
    path="downloads-reports/laboratory"
    element={<Navigate to={PATIENT_PORTAL_ROUTES.DOWNLOADS} replace />}
  />,
  <Route
    key="pp-downloads-legacy-billing"
    path="downloads-reports/billing"
    element={<Navigate to={PATIENT_PORTAL_ROUTES.DOWNLOADS} replace />}
  />,

  <Route key="pp-records" path="records" element={<Outlet />}>
    <Route index element={pp("Records")} />
    <Route path="view" element={pp("View records")} />
    <Route path="download" element={pp("Download records")} />
    <Route path="share" element={pp("Share records")} />
    <Route path="request" element={pp("Request records")} />
  </Route>,
];
