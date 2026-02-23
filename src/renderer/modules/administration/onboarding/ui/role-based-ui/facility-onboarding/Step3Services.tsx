import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, Search, CheckCircle2, Shield } from 'lucide-react';
import { FormSelect } from './FormElements';
import { 
  OPERATIONAL_STATUS_OPTIONS, 
  OPERATIONAL_STATUS_LABELS,
  HEALTHCARE_SERVICES,
  SECURITY_BADGES,
  FacilityFormData 
} from './types';
import { cn } from '../../../../../../shared/utils/classNameUtils';

interface Step3ServicesProps {
  formData: FacilityFormData;
  updateField: (field: keyof FacilityFormData, value: string) => void;
  toggleService: (service: string) => void;
  updateOperatingHours: (day: string, field: 'open' | 'close' | 'is_closed', value: string | boolean) => void;
  applyToAllDays: () => void;
  theme: string;
}

export const Step3Services: React.FC<Step3ServicesProps> = ({
  formData,
  updateField,
  toggleService,
  updateOperatingHours,
  applyToAllDays,
  theme
}) => {
  const [serviceSearch, setServiceSearch] = useState('');

  const filteredServices = useMemo(() => {
    return HEALTHCARE_SERVICES.filter(service => 
      service.toLowerCase().includes(serviceSearch.toLowerCase())
    );
  }, [serviceSearch]);

  return (
    <motion.div 
      key="step-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-5"
    >
      {/* Compact Header */}
      <div className="text-center mb-4">
        <p className={cn(
          "text-sm",
          theme === 'dark' ? "text-slate-400" : "text-slate-600"
        )}>
          What services do you provide?
        </p>
      </div>

      {/* Operational Status */}
      <div>
        <FormSelect
          value={formData.operational_status}
          onChange={(value) => updateField('operational_status', value)}
          label="Operational Status"
          options={OPERATIONAL_STATUS_OPTIONS.map(status => ({
            value: status,
            label: OPERATIONAL_STATUS_LABELS[status]
          }))}
          icon={<Zap className="w-4 h-4" />}
          theme={theme}
        />
      </div>

      {/* Available Services */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className={cn(
            "block text-sm font-semibold",
            theme === 'dark' ? "text-slate-200" : "text-slate-800"
          )}>
            Services <span className="text-red-500">*</span>
          </label>
          <span className={cn(
            "text-[10px] font-medium px-2 py-1 rounded-full",
            formData.available_services.length > 0
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
          )}>
            {formData.available_services.length} selected
          </span>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={serviceSearch}
            onChange={(e) => setServiceSearch(e.target.value)}
            placeholder="Search services..."
            className={cn(
              "w-full px-3 py-2.5 pl-10 rounded-lg border-2 transition-all text-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/20",
              theme === 'dark'
                ? "bg-slate-800/50 text-white placeholder-slate-500 border-slate-700"
                : "bg-white text-slate-900 placeholder-slate-400 border-slate-200"
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
          {filteredServices.map(service => {
            const isSelected = formData.available_services.includes(service);
            
            return (
              <motion.button
                key={service}
                type="button"
                onClick={() => toggleService(service)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg border-2 transition-all text-left",
                  isSelected
                    ? "border-blue-500 bg-linear-to-br from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20"
                    : theme === 'dark'
                    ? "border-slate-700 hover:border-blue-500/50 bg-slate-800/30"
                    : "border-slate-200 hover:border-blue-400/50 bg-white hover:bg-slate-50"
                )}
              >
                <span className={cn(
                  "text-sm font-medium",
                  isSelected
                    ? "text-blue-600 dark:text-blue-400"
                    : theme === 'dark' ? "text-white" : "text-slate-900"
                )}>
                  {service}
                </span>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Operating Hours */}
      <div className={cn(
        "p-4 rounded-xl border-2",
        theme === 'dark' 
          ? "bg-slate-800/50 border-slate-700" 
          : "bg-slate-50 border-slate-200"
      )}>
        <div className="flex items-center justify-between mb-4">
          <h4 className={cn(
            "text-sm font-bold flex items-center gap-2",
            theme === 'dark' ? "text-white" : "text-slate-900"
          )}>
            <Clock className="w-4 h-4 text-blue-500" />
            Operating Hours
          </h4>
          <button
            type="button"
            onClick={applyToAllDays}
            className={cn(
              "text-[10px] font-medium px-3 py-1.5 rounded-lg transition-all",
              "border-2 hover:scale-105",
              theme === 'dark'
                ? "border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                : "border-blue-400 text-blue-600 hover:bg-blue-50"
            )}
          >
            Copy Mon to All
          </button>
        </div>

        <div className="space-y-2">
          {Object.entries(formData.operating_hours).map(([day, hours]) => (
            <div 
              key={day}
              className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg transition-all",
                theme === 'dark'
                  ? "bg-slate-900/50 hover:bg-slate-900/70"
                  : "bg-white hover:bg-slate-50"
              )}
            >
              <div className="flex items-center gap-2 min-w-25">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px]",
                  theme === 'dark'
                    ? "bg-slate-700 text-slate-300"
                    : "bg-slate-100 text-slate-700"
                )}>
                  {day.substring(0, 3).toUpperCase()}
                </div>
                <span className={cn(
                  "text-sm font-semibold capitalize",
                  theme === 'dark' ? "text-white" : "text-slate-900"
                )}>
                  {day}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!hours.is_closed}
                    onChange={(e) => updateOperatingHours(day, 'is_closed', !e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className={cn(
                    "text-sm font-medium",
                    theme === 'dark' ? "text-slate-300" : "text-slate-700"
                  )}>
                    Open
                  </span>
                </label>

                {!hours.is_closed && (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="time"
                      value={hours.open}
                      onChange={(e) => updateOperatingHours(day, 'open', e.target.value)}
                      className={cn(
                        "px-2 py-1 rounded-md border-2 text-sm font-medium transition-all",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500",
                        theme === 'dark'
                          ? "bg-slate-700 border-slate-600 text-white"
                          : "bg-white border-slate-200 text-slate-900"
                      )}
                    />
                    <span className="text-slate-400 text-sm">to</span>
                    <input
                      type="time"
                      value={hours.close}
                      onChange={(e) => updateOperatingHours(day, 'close', e.target.value)}
                      className={cn(
                        "px-2 py-1 rounded-md border-2 text-sm font-medium transition-all",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500",
                        theme === 'dark'
                          ? "bg-slate-700 border-slate-600 text-white"
                          : "bg-white border-slate-200 text-slate-900"
                      )}
                    />
                  </div>
                )}

                {hours.is_closed && (
                  <span className="text-sm text-red-500 font-medium">Closed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compact Security Notice */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "p-3 rounded-xl border-2",
          theme === 'dark' 
            ? "bg-blue-900/20 border-blue-700/50" 
            : "bg-blue-50 border-blue-200"
        )}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-600 to-emerald-600 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h5 className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-1">
              Security & Compliance
            </h5>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 mb-2">
              Your data is protected with enterprise-grade security.
            </p>
            <div className="flex flex-wrap gap-2">
              {SECURITY_BADGES.map((item, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-md",
                    theme === 'dark'
                      ? "bg-slate-800/50"
                      : "bg-white/70"
                  )}
                >
                  <item.icon className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};