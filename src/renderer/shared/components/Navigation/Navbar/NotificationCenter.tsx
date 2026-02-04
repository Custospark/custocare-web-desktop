/**
 * ============================================================================
 * NOTIFICATION CENTER COMPONENT
 * ============================================================================
 * Real-time notifications with unread count badge
 */

import React from 'react';
import { Bell } from 'lucide-react';
import { cn } from '../../../utils/classNameUtils';
interface NotificationCenterProps {
  unreadCount: number;
  isOpen: boolean;
  isDark: boolean;
  onNotificationClick: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  unreadCount,
  isOpen,
  isDark,
  onNotificationClick,
}) => {
  return (
    <div className="relative">
      <button
        onClick={onNotificationClick}
        className={cn(
          'p-2 rounded-lg transition-all duration-300 hover:scale-105 relative cursor-pointer',
          isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
        )}
        title="Notifications"
      >
        <Bell className={cn(
          'w-5 h-5 transition-colors',
          isOpen 
            ? (isDark ? 'text-cyan-400' : 'text-blue-500') 
            : (isDark ? 'text-gray-400' : 'text-gray-600')
        )} />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-gradient-to-br from-orange-500 to-amber-500 text-white text-xs font-bold items-center justify-center shadow-lg">
              {unreadCount}
            </span>
          </span>
        )}
      </button>
    </div>
  );
};

export default React.memo(NotificationCenter);
