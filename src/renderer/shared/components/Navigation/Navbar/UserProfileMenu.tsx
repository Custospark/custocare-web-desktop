/**
 * ============================================================================
 * USER PROFILE MENU COMPONENT
 * ============================================================================
 * User profile dropdown with account settings and logout
 */

import React, { useRef, useEffect } from 'react';
import { 
  User, 
  ChevronDown, 
  Settings, 
  LogOut, 
  Building2, 
  Activity 
} from 'lucide-react';
import { cn } from '../../../utils/classNameUtils';

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  route: string;
}

interface UserProfileMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  isDark: boolean;
  isMobile: boolean;
  userName?: string;
  userEmail?: string;
  currentCapabilityName: string;
  inStaffMode: boolean;
  inPatientMode: boolean;
  staffNumber?: string;
  patientNumber?: string;
  onLogout: () => void;
  onNavigate: (route: string) => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  isOpen,
  onToggle,
  isDark,
  isMobile,
  userName,
  userEmail,
  currentCapabilityName,
  inStaffMode,
  inPatientMode,
  staffNumber,
  patientNumber,
  onLogout,
  onNavigate,
}) => {
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        if (isOpen) onToggle();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  const menuItems: MenuItem[] = [
    { icon: User, label: 'My Profile', shortcut: '⌘P', route: '/staff/profile' },
    { icon: Settings, label: 'Settings', shortcut: '⌘,', route: '/settings' },
    { icon: Building2, label: 'Workspaces', route: '/workspaces' },
    { icon: Activity, label: 'Activity Log', route: '/activity' },
  ];

  const handleMenuItemClick = (route: string) => {
    onNavigate(route);
    onToggle();
  };

  return (
    <div ref={userDropdownRef} className="relative">
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2 pr-1 sm:pr-1.5 py-1 sm:py-1.5 rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer',
          isDark 
            ? 'hover:bg-gray-800' 
            : 'hover:bg-gray-100'
        )}
      >
        {userName && (
          <div className="text-left hidden lg:block">
            <p className={cn(
              'text-sm font-semibold truncate',
              isDark ? 'text-gray-200' : 'text-gray-900'
            )}>
              {userName}
            </p>
          </div>
        )}
        
        <div className="relative">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center ring-2 ring-blue-500/20">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
        </div>
        
        <ChevronDown className={cn(
          'w-4 h-4 transition-transform duration-200 hidden sm:block',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <div className={cn(
          'rounded-xl border shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200',
          isMobile 
            ? 'fixed left-1/2 -translate-x-1/2 top-20 w-[calc(100vw-2rem)] max-w-xs' 
            : 'absolute right-0 mt-2 w-72',
          isDark 
            ? 'bg-gray-900 border-gray-800' 
            : 'bg-white border-gray-200'
        )}>
          {/* Profile Header */}
          <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center ring-4 ring-blue-500/10">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
              </div>
              <div className="flex-1">
                {inStaffMode && staffNumber && (
                  <>
                    <p className={cn(
                      'font-bold',
                      isDark ? 'text-gray-200' : 'text-gray-900'
                    )}>
                      Staff Number
                    </p>
                    <p className={cn(
                      'font-bold',
                      isDark ? 'text-blue-200' : 'text-blue-500'
                    )}>
                      {staffNumber}
                    </p>
                  </>
                )}
                {inPatientMode && patientNumber && (
                  <>
                    <p className={cn(
                      'font-bold',
                      isDark ? 'text-gray-200' : 'text-gray-900'
                    )}>
                      Patient Number
                    </p>
                    <p className={cn(
                      'font-bold',
                      isDark ? 'text-blue-200' : 'text-blue-500'
                    )}>
                      {patientNumber}
                    </p>
                  </>
                )}
                <p className={cn(
                  'text-sm',
                  isDark ? 'text-gray-500' : 'text-gray-600'
                )}>
                  {currentCapabilityName}
                </p>
                <p className={cn(
                  'text-xs mt-0.5',
                  isDark ? 'text-gray-600' : 'text-gray-500'
                )}>
                  {userEmail || 'No email'}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleMenuItemClick(item.route)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group cursor-pointer',
                  isDark 
                    ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.shortcut && (
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded border',
                    isDark 
                      ? 'bg-gray-800 border-gray-700 text-gray-500' 
                      : 'bg-gray-100 border-gray-300 text-gray-600'
                  )}>
                    {item.shortcut}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Sign Out */}
          <div className="p-2 border-t border-gray-200/50 dark:border-gray-800/50">
            <button 
              onClick={onLogout}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
                isDark 
                  ? 'text-gray-400 hover:bg-orange-500/10 hover:text-orange-400' 
                  : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
              )}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(UserProfileMenu);
