/**
 * ============================================================================
 * STAFF PRESENCE COMPONENT
 * ============================================================================
 * 
 * Displays staff presence status with toggleable dropdown for setting status.
 * - Mobile: Shows icon only
 * - Desktop: Shows status text
 * - Dropdown accessible on all devices
 * - Premium UI with appropriate icons
 * - Respects user's theme
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Circle,
  Coffee,
  LogOut,
  Zap,
  CheckCircle,
  AlertCircle,
  Moon,
  Loader2
} from 'lucide-react';
import { cn } from '../../../utils/classNameUtils';
import { useGetMyPresence, useSetMyPresence }  from '../../../../modules/administration/admin-module/api/staff-presence/StaffPresenceQueries';
import { StaffPresenceStatus } from '../../../../modules/administration/admin-module/api/staff-presence/StaffPresenceTypes';

interface StaffPresenceProps {
  isDark: boolean;
  className?: string;
}

interface PresenceOption {
  id: StaffPresenceStatus;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  darkColor: string;
  lightColor: string;
}

// Helper function to get status label - moved outside component to prevent recreation
const getStatusDisplay = (status: StaffPresenceStatus): string => {
  switch (status) {
    case StaffPresenceStatus.ON_DUTY: return 'On Duty';
    case StaffPresenceStatus.BUSY: return 'Busy';
    case StaffPresenceStatus.ON_BREAK: return 'On Break';
    case StaffPresenceStatus.UNAVAILABLE: return 'Unavailable';
    case StaffPresenceStatus.OFF_DUTY: return 'Off Duty';
    default: return 'Off Duty';
  }
};

const StaffPresence: React.FC<StaffPresenceProps> = ({
  isDark,
  className
}) => {
  // ============================================================================
  // STATE & REFS
  // ============================================================================
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // ============================================================================
  // HOOKS
  // ============================================================================
  const { 
    data: presenceData, 
    isLoading, 
    isError,
    isRefetching
  } = useGetMyPresence();
  
  const setPresenceMutation = useSetMyPresence();
  
  // ============================================================================
  // DATA
  // ============================================================================
  const currentPresence = presenceData?.data;
  
  // Determine current status - FIXED LOGIC
  const currentStatus = currentPresence?.status || StaffPresenceStatus.OFF_DUTY;
  const currentStatusLabel = currentPresence?.status_label || getStatusDisplay(currentStatus);
  
  // ============================================================================
  // PRESENCE OPTIONS (Memoized to prevent recreation)
  // ============================================================================
  const presenceOptions: PresenceOption[] = React.useMemo(() => [
    {
      id: StaffPresenceStatus.ON_DUTY,
      label: 'On Duty',
      description: 'Available for assignments',
      icon: <Circle className="w-4 h-4" />,
      color: 'emerald',
      darkColor: 'text-emerald-400 bg-emerald-400/10',
      lightColor: 'text-emerald-600 bg-emerald-100'
    },
    {
      id: StaffPresenceStatus.BUSY,
      label: 'Busy',
      description: 'Engaged with tasks',
      icon: <Zap className="w-4 h-4" />,
      color: 'amber',
      darkColor: 'text-amber-400 bg-amber-400/10',
      lightColor: 'text-amber-600 bg-amber-100'
    },
    {
      id: StaffPresenceStatus.ON_BREAK,
      label: 'On Break',
      description: 'Taking a short break',
      icon: <Coffee className="w-4 h-4" />,
      color: 'orange',
      darkColor: 'text-orange-400 bg-orange-400/10',
      lightColor: 'text-orange-600 bg-orange-100'
    },
    {
      id: StaffPresenceStatus.UNAVAILABLE,
      label: 'Unavailable',
      description: 'Not available for assignments',
      icon: <Moon className="w-4 h-4" />,
      color: 'purple',
      darkColor: 'text-purple-400 bg-purple-400/10',
      lightColor: 'text-purple-600 bg-purple-100'
    },
    {
      id: StaffPresenceStatus.OFF_DUTY,
      label: 'Off Duty',
      description: 'End of shift',
      icon: <LogOut className="w-4 h-4" />,
      color: 'gray',
      darkColor: 'text-gray-400 bg-gray-400/10',
      lightColor: 'text-gray-600 bg-gray-100'
    }
  ], []);
  
  // ============================================================================
  // STATUS UI HELPERS (Memoized to prevent recreation)
  // ============================================================================
  const getStatusConfig = React.useCallback((status: StaffPresenceStatus): PresenceOption => {
    return presenceOptions.find(opt => opt.id === status) || presenceOptions[4]; // Default to OFF_DUTY
  }, [presenceOptions]);
  
  const getStatusIcon = React.useCallback(() => {
      const config = getStatusConfig(currentStatus);
      const iconElement = config.icon as React.ReactElement<any>; // Specify the generic type
      return React.cloneElement(iconElement, {
        ...(iconElement.props || {}),
        className: cn(
          'w-3 h-3 md:w-4 md:h-4',
          isDark ? config.darkColor.split(' ')[0] : config.lightColor.split(' ')[0]
        )
      });
    }, [currentStatus, isDark, getStatusConfig]);
  
  const getStatusColor = React.useCallback(() => {
    const config = getStatusConfig(currentStatus);
    return isDark ? config.darkColor : config.lightColor;
  }, [currentStatus, isDark, getStatusConfig]);
  
  const getStatusPulseColor = React.useCallback((status: StaffPresenceStatus): string => {
    switch (status) {
      case StaffPresenceStatus.ON_DUTY: return 'bg-emerald-500';
      case StaffPresenceStatus.BUSY: return 'bg-amber-500';
      case StaffPresenceStatus.ON_BREAK: return 'bg-orange-500';
      case StaffPresenceStatus.UNAVAILABLE: return 'bg-purple-500';
      case StaffPresenceStatus.OFF_DUTY: return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  }, []);
  
  // ============================================================================
  // EFFECTS
  // ============================================================================
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handlePresenceClick = () => {
    if (isLoading || setPresenceMutation.isPending) return;
    setIsDropdownOpen(!isDropdownOpen);
  };
  
  const handleSetPresence = async (status: StaffPresenceStatus) => {
    try {
      const option = presenceOptions.find(opt => opt.id === status);
      
      await setPresenceMutation.mutateAsync({ 
        status,
        note: `Changed to ${option?.label || status}`
      });
      
      setIsDropdownOpen(false);
      
   
    } catch (error) {
      console.error('Failed to update presence:', error);
      // Error is already handled in the mutation hook
    }
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  const isPending = isLoading || isRefetching || setPresenceMutation.isPending;
  
  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Presence Toggle Button */}
      <button
        onClick={handlePresenceClick}
        disabled={isPending}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
          'hover:scale-105 active:scale-95 cursor-pointer',
          'border focus:outline-none focus:ring-2 focus:ring-offset-2',
          isDark 
            ? 'border-gray-800 hover:bg-gray-800 focus:ring-cyan-500/30 focus:ring-offset-gray-900' 
            : 'border-gray-200 hover:bg-gray-50 focus:ring-blue-500/30 focus:ring-offset-white',
          isPending ? 'opacity-70 cursor-not-allowed' : ''
        )}
        title="Set your presence status"
      >
        {/* Status Indicator */}
        <div className="relative">
          <div className={cn(
            'w-2 h-2 rounded-full animate-pulse',
            getStatusPulseColor(currentStatus)
          )} />
          <div className={cn(
            'absolute -inset-1 rounded-full opacity-20',
            getStatusPulseColor(currentStatus)
          )} />
        </div>
        
        {/* Icon - Always Visible (Mobile & Desktop) */}
        <div className={cn(
          'flex items-center justify-center',
          getStatusColor()
        )}>
          {getStatusIcon()}
        </div>
        
        {/* Status Text - Desktop Only */}
        <div className="hidden lg:block">
          <span className={cn(
            'text-sm font-medium whitespace-nowrap',
            isDark ? 'text-gray-300' : 'text-gray-700'
          )}>
            {isLoading ? 'Loading...' : currentStatusLabel}
          </span>
        </div>
        
        {/* Loading Indicator */}
        {isPending && (
          <div className="ml-1">
            <Loader2 className={cn(
              'w-3 h-3 animate-spin',
              isDark ? 'text-gray-400' : 'text-gray-600'
            )} />
          </div>
        )}
      </button>
      
      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className={cn(
          'absolute right-0 mt-2 w-64 rounded-xl border shadow-2xl z-50',
          'animate-in slide-in-from-top-2 duration-200',
          isDark 
            ? 'bg-gray-900 border-gray-800' 
            : 'bg-white border-gray-200'
        )}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                getStatusColor()
              )}>
                {getStatusIcon()}
              </div>
              <div>
                <h3 className={cn(
                  'font-semibold',
                  isDark ? 'text-gray-200' : 'text-gray-900'
                )}>
                  Presence Status
                </h3>
                <p className={cn(
                  'text-xs mt-0.5',
                  isDark ? 'text-gray-500' : 'text-gray-600'
                )}>
                  {isLoading ? 'Loading...' : 
                   setPresenceMutation.isPending ? 'Updating...' :
                   `Current: ${currentStatusLabel}`}
                </p>
                {/* Debug info (remove in production) */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-600">
                      Status: {currentStatus}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-600">
                      Has Data: {currentPresence ? 'Yes' : 'No'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-600">
                      Error: {isError ? 'Yes' : 'No'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Status Options */}
          <div className="p-2">
            {presenceOptions.map((option) => {
              const isActive = option.id === currentStatus;
              const isUpdatingThisOption = setPresenceMutation.isPending && setPresenceMutation.variables?.status === option.id;
              
              return (
                <button
                  key={option.id}
                  onClick={() => handleSetPresence(option.id)}
                  disabled={setPresenceMutation.isPending}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200',
                    'hover:scale-[1.02] active:scale-95 cursor-pointer',
                    'focus:outline-none focus:ring-2 focus:ring-inset',
                    isDark
                      ? 'hover:bg-gray-800 focus:ring-cyan-500/30'
                      : 'hover:bg-gray-50 focus:ring-blue-500/30',
                    isActive && (
                      isDark
                        ? 'bg-gray-800 ring-1 ring-gray-700'
                        : 'bg-gray-100 ring-1 ring-gray-300'
                    ),
                    setPresenceMutation.isPending && !isUpdatingThisOption ? 'opacity-50 cursor-not-allowed' : ''
                  )}
                >
                  {/* Option Icon */}
                  <div className={cn(
                    'p-2 rounded-lg',
                    isDark ? option.darkColor : option.lightColor
                  )}>
                    {option.icon}
                  </div>
                  
                  {/* Option Details */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        'text-sm font-medium',
                        isDark ? 'text-gray-300' : 'text-gray-900'
                      )}>
                        {option.label}
                      </span>
                      <div className="flex items-center gap-2">
                        {isActive && !isUpdatingThisOption && (
                          <CheckCircle className={cn(
                            'w-4 h-4',
                            isDark ? 'text-cyan-400' : 'text-blue-500'
                          )} />
                        )}
                        {isUpdatingThisOption && (
                          <Loader2 className="w-3 h-3 animate-spin text-gray-500" />
                        )}
                      </div>
                    </div>
                    <p className={cn(
                      'text-xs mt-0.5',
                      isDark ? 'text-gray-500' : 'text-gray-600'
                    )}>
                      {option.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Footer */}
          <div className="p-3 border-t border-gray-200/50 dark:border-gray-800/50">
            <p className={cn(
              'text-xs text-center',
              isDark ? 'text-gray-500' : 'text-gray-600'
            )}>
              Status updates in real-time across all devices
            </p>
          </div>
        </div>
      )}
      
      {/* Error State */}
      {isError && (
        <div className="absolute -top-2 -right-2" title="Error loading presence">
          <AlertCircle className="w-4 h-4 text-red-500" />
        </div>
      )}
    </div>
  );
};

export default React.memo(StaffPresence);