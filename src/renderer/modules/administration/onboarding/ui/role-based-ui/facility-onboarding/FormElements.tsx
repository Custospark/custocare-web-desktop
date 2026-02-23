import React from 'react';
import { motion } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
interface FormInputProps {
  field: string;
  label: string;
  placeholder: string;
  icon?: React.ReactNode;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  theme: string;
  showError?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  placeholder,
  icon,
  type = 'text',
  required = true,
  value,
  onChange,
  theme,
  showError = false
}) => {
  const isEmpty = !value;

  return (
    <div className="space-y-1.5">
      <label className={cn(
        "block text-sm font-semibold",
        theme === 'dark' ? "text-slate-200" : "text-slate-800"
      )}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative group">
        {icon && (
          <div className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 transition-colors",
            !isEmpty ? "text-blue-500" : "text-slate-400 group-focus-within:text-blue-500"
          )}>
            {icon}
          </div>
        )}
        
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full px-3 py-2.5 rounded-lg border-2 transition-all duration-200 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/20",
            icon ? "pl-10" : "",
            theme === 'dark'
              ? "bg-slate-800/50 border-slate-700 text-white placeholder-slate-500"
              : "bg-white border-slate-200 text-slate-900 placeholder-slate-400",
            !isEmpty && "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10",
            showError && "border-red-500"
          )}
        />
        
        {!isEmpty && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          </motion.div>
        )}

        {showError && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <AlertCircle className="w-4 h-4 text-red-500" />
          </motion.div>
        )}
      </div>

      {showError && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="text-[10px] text-red-500 flex items-center gap-1"
        >
          <AlertCircle className="w-3 h-3" />
          Required field
        </motion.p>
      )}
    </div>
  );
};

interface FormSelectProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: Array<{ value: string; label: string }>;
  icon?: React.ReactNode;
  required?: boolean;
  theme: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  value,
  onChange,
  label,
  options,
  icon,
  required = true,
  theme
}) => {
  const isEmpty = !value;

  return (
    <div className="space-y-1.5">
      <label className={cn(
        "block text-sm font-semibold",
        theme === 'dark' ? "text-slate-200" : "text-slate-800"
      )}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative group">
        {icon && (
          <div className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 transition-colors z-10",
            !isEmpty ? "text-blue-500" : "text-slate-400 group-focus-within:text-blue-500"
          )}>
            {icon}
          </div>
        )}
        
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full px-3 py-2.5 rounded-lg border-2 appearance-none transition-all duration-200 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer",
            icon ? "pl-10" : "",
            theme === 'dark'
              ? "bg-slate-800/50 border-slate-700 text-white"
              : "bg-white border-slate-200 text-slate-900",
            !isEmpty && "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10"
          )}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        
        {!isEmpty && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-10 top-1/2 -translate-y-1/2"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          </motion.div>
        )}

        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};