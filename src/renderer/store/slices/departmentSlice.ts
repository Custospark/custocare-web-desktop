// store/slices/departmentSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

// ==================== TYPES ====================

export interface Department {
  id: string;
  facilityId: string;
  name: string;
  departmentCode: string;
  type: DepartmentType;
  specialties: string[];
  description: string;
  
  capacity: DepartmentCapacity;
  equipment: EquipmentItem[];
  
  staffing: DepartmentStaffing;
  services: DepartmentService[];
  operatingHours: OperatingHours;
  
  financial: DepartmentFinancial;
  compliance: DepartmentCompliance;
  
  status: DepartmentStatus;
  activationDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastModifiedBy: string;
  
  // Metadata
  version: number;
  isActive: boolean;
  notes?: string;
  tags?: string[];
}

export type DepartmentType = 'Inpatient' | 'Outpatient' | 'Emergency' | 'Diagnostic' | 'Surgical' | 'Administrative' | 'Support';
export type DepartmentStatus = 'Active' | 'Inactive' | 'Maintenance' | 'Closed' | 'Pending' | 'Suspended';

export interface DepartmentCapacity {
  totalBeds: number;
  availableBeds: number;
  occupiedBeds: number;
  bedTypes: BedType[];
  operatingRooms: number;
  availableOperatingRooms: number;
  consultationRooms: number;
  waitingCapacity: number;
  maxCapacity: number;
  currentUtilization: number;
}

export interface BedType {
  type: string;
  label: string;
  count: number;
  available: number;
  isSpecialized: boolean;
  specializedFor?: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  model?: string;
  serialNumber?: string;
  quantity: number;
  available: number;
  status: EquipmentStatus;
  lastMaintenance: string;
  nextMaintenance: string;
  manufacturer?: string;
  purchaseDate: string;
  warrantyExpiry?: string;
  departmentId: string;
}

export type EquipmentStatus = 'Operational' | 'Maintenance' | 'Out of Service' | 'Retired';

export interface DepartmentStaffing {
  headOfDepartment: string;
  headId?: string;
  totalStaff: number;
  doctors: number;
  nurses: number;
  technicians: number;
  supportStaff: number;
  administrative: number;
  residents?: number;
  interns?: number;
  vacancies: {
    doctors: number;
    nurses: number;
    technicians: number;
  };
  shiftSchedule?: ShiftSchedule;
}

export interface ShiftSchedule {
  morning: number;
  afternoon: number;
  night: number;
  rotating: number;
}

export interface DepartmentService {
  id: string;
  name: string;
  code?: string;
  available: boolean;
  description: string;
  category: ServiceCategory;
  subCategory?: string;
  duration?: number; // in minutes
  requiresSpecialEquipment: boolean;
  equipmentRequired?: string[];
  requiresSpecialTraining: boolean;
  price?: number;
  insuranceCovered: boolean;
  externalReferral: boolean;
}

export type ServiceCategory = 'Consultation' | 'Diagnostic' | 'Therapeutic' | 'Surgical' | 'Emergency' | 'Preventive' | 'Rehabilitation';

export interface OperatingHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  emergencyCoverage: string;
  holidays?: string;
  specialHours?: Record<string, string>;
}

export interface DepartmentFinancial {
  billingCodes: string[];
  insuranceAccepted: string[];
  pricingModel?: PricingModel;
  costCenter?: string;
  revenueTarget?: number;
  monthlyRevenue?: number[];
  expenses?: DepartmentExpense[];
  budget?: DepartmentBudget;
}

export interface PricingModel {
  type: 'Fixed' | 'Variable' | 'Tiered' | 'InsuranceBased';
  rates?: Record<string, number>;
  discounts?: Record<string, number>;
}

export interface DepartmentExpense {
  id: string;
  category: string;
  amount: number;
  month: string;
  description?: string;
  approved: boolean;
}

export interface DepartmentBudget {
  year: number;
  allocated: number;
  spent: number;
  categories: BudgetCategory[];
}

export interface BudgetCategory {
  category: string;
  allocated: number;
  spent: number;
}

export interface DepartmentCompliance {
  accredited: boolean;
  accreditationBody?: string;
  accreditationId?: string;
  expiryDate: string;
  hipaaCompliant: boolean;
  infectionControlCertified: boolean;
  safetyStandards: string[];
  lastInspection?: string;
  inspectionResults?: InspectionResult[];
  licenses: DepartmentLicense[];
  certifications: Certification[];
}

export interface InspectionResult {
  date: string;
  inspector: string;
  score: number;
  passed: boolean;
  findings?: string[];
  recommendations?: string[];
}

export interface DepartmentLicense {
  type: string;
  number: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string;
  status: 'Active' | 'Expired' | 'Pending' | 'Suspended';
}

export interface Certification {
  name: string;
  certifyingBody: string;
  issueDate: string;
  expiryDate: string;
  certifiedBy?: string;
}

// ==================== SLICE STATE ====================

export interface DepartmentOnboardingState {
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
  draft: Partial<DepartmentFormData> | null;
  validationErrors: Record<string, string>;
}

export interface DepartmentFormData extends Omit<Department, 
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'lastModifiedBy' | 'version' | 'isActive'
> {
  autoActivate: boolean;
  agreeToTerms: boolean;
  verificationNotes?: string;
}

export interface DepartmentState {
  departments: Department[];
  selectedDepartment: Department | null;
  loading: boolean;
  error: string | null;
  onboarding: DepartmentOnboardingState;
  filters: DepartmentFilters;
  pagination: DepartmentPagination;
}

export interface DepartmentFilters {
  status?: DepartmentStatus[];
  type?: DepartmentType[];
  specialty?: string[];
  facilityId?: string;
  searchQuery?: string;
  minCapacity?: number;
  maxCapacity?: number;
}

export interface DepartmentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ==================== INITIAL STATE ====================

const initialOnboardingState: DepartmentOnboardingState = {
  currentStep: 0,
  totalSteps: 5,
  isSubmitting: false,
  error: null,
  success: false,
  draft: null,
  validationErrors: {},
};

const initialState: DepartmentState = {
  departments: [],
  selectedDepartment: null,
  loading: false,
  error: null,
  onboarding: initialOnboardingState,
  filters: {
    status: ['Active'],
    type: [],
    specialty: [],
    searchQuery: '',
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

// ==================== ASYNC THUNKS ====================

export const createDepartment = createAsyncThunk(
  'department/createDepartment',
  async (departmentData: DepartmentFormData, { rejectWithValue }) => {
    try {
      // Generate department ID
      const departmentId = `DEPT-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      // Create final department object
      const department: Department = {
        ...departmentData,
        id: departmentId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current-user-id', // This would come from auth
        lastModifiedBy: 'current-user-id',
        version: 1,
        isActive: departmentData.autoActivate || departmentData.status === 'Active',
        capacity: {
          ...departmentData.capacity,
          occupiedBeds: 0,
          availableOperatingRooms: departmentData.capacity.operatingRooms,
          currentUtilization: 0,
        },
        equipment: departmentData.equipment.map(item => ({
          ...item,
          id: `EQ-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          departmentId: departmentId,
          available: item.quantity,
          lastMaintenance: new Date().toISOString(),
          nextMaintenance: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year later
          purchaseDate: new Date().toISOString(),
        })),
        services: departmentData.services.map(service => ({
          ...service,
          id: `SVC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        })),
        compliance: {
          ...departmentData.compliance,
          licenses: [],
          certifications: [],
        },
        financial: {
          ...departmentData.financial,
          monthlyRevenue: [],
          expenses: [],
          budget: undefined,
        },
      };
      
      // Simulate API call
      // const response = await api.post('/departments', department);
      // return response.data;
      
      // For now, return the created department
      return department;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create department');
    }
  }
);

export const updateDepartment = createAsyncThunk(
  'department/updateDepartment',
  async ({ id, updates }: { id: string; updates: Partial<Department> }, { rejectWithValue }) => {
    try {
      // Simulate API call
      // const response = await api.patch(`/departments/${id}`, updates);
      // return response.data;
      
      const updatedDepartment = { ...updates, id, updatedAt: new Date().toISOString() };
      return updatedDepartment;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update department');
    }
  }
);

export const fetchDepartments = createAsyncThunk(
  'department/fetchDepartments',
  async (filters?: DepartmentFilters, { rejectWithValue }) => {
    try {
      // Simulate API call with filters
      // const response = await api.get('/departments', { params: filters });
      // return response.data;
      
      // Mock data for demonstration
      const mockDepartments: Department[] = [
        {
          id: 'DEPT-2024-ABC123',
          facilityId: 'FAC-2024-001',
          name: 'Cardiology Department',
          departmentCode: 'CARD',
          type: 'Inpatient',
          specialties: ['cardiology'],
          description: 'Specialized cardiac care unit',
          capacity: {
            totalBeds: 50,
            availableBeds: 25,
            occupiedBeds: 25,
            bedTypes: [
              { type: 'ccu', label: 'CCU', count: 10, available: 5, isSpecialized: true, specializedFor: 'Cardiac' },
              { type: 'general', label: 'General Ward', count: 40, available: 20, isSpecialized: false },
            ],
            operatingRooms: 3,
            availableOperatingRooms: 2,
            consultationRooms: 8,
            waitingCapacity: 30,
            maxCapacity: 60,
            currentUtilization: 75,
          },
          equipment: [],
          staffing: {
            headOfDepartment: 'Dr. John Smith',
            totalStaff: 45,
            doctors: 10,
            nurses: 25,
            technicians: 5,
            supportStaff: 5,
            administrative: 2,
            vacancies: { doctors: 2, nurses: 5, technicians: 1 },
          },
          services: [],
          operatingHours: {
            monday: '08:00-18:00',
            tuesday: '08:00-18:00',
            wednesday: '08:00-18:00',
            thursday: '08:00-18:00',
            friday: '08:00-18:00',
            saturday: '08:00-14:00',
            sunday: 'Emergency Only',
            emergencyCoverage: '24/7',
          },
          financial: {
            billingCodes: ['99213', '99214', '93306'],
            insuranceAccepted: ['AETNA', 'BLUE CROSS', 'MEDICARE'],
          },
          compliance: {
            accredited: true,
            accreditationBody: 'JCI',
            expiryDate: '2025-12-31',
            hipaaCompliant: true,
            infectionControlCertified: true,
            safetyStandards: ['OSHA', 'NFPA'],
            licenses: [],
            certifications: [],
          },
          status: 'Active',
          activationDate: '2024-01-01',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'admin',
          lastModifiedBy: 'admin',
          version: 1,
          isActive: true,
        },
      ];
      
      return {
        departments: mockDepartments,
        total: mockDepartments.length,
        page: 1,
        limit: 10,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch departments');
    }
  }
);

export const validateDepartmentData = createAsyncThunk(
  'department/validateDepartmentData',
  async (data: Partial<DepartmentFormData>, { rejectWithValue }) => {
    try {
      const errors: Record<string, string> = {};
      
      // Basic validation rules
      if (!data.name?.trim()) {
        errors.name = 'Department name is required';
      }
      
      if (!data.departmentCode?.trim()) {
        errors.departmentCode = 'Department code is required';
      } else if (data.departmentCode.length < 2 || data.departmentCode.length > 5) {
        errors.departmentCode = 'Department code must be 2-5 characters';
      }
      
      if (!data.type) {
        errors.type = 'Department type is required';
      }
      
      if (!data.specialties?.length) {
        errors.specialties = 'At least one specialty is required';
      }
      
      if (data.capacity?.totalBeds && data.capacity.totalBeds < 0) {
        errors.capacity = 'Total beds cannot be negative';
      }
      
      if (data.capacity?.availableBeds && data.capacity.availableBeds > data.capacity?.totalBeds) {
        errors.capacity = 'Available beds cannot exceed total beds';
      }
      
      // Return validation results
      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Validation failed');
    }
  }
);

// ==================== SLICE ====================

const departmentSlice = createSlice({
  name: 'department',
  initialState,
  reducers: {
    // Onboarding actions
    setDepartmentOnboardingStep: (state, action: PayloadAction<number>) => {
      state.onboarding.currentStep = action.payload;
    },
    
    saveDepartmentDraft: (state, action: PayloadAction<Partial<DepartmentFormData>>) => {
      if (!state.onboarding.draft) {
        state.onboarding.draft = {};
      }
      state.onboarding.draft = {
        ...state.onboarding.draft,
        ...action.payload,
      };
      // Also save to localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('departmentDraft', JSON.stringify(state.onboarding.draft));
      }
    },
    
    clearDepartmentDraft: (state) => {
      state.onboarding.draft = null;
      state.onboarding.currentStep = 0;
      state.onboarding.success = false;
      state.onboarding.error = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('departmentDraft');
      }
    },
    
    loadDepartmentDraft: (state) => {
      if (typeof window !== 'undefined') {
        const draft = localStorage.getItem('departmentDraft');
        if (draft) {
          try {
            state.onboarding.draft = JSON.parse(draft);
          } catch (error) {
            console.error('Failed to parse department draft from localStorage');
          }
        }
      }
    },
    
    setDepartmentValidationErrors: (state, action: PayloadAction<Record<string, string>>) => {
      state.onboarding.validationErrors = action.payload;
    },
    
    resetDepartmentOnboarding: (state) => {
      state.onboarding = initialOnboardingState;
    },
    
    // Department selection
    selectDepartment: (state, action: PayloadAction<string>) => {
      const department = state.departments.find(dept => dept.id === action.payload);
      state.selectedDepartment = department || null;
    },
    
    clearSelectedDepartment: (state) => {
      state.selectedDepartment = null;
    },
    
    // Filter actions
    setDepartmentFilters: (state, action: PayloadAction<Partial<DepartmentFilters>>) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },
    
    clearDepartmentFilters: (state) => {
      state.filters = {
        status: ['Active'],
        type: [],
        specialty: [],
        searchQuery: '',
      };
    },
    
    // Pagination
    setDepartmentPagination: (state, action: PayloadAction<Partial<DepartmentPagination>>) => {
      state.pagination = {
        ...state.pagination,
        ...action.payload,
      };
    },
    
    // Department management
    addDepartment: (state, action: PayloadAction<Department>) => {
      state.departments.unshift(action.payload);
      state.pagination.total += 1;
      state.pagination.totalPages = Math.ceil(state.pagination.total / state.pagination.limit);
    },
    
    updateDepartmentLocal: (state, action: PayloadAction<Department>) => {
      const index = state.departments.findIndex(dept => dept.id === action.payload.id);
      if (index !== -1) {
        state.departments[index] = {
          ...state.departments[index],
          ...action.payload,
          updatedAt: new Date().toISOString(),
          version: state.departments[index].version + 1,
        };
      }
      if (state.selectedDepartment?.id === action.payload.id) {
        state.selectedDepartment = state.departments[index];
      }
    },
    
    deleteDepartment: (state, action: PayloadAction<string>) => {
      state.departments = state.departments.filter(dept => dept.id !== action.payload);
      state.pagination.total -= 1;
      state.pagination.totalPages = Math.ceil(state.pagination.total / state.pagination.limit);
      if (state.selectedDepartment?.id === action.payload) {
        state.selectedDepartment = null;
      }
    },
    
    updateDepartmentStatus: (state, action: PayloadAction<{ id: string; status: DepartmentStatus }>) => {
      const department = state.departments.find(dept => dept.id === action.payload.id);
      if (department) {
        department.status = action.payload.status;
        department.isActive = action.payload.status === 'Active';
        department.updatedAt = new Date().toISOString();
      }
      if (state.selectedDepartment?.id === action.payload.id) {
        state.selectedDepartment = department || null;
      }
    },
    
    // Capacity updates
    updateDepartmentCapacity: (state, action: PayloadAction<{ id: string; capacity: Partial<DepartmentCapacity> }>) => {
      const department = state.departments.find(dept => dept.id === action.payload.id);
      if (department) {
        department.capacity = {
          ...department.capacity,
          ...action.payload.capacity,
        };
        department.updatedAt = new Date().toISOString();
      }
      if (state.selectedDepartment?.id === action.payload.id) {
        state.selectedDepartment = department || null;
      }
    },
    
    // Equipment management
    addEquipment: (state, action: PayloadAction<{ departmentId: string; equipment: EquipmentItem }>) => {
      const department = state.departments.find(dept => dept.id === action.payload.departmentId);
      if (department) {
        department.equipment.push(action.payload.equipment);
        department.updatedAt = new Date().toISOString();
      }
    },
    
    updateEquipmentStatus: (state, action: PayloadAction<{ 
      departmentId: string; 
      equipmentId: string; 
      status: EquipmentStatus 
    }>) => {
      const department = state.departments.find(dept => dept.id === action.payload.departmentId);
      if (department) {
        const equipment = department.equipment.find(item => item.id === action.payload.equipmentId);
        if (equipment) {
          equipment.status = action.payload.status;
          equipment.lastMaintenance = new Date().toISOString();
          department.updatedAt = new Date().toISOString();
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Department
      .addCase(createDepartment.pending, (state) => {
        state.onboarding.isSubmitting = true;
        state.onboarding.error = null;
        state.onboarding.success = false;
      })
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.onboarding.isSubmitting = false;
        state.onboarding.success = true;
        state.onboarding.error = null;
        state.departments.unshift(action.payload);
        state.pagination.total += 1;
        state.pagination.totalPages = Math.ceil(state.pagination.total / state.pagination.limit);
        // Clear draft after successful creation
        state.onboarding.draft = null;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('departmentDraft');
        }
      })
      .addCase(createDepartment.rejected, (state, action) => {
        state.onboarding.isSubmitting = false;
        state.onboarding.error = action.payload as string || 'Failed to create department';
        state.onboarding.success = false;
      })
      
      // Update Department
      .addCase(updateDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.departments.findIndex(dept => dept.id === action.payload.id);
        if (index !== -1) {
          state.departments[index] = {
            ...state.departments[index],
            ...action.payload,
            updatedAt: new Date().toISOString(),
            version: state.departments[index].version + 1,
          };
        }
        if (state.selectedDepartment?.id === action.payload.id) {
          state.selectedDepartment = state.departments[index];
        }
      })
      .addCase(updateDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to update department';
      })
      
      // Fetch Departments
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = action.payload.departments;
        state.pagination.total = action.payload.total;
        state.pagination.page = action.payload.page;
        state.pagination.limit = action.payload.limit;
        state.pagination.totalPages = Math.ceil(action.payload.total / action.payload.limit);
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch departments';
      })
      
      // Validate Department Data
      .addCase(validateDepartmentData.fulfilled, (state, action) => {
        state.onboarding.validationErrors = action.payload.errors;
        if (!action.payload.isValid) {
          state.onboarding.error = 'Please fix validation errors';
        }
      })
      .addCase(validateDepartmentData.rejected, (state, action) => {
        state.onboarding.error = action.payload as string || 'Validation failed';
      });
  },
});

// ==================== SELECTORS ====================

export const selectDepartments = (state: RootState) => state.department.departments;
export const selectSelectedDepartment = (state: RootState) => state.department.selectedDepartment;
export const selectDepartmentLoading = (state: RootState) => state.department.loading;
export const selectDepartmentError = (state: RootState) => state.department.error;

export const selectDepartmentOnboarding = (state: RootState) => state.department.onboarding;
export const selectOnboardingStep = (state: RootState) => state.department.onboarding.currentStep;
export const selectDepartmentDraft = (state: RootState) => state.department.onboarding.draft;
export const selectValidationErrors = (state: RootState) => state.department.onboarding.validationErrors;

export const selectDepartmentFilters = (state: RootState) => state.department.filters;
export const selectDepartmentPagination = (state: RootState) => state.department.pagination;

export const selectActiveDepartments = (state: RootState) =>
  state.department.departments.filter(dept => dept.status === 'Active');

export const selectDepartmentsByType = (type: DepartmentType) => (state: RootState) =>
  state.department.departments.filter(dept => dept.type === type);

export const selectDepartmentById = (id: string) => (state: RootState) =>
  state.department.departments.find(dept => dept.id === id);

export const selectDepartmentStatistics = (state: RootState) => {
  const departments = state.department.departments;
  const activeDepartments = departments.filter(dept => dept.status === 'Active');
  
  return {
    total: departments.length,
    active: activeDepartments.length,
    inactive: departments.filter(dept => dept.status === 'Inactive').length,
    maintenance: departments.filter(dept => dept.status === 'Maintenance').length,
    totalBeds: activeDepartments.reduce((sum, dept) => sum + dept.capacity.totalBeds, 0),
    availableBeds: activeDepartments.reduce((sum, dept) => sum + dept.capacity.availableBeds, 0),
    totalStaff: activeDepartments.reduce((sum, dept) => sum + dept.staffing.totalStaff, 0),
    totalEquipment: activeDepartments.reduce((sum, dept) => sum + dept.equipment.length, 0),
    byType: departments.reduce((acc, dept) => {
      acc[dept.type] = (acc[dept.type] || 0) + 1;
      return acc;
    }, {} as Record<DepartmentType, number>),
  };
};

// ==================== EXPORTS ====================

export const {
  setDepartmentOnboardingStep,
  saveDepartmentDraft,
  clearDepartmentDraft,
  loadDepartmentDraft,
  setDepartmentValidationErrors,
  resetDepartmentOnboarding,
  selectDepartment,
  clearSelectedDepartment,
  setDepartmentFilters,
  clearDepartmentFilters,
  setDepartmentPagination,
  addDepartment,
  updateDepartmentLocal,
  deleteDepartment,
  updateDepartmentStatus,
  updateDepartmentCapacity,
  addEquipment,
  updateEquipmentStatus,
} = departmentSlice.actions;

export default departmentSlice.reducer;