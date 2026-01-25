import React, { useState } from 'react';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
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
}) => {
  const isDark = theme === 'dark';
  const { confirm } = useConfirm();
  
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
            <div className={`rounded-xl border p-8 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Walk-in Started!</h3>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  Patient is now ready for service
                </p>
              </div>
              
              <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/20">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-green-800 dark:text-green-300">
                      What happens next?
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                      The parent component will guide you through the next steps for this patient.
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleReset}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                } active:scale-[0.98]`}
              >
                Start Another Walk-in
              </button>
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
            <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-red-800 dark:text-red-300">
                    Couldn't Start Walk-in
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {error?.message || 
                     createError?.message || 
                     facilityError || 
                     'Unable to start walk-in session. Please try again.'}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-3 mt-3 border-t border-red-500/20">
                <button
                  onClick={handleRetry}
                  disabled={isCreating}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isDark
                      ? 'bg-red-800 hover:bg-red-700 text-red-200 disabled:opacity-50'
                      : 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50'
                  } active:scale-[0.98]`}
                >
                  Try Again
                </button>
                <button
                  onClick={handleErrorDialogClose}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isDark
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  } active:scale-[0.98]`}
                >
                  Close
                </button>
              </div>
            </div>
            
            {/* Fallback to normal UI for retry */}
            <div className={`rounded-xl border p-8 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                }`}>
                  <UserPlus className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <h3 className="text-xl font-bold mb-2">Retry Walk-in</h3>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  An error occurred. You can try starting the walk-in again.
                </p>
              </div>
              
              <button
                onClick={handleCreateWalkIn}
                disabled={isCreating || (!hasValidFacility && !customFacilityId)}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isCreating || (!hasValidFacility && !customFacilityId)
                    ? 'bg-blue-500/50 cursor-not-allowed text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } active:scale-[0.98] disabled:active:scale-100`}
              >
                {isCreating ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Setting up...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    {createButtonText}
                  </div>
                )}
              </button>
              
              {(!hasValidFacility && !customFacilityId) && (
                <p className={`text-sm text-center mt-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Please select a facility before starting a walk-in
                </p>
              )}
            </div>
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
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              isDark ? 'bg-blue-900/30' : 'bg-blue-100'
            }`}>
              <UserPlus className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Quick Walk-in</h2>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Start immediately - no forms needed
            </p>
          </div>
          
          <div className={`rounded-xl border p-8 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">System-Generated Patient Identity</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    To ensure automatic billing and service tracking.
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Ready for Service</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Patient added to queue immediately
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Billing Ready</div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Payment setup handled automatically
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleCreateWalkIn}
              disabled={isCreating || (!hasValidFacility && !customFacilityId)}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                isCreating || (!hasValidFacility && !customFacilityId)
                  ? 'bg-blue-500/50 cursor-not-allowed text-white'
                  : isDark
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } active:scale-[0.98] disabled:active:scale-100`}
            >
              {isCreating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Setting up...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  {createButtonText}
                </div>
              )}
            </button>
            
            {(!hasValidFacility && !customFacilityId) && (
              <p className={`text-sm text-center mt-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Please select a facility before starting a walk-in
              </p>
            )}
            
            {customFacilityId && (
              <p className={`text-sm text-center mt-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Starting walk-in at selected facility
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

WalkInSessionCreator.displayName = 'WalkInSessionCreator';

export default WalkInSessionCreator;