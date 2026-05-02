/**
 * ============================================================================
 * SIMPLIFIED ROLE SELECTION - STREAMLINED ONBOARDING EXPERIENCE
 * ============================================================================
 * 
 * DESIGN PHILOSOPHY: Fast, Focused, Frictionless
 * 
 * KEY PRINCIPLES:
 * 1. ✅ User already signed up - minimize friction
 * 2. ✅ Single decision point - choose role
 * 3. ✅ Clear visual feedback on selection
 * 4. ✅ Consistent with landing page design
 * 5. ✅ Mobile-first responsive design
 * 6. ✅ Accessible and keyboard-friendly
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  // Heart,
  Stethoscope,
  Building2,
  ArrowRight,
  CheckCircle2,
  Sun,
  Moon,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '../../../../../shared/types/cn';
import { useAppDispatch, useAppSelector } from  '../../../../../app/store/hooks/useApp';
import { toggleTheme } from '../../../../../app/store/slices/uiSlice';
import { ROUTES } from '../../routes/onboardingRouteConstants';
import { itemVariants, containerVariants } from  '../../../../../shared/components/animations/motionVariants';
import LogoImage from '../../../../../shared/assets/LogoImage';
import { BrandName } from '../../../../../shared/utils/BrandName';

/* ==========================================================================
   ROLE DATA - SIMPLIFIED
   ========================================================================== */
const ROLES = [
  {
    id: 'medical-professional',
    title: 'Care Team Member',
    subtitle: 'Pharmacists, Doctors, Nurses & Allied Health Professionals',
    description:
      'Deliver continuous, coordinated care with real-time patient context and streamlined clinical workflows.',
    icon: Stethoscope,
    gradient: 'from-blue-600 to-cyan-600',
    route: ROUTES.STAFF_ONBOARDING,
    benefits: [
      'Unified patient visit history',
      'Clear task and workflow visibility',
      'Reduced administrative burden'
    ]
  },
  // {
  //   id: 'patient',
  //   title: 'Patient',
  //   subtitle: 'Individuals Receiving Care',
  //   description:
  //     'Experience seamless, coordinated care across visits, departments, and healthcare facilities.',
  //   icon: Heart,
  //   gradient: 'from-emerald-600 to-teal-600',
  //   route: ROUTES.PATIENT_ONBOARDING,
  //   benefits: [
  //     'Continuity of care across facilities',
  //     'Accurate, centralized health records',
  //     'Safer, more coordinated care'
  //   ]
  // },
  {
    id: 'facility-owner',
    title: 'Healthcare Facility',
    subtitle: 'Clinics, Pharmacies, Hospitals & Health Organizations',
    description:
      'Run efficient, connected healthcare operations with full visibility across care delivery and facility workflows.',
    icon: Building2,
    gradient: 'from-purple-600 to-pink-600',
    route: ROUTES.HEALTHCARE_ONBOARDING,
    benefits: [
      'Clinical Excellence across departments',
      'Real-time facility performance insights',
      'Scalable, audit-ready healthcare operations'
    ]
  }
];

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */
export const RoleSelection: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useAppSelector((state) => state.ui.theme);
  
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  const selectedRoleData = ROLES.find(role => role.id === selectedRole);

  const handleContinue = () => {
    if (selectedRoleData) {
      navigate(selectedRoleData.route);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const { user } = useAppSelector((state) => state.auth);
  const loggedInUserName = user?.profile.first_name;

  return (
    <div className={cn(
      "min-h-screen flex flex-col relative",
      theme === 'dark' 
        ? "bg-linear-to-br from-slate-950 via-gray-900 to-slate-950" 
        : "bg-linear-to-br from-slate-50 via-white to-blue-50/40"
    )}>
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
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
        "sticky top-0 z-50 border-b backdrop-blur-xl transition-all",
        theme === 'dark' 
          ? "bg-slate-900/75 border-slate-800/60" 
          : "bg-white/75 border-slate-200/60"
      )}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Back Button */}
            <div className="flex items-center gap-4">
              {/* Back Button */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.05, x: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGoBack}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all border-2 cursor-pointer",
                  theme === 'dark'
                    ? 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700/60 hover:border-slate-600'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:border-slate-300'
                )}
                aria-label="Go back"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Back</span>
              </motion.button>

              {/* Logo */}
              <LogoImage />
              <div>
                <div className="text-xl font-bold tracking-tight bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  <BrandName></BrandName>
                </div>
                <div className={cn(
                  "text-[11px] font-semibold tracking-wide uppercase",
                  theme === 'dark' ? "text-slate-500" : "text-slate-500"
                )}>
                 Complete Your Profile
                </div>
              </div>
            </div>

            {/* Theme Toggle */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => dispatch(toggleTheme())}
              className={cn(
                "p-3 rounded-xl transition-all duration-300 border-2 shadow-sm cursor-pointer",
                theme === 'dark'
                  ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-amber-300'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
              )}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-2 py-2 relative z-10">
        <div className="w-full max-w-6xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Header Section */}
            <motion.div variants={itemVariants} className="text-center space-y-2">
              <h1
                className={cn(
                  "text-3xl sm:text-4xl font-semibold tracking-tight",
                  theme === 'dark' ? "text-white" : "text-slate-900"
                )}
              >
                Hi{" "}
                <span
                  className={cn(
                    "font-medium",
                    theme === 'dark' ? "text-indigo-300" : "text-indigo-600"
                  )}
                >
                  {loggedInUserName}
                </span>
                , select your role to continue...
              </h1>
            </motion.div>

            {/* ✅ Role Cards — column count driven by ROLES.length:
                  1 role  → single centered column
                  2 roles → 2-col centered (max-w-3xl mx-auto)
                  3 roles → full 3-col grid (uncomment Patient to restore) */}
            <motion.div
              variants={containerVariants}
              className={cn(
                "grid gap-6",
                ROLES.length === 1
                  ? "grid-cols-1 max-w-sm mx-auto"
                  : ROLES.length === 2
                  ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto"
                  : "grid-cols-1 md:grid-cols-3"
              )}
            >
              {ROLES.map((role) => {
                const isSelected = selectedRole === role.id;
                const isHovered = hoveredRole === role.id;
                const Icon = role.icon;

                return (
                  <motion.button
                    key={role.id}
                    variants={itemVariants}
                    onClick={() => setSelectedRole(role.id)}
                    onMouseEnter={() => setHoveredRole(role.id)}
                    onMouseLeave={() => setHoveredRole(null)}
                    whileHover={{ scale: 1.03, y: -6 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative p-8 rounded-3xl border-2 transition-all duration-300 text-left cursor-pointer focus:outline-none focus:ring-4",
                      isSelected
                        ? "border-transparent shadow-2xl"
                        : theme === 'dark'
                        ? "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/60 hover:border-slate-600 hover:shadow-xl focus:ring-blue-500/50"
                        : "bg-white/80 border-slate-200 hover:bg-white hover:shadow-2xl hover:border-slate-300 focus:ring-blue-400/50"
                    )}
                    style={
                      isSelected || isHovered
                        ? {
                            background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                            backgroundImage: `linear-gradient(135deg, ${
                              theme === 'dark'
                                ? 'rgba(30, 41, 59, 0.95)'
                                : 'rgba(255, 255, 255, 0.95)'
                            } 0%, ${
                              theme === 'dark'
                                ? 'rgba(30, 41, 59, 0.95)'
                                : 'rgba(255, 255, 255, 0.95)'
                            } 100%)`
                          }
                        : undefined
                    }
                  >
                    {/* Selection Indicator */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute -top-3 -right-3 z-10"
                        >
                          <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center ring-4 ring-white/20">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600" strokeWidth={2.5} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Icon */}
                    <motion.div
                      animate={{ 
                        scale: isSelected || isHovered ? 1.1 : 1,
                        rotate: isHovered ? [0, -5, 5, 0] : 0
                      }}
                      className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg",
                        `bg-gradient-to-br ${role.gradient}`
                      )}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </motion.div>

                    {/* Content */}
                    <div className="space-y-2">
                      <div>
                        <h3 className={cn(
                          "text-2xl font-bold mb-2",
                          theme === 'dark' ? "text-white" : "text-slate-900"
                        )}>
                          {role.title}
                        </h3>
                        <p className={cn(
                          "text-sm font-medium mb-3",
                          theme === 'dark' ? "text-slate-400" : "text-slate-600"
                        )}>
                          {role.subtitle}
                        </p>
                        <p className={cn(
                          "text-sm leading-relaxed",
                          theme === 'dark' ? "text-slate-300" : "text-slate-700"
                        )}>
                          {role.description}
                        </p>
                      </div>

                      {/* Key Benefits */}
                      <div className="space-y-2 pt-2">
                        {role.benefits.map((benefit, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className={cn(
                              "text-sm font-medium",
                              theme === 'dark' ? "text-slate-300" : "text-slate-700"
                            )}>
                              {benefit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Select Button */}
                    <div className="mt-6">
                      <div className={cn(
                        "w-full py-3 px-4 rounded-xl font-semibold text-sm text-center transition-all",
                        isSelected
                          ? `bg-gradient-to-r ${role.gradient} text-white shadow-lg`
                          : theme === 'dark'
                          ? "bg-slate-700/50 text-slate-300 border border-slate-600"
                          : "bg-slate-100 text-slate-700 border border-slate-300"
                      )}>
                        {isSelected ? 'Selected' : 'Select'}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Continue Button */}
            <AnimatePresence>
              {selectedRole && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="flex justify-center pt-1"
                >
                  <motion.button
                    onClick={handleContinue}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-lg shadow-2xl cursor-pointer transition-all focus:outline-none focus:ring-4",
                      selectedRoleData
                        ? `bg-gradient-to-r ${selectedRoleData.gradient} text-white hover:shadow-3xl focus:ring-blue-500/50`
                        : "bg-slate-400 text-white cursor-not-allowed"
                    )}
                  >
                    Proceed as {selectedRoleData?.title}
                    <ArrowRight className="w-6 h-6" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default RoleSelection;
