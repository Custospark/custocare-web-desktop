import React from 'react';
import { XCircle } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
export const FieldError: React.FC<{ msg: string }> = ({ msg }) => (
  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
    <XCircle className="w-3 h-3 shrink-0" />
    {msg}
  </p>
);

export const Label: React.FC<{ isDark: boolean; children: React.ReactNode }> = ({ isDark, children }) => (
  <label className={cn(
    "block text-xs font-semibold uppercase tracking-wider mb-1.5",
    isDark ? 'text-gray-400' : 'text-gray-500'
  )}>
    {children}
  </label>
);

export const inputBase = (isDark: boolean) =>
  cn(
    "w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors focus:ring-2",
    isDark
      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20'
  );

export const textareaBase = (isDark: boolean) =>
  cn(
    inputBase(isDark),
    "font-mono text-xs leading-5 min-h-[100px] resize-y"
  );

export const divider = (isDark: boolean) =>
  cn(
    "border-t",
    isDark ? 'border-gray-800' : 'border-gray-100'
  );