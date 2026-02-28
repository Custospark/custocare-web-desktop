/**
 * ============================================================================
 * PROFILE UI HELPERS
 * ============================================================================
 *
 * Reusable UI components shared across profile sections.
 */

import React from 'react';
import { XCircle } from 'lucide-react';

export const FieldGroup: React.FC<{
  label: string;
  children: React.ReactNode;
  isDark: boolean;
  fullWidth?: boolean;
}> = ({ label, children, isDark, fullWidth = false }) => (
  <div className={fullWidth ? 'col-span-2' : ''}>
    <label
      className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
        isDark ? 'text-gray-400' : 'text-gray-500'
      }`}
    >
      {label}
    </label>
    {children}
  </div>
);

export const ViewRow: React.FC<{
  label: string;
  value: string | null | undefined;
  isDark: boolean;
  icon?: React.ReactNode;
}> = ({ label, value, isDark, icon }) => (
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
      <p className={`text-sm font-medium break-words ${
        value
          ? isDark ? 'text-gray-100' : 'text-gray-900'
          : isDark ? 'text-gray-600' : 'text-gray-400'
      }`}>
        {value || '—'}
      </p>
    </div>
  </div>
);

export const SectionHeading: React.FC<{
  icon: React.ReactNode;
  title: string;
  isDark: boolean;
}> = ({ icon, title, isDark }) => (
  <div className="flex items-center gap-2">
    <span
      className={`p-1.5 rounded-lg ${
        isDark ? 'bg-cyan-500/15 text-cyan-400' : 'bg-blue-50 text-blue-600'
      }`}
    >
      {icon}
    </span>
    <h3 className="text-sm font-semibold uppercase tracking-wider">{title}</h3>
  </div>
);

export const FieldError: React.FC<{ msg: string }> = ({ msg }) => (
  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
    <XCircle className="w-3 h-3 shrink-0" />
    {msg}
  </p>
);