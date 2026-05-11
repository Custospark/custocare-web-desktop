// src/app/routes/focusModeRouteConstants.ts
export const FOCUS_MODE_ROUTES = {
  // Clinical Care Focus Routes
  CLINICAL_CARE_FOCUS: '/clinical-care-focus',
  DIAGNOSIS_FOCUS: '/clinical-care-focus/diagnosis',
  CLINICAL_NOTES_FOCUS: '/clinical-care-focus/clinical-notes',
  PRESCRIPTION_FOCUS: '/clinical-care-focus/prescription',
  LAB_REQUEST_FOCUS: '/clinical-care-focus/lab-request',
  LAB_RESULT_FOCUS: '/clinical-care-focus/lab-result',
  ALLERGY_FOCUS: '/clinical-care-focus/allergy',  
  VITALS_FOCUS: '/clinical-care-focus/vitals',  
  CONSULTATION_FOCUS: '/clinical-care-focus/consultations',  
  

  CLINICAL_TEMPLATE_FOCUS: '/clinical-care-focus/clinical-template-focus',  

  
  // Patient Record Focus Routes
  PATIENT_RECORD_FOCUS: '/patient-record-focus',
  LATEST_VISIT_FOCUS: '/patient-record-focus/latest-visit',
  MEDICAL_HISTORY_FOCUS: '/patient-record-focus/medical-history',
  
  // Report Focus Routes
  VISIT_SUMMARY_FOCUS: '/reports-focus/visit-summary',
  PRESCRIPTION_REPORT_FOCUS: '/reports-focus/prescription',
  LAB_REPORT_FOCUS: '/reports-focus/lab',
  FULL_MEDICAL_REPORT_FOCUS: '/reports-focus/full-medical',

  // Laboratory module focus routes (outside Layout)
  LABORATORY_REQUEST_FOCUS: '/laboratory-focus/lab-request',
  LABORATORY_RESULT_FOCUS: '/laboratory-focus/lab-result',

  /** Medical Records — forward patient workflow (full-screen focus) */
  FORWARD_PATIENT_FOCUS: '/medical-records-focus/forward-patient',

  /** Nursing module — encounter tabs (full-screen focus, same shell as other focus workflows) */
  NURSING_WARD_BED_FOCUS: '/nursing-focus/ward-bed',
  NURSING_TASKS_FOCUS: '/nursing-focus/tasks',
  NURSING_MEDS_FOCUS: '/nursing-focus/meds',
  NURSING_NOTES_FOCUS: '/nursing-focus/notes',
} as const;