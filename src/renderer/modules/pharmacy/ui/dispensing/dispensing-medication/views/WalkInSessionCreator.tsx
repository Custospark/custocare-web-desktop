/**
 * ============================================================================
 * WALK-IN SESSION CREATOR COMPONENT
 * ============================================================================
 * 
 * Reusable enterprise-grade component for creating walk-in sessions.
 * Pure business logic - no navigation or pharmacy-specific code.
 * Each module can implement its own "what happens after creation" logic.
 * 
 * @component WalkInSessionCreator
 * @author Healthcare System Team
 * @version 1.0.0
 */

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
 * Reusable Walk-in Session Creator Component
 * 
 * This component only handles session creation. What happens after
 * (navigation, next steps, etc.) is up to the parent component.
 */
export const WalkInSessionCreator: React.FC<WalkInSessionCreatorProps> = ({
  theme = 'light',
  onSessionCreated,
  customFacilityId,
  isLoading: externalLoading,
  error: externalError,
  createButtonText = 'Create Walk-in Session',
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
  
  // Theme classes
  const themeClasses = {
    container: isDark 
      ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100' 
      : 'bg-gradient-to-br from-gray-50 to-white text-gray-900',
    card: isDark 
      ? 'bg-gray-800/80 border-gray-700 backdrop-blur-sm' 
      : 'bg-white/80 border-gray-200 backdrop-blur-sm',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-600',
    textSubtle: isDark ? 'text-gray-300' : 'text-gray-700',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    highlight: isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700',
    success: isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-700',
  };
  
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
      // Could navigate to facility selection here if needed
      setLocalError(null);
    }
  };
  
  const handleRetry = async () => {
    const confirmed = await confirm({
      title: 'Retry Creation',
      message: 'Would you like to retry creating the walk-in session?',
      confirmText: 'Retry',
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
      title: 'Create New Session',
      message: 'Are you sure you want to create another walk-in session?',
      confirmText: 'Create New',
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
      message: 'Close this error message and return to session creation?',
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
            message="Creating walk-in session..."
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
            <div className={`rounded-xl border p-8 ${themeClasses.success} border-green-500/20`}>
              <div className="text-center mb-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Walk-in Session Created!</h3>
                <p className={themeClasses.textMuted}>
                  Session is ready for further processing
                </p>
              </div>
              
              <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'} border ${isDark ? 'border-green-500/20' : 'border-green-200'}`}>
                <div className="flex items-start gap-3">
                  <CheckCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  <div>
                    <div className={`font-medium ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                      Ready for Next Steps
                    </div>
                    <div className={`text-sm mt-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                      The parent component will handle what happens next with this session.
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleReset}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isDark
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 hover:border-gray-600'
                    : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400'
                } active:scale-[0.98]`}
              >
                Create Another Session
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }
  
  // Render error state with dialog
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
            <div className={`mb-4 p-4 rounded-lg ${isDark ? 'bg-red-900/20' : 'bg-red-50'} border ${isDark ? 'border-red-500/20' : 'border-red-200'}`}>
              <div className="flex items-start gap-3">
                <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                <div>
                  <div className={`font-medium ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                    Session Creation Failed
                  </div>
                  <div className={`text-sm mt-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    {error?.message || 
                     createError?.message || 
                     facilityError || 
                     'Unable to create walk-in session. Please try again.'}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-3 mt-3 border-t border-red-500/20">
                <button
                  onClick={handleRetry}
                  disabled={isCreating}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isDark
                      ? 'bg-red-800 hover:bg-red-700 text-red-200 disabled:opacity-50 disabled:cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
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
            <div className={`rounded-xl border p-8 ${themeClasses.card}`}>
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${themeClasses.highlight}`}>
                  <UserPlus className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <h3 className="text-xl font-bold mb-2">Retry Walk-in Session</h3>
                <p className={themeClasses.textMuted}>
                  An error occurred. You can try creating the session again.
                </p>
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
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    {createButtonText}
                  </div>
                )}
              </button>
              
              {(!hasValidFacility && !customFacilityId) && (
                <p className={`text-sm text-center mt-3 ${themeClasses.textMuted}`}>
                  Please select a facility before creating a walk-in session
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
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${themeClasses.highlight}`}>
              <UserPlus className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Customer Walk-in</h2>
            <p className={themeClasses.textMuted}>
              System will automatically generate a customer profile and create a visit record
            </p>
          </div>
          
          <div className={`rounded-xl border p-8 ${themeClasses.card}`}>
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Auto-generated Customer Profile</div>
                  <div className={`text-sm ${themeClasses.textMuted}`}>
                    System creates a unique customer ID
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Visit Record Created</div>
                  <div className={`text-sm ${themeClasses.textMuted}`}>
                    Service container to track all dispensed items
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Billing Cycle Ready</div>
                  <div className={`text-sm ${themeClasses.textMuted}`}>
                    Automatic billing setup for transactions
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
                  Creating...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  {createButtonText}
                </div>
              )}
            </button>
            
            {(!hasValidFacility && !customFacilityId) && (
              <p className={`text-sm text-center mt-3 ${themeClasses.textMuted}`}>
                Please select a facility before creating a walk-in session
              </p>
            )}
            
            {customFacilityId && (
              <p className={`text-sm text-center mt-3 ${themeClasses.textMuted}`}>
                Creating session for Facility ID: {customFacilityId}
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