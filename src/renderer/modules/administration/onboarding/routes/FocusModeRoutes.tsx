// src/routes/FocusModeRoutes.tsx
import React, { Suspense } from 'react';
import { Route } from 'react-router-dom';
import { FOCUS_MODE_ROUTES } from './focusModeRouteConstants';
import FocusedModeLayout from '../../../../shared/components/Navigation/FocusedModeLayout';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';
import ClinicalTemplateFocus from '../../../medical-records/ui/visit-action-center/clinical-forms/form-wrappers/ClinicalTemplateFocus';
import { VitalsFocus } from '../../../medical-records/ui/visit-action-center/clinical-forms/vitals-form-components';
import ConsultationsFocus from '../../../medical-records/ui/visit-action-center/clinical-forms/form-wrappers/ConsultationsFocus';

// Lazy load focus mode components - Clinical Care
const AllergyFocus = React.lazy(() => import('../../../medical-records/ui/visit-action-center/clinical-forms/form-wrappers/AllergyFocus'));
const DiagnosisFocus = React.lazy(() => import('../../../medical-records/ui/visit-action-center/clinical-forms/form-wrappers/DiagnosisFocus'));
const ClinicalNotesFocus = React.lazy(() => import('../../../medical-records/ui/visit-action-center/clinical-forms/form-wrappers/ClinicalNotesFocus'));
const PrescriptionFocus = React.lazy(() => import('../../../medical-records/ui/visit-action-center/clinical-forms/form-wrappers/PrescriptionFocus'));
const LabRequestFocus = React.lazy(() => import('../../../medical-records/ui/visit-action-center/clinical-forms/form-wrappers/LabRequestFocus'));
const LabResultFocus = React.lazy(() => import('../../../medical-records/ui/visit-action-center/clinical-forms/form-wrappers/LabResultFocus'));

interface FocusModeRoutesProps {
  theme?: 'light' | 'dark';
}

export const FocusModeRoutes = ({ theme = 'light' }: FocusModeRoutesProps) => [
  // Clinical Care Focus Routes
  <Route
    key="diagnosis-focus"
    path={FOCUS_MODE_ROUTES.DIAGNOSIS_FOCUS}
    element={
      <FocusedModeLayout title="Clinical Diagnoses">
        <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
          <DiagnosisFocus theme={theme} />
        </Suspense>
      </FocusedModeLayout>
    }
  />,
  <Route
    key="allergy-focus"
    path={FOCUS_MODE_ROUTES.ALLERGY_FOCUS}
    element={
      <FocusedModeLayout title="Patient Allergies">
        <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
          <AllergyFocus theme={theme} />
        </Suspense>
      </FocusedModeLayout>
    }
  />,
  <Route
    key="consultations-focus"
    path={FOCUS_MODE_ROUTES.CONSULTATION_FOCUS}
    element={
      <FocusedModeLayout title="Patient Consultations">
        <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
          <ConsultationsFocus theme={theme} />
        </Suspense>
      </FocusedModeLayout>
    }
  />,
  <Route
    key="vitals-focus"
    path={FOCUS_MODE_ROUTES.VITALS_FOCUS}
    element={
      <FocusedModeLayout title="Patient Vitals">
        <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
          <VitalsFocus theme={theme} />
        </Suspense>
      </FocusedModeLayout>
    }
  />,
  <Route
    key="clinical-templates"
    path={FOCUS_MODE_ROUTES.CLINICAL_TEMPLATE_FOCUS}
    element={
      <FocusedModeLayout title="Clinical Templates">
        <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
          <ClinicalTemplateFocus theme={theme} />
        </Suspense>
      </FocusedModeLayout>
    }
  />,

  
  <Route
    key="clinical-notes-focus"
    path={FOCUS_MODE_ROUTES.CLINICAL_NOTES_FOCUS}
    element={
      <FocusedModeLayout title="Clinical Notes">
        <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
          <ClinicalNotesFocus theme={theme} />
        </Suspense>
      </FocusedModeLayout>
    }
  />,
  
  <Route
    key="prescription-focus"
    path={FOCUS_MODE_ROUTES.PRESCRIPTION_FOCUS}
    element={
      <FocusedModeLayout title="Prescription">
        <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
          <PrescriptionFocus theme={theme} />
        </Suspense>
      </FocusedModeLayout>
    }
  />,
  
  <Route
    key="lab-request-focus"
    path={FOCUS_MODE_ROUTES.LAB_REQUEST_FOCUS}
    element={
      <FocusedModeLayout title="Laboratory Request">
        <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
          <LabRequestFocus theme={theme} />
        </Suspense>
      </FocusedModeLayout>
    }
  />,
  
  <Route
    key="lab-result-focus"
    path={FOCUS_MODE_ROUTES.LAB_RESULT_FOCUS}
    element={
      <FocusedModeLayout title="Laboratory Test Results">
        <Suspense fallback={<LoadingSkeleton variant="dashboard" />}>
          <LabResultFocus theme={theme} />
        </Suspense>
      </FocusedModeLayout>
    }
  />,
];