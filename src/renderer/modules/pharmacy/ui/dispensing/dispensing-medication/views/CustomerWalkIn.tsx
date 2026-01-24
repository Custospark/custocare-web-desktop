/**
 * ============================================================================
 * PHARMACY CUSTOMER WALK-IN (MODULE-SPECIFIC)
 * ============================================================================
 * 
 * Pharmacy-specific wrapper around the reusable PatientWalkIn component.
 * Provides pharmacy-branded UI, post-creation navigation, and module-specific
 * actions for medication dispensing workflows.
 * 
 * @module CustomerWalkIn
 * @description Pharmacy module implementation with:
 * - Pharmacy-branded walk-in session creator
 * - Post-creation "ready to dispense" state
 * - Navigation to prescription search
 * - Session management (create new, search existing)
 * - Pharmacy-specific UI/UX customization
 * - Complete session details display
 * 
 * @requires PatientWalkIn - Reusable walk-in creator component
 * @requires react-router-dom - Navigation utilities
 * @requires framer-motion - Animation library
 * 
 * @example
 * <CustomerWalkIn theme="light" />
 * // Renders pharmacy-specific walk-in creator with light theme
 * 
 * @example
 * <CustomerWalkIn theme="dark" />
 * // Renders pharmacy-specific walk-in creator with dark theme
 */

import React, { useMemo, useState, useCallback } from 'react';
import { ArrowRight, ShoppingCart, Pill, Search, PlusCircle, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import PatientWalkIn from './PatientWalkIn';
import { PHARMACY_ROUTES } from '../../../../../../app/routes/routeConstants';
import type { WalkInSession } from '../../../../api/dispensing/customer-walkin/useCustomerWalkInTypes';

/* -------------------------------------------------------------------------- */
/*                              TYPE DEFINITIONS                              */
/* -------------------------------------------------------------------------- */

/**
 * Props for the CustomerWalkIn component.
 */
export interface CustomerWalkInProps {
  /** Visual theme (light or dark mode) */
  theme?: 'light' | 'dark';
  /** Custom facility ID (optional override) */
  customFacilityId?: number;
  /** Additional CSS classes for root element */
  className?: string;
}

/**
 * Button variant types for consistent styling.
 */
type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'success' | 'danger';

/**
 * Button size types.
 */
type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Badge variant types for status display.
 */
type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

/* -------------------------------------------------------------------------- */
/*                              UTILITY FUNCTIONS                             */
/* -------------------------------------------------------------------------- */

/**
 * Combines CSS classes conditionally, filtering out falsy values.
 * 
 * @param classes - Variable number of class strings (can include false/null/undefined)
 * @returns Combined class string with falsy values removed
 */
const cn = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(' ');

/**
 * Generates button CSS classes based on variant, size, theme, and state.
 * 
 * @param isDark - Whether dark theme is active
 * @param variant - Button style variant
 * @param size - Button size
 * @param fullWidth - Whether button should take full width
 * @param disabled - Whether button is disabled
 * @returns Complete button class string
 */
const buttonClasses = (
  isDark: boolean,
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  fullWidth = false,
  disabled = false
): string => {
  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm md:text-base',
    lg: 'px-6 py-3.5 text-base md:text-lg',
  };

  const variants: Record<ButtonVariant, string> = {
    primary: cn(
      'bg-blue-600 text-white hover:bg-blue-700',
      'shadow-lg shadow-blue-500/25',
      isDark ? 'border border-blue-500/40' : 'border border-blue-600/40'
    ),
    outline: cn(
      'border',
      isDark
        ? 'border-gray-700 text-gray-200 hover:bg-gray-800'
        : 'border-gray-300 text-gray-800 hover:bg-gray-50'
    ),
    ghost: cn(
      isDark 
        ? 'text-gray-200 hover:bg-gray-800/50' 
        : 'text-gray-700 hover:bg-gray-100'
    ),
    success: cn(
      'bg-blue-600 text-white hover:bg-blue-700',
      'shadow-lg shadow-blue-500/25',
      isDark ? 'border border-blue-500/40' : 'border border-blue-600/40'
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
      : 'active:scale-[0.98] hover:shadow-xl cursor-pointer',
    fullWidth && 'w-full'
  );
};

/**
 * Generates badge CSS classes based on variant and theme.
 * 
 * @param isDark - Whether dark theme is active
 * @param variant - Badge style variant
 * @returns Complete badge class string
 */
const badgeClasses = (
  isDark: boolean,
  variant: BadgeVariant = 'default'
): string => {
  const variants: Record<BadgeVariant, string> = {
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
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border',
    variants[variant]
  );
};

/* -------------------------------------------------------------------------- */
/*                           COMPONENT DEFINITION                             */
/* -------------------------------------------------------------------------- */

/**
 * Pharmacy Customer Walk-In Component.
 * 
 * Provides a complete pharmacy-specific walk-in flow:
 * 1. Creates walk-in session using reusable PatientWalkIn
 * 2. Displays success state with session details
 * 3. Offers navigation to dispensing workflow
 * 4. Allows session management (new session, search prescriptions)
 * 
 * @component
 */
const CustomerWalkIn: React.FC<CustomerWalkInProps> = ({
  theme = 'light',
  customFacilityId,
  className,
}) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  /* ---------------------------- STATE MANAGEMENT ---------------------------- */
  const [createdSession, setCreatedSession] = useState<WalkInSession | null>(null);

  /* ---------------------------- COMPUTED STYLES ----------------------------- */
  const styles = useMemo(
    () => ({
      page: cn(
        'min-h-screen px-4 py-6 sm:px-6 sm:py-8',
        isDark
          ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-gray-100'
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900',
        className
      ),
      container: 'mx-auto w-full max-w-6xl',
      card: cn(
        'rounded-2xl border backdrop-blur-sm shadow-2xl',
        isDark 
          ? 'bg-gray-900/60 border-gray-800 shadow-black/20' 
          : 'bg-white/80 border-gray-200 shadow-gray-200/50'
      ),
      cardHeader: cn(
        'border-b px-6 py-5',
        isDark ? 'border-gray-800' : 'border-gray-200'
      ),
      cardBody: 'px-6 py-6',
      cardFooter: cn(
        'border-t px-6 py-5',
        isDark ? 'border-gray-800 bg-gray-900/40' : 'border-gray-200 bg-gray-50/50'
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
    }),
    [isDark, className]
  );

  /* --------------------------- EVENT HANDLERS ------------------------------- */

  /**
   * Handles successful session creation.
   * Stores session data in component state.
   */
  const handleSessionCreated = useCallback((session: WalkInSession) => {
    setCreatedSession(session);
  }, []);

  /**
   * Navigates to prescription search/dispensing workflow.
   * Passes session data via route state for downstream use.
   */
  const handleProceedToDispense = useCallback(() => {
    if (!createdSession) {
      console.error('No session data available for navigation');
      return;
    }

    const { visit_id, patient_id, billing_cycle_id } = createdSession.ui_next.params;

    navigate(PHARMACY_ROUTES.DISPENSING_SEARCH_PRESCRIPTION, {
      state: {
        visitId: visit_id,
        patientId: patient_id,
        billingCycleId: billing_cycle_id,
        isWalkIn: true,
        sessionData: createdSession,
        department: 'pharmacy',
      },
    });
  }, [createdSession, navigate]);

  /**
   * Navigates to prescription search without walk-in context.
   * For searching existing prescriptions.
   */
  const handleSearchExisting = useCallback(() => {
    navigate(PHARMACY_ROUTES.DISPENSING_SEARCH_PRESCRIPTION);
  }, [navigate]);

  /**
   * Resets component state to allow creating another session.
   */
  const handleCreateNewSession = useCallback(() => {
    setCreatedSession(null);
  }, []);

  /* --------------------------- RENDER LOGIC --------------------------------- */

  // Post-creation success state: Session ready for dispensing
  if (createdSession) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          {/* Page header with pharmacy branding */}
          <header className="mb-6 sm:mb-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'rounded-2xl p-3',
                  isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                )}>
                  <Pill className="h-7 w-7 text-blue-500" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl">
                    Pharmacy Walk-in Session
                  </h1>
                  <p className={cn('mt-1 text-sm sm:text-base', styles.muted)}>
                    Session created successfully. Ready for medication dispensing.
                  </p>
                </div>
              </div>

              <span className={cn(
                badgeClasses(isDark, 'success'), 
                'w-fit animate-pulse'
              )}>
                <Package className="h-3.5 w-3.5" aria-hidden="true" />
                Pharmacy Ready
              </span>
            </div>
          </header>

          {/* Animated success card */}
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <section className={styles.card}>
                {/* Card header */}
                <div className={styles.cardHeader}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
                        <ShoppingCart 
                          className="h-6 w-6 text-blue-500" 
                          aria-hidden="true" 
                        />
                        Session Ready for Dispensing
                      </h2>
                      <p className={cn('mt-1 text-sm', styles.muted)}>
                        Walk-in customer profile created with active billing cycle.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card body with session details */}
                <div className={styles.cardBody}>
                  <div className="space-y-6">
                    {/* Session summary grid */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {/* Patient panel */}
                      <div className={styles.panel}>
                        <div className={cn(
                          'text-xs font-semibold uppercase tracking-wide mb-3',
                          styles.muted
                        )}>
                          Patient
                        </div>
                        <div className="space-y-2">
                          <div>
                            <div className={cn('text-xs', styles.muted)}>Display Name</div>
                            <div className="mt-1 font-semibold truncate">
                              {createdSession.walkin.display_name}
                            </div>
                          </div>
                          <div>
                          </div>
                          {createdSession.walkin.patient_uuid && (
                            <div>
                              <div className={cn('text-xs', styles.muted)}>Patient Number:</div>
                              <div className="mt-1 font-mono text-xs truncate">
                                {createdSession.walkin.patient_uuid}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Visit panel */}
                      <div className={styles.panel}>
                        <div className={cn(
                          'text-xs font-semibold uppercase tracking-wide mb-3',
                          styles.muted
                        )}>
                          Visit
                        </div>
                        <div className="space-y-2">
                          <div>
                          </div>
                          <div>
                            <div className={cn('text-xs', styles.muted)}>Visit Number</div>
                            <div className="mt-1 font-mono text-xs truncate">
                              {createdSession.visit.visit_uuid}
                            </div>
                          </div>
                          <div>
                            <div className={cn('text-xs', styles.muted)}>Type</div>
                            <div className="mt-1 capitalize font-medium">
                              {createdSession.visit.visit_type}
                            </div>
                          </div>
                          <div>
                            <div className={cn('text-xs', styles.muted)}>Status</div>
                            <div className="mt-1">
                              <span className={badgeClasses(isDark, 'success')}>
                                {createdSession.visit.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Billing panel */}
                      <div className={styles.panel}>
                        <div className={cn(
                          'text-xs font-semibold uppercase tracking-wide mb-3',
                          styles.muted
                        )}>
                          Billing
                        </div>
                        <div className="space-y-2">
                          <div>
                          </div>
                          <div>
                            <div className={cn('text-xs', styles.muted)}>Biling Number</div>
                            <div className="mt-1 font-mono text-xs truncate">
                              {createdSession.billing.billing_cycle_uuid}
                            </div>
                          </div>
                          <div>
                            <div className={cn('text-xs', styles.muted)}>Status</div>
                            <div className="mt-1">
                              <span className={badgeClasses(isDark, 'info')}>
                                {createdSession.billing.billing_status}
                              </span>
                            </div>
                          </div>
                          <div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card footer with action buttons */}
                <div className={styles.cardFooter}>
                  <div className="space-y-3">
                    {/* Primary action: Proceed to dispense */}
                    <button
                      onClick={handleProceedToDispense}
                      className={cn(
                        buttonClasses(isDark, 'success', 'lg', true),
                        'py-4 sm:py-5'
                      )}
                      aria-label="Proceed to medication dispensing"
                    >
                      <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                      Proceed to Dispense Medication
                      <ArrowRight className="h-5 w-5" aria-hidden="true" />
                    </button>

                    {/* Secondary actions grid */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        onClick={handleSearchExisting}
                        className={buttonClasses(isDark, 'outline', 'md', true)}
                        aria-label="Search existing prescriptions"
                      >
                        <Search className="h-4 w-4" aria-hidden="true" />
                        Search Existing Prescriptions
                      </button>

                      <button
                        onClick={handleCreateNewSession}
                        className={buttonClasses(isDark, 'ghost', 'md', true)}
                        aria-label="Create another walk-in session"
                      >
                        <PlusCircle className="h-4 w-4" aria-hidden="true" />
                        Create Another Session
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Default state: Show walk-in creator
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Page header with pharmacy branding */}
        {/* <header className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className={cn(
              'rounded-2xl p-3',
              isDark ? 'bg-blue-900/30' : 'bg-blue-100'
            )}>
              <Pill className="h-7 w-7 text-blue-500" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Pharmacy Walk-in Management
              </h1>
              <p className={cn('mt-1 text-sm sm:text-base', styles.muted)}>
                Create anonymous walk-in sessions for immediate pharmacy service.
              </p>
            </div>
          </div>
        </header> */}

        {/* Reusable walk-in creator */}
        <section>
          <PatientWalkIn
            theme={theme}
            onSessionCreated={handleSessionCreated}
            createButtonText="Create Pharmacy Walk-in Session"
            showSessionDetails={false} // We handle details in this component
            customFacilityId={customFacilityId}
            moduleConfig={{
              icon: <Pill className="h-6 w-6 text-blue-500" />,
              title: 'Pharmacy Walk-in Session',
              description: 'Create a new walk-in session for medication dispensing without pre-registration.',
            }}
            ariaLabel="Create pharmacy walk-in session"
          />
        </section>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              EXPORT                                        */
/* -------------------------------------------------------------------------- */

export default CustomerWalkIn;