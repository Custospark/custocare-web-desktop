import React, { useMemo, useState, useCallback } from 'react';
import { ArrowRight, ShoppingCart, Pill, Search, PlusCircle, Package, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import WalkInSessionCreator from './WalkInSessionCreator';
import { PHARMACY_ROUTES } from '../../../../../../app/routes/routeConstants';
import type { WalkInSession } from '../../../../api/dispensing/customer-walkin/useCustomerWalkInTypes';

/* -------------------------------------------------------------------------- */
/*                              TYPE DEFINITIONS                              */
/* -------------------------------------------------------------------------- */

export interface CustomerWalkInProps {
  /** Visual theme (light or dark mode) */
  theme?: 'light' | 'dark';
  /** Custom facility ID (optional override) */
  customFacilityId?: number;
  /** Additional CSS classes for root element */
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*                              UTILITY FUNCTIONS                             */
/* -------------------------------------------------------------------------- */

const cn = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(' ');

/* -------------------------------------------------------------------------- */
/*                           COMPONENT DEFINITION                             */
/* -------------------------------------------------------------------------- */

const CustomerWalkIn: React.FC<CustomerWalkInProps> = ({
  theme = 'light',
  customFacilityId,
  className,
}) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  /* ---------------------------- STATE MANAGEMENT ---------------------------- */
  const [createdSession, setCreatedSession] = useState<WalkInSession | null>(null);
  const [showSessionInfo, setShowSessionInfo] = useState(false);

  /* ---------------------------- COMPUTED STYLES ----------------------------- */
  const styles = useMemo(
    () => ({
      page: cn(
        'min-h-screen px-4 py-6 sm:px-6 sm:py-8',
        isDark
          ? 'bg-gray-900 text-gray-100'
          : 'bg-gray-50 text-gray-900',
        className
      ),
      container: 'mx-auto w-full max-w-6xl',
      card: cn(
        'rounded-2xl border',
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      ),
      cardHeader: cn(
        'border-b px-6 py-5',
        isDark ? 'border-gray-700' : 'border-gray-200'
      ),
      cardBody: 'px-6 py-6',
      cardFooter: cn(
        'border-t px-6 py-5',
        isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
      ),
      muted: isDark ? 'text-gray-400' : 'text-gray-600',
      panel: cn(
        'rounded-xl border p-4',
        isDark 
          ? 'bg-gray-700/50 border-gray-600' 
          : 'bg-gray-50 border-gray-200'
      ),
      infoPanel: cn(
        'rounded-xl border p-4',
        isDark 
          ? 'bg-blue-900/20 border-blue-800' 
          : 'bg-blue-50 border-blue-200'
      ),
    }),
    [isDark, className]
  );

  /* --------------------------- EVENT HANDLERS ------------------------------- */

  const handleSessionCreated = useCallback((session: WalkInSession) => {
    setCreatedSession(session);
    setShowSessionInfo(true);
  }, []);

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

  const handleSearchExisting = useCallback(() => {
    navigate(PHARMACY_ROUTES.DISPENSING_SEARCH_PRESCRIPTION);
  }, [navigate]);

  const handleCreateNewSession = useCallback(() => {
    setCreatedSession(null);
    setShowSessionInfo(false);
  }, []);

  const handleViewSessionDetails = useCallback(() => {
    setShowSessionInfo(!showSessionInfo);
  }, [showSessionInfo]);

  /* --------------------------- RENDER LOGIC --------------------------------- */

  // Post-creation success state
  if (createdSession) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          {/* Page header */}
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
                    Walk-in Ready
                  </h1>
                  <p className={cn('mt-1 text-sm sm:text-base', styles.muted)}>
                    Patient is ready for medication dispensing
                  </p>
                </div>
              </div>

              <button
                onClick={handleViewSessionDetails}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium flex items-center gap-2',
                  isDark 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                )}
              >
                <Clock className="h-4 w-4" />
                {showSessionInfo ? 'Hide Details' : 'View Details'}
              </button>
            </div>
          </header>

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
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
                        <ShoppingCart 
                          className="h-6 w-6 text-blue-500" 
                          aria-hidden="true" 
                        />
                        Ready to Dispense
                      </h2>
                      <p className={cn('mt-1 text-sm', styles.muted)}>
                        Patient can now receive medication
                      </p>
                    </div>
                    
                    <div className={cn(
                      'px-4 py-2 rounded-lg font-semibold text-sm',
                      isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
                    )}>
                      Active Session
                    </div>
                  </div>
                </div>

                {/* Session info panel - conditionally shown */}
                {showSessionInfo && (
                  <div className="border-b border-gray-700 dark:border-gray-600">
                    <div className="px-6 py-6">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {/* Patient info */}
                        <div className={styles.panel}>
                          <div className={cn('text-xs font-semibold uppercase tracking-wide mb-3', styles.muted)}>
                            Patient
                          </div>
                          <div className="space-y-2">
                            <div>
                              <div className={cn('text-xs', styles.muted)}>Display Name</div>
                              <div className="mt-1 font-semibold">
                                {createdSession.walkin.display_name}
                              </div>
                            </div>
                            {createdSession.walkin.patient_uuid && (
                              <div>
                                <div className={cn('text-xs', styles.muted)}>Patient Number</div>
                                <div className="mt-1 font-mono text-xs">
                                  {createdSession.walkin.patient_uuid}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Visit info */}
                        <div className={styles.panel}>
                          <div className={cn('text-xs font-semibold uppercase tracking-wide mb-3', styles.muted)}>
                            Visit
                          </div>
                          <div className="space-y-2">
                            <div>
                              <div className={cn('text-xs', styles.muted)}>Visit Number</div>
                              <div className="mt-1 font-mono text-xs">
                                {createdSession.visit.visit_uuid}
                              </div>
                            </div>
                            <div>
                              <div className={cn('text-xs', styles.muted)}>Status</div>
                              <div className="mt-1">
                                <span className={cn(
                                  'px-2 py-1 rounded text-xs font-medium',
                                  isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700'
                                )}>
                                  {createdSession.visit.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Billing info */}
                        <div className={styles.panel}>
                          <div className={cn('text-xs font-semibold uppercase tracking-wide mb-3', styles.muted)}>
                            Billing
                          </div>
                          <div className="space-y-2">
                            <div>
                              <div className={cn('text-xs', styles.muted)}>Billing Number</div>
                              <div className="mt-1 font-mono text-xs">
                                {createdSession.billing.billing_cycle_uuid}
                              </div>
                            </div>
                            <div>
                              <div className={cn('text-xs', styles.muted)}>Status</div>
                              <div className="mt-1">
                                <span className={cn(
                                  'px-2 py-1 rounded text-xs font-medium',
                                  isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                                )}>
                                  {createdSession.billing.billing_status}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick info panel - always shown */}
                <div className="px-6 py-6">
                  <div className={styles.infoPanel}>
                    <div className="flex items-start gap-3">
                      <Package className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      <div>
                        <div className={`font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                          What to do next
                        </div>
                        <div className={`text-sm mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                          Start dispensing medication or search existing prescriptions for this patient.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card footer with action buttons */}
                <div className={styles.cardFooter}>
                  <div className="space-y-4">
                    {/* Primary action */}
                    <button
                      onClick={handleProceedToDispense}
                      className={cn(
                        'w-full px-6 py-4 rounded-xl font-semibold',
                        'flex items-center justify-center gap-3',
                        'transition-all duration-200',
                        'focus:outline-none focus:ring-4 focus:ring-blue-500/20',
                        isDark 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white',
                        'active:scale-[0.98]'
                      )}
                      aria-label="Start dispensing medication"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      Start Dispensing Medication
                      <ArrowRight className="h-5 w-5" />
                    </button>

                    {/* Secondary actions */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        onClick={handleSearchExisting}
                        className={cn(
                          'px-4 py-3 rounded-lg font-medium',
                          'flex items-center justify-center gap-2',
                          'transition-all duration-200',
                          isDark
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600'
                            : 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-300',
                          'active:scale-[0.98]'
                        )}
                        aria-label="Search existing prescriptions"
                      >
                        <Search className="h-4 w-4" />
                        Search Prescriptions
                      </button>

                      <button
                        onClick={handleCreateNewSession}
                        className={cn(
                          'px-4 py-3 rounded-lg font-medium',
                          'flex items-center justify-center gap-2',
                          'transition-all duration-200',
                          isDark
                            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700',
                          'active:scale-[0.98]'
                        )}
                        aria-label="Start another walk-in"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Start Another Walk-in
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
        {/* Reusable walk-in creator */}
        <section>
          <WalkInSessionCreator
            theme={theme}
            onSessionCreated={handleSessionCreated}
            createButtonText="Start Pharmacy Walk-in"
            customFacilityId={customFacilityId}
          />
        </section>

        {/* Additional pharmacy options */}
        <div className="mt-8">
          <div className={styles.card}>
            <div className={styles.cardBody}>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Search className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                  <div>
                    <div className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Other Options
                    </div>
                    <div className={`text-sm mt-1 ${styles.muted}`}>
                      Looking for an existing patient? You can search for prescriptions without creating a walk-in.
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleSearchExisting}
                  className={cn(
                    'w-full px-4 py-3 rounded-lg font-medium',
                    'flex items-center justify-center gap-2',
                    'transition-all duration-200',
                    isDark
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600'
                      : 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-300',
                    'active:scale-[0.98]'
                  )}
                >
                  <Search className="h-4 w-4" />
                  Search Existing Prescriptions
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerWalkIn;