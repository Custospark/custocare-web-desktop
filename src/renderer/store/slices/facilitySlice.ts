import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

/* =========================
   Types
========================= */
export type FacilityType = "Hospital" | "Clinic" | "Pharmacy" | "Lab" | "Other";

export interface Facility {
  id: string;
  organizationId: string;
  name: string;
  type: FacilityType;
  licenseNumber: string;
  status: 'Active' | 'Inactive' | 'Pending';
  registrationStatus: 'Not Started' | 'In Progress' | 'Completed';
  
  // Location & Contact
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  contact: {
    phone: string;
    email: string;
    emergencyContact: string;
  };
  
  // Configuration
  departments: Department[];
  staff: Staff[];
  workflows: Workflow[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  registeredBy: string;
  facilityId: string; // Unique facility ID (e.g., FAC-2024-001)
}

export interface Department {
  id: string;
  facilityId: string;
  name: string;
  type: 'Predefined' | 'Custom';
  category: string;
  status: 'Active' | 'Inactive';
  routingRules: RoutingRule[];
  assignedStaff: string[];
  createdAt: string;
}

export interface RoutingRule {
  fromDepartmentId: string;
  toDepartmentId: string;
  condition: string;
  priority: number;
}

export interface Staff {
  id: string;
  facilityId: string;
  name: string;
  role: string;
  licenseNumber: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'Pending';
  primaryDepartmentId: string;
  secondaryDepartmentIds: string[];
  rolePermissions: RolePermission[];
  credentials: {
    staffId: string;
    username: string;
    password?: string;
    lastLogin?: string;
  };
  createdAt: string;
}

export interface RolePermission {
  roleId: string;
  permissions: string[];
  accessLevel: 'Full' | 'Limited' | 'View Only';
}

export interface Workflow {
  id: string;
  facilityId: string;
  name: string;
  type: 'Patient Journey' | 'Billing' | 'Approval' | 'Clinical';
  status: 'Active' | 'Inactive' | 'Draft';
  rules: WorkflowRule[];
  steps: WorkflowStep[];
  createdAt: string;
}

export interface WorkflowRule {
  id: string;
  condition: string;
  action: string;
  priority: number;
}

export interface WorkflowStep {
  id: string;
  name: string;
  departmentId: string;
  required: boolean;
  approvalRequired: boolean;
  estimatedDuration: number; // minutes
}

export interface Organization {
  id: string;
  name: string;
  facilities: string[]; // Facility IDs
  sharedConfig: {
    defaultDepartments: string[];
    defaultRoles: Role[];
    referralNetworkEnabled: boolean;
  };
}

export interface Role {
  id: string;
  name: string;
  category: 'Clinical' | 'Administrative' | 'Technical' | 'Support';
  permissions: string[];
  description: string;
  accessLevel: number;
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

export interface PredefinedDepartment {
  id: string;
  name: string;
  category: string;
  description: string;
  required: boolean;
  defaultRouting: string[];
}

/* =========================
   Initial State
========================= */

const PREDEFINED_DEPARTMENTS: PredefinedDepartment[] = [
  { id: 'DEPT-001', name: 'Emergency / Triage', category: 'Emergency', description: 'Emergency care and triage services', required: true, defaultRouting: ['DEPT-002', 'DEPT-003'] },
  { id: 'DEPT-002', name: 'OPD', category: 'Outpatient', description: 'Outpatient department services', required: true, defaultRouting: ['DEPT-004', 'DEPT-005'] },
  { id: 'DEPT-003', name: 'Inpatient / Wards', category: 'Inpatient', description: 'Inpatient care and ward management', required: true, defaultRouting: [] },
  { id: 'DEPT-004', name: 'Pharmacy', category: 'Pharmacy', description: 'Pharmacy and medication dispensing', required: true, defaultRouting: [] },
  { id: 'DEPT-005', name: 'Laboratory', category: 'Diagnostic', description: 'Laboratory testing and diagnostics', required: true, defaultRouting: [] },
  { id: 'DEPT-006', name: 'Radiology / Imaging', category: 'Diagnostic', description: 'Medical imaging and radiology', required: true, defaultRouting: [] },
  { id: 'DEPT-007', name: 'Nursing Station', category: 'Clinical', description: 'Nursing care and patient monitoring', required: true, defaultRouting: [] },
  { id: 'DEPT-008', name: 'Billing / Cashier', category: 'Administrative', description: 'Billing and payment processing', required: true, defaultRouting: [] },
  { id: 'DEPT-009', name: 'Medical Records', category: 'Administrative', description: 'Patient records management', required: true, defaultRouting: [] },
];

const PREDEFINED_ROLES: Role[] = [
  { id: 'ROLE-001', name: 'Administrator', category: 'Administrative', permissions: ['ALL'], description: 'Full system access', accessLevel: 100 },
  { id: 'ROLE-002', name: 'Doctor', category: 'Clinical', permissions: ['VIEW_PATIENTS', 'CREATE_ENCOUNTERS', 'PRESCRIBE_MEDS', 'APPROVE_DISCHARGE'], description: 'Medical practitioner with full clinical access', accessLevel: 90 },
  { id: 'ROLE-003', name: 'Nurse', category: 'Clinical', permissions: ['VIEW_PATIENTS', 'UPDATE_VITALS', 'ADMINISTER_MEDS', 'DOCUMENT_CARE'], description: 'Nursing staff with patient care access', accessLevel: 80 },
  { id: 'ROLE-004', name: 'Pharmacist', category: 'Clinical', permissions: ['DISPENSE_MEDS', 'VERIFY_PRESCRIPTIONS', 'INVENTORY_MGMT'], description: 'Pharmacy management and dispensing', accessLevel: 70 },
  { id: 'ROLE-005', name: 'Lab Technician', category: 'Technical', permissions: ['PROCESS_TESTS', 'UPLOAD_RESULTS', 'MAINTAIN_EQUIPMENT'], description: 'Laboratory testing and results management', accessLevel: 70 },
  { id: 'ROLE-006', name: 'Radiologist', category: 'Clinical', permissions: ['VIEW_IMAGES', 'INTERPRET_STUDIES', 'APPROVE_REPORTS'], description: 'Medical imaging interpretation', accessLevel: 85 },
  { id: 'ROLE-007', name: 'Medical Officer', category: 'Clinical', permissions: ['VIEW_PATIENTS', 'CREATE_ENCOUNTERS', 'REFER_SPECIALISTS'], description: 'General medical practice', accessLevel: 75 },
  { id: 'ROLE-008', name: 'Receptionist', category: 'Administrative', permissions: ['REGISTER_PATIENTS', 'SCHEDULE_APPOINTMENTS', 'UPDATE_INFO'], description: 'Front desk and patient registration', accessLevel: 60 },
  { id: 'ROLE-009', name: 'Billing Clerk', category: 'Administrative', permissions: ['PROCESS_BILLS', 'GENERATE_INVOICES', 'MANAGE_PAYMENTS'], description: 'Financial transactions and billing', accessLevel: 60 },
  { id: 'ROLE-010', name: 'Medical Records Officer', category: 'Administrative', permissions: ['MANAGE_RECORDS', 'ARCHIVE_DOCUMENTS', 'PROVIDE_ACCESS'], description: 'Patient records management', accessLevel: 65 },
  { id: 'ROLE-011', name: 'IT Support', category: 'Technical', permissions: ['MANAGE_USERS', 'CONFIGURE_SYSTEM', 'TROUBLESHOOT'], description: 'Technical system support', accessLevel: 85 },
  { id: 'ROLE-012', name: 'Facility Manager', category: 'Administrative', permissions: ['MANAGE_STAFF', 'VIEW_REPORTS', 'CONFIGURE_FACILITY'], description: 'Facility operations management', accessLevel: 90 },
  { id: 'ROLE-013', name: 'Head Nurse', category: 'Clinical', permissions: ['MANAGE_NURSES', 'APPROVE_SCHEDULES', 'QUALITY_CHECK'], description: 'Nursing department leadership', accessLevel: 85 },
  { id: 'ROLE-014', name: 'Chief Medical Officer', category: 'Clinical', permissions: ['OVERSEE_CLINICAL', 'APPROVE_POLICIES', 'QUALITY_ASSURANCE'], description: 'Clinical department leadership', accessLevel: 95 },
  { id: 'ROLE-015', name: 'Quality Assurance', category: 'Administrative', permissions: ['AUDIT_RECORDS', 'MONITOR_COMPLIANCE', 'GENERATE_REPORTS'], description: 'Quality and compliance monitoring', accessLevel: 80 },
];

const initialState: FacilityState = {
  facilities: [
    {
      id: 'FAC-001',
      organizationId: 'ORG-001',
      name: 'Metropolitan General Hospital',
      type: 'Hospital',
      licenseNumber: 'HSP-2024-00123',
      status: 'Active',
      registrationStatus: 'Completed',
      address: {
        street: '123 Healthcare Ave',
        city: 'Metropolis',
        state: 'NY',
        country: 'USA',
        postalCode: '10001'
      },
      contact: {
        phone: '+1 (555) 123-4567',
        email: 'info@metropolitanhospital.com',
        emergencyContact: '+1 (555) 987-6543'
      },
      departments: [],
      staff: [],
      workflows: [],
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      registeredBy: 'admin@system.com',
      facilityId: 'FAC-2024-001'
    }
  ],
  organizations: [
    {
      id: 'ORG-001',
      name: 'Metropolitan Healthcare Group',
      facilities: ['FAC-001'],
      sharedConfig: {
        defaultDepartments: PREDEFINED_DEPARTMENTS.map(d => d.id),
        defaultRoles: PREDEFINED_ROLES,
        referralNetworkEnabled: true
      }
    }
  ],
  currentFacility: null,
  onboarding: {
    activeAction: '',
    currentStep: 0,
    isDraft: false,
    draftData: {},
    lastSaved: null
  },
  predefinedDepartments: PREDEFINED_DEPARTMENTS,
  predefinedRoles: PREDEFINED_ROLES,
  loading: false,
  error: null,
  selectedFacilityId: null
};

/* =========================
   Async Thunks
========================= */

// Mock async operations for demonstration
export const createFacility = createAsyncThunk(
  'facility/create',
  async (facilityData: Partial<Facility>) => {
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const facility: Facility = {
      id: uuidv4(),
      organizationId: 'ORG-001',
      name: facilityData.name || 'New Facility',
      type: facilityData.type || 'Hospital',
      licenseNumber: facilityData.licenseNumber || '',
      status: 'Pending',
      registrationStatus: 'In Progress',
      address: facilityData.address || {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: ''
      },
      contact: facilityData.contact || {
        phone: '',
        email: '',
        emergencyContact: ''
      },
      departments: [],
      staff: [],
      workflows: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      registeredBy: 'system',
      facilityId: `FAC-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };
    
    return facility;
  }
);

export const verifyLicense = createAsyncThunk(
  'facility/verifyLicense',
  async (licenseNumber: string) => {
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock verification logic
    const isValid = licenseNumber.length > 5 && /[A-Za-z0-9]/.test(licenseNumber);
    
    return {
      isValid,
      message: isValid ? 'License verified successfully' : 'Invalid license number',
      verifiedAt: new Date().toISOString()
    };
  }
);

/* =========================
   Slice
========================= */

const facilitySlice = createSlice({
  name: 'facility',
  initialState,
  reducers: {
    // Onboarding actions
    setActiveAction: (state, action: PayloadAction<string>) => {
      state.onboarding.activeAction = action.payload;
      state.onboarding.currentStep = 0;
    },
    
    setOnboardingStep: (state, action: PayloadAction<number>) => {
      state.onboarding.currentStep = action.payload;
    },
    
    saveDraft: (state, action: PayloadAction<Record<string, unknown>>) => {
      state.onboarding.draftData = { ...state.onboarding.draftData, ...action.payload };
      state.onboarding.isDraft = true;
      state.onboarding.lastSaved = new Date().toISOString();
    },
    
    clearDraft: (state) => {
      state.onboarding.draftData = {};
      state.onboarding.isDraft = false;
      state.onboarding.lastSaved = null;
    },
    
    // Facility selection
    selectFacility: (state, action: PayloadAction<string>) => {
      state.selectedFacilityId = action.payload;
      state.currentFacility = state.facilities.find(f => f.id === action.payload) || null;
    },
    
    // Department management
    addDepartment: (state, action: PayloadAction<Department>) => {
      if (state.currentFacility) {
        state.currentFacility.departments.push(action.payload);
      }
    },
    
    updateDepartment: (state, action: PayloadAction<Department>) => {
      if (state.currentFacility) {
        const index = state.currentFacility.departments.findIndex(d => d.id === action.payload.id);
        if (index !== -1) {
          state.currentFacility.departments[index] = action.payload;
        }
      }
    },
    
    // Staff management
    addStaff: (state, action: PayloadAction<Staff>) => {
      if (state.currentFacility) {
        state.currentFacility.staff.push(action.payload);
      }
    },
    
    updateStaff: (state, action: PayloadAction<Staff>) => {
      if (state.currentFacility) {
        const index = state.currentFacility.staff.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.currentFacility.staff[index] = action.payload;
        }
      }
    },
    
    // Workflow management
    addWorkflow: (state, action: PayloadAction<Workflow>) => {
      if (state.currentFacility) {
        state.currentFacility.workflows.push(action.payload);
      }
    },
    
    updateWorkflow: (state, action: PayloadAction<Workflow>) => {
      if (state.currentFacility) {
        const index = state.currentFacility.workflows.findIndex(w => w.id === action.payload.id);
        if (index !== -1) {
          state.currentFacility.workflows[index] = action.payload;
        }
      }
    },
    
    // Reset state
    resetFacilityState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Create facility
      .addCase(createFacility.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFacility.fulfilled, (state, action) => {
        state.loading = false;
        state.facilities.push(action.payload);
        state.currentFacility = action.payload;
        state.selectedFacilityId = action.payload.id;
      })
      .addCase(createFacility.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create facility';
      })
      
      // Verify license
      .addCase(verifyLicense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyLicense.fulfilled, (state, action) => {
        state.loading = false;
        // Store verification result in draft data
        state.onboarding.draftData.licenseVerification = action.payload;
      })
      .addCase(verifyLicense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'License verification failed';
      });
  }
});

/* =========================
   Exports
========================= */

export const {
  setActiveAction,
  setOnboardingStep,
  saveDraft,
  clearDraft,
  selectFacility,
  addDepartment,
  updateDepartment,
  addStaff,
  updateStaff,
  addWorkflow,
  updateWorkflow,
  resetFacilityState,
} = facilitySlice.actions;

export default facilitySlice.reducer;