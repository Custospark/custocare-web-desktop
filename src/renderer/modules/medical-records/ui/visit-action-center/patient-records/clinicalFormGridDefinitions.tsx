import React from 'react';
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  FileText,
  Heart,
  Microscope,
  Pill,
  UserMinus,
  Users,
} from 'lucide-react';

export type ClinicalFormModuleId =
  | 'allergies'
  | 'clinical-notes'
  | 'vitals'
  | 'diagnoses'
  | 'consultations'
  | 'prescriptions'
  | 'lab-requests'
  | 'lab-results'
  | 'clinical-template'
  | 'discharge';

export interface ClinicalFormGridDefinition {
  id: ClinicalFormModuleId;
  label: string;
  icon: React.ReactNode;
  description: string;
  category: string;
}

/**
 * Shared metadata for the clinical forms grid (Medical Records latest visit).
 * Patient Portal latest visit uses report-only tiles in `PatientPortalLatestVisitClinical`.
 */
export const CLINICAL_FORM_GRID_DEFINITIONS: ClinicalFormGridDefinition[] = [
  {
    id: 'allergies',
    label: 'Allergy',
    icon: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
    description: 'Document patient allergies, reactions, and severity levels for this visit',
    category: 'Clinical Assessment',
  },
  {
    id: 'clinical-notes',
    label: 'Clinical Notes',
    icon: <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    description: 'Document symptoms, examination findings, and clinical observations',
    category: 'Documentation',
  },
  {
    id: 'vitals',
    label: 'Vitals',
    icon: <Heart className="h-5 w-5 text-rose-600 dark:text-rose-400" />,
    description: 'Record temperature, blood pressure, heart rate, and vital signs',
    category: 'Clinical Assessment',
  },
  {
    id: 'diagnoses',
    label: 'Diagnosis',
    icon: <Activity className="h-5 w-5 text-violet-600 dark:text-violet-400" />,
    description: 'Record primary and secondary diagnoses for this visit',
    category: 'Clinical Assessment',
  },
  {
    id: 'consultations',
    label: 'Consultation',
    icon: <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />,
    description: 'Document consultation notes, referrals, and specialist opinions',
    category: 'Referrals',
  },
  {
    id: 'prescriptions',
    label: 'Prescription',
    icon: <Pill className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
    description: 'Prescribe medications with dosage, frequency, and duration',
    category: 'Treatment',
  },
  {
    id: 'lab-requests',
    label: 'Lab Request',
    icon: <Microscope className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />,
    description: 'Request laboratory tests and diagnostic investigations',
    category: 'Diagnostics',
  },
  {
    id: 'lab-results',
    label: 'Lab Result',
    icon: <ClipboardList className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
    description: 'Review and document laboratory test results',
    category: 'Diagnostics',
  },
  {
    id: 'clinical-template',
    label: 'Clinical Template',
    icon: <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />,
    description: 'Fill out a predefined clinical template for quick patient documentation',
    category: 'Documentation',
  },
  {
    id: 'discharge',
    label: 'Discharge',
    icon: <UserMinus className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
    description: 'Process discharge and generate discharge summary',
    category: 'Documentation',
  },
];
