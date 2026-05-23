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

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield,
  ArrowRight,
  Sun,
  Moon,
  BadgeCheck,
  ChevronLeft,
  Loader2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../../app/store/hooks/useApp';
import LogoImage from '../../../../../shared/assets/LogoImage';
import type { FacilityTier, FacilityType, NatureOfFacility, OperatingHours, OperationalStatus, RegisterFacilityRequest } from '../../api/queries/facility-owner/registerFacilityTypes'
import { useRegisterFacility } from '../../api/queries/facility-owner/registerFacilityQuery';
import { ROUTES } from '../../routes/onboardingRouteConstants';
import { toggleTheme } from '../../../../../app/store/slices/uiSlice';
import { cn } from '../../../../../shared/utils/classNameUtils';

// Import components
import { ProgressIndicator } from './facility-onboarding/ProgressIndicator';
import { Step1Identity } from './facility-onboarding/Step1Identity';
import { Step2Location } from './facility-onboarding/Step2Location';
import { Step3Services } from './facility-onboarding/Step3Services';
import { SuccessScreen } from './facility-onboarding/SuccessScreen';
import { PlanSelectionStep } from './facility-onboarding/PlanSelectionStep';

// Import types and constants
import { 
  type FacilityFormData,
  DEFAULT_OPERATING_HOURS
} from  './facility-onboarding/types';
import { BrandName } from '../../../../../shared/utils/BrandName';

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */

const ONBOARDING_STORAGE_KEY = 'custocare_facility_onboarding';

export const Index: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useAppSelector((state) => state.ui.theme);
  const { user } = useAppSelector((state) => state.auth);
  const restored = useRef(false);

  const loadSaved = <T,>(key: string, fallback: T): T => {
    try {
      const raw = localStorage.getItem(`${ONBOARDING_STORAGE_KEY}_${key}`);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const saveToStorage = (key: string, value: unknown) => {
    try {
      localStorage.setItem(`${ONBOARDING_STORAGE_KEY}_${key}`, JSON.stringify(value));
    } catch { /* storage full or unavailable */ }
  };

  const clearStorage = () => {
    try {
      localStorage.removeItem(`${ONBOARDING_STORAGE_KEY}_step`);
      localStorage.removeItem(`${ONBOARDING_STORAGE_KEY}_plan`);
      localStorage.removeItem(`${ONBOARDING_STORAGE_KEY}_form`);
    } catch { /* noop */ }
  };

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(
    () => loadSaved('step', 1) as 1 | 2 | 3 | 4
  );
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(
    () => loadSaved<number | null>('plan', null)
  );
  const [formData, setFormData] = useState<FacilityFormData>(
    () => loadSaved<FacilityFormData | null>('form', null) || {
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
    }
  );

  useEffect(() => {
    if (!restored.current) {
      restored.current = true;
      return;
    }
    saveToStorage('step', currentStep);
  }, [currentStep]);

  useEffect(() => {
    if (!restored.current) return;
    saveToStorage('plan', selectedPlanId);
  }, [selectedPlanId]);

  useEffect(() => {
    if (!restored.current) return;
    saveToStorage('form', formData);
  }, [formData]);

  const registerFacilityMutation = useRegisterFacility({
    onSuccess: () => {
      clearStorage();
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

  const isStep4Valid = useMemo(() => selectedPlanId !== null, [selectedPlanId]);

  const isCurrentStepValid = useMemo(() => {
    switch (currentStep) {
      case 1: return isStep1Valid;
      case 2: return isStep2Valid;
      case 3: return isStep3Valid;
      case 4: return isStep4Valid;
      default: return false;
    }
  }, [currentStep, isStep1Valid, isStep2Valid, isStep3Valid, isStep4Valid]);

  /* ==========================================================================
     SUBMISSION
     ========================================================================== */

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !isStep1Valid || !isStep2Valid || !isStep3Valid || !isStep4Valid) {
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
      plan_id: selectedPlanId,
    };
    
    registerFacilityMutation.mutate(payload);
  }, [formData, user, isStep1Valid, isStep2Valid, isStep3Valid, isStep4Valid, selectedPlanId, registerFacilityMutation]);

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

  const completionPercentage = useMemo(() => {
    const step1Progress = isStep1Valid ? 25 : 0;
    const step2Progress = isStep2Valid ? 25 : 0;
    const step3Progress = isStep3Valid ? 25 : 0;
    const step4Progress = isStep4Valid ? 25 : 0;
    return step1Progress + (currentStep > 1 ? step2Progress : 0) + (currentStep > 2 ? step3Progress : 0) + (currentStep > 3 ? step4Progress : 0);
  }, [currentStep, isStep1Valid, isStep2Valid, isStep3Valid, isStep4Valid]);

  /* ==========================================================================
     MAIN RENDER
     ========================================================================== */

  return (
    <div className={cn(
      "min-h-screen flex flex-col relative",
      theme === 'dark' 
        ? "bg-linear-to-br from-slate-950 via-gray-900 to-slate-950" 
        : "bg-linear-to-br from-slate-50 via-white to-blue-50/40"
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
            "absolute -top-32 -right-32 w-150 h-150 rounded-full blur-3xl",
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
            "absolute -bottom-32 -left-32 w150 h-150 rounded-full blur-3xl",
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
              <LogoImage />
              <div>
              <BrandName></BrandName>
                <div className={cn(
                  "text-[9px] font-bold tracking-wider uppercase",
                  theme === 'dark' ? "text-slate-500" : "text-slate-500"
                )}>
                  Complete Your Facility Profile
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
                <ProgressIndicator 
                  currentStep={currentStep}
                  completionPercentage={completionPercentage}
                  theme={theme}
                />
                
                <form onSubmit={handleSubmit}>
                  <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                      <Step1Identity
                        formData={formData}
                        updateField={updateField}
                        theme={theme}
                      />
                    )}
                    {currentStep === 2 && (
                      <Step2Location
                        formData={formData}
                        updateField={updateField}
                        theme={theme}
                      />
                    )}
                    {currentStep === 3 && (
                      <Step3Services
                        formData={formData}
                        updateField={updateField}
                        toggleService={toggleService}
                        updateOperatingHours={updateOperatingHours}
                        applyToAllDays={applyToAllDays}
                        theme={theme}
                      />
                    )}
                    {currentStep === 4 && (
                      <PlanSelectionStep
                        selectedPlanId={selectedPlanId}
                        onSelectPlan={setSelectedPlanId}
                        theme={theme}
                      />
                    )}
                  </AnimatePresence>

                  {/* Compact Navigation */}
                 <div className="flex items-center justify-between pt-6 mt-6 border-t-2 border-slate-200 dark:border-slate-700">
                  {/* Back button - Always visible on all steps */}
                 <motion.button
                  type="button"
                   onClick={() => {
                    if (currentStep === 1) {
                      navigate(-1);
                    } else {
                      setCurrentStep(prev => (prev - 1) as 1 | 2 | 3 | 4);
                    }
                  }}
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02, x: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all border-2",
                    // Base cursor - pointer when enabled, not-allowed when disabled
                    !isSubmitting ? "cursor-pointer" : "cursor-not-allowed",
                    theme === 'dark'
                      ? currentStep === 1
                        ? "border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600" // Exit button style
                        : "border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600" // Back button style
                      : currentStep === 1
                        ? "border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400" // Exit button style
                        : "border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400", // Back button style
                    isSubmitting && "opacity-50"
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                  {currentStep === 1 ? 'Back' : 'Back'}
                </motion.button>
  
                  {/* Right side buttons */}
                  {currentStep < 4 ? (
                    <motion.button
                      type="button"
                      disabled={!isCurrentStepValid}
                      onClick={() => setCurrentStep(prev => (prev + 1) as 1 | 2 | 3 | 4)}
                      whileHover={isCurrentStepValid ? { scale: 1.02, x: 5 } : {}}
                      whileTap={isCurrentStepValid ? { scale: 0.98 } : {}}
                      className={cn(
                        "ml-auto flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-black transition-all shadow-lg cursor-pointer",
                        isCurrentStepValid
                          ? "bg-linear-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700 hover:shadow-xl"
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
                        "ml-auto flex items-center gap-2 px-8 py-3 rounded-lg font-black transition-all shadow-lg text-base cursor-pointer",
                        isCurrentStepValid && !isSubmitting
                          ? "bg-linear-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-700 hover:to-emerald-700 hover:shadow-xl"
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
              <SuccessScreen
                registerFacilityMutation={registerFacilityMutation}
                formData={formData}
                handleContinueToDashboard={handleContinueToDashboard}
                theme={theme}
              />
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
            © {new Date().getFullYear()} <BrandName/>. All data encrypted and protected.
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

export default Index;