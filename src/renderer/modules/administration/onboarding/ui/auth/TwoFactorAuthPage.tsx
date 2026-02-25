import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, Loader2, CheckCircle, Mail, Smartphone, RefreshCw } from 'lucide-react';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import AuthLayout from './AuthLayout';
import { cn } from '../../../../../shared/types/cn';
import {
  selectVerificationContext,
  selectPendingLogin,
} from '../../../../../app/store/slices/authSlice';
import {
  useVerifyEmail,
  useVerifyMfa,
  useResendVerification,
} from  '../../../../account/api/AccountQueries';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export const TwoFactorAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useAppSelector((state) => state.ui.theme);

  // Get verification context and pending login from slice
  const verification = useAppSelector(selectVerificationContext);
  const pendingLogin = useAppSelector(selectPendingLogin);

  /* ==========================================================================
     MUTATIONS
     ========================================================================== */
  const verifyEmailMutation = useVerifyEmail({
    onSuccess: () => {
      setIsSuccess(true);
      // Navigation is handled inside the hook; we just set local success for UI flash
    },
  });

  const verifyMfaMutation = useVerifyMfa({
    onSuccess: () => {
      setIsSuccess(true);
    },
  });

  const resendMutation = useResendVerification();

  /* ==========================================================================
     LOCAL STATE
     ========================================================================== */
  const [code, setCode] = useState<string[]>(new Array(CODE_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ==========================================================================
     DETERMINE VERIFICATION TYPE
     ========================================================================== */
  const verificationType = verification.type; // 'email' or 'mfa'
  const userEmail = verification.email || pendingLogin?.email;

  // For display: email verification uses email, MFA shows generic message
  const deliveryMethod = verificationType === 'email' ? 'email' : 'authenticator app';
  const maskedDestination =
    verificationType === 'email' && userEmail
      ? userEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')
      : 'your registered device';

  /* ==========================================================================
     COUNTDOWN TIMER FOR RESEND
     ========================================================================== */
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  /* ==========================================================================
     AUTO-SUBMIT WHEN CODE COMPLETE
     ========================================================================== */
  useEffect(() => {
    if (code.every((digit) => digit !== '') && code.join('').length === CODE_LENGTH) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  /* ==========================================================================
     REDIRECT ON SUCCESS (if needed, though hooks navigate)
     ========================================================================== */
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        // Hooks already navigate, but this is a fallback
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  /* ==========================================================================
     EVENT HANDLERS
     ========================================================================== */
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
    [code]
  );

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, CODE_LENGTH).split('');
    if (digits.length > 0) {
      const newCode = new Array(CODE_LENGTH).fill('');
      digits.forEach((digit, i) => (newCode[i] = digit));
      setCode(newCode);
      setError('');
      const lastIndex = Math.min(digits.length - 1, CODE_LENGTH - 1);
      inputRefs.current[lastIndex]?.focus();
    }
  }, []);

  const handleVerify = useCallback(async () => {
    const verificationCode = code.join('');
    if (verificationCode.length !== CODE_LENGTH) {
      setError('Please enter the complete verification code');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      if (verificationType === 'email') {
        // Email verification
        verifyEmailMutation.mutate({
          code: verificationCode,
          is_token: false, // assuming not token-based; adjust if needed
          // user_id will be taken from slice automatically by the hook
        });
      } else if (verificationType === 'mfa') {
        // MFA verification
        verifyMfaMutation.mutate({ mfa_code: verificationCode });
      } else {
        throw new Error('No active verification context');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setCode(new Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  }, [code, verificationType, verifyEmailMutation, verifyMfaMutation]);

  const handleResendCode = useCallback(async () => {
    if (resendCooldown > 0 || verificationType !== 'email') return; // only resend for email

    try {
      setIsResending(true);
      setError('');
      resendMutation.mutate({}); // user_id taken from slice automatically
      setResendCooldown(RESEND_COOLDOWN);
      setCode(new Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  }, [resendCooldown, verificationType, resendMutation]);

  /* ==========================================================================
     RENDER - SUCCESS STATE
     ========================================================================== */
  if (isSuccess) {
    return (
      <AuthLayout
        title="Verification Successful"
        subtitle="Access granted to your account"
        heroImage="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&q=80"
        heroHeadline="Secure Access Verified"
        heroSubtext="Your identity has been confirmed. Welcome back to Custocare AI."
      >
        <div className="space-y-6">
          <div className="flex justify-center">
            <div
              className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center',
                theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-100'
              )}
            >
              <CheckCircle
                className={cn(
                  'w-10 h-10',
                  theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                )}
              />
            </div>
          </div>
          <div
            className={cn(
              'p-6 rounded-xl border text-center',
              theme === 'dark'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-emerald-50 border-emerald-200'
            )}
          >
            <p
              className={cn(
                'text-base font-semibold',
                theme === 'dark' ? 'text-emerald-300' : 'text-emerald-800'
              )}
            >
              Authentication Complete
            </p>
            <p
              className={cn(
                'text-sm mt-2',
                theme === 'dark' ? 'text-emerald-200/80' : 'text-emerald-700'
              )}
            >
              Redirecting to your dashboard...
            </p>
          </div>
          <div className="flex justify-center">
            <Loader2
              className={cn(
                'w-8 h-8 animate-spin',
                theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
              )}
            />
          </div>
        </div>
      </AuthLayout>
    );
  }

  /* ==========================================================================
     RENDER - VERIFICATION FORM
     ========================================================================== */
  return (
    <AuthLayout
      title="Two-Factor Authentication"
      subtitle="Enter the verification code sent to your device"
      heroImage="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&q=80"
      heroHeadline="Enhanced Security"
      heroSubtext="Multi-factor authentication protects your account and sensitive patient data from unauthorized access."
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
          {verificationType === 'email' ? (
            <Mail className="w-5 h-5 shrink-0 mt-0.5" />
          ) : (
            <Smartphone className="w-5 h-5 shrink-0 mt-0.5" />
          )}
          <div className="text-sm space-y-1">
            <p className="font-semibold">Verification Code Sent</p>
            <p className={cn(theme === 'dark' ? 'text-cyan-200/80' : 'text-blue-600')}>
              We've sent a 6-digit code to your {deliveryMethod}:{' '}
              <strong>{maskedDestination}</strong>
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div
            className={cn(
              'flex items-start gap-3 p-4 rounded-xl border',
              theme === 'dark'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-red-50 border-red-200 text-red-700'
            )}
            role="alert"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Code input */}
        <div className="space-y-3">
          <label
            className={cn(
              'block text-sm font-semibold text-center',
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            )}
          >
            Enter Verification Code
          </label>
        <div className="flex justify-center gap-2 sm:gap-3">
      {code.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
            // Don't return anything - implicit void
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
          aria-label={`Digit ${index + 1}`}
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
          disabled={
            isLoading ||
            code.some((digit) => digit === '') ||
            (!verificationType && !pendingLogin)
          }
          className={cn(
            'w-full py-3.5 px-6 rounded-xl font-semibold text-base',
            'transition-all duration-200',
            'focus:outline-none focus:ring-4 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'flex items-center justify-center gap-3',
            theme === 'dark'
              ? 'bg-linear-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 focus:ring-cyan-500/50 focus:ring-offset-gray-900'
              : 'bg-linear-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 focus:ring-blue-500 focus:ring-offset-white',
            !isLoading &&
              code.every((digit) => digit !== '') &&
              'shadow-lg hover:shadow-xl hover:scale-[1.02]'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              <span>Verify Code</span>
            </>
          )}
        </button>

        {/* Resend code - only for email verification */}
        {verificationType === 'email' && (
          <div className="text-center space-y-2">
            {resendCooldown > 0 ? (
              <p
                className={cn(
                  'text-sm',
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                )}
              >
                Resend code in {resendCooldown} seconds
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isResending}
                className={cn(
                  'text-sm font-semibold transition-colors',
                  'inline-flex items-center gap-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  theme === 'dark'
                    ? 'text-cyan-400 hover:text-cyan-300'
                    : 'text-blue-600 hover:text-blue-700'
                )}
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Resend Verification Code</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Security info */}
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
              className={cn(
                'w-4 h-4',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}
            />
            <h4
              className={cn(
                'text-xs font-semibold uppercase tracking-wider',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              )}
            >
              Security Notice
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
                  'w-1.5 h-1.5 rounded-full mt-1.5 shrink-0',
                  theme === 'dark' ? 'bg-cyan-500' : 'bg-blue-500'
                )}
              />
              <span>Verification code expires in 10 minutes</span>
            </li>
            <li className="flex items-start gap-2">
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full mt-1.5 shrink-0',
                  theme === 'dark' ? 'bg-cyan-500' : 'bg-blue-500'
                )}
              />
              <span>Never share this code with anyone</span>
            </li>
            <li className="flex items-start gap-2">
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full mt-1.5 shrink-0',
                  theme === 'dark' ? 'bg-cyan-500' : 'bg-blue-500'
                )}
              />
              <span>Custocare AI will never ask for this code</span>
            </li>
          </ul>
        </div>

        {/* Help link */}
        <div
          className={cn(
            'text-center text-sm',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}
        >
          Having trouble?{' '}
          <Link
            to="/help"
            className={cn(
              'font-semibold transition-colors',
              theme === 'dark'
                ? 'text-cyan-400 hover:text-cyan-300'
                : 'text-blue-600 hover:text-blue-700'
            )}
          >
            Contact Support
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default TwoFactorAuthPage;