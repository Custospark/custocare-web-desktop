import React, { useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Building2, Phone, AlertCircle, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../../app/store/hooks/useApp';
import { loginSuccess } from '../../../../app/store/slices/authSlice';
import AuthLayout from './AuthLayout';
import { cn } from '../../../../shared/types/cn';

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  role: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface ValidationStatus {
  isValid: boolean;
  error?: string;
}

const ROLE_OPTIONS = [
  { value: '', label: 'Select your role' },
  { value: 'physician', label: 'Physician' },
  { value: 'nurse', label: 'Nurse Practitioner' },
  { value: 'resident', label: 'Medical Resident' },
  { value: 'admin', label: 'Healthcare Administrator' },
  { value: 'specialist', label: 'Specialist' },
  { value: 'researcher', label: 'Clinical Researcher' },
];

export const SignUp: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useAppSelector((state) => state.ui.theme);

  const [formState, setFormState] = useState<FormState>({
    fullName: '',
    email: '',
    phone: '',
    organization: '',
    role: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getPasswordStrength = useCallback((password: string) => {
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

  const validateField = useCallback((field: keyof FormState, value: string | boolean): ValidationStatus => {
    const validators: Record<string, () => ValidationStatus> = {
      fullName: () => {
        if (!value) return { isValid: false, error: 'Full name is required' };
        if (typeof value === 'string' && value.trim().length < 2) return { isValid: false, error: 'Name too short' };
        return { isValid: true };
      },
      email: () => {
        if (!value) return { isValid: false, error: 'Email is required' };
        if (typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { isValid: false, error: 'Invalid email' };
        return { isValid: true };
      },
      phone: () => {
        if (!value) return { isValid: false, error: 'Phone is required' };
        if (typeof value === 'string' && value.replace(/\D/g, '').length < 10) return { isValid: false, error: 'Invalid phone' };
        return { isValid: true };
      },
      organization: () => {
        if (!value) return { isValid: false, error: 'Organization is required' };
        return { isValid: true };
      },
      role: () => {
        if (!value) return { isValid: false, error: 'Select a role' };
        return { isValid: true };
      },
      password: () => {
        if (!value) return { isValid: false, error: 'Password is required' };
        if (typeof value === 'string' && value.length < 8) return { isValid: false, error: 'Min 8 characters' };
        if (getPasswordStrength(value as string).score < 2) return { isValid: false, error: 'Password too weak' };
        return { isValid: true };
      },
      confirmPassword: () => {
        if (!value) return { isValid: false, error: 'Confirm password' };
        if (value !== formState.password) return { isValid: false, error: 'Passwords don\'t match' };
        return { isValid: true };
      },
      agreeToTerms: () => {
        if (!value) return { isValid: false, error: 'Required' };
        return { isValid: true };
      },
    };
    return validators[field]?.() || { isValid: true };
  }, [formState.password, getPasswordStrength]);

  const validation = useMemo(() => {
    const fields: (keyof FormState)[] = ['fullName', 'email', 'phone', 'organization', 'role', 'password', 'confirmPassword', 'agreeToTerms'];
    return Object.fromEntries(fields.map(f => [f, validateField(f, formState[f])])) as Record<keyof FormState, ValidationStatus>;
  }, [formState, validateField]);

  const isFormValid = Object.values(validation).every(v => v.isValid);
  const passwordStrength = getPasswordStrength(formState.password);

  const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: keyof FormState) => () => setTouched(prev => ({ ...prev, [field]: true }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      dispatch(loginSuccess({
        user: { id: Date.now().toString(), email: formState.email, name: formState.fullName, role: formState.role },
        token: 'mock_jwt_' + Date.now(),
      }));
      navigate('/verify-2fa');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field: keyof FormState, hasIcon = true) => {
    const isValid = validation[field].isValid && formState[field];
    const hasError = touched[field] && validation[field].error;
    return cn(
      'w-full py-2 text-sm rounded-lg border-2 transition-all duration-150',
      'focus:outline-none focus:ring-2',
      hasIcon ? 'pl-9 pr-3' : 'px-3',
      theme === 'dark'
        ? 'bg-gray-900/60 text-white placeholder-gray-500'
        : 'bg-white text-gray-900 placeholder-gray-400',
      hasError
        ? theme === 'dark' ? 'border-red-500/60 focus:ring-red-500/30' : 'border-red-400 focus:ring-red-200'
        : isValid
          ? theme === 'dark' ? 'border-emerald-500/60 focus:ring-emerald-500/30' : 'border-emerald-400 focus:ring-emerald-200'
          : theme === 'dark' ? 'border-gray-700 focus:border-cyan-500 focus:ring-cyan-500/30' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
    );
  };

  const labelClass = cn('block text-xs font-semibold mb-1', theme === 'dark' ? 'text-gray-300' : 'text-gray-700');
  const iconClass = cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', theme === 'dark' ? 'text-gray-500' : 'text-gray-400');

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join healthcare's AI revolution"
      heroHeadline="Transform Patient Care"
      heroSubtext="Access cutting-edge AI-powered clinical decision support trusted by leading healthcare institutions."
      showBackToLogin
    >
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        {/* Full Name */}
        <div>
          <label className={labelClass}>Full Name</label>
          <div className="relative">
            <User className={iconClass} />
            <input
              type="text"
              value={formState.fullName}
              onChange={handleChange('fullName')}
              onBlur={handleBlur('fullName')}
              placeholder="Dr. John Smith"
              className={inputClass('fullName')}
              disabled={isLoading}
            />
            {validation.fullName.isValid && formState.fullName && (
              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
            )}
          </div>
          {touched.fullName && validation.fullName.error && (
            <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{validation.fullName.error}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className={labelClass}>Email Address</label>
          <div className="relative">
            <Mail className={iconClass} />
            <input
              type="email"
              value={formState.email}
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
              placeholder="doctor@hospital.com"
              className={inputClass('email')}
              disabled={isLoading}
            />
            {validation.email.isValid && formState.email && (
              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
            )}
          </div>
          {touched.email && validation.email.error && (
            <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{validation.email.error}
            </p>
          )}
        </div>

        {/* Phone & Organization */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Phone</label>
            <div className="relative">
              <Phone className={iconClass} />
              <input
                type="tel"
                value={formState.phone}
                onChange={handleChange('phone')}
                onBlur={handleBlur('phone')}
                placeholder="+1 (555) 000-0000"
                className={inputClass('phone')}
                disabled={isLoading}
              />
            </div>
            {touched.phone && validation.phone.error && (
              <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{validation.phone.error}
              </p>
            )}
          </div>
          <div>
            <label className={labelClass}>Organization</label>
            <div className="relative">
              <Building2 className={iconClass} />
              <input
                type="text"
                value={formState.organization}
                onChange={handleChange('organization')}
                onBlur={handleBlur('organization')}
                placeholder="Hospital name"
                className={inputClass('organization')}
                disabled={isLoading}
              />
            </div>
            {touched.organization && validation.organization.error && (
              <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{validation.organization.error}
              </p>
            )}
          </div>
        </div>

        {/* Role */}
        <div>
          <label className={labelClass}>Professional Role</label>
          <select
            value={formState.role}
            onChange={handleChange('role')}
            onBlur={handleBlur('role')}
            className={cn(inputClass('role', false), 'appearance-none cursor-pointer')}
            disabled={isLoading}
          >
            {ROLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {touched.role && validation.role.error && (
            <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{validation.role.error}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className={labelClass}>Password</label>
          <div className="relative">
            <Lock className={iconClass} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formState.password}
              onChange={handleChange('password')}
              onBlur={handleBlur('password')}
              placeholder="Create a strong password"
              className={cn(inputClass('password'), 'pr-10')}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={cn('absolute right-3 top-1/2 -translate-y-1/2 p-0.5', theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {touched.password && formState.password && (
            <div className="mt-1.5">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}>Strength:</span>
                <span className={passwordStrength.score >= 3 ? 'text-emerald-500' : 'text-amber-500'}>{passwordStrength.label}</span>
              </div>
              <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className={cn('h-1 rounded-full flex-1', i <= passwordStrength.score ? passwordStrength.color : theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200')} />
                ))}
              </div>
            </div>
          )}
          {touched.password && validation.password.error && (
            <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{validation.password.error}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className={labelClass}>Confirm Password</label>
          <div className="relative">
            <Lock className={iconClass} />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={formState.confirmPassword}
              onChange={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              placeholder="Re-enter password"
              className={cn(inputClass('confirmPassword'), 'pr-10')}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className={cn('absolute right-3 top-1/2 -translate-y-1/2 p-0.5', theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {touched.confirmPassword && validation.confirmPassword.error && (
            <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{validation.confirmPassword.error}
            </p>
          )}
        </div>

        {/* Terms */}
        <label className="flex items-start gap-2.5 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={formState.agreeToTerms}
            onChange={handleChange('agreeToTerms')}
            className={cn(
              'mt-0.5 w-4 h-4 rounded transition-colors cursor-pointer',
              theme === 'dark' ? 'bg-gray-800 border-gray-600 accent-cyan-500' : 'accent-blue-600'
            )}
            disabled={isLoading}
          />
          <span className={cn('text-[11px] leading-relaxed', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
            I agree to the{' '}
            <Link to="/terms" className={cn('font-semibold underline', theme === 'dark' ? 'text-cyan-400' : 'text-blue-600')}>Terms</Link>
            {' '}and{' '}
            <Link to="/privacy" className={cn('font-semibold underline', theme === 'dark' ? 'text-cyan-400' : 'text-blue-600')}>Privacy Policy</Link>
            , including HIPAA-compliant data processing.
          </span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || !isFormValid}
          className={cn(
            'w-full py-2.5 rounded-lg font-semibold text-sm mt-2',
            'transition-all duration-200 flex items-center justify-center gap-2',
            'focus:outline-none focus:ring-4',
            isFormValid && !isLoading
              ? theme === 'dark'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 focus:ring-cyan-500/40 shadow-lg hover:shadow-xl hover:scale-[1.01]'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 focus:ring-blue-400/40 shadow-lg hover:shadow-xl hover:scale-[1.01]'
              : theme === 'dark' ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          )}
        >
          {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : 'Create Account'}
        </button>

        {/* Sign in link */}
        <p className={cn('text-center text-xs pt-1', theme === 'dark' ? 'text-gray-500' : 'text-gray-600')}>
          Already have an account?{' '}
          <Link to="/login" className={cn('font-semibold', theme === 'dark' ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700')}>
            Sign In
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default SignUp;