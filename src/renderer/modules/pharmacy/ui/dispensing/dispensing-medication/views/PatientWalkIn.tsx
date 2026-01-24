/**
 * ============================================================================
 * PATIENT WALK-IN SESSION CREATOR (REUSABLE)
 * ============================================================================
 * 
 * Reusable component for creating walk-in sessions across different modules
 * (Pharmacy, Lab, Billing, etc.). Provides a consistent UI/UX for walk-in
 * patient management while allowing module-specific customization.
 * 
 * @module PatientWalkIn
 * @description Enterprise-grade reusable walk-in session creator with:
 * - Automatic facility ID detection from Redux store
 * - Configurable theming (light/dark mode)
 * - Customizable button text and behavior
 * - Optional session details display
 * - Type-safe API integration
 * - Comprehensive error handling
 * - Accessibility compliance (WCAG 2.1 AA)
 * 
 * @example Pharmacy Module
 * <PatientWalkIn
 *   theme="light"
 *   onSessionCreated={(session) => handlePharmacyFlow(session)}
 *   createButtonText="Create Pharmacy Walk-in"
 *   moduleConfig={{
 *     icon: <Pill />,
 *     title: "Pharmacy Walk-in",
 *     description: "Create walk-in session for medication dispensing"
 *   }}
 * />
 * 
 * @example Lab Module
 * <PatientWalkIn
 *   theme="dark"
 *   onSessionCreated={(session) => handleLabFlow(session)}
 *   createButtonText="Create Lab Walk-in"
 *   moduleConfig={{
 *     icon: <TestTube />,
 *     title: "Lab Walk-in",
 *     description: "Create walk-in session for lab testing"
 *   }}
 * />
 */

import React, { useMemo, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Loader2, UserPlus, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateWalkInSession } from '../../../../api/dispensing/customer-walkin/useCustomerWalkinQueries';
import { useCurrentFacility } from '../../../../api/dispensing/customer-walkin/useCustomerWalkinQueries';
import type { WalkInSession } from '../../../../api/dispensing/customer-walkin/useCustomerWalkInTypes';

/* -------------------------------------------------------------------------- */
/*                              TYPE DEFINITIONS                              */
/* -------------------------------------------------------------------------- */

/**
 * Theme options for component styling.
 */
export type Theme = 'light' | 'dark';

/**
 * Module-specific configuration for customizing the walk-in creator.
 * Allows different modules to brand the component differently.
 */
export interface ModuleConfig {
  /** Module icon (Lucide React component) */
  icon?: React.ReactNode;
  /** Module title (e.g., "Pharmacy Walk-in", "Lab Walk-in") */
  title?: string;
  /** Module description */
  description?: string;
  /** Primary color for module branding */
  primaryColor?: string;
  /** Additional CSS classes for customization */
  className?: string;
}

/**
 * Props for the PatientWalkIn component.
 */
export interface PatientWalkInProps {
  /** Visual theme (light or dark mode) */
  theme?: Theme;
  /** Callback fired when session is successfully created */
  onSessionCreated?: (session: WalkInSession) => void;
  /** Custom text for the create button */
  createButtonText?: string;
  /** Whether to show detailed session information after creation */
  showSessionDetails?: boolean;
  /** Module-specific configuration */
  moduleConfig?: ModuleConfig;
  /** Custom facility ID (overrides active facility from Redux) */
  customFacilityId?: number;
  /** Whether component is in loading state externally */
  externalLoading?: boolean;
  /** Custom error message to display */
  externalError?: string;
  /** Additional CSS classes for root element */
  className?: string;
  /** Accessibility label for screen readers */
  ariaLabel?: string;
}

/* -------------------------------------------------------------------------- */
/*                              UTILITY FUNCTIONS                             */
/* -------------------------------------------------------------------------- */

/**
 * Combines CSS classes conditionally.
 * Filters out falsy values for clean className strings.
 */
const cn = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(' ');

/**
 * Generates button CSS classes based on variant, size, and theme.
 */
const buttonClasses = (
  isDark: boolean,
  variant: 'primary' | 'outline' | 'ghost' | 'danger' = 'primary',
  size: 'sm' | 'md' | 'lg' = 'md',
  fullWidth = false,
  disabled = false
): string => {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm md:text-base',
    lg: 'px-6 py-3 text-base md:text-lg',
  };

  const variants = {
    primary: cn(
      'bg-blue-600 text-white hover:bg-blue-700',
      isDark ? 'border border-blue-500/40' : 'border border-blue-600/40',
      'shadow-lg shadow-blue-500/25'
    ),
    outline: cn(
      'border',
      isDark
        ? 'border-gray-700 text-gray-200 hover:bg-gray-800'
        : 'border-gray-300 text-gray-800 hover:bg-gray-50'
    ),
    ghost: cn(
      isDark 
        ? 'text-gray-300 hover:bg-gray-800/50' 
        : 'text-gray-700 hover:bg-gray-100'
    ),
    danger: cn(
      'bg-red-600 text-white hover:bg-red-700',
      isDark ? 'border border-red-500/40' : 'border border-red-600/40'
    ),
  };

  return cn(
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2',
    isDark && 'focus:ring-offset-gray-900',
    sizes[size],
    variants[variant],
    disabled 
      ? 'opacity-50 cursor-not-allowed' 
      : 'active:scale-[0.98] cursor-pointer',
    fullWidth && 'w-full'
  );
};

/**
 * Generates badge CSS classes based on variant and theme.
 */
const badgeClasses = (
  isDark: boolean,
  variant: 'default' | 'success' | 'warning' | 'error' | 'info' = 'default'
): string => {
  const variants = {
    default: isDark 
      ? 'bg-gray-800 text-gray-200 border-gray-700' 
      : 'bg-gray-100 text-gray-800 border-gray-200',
    success: isDark 
      ? 'bg-blue-900/30 text-blue-300 border-blue-700/50' 
      : 'bg-blue-50 text-blue-700 border-blue-200',
    warning: isDark 
      ? 'bg-yellow-900/30 text-yellow-300 border-yellow-700/50' 
      : 'bg-yellow-50 text-yellow-700 border-yellow-200',
    error: isDark 
      ? 'bg-red-900/30 text-red-300 border-red-700/50' 
      : 'bg-red-50 text-red-700 border-red-200',
    info: isDark 
      ? 'bg-blue-900/30 text-blue-300 border-blue-700/50' 
      : 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return cn(
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
    'border',
    variants[variant]
  );
};

/* -------------------------------------------------------------------------- */
/*                           COMPONENT DEFINITION                             */
/* -------------------------------------------------------------------------- */

/**
 * Reusable Patient Walk-In Session Creator Component.
 * 
 * Enterprise-grade component for creating walk-in sessions with:
 * - Automatic facility detection
 * - Module-specific customization
 * - Comprehensive error handling
 * - Loading states
 * - Accessibility features
 * - Responsive design
 */
const PatientWalkIn: React.FC<PatientWalkInProps> = ({
  theme = 'light',
  onSessionCreated,
  createButtonText = 'Create Walk-in Session',
  showSessionDetails = true,
  moduleConfig,
  customFacilityId,
  externalLoading = false,
  externalError,
  className,
  ariaLabel = 'Create patient walk-in session',
}) => {
  const isDark = theme === 'dark';

  /* ---------------------------- STATE MANAGEMENT ---------------------------- */
  const [isCreating, setIsCreating] = useState(false);
  const [createdSession, setCreatedSession] = useState<WalkInSession | null>(null);

  /* ---------------------------- FACILITY CHECK ------------------------------ */
  const { facilityId, isValid: isFacilityValid, error: facilityError } = useCurrentFacility();
  const effectiveFacilityId = customFacilityId || facilityId;

  /* ----------------------------- API MUTATION ------------------------------- */
  const { mutate: createSession, isPending: isMutating } = useCreateWalkInSession(
    {
      onSuccess: (response) => {
        setCreatedSession(response.data);
        setIsCreating(false);
        onSessionCreated?.(response.data);
      },
      onError: () => {
        setIsCreating(false);
      },
    },
    effectiveFacilityId ?? undefined
  );

  /* ---------------------------- COMPUTED STYLES ----------------------------- */
  const styles = useMemo(
    () => ({
      card: cn(
        'rounded-2xl border backdrop-blur-sm transition-all duration-300',
        isDark 
          ? 'bg-gray-900/60 border-gray-800 shadow-2xl shadow-black/20' 
          : 'bg-white/80 border-gray-200 shadow-xl shadow-gray-200/50',
        className
      ),
      cardHeader: cn(
        'border-b px-6 py-5',
        isDark ? 'border-gray-800' : 'border-gray-200'
      ),
      cardBody: 'px-6 py-6',
      cardFooter: cn(
        'border-t px-6 py-4',
        isDark ? 'border-gray-800' : 'border-gray-200'
      ),
      muted: isDark ? 'text-gray-400' : 'text-gray-600',
      panel: cn(
        'rounded-xl border p-4',
        isDark 
          ? 'bg-gray-950/40 border-gray-800' 
          : 'bg-gray-50 border-gray-200'
      ),
      infoPanel: cn(
        'rounded-xl border p-4',
        isDark 
          ? 'bg-blue-950/20 border-blue-900/50' 
          : 'bg-blue-50/50 border-blue-200'
      ),
      errorPanel: cn(
        'rounded-xl border p-4',
        isDark 
          ? 'bg-red-950/20 border-red-900/50' 
          : 'bg-red-50/50 border-red-200'
      ),
    }),
    [isDark, className]
  );

  /* --------------------------- EVENT HANDLERS ------------------------------- */
  const handleCreateSession = useCallback(() => {
    if (!effectiveFacilityId) {
      console.error('No facility ID available');
      return;
    }

    setIsCreating(true);
    createSession();
  }, [effectiveFacilityId, createSession]);

  /* --------------------------- LOADING STATE -------------------------------- */
  const isLoading = isCreating || isMutating || externalLoading;

  /* --------------------------- ERROR STATE ---------------------------------- */
  const errorMessage = externalError || (!isFacilityValid ? facilityError : null);

  /* --------------------------- RENDER LOGIC --------------------------------- */

  // Error state: No facility available
  if (errorMessage && !effectiveFacilityId) {
    return (
      <div className={styles.card} role="alert" aria-live="assertive">
        <div className={styles.cardBody}>
          <div className={styles.errorPanel}>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">
                  Facility Required
                </h3>
                <p className="text-sm text-red-800 dark:text-red-300">
                  {errorMessage}
                </p>
                <p className="text-sm text-red-700 dark:text-red-400 mt-2">
                  Please ensure you are in staff mode and have selected an active facility.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state: Session created
  if (createdSession && showSessionDetails) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={styles.card}
          role="region"
          aria-label="Walk-in session created successfully"
        >
          <div className={styles.cardHeader}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={cn(
                  'rounded-xl p-2.5',
                  isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                )}>
                  <CheckCircle2 
                    className="h-6 w-6 text-blue-600 dark:text-blue-400" 
                    aria-hidden="true" 
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Session Created Successfully</h2>
                  <p className={cn('mt-1 text-sm', styles.muted)}>
                    Walk-in session is ready for processing
                  </p>
                </div>
              </div>
              <span className={cn(badgeClasses(isDark, 'success'), 'animate-pulse')}>
                Active
              </span>
            </div>
          </div>

          <div className={styles.cardBody}>
            <div className="space-y-4">
              {/* Patient Information */}
              <div className={styles.panel}>
                <div className={cn(
                  'text-xs font-semibold uppercase tracking-wide mb-3',
                  styles.muted
                )}>
                  Patient Information
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={cn('text-sm', styles.muted)}>Display Name</span>
                    <span className="font-semibold">
                      {createdSession.walkin.display_name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={cn('text-sm', styles.muted)}>Patient ID</span>
                    <span className="font-mono text-sm font-semibold">
                      {createdSession.walkin.patient_id}
                    </span>
                  </div>
                  {createdSession.walkin.patient_uuid && (
                    <div className="flex justify-between items-center">
                      <span className={cn('text-sm', styles.muted)}>Patient UUID</span>
                      <span className="font-mono text-xs font-medium truncate max-w-[200px]">
                        {createdSession.walkin.patient_uuid}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className={cn('text-sm', styles.muted)}>Mode</span>
                    <span className={badgeClasses(isDark, 'info')}>
                      {createdSession.walkin.mode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Visit Information */}
              <div className={styles.panel}>
                <div className={cn(
                  'text-xs font-semibold uppercase tracking-wide mb-3',
                  styles.muted
                )}>
                  Visit Information
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={cn('text-sm', styles.muted)}>Visit ID</span>
                    <span className="font-semibold">
                      {createdSession.visit.id}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={cn('text-sm', styles.muted)}>Visit UUID</span>
                    <span className="font-mono text-xs font-medium truncate max-w-[200px]">
                      {createdSession.visit.visit_uuid}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={cn('text-sm', styles.muted)}>Type</span>
                    <span className="capitalize font-semibold">
                      {createdSession.visit.visit_type}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={cn('text-sm', styles.muted)}>Status</span>
                    <span className={badgeClasses(isDark, 'success')}>
                      {createdSession.visit.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={cn('text-sm', styles.muted)}>Current Phase</span>
                    <span className="capitalize font-medium">
                      {createdSession.visit.current_phase}
                    </span>
                  </div>
                </div>
              </div>

              {/* Billing Information */}
              <div className={styles.panel}>
                <div className={cn(
                  'text-xs font-semibold uppercase tracking-wide mb-3',
                  styles.muted
                )}>
                  Billing Information
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={cn('text-sm', styles.muted)}>Billing Cycle ID</span>
                    <span className="font-semibold">
                      {createdSession.billing.id}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={cn('text-sm', styles.muted)}>Cycle UUID</span>
                    <span className="font-mono text-xs font-medium truncate max-w-[200px]">
                      {createdSession.billing.billing_cycle_uuid}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={cn('text-sm', styles.muted)}>Status</span>
                    <span className={badgeClasses(isDark, 'info')}>
                      {createdSession.billing.billing_status}
                    </span>
                  </div>
                 <div className="flex justify-between items-center">
                    <span className={cn('text-sm', styles.muted)}>Net Amount</span>
                    <span className="font-semibold">
                        ${Number(createdSession?.billing?.net_amount || 0).toFixed(2)}
                    </span>
                    </div>

                </div>
              </div>
            </div>
          </div>

          <div className={styles.cardFooter}>
            <div className={styles.infoPanel}>
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-xs text-blue-900 dark:text-blue-200">
                  Session created successfully. The parent component will handle navigation to the next step.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Default state: Show create button
  return (
    <div className={styles.card} aria-label={ariaLabel}>
      {/* Header with module branding */}
      {moduleConfig && (moduleConfig.title || moduleConfig.description) && (
        <div className={styles.cardHeader}>
          <div className="flex items-start gap-3">
            {moduleConfig.icon && (
              <div className={cn(
                'rounded-xl p-2.5',
                isDark ? 'bg-blue-900/30' : 'bg-blue-100'
              )}>
                {moduleConfig.icon}
              </div>
            )}
            <div className="flex-1">
              {moduleConfig.title && (
                <h2 className="text-xl font-bold">{moduleConfig.title}</h2>
              )}
              {moduleConfig.description && (
                <p className={cn('mt-1 text-sm', styles.muted)}>
                  {moduleConfig.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Body with action */}
      <div className={styles.cardBody}>
        <div className="space-y-4">
          {/* Information panel */}
         <div className={cn(
            'rounded-xl border p-4 mb-6',
            isDark
                ? 'bg-blue-950/25 border-blue-800/50'
                : 'bg-blue-50 border-blue-100'
            )}>
            <div className="flex items-start gap-3">
                <UserPlus 
                className={cn(
                    'h-5 w-5 flex-shrink-0 mt-0.5',
                    isDark ? 'text-blue-400' : 'text-blue-600'
                )} 
                aria-hidden="true" 
                />
                <div className="flex-1">
                <h3 className={cn(
                    'font-semibold mb-1',
                    isDark ? 'text-blue-200' : 'text-blue-900'
                )}>
                    Anonymous Walk-in Session
                </h3>
                <p className={cn(
                    'text-sm',
                    isDark ? 'text-blue-300' : 'text-blue-800'
                )}>
                    Create a new walk-in session for customers without pre-registration. 
                    The system will automatically generate a patient profile, visit record, 
                    and billing cycle.
                </p>
                </div>
            </div>
            </div>

          {/* External error display */}
          {externalError && (
            <div className={styles.errorPanel} role="alert" aria-live="polite">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">
                    Error
                  </h3>
                  <p className="text-sm text-red-800 dark:text-red-300">
                    {externalError}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Create button */}
          <button
            onClick={handleCreateSession}
            disabled={isLoading || !effectiveFacilityId}
            className={buttonClasses(isDark, 'primary', 'lg', true, isLoading || !effectiveFacilityId)}
            aria-busy={isLoading}
            aria-disabled={isLoading || !effectiveFacilityId}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                Creating Session...
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" aria-hidden="true" />
                {createButtonText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              EXPORT                                        */
/* -------------------------------------------------------------------------- */

export default PatientWalkIn;