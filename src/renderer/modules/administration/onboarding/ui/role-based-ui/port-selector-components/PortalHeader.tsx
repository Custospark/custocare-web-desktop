/**
 * ============================================================================
 * PORTAL HEADER COMPONENT
 * ============================================================================
 * Responsive header with logo, theme toggle, logout, and user avatar
 */

import React from 'react';
import { Sun, Moon, User } from 'lucide-react';
import { useSelector } from 'react-redux';
import { cn } from '../../../../../../shared/types/cn';
import LogoImage from '../../../../../../shared/assets/LogoImage';
import { selectUser } from '../../../../../../app/store/slices/authSlice';
import { useGetUserProfile } from '../../../../../account/api/settings/profile/ProfileQueries';
import { resolveStorageUrl } from '../../../../../account/api/settings/profile/profileUtils';

interface PortalHeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onLogout: () => void;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  theme,
  onToggleTheme,
  onLogout,
}) => {
  const user = useSelector(selectUser);
  const userId = user?.id;
  
  // Fetch full profile if needed to get profile_photo_path
  const { data: profileData } = useGetUserProfile(userId || '', {
    enabled: !!userId && !user?.profile_photo_path, // Only fetch if we don't have photo path
  });

  // Get profile photo path from either auth user or fetched profile
  const profilePhotoPath = user?.profile_photo_path || profileData?.data?.profile_photo_path;
  
  // Resolve the full URL for the profile photo
  const avatarUrl = profilePhotoPath ? resolveStorageUrl(profilePhotoPath) : null;

  // Get user's display name
  const userName = user?.profile?.display_name || user?.name || user?.email || 'User';

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b',
        theme === 'dark' ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200'
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 sm:py-3">
        <div className="flex items-center justify-between gap-4 w-full">
          {/* Logo Section - Left aligned with text below logo */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="flex flex-col items-start shrink-0">
              <LogoImage />
              <span
                className={cn(
                  'text-xs sm:text-sm font-medium bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent',
                )}
              >
                Custocare AI
              </span>
            </div>
          </div>

          {/* Actions Section - Right aligned with consistent spacing */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className={cn(
                'p-2 rounded-lg transition-all duration-200 cursor-pointer',
                'hover:scale-105 active:scale-95',
                theme === 'dark'
                  ? 'hover:bg-gray-800 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-600'
              )}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? 
                <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : 
                <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
              }
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className={cn(
                'px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer',
                'bg-blue-600 text-white hover:bg-blue-700',
                'hover:scale-105 active:scale-95',
                'whitespace-nowrap'
              )}
            >
              Logout
            </button>

            {/* User Avatar - Now using actual profile image with fallback */}
            <div className={cn(
              'w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center overflow-hidden',
              'border-2 border-blue-500 shadow-sm flex-shrink-0',
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
            )}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className={cn(
                  'w-4 h-4 sm:w-5 sm:h-5',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                )} />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};