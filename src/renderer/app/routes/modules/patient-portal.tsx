import { Navigate, Outlet, Route } from "react-router-dom";
import { PATIENT_PORTAL_ROUTES } from "../routeConstants";
import { PlaceholderPanel, SuspenseWrapper } from "./shared/routeUtils";

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

  <Route key="pp-medical-history" path="medical-history" element={<Outlet />}>
    <Route index element={pp("Medical history")} />
    <Route path="summary" element={pp("Health summary")} />
    <Route path="vitals" element={pp("Vitals")} />
    <Route path="conditions" element={pp("Conditions")} />
    <Route path="allergies" element={pp("Allergies")} />
  </Route>,

  <Route key="pp-medications" path="medications" element={<Outlet />}>
    <Route index element={pp("Medications")} />
    <Route path="current" element={pp("Current medications")} />
    <Route path="history" element={pp("Medication history")} />
    <Route path="refill" element={pp("Refills")} />
    <Route path="interactions" element={pp("Drug interactions")} />
  </Route>,

  <Route key="pp-lab-results" path="laboratory-results" element={<Outlet />}>
    <Route index element={pp("Laboratory results")} />
    <Route path="view" element={pp("Result details")} />
    <Route path="history" element={pp("Results history")} />
    <Route path="compare" element={pp("Compare results")} />
    <Route path="explain" element={pp("Explain results")} />
  </Route>,

  <Route key="pp-billing" path="billing-payments" element={<Outlet />}>
    <Route index element={pp("Billing & payments")} />
    <Route path="overview" element={pp("Billing overview")} />
    <Route path="payments" element={pp("Payments")} />
    <Route path="history" element={pp("Payment history")} />
    <Route path="invoices" element={pp("Invoices")} />
  </Route>,

  <Route key="pp-appointments" path="appointments" element={<Outlet />}>
    <Route index element={pp("Appointments")} />
    <Route path="upcoming" element={pp("Upcoming appointments")} />
    <Route path="past" element={pp("Past appointments")} />
    <Route path="schedule" element={pp("Schedule appointment")} />
    <Route path="cancel" element={pp("Cancel appointment")} />
  </Route>,

  <Route key="pp-notifications" path="notifications" element={<Outlet />}>
    <Route index element={pp("Notifications")} />
    <Route path="all" element={pp("All notifications")} />
    <Route path="unread" element={pp("Unread")} />
    <Route path="settings" element={pp("Notification settings")} />
  </Route>,

  <Route key="pp-downloads" path="downloads-reports" element={<Outlet />}>
    <Route index element={pp("Downloads & reports")} />
    <Route path="all" element={pp("All downloads")} />
    <Route path="medical" element={pp("Medical documents")} />
    <Route path="laboratory" element={pp("Laboratory downloads")} />
    <Route path="billing" element={pp("Billing documents")} />
  </Route>,

  <Route key="pp-records" path="records" element={<Outlet />}>
    <Route index element={pp("Records")} />
    <Route path="view" element={pp("View records")} />
    <Route path="download" element={pp("Download records")} />
    <Route path="share" element={pp("Share records")} />
    <Route path="request" element={pp("Request records")} />
  </Route>,
];
