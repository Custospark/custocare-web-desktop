/**
 * ============================================================================
 * PORTAL SELECTOR - COMPLETE REWRITE
 * ============================================================================
 * 
 * Fully integrated with activeContextSlice
 * ✅ Type-safe without 'any'
 * ✅ Proper Redux action dispatches
 * ✅ Staff without facility dashboard access
 * ✅ Clear self-service activation paths
 * ✅ Support for all user types
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ROUTES } from '../../routes/onboardingRouteConstants';
import {
  Heart,
  ArrowRight,
  Shield,
  Activity,
  FileText,
  Calendar,
  Briefcase,
  Sparkles,
  Sun,
  Moon,
  Plus,
  User,
  UserCog,
  CheckCircle,
  Inbox,
  Settings,
  Stethoscope,
} from 'lucide-react';
import { cn } from '../../../../../shared/types/cn';
import { useAppDispatch, useAppSelector } from '../../../../../app/store/hooks/useApp';
import { toggleTheme } from '../../../../../app/store/slices/uiSlice';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import { logout } from '../../../../../app/store/slices/authSlice';
import { 
  switchCapability,
  switchFacility,
  getRoleDisplayName,
  type FacilityRole,
} from '../../../../../app/store/slices/activeContextSlice';
import { containerVariants, cardVariants } from '../../../../../shared/components/animations/motionVariants';

/* Default images */
const DEFAULT_WORKSPACE_IMAGE = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop&q=80';
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&q=80';

/* Design system type */
interface DesignSystem {
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
    accent: string;
    background: string;
    card: string;
    cardHover: string;
    badge: string;
    warning: string;
    info: string;
  };
}

/* Greeting type */
interface Greeting {
  text: string;
  emoji: string;
}

/* Feature type for card items */
interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

export const PortalSelector: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const theme = useAppSelector((state) => state.ui.theme);
  const activeContext = useAppSelector((state) => state.activeContext);

  const {
    user,
    capabilities,
    facilityRoles,
    isPatient,
    isStaff,
    isStaffWithFacility,
    isStaffWithoutFacility,
    isPatientOnly,
  } = activeContext;

  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const designSystem: DesignSystem = useMemo(
    () => ({
      colors: {
        primary: theme === 'dark' ? 'text-white' : 'text-gray-900',
        secondary: theme === 'dark' ? 'text-gray-400' : 'text-gray-600',
        tertiary: theme === 'dark' ? 'text-gray-500' : 'text-gray-500',
        accent: theme === 'dark' ? 'text-blue-400' : 'text-blue-600',
        background: theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50',
        card: theme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
        cardHover:
          theme === 'dark'
            ? 'hover:bg-gray-800/80 hover:border-gray-700'
            : 'hover:bg-gray-50 hover:border-gray-300',
        badge:
          theme === 'dark'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200',
        warning:
          theme === 'dark'
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            : 'bg-amber-50 text-amber-700 border-amber-200',
        info:
          theme === 'dark'
            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            : 'bg-blue-50 text-blue-700 border-blue-200',
      },
    }),
    [theme]
  );

  /**
   * Handle workspace selection for staff with facility
   */
  const handleWorkspaceSelect = (facilityRole: FacilityRole): void => {
    // First switch to staff capability
    dispatch(switchCapability('staff'));
    
    // Then switch to specific facility
    dispatch(switchFacility(facilityRole.facility_id));

    // Navigate to staff dashboard
    navigate(ROUTES.STAFF_DASHBOARD, {
      state: {
        user,
        facilityRole,
        timestamp: new Date().toISOString(),
      },
    });

    showToast(
      'success',
      `Switched to ${facilityRole.facility_name || 'facility'} - ${getRoleDisplayName(facilityRole.role_code)}`,
      3000
    );
  };

  /**
   * Handle staff without facility dashboard access
   */
  const handleStaffWithoutFacilityDashboard = (): void => {
    // Switch to staff capability
    dispatch(switchCapability('staff'));

    // Navigate to staff dashboard
    navigate(ROUTES.STAFF_DASHBOARD, {
      state: {
        user,
        staffWithoutFacility: true,
        timestamp: new Date().toISOString(),
      },
    });

    showToast('info', 'Access your invitations and profile in the staff dashboard', 3000);
  };

  /**
   * Handle patient portal access
   */
  const handlePatientPortal = (): void => {
    // Switch to patient capability
    dispatch(switchCapability('patient'));

    // Navigate to patient dashboard
    navigate(ROUTES.PATIENT_DASHBOARD, {
      state: {
        user,
        timestamp: new Date().toISOString(),
      },
    });

    showToast('success', 'Welcome to your patient portal', 3000);
  };

  /**
   * Handle facility registration
   */
  const handleRegisterFacility = (): void => {
    navigate(ROUTES.HEALTHCARE_ONBOARDING);
  };

  /**
   * Handle patient portal activation
   */
  const handleActivatePatientPortal = (): void => {
    navigate(ROUTES.PATIENT_ONBOARDING);
  };

  /**
   * Handle medical staff registration
   */
  const handleRegisterAsMedicalStaff = (): void => {
    navigate(ROUTES.STAFF_ONBOARDING);
  };

  /**
   * Handle logout
   */
  const handleLogout = (): void => {
    dispatch(logout());
    showToast(
      'info',
      "You've been logged out successfully. Thank you for using Custocare AI — see you again soon!",
      5000
    );
    navigate(ROUTES.LANDING);
  };

  /**
   * Get time-based greeting
   */
  const getTimeGreeting = (): Greeting => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return {
        text: 'Good morning',
        emoji: '👋',
      };
    }

    if (hour < 18) {
      return {
        text: 'Good afternoon',
        emoji: '🤝',
      };
    }

    return {
      text: 'Good evening',
      emoji: '🙌',
    };
  };

  /**
   * Capitalize name
   */
  const capitalizeName = (name?: string): string => {
    if (!name) return 'User';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  /**
   * Render header
   */
  const renderHeader = () => (
    <header
      className={cn(
        'sticky top-0 z-50 border-b',
        theme === 'dark' ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'
      )}
    >
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                'bg-gradient-to-br from-blue-600 to-cyan-600'
              )}
            >
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className={cn('text-lg font-bold', designSystem.colors.primary)}>
              Custocare AI
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => dispatch(toggleTheme())}
              className={cn(
                'p-2 rounded-lg transition-all duration-200 cursor-pointer',
                theme === 'dark'
                  ? 'hover:bg-gray-800 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-600'
              )}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={handleLogout}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
                'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              Logout
            </button>

            <img
              src={DEFAULT_AVATAR}
              alt={user?.full_name || 'User'}
              className="w-9 h-9 rounded-full object-cover border-2 border-blue-500 shadow-sm"
            />
          </div>
        </div>
      </div>
    </header>
  );

  /**
   * Render welcome header
   */
  const renderWelcomeHeader = () => {
    const { text, emoji } = getTimeGreeting();
    const userName = user?.first_name || user?.full_name || 'User';

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <span className={designSystem.colors.primary}>{text}</span>
          <span className="text-emerald-500">{capitalizeName(userName)}</span>
          <span className="text-2xl leading-none">{emoji}</span>
        </h1>

        <p className={cn('text-base', designSystem.colors.secondary)}>
          {isStaffWithFacility && isPatient
            ? 'Select a professional workspace or access your personal patient portal.'
            : isStaffWithFacility
            ? 'Please select a workspace to continue.'
            : isStaffWithoutFacility
            ? 'Manage your invitations, profile, and register new facilities.'
            : isPatientOnly
            ? 'Access your personal health portal below.'
            : 'Please complete your account setup to get started.'}
        </p>
      </motion.div>
    );
  };

  /**
   * Render professional workspaces
   */
  const renderProfessionalWorkspaces = () => {
    if (!isStaff) return null;

    if (isStaffWithoutFacility) {
      const staffDashboardFeatures: Feature[] = [
        { icon: Inbox, label: 'Invitations' },
        { icon: Settings, label: 'Profile' },
        { icon: FileText, label: 'Credentials' },
      ];

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                'bg-blue-500/10'
              )}
            >
              <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className={cn('text-xl font-bold', designSystem.colors.primary)}>
              Professional Workspace
            </h2>
          </div>

          {/* Staff Dashboard Access Card */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'rounded-xl border p-8 mb-4',
              designSystem.colors.card,
              'shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer'
            )}
            onClick={handleStaffWithoutFacilityDashboard}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      'bg-gradient-to-br from-blue-500 to-cyan-500'
                    )}
                  >
                    <UserCog className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className={cn('text-lg font-bold', designSystem.colors.primary)}>
                      Staff Dashboard
                    </h3>
                    <p className={cn('text-sm', designSystem.colors.tertiary)}>
                      Manage invitations & profile
                    </p>
                  </div>
                </div>

                <p className={cn('text-sm mb-4', designSystem.colors.secondary)}>
                  Access your facility invitations, update your professional profile, and manage your
                  healthcare credentials.
                </p>

                <div className="flex flex-wrap gap-3">
                  {staffDashboardFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium',
                        theme === 'dark'
                          ? 'bg-gray-800 text-gray-300'
                          : 'bg-gray-100 text-gray-700'
                      )}
                    >
                      <feature.icon className="w-3.5 h-3.5" />
                      {feature.label}
                    </div>
                  ))}
                </div>
              </div>
                <button
                  type="button"
                  className={cn(
                    'px-6 py-3 rounded-lg font-medium text-sm',
                    'flex items-center gap-2 flex-shrink-0',
                    'transition-all duration-300',
                    
                    // Cursor
                    'cursor-pointer',

                    // Visuals
                    'bg-gradient-to-r from-blue-600 to-cyan-600 text-white',
                    'hover:from-blue-700 hover:to-cyan-700',
                    'transform hover:scale-105 shadow-md hover:shadow-lg'
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  Open Dashboard
                </button>

            </div>
          </motion.div>
        </motion.div>
      );
    }

    // Staff with facilities - render workspace cards
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="mb-12"
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              'bg-blue-500/10'
            )}
          >
            <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className={cn('text-xl font-bold', designSystem.colors.primary)}>
            Professional Workspaces
          </h2>
        </div>

        <div className="space-y-4">
          {facilityRoles.map((facilityRole) => {
            const cardKey = `${facilityRole.facility_id}-${facilityRole.role_code}`;
            
            return (
              <motion.div
                key={cardKey}
                variants={cardVariants}
                onHoverStart={() => setHoveredCard(cardKey)}
                onHoverEnd={() => setHoveredCard(null)}
                onClick={() => handleWorkspaceSelect(facilityRole)}
                className={cn(
                  'group relative rounded-xl border overflow-hidden cursor-pointer',
                  'transition-all duration-300',
                  designSystem.colors.card,
                  designSystem.colors.cardHover,
                  'shadow-sm hover:shadow-md'
                )}
              >
                <div className="flex flex-col sm:flex-row">
                  <div className="relative w-full sm:w-64 h-48 sm:h-auto overflow-hidden flex-shrink-0">
                    <img
                      src={DEFAULT_WORKSPACE_IMAGE}
                      alt={facilityRole.facility_name || `Facility ${facilityRole.facility_id}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div
                      className={cn(
                        'absolute inset-0',
                        theme === 'dark'
                          ? 'bg-gradient-to-r from-transparent to-gray-900/40'
                          : 'bg-gradient-to-r from-transparent to-white/40'
                      )}
                    />
                  </div>

                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={cn('text-lg font-bold', designSystem.colors.primary)}>
                            {facilityRole.facility_name || `Facility ${facilityRole.facility_id}`}
                          </h3>
                          <div
                            className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1',
                              designSystem.colors.badge,
                              'border'
                            )}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </div>
                          {facilityRole.is_primary_facility && (
                            <div
                              className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-medium',
                                'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              )}
                            >
                              Primary
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <span
                            className={cn(
                              'text-xs font-semibold uppercase tracking-wide',
                              'text-purple-600 dark:text-purple-400'
                            )}
                          >
                            {getRoleDisplayName(facilityRole.role_code)}
                          </span>
                        </div>

                        <p className={cn('text-sm mb-4', designSystem.colors.secondary)}>
                          Access your {getRoleDisplayName(facilityRole.role_code).toLowerCase()}{' '}
                          dashboard to manage patients, review clinical data, and coordinate care.
                        </p>
                      </div>
                      <button
                        className={cn(
                          'ml-4 px-5 py-2.5 rounded-lg font-medium text-sm',
                          'flex items-center gap-2 flex-shrink-0',
                          'transition-all duration-300',
                          'bg-blue-600 text-white hover:bg-blue-700',
                          'transform hover:scale-105 shadow-sm hover:shadow-md'
                        )}
                      >
                        Open Dashboard
                        <ArrowRight
                          className={cn(
                            'w-4 h-4 transition-transform duration-300',
                            hoveredCard === cardKey && 'translate-x-1'
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  /**
   * Render personal access section
   */
  const renderPersonalAccess = () => {
    const patientFeatures: Feature[] = [
      { icon: FileText, label: 'Test Results' },
      { icon: Calendar, label: 'Appointments' },
      { icon: Activity, label: 'Health Records' },
    ];

    if (!isPatient) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                'bg-purple-500/10'
              )}
            >
              <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className={cn('text-xl font-bold', designSystem.colors.primary)}>
              Personal Access
            </h2>
          </div>

          <div
            className={cn(
              'rounded-xl border p-8',
              designSystem.colors.card,
              'shadow-sm'
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                  'bg-purple-500/10'
                )}
              >
                <Heart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className={cn('text-lg font-bold mb-2', designSystem.colors.primary)}>
                  Activate Patient Portal
                </h3>
                <p className={cn('text-sm mb-4', designSystem.colors.secondary)}>
                  Access your personal health records, appointments, test results, and billing information
                  by activating your patient portal.
                </p>
                
                <div className="flex flex-wrap gap-3">
                 <button
                  type="button"
                  onClick={handleActivatePatientPortal}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium flex-shrink-0',

                    // Cursor behavior
                    'cursor-pointer disabled:cursor-not-allowed disabled:opacity-60',

                    // Visual weight
                    'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
                    'hover:from-purple-700 hover:to-pink-700',

                    // Motion
                    'transition-all duration-200'
                  )}
                >
                  <CheckCircle className="w-4 h-4" />
                  Activate Patient Portal
                </button>
                  {!isStaff && (
                  <button
                      type="button"
                      onClick={handleRegisterAsMedicalStaff}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium flex-shrink-0',

                        // Cursor behavior
                        'cursor-pointer disabled:cursor-not-allowed disabled:opacity-60',

                        // Visuals
                        'bg-gradient-to-r from-blue-600 to-cyan-600 text-white',
                        'hover:from-blue-700 hover:to-cyan-700',

                        // Motion
                        'transition-all duration-200'
                      )}
                    >
                      <Stethoscope className="w-4 h-4" />
                      Register as Medical Staff
                    </button>

                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mb-12"
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              'bg-purple-500/10'
            )}
          >
            <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className={cn('text-xl font-bold', designSystem.colors.primary)}>
            Personal Access
          </h2>
        </div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'rounded-xl border p-8',
            designSystem.colors.card,
            'shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer'
          )}
          onClick={handlePatientPortal}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    'bg-gradient-to-br from-purple-500 to-pink-500'
                  )}
                >
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className={cn('text-lg font-bold', designSystem.colors.primary)}>
                    My Patient Portal
                  </h3>
                  <p className={cn('text-sm', designSystem.colors.tertiary)}>
                    View your personal health records
                  </p>
                </div>
              </div>

              <p className={cn('text-sm mb-4', designSystem.colors.secondary)}>
                Access your test results, appointments, medical history, and billing information.
              </p>

              {capabilities.patient && (
                <div className="flex items-center gap-2 mb-4">
                  <span className={cn('text-xs font-medium', designSystem.colors.tertiary)}>
                    Patient Number:
                  </span>
                  <span className={cn('text-xs font-mono', designSystem.colors.secondary)}>
                    {capabilities.patient.patient_uuid}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {patientFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium',
                      theme === 'dark'
                        ? 'bg-gray-800 text-gray-300'
                        : 'bg-gray-100 text-gray-700'
                    )}
                  >
                    <feature.icon className="w-3.5 h-3.5" />
                    {feature.label}
                  </div>
                ))}
              </div>
            </div>

            <button
              className={cn(
                'px-6 py-3 rounded-lg font-medium text-sm',
                'flex items-center gap-2 flex-shrink-0',
                'transition-all duration-300',
                'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
                'hover:from-purple-700 hover:to-pink-700',
                'transform hover:scale-105 shadow-md hover:shadow-lg'
              )}
            >
              <Sparkles className="w-4 h-4" />
              View My Health
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  /**
   * Render footer actions
   */
  const renderFooterActions = ()=> (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="flex flex-wrap items-center gap-4 pb-8"
    >
      <button
        onClick={handleRegisterFacility}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer',
          'transition-all duration-200',
          theme === 'dark'
            ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        )}
      >
        <Plus className="w-4 h-4" />
        Register New Facility
      </button>

      {!isPatient && (
        <button
          onClick={handleActivatePatientPortal}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer',
            'transition-all duration-200',
            theme === 'dark'
              ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          )}
        >
          <Heart className="w-4 h-4" />
          Activate Patient Portal
        </button>
      )}

      {!isStaff && (
        <button
          onClick={handleRegisterAsMedicalStaff}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer',
            'transition-all duration-200',
            theme === 'dark'
              ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          )}
        >
          <Stethoscope className="w-4 h-4" />
          Register as Medical Staff
        </button>
      )}

      <div className="ml-auto text-xs text-gray-500 dark:text-gray-600">
        © {new Date().getFullYear()} Custocare AI. All rights reserved.
      </div>
    </motion.div>
  );

  return (
    <div className={cn('min-h-screen', designSystem.colors.background)}>
      {renderHeader()}

      <main className="max-w-6xl mx-auto px-6 py-8">
        {renderWelcomeHeader()}
        {renderProfessionalWorkspaces()}
        {renderPersonalAccess()}
        {renderFooterActions()}
      </main>
    </div>
  );
};

export default PortalSelector;