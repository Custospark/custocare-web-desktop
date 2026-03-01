import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MapPin, Phone, ChevronDown, X, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { Label, FieldError, inputBase, divider } from './FormUtils';
import { countryCodes } from '../../../../onboarding/ui/auth/countryCodes';
import { cn } from '../../../../../../shared/types/cn';

interface FacilityLocationContactCardProps {
  isDark: boolean;
  editMode: boolean;
  form: any;
  fieldErrors: Record<string, string>;
  onField: <K extends keyof any>(key: K, value: any) => void;
}

export const FacilityLocationContactCard: React.FC<FacilityLocationContactCardProps> = ({
  isDark,
  editMode,
  form,
  fieldErrors,
  onField,
}) => {
  const [countrySearch, setCountrySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const countryInputRef = useRef<HTMLDivElement>(null);

  // Phone country code state
  const [phoneCountryCode, setPhoneCountryCode] = useState('+256');
  const [filterPhoneCountry, setFilterPhoneCountry] = useState('');
  const [isPhoneCountryDropdownOpen, setIsPhoneCountryDropdownOpen] = useState(false);
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
    return countryCodes.find(country => country.code === form.country_code);
  }, [form.country_code]);

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

  const phoneValidation = validatePhone(form.main_phone);

  // Handlers
  const handleCountrySelect = (country: typeof countryCodes[0]) => {
    onField('country_code', country.code);
    setCountrySearch('');
    setShowCountryDropdown(false);
    setIsFocused(false);
  };

  const handleClearCountry = () => {
    onField('country_code', '');
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
    onField('main_phone', value);
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
            isDark ? "text-white" : "text-slate-900"
          )}>
            {selectedCountry.name}
          </span>
          <span className={cn(
            "text-xs px-2 py-1 rounded-full",
            isDark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"
          )}>
            {selectedCountry.code}
          </span>
        </>
      );
    }
    return null;
  };

  // Input styling function
  const phoneInputClass = (hasError: boolean, isValid: boolean) => {
    return cn(
      'w-full py-2.5 px-3 rounded-lg border-2 transition-all duration-150 text-sm',
      'focus:outline-none focus:ring-2',
      isDark
        ? 'bg-slate-800/50 text-white placeholder-slate-500'
        : 'bg-white text-slate-900 placeholder-slate-400',
      hasError
        ? isDark ? 'border-red-500/60 focus:ring-red-500/30' : 'border-red-400 focus:ring-red-200'
        : isValid && form.main_phone
          ? isDark ? 'border-emerald-500/60 focus:ring-emerald-500/30' : 'border-emerald-400 focus:ring-emerald-200'
          : isDark ? 'border-slate-700 focus:border-blue-500 focus:ring-blue-500/30' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-200'
    );
  };

  // Format address for display
  const formatAddress = () => {
    const parts = [
      form.address_line1,
      form.address_line2,
      form.city,
      form.state_province,
      form.postal_code,
      selectedCountry?.name || form.country_code
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : '—';
  };

  return (
    <section className={cn(
      "rounded-xl border p-6",
      isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
    )}>
      <div className="flex items-center gap-2 mb-4">
        <span className={cn(
          "p-1.5 rounded-lg",
          isDark ? 'bg-cyan-500/15 text-cyan-400' : 'bg-blue-50 text-blue-600'
        )}>
          <MapPin className="w-4 h-4" />
        </span>
        <h3 className="text-sm font-semibold uppercase tracking-wider">Location & Contact</h3>
      </div>

      <div className={divider(isDark)} />

      {editMode ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          {/* Address Line 1 */}
          <div className="sm:col-span-2">
            <Label isDark={isDark}>Street Address</Label>
            <input
              className={inputBase(isDark)}
              value={form.address_line1}
              maxLength={200}
              onChange={(e) => onField('address_line1', e.target.value)}
              placeholder="e.g., 123 Healthcare Ave"
            />
            {fieldErrors.address_line1 && <FieldError msg={fieldErrors.address_line1} />}
          </div>

          {/* Address Line 2 */}
          <div className="sm:col-span-2">
            <Label isDark={isDark}>Address Line 2 (Optional)</Label>
            <input
              className={inputBase(isDark)}
              value={form.address_line2}
              maxLength={200}
              onChange={(e) => onField('address_line2', e.target.value)}
              placeholder="e.g., Suite 100"
            />
            {fieldErrors.address_line2 && <FieldError msg={fieldErrors.address_line2} />}
          </div>

          {/* City */}
          <div>
            <Label isDark={isDark}>City</Label>
            <input
              className={inputBase(isDark)}
              value={form.city}
              maxLength={100}
              onChange={(e) => onField('city', e.target.value)}
              placeholder="e.g., Kampala"
            />
            {fieldErrors.city && <FieldError msg={fieldErrors.city} />}
          </div>

          {/* State/Province */}
          <div>
            <Label isDark={isDark}>State / Province</Label>
            <input
              className={inputBase(isDark)}
              value={form.state_province}
              maxLength={100}
              onChange={(e) => onField('state_province', e.target.value)}
              placeholder="e.g., Central"
            />
            {fieldErrors.state_province && <FieldError msg={fieldErrors.state_province} />}
          </div>

          {/* Postal Code */}
          <div>
            <Label isDark={isDark}>Postal Code</Label>
            <input
              className={inputBase(isDark)}
              value={form.postal_code}
              maxLength={20}
              onChange={(e) => onField('postal_code', e.target.value)}
              placeholder="e.g., 256"
            />
            {fieldErrors.postal_code && <FieldError msg={fieldErrors.postal_code} />}
          </div>

          {/* Country Selector */}
          <div className="space-y-1.5" ref={countryInputRef}>
            <Label isDark={isDark}>Country</Label>
            
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
                  isDark
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
                      isDark ? "text-slate-500" : "text-slate-400"
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
                        isDark 
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
                        isDark 
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
                      isDark ? "text-slate-500" : "text-slate-400"
                    )} 
                  />
                </div>
              </div>

              {/* Dropdown */}
              {showCountryDropdown && (
                <div className={cn(
                  "absolute z-50 w-full mt-2 rounded-xl border-2 shadow-xl overflow-hidden",
                  isDark
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200"
                )}>
                  {/* Results count */}
                  <div className={cn(
                    "px-3 py-2 border-b",
                    isDark ? "border-slate-700" : "border-slate-200"
                  )}>
                    <p className={cn(
                      "text-xs font-medium",
                      isDark ? "text-slate-400" : "text-slate-500"
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
                            isDark
                              ? "hover:bg-slate-700/80 focus:bg-slate-700/80"
                              : "hover:bg-slate-100 focus:bg-slate-100",
                            form.country_code === country.code && (
                              isDark
                                ? "bg-blue-900/40 hover:bg-blue-900/50 ring-1 ring-blue-700/50"
                                : "bg-blue-100 hover:bg-blue-200 ring-1 ring-blue-300"
                            )
                          )}
                        >
                          <span className={cn(
                            "text-2xl shrink-0 drop-shadow-sm",
                            isDark ? "opacity-90" : "opacity-100"
                          )}>
                            {country.flag}
                          </span>
                          
                          <div className="flex-1 min-w-0">
                            <span className={cn(
                              "text-sm font-medium block truncate",
                              isDark 
                                ? form.country_code === country.code
                                  ? "text-blue-100"
                                  : "text-slate-100"
                                : form.country_code === country.code
                                  ? "text-blue-900"
                                  : "text-slate-900"
                            )}>
                              {country.name}
                            </span>
                          </div>
                          
                          {form.country_code === country.code && (
                            <CheckCircle2 className={cn(
                              "w-5 h-5 shrink-0",
                              isDark ? "text-blue-400" : "text-blue-600"
                            )} />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <p className={cn(
                          "text-sm",
                          isDark ? "text-slate-400" : "text-slate-500"
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
                </div>
              )}
            </div>
          </div>

          {/* Latitude/Longitude */}
          <div>
            <Label isDark={isDark}>Latitude (Optional)</Label>
            <input
              className={inputBase(isDark)}
              value={form.latitude}
              onChange={(e) => onField('latitude', e.target.value)}
              inputMode="decimal"
              placeholder="e.g., 0.3136"
            />
            {fieldErrors.latitude && <FieldError msg={fieldErrors.latitude} />}
          </div>

          <div>
            <Label isDark={isDark}>Longitude (Optional)</Label>
            <input
              className={inputBase(isDark)}
              value={form.longitude}
              onChange={(e) => onField('longitude', e.target.value)}
              inputMode="decimal"
              placeholder="e.g., 32.5811"
            />
            {fieldErrors.longitude && <FieldError msg={fieldErrors.longitude} />}
          </div>

          {/* Contact Section Header */}
          <div className="sm:col-span-2 mt-2 flex items-center gap-2">
            <span className={cn(
              "p-1.5 rounded-lg",
              isDark ? 'bg-cyan-500/15 text-cyan-400' : 'bg-blue-50 text-blue-600'
            )}>
              <Phone className="w-4 h-4" />
            </span>
            <h4 className="text-xs font-semibold uppercase tracking-wider">Contact Information</h4>
          </div>

          {/* Phone with Country Code */}
          <div className="sm:col-span-2">
            <Label isDark={isDark}>Main Phone Number</Label>
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
                    isDark
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
                {isPhoneCountryDropdownOpen && (
                  <div className={cn(
                    'absolute z-50 w-72 mt-1 rounded-lg border-2 shadow-xl',
                    'max-h-64 overflow-hidden flex flex-col',
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                  )}>
                    {/* Search */}
                    <div className="p-2 border-b" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
                      <input
                        type="text"
                        value={filterPhoneCountry}
                        onChange={(e) => setFilterPhoneCountry(e.target.value)}
                        placeholder="Search country..."
                        className={cn(
                          'w-full px-3 py-1.5 text-xs rounded border',
                          'focus:outline-none focus:ring-1',
                          isDark
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
                              isDark ? 'hover:bg-slate-700 text-white' : 'hover:bg-slate-100 text-slate-900',
                              country.dial_code === phoneCountryCode &&
                                (isDark ? 'bg-slate-700' : 'bg-blue-50')
                            )}
                          >
                            <span className="text-lg">{country.flag}</span>
                            <span className="flex-1 truncate">{country.name}</span>
                            <span className={cn('font-medium text-xs', isDark ? 'text-slate-400' : 'text-slate-600')}>
                              {country.dial_code}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className={cn('px-3 py-4 text-center text-sm', isDark ? 'text-slate-500' : 'text-slate-400')}>
                          No countries found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Phone Input */}
              <div className="relative flex-1">
                <Phone className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
                  isDark ? "text-slate-500" : "text-slate-400"
                )} />
                <input
                  type="tel"
                  value={form.main_phone}
                  onChange={handlePhoneChange}
                  onBlur={handleBlur('phone')}
                  placeholder="e.g., 712 345 678"
                  className={cn(
                    phoneInputClass(touched.phone && !phoneValidation.isValid, phoneValidation.isValid),
                    'pl-9'
                  )}
                />
                {phoneValidation.isValid && form.main_phone && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                )}
              </div>
            </div>

            {/* Show full number with country code */}
            {form.main_phone && form.main_phone.length > 2 && (
              <p className={cn('text-xs mt-1.5', isDark ? 'text-slate-400' : 'text-slate-600')}>
                Full number: 
                <span className="font-mono text-blue-600 dark:text-blue-400 ml-1">
                  {selectedPhoneCountry?.dial_code} {form.main_phone}
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
            {fieldErrors.main_phone && <FieldError msg={fieldErrors.main_phone} />}
          </div>

          {/* Emergency Phone */}
          <div>
            <Label isDark={isDark}>Emergency Phone (Optional)</Label>
            <input
              className={inputBase(isDark)}
              value={form.emergency_phone}
              maxLength={50}
              onChange={(e) => onField('emergency_phone', e.target.value)}
              placeholder="e.g., +256 712 345 678"
            />
            {fieldErrors.emergency_phone && <FieldError msg={fieldErrors.emergency_phone} />}
          </div>

          {/* Fax */}
          <div>
            <Label isDark={isDark}>Fax (Optional)</Label>
            <input
              className={inputBase(isDark)}
              value={form.fax}
              maxLength={50}
              onChange={(e) => onField('fax', e.target.value)}
              placeholder="e.g., +256 414 123 456"
            />
            {fieldErrors.fax && <FieldError msg={fieldErrors.fax} />}
          </div>

          {/* Email */}
          <div>
            <Label isDark={isDark}>Email (Optional)</Label>
            <input
              className={inputBase(isDark)}
              value={form.email}
              maxLength={200}
              onChange={(e) => onField('email', e.target.value)}
              placeholder="e.g., info@facility.co.ug"
              type="email"
            />
            {fieldErrors.email && <FieldError msg={fieldErrors.email} />}
          </div>

          {/* Website */}
          <div className="sm:col-span-2">
            <Label isDark={isDark}>Website (Optional)</Label>
            <input
              className={inputBase(isDark)}
              value={form.website}
              maxLength={255}
              onChange={(e) => onField('website', e.target.value)}
              placeholder="e.g., https://www.facility.co.ug"
              type="url"
            />
            {fieldErrors.website && <FieldError msg={fieldErrors.website} />}
          </div>
        </div>
      ) : (
        <div className="pt-4 space-y-3">
          <InfoRow label="Address" value={formatAddress()} isDark={isDark} />
          
          {(form.latitude && form.longitude) && (
            <InfoRow 
              label="Coordinates" 
              value={`${form.latitude}, ${form.longitude}`} 
              isDark={isDark} 
            />
          )}
          
          <InfoRow label="Main Phone" value={form.main_phone} isDark={isDark} />
          <InfoRow label="Emergency Phone" value={form.emergency_phone} isDark={isDark} />
          <InfoRow label="Fax" value={form.fax} isDark={isDark} />
          <InfoRow label="Email" value={form.email} isDark={isDark} />
          <InfoRow label="Website" value={form.website} isDark={isDark} />
        </div>
      )}
    </section>
  );
};

// Helper component for displaying info rows (reused from FacilityBasicsCard)
const InfoRow: React.FC<{ label: string; value: any; isDark: boolean }> = ({ label, value, isDark }) => {
  if (!value || value === '' || value === '—') return null;
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
      <span className={cn(
        "text-xs font-semibold uppercase tracking-wider sm:w-32 shrink-0",
        isDark ? 'text-gray-400' : 'text-gray-500'
      )}>
        {label}
      </span>
      <span className={cn(
        "text-sm break-words",
        isDark ? 'text-gray-200' : 'text-gray-700'
      )}>
        {value}
      </span>
    </div>
  );
};