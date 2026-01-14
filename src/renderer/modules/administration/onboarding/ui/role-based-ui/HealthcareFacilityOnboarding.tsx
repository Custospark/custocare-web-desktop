/**
 * ============================================================================
 * HEALTHCARE FACILITY ONBOARDING - COMPACT & RESPONSIVE
 * ============================================================================
 * 
 * DESIGN PHILOSOPHY: Streamlined 3-step registration with minimal scrolling
 * 
 * OPTIMIZATIONS:
 * - Compact spacing while maintaining readability
 * - Efficient use of horizontal space
 * - Responsive grid layouts for all devices
 * - Reduced header/section heights
 * - Better mobile experience
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2,
  Shield,
  Check,
  ArrowRight,
  Hospital,
  Sun,
  Moon,
  BadgeCheck,
  MapPin,
  Phone,
  Clock,
  Users,
  Stethoscope,
  ChevronLeft,
  Loader2,
  Award,
  Search,
  CheckCircle2,
  Building,
  Landmark,
  School,
  Church,
  Briefcase,
  Zap,
  Mail,
  Globe,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../../../../shared/types/cn';
import { useAppDispatch, useAppSelector } from '../../../../../app/store/hooks/useApp';
import { toggleTheme } from '../../../../../app/store/slices/uiSlice';
import { ROUTES } from '../../routes/onboardingRouteConstants';
import { useRegisterFacility } from '../../api/queries/facility-owner/registerFacilityQuery';
import type { 
  RegisterFacilityRequest,
  NatureOfFacility,
  FacilityType,
  FacilityTier,
  OperationalStatus,
  OperatingHours
} from '../../api/queries/facility-owner/registerFacilityTypes';
import { countryCodes } from '../auth/countryCodes';

/* ==========================================================================
   DATA CONSTANTS
   ========================================================================== */

const NATURE_OF_FACILITY_OPTIONS: Array<{
  value: NatureOfFacility;
  label: string;
  icon: React.ReactNode;
  description: string;
}> = [
  { 
    value: 'government', 
    label: 'Government', 
    icon: <Building className="w-4 h-4" />,
    description: 'Public/gov'
  },
  { 
    value: 'private', 
    label: 'Private', 
    icon: <Briefcase className="w-4 h-4" />,
    description: 'Private owned'
  },
  { 
    value: 'faith_based', 
    label: 'Faith-based', 
    icon: <Church className="w-4 h-4" />,
    description: 'Religious org'
  },
  { 
    value: 'ngo', 
    label: 'NGO', 
    icon: <Users className="w-4 h-4" />,
    description: 'Non-gov'
  },
  { 
    value: 'military', 
    label: 'Military', 
    icon: <Shield className="w-4 h-4" />,
    description: 'Military'
  },
  { 
    value: 'academic', 
    label: 'Academic', 
    icon: <School className="w-4 h-4" />,
    description: 'Teaching'
  },
  { 
    value: 'public_private_partnership', 
    label: 'Public Private Partnership', 
    icon: <Landmark className="w-4 h-4" />,
    description: 'Public-private'
  },
];

const FACILITY_TYPE_OPTIONS: FacilityType[] = [
  'hospital',
  'clinic',
  'urgent_care',
  'emergency_department',
  'ambulatory_surgery_center',
  'diagnostic_center',
  'rehabilitation_center',
  'long_term_care',
  'hospice',
  'community_health_center',
  'specialty_center',
  'telehealth_hub',
  'pharmacy',
  'laboratory'
];

const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  hospital: 'Hospital',
  clinic: 'Clinic',
  urgent_care: 'Urgent Care',
  emergency_department: 'Emergency Department',
  ambulatory_surgery_center: 'Ambulatory Surgery Center',
  diagnostic_center: 'Diagnostic Center',
  rehabilitation_center: 'Rehabilitation Center',
  long_term_care: 'Long-term Care',
  hospice: 'Hospice',
  community_health_center: 'Community Health Center',
  specialty_center: 'Specialty Center',
  telehealth_hub: 'Telehealth Hub',
  pharmacy: 'Pharmacy',
  laboratory: 'Laboratory'
};

const FACILITY_TIER_OPTIONS: FacilityTier[] = ['primary', 'secondary', 'tertiary', 'specialized'];

const FACILITY_TIER_LABELS: Record<FacilityTier, string> = {
  primary: 'Primary Care',
  secondary: 'Secondary Care',
  tertiary: 'Tertiary Care',
  specialized: 'Specialized Care'
};

const OPERATIONAL_STATUS_OPTIONS: OperationalStatus[] = [
  'fully_operational',
  'limited_services',
  'emergency_only',
  'temporarily_closed',
  'permanently_closed',
  'under_construction'
];

const OPERATIONAL_STATUS_LABELS: Record<OperationalStatus, string> = {
  fully_operational: 'Fully Operational',
  limited_services: 'Limited Services',
  emergency_only: 'Emergency Only',
  temporarily_closed: 'Temporarily Closed',
  permanently_closed: 'Permanently Closed',
  under_construction: 'Under Construction'
};

const DEFAULT_OPERATING_HOURS: OperatingHours = {
  monday: { open: '08:00', close: '18:00', is_closed: false },
  tuesday: { open: '08:00', close: '18:00', is_closed: false },
  wednesday: { open: '08:00', close: '18:00', is_closed: false },
  thursday: { open: '08:00', close: '18:00', is_closed: false },
  friday: { open: '08:00', close: '18:00', is_closed: false },
  saturday: { open: '09:00', close: '13:00', is_closed: false },
  sunday: { open: '09:00', close: '13:00', is_closed: false }
};

const HEALTHCARE_SERVICES = [
  'Emergency Care',
  'Primary Care',
  'Specialty Consultation',
  'Diagnostic Imaging',
  'Laboratory Services',
  'Pharmacy',
  'Physical Therapy',
  'Mental Health Services',
  'Maternity Care',
  'Pediatric Care',
  'Geriatric Care',
  'Surgical Services',
  'Dental Services',
  'Optometry',
  'Vaccinations',
  'Chronic Disease Management'
];

/* ==========================================================================
   TYPE DEFINITIONS
   ========================================================================== */

interface FacilityFormData {
  // Step 1: Identity
  facility_name: string;
  legal_entity_name: string;
  nature_of_facility: NatureOfFacility | '';
  facility_type: FacilityType | '';
  facility_tier: FacilityTier | '';
  
  // Step 2: Location & Contact
  address_line1: string;
  city: string;
  state_province: string;
  postal_code: string;
  country_code: string;
  main_phone: string;
  email: string;
  website: string;
  
  // Step 3: Services & Operations
  operating_hours: OperatingHours;
  available_services: string[];
  operational_status: OperationalStatus | '';
}

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */

export const HealthcareFacilityOnboarding: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useAppSelector((state) => state.ui.theme);
  const { user } = useAppSelector((state) => state.auth);
  
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<FacilityFormData>({
    facility_name: '',
    legal_entity_name: '',
    nature_of_facility: '',
    facility_type: '',
    facility_tier: '',
    address_line1: '',
    city: '',
    state_province: '',
    postal_code: '',
    country_code: 'US',
    main_phone: '',
    email: '',
    website: '',
    operating_hours: DEFAULT_OPERATING_HOURS,
    available_services: [],
    operational_status: 'fully_operational'
  });
  
  const [countrySearch, setCountrySearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  
  const registerFacilityMutation = useRegisterFacility({
    onSuccess: (data) => {
      console.log('Facility registered:', data.data.facility_uuid);
    },
    onError: (error) => {
      console.error('Registration failed:', error);
    }
  });

  /* ==========================================================================
     FORM HANDLERS
     ========================================================================== */

  const updateField = useCallback((
    field: keyof FacilityFormData, 
    value: string | OperatingHours | string[]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const toggleService = useCallback((service: string) => {
    setFormData(prev => {
      const newServices = prev.available_services.includes(service)
        ? prev.available_services.filter(s => s !== service)
        : [...prev.available_services, service];
      return { ...prev, available_services: newServices };
    });
  }, []);

  const updateOperatingHours = useCallback((
    day: string, 
    field: 'open' | 'close' | 'is_closed', 
    value: string | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      operating_hours: {
        ...prev.operating_hours,
        [day]: {
          ...prev.operating_hours[day],
          [field]: value
        }
      }
    }));
  }, []);

  const applyToAllDays = useCallback(() => {
    const mondayHours = formData.operating_hours.monday;
    const newHours = { ...formData.operating_hours };
    
    Object.keys(newHours).forEach(day => {
      if (day !== 'monday') {
        newHours[day] = { ...mondayHours };
      }
    });
    
    setFormData(prev => ({ ...prev, operating_hours: newHours }));
  }, [formData.operating_hours]);

  /* ==========================================================================
     VALIDATION
     ========================================================================== */

  const isStep1Valid = useMemo(() => {
    return formData.facility_name.trim() !== '' && 
           formData.legal_entity_name.trim() !== '' && 
           formData.nature_of_facility !== '' &&
           formData.facility_type !== '' &&
           formData.facility_tier !== '';
  }, [formData]);

  const isStep2Valid = useMemo(() => {
    return formData.address_line1.trim() !== '' && 
           formData.city.trim() !== '' && 
           formData.state_province.trim() !== '' && 
           formData.postal_code.trim() !== '' && 
           formData.country_code !== '' && 
           formData.main_phone.trim() !== '';
  }, [formData]);

  const isStep3Valid = useMemo(() => {
    return formData.available_services.length > 0 && 
           formData.operational_status !== '';
  }, [formData.available_services, formData.operational_status]);

  const isCurrentStepValid = useMemo(() => {
    switch (currentStep) {
      case 1: return isStep1Valid;
      case 2: return isStep2Valid;
      case 3: return isStep3Valid;
      default: return false;
    }
  }, [currentStep, isStep1Valid, isStep2Valid, isStep3Valid]);

  /* ==========================================================================
     SUBMISSION
     ========================================================================== */

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !isStep1Valid || !isStep2Valid || !isStep3Valid) {
      return;
    }

    const payload: RegisterFacilityRequest = {
      facility_name: formData.facility_name,
      legal_entity_name: formData.legal_entity_name,
      nature_of_facility: formData.nature_of_facility as NatureOfFacility,
      facility_type: formData.facility_type as FacilityType,
      facility_tier: formData.facility_tier as FacilityTier,
      address_line1: formData.address_line1,
      city: formData.city,
      state_province: formData.state_province,
      postal_code: formData.postal_code,
      country_code: formData.country_code,
      main_phone: formData.main_phone,
      operating_hours: formData.operating_hours,
      available_services: formData.available_services,
      data_residency_region: 'US-East',
      operational_status: formData.operational_status as OperationalStatus,
      user_id: user.id,
    };
    
    registerFacilityMutation.mutate(payload);
  }, [formData, user, isStep1Valid, isStep2Valid, isStep3Valid, registerFacilityMutation]);

  const handleContinueToDashboard = useCallback(() => {
    if (!registerFacilityMutation.data?.data) return;

    const facilityData = registerFacilityMutation.data.data;
    navigate(ROUTES.STAFF_DASHBOARD, {
      state: {
        facilityID: facilityData.facility_uuid,
        facilityCode: facilityData.facility_code,
        facilityName: facilityData.facility_name,
        isNewFacility: true,
      }
    });
  }, [registerFacilityMutation.data, navigate]);

  /* ==========================================================================
     COMPUTED VALUES
     ========================================================================== */

  const isSubmitting = registerFacilityMutation.isPending;
  const isComplete = registerFacilityMutation.isSuccess;

  const filteredCountries = useMemo(() => {
    return countryCodes.filter(country => 
      country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      country.code.toLowerCase().includes(countrySearch.toLowerCase())
    ).slice(0, 8);
  }, [countrySearch]);

  const filteredServices = useMemo(() => {
    return HEALTHCARE_SERVICES.filter(service => 
      service.toLowerCase().includes(serviceSearch.toLowerCase())
    );
  }, [serviceSearch]);

  const selectedCountry = useMemo(() => {
    return countryCodes.find(country => country.code === formData.country_code);
  }, [formData.country_code]);

  const completionPercentage = useMemo(() => {
    const step1Progress = isStep1Valid ? 33.33 : 0;
    const step2Progress = isStep2Valid ? 33.33 : 0;
    const step3Progress = isStep3Valid ? 33.34 : 0;
    return step1Progress + (currentStep > 1 ? step2Progress : 0) + (currentStep > 2 ? step3Progress : 0);
  }, [currentStep, isStep1Valid, isStep2Valid, isStep3Valid]);

  /* ==========================================================================
     RENDER HELPERS
     ========================================================================== */

  const renderProgressIndicator = () => (
    <div className="mb-6">
      {/* Compact Step Labels */}
      <div className="flex justify-between mb-4">
        {[
          { num: 1, label: 'Facility Identity', icon: Building2 },
          { num: 2, label: 'Location & Contact', icon: MapPin },
          { num: 3, label: 'Services & Operations', icon: Stethoscope }
        ].map((step, idx) => (
          <div key={step.num} className="flex-1 relative">
            <div className="flex flex-col items-center">
              <motion.div
                className={cn(
                  "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-2 relative z-10 transition-all duration-300",
                  currentStep >= step.num
                    ? "bg-gradient-to-br from-blue-600 to-emerald-600 shadow-lg shadow-blue-500/30"
                    : theme === 'dark'
                    ? "bg-slate-800 border-2 border-slate-700"
                    : "bg-slate-100 border-2 border-slate-200"
                )}
                animate={{
                  scale: currentStep === step.num ? 1.05 : 1,
                }}
              >
                {currentStep > step.num ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                ) : (
                  <step.icon className={cn(
                    "w-4 h-4 sm:w-5 sm:h-5",
                    currentStep >= step.num ? "text-white" : "text-slate-400"
                  )} />
                )}
              </motion.div>
              
              <div className="text-center">
                <div className={cn(
                  "text-[10px] sm:text-sm font-bold",
                  currentStep >= step.num
                    ? "text-blue-600 dark:text-blue-400"
                    : theme === 'dark' ? "text-slate-500" : "text-slate-400"
                )}>
                  {step.label}
                </div>
              </div>
            </div>
            
            {/* Connector Line */}
            {idx < 2 && (
              <div className={cn(
                "absolute top-5 sm:top-6 left-1/2 w-full h-0.5 -z-0",
                currentStep > step.num
                  ? "bg-gradient-to-r from-blue-600 to-emerald-600"
                  : theme === 'dark'
                  ? "bg-slate-700"
                  : "bg-slate-200"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Compact Progress Bar */}
      <div className="relative h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-600"
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / 3) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </motion.div>
      </div>

      <div className="flex justify-between items-center mt-2">
        <span className={cn(
          "text-sm font-medium",
          theme === 'dark' ? "text-slate-400" : "text-slate-600"
        )}>
          {Math.round(completionPercentage)}% complete
        </span>
        <span className={cn(
          "text-[10px] font-medium px-2 py-0.5 rounded-full",
          theme === 'dark'
            ? "bg-slate-800 text-slate-300"
            : "bg-slate-100 text-slate-700"
        )}>
          Step {currentStep}/3
        </span>
      </div>
    </div>
  );

  const renderInput = (
    field: keyof FacilityFormData,
    label: string,
    placeholder: string,
    icon?: React.ReactNode,
    type: string = 'text',
    required: boolean = true
  ) => {
    const value = formData[field] as string;
    const isEmpty = !value;
    const showError = required && isEmpty && currentStep > 1;
    
    return (
      <div className="space-y-1.5">
        <label className={cn(
          "block text-sm font-semibold",
          theme === 'dark' ? "text-slate-200" : "text-slate-800"
        )}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <div className="relative group">
          {icon && (
            <div className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 transition-colors",
              !isEmpty ? "text-blue-500" : "text-slate-400 group-focus-within:text-blue-500"
            )}>
              {icon}
            </div>
          )}
          
          <input
            type={type}
            value={value}
            onChange={(e) => updateField(field, e.target.value)}
            placeholder={placeholder}
            className={cn(
              "w-full px-3 py-2.5 rounded-lg border-2 transition-all duration-200 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/20",
              icon ? "pl-10" : "",
              theme === 'dark'
                ? "bg-slate-800/50 border-slate-700 text-white placeholder-slate-500"
                : "bg-white border-slate-200 text-slate-900 placeholder-slate-400",
              !isEmpty && "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10",
              showError && "border-red-500"
            )}
          />
          
          {!isEmpty && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            </motion.div>
          )}

          {showError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <AlertCircle className="w-4 h-4 text-red-500" />
            </motion.div>
          )}
        </div>

        {showError && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="text-[10px] text-red-500 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" />
            Required field
          </motion.p>
        )}
      </div>
    );
  };

  const renderSelect = (
    value: string,
    onChange: (value: string) => void,
    label: string,
    options: Array<{ value: string; label: string }>,
    icon?: React.ReactNode,
    required: boolean = true
  ) => {
    const isEmpty = !value;
    
    return (
      <div className="space-y-1.5">
        <label className={cn(
          "block text-sm font-semibold",
          theme === 'dark' ? "text-slate-200" : "text-slate-800"
        )}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <div className="relative group">
          {icon && (
            <div className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 transition-colors z-10",
              !isEmpty ? "text-blue-500" : "text-slate-400 group-focus-within:text-blue-500"
            )}>
              {icon}
            </div>
          )}
          
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              "w-full px-3 py-2.5 rounded-lg border-2 appearance-none transition-all duration-200 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer",
              icon ? "pl-10" : "",
              theme === 'dark'
                ? "bg-slate-800/50 border-slate-700 text-white"
                : "bg-white border-slate-200 text-slate-900",
              !isEmpty && "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10"
            )}
          >
            <option value="">Select {label.toLowerCase()}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          
          {!isEmpty && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute right-10 top-1/2 -translate-y-1/2"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            </motion.div>
          )}

          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    );
  };

  /* ==========================================================================
     FORM SECTIONS
     ========================================================================== */

  const renderStep1 = () => (
    <motion.div 
      key="step-1"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-5"
    >
      {/* Compact Header */}
      <div className="text-center mb-2">
        <p className={cn(
          "text-sm",
          theme === 'dark' ? "text-slate-400" : "text-slate-600"
        )}>
          Basic information about your healthcare facility
        </p>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderInput('facility_name', 'Facility Name', 'e.g., Memorial Medical Center', <Building2 className="w-4 h-4" />)}
        {renderInput('legal_entity_name', 'Legal Entity Name', 'e.g., Healthcare Systems Inc.', <Briefcase className="w-4 h-4" />)}
      </div>

      {/* Nature of Facility */}
      <div className="space-y-2">
        <label className={cn(
          "block text-sm font-semibold",
          theme === 'dark' ? "text-slate-200" : "text-slate-800"
        )}>
          Nature of Facility <span className="text-red-500">*</span>
        </label>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {NATURE_OF_FACILITY_OPTIONS.map(option => (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => updateField('nature_of_facility', option.value)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative flex flex-col items-center gap-2 px-2 py-3 rounded-lg border-2 transition-all",
                formData.nature_of_facility === option.value
                  ? "border-blue-500 bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 shadow-md"
                  : theme === 'dark'
                  ? "border-slate-700 hover:border-blue-500/50 bg-slate-800/30"
                  : "border-slate-200 hover:border-blue-400/50 bg-white hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                formData.nature_of_facility === option.value
                  ? "bg-gradient-to-br from-blue-600 to-emerald-600 text-white"
                  : theme === 'dark'
                  ? "bg-slate-700 text-slate-400"
                  : "bg-slate-100 text-slate-600"
              )}>
                {option.icon}
              </div>
              
              <div className="text-center">
                <span className={cn(
                  "text-[10px] font-bold block",
                  formData.nature_of_facility === option.value
                    ? "text-blue-600 dark:text-blue-400"
                    : theme === 'dark' ? "text-white" : "text-slate-900"
                )}>
                  {option.label}
                </span>
              </div>

              {formData.nature_of_facility === option.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1"
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Classification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderSelect(
          formData.facility_type,
          (value) => updateField('facility_type', value),
          'Facility Type',
          FACILITY_TYPE_OPTIONS.map(type => ({
            value: type,
            label: FACILITY_TYPE_LABELS[type]
          })),
          <Hospital className="w-4 h-4" />
        )}
        
        {renderSelect(
          formData.facility_tier,
          (value) => updateField('facility_tier', value),
          'Care Level',
          FACILITY_TIER_OPTIONS.map(tier => ({
            value: tier,
            label: FACILITY_TIER_LABELS[tier]
          })),
          <Award className="w-4 h-4" />
        )}
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div 
      key="step-2"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-5"
    >
      {/* Compact Header */}
      <div className="text-center mb-4">
        <p className={cn(
          "text-sm",
          theme === 'dark' ? "text-slate-400" : "text-slate-600"
        )}>
          Where can patients and staff reach your facility?
        </p>
      </div>

      {/* Address */}
      <div className="space-y-4">
        {renderInput('address_line1', 'Street Address', '123 Medical Center Drive', <MapPin className="w-4 h-4" />)}
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {renderInput('city', 'City', 'New York')}
          {renderInput('state_province', 'State', 'NY')}
          {renderInput('postal_code', 'ZIP', '10001')}
          
          {/* Inline Country */}
          <div className="space-y-1.5">
            <label className={cn(
              "block text-sm font-semibold",
              theme === 'dark' ? "text-slate-200" : "text-slate-800"
            )}>
              Country <span className="text-red-500">*</span>
            </label>
            
            <div className="relative">
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => {
                  setCountrySearch(e.target.value);
                  setShowCountryDropdown(true);
                }}
                onFocus={() => setShowCountryDropdown(true)}
                placeholder="Search..."
                className={cn(
                  "w-full px-3 py-2.5 rounded-lg border-2 transition-all text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                  theme === 'dark'
                    ? "bg-slate-800/50 text-white placeholder-slate-500 border-slate-700"
                    : "bg-white text-slate-900 placeholder-slate-400 border-slate-200",
                  selectedCountry && "border-emerald-500"
                )}
              />
              
              {selectedCountry && !showCountryDropdown && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                  <span className="text-lg">{selectedCountry.flag}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {selectedCountry.code}
                  </span>
                </div>
              )}

              {showCountryDropdown && filteredCountries.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "absolute z-50 w-full mt-1 rounded-lg border-2 shadow-xl max-h-48 overflow-y-auto",
                    theme === 'dark'
                      ? "bg-slate-800 border-slate-700"
                      : "bg-white border-slate-200"
                  )}
                >
                  {filteredCountries.map(country => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => {
                        updateField('country_code', country.code);
                        setCountrySearch(country.name);
                        setShowCountryDropdown(false);
                      }}
                      className={cn(
                        "flex items-center gap-2 w-full px-3 py-2 transition-colors text-left",
                        theme === 'dark'
                          ? "hover:bg-slate-700"
                          : "hover:bg-slate-50",
                        formData.country_code === country.code && "bg-blue-50 dark:bg-blue-900/20"
                      )}
                    >
                      <span className="text-lg">{country.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          "text-sm font-semibold truncate",
                          theme === 'dark' ? "text-white" : "text-slate-900"
                        )}>
                          {country.name}
                        </div>
                      </div>
                      {formData.country_code === country.code && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderInput('main_phone', 'Phone', '+1 (555) 123-4567', <Phone className="w-4 h-4" />, 'tel')}
        {renderInput('email', 'Email', 'contact@facility.com', <Mail className="w-4 h-4" />, 'email', false)}
        {renderInput('website', 'Website', 'www.facility.com', <Globe className="w-4 h-4" />, 'url', false)}
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div 
      key="step-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-5"
    >
      {/* Compact Header */}
      <div className="text-center mb-4">
        <p className={cn(
          "text-sm",
          theme === 'dark' ? "text-slate-400" : "text-slate-600"
        )}>
          What services do you provide?
        </p>
      </div>

      {/* Operational Status */}
      <div>
        {renderSelect(
          formData.operational_status,
          (value) => updateField('operational_status', value),
          'Operational Status',
          OPERATIONAL_STATUS_OPTIONS.map(status => ({
            value: status,
            label: OPERATIONAL_STATUS_LABELS[status]
          })),
          <Zap className="w-4 h-4" />
        )}
      </div>

      {/* Available Services */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className={cn(
            "block text-sm font-semibold",
            theme === 'dark' ? "text-slate-200" : "text-slate-800"
          )}>
            Services <span className="text-red-500">*</span>
          </label>
          <span className={cn(
            "text-[10px] font-medium px-2 py-1 rounded-full",
            formData.available_services.length > 0
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
          )}>
            {formData.available_services.length} selected
          </span>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={serviceSearch}
            onChange={(e) => setServiceSearch(e.target.value)}
            placeholder="Search services..."
            className={cn(
              "w-full px-3 py-2.5 pl-10 rounded-lg border-2 transition-all text-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/20",
              theme === 'dark'
                ? "bg-slate-800/50 text-white placeholder-slate-500 border-slate-700"
                : "bg-white text-slate-900 placeholder-slate-400 border-slate-200"
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
          {filteredServices.map(service => {
            const isSelected = formData.available_services.includes(service);
            
            return (
              <motion.button
                key={service}
                type="button"
                onClick={() => toggleService(service)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg border-2 transition-all text-left",
                  isSelected
                    ? "border-blue-500 bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20"
                    : theme === 'dark'
                    ? "border-slate-700 hover:border-blue-500/50 bg-slate-800/30"
                    : "border-slate-200 hover:border-blue-400/50 bg-white hover:bg-slate-50"
                )}
              >
                <span className={cn(
                  "text-sm font-medium",
                  isSelected
                    ? "text-blue-600 dark:text-blue-400"
                    : theme === 'dark' ? "text-white" : "text-slate-900"
                )}>
                  {service}
                </span>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Operating Hours */}
      <div className={cn(
        "p-4 rounded-xl border-2",
        theme === 'dark' 
          ? "bg-slate-800/50 border-slate-700" 
          : "bg-slate-50 border-slate-200"
      )}>
        <div className="flex items-center justify-between mb-4">
          <h4 className={cn(
            "text-sm font-bold flex items-center gap-2",
            theme === 'dark' ? "text-white" : "text-slate-900"
          )}>
            <Clock className="w-4 h-4 text-blue-500" />
            Operating Hours
          </h4>
          <button
            type="button"
            onClick={applyToAllDays}
            className={cn(
              "text-[10px] font-medium px-3 py-1.5 rounded-lg transition-all",
              "border-2 hover:scale-105",
              theme === 'dark'
                ? "border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                : "border-blue-400 text-blue-600 hover:bg-blue-50"
            )}
          >
            Copy Mon to All
          </button>
        </div>

        <div className="space-y-2">
          {Object.entries(formData.operating_hours).map(([day, hours]) => (
            <div 
              key={day}
              className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg transition-all",
                theme === 'dark'
                  ? "bg-slate-900/50 hover:bg-slate-900/70"
                  : "bg-white hover:bg-slate-50"
              )}
            >
              <div className="flex items-center gap-2 min-w-[100px]">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px]",
                  theme === 'dark'
                    ? "bg-slate-700 text-slate-300"
                    : "bg-slate-100 text-slate-700"
                )}>
                  {day.substring(0, 3).toUpperCase()}
                </div>
                <span className={cn(
                  "text-sm font-semibold capitalize",
                  theme === 'dark' ? "text-white" : "text-slate-900"
                )}>
                  {day}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!hours.is_closed}
                    onChange={(e) => updateOperatingHours(day, 'is_closed', !e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className={cn(
                    "text-sm font-medium",
                    theme === 'dark' ? "text-slate-300" : "text-slate-700"
                  )}>
                    Open
                  </span>
                </label>

                {!hours.is_closed && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="time"
                      value={hours.open}
                      onChange={(e) => updateOperatingHours(day, 'open', e.target.value)}
                      className={cn(
                        "px-2 py-1 rounded-md border-2 text-sm font-medium transition-all",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500",
                        theme === 'dark'
                          ? "bg-slate-700 border-slate-600 text-white"
                          : "bg-white border-slate-200 text-slate-900"
                      )}
                    />
                    <span className="text-slate-400 text-sm">to</span>
                    <input
                      type="time"
                      value={hours.close}
                      onChange={(e) => updateOperatingHours(day, 'close', e.target.value)}
                      className={cn(
                        "px-2 py-1 rounded-md border-2 text-sm font-medium transition-all",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500",
                        theme === 'dark'
                          ? "bg-slate-700 border-slate-600 text-white"
                          : "bg-white border-slate-200 text-slate-900"
                      )}
                    />
                  </div>
                )}

                {hours.is_closed && (
                  <span className="text-sm text-red-500 font-medium">Closed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compact Security Notice */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "p-3 rounded-xl border-2",
          theme === 'dark' 
            ? "bg-blue-900/20 border-blue-700/50" 
            : "bg-blue-50 border-blue-200"
        )}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h5 className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-1">
              Security & Compliance
            </h5>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 mb-2">
              Your data is protected with enterprise-grade security.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { icon: BadgeCheck, text: 'HIPAA' },
                { icon: Shield, text: '256-bit' },
                { icon: CheckCircle2, text: 'SOC 2' }
              ].map((item, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md",
                    theme === 'dark'
                      ? "bg-slate-800/50"
                      : "bg-white/70"
                  )}
                >
                  <item.icon className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                  <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  const renderSuccessScreen = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6 text-center py-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.6, delay: 0.2 }}
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 mb-4 shadow-2xl">
          <BadgeCheck className="w-8 h-8 text-white" />
        </div>
      </motion.div>

      <div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn(
            "text-3xl font-black mb-2",
            theme === 'dark' ? "text-white" : "text-slate-900"
          )}
        >
          Registration Complete!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={cn(
            "text-sm",
            theme === 'dark' ? "text-slate-400" : "text-slate-600"
          )}
        >
          Your healthcare facility is now registered on Custocare AI.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={cn(
          "rounded-2xl border-2 p-6",
          theme === 'dark'
            ? "bg-slate-800/50 border-slate-700"
            : "bg-white border-slate-200"
        )}
      >
        <div className="mb-6">
          <p className={cn(
            "text-sm font-semibold mb-3 uppercase tracking-wider",
            theme === 'dark' ? "text-slate-500" : "text-slate-500"
          )}>
            Your Facility Registration Number is:
          </p>

          <div className="space-y-2">
            <div>
              <div className="text-lg md:text-xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent break-all">
                {registerFacilityMutation.data?.data?.facility_code}
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className={cn(
          "p-4 rounded-xl border-2 mb-6 text-left",
          theme === 'dark'
            ? "bg-slate-900/50 border-slate-700"
            : "bg-slate-50 border-slate-200"
        )}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                Facility Name
              </p>
              <p className={cn(
                "font-bold text-sm",
                theme === 'dark' ? "text-white" : "text-slate-900"
              )}>
                {formData.facility_name}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                Type
              </p>
              <p className="font-bold text-sm text-blue-600 dark:text-blue-400">
                {formData.facility_type && FACILITY_TYPE_LABELS[formData.facility_type as FacilityType]}
              </p>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleContinueToDashboard}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-black text-base bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
        >
          <Sparkles className="w-5 h-5" />
          Continue to Portal
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </motion.div>
  );

  /* ==========================================================================
     MAIN RENDER
     ========================================================================== */

  return (
    <div className={cn(
      "min-h-screen flex flex-col relative",
      theme === 'dark' 
        ? "bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950" 
        : "bg-gradient-to-br from-slate-50 via-white to-blue-50/40"
    )}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={cn(
            "absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full blur-3xl",
            theme === 'dark' ? "bg-blue-600/20" : "bg-blue-400/15"
          )}
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className={cn(
            "absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full blur-3xl",
            theme === 'dark' ? "bg-emerald-600/20" : "bg-emerald-400/15"
          )}
        />
      </div>

      {/* Compact Header */}
      <header className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-xl",
        theme === 'dark' 
          ? "bg-slate-900/80 border-slate-800/60" 
          : "bg-white/80 border-slate-200/60"
      )}>
        <nav className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center shadow-lg"
              >
                <Hospital className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <div className="text-base font-black tracking-tight bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  Custocare AI
                </div>
                <div className={cn(
                  "text-[9px] font-bold tracking-wider uppercase",
                  theme === 'dark' ? "text-slate-500" : "text-slate-500"
                )}>
                  Registration
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => dispatch(toggleTheme())}
              className={cn(
                "p-2 rounded-lg transition-all border-2",
                theme === 'dark'
                  ? 'bg-slate-800/60 border-slate-700/60 text-amber-400'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              )}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-3 sm:px-4 py-6 relative z-10">
        <div className="w-full max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-2xl border-2 p-5 sm:p-6 md:p-8 backdrop-blur-xl shadow-2xl",
              theme === 'dark'
                ? "bg-slate-800/90 border-slate-700/60"
                : "bg-white/95 border-slate-200/60"
            )}
          >
            {!isComplete ? (
              <>
                {renderProgressIndicator()}
                
                <form onSubmit={handleSubmit}>
                  <AnimatePresence mode="wait">
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                  </AnimatePresence>

                  {/* Compact Navigation */}
                  <div className="flex items-center justify-between pt-6 mt-6 border-t-2 border-slate-200 dark:border-slate-700">
                    {currentStep > 1 ? (
                      <motion.button
                        type="button"
                        onClick={() => setCurrentStep(prev => (prev - 1) as 1 | 2 | 3)}
                        disabled={isSubmitting}
                        whileHover={{ scale: 1.02, x: -5 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all border-2",
                          theme === 'dark'
                            ? "border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                            : "border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400",
                          isSubmitting && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                      </motion.button>
                    ) : (
                      <div />
                    )}
                    
                    {currentStep < 3 ? (
                      <motion.button
                        type="button"
                        disabled={!isCurrentStepValid}
                        onClick={() => setCurrentStep(prev => (prev + 1) as 1 | 2 | 3)}
                        whileHover={isCurrentStepValid ? { scale: 1.02, x: 5 } : {}}
                        whileTap={isCurrentStepValid ? { scale: 0.98 } : {}}
                        className={cn(
                          "ml-auto flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-black transition-all shadow-lg",
                          isCurrentStepValid
                            ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700 hover:shadow-xl"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                        )}
                      >
                        Continue
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    ) : (
                      <motion.button
                        type="submit"
                        disabled={!isCurrentStepValid || isSubmitting}
                        whileHover={isCurrentStepValid && !isSubmitting ? { scale: 1.02 } : {}}
                        whileTap={isCurrentStepValid && !isSubmitting ? { scale: 0.98 } : {}}
                        className={cn(
                          "ml-auto flex items-center gap-2 px-8 py-3 rounded-lg font-black transition-all shadow-lg text-base",
                          isCurrentStepValid && !isSubmitting
                            ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700 hover:shadow-xl"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                        )}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Registering...
                          </>
                        ) : (
                          <>
                            <BadgeCheck className="w-5 h-5" />
                            Complete
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </form>
              </>
            ) : (
              renderSuccessScreen()
            )}
          </motion.div>
        </div>
      </main>

      {/* Compact Footer */}
      <footer className={cn(
        "py-4 px-4 border-t backdrop-blur-xl",
        theme === 'dark' 
          ? "bg-slate-900/70 border-slate-800/60" 
          : "bg-white/70 border-slate-200/60"
      )}>
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <Shield className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                HIPAA
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <BadgeCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400">
                256-bit
              </span>
            </div>
          </div>
          <p className={cn(
            "text-[10px]",
            theme === 'dark' ? "text-slate-500" : "text-slate-500"
          )}>
            © {new Date().getFullYear()} Custocare AI. All data encrypted and protected.
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        /* Custom scrollbar */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: ${theme === 'dark' ? 'rgb(71, 85, 105)' : 'rgb(203, 213, 225)'};
          border-radius: 3px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: ${theme === 'dark' ? 'rgb(100, 116, 139)' : 'rgb(148, 163, 184)'};
        }
      `}</style>
    </div>
  );
};

export default HealthcareFacilityOnboarding;
