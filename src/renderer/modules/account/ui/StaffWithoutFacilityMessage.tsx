// StaffWithoutFacilityMessage.tsx
import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, 
  Copy, 
  Mail, 
  Users,
  ArrowRight,
  Bell,
  AlertCircle,
  Shield,
  Sparkles,
  Clock,
  CheckCircle,
  Compass,
  GraduationCap,
  LifeBuoy,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../../../shared/utils/classNameUtils';
import { 
  getStaffUuid, 
  getUserFullName, 
  getStaffContext,
  getUserEmail,
} from '../../../app/store/utils/contextSelectors';
import type { RootState } from '../../../app/store/rootReducer';
import { ACCOUNT_ROUTES, CUSTOCARE_HUB_ROUTES } from '../../../app/routes/routeConstants';
import LoadingSkeleton from '../../../shared/components/Loading/LoadingSkeletons';

interface StaffWithoutFacilityMessageProps {
  theme: 'light' | 'dark';
}

export const StaffWithoutFacilityMessage: React.FC<StaffWithoutFacilityMessageProps> = ({ 
  theme 
}) => {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Get staff information from Redux store using selectors
  const staffUuid = useSelector((state: RootState) => getStaffUuid(state));
  const staffFullName = useSelector((state: RootState) => getUserFullName(state));
  const staffContext = useSelector((state: RootState) => getStaffContext(state));
  const userEmail = useSelector((state: RootState) => getUserEmail(state));

  // Derived values with proper fallbacks
  const displayStaffNumber = staffUuid || staffContext?.staff_uuid || null;
  const displayName = staffFullName !== 'Guest' 
    ? staffFullName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    : 'Valued Team Member';  const hasStaffNumber = !!displayStaffNumber && displayStaffNumber !== 'Not assigned yet';

  const handleCopyStaffNumber = useCallback(async () => {
    if (!displayStaffNumber) return;
    
    try {
      await navigator.clipboard.writeText(displayStaffNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy staff number:', err);
    }
  }, [displayStaffNumber]);

  const handleNavigateToInvitations = useCallback(() => {
    setIsNavigating(true);
    // Small delay to show loading state for better UX
    setTimeout(() => {
      navigate(ACCOUNT_ROUTES.INVITATIONS);
    }, 300);
  }, [navigate]);

  // Animation variants for consistency with your app
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const cardVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1, 
      transition: { delay: 0.1, type: 'spring' as const, stiffness: 200 } 
    }
  };

  const badgeVariants = {
    hidden: { scale: 0 },
    visible: { 
      scale: 1, 
      transition: { delay: 0.2, type: 'spring' as const, stiffness: 300 } 
    }
  };

  const iconVariants = {
    hidden: { scale: 0 },
    visible: { 
      scale: 1, 
      transition: { delay: 0.3, type: 'spring' as const, stiffness: 200 } 
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({ 
      opacity: 1, 
      x: 0, 
      transition: { delay: 0.4 + (i * 0.1) } 
    })
  };

  // Show loading skeleton when navigating
  if (isNavigating) {
    return (
      <LoadingSkeleton 
        variant="default"
        message="Taking you to your invitations..."
        theme={theme}
      />
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="staff-message"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          'min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 md:p-6',
          isDark ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50/30'
        )}
      >
        <div className="max-w-4xl w-full">
          {/* Main Card */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className={cn(
              'relative overflow-hidden rounded-2xl border-2 shadow-2xl transition-all duration-300',
              isDark
                ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-blue-500/30 hover:border-blue-500/50'
                : 'bg-gradient-to-br from-white/90 to-blue-50/30 border-blue-200 hover:border-blue-300',
              'backdrop-blur-sm'
            )}
          >
            {/* Animated Background Gradient */}
            <div className={cn(
              'absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl transition-opacity duration-1000',
              isDark ? 'bg-blue-500/20 animate-pulse' : 'bg-blue-500/10 animate-pulse'
            )} />
            <div className={cn(
              'absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl transition-opacity duration-1000 delay-500',
              isDark ? 'bg-purple-500/20 animate-pulse' : 'bg-purple-500/10 animate-pulse'
            )} />
            
            <div className="relative p-6 md:p-10 lg:p-12">
              {/* Status Badge */}
              <motion.div
                variants={badgeVariants}
                initial="hidden"
                animate="visible"
                className="flex justify-center mb-6"
              >
                <div className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 shadow-lg',
                  isDark
                    ? 'bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-green-500/40 text-green-400'
                    : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700'
                )}>
                  <Sparkles className="w-4 h-4" />
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-semibold">Awaiting Facility Assignment</span>
                </div>
              </motion.div>

              {/* Header Section */}
              <div className="text-center mb-8">
                <motion.div
                  variants={iconVariants}
                  initial="hidden"
                  animate="visible"
                  className={cn(
                    'w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center shadow-xl',
                    isDark 
                      ? 'bg-gradient-to-br from-blue-600/30 to-blue-700/30 border border-blue-500/30' 
                      : 'bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-300',
                    'transition-all duration-300 hover:scale-110'
                  )}
                >
                  <UserPlus className={cn(
                    'w-10 h-10',
                    isDark ? 'text-blue-400' : 'text-blue-600'
                  )} />
                </motion.div>
                
                <h1 className={cn(
                  'text-2xl md:text-4xl font-bold mb-3 bg-gradient-to-r bg-clip-text text-transparent',
                  isDark 
                    ? 'from-white to-gray-300 bg-gradient-to-r from-white via-blue-100 to-gray-300' 
                    : 'from-gray-900 to-gray-700 bg-gradient-to-r from-gray-900 via-blue-800 to-gray-700'
                )}>
                  Welcome to Custocare, {displayName}!
                </h1>
                
                <p className={cn(
                  'text-base md:text-lg max-w-md mx-auto',
                  isDark ? 'text-gray-300' : 'text-gray-600'
                )}>
                  Your professional healthcare journey begins here
                </p>
              </div>

              {/* Staff Number Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className={cn(
                  'rounded-xl border-2 p-6 mb-8 transition-all duration-300',
                  isDark
                    ? 'bg-gray-800/60 border-gray-700 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10'
                    : 'bg-white/80 border-gray-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10',
                  'backdrop-blur-sm'
                )}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    'p-2 rounded-xl',
                    isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                  )}>
                    <Shield className={cn(
                      'w-5 h-5',
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    )} />
                  </div>
                  <div>
                    <h2 className={cn(
                      'text-lg md:text-xl font-semibold',
                      isDark ? 'text-white' : 'text-gray-900'
                    )}>
                      Your Professional Identification
                    </h2>
                    <p className={cn(
                      'text-xs',
                      isDark ? 'text-gray-500' : 'text-gray-500'
                    )}>
                      Unique healthcare provider identifier
                    </p>
                  </div>
                </div>

                <p className={cn(
                  'mb-4 text-sm',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}>
                  This confidential number is your key to accessing clinical workspaces. 
                  Share it securely with authorized Facility Managers to receive facility invitations.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch gap-3">
                  <div className={cn(
                    'flex-1 p-4 rounded-xl border-2 font-mono text-center transition-all',
                    isDark
                      ? 'bg-gray-900/80 border-gray-600 text-blue-400'
                      : 'bg-gray-50 border-gray-300 text-blue-700',
                    'text-base md:text-lg font-bold tracking-wider',
                    hasStaffNumber && 'hover:border-blue-400'
                  )}>
                    {!hasStaffNumber ? (
                      <div className="flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-normal">
                          Staff number pending assignment
                        </span>
                      </div>
                    ) : (
                      displayStaffNumber
                    )}
                  </div>

                  {hasStaffNumber && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCopyStaffNumber}
                      className={cn(
                        'px-6 py-4 rounded-xl font-medium inline-flex items-center justify-center gap-2',
                        'border-2 transition-all duration-200',
                        isDark
                          ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600 hover:text-white'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300',
                        'cursor-pointer group'
                      )}
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-500 animate-in zoom-in" />
                          <span>Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5 transition-transform group-hover:scale-110" />
                          <span>Copy Staff Number</span>
                        </>
                      )}
                    </motion.button>
                  )}
                </div>

                {!hasStaffNumber && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'mt-4 p-3 rounded-xl border-2',
                      isDark
                        ? 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400'
                        : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <Bell className="w-4 h-4 mt-0.5 flex-shrink-0 animate-pulse" />
                      <p className="text-sm">
                        Your staff profile is being processed. Once your facility administrator 
                        assigns your staff number, you'll be able to receive invitations.
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Instructions Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-2 rounded-xl',
                    isDark ? 'bg-purple-500/20' : 'bg-purple-100'
                  )}>
                    <Users className={cn(
                      'w-5 h-5',
                      isDark ? 'text-purple-400' : 'text-purple-600'
                    )} />
                  </div>
                  <div>
                    <h2 className={cn(
                      'text-lg md:text-xl font-semibold',
                      isDark ? 'text-white' : 'text-gray-900'
                    )}>
                      Getting Started
                    </h2>
                    <p className={cn(
                      'text-xs',
                      isDark ? 'text-gray-500' : 'text-gray-500'
                    )}>
                      Three simple steps to begin your journey
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  {/* Step 1 */}
                  <motion.div
                    custom={0}
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    className={cn(
                      'flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-300',
                      isDark 
                        ? 'border-gray-700 hover:border-blue-500/30 hover:bg-gray-800/30' 
                        : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/30',
                      'group'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold transition-all',
                      isDark 
                        ? 'bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30' 
                        : 'bg-blue-100 text-blue-700 group-hover:bg-blue-200',
                      'shadow-md'
                    )}>
                      1
                    </div>
                    <div>
                      <p className={cn(
                        'font-semibold mb-1',
                        isDark ? 'text-white' : 'text-gray-900'
                      )}>
                        Copy Your Staff Number
                      </p>
                      <p className={cn(
                        'text-sm',
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        Save your unique staff identification number securely. This is your 
                        professional identifier across all Custocare facilities.
                      </p>
                    </div>
                  </motion.div>

                  {/* Step 2 */}
                  <motion.div
                    custom={1}
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    className={cn(
                      'flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-300',
                      isDark 
                        ? 'border-gray-700 hover:border-blue-500/30 hover:bg-gray-800/30' 
                        : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/30',
                      'group'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold transition-all',
                      isDark 
                        ? 'bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30' 
                        : 'bg-blue-100 text-blue-700 group-hover:bg-blue-200',
                      'shadow-md'
                    )}>
                      2
                    </div>
                    <div>
                      <p className={cn(
                        'font-semibold mb-1',
                        isDark ? 'text-white' : 'text-gray-900'
                      )}>
                        Share with Authorized Manager
                      </p>
                      <p className={cn(
                        'text-sm',
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        Provide your staff number to your Hospital Manager or Facility 
                        Administrator. They will send you a secure invitation to join 
                        their clinical workspace.
                      </p>
                    </div>
                  </motion.div>

                  {/* Step 3 */}
                  <motion.div
                    custom={2}
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    className={cn(
                      'flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-300',
                      isDark 
                        ? 'border-gray-700 hover:border-blue-500/30 hover:bg-gray-800/30' 
                        : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/30',
                      'group'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold transition-all',
                      isDark 
                        ? 'bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30' 
                        : 'bg-blue-100 text-blue-700 group-hover:bg-blue-200',
                      'shadow-md'
                    )}>
                      3
                    </div>
                    <div>
                      <p className={cn(
                        'font-semibold mb-1',
                        isDark ? 'text-white' : 'text-gray-900'
                      )}>
                        Accept Your Invitation
                      </p>
                      <p className={cn(
                        'text-sm',
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        Navigate to{' '}
                        <span className={cn(
                          'font-mono text-xs px-1.5 py-0.5 rounded',
                          isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                        )}>
                          Accounts → Access & Invitations
                        </span>{' '}
                        to accept facility access and begin your clinical work.
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Explore Custocare Hub */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-xl',
                      isDark ? 'bg-sky-500/20' : 'bg-sky-100'
                    )}>
                      <Compass className={cn(
                        'w-5 h-5',
                        isDark ? 'text-sky-400' : 'text-sky-600'
                      )} />
                    </div>
                    <div>
                      <h2 className={cn(
                        'text-lg md:text-xl font-semibold',
                        isDark ? 'text-white' : 'text-gray-900'
                      )}>
                        Explore Custocare Hub
                      </h2>
                      <p className={cn(
                        'text-xs',
                        isDark ? 'text-gray-500' : 'text-gray-500'
                      )}>
                        Discover resources and learn the platform while you wait
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {/* Learning Center */}
                    <motion.button
                      custom={0}
                      variants={stepVariants}
                      initial="hidden"
                      animate="visible"
                      onClick={() => navigate(CUSTOCARE_HUB_ROUTES.LEARNING_CENTER)}
                      className={cn(
                        'flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-300 text-left w-full',
                        isDark 
                          ? 'border-gray-700 hover:border-sky-500/30 hover:bg-gray-800/30' 
                          : 'border-gray-200 hover:border-sky-200 hover:bg-sky-50/30',
                        'group cursor-pointer'
                      )}
                    >
                      <div className={cn(
                        'p-2 rounded-xl shrink-0 transition-all',
                        isDark 
                          ? 'bg-sky-500/20 text-sky-400 group-hover:bg-sky-500/30' 
                          : 'bg-sky-100 text-sky-600 group-hover:bg-sky-200',
                        'shadow-md'
                      )}>
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn(
                            'font-semibold',
                            isDark ? 'text-white' : 'text-gray-900'
                          )}>
                            Learning Center
                          </p>
                          <ExternalLink className={cn(
                            'w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5',
                            isDark ? 'text-gray-500' : 'text-gray-400'
                          )} />
                        </div>
                        <p className={cn(
                          'text-sm',
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        )}>
                          New to Custocare? Start with guided tutorials, watch training 
                          videos, and track your learning progress
                        </p>
                      </div>
                    </motion.button>

                    {/* Support Center */}
                    <motion.button
                      custom={1}
                      variants={stepVariants}
                      initial="hidden"
                      animate="visible"
                      onClick={() => navigate(CUSTOCARE_HUB_ROUTES.SUPPORT_CENTER)}
                      className={cn(
                        'flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-300 text-left w-full',
                        isDark 
                          ? 'border-gray-700 hover:border-sky-500/30 hover:bg-gray-800/30' 
                          : 'border-gray-200 hover:border-sky-200 hover:bg-sky-50/30',
                        'group cursor-pointer'
                      )}
                    >
                      <div className={cn(
                        'p-2 rounded-xl shrink-0 transition-all',
                        isDark 
                          ? 'bg-sky-500/20 text-sky-400 group-hover:bg-sky-500/30' 
                          : 'bg-sky-100 text-sky-600 group-hover:bg-sky-200',
                        'shadow-md'
                      )}>
                        <LifeBuoy className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn(
                            'font-semibold',
                            isDark ? 'text-white' : 'text-gray-900'
                          )}>
                            Help Center
                          </p>
                          <ExternalLink className={cn(
                            'w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5',
                            isDark ? 'text-gray-500' : 'text-gray-400'
                          )} />
                        </div>
                        <p className={cn(
                          'text-sm',
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        )}>
                          Browse frequently asked questions, search help articles, 
                          or open a support ticket
                        </p>
                      </div>
                    </motion.button>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="pt-4 flex flex-col sm:flex-row gap-3"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNavigateToInvitations}
                    disabled={isNavigating}
                    className={cn(
                      'inline-flex items-center justify-center gap-2 flex-1 px-6 py-3 rounded-xl font-semibold',
                      'border-2 transition-all duration-300 transform hover:-translate-y-0.5',
                      isDark
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 border-blue-500/50 text-white hover:shadow-xl hover:shadow-blue-500/30'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-300 text-white hover:shadow-xl hover:shadow-blue-500/30',
                      'cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0'
                    )}
                  >
                    <span>View My Invitations</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </motion.button>

                  <button
                    onClick={() => setShowSupport(!showSupport)}
                    className={cn(
                      'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium',
                      'border-2 transition-all duration-300',
                      isDark
                        ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300',
                      'cursor-pointer'
                    )}
                  >
                    <Mail className="w-4 h-4" />
                    <span>Need Help?</span>
                  </button>
                </motion.div>

                {/* Support Section */}
                <AnimatePresence>
                  {showSupport && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className={cn(
                        'mt-4 p-4 rounded-xl text-center border-2',
                        isDark
                          ? 'bg-gray-800/50 border-gray-700'
                          : 'bg-gray-50 border-gray-200'
                      )}>
                        <div className="flex flex-col items-center gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span className="font-medium">Contact Support</span>
                          </div>
                          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                            For assistance, contact your facility administrator or email our support team at
                          </p>
                          <a 
                            href="mailto:custocare@custospark.com" 
                            className={cn(
                              'font-semibold underline transition-colors inline-flex items-center gap-1',
                              isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                            )}
                          >
                            custocare@custospark.com
                            <ArrowRight className="w-3 h-3" />
                          </a>
                          {userEmail && (
                            <p className={cn(
                              'text-xs mt-2',
                              isDark ? 'text-gray-500' : 'text-gray-400'
                            )}>
                              We'll respond to: {userEmail}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Footer Note */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className={cn(
                  'mt-8 pt-6 text-center border-t-2 text-xs',
                  isDark ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'
                )}
              >
                <p>This is a secure healthcare platform. All access is monitored and logged for compliance.</p>
                <p className="mt-1">© {new Date().getFullYear()} Custocare — Healthcare Management System</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StaffWithoutFacilityMessage;