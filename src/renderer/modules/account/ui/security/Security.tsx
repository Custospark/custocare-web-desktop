/**
 * ============================================================================
 * USER SECURITY COMPONENT
 * ============================================================================
 * 
 * Allows users to manage their account security:
 * - View security settings (last login, failed attempts, password age)
 * - Change password
 * - Enable/disable two-factor authentication (email verification)
 * - Clear forced password change flag
 */

import React, { useCallback, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  Shield,
  Key,
  Lock,
  Mail,
  AlertTriangle,
  XCircle,
  Eye,
  EyeOff,
  Clock,
  Globe,
  LogIn,
  Save,
  X,
  Edit3,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  ThumbsUp,
  AlertOctagon,
} from 'lucide-react';

import type { RootState } from '../../../../app/store/rootReducer';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';

import {
  useGetUserSecurity,
  useUpdateUserSecurity,
  useToggleMFA,
  useClearPasswordChangeRequired,
  useSecurityValue,
} from '../../api/security/SecurityQueries';

import {
  formatDate,
  getAccountStatus,
} from '../../api/security/SecurityTypes';

/* auth-slice wiring */
import { useAppSelector } from '../../../../app/store/hooks/useApp';
import { selectUser } from '../../../../app/store/slices/authSlice';

/* -------------------------------------------------------------------------- */
/*                              Helper functions                              */
/* -------------------------------------------------------------------------- */

const maskIP = (ip: string | null): string => {
  if (!ip) return 'Unknown';
  
  // Simple IP masking - show first 3 octets for IPv4
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
  }
  return ip;
};

/* -------------------------------------------------------------------------- */
/*                              Sub-components                                */
/* -------------------------------------------------------------------------- */

interface SecuritySectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isDark: boolean;
  className?: string;
}

const SecuritySection: React.FC<SecuritySectionProps> = ({
  title,
  icon,
  children,
  isDark,
  className = '',
}) => {
  const cardBase = `rounded-xl border p-6 ${
    isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
  }`;

  return (
    <section className={`${cardBase} ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`p-1.5 rounded-lg ${
            isDark ? 'bg-cyan-500/15 text-cyan-400' : 'bg-blue-50 text-blue-600'
          }`}
        >
          {icon}
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </section>
  );
};

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  isDark: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, icon, isDark }) => (
  <div className="flex items-start gap-3 py-2">
    {icon && (
      <span className={`mt-0.5 flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        {icon}
      </span>
    )}
    <div className="min-w-0 flex-1">
      <p className={`text-xs font-medium uppercase tracking-wider mb-0.5 ${
        isDark ? 'text-gray-500' : 'text-gray-400'
      }`}>
        {label}
      </p>
      <div className={`text-sm font-medium break-words ${
        value
          ? isDark ? 'text-gray-100' : 'text-gray-900'
          : isDark ? 'text-gray-600' : 'text-gray-400'
      }`}>
        {value || '—'}
      </div>
    </div>
  </div>
);

interface StatusBadgeProps {
  status: 'locked' | 'warning' | 'secure';
  message: string;
  isDark: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, message, isDark }) => {
  const config = {
    locked: {
      icon: AlertOctagon,
      bg: isDark ? 'bg-red-500/20' : 'bg-red-100',
      text: isDark ? 'text-red-400' : 'text-red-700',
      border: isDark ? 'border-red-500/30' : 'border-red-200',
    },
    warning: {
      icon: AlertTriangle,
      bg: isDark ? 'bg-amber-500/20' : 'bg-amber-100',
      text: isDark ? 'text-amber-400' : 'text-amber-700',
      border: isDark ? 'border-amber-500/30' : 'border-amber-200',
    },
    secure: {
      icon: ShieldCheck,
      bg: isDark ? 'bg-emerald-500/20' : 'bg-emerald-100',
      text: isDark ? 'text-emerald-400' : 'text-emerald-700',
      border: isDark ? 'border-emerald-500/30' : 'border-emerald-200',
    },
  };

  const { icon: Icon, bg, text, border } = config[status];

  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg border ${bg} ${border}`}>
      <Icon className={`w-4 h-4 ${text}`} />
      <span className={`text-xs font-medium ${text}`}>{message}</span>
    </div>
  );
};

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  isDark: boolean;
  error?: string;
  showPassword?: boolean;
  onToggleShow?: () => void;
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  value,
  onChange,
  placeholder,
  isDark,
  error,
  showPassword,
  onToggleShow,
}) => {
  const inputBase = `w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors
    focus:ring-2 pr-10 ${
      isDark
        ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20'
        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
    } ${error ? (isDark ? 'border-red-500' : 'border-red-500') : ''}`;

  return (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputBase}
      />
      {onToggleShow && (
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          ) : (
            <Eye className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          )}
        </button>
      )}
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <XCircle className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};

interface InfoBoxProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isDark: boolean;
  variant?: 'info' | 'success' | 'warning' | 'danger';
}

const InfoBox: React.FC<InfoBoxProps> = ({ 
  title, 
  icon, 
  children, 
  isDark, 
  variant = 'info' 
}) => {
  const variants = {
    info: {
      bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
      border: isDark ? 'border-blue-500/30' : 'border-blue-200',
      text: isDark ? 'text-blue-400' : 'text-blue-700',
      icon: isDark ? 'text-blue-400' : 'text-blue-600',
    },
    success: {
      bg: isDark ? 'bg-green-500/10' : 'bg-green-50',
      border: isDark ? 'border-green-500/30' : 'border-green-200',
      text: isDark ? 'text-green-400' : 'text-green-700',
      icon: isDark ? 'text-green-400' : 'text-green-600',
    },
    warning: {
      bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50',
      border: isDark ? 'border-amber-500/30' : 'border-amber-200',
      text: isDark ? 'text-amber-400' : 'text-amber-700',
      icon: isDark ? 'text-amber-400' : 'text-amber-600',
    },
    danger: {
      bg: isDark ? 'bg-red-500/10' : 'bg-red-50',
      border: isDark ? 'border-red-500/30' : 'border-red-200',
      text: isDark ? 'text-red-400' : 'text-red-700',
      icon: isDark ? 'text-red-400' : 'text-red-600',
    },
  };

  const style = variants[variant];

  return (
    <div className={`p-4 rounded-lg border ${style.bg} ${style.border}`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${style.icon}`}>{icon}</div>
        <div>
          <h4 className={`text-sm font-semibold mb-2 ${style.text}`}>{title}</h4>
          <div className={`text-xs space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                              Main component                                */
/* -------------------------------------------------------------------------- */

interface UserSecurityProps {
  userId?: number | string; // Optional, will use from auth if not provided
}

const UserSecurity: React.FC<UserSecurityProps> = ({ userId: propUserId }) => {
  const authUser = useAppSelector(selectUser);
  const theme = useSelector((state: RootState) => state.ui.theme);
  const isDark = theme === 'dark';

  // Use provided userId or get from auth
  const userId = propUserId || authUser?.id;

  // Use the base query hook to get refetch function
  const { 
    data: securityResponse, 
    isLoading, 
    isError, 
    error: fetchError,
    refetch 
  } = useGetUserSecurity({
    enabled: !!userId,
  });

  const { mutate: updateSecurity, isPending: isSaving } = useUpdateUserSecurity({
    onSuccess: () => {
      setPasswordForm({
        current_password: '',
        password: '',
        password_confirmation: '',
      });
      setShowPasswordFields(false);
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setFieldErrors({});
    },
  });

  const { toggleMFA, isPending: isTogglingMFA } = useToggleMFA();
  const { clearFlag, isPending: isClearingFlag } = useClearPasswordChangeRequired();

  const security = securityResponse?.data;
  const requiresPasswordChange = useSecurityValue('requires_password_change');

  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showMFAInfo, setShowMFAInfo] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const accountStatus = useMemo(() => {
    if (!security) return null;
    return getAccountStatus(security);
  }, [security]);

  const handlePasswordChange = useCallback((field: keyof typeof passwordForm, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    setFieldErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, [setPasswordForm, setFieldErrors]);

  const validatePasswordForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!passwordForm.current_password) {
      errors.current_password = 'Current password is required.';
    }

    if (!passwordForm.password) {
      errors.password = 'New password is required.';
    } else if (passwordForm.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }

    if (passwordForm.password !== passwordForm.password_confirmation) {
      errors.password_confirmation = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [passwordForm, setFieldErrors]);

  const handleSavePassword = useCallback(() => {
    if (!validatePasswordForm()) return;

    updateSecurity({
      data: {
        current_password: passwordForm.current_password,
        password: passwordForm.password,
        password_confirmation: passwordForm.password_confirmation,
      },
    });
  }, [passwordForm, updateSecurity, validatePasswordForm]);

  const handleCancelPassword = useCallback(() => {
    setPasswordForm({
      current_password: '',
      password: '',
      password_confirmation: '',
    });
    setShowPasswordFields(false);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setFieldErrors({});
  }, [setPasswordForm, setShowPasswordFields, setShowCurrentPassword, setShowNewPassword, setShowConfirmPassword, setFieldErrors]);

  // ✅ FIXED: Added setShowMFAInfo to dependency array
  const handleToggleMFA = useCallback(async () => {
    await toggleMFA();
    // After toggling, hide the info panel
    setShowMFAInfo(false);
  }, [toggleMFA, setShowMFAInfo]);

  const handleClearPasswordFlag = useCallback(async () => {
    await clearFlag();
  }, [clearFlag]);

  /* ── UI states ── */

  if (!userId) {
    return (
      <div
        className={`flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 ${
          isDark ? 'text-gray-100' : 'text-gray-900'
        }`}
      >
        <XCircle className={`w-16 h-16 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
        <h2 className="text-xl font-bold">Not Authenticated</h2>
        <p className={`text-sm text-center max-w-md ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Please log in to view your security settings.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSkeleton variant="detail" theme={theme} message="Loading security settings…" />;
  }

  if (isError || !security) {
    return (
      <div
        className={`flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 ${
          isDark ? 'text-gray-100' : 'text-gray-900'
        }`}
      >
        <XCircle className={`w-16 h-16 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
        <h2 className="text-xl font-bold">Failed to load security settings</h2>
        <p className={`text-sm text-center max-w-md ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {fetchError?.response?.data?.message ?? fetchError?.message ?? 'An unexpected error occurred.'}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors ${
        isDark ? 'bg-gray-1000 text-gray-100' : 'bg-gray-50 text-gray-900'
      }`}
    >
      <div className="max-w-4xl mx-auto p-4 lg:p-8 space-y-6">
        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Security Settings</h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Manage your account security and authentication methods.
            </p>
          </div>
        </div>

        {/* ── Account Status Banner ── */}
        {accountStatus && (
          <StatusBadge
            status={accountStatus.status}
            message={accountStatus.message}
            isDark={isDark}
          />
        )}

        {/* ── Password Change Section ── */}
        <SecuritySection
          title="Password"
          icon={<Key className="w-4 h-4" />}
          isDark={isDark}
        >
          {requiresPasswordChange && (
            <div className={`mb-4 p-3 rounded-lg border ${
              isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'
            }`}>
              <p className={`text-xs flex items-center gap-2 ${
                isDark ? 'text-amber-400' : 'text-amber-700'
              }`}>
                <AlertTriangle className="w-4 h-4" />
                You are required to change your password before continuing.
              </p>
            </div>
          )}

          {!showPasswordFields ? (
            <div className="space-y-4">
              <InfoRow
                label="Last Changed"
                value={security.password_changed_at ? formatDate(security.password_changed_at) : 'Never'}
                icon={<Clock className="w-4 h-4" />}
                isDark={isDark}
              />
              <button
                onClick={() => setShowPasswordFields(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                Change Password
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <PasswordField
                value={passwordForm.current_password}
                onChange={(v) => handlePasswordChange('current_password', v)}
                placeholder="Current Password"
                isDark={isDark}
                error={fieldErrors.current_password}
                showPassword={showCurrentPassword}
                onToggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
              />
              <PasswordField
                value={passwordForm.password}
                onChange={(v) => handlePasswordChange('password', v)}
                placeholder="New Password"
                isDark={isDark}
                error={fieldErrors.password}
                showPassword={showNewPassword}
                onToggleShow={() => setShowNewPassword(!showNewPassword)}
              />
              <PasswordField
                value={passwordForm.password_confirmation}
                onChange={(v) => handlePasswordChange('password_confirmation', v)}
                placeholder="Confirm New Password"
                isDark={isDark}
                error={fieldErrors.password_confirmation}
                showPassword={showConfirmPassword}
                onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSavePassword}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Password
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancelPassword}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors cursor-pointer bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          )}
        </SecuritySection>

        {/* ── Two-Factor Authentication Section (Email Verification) ── */}
        <SecuritySection
          title="Two-Factor Authentication"
          icon={<Shield className="w-4 h-4" />}
          isDark={isDark}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className={`w-5 h-5 ${security.mfa_enabled ? 'text-green-500' : 'text-gray-400'}`} />
                <div>
                  <p className="text-sm font-medium">Email Verification</p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {security.mfa_enabled
                      ? 'Two-factor authentication is enabled'
                      : 'Add an extra layer of security to your account'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMFAInfo(!showMFAInfo)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  aria-label="Learn more about two-factor authentication"
                >
                  <HelpCircle className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>
                <button
                  onClick={handleToggleMFA}
                  disabled={isTogglingMFA}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    security.mfa_enabled
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isTogglingMFA ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : security.mfa_enabled ? (
                    'Disable'
                  ) : (
                    'Enable'
                  )}
                </button>
              </div>
            </div>
            
            {/* MFA Information Panel */}
            {showMFAInfo && (
              <div className="space-y-3 mt-2">
                <InfoBox
                  title="What is Two-Factor Authentication (2FA)?"
                  icon={<Shield className="w-4 h-4" />}
                  isDark={isDark}
                  variant="info"
                >
                  <p>
                    Two-Factor Authentication adds an extra layer of security to your account beyond just your password. 
                    When enabled, you'll need to provide both:
                  </p>
                  <ul className="list-disc pl-4 mt-2 space-y-1">
                    <li>Your password (something you know)</li>
                    <li>A verification code sent to your email (something you have access to)</li>
                  </ul>
                </InfoBox>

                <InfoBox
                  title="✅ Benefits of Enabling 2FA"
                  icon={<ThumbsUp className="w-4 h-4" />}
                  isDark={isDark}
                  variant="success"
                >
                  <ul className="list-disc pl-4 space-y-1">
                    <li><span className="font-semibold">Protection against password theft:</span> Even if someone steals your password, they cannot access your account without the email verification code</li>
                    <li><span className="font-semibold">Prevents unauthorized access:</span> Blocks attackers even if you use the same password on multiple sites</li>
                    <li><span className="font-semibold">Alerts you to suspicious activity:</span> You'll receive email codes when someone tries to log in, alerting you to potential breaches</li>
                    <li><span className="font-semibold">Compliance requirements:</span> Meets security standards for healthcare and financial data protection</li>
                    <li><span className="font-semibold">Peace of mind:</span> Significantly reduces the risk of account compromise</li>
                  </ul>
                </InfoBox>

                <InfoBox
                  title="⚠️ Risks and Considerations"
                  icon={<AlertTriangle className="w-4 h-4" />}
                  isDark={isDark}
                  variant="warning"
                >
                  <ul className="list-disc pl-4 space-y-1">
                    <li><span className="font-semibold">Email access required:</span> You must have access to your email to log in. If you lose email access, account recovery may take longer</li>
                    <li><span className="font-semibold">Email account security:</span> Your 2FA is only as secure as your email account. Secure your email with a strong password</li>
                    <li><span className="font-semibold">Slight login delay:</span> You'll need to wait for the email code to arrive (usually within seconds)</li>
                    <li><span className="font-semibold">Email delivery issues:</span> Occasionally, emails may be delayed or marked as spam</li>
                  </ul>
                </InfoBox>

                <InfoBox
                  title="🔒 Best Practices"
                  icon={<ShieldCheck className="w-4 h-4" />}
                  isDark={isDark}
                  variant="info"
                >
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Use a strong, unique password for your email account</li>
                    <li>Enable 2FA on your email account itself if available</li>
                    <li>Keep your email recovery options up to date</li>
                    <li>Add a trusted phone number for account recovery</li>
                    <li>Never share verification codes with anyone</li>
                  </ul>
                </InfoBox>
              </div>
            )}
            
            {/* Status messages for MFA */}
            {security.mfa_enabled ? (
              <div className={`p-4 rounded-lg border ${
                isDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-start gap-3">
                  <ShieldCheck className={`w-5 h-5 mt-0.5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                      Two-factor authentication is ENABLED
                    </p>
                    <p className={`text-xs mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Your account is protected with email-based two-factor authentication. When signing in from a new device or location, you'll receive a verification code at your email address.
                    </p>
                    <div className={`mt-3 p-3 rounded ${
                      isDark ? 'bg-green-500/5' : 'bg-green-100/50'
                    }`}>
                      <p className={`text-xs font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                        How it works:
                      </p>
                      <ol className={`text-xs list-decimal pl-4 mt-1 space-y-1 ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        <li>Enter your email and password as usual</li>
                        <li>Check your email for a one-time verification code</li>
                        <li>Enter the code to complete sign-in</li>
                        <li>The code expires after 10 minutes for security</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`p-4 rounded-lg border ${
                isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-start gap-3">
                  <ShieldAlert className={`w-5 h-5 mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Two-factor authentication is DISABLED
                    </p>
                    <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Without two-factor authentication, your account is protected only by your password. This makes it vulnerable to:
                    </p>
                    <ul className={`text-xs list-disc pl-4 mt-2 space-y-1 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <li>Password theft or phishing attacks</li>
                      <li>Credential stuffing from other site breaches</li>
                      <li>Unauthorized access if you use weak passwords</li>
                    </ul>
                    <p className={`text-xs mt-3 font-medium ${
                      isDark ? 'text-amber-400' : 'text-amber-600'
                    }`}>
                      Enable 2FA now to significantly improve your account security.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SecuritySection>

        {/* ── Recent Activity Section ── */}
        <SecuritySection
          title="Recent Activity"
          icon={<LogIn className="w-4 h-4" />}
          isDark={isDark}
        >
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            <InfoRow
              label="Last Login"
              value={security.last_login_at ? formatDate(security.last_login_at) : 'Never'}
              icon={<Clock className="w-4 h-4" />}
              isDark={isDark}
            />
            <InfoRow
              label="Last IP Address"
              value={maskIP(security.last_login_ip)}
              icon={<Globe className="w-4 h-4" />}
              isDark={isDark}
            />
            <InfoRow
              label="Failed Login Attempts"
              value={security.failed_login_attempts}
              icon={<AlertTriangle className="w-4 h-4" />}
              isDark={isDark}
            />
            {security.account_locked_until && (
              <InfoRow
                label="Account Locked Until"
                value={formatDate(security.account_locked_until)}
                icon={<Lock className="w-4 h-4" />}
                isDark={isDark}
              />
            )}
          </div>
        </SecuritySection>

        {/* ── Forced Password Change Flag ── (Only shown if true) */}
        {security.requires_password_change && (
          <SecuritySection
            title="Password Change Required"
            icon={<AlertTriangle className="w-4 h-4" />}
            isDark={isDark}
            className="border-amber-500 dark:border-amber-500"
          >
            <div className="space-y-4">
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                An administrator has flagged your account to require a password change. 
                {!showPasswordFields && ' Click the button below to change your password.'}
              </p>
              {!showPasswordFields && (
                <button
                  onClick={() => setShowPasswordFields(true)}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium cursor-pointer"
                >
                  Change Password Now
                </button>
              )}
              <button
                onClick={handleClearPasswordFlag}
                disabled={isClearingFlag}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {isClearingFlag ? 'Clearing...' : 'I\'ve already changed my password'}
              </button>
            </div>
          </SecuritySection>
        )}
      </div>
    </div>
  );
};

UserSecurity.displayName = 'UserSecurity';
export default UserSecurity;