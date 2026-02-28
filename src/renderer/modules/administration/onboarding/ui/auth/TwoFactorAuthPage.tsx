import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  AlertCircle,
  Loader2,
  CheckCircle,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import AuthLayout from './AuthLayout';
import { cn } from '../../../../../shared/types/cn';

// ── AccountQueries integration ───────────────────────────────────
import {
  useVerifyEmail,
  useResendVerification,
} from '../../../../account/api/AccountQueries';
import { selectVerificationContext } from '../../../../../app/store/slices/authSlice';

/**
 * ============================================================================
 * TWO-FACTOR AUTHENTICATION PAGE
 * ============================================================================
 *
 * Handles email-based two-factor authentication with 5-second success delay
 * before redirecting to the dashboard.
 */

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds
const SUCCESS_DELAY = 5000; // 5 seconds in milliseconds

export const TwoFactorAuthPage: React.FC = () => {
  const theme = useAppSelector((state) => state.ui.theme);
  const navigate = useNavigate();

  // ── Authentication context from authSlice ────────────────────────────────
  const verification = useAppSelector(selectVerificationContext);
  const emailFromSlice = verification.email;

  const maskedDestination = emailFromSlice
    ? emailFromSlice.replace(/(.{2})(.*)(@.*)/, '$1••••$3')
    : '•••';

  /* =========================================================================
     LOCAL STATE
     ========================================================================= */

  const [code, setCode] = useState<string[]>(new Array(CODE_LENGTH).fill(''));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [redirectTimer, setRedirectTimer] = useState<number>(5);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const successTimeoutRef = useRef<NodeJS.Timeout>(null);
  const redirectIntervalRef = useRef<NodeJS.Timeout>(null);

  /* =========================================================================
     MUTATION HOOKS
     ========================================================================= */

  const verifyEmailMutation = useVerifyEmail({
    onSuccess: (data) => {
      if (data.success) {
        setIsAuthenticated(true);
        setRedirectTimer(5);
        
        // Clear any existing timeouts/intervals
        if (successTimeoutRef.current) {
          clearTimeout(successTimeoutRef.current);
        }
        if (redirectIntervalRef.current) {
          clearInterval(redirectIntervalRef.current);
        }
        
        // Start countdown
        redirectIntervalRef.current = setInterval(() => {
          setRedirectTimer((prev) => {
            if (prev <= 1) {
              if (redirectIntervalRef.current) {
                clearInterval(redirectIntervalRef.current);
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        // Set timeout for navigation
        successTimeoutRef.current = setTimeout(() => {
          navigate('/dashboard');
        }, SUCCESS_DELAY);
      }
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message || 
        err.message || 
        'Unable to verify the authentication code. Please check and try again.';
      setError(msg);
      setCode(new Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    },
  });

  const resendMutation = useResendVerification({
    onSuccess: (data) => {
      if (data.success) {
        setResendCooldown(RESEND_COOLDOWN);
        setCode(new Array(CODE_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
        setError('');
      }
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message || 
        err.message || 
        'Unable to send a new code at this moment. Please try again shortly.';
      setError(msg);
    },
  });

  const isLoading = verifyEmailMutation.isPending;
  const isResending = resendMutation.isPending;

  /* =========================================================================
     CLEANUP TIMERS ON UNMOUNT
     ========================================================================= */

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      if (redirectIntervalRef.current) {
        clearInterval(redirectIntervalRef.current);
      }
    };
  }, []);

  /* =========================================================================
     COUNTDOWN TIMER FOR RESEND
     ========================================================================= */

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  /* =========================================================================
     AUTO-SUBMIT WHEN CODE IS COMPLETE
     ========================================================================= */

  useEffect(() => {
    if (code.every((digit) => digit !== '') && code.join('').length === CODE_LENGTH) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  /* =========================================================================
     EVENT HANDLERS
     ========================================================================= */

  const handleVerify = useCallback(() => {
    const verificationCode = code.join('');

    if (verificationCode.length !== CODE_LENGTH) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setError('');
    verifyEmailMutation.mutate({ code: verificationCode });
  }, [code, verifyEmailMutation]);

  const handleChange = useCallback(
    (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (!/^\d*$/.test(value)) return;

      const newCode = [...code];

      if (value.length === 1) {
        newCode[index] = value;
        setCode(newCode);
        setError('');
        if (index < CODE_LENGTH - 1 && value !== '') {
          inputRefs.current[index + 1]?.focus();
        }
      } else if (value.length > 1) {
        const digits = value.slice(0, CODE_LENGTH).split('');
        for (let i = 0; i < digits.length && index + i < CODE_LENGTH; i++) {
          newCode[index + i] = digits[i];
        }
        setCode(newCode);
        setError('');
        const nextIndex = Math.min(index + digits.length, CODE_LENGTH - 1);
        inputRefs.current[nextIndex]?.focus();
      }
    },
    [code]
  );

  const handleKeyDown = useCallback(
    (index: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        const newCode = [...code];
        if (code[index] !== '') {
          newCode[index] = '';
          setCode(newCode);
        } else if (index > 0) {
          newCode[index - 1] = '';
          setCode(newCode);
          inputRefs.current[index - 1]?.focus();
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      } else if (e.key === 'Enter' && code.every((digit) => digit !== '')) {
        handleVerify();
      }
    },
    [code, handleVerify]
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, CODE_LENGTH).split('');

    if (digits.length > 0) {
      const newCode = new Array(CODE_LENGTH).fill('');
      digits.forEach((digit, index) => {
        newCode[index] = digit;
      });
      setCode(newCode);
      setError('');
      const lastIndex = Math.min(digits.length - 1, CODE_LENGTH - 1);
      inputRefs.current[lastIndex]?.focus();
    }
  }, []);

  const handleResendCode = useCallback(() => {
    if (resendCooldown > 0 || isResending) return;
    resendMutation.mutate({});
  }, [resendCooldown, isResending, resendMutation]);

  /* =========================================================================
     RENDER – AUTHENTICATION SUCCESS STATE
     ========================================================================= */

  if (isAuthenticated) {
    return (
      <AuthLayout
        title="Access Granted"
        subtitle="Authentication successful"
        heroImage="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&q=80"
        heroHeadline="Identity Verified"
        heroSubtext="Your identity has been confirmed. Redirecting to your secure workspace."
      >
        <div className="space-y-8">
          {/* Success Animation */}
          <div className="flex justify-center">
            <div className="relative">
              {/* Animated rings */}
              <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-emerald-400 dark:bg-emerald-300" />
              <div className="absolute inset-0 rounded-full animate-pulse opacity-30 bg-emerald-500 dark:bg-emerald-400 scale-110" />
              
              {/* Main circle */}
              <div
                className={cn(
                  'relative w-24 h-24 rounded-2xl flex items-center justify-center',
                  'backdrop-blur-xl border-2',
                  theme === 'dark'
                    ? 'bg-emerald-500/20 border-emerald-400/30'
                    : 'bg-emerald-100 border-emerald-500/30'
                )}
              >
                <CheckCircle
                  className={cn(
                    'w-12 h-12 animate-bounce',
                    theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                  )}
                />
              </div>
            </div>
          </div>

          {/* Success Message with Timer */}
          <div
            className={cn(
              'p-8 rounded-2xl border-2 text-center',
              'backdrop-blur-xl transform transition-all duration-700 scale-100 opacity-100',
              'shadow-2xl',
              theme === 'dark'
                ? 'bg-emerald-500/10 border-emerald-500/30 shadow-emerald-500/10'
                : 'bg-emerald-50/80 border-emerald-200 shadow-emerald-500/20'
            )}
          >
            <div className="space-y-4">
              <p
                className={cn(
                  'text-xl font-semibold tracking-tight',
                  theme === 'dark' ? 'text-emerald-300' : 'text-emerald-800'
                )}
              >
                Authentication Verified
              </p>
              <p
                className={cn(
                  'text-sm max-w-md mx-auto leading-relaxed',
                  theme === 'dark' ? 'text-emerald-200/70' : 'text-emerald-700/80'
                )}
              >
                Your identity has been confirmed. Establishing secure session...
              </p>
              
              {/* Progress Indicator */}
              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className={cn(
                    'font-mono',
                    theme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'
                  )}>
                    Session Establishment
                  </span>
                  <span className={cn(
                    'font-mono font-semibold',
                    theme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'
                  )}>
                    {redirectTimer}s
                  </span>
                </div>
                <div className="relative h-2 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden backdrop-blur-sm">
                  <div 
                    className={cn(
                      'absolute left-0 top-0 h-full rounded-full',
                      'bg-gradient-to-r',
                      theme === 'dark'
                        ? 'from-emerald-400 to-cyan-400'
                        : 'from-emerald-600 to-cyan-600'
                    )}
                    style={{ 
                      width: `${((5 - redirectTimer) / 5) * 100}%`,
                      transition: 'width 1s linear'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          <div className="flex justify-center items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-cyan-400 dark:bg-cyan-300" />
              <Loader2
                className={cn(
                  'w-8 h-8 animate-spin',
                  theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
                )}
              />
            </div>
            <span className={cn(
              'text-sm',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}>
              Preparing your workspace...
            </span>
          </div>

          {/* Manual redirect option */}
          <div className="text-center">
            <button
              onClick={() => navigate('/dashboard')}
              className={cn(
                'text-sm font-medium transition-all duration-300',
                'hover:tracking-wider opacity-60 hover:opacity-100',
                theme === 'dark'
                  ? 'text-cyan-400 hover:text-cyan-300'
                  : 'text-blue-600 hover:text-blue-700'
              )}
            >
              Continue to dashboard
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  /* =========================================================================
     RENDER – AUTHENTICATION FORM
     ========================================================================= */

  return (
    <AuthLayout
      title="Two-Factor Authentication"
      subtitle="Enhanced security for your account"
      heroImage="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&q=80"
      heroHeadline="Secure Account Access"
      heroSubtext="Two-factor authentication adds an extra layer of protection to your account. Please enter the code sent to your email."
      showBackToLogin
    >
      <div className="space-y-6">
        {/* Info message */}
        <div
          className={cn(
            'flex items-start gap-3 p-4 rounded-xl border',
            theme === 'dark'
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          )}
        >
          <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-semibold">Authentication Code Sent</p>
            <p className={cn(theme === 'dark' ? 'text-cyan-200/80' : 'text-blue-600')}>
              A 6-digit code has been sent to <strong>{maskedDestination}</strong>
            </p>
            <p className="text-xs opacity-70">
              The code expires in 10 minutes and is required to complete sign-in
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            className={cn(
              'flex items-start gap-3 p-4 rounded-xl border animate-shake',
              theme === 'dark'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-red-50 border-red-200 text-red-700'
            )}
            role="alert"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        {/* Code input */}
        <div className="space-y-3">
          <label
            className={cn(
              'block text-sm font-medium text-center',
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            )}
          >
            Enter 6-Digit Code
          </label>

          <div className="flex justify-center gap-2 sm:gap-3">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={digit}
                onChange={handleChange(index)}
                onKeyDown={handleKeyDown(index)}
                onPaste={index === 0 ? handlePaste : undefined}
                disabled={isLoading}
                className={cn(
                  'w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold',
                  'rounded-xl border-2 transition-all duration-200',
                  'focus:outline-none focus:ring-4',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  theme === 'dark'
                    ? 'bg-gray-900/50 border-gray-800 text-white'
                    : 'bg-white border-gray-300 text-gray-900',
                  digit !== ''
                    ? theme === 'dark'
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-blue-500 bg-blue-50'
                    : '',
                  error
                    ? theme === 'dark'
                      ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-red-400 focus:border-red-500 focus:ring-red-100'
                    : theme === 'dark'
                    ? 'focus:border-cyan-500 focus:ring-cyan-500/20'
                    : 'focus:border-blue-500 focus:ring-blue-100'
                )}
                aria-label={`Code digit ${index + 1}`}
                autoComplete="off"
                autoFocus={index === 0}
              />
            ))}
          </div>
        </div>

        {/* Verify button */}
        <button
          type="button"
          onClick={handleVerify}
          disabled={isLoading || code.some((digit) => digit === '')}
          className={cn(
            'relative w-full py-3.5 px-6 rounded-xl font-semibold text-base',
            'transition-all duration-200 transform',
            'focus:outline-none focus:ring-4 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'flex items-center justify-center gap-3',
            'overflow-hidden group',
            theme === 'dark'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 focus:ring-cyan-500/50 focus:ring-offset-gray-900'
              : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500 focus:ring-blue-500 focus:ring-offset-white',
            !isLoading &&
              code.every((digit) => digit !== '') &&
              'shadow-lg hover:shadow-xl hover:scale-[1.02]'
          )}
        >
          {/* Animated background */}
          <div className={cn(
            'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700',
            'bg-gradient-to-r from-transparent via-white/20 to-transparent',
            'translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000'
          )} />
          
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              <span>Verify Identity</span>
            </>
          )}
        </button>

        {/* Resend code */}
        <div className="text-center space-y-2">
          {resendCooldown > 0 ? (
            <p className={cn('text-sm', theme === 'dark' ? 'text-gray-500' : 'text-gray-600')}>
              Request a new code in {resendCooldown} seconds
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending}
              className={cn(
                'group relative px-6 py-2',
                'text-sm font-medium transition-all duration-200',
                'inline-flex items-center justify-center gap-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'cursor-pointer hover:scale-105 active:scale-95',
                theme === 'dark'
                  ? 'text-cyan-400 hover:text-cyan-300'
                  : 'text-blue-600 hover:text-blue-700',
                isResending && 'animate-pulse'
              )}
            >
              <RefreshCw className={cn(
                'w-4 h-4 transition-transform duration-500',
                'group-hover:rotate-180'
              )} />
              <span>{isResending ? 'Sending...' : 'Request new code'}</span>
            </button>
          )}
        </div>

        {/* Security information */}
        <div
          className={cn(
            'p-4 rounded-xl border space-y-2',
            theme === 'dark'
              ? 'bg-gray-900/30 border-gray-800/50'
              : 'bg-gray-50/50 border-gray-200'
          )}
        >
          <div className="flex items-center gap-2">
            <Shield
              className={cn('w-4 h-4', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}
            />
            <h4
              className={cn(
                'text-xs font-semibold uppercase tracking-wider',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}
            >
              Security Information
            </h4>
          </div>
          <ul
            className={cn(
              'text-xs space-y-1.5',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
            )}
          >
            <li className="flex items-start gap-2">
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                  theme === 'dark' ? 'bg-cyan-500' : 'bg-blue-500'
                )}
              />
              <span>Codes expire 10 minutes after being sent</span>
            </li>
            <li className="flex items-start gap-2">
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                  theme === 'dark' ? 'bg-cyan-500' : 'bg-blue-500'
                )}
              />
              <span>Never share your authentication code with anyone</span>
            </li>
            <li className="flex items-start gap-2">
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                  theme === 'dark' ? 'bg-cyan-500' : 'bg-blue-500'
                )}
              />
              <span>Our team will never ask for your code</span>
            </li>
          </ul>
        </div>

        {/* Support contact */}
        <div
          className={cn(
            'text-center text-sm',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}
        >
          Need assistance?{' '}
          <a
            href="mailto:info@custospark.com"
            className={cn(
              'font-medium transition-colors hover:underline cursor-pointer',
              theme === 'dark'
                ? 'text-cyan-400 hover:text-cyan-300'
                : 'text-blue-600 hover:text-blue-700'
            )}
          >
            Contact support
          </a>
        </div>
      </div>
    </AuthLayout>
  );
};

export default TwoFactorAuthPage;