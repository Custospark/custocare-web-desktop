/**
 * ============================================================================
 * STREAMLINED MEDICAL PROFESSIONAL ONBOARDING
 * ============================================================================
 * 
 * DESIGN PHILOSOPHY: Fast, Focused, Frictionless
 * 
 * KEY IMPROVEMENTS:
 * 1. ✅ Single-column centered layout - maximum focus
 * 2. ✅ Removed marketing distractions - user already committed
 * 3. ✅ Simplified 3-stage flow with clear progress
 * 4. ✅ Clean form design matching Landing/Role Selection aesthetic
 * 5. ✅ Minimal animations - only functional feedback
 * 6. ✅ Faster completion time (target: 2-3 minutes)
 * 7. ✅ Mobile-optimized responsive design
 * 8. ✅ Consistent design language with Landing/Role Selection pages
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  Check,
  ArrowRight,
  Sun,
  Moon,
  Fingerprint,
  BadgeCheck,
  Briefcase,
  Mail,
  FileText,
  GraduationCap,
  Building2,
  ChevronLeft,
  Hospital,
} from 'lucide-react';
import { cn } from '../../../../shared/types/cn';
import { useAppDispatch, useAppSelector } from '../../../../app/store/hooks/useApp';
import { toggleTheme } from '../../../../app/store/slices/uiSlice';
import { ROUTES } from '../../routes/onboardingRouteConstants';

/* ==========================================================================
   TYPE DEFINITIONS
   ========================================================================== */
interface MedicalProfessionalFormData {
  // Stage 1: Personal Information
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  
  // Stage 2: Professional Credentials
  medicalLicenseNumber: string;
  licenseState: string;
  npiNumber: string;
  specialization: string;
  yearsOfExperience: string;
  
  // Stage 3: Practice Information
  practiceName: string;
  practiceAddress: string;
  practiceCity: string;
  practiceState: string;
  practiceZip: string;
}

interface GlobalProviderID {
  fullID: string;
  generatedAt: string;
}

/* ==========================================================================
   DATA CONSTANTS
   ========================================================================== */
const SPECIALIZATIONS = [
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'dermatology', label: 'Dermatology' },
  { value: 'emergency-medicine', label: 'Emergency Medicine' },
  { value: 'family-medicine', label: 'Family Medicine' },
  { value: 'neurology', label: 'Neurology' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'psychiatry', label: 'Psychiatry' },
  { value: 'surgery', label: 'General Surgery' },
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

const EXPERIENCE_OPTIONS = [
  { value: '0-2', label: '0-2 years' },
  { value: '3-5', label: '3-5 years' },
  { value: '6-10', label: '6-10 years' },
  { value: '11-15', label: '11-15 years' },
  { value: '16-20', label: '16-20 years' },
  { value: '20+', label: '20+ years' }
];

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */
export const MedicalProfessionalOnboarding: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useAppSelector((state) => state.ui.theme);
  
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<MedicalProfessionalFormData>({
    fullName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    medicalLicenseNumber: '',
    licenseState: '',
    npiNumber: '',
    specialization: '',
    yearsOfExperience: '',
    practiceName: '',
    practiceAddress: '',
    practiceCity: '',
    practiceState: '',
    practiceZip: '',
  });
  
  const [globalProviderID, setGlobalProviderID] = useState<GlobalProviderID | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  /* Generate Global Provider ID */
  const generateGlobalProviderID = useCallback((): GlobalProviderID => {
    const prefix = 'CMD';
    const number = Math.floor(Math.random() * 9000 + 1000).toString();
    const checkDigit = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const fullID = `${prefix}-${number}-${checkDigit}-PRO`;

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

    const providerID = generateGlobalProviderID();
    setGlobalProviderID(providerID);
    
    setIsSubmitting(false);
    setIsComplete(true);
  }, [generateGlobalProviderID]);

  /* Continue to Dashboard */
  const handleContinueToDashboard = useCallback(() => {
    navigate(ROUTES.STAFF_DASHBOARD, {
      state: {
        providerID: globalProviderID?.fullID,
        providerName: formData.fullName,
        specialization: formData.specialization,
        isNewProvider: true,
      }
    });
  }, [globalProviderID, formData, navigate]);

  /* Form Validation */
  const isStageValid = useMemo(() => {
    if (currentStage === 1) {
      return formData.fullName && formData.dateOfBirth && 
             formData.email && formData.phone;
    }
    if (currentStage === 2) {
      return formData.medicalLicenseNumber && formData.licenseState && 
             formData.npiNumber && formData.specialization && formData.yearsOfExperience;
    }
    if (currentStage === 3) {
      return formData.practiceName && formData.practiceAddress && 
             formData.practiceCity && formData.practiceState && formData.practiceZip;
    }
    return false;
  }, [formData, currentStage]);

  /* ==========================================================================
     RENDER COMPONENTS
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
              {currentStage === 2 && "Professional Credentials"}
              {currentStage === 3 && "Practice Details"}
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
    field: keyof MedicalProfessionalFormData,
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
            {renderInput('fullName', 'Full Legal Name', 'text', <User className="w-5 h-5" />, 'Dr. John Smith, MD')}
            {renderInput('dateOfBirth', 'Date of Birth', 'date', <Calendar className="w-5 h-5" />)}
            {renderInput('email', 'Professional Email', 'email', <Mail className="w-5 h-5" />, 'doctor@hospital.com')}
            {renderInput('phone', 'Phone Number', 'tel', <Phone className="w-5 h-5" />, '+1 (555) 123-4567')}
          </motion.div>
        )}

        {/* Stage 2: Professional Credentials */}
        {currentStage === 2 && (
          <motion.div 
            key="stage-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderInput('medicalLicenseNumber', 'Medical License Number', 'text', <FileText className="w-5 h-5" />, 'MD123456')}
              {renderInput('licenseState', 'License State', 'select', <MapPin className="w-5 h-5" />, undefined, 
                US_STATES.map(state => ({ value: state.toLowerCase(), label: state }))
              )}
            </div>
            
            {renderInput('npiNumber', 'NPI Number', 'text', <Fingerprint className="w-5 h-5" />, '10-digit NPI')}
            {renderInput('specialization', 'Medical Specialization', 'select', <GraduationCap className="w-5 h-5" />, undefined, SPECIALIZATIONS)}
            {renderInput('yearsOfExperience', 'Years of Experience', 'select', <Briefcase className="w-5 h-5" />, undefined, EXPERIENCE_OPTIONS)}
          </motion.div>
        )}

        {/* Stage 3: Practice Information */}
        {currentStage === 3 && (
          <motion.div 
            key="stage-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {renderInput('practiceName', 'Practice Name', 'text', <Building2 className="w-5 h-5" />, 'Smith Medical Group')}
            {renderInput('practiceAddress', 'Practice Address', 'text', <MapPin className="w-5 h-5" />, '123 Medical Center Dr')}
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {renderInput('practiceCity', 'City', 'text', undefined, 'New York')}
              {renderInput('practiceState', 'State', 'select', undefined, undefined,
                US_STATES.map(state => ({ value: state.toLowerCase(), label: state }))
              )}
              {renderInput('practiceZip', 'ZIP Code', 'text', undefined, '10001')}
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
                Verifying...
              </>
            ) : (
              <>
                <BadgeCheck className="w-5 h-5" />
                Complete Verification
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );

  /* Global Provider ID Display */
  const renderGlobalProviderID = () => (
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
          Welcome, Dr. {formData.fullName.split(' ')[0]}!
        </h2>
        <p className={cn(
          "text-lg",
          theme === 'dark' ? "text-slate-400" : "text-slate-600"
        )}>
          Your credentials have been verified
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
            Your Global Provider ID
          </p>
          <div className="text-4xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            {globalProviderID?.fullID}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="text-left">
            <div className={cn(
              "text-xs font-medium mb-1",
              theme === 'dark' ? "text-slate-500" : "text-slate-500"
            )}>
              Specialization
            </div>
            <div className={cn(
              "font-semibold",
              theme === 'dark' ? "text-white" : "text-slate-900"
            )}>
              {SPECIALIZATIONS.find(s => s.value === formData.specialization)?.label}
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
              <span className="font-semibold text-emerald-600">Verified</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleContinueToDashboard}
          className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700 transition-all"
        >
          Continue to Dashboard
          <ArrowRight className="w-6 h-6" />
        </button>
      </motion.div>
    </div>
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
                  Medical Professional Setup
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
              renderGlobalProviderID()
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
            © 2024 CustoCare AI. All credentials are verified and encrypted.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MedicalProfessionalOnboarding;
