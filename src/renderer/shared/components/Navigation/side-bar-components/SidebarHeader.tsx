import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../types/cn';
import { getRoleDisplayName as formatName } from '../../../utils/facilityRoleFormator';
import LogoImage from '../../../assets/LogoImage';
import { BrandName } from '../../../utils/BrandName';

interface SidebarHeaderProps {
  collapsed: boolean;
  isDark: boolean;
  contextSubtitle: string;
  onClose?: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  collapsed,
  isDark,
  contextSubtitle,
  onClose,
}) => {
  return (
    <div className={cn('shrink-0 p-3 border-b', isDark ? 'border-gray-800/50' : 'border-gray-200/50')}>
      <div className="flex items-center justify-between gap-3">
        <div
          className={cn(
            'flex items-center gap-3 flex-1 min-w-0 transition-all duration-300',
            collapsed && 'justify-center',
          )}
        >
          <LogoImage />

          {!collapsed && (
            <div className="min-w-0">
              <BrandName />
              <p className={cn('text-xs truncate', isDark ? 'text-blue-400' : 'text-blue-600')}>
                {formatName(contextSubtitle)}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className={cn(
            'p-2.5 rounded-xl transition-all duration-300 shrink-0',
            'hover:scale-105 active:scale-95',
            'lg:hidden',
            isDark
              ? 'hover:bg-red-500/10 text-gray-400 hover:text-red-400'
              : 'hover:bg-red-50 text-gray-600 hover:text-red-600',
          )}
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SidebarHeader;
