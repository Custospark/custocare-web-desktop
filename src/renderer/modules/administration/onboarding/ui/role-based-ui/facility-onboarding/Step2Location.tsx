import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, Mail, Globe, CheckCircle2, ChevronDown, X, Search, AlertCircle } from 'lucide-react';
import { FormInput } from './FormElements';
import { countryCodes } from '../../auth/countryCodes';
import { FacilityFormData } from './types';
import { cn } from '../../../../../../shared/utils/classNameUtils';

interface Step2LocationProps {
  formData: FacilityFormData;
  updateField: (field: keyof FacilityFormData, value: string) => void;
  theme: string;
}

export const Step2Location: React.FC<Step2LocationProps> = ({
  formData,
  updateField,
  theme
}) => {
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  // Phone country code state
  const [phoneCountryCode, setPhoneCountryCode] = useState('+256'); // Default to Uganda
  const [filterPhoneCountry, setFilterPhoneCountry] = useState('');
  const [isPhoneCountryDropdownOpen, setIsPhoneCountryDropdownOpen] = useState(false);
  
  // Validation states
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const countryInputRef = useRef<HTMLDivElement>(null);
  const phoneCountryRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryInputRef.current && !countryInputRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
        setIsFocused(false);
      }
      if (phoneCountryRef.current && !phoneCountryRef.current.contains(event.target as Node)) {
        setIsPhoneCountryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter countries for main country selector
  const filteredCountries = useMemo(() => {
    const searchTerm = countrySearch.toLowerCase().trim();
    
    if (!searchTerm) {
      return countryCodes.slice(0, 6);
    }

    return countryCodes
      .filter(country => 
        country.name.toLowerCase().includes(searchTerm) ||
        country.code.toLowerCase().includes(searchTerm)
      )
      .sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aCode = a.code.toLowerCase();
        const bCode = b.code.toLowerCase();
        
        const aExact = aName === searchTerm || aCode === searchTerm;
        const bExact = bName === searchTerm || bCode === searchTerm;
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        const aStarts = aName.startsWith(searchTerm) || aCode.startsWith(searchTerm);
        const bStarts = bName.startsWith(searchTerm) || bCode.startsWith(searchTerm);
        
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        
        return 0;
      })
      .slice(0, 8);
  }, [countrySearch]);

  // Filter countries for phone country selector
  const filteredPhoneCountries = useMemo(() => {
    if (!filterPhoneCountry) return countryCodes;
    const search = filterPhoneCountry.toLowerCase();
    return countryCodes.filter(country => 
      country.name.toLowerCase().includes(search) ||
      country.code.includes(search) ||
      country.dial_code.includes(search)
    );
  }, [filterPhoneCountry]);

  // Selected country objects
  const selectedCountry = useMemo(() => {
    return countryCodes.find(country => country.code === formData.country_code);
  }, [formData.country_code]);

  const selectedPhoneCountry = useMemo(() => {
    return countryCodes.find(c => c.dial_code === phoneCountryCode) || countryCodes.find(c => c.code === 'UG');
  }, [phoneCountryCode]);

  // Phone validation
  const validatePhone = (phone: string) => {
    if (!phone) return { isValid: false, error: 'Phone number is required' };
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 6) return { isValid: false, error: 'Phone number too short' };
    if (digitsOnly.length > 12) return { isValid: false, error: 'Phone number too long' };
    return { isValid: true, error: '' };
  };

  const phoneValidation = validatePhone(formData.main_phone);

  // Handlers
  const handleCountrySelect = (country: typeof countryCodes[0]) => {
    updateField('country_code', country.code);
    setCountrySearch('');
    setShowCountryDropdown(false);
    setIsFocused(false);
  };

  const handleClearCountry = () => {
    updateField('country_code', '');
    setCountrySearch('');
    setShowCountryDropdown(true);
    setIsFocused(true);
  };

  const handlePhoneCountrySelect = (dial_code: string) => {
    setPhoneCountryCode(dial_code);
    setIsPhoneCountryDropdownOpen(false);
    setFilterPhoneCountry('');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d\s\-()]/g, '');
    updateField('main_phone', value);
    if (touched.phone) {
      setTouched(prev => ({ ...prev, phone: false }));
    }
  };

  const handleBlur = (field: string) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Format display value for main country
  const getDisplayValue = () => {
    if (!countrySearch && selectedCountry && !showCountryDropdown && !isFocused) {
      return (
        <>
          <span className="text-lg shrink-0">{selectedCountry.flag}</span>
          <span className={cn(
            "flex-1 text-sm font-medium truncate",
            theme === 'dark' ? "text-white" : "text-slate-900"
          )}>
            {selectedCountry.name}
          </span>
          <span className={cn(
            "text-xs px-2 py-1 rounded-full",
            theme === 'dark' ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"
          )}>
            {selectedCountry.code}
          </span>
        </>
      );
    }
    return null;
  };

  // Input styling function (similar to SignUp)
  const inputClass = (hasError: boolean, isValid: boolean) => {
    return cn(
      'w-full py-2.5 px-3 rounded-lg border-2 transition-all duration-150 text-sm',
      'focus:outline-none focus:ring-2',
      theme === 'dark'
        ? 'bg-slate-800/50 text-white placeholder-slate-500'
        : 'bg-white text-slate-900 placeholder-slate-400',
      hasError
        ? theme === 'dark' ? 'border-red-500/60 focus:ring-red-500/30' : 'border-red-400 focus:ring-red-200'
        : isValid && formData.main_phone
          ? theme === 'dark' ? 'border-emerald-500/60 focus:ring-emerald-500/30' : 'border-emerald-400 focus:ring-emerald-200'
          : theme === 'dark' ? 'border-slate-700 focus:border-blue-500 focus:ring-blue-500/30' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-200'
    );
  };

  return (
    <motion.div 
      key="step-2"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="text-center mb-4">
        <p className={cn(
          "text-sm",
          theme === 'dark' ? "text-slate-400" : "text-slate-600"
        )}>
          Where can patients and staff reach your facility?
        </p>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <FormInput
          field="address_line1"
          label="Street Address"
          placeholder="e.g., Plot 16, Kampala Road"
          icon={<MapPin className="w-4 h-4" />}
          value={formData.address_line1}
          onChange={(value) => updateField('address_line1', value)}
          theme={theme}
          showError={!formData.address_line1}
        />
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FormInput
            field="city"
            label="City"
            placeholder="e.g., Kampala"
            value={formData.city}
            onChange={(value) => updateField('city', value)}
            theme={theme}
          />
          <FormInput
            field="state_province"
            label="District or Province"
            placeholder="e.g., Central"
            value={formData.state_province}
            onChange={(value) => updateField('state_province', value)}
            theme={theme}
          />
          <FormInput
            field="postal_code"
            label="Postal Code"
            placeholder="e.g., 256"
            value={formData.postal_code}
            onChange={(value) => updateField('postal_code', value)}
            theme={theme}
          />
          
          {/* Country Selector */}
          <div className="space-y-1.5" ref={countryInputRef}>
            <label className={cn(
              "block text-sm font-semibold",
              theme === 'dark' ? "text-slate-200" : "text-slate-800"
            )}>
              Country <span className="text-red-500">*</span>
            </label>
            
            <div className="relative">
              {/* Input Field */}
              <div 
                onClick={() => {
                  setShowCountryDropdown(true);
                  setIsFocused(true);
                }}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border-2 transition-all cursor-text",
                  "focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500/20",
                  theme === 'dark'
                    ? "bg-slate-800/50 border-slate-700"
                    : "bg-white border-slate-200",
                  selectedCountry && !showCountryDropdown && !isFocused && "border-emerald-500",
                  showCountryDropdown && "ring-2 ring-blue-500/20"
                )}
              >
                {!showCountryDropdown && !isFocused && getDisplayValue() ? (
                  getDisplayValue()
                ) : (
                  <>
                    <Search className={cn(
                      "w-4 h-4 shrink-0",
                      theme === 'dark' ? "text-slate-500" : "text-slate-400"
                    )} />
                    <input
                      type="text"
                      value={countrySearch}
                      onChange={(e) => {
                        setCountrySearch(e.target.value);
                        setShowCountryDropdown(true);
                      }}
                      onFocus={() => {
                        setShowCountryDropdown(true);
                        setIsFocused(true);
                      }}
                      placeholder="Search for country..."
                      className={cn(
                        "w-full bg-transparent outline-none text-sm",
                        theme === 'dark' 
                          ? "text-white placeholder-slate-500" 
                          : "text-slate-900 placeholder-slate-400"
                      )}
                      autoComplete="off"
                    />
                  </>
                )}
                
                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {selectedCountry && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearCountry();
                      }}
                      className={cn(
                        "p-1 rounded-full transition-colors",
                        theme === 'dark' 
                          ? "hover:bg-slate-700 text-slate-400" 
                          : "hover:bg-slate-200 text-slate-500"
                      )}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <ChevronDown 
                    className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      showCountryDropdown && "rotate-180",
                      theme === 'dark' ? "text-slate-500" : "text-slate-400"
                    )} 
                  />
                </div>
              </div>

              {/* Dropdown */}
              <AnimatePresence>
                {showCountryDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      "absolute z-50 w-full mt-2 rounded-xl border-2 shadow-xl overflow-hidden",
                      theme === 'dark'
                        ? "bg-slate-800 border-slate-700"
                        : "bg-white border-slate-200"
                    )}
                  >
                    {/* Results count */}
                    <div className={cn(
                      "px-3 py-2 border-b",
                      theme === 'dark' ? "border-slate-700" : "border-slate-200"
                    )}>
                      <p className={cn(
                        "text-xs font-medium",
                        theme === 'dark' ? "text-slate-400" : "text-slate-500"
                      )}>
                        {filteredCountries.length} {filteredCountries.length === 1 ? 'country' : 'countries'} found
                      </p>
                    </div>

                    {/* Country list */}
                    <div className="max-h-64 overflow-y-auto">
                      {filteredCountries.length > 0 ? (
                        filteredCountries.map(country => (
                        <button
                        key={country.code}
                        type="button"
                        onClick={() => handleCountrySelect(country)}
                        className={cn(
                          "flex items-center gap-3 w-full px-3 py-3 transition-all duration-200 text-left rounded-lg",
                          theme === 'dark'
                            ? "hover:bg-slate-700/80 focus:bg-slate-700/80"
                            : "hover:bg-slate-100 focus:bg-slate-100",
                          formData.country_code === country.code && (
                            theme === 'dark'
                              ? "bg-blue-900/40 hover:bg-blue-900/50 ring-1 ring-blue-700/50"
                              : "bg-blue-100 hover:bg-blue-200 ring-1 ring-blue-300"
                          )
                        )}
                      >
                        <span className={cn(
                          "text-2xl shrink-0 drop-shadow-sm",
                          theme === 'dark' ? "opacity-90" : "opacity-100"
                        )}>
                          {country.flag}
                        </span>
                        
                        <div className="flex-1 min-w-0">
                          <span className={cn(
                            "text-sm font-medium block truncate",
                            theme === 'dark' 
                              ? formData.country_code === country.code
                                ? "text-blue-100"
                                : "text-slate-100"
                              : formData.country_code === country.code
                                ? "text-blue-900"
                                : "text-slate-900"
                          )}>
                            {country.name}
                          </span>
                          
                          {/* <span className={cn(
                            "text-xs",
                            theme === 'dark'
                              ? formData.country_code === country.code
                                ? "text-blue-300"
                                : "text-slate-400"
                              : formData.country_code === country.code
                                ? "text-blue-700"
                                : "text-slate-500"
                          )}>
                            {country.code}
                          </span> */}
                        </div>
                        
                        {formData.country_code === country.code && (
                          <CheckCircle2 className={cn(
                            "w-5 h-5 shrink-0",
                            theme === 'dark' ? "text-blue-400" : "text-blue-600"
                          )} />
                        )}
                      </button>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <p className={cn(
                            "text-sm",
                            theme === 'dark' ? "text-slate-400" : "text-slate-500"
                          )}>
                            No countries found
                          </p>
                          <button
                            type="button"
                            onClick={() => setCountrySearch('')}
                            className="mt-2 text-sm text-blue-600 hover:underline"
                          >
                            Clear search
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information - Phone with Country Code*/}
      <div className="space-y-4">
        <div>
          <label className={cn(
            "block text-sm font-semibold mb-1.5",
            theme === 'dark' ? "text-slate-200" : "text-slate-800"
          )}>
            Facility Phone Number
          </label>

          <div className="flex gap-2">
            {/* Country Code Selector */}
            <div className="relative shrink-0 w-36" ref={phoneCountryRef}>
              <button
                type="button"
                onClick={() => setIsPhoneCountryDropdownOpen(!isPhoneCountryDropdownOpen)}
                className={cn(
                  'w-full py-2.5 px-3 rounded-lg border-2 text-sm text-left',
                  'focus:outline-none focus:ring-2 transition-all duration-150',
                  'flex items-center justify-between gap-2',
                  theme === 'dark'
                    ? 'bg-slate-800/50 text-white border-slate-700 hover:border-blue-500 focus:ring-blue-500/30'
                    : 'bg-white text-slate-900 border-slate-200 hover:border-blue-500 focus:ring-blue-200'
                )}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span className="text-base">{selectedPhoneCountry?.flag}</span>
                  <span className="font-medium">{selectedPhoneCountry?.dial_code}</span>
                </span>
                <ChevronDown className={cn(
                  "w-4 h-4 flex-shrink-0 transition-transform",
                  isPhoneCountryDropdownOpen && "rotate-180"
                )} />
              </button>

              {/* Phone Country Dropdown */}
              <AnimatePresence>
                {isPhoneCountryDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      'absolute z-50 w-72 mt-1 rounded-lg border-2 shadow-xl',
                      'max-h-64 overflow-hidden flex flex-col',
                      theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                    )}
                  >
                    {/* Search */}
                    <div className="p-2 border-b" style={{ borderColor: theme === 'dark' ? '#334155' : '#e2e8f0' }}>
                      <input
                        type="text"
                        value={filterPhoneCountry}
                        onChange={(e) => setFilterPhoneCountry(e.target.value)}
                        placeholder="Search country..."
                        className={cn(
                          'w-full px-3 py-1.5 text-xs rounded border',
                          'focus:outline-none focus:ring-1',
                          theme === 'dark'
                            ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-blue-500'
                            : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-blue-500'
                        )}
                        autoFocus
                      />
                    </div>

                    {/* Country List */}
                    <div className="overflow-y-auto">
                      {filteredPhoneCountries.length > 0 ? (
                        filteredPhoneCountries.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => handlePhoneCountrySelect(country.dial_code)}
                            className={cn(
                              'w-full px-3 py-2 text-left text-sm',
                              'hover:bg-opacity-50 transition-colors',
                              'flex items-center gap-2',
                              theme === 'dark' ? 'hover:bg-slate-700 text-white' : 'hover:bg-slate-100 text-slate-900',
                              country.dial_code === phoneCountryCode &&
                                (theme === 'dark' ? 'bg-slate-700' : 'bg-blue-50')
                            )}
                          >
                            <span className="text-lg">{country.flag}</span>
                            <span className="flex-1 truncate">{country.name}</span>
                            <span className={cn('font-medium text-xs', theme === 'dark' ? 'text-slate-400' : 'text-slate-600')}>
                              {country.dial_code}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className={cn('px-3 py-4 text-center text-sm', theme === 'dark' ? 'text-slate-500' : 'text-slate-400')}>
                          No countries found
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Phone Input */}
            <div className="relative flex-1">
              <Phone className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
                theme === 'dark' ? "text-slate-500" : "text-slate-400"
              )} />
              <input
                type="tel"
                value={formData.main_phone}
                onChange={handlePhoneChange}
                onBlur={handleBlur('phone')}
                placeholder="e.g., 712 345 678"
                className={cn(
                  inputClass(touched.phone && !phoneValidation.isValid, phoneValidation.isValid),
                  'pl-9'
                )}
              />
              {phoneValidation.isValid && formData.main_phone && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              )}
            </div>
          </div>

          {/* Show full number with country code */}
          {formData.main_phone && (
            <p className={cn('text-xs mt-1.5', theme === 'dark' ? 'text-slate-400' : 'text-slate-600')}>
              {formData.main_phone.length < 3 ? 'Typing...: ' : 'Full number: '}
              <span className="font-mono text-blue-600 dark:text-blue-400">
                {selectedPhoneCountry?.dial_code} {formData.main_phone}
              </span>
            </p>
          )}

          {/* Validation Error */}
          {touched.phone && !phoneValidation.isValid && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {phoneValidation.error}
            </p>
          )}
        </div>

        {/* Email and Website */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            field="email"
            label="Email Address"
            placeholder="e.g., info@facility.co.ug"
            icon={<Mail className="w-4 h-4" />}
            type="email"
            required={false}
            value={formData.email}
            onChange={(value) => updateField('email', value)}
            theme={theme}
          />
          <FormInput
            field="website"
            label="Website (Optional)"
            placeholder="e.g., www.facility.co.ug"
            icon={<Globe className="w-4 h-4" />}
            type="url"
            required={false}
            value={formData.website}
            onChange={(value) => updateField('website', value)}
            theme={theme}
          />
        </div>
      </div>
    </motion.div>
  );
};