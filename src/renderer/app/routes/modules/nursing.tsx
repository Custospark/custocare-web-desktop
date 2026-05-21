import { type ComponentType } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { NURSING_ROUTES } from '../routeConstants';
import { SuspenseWrapper, WithThemeProp, type ThemeProp } from './shared/routeUtils';
import {
  NursingEncounterWorkspace,
  TasksShiftsWorkspace,
  WardsPatientsWorkspace,
} from '../../../modules/nursing/ui/NursingActionWorkspaces';
import MRPatientSearch from '../../../modules/medical-records/ui/patients/views/MRPatientSearch';
import MRPatientQueue from '../../../modules/medical-records/ui/patients/views/MRPatientQueue';
import MRPatientRecords from '../../../modules/medical-records/ui/patients/views/MRPatientRecords';
import NursingEncounterTasksView from '../../../modules/nursing/ui/encounter/NursingEncounterTasksView';
import NursingEncounterMedsView from '../../../modules/nursing/ui/encounter/NursingEncounterMedsView';
import NursingEncounterNotesView from '../../../modules/nursing/ui/encounter/NursingEncounterNotesView';
import RedirectToForwardPatientFocus from '../../../modules/medical-records/ui/visit-action-center/RedirectToForwardPatientFocus';
import RedirectToNursingWardBedFocus from '../../../modules/nursing/ui/encounter/RedirectToNursingWardBedFocus';
import MyTasksView from '../../../modules/nursing/ui/tasks-shifts/MyTasksView';
import AssignTaskView from '../../../modules/nursing/ui/tasks-shifts/AssignTaskView';
import ShiftHandoverView from '../../../modules/nursing/ui/tasks-shifts/ShiftHandoverView';
import TaskHistoryView from '../../../modules/nursing/ui/tasks-shifts/TaskHistoryView';
import NursingOverview from '../../../modules/nursing/ui/overview/NursingOverview';
import MyWardPatientsView from '../../../modules/nursing/ui/wards-patients/MyWardPatientsView';

const nursingTablePage = <P extends ThemeProp,>(
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
    <Route path="my-ward-patients" element={nursingTablePage(MyWardPatientsView)} />
    <Route
      path="new-patients-unassigned"
      element={nursingTablePage(MRPatientQueue, { intakeModule: 'nursing' })}
    />
  </Route>,

  <Route key="nursing-encounter" path="nursing-encounter" element={nursingTablePage(NursingEncounterWorkspace)}>
    <Route index element={<Navigate to={NURSING_ROUTES.NURSING_ENCOUNTER_PATIENT_INFO} replace />} />
    <Route
      path="forward-patient"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp
            Component={RedirectToForwardPatientFocus}
            props={{
              cancelTo: NURSING_ROUTES.NURSING_ENCOUNTER_PATIENT_INFO,
              queueRedirectTo: NURSING_ROUTES.WARDS_PATIENTS_NEW_PATIENTS_UNASSIGNED,
            }}
          />
        </SuspenseWrapper>
      }
    />
    <Route
      path="patient-info"
      element={nursingTablePage(MRPatientRecords, { presentation: 'nursing' })}
    />
    <Route
      path="ward-bed"
      element={
        <SuspenseWrapper variant="table">
          <WithThemeProp Component={RedirectToNursingWardBedFocus} />
        </SuspenseWrapper>
      }
    />
    <Route path="tasks" element={nursingTablePage(NursingEncounterTasksView)} />
    <Route path="meds" element={nursingTablePage(NursingEncounterMedsView)} />
    <Route path="notes" element={nursingTablePage(NursingEncounterNotesView)} />
  </Route>,

  <Route key="nursing-tasks-shifts" path="tasks-shifts" element={nursingTablePage(TasksShiftsWorkspace)}>
    <Route index element={<Navigate to={NURSING_ROUTES.TASKS_SHIFTS_MY_TASKS} replace />} />
    <Route path="my-tasks" element={nursingTablePage(MyTasksView)} />
    <Route path="assign-task" element={nursingTablePage(AssignTaskView)} />
    <Route path="shift-handover" element={nursingTablePage(ShiftHandoverView)} />
    <Route path="task-history" element={nursingTablePage(TaskHistoryView)} />
  </Route>,
];
