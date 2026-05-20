import React from 'react';
import { UserPlus } from 'lucide-react';

import type { ForwardPatientColors } from './constants';

export interface HeaderProps {
  isDark: boolean;
  colors: ForwardPatientColors;
  hasLoadedInitialData: boolean;
  staffCount: number;
}

export const ForwardPatientHeader: React.FC<HeaderProps> = ({
  isDark,
  colors,
  hasLoadedInitialData,
  staffCount,
}) => {
  return (
    <div className={`p-6 border-b ${colors.border.primary}`}>
      <div className="flex items-center gap-3 mb-4">
        <UserPlus className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />

        <div className="flex-1">
          <h2 className={`text-xl font-bold ${colors.text.primary}`}>
            Forward Patient
          </h2>
          <p className={colors.text.secondary}>
            Send to a team queue or assign to a specific Team member.
          </p>
        </div>

        {hasLoadedInitialData && (
          <div
            className={`text-xs px-2 py-1 rounded cursor-default ${
              isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-800'
            }`}
          >
            ✓ Staff directory updated • {staffCount} active members
          </div>
        )}
      </div>
    </div>
  );
};
