
import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Badge,
  Briefcase,
  Calendar,
  Shield,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Loader,
  Building2,
} from 'lucide-react';
import { useCreateStaffByAdmin } from '../../api/team-management/queries/useStaffQueries';
import { useGetDepartmentsByFacility } from '../../api/department-managment/useDepartmentQueries';
import { useGetFacilityRoles } from '../../api/team-management/queries/useFacilityRoleQueries';
import { useGetModules } from '../../api/team-management/queries/useModuleQueries';
import type { GlobalRoleLevel, EmploymentType } from '../../api/team-management/types/staffTypes';
import { DepartmentStatus } from '../../api/department-managment/departmentTypes';
import { usePlanEntitlements } from '../../../../../shared/entitlements/usePlanEntitlements';
import { AlertTriangle } from 'lucide-react';

interface StaffCreationFormProps {
  theme: 'light' | 'dark';
  facilityId: number;
  onSuccess: (staffId: number) => void;
  onCancel: () => void;
}

interface FormData {
  // User information
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  
  // Staff professional info
  employee_id: string;
  professional_title: string;
  global_role_level: GlobalRoleLevel | '';
  employment_type: EmploymentType | '';
  
  // Assignment
  facility_role_code: string;
  department_id: number | null;
  module_codes: string[];
  
  // Additional
  hire_date: string;
  accepts_new_patients: boolean;
}

export const StaffCreationForm: React.FC<StaffCreationFormProps> = ({
  theme,
  facilityId,
  onSuccess,
  onCancel,
}) => {
  const isDark = theme === 'dark';
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    email: '',
    phone: '',
    first_name: '',
    last_name: '',
    employee_id: '',
    professional_title: '',
    global_role_level: '',
    employment_type: '',
    facility_role_code: '',
    department_id: null,
    module_codes: [],
    hire_date: new Date().toISOString().split('T')[0],
    accepts_new_patients: false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  
  // Fetch data for dropdowns
  const { data: departmentsResponse } = useGetDepartmentsByFacility(
    facilityId,
    { status: DepartmentStatus.ACTIVE },
    { enabled: !!facilityId }
  );
  
  const { data: rolesResponse } = useGetFacilityRoles(
    { is_system_role: true },
    { enabled: true }
  );
  
  const { data: modulesResponse } = useGetModules(
    { is_active: true },
    { enabled: true }
  );
  
  const departments = departmentsResponse?.data || [];
  const roles = rolesResponse?.data || [];
  const modules = modulesResponse?.data || [];
  
  const {
    staffLimitReached,
    usage: facilityUsage,
    limits: facilityLimits,
    filterModulesForPlan,
  } = usePlanEntitlements();
  
  const planFilteredModules = modules.length > 0 ? filterModulesForPlan(modules) : modules;
  
  // Create mutation
  const createMutation = useCreateStaffByAdmin({
    onSuccess: (response) => {
      onSuccess(response.data.id);
    },
    onError: (error) => {
      if (error.response?.data?.errors) {
        const apiErrors: Record<string, string> = {};
        Object.entries(error.response.data.errors).forEach(([field, messages]) => {
          apiErrors[field] = Array.isArray(messages) ? messages[0] : String(messages);
        });
        setErrors(apiErrors);
      }
    },
  });
  
  // Form validation
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
      if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
      if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
        newErrors.phone = 'Invalid phone format';
      }
    }
    
    if (step === 2) {
      if (!formData.employee_id.trim()) newErrors.employee_id = 'Employee ID is required';
      if (!formData.global_role_level) newErrors.global_role_level = 'Role level is required';
      if (!formData.employment_type) newErrors.employment_type = 'Employment type is required';
    }
    
    if (step === 3) {
      if (!formData.facility_role_code) newErrors.facility_role_code = 'Facility role is required';
      if (formData.module_codes.length === 0) newErrors.module_codes = 'Select at least one module';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle input change
  const handleChange = (field: keyof FormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  // Handle module toggle
  const handleModuleToggle = (moduleCode: string) => {
    setFormData(prev => ({
      ...prev,
      module_codes: prev.module_codes.includes(moduleCode)
        ? prev.module_codes.filter(c => c !== moduleCode)
        : [...prev.module_codes, moduleCode],
    }));
    if (errors.module_codes) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.module_codes;
        return newErrors;
      });
    }
  };
  
  // Handle next step
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  // Handle previous step
  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    //In here,the user creation and staff record is handled at the backend.
    createMutation.mutate({
      // User ID would come from user creation
      first_name:formData.first_name,
      last_name:formData.last_name,
      email:formData.email,
      facility_role_code:formData.facility_role_code,
      module_codes:formData.module_codes,
      employee_id: formData.employee_id,
      professional_title: formData.professional_title,
      global_role_level: formData.global_role_level as GlobalRoleLevel,
      employment_type: formData.employment_type as EmploymentType,
      phone:formData.phone,
      hire_date: formData.hire_date,
      // Additional fields can be added here
    });
  };
  
  const steps = [
    { number: 1, title: 'Personal Info', description: 'Basic contact information' },
    { number: 2, title: 'Professional Details', description: 'Employment information' },
    { number: 3, title: 'Access & Permissions', description: 'Role and module access' },
  ];
  
  return (
    <div className={`rounded-xl border ${
      isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className={`p-6 border-b ${
        isDark ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <User className="w-6 h-6" />
              Create New Staff Member
            </h2>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
            </p>
          </div>
          
          <button
            onClick={onCancel}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Progress Steps */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    step.number < currentStep
                      ? (isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700')
                      : step.number === currentStep
                      ? (isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700')
                      : (isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400')
                  }`}>
                    {step.number < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="text-center">
                    <div className={`text-xs font-medium ${
                      step.number <= currentStep
                        ? (isDark ? 'text-gray-300' : 'text-gray-700')
                        : (isDark ? 'text-gray-500' : 'text-gray-400')
                    }`}>
                      {step.title}
                    </div>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    step.number < currentStep
                      ? (isDark ? 'bg-green-900/30' : 'bg-green-200')
                      : (isDark ? 'bg-gray-800' : 'bg-gray-200')
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      
      {/* Form Content */}
      <div className="p-6">
        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    errors.first_name
                      ? 'border-red-500'
                      : (isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900')
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="John"
                />
                {errors.first_name && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.first_name}
                  </p>
                )}
              </div>
              
              {/* Last Name */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    errors.last_name
                      ? 'border-red-500'
                      : (isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900')
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Doe"
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.last_name}
                  </p>
                )}
              </div>
              
              {/* Email */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                      errors.email
                        ? 'border-red-500'
                        : (isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900')
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="john.doe@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
              </div>
              
              {/* Phone */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                      errors.phone
                        ? 'border-red-500'
                        : (isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900')
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Step 2: Professional Details */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Employee ID */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Employee ID *
                </label>
                <div className="relative">
                  <Badge className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <input
                    type="text"
                    value={formData.employee_id}
                    onChange={(e) => handleChange('employee_id', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                      errors.employee_id
                        ? 'border-red-500'
                        : (isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900')
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="EMP001"
                  />
                </div>
                {errors.employee_id && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.employee_id}
                  </p>
                )}
              </div>
              
              {/* Professional Title */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Professional Title
                </label>
                <input
                  type="text"
                  value={formData.professional_title}
                  onChange={(e) => handleChange('professional_title', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  placeholder="Dr., RN, etc."
                />
              </div>
              
              {/* Global Role Level */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Role Level *
                </label>
                <div className="relative">
                  <Briefcase className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <select
                    value={formData.global_role_level}
                    onChange={(e) => handleChange('global_role_level', e.target.value as GlobalRoleLevel)}
                    className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                      errors.global_role_level
                        ? 'border-red-500'
                        : (isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900')
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    <option value="">Select role level...</option>
                    <option value="attending_physician">Attending Physician</option>
                    <option value="fellow">Fellow</option>
                    <option value="resident">Resident</option>
                    <option value="nurse_practitioner">Nurse Practitioner</option>
                    <option value="physician_assistant">Physician Assistant</option>
                    <option value="registered_nurse">Registered Nurse</option>
                    <option value="licensed_practical_nurse">Licensed Practical Nurse</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="therapist">Therapist</option>
                    <option value="technician">Technician</option>
                    <option value="support_staff">Support Staff</option>
                  </select>
                </div>
                {errors.global_role_level && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.global_role_level}
                  </p>
                )}
              </div>
              
              {/* Employment Type */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Select Employment Type *
                </label>
                <select
                  value={formData.employment_type}
                  onChange={(e) => handleChange('employment_type', e.target.value as EmploymentType)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    errors.employment_type
                      ? 'border-red-500'
                      : (isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900')
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="">Select type...</option>
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="locum_tenens">Locum Tenens</option>
                  <option value="volunteer">Volunteer</option>
                </select>
                {errors.employment_type && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.employment_type}
                  </p>
                )}
              </div>
              
              {/* Hire Date */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Hire Date
                </label>
                <div className="relative">
                  <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <input
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => handleChange('hire_date', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
              </div>
              
              {/* Department */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Department
                </label>
                <div className="relative">
                  <Building2 className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    isDark ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <select
                    value={formData.department_id || ''}
                    onChange={(e) => handleChange('department_id', e.target.value ? parseInt(e.target.value) : null)}
                    className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  >
                    <option value="">Select department...</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.department_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Accepts New Patients */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="accepts_patients"
                checked={formData.accepts_new_patients}
                onChange={(e) => handleChange('accepts_new_patients', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="accepts_patients"
                className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Accepting new patients
              </label>
            </div>
          </div>
        )}
        
        {/* Step 3: Access & Permissions */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Facility Role */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Facility Role *
              </label>
              <div className="relative">
                <Shield className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <select
                  value={formData.facility_role_code}
                  onChange={(e) => handleChange('facility_role_code', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                    errors.facility_role_code
                      ? 'border-red-500'
                      : (isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900')
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="">Select facility role...</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.code}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.facility_role_code && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.facility_role_code}
                </p>
              )}
            </div>
            
            {/* Module Access */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Module Access *
              </label>
              <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Select the modules this staff member can access
              </p>
              
              {staffLimitReached && (
                <div className={`mb-3 p-3 rounded-lg border flex items-start gap-2 text-sm ${
                  isDark
                    ? 'bg-amber-900/20 border-amber-700/40 text-amber-200'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    Staff limit reached
                    {facilityLimits?.max_staff != null ? ` (${facilityUsage?.staff ?? 0}/${facilityLimits.max_staff})` : ''}.
                    Upgrade your plan or cancel pending invitations before creating new staff.
                  </span>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {planFilteredModules.map(module => (
                  <label
                    key={module.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      formData.module_codes.includes(module.code)
                        ? (isDark ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-300')
                        : (isDark ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-gray-50 border-gray-300 hover:border-gray-400')
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.module_codes.includes(module.code)}
                      onChange={() => handleModuleToggle(module.code)}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{module.name}</div>
                      {module.description && (
                        <div className={`text-sm mt-0.5 ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {module.description}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              
              {errors.module_codes && (
                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.module_codes}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Footer Actions */}
      <div className={`p-6 border-t ${
        isDark ? 'border-gray-800' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={onCancel}
            type="button"
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                type="button"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDark 
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Previous
              </button>
            )}
            
            {currentStep < steps.length ? (
              <button
                onClick={handleNext}
                type="button"
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || staffLimitReached}
                type="button"
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Staff Member
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffCreationForm;