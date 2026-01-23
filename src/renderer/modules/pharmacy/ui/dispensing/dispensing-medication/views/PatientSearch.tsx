/**
 * ============================================================================
 * PATIENT SEARCH COMPONENT (REUSABLE)
 * ============================================================================
 * 
 * A reusable patient search component that provides:
 * - Real-time patient search by patient number
 * - Patient details display with contact information
 * - Customizable onSelect callback for parent integration
 * - Theme-aware UI with dark/light mode support
 * - Loading states and error handling
 * 
 * @module PatientSearch
 */

import React, { useState, useCallback } from 'react';
import { Search, Phone, Mail, AlertCircle } from 'lucide-react';
import { usePatientSearch } from '../../../../api/dispensing/patient-search/usePatientQueries';
import type { PatientSearchResult } from '../../../../api/dispensing/patient-search/usePatientTypes';
import { formatPatientName, calculateAge, getPatientInitials }  from '../../../../api/dispensing/patient-search/usePatientTypes';
import { cn } from '../../../../../../shared/utils/classNameUtils';

/* -------------------------------------------------------------------------- */
/*                              COMPONENT PROPS                               */
/* -------------------------------------------------------------------------- */

export interface PatientSearchProps {
  theme: 'light' | 'dark';
  onPatientSelect?: (patient: PatientSearchResult) => void;
  searchLabel?: string;
  searchPlaceholder?: string;
  showContactInfo?: boolean;
  autoFocus?: boolean;
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*                           PATIENT SEARCH COMPONENT                         */
/* -------------------------------------------------------------------------- */

const PatientSearch: React.FC<PatientSearchProps> = ({
  theme,
  onPatientSelect,
  searchLabel = 'Search Patient',
  searchPlaceholder = 'Enter patient number (e.g., PT-1234GY5X7...)',
  showContactInfo = true,
  autoFocus = false,
  className,
}) => {
  const isDark = theme === 'dark';
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  
  // Query state
  const { data: searchData, isLoading, error } = usePatientSearch(
    { 
      q: searchTerm.trim(),
      limit: 1 
    },
    { enabled: hasSearched && searchTerm.trim().length > 0 }
  );

  const searchResult = searchData?.data?.[0] || null;
  const notFound = hasSearched && !isLoading && !searchResult && searchTerm.trim().length > 0;

  /* -------------------------------------------------------------------------- */
  /*                              EVENT HANDLERS                                */
  /* -------------------------------------------------------------------------- */

  const handleSearch = useCallback(() => {
    if (searchTerm.trim().length === 0) return;
    setHasSearched(true);
  }, [searchTerm]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (hasSearched && e.target.value.trim().length === 0) {
      setHasSearched(false);
    }
  }, [hasSearched]);

  const handlePatientSelect = useCallback(() => {
    if (searchResult && onPatientSelect) {
      onPatientSelect(searchResult);
    }
  }, [searchResult, onPatientSelect]);

  /* -------------------------------------------------------------------------- */
  /*                              THEME COLORS                                  */
  /* -------------------------------------------------------------------------- */

  const colors = {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      elevated: isDark ? 'bg-gray-800' : 'bg-white',
    },
    border: {
      primary: isDark ? 'border-gray-700' : 'border-gray-300',
      focus: 'focus:border-blue-500',
    },
    text: {
      primary: isDark ? 'text-white' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
      placeholder: isDark ? 'placeholder-gray-500' : 'placeholder-gray-400',
    },
    button: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    },
    icon: {
      primary: isDark ? 'text-gray-400' : 'text-gray-500',
      accent: isDark ? 'text-blue-400' : 'text-blue-600',
    },
  };

  /* -------------------------------------------------------------------------- */
  /*                              RENDER COMPONENT                              */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div>
        <h2 className={cn('text-2xl font-bold mb-2', colors.text.primary)}>
          {searchLabel}
        </h2>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5',
              colors.icon.primary
            )}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={searchPlaceholder}
            autoFocus={autoFocus}
            className={cn(
              'w-full pl-10 pr-4 py-3 rounded-lg border',
              isDark ? colors.bg.elevated : 'bg-white',
              colors.border.primary,
              colors.text.primary,
              colors.text.placeholder,
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'transition-all duration-200'
            )}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={!searchTerm.trim() || isLoading}
          className={cn(
            'px-6 py-3 rounded-lg font-medium transition-colors',
            'flex items-center gap-2',
            colors.button.primary,
            colors.button.disabled
          )}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Search
            </>
          )}
        </button>
      </div>

      {/* Search Result */}
      {searchResult && (
        <div
          className={cn(
            'rounded-xl border p-6',
            colors.bg.elevated,
            colors.border.primary,
            'transition-all duration-200'
          )}
        >
          {/* Patient Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div
                className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0',
                  isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                )}
              >
                <span className={cn('text-xl font-semibold', colors.icon.accent)}>
                  {getPatientInitials(searchResult)}
                </span>
              </div>

              {/* Patient Info */}
              <div className="flex-1 min-w-0">
                <h3 className={cn('text-xl font-semibold mb-1', colors.text.primary)}>
                  {formatPatientName(searchResult)}
                </h3>
                <div className={cn('text-sm space-y-1', colors.text.secondary)}>
                  <div>Patient #: {searchResult.patient_number}</div>
                  {searchResult.date_of_birth && (
                    <div>
                      Age: {calculateAge(searchResult.date_of_birth)} years
                      {' • '}
                      DOB: {new Date(searchResult.date_of_birth).toLocaleDateString()}
                    </div>
                  )}
                  {searchResult.biological_sex && (
                    <div>Gender: {searchResult.biological_sex}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          {showContactInfo && (searchResult.global_user_uuid) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div
                className={cn(
                  'p-3 rounded-lg flex items-center gap-3',
                  colors.bg.secondary
                )}
              >
                <Mail className={cn('w-5 h-5 flex-shrink-0', colors.icon.primary)} />
                <div className="flex-1 min-w-0">
                  <div className={cn('text-xs', colors.text.tertiary)}>Email</div>
                  <div className={cn('font-medium truncate', colors.text.primary)}>
                    {searchResult.global_user_uuid ? 'Available' : 'Not provided'}
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  'p-3 rounded-lg flex items-center gap-3',
                  colors.bg.secondary
                )}
              >
                <Phone className={cn('w-5 h-5 flex-shrink-0', colors.icon.primary)} />
                <div className="flex-1 min-w-0">
                  <div className={cn('text-xs', colors.text.tertiary)}>Phone</div>
                  <div className={cn('font-medium truncate', colors.text.primary)}>
                    {searchResult.global_user_uuid ? 'Available' : 'Not provided'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Select Button */}
          {onPatientSelect && (
            <button
              onClick={handlePatientSelect}
              className={cn(
                'w-full py-3 rounded-lg font-medium transition-colors',
                'flex items-center justify-center gap-2',
                colors.button.primary
              )}
            >
              Select Patient
            </button>
          )}
        </div>
      )}

      {/* Not Found State */}
      {notFound && (
        <div
          className={cn(
            'rounded-xl border p-8 text-center',
            colors.bg.elevated,
            colors.border.primary
          )}
        >
          <div
            className={cn(
              'inline-flex items-center justify-center w-16 h-16 rounded-full mb-4',
              isDark ? 'bg-red-900/30' : 'bg-red-100'
            )}
          >
            <AlertCircle className={cn('w-8 h-8', isDark ? 'text-red-400' : 'text-red-600')} />
          </div>
          <h3 className={cn('text-lg font-semibold mb-2', colors.text.primary)}>
            Patient Not Found
          </h3>
          <p className={colors.text.secondary}>
            No patient found with number: <strong>{searchTerm}</strong>
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          className={cn(
            'rounded-xl border p-8 text-center',
            colors.bg.elevated,
            isDark ? 'border-red-800' : 'border-red-200'
          )}
        >
          <div
            className={cn(
              'inline-flex items-center justify-center w-16 h-16 rounded-full mb-4',
              isDark ? 'bg-red-900/30' : 'bg-red-100'
            )}
          >
            <AlertCircle className={cn('w-8 h-8', isDark ? 'text-red-400' : 'text-red-600')} />
          </div>
          <h3 className={cn('text-lg font-semibold mb-2', colors.text.primary)}>
            Search Error
          </h3>
          <p className={colors.text.secondary}>
            Failed to search for patient. Please try again.
          </p>
        </div>
      )}
    </div>
  );
};

PatientSearch.displayName = 'PatientSearch';

export default PatientSearch;