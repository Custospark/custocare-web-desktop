// StatusBar.tsx
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  WifiOff,
  Command,
  Search,
  Settings,
  Sun,
  Moon,
  X,
  PanelRight,
  RefreshCw,
  Zap,
  Filter,
  ArrowRight,
  Bell,
} from 'lucide-react';
import { cn } from '../../types/cn';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../app/store/hooks/useApp';
import { 
  selectAccessibleModuleCodes,
} from '../../../app/store/slices/activeContextSlice';
import { useSelector } from 'react-redux';
import { isInPatientMode } from '../../../app/store/utils/contextSelectors';
import { ACCOUNT_ROUTES,ROUTES } from '../../../app/routes/routeConstants';


export type SidebarPosition = 'left' | 'right';
export type SystemStatus = 'online' | 'slow' | 'offline';
export type ThemeMode = 'light' | 'dark';

export interface StatusBarThemeClasses {
  backdrop: string;
}

export interface StatusBarProps {
  theme: ThemeMode;
  themeClasses: StatusBarThemeClasses;

  systemStatus: SystemStatus;
  isOnline: boolean;
  latency: number | null;
  lastChecked: Date | null;
  onRetryConnection: () => void;

  searchQuery: string;
  isSearchFocused: boolean;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  onClearSearch: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;

  sidebarPosition: SidebarPosition;
  isTransitioning: boolean;

  onToggleSidebarPosition: () => void;
  onToggleTheme: () => void;

  appVersion: string;
  
  // New props for notifications
  unreadCount?: number;
  onNotificationClick?: () => void;
}

interface SearchableModule {
  id: string;
  label: string;
  route: string;
  description: string;
  moduleCode: string;
  keywords: string[];
  category: string;
}

/**
 * Real status configurations based on actual connectivity
 */
const STATUS_STYLES: Record<
  SystemStatus,
  {
    label: string;
    icon: React.ReactNode;
    pulse: boolean;
    textClass: string;
    bgClass: string;
    borderClassDark: string;
    borderClassLight: string;
  }
> = {
  online: {
    label: 'Connected',
    icon: <Activity className="w-3 h-3" />,
    pulse: true,
    textClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10',
    borderClassDark: 'border-emerald-500/20',
    borderClassLight: 'border-emerald-200',
  },
  slow: {
    label: 'Slow Connection',
    icon: <AlertTriangle className="w-3 h-3" />,
    pulse: true,
    textClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
    borderClassDark: 'border-amber-500/20',
    borderClassLight: 'border-amber-200',
  },
  offline: {
    label: 'Offline',
    icon: <WifiOff className="w-3 h-3" />,
    pulse: false,
    textClass: 'text-red-400',
    bgClass: 'bg-red-500/10',
    borderClassDark: 'border-red-500/20',
    borderClassLight: 'border-red-200',
  },
};

export const StatusBar: React.FC<StatusBarProps> = ({
  theme,
  themeClasses,
  systemStatus,
  isOnline,
  latency,
  lastChecked,
  onRetryConnection,
  searchQuery,
  isSearchFocused,
  onSearchChange,
  onSearchFocus,
  onSearchBlur,
  onClearSearch,
  searchInputRef,
  sidebarPosition,
  isTransitioning,
  onToggleSidebarPosition,
  onToggleTheme,
  appVersion,
  unreadCount = 0,
  onNotificationClick,
}) => {
  const navigate = useNavigate();
  const status = useMemo(() => STATUS_STYLES[systemStatus], [systemStatus]);

  // Redux state for accessible modules
  const accessibleModuleCodes = useAppSelector(selectAccessibleModuleCodes);
  const inPatientMode = useSelector(isInPatientMode);

  // Search state
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchableModule[]>([]);
  const searchWrapRef = useRef<HTMLDivElement>(null);

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
      route: ACCOUNT_ROUTES.PROFILE,
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

  const handleNotificationClick = useCallback(() => {
    if (onNotificationClick) {
      onNotificationClick();
    } else {
      navigate(ACCOUNT_ROUTES.MESSAGES_INBOX);
    }
  }, [onNotificationClick, navigate]);

  const positionToggleIcon = useMemo(() => {
    const isLeft = sidebarPosition === 'left';
    return (
      <div
        className={cn(
          'flex items-center justify-center',
          'w-7 h-7 rounded-lg transition-all duration-300',
          theme === 'dark' ? 'bg-gray-800/60' : 'bg-gray-100/70'
        )}
      >
        <PanelRight
          className={cn(
            'w-4 h-4 transition-all duration-300',
            isLeft && 'rotate-180',
            theme === 'dark'
              ? isLeft
                ? 'text-cyan-400'
                : 'text-gray-400'
              : isLeft
                ? 'text-blue-600'
                : 'text-gray-600'
          )}
        />
      </div>
    );
  }, [sidebarPosition, theme]);

  const formatLatency = (ms: number | null): string => {
    if (ms === null) return 'N/A';
    if (ms < 100) return `${ms}ms`;
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatLastChecked = (date: Date | null): string => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    return `${diffHour}h ago`;
  };

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-2 sm:px-4 py-2.5',
        'border-b backdrop-blur-xl',
        'transition-all duration-300 ease-in-out',
        themeClasses.backdrop,
        theme === 'dark' ? 'border-gray-800/50' : 'border-gray-200/60'
      )}
    >
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* LEFT: System Status */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <div
            className={cn(
              'flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full border',
              'transition-all duration-300 ease-in-out',
              status.bgClass,
              status.textClass,
              theme === 'dark' ? status.borderClassDark : status.borderClassLight
            )}
          >
            <div className={cn('w-2.5 h-2.5 flex items-center justify-center', status.pulse && 'animate-pulse')}>
              {status.icon}
            </div>
            <span className="text-xs font-medium truncate max-w-[80px] xs:max-w-[120px] sm:max-w-none">
              {status.label}
            </span>
            
            {/* Latency indicator */}
            {isOnline && latency !== null && (
              <div className="hidden md:flex items-center gap-1 ml-1">
                <Zap className="w-2.5 h-2.5" />
                <span className="text-xs font-mono">{formatLatency(latency)}</span>
              </div>
            )}
          </div>

          {/* Retry button when offline/slow */}
          {(systemStatus === 'offline' || systemStatus === 'slow') && (
            <button
              onClick={onRetryConnection}
              aria-label="Retry connection"
              title="Check connection now"
              className={cn(
                'p-1.5 rounded-lg transition-all duration-200',
                'hover:scale-110 active:scale-95',
                'focus:outline-none focus:ring-2 focus:ring-offset-1',
                'cursor-pointer',
                theme === 'dark'
                  ? 'bg-gray-800/40 text-gray-400 hover:text-cyan-400 hover:bg-gray-800/60 focus:ring-cyan-500/50'
                  : 'bg-gray-100/60 text-gray-600 hover:text-blue-600 hover:bg-gray-100/80 focus:ring-blue-500/50'
              )}
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}

          {/* Last checked timestamp */}
          <span
            className={cn(
              'hidden md:inline px-2 py-0.5 rounded text-xs border',
              'transition-all duration-200',
              theme === 'dark'
                ? 'bg-gray-800/40 text-gray-400 border-gray-700/40'
                : 'bg-gray-100/60 text-gray-600 border-gray-200'
            )}
            title={lastChecked ? `Last checked: ${lastChecked.toLocaleTimeString()}` : 'Never checked'}
          >
            {formatLastChecked(lastChecked)}
          </span>

          <span
            className={cn(
              'hidden lg:inline px-2 py-0.5 rounded text-xs border',
              'transition-all duration-200',
              theme === 'dark'
                ? 'bg-gray-800/40 text-gray-400 border-gray-700/40'
                : 'bg-gray-100/60 text-gray-600 border-gray-200'
            )}
          >
            Version {appVersion}
          </span>
        </div>

        {/* CENTER: Search Bar with Dropdown */}
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

        {/* RIGHT: Quick Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
         

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title="Toggle theme"
            className={cn(
              'p-2 sm:p-1.5 rounded-lg',
              'transition-all duration-300 ease-in-out',
              'hover:scale-105 active:scale-95 hover:rotate-12',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              'cursor-pointer',
              theme === 'dark'
                ? 'text-amber-400 hover:bg-amber-500/10 focus:ring-amber-500/50'
                : 'text-indigo-600 hover:bg-indigo-500/10 focus:ring-indigo-500/50'
            )}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> : <Moon className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
          </button>

          {/* Notifications */}
          <button
            onClick={handleNotificationClick}
            aria-label="Notifications"
            title="View messages and notifications"
            className={cn(
              'relative p-2 sm:p-1.5 rounded-lg',
              'transition-all duration-300 ease-in-out',
              'hover:scale-105 active:scale-95',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              'cursor-pointer',
              theme === 'dark'
                ? 'text-gray-400 hover:text-cyan-400 hover:bg-gray-800/60 focus:ring-cyan-500/50'
                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100/80 focus:ring-blue-500/50'
            )}
          >
            <Bell className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            {unreadCount > 0 && (
              <span
                className={cn(
                  'absolute -top-1 -right-1 flex items-center justify-center',
                  'min-w-[18px] h-[18px] px-1',
                  'text-[10px] font-bold text-white rounded-full',
                  'bg-gradient-to-r from-red-500 to-pink-500',
                  'animate-pulse',
                  'shadow-lg shadow-red-500/50'
                )}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          
           {/* Sidebar Position Toggle */}
          <button
            onClick={onToggleSidebarPosition}
            aria-label={`Move sidebar to ${sidebarPosition === 'left' ? 'right' : 'left'}`}
            title={`Move sidebar to ${sidebarPosition === 'left' ? 'right' : 'left'}`}
            disabled={isTransitioning}
            className={cn(
              'hidden lg:flex items-center justify-center px-2 py-1.5 rounded-lg',
              'transition-all duration-300 ease-in-out',
              'hover:scale-105 active:scale-95',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'cursor-pointer',
              theme === 'dark'
                ? 'text-gray-400 hover:text-cyan-400 hover:bg-gray-800/60 focus:ring-cyan-500/50'
                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100/80 focus:ring-blue-500/50'
            )}
          >
            {positionToggleIcon}
          </button>

          {/* Settings */}
          <button
            aria-label="Open settings"
            title="Settings"
            className={cn(
              'p-2 sm:p-1.5 rounded-lg',
              'transition-all duration-300 ease-in-out',
              'hover:scale-105 active:scale-95 hover:rotate-90',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              'cursor-pointer',
              theme === 'dark'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800/60 focus:ring-gray-500/50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 focus:ring-gray-400/50'
            )}
          >
            <Settings className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

StatusBar.displayName = 'StatusBar';
export default StatusBar;