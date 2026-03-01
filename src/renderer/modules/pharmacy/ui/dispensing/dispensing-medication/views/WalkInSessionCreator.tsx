import React, { useState } from 'react';
import { UserPlus, CheckCircle, AlertCircle, Clock, Shield, CreditCard, RefreshCw, X, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

// Custom hooks
import { useCurrentFacility } from '../../../../api/dispensing/customer-walkin/useCustomerWalkinQueries';
import { useCreateWalkInSession } from '../../../../api/dispensing/customer-walkin/useCustomerWalkinQueries';

// UI Components
import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';
import { useConfirm } from '../../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';

// Types
import { type WalkInSession } from '../../../../api/dispensing/customer-walkin/useCustomerWalkInTypes';

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
}

/**
 * Premium Walk-in Session Creator Component
 * 
 * Creates a system-generated walk-in session with elegant animations and design
 */
export const WalkInSessionCreator: React.FC<WalkInSessionCreatorProps> = ({
  theme = 'light',
  onSessionCreated,
  customFacilityId,
  isLoading: externalLoading,
  error: externalError,
  createButtonText = 'Start Walk-in',
}) => {
  const isDark = theme === 'dark';
  const { confirm } = useConfirm();
  
  // State
  const [localError, setLocalError] = useState<Error | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
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

  const colors = {
    textPrimary: isDark ? 'text-white' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
    cardBg: isDark ? 'bg-gray-800' : 'bg-white',
    cardBorder: isDark ? 'border-gray-700' : 'border-gray-200',
  };

  // Render loading state
  if (isLoading && !showSuccess) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <LoadingSkeleton 
            variant="default"
            theme={theme}
            message="Setting up walk-in session..."
          />
        </div>
      </div>
    );
  }

  // Render success state
  if (showSuccess) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className={cn(
              'relative overflow-hidden rounded-xl border-2 transition-all duration-300',
              isDark 
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-green-500/30 hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/20' 
                : 'bg-gradient-to-br from-white to-green-50/50 border-green-200 hover:border-green-400 hover:shadow-2xl hover:shadow-green-500/20',
              'group'
            )}>
              {/* Background decoration */}
              <div className={cn(
                'absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl transition-opacity',
                isDark ? 'bg-green-500/10 group-hover:opacity-100' : 'bg-green-500/5 group-hover:opacity-100',
                'opacity-0'
              )} />

              <div className="relative p-8">
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className={cn(
                      'inline-flex items-center justify-center w-20 h-20 rounded-full mb-4',
                      isDark 
                        ? 'bg-gradient-to-br from-green-500/20 to-green-600/10' 
                        : 'bg-gradient-to-br from-green-100 to-green-50'
                    )}
                  >
                    <CheckCircle className={cn(
                      'w-10 h-10',
                      isDark ? 'text-green-400' : 'text-green-600'
                    )} />
                  </motion.div>
                  
                  <h3 className={cn('text-2xl font-bold mb-2', colors.textPrimary)}>
                    Walk-in Started!
                  </h3>
                  <p className={colors.textSecondary}>
                    Patient is now ready for service
                  </p>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={cn(
                    'mb-6 p-5 rounded-xl border-2',
                    isDark 
                      ? 'bg-gradient-to-br from-green-900/20 to-green-900/5 border-green-500/30' 
                      : 'bg-gradient-to-br from-green-50 to-green-50/50 border-green-200'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'p-2 rounded-lg',
                      isDark ? 'bg-green-500/20' : 'bg-green-100'
                    )}>
                      <Clock className={cn('w-5 h-5', isDark ? 'text-green-400' : 'text-green-600')} />
                    </div>
                    <div>
                      <div className={cn('font-semibold mb-1', isDark ? 'text-green-300' : 'text-green-700')}>
                        What happens next?
                      </div>
                      <div className={cn('text-sm', isDark ? 'text-green-400' : 'text-green-600')}>
                        The parent component will guide you through the next steps for this patient.
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl font-medium transition-all',
                    'border-2',
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
                      : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 hover:border-gray-300',
                    'cursor-pointer'
                  )}
                >
                  Start Another Walk-in
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Render error state
  if (hasError && !showSuccess) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Error Summary Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                'relative overflow-hidden rounded-xl border-2 p-5 mb-6',
                isDark 
                  ? 'bg-gradient-to-br from-red-900/20 to-red-900/5 border-red-500/30' 
                  : 'bg-gradient-to-br from-red-50 to-red-50/50 border-red-200'
              )}
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl bg-red-500/10" />
              
              <div className="relative flex items-start gap-4">
                <div className={cn(
                  'p-2.5 rounded-lg',
                  isDark ? 'bg-red-500/20' : 'bg-red-100'
                )}>
                  <AlertCircle className={cn('w-5 h-5', isDark ? 'text-red-400' : 'text-red-600')} />
                </div>
                <div className="flex-1">
                  <div className={cn('font-semibold mb-1', isDark ? 'text-red-300' : 'text-red-700')}>
                    Couldn't Start Walk-in
                  </div>
                  <div className={cn('text-sm mb-3', isDark ? 'text-red-400' : 'text-red-600')}>
                    {error?.message || 
                     createError?.message || 
                     facilityError || 
                     'Unable to start walk-in session. Please try again.'}
                  </div>
                  
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRetry}
                      disabled={isCreating}
                      className={cn(
                        'px-4 py-2 text-sm font-medium rounded-lg transition-all',
                        'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white',
                        'disabled:opacity-50 cursor-pointer border border-red-400/30'
                      )}
                    >
                      {isCreating ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Retrying...
                        </div>
                      ) : (
                        'Try Again'
                      )}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleErrorDialogClose}
                      className={cn(
                        'px-4 py-2 text-sm font-medium rounded-lg transition-all',
                        'border-2',
                        isDark
                          ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50',
                        'cursor-pointer'
                      )}
                    >
                      Close
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Fallback to normal UI for retry */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={cn(
                'relative overflow-hidden rounded-xl border-2 p-8',
                colors.cardBg,
                colors.cardBorder
              )}
            >
              <div className="text-center mb-6">
                <div className={cn(
                  'inline-flex items-center justify-center w-20 h-20 rounded-full mb-4',
                  isDark 
                    ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20' 
                    : 'bg-gradient-to-br from-blue-100 to-purple-100'
                )}>
                  <RefreshCw className={cn('w-10 h-10', isDark ? 'text-blue-400' : 'text-blue-600')} />
                </div>
                <h3 className={cn('text-xl font-bold mb-2', colors.textPrimary)}>
                  Retry Walk-in
                </h3>
                <p className={colors.textSecondary}>
                  An error occurred. You can try starting the walk-in again.
                </p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateWalkIn}
                disabled={isCreating || (!hasValidFacility && !customFacilityId)}
                className={cn(
                  'w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                  isCreating || (!hasValidFacility && !customFacilityId)
                    ? 'bg-blue-500/50 cursor-not-allowed text-white'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/30 transform hover:-translate-y-0.5 cursor-pointer border border-blue-400/30'
                )}
              >
                {isCreating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Setting up...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    <span>{createButtonText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
              
              {(!hasValidFacility && !customFacilityId) && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn('text-sm text-center mt-3', colors.textSecondary)}
                >
                  Please select a facility before starting a walk-in
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Render normal state (pre-creation)
  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center mb-8">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className={cn(
                'inline-flex items-center justify-center w-20 h-20 rounded-full mb-4',
                isDark 
                  ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20' 
                  : 'bg-gradient-to-br from-blue-100 to-purple-100'
              )}
            >
              <UserPlus className={cn('w-10 h-10', isDark ? 'text-blue-400' : 'text-blue-600')} />
            </motion.div>
            <h2 className={cn('text-2xl font-bold mb-2', colors.textPrimary)}>
              Quick Walk-in
            </h2>
            <p className={colors.textSecondary}>
              Start immediately - no forms needed
            </p>
          </div>
          
          <div className={cn(
            'relative overflow-hidden rounded-xl border-2 p-8',
            colors.cardBg,
            colors.cardBorder
          )}>
            {/* Background decoration */}
            <div className={cn(
              'absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-30',
              isDark ? 'bg-blue-500/10' : 'bg-blue-500/5'
            )} />

            <div className="relative space-y-4 mb-6">
              {[
                { icon: UserPlus, text: 'System-Generated Patient Identity', subtext: 'To ensure automatic billing and service tracking.' },
                { icon: Clock, text: 'Ready for Service', subtext: 'Patient added to queue immediately' },
                { icon: CreditCard, text: 'Billing Ready', subtext: 'Payment setup handled automatically' },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className={cn(
                    'p-2 rounded-lg flex-shrink-0',
                    isDark ? 'bg-green-500/20' : 'bg-green-100'
                  )}>
                    <item.icon className={cn('w-5 h-5', isDark ? 'text-green-400' : 'text-green-600')} />
                  </div>
                  <div>
                    <div className={cn('font-semibold', colors.textPrimary)}>
                      {item.text}
                    </div>
                    <div className={cn('text-sm mt-1', colors.textSecondary)}>
                      {item.subtext}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateWalkIn}
              disabled={isCreating || (!hasValidFacility && !customFacilityId)}
              className={cn(
                'w-full px-4 py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                isCreating || (!hasValidFacility && !customFacilityId)
                  ? 'bg-blue-500/50 cursor-not-allowed text-white'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/30 transform hover:-translate-y-0.5 cursor-pointer border border-blue-400/30'
              )}
            >
              {isCreating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Setting up...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span className="text-lg">{createButtonText}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
            
            {(!hasValidFacility && !customFacilityId) && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn('text-sm text-center mt-3', colors.textSecondary)}
              >
                Please select a facility before starting a walk-in
              </motion.p>
            )}
            
            {customFacilityId && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={cn(
                  'mt-4 p-3 rounded-lg text-sm text-center',
                  isDark 
                    ? 'bg-blue-900/20 text-blue-300 border border-blue-500/30' 
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                )}
              >
                <span className="flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" />
                  Starting walk-in at selected facility
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

WalkInSessionCreator.displayName = 'WalkInSessionCreator';

export default WalkInSessionCreator;

// Helper function for className merging
function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}