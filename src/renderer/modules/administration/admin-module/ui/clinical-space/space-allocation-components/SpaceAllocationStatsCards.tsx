import React from 'react';
import {
  Activity,
  Building2,
  ChevronUp,
  DoorOpen,
  Users,
} from 'lucide-react';

import { cn } from '../../../../../../shared/types/cn';

interface SpaceAllocationStatsCardsProps {
  theme: 'light' | 'dark';
  totalCapacity: number;
  occupiedCount: number;
  availableCount: number;
  occupancyRate: number;
}

export const SpaceAllocationStatsCards: React.FC<SpaceAllocationStatsCardsProps> = ({
  theme,
  totalCapacity,
  occupiedCount,
  availableCount,
  occupancyRate,
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      <div
        className={cn(
          'relative overflow-hidden rounded-xl p-5 transition-all duration-300 border-2 group cursor-pointer transform hover:-translate-y-1',
          isDark
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/30 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20'
            : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20'
        )}
      >
        <div
          className={cn(
            'absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity opacity-0',
            isDark ? 'bg-blue-500/10 group-hover:opacity-100' : 'bg-blue-500/5 group-hover:opacity-100'
          )}
        />

        <div className="flex items-center justify-between mb-3">
          <div
            className={cn(
              'p-3 rounded-xl transition-all duration-300',
              isDark
                ? 'bg-blue-500/20 group-hover:bg-blue-500/30 group-hover:scale-110'
                : 'bg-blue-100 group-hover:bg-blue-200 group-hover:scale-110'
            )}
          >
            <Building2 className={cn('w-6 h-6', isDark ? 'text-blue-400' : 'text-blue-600')} />
          </div>
          <span
            className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            )}
          >
            Total
          </span>
        </div>

        <p className={cn('text-3xl font-bold mb-1', isDark ? 'text-white' : 'text-gray-900')}>
          {totalCapacity}
        </p>
        <p className={cn('text-sm font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>
          Total Spaces
        </p>

        <div className="absolute bottom-3 right-3">
          <div className={cn('flex items-center gap-1 text-xs', isDark ? 'text-blue-400' : 'text-blue-600')}>
            <span>+{totalCapacity > 0 ? Math.floor(totalCapacity * 0.1) : 0}%</span>
            <ChevronUp className="w-3 h-3" />
          </div>
        </div>
      </div>

      <div
        className={cn(
          'relative overflow-hidden rounded-xl p-5 transition-all duration-300 border-2 group cursor-pointer transform hover:-translate-y-1',
          isDark
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-purple-500/30 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20'
            : 'bg-gradient-to-br from-white to-purple-50/50 border-purple-200 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/20'
        )}
      >
        <div
          className={cn(
            'absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity opacity-0',
            isDark ? 'bg-purple-500/10 group-hover:opacity-100' : 'bg-purple-500/5 group-hover:opacity-100'
          )}
        />

        <div className="flex items-center justify-between mb-3">
          <div
            className={cn(
              'p-3 rounded-xl transition-all duration-300',
              isDark
                ? 'bg-purple-500/20 group-hover:bg-purple-500/30 group-hover:scale-110'
                : 'bg-purple-100 group-hover:bg-purple-200 group-hover:scale-110'
            )}
          >
            <Users className={cn('w-6 h-6', isDark ? 'text-purple-400' : 'text-purple-600')} />
          </div>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-500/20 text-purple-500 border border-purple-500/30">
            Occupied
          </span>
        </div>

        <p className={cn('text-3xl font-bold mb-1', isDark ? 'text-white' : 'text-gray-900')}>
          {occupiedCount}
        </p>
        <p className={cn('text-sm font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>
          Occupied Spaces
        </p>

        <div className="absolute bottom-3 right-3 w-16">
          <div className="h-1.5 bg-gray-700/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${totalCapacity > 0 ? (occupiedCount / totalCapacity) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div
        className={cn(
          'relative overflow-hidden rounded-xl p-5 transition-all duration-300 border-2 group cursor-pointer transform hover:-translate-y-1',
          isDark
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-green-500/30 hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/20'
            : 'bg-gradient-to-br from-white to-green-50/50 border-green-200 hover:border-green-400 hover:shadow-2xl hover:shadow-green-500/20'
        )}
      >
        <div
          className={cn(
            'absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity opacity-0',
            isDark ? 'bg-green-500/10 group-hover:opacity-100' : 'bg-green-500/5 group-hover:opacity-100'
          )}
        />

        <div className="flex items-center justify-between mb-3">
          <div
            className={cn(
              'p-3 rounded-xl transition-all duration-300',
              isDark
                ? 'bg-green-500/20 group-hover:bg-green-500/30 group-hover:scale-110'
                : 'bg-green-100 group-hover:bg-green-200 group-hover:scale-110'
            )}
          >
            <DoorOpen className={cn('w-6 h-6', isDark ? 'text-green-400' : 'text-green-600')} />
          </div>
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-500/20 text-green-500 border border-green-500/30">
            Available
          </span>
        </div>

        <p className={cn('text-3xl font-bold mb-1', isDark ? 'text-white' : 'text-gray-900')}>
          {availableCount}
        </p>
        <p className={cn('text-sm font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>
          Available Spaces
        </p>

        {availableCount > 5 && (
          <div className="absolute top-3 right-3">
            <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-500 border border-green-500/30">
              Ready to assign
            </span>
          </div>
        )}
      </div>

      <div
        className={cn(
          'relative overflow-hidden rounded-xl p-5 transition-all duration-300 border-2 group cursor-pointer transform hover:-translate-y-1',
          isDark
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-amber-500/30 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/20'
            : 'bg-gradient-to-br from-white to-amber-50/50 border-amber-200 hover:border-amber-400 hover:shadow-2xl hover:shadow-amber-500/20'
        )}
      >
        <div
          className={cn(
            'absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity opacity-0',
            isDark ? 'bg-amber-500/10 group-hover:opacity-100' : 'bg-amber-500/5 group-hover:opacity-100'
          )}
        />

        <div className="flex items-center justify-between mb-3">
          <div
            className={cn(
              'p-3 rounded-xl transition-all duration-300',
              isDark
                ? 'bg-amber-500/20 group-hover:bg-amber-500/30 group-hover:scale-110'
                : 'bg-amber-100 group-hover:bg-amber-200 group-hover:scale-110'
            )}
          >
            <Activity className={cn('w-6 h-6', isDark ? 'text-amber-400' : 'text-amber-600')} />
          </div>
          <span
            className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            )}
          >
            Rate
          </span>
        </div>

        <div className="flex items-end gap-1 mb-1">
          <p className={cn('text-3xl font-bold', isDark ? 'text-white' : 'text-gray-900')}>
            {occupancyRate}
          </p>
          <span className={cn('text-lg font-semibold mb-0.5', isDark ? 'text-gray-500' : 'text-gray-400')}>
            %
          </span>
        </div>

        <p className={cn('text-sm font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>
          Occupancy Rate
        </p>

        <div className="absolute bottom-3 right-3">
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className={isDark ? 'text-gray-700' : 'text-gray-200'}
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - occupancyRate / 100)}`}
                className={cn(
                  'transition-all duration-500',
                  occupancyRate > 80
                    ? 'text-red-500'
                    : occupancyRate > 50
                      ? 'text-amber-500'
                      : 'text-green-500'
                )}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className={cn(
                  'text-xs font-bold',
                  occupancyRate > 80
                    ? 'text-red-500'
                    : occupancyRate > 50
                      ? 'text-amber-500'
                      : 'text-green-500'
                )}
              >
                {occupancyRate}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceAllocationStatsCards;
