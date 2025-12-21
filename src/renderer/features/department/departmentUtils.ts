// utils/departmentUtils.ts

import { Department, DepartmentFormData, DepartmentType } from '../../store/slices/departmentSlice';

export const generateDepartmentCode = (name: string): string => {
  // Extract first letters of words, max 5 characters
  const code = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 5);
  
  return code || 'DEPT';
};

export const validateDepartmentForm = (data: Partial<DepartmentFormData>): Record<string, string> => {
  const errors: Record<string, string> = {};

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
    errors.capacity_totalBeds = 'Total beds cannot be negative';
  }

  if (data.capacity?.availableBeds && data.capacity.availableBeds > (data.capacity?.totalBeds || 0)) {
    errors.capacity_availableBeds = 'Available beds cannot exceed total beds';
  }

  if (data.staffing?.totalStaff && data.staffing.totalStaff < 0) {
    errors.staffing_totalStaff = 'Total staff cannot be negative';
  }

  return errors;
};

export const getDepartmentTypeIcon = (type: DepartmentType): string => {
  const icons: Record<DepartmentType, string> = {
    Inpatient: '🏥',
    Outpatient: '👥',
    Emergency: '🚨',
    Diagnostic: '🔬',
    Surgical: '🔪',
    Administrative: '📋',
    Support: '🛠️',
  };
  return icons[type] || '🏥';
};

export const getDepartmentStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    Active: 'bg-emerald-100 text-emerald-800',
    Inactive: 'bg-gray-100 text-gray-800',
    Maintenance: 'bg-amber-100 text-amber-800',
    Closed: 'bg-red-100 text-red-800',
    Pending: 'bg-blue-100 text-blue-800',
    Suspended: 'bg-purple-100 text-purple-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const calculateDepartmentUtilization = (department: Department): number => {
  const { totalBeds, occupiedBeds, totalStaff } = department.capacity;
  
  // Simple utilization calculation based on beds and staff
  const bedUtilization = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
  const staffUtilization = totalStaff > 0 ? Math.min((department.staffing.totalStaff / totalStaff) * 100, 100) : 0;
  
  // Weighted average (70% bed utilization, 30% staff utilization)
  return (bedUtilization * 0.7) + (staffUtilization * 0.3);
};

export const getDefaultDepartmentFormData = (): Partial<DepartmentFormData> => ({
  name: '',
  departmentCode: '',
  type: 'Inpatient',
  specialties: [],
  description: '',
  capacity: {
    totalBeds: 0,
    availableBeds: 0,
    occupiedBeds: 0,
    bedTypes: [],
    operatingRooms: 0,
    availableOperatingRooms: 0,
    consultationRooms: 0,
    waitingCapacity: 0,
    maxCapacity: 0,
    currentUtilization: 0,
  },
  equipment: [],
  staffing: {
    headOfDepartment: '',
    totalStaff: 0,
    doctors: 0,
    nurses: 0,
    technicians: 0,
    supportStaff: 0,
    administrative: 0,
    vacancies: { doctors: 0, nurses: 0, technicians: 0 },
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
    billingCodes: [],
    insuranceAccepted: [],
  },
  compliance: {
    accredited: false,
    accreditationBody: '',
    expiryDate: '',
    hipaaCompliant: true,
    infectionControlCertified: true,
    safetyStandards: [],
    licenses: [],
    certifications: [],
  },
  status: 'Inactive',
  activationDate: new Date().toISOString().split('T')[0],
  autoActivate: false,
  agreeToTerms: false,
});

export const formatDepartmentForDisplay = (department: Department) => {
  return {
    ...department,
    formattedCapacity: `${department.capacity.occupiedBeds}/${department.capacity.totalBeds} beds occupied`,
    utilizationRate: calculateDepartmentUtilization(department).toFixed(1) + '%',
    staffShortage: Object.values(department.staffing.vacancies).reduce((a, b) => a + b, 0),
    accreditationStatus: department.compliance.accredited 
      ? `Accredited by ${department.compliance.accreditationBody} (expires ${new Date(department.compliance.expiryDate).toLocaleDateString()})`
      : 'Not accredited',
  };
};