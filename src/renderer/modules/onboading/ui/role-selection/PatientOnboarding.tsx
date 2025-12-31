/**
 * ============================================================================
 * STREAMLINED PATIENT ONBOARDING
 * ============================================================================
 * 
 * DESIGN PHILOSOPHY: Fast, Focused, Frictionless - Medical Professional Version Adaptation
 * 
 * KEY IMPROVEMENTS (Matching MedicalProfessionalOnboarding):
 * 1. ✅ Single-column centered layout - maximum focus
 * 2. ✅ Removed marketing distractions - user already committed
 * 3. ✅ Simplified 3-stage flow with clear progress
 * 4. ✅ Clean form design matching Landing/Role Selection aesthetic
 * 5. ✅ Minimal animations - only functional feedback
 * 6. ✅ Faster completion time (target: 2-3 minutes)
 * 7. ✅ Mobile-optimized responsive design
 * 8. ✅ Consistent design language with Medical Professional onboarding
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Phone, 
  Calendar,
  Shield,
  Check,
  ArrowRight,
  Sun,
  Moon,
  Heart,
  Users,
  Mail,
  FileText,
  ChevronLeft,
  Hospital,
  BadgeCheck,
  Home,
  Stethoscope,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../../../shared/types/cn';
import { useAppDispatch, useAppSelector } from '../../../../app/store/hooks/useApp';
import { toggleTheme } from '../../../../app/store/slices/uiSlice';
import { ROUTES } from '../../routes/onboardingRouteConstants';

/* ==========================================================================
   TYPE DEFINITIONS
   ========================================================================== */
interface PatientFormData {
  // Stage 1: Personal Information
  fullName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  phone: string;
  
  // Stage 2: Health Profile
  primaryPhysician: string;
  insuranceProvider: string;
  insuranceNumber: string;
  bloodType: string;
  allergies: string;
  
  // Stage 3: Contact & Emergency
  address: string;
  city: string;
  state: string;
  zipCode: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
}

interface GlobalPatientID {
  fullID: string;
  generatedAt: string;
}

/* ==========================================================================
   DATA CONSTANTS
   ========================================================================== */
const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' }
];

const BLOOD_TYPES = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'
];

const INSURANCE_PROVIDERS = [
  'Aetna', 'Blue Cross Blue Shield', 'Cigna', 'UnitedHealthcare',
  'Humana', 'Kaiser Permanente', 'Medicare', 'Medicaid', 'Other'
];

const RELATIONSHIP_OPTIONS = [
  'Spouse/Partner', 'Parent', 'Child', 'Sibling', 
  'Friend', 'Other Family Member', 'Other'
];

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming'
];

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */
export const PatientOnboarding: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useAppSelector((state) => state.ui.theme);
  
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<PatientFormData>({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    phone: '',
    primaryPhysician: '',
    insuranceProvider: '',
    insuranceNumber: '',
    bloodType: '',
    allergies: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
  });
  
  const [globalPatientID, setGlobalPatientID] = useState<GlobalPatientID | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  /* Generate Global Patient ID */
  const generateGlobalPatientID = useCallback((): GlobalPatientID => {
    const prefix = 'PAT';
    const number = Math.floor(Math.random() * 9000 + 1000).toString();
    const checkDigit = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const fullID = `${prefix}-${number}-${checkDigit}`;

    return {
      fullID,
      generatedAt: new Date().toISOString(),
    };
  }, []);

  /* Form Submission */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const patientID = generateGlobalPatientID();
    setGlobalPatientID(patientID);
    
    setIsSubmitting(false);
    setIsComplete(true);
  }, [generateGlobalPatientID]);

  /* Continue to Dashboard */
  const handleContinueToDashboard = useCallback(() => {
    navigate(ROUTES.PATIENT_DASHBOARD, {
      state: {
        patientID: globalPatientID?.fullID,
        patientName: formData.fullName,
        isNewPatient: true,
      }
    });
  }, [globalPatientID, formData, navigate]);

  /* Form Validation */
  const isStageValid = useMemo(() => {
    if (currentStage === 1) {
      return formData.fullName && formData.dateOfBirth && 
             formData.email && formData.phone && formData.gender;
    }
    if (currentStage === 2) {
      return formData.primaryPhysician && formData.insuranceProvider && 
             formData.insuranceNumber && formData.bloodType;
    }
    if (currentStage === 3) {
      return formData.address && formData.city && formData.state && 
             formData.zipCode && formData.emergencyContactName && 
             formData.emergencyContactPhone && formData.emergencyContactRelationship;
    }
    return false;
  }, [formData, currentStage]);

  /* ==========================================================================
     RENDER COMPONENTS (Consistent with MedicalProfessionalOnboarding)
     ========================================================================== */

  /* Progress Indicator */
  const renderProgress = () => {
    const progress = currentStage === 1 ? 33 : currentStage === 2 ? 66 : 100;
    
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={cn(
              "text-2xl font-bold",
              theme === 'dark' ? "text-white" : "text-slate-900"
            )}>
              {currentStage === 1 && "Personal Information"}
              {currentStage === 2 && "Health Profile"}
              {currentStage === 3 && "Contact & Emergency"}
            </h2>
            <p className={cn(
              "text-sm mt-1",
              theme === 'dark' ? "text-slate-400" : "text-slate-600"
            )}>
              Step {currentStage} of 3
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {progress}%
            </div>
          </div>
        </div>

        <div className="relative h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    );
  };

  /* Form Input Component */
  const renderInput = (
    field: keyof PatientFormData,
    label: string,
    type: string = 'text',
    icon?: React.ReactNode,
    placeholder?: string,
    options?: Array<{ value: string; label: string }>
  ) => {
    const value = formData[field];
    const isEmpty = !value;
    
    return (
      <div className="space-y-2">
        <label className={cn(
          "block text-sm font-medium",
          theme === 'dark' ? "text-white" : "text-slate-900"
        )}>
          {label}
        </label>
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          
          {type === 'select' && options ? (
            <select
              value={value}
              onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
              className={cn(
                "w-full px-4 py-3 rounded-xl border-2 appearance-none",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all",
                theme === 'dark'
                  ? "bg-slate-800 border-slate-700 text-white"
                  : "bg-white border-slate-200 text-slate-900",
                icon ? "pl-11" : undefined,
                !isEmpty && "border-emerald-500"
              )}
            >
              <option value="">Select {label.toLowerCase()}</option>
              {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={value}
              onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
              placeholder={placeholder}
              className={cn(
                "w-full px-4 py-3 rounded-xl border-2",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all",
                theme === 'dark'
                  ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                  : "bg-white border-slate-200 text-slate-900 placeholder-slate-400",
                icon ? "pl-11" : undefined,
                !isEmpty && "border-emerald-500"
              )}
            />
          )}
          
          {!isEmpty && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <Check className="w-5 h-5 text-emerald-500" />
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  /* Form Sections */
  const renderFormSection = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AnimatePresence mode="wait">
        {/* Stage 1: Personal Information */}
        {currentStage === 1 && (
          <motion.div 
            key="stage-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {renderInput('fullName', 'Full Name', 'text', <User className="w-5 h-5" />, 'John Smith')}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderInput('dateOfBirth', 'Date of Birth', 'date', <Calendar className="w-5 h-5" />)}
              {renderInput('gender', 'Gender', 'select', <Users className="w-5 h-5" />, undefined, GENDER_OPTIONS)}
            </div>
            
            {renderInput('email', 'Email Address', 'email', <Mail className="w-5 h-5" />, 'patient@example.com')}
            {renderInput('phone', 'Phone Number', 'tel', <Phone className="w-5 h-5" />, '+1 (555) 123-4567')}
          </motion.div>
        )}

        {/* Stage 2: Health Profile */}
        {currentStage === 2 && (
          <motion.div 
            key="stage-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {renderInput('primaryPhysician', 'Primary Physician', 'text', <Stethoscope className="w-5 h-5" />, 'Dr. Jane Smith')}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderInput('insuranceProvider', 'Insurance Provider', 'select', <FileText className="w-5 h-5" />, undefined, 
                INSURANCE_PROVIDERS.map(provider => ({ value: provider.toLowerCase(), label: provider }))
              )}
              {renderInput('insuranceNumber', 'Insurance Number', 'text', <FileText className="w-5 h-5" />, 'Policy number')}
            </div>
            
            {renderInput('bloodType', 'Blood Type', 'select', <Heart className="w-5 h-5" />, undefined, 
              BLOOD_TYPES.map(type => ({ value: type.toLowerCase(), label: type }))
            )}
            
            {renderInput('allergies', 'Allergies (if any)', 'text', <AlertCircle className="w-5 h-5" />, 'List any known allergies, separated by commas')}
          </motion.div>
        )}

        {/* Stage 3: Contact & Emergency */}
        {currentStage === 3 && (
          <motion.div 
            key="stage-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {renderInput('address', 'Address', 'text', <Home className="w-5 h-5" />, '123 Main Street')}
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {renderInput('city', 'City', 'text', undefined, 'New York')}
              {renderInput('state', 'State', 'select', undefined, undefined,
                US_STATES.map(state => ({ value: state.toLowerCase(), label: state }))
              )}
              {renderInput('zipCode', 'ZIP Code', 'text', undefined, '10001')}
            </div>
            
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <h3 className={cn(
                "text-lg font-semibold mb-4 flex items-center gap-2",
                theme === 'dark' ? "text-white" : "text-slate-900"
              )}>
                {/* <Emergency className="w-5 h-5 text-red-500" /> */}
                Emergency Contact
              </h3>
              
              <div className="space-y-6">
                {renderInput('emergencyContactName', 'Contact Name', 'text', <User className="w-5 h-5" />, 'Full name')}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderInput('emergencyContactPhone', 'Phone Number', 'tel', <Phone className="w-5 h-5" />, '+1 (555) 987-6543')}
                  {renderInput('emergencyContactRelationship', 'Relationship', 'select', <Users className="w-5 h-5" />, undefined,
                    RELATIONSHIP_OPTIONS.map(rel => ({ value: rel.toLowerCase(), label: rel }))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        {currentStage > 1 ? (
          <button
            type="button"
            onClick={() => setCurrentStage(prev => (prev - 1) as 1 | 2 | 3)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
              theme === 'dark'
                ? "border-2 border-slate-700 text-slate-300 hover:bg-slate-800"
                : "border-2 border-slate-300 text-slate-700 hover:bg-slate-50"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        ) : (
          <div />
        )}
        
        {currentStage < 3 ? (
          <button
            type="button"
            disabled={!isStageValid}
            onClick={() => setCurrentStage(prev => (prev + 1) as 1 | 2 | 3)}
            className={cn(
              "ml-auto flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all",
              isStageValid
                ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700"
                : "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
            )}
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!isStageValid || isSubmitting}
            className={cn(
              "ml-auto flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all",
              isStageValid 
                ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700"
                : "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating Account...
              </>
            ) : (
              <>
                <BadgeCheck className="w-5 h-5" />
                Complete Registration
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );

  /* Global Patient ID Display */
  const renderGlobalPatientID = () => (
    <div className="space-y-8 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 mb-6 shadow-xl">
          <BadgeCheck className="w-10 h-10 text-white" />
        </div>
      </motion.div>

      <div>
        <h2 className={cn(
          "text-3xl font-bold mb-3",
          theme === 'dark' ? "text-white" : "text-slate-900"
        )}>
          Welcome, {formData.fullName.split(' ')[0]}!
        </h2>
        <p className={cn(
          "text-lg",
          theme === 'dark' ? "text-slate-400" : "text-slate-600"
        )}>
          Your patient account has been created successfully
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "rounded-2xl border-2 p-8",
          theme === 'dark'
            ? "bg-slate-800 border-slate-700"
            : "bg-white border-slate-200"
        )}
      >
        <div className="mb-6">
          <p className={cn(
            "text-sm font-medium mb-2",
            theme === 'dark' ? "text-slate-400" : "text-slate-600"
          )}>
            Your Global Patient ID
          </p>
          <div className="text-4xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            {globalPatientID?.fullID}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="text-left">
            <div className={cn(
              "text-xs font-medium mb-1",
              theme === 'dark' ? "text-slate-500" : "text-slate-500"
            )}>
              Primary Physician
            </div>
            <div className={cn(
              "font-semibold",
              theme === 'dark' ? "text-white" : "text-slate-900"
            )}>
              {formData.primaryPhysician || 'Not specified'}
            </div>
          </div>
          
          <div className="text-right">
            <div className={cn(
              "text-xs font-medium mb-1",
              theme === 'dark' ? "text-slate-500" : "text-slate-500"
            )}>
              Status
            </div>
            <div className="flex items-center justify-end gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-emerald-600">Active</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleContinueToDashboard}
          className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700 transition-all"
        >
          Continue to Patient Portal
          <ArrowRight className="w-6 h-6" />
        </button>
      </motion.div>
    </div>
  );

  /* ==========================================================================
     MAIN RENDER (Identical structure to MedicalProfessionalOnboarding)
     ========================================================================== */
  return (
    <div className={cn(
      "min-h-screen flex flex-col relative",
      theme === 'dark' 
        ? "bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950" 
        : "bg-gradient-to-br from-slate-50 via-white to-blue-50/40"
    )}>
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={cn(
          "absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full blur-3xl",
          theme === 'dark' ? "bg-blue-600/20" : "bg-blue-400/15"
        )} />
        <div className={cn(
          "absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full blur-3xl",
          theme === 'dark' ? "bg-emerald-600/20" : "bg-emerald-400/15"
        )} />
      </div>

      {/* Header */}
      <header className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-xl",
        theme === 'dark' 
          ? "bg-slate-900/75 border-slate-800/60" 
          : "bg-white/75 border-slate-200/60"
      )}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-600 flex items-center justify-center shadow-lg">
                <Hospital className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  CustoCare AI
                </div>
                <div className={cn(
                  "text-[11px] font-semibold tracking-wide uppercase",
                  theme === 'dark' ? "text-slate-500" : "text-slate-500"
                )}>
                  Patient Registration
                </div>
              </div>
            </div>

            <button
              onClick={() => dispatch(toggleTheme())}
              className={cn(
                "p-3 rounded-xl transition-all border-2",
                theme === 'dark'
                  ? 'bg-slate-800/60 border-slate-700/60 text-amber-300'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
              )}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-3xl border-2 p-8 backdrop-blur-xl shadow-2xl",
              theme === 'dark'
                ? "bg-slate-800/85 border-slate-700/60"
                : "bg-white/90 border-slate-200/60"
            )}
          >
            {!isComplete ? (
              <>
                {renderProgress()}
                {renderFormSection()}
              </>
            ) : (
              renderGlobalPatientID()
            )}
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className={cn(
        "py-6 px-4 border-t backdrop-blur-xl",
        theme === 'dark' 
          ? "bg-slate-900/60 border-slate-800/60" 
          : "bg-white/60 border-slate-200/60"
      )}>
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span className={cn(
              "text-sm font-semibold",
              theme === 'dark' ? "text-slate-300" : "text-slate-700"
            )}>
              HIPAA Compliant • 256-bit Encryption
            </span>
          </div>
          <p className={cn(
            "text-xs",
            theme === 'dark' ? "text-slate-500" : "text-slate-500"
          )}>
            © 2024 CustoCare AI. All information is encrypted and protected.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PatientOnboarding;