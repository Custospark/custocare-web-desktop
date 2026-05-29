import React, { Suspense } from 'react';
import { Route } from 'react-router-dom';
import { ForwardPatientFocusRouteShell } from '../../../medical-records/ui/visit-action-center/ForwardPatientFocusRouteShell';
import { FOCUS_MODE_ROUTES } from './focusModeRouteConstants';
import { LABORATORY_ROUTES, NURSING_ROUTES } from '../../../../app/routes/routeConstants';
import NursingWardBedManagement from '../../../nursing/ui/encounter/NursingWardBedManagement';
import NursingEncounterTasksView from '../../../nursing/ui/encounter/NursingEncounterTasksView';
import NursingEncounterMedsView from '../../../nursing/ui/encounter/NursingEncounterMedsView';
import NursingEncounterNotesView from '../../../nursing/ui/encounter/NursingEncounterNotesView';
import FocusedModeLayout from '../../../../shared/components/Navigation/FocusedModeLayout';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';
import ClinicalTemplateFocus from '../../../medical-records/ui/visit-action-center/clinical-forms/form-wrappers/ClinicalTemplateFocus';
import { VitalsFocus } from '../../../medical-records/ui/visit-action-center/clinical-forms/vitals-form-components';
import ConsultationsFocus from '../../../medical-records/ui/visit-action-center/clinical-forms/form-wrappers/ConsultationsFocus';
const AllergyFocus = React.lazy(
  () => import('../../../medical-records/ui/visit-action-center/clinical-forms/form-wrappers/AllergyFocus')
);
const DiagnosisFocus = React.lazy(
  () => import('../../../medical-records/ui/visit-action-center/clinical-forms/form-wrappers/DiagnosisFocus')
);
const ClinicalNotesFocus = React.lazy(
  () => import('../../../medical-records/ui/visit-action-center/clinical-forms/form-wrappers/ClinicalNotesFocus')
);
const PrescriptionFocus = React.lazy(
  () => import('../../../medical-records/ui/visit-action-center/clinical-forms/form-wrappers/PrescriptionFocus')
);
const LabRequestFocus = React.lazy(
  () => import('../../../medical-records/ui/visit-action-center/clinical-forms/form-wrappers/LabRequestFocus')
);
const LabResultFocus = React.lazy(
  () => import('../../../medical-records/ui/visit-action-center/clinical-forms/form-wrappers/LabResultFocus')
);
const DischargeFocus = React.lazy(
  () => import('../../../medical-records/ui/visit-action-center/clinical-forms/form-wrappers/DischargeFocus')
);
const LatestVisit = React.lazy(
  () => import('../../../medical-records/ui/visit-action-center/patient-records/LatestVisit')
);
const MedicalHistory = React.lazy(
  () => import('../../../medical-records/ui/visit-action-center/patient-records/MedicalHistory')
);

interface FocusModeRoutesProps {
  theme?: 'light' | 'dark';
  patientName?: string | null;
}

export const FocusModeRoutes = ({ theme = 'light', patientName }: FocusModeRoutesProps) => {
  const cleanPatientName = patientName?.trim() || 'Unknown Patient';
  const withPatientTitle = (baseTitle: string) => `${baseTitle} - ${cleanPatientName}`;

  return [
  <Route
    key="diagnosis-focus"
    path={FOCUS_MODE_ROUTES.DIAGNOSIS_FOCUS}
    element={
      <FocusedModeLayout title={withPatientTitle('Clinical Diagnoses')}>
        <Suspense fallback={<LoadingSkeleton variant="dashboard" theme={theme} />}>
          <DiagnosisFocus theme={theme} />
        </Suspense>
      </FocusedModeLayout>
    }
  />,
  <Route
    key="allergy-focus"
    path={FOCUS_MODE_ROUTES.ALLERGY_FOCUS}
    element={
      <FocusedModeLayout title={withPatientTitle('Patient Allergies')}>
        <Suspense fallback={<LoadingSkeleton variant="dashboard" theme={theme} />}>
          <AllergyFocus theme={theme} />
        </Suspense>
      </FocusedModeLayout>
    }
  />,
  <Route
    key="consultations-focus"
    path={FOCUS_MODE_ROUTES.CONSULTATION_FOCUS}
    element={
      <FocusedModeLayout title={withPatientTitle('Patient Consultations')}>
        <Suspense fallback={<LoadingSkeleton variant="dashboard" theme={theme} />}>
          <ConsultationsFocus theme={theme} />
        </Suspense>
      </FocusedModeLayout>
    }
  />,
  <Route
    key="vitals-focus"
    path={FOCUS_MODE_ROUTES.VITALS_FOCUS}
    element={
      <FocusedModeLayout title={withPatientTitle('Patient Vitals')}>
        <Suspense fallback={<LoadingSkeleton variant="dashboard" theme={theme} />}>
          <VitalsFocus theme={theme} />
        </Suspense>
      </FocusedModeLayout>
    }
  />,
  <Route
    key="discharge-focus"
    path={FOCUS_MODE_ROUTES.DISCHARGE_FOCUS}
    element={
      <FocusedModeLayout title={withPatientTitle('Discharge Summary')}>
        <Suspense fallback={<LoadingSkeleton variant="dashboard" theme={theme} />}>
          <DischargeFocus theme={theme} />
        </Suspense>
      </FocusedModeLayout>
    }
  />,
  <Route
    key="clinical-templates"
    path={FOCUS_MODE_ROUTES.CLINICAL_TEMPLATE_FOCUS}
    element={
      <FocusedModeLayout title={withPatientTitle('Clinical Templates')}>
        <Suspense fallback={<LoadingSkeleton variant="dashboard" theme={theme} />}>
          <ClinicalTemplateFocus theme={theme} />
        </Suspense>
      </FocusedModeLayout>
    }
  />,
  <Route
    key="clinical-notes-focus"
    path={FOCUS_MODE_ROUTES.CLINICAL_NOTES_FOCUS}
    element={
      <FocusedModeLayout title={withPatientTitle('Clinical Notes')}>
        <Suspense fallback={<LoadingSkeleton variant="dashboard" theme={theme} />}>
          <ClinicalNotesFocus theme={theme} />
        </Suspense>
      </FocusedModeLayout>
    }
  />,
  <Route
    key="prescription-focus"
    path={FOCUS_MODE_ROUTES.PRESCRIPTION_FOCUS}
    element={
      <FocusedModeLayout title={withPatientTitle('Prescription')}>
        <Suspense fallback={<LoadingSkeleton variant="dashboard" theme={theme} />}>
          <PrescriptionFocus theme={theme} />
        </Suspense>
      </FocusedModeLayout>
    }
  />,
  <Route
    key="lab-request-focus"
    path={FOCUS_MODE_ROUTES.LAB_REQUEST_FOCUS}
    element={
      <FocusedModeLayout title={withPatientTitle('Laboratory Request')}>
        <Suspense fallback={<LoadingSkeleton variant="dashboard" theme={theme} />}>
          <LabRequestFocus theme={theme} />
        </Suspense>
      </FocusedModeLayout>
    }
  />,
  <Route
    key="lab-result-focus"
    path={FOCUS_MODE_ROUTES.LAB_RESULT_FOCUS}
    element={
      <FocusedModeLayout title={withPatientTitle('Laboratory Test Results')}>
        <Suspense fallback={<LoadingSkeleton variant="dashboard" theme={theme} />}>
          <LabResultFocus theme={theme} />
        </Suspense>
      </FocusedModeLayout>
    }
  />,
  <Route
    key="forward-patient-focus"
    path={FOCUS_MODE_ROUTES.FORWARD_PATIENT_FOCUS}
    element={<ForwardPatientFocusRouteShell theme={theme} withPatientTitle={withPatientTitle} />}
  />,
  <Route
    key="laboratory-module-lab-request-focus"
    path={FOCUS_MODE_ROUTES.LABORATORY_REQUEST_FOCUS}
    element={
      <FocusedModeLayout title={withPatientTitle('Laboratory Request')}>
        <Suspense fallback={<LoadingSkeleton variant="dashboard" theme={theme} />}>
          <LabRequestFocus theme={theme} cancelTo={LABORATORY_ROUTES.ACTION_CENTER_REQUEST} />
        </Suspense>
      </FocusedModeLayout>
    }
  />,
  <Route
    key="laboratory-module-lab-result-focus"
    path={FOCUS_MODE_ROUTES.LABORATORY_RESULT_FOCUS}
    element={
      <FocusedModeLayout title={withPatientTitle('Laboratory Test Results')}>
        <Suspense fallback={<LoadingSkeleton variant="dashboard" theme={theme} />}>
          <LabResultFocus theme={theme} cancelTo={LABORATORY_ROUTES.ACTION_CENTER_RESULTS} />
        </Suspense>
      </FocusedModeLayout>
    }
  />,
  <Route
    key="medical-history-latest-visit"
    path={FOCUS_MODE_ROUTES.LATEST_VISIT_FOCUS}
    element={
      <FocusedModeLayout title={withPatientTitle('Current Visit')}>
        <Suspense fallback={<LoadingSkeleton variant="dashboard" theme={theme} />}>
          <LatestVisit theme={theme} />
        </Suspense>
      </FocusedModeLayout>
    }
  />,
  <Route
    key="medical-history-full-record"
    path={FOCUS_MODE_ROUTES.MEDICAL_HISTORY_FOCUS}
    element={
      <FocusedModeLayout title={withPatientTitle('Medical History')}>
        <Suspense fallback={<LoadingSkeleton variant="dashboard" theme={theme} />}>
          <MedicalHistory theme={theme} />
        </Suspense>
      </FocusedModeLayout>
    }
  />,
  <Route
    key="nursing-encounter-ward-bed-focus"
    path={FOCUS_MODE_ROUTES.NURSING_WARD_BED_FOCUS}
    element={
      <FocusedModeLayout title={withPatientTitle('Ward & Bed')} onClose={NURSING_ROUTES.NURSING_ENCOUNTER_PATIENT_INFO}>
        <NursingWardBedManagement theme={theme} />
      </FocusedModeLayout>
    }
  />,
  <Route
    key="nursing-encounter-tasks-focus"
    path={FOCUS_MODE_ROUTES.NURSING_TASKS_FOCUS}
    element={
      <FocusedModeLayout title={withPatientTitle('Tasks')} onClose={NURSING_ROUTES.NURSING_ENCOUNTER_TASKS}>
        <NursingEncounterTasksView theme={theme} />
      </FocusedModeLayout>
    }
  />,
  <Route
    key="nursing-encounter-meds-focus"
    path={FOCUS_MODE_ROUTES.NURSING_MEDS_FOCUS}
    element={
      <FocusedModeLayout title={withPatientTitle('Medications')} onClose={NURSING_ROUTES.NURSING_ENCOUNTER_MEDS}>
        <NursingEncounterMedsView theme={theme} />
      </FocusedModeLayout>
    }
  />,
  <Route
    key="nursing-encounter-notes-focus"
    path={FOCUS_MODE_ROUTES.NURSING_NOTES_FOCUS}
    element={
      <FocusedModeLayout title={withPatientTitle('Notes')} onClose={NURSING_ROUTES.NURSING_ENCOUNTER_NOTES}>
        <NursingEncounterNotesView theme={theme} />
      </FocusedModeLayout>
    }
  />,
];
};