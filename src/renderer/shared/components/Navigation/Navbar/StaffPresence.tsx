/**
 * ============================================================================
 * STAFF PRESENCE COMPONENT - ENTERPRISE EDITION
 * ============================================================================
 * 
 * Premium staff presence status management with real-time updates.
 * Features:
 * - Responsive design (mobile-optimized icon view, desktop expanded view)
 * - Accessible dropdown interface
 * - Enhanced contrast for WCAG compliance
 * - Real-time status synchronization
 * - Enterprise-grade visual polish
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Circle,
  Coffee,
  LogOut,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  Ban
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
  pulseColor: string;
}

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { 
    data: presenceData, 
    isLoading, 
    isError,
    isRefetching
  } = useGetMyPresence();
  
  const setPresenceMutation = useSetMyPresence();
  
  const currentPresence = presenceData?.data;
  const currentStatus = currentPresence?.status || StaffPresenceStatus.OFF_DUTY;
  const currentStatusLabel = currentPresence?.status_label || getStatusDisplay(currentStatus);
  
  const presenceOptions: PresenceOption[] = React.useMemo(() => [
    {
      id: StaffPresenceStatus.ON_DUTY,
      label: 'On Duty',
      description: 'Available for assignments',
      icon: <Circle className="w-4 h-4" fill="currentColor" />,
      color: 'blue',
      darkColor: 'text-blue-400 bg-blue-500/15',
      lightColor: 'text-blue-700 bg-blue-100',
      pulseColor: 'bg-blue-500'
    },
    {
      id: StaffPresenceStatus.BUSY,
      label: 'Busy',
      description: 'Engaged with tasks',
      icon: <Zap className="w-4 h-4" fill="currentColor" />,
      color: 'orange',
      darkColor: 'text-orange-400 bg-orange-500/15',
      lightColor: 'text-orange-700 bg-orange-100',
      pulseColor: 'bg-orange-500'
    },
    {
      id: StaffPresenceStatus.ON_BREAK,
      label: 'On Break',
      description: 'Taking a short break',
      icon: <Coffee className="w-4 h-4" />,
      color: 'purple',
      darkColor: 'text-purple-400 bg-purple-500/15',
      lightColor: 'text-purple-700 bg-purple-100',
      pulseColor: 'bg-purple-500'
    },
    {
      id: StaffPresenceStatus.UNAVAILABLE,
      label: 'Unavailable',
      description: 'Not available for assignments',
      icon: <Ban className="w-4 h-4" />,
      color: 'slate',
      darkColor: 'text-slate-400 bg-slate-500/15',
      lightColor: 'text-slate-700 bg-slate-100',
      pulseColor: 'bg-slate-500'
    },
    {
      id: StaffPresenceStatus.OFF_DUTY,
      label: 'Off Duty',
      description: 'End of shift',
      icon: <LogOut className="w-4 h-4" />,
      color: 'gray',
      darkColor: 'text-gray-400 bg-gray-500/15',
      lightColor: 'text-gray-700 bg-gray-100',
      pulseColor: 'bg-gray-500'
    }
  ], []);
  
  const getStatusConfig = React.useCallback((status: StaffPresenceStatus): PresenceOption => {
    return presenceOptions.find(opt => opt.id === status) || presenceOptions[4];
  }, [presenceOptions]);
  
  const getStatusIcon = React.useCallback(() => {
    const config = getStatusConfig(currentStatus);
    const iconElement = config.icon as React.ReactElement<any>;
    return React.cloneElement(iconElement, {
      ...(iconElement.props || {}),
      className: cn(
        'w-3.5 h-3.5 md:w-4 md:h-4',
        isDark ? config.darkColor.split(' ')[0] : config.lightColor.split(' ')[0]
      )
    });
  }, [currentStatus, isDark, getStatusConfig]);
  
  const getStatusColor = React.useCallback(() => {
    const config = getStatusConfig(currentStatus);
    return isDark ? config.darkColor : config.lightColor;
  }, [currentStatus, isDark, getStatusConfig]);
  
  const getStatusPulseColor = React.useCallback((): string => {
    const config = getStatusConfig(currentStatus);
    return config.pulseColor;
  }, [currentStatus, getStatusConfig]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
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
    }
  };
  
  const isPending = isLoading || isRefetching || setPresenceMutation.isPending;
  
  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Presence Toggle Button */}
      <button
        onClick={handlePresenceClick}
        disabled={isPending}
        className={cn(
          'group flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all duration-200',
          'hover:scale-[1.02] active:scale-[0.98]',
          'border shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2',
          isDark 
            ? 'border-slate-700/60 bg-slate-800/40 hover:bg-slate-800/60 hover:border-slate-600/60 focus:ring-blue-500/40 focus:ring-offset-slate-900 backdrop-blur-sm' 
            : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 focus:ring-blue-500/40 focus:ring-offset-white',
          isPending ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        )}
        aria-label="Set your presence status"
        aria-expanded={isDropdownOpen}
      >
        {/* Status Indicator with Pulse */}
        <div className="relative flex items-center justify-center">
          <div className={cn(
            'w-2 h-2 rounded-full',
            getStatusPulseColor(),
            !isPending && 'animate-pulse'
          )} />
          <div className={cn(
            'absolute inset-0 rounded-full blur-sm',
            getStatusPulseColor(),
            'opacity-40 group-hover:opacity-60 transition-opacity'
          )} />
        </div>
        
        {/* Status Icon */}
        <div className={cn(
          'flex items-center justify-center rounded-lg p-1.5 transition-colors',
          getStatusColor()
        )}>
          {getStatusIcon()}
        </div>
        
        {/* Status Text - Desktop Only */}
        <div className="hidden lg:flex items-center gap-2">
          <span className={cn(
            'text-sm font-semibold whitespace-nowrap transition-colors',
            isDark ? 'text-slate-200' : 'text-slate-800'
          )}>
            {isLoading ? 'Loading...' : currentStatusLabel}
          </span>
        </div>
        
        {/* Loading Spinner */}
        {isPending && (
          <Loader2 className={cn(
            'w-3.5 h-3.5 animate-spin',
            isDark ? 'text-slate-400' : 'text-slate-500'
          )} />
        )}
      </button>
      
      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className={cn(
          'absolute right-0 mt-2 w-72 rounded-2xl shadow-2xl z-50 overflow-hidden',
          'animate-in slide-in-from-top-2 fade-in-0 duration-200',
          'border backdrop-blur-md',
          isDark 
            ? 'bg-slate-900/95 border-slate-700/60' 
            : 'bg-white border-slate-200'
        )}>
          {/* Header */}
          <div className={cn(
            'p-4 border-b',
            isDark ? 'border-slate-800/60 bg-slate-800/30' : 'border-slate-100 bg-slate-50/50'
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2.5 rounded-xl shadow-sm',
                getStatusColor()
              )}>
                {getStatusIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  'font-bold text-sm tracking-tight',
                  isDark ? 'text-slate-100' : 'text-slate-900'
                )}>
                  Presence Status
                </h3>
                <p className={cn(
                  'text-xs mt-0.5 truncate',
                  isDark ? 'text-slate-400' : 'text-slate-600'
                )}>
                  {isLoading ? 'Loading status...' : 
                   setPresenceMutation.isPending ? 'Updating...' :
                   `Currently: ${currentStatusLabel}`}
                </p>
              </div>
            </div>
          </div>
          
          {/* Status Options */}
          <div className="p-2.5 space-y-1">
            {presenceOptions.map((option) => {
              const isActive = option.id === currentStatus;
              const isUpdatingThisOption = setPresenceMutation.isPending && 
                                          setPresenceMutation.variables?.status === option.id;
              
              return (
                <button
                  key={option.id}
                  onClick={() => handleSetPresence(option.id)}
                  disabled={setPresenceMutation.isPending}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-150',
                    'hover:scale-[1.01] active:scale-[0.99]',
                    'focus:outline-none focus:ring-2 focus:ring-inset',
                    'group/option',
                    isDark
                      ? 'hover:bg-slate-800/60 focus:ring-blue-500/40'
                      : 'hover:bg-slate-50 focus:ring-blue-500/40',
                    isActive && (
                      isDark
                        ? 'bg-slate-800/80 ring-1 ring-blue-500/30 shadow-sm'
                        : 'bg-blue-50 ring-1 ring-blue-200 shadow-sm'
                    ),
                    setPresenceMutation.isPending && !isUpdatingThisOption ? 
                      'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                  )}
                  aria-current={isActive}
                >
                  {/* Option Icon */}
                  <div className={cn(
                    'p-2.5 rounded-xl transition-all duration-150',
                    isDark ? option.darkColor : option.lightColor,
                    'group-hover/option:scale-105'
                  )}>
                    {option.icon}
                  </div>
                  
                  {/* Option Details */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        'text-sm font-semibold truncate',
                        isDark ? 'text-slate-200' : 'text-slate-900'
                      )}>
                        {option.label}
                      </span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isActive && !isUpdatingThisOption && (
                          <CheckCircle className={cn(
                            'w-4 h-4',
                            isDark ? 'text-blue-400' : 'text-blue-600'
                          )} />
                        )}
                        {isUpdatingThisOption && (
                          <Loader2 className={cn(
                            'w-4 h-4 animate-spin',
                            isDark ? 'text-blue-400' : 'text-blue-600'
                          )} />
                        )}
                      </div>
                    </div>
                    <p className={cn(
                      'text-xs mt-0.5 truncate',
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    )}>
                      {option.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Footer */}
          <div className={cn(
            'px-4 py-3 border-t',
            isDark ? 'border-slate-800/60 bg-slate-800/20' : 'border-slate-100 bg-slate-50/30'
          )}>
            <p className={cn(
              'text-xs text-center font-medium',
              isDark ? 'text-slate-500' : 'text-slate-500'
            )}>
              Real-time sync across all devices
            </p>
          </div>
        </div>
      )}
      
      {/* Error Indicator */}
      {isError && (
        <div 
          className="absolute -top-1 -right-1 animate-pulse" 
          role="alert"
          aria-label="Error loading presence"
        >
          <AlertCircle className={cn(
            'w-4 h-4',
            isDark ? 'text-red-400' : 'text-red-600'
          )} />
        </div>
      )}
    </div>
  );
};

export default React.memo(StaffPresence);