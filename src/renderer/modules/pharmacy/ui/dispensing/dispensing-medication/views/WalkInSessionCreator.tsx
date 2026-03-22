// WalkInSessionCreator.tsx - Add new prop and Redux integration
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { 
  UserPlus, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  ArrowRight,
  Shield,
  Zap,
  RefreshCw,
  X,
  Info,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Custom hooks
import { useCurrentFacility } from '../../../../api/dispensing/customer-walkin/useCustomerWalkinQueries';
import { useCreateWalkInSession } from '../../../../api/dispensing/customer-walkin/useCustomerWalkinQueries';

// UI Components
import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';
import { useConfirm } from '../../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';

// Types
import { type WalkInSession } from '../../../../api/dispensing/customer-walkin/useCustomerWalkInTypes';
import { cn } from '../../../../../../shared/utils/classNameUtils';

// Redux imports
import { getStaffId } from '../../../../../../app/store/utils/contextSelectors';
import { useAppSelector } from '../../../../../../app/store/hooks/useApp';
import { VisitPhase, VisitType } from '../../../../api/dispensing/visit-queue/visitTypes';
import { setActiveVisit } from '../../../../../../app/store/slices/visitSlice';

interface WalkInSessionCreatorProps {
  /** Theme for the component */
  theme?: 'light' | 'dark';
  
  /** Callback when session is successfully created */
  onSessionCreated: (session: WalkInSession) => void;
  
  /** Optional custom facility ID (overrides active facility) */
  customFacilityId?: number;
  
  /** Optional loading state override */
  isLoading?: boolean;
  
  /** Optional error state override */
  error?: Error | null;
  
  /** Custom text for the create button */
  createButtonText?: string;
  
  /** Show detailed session info after creation */
  showSessionDetails?: boolean;
  
  /** Optional className for custom styling */
  className?: string;
  
  /** Whether to automatically persist the visit to Redux after creation */
  autoPersistToRedux?: boolean;
}

/**
 * Simple Walk-in Session Creator Component
 * 
 * Creates a system-generated walk-in session without requiring user input.
 * Parent component handles what happens after creation.
 */
export const WalkInSessionCreator: React.FC<WalkInSessionCreatorProps> = ({
  theme = 'light',
  onSessionCreated,
  customFacilityId,
  isLoading: externalLoading,
  error: externalError,
  createButtonText = 'Start Walk-in',
  autoPersistToRedux = false,
  className,
}) => {
  const isDark = theme === 'dark';
  const { confirm } = useConfirm();
  const dispatch = useDispatch();
  const staffId = useAppSelector(getStaffId);
  
  // State
  const [localError, setLocalError] = useState<Error | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [, setShowErrorDialog] = useState(false);
  
  // Hooks
  const { isValid: hasValidFacility, error: facilityError } = useCurrentFacility();
  
  const {
    mutate: createWalkInSession,
    isPending: isCreating,
    isError: hasCreateError,
    error: createError,
    reset: resetCreateMutation,
  } = useCreateWalkInSession(
    {
      onSuccess: (response) => {
        const session = response.data;
        setShowSuccess(true);
        setLocalError(null);
        
        // Auto-persist to Redux if enabled
        if (autoPersistToRedux) {
          persistVisitToRedux(session);
        }
        
        // Notify parent about successful creation
        onSessionCreated(session);
      },
      onError: (error) => {
        setLocalError(error);
        setShowErrorDialog(true);
        console.error('Walk-in session creation failed:', error);
      },
    },
    customFacilityId
  );
  
  // Helper function to persist visit to Redux
  const persistVisitToRedux = (session: WalkInSession) => {
    const { patient_id, } = session.ui_next.params;
    const patientName = session.walkin.display_name || 'Walk-in Patient';
    
    // Helper to convert null to undefined
    const nullToUndefined = <T,>(value: T | null): T | undefined => {
      return value === null ? undefined : value;
    };
    
    // Create QueueVisitItem from the session data
    const queueVisitItem = {
      visit_id: session.visit.id,
      visit_uuid: session.visit.visit_uuid,
      facility_id: session.visit.facility_id,
      patient_id: session.visit.patient_id,
      patient: {
        id: patient_id,
        patient_number: session.walkin.patient_uuid || String(patient_id),
        global_user_uuid: nullToUndefined(session.walkin.system_user_id ? String(session.walkin.system_user_id) : undefined),
        name: patientName,
        date_of_birth: null,
        biological_sex: null,
        blood_type: null,
        status: 'active',
        requires_isolation: false,
        created_at: new Date().toISOString(),
      },
      current_phase: session.visit.current_phase as VisitPhase,
      current_department_id: null,
      assigned_staff_id: null,
      assigned_at: null,
      waiting_since: null,
      acuity_score: session.visit.acuity_score,
      arrived_at: session.visit.arrived_at,
      visit_type: session.visit.visit_type as VisitType,
      status: session.visit.status as any,
      is_walk_in: session.visit.is_walk_in,
    };
    
    // Set active visit in Redux
    dispatch(setActiveVisit({
      visit: queueVisitItem,
      staffId: staffId || 0,
      departmentId: undefined,
      facilityId: session.visit.facility_id,
    }));
  };
  
  // Derived states
  const isLoading = externalLoading || isCreating;
  const error = externalError || localError || createError;
  const hasError = externalError || localError || hasCreateError || facilityError;
  
  // Event handlers
  const handleCreateWalkIn = () => {
    if (!hasValidFacility && !customFacilityId) {
      const errorMessage = 'No facility selected. Please select a facility first.';
      setLocalError(new Error(errorMessage));
      showFacilityErrorDialog(errorMessage);
      return;
    }
    
    createWalkInSession();
  };
  
  const showFacilityErrorDialog = async (message: string) => {
    const confirmed = await confirm({
      title: 'Facility Required',
      message: message,
      confirmText: 'OK',
      cancelText: 'Cancel',
      variant: 'warning',
      theme,
    });
    
    if (confirmed) {
      setLocalError(null);
    }
  };
  
  const handleRetry = async () => {
    const confirmed = await confirm({
      title: 'Try Again',
      message: 'Would you like to try creating the walk-in session again?',
      confirmText: 'Try Again',
      cancelText: 'Cancel',
      variant: 'info',
      theme,
    });
    
    if (confirmed) {
      resetCreateMutation();
      setLocalError(null);
      setShowErrorDialog(false);
      handleCreateWalkIn();
    }
  };
  
  const handleReset = async () => {
    const confirmed = await confirm({
      title: 'Start New Walk-in',
      message: 'Start a new walk-in session?',
      confirmText: 'New Session',
      cancelText: 'Cancel',
      variant: 'info',
      theme,
    });
    
    if (confirmed) {
      resetCreateMutation();
      setLocalError(null);
      setShowSuccess(false);
      setShowErrorDialog(false);
    }
  };
  
  const handleErrorDialogClose = async () => {
    const confirmed = await confirm({
      title: 'Close Error',
      message: 'Close this error message?',
      confirmText: 'Close',
      cancelText: 'Stay',
      variant: 'warning',
      theme,
    });
    
    if (confirmed) {
      setShowErrorDialog(false);
      setLocalError(null);
      resetCreateMutation();
    }
  };

  // Render loading state (keep existing implementation)
  if (isLoading && !showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn('w-full', className)}
      >
        <div className="max-w-4xl mx-auto">
          <div className={cn(
            'relative overflow-hidden rounded-xl border-2 p-8',
            isDark 
              ? 'bg-linear-to-br from-gray-800 to-gray-900 border-gray-700' 
              : 'bg-linear-to-br from-white to-gray-50 border-gray-200'
          )}>
            <LoadingSkeleton 
              variant="default"
              theme={theme}
              message="Setting up walk-in session..."
            />
          </div>
        </div>
      </motion.div>
    );
  }

  // Render success state (keep existing implementation)
  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn('w-full', className)}
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <div className={cn(
              'relative overflow-hidden rounded-xl border-2 p-8',
              isDark 
                ? 'bg-linear-to-br from-gray-800 to-gray-900 border-green-500/30' 
                : 'bg-linear-to-br from-white to-green-50/50 border-green-200',
              'group'
            )}>
              {/* Background decoration */}
              <div className={cn(
                'absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl transition-opacity',
                isDark ? 'bg-green-500/10 group-hover:opacity-100' : 'bg-green-500/5 group-hover:opacity-100',
                'opacity-0'
              )} />

              <div className="relative">
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring" }}
                    className={cn(
                      'inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4',
                      isDark 
                        ? 'bg-linear-to-br from-green-500/20 to-green-600/20 border-2 border-green-500/30' 
                        : 'bg-linear-to-br from-green-100 to-green-200 border-2 border-green-300'
                    )}
                  >
                    <CheckCircle className={cn(
                      'w-10 h-10',
                      isDark ? 'text-green-400' : 'text-green-600'
                    )} />
                  </motion.div>
                  
                  <motion.h3 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className={cn(
                      'text-2xl font-bold mb-2',
                      isDark ? 'text-white' : 'text-gray-900'
                    )}
                  >
                    Walk-in Started Successfully!
                  </motion.h3>
                  
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className={cn(isDark ? 'text-gray-400' : 'text-gray-600')}
                  >
                    Patient is now ready for service in the queue
                  </motion.p>
                </div>

                {/* Next Steps Card */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className={cn(
                    'relative overflow-hidden rounded-xl border-2 p-6 mb-6',
                    isDark 
                      ? 'bg-linear-to-br from-green-900/20 to-green-800/10 border-green-500/30' 
                      : 'bg-linear-to-br from-green-50 to-emerald-50 border-green-200'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'p-3 rounded-xl',
                      isDark ? 'bg-green-500/20' : 'bg-green-100'
                    )}>
                      <Info className={cn(
                        'w-6 h-6',
                        isDark ? 'text-green-400' : 'text-green-600'
                      )} />
                    </div>
                    <div className="flex-1">
                      <h4 className={cn(
                        'text-lg font-semibold mb-2',
                        isDark ? 'text-green-300' : 'text-green-800'
                      )}>
                        What happens next?
                      </h4>
                      <p className={cn(
                        'text-sm mb-3',
                        isDark ? 'text-green-400' : 'text-green-700'
                      )}>
                        The walk-in session is ready. Click "Proceed" to continue with the patient's service.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="flex gap-3"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleReset}
                    className={cn(
                      'flex-1 px-6 py-3 rounded-xl font-medium transition-all cursor-pointer',
                      'border-2 flex items-center justify-center gap-2',
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:border-gray-500'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 hover:border-gray-400',
                      'cursor-pointer'
                    )}
                  >
                    <UserPlus className="w-5 h-5" />
                    Start Another Walk-in
                  </motion.button>

                  {/* This button will be handled by parent component */}
                  <div className="flex-1">
                    {/* Parent will handle the proceed action */}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Render error state (keep existing implementation)
  if (hasError && !showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn('w-full', className)}
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Error Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'relative overflow-hidden rounded-xl border-2 p-6 mb-6',
                isDark 
                  ? 'bg-linear-to-br from-red-900/20 to-red-800/10 border-red-500/30' 
                  : 'bg-linear-to-br from-red-50 to-rose-50 border-red-200'
              )}
            >
              <div className={cn(
                'absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-30',
                isDark ? 'bg-red-500/20' : 'bg-red-500/10'
              )} />
              
              <div className="relative flex items-start gap-4">
                <div className={cn(
                  'p-3 rounded-xl',
                  isDark ? 'bg-red-500/20' : 'bg-red-100'
                )}>
                  <AlertCircle className={cn(
                    'w-6 h-6',
                    isDark ? 'text-red-400' : 'text-red-600'
                  )} />
                </div>
                
                <div className="flex-1">
                  <h4 className={cn(
                    'text-lg font-semibold mb-1',
                    isDark ? 'text-red-300' : 'text-red-800'
                  )}>
                    Couldn't Start Walk-in
                  </h4>
                  <p className={cn(
                    'text-sm mb-4',
                    isDark ? 'text-red-400' : 'text-red-700'
                  )}>
                    {error?.message || 
                     createError?.message || 
                     facilityError || 
                     'Unable to start walk-in session. Please try again.'}
                  </p>
                  
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRetry}
                      disabled={isCreating}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        'border-2 flex items-center gap-2',
                        isDark
                          ? 'bg-linear-to-br from-red-600 to-red-700 border-red-500/50 text-white hover:shadow-xl hover:shadow-red-500/30'
                          : 'bg-linear-to-br from-red-500 to-red-600 border-red-300 text-white hover:shadow-xl hover:shadow-red-500/30',
                        'disabled:opacity-50 cursor-pointer'
                      )}
                    >
                      <RefreshCw className={cn('w-4 h-4', isCreating && 'animate-spin')} />
                      {isCreating ? 'Retrying...' : 'Try Again'}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleErrorDialogClose}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        'border-2',
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:border-gray-500'
                          : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 hover:border-gray-400',
                        'cursor-pointer'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4" />
                        Close
                      </div>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Retry UI */}
            <div className={cn(
              'relative overflow-hidden rounded-xl border-2 p-8',
              isDark 
                ? 'bg-linear-to-br from-gray-800 to-gray-900 border-gray-700/50' 
                : 'bg-linear-to-br from-white to-gray-50/50 border-gray-200'
            )}>
              <div className="text-center mb-6">
                <div className={cn(
                  'inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4',
                  isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                )}>
                  <RefreshCw className={cn(
                    'w-8 h-8',
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  )} />
                </div>
                <h3 className={cn(
                  'text-xl font-bold mb-2',
                  isDark ? 'text-white' : 'text-gray-900'
                )}>
                  Retry Walk-in
                </h3>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  An error occurred. You can try starting the walk-in again.
                </p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateWalkIn}
                disabled={isCreating || (!hasValidFacility && !customFacilityId)}
                className={cn(
                'px-4 py-2 rounded-xl font-medium transition-all',
                'border-2 flex items-center justify-center gap-2',
                'text-sm',
                isCreating || (!hasValidFacility && !customFacilityId)
                  ? isDark
                    ? 'bg-blue-600/50 border-blue-500/30 text-white/70 cursor-not-allowed'  // ✅ disabled state
                    : 'bg-blue-500/50 border-blue-300 text-white/70 cursor-not-allowed'      // ✅ disabled state
                  : isDark
                    ? 'bg-linear-to-br from-blue-600 to-blue-700 border-blue-500/50 text-white hover:shadow-xl hover:shadow-blue-500/30 cursor-pointer'  // ✅ enabled state
                    : 'bg-linear-to-br from-blue-500 to-blue-600 border-blue-300 text-white hover:shadow-xl hover:shadow-blue-500/30 cursor-pointer',      // ✅ enabled state
                'transform hover:-translate-y-0.5'
              )}
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Setting up...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>{createButtonText}</span>
                  </>
                )}
              </motion.button>
              
              {(!hasValidFacility && !customFacilityId) && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    'text-sm text-center mt-3 flex items-center justify-center gap-1',
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  )}
                >
                  <AlertCircle className="w-3 h-3" />
                  Please select a facility before starting a walk-in
                </motion.p>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Render normal state (pre-creation) - keep existing implementation
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('w-full', className)}
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header Card */}
          <div className={cn(
            'relative overflow-hidden rounded-xl border-2 mb-6 transition-all duration-300',
            isDark 
              ? 'bg-linear-to-br from-gray-800 to-gray-900 border-blue-500/30 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20' 
              : 'bg-linear-to-br from-white to-blue-50/50 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20',
            'group'
          )}>
            <div className={cn(
              'absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl transition-opacity',
              isDark ? 'bg-blue-500/10 group-hover:opacity-100' : 'bg-blue-500/5 group-hover:opacity-100',
              'opacity-0'
            )} />

            <div className="relative p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className={cn(
                  'p-4 rounded-2xl transition-all duration-300',
                  isDark 
                    ? 'bg-blue-500/20 group-hover:bg-blue-500/30 group-hover:scale-110' 
                    : 'bg-blue-100 group-hover:bg-blue-200 group-hover:scale-110'
                )}>
                  <LogIn className={cn(
                    'w-8 h-8',
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  )} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Quick Walk-in Registration</h2>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    Start immediately - no forms needed
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                <div className={cn(
                  'flex items-center gap-2 p-3 rounded-lg',
                  isDark ? 'bg-gray-800/50' : 'bg-white/50'
                )}>
                  <Zap className={cn('w-4 h-4', isDark ? 'text-yellow-400' : 'text-yellow-500')} />
                  <span className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-700')}>
                    Instant Setup
                  </span>
                </div>
                <div className={cn(
                  'flex items-center gap-2 p-3 rounded-lg',
                  isDark ? 'bg-gray-800/50' : 'bg-white/50'
                )}>
                  <Clock className={cn('w-4 h-4', isDark ? 'text-blue-400' : 'text-blue-500')} />
                  <span className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-700')}>
                    Queue Ready
                  </span>
                </div>
                <div className={cn(
                  'flex items-center gap-2 p-3 rounded-lg',
                  isDark ? 'bg-gray-800/50' : 'bg-white/50'
                )}>
                  <Shield className={cn('w-4 h-4', isDark ? 'text-green-400' : 'text-green-500')} />
                  <span className={cn('text-sm', isDark ? 'text-gray-300' : 'text-gray-700')}>
                    Billing Ready
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className={cn(
            'relative overflow-hidden rounded-xl border-2 p-8',
            isDark 
              ? 'bg-linear-to-br from-gray-800 to-gray-900 border-gray-700/50 hover:border-gray-600' 
              : 'bg-linear-to-br from-white to-gray-50/50 border-gray-200 hover:border-gray-300'
          )}>

            {/* Action Buttons */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateWalkIn}
              disabled={isCreating || (!hasValidFacility && !customFacilityId)}
              className={cn(
                'w-full px-6 py-4 rounded-xl font-medium transition-all',
                'border-2 flex items-center justify-center gap-3 text-lg',
                isCreating || (!hasValidFacility && !customFacilityId)
                  ? isDark
                    ? 'bg-blue-600/50 border-blue-500/30 text-white cursor-not-allowed'
                    : 'bg-blue-500/50 border-blue-300 text-white cursor-not-allowed'
                  : isDark
                    ? 'bg-linear-to-br from-blue-600 to-blue-700 border-blue-500/50 text-white hover:shadow-xl hover:shadow-blue-500/30'
                    : 'bg-linear-to-br from-blue-500 to-blue-600 border-blue-300 text-white hover:shadow-xl hover:shadow-blue-500/30',
                'transform hover:-translate-y-0.5'
              )}
            >
              {isCreating ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Setting up walk-in session...
                </>
              ) : (
                <>
                  <UserPlus className="w-6 h-6" />
                  {createButtonText}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>

            {/* Facility Status */}
            <AnimatePresence>
              {(!hasValidFacility && !customFacilityId) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={cn(
                    'mt-4 p-3 rounded-lg text-sm flex items-center gap-2',
                    isDark ? 'bg-yellow-900/20 text-yellow-300' : 'bg-yellow-50 text-yellow-700'
                  )}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Please select a facility before starting a walk-in
                </motion.div>
              )}

              {customFacilityId && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={cn(
                    'mt-4 p-3 rounded-lg text-sm flex items-center gap-2',
                    isDark ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'
                  )}
                >
                  <Info className="w-4 h-4 flex-shrink-0" />
                  Starting walk-in at selected facility
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

WalkInSessionCreator.displayName = 'WalkInSessionCreator';

export default WalkInSessionCreator;