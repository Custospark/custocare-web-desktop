/**
 * ============================================================================
 * USER PROFILE MENU COMPONENT
 * ============================================================================
 * User profile dropdown with account settings and logout
 */

import React, { useRef, useEffect } from 'react';
import {
  ChevronDown,User, Shield, Palette,
  LogOut,
} from 'lucide-react';

import { useSelector } from 'react-redux';
import { cn } from '../../../utils/classNameUtils';
import { selectUser } from '../../../../app/store/slices/authSlice';
import { useGetUserProfile } from '../../../../modules/account/api/settings/profile/ProfileQueries';
import { resolveStorageUrl } from '../../../../modules/account/api/settings/profile/profileUtils';
import { ACCOUNT_ROUTES } from '../../../../app/routes/routeConstants';
import { useConfirm } from '../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';

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
  userName: propUserName,
  userEmail: propUserEmail,
  currentCapabilityName,
  inStaffMode,
  inPatientMode,
  staffNumber,
  patientNumber,
  onLogout,
  onNavigate,
}) => {
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const user = useSelector(selectUser);
  const userId = user?.id;
  const { confirm } = useConfirm();

  // Fetch full profile from DB only when auth slice has no photo path yet
  const { data: profileData } = useGetUserProfile(userId || '', {
    enabled: !!userId && !user?.profile_photo_path,
  });

  // Derived display values — auth slice is source of truth, props are fallback
  const displayName =
    user?.profile?.first_name || user?.profile?.display_name || propUserName || 'User';
  const email = user?.email || propUserEmail || 'No email';

  // Step 1: auth slice  →  Step 2: DB  →  Step 3: null (icon fallback)
  const profilePhotoPath =
    user?.profile_photo_path || profileData?.data?.profile_photo_path;
  const profilePhotoUrl = profilePhotoPath
    ? resolveStorageUrl(profilePhotoPath)
    : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        if (isOpen) onToggle();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  const handleLogoutClick = async () => {
    // Close the dropdown immediately for better UX
    onToggle();
    
    // Show confirmation dialog
    const confirmed = await confirm({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out? You will need to log in again to access your account.',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      variant: 'info', // Using info variant as requested
      theme: isDark ? 'dark' : 'light',
    });

    if (confirmed) {
      onLogout();
    }
  };

  const menuItems: MenuItem[] = [
    { 
      icon: User,           
      label: 'Profile Management',       
      shortcut: '⌘P', 
      route: ACCOUNT_ROUTES.SETTINGS_PROFILE 
    },
    { 
      icon: Shield,           
      label: 'Security & Authentication',   
      shortcut: '⌘K', 
      route: ACCOUNT_ROUTES.SETTINGS_SECURITY 
    },
    { 
      icon: Palette,       
      label: 'User Preferences',       
      shortcut: '⌘E', 
      route: ACCOUNT_ROUTES.SETTINGS_PREFERENCES 
    },
  ];

  const handleMenuItemClick = (route: string) => {
    onNavigate(route);
    onToggle();
  };

  const ringColor = isDark ? 'ring-blue-500/60' : 'ring-blue-600/70';
  const hoverBg   = isDark ? 'hover:bg-gray-800/70' : 'hover:bg-gray-50';

  return (
    <div ref={userDropdownRef} className="relative">

      {/* ── Trigger button ───────────────────────────────────────────── */}
      <button
        onClick={onToggle}
        className={cn(
          'group relative flex items-center gap-1 sm:gap-2',
          'pl-1 sm:pl-2 pr-1 sm:pr-1.5 py-1 sm:py-1.5 rounded-xl',
          'transition-all duration-200 cursor-pointer ring-1',
          ringColor,
          isDark ? 'bg-gray-800/40' : 'bg-white',
          hoverBg,
          'focus:outline-none focus:ring-2',
          isDark ? 'focus:ring-blue-500/40' : 'focus:ring-blue-500/25',
          'hover:scale-[1.02] active:scale-[0.98]',
        )}
      >
        {/* Name + capability (desktop only) */}
        {displayName && (
          <div className="text-left hidden lg:block">
            <p className={cn(
              'text-xs font-semibold truncate max-w-[120px]',
              isDark ? 'text-gray-100' : 'text-gray-900',
            )}>
              {displayName}
            </p>
            <p className={cn(
              'text-xs truncate max-w-[120px]',
              isDark ? 'text-gray-400' : 'text-gray-600',
            )}>
              {currentCapabilityName}
            </p>
          </div>
        )}

        {/* Small avatar */}
        <div className="relative">
          <div
            className={cn(
              'w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center overflow-hidden',
              !profilePhotoUrl && 'bg-linear-to-br from-blue-600 to-emerald-600 ring-2 ring-offset-1',
              !profilePhotoUrl && (isDark
                ? 'ring-offset-gray-900 ring-blue-500/40'
                : 'ring-offset-white ring-blue-500/30'),
            )}
          >
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <User className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
            )}
          </div>
          {/* Online status dot */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full" />
        </div>

        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform duration-200 hidden sm:block',
            isDark ? 'text-gray-400' : 'text-gray-500',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {/* ── Dropdown panel ───────────────────────────────────────────── */}
      {isOpen && (
        <div
          className={cn(
            'rounded-xl border shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200',
            isMobile
              ? 'fixed left-1/2 -translate-x-1/2 top-20 w-[calc(100vw-2rem)] max-w-xs'
              : 'absolute right-0 mt-2 w-72',
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
          )}
        >
          {/* Profile header */}
          <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50">
            <div className="flex items-center gap-3">

              {/* Large avatar */}
              <div className="relative shrink-0">
                <div
                  className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden',
                    !profilePhotoUrl && 'bg-linear-to-br from-blue-600 to-emerald-600 ring-4 ring-offset-2',
                    !profilePhotoUrl && (isDark
                      ? 'ring-offset-gray-900 ring-blue-500/20'
                      : 'ring-offset-white ring-blue-500/15'),
                  )}
                >
                  {profilePhotoUrl ? (
                    <img
                      src={profilePhotoUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <User className="w-7 h-7 text-white" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-gray-900 rounded-full" />
              </div>

              {/* Identity info */}
              <div className="flex-1 min-w-0">
                {inStaffMode && staffNumber && (
                  <>
                    <p className={cn(
                      'text-xs font-medium',
                      isDark ? 'text-gray-400' : 'text-gray-600',
                    )}>
                      Staff Number
                    </p>
                    <p className={cn(
                      'text-sm font-bold mb-1 truncate',
                      isDark ? 'text-gray-200' : 'text-gray-900',
                    )}>
                      {staffNumber}
                    </p>
                  </>
                )}

                {inPatientMode && patientNumber && (
                  <>
                    <p className={cn(
                      'text-xs font-medium',
                      isDark ? 'text-gray-400' : 'text-gray-600',
                    )}>
                      Patient Number
                    </p>
                    <p className={cn(
                      'text-sm font-bold mb-1 truncate',
                      isDark ? 'text-gray-200' : 'text-gray-900',
                    )}>
                      {patientNumber}
                    </p>
                  </>
                )}

                <p className={cn(
                  'text-xs font-medium truncate',
                  isDark ? 'text-blue-400' : 'text-blue-600',
                )}>
                  {currentCapabilityName}
                </p>

                <p className={cn(
                  'text-xs mt-1 truncate',
                  isDark ? 'text-gray-500' : 'text-gray-500',
                )}>
                  {email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-2">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleMenuItemClick(item.route)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm',
                  'transition-all duration-200 cursor-pointer',
                  isDark
                    ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.shortcut && (
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded border',
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-gray-500'
                      : 'bg-gray-100 border-gray-300 text-gray-600',
                  )}>
                    {item.shortcut}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Sign out */}
          <div className="p-2 border-t border-gray-200/50 dark:border-gray-800/50">
            <button
              onClick={handleLogoutClick}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                'transition-all duration-200 cursor-pointer',
                isDark
                  ? 'text-gray-400 hover:bg-orange-500/10 hover:text-orange-400'
                  : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600',
              )}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(UserProfileMenu);