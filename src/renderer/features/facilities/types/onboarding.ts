import type { Facility,Organization,PredefinedDepartment,Role } from './index';

export type FacilityActionId = 'overview' | 'registration' | 'departments' | 'staff' | 'workflows';

export interface StepConfig {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export interface WizardStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
}

export interface OnboardingState<TDraft = Record<string, unknown>> {
  activeAction: string;
  currentStep: number;
  isDraft: boolean;
  draftData: TDraft;
  lastSaved: string | null;
}

export interface FacilityState {
  // Data
  facilities: Facility[];
  organizations: Organization[];
  currentFacility: Facility | null;
  
  // Onboarding
  onboarding: OnboardingState;
  
  // Configuration
  predefinedDepartments: PredefinedDepartment[];
  predefinedRoles: Role[];
  
  // UI State
  loading: boolean;
  error: string | null;
  selectedFacilityId: string | null;
}

// Re-export types from index.ts
export type {
  Facility,
  Department,
  RoutingRule,
  Staff,
  RolePermission,
  Workflow,
  WorkflowRule,
  WorkflowStep,
  Organization,
  Role,
  PredefinedDepartment,
} from './index';