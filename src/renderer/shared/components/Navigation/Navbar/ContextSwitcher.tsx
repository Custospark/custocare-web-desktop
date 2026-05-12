/**
 * ============================================================================
 * CONTEXT SWITCHER COMPONENT
 * ============================================================================
 * Handles workspace switching between Personal Space, Professional Workspace,
 * and System Administration contexts
 */

import React, { useRef, useEffect } from 'react';
import {
  ChevronDown,
  Shield,
  Heart,
  Briefcase,
  Layers,
  Command,
  Check,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../../utils/classNameUtils';
import { getRoleDisplayName as formatName } from '../../../utils/facilityRoleFormator';

interface ContextOption {
  id: string;
  type: 'personal' | 'professional' | 'administrative';
  capability: string;
  facilityId?: number;
  facilityName?: string;
  facilityLogo?: string | null;
  roleCode?: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'rose' | 'amber' | 'emerald' | 'cyan' | 'indigo' | 'teal';
  isActive: boolean;
  navigateTo?: string;
}

interface GroupedContextOptions {
  personal: ContextOption[];
  professional: ContextOption[];
  administrative: ContextOption[];
}

interface ContextSwitcherProps {
  isOpen: boolean;
  onToggle: () => void;
  activeContextOption: ContextOption | undefined;
  groupedContextOptions: GroupedContextOptions;
  allContextOptions: ContextOption[];
  userName: string;
  isDark: boolean;
  isMobile: boolean;
  onContextSwitch: (option: ContextOption) => void;
}


export const ContextSwitcher: React.FC<ContextSwitcherProps> = ({
  isOpen,
  onToggle,
  activeContextOption,
  groupedContextOptions,
  allContextOptions,
  userName,
  isDark,
  isMobile,
  onContextSwitch,
}) => {
  const contextSwitcherRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextSwitcherRef.current && !contextSwitcherRef.current.contains(event.target as Node)) {
        if (isOpen) onToggle();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  const getContextColors = (color: ContextOption['color']) => {
    const colorMap = {
      blue: {
        bg: isDark ? 'bg-blue-500/20' : 'bg-blue-100',
        text: isDark ? 'text-blue-400' : 'text-blue-600',
        border: isDark ? 'border-blue-500/30' : 'border-blue-200',
        hover: isDark ? 'hover:bg-blue-500/30' : 'hover:bg-blue-200',
        active: isDark ? 'bg-blue-500/30 border-blue-500' : 'bg-blue-200 border-blue-500',
      },
      purple: {
        bg: isDark ? 'bg-purple-500/20' : 'bg-purple-100',
        text: isDark ? 'text-purple-400' : 'text-purple-600',
        border: isDark ? 'border-purple-500/30' : 'border-purple-200',
        hover: isDark ? 'hover:bg-purple-500/30' : 'hover:bg-purple-200',
        active: isDark ? 'bg-purple-500/30 border-purple-500' : 'bg-purple-200 border-purple-500',
      },
      rose: {
        bg: isDark ? 'bg-rose-500/20' : 'bg-rose-100',
        text: isDark ? 'text-rose-400' : 'text-rose-600',
        border: isDark ? 'border-rose-500/30' : 'border-rose-200',
        hover: isDark ? 'hover:bg-rose-500/30' : 'hover:bg-rose-200',
        active: isDark ? 'bg-rose-500/30 border-rose-500' : 'bg-rose-200 border-rose-500',
      },
      amber: {
        bg: isDark ? 'bg-amber-500/20' : 'bg-amber-100',
        text: isDark ? 'text-amber-400' : 'text-amber-600',
        border: isDark ? 'border-amber-500/30' : 'border-amber-200',
        hover: isDark ? 'hover:bg-amber-500/30' : 'hover:bg-amber-200',
        active: isDark ? 'bg-amber-500/30 border-amber-500' : 'bg-amber-200 border-amber-500',
      },
      emerald: {
        bg: isDark ? 'bg-emerald-500/20' : 'bg-emerald-100',
        text: isDark ? 'text-emerald-400' : 'text-emerald-600',
        border: isDark ? 'border-emerald-500/30' : 'border-emerald-200',
        hover: isDark ? 'hover:bg-emerald-500/30' : 'hover:bg-emerald-200',
        active: isDark ? 'bg-emerald-500/30 border-emerald-500' : 'bg-emerald-200 border-emerald-500',
      },
      cyan: {
        bg: isDark ? 'bg-cyan-500/20' : 'bg-cyan-100',
        text: isDark ? 'text-cyan-400' : 'text-cyan-600',
        border: isDark ? 'border-cyan-500/30' : 'border-cyan-200',
        hover: isDark ? 'hover:bg-cyan-500/30' : 'hover:bg-cyan-200',
        active: isDark ? 'bg-cyan-500/30 border-cyan-500' : 'bg-cyan-200 border-cyan-500',
      },
      indigo: {
        bg: isDark ? 'bg-indigo-500/20' : 'bg-indigo-100',
        text: isDark ? 'text-indigo-400' : 'text-indigo-600',
        border: isDark ? 'border-indigo-500/30' : 'border-indigo-200',
        hover: isDark ? 'hover:bg-indigo-500/30' : 'hover:bg-indigo-200',
        active: isDark ? 'bg-indigo-500/30 border-indigo-500' : 'bg-indigo-200 border-indigo-500',
      },
      teal: {
        bg: isDark ? 'bg-teal-500/20' : 'bg-teal-100',
        text: isDark ? 'text-teal-400' : 'text-teal-600',
        border: isDark ? 'border-teal-500/30' : 'border-teal-200',
        hover: isDark ? 'hover:bg-teal-500/30' : 'hover:bg-teal-200',
        active: isDark ? 'bg-teal-500/30 border-teal-500' : 'bg-teal-200 border-teal-500',
      },
    };
    return colorMap[color];
  };

  const getDropdownPosition = () => {
    if (isMobile) {
      return 'fixed left-1/2 -translate-x-1/2 top-20 w-[calc(100vw-2rem)] max-w-md';
    }
    return 'absolute right-0 mt-2 w-96';
  };

  const renderContextOption = (option: ContextOption) => {
    const colors = getContextColors(option.color);
    const hasFacilityLogo = option.type === 'professional' && option.facilityLogo;
    const facilityLogoUrl = hasFacilityLogo ? option.facilityLogo : null;
    
    return (
      <button
        key={option.id}
        onClick={() => onContextSwitch(option)}
        disabled={option.isActive}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer',
          'border',
          option.isActive
            ? colors.active
            : cn(
                colors.hover,
                'border-transparent',
                isDark ? 'text-gray-300' : 'text-gray-700'
              ),
          !option.isActive && 'hover:scale-[1.02] cursor-pointer',
          option.isActive && 'cursor-default'
        )}
        aria-label={`Switch to ${option.title}`}
        aria-current={option.isActive ? 'true' : 'false'}
      >
        {/* Icon or Logo */}
        <div className={cn(
          'p-2 rounded-lg flex items-center justify-center shrink-0',
          option.isActive
            ? colors.bg
            : (isDark ? 'bg-gray-800' : 'bg-gray-100')
        )}>
          {option.type === 'professional' && facilityLogoUrl ? (
            <img 
              src={facilityLogoUrl} 
              alt={option.facilityName || 'Facility'} 
              className="w-5 h-5 rounded object-cover"
              onError={(e) => {
                // Fallback to icon if image fails to load
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const iconElement = document.createElement('div');
                  iconElement.innerHTML = `<svg class="w-4 h-4 ${colors.text}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h-4m4 0h4m-8 0v-4m0 4h4m-4 0H7m0 0H3m4 0v-4m0 4h4"/></svg>`;
                  parent.appendChild(iconElement);
                }
              }}
            />
          ) : (
            <div className={option.isActive ? colors.text : ''}>
              {option.icon}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{option.title}</p>
          <p className={cn(
            'text-xs truncate',
            isDark ? 'text-gray-500' : 'text-gray-600'
          )}>
            {option.subtitle}
          </p>
        </div>
        {option.isActive && (
          <Check className={cn('w-4 h-4', colors.text)} />
        )}
      </button>
    );
  };

  if (!activeContextOption || allContextOptions.length === 0) return null;

  // Blue-green ring colors matching subscription component
  const ringColor = isDark ? 'ring-blue-500/60' : 'ring-blue-600/70';
  const hoverBg = isDark ? 'hover:bg-gray-800/70' : 'hover:bg-gray-50';

  // Get active facility logo for the button
  const activeHasLogo = activeContextOption.type === 'professional' && activeContextOption.facilityLogo;
  const activeLogoUrl = activeHasLogo ? activeContextOption.facilityLogo : null;

  return (
    <div ref={contextSwitcherRef} className="relative">
      <button
        onClick={onToggle}
        className={cn(
          'group relative flex items-center gap-2 px-3 py-2 rounded-lg',
          'transition-all duration-200 cursor-pointer',
          'ring-1',
          ringColor,
          isDark ? 'bg-gray-800/40' : 'bg-white',
          hoverBg,
          'focus:outline-none focus:ring-2',
          isDark ? 'focus:ring-blue-500/40' : 'focus:ring-blue-500/25',
          'hover:scale-[1.02] active:scale-[0.98]',
          'border shadow-sm',
          isDark ? 'border-gray-700' : 'border-gray-200'
        )}
        title="Switch workspace (⌘J)"
        aria-label="Switch workspace"
        aria-expanded={isOpen}
      >
        <div className={cn(
          'p-1.5 rounded-md transition-colors flex items-center justify-center',
          getContextColors(activeContextOption.color).bg
        )}>
          {activeContextOption.type === 'professional' && activeLogoUrl ? (
            <img 
              src={activeLogoUrl} 
              alt={activeContextOption.facilityName || 'Facility'} 
              className="w-5 h-5 rounded object-cover"
              onError={(e) => {
                // Fallback to icon if image fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className={getContextColors(activeContextOption.color).text}>
              {activeContextOption.icon}
            </div>
          )}
        </div>
        <div className="hidden lg:block text-left max-w-30">
          <p className={cn(
            'text-xs font-semibold leading-tight truncate',
            isDark ? 'text-gray-100' : 'text-gray-900'
          )}>
            {formatName(activeContextOption.title)}
          </p>
          <p className={cn(
            'text-xs leading-tight truncate',
            isDark ? 'text-gray-400' : 'text-gray-600'
          )}>
            {activeContextOption.subtitle}
          </p>
        </div>
        <ChevronDown className={cn(
          'w-4 h-4 transition-transform duration-200',
          isOpen && 'rotate-180',
          isDark ? 'text-gray-400' : 'text-gray-500'
        )} />
      </button>

      {isOpen && (
        <div className={cn(
          'rounded-xl border shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200',
          getDropdownPosition(),
          isDark 
            ? 'bg-gray-900 border-gray-800' 
            : 'bg-white border-gray-200'
        )}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50">
            <h3 className={cn(
              'font-semibold flex items-center gap-2',
              isDark ? 'text-gray-200' : 'text-gray-900'
            )}>
              <Layers className="w-4 h-4 text-blue-500" />
              Switch Workspace
            </h3>
            <p className={cn(
              'text-xs mt-1',
              isDark ? 'text-gray-400' : 'text-gray-600'
            )}>
              {userName} • All workspaces
            </p>
            <div className={cn(
              'mt-2 flex items-center gap-1.5 text-xs px-2 py-1 rounded-md',
              isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
            )}>
              <Command className="w-3 h-3" />
              <kbd className="font-mono">⌘J</kbd>
              <span>to open</span>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-3 space-y-2">
            {/* Personal Space */}
            {groupedContextOptions.personal.length > 0 && (
              <>
                <p className={cn(
                  'text-xs font-bold uppercase tracking-wide px-2 mb-2 mt-2',
                  isDark ? 'text-gray-500' : 'text-gray-600'
                )}>
                  <Heart className="w-3 h-3 inline mr-1" />
                  Personal Space
                </p>
                {groupedContextOptions.personal.map(renderContextOption)}
              </>
            )}

            {/* Professional Workspace */}
            {groupedContextOptions.professional.length > 0 && (
              <>
                <p className={cn(
                  'text-xs font-bold uppercase tracking-wide px-2 mb-2 mt-4',
                  isDark ? 'text-gray-500' : 'text-gray-600'
                )}>
                  <Briefcase className="w-3 h-3 inline mr-1" />
                  Professional Workspace
                </p>
                {groupedContextOptions.professional.map(renderContextOption)}
              </>
            )}

            {/* System Administration */}
            {groupedContextOptions.administrative.length > 0 && (
              <>
                <p className={cn(
                  'text-xs font-bold uppercase tracking-wide px-2 mb-2 mt-4',
                  isDark ? 'text-gray-500' : 'text-gray-600'
                )}>
                  <Shield className="w-3 h-3 inline mr-1" />
                  System Administration
                </p>
                {groupedContextOptions.administrative.map(renderContextOption)}
              </>
            )}

            {/* Helper text */}
            <div className={cn(
              'mt-4 p-3 rounded-lg border',
              isDark 
                ? 'bg-blue-500/5 border-blue-500/20' 
                : 'bg-blue-50 border-blue-200'
            )}>
              <p className={cn(
                'text-xs flex items-center gap-1',
                isDark ? 'text-blue-300' : 'text-blue-700'
              )}>
                <Sparkles className="w-3 h-3 flex-shrink-0" />
                <span>
                  All {allContextOptions.length} workspace{allContextOptions.length !== 1 ? 's' : ''} available. 
                  Switch anytime!
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ContextSwitcher);