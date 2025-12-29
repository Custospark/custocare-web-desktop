import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, AlertCircle, Loader2, CheckCircle, Mail, Smartphone, RefreshCw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../app/store/hooks/useApp';
import { loginSuccess } from '../../../../app/store/slices/authSlice';
import AuthLayout from './AuthLayout';
import { cn } from '../../../../shared/types/cn';

/**
 * ============================================================================
 * TWO-FACTOR AUTHENTICATION PAGE COMPONENT
 * ============================================================================
 * 
 * Multi-factor authentication verification for Custocare AI healthcare platform.
 * Implements secure 6-digit PIN/code verification for enhanced account security.
 * 
 * Key Features:
 * - 6-digit verification code input
 * - Auto-focus and auto-advance between digits
 * - Paste support for entire code
 * - Resend code functionality with cooldown
 * - Multiple delivery methods (email/SMS)
 * - Comprehensive error states
 * - Auto-submit on complete input
 * 
 * Security:
 * - Rate limiting on verification attempts
 * - Time-limited codes
 * - Secure token generation
 * - HIPAA-compliant authentication
 */

interface LocationState {
  email?: string;
  phoneNumber?: string;
  method?: 'email' | 'sms';
}

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export const TwoFactorAuthPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useAppSelector((state) => state.ui.theme);

  const state = (location.state as LocationState) || {};
  const { email, phoneNumber, method = 'email' } = state;

  /* ==========================================================================
     LOCAL STATE MANAGEMENT
     ========================================================================== */

  const [code, setCode] = useState<string[]>(new Array(CODE_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Refs for input fields
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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
     REDIRECT ON SUCCESS
     ========================================================================== */

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate('/dashboard');
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

      // Only allow digits
      if (!/^\d*$/.test(value)) return;

      const newCode = [...code];

      // Handle single digit input
      if (value.length === 1) {
        newCode[index] = value;
        setCode(newCode);
        setError('');

        // Auto-advance to next input
        if (index < CODE_LENGTH - 1 && value !== '') {
          inputRefs.current[index + 1]?.focus();
        }
      }
      // Handle paste (multiple digits)
      else if (value.length > 1) {
        const digits = value.slice(0, CODE_LENGTH).split('');
        for (let i = 0; i < digits.length && index + i < CODE_LENGTH; i++) {
          newCode[index + i] = digits[i];
        }
        setCode(newCode);
        setError('');

        // Focus last filled input or next empty one
        const nextIndex = Math.min(index + digits.length, CODE_LENGTH - 1);
        inputRefs.current[nextIndex]?.focus();
      }
    },
    [code]
  );

  const handleKeyDown = useCallback(
    (index: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Handle backspace
      if (e.key === 'Backspace') {
        e.preventDefault();
        const newCode = [...code];

        if (code[index] !== '') {
          // Clear current digit
          newCode[index] = '';
          setCode(newCode);
        } else if (index > 0) {
          // Move to previous digit and clear it
          newCode[index - 1] = '';
          setCode(newCode);
          inputRefs.current[index - 1]?.focus();
        }
      }
      // Handle left arrow
      else if (e.key === 'ArrowLeft' && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      // Handle right arrow
      else if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
      // Handle Enter key - submit if code complete
      else if (e.key === 'Enter' && code.every((digit) => digit !== '')) {
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
      digits.forEach((digit, index) => {
        newCode[index] = digit;
      });
      setCode(newCode);
      setError('');

      // Focus last filled input
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

    try {
      setIsLoading(true);
      setError('');

      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock validation - in production, verify with backend
      // Simulating success for demo (accept any 6-digit code)
      
      // Mock successful authentication
      const mockResponse = {
        user: {
          id: '1',
          email: email || 'user@hospital.com',
          name: 'Dr. Sarah Johnson',
          role: 'Physician',
        },
        token: 'mock_jwt_token_2fa_' + Date.now(),
      };

      dispatch(loginSuccess(mockResponse));
      setIsSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Invalid verification code. Please try again.'
      );
      // Clear code on error
      setCode(new Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  }, [code, email, dispatch]);

  const handleResendCode = useCallback(async () => {
    if (resendCooldown > 0) return;

    try {
      setIsResending(true);
      setError('');

      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Start cooldown
      setResendCooldown(RESEND_COOLDOWN);

      // Clear current code
      setCode(new Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to resend code. Please try again.'
      );
    } finally {
      setIsResending(false);
    }
  }, [resendCooldown]);

  /* ==========================================================================
     COMPUTED VALUES
     ========================================================================== */

  const deliveryDestination = method === 'email' ? email : phoneNumber;
  const deliveryMethod = method === 'email' ? 'email address' : 'phone number';
  const maskedDestination = deliveryDestination
    ? method === 'email'
      ? deliveryDestination.replace(/(.{2})(.*)(@.*)/, '$1***$3')
      : deliveryDestination.replace(/(\d{3})(\d{3})(\d{4})/, '(***) ***-$3')
    : '***';

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
          {method === 'email' ? (
            <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <Smartphone className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <div className="text-sm space-y-1">
            <p className="font-semibold">Verification Code Sent</p>
            <p
              className={cn(
                theme === 'dark' ? 'text-cyan-200/80' : 'text-blue-600'
              )}
            >
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
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
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
                }}
                type="text"
                inputMode="numeric"
                maxLength={2} // Allow 2 for paste handling
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

        {/* Verify button (manual trigger) */}
        <button
          type="button"
          onClick={handleVerify}
          disabled={isLoading || code.some((digit) => digit === '')}
          className={cn(
            'w-full py-3.5 px-6 rounded-xl font-semibold text-base',
            'transition-all duration-200',
            'focus:outline-none focus:ring-4 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'flex items-center justify-center gap-3',
            theme === 'dark'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 focus:ring-cyan-500/50 focus:ring-offset-gray-900'
              : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 focus:ring-blue-500 focus:ring-offset-white',
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

        {/* Resend code */}
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
                  'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                  theme === 'dark' ? 'bg-cyan-500' : 'bg-blue-500'
                )}
              />
              <span>Verification code expires in 10 minutes</span>
            </li>
            <li className="flex items-start gap-2">
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                  theme === 'dark' ? 'bg-cyan-500' : 'bg-blue-500'
                )}
              />
              <span>Never share this code with anyone</span>
            </li>
            <li className="flex items-start gap-2">
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
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