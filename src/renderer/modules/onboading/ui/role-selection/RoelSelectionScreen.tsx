/**
 * ============================================================================
 * ROLE SELECTION - MODERNIZED ONBOARDING
 * ============================================================================
 * 
 * Clean, conversion-focused role selection screen.
 * Removes unnecessary elements and focuses on fast decision-making.
 * 
 * Key Features:
 * - Single-screen focus (no distracting sidebars)
 * - Clear role differentiation with visual hierarchy
 * - Progressive disclosure of features
 * - Mobile-optimized card layout
 * - Smooth transitions without overdoing animations
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Stethoscope, 
  User, 
  Check,
  ArrowRight,
  Shield,
  Moon,
  Sun,
  ChevronDown
} from 'lucide-react';
import { cn } from '../../../../shared/types/cn';

import { useAppDispatch, useAppSelector } from '../../../../app/store/hooks/useApp';
import { toggleTheme } from '../../../../app/store/slices/uiSlice';

import { motion, AnimatePresence } from 'framer-motion';

/* ==========================================================================
   TYPE DEFINITIONS
   ========================================================================== */

interface RoleOption {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  features: string[];
  targetAudience: string;
}

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */

export const RoleSelection: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useAppSelector((state) => state.ui.theme);

  /* State Management */
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  /* Role Options Configuration */
  const roleOptions: RoleOption[] = useMemo(() => [
    {
      id: 'facility-owner',
      title: 'Facility Owner',
      subtitle: 'Manage Your Practice',
      description: 'Full administrative control for clinic and hospital owners',
      icon: Building2,
      gradient: 'from-emerald-500 to-teal-600',
      features: [
        'Multi-facility dashboard',
        'Staff & resource management',
        'Financial reporting & analytics',
        'Compliance monitoring'
      ],
      targetAudience: 'Clinic owners, hospital administrators, practice managers'
    },
    {
      id: 'medical-professional',
      title: 'Medical Professional',
      subtitle: 'Deliver Better Care',
      description: 'Clinical tools designed for healthcare providers',
      icon: Stethoscope,
      gradient: 'from-blue-500 to-indigo-600',
      features: [
        'Patient records & history',
        'AI-assisted diagnostics',
        'Treatment planning tools',
        'Secure team collaboration'
      ],
      targetAudience: 'Doctors, nurses, therapists, medical assistants'
    },
    {
      id: 'patient',
      title: 'Patient',
      subtitle: 'Take Control of Your Health',
      description: 'Easy access to care and health management',
      icon: User,
      gradient: 'from-purple-500 to-pink-600',
      features: [
        'Book & manage appointments',
        'Access medical records',
        'Secure messaging with providers',
        'Health tracking & reminders'
      ],
      targetAudience: 'Individuals seeking healthcare services'
    }
  ], []);

  /* Event Handlers */
  const handleRoleSelect = useCallback((roleId: string) => {
    setSelectedRole(roleId);
    setExpandedRole(null);
    
    // Smooth scroll to continue button on mobile
    if (window.innerWidth < 768) {
      setTimeout(() => {
        document.getElementById('continue-section')?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        });
      }, 300);
    }
  }, []);

  const toggleExpand = useCallback((roleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRole(expandedRole === roleId ? null : roleId);
  }, [expandedRole]);

  const handleContinue = useCallback(() => {
    if (!selectedRole) return;
    
    setIsTransitioning(true);
    
    // Simulate API call
    setTimeout(() => {
      navigate(`/onboarding/${selectedRole}`, {
        state: { role: selectedRole }
      });
    }, 400);
  }, [selectedRole, navigate]);

  const selectedRoleData = useMemo(
    () => roleOptions.find(role => role.id === selectedRole),
    [selectedRole, roleOptions]
  );

  /* ==========================================================================
     RENDER
     ========================================================================== */

  return (
    <div className={cn(
      'min-h-screen flex flex-col',
      theme === 'dark'
        ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950'
        : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50'
    )}>
      {/* Simplified Header */}
      <header className="w-full px-4 py-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              'bg-gradient-to-br from-blue-600 to-cyan-600'
            )}>
              <div className="w-4 h-4 border-2 border-white rounded-full" />
            </div>
            <div>
              <span className={cn(
                'text-lg font-bold',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                CustoCare AI
              </span>
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => dispatch(toggleTheme())}
            className={cn(
              'p-2 rounded-lg transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              theme === 'dark'
                ? 'bg-gray-800 text-amber-400 hover:bg-gray-700'
                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
            )}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-1 rounded-full bg-blue-600" />
              <div className="w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
              <div className="w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>
            <p className={cn(
              'text-center text-sm font-medium',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              Step 1 of 3
            </p>
          </div>

          {/* Header Section */}
          <div className="text-center mb-12">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'text-3xl sm:text-4xl lg:text-5xl font-bold mb-4',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}
            >
              How will you use CustoCare?
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={cn(
                'text-lg sm:text-xl max-w-2xl mx-auto',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}
            >
              Choose your role to personalize your experience
            </motion.p>
          </div>

          {/* Role Cards */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            {roleOptions.map((role, index) => {
              const isSelected = selectedRole === role.id;
              const isExpanded = expandedRole === role.id;
              const Icon = role.icon;

              return (
                <motion.button
                  key={role.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  onClick={() => handleRoleSelect(role.id)}
                  className={cn(
                    'relative p-6 rounded-2xl border-2 text-left transition-all duration-300',
                    'focus:outline-none focus:ring-4',
                    'group',
                    isSelected
                      ? theme === 'dark'
                        ? 'bg-gray-800 border-blue-500 shadow-lg shadow-blue-500/20 focus:ring-blue-500/30'
                        : 'bg-white border-blue-600 shadow-lg shadow-blue-600/20 focus:ring-blue-600/30'
                      : theme === 'dark'
                        ? 'bg-gray-900/50 border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 focus:ring-gray-600/30'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md focus:ring-gray-300'
                  )}
                  aria-pressed={isSelected}
                >
                  {/* Selection Indicator */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute top-4 right-4 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Icon */}
                  <div className={cn(
                    'w-14 h-14 rounded-xl mb-4 flex items-center justify-center',
                    'bg-gradient-to-br transition-transform duration-300',
                    role.gradient,
                    'group-hover:scale-110'
                  )}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className={cn(
                    'text-xl font-bold mb-1',
                    isSelected
                      ? theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
                      : theme === 'dark' ? 'text-white' : 'text-gray-900'
                  )}>
                    {role.title}
                  </h3>
                  
                  <p className={cn(
                    'text-sm font-medium mb-3',
                    isSelected
                      ? theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                      : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    {role.subtitle}
                  </p>

                  {/* Description */}
                  <p className={cn(
                    'text-sm mb-4 leading-relaxed',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    {role.description}
                  </p>

                  {/* Expand Button */}
                  <button
                    onClick={(e) => toggleExpand(role.id, e)}
                    className={cn(
                      'flex items-center gap-2 text-sm font-medium transition-colors',
                      'focus:outline-none',
                      theme === 'dark'
                        ? 'text-cyan-400 hover:text-cyan-300'
                        : 'text-blue-600 hover:text-blue-700'
                    )}
                  >
                    {isExpanded ? 'Hide' : 'Show'} features
                    <ChevronDown className={cn(
                      'w-4 h-4 transition-transform',
                      isExpanded && 'rotate-180'
                    )} />
                  </button>

                  {/* Expanded Features */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <ul className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                          {role.features.map((feature, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm"
                            >
                              <Check className={cn(
                                'w-4 h-4 flex-shrink-0 mt-0.5',
                                theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
                              )} />
                              <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                        
                        <p className={cn(
                          'mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs',
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                        )}>
                          <strong>Perfect for:</strong> {role.targetAudience}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Continue Section */}
          <div id="continue-section" className="text-center mb-12">
            <AnimatePresence mode="wait">
              {selectedRole ? (
                <motion.div
                  key="continue-button"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <button
                    onClick={handleContinue}
                    disabled={isTransitioning}
                    className={cn(
                      'inline-flex items-center justify-center gap-3',
                      'px-8 py-4 rounded-xl font-semibold text-lg',
                      'bg-gradient-to-r from-blue-600 to-cyan-600',
                      'text-white shadow-lg',
                      'transition-all duration-300',
                      'hover:from-blue-700 hover:to-cyan-700 hover:shadow-xl hover:scale-105',
                      'focus:outline-none focus:ring-4 focus:ring-blue-500/50',
                      'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                    )}
                  >
                    {isTransitioning ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        Continue as {selectedRoleData?.title}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                  
                  <p className={cn(
                    'mt-4 text-sm',
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                  )}>
                    You can change this later in settings
                  </p>
                </motion.div>
              ) : (
                <motion.p
                  key="select-prompt"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    'text-sm',
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                  )}
                >
                  Select a role above to continue
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="border-t border-gray-200 dark:border-gray-800 pt-8"
          >
            <div className="flex flex-wrap items-center justify-center gap-6">
              {[
                { icon: Shield, label: 'HIPAA Compliant' },
                { icon: Shield, label: 'SOC 2 Certified' },
                { icon: Shield, label: 'End-to-End Encrypted' }
              ].map((badge, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm"
                >
                  <badge.icon className={cn(
                    'w-4 h-4',
                    theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                  )} />
                  <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/90 backdrop-blur-sm"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full mx-auto mb-4"
              />
              <p className="text-white text-lg font-medium">
                Preparing your workspace...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoleSelection;
