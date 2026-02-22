/**
 * ============================================================================
 * PORTAL HEADER COMPONENT
 * ============================================================================
 * Responsive header with logo, theme toggle, logout, and user avatar
 */

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '../../../../../../shared/types/cn';
import LogoImage from '../../../../../../shared/assets/LogoImage';

interface PortalHeaderProps {
  theme: 'light' | 'dark';
  userName?: string;
  avatarUrl?: string;
  onToggleTheme: () => void;
  onLogout: () => void;
}

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&q=80';

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  theme,
  userName,
  avatarUrl = DEFAULT_AVATAR,
  onToggleTheme,
  onLogout,
}) => {
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

            {/* User Avatar */}
            <img
              src={avatarUrl}
              alt={userName || 'User'}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-blue-500 shadow-sm flex-shrink-0"
            />
          </div>
        </div>
      </div>
    </header>
  );
};