import React, { useState, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import AuthLayout from './AuthLayout';
import { cn } from '../../../../../shared/types/cn';

// ── AccountQueries & authSlice integration ───────────────────────────────────
import { useResetPassword } from '../../../../account/api/AccountQueries';
import { selectPasswordResetEmail } from '../../../../../app/store/slices/authSlice';
import type { ResetPasswordVariables } from '../../../../account/api/AccountTypes';
import { ROUTES } from '../../../../../app/routes/routeConstants';
/**
 * ============================================================================
 * RESET PASSWORD PAGE COMPONENT
 * ============================================================================
 *
 * Integrates with useResetPassword (AccountQueries) which calls
 * POST /auth/reset-password.
 *
 * Token / code resolution order:
 *   1. ?token=xxx  (link-based reset)
 *   2. ?code=xxx   (OTP-based reset)
 * 
 * Email resolution order (display only - user must confirm):
 *   1. ?email=xxx  (URL param, used for display)
 *   2. authSlice.passwordReset.email (set by useForgotPassword, used for display)
 * 
 * The email field is REQUIRED in the form submission to ensure
 * the user confirms the email address for security purposes.
 */

interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
}

interface ValidationStatus {
  isValid: boolean;
  error?: string;
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

  // ── URL params ─────────────────────────────────────────────────────────────
  // Support both ?token= (link-based) and ?code= (OTP) params
  const resetToken = searchParams.get('token') || searchParams.get('code');
  const emailFromUrl = searchParams.get('email') ?? undefined;

  // ── Slice selectors ────────────────────────────────────────────────────────
  // Fallback email from the forgot-password slice state when not in the URL
  const emailFromSlice = useAppSelector(selectPasswordResetEmail);

  // ── Token presence check ───────────────────────────────────────────────────
  const [tokenValid] = useState<boolean>(!!resetToken);
  const [isValidatingToken] = useState<boolean>(false);

  /* =========================================================================
     LOCAL STATE
     ========================================================================= */

  const [formState, setFormState] = useState<FormState>({
    email: emailFromUrl || emailFromSlice || '',
    password: '',
    confirmPassword: '',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenError, setTokenError] = useState<string | undefined>();

  /* =========================================================================
     MUTATION HOOK
     ========================================================================= */

  const { mutate: resetPassword, isPending: isLoading } = useResetPassword({
    onSuccess: (data) => {
      if (data.success) {
        setIsSuccess(true);
      } else {
        // Backend returned success:false
        setTokenError(data.message || 'Password reset failed. Please try again.');
      }
    },
    onError: (error) => {
      setTokenError(
        error.response?.data?.message ||
          error.message ||
          'Failed to reset password. Please try again.'
      );
    },
  });

  /* =========================================================================
     AUTO-REDIRECT ON SUCCESS
     ========================================================================= */

  React.useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => navigate(ROUTES.RESET_PASSWORD_SUCCESS), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  /* =========================================================================
     PASSWORD STRENGTH
     ========================================================================= */

  const getPasswordStrength = useCallback((password: string): PasswordStrength => {
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
    
    return { score: normalized, ...configs[normalized] };
  }, []);

  /* =========================================================================
     FIELD VALIDATION
     ========================================================================= */

  const validateField = useCallback(
    (field: keyof FormState, value: string): ValidationStatus => {
      const validators: Record<string, () => ValidationStatus> = {
        email: () => {
          if (!value) return { isValid: false, error: 'Email is required' };
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
            return { isValid: false, error: 'Please enter a valid email address' };
          return { isValid: true };
        },
        password: () => {
          if (!value) return { isValid: false, error: 'New password is required' };
          if (value.length < 8) 
            return { isValid: false, error: 'Password must be at least 8 characters' };
          if (getPasswordStrength(value).score < 2)
            return { isValid: false, error: 'Password is too weak. Add more characters, numbers, or symbols' };
          return { isValid: true };
        },
        confirmPassword: () => {
          if (!value) return { isValid: false, error: 'Please confirm your password' };
          if (value !== formState.password) 
            return { isValid: false, error: 'Passwords do not match' };
          return { isValid: true };
        },
      };
      return validators[field]?.() || { isValid: true };
    },
    [formState.password, getPasswordStrength]
  );

  const validation = useMemo(() => {
    const fields: (keyof FormState)[] = ['email', 'password', 'confirmPassword'];
    return Object.fromEntries(
      fields.map((f) => [f, validateField(f, formState[f])])
    ) as Record<keyof FormState, ValidationStatus>;
  }, [formState, validateField]);

  const isFormValid = useMemo(
    () => Object.values(validation).every((v) => v.isValid),
    [validation]
  );

  const passwordStrength = getPasswordStrength(formState.password);

  // Check if passwords match (separate from validation for UI feedback)
  const doPasswordsMatch = useMemo(() => {
    if (!formState.password || !formState.confirmPassword) return false;
    return formState.password === formState.confirmPassword;
  }, [formState.password, formState.confirmPassword]);

  // Track field completion for button enabling (same as SignUp approach)
  // The button uses isFormValid which already checks all validation criteria
  // including email format, password strength, and password match

  /* =========================================================================
     EVENT HANDLERS
     ========================================================================= */

  const handleChange =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFormState((prev) => ({ ...prev, [field]: value }));
      if (touched[field]) setTouched((prev) => ({ ...prev, [field]: false }));
      // Clear token error when user makes changes
      if (tokenError) setTokenError(undefined);
    };

  const handleBlur = (field: keyof FormState) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched to show validation errors (same as SignUp)
    const allFields = ['email', 'password', 'confirmPassword'];
    const touchedFields = allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {});
    setTouched((prev) => ({ ...prev, ...touchedFields }));

    if (!isFormValid) return;

    if (!resetToken) {
      setTokenError('Missing reset token. Please request a new link.');
      return;
    }

    // Build payload conforming to ResetPasswordVariables
    // Email is REQUIRED from the form field for submission
    const payload: ResetPasswordVariables = {
      code: resetToken,
      email: formState.email, // Email MUST be submitted with the request
      new_password: formState.password,
      new_password_confirmation: formState.confirmPassword,
      is_token: true, // the code comes from a URL token
    };

    resetPassword(payload);
  };

  /* =========================================================================
     STYLING HELPERS
     ========================================================================= */

  const inputClass = (field: keyof FormState, hasIcon = true) => {
    const isValid = validation[field].isValid && formState[field];
    const hasError = touched[field] && validation[field].error;
    
    return cn(
      'w-full py-3 rounded-xl text-sm border-2 transition-all duration-200',
      'focus:outline-none focus:ring-4',
      hasIcon ? 'pl-11 pr-12' : 'px-4',
      theme === 'dark'
        ? 'bg-gray-900/50 text-white placeholder-gray-500'
        : 'bg-white text-gray-900 placeholder-gray-400',
      hasError
        ? theme === 'dark'
          ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
          : 'border-red-400 focus:border-red-500 focus:ring-red-100'
        : isValid
        ? theme === 'dark'
          ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20'
          : 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-100'
        : theme === 'dark'
        ? 'border-gray-800 focus:border-cyan-500 focus:ring-cyan-500/20'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
    );
  };

  const labelClass = cn(
    'block text-xs font-semibold mb-1.5',
    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
  );

  const iconClass = cn(
    'absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5',
    theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
  );

  // Display helper text: show which email is being used from URL/slice
  const defaultEmailHint = emailFromUrl || emailFromSlice;

  /* =========================================================================
     RENDER – LOADING STATE (token validation)
     ========================================================================= */

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

  /* =========================================================================
     RENDER – INVALID TOKEN STATE
     ========================================================================= */

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
                {tokenError ||
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

  /* =========================================================================
     RENDER – SUCCESS STATE
     ========================================================================= */

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
              <CheckCircle2
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
              Your password has been changed successfully for{' '}
              <span className="font-semibold">{formState.email}</span>. You can now sign in with
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

  /* =========================================================================
     RENDER – FORM STATE
     ========================================================================= */

  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Please confirm your email and create a new password"
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
            <p className="font-semibold">For Security, Please Confirm:</p>
            <ul
              className={cn(
                'text-xs space-y-0.5 list-disc list-inside',
                theme === 'dark' ? 'text-cyan-200/80' : 'text-blue-600'
              )}
            >
              <li>Your email address (must match the reset request)</li>
              <li>Create a strong password (at least 8 characters)</li>
              <li>Mix of uppercase, lowercase, numbers, and symbols</li>
            </ul>
          </div>
        </div>

        {/* Backend / token error */}
        {tokenError && (
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
            <p className="text-sm">{tokenError}</p>
          </div>
        )}

        {/* Password Mismatch Warning - Shows when passwords don't match (like SignUp) */}
        {formState.password && formState.confirmPassword && !doPasswordsMatch && (
          <div
            className={cn(
              'flex items-center gap-2 p-3 rounded-lg border text-sm',
              theme === 'dark'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-red-50 border-red-200 text-red-700'
            )}
          >
            <XCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">Passwords do not match</span>
          </div>
        )}

        {/* Email Field - REQUIRED for submission */}
        <div>
          <label htmlFor="email" className={labelClass}>
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className={iconClass} />
            <input
              id="email"
              type="email"
              value={formState.email}
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
              disabled={isLoading}
              placeholder="Enter your email address"
              className={inputClass('email')}
              autoComplete="email"
              autoFocus
            />
            {validation.email.isValid && formState.email && (
              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
            )}
          </div>
          {touched.email && validation.email.error && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {validation.email.error}
            </p>
          )}
          {defaultEmailHint && defaultEmailHint !== formState.email && !touched.email && (
            <p
              className={cn(
                'text-xs flex items-center gap-1.5 mt-1.5',
                theme === 'dark' ? 'text-amber-400' : 'text-amber-600'
              )}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Reset requested for: {defaultEmailHint}
            </p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label htmlFor="password" className={labelClass}>
            New Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className={iconClass} />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formState.password}
              onChange={handleChange('password')}
              onBlur={handleBlur('password')}
              disabled={isLoading}
              placeholder="Create a strong password"
              className={cn(inputClass('password'), 'pr-12')}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={cn(
                'absolute right-9 top-1/2 -translate-y-1/2 p-1',
                theme === 'dark'
                  ? 'text-gray-500 hover:text-gray-300'
                  : 'text-gray-400 hover:text-gray-600'
              )}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            {validation.password.isValid && formState.password && (
              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
            )}
          </div>

          {/* Password strength indicator - exactly like SignUp */}
          {formState.password && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  Strength:
                </span>
                <span
                  className={cn(
                    'font-medium',
                    passwordStrength.score >= 3
                      ? theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'
                      : passwordStrength.score >= 2
                      ? theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                      : theme === 'dark' ? 'text-red-400' : 'text-red-600'
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

          {touched.password && validation.password.error && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {validation.password.error}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className={labelClass}>
            Confirm New Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className={iconClass} />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formState.confirmPassword}
              onChange={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              disabled={isLoading}
              placeholder="Re-enter your password"
              className={cn(inputClass('confirmPassword'), 'pr-12')}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className={cn(
                'absolute right-9 top-1/2 -translate-y-1/2 p-1',
                theme === 'dark'
                  ? 'text-gray-500 hover:text-gray-300'
                  : 'text-gray-400 hover:text-gray-600'
              )}
              disabled={isLoading}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
            {validation.confirmPassword.isValid && formState.confirmPassword && (
              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
            )}
          </div>
          {touched.confirmPassword && validation.confirmPassword.error && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {validation.confirmPassword.error}
            </p>
          )}
        </div>

        {/* Submit Button - exactly the same behavior as SignUp */}
        <button
          type="submit"
          disabled={isLoading || !isFormValid}
          className={cn(
            'w-full py-3.5 px-6 rounded-xl font-semibold text-base',
            'transition-all duration-200',
            'focus:outline-none focus:ring-4 focus:ring-offset-2',
            'flex items-center justify-center gap-3',
            isFormValid && !isLoading
              ? cn(
                  'cursor-pointer',
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 focus:ring-cyan-500/50 focus:ring-offset-gray-900 shadow-lg hover:shadow-xl hover:scale-[1.02]'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 focus:ring-blue-500 focus:ring-offset-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
                )
              : cn(
                  'cursor-not-allowed',
                  theme === 'dark' ? 'bg-gray-800 text-gray-500' : 'bg-gray-200 text-gray-400'
                )
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