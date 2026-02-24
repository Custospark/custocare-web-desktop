import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, Search, CheckCircle2, ChevronDown } from 'lucide-react';
import { FormSelect } from './FormElements';
import { 
  OPERATIONAL_STATUS_OPTIONS, 
  OPERATIONAL_STATUS_LABELS,
  HEALTHCARE_SERVICES,
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

// Day abbreviations
const DAY_ABBREVIATIONS: Record<string, string> = {
  monday: 'MON',
  tuesday: 'TUE',
  wednesday: 'WED',
  thursday: 'THU',
  friday: 'FRI',
  saturday: 'SAT',
  sunday: 'SUN'
};

// Generate time options in 30-minute increments
const generateTimeOptions = () => {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (const minute of ['00', '30']) {
      const hourStr = hour.toString().padStart(2, '0');
      times.push(`${hourStr}:${minute}`);
    }
  }
  return times;
};

const TIME_OPTIONS = generateTimeOptions();

// Helper to format time for display (12-hour format)
const formatTimeForDisplay = (time: string): string => {
  const [hour, minute] = time.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
};

export const Step3Services: React.FC<Step3ServicesProps> = ({
  formData,
  updateField,
  toggleService,
  updateOperatingHours,
  applyToAllDays,
  theme
}) => {
  const [serviceSearch, setServiceSearch] = useState('');
  const [showAllServices, setShowAllServices] = useState(false);

  const filteredServices = useMemo(() => {
    return HEALTHCARE_SERVICES.filter(service => 
      service.toLowerCase().includes(serviceSearch.toLowerCase())
    );
  }, [serviceSearch]);

  // Show only selected + first 6 initially, or all if search active/show all toggled
  const displayedServices = useMemo(() => {
    if (serviceSearch || showAllServices) {
      return filteredServices;
    }
    
    // Show selected services first, then up to 6 total
    const selected = filteredServices.filter(s => formData.available_services.includes(s));
    const unselected = filteredServices.filter(s => !formData.available_services.includes(s));
    
    return [...selected, ...unselected].slice(0, 6);
  }, [filteredServices, formData.available_services, serviceSearch, showAllServices]);

  const hasMoreServices = filteredServices.length > 6 && !serviceSearch && !showAllServices;

  // Days for operating hours
  const days = Object.entries(formData.operating_hours);

  return (
    <motion.div 
      key="step-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
      {/* Two-Column Layout for Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Status & Services */}
        <div className="space-y-4">
          {/* Operational Status - Improved Dark Mode Contrast */}
          <div className={cn(
            "p-4 rounded-xl border-2",
            theme === 'dark' 
              ? "bg-slate-900 border-slate-600" 
              : "bg-white border-slate-200"
          )}>
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
          <div className={cn(
            "p-4 rounded-xl border-2",
            theme === 'dark' 
              ? "bg-slate-900 border-slate-600" 
              : "bg-white border-slate-200"
          )}>
            <div className="flex items-center justify-between mb-3">
              <label className={cn(
                "block text-sm font-semibold",
                theme === 'dark' ? "text-white" : "text-slate-900"
              )}>
                Select Services available <span className="text-red-500">*</span>
              </label>
              <span className={cn(
                "text-xs font-medium px-2 py-1 rounded-full cursor-default",
                formData.available_services.length > 0
                  ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                  : theme === 'dark' 
                    ? "bg-slate-700 text-slate-300" 
                    : "bg-slate-100 text-slate-600"
              )}>
                {formData.available_services.length}
              </span>
            </div>
            
            {/* Search */}
            <div className="relative mb-3">
              <Search className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5",
                theme === 'dark' ? "text-slate-400" : "text-slate-500"
              )} />
              <input
                type="text"
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="Search services..."
                className={cn(
                  "w-full px-3 py-2 pl-9 rounded-lg border-2 transition-all text-xs cursor-text",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                  theme === 'dark'
                    ? "bg-slate-800 text-white placeholder-slate-400 border-slate-600 focus:border-blue-500"
                    : "bg-white text-slate-900 placeholder-slate-400 border-slate-200 focus:border-blue-400"
                )}
              />
            </div>
            
            {/* Services Grid - Scrollable */}
            <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5">
              {displayedServices.map(service => {
                const isSelected = formData.available_services.includes(service);
                
                return (
                  <motion.button
                    key={service}
                    type="button"
                    onClick={() => toggleService(service)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all text-left text-xs",
                      "cursor-pointer",
                      isSelected
                        ? theme === 'dark'
                          ? "border-blue-500 bg-blue-900/60"
                          : "border-blue-500 bg-blue-50"
                        : theme === 'dark'
                        ? "border-slate-600 hover:border-blue-500 bg-slate-800 hover:bg-slate-700"
                        : "border-slate-200 hover:border-blue-400/50 bg-white hover:bg-slate-50"
                    )}
                  >
                    <span className={cn(
                      "font-medium truncate pr-2 cursor-pointer",
                      isSelected
                        ? theme === 'dark'
                          ? "text-blue-200"
                          : "text-blue-600"
                        : theme === 'dark' 
                          ? "text-slate-200" 
                          : "text-slate-700"
                    )}>
                      {service}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className={cn(
                        "w-3.5 h-3.5 shrink-0",
                        theme === 'dark' ? "text-blue-200" : "text-blue-600"
                      )} />
                    )}
                  </motion.button>
                );
              })}

              {/* Show More Button */}
              {hasMoreServices && (
                <button
                  onClick={() => setShowAllServices(true)}
                  className={cn(
                    "w-full text-center text-xs py-2 rounded-lg border border-dashed transition-all cursor-pointer",
                    theme === 'dark'
                      ? "border-slate-600 text-slate-300 hover:border-blue-500 hover:text-blue-300"
                      : "border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600"
                  )}
                >
                  +{filteredServices.length - 6} more
                </button>
              )}

              {showAllServices && filteredServices.length > 6 && (
                <button
                  onClick={() => setShowAllServices(false)}
                  className={cn(
                    "w-full text-center text-xs py-2 rounded-lg border border-dashed transition-all cursor-pointer",
                    theme === 'dark'
                      ? "border-slate-600 text-slate-300 hover:border-blue-500 hover:text-blue-300"
                      : "border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600"
                  )}
                >
                  Show less
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Operating Hours - Full Height */}
        <div className={cn(
          "p-4 rounded-xl border-2 h-full flex flex-col",
          theme === 'dark' 
            ? "bg-slate-900 border-slate-600" 
            : "bg-white border-slate-200"
        )}>
          <div className="flex items-center justify-between mb-3">
            <h4 className={cn(
              "text-sm font-bold flex items-center gap-1.5",
              theme === 'dark' ? "text-white" : "text-slate-900"
            )}>
              <Clock className={cn(
                "w-4 h-4",
                theme === 'dark' ? "text-blue-400" : "text-blue-600"
              )} />
              Operational Days & Hours
            </h4>
            <button
              type="button"
              onClick={applyToAllDays}
              className={cn(
                "text-[10px] font-medium px-2 py-1 rounded transition-all border cursor-pointer whitespace-nowrap",
                theme === 'dark'
                  ? "border-blue-500 text-blue-300 hover:bg-blue-900/40"
                  : "border-blue-400 text-blue-600 hover:bg-blue-50"
              )}
            >
              Copy Monday
            </button>
          </div>

          {/* Scrollable Days Container - Takes remaining space */}
          <div className="flex-1 max-h-[400px] overflow-y-auto pr-1 space-y-2">
            {days.map(([day, hours]) => (
              <div 
                key={day}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg transition-all",
                  theme === 'dark'
                    ? "bg-slate-800 hover:bg-slate-700"
                    : "bg-slate-50 hover:bg-slate-100"
                )}
              >
                {/* Day Abbreviation */}
                <div className="w-10 flex-shrink-0">
                  <div className={cn(
                    "w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs cursor-default",
                    theme === 'dark'
                      ? "bg-slate-700 text-slate-200"
                      : "bg-slate-200 text-slate-700"
                  )}>
                    {DAY_ABBREVIATIONS[day]}
                  </div>
                </div>

                {/* Hours Controls - Takes remaining space */}
                <div className="flex-1 flex items-center justify-end gap-2">
                  <label className="flex items-center gap-1 cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={!hours.is_closed}
                      onChange={(e) => updateOperatingHours(day, 'is_closed', !e.target.checked)}
                      className={cn(
                        "w-3.5 h-3.5 rounded cursor-pointer",
                        theme === 'dark'
                          ? "border-slate-500 bg-slate-700 checked:bg-blue-500"
                          : "border-slate-300 bg-white checked:bg-blue-600"
                      )}
                    />
                    <span className={cn(
                      "text-xs font-medium cursor-pointer",
                      theme === 'dark' ? "text-slate-200" : "text-slate-700"
                    )}>
                      Open
                    </span>
                  </label>

                  {!hours.is_closed ? (
                    <div className="flex items-center gap-1">
                      {/* Open Time Select */}
                      <div className="relative">
                        <select
                          value={hours.open}
                          onChange={(e) => updateOperatingHours(day, 'open', e.target.value)}
                          className={cn(
                            "appearance-none w-24 px-2 py-1.5 pr-6 rounded border text-xs font-medium cursor-pointer",
                            "focus:outline-none focus:ring-1 focus:ring-blue-500",
                            theme === 'dark'
                              ? "bg-slate-700 border-slate-600 text-white"
                              : "bg-white border-slate-200 text-slate-900"
                          )}
                        >
                          {TIME_OPTIONS.map(time => (
                            <option key={`open-${day}-${time}`} value={time} className="cursor-pointer">
                              {formatTimeForDisplay(time)}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className={cn(
                          "absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none",
                          theme === 'dark' ? "text-slate-400" : "text-slate-500"
                        )} />
                      </div>

                      <span className={cn(
                        "text-xs cursor-default",
                        theme === 'dark' ? "text-slate-400" : "text-slate-500"
                      )}>
                        to
                      </span>

                      {/* Close Time Select */}
                      <div className="relative">
                        <select
                          value={hours.close}
                          onChange={(e) => updateOperatingHours(day, 'close', e.target.value)}
                          className={cn(
                            "appearance-none w-24 px-2 py-1.5 pr-6 rounded border text-xs font-medium cursor-pointer",
                            "focus:outline-none focus:ring-1 focus:ring-blue-500",
                            theme === 'dark'
                              ? "bg-slate-700 border-slate-600 text-white"
                              : "bg-white border-slate-200 text-slate-900"
                          )}
                        >
                          {TIME_OPTIONS.map(time => (
                            <option key={`close-${day}-${time}`} value={time} className="cursor-pointer">
                              {formatTimeForDisplay(time)}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className={cn(
                          "absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none",
                          theme === 'dark' ? "text-slate-400" : "text-slate-500"
                        )} />
                      </div>
                    </div>
                  ) : (
                    <span className={cn(
                      "text-xs font-medium px-3 py-1.5 rounded w-24 text-center flex-shrink-0 cursor-default",
                      theme === 'dark'
                        ? "bg-red-900/40 text-red-300"
                        : "bg-red-100 text-red-600"
                    )}>
                      Closed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};