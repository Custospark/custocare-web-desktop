/**
 * ============================================================================
 * PHARMACY CUSTOMER WALK-IN
 * ============================================================================
 * Pharmacy-specific wrapper around the reusable WalkInSessionCreator.
 * Adds pharmacy navigation + post-create “ready to dispense” UI.
 */

import React, { useMemo, useState } from 'react';
import { ArrowRight, ShoppingCart, Pill } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import WalkInSessionCreator from './WalkInSessionCreator';
import { PHARMACY_ROUTES } from '../../../../../../app/routes/routeConstants';
import { WalkInSession } from '../../../../api/dispensing/customer-walkin/useCustomerWalkInTypes';

interface CustomerWalkInProps {
  theme: 'light' | 'dark';
}

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

const buttonClasses = (
  isDark: boolean,
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  fullWidth = false,
  disabled = false
) => {
  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm md:text-base',
    lg: 'px-6 py-3 text-base md:text-lg',
  };

  const variants: Record<ButtonVariant, string> = {
    primary: cn(
      'bg-blue-600 text-white',
      'hover:bg-blue-700',
      isDark ? 'border border-blue-500/40' : 'border border-blue-600/40'
    ),
    outline: cn(
      'border',
      isDark
        ? 'border-gray-700 text-gray-200 hover:bg-gray-800'
        : 'border-gray-200 text-gray-800 hover:bg-gray-50'
    ),
    ghost: cn(
      isDark ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-800 hover:bg-gray-100'
    ),
    success: cn(
      'bg-green-600 text-white',
      'hover:bg-green-700',
      isDark ? 'border border-green-500/40' : 'border border-green-600/40'
    ),
  };

  return cn(
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-500/40',
    sizes[size],
    variants[variant],
    disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]',
    fullWidth && 'w-full'
  );
};

const badgeClasses = (isDark: boolean, variant: 'default' | 'success' | 'warning' | 'error' = 'default') => {
  const variants = {
    default: isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800',
    success: isDark ? 'bg-green-900/30 text-green-200' : 'bg-green-50 text-green-700',
    warning: isDark ? 'bg-yellow-900/30 text-yellow-200' : 'bg-yellow-50 text-yellow-700',
    error: isDark ? 'bg-red-900/30 text-red-200' : 'bg-red-50 text-red-700',
  };

  return cn('inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold', variants[variant]);
};

const CustomerWalkIn: React.FC<CustomerWalkInProps> = ({ theme = 'light' }) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [createdSession, setCreatedSession] = useState<WalkInSession | null>(null);

  const styles = useMemo(
    () => ({
      page: cn(
        'min-h-screen',
        'px-4 py-4 sm:px-6 sm:py-6',
        isDark
          ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-gray-100'
          : 'bg-gradient-to-br from-gray-50 via-white to-gray-50 text-gray-900'
      ),
      container: 'mx-auto w-full max-w-6xl',
      card: cn(
        'rounded-2xl border backdrop-blur-sm',
        isDark ? 'bg-gray-900/60 border-gray-800' : 'bg-white/70 border-gray-200'
      ),
      cardHeader: cn('border-b px-5 py-4 sm:px-6 sm:py-5', isDark ? 'border-gray-800' : 'border-gray-200'),
      cardBody: 'px-5 py-5 sm:px-6 sm:py-6',
      muted: isDark ? 'text-gray-400' : 'text-gray-600',
      panel: cn(
        'rounded-xl border p-4',
        isDark ? 'bg-gray-950/40 border-gray-800' : 'bg-gray-50 border-gray-200'
      ),
      infoPanel: cn(
        'rounded-xl border p-4',
        isDark ? 'bg-blue-950/25 border-gray-800' : 'bg-blue-50 border-blue-100'
      ),
    }),
    [isDark]
  );

  const logPharmacyEvent = (eventName: string, data: Record<string, any>) => {
    // Replace with your analytics integration
    console.log(`[Pharmacy Analytics] ${eventName}:`, data);
  };

  const handleSessionCreated = (session: WalkInSession) => {
    setCreatedSession(session);

    logPharmacyEvent('walkin_session_created', {
      facilityId: session.facility_id,
      visitId: session.visit.id,
      patientId: session.walkin.patient_id,
      department: 'pharmacy',
      timestamp: new Date().toISOString(),
    });
  };

  const handleProceedToDispense = () => {
    if (!createdSession) return;

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
  };

  const handleSearchExisting = () => {
    navigate(PHARMACY_ROUTES.DISPENSING_SEARCH_PRESCRIPTION);
  };

  const handleCreateNewSession = () => setCreatedSession(null);

  // ----------------------------
  // Post-create “Ready” state
  // ----------------------------
  if (createdSession) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <header className="mb-6 sm:mb-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className={cn('rounded-2xl p-3', isDark ? 'bg-blue-900/30' : 'bg-blue-100')}>
                  <Pill className="h-7 w-7 text-blue-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold sm:text-3xl">Pharmacy Walk-in Session</h1>
                  <p className={cn('mt-1 text-sm sm:text-base', styles.muted)}>
                    Session created successfully. Ready for medication dispensing.
                  </p>
                </div>
              </div>

              <span className={cn(badgeClasses(isDark, 'success'), 'w-fit animate-pulse')}>
                Pharmacy Ready
              </span>
            </div>
          </header>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
                      <ShoppingCart className="h-6 w-6 text-green-500" />
                      Session Ready for Dispensing
                    </h2>
                    <p className={cn('mt-1 text-sm', styles.muted)}>
                      Walk-in customer profile created with billing cycle.
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className="space-y-6">
                  {/* Session summary */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className={styles.panel}>
                      <div className={cn('text-xs font-semibold uppercase tracking-wide', styles.muted)}>Patient</div>
                      <div className="mt-2">
                        <div className="truncate font-mono text-sm font-bold sm:text-base">
                          {createdSession.walkin.patient_uuid || 'N/A'}
                        </div>
                        <div className={cn('mt-1 truncate text-sm', isDark ? 'text-gray-200' : 'text-gray-900')}>
                          {createdSession.walkin.display_name}
                        </div>
                      </div>
                    </div>

                    <div className={styles.panel}>
                      <div className={cn('text-xs font-semibold uppercase tracking-wide', styles.muted)}>Visit</div>
                      <div className="mt-2">
                        <div className="truncate font-mono text-sm font-bold sm:text-base">
                          {createdSession.visit.visit_uuid}
                        </div>
                        <div className={cn('mt-1 text-sm capitalize', styles.muted)}>
                          Type: {createdSession.visit.visit_type}
                        </div>
                      </div>
                    </div>
                  </div>


                  {/* Actions */}
                  <div className="space-y-3 pt-2">
                    <button
                      onClick={handleProceedToDispense}
                      className={cn(buttonClasses(isDark, 'primary', 'lg', true), 'py-4 sm:py-5')}
                    >
                      <ShoppingCart className="h-5 w-5" />
                      Proceed to Dispense Medication
                      <ArrowRight className="h-5 w-5" />
                    </button>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button onClick={handleSearchExisting} className={buttonClasses(isDark, 'outline', 'md', true)}>
                        Search Existing Prescriptions
                      </button>

                      <button onClick={handleCreateNewSession} className={buttonClasses(isDark, 'ghost', 'md', true)}>
                        Create Another Session
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        </div>
      </div>
    );
  }

  // ----------------------------
  // Default state (creator)
  // ----------------------------
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* <header className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className={cn('rounded-2xl p-3', isDark ? 'bg-blue-900/30' : 'bg-blue-100')}>
              <Pill className="h-7 w-7 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Pharmacy Walk-in Management</h1>
              <p className={cn('mt-1 text-sm sm:text-base', styles.muted)}>
                Create anonymous walk-in sessions for immediate pharmacy service.
              </p>
            </div>
          </div>
        </header> */}

       <div className="grid grid-cols-1 gap-6">
        <section>
          <WalkInSessionCreator
            theme={theme}
            onSessionCreated={handleSessionCreated}
            createButtonText="Create Pharmacy Walk-in Session"
            showSessionDetails
          />
        </section>
      </div>

      </div>
    </div>
  );
};

export default CustomerWalkIn;
