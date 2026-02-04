/**
 * ============================================================================
 * STAFF PRESENCE COMPONENT - ENTERPRISE EDITION
 * ============================================================================
 * 
 * Premium staff presence indicator with status management
 * Features:
 * - Blue-themed color palette (blue-500 primary with green, purple, orange accents)
 * - Status rings for visual clarity
 * - Enhanced contrast for accessibility
 * - Mobile-responsive design
 * - Real-time status updates
 * - Enterprise-grade UX with clear affordances
 * - Improved cursor feedback
 * - Compact layout for better space utilization
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Activity,
  Coffee,
  LogOut,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { cn } from '../../../utils/classNameUtils';
import { useGetMyPresence, useSetMyPresence } from '../../../../modules/administration/admin-module/api/staff-presence/StaffPresenceQueries';
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
  ringColor: string;
  bgColor: string;
  textColor: string;
  hoverBg: string;
}

const getStatusDisplay = (status: StaffPresenceStatus): string => {
  const labels: Record<StaffPresenceStatus, string> = {
    [StaffPresenceStatus.ON_DUTY]: 'On Duty',
    [StaffPresenceStatus.BUSY]: 'Busy',
    [StaffPresenceStatus.ON_BREAK]: 'On Break',
    [StaffPresenceStatus.UNAVAILABLE]: 'Unavailable',
    [StaffPresenceStatus.OFF_DUTY]: 'Off Duty',
  };
  return labels[status] || 'Off Duty';
};

const StaffPresence: React.FC<StaffPresenceProps> = ({ isDark, className }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { data: presenceData, isLoading, isError, isRefetching } = useGetMyPresence();
  const setPresenceMutation = useSetMyPresence();
  
  const currentPresence = presenceData?.data;
  const currentStatus = currentPresence?.status || StaffPresenceStatus.OFF_DUTY;
  const currentStatusLabel = currentPresence?.status_label || getStatusDisplay(currentStatus);
  
  const presenceOptions: PresenceOption[] = React.useMemo(() => [
  {
    id: StaffPresenceStatus.ON_DUTY,
    label: 'On Duty',
    description: 'You will receive patients',
    icon: <Activity className="w-3.5 h-3.5" />,
    ringColor: isDark ? 'ring-emerald-500/60' : 'ring-emerald-600/70',
    bgColor: isDark ? 'bg-emerald-500/15' : 'bg-emerald-50',
    textColor: isDark ? 'text-emerald-400' : 'text-emerald-700',
    hoverBg: isDark ? 'hover:bg-emerald-500/10' : 'hover:bg-emerald-100/70'
  },
  {
    id: StaffPresenceStatus.BUSY,
    label: 'Busy',
    description: 'You will receive patients (limited)',
    icon: <Zap className="w-3.5 h-3.5" />,
    ringColor: isDark ? 'ring-orange-500/60' : 'ring-orange-600/70',
    bgColor: isDark ? 'bg-orange-500/15' : 'bg-orange-50',
    textColor: isDark ? 'text-orange-400' : 'text-orange-700',
    hoverBg: isDark ? 'hover:bg-orange-500/10' : 'hover:bg-orange-100/70'
  },
  {
    id: StaffPresenceStatus.ON_BREAK,
    label: 'On Break',
    description: 'You will NOT receive patients',
    icon: <Coffee className="w-3.5 h-3.5" />,
    ringColor: isDark ? 'ring-blue-500/60' : 'ring-blue-600/70',
    bgColor: isDark ? 'bg-blue-500/15' : 'bg-blue-50',
    textColor: isDark ? 'text-blue-400' : 'text-blue-700',
    hoverBg: isDark ? 'hover:bg-blue-500/10' : 'hover:bg-blue-100/70'
  },
  {
    id: StaffPresenceStatus.UNAVAILABLE,
    label: 'Unavailable',
    description: 'You will NOT receive patients',
    icon: <Clock className="w-3.5 h-3.5" />,
    ringColor: isDark ? 'ring-purple-500/60' : 'ring-purple-600/70',
    bgColor: isDark ? 'bg-purple-500/15' : 'bg-purple-50',
    textColor: isDark ? 'text-purple-400' : 'text-purple-700',
    hoverBg: isDark ? 'hover:bg-purple-500/10' : 'hover:bg-purple-100/70'
  },
  {
    id: StaffPresenceStatus.OFF_DUTY,
    label: 'Off Duty',
    description: 'You will NOT receive patients',
    icon: <LogOut className="w-3.5 h-3.5" />,
    ringColor: isDark ? 'ring-gray-500/50' : 'ring-gray-400/60',
    bgColor: isDark ? 'bg-gray-500/10' : 'bg-gray-100',
    textColor: isDark ? 'text-gray-400' : 'text-gray-600',
    hoverBg: isDark ? 'hover:bg-gray-500/5' : 'hover:bg-gray-200/70'
  }
], [isDark]);

  
  const getStatusConfig = React.useCallback((status: StaffPresenceStatus): PresenceOption => {
    return presenceOptions.find(opt => opt.id === status) || presenceOptions[4];
  }, [presenceOptions]);
  
  const currentConfig = React.useMemo(() => getStatusConfig(currentStatus), [currentStatus, getStatusConfig]);
  
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
        note: `Status changed to ${option?.label || status}`
      });
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  };
  
  const isPending = isLoading || isRefetching || setPresenceMutation.isPending;
  
  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Status Button with Ring */}
      <button
        onClick={handlePresenceClick}
        disabled={isPending}
        aria-label="Manage presence status"
        aria-expanded={isDropdownOpen}
        className={cn(
          'group relative flex items-center gap-2 px-3 py-1.5 rounded-lg',
          'transition-all duration-200 cursor-pointer',
          'ring-1',
          currentConfig.ringColor,
          isDark 
            ? 'bg-gray-800/40 hover:bg-gray-800/70' 
            : 'bg-white hover:bg-gray-50',
          'focus:outline-none focus:ring-2',
          isDark ? 'focus:ring-blue-500/40' : 'focus:ring-blue-500/25',
          !isPending && 'hover:scale-[1.02] active:scale-[0.98]',
          isPending && 'opacity-75 cursor-not-allowed'
        )}
      >
        {/* Status Indicator with Ring */}
        <div className={cn(
          'relative flex items-center justify-center w-7 h-7 rounded-full',
          'ring-1 ring-offset-1',
          currentConfig.ringColor,
          currentConfig.bgColor,
          isDark ? 'ring-offset-gray-900' : 'ring-offset-white'
        )}>
          <div className={currentConfig.textColor}>
            {currentConfig.icon}
          </div>
          
          {/* Pulse Animation */}
          {currentStatus === StaffPresenceStatus.ON_DUTY && (
            <span className={cn(
              'absolute inset-0 rounded-full animate-ping opacity-25',
              currentConfig.bgColor
            )} />
          )}
        </div>
        
        {/* Status Text - Desktop Only */}
        <div className="hidden lg:flex flex-col items-start min-w-0">
          <span className={cn(
            'text-xs font-semibold truncate',
            isDark ? 'text-gray-100' : 'text-gray-900'
          )}>
            {isLoading ? 'Loading...' : currentStatusLabel}
          </span>
            <span className={cn(
            'text-xs truncate',
            isDark ? 'text-gray-100' : 'text-gray-900'
          )}>
            {isPending ? 'Syncing...' : 'Click to change'}
          </span>
        </div>
        
        {/* Chevron Indicator */}
        <ChevronDown className={cn(
          'hidden lg:block w-3 h-3 ml-auto transition-transform duration-200',
          isDark ? 'text-gray-400' : 'text-gray-500',
          isDropdownOpen && 'rotate-180'
        )} />
        
        {/* Loading Spinner */}
        {isPending && (
          <div className="absolute -top-1 -right-1">
            <Loader2 className={cn(
              'w-3 h-3 animate-spin',
              isDark ? 'text-blue-400' : 'text-blue-600'
            )} />
          </div>
        )}
      </button>
      
      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className={cn(
          'absolute right-0 mt-1.5 w-64 rounded-lg shadow-xl z-50',
          'animate-in slide-in-from-top-2 fade-in duration-150',
          'ring-1',
          isDark 
            ? 'bg-gray-900 ring-gray-700' 
            : 'bg-white ring-gray-200'
        )}>
          {/* Header - More Compact */}
          <div className={cn(
            'px-3 py-2 border-b',
            isDark ? 'border-gray-800' : 'border-gray-200'
          )}>
            <h3 className={cn(
              'text-xs font-bold mb-0.5',
              isDark ? 'text-gray-100' : 'text-gray-900'
            )}>
              Status
            </h3>
            <p className={cn(
              'text-xs',
              isDark ? 'text-gray-400' : 'text-gray-600'
            )}>
              {isLoading ? 'Loading...' : `Current: ${currentStatusLabel}`}
            </p>
          </div>
          
          {/* Status Options - More Compact */}
          <div className="p-1.5 space-y-0.5">
            {presenceOptions.map((option) => {
              const isActive = option.id === currentStatus;
              const isUpdating = setPresenceMutation.isPending && 
                               setPresenceMutation.variables?.status === option.id;
              
              return (
                <button
                  key={option.id}
                  onClick={() => handleSetPresence(option.id)}
                  disabled={setPresenceMutation.isPending}
                  className={cn(
                    'group/item w-full flex items-center gap-2.5 p-2 rounded-md',
                    'transition-all duration-150 cursor-pointer',
                    'focus:outline-none focus:ring-1 focus:ring-inset',
                    isDark ? 'focus:ring-blue-500/40' : 'focus:ring-blue-500/30',
                    option.hoverBg,
                    !setPresenceMutation.isPending && 'hover:scale-[1.01] active:scale-[0.99]',
                    isActive && (isDark 
                      ? 'bg-blue-500/10 ring-1 ring-blue-500/30' 
                      : 'bg-blue-50 ring-1 ring-blue-200/50'),
                    setPresenceMutation.isPending && !isUpdating && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  {/* Status Icon with Ring */}
                  <div className={cn(
                    'relative flex items-center justify-center w-8 h-8 rounded-full',
                    'ring-1',
                    option.ringColor,
                    option.bgColor,
                    'transition-all duration-150',
                    !isActive && 'group-hover/item:scale-105'
                  )}>
                    <div className={option.textColor}>
                      {option.icon}
                    </div>
                  </div>
                  
                  {/* Status Info */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        'text-xs font-semibold truncate',
                        isDark ? 'text-gray-200' : 'text-gray-900'
                      )}>
                        {option.label}
                      </span>
                      {isActive && !isUpdating && (
                        <CheckCircle2 className={cn(
                          'w-3 h-3 flex-shrink-0',
                          isDark ? 'text-blue-400' : 'text-blue-600'
                        )} />
                      )}
                    </div>
                    <p className={cn(
                      'text-xs mt-0.5 truncate',
                      isDark ? 'text-gray-500' : 'text-gray-600'
                    )}>
                      {option.description}
                    </p>
                  </div>
                  
                  {/* Loading Indicator */}
                  {isUpdating && (
                    <Loader2 className={cn(
                      'w-3 h-3 animate-spin flex-shrink-0',
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    )} />
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Footer - More Compact */}
          <div className={cn(
            'px-3 py-2 border-t',
            isDark ? 'border-gray-800 bg-gray-800/20' : 'border-gray-200 bg-gray-50/50'
          )}>
            <p className={cn(
              'text-xs text-center leading-relaxed',
              isDark ? 'text-gray-400' : 'text-gray-600'
            )}>
            Let others know your work status
            </p>
          </div>
        </div>
      )}
      
      {/* Error Indicator */}
      {isError && (
        <div 
          className="absolute -top-1 -right-1 z-10 cursor-help" 
          title="Failed to load presence status"
        >
          <div className={cn(
            'p-0.5 rounded-full',
            isDark ? 'bg-gray-900' : 'bg-white'
          )}>
            <AlertCircle className="w-3 h-3 text-red-500" />
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(StaffPresence);