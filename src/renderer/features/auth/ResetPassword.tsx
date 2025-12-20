import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, AlertCircle, Loader2, CheckCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAppSelector } from '../../store/hooks/useApp';
import AuthLayout from './AuthLayout';
import { cn } from '../../types/cn';

/**
 * ============================================================================
 * RESET PASSWORD PAGE COMPONENT
 * ============================================================================
 * 
 * Secure password reset interface for Custocare AI healthcare platform.
 * Handles the final step of password recovery after email verification.
 * 
 * Key Features:
 * - Token validation from URL parameters
 * - Password strength requirements
 * - Real-time password matching validation
 * - Password visibility toggles
 * - Comprehensive error handling
 * - Success state with auto-redirect
 * 
 * Security:
 * - Validates reset token before allowing password change
 * - Enforces strong password requirements
 * - Single-use token system
 * - Time-limited token validity
 */

interface FormState {
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  password?: string;
  confirmPassword?: string;
  token?: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useAppSelector((state) => state.ui.theme);

  /* ==========================================================================
     LOCAL STATE MANAGEMENT
     ========================================================================== */

  const [formState, setFormState] = useState<FormState>({
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [touched, setTouched] = useState<{ password: boolean; confirmPassword: boolean }>({
    password: false,
    confirmPassword: false,
  });

  // Extract token from URL
  const resetToken = searchParams.get('token');
  const email = searchParams.get('email');

  /* ==========================================================================
     TOKEN VALIDATION ON MOUNT
     ========================================================================== */

  useEffect(() => {
    const validateToken = async () => {
      if (!resetToken) {
        setFormErrors({ token: 'Invalid or missing reset token' });
        setTokenValid(false);
        setIsValidatingToken(false);
        return;
      }

      try {
        // TODO: Replace with actual API call to validate token
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Mock validation - in production, check with backend
        setTokenValid(true);
      } catch {
        setFormErrors({
          token: 'Reset link has expired or is invalid. Please request a new one.',
        });
        setTokenValid(false);
      } finally {
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, [resetToken]);

  /* ==========================================================================
     AUTO-REDIRECT ON SUCCESS
     ========================================================================== */

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  /* ==========================================================================
     VALIDATION LOGIC
     ========================================================================== */

  const calculatePasswordStrength = useCallback((password: string): PasswordStrength => {
    if (!password) return { score: 0, label: '', color: '' };

    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const normalized = Math.min(score, 4);

    const configs = [
      { label: 'Weak', color: 'bg-red-500' },
      { label: 'Fair', color: 'bg-orange-500' },
      { label: 'Good', color: 'bg-yellow-500' },
      { label: 'Strong', color: 'bg-emerald-500' },
      { label: 'Very Strong', color: 'bg-green-600' },
    ];

    return {
      score: normalized,
      label: configs[normalized]?.label || '',
      color: configs[normalized]?.color || '',
    };
  }, []);

  const validatePassword = useCallback(
    (password: string): string | undefined => {
      if (!password) return 'New password is required';
      if (password.length < 8) return 'Password must be at least 8 characters';
      
      const strength = calculatePasswordStrength(password);
      if (strength.score < 2) {
        return 'Password is too weak. Add more characters, numbers, or symbols';
      }
      
      return undefined;
    },
    [calculatePasswordStrength]
  );

  const validateConfirmPassword = useCallback(
    (confirmPassword: string): string | undefined => {
      if (!confirmPassword) return 'Please confirm your password';
      if (confirmPassword !== formState.password) return 'Passwords do not match';
      return undefined;
    },
    [formState.password]
  );

  /* ==========================================================================
     EVENT HANDLERS
     ========================================================================== */

  const handleInputChange = useCallback((field: keyof FormState) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormState((prev) => ({ ...prev, [field]: e.target.value }));
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }, []);

  const handleBlur = useCallback(
    (field: keyof FormState) => {
      return () => {
        setTouched((prev) => ({ ...prev, [field]: true }));

        const error =
          field === 'password'
            ? validatePassword(formState.password)
            : validateConfirmPassword(formState.confirmPassword);

        if (error) {
          setFormErrors((prev) => ({ ...prev, [field]: error }));
        }
      };
    },
    [formState, validatePassword, validateConfirmPassword]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      setTouched({ password: true, confirmPassword: true });

      const errors: FormErrors = {
        password: validatePassword(formState.password),
        confirmPassword: validateConfirmPassword(formState.confirmPassword),
      };

      setFormErrors(errors);

      if (errors.password || errors.confirmPassword) return;

      try {
        setIsLoading(true);

        // TODO: Replace with actual API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        setIsSuccess(true);
      } catch (err) {
        setFormErrors({
          token:
            err instanceof Error
              ? err.message
              : 'Failed to reset password. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [formState, validatePassword, validateConfirmPassword]
  );

  /* ==========================================================================
     COMPUTED VALUES
     ========================================================================== */

  const passwordStrength = calculatePasswordStrength(formState.password);
  const showPasswordError = touched.password && formErrors.password;
  const showConfirmError = touched.confirmPassword && formErrors.confirmPassword;
  const isFormValid =
    formState.password &&
    formState.confirmPassword &&
    !formErrors.password &&
    !formErrors.confirmPassword;

  /* ==========================================================================
     RENDER - LOADING STATE
     ========================================================================== */

  if (isValidatingToken) {
    return (
      <AuthLayout
        title="Validating Reset Link"
        subtitle="Please wait while we verify your request"
        showBackToLogin
      >
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <Loader2
            className={cn(
              'w-16 h-16 animate-spin',
              theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'
            )}
          />
          <p
            className={cn(
              'text-sm text-center',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}
          >
            Verifying your reset token...
          </p>
        </div>
      </AuthLayout>
    );
  }

  /* ==========================================================================
     RENDER - INVALID TOKEN STATE
     ========================================================================== */

  if (!tokenValid) {
    return (
      <AuthLayout
        title="Invalid Reset Link"
        subtitle="This password reset link is invalid or has expired"
        showBackToLogin
      >
        <div className="space-y-6">
          <div
            className={cn(
              'flex items-start gap-3 p-5 rounded-xl border',
              theme === 'dark'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-red-50 border-red-200 text-red-700'
            )}
            role="alert"
          >
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold">Reset Link Expired or Invalid</p>
              <p
                className={cn(
                  'text-sm',
                  theme === 'dark' ? 'text-red-200/80' : 'text-red-600'
                )}
              >
                {formErrors.token ||
                  'This reset link may have expired, been used already, or is invalid.'}
              </p>
            </div>
          </div>

          <Link
            to="/forgot-password"
            className={cn(
              'w-full py-3.5 px-6 rounded-xl font-semibold text-base',
              'transition-all duration-200',
              'focus:outline-none focus:ring-4 focus:ring-offset-2',
              'flex items-center justify-center',
              theme === 'dark'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 focus:ring-cyan-500/50 focus:ring-offset-gray-900'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 focus:ring-blue-500 focus:ring-offset-white',
              'shadow-lg hover:shadow-xl hover:scale-[1.02]'
            )}
          >
            Request New Reset Link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  /* ==========================================================================
     RENDER - SUCCESS STATE
     ========================================================================== */

  if (isSuccess) {
    return (
      <AuthLayout
        title="Password Reset Successful"
        subtitle="Your password has been updated securely"
        showBackToLogin
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
              'p-6 rounded-xl border text-center space-y-3',
              theme === 'dark'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-emerald-50 border-emerald-200'
            )}
          >
            <h3
              className={cn(
                'text-lg font-semibold',
                theme === 'dark' ? 'text-emerald-300' : 'text-emerald-800'
              )}
            >
              All Set!
            </h3>
            <p
              className={cn(
                'text-sm',
                theme === 'dark' ? 'text-emerald-200/80' : 'text-emerald-700'
              )}
            >
              Your password has been changed successfully. You can now sign in with
              your new password.
            </p>
          </div>

          <Link
            to="/login"
            className={cn(
              'w-full py-3.5 px-6 rounded-xl font-semibold text-base',
              'transition-all duration-200',
              'focus:outline-none focus:ring-4 focus:ring-offset-2',
              'flex items-center justify-center gap-2',
              theme === 'dark'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 focus:ring-cyan-500/50 focus:ring-offset-gray-900'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 focus:ring-blue-500 focus:ring-offset-white',
              'shadow-lg hover:shadow-xl hover:scale-[1.02]'
            )}
          >
            Continue to Sign In
          </Link>

          <p
            className={cn(
              'text-xs text-center',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
            )}
          >
            Redirecting automatically in 3 seconds...
          </p>
        </div>
      </AuthLayout>
    );
  }

  /* ==========================================================================
     RENDER - FORM STATE
     ========================================================================== */

  return (
    <AuthLayout
      title="Create New Password"
      subtitle={email ? `Resetting password for ${email}` : 'Enter your new password'}
      heroImage="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&q=80"
      heroHeadline="Secure Password Reset"
      heroSubtext="Your account security is paramount. Create a strong password to protect your healthcare data."
      showBackToLogin
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Security notice */}
        <div
          className={cn(
            'flex items-start gap-3 p-4 rounded-xl border',
            theme === 'dark'
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          )}
        >
          <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-semibold">Password Requirements</p>
            <ul
              className={cn(
                'text-xs space-y-0.5 list-disc list-inside',
                theme === 'dark' ? 'text-cyan-200/80' : 'text-blue-600'
              )}
            >
              <li>At least 8 characters long</li>
              <li>Mix of uppercase and lowercase letters</li>
              <li>Include numbers and special characters</li>
            </ul>
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className={cn(
              'block text-sm font-semibold',
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            )}
          >
            New Password
          </label>
          <div className="relative">
            <Lock
              className={cn(
                'absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}
              aria-hidden="true"
            />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formState.password}
              onChange={handleInputChange('password')}
              onBlur={handleBlur('password')}
              disabled={isLoading}
              placeholder="Create a strong password"
              className={cn(
                'w-full pl-11 pr-12 py-3 rounded-xl text-sm',
                'border-2 transition-all duration-200',
                'focus:outline-none focus:ring-4',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                theme === 'dark'
                  ? 'bg-gray-900/50 border-gray-800 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
                showPasswordError
                  ? theme === 'dark'
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-red-400 focus:border-red-500 focus:ring-red-100'
                  : theme === 'dark'
                  ? 'focus:border-cyan-500 focus:ring-cyan-500/20'
                  : 'focus:border-blue-500 focus:ring-blue-100'
              )}
              aria-invalid={!!showPasswordError}
              autoComplete="new-password"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className={cn(
                'absolute right-3.5 top-1/2 -translate-y-1/2',
                'p-1 rounded-lg transition-colors',
                'focus:outline-none focus:ring-2',
                theme === 'dark'
                  ? 'text-gray-500 hover:text-gray-300 focus:ring-cyan-500'
                  : 'text-gray-400 hover:text-gray-600 focus:ring-blue-500'
              )}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {showPasswordError && (
            <p
              className={cn(
                'text-xs flex items-center gap-1.5 mt-1',
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              )}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {formErrors.password}
            </p>
          )}

          {/* Password strength indicator */}
          {formState.password && touched.password && (
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between text-xs">
                <span
                  className={cn(
                    'font-medium',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}
                >
                  Password strength:
                </span>
                <span
                  className={cn(
                    'font-semibold',
                    passwordStrength.score >= 3
                      ? theme === 'dark'
                        ? 'text-emerald-400'
                        : 'text-emerald-600'
                      : theme === 'dark'
                      ? 'text-amber-400'
                      : 'text-amber-600'
                  )}
                >
                  {passwordStrength.label}
                </span>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((index) => (
                  <div
                    key={index}
                    className={cn(
                      'h-1.5 rounded-full flex-1 transition-all duration-300',
                      index <= passwordStrength.score
                        ? passwordStrength.color
                        : theme === 'dark'
                        ? 'bg-gray-800'
                        : 'bg-gray-200'
                    )}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="confirmPassword"
            className={cn(
              'block text-sm font-semibold',
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            )}
          >
            Confirm New Password
          </label>
          <div className="relative">
            <Lock
              className={cn(
                'absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}
              aria-hidden="true"
            />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formState.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              disabled={isLoading}
              placeholder="Re-enter your password"
              className={cn(
                'w-full pl-11 pr-12 py-3 rounded-xl text-sm',
                'border-2 transition-all duration-200',
                'focus:outline-none focus:ring-4',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                theme === 'dark'
                  ? 'bg-gray-900/50 border-gray-800 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
                showConfirmError
                  ? theme === 'dark'
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-red-400 focus:border-red-500 focus:ring-red-100'
                  : formState.confirmPassword && formState.confirmPassword === formState.password
                  ? theme === 'dark'
                    ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20'
                    : 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-100'
                  : theme === 'dark'
                  ? 'focus:border-cyan-500 focus:ring-cyan-500/20'
                  : 'focus:border-blue-500 focus:ring-blue-100'
              )}
              aria-invalid={!!showConfirmError}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
              className={cn(
                'absolute right-3.5 top-1/2 -translate-y-1/2',
                'p-1 rounded-lg transition-colors',
                'focus:outline-none focus:ring-2',
                theme === 'dark'
                  ? 'text-gray-500 hover:text-gray-300 focus:ring-cyan-500'
                  : 'text-gray-400 hover:text-gray-600 focus:ring-blue-500'
              )}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            {formState.confirmPassword && formState.confirmPassword === formState.password && (
              <CheckCircle
                className="absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500"
                aria-label="Passwords match"
              />
            )}
          </div>
          {showConfirmError && (
            <p
              className={cn(
                'text-xs flex items-center gap-1.5 mt-1',
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              )}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {formErrors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading || !isFormValid}
          className={cn(
            'w-full py-3.5 px-6 rounded-xl font-semibold text-base',
            'transition-all duration-200',
            'focus:outline-none focus:ring-4 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'flex items-center justify-center gap-3',
            theme === 'dark'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 focus:ring-cyan-500/50 focus:ring-offset-gray-900'
              : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 focus:ring-blue-500 focus:ring-offset-white',
            !isLoading && isFormValid && 'shadow-lg hover:shadow-xl hover:scale-[1.02]'
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Resetting Password...</span>
            </>
          ) : (
            <span>Reset Password</span>
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;