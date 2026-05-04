import React, { useMemo, useState, useCallback } from 'react';
import { ArrowRight, ShoppingCart, Pill, Search, PlusCircle, Package, Clock, User, Calendar, CreditCard} from 'lucide-react';
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
  const colors = useMemo(
    () => ({
      textPrimary: isDark ? 'text-white' : 'text-gray-900',
      textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
      cardBg: isDark ? 'bg-gray-800' : 'bg-white',
      cardBorder: isDark ? 'border-gray-700' : 'border-gray-200',
      inputBg: isDark ? 'bg-gray-800' : 'bg-white',
      inputBorder: isDark ? 'border-gray-700' : 'border-gray-300',
      inputText: isDark ? 'text-white' : 'text-gray-900',
      placeholder: isDark ? 'placeholder-gray-500' : 'placeholder-gray-400',
    }),
    [isDark]
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

    navigate(PHARMACY_ROUTES.PRESCRIPTIONS_SEARCH, {
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
    navigate(PHARMACY_ROUTES.PRESCRIPTIONS_SEARCH);
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
      <div className={cn('min-h-screen px-4 py-6 sm:px-6 sm:py-8', isDark ? 'bg-gray-900' : 'bg-gray-50', className)}>
        <div className="mx-auto w-full max-w-6xl">
          {/* Page header with gradient */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'relative overflow-hidden rounded-xl border-2 transition-all duration-300 mb-6',
              isDark 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/30 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20' 
                : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20',
              'group'
            )}
          >
            {/* Background decoration */}
            <div className={cn(
              'absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl transition-opacity',
              isDark ? 'bg-blue-500/10 group-hover:opacity-100' : 'bg-blue-500/5 group-hover:opacity-100',
              'opacity-0'
            )} />

            <div className="relative p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-3 rounded-xl transition-all duration-300',
                    isDark 
                      ? 'bg-blue-500/20 group-hover:bg-blue-500/30 group-hover:scale-110' 
                      : 'bg-blue-100 group-hover:bg-blue-200 group-hover:scale-110'
                  )}>
                    <Pill className={cn(
                      'h-7 w-7',
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    )} />
                  </div>
                  <div>
                    <h1 className={cn('text-2xl font-bold sm:text-3xl', colors.textPrimary)}>
                      Walk-in Ready
                    </h1>
                    <p className={cn('mt-1 text-sm sm:text-base', colors.textSecondary)}>
                      Patient is ready for medication dispensing
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleViewSessionDetails}
                  className={cn(
                    'px-4 py-2.5 rounded-lg font-medium flex items-center gap-2',
                    'border-2 transition-all',
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600' 
                      : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 hover:border-gray-300',
                    'cursor-pointer'
                  )}
                >
                  <Clock className="h-4 w-4" />
                  {showSessionInfo ? 'Hide Details' : 'View Details'}
                </motion.button>
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <section className={cn(
                'relative overflow-hidden rounded-xl border-2 transition-all duration-300',
                colors.cardBg,
                colors.cardBorder
              )}>
                {/* Card header with gradient */}
                <div className={cn(
                  'border-b-2 p-6',
                  isDark ? 'border-gray-700' : 'border-gray-200'
                )}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className={cn('flex items-center gap-2 text-xl font-bold sm:text-2xl', colors.textPrimary)}>
                        <ShoppingCart className="h-6 w-6 text-blue-500" />
                        Ready to Dispense
                      </h2>
                      <p className={cn('mt-1 text-sm', colors.textSecondary)}>
                        Patient can now receive medication
                      </p>
                    </div>
                    
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        'px-4 py-2 rounded-lg font-semibold text-sm',
                        'bg-gradient-to-r from-green-500/20 to-green-600/10 text-green-300 border border-green-500/30',
                        isDark 
                          ? 'bg-green-900/30 text-green-300 border-green-500/30' 
                          : 'bg-green-100 text-green-700 border-green-200'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Active Session
                      </span>
                    </motion.div>
                  </div>
                </div>

                {/* Session info panel - conditionally shown */}
                <AnimatePresence>
                  {showSessionInfo && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={cn(
                        'border-b-2 overflow-hidden',
                        isDark ? 'border-gray-700' : 'border-gray-200'
                      )}
                    >
                      <div className="p-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          {/* Patient info */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className={cn(
                              'relative overflow-hidden rounded-xl border-2 p-5',
                              isDark 
                                ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/50 border-gray-600' 
                                : 'bg-gradient-to-br from-gray-50 to-white border-gray-200'
                            )}
                          >
                            <div className="flex items-center gap-2 mb-4">
                              <div className={cn(
                                'p-2 rounded-lg',
                                isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                              )}>
                                <User className={cn('w-4 h-4', isDark ? 'text-blue-400' : 'text-blue-600')} />
                              </div>
                              <span className={cn('text-xs font-semibold uppercase tracking-wide', colors.textSecondary)}>
                                Patient
                              </span>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <div className={cn('text-xs', colors.textSecondary)}>Display Name</div>
                                <div className={cn('mt-1 font-semibold text-lg', colors.textPrimary)}>
                                  {createdSession.walkin.display_name}
                                </div>
                              </div>
                              {createdSession.walkin.patient_uuid && (
                                <div>
                                  <div className={cn('text-xs', colors.textSecondary)}>Patient Number</div>
                                  <div className={cn('mt-1 font-mono text-sm', colors.textPrimary)}>
                                    {createdSession.walkin.patient_uuid}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>

                          {/* Visit info */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className={cn(
                              'relative overflow-hidden rounded-xl border-2 p-5',
                              isDark 
                                ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/50 border-gray-600' 
                                : 'bg-gradient-to-br from-gray-50 to-white border-gray-200'
                            )}
                          >
                            <div className="flex items-center gap-2 mb-4">
                              <div className={cn(
                                'p-2 rounded-lg',
                                isDark ? 'bg-purple-500/20' : 'bg-purple-100'
                              )}>
                                <Calendar className={cn('w-4 h-4', isDark ? 'text-purple-400' : 'text-purple-600')} />
                              </div>
                              <span className={cn('text-xs font-semibold uppercase tracking-wide', colors.textSecondary)}>
                                Visit
                              </span>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <div className={cn('text-xs', colors.textSecondary)}>Visit Number</div>
                                <div className={cn('mt-1 font-mono text-sm', colors.textPrimary)}>
                                  {createdSession.visit.visit_uuid}
                                </div>
                              </div>
                              <div>
                                <div className={cn('text-xs', colors.textSecondary)}>Status</div>
                                <div className="mt-2">
                                  <span className={cn(
                                    'px-3 py-1.5 rounded-lg text-xs font-medium',
                                    isDark 
                                      ? 'bg-gradient-to-r from-green-500/20 to-green-600/10 text-green-300 border border-green-500/30' 
                                      : 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200'
                                  )}>
                                    {createdSession.visit.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>

                          {/* Billing info */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className={cn(
                              'relative overflow-hidden rounded-xl border-2 p-5',
                              isDark 
                                ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/50 border-gray-600' 
                                : 'bg-gradient-to-br from-gray-50 to-white border-gray-200'
                            )}
                          >
                            <div className="flex items-center gap-2 mb-4">
                              <div className={cn(
                                'p-2 rounded-lg',
                                isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
                              )}>
                                <CreditCard className={cn('w-4 h-4', isDark ? 'text-emerald-400' : 'text-emerald-600')} />
                              </div>
                              <span className={cn('text-xs font-semibold uppercase tracking-wide', colors.textSecondary)}>
                                Billing
                              </span>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <div className={cn('text-xs', colors.textSecondary)}>Billing Number</div>
                                <div className={cn('mt-1 font-mono text-sm', colors.textPrimary)}>
                                  {createdSession.billing.billing_cycle_uuid}
                                </div>
                              </div>
                              <div>
                                <div className={cn('text-xs', colors.textSecondary)}>Status</div>
                                <div className="mt-2">
                                  <span className={cn(
                                    'px-3 py-1.5 rounded-lg text-xs font-medium',
                                    isDark 
                                      ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/10 text-blue-300 border border-blue-500/30' 
                                      : 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-200'
                                  )}>
                                    {createdSession.billing.billing_status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Quick info panel */}
                <div className="p-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    className={cn(
                      'relative overflow-hidden rounded-xl border-2 p-5',
                      isDark 
                        ? 'bg-gradient-to-br from-blue-900/20 to-blue-900/5 border-blue-500/30' 
                        : 'bg-gradient-to-br from-blue-50 to-blue-50/50 border-blue-200'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'p-2 rounded-lg',
                        isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                      )}>
                        <Package className={cn('h-5 w-5', isDark ? 'text-blue-400' : 'text-blue-600')} />
                      </div>
                      <div>
                        <div className={cn('font-semibold mb-1', isDark ? 'text-blue-300' : 'text-blue-700')}>
                          What to do next
                        </div>
                        <div className={cn('text-sm', isDark ? 'text-blue-400' : 'text-blue-600')}>
                          Start dispensing medication or search existing prescriptions for this patient.
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Card footer with action buttons */}
                <div className={cn(
                  'border-t-2 p-6',
                  isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'
                )}>
                  <div className="space-y-4">
                    {/* Primary action */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleProceedToDispense}
                      className={cn(
                        'w-full px-6 py-4 rounded-xl font-semibold',
                        'flex items-center justify-center gap-3',
                        'transition-all duration-200',
                        'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/30',
                        'transform hover:-translate-y-0.5 cursor-pointer border border-blue-400/30'
                      )}
                      aria-label="Start dispensing medication"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      <span className="text-lg">Start Dispensing Medication</span>
                      <ArrowRight className="h-5 w-5" />
                    </motion.button>

                    {/* Secondary actions */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSearchExisting}
                        className={cn(
                          'px-4 py-3 rounded-lg font-medium',
                          'flex items-center justify-center gap-2',
                          'transition-all duration-200',
                          'border-2',
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300',
                          'cursor-pointer'
                        )}
                        aria-label="Search existing prescriptions"
                      >
                        <Search className="h-4 w-4" />
                        Search Prescriptions
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCreateNewSession}
                        className={cn(
                          'px-4 py-3 rounded-lg font-medium',
                          'flex items-center justify-center gap-2',
                          'transition-all duration-200',
                          'border-2',
                          isDark
                            ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
                            : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 hover:border-gray-300',
                          'cursor-pointer'
                        )}
                        aria-label="Start another walk-in"
                      >
                        <PlusCircle className="h-4 w-4" />
                        Start Another Walk-in
                      </motion.button>
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
    <div className={cn('min-h-screen px-4 py-6 sm:px-6 sm:py-8', isDark ? 'bg-gray-900' : 'bg-gray-50', className)}>
      <div className="mx-auto w-full max-w-6xl">
        {/* Page header with gradient */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'relative overflow-hidden rounded-xl border-2 transition-all duration-300 mb-6',
            isDark 
              ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/30 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20' 
              : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20',
            'group'
          )}
        >
          {/* Background decoration */}
          <div className={cn(
            'absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl transition-opacity',
            isDark ? 'bg-blue-500/10 group-hover:opacity-100' : 'bg-blue-500/5 group-hover:opacity-100',
            'opacity-0'
          )} />

          <div className="relative p-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-3 rounded-xl transition-all duration-300',
                isDark 
                  ? 'bg-blue-500/20 group-hover:bg-blue-500/30 group-hover:scale-110' 
                  : 'bg-blue-100 group-hover:bg-blue-200 group-hover:scale-110'
              )}>
                <Pill className={cn(
                  'h-7 w-7',
                  isDark ? 'text-blue-400' : 'text-blue-600'
                )} />
              </div>
              <div>
                <h1 className={cn('text-2xl font-bold', colors.textPrimary)}>
                  Pharmacy Walk-in
                </h1>
                <p className={colors.textSecondary}>
                  Create a new walk-in session for medication dispensing
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Reusable walk-in creator */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <WalkInSessionCreator
            theme={theme}
            onSessionCreated={handleSessionCreated}
            createButtonText="Start Pharmacy Walk-in"
            customFacilityId={customFacilityId}
          />
        </motion.section>

        {/* Additional pharmacy options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <div className={cn(
            'relative overflow-hidden rounded-xl border-2 transition-all duration-300',
            colors.cardBg,
            colors.cardBorder
          )}>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'p-2.5 rounded-lg',
                    isDark ? 'bg-gray-700' : 'bg-gray-100'
                  )}>
                    <Search className={cn('h-5 w-5', isDark ? 'text-gray-400' : 'text-gray-600')} />
                  </div>
                  <div>
                    <div className={cn('font-semibold mb-1', colors.textPrimary)}>
                      Other Options
                    </div>
                    <div className={cn('text-sm', colors.textSecondary)}>
                      Looking for an existing patient? You can search for prescriptions without creating a walk-in.
                    </div>
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSearchExisting}
                  className={cn(
                    'w-full px-4 py-3 rounded-lg font-medium',
                    'flex items-center justify-center gap-2',
                    'transition-all duration-200',
                    'border-2',
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300',
                    'cursor-pointer'
                  )}
                >
                  <Search className="h-4 w-4" />
                  Search Existing Prescriptions
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerWalkIn;