import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import AuthLayout from './AuthLayout';
import { cn } from '../../../../../shared/types/cn';

// ── Use the correct login hook from AccountQueries ─────────────────────────
import { useLogin } from '../../../../account/api/AccountQueries';

import { ROUTES } from '../../routes/onboardingRouteConstants';

// original heroImage: https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80

interface FormState {
  email: string;
  password: string;
  rememberMe: boolean;
  mfa_code?: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export const Login: React.FC = () => {
  const theme = useAppSelector((state) => state.ui.theme);
  // const { error: authError } = useAppSelector((state) => state.auth);

  // useLogin returns a mutation object with mutate, isPending, etc.
  const loginMutation = useLogin();
  const isLoading = loginMutation.isPending;
  // const error = authError || loginMutation.error?.message;

  const [formState, setFormState] = useState<FormState>({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });

  const validateEmail = useCallback((email: string): string | undefined => {
    if (!email) return 'Email address is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  }, []);

  const validatePassword = useCallback((password: string): string | undefined => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return undefined;
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {
      email: validateEmail(formState.email),
      password: validatePassword(formState.password),
    };

    setFormErrors(errors);
    return !errors.email && !errors.password;
  }, [formState, validateEmail, validatePassword]);

  const handleInputChange = useCallback((field: keyof FormState) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = field === 'rememberMe' ? e.target.checked : e.target.value;
      setFormState((prev) => ({ ...prev, [field]: value }));

      if (field !== 'rememberMe') {
        setFormErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
      }
    };
  }, []);

  const handleBlur = useCallback(
    (field: 'email' | 'password') => {
      return () => {
        setTouched((prev) => ({ ...prev, [field]: true }));

        const error =
          field === 'email'
            ? validateEmail(formState.email)
            : validatePassword(formState.password);

        if (error) {
          setFormErrors((prev) => ({ ...prev, [field]: error }));
        }
      };
    },
    [formState, validateEmail, validatePassword]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      setTouched({ email: true, password: true });

      if (!validateForm()) return;

      // Map camelCase `rememberMe` to snake_case `remember_me` as expected by AccountTypes.LoginRequest
      loginMutation.mutate({
        email: formState.email.toLowerCase(),
        password: formState.password,
        remember_me: formState.rememberMe,
      });
    },
    [formState, loginMutation, validateForm]
  );

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const showEmailError = touched.email && formErrors.email;
  const showPasswordError = touched.password && formErrors.password;
  const isFormValid = formState.email && formState.password && !formErrors.email && !formErrors.password;

  return (
        <AuthLayout
        title="Welcome back"
        subtitle="Sign in to continue"
        heroImage="/assets/smiling_nurse_3.jpg"
        heroHeadline="Continuous care. Clinical Excellence."
        heroSubtext="Clinical, Nursing, Lab, Pharmacy, Billing, Ambulance — all working as one. Faster. Safer. Smarter."
      >
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {(formErrors.general) && (
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
            <p className="text-sm">{formErrors.general}</p>
          </div>
        )}

        <div className="space-y-2">
          <label
            htmlFor="email"
            className={cn(
              'block text-sm font-semibold',
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            )}
          >
            Email Address
          </label>
          <div className="relative">
            <Mail
              className={cn(
                'absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5',
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              )}
              aria-hidden="true"
            />
            <input
              id="email"
              type="email"
              value={formState.email}
              onChange={handleInputChange('email')}
              onBlur={handleBlur('email')}
              disabled={isLoading}
              placeholder="Enter your email"
              className={cn(
                'w-full pl-12 pr-4 py-3.5 rounded-xl text-base',
                'border-2 transition-all duration-200',
                'focus:outline-none focus:ring-4',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                theme === 'dark'
                  ? 'bg-gray-900/50 border-gray-800 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
                showEmailError
                  ? theme === 'dark'
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-red-400 focus:border-red-500 focus:ring-red-100'
                  : theme === 'dark'
                  ? 'focus:border-cyan-500 focus:ring-cyan-500/20'
                  : 'focus:border-blue-500 focus:ring-blue-100'
              )}
              aria-invalid={!!showEmailError}
              aria-describedby={showEmailError ? 'email-error' : undefined}
              autoComplete="email"
            />
          </div>
          {showEmailError && (
            <p
              id="email-error"
              className={cn(
                'text-sm flex items-center gap-2',
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              )}
              role="alert"
            >
              <AlertCircle className="w-4 h-4" />
              {formErrors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className={cn(
              'block text-sm font-semibold',
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            )}
          >
            Password
          </label>
          <div className="relative">
            <Lock
              className={cn(
                'absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5',
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
              placeholder="Enter your password"
              className={cn(
                'w-full pl-12 pr-12 py-3.5 rounded-xl text-base',
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
              aria-describedby={showPasswordError ? 'password-error' : undefined}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              disabled={isLoading}
              className={cn(
                'absolute right-4 top-1/2 -translate-y-1/2',
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
              id="password-error"
              className={cn(
                'text-sm flex items-center gap-2',
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              )}
              role="alert"
            >
              <AlertCircle className="w-4 h-4" />
              {formErrors.password}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={formState.rememberMe}
              onChange={handleInputChange('rememberMe')}
              disabled={isLoading}
              className={cn(
                'w-4 h-4 rounded transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900'
                  : 'bg-white border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-white'
              )}
            />
            <span
              className={cn(
                'text-sm font-medium transition-colors',
                theme === 'dark'
                  ? 'text-gray-400 group-hover:text-gray-300'
                  : 'text-gray-600 group-hover:text-gray-700'
              )}
            >
              Remember me
            </span>
          </label>

          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className={cn(
              'text-sm font-semibold transition-colors',
              theme === 'dark'
                ? 'text-cyan-400 hover:text-cyan-300'
                : 'text-blue-600 hover:text-blue-700'
            )}
          >
            Forgot password?
          </Link>
        </div>
          <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className={cn(
                'w-full py-3.5 px-6 rounded-xl font-semibold text-base',
                'transition-all duration-200',
                'focus:outline-none focus:ring-4 focus:ring-offset-2',
                'flex items-center justify-center gap-3',

                // Cursor logic (meaningful)
                isLoading || !isFormValid
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer',

                theme === 'dark'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 focus:ring-cyan-500/50 focus:ring-offset-gray-900'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 focus:ring-blue-500 focus:ring-offset-white',

                !isLoading && isFormValid && 'shadow-lg hover:shadow-xl hover:scale-[1.02]'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
        <div
          className={cn(
            'text-center text-sm pt-4',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}
        >
          Don't have an account?{' '}
          <Link
            to="/signup"
            className={cn(
              'font-semibold transition-colors',
              theme === 'dark'
                ? 'text-cyan-400 hover:text-cyan-300'
                : 'text-blue-600 hover:text-blue-700'

              )}
          >
            Create Account
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;