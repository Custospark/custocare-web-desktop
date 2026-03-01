/**
 * Shared UI primitives - Fully Responsive Version with Dynamic Text Sizing
 */
import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  XCircle, Search, ChevronDown, Plus, Trash2, Check,
} from 'lucide-react';
import {
  DAYS_OF_WEEK, DAY_ABBR, TIME_OPTIONS, formatTime12h,
  type OperatingHourEntry, type DayOfWeek, type RegulatoryIdentifier,
} from './FacilitySettingsHelpers';
import { inputBase } from './styleHelpers';

// Responsive text size utilities based on viewport
const textSizes = {
  xs: 'text-[10px] xs:text-[11px] sm:text-xs',
  sm: 'text-xs xs:text-sm sm:text-sm',
  base: 'text-sm xs:text-base sm:text-base',
  lg: 'text-base xs:text-lg sm:text-lg',
  title: 'text-xs xs:text-sm sm:text-sm',
  label: 'text-[10px] xs:text-[11px] sm:text-xs',
  value: 'text-xs xs:text-sm sm:text-sm',
  badge: 'text-[10px] xs:text-xs sm:text-xs',
};

// Responsive spacing utilities
const spacing = {
  section: 'space-y-4 xs:space-y-5 sm:space-y-6',
  card: 'p-4 xs:p-5 sm:p-6',
  gap: 'gap-2 xs:gap-3 sm:gap-4',
  grid: 'grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3',
};

/* ─────────────────── atoms ───────────────────────────────────────────── */

export const FieldError: React.FC<{ msg: string }> = ({ msg }) => (
  <p className={`${textSizes.xs} text-red-600 dark:text-red-400 mt-1 flex items-center gap-1`}>
    <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
    <span>{msg}</span>
  </p>
);

export const Label: React.FC<{ isDark: boolean; children: React.ReactNode }> = ({ isDark, children }) => (
  <label
    className={`${textSizes.label} font-semibold uppercase tracking-wider mb-1.5 block ${
      isDark ? 'text-gray-400' : 'text-gray-600'
    }`}
  >
    {children}
  </label>
);

export const InfoRow: React.FC<{
  isDark: boolean;
  label: string;
  value: React.ReactNode;
}> = ({ isDark, label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 py-2">
    <span className={`${textSizes.label} font-semibold sm:w-36 shrink-0 ${
      isDark ? 'text-gray-400' : 'text-gray-500'
    }`}>
      {label}
    </span>
    <span className={`${textSizes.value} break-words ${
      isDark ? 'text-gray-200' : 'text-gray-800'
    }`}>
      {value || '—'}
    </span>
  </div>
);

/* ─────────────────── ColorSwatch ────────────────────────────────────── */

export const ColorSwatch: React.FC<{
  isDark: boolean;
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  error?: string;
}> = ({ isDark, label, value, onChange, disabled, error }) => {
  const safeHex = /^#[0-9A-Fa-f]{3,6}$/.test(value) ? value : '#cccccc';
  
  return (
    <div className="w-full">
      <Label isDark={isDark}>{label}</Label>
      <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 items-start xs:items-center">
        <div className="flex items-center gap-2 w-full xs:w-auto">
          <div
            className="w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-lg border-2 shrink-0 cursor-pointer overflow-hidden relative"
            style={{ borderColor: isDark ? '#374151' : '#d1d5db' }}
          >
            <input
              type="color"
              value={safeHex}
              disabled={disabled}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              aria-label={`Select ${label}`}
            />
            <div className="w-full h-full rounded-md" style={{ backgroundColor: safeHex }} />
          </div>
          <span className={`${textSizes.sm} font-mono xs:hidden`}>{value || '#RRGGBB'}</span>
        </div>
        <input
          className={inputBase(isDark, `flex-1 w-full ${textSizes.sm}`)}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#RRGGBB"
          maxLength={7}
        />
      </div>
      {error && <FieldError msg={error} />}
    </div>
  );
};

/* ─────────────────── ServiceTagSelector ────────────────────────────── */

interface ServiceTagSelectorProps {
  isDark: boolean;
  label: string;
  selected: string[];
  suggestions: string[];
  placeholder?: string;
  disabled?: boolean;
  onChange: (next: string[]) => void;
  color?: 'blue' | 'emerald' | 'violet';
}

export const ServiceTagSelector: React.FC<ServiceTagSelectorProps> = ({
  isDark, label, selected, suggestions, placeholder = 'Search or add…',
  disabled, onChange, color = 'blue',
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? suggestions.filter((s) => s.toLowerCase().includes(q) && !selected.includes(s))
      : suggestions.filter((s) => !selected.includes(s)).slice(0, 8);
  }, [query, suggestions, selected]);

  const toggle = (item: string) => {
    onChange(selected.includes(item) ? selected.filter((x) => x !== item) : [...selected, item]);
  };

  const addCustom = () => {
    const v = query.trim();
    if (v && !selected.includes(v)) { 
      onChange([...selected, v]); 
      setQuery(''); 
      setOpen(false);
    }
  };

  const colorMap = {
    blue: isDark
      ? 'bg-blue-900/50 text-blue-200 border-blue-700/50'
      : 'bg-blue-100 text-blue-800 border-blue-200',
    emerald: isDark
      ? 'bg-emerald-900/50 text-emerald-200 border-emerald-700/50'
      : 'bg-emerald-100 text-emerald-800 border-emerald-200',
    violet: isDark
      ? 'bg-violet-900/50 text-violet-200 border-violet-700/50'
      : 'bg-violet-100 text-violet-800 border-violet-200',
  }[color];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <Label isDark={isDark}>{label}</Label>
        {selected.length > 0 && (
          <span className={`${textSizes.xs} px-2 py-1 rounded-full font-semibold ${colorMap}`}>
            {selected.length} selected
          </span>
        )}
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 xs:gap-2 mb-3">
          {selected.map((item) => (
            <span
              key={item}
              className={`inline-flex items-center gap-1 ${textSizes.xs} px-2 xs:px-2.5 py-1 xs:py-1.5 rounded-full border font-medium ${colorMap}`}
            >
              <span className="truncate max-w-[120px] xs:max-w-[150px] sm:max-w-[200px]">{item}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => toggle(item)}
                  className="hover:opacity-70 transition-opacity ml-0.5 focus:outline-none focus:ring-2 focus:ring-offset-1 rounded-full"
                  aria-label={`Remove ${item}`}
                >
                  <XCircle className="w-3 h-3 xs:w-3.5 xs:h-3.5" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {!disabled && (
        <div className="relative" ref={dropdownRef}>
          <div className="flex flex-col xs:flex-row gap-2">
            <div className="relative flex-1">
              <Search className={`absolute left-2.5 xs:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 xs:w-4 xs:h-4 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                placeholder={placeholder}
                className={inputBase(isDark, `pl-8 xs:pl-10 pr-8 xs:pr-10 ${textSizes.sm} w-full`)}
              />
              <ChevronDown
                className={`absolute right-2.5 xs:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 xs:w-4 xs:h-4 transition-transform duration-200 ${
                  open ? 'rotate-180' : ''
                } ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
              />
            </div>
            {query.trim() && !suggestions.includes(query.trim()) && (
              <button
                type="button"
                onClick={addCustom}
                className={`px-3 xs:px-4 py-2.5 sm:py-2 rounded-lg ${textSizes.sm} font-semibold border transition-colors whitespace-nowrap ${
                  isDark 
                    ? 'border-gray-700 text-gray-300 hover:bg-gray-800' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Plus className="w-4 h-4 sm:hidden" />
                <span className="hidden sm:inline">Add New</span>
              </button>
            )}
          </div>

          {open && (filtered.length > 0 || (query.trim() && !selected.includes(query.trim()))) && (
            <div
              className={`absolute z-50 w-full mt-1 xs:mt-2 rounded-lg xs:rounded-xl border-2 shadow-xl max-h-48 xs:max-h-56 sm:max-h-64 overflow-y-auto ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => { toggle(item); setQuery(''); setOpen(false); }}
                    className={`w-full px-3 xs:px-4 py-2 xs:py-2.5 text-left ${textSizes.sm} transition-colors flex items-center justify-between ${
                      isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <span className="truncate">{item}</span>
                    {selected.includes(item) && (
                      <Check className={`w-3.5 h-3.5 xs:w-4 xs:h-4 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
                    )}
                  </button>
                ))
              ) : (
                query.trim() && !selected.includes(query.trim()) && (
                  <button
                    type="button"
                    onClick={addCustom}
                    className={`w-full px-3 xs:px-4 py-2 xs:py-2.5 text-left ${textSizes.sm} flex items-center gap-2 transition-colors ${
                      isDark
                        ? 'text-cyan-400 hover:bg-gray-700'
                        : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                    <span>Add "{query.trim()}"</span>
                  </button>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─────────────────── OperatingHoursEditor ───────────────────────────── */

interface OperatingHoursEditorProps {
  isDark: boolean;
  value: OperatingHourEntry[];
  disabled?: boolean;
  onChange: (next: OperatingHourEntry[]) => void;
}

export const OperatingHoursEditor: React.FC<OperatingHoursEditorProps> = ({
  isDark, value, disabled, onChange,
}) => {
  const update = (day: DayOfWeek, patch: Partial<OperatingHourEntry>) => {
    onChange(value.map((e) => (e.day === day ? { ...e, ...patch } : e)));
  };

  const copyMondayToAll = () => {
    const mon = value.find((e) => e.day === 'monday');
    if (!mon) return;
    onChange(value.map((e) => ({ ...e, open: mon.open, close: mon.close, is_closed: mon.is_closed })));
  };

  if (!disabled) {
    return (
      <div className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <span className={`${textSizes.label} font-semibold uppercase tracking-wider ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Operating Days & Hours
          </span>
          <button
            type="button"
            onClick={copyMondayToAll}
            className={`${textSizes.xs} px-2 xs:px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${
              isDark
                ? 'border-cyan-700 text-cyan-400 hover:bg-cyan-900/30'
                : 'border-blue-300 text-blue-700 hover:bg-blue-50'
            }`}
          >
            Copy Monday to all
          </button>
        </div>

        <div className="space-y-2">
          {DAYS_OF_WEEK.map((day) => {
            const entry = value.find((e) => e.day === day) ?? {
              day, open: '08:00', close: '17:00', is_closed: false,
            };
            return (
              <div
                key={day}
                className={`flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3 p-2 xs:p-3 rounded-lg ${
                  isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                }`}
              >
                {/* Day and toggle - stacked on mobile, row on larger */}
                <div className="flex items-center justify-between xs:w-28 sm:w-32 xs:justify-start gap-2">
                  <div className={`w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded flex items-center justify-center ${textSizes.xs} xs:text-xs font-bold shrink-0 ${
                    isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {DAY_ABBR[day]}
                  </div>
                  
                  <label className="flex items-center gap-1.5 xs:gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!entry.is_closed}
                      onChange={(e) => update(day, { is_closed: !e.target.checked })}
                      className="w-3.5 h-3.5 xs:w-4 xs:h-4 rounded cursor-pointer accent-blue-600"
                    />
                    <span className={`${textSizes.xs} font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Open
                    </span>
                  </label>
                </div>

                {/* Time selects - full width on mobile */}
                {!entry.is_closed ? (
                  <div className="flex-1 flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
                    <div className="flex-1 flex items-center gap-1 xs:gap-2">
                      <select
                        value={entry.open}
                        onChange={(e) => update(day, { open: e.target.value })}
                        className={`flex-1 ${textSizes.xs} xs:text-xs sm:text-sm py-1.5 xs:py-2 px-2 xs:px-3 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-cyan-500/30' 
                            : 'bg-white border-gray-200 text-gray-900 focus:ring-blue-500/30'
                        }`}
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{formatTime12h(t)}</option>
                        ))}
                      </select>
                      <span className={`${textSizes.xs} xs:text-xs sm:text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>–</span>
                      <select
                        value={entry.close}
                        onChange={(e) => update(day, { close: e.target.value })}
                        className={`flex-1 ${textSizes.xs} xs:text-xs sm:text-sm py-1.5 xs:py-2 px-2 xs:px-3 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white focus:ring-cyan-500/30' 
                            : 'bg-white border-gray-200 text-gray-900 focus:ring-blue-500/30'
                        }`}
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{formatTime12h(t)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex justify-end">
                    <span className={`${textSizes.xs} xs:text-xs sm:text-sm font-medium px-2 xs:px-3 py-1.5 xs:py-2 rounded-lg ${
                      isDark 
                        ? 'bg-red-900/30 text-red-300' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      Closed all day
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── view mode ── */
  return (
    <div className="w-full">
      <span className={`block ${textSizes.label} font-semibold uppercase tracking-wider mb-2 xs:mb-3 ${
        isDark ? 'text-gray-400' : 'text-gray-500'
      }`}>
        Operating Hours
      </span>
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 xs:gap-3">
        {DAYS_OF_WEEK.map((day) => {
          const entry = value.find((e) => e.day === day);
          return (
            <div key={day} className="flex items-center gap-2 xs:gap-3">
              <span className={`w-8 xs:w-9 sm:w-10 ${textSizes.xs} xs:text-xs font-bold ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {DAY_ABBR[day]}
              </span>
              {entry && !entry.is_closed ? (
                <span className={`${textSizes.xs} xs:text-xs sm:text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {formatTime12h(entry.open)} – {formatTime12h(entry.close)}
                </span>
              ) : (
                <span className={`${textSizes.xs} xs:text-xs sm:text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>Closed</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─────────────────── RegulatoryIdentifierEditor ─────────────────────── */

interface RegIdentifierEditorProps {
  isDark: boolean;
  value: RegulatoryIdentifier[];
  disabled?: boolean;
  onChange: (next: RegulatoryIdentifier[]) => void;
}

export const RegulatoryIdentifierEditor: React.FC<RegIdentifierEditorProps> = ({
  isDark, value, disabled, onChange,
}) => {
  const add = () => onChange([...value, { type: '', value: '' }]);
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const patch = (i: number, key: keyof RegulatoryIdentifier, v: string) =>
    onChange(value.map((item, idx) => (idx === i ? { ...item, [key]: v } : item)));

  if (disabled) {
    if (value.length === 0) return null;
    return (
      <div className="space-y-1.5 xs:space-y-2">
        {value.map((item, i) => (
          <div key={i} className="flex flex-col xs:flex-row gap-1 xs:gap-2">
            <span className={`${textSizes.xs} xs:text-xs sm:text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {item.type}:
            </span>
            <span className={`${textSizes.xs} xs:text-xs sm:text-sm font-mono break-all ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2 xs:space-y-3">
      {value.map((item, i) => (
        <div key={i} className="flex flex-col xs:flex-row gap-2">
          <input
            className={`${inputBase(isDark)} flex-1 ${textSizes.sm}`}
            placeholder="Type (e.g. NPI)"
            value={item.type}
            onChange={(e) => patch(i, 'type', e.target.value)}
          />
          <input
            className={`${inputBase(isDark)} flex-1 ${textSizes.sm}`}
            placeholder="Value / ID"
            value={item.value}
            onChange={(e) => patch(i, 'value', e.target.value)}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className={`p-2 xs:p-2.5 sm:p-2 rounded-lg border transition-colors ${
              isDark 
                ? 'border-gray-700 text-red-400 hover:bg-red-900/30' 
                : 'border-gray-300 text-red-600 hover:bg-red-50'
            }`}
            aria-label="Remove identifier"
          >
            <Trash2 className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className={`flex items-center justify-center xs:justify-start gap-2 w-full xs:w-auto ${textSizes.sm} font-medium px-3 xs:px-4 py-2 xs:py-2.5 rounded-lg border border-dashed transition-colors ${
          isDark 
            ? 'border-gray-700 text-gray-400 hover:border-cyan-600 hover:text-cyan-400' 
            : 'border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600'
        }`}
      >
        <Plus className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
        <span>Add Identifier</span>
      </button>
    </div>
  );
};

/* ─────────────────── ToggleRow ─────────────────────────────────────── */

export const ToggleRow: React.FC<{
  isDark: boolean;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}> = ({ isDark, label, checked, disabled, onChange, description }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 xs:gap-3 py-2 xs:py-2.5 sm:py-3">
    <div className="flex-1">
      <span className={`${textSizes.sm} font-medium block ${
        isDark ? 'text-gray-200' : 'text-gray-800'
      }`}>
        {label}
      </span>
      {description && (
        <p className={`${textSizes.xs} mt-0.5 xs:mt-1 ${
          isDark ? 'text-gray-500' : 'text-gray-500'
        }`}>
          {description}
        </p>
      )}
    </div>
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 xs:h-5 xs:w-9 sm:h-6 sm:w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${
        checked
          ? isDark ? 'bg-cyan-500' : 'bg-blue-600'
          : isDark ? 'bg-gray-700' : 'bg-gray-300'
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`inline-block h-4 w-4 xs:h-4 xs:w-4 sm:h-5 sm:w-5 my-0.5 rounded-full bg-white shadow transform transition-transform ${
          checked ? 'translate-x-4 xs:translate-x-4 sm:translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  </div>
);

/* ─────────────────── SectionDivider ────────────────────────────────── */

export const SectionDivider: React.FC<{
  isDark: boolean;
  label: string;
  icon: React.ReactNode;
}> = ({ isDark, label, icon }) => (
  <div className={`flex items-center gap-2 pt-4 xs:pt-5 sm:pt-6 pb-1 xs:pb-1.5 sm:pb-2 border-t ${
    isDark ? 'border-gray-800' : 'border-gray-200'
  }`}>
    <span className={`${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
      {icon}
    </span>
    <span className={`${textSizes.title} font-semibold uppercase tracking-wider ${
      isDark ? 'text-gray-400' : 'text-gray-600'
    }`}>
      {label}
    </span>
  </div>
);

/* ─────────────────── StatusBadge ────────────────────────────────────── */

const STATUS_COLORS: Record<string, string> = {
  fully_operational: 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
  limited_services: 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800',
  emergency_only: 'bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800',
  temporarily_closed: 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800',
  permanently_closed: 'bg-gray-200 text-gray-800 border border-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600',
  under_construction: 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
};

export const StatusBadge: React.FC<{ status: string; label: string }> = ({ status, label }) => (
  <span className={`inline-flex items-center ${textSizes.badge} font-semibold px-2 xs:px-2.5 py-1 xs:py-1.5 rounded-full ${
    STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
  }`}>
    <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 xs:mr-2" />
    {label}
  </span>
);