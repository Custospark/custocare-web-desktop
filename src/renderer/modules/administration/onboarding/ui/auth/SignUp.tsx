import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  User, 
  AlertCircle, 
  Loader2, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  Phone
} from 'lucide-react';
import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import AuthLayout from './AuthLayout';
import { cn } from '../../../../../shared/types/cn';
import { countryCodes } from './countryCodes';
// Import the useRegister hook from the API layer
import { useRegister } from '../../api/queries/register-user/registerUserQuery'

interface FormState {
  email: string;
  phone: string;
  phoneCountryCode: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

interface ValidationStatus {
  isValid: boolean;
  error?: string;
}

export const SignUp: React.FC = () => {
  // Get theme from Redux store
  const theme = useAppSelector((state) => state.ui.theme);
  
  // Initialize the registration mutation hook
  // Note: Toast notifications are handled in the queries.ts file
  const { mutate: register, isPending: isLoading } = useRegister();

  // Form state management
  const [formState, setFormState] = useState<FormState>({
    email: '',
    phone: '',
    phoneCountryCode: '+1', // Default to US country code
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });

  // Track which fields have been touched for validation display
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Country dropdown state
  const [filterCountry, setFilterCountry] = useState('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  // Calculate password strength for visual feedback
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

  // Field validation function
  const validateField = useCallback((field: keyof FormState, value: string): ValidationStatus => {
    const validators: Record<string, () => ValidationStatus> = {
      email: () => {
        if (!value) return { isValid: false, error: 'Email is required' };
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) 
          return { isValid: false, error: 'Please enter a valid email' };
        return { isValid: true };
      },
      phone: () => {
        if (!value) return { isValid: false, error: 'Phone number is required' };
        const digitsOnly = value.replace(/\D/g, '');
        if (digitsOnly.length < 6) return { isValid: false, error: 'Phone number too short' };
        if (digitsOnly.length > 15) return { isValid: false, error: 'Phone number too long' };
        return { isValid: true };
      },
      firstName: () => {
        if (!value) return { isValid: false, error: 'First name is required' };
        if (value.trim().length < 2) 
          return { isValid: false, error: 'Minimum 2 characters' };
        return { isValid: true };
      },
      lastName: () => {
        if (!value) return { isValid: false, error: 'Last name is required' };
        if (value.trim().length < 2) 
          return { isValid: false, error: 'Minimum 2 characters' };
        return { isValid: true };
      },
      password: () => {
        if (!value) return { isValid: false, error: 'Password is required' };
        if (value.length < 8) 
          return { isValid: false, error: 'Minimum 8 characters required' };
        if (getPasswordStrength(value).score < 2) 
          return { isValid: false, error: 'Password is too weak' };
        return { isValid: true };
      },
      confirmPassword: () => {
        if (!value) return { isValid: false, error: 'Please confirm your password' };
        if (value !== formState.password) 
          return { isValid: false, error: 'Passwords must match' };
        return { isValid: true };
      },
    };
    return validators[field]?.() || { isValid: true };
  }, [formState.password, getPasswordStrength]);

  // Memoized validation object for all fields
  const validation = useMemo(() => {
    const fields: (keyof FormState)[] = ['email', 'phone', 'firstName', 'lastName', 'password', 'confirmPassword'];
    return Object.fromEntries(fields.map(f => [f, validateField(f, formState[f])])) as Record<keyof FormState, ValidationStatus>;
  }, [formState, validateField]);

  // Check if entire form is valid
  const isFormValid = useMemo(() => {
    return Object.values(validation).every(v => v.isValid);
  }, [validation]);

  // Current password strength for display
  const passwordStrength = getPasswordStrength(formState.password);
  
  // Filter countries based on search input
  const filteredCountries = useMemo(() => {
    if (!filterCountry) return countryCodes;
    const search = filterCountry.toLowerCase();
    return countryCodes.filter(country => 
      country.name.toLowerCase().includes(search) ||
      country.code.includes(search) ||
      country.dial_code.includes(search)
    );
  }, [filterCountry]);

  // Get currently selected country object
  const selectedCountry = useMemo(() => {
    return countryCodes.find(c => c.dial_code === formState.phoneCountryCode) || countryCodes[0];
  }, [formState.phoneCountryCode]);

  // Generic input change handler
  const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormState(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setTouched(prev => ({ ...prev, [field]: false }));
    }
  };

  // Special handler for phone input (allows only digits and formatting chars)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d\s\-()]/g, '');
    setFormState(prev => ({ ...prev, phone: value }));
    if (touched.phone) {
      setTouched(prev => ({ ...prev, phone: false }));
    }
  };

  // Handle country selection from dropdown
  const handleCountrySelect = (dial_code: string) => {
    setFormState(prev => ({ ...prev, phoneCountryCode: dial_code }));
    setIsCountryDropdownOpen(false);
    setFilterCountry('');
  };

  // Mark field as touched on blur for validation display
  const handleBlur = (field: keyof FormState) => () => setTouched(prev => ({ ...prev, [field]: true }));

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields and mark as touched if invalid
    if (!isFormValid) {
      const fields = ['email', 'phone', 'firstName', 'lastName', 'password', 'confirmPassword'];
      const touchedFields = fields.reduce((acc, field) => ({ ...acc, [field]: true }), {});
      setTouched(prev => ({ ...prev, ...touchedFields }));
      return;
    }

    // Prepare data for API call
    const registerData = {
      email: formState.email,
      phone: selectedCountry.dial_code + formState.phone.replace(/\D/g, ''), // Combine country code with digits-only phone
      first_name: formState.firstName,
      last_name: formState.lastName,
      password: formState.password,
      password_confirmation: formState.confirmPassword,
    };

    // Call the registration mutation
    // Note: Success/error handling (including toast notifications) is managed in queries.ts
    register(registerData);
  };

  // Dynamic input styling based on validation state and theme
  const inputClass = (field: keyof FormState, hasIcon = true) => {
    const isValid = validation[field].isValid && formState[field];
    const hasError = touched[field] && validation[field].error;
    return cn(
      'w-full py-2.5 text-sm rounded-lg border-2 transition-all duration-150',
      'focus:outline-none focus:ring-2',
      hasIcon ? 'pl-9 pr-10' : 'px-3',
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

  // Label styling based on theme
  const labelClass = cn('block text-xs font-semibold mb-1.5', theme === 'dark' ? 'text-gray-300' : 'text-gray-700');
  
  // Icon styling based on theme
  const iconClass = cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', theme === 'dark' ? 'text-gray-500' : 'text-gray-400');

  return (
    <AuthLayout
      title="Let's get you started…"
      subtitle="Sign up to access your clinical dashboard."
      heroHeadline="Welcome aboard!"
      heroSubtext="Quick signup, lifetime access. Your journey starts now."
      showBackToLogin
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>First Name</label>
            <div className="relative">
              <User className={iconClass} />
              <input
                type="text"
                value={formState.firstName}
                onChange={handleChange('firstName')}
                onBlur={handleBlur('firstName')}
                placeholder="e.g., John"
                className={inputClass('firstName')}
                disabled={isLoading}
              />
              {validation.firstName.isValid && formState.firstName && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              )}
            </div>
            {touched.firstName && validation.firstName.error && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{validation.firstName.error}
              </p>
            )}
          </div>
          <div>
            <label className={labelClass}>Last Name</label>
            <div className="relative">
              <User className={iconClass} />
              <input
                type="text"
                value={formState.lastName}
                onChange={handleChange('lastName')}
                onBlur={handleBlur('lastName')}
                placeholder="e.g., Doe"
                className={inputClass('lastName')}
                disabled={isLoading}
              />
              {validation.lastName.isValid && formState.lastName && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              )}
            </div>
            {touched.lastName && validation.lastName.error && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{validation.lastName.error}
              </p>
            )}
          </div>
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
              placeholder="e.g., john.doe@example.com"
              className={inputClass('email')}
              disabled={isLoading}
            />
            {validation.email.isValid && formState.email && (
              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
            )}
          </div>
          {touched.email && validation.email.error && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{validation.email.error}
            </p>
          )}
        </div>

        {/* Phone Number with WhatsApp */}
        <div>
          <label className={labelClass}>
            Phone Number <span className="text-emerald-500">(WhatsApp Preferred)</span>
          </label>

          <div className="flex gap-2">
            {/* Country Code Selector */}
            <div className="relative flex-shrink-0 w-36">
              <button
                type="button"
                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                className={cn(
                  'w-full py-2.5 px-3 rounded-lg border-2 text-sm text-left',
                  'focus:outline-none focus:ring-2 transition-all duration-150',
                  'flex items-center justify-between gap-2',
                  theme === 'dark'
                    ? 'bg-gray-900/60 text-white border-gray-700 hover:border-cyan-500 focus:ring-cyan-500/30'
                    : 'bg-white text-gray-900 border-gray-300 hover:border-blue-500 focus:ring-blue-200'
                )}
                disabled={isLoading}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span className="text-base">{selectedCountry.flag}</span>
                  <span className="font-medium">{selectedCountry.dial_code}</span>
                </span>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {isCountryDropdownOpen && (
                <div className={cn(
                  'absolute z-50 w-72 mt-1 rounded-lg border-2 shadow-xl',
                  'max-h-64 overflow-hidden flex flex-col',
                  theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'
                )}>
                  {/* Search */}
                  <div className="p-2 border-b" style={{ borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}>
                    <input
                      type="text"
                      value={filterCountry}
                      onChange={(e) => setFilterCountry(e.target.value)}
                      placeholder="Search country..."
                      className={cn(
                        'w-full px-3 py-1.5 text-xs rounded border',
                        'focus:outline-none focus:ring-1',
                        theme === 'dark'
                          ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-cyan-500'
                          : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500'
                      )}
                      autoFocus
                    />
                  </div>

                  {/* Country List */}
                  <div className="overflow-y-auto">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => handleCountrySelect(country.dial_code)}
                          className={cn(
                            'w-full px-3 py-2 text-left text-sm',
                            'hover:bg-opacity-50 transition-colors',
                            'flex items-center gap-2',
                            theme === 'dark' ? 'hover:bg-gray-800 text-white' : 'hover:bg-gray-100 text-gray-900',
                            country.dial_code === formState.phoneCountryCode &&
                              (theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50')
                          )}
                        >
                          <span className="text-lg">{country.flag}</span>
                          <span className="flex-1 truncate">{country.name}</span>
                          <span className={cn('font-medium text-xs', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
                            {country.dial_code}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className={cn('px-3 py-4 text-center text-sm', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
                        No countries found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Phone Input */}
            <div className="relative flex-1">
              <Phone className={iconClass} />
              <input
                type="tel"
                value={formState.phone}
                onChange={handlePhoneChange}
                onBlur={handleBlur('phone')}
                placeholder="e.g., 712 345 678"
                className={inputClass('phone')}
                disabled={isLoading}
              />
              {validation.phone.isValid && formState.phone && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              )}
            </div>
          </div>

          {/* Show full number with country code */}
          {formState.phone && (
            <p className={cn('text-xs mt-1', theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}>
              {formState.phone.length < 3 ? 'Typing..: ' : 'Number: '}
              <span className="font-mono text-blue-600">
                {selectedCountry.dial_code} {formState.phone}
              </span>
            </p>
          )}

          {/* Validation Errors */}
          {touched.phone && validation.phone.error && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {validation.phone.error}
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
              className={cn(
                'absolute right-9 top-1/2 -translate-y-1/2 p-0.5',
                theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
              )}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            {validation.password.isValid && formState.password && (
              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
            )}
          </div>
          {formState.password && (
            <div className="mt-1.5">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>Strength:</span>
                <span className={cn(
                  'font-medium',
                  passwordStrength.score >= 3 ? 'text-emerald-500' : 
                  passwordStrength.score >= 2 ? 'text-yellow-500' : 'text-red-500'
                )}>
                  {passwordStrength.label}
                </span>
              </div>
              <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 rounded-full flex-1 transition-all duration-300',
                      i <= passwordStrength.score ? passwordStrength.color : theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                    )}
                  />
                ))}
              </div>
            </div>
          )}
          {touched.password && validation.password.error && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
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
              placeholder="Re-enter your password"
              className={cn(inputClass('confirmPassword'), 'pr-10')}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className={cn(
                'absolute right-9 top-1/2 -translate-y-1/2 p-0.5',
                theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
              )}
              disabled={isLoading}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            {validation.confirmPassword.isValid && formState.confirmPassword && (
              <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
            )}
          </div>
          {touched.confirmPassword && validation.confirmPassword.error && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{validation.confirmPassword.error}
            </p>
          )}
        </div>

        {/* Submit Button */}
            <button
        type="submit"
        disabled={isLoading || !isFormValid}
        className={cn(
          'w-full py-3 rounded-lg font-semibold text-sm mt-6',
          'transition-all duration-200 flex items-center justify-center gap-2',
          'focus:outline-none focus:ring-4',
          isFormValid && !isLoading
            ? cn(
                'cursor-pointer',
                theme === 'dark'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 focus:ring-blue-500/40 shadow-lg hover:shadow-xl hover:scale-[1.01]'
                  : 'bg-gradient-to-r from-blue-600 to-blue-600 text-white hover:from-blue-700 hover:to-blue-700 focus:ring-blue-400/40 shadow-lg hover:shadow-xl hover:scale-[1.01]'
              )
            : cn(
                'cursor-not-allowed',
                theme === 'dark'
                  ? 'bg-gray-700 text-gray-500'
                  : 'bg-gray-200 text-gray-400'
              )
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating your account...
          </>
        ) : (
          'Create Account'
        )}
      </button>


        {/* Sign in link */}
        <p className={cn('text-center text-xs pt-1', theme === 'dark' ? 'text-gray-500' : 'text-gray-600')}>
          Already have an account?{' '}
          <Link
            to="/login"
            className={cn(
              'font-semibold cursor-pointer',
              theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
            )}
          >
            Sign In
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default SignUp;