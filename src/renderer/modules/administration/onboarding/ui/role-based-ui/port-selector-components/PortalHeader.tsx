/**
 * ============================================================================
 * PORTAL HEADER COMPONENT
 * ============================================================================
 * Responsive header with logo, theme toggle, logout, and user avatar.
 *
 * Profile image resolution order:
 *   1. auth slice → user.profile_photo_path  (resolved via resolveStorageUrl)
 *   2. DB fetch   → useGetUserProfile        (when auth slice path is absent)
 *   3. Fallback   → gradient avatar with User icon  (no external URL)
 */

import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Sun, Moon, User } from 'lucide-react';
import { cn } from '../../../../../../shared/types/cn';
import LogoImage from '../../../../../../shared/assets/LogoImage';
import { selectUser } from '../../../../../../app/store/slices/authSlice';           
import { resolveStorageUrl } from '../../../../../account/api/settings/profile/profileUtils';
import { useGetUserProfile } from '../../../../../account/api/settings/profile/ProfileQueries';
import { useConfirm } from '../../../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';

/* -------------------------------------------------------------------------- */
/*                         Internal Avatar Sub-component                       */
/* -------------------------------------------------------------------------- */

interface HeaderAvatarProps {
  src: string | null | undefined;
  alt: string;
  isDark: boolean;
}

/**
 * Renders the user avatar in the portal header.
 * - Has a photo  → circular <img> with blue ring
 * - No photo     → gradient circle with User icon (same ring)
 */
const HeaderAvatar: React.FC<HeaderAvatarProps> = ({ src, alt }) => (
  <div
    className={cn(
      'w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden shrink-0',
      'flex items-center justify-center',
      'bg-gradient-to-br from-blue-600 to-emerald-600',
      'border-2 border-blue-500 shadow-sm',
    )}
  >
    {src ? (
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        draggable={false}
      />
    ) : (
      <User className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
    )}
  </div>
);

/* -------------------------------------------------------------------------- */
/*                              Hook: resolve photo URL                        */
/* -------------------------------------------------------------------------- */

/**
 * Returns the resolved profile photo URL using the three-step fallback chain:
 *   auth slice  →  DB fetch  →  null (caller renders fallback icon)
 */
function useProfilePhotoUrl(
  userId: string | number | null | undefined,
  authPhotoPath: string | null | undefined,
): string | null {
  // Step 1 – resolve from auth slice (synchronous, no network)
  const fromAuth = authPhotoPath ? resolveStorageUrl(authPhotoPath) : null;

  // Step 2 – fetch from DB only when auth slice has no path
  const { data: profileData } = useGetUserProfile(userId ?? '', {
    enabled: !!userId && !authPhotoPath,
    staleTime: 5 * 60 * 1000,
  });

  if (fromAuth) return fromAuth;

  const dbPath = profileData?.data?.profile_photo_path;
  return dbPath ? resolveStorageUrl(dbPath) : null;
}

/* -------------------------------------------------------------------------- */
/*                               Component Props                               */
/* -------------------------------------------------------------------------- */

interface PortalHeaderProps {
  theme: 'light' | 'dark';
  /** Displayed next to the avatar (optional). */
  userName?: string;
  onToggleTheme: () => void;
  onLogout: () => void;
}

/* -------------------------------------------------------------------------- */
/*                               Main Component                                */
/* -------------------------------------------------------------------------- */

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  theme,
  userName,
  onToggleTheme,
  onLogout,
}) => {
  const isDark = theme === 'dark';
  const { confirm } = useConfirm();

  /* ── Redux user ── */
  const authUser = useSelector(selectUser);

  /* ── Resolved photo URL ── */
  const photoUrl = useProfilePhotoUrl(
    authUser?.id,
    authUser?.profile_photo_path,
  );

  /* ── Effective display name ── */
  const displayName = userName ?? authUser?.name ?? authUser?.profile?.display_name ?? 'User';

  /* ── Handle logout with confirmation ── */
  const handleLogoutClick = useCallback(async () => {
    const confirmed = await confirm({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out? You will need to log in again to access your account.',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      variant: 'info',
      theme,
    });

    if (confirmed) {
      onLogout();
    }
  }, [confirm, onLogout, theme]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b',
        isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-200',
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 sm:py-3">
        <div className="flex items-center justify-between gap-4 w-full">

          {/* ── Logo (left) ── */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="flex flex-col items-start shrink-0">
              <LogoImage />
              <span className="text-xs sm:text-sm font-medium bg-linear-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                Custocare AI
              </span>
            </div>
          </div>

          {/* ── Actions (right) ── */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">

            {/* Theme toggle */}
            <button
              onClick={onToggleTheme}
              className={cn(
                'p-2 rounded-lg transition-all duration-200 cursor-pointer',
                'hover:scale-105 active:scale-95',
                isDark
                  ? 'hover:bg-gray-800 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-600',
              )}
              aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            {/* Logout - Now with confirmation */}
            <button
              onClick={handleLogoutClick}
              className={cn(
                'px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg',
                'text-xs sm:text-sm font-medium whitespace-nowrap',
                'bg-blue-600 text-white hover:bg-blue-700',
                'transition-all duration-200 cursor-pointer',
                'hover:scale-105 active:scale-95',
              )}
            >
              Logout
            </button>

            {/* User avatar — real photo or fallback icon (NO external URL) */}
            <HeaderAvatar
              src={photoUrl}
              alt={displayName}
              isDark={isDark}
            />
          </div>
        </div>
      </div>
    </header>
  );
};