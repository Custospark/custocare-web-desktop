import { type ComponentType } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { NURSING_ROUTES } from '../routeConstants';
import { SuspenseWrapper, WithThemeProp } from './shared/routeUtils';
import {
  MedicationTreatmentWorkspace,
  NursingEncounterWorkspace,
  NursingPlaceholderView,
  TasksShiftsWorkspace,
  WardsPatientsWorkspace,
} from '../../../modules/nursing/ui/NursingActionWorkspaces';
import MRPatientSearch from '../../../modules/medical-records/ui/patients/views/MRPatientSearch';
import MRPatientQueue from '../../../modules/medical-records/ui/patients/views/MRPatientQueue';
import MRPatientRecords from '../../../modules/medical-records/ui/patients/views/MRPatientRecords';
import NursingWardBedManagement from '../../../modules/nursing/ui/encounter/NursingWardBedManagement';
import MyTasksView from '../../../modules/nursing/ui/tasks-shifts/MyTasksView';
import AssignTaskView from '../../../modules/nursing/ui/tasks-shifts/AssignTaskView';
import ShiftHandoverView from '../../../modules/nursing/ui/tasks-shifts/ShiftHandoverView';
import TaskHistoryView from '../../../modules/nursing/ui/tasks-shifts/TaskHistoryView';
import MedicationScheduleView from '../../../modules/nursing/ui/medication-treatment/MedicationScheduleView';
import AdministerMedicationView from '../../../modules/nursing/ui/medication-treatment/AdministerMedicationView';
import MissedMedicationsView from '../../../modules/nursing/ui/medication-treatment/MissedMedicationsView';
import TreatmentLogView from '../../../modules/nursing/ui/medication-treatment/TreatmentLogView';
import NursingOverview from '../../../modules/nursing/ui/overview/NursingOverview';

const nursingTablePage = <P extends { theme: 'light' | 'dark' }>(
  Component: ComponentType<P>,
  props?: Omit<P, 'theme'>
) => (
  <SuspenseWrapper variant="table">
    <WithThemeProp Component={Component} props={props} />
  </SuspenseWrapper>
);

export const nursingRoutes = [
  <Route key="nursing-index" index element={<Navigate to={NURSING_ROUTES.OVERVIEW} replace />} />,

  <Route key="nursing-overview" path="overview" element={nursingTablePage(NursingOverview)} />,

  <Route
    key="nursing-intelligence-legacy"
    path="nursing-intelligence"
    element={<Navigate to={NURSING_ROUTES.OVERVIEW} replace />}
  />,
  <Route
    key="nursing-intelligence-legacy-nested"
    path="nursing-intelligence/*"
    element={<Navigate to={NURSING_ROUTES.OVERVIEW} replace />}
  />,

  <Route key="nursing-wards-patients" path="wards-patients" element={nursingTablePage(WardsPatientsWorkspace)}>
    <Route index element={<Navigate to={NURSING_ROUTES.WARDS_PATIENTS_SEARCH_PATIENT} replace />} />
    <Route
      path="search-patient"
      element={nursingTablePage(MRPatientSearch, { intakeModule: 'nursing' })}
    />
    <Route
      path="my-ward-patients"
      element={nursingTablePage(NursingPlaceholderView, { title: 'My Ward Patients (To be implemented)' })}
    />
    <Route
      path="new-patients-unassigned"
      element={nursingTablePage(MRPatientQueue, { intakeModule: 'nursing' })}
    />
  </Route>,

  <Route key="nursing-encounter" path="nursing-encounter" element={nursingTablePage(NursingEncounterWorkspace)}>
    <Route index element={<Navigate to={NURSING_ROUTES.NURSING_ENCOUNTER_PATIENT_INFO} replace />} />
    <Route
      path="patient-info"
      element={nursingTablePage(MRPatientRecords, { presentation: 'nursing' })}
    />
    <Route path="ward-bed" element={nursingTablePage(NursingWardBedManagement)} />
    <Route path="tasks" element={nursingTablePage(NursingPlaceholderView, { title: 'Tasks' })} />
    <Route path="meds" element={nursingTablePage(NursingPlaceholderView, { title: 'Meds' })} />
    <Route path="notes" element={nursingTablePage(NursingPlaceholderView, { title: 'Notes' })} />
  </Route>,

  <Route key="nursing-medication-treatment" path="medication-treatment" element={nursingTablePage(MedicationTreatmentWorkspace)}>
    <Route index element={<Navigate to={NURSING_ROUTES.MEDICATION_TREATMENT_MEDICATION_SCHEDULE} replace />} />
    <Route path="medication-schedule" element={nursingTablePage(MedicationScheduleView)} />
    <Route path="administer-medication" element={nursingTablePage(AdministerMedicationView)} />
    <Route path="missed-medications" element={nursingTablePage(MissedMedicationsView)} />
    <Route path="treatment-log" element={nursingTablePage(TreatmentLogView)} />
  </Route>,

  <Route key="nursing-tasks-shifts" path="tasks-shifts" element={nursingTablePage(TasksShiftsWorkspace)}>
    <Route index element={<Navigate to={NURSING_ROUTES.TASKS_SHIFTS_MY_TASKS} replace />} />
    <Route path="my-tasks" element={nursingTablePage(MyTasksView)} />
    <Route path="assign-task" element={nursingTablePage(AssignTaskView)} />
    <Route path="shift-handover" element={nursingTablePage(ShiftHandoverView)} />
    <Route path="task-history" element={nursingTablePage(TaskHistoryView)} />
  </Route>,
];
