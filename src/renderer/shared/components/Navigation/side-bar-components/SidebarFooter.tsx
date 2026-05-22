import React from 'react';
import { Bell, HeadphonesIcon, MessageSquareHeart, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../types/cn';
import { CUSTOCARE_HUB_ROUTES } from '../../../../app/routes/constants/custocare-hub.paths';

interface SidebarFooterProps {
  collapsed: boolean;
  isDark: boolean;
  displayName: string;
  inStaffMode: boolean;
  staffNumber?: string | null;
  inPatientMode: boolean;
  patientNumber?: string | null;
  sidebarPosition?: 'left' | 'right';
}

const SidebarFooter: React.FC<SidebarFooterProps> = ({
  collapsed,
  isDark,
  displayName,
  inStaffMode,
  staffNumber,
  inPatientMode,
  patientNumber,
  sidebarPosition = 'left',
}) => {
  const isRight = sidebarPosition === 'right';
  const navigate = useNavigate();
  return (
    <div className={cn('shrink-0 p-4 border-t', isDark ? 'border-gray-800/50' : 'border-gray-200/50')}>
      {!collapsed ? (
        <div className="space-y-3">
          <div
            className={cn(
              'p-3 rounded-xl border',
              isDark
                ? 'bg-linear-to-br from-gray-800/50 to-gray-800/30 border-gray-700/50'
                : 'bg-linear-to-br from-gray-50 to-gray-100/50 border-gray-200/50',
            )}
          >
            <div className={cn('flex items-center gap-3', isRight && 'flex-row-reverse')}>
              <div className={cn('p-2 rounded-lg shrink-0', isDark ? 'bg-cyan-500/20' : 'bg-cyan-100')}>
                <HeadphonesIcon className={cn('w-4 h-4', isDark ? 'text-cyan-400' : 'text-cyan-600')} />
              </div>

              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                  Quick Support
                </p>

                <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-3 mt-0.5">
                  <a
                    href="mailto:custocare@custospark.com"
                    className={cn(
                      'text-xs truncate hover:underline inline-flex items-center gap-1',
                      isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700',
                    )}
                  >
                    <span className="hidden xs:inline">✉️</span>
                    custocare@custospark.com
                  </a>

                  <a
                    href="tel:+256756697871"
                    className={cn(
                      'text-xs truncate hover:underline inline-flex items-center gap-1',
                      isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700',
                    )}
                  >
                    <span className="hidden xs:inline">📞</span>
                    +256 (756) 697-871
                  </a>

                  <button
                    onClick={() => navigate(CUSTOCARE_HUB_ROUTES.FEEDBACK_REQUESTS)}
                    className={cn(
                      'text-xs truncate hover:underline inline-flex items-center gap-1 cursor-pointer',
                      isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700',
                    )}
                  >
                    <MessageSquareHeart className="w-3 h-3" />
                    Send Feedback
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-semibold truncate', isDark ? 'text-white' : 'text-gray-900')}>
                {displayName}
              </p>
            </div>

            {inStaffMode && staffNumber && (
              <div className="flex-1 min-w-0">
                <p className={cn('truncate font-bold text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  Staff Number:{' '}
                  <span className={cn('truncate', isDark ? 'text-blue-300' : 'text-blue-500')}>
                    {staffNumber}
                  </span>
                </p>
              </div>
            )}

            {inPatientMode && patientNumber && (
              <div className="flex-1 min-w-0">
                <p className={cn('truncate font-bold text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
                  Patient Number:{' '}
                  <span className={cn('truncate', isDark ? 'text-blue-300' : 'text-blue-500')}>
                    {patientNumber}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            className={cn(
              'w-full p-2.5 rounded-xl transition-all duration-300',
              'hover:scale-105 active:scale-95',
              isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-100/50',
            )}
          >
            <Bell className="w-5 h-5 mx-auto text-gray-500 dark:text-gray-400" />
          </button>

          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-gray-700 to-gray-800 mx-auto overflow-hidden">
            <div className="w-full h-full bg-linear-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-white/80" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarFooter;
