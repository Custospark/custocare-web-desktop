import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import AuthLayout from './AuthLayout';
import { cn } from '../../../../../shared/types/cn';
import { useForgotPassword } from '../../../../account/api/AccountQueries';

interface FormState {
  email: string;
}

const ForgotPassword: React.FC = () => {
  const theme = useAppSelector((state) => state.ui.theme);

  // -------------------------------
  // Local State
  // -------------------------------
  const [formState, setFormState] = useState<FormState>({ email: '' });
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [touched, setTouched] = useState(false);

  // -------------------------------
  // Mutation
  // -------------------------------
  const forgotPasswordMutation = useForgotPassword({
    onSuccess: () => {
      setIsSuccess(true);
    },
  });

  // -------------------------------
  // Validation
  // -------------------------------
  const validateEmail = useCallback((email: string) => {
    if (!email) return 'Email address is required';
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email) ? '' : 'Please enter a valid email address';
  }, []);

  const showError = touched && !!emailError;
  const isFormValid = formState.email && !emailError;

  // -------------------------------
  // Handlers
  // -------------------------------
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({ email: e.target.value });
    setEmailError('');
  }, []);

  const handleBlur = useCallback(() => {
    setTouched(true);
    setEmailError(validateEmail(formState.email));
  }, [formState.email, validateEmail]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setTouched(true);

      const error = validateEmail(formState.email);
      if (error) {
        setEmailError(error);
        return;
      }

      setIsLoading(true);
      forgotPasswordMutation.mutate({ email: formState.email });
      // The mutation will set isSuccess via onSuccess callback
      setIsLoading(false);
    },
    [formState.email, validateEmail, forgotPasswordMutation]
  );

  const handleResendEmail = useCallback(() => {
    setIsSuccess(false);
    setFormState({ email: '' });
    setTouched(false);
    setEmailError('');
  }, []);

  // -------------------------------
  // Success State
  // -------------------------------
  if (isSuccess) {
    return (
      <AuthLayout
        title="Check Your Email"
        subtitle="We've sent you password reset instructions"
        heroImage="https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=1200&q=80"
        heroHeadline="Secure Account Recovery"
        heroSubtext="Your account security is our top priority. Follow the instructions sent to your email to reset your password."
        showBackToLogin
      >
        <div className="space-y-6">
          {/* Success Icon */}
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

          {/* Success Message */}
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
              Email Sent Successfully
            </h3>
            <p
              className={cn(
                'text-sm leading-relaxed',
                theme === 'dark' ? 'text-emerald-200/80' : 'text-emerald-700'
              )}
            >
              We've sent password reset instructions to <strong>{formState.email}</strong>.
              Please check your inbox and spam folder.
            </p>
          </div>

          {/* Steps */}
          <div
            className={cn(
              'space-y-4 p-5 rounded-xl border',
              theme === 'dark'
                ? 'bg-gray-900/30 border-gray-800/50'
                : 'bg-gray-50/50 border-gray-200'
            )}
          >
            <h4
              className={cn(
                'text-sm font-semibold',
                theme === 'dark' ? 'text-gray-200' : 'text-gray-800'
              )}
            >
              Next Steps:
            </h4>
            <ol className="space-y-3 text-sm">
              {[
                'Check your email inbox for a message from Custocare AI',
                'Click the secure reset link (valid for 24 hours)',
                'Create and confirm your new password',
                'Sign in with your new credentials',
              ].map((step, i) => (
                <li
                  key={i}
                  className={cn(
                    'flex gap-3',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}
                >
                  <span
                    className={cn(
                      'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                      theme === 'dark'
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-blue-100 text-blue-700'
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              to="/login"
              className={cn(
                'w-full py-3.5 px-6 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2 shadow-lg hover:shadow-xl hover:scale-[1.02]',
                theme === 'dark'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 focus:ring-cyan-500/50 focus:ring-offset-gray-900'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 focus:ring-blue-500 focus:ring-offset-white'
              )}
            >
              <span>Back to Sign In</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <button
              onClick={handleResendEmail}
              className={cn(
                'w-full py-3 px-6 rounded-xl font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2',
                theme === 'dark'
                  ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700 focus:ring-cyan-500/50 focus:ring-offset-gray-900'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 focus:ring-blue-500 focus:ring-offset-white'
              )}
            >
              Didn't receive email? Try again
            </button>
          </div>

          {/* Security Note */}
          <div
            className={cn(
              'text-xs text-center space-y-2 pt-2',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
            )}
          >
            <p>
              <strong>Security Note:</strong> The reset link expires in 24 hours.
            </p>
            <p>If you didn't request this, you can safely ignore this email.</p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // -------------------------------
  // Render Form State
  // -------------------------------
  return (
    <AuthLayout
      title="Let’s reset your password"
      subtitle="Enter your email to receive reset instructions"
      heroImage="https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=1200&q=80"
      heroHeadline="Secure Account Recovery"
      heroSubtext="Quickly and securely regain access to your Custocare AI account. We'll guide you through every step."
      showBackToLogin
    >
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Info Message */}
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
            <p className="font-semibold">Password reset instructions</p>
            <p
              className={cn(
                theme === 'dark' ? 'text-cyan-200/80' : 'text-blue-600'
              )}
            >
              We'll send a secure link to your email address. Click the link to
              create a new password.
            </p>
          </div>
        </div>

        {/* Email Field */}
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
              onChange={handleEmailChange}
              onBlur={handleBlur}
              disabled={isLoading}
              placeholder="doctor@hospital.com"
              className={cn(
                'w-full pl-12 pr-4 py-3.5 rounded-xl text-base border-2 transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed',
                theme === 'dark'
                  ? 'bg-gray-900/50 border-gray-800 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-100',
                showError
                  ? theme === 'dark'
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-red-400 focus:border-red-500 focus:ring-red-100'
                  : ''
              )}
              aria-invalid={!!showError}
              aria-describedby={showError ? 'email-error' : undefined}
              autoComplete="email"
              autoFocus
            />
          </div>
          {showError && (
            <p
              id="email-error"
              className={cn(
                'text-sm flex items-center gap-2',
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              )}
              role="alert"
            >
              <AlertCircle className="w-4 h-4" />
              {emailError}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !isFormValid}
          className={cn(
            'w-full py-3.5 px-6 rounded-xl font-semibold text-base flex items-center justify-center gap-3 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
            theme === 'dark'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 focus:ring-cyan-500/50 focus:ring-offset-gray-900'
              : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 focus:ring-blue-500 focus:ring-offset-white',
            !isLoading && isFormValid
              ? 'shadow-lg hover:shadow-xl hover:scale-[1.02]'
              : ''
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <span>Send Reset Link</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {/* Security Measures */}
        <div
          className={cn(
            'p-4 rounded-xl border space-y-2',
            theme === 'dark'
              ? 'bg-gray-900/30 border-gray-800/50'
              : 'bg-gray-50/50 border-gray-200'
          )}
        >
          <h4
            className={cn(
              'text-xs font-semibold uppercase tracking-wider',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            )}
          >
            Security Measures
          </h4>
          <ul
            className={cn(
              'text-xs space-y-1.5',
              theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
            )}
          >
            {[
              'Reset link expires after 24 hours',
              'Link can only be used once',
              'HIPAA-compliant secure transmission',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    theme === 'dark' ? 'bg-cyan-500' : 'bg-blue-500'
                  )}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Help text */}
        <div
          className={cn(
            'text-center text-sm pt-2',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          )}
        >
          Remember your password?{' '}
          <Link
            to="/login"
            className={cn(
              'font-semibold transition-colors',
              theme === 'dark'
                ? 'text-cyan-400 hover:text-cyan-300'
                : 'text-blue-600 hover:text-blue-700'
            )}
          >
            Sign In
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;