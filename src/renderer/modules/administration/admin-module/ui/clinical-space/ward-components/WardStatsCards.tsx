import React, { useMemo } from 'react';
import {
  Building2,
  CheckCircle2,
  ChevronUp,
  Filter,
  Users,
} from 'lucide-react';

import { cn } from '../../../../../../shared/types/cn';
import { WardStatus, WardType, type Ward } from '../../../api/wards/wardTypes';
import { getWardTypeLabel } from './ward.utils';

interface WardStatsCardsProps {
  theme: 'light' | 'dark';
  wards: Ward[];
  filteredCount: number;
  searchTerm: string;
  typeFilter: WardType | 'all';
  statusFilter: WardStatus | 'all';
}

export const WardStatsCards: React.FC<WardStatsCardsProps> = ({
  theme,
  wards,
  filteredCount,
  searchTerm,
  typeFilter,
  statusFilter,
}) => {
  const isDark = theme === 'dark';

  const stats = useMemo(() => {
    const total = wards.length;
    const active = wards.filter(w => w.status === WardStatus.ACTIVE).length;
    const operationalCapacity = wards.reduce(
      (sum, ward) => sum + (ward.capacity_operational || 0),
      0
    );
    const declaredCapacity = wards.reduce(
      (sum, ward) => sum + (ward.capacity_declared || 0),
      0
    );

    return {
      total,
      active,
      operationalCapacity,
      declaredCapacity,
      activePercentage: total > 0 ? (active / total) * 100 : 0,
    };
  }, [wards]);

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
          {stats.total}
        </p>

        <p className={cn('text-sm font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>
          Total Wards
        </p>

        <div className="absolute bottom-3 right-3">
          <div className={cn('flex items-center gap-1 text-xs', isDark ? 'text-blue-400' : 'text-blue-600')}>
            <span>+{stats.total > 0 ? Math.floor(stats.total * 0.15) : 0}%</span>
            <ChevronUp className="w-3 h-3" />
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
            <CheckCircle2 className={cn('w-6 h-6', isDark ? 'text-green-400' : 'text-green-600')} />
          </div>

          <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-500/20 text-green-500 border border-green-500/30">
            Active
          </span>
        </div>

        <p className={cn('text-3xl font-bold mb-1', isDark ? 'text-white' : 'text-gray-900')}>
          {stats.active}
        </p>

        <p className={cn('text-sm font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>
          Active Wards
        </p>

        <div className="absolute bottom-3 right-3 w-16">
          <div className="h-1.5 bg-gray-700/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${stats.activePercentage}%` }}
            />
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

          <span
            className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            )}
          >
            Beds
          </span>
        </div>

        <p className={cn('text-3xl font-bold mb-1', isDark ? 'text-white' : 'text-gray-900')}>
          {stats.operationalCapacity}
        </p>

        <p className={cn('text-sm font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>
          Total Capacity
        </p>

        <div className="absolute bottom-3 right-3">
          <div className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
            Declared: {stats.declaredCapacity}
          </div>
        </div>
      </div>

      <div
        className={cn(
          'relative overflow-hidden rounded-xl p-5 transition-all duration-300 border-2 group cursor-pointer transform hover:-translate-y-1',
          isDark
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-orange-500/30 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/20'
            : 'bg-gradient-to-br from-white to-orange-50/50 border-orange-200 hover:border-orange-400 hover:shadow-2xl hover:shadow-orange-500/20'
        )}
      >
        <div
          className={cn(
            'absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl transition-opacity opacity-0',
            isDark ? 'bg-orange-500/10 group-hover:opacity-100' : 'bg-orange-500/5 group-hover:opacity-100'
          )}
        />

        <div className="flex items-center justify-between mb-3">
          <div
            className={cn(
              'p-3 rounded-xl transition-all duration-300',
              isDark
                ? 'bg-orange-500/20 group-hover:bg-orange-500/30 group-hover:scale-110'
                : 'bg-orange-100 group-hover:bg-orange-200 group-hover:scale-110'
            )}
          >
            <Filter className={cn('w-6 h-6', isDark ? 'text-orange-400' : 'text-orange-600')} />
          </div>

          {searchTerm && (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-500/20 text-orange-500 border border-orange-500/30">
              Filtered
            </span>
          )}
        </div>

        <p className={cn('text-3xl font-bold mb-1', isDark ? 'text-white' : 'text-gray-900')}>
          {filteredCount}
        </p>

        <p className={cn('text-sm font-medium', isDark ? 'text-gray-400' : 'text-gray-600')}>
          Filtered Results
        </p>

        {searchTerm && (
          <div className="absolute bottom-3 right-3">
            <div
              className={cn(
                'text-xs px-2 py-1 rounded-full',
                isDark ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700'
              )}
            >
              Search: {searchTerm.length > 10 ? `${searchTerm.slice(0, 10)}...` : searchTerm}
            </div>
          </div>
        )}

        {!searchTerm && (typeFilter !== 'all' || statusFilter !== 'all') && (
          <div className="absolute bottom-3 right-3 flex gap-1 flex-wrap justify-end">
            {typeFilter !== 'all' && (
              <span
                className={cn(
                  'text-xs px-2 py-1 rounded-full',
                  isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                )}
              >
                {getWardTypeLabel(typeFilter).split(' ')[0]}
              </span>
            )}

            {statusFilter !== 'all' && (
              <span
                className={cn(
                  'text-xs px-2 py-1 rounded-full',
                  statusFilter === WardStatus.ACTIVE
                    ? 'bg-green-500/20 text-green-500'
                    : statusFilter === WardStatus.INACTIVE
                      ? 'bg-red-500/20 text-red-500'
                      : 'bg-yellow-500/20 text-yellow-500'
                )}
              >
                {statusFilter}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WardStatsCards;
