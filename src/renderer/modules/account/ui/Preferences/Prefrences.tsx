/**
 * ============================================================================
 * USER PREFERENCES COMPONENT
 * ============================================================================
 * 
 * Allows users to view and update their UI/UX preferences:
 * - Theme mode (light/dark/system)
 * - UI density (compact/comfortable/spacious)
 * - Timezone
 * - Locale
 */

import React, { useCallback, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Edit3, Save, X, XCircle, Sun, Moon, Monitor, Layout, MapPin, Globe } from 'lucide-react';

import type { RootState } from '../../../../app/store/rootReducer';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';

import {
  useGetUserPreferences,
  useUpdateUserPreferences,
  useUpdateSinglePreference,
  usePreferenceValue,
} from '../../api/settings/preferences/PreferencesQueries';

import type {
  UpdateUserPreferencesRequest,
} from '../../api/settings/preferences/PreferencesTypes';
import  {
    UiDensity,
    ThemeMode,
} from '../../api/settings/preferences/PreferencesTypes';
import { mapBackendThemeToUI } from '../../api/settings/preferences/PreferencesTypes';

/* auth-slice wiring */
import { useAppSelector } from '../../../../app/store/hooks/useApp';
import { selectUser } from '../../../../app/store/slices/authSlice';

/* -------------------------------------------------------------------------- */
/*                              Helper functions                              */
/* -------------------------------------------------------------------------- */

const formatTimezone = (timezone: string): string => {
  try {
    const formatter = new Intl.DateTimeFormat(undefined, {
      timeZone: timezone,
      timeZoneName: 'long',
    });
    const parts = formatter.formatToParts(new Date());
    const timezonePart = parts.find(part => part.type === 'timeZoneName');
    return timezonePart ? timezonePart.value : timezone;
  } catch {
    return timezone.replace(/_/g, ' ');
  }
};

const formatLocale = (locale: string): string => {
  try {
    // Convert underscore format to hyphen format for Intl
    const hyphenFormat = locale.replace(/_/g, '-');
    const displayNames = new Intl.DisplayNames([hyphenFormat], { type: 'language' });
    return displayNames.of(hyphenFormat.split('-')[0]) || locale;
  } catch {
    return locale.replace(/_/g, ' ');
  }
};

/* -------------------------------------------------------------------------- */
/*                              Sub-components                                */
/* -------------------------------------------------------------------------- */

interface PreferenceSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isDark: boolean;
}

const PreferenceSection: React.FC<PreferenceSectionProps> = ({
  title,
  icon,
  children,
  isDark,
}) => {
  const cardBase = `rounded-xl border p-6 ${
    isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
  }`;
  const divider = `border-t ${isDark ? 'border-gray-800' : 'border-gray-100'}`;

  return (
    <section className={cardBase}>
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
      <div className={divider} />
      <div className="pt-4">{children}</div>
    </section>
  );
};

interface ThemeOptionProps {
  value: ThemeMode;
  label: string;
  icon: React.ReactNode;
  selected: boolean;
  isDark: boolean;
  onClick: () => void;
}

const ThemeOption: React.FC<ThemeOptionProps> = ({
  label,
  icon,
  selected,
  isDark,
  onClick,
}) => {
  const baseClass = `flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all cursor-pointer ${
    isDark
      ? 'hover:bg-gray-800'
      : 'hover:bg-gray-50'
  } ${
    selected
      ? isDark
        ? 'border-cyan-500 bg-cyan-500/10'
        : 'border-blue-500 bg-blue-50'
      : isDark
        ? 'border-gray-700'
        : 'border-gray-200'
  }`;

  return (
    <div className={baseClass} onClick={onClick}>
      <span className={selected ? (isDark ? 'text-cyan-400' : 'text-blue-600') : ''}>
        {icon}
      </span>
      <span className={`text-xs font-medium ${
        selected
          ? isDark ? 'text-cyan-400' : 'text-blue-600'
          : isDark ? 'text-gray-400' : 'text-gray-500'
      }`}>
        {label}
      </span>
    </div>
  );
};

interface DensityOptionProps {
  value: UiDensity;
  label: string;
  description: string;
  selected: boolean;
  isDark: boolean;
  onClick: () => void;
}

const DensityOption: React.FC<DensityOptionProps> = ({
  label,
  description,
  selected,
  isDark,
  onClick,
}) => {
  const baseClass = `p-3 rounded-lg border-2 transition-all cursor-pointer ${
    isDark
      ? 'hover:bg-gray-800'
      : 'hover:bg-gray-50'
  } ${
    selected
      ? isDark
        ? 'border-cyan-500 bg-cyan-500/10'
        : 'border-blue-500 bg-blue-50'
      : isDark
        ? 'border-gray-700'
        : 'border-gray-200'
  }`;

  return (
    <div className={baseClass} onClick={onClick}>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${
          selected
            ? isDark ? 'text-cyan-400' : 'text-blue-600'
            : isDark ? 'text-gray-200' : 'text-gray-900'
        }`}>
          {label}
        </span>
        {selected && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-600'
          }`}>
            Active
          </span>
        )}
      </div>
      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {description}
      </p>
    </div>
  );
};

interface FieldErrorProps {
  msg: string;
}

const FieldError: React.FC<FieldErrorProps> = ({ msg }) => (
  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
    <XCircle className="w-3 h-3 shrink-0" />
    {msg}
  </p>
);

/* -------------------------------------------------------------------------- */
/*                              Main component                                */
/* -------------------------------------------------------------------------- */

interface UserPreferencesProps {
  userId?: number | string; // Optional, will use from auth if not provided
}

const UserPreferences: React.FC<UserPreferencesProps> = ({ userId: propUserId }) => {
  const authUser = useAppSelector(selectUser);
  const theme = useSelector((state: RootState) => state.ui.theme);
  const isDark = theme === 'dark';

  // Use provided userId or get from auth
  const userId = propUserId || authUser?.id;

  const { data: preferencesResponse, isLoading, isError, error: fetchError } =
    useGetUserPreferences({
      enabled: !!userId,
    });

  const { mutate: updatePreferences, isPending: isSaving } = useUpdateUserPreferences({
    onSuccess: () => {
      setEditMode(false);
      setLocalEdits(null);
    },
  });

  // For single updates without edit mode
  const { updateTheme: updateThemeSingle, updateDensity: updateDensitySingle } =
    useUpdateSinglePreference();

  const preferences = preferencesResponse?.data;
  const currentTheme = usePreferenceValue('theme_mode');

  const [editMode, setEditMode] = useState(false);
  const [localEdits, setLocalEdits] = useState<UpdateUserPreferencesRequest | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ✅ FIXED: Derive form state from preferences and local edits instead of using useEffect
  const form = useMemo(() => {
    if (!preferences) return null;
    
    // Start with base preferences from server
    const baseForm = {
      theme_mode: preferences.theme_mode,
      ui_density: preferences.ui_density,
      timezone: preferences.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: preferences.locale || 'en_us',
    };

    // If in edit mode with local changes, merge them
    if (editMode && localEdits) {
      return {
        theme_mode: localEdits.theme_mode ?? baseForm.theme_mode,
        ui_density: localEdits.ui_density ?? baseForm.ui_density,
        timezone: localEdits.timezone ?? baseForm.timezone,
        locale: localEdits.locale ?? baseForm.locale,
      };
    }

    return baseForm;
  }, [preferences, editMode, localEdits]);

  // Common timezones for quick selection
  const commonTimezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
    'Pacific/Auckland',
  ];

  // Popular locales
  const commonLocales = [
    'en_us',
    'en_gb',
    'es_es',
    'fr_fr',
    'de_de',
    'it_it',
    'pt_br',
    'ja_jp',
    'ko_kr',
    'zh_cn',
  ];

  const handleField = useCallback((key: keyof UpdateUserPreferencesRequest, value: string) => {
    setLocalEdits((prev) => ({
      ...(prev || {}),
      [key]: value,
    }));
    // Clear field error when user makes a change
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setLocalEdits(null);
    setFieldErrors({});
    setEditMode(false);
  }, []);

  const validate = useCallback((f: UpdateUserPreferencesRequest): boolean => {
    const errs: Record<string, string> = {};

    if (f.theme_mode && !['light', 'dark', 'system'].includes(f.theme_mode)) {
      errs.theme_mode = 'Theme must be light, dark, or system.';
    }

    if (f.ui_density && !['compact', 'comfortable', 'spacious'].includes(f.ui_density)) {
      errs.ui_density = 'Density must be compact, comfortable, or spacious.';
    }

    if (f.timezone) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: f.timezone });
      } catch {
        errs.timezone = 'Please provide a valid timezone identifier.';
      }
    }

    if (f.locale && f.locale.length > 10) {
      errs.locale = 'Locale code must not exceed 10 characters.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }, []);

  const handleSave = useCallback(() => {
    if (!localEdits || !preferences || !userId) return;
    if (!validate(localEdits)) return;

    // Only send changed fields
    const payload: UpdateUserPreferencesRequest = {};
    if (localEdits.theme_mode && localEdits.theme_mode !== preferences.theme_mode) {
      payload.theme_mode = localEdits.theme_mode;
    }
    if (localEdits.ui_density && localEdits.ui_density !== preferences.ui_density) {
      payload.ui_density = localEdits.ui_density;
    }
    if (localEdits.timezone && localEdits.timezone !== preferences.timezone) {
      payload.timezone = localEdits.timezone;
    }
    if (localEdits.locale && localEdits.locale !== preferences.locale) {
      payload.locale = localEdits.locale;
    }

    if (Object.keys(payload).length === 0) {
      setEditMode(false);
      setLocalEdits(null);
      return;
    }

    updatePreferences({ data: payload });
  }, [localEdits, preferences, userId, updatePreferences, validate]);

  const handleThemeChange = useCallback((themeMode: ThemeMode) => {
    if (editMode) {
      handleField('theme_mode', themeMode);
    } else {
      // Instant update outside edit mode
      updateThemeSingle(themeMode);
    }
  }, [editMode, handleField, updateThemeSingle]);

  const handleDensityChange = useCallback((density: UiDensity) => {
    if (editMode) {
      handleField('ui_density', density);
    } else {
      // Instant update outside edit mode
      updateDensitySingle(density);
    }
  }, [editMode, handleField, updateDensitySingle]);

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
          Please log in to view your preferences.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSkeleton variant="detail" theme={theme} message="Loading your preferences…" />;
  }

  if (isError || !preferences || !form) {
    return (
      <div
        className={`flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 ${
          isDark ? 'text-gray-100' : 'text-gray-900'
        }`}
      >
        <XCircle className={`w-16 h-16 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
        <h2 className="text-xl font-bold">Failed to load preferences</h2>
        <p className={`text-sm text-center max-w-md ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {fetchError?.response?.data?.message ?? fetchError?.message ?? 'An unexpected error occurred.'}
        </p>
      </div>
    );
  }

  const inputBase = `w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors
    focus:ring-2 ${
      isDark
        ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20'
        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
    }`;

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
            <h1 className="text-2xl font-bold">UI Preferences</h1>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Customize how the application looks and behaves.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {editMode ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    isSaving ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-opacity-80'
                  } ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors ${
                    isSaving ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-blue-700'
                  } bg-blue-600`}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors cursor-pointer hover:bg-blue-700 ${
                  isDark ? 'bg-blue-500' : 'bg-blue-600'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                Edit Preferences
              </button>
            )}
          </div>
        </div>

        {/* ── Theme Preference ── */}
        <PreferenceSection
          title="Theme"
          icon={editMode || !currentTheme ? <Sun className="w-4 h-4" /> : 
            currentTheme === 'dark' ? <Moon className="w-4 h-4" /> :
            currentTheme === 'light' ? <Sun className="w-4 h-4" /> :
            <Monitor className="w-4 h-4" />}
          isDark={isDark}
        >
          <div className="grid grid-cols-3 gap-3">
            <ThemeOption
              value={ThemeMode.LIGHT}
              label="Light"
              icon={<Sun className="w-5 h-5" />}
              selected={form.theme_mode === ThemeMode.LIGHT}
              isDark={isDark}
              onClick={() => handleThemeChange(ThemeMode.LIGHT)}
            />
            <ThemeOption
              value={ThemeMode.DARK}
              label="Dark"
              icon={<Moon className="w-5 h-5" />}
              selected={form.theme_mode === ThemeMode.DARK}
              isDark={isDark}
              onClick={() => handleThemeChange(ThemeMode.DARK)}
            />
            <ThemeOption
              value={ThemeMode.SYSTEM}
              label="System"
              icon={<Monitor className="w-5 h-5" />}
              selected={form.theme_mode === ThemeMode.SYSTEM}
              isDark={isDark}
              onClick={() => handleThemeChange(ThemeMode.SYSTEM)}
            />
          </div>
          <p className={`text-xs mt-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {form.theme_mode === ThemeMode.SYSTEM
              ? `Currently using ${mapBackendThemeToUI(ThemeMode.SYSTEM)} mode based on your system preference.`
              : `Current theme: ${form.theme_mode?.charAt(0).toUpperCase()}${form.theme_mode?.slice(1)}`}
          </p>
          {fieldErrors.theme_mode && <FieldError msg={fieldErrors.theme_mode} />}
        </PreferenceSection>

        {/* ── UI Density ── */}
        <PreferenceSection
          title="UI Density"
          icon={<Layout className="w-4 h-4" />}
          isDark={isDark}
        >
          <div className="space-y-3">
            <DensityOption
              value={UiDensity.COMPACT}
              label="Compact"
              description="Tighter spacing, shows more content"
              selected={form.ui_density === UiDensity.COMPACT}
              isDark={isDark}
              onClick={() => handleDensityChange(UiDensity.COMPACT)}
            />
            <DensityOption
              value={UiDensity.COMFORTABLE}
              label="Comfortable"
              description="Balanced spacing, good for most users"
              selected={form.ui_density === UiDensity.COMFORTABLE}
              isDark={isDark}
              onClick={() => handleDensityChange(UiDensity.COMFORTABLE)}
            />
            <DensityOption
              value={UiDensity.SPACIOUS}
              label="Spacious"
              description="Extra padding, easier to read"
              selected={form.ui_density === UiDensity.SPACIOUS}
              isDark={isDark}
              onClick={() => handleDensityChange(UiDensity.SPACIOUS)}
            />
          </div>
          {fieldErrors.ui_density && <FieldError msg={fieldErrors.ui_density} />}
        </PreferenceSection>

        {/* ── Timezone ── */}
        <PreferenceSection
          title="Timezone"
          icon={<MapPin className="w-4 h-4" />}
          isDark={isDark}
        >
          {editMode ? (
            <div>
              <select
                value={form.timezone}
                onChange={(e) => handleField('timezone', e.target.value)}
                className={`${inputBase} appearance-none`}
              >
                <optgroup label="Common Timezones">
                  {commonTimezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {formatTimezone(tz)}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="All Timezones">
                  {Intl.supportedValuesOf('timeZone').map((tz) => (
                    <option key={tz} value={tz}>
                      {formatTimezone(tz)}
                    </option>
                  ))}
                </optgroup>
              </select>
              {fieldErrors.timezone && <FieldError msg={fieldErrors.timezone} />}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {formatTimezone(form.timezone)}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
              }`}>
                {form.timezone}
              </span>
            </div>
          )}
        </PreferenceSection>

        {/* ── Locale ── */}
        <PreferenceSection
          title="Language & Region"
          icon={<Globe className="w-4 h-4" />}
          isDark={isDark}
        >
          {editMode ? (
            <div>
              <select
                value={form.locale}
                onChange={(e) => handleField('locale', e.target.value)}
                className={`${inputBase} appearance-none`}
              >
                <optgroup label="Common Locales">
                  {commonLocales.map((loc) => (
                    <option key={loc} value={loc}>
                      {formatLocale(loc)} ({loc})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="All Locales">
                  {(() => {
                    // Get all available locales from the browser
                    const locales = [
                      'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-NZ',
                      'es-ES', 'es-MX', 'es-AR', 'fr-FR', 'fr-CA',
                      'de-DE', 'it-IT', 'pt-BR', 'pt-PT', 'ru-RU',
                      'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW', 'ar-SA',
                      'hi-IN', 'nl-NL', 'sv-SE', 'da-DK', 'fi-FI',
                      'no-NO', 'pl-PL', 'cs-CZ', 'hu-HU', 'tr-TR',
                      'th-TH', 'vi-VN', 'id-ID', 'ms-MY', 'he-IL',
                      'uk-UA', 'ro-RO', 'bg-BG', 'sr-RS', 'hr-HR',
                      'sk-SK', 'sl-SI', 'lt-LT', 'lv-LV', 'et-EE',
                      'el-GR', 'fa-IR', 'ur-PK', 'bn-BD', 'ta-IN',
                      'te-IN', 'kn-IN', 'ml-IN', 'gu-IN', 'mr-IN'
                    ];
                    
                    return locales.map((loc) => {
                      // Convert from hyphen format to underscore format to match commonLocales
                      const underscoreFormat = loc.toLowerCase().replace('-', '_');
                      return (
                        <option key={underscoreFormat} value={underscoreFormat}>
                          {formatLocale(underscoreFormat)} ({underscoreFormat})
                        </option>
                      );
                    });
                  })()}
                </optgroup>
              </select>
              {fieldErrors.locale && <FieldError msg={fieldErrors.locale} />}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {formatLocale(form.locale)}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
              }`}>
                {form.locale}
              </span>
            </div>
          )}
        </PreferenceSection>
      </div>
    </div>
  );
};

UserPreferences.displayName = 'UserPreferences';
export default UserPreferences;