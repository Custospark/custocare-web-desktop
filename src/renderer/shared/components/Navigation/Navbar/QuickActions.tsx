/**
 * ============================================================================
 * QUICK ACTIONS COMPONENT
 * ============================================================================
 * Fast access to frequently used features with keyboard shortcuts
 */

import React, { useRef, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { cn } from '../../../utils/classNameUtils';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  badge?: number;
  color: string;
  description?: string;
}

interface QuickActionsProps {
  isOpen: boolean;
  onToggle: () => void;
  isDark: boolean;
  isMobile: boolean;
  actions: QuickAction[];
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  isOpen,
  onToggle,
  isDark,
  isMobile,
  actions,
}) => {
  const quickActionsRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        if (isOpen) onToggle();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  const getDropdownPosition = () => {
    if (isMobile) {
      return 'fixed left-1/2 -translate-x-1/2 top-20 w-[calc(100vw-2rem)] max-w-md';
    }
    return 'absolute right-0 mt-2 w-96';
  };

  return (
    <div ref={quickActionsRef} className="relative hidden lg:block">
      <button
        onClick={onToggle}
        className={cn(
          'p-2 rounded-lg transition-all duration-300 hover:scale-105 relative',
          isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
        )}
        title="Quick actions"
      >
        <Zap className={cn(
          'w-5 h-5 transition-colors',
          isOpen 
            ? (isDark ? 'text-cyan-400' : 'text-blue-500') 
            : (isDark ? 'text-gray-400' : 'text-gray-600')
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
          <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50">
            <h3 className={cn(
              'font-semibold flex items-center gap-2',
              isDark ? 'text-gray-200' : 'text-gray-900'
            )}>
              <Zap className="w-4 h-4 text-amber-500" />
              Quick Actions
            </h3>
            <p className={cn(
              'text-xs mt-1',
              isDark ? 'text-gray-500' : 'text-gray-600'
            )}>
              Access your most used features
            </p>
          </div>
          
          <div className="p-3 grid grid-cols-2 gap-2">
            {actions.map((action) => (
              <button
                key={action.id}
                className={cn(
                  'relative p-3 rounded-lg text-left transition-all duration-200 hover:scale-105 active:scale-95 group',
                  isDark 
                    ? 'hover:bg-gray-800 border border-gray-800' 
                    : 'hover:bg-gray-50 border border-gray-200'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    'p-1.5 rounded-lg',
                    `bg-${action.color}-500/10`
                  )}>
                    {action.icon}
                  </div>
                  {action.badge && (
                    <span className={cn(
                      'text-xs font-bold px-1.5 py-0.5 rounded-full',
                      isDark 
                        ? 'bg-cyan-500/20 text-cyan-300' 
                        : 'bg-blue-100 text-blue-700'
                    )}>
                      {action.badge}
                    </span>
                  )}
                </div>
                <p className={cn(
                  'text-sm font-medium mb-1',
                  isDark ? 'text-gray-300' : 'text-gray-700'
                )}>
                  {action.label}
                </p>
                <p className={cn(
                  'text-xs',
                  isDark ? 'text-gray-600' : 'text-gray-500'
                )}>
                  {action.description}
                </p>
                {action.shortcut && (
                  <div className={cn(
                    'mt-2 text-xs px-1.5 py-0.5 rounded border inline-block',
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-gray-500' 
                      : 'bg-gray-100 border-gray-300 text-gray-600'
                  )}>
                    {action.shortcut}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(QuickActions);
