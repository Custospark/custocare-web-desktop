import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Label, FieldError } from './FacilitySettingsSharedUI';
import { POPULAR_CURRENCIES } from './currencyUtils';

export interface CurrencySelectProps {
  isDark: boolean;
  value: string;
  onChange: (code: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
}

export const CurrencySelect: React.FC<CurrencySelectProps> = ({
  isDark,
  value,
  onChange,
  error,
  label = 'Currency',
  placeholder = 'Select currency',
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
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

  const filteredCurrencies = useMemo(() => {
    if (!search.trim()) return POPULAR_CURRENCIES;
    const searchLower = search.toLowerCase();
    return POPULAR_CURRENCIES.filter(
      c => c.code.toLowerCase().includes(searchLower) || 
           c.name.toLowerCase().includes(searchLower)
    );
  }, [search]);

  const selectedCurrency = POPULAR_CURRENCIES.find(c => c.code === value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <Label isDark={isDark}>{label}</Label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
          isDark
            ? 'bg-gray-800 border-gray-700 text-gray-100 hover:border-gray-600'
            : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
        } ${error ? 'border-red-500' : ''}`}
      >
        {selectedCurrency ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-mono font-medium shrink-0">{selectedCurrency.code}</span>
            <span className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {selectedCurrency.symbol} - {selectedCurrency.name}
            </span>
          </div>
        ) : (
          <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {placeholder}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
          open ? 'rotate-180' : ''
        } ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
      </button>

      {open && (
        <div className={`absolute z-50 w-full mt-1 rounded-lg border-2 shadow-xl overflow-hidden ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className={`p-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="relative">
              <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search currency..."
                className={`w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border outline-none ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredCurrencies.length > 0 ? (
              filteredCurrencies.map((currency) => (
                <button
                  key={currency.code}
                  type="button"
                  onClick={() => {
                    onChange(currency.code);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                    value === currency.code
                      ? isDark
                        ? 'bg-cyan-900/30 text-cyan-200'
                        : 'bg-blue-50 text-blue-700'
                      : isDark
                      ? 'hover:bg-gray-700 text-gray-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono font-medium shrink-0">{currency.code}</span>
                    <span className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {currency.name}
                    </span>
                  </div>
                  <span className={`text-sm shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {currency.symbol}
                  </span>
                </button>
              ))
            ) : (
              <div className={`px-3 py-4 text-center text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                No currencies found
              </div>
            )}
          </div>
        </div>
      )}
      {error && <FieldError msg={error} />}
    </div>
  );
};