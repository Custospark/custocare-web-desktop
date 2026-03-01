// components/statusbar/SearchBar.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, X, Command, Filter, ArrowRight } from 'lucide-react';
import { cn } from '../../../utils/classNameUtils';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../../app/store/hooks/useApp';
import { selectAccessibleModuleCodes } from '../../../../app/store/slices/activeContextSlice';
import { useSelector } from 'react-redux';
import { isInPatientMode } from '../../../../app/store/utils/contextSelectors';
import { ACCOUNT_ROUTES,ROUTES } from '../../../../app/routes/routeConstants';
import type { SearchableModule, ThemeMode } from './StatusBarTypes';

interface SearchBarProps {
  searchQuery: string;
  isSearchFocused: boolean;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  onClearSearch: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  theme: ThemeMode;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  isSearchFocused,
  onSearchChange,
  onSearchFocus,
  onSearchBlur,
  onClearSearch,
  searchInputRef,
  theme,
}) => {
  const navigate = useNavigate();
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchableModule[]>([]);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  // Redux state for accessible modules
  const accessibleModuleCodes = useAppSelector(selectAccessibleModuleCodes);
  const inPatientMode = useSelector(isInPatientMode);

  // Patient accessible modules
  const accessiblePatientModuleCodes = useMemo(
    () => ['patient_dashboard', 'account'],
    []
  );

  // Define all searchable modules
  const allModules: SearchableModule[] = useMemo(() => [
    {
      id: 'patient-dashboard',
      label: 'My Health',
      route: ROUTES.DASHBOARD,
      description: 'Personal health overview',
      moduleCode: 'patient_dashboard',
      keywords: ['health', 'patient', 'dashboard', 'overview', 'personal'],
      category: 'Patient Portal',
    },
    {
      id: 'staff-dashboard',
      label: 'Staff Portal',
      route: '/staff-dashboard',
      description: 'Staff workspace',
      moduleCode: 'staff_dashboard',
      keywords: ['staff', 'portal', 'dashboard', 'workspace', 'employee'],
      category: 'Administration',
    },
    {
      id: 'medical-records',
      label: 'Front Desk',
      route: '/medical-records',
      description: 'Medical Records',
      moduleCode: 'medical_records',
      keywords: ['front', 'desk', 'reception', 'records', 'medical', 'registration'],
      category: 'Clinical',
    },
    {
      id: 'nursing-care',
      label: 'Nursing Care',
      route: '/nursing',
      description: 'Vitals & ward care',
      moduleCode: 'nursing',
      keywords: ['nursing', 'vitals', 'ward', 'care', 'nurse'],
      category: 'Clinical',
    },
    {
      id: 'clinical',
      label: 'Clinical Workspace',
      route: '/clinical',
      description: 'Doctor Consultation & diagnosis',
      moduleCode: 'clinical',
      keywords: ['clinical', 'doctor', 'consultation', 'diagnosis', 'physician'],
      category: 'Clinical',
    },
    {
      id: 'laboratory',
      label: 'Laboratory',
      route: '/laboratory',
      description: 'Lab tests, results & specimens',
      moduleCode: 'laboratory',
      keywords: ['lab', 'laboratory', 'tests', 'results', 'specimens', 'pathology'],
      category: 'Clinical',
    },
    {
      id: 'pharmacy',
      label: 'Pharmacy',
      route: '/pharmacy',
      description: 'Medication dispensing',
      moduleCode: 'pharmacy',
      keywords: ['pharmacy', 'medication', 'drugs', 'dispensing', 'prescriptions'],
      category: 'Clinical',
    },
    {
      id: 'billing',
      label: 'Billing & Finance',
      route: '/billing',
      description: 'Invoices & payments',
      moduleCode: 'billing',
      keywords: ['billing', 'finance', 'invoices', 'payments', 'accounts'],
      category: 'Finance',
    },
    {
      id: 'administration',
      label: 'Facility Governance',
      route: '/administration',
      description: 'Configure facilities, manage workforce access, services, and operational controls',
      moduleCode: 'administration',
      keywords: ['admin', 'administration', 'governance', 'facilities', 'management', 'settings'],
      category: 'Administration',
    },
    {
      id: 'account',
      label: 'Account',
      route: ACCOUNT_ROUTES.SETTINGS_PROFILE,
      description: 'Manage your profile, security, and preferences',
      moduleCode: 'account',
      keywords: ['account', 'profile', 'security', 'preferences', 'settings', 'user'],
      category: 'System',
    },
  ], []);

  // Filter accessible modules
  const accessibleModules = useMemo(() => {
    if (inPatientMode) {
      return allModules.filter(module => {
        if (module.moduleCode === 'account') return true;
        return accessiblePatientModuleCodes.includes(module.moduleCode);
      });
    } else {
      return allModules.filter(module => {
        if (module.moduleCode === 'account') return true;
        return accessibleModuleCodes.includes(module.moduleCode);
      });
    }
  }, [allModules, accessibleModuleCodes, accessiblePatientModuleCodes, inPatientMode]);

  // Comprehensive search filtering with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const term = searchQuery.trim().toLowerCase();
      
      if (!term) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      const results = accessibleModules.filter((module) => {
        const searchableText = [
          module.label,
          module.description,
          module.category,
          ...module.keywords
        ].join(' ').toLowerCase();

        return searchableText.includes(term);
      }).slice(0, 8);

      setSearchResults(results);
      setShowSearchResults(true);
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, accessibleModules]);

  // Close search on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!searchWrapRef.current) return;
      if (!searchWrapRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSearchResults(false);
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [searchInputRef]);

  const handleNavigate = useCallback((route: string) => {
    navigate(route);
    onClearSearch();
    setShowSearchResults(false);
    searchInputRef.current?.blur();
  }, [navigate, onClearSearch, searchInputRef]);

  return (
    <div className="flex-1 max-w-lg mx-2 sm:mx-3" ref={searchWrapRef}>
      <div className="relative group">
        <Search
          className={cn(
            'absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5',
            'transition-all duration-300 ease-in-out',
            isSearchFocused
              ? theme === 'dark'
                ? 'text-cyan-400 scale-110'
                : 'text-blue-500 scale-110'
              : theme === 'dark'
                ? 'text-gray-500'
                : 'text-gray-400'
          )}
        />

        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={onSearchChange}
          onFocus={() => {
            onSearchFocus();
            if (searchQuery.trim()) setShowSearchResults(true);
          }}
          onBlur={onSearchBlur}
          placeholder="Search for anything you need..."
          aria-label="Global module search"
          className={cn(
            'w-full pl-9 pr-16 sm:pr-20 py-1.5 rounded-lg text-sm',
            'border transition-all duration-300 ease-in-out',
            'focus:outline-none focus:ring-2',
            theme === 'dark'
              ? 'bg-gray-800/50 border-gray-700/50 text-gray-100 placeholder-gray-500 focus:border-cyan-500/40 focus:ring-cyan-500/20'
              : 'bg-white/50 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:border-blue-500/40 focus:ring-blue-500/20'
          )}
        />

        {searchQuery ? (
          <button
            onClick={onClearSearch}
            aria-label="Clear search"
            className={cn(
              'absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded',
              'transition-all duration-200 hover:scale-110 active:scale-95',
              'cursor-pointer',
              theme === 'dark' ? 'hover:bg-gray-700/50 text-gray-400' : 'hover:bg-gray-200/50 text-gray-600'
            )}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div
            className={cn(
              'absolute right-2.5 top-1/2 -translate-y-1/2 hidden xs:flex items-center gap-1 px-1.5 py-0.5 rounded text-xs',
              'transition-all duration-200',
              theme === 'dark'
                ? 'bg-gray-800/40 border border-gray-700/50 text-gray-500'
                : 'bg-gray-100/40 border border-gray-300/50 text-gray-600'
            )}
          >
            <Command className="w-3 h-3" />
            <span>K</span>
          </div>
        )}

        {/* SEARCH RESULTS DROPDOWN */}
        {showSearchResults && (
          <div 
            className={cn(
              'absolute z-[60] mt-2 rounded-lg shadow-xl border backdrop-blur-sm',
              'transition-all duration-200',
              'left-0 right-0',
              'mx-auto',
              'w-full',
              'max-h-[70vh] sm:max-h-96 overflow-y-auto',
              theme === 'dark'
                ? 'bg-gray-900/98 border-gray-700/50'
                : 'bg-white/98 border-gray-200/50'
            )}
            style={{
              maxWidth: 'min(100%, 500px)',
            }}
          >
            {searchResults.length > 0 ? (
              <div className="divide-y divide-gray-800/20 dark:divide-gray-700/30">
                {searchResults.map((module, index) => (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => handleNavigate(module.route)}
                    className={cn(
                      'w-full text-left p-4 sm:p-4 transition-all duration-150 cursor-pointer',
                      'hover:bg-opacity-80 active:bg-opacity-90',
                      theme === 'dark'
                        ? 'hover:bg-gray-800/60 active:bg-gray-800/80'
                        : 'hover:bg-gray-50/80 active:bg-gray-100',
                      index === 0 && 'rounded-t-lg',
                      index === searchResults.length - 1 && 'rounded-b-lg'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 mb-1.5">
                          <span
                            className={cn(
                              'font-semibold text-sm sm:text-base truncate',
                              theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                            )}
                          >
                            {module.label}
                          </span>
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full inline-flex items-center justify-center',
                              'w-fit',
                              theme === 'dark'
                                ? 'bg-blue-900/30 text-blue-300 border border-blue-700/30'
                                : 'bg-blue-50 text-blue-700 border border-blue-200/50'
                            )}
                          >
                            {module.category}
                          </span>
                        </div>
                        <p
                          className={cn(
                            'text-xs sm:text-sm leading-relaxed line-clamp-2',
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          )}
                        >
                          {module.description}
                        </p>
                      </div>
                      <div
                        className={cn(
                          'p-1.5 sm:p-2 rounded-lg flex-shrink-0 self-center',
                          'transition-transform group-hover:translate-x-1',
                          theme === 'dark'
                            ? 'bg-cyan-900/20 text-cyan-400'
                            : 'bg-blue-50 text-blue-600'
                        )}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 sm:p-8 text-center">
                <div
                  className={cn(
                    'inline-flex p-3 sm:p-4 rounded-full mb-3 mx-auto',
                    theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'
                  )}
                >
                  <Filter
                    className={cn(
                      'w-5 h-5 sm:w-6 sm:h-6',
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    )}
                  />
                </div>
                <p
                  className={cn(
                    'font-semibold text-sm sm:text-base mb-1',
                    theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                  )}
                >
                  No results found
                </p>
                <p
                  className={cn(
                    'text-xs sm:text-sm',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}
                >
                  Try different keywords
                </p>
                <p
                  className={cn(
                    'text-xs mt-2',
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  )}
                >
                  Search by name, category, or functionality
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};