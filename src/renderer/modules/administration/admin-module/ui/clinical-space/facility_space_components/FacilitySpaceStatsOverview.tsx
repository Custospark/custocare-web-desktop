import React, { useMemo } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronUp,
  Filter,
  XCircle,
} from 'lucide-react';
import type {
  FacilitySpace as FacilitySpaceEntity,
} from '../../../api/facility-space/FacilitySpaceTypes';

interface FacilitySpaceStatsOverviewProps {
  theme: 'light' | 'dark';
  spaces: FacilitySpaceEntity[];
  filteredCount: number;
  searchTerm: string;
}

export const FacilitySpaceStatsOverview: React.FC<FacilitySpaceStatsOverviewProps> = ({
  theme,
  spaces,
  filteredCount,
  searchTerm,
}) => {
  const isDark = theme === 'dark';

  const stats = useMemo(() => {
    const total = spaces.length;
    const active = spaces.filter((space) => space.is_active).length;
    const inactive = spaces.filter((space) => !space.is_active).length;
    const growth = total > 0 ? Math.floor(total * 0.2) : 0;
    const activeRate = total > 0 ? (active / total) * 100 : 0;

    return {
      total,
      active,
      inactive,
      filtered: filteredCount,
      growth,
      activeRate,
    };
  }, [spaces, filteredCount]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        className={`relative overflow-hidden rounded-xl p-5 transition-all duration-300 border-2 group cursor-pointer transform hover:-translate-y-1 ${
          isDark
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-blue-500/30 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20'
            : 'bg-gradient-to-br from-white to-blue-50/50 border-blue-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20'
        }`}
      >
        <div
          className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity ${
            isDark ? 'bg-blue-500/10' : 'bg-blue-500/5'
          }`}
        />

        <div className="flex items-center justify-between mb-3">
          <div
            className={`p-3 rounded-xl transition-all duration-300 ${
              isDark
                ? 'bg-blue-500/20 group-hover:bg-blue-500/30 group-hover:scale-110'
                : 'bg-blue-100 group-hover:bg-blue-200 group-hover:scale-110'
            }`}
          >
            <Building2 className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>

          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Total
          </span>
        </div>

        <p className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {stats.total}
        </p>

        <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Total Spaces
        </p>

        <div className="absolute bottom-3 right-3">
          <div className={isDark ? 'flex items-center gap-1 text-xs text-blue-400' : 'flex items-center gap-1 text-xs text-blue-600'}>
            <span>+{stats.growth}%</span>
            <ChevronUp className="w-3 h-3" />
          </div>
        </div>
      </div>

      <div
        className={`relative overflow-hidden rounded-xl p-5 transition-all duration-300 border-2 group cursor-pointer transform hover:-translate-y-1 ${
          isDark
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-green-500/30 hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/20'
            : 'bg-gradient-to-br from-white to-green-50/50 border-green-200 hover:border-green-400 hover:shadow-2xl hover:shadow-green-500/20'
        }`}
      >
        <div
          className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity ${
            isDark ? 'bg-green-500/10' : 'bg-green-500/5'
          }`}
        />

        <div className="flex items-center justify-between mb-3">
          <div
            className={`p-3 rounded-xl transition-all duration-300 ${
              isDark
                ? 'bg-green-500/20 group-hover:bg-green-500/30 group-hover:scale-110'
                : 'bg-green-100 group-hover:bg-green-200 group-hover:scale-110'
            }`}
          >
            <CheckCircle2 className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          </div>

          <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-500/20 text-green-500 border border-green-500/30">
            Active
          </span>
        </div>

        <p className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {stats.active}
        </p>

        <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Active Spaces
        </p>

        <div className="absolute bottom-3 right-3 w-16">
          <div className="h-1.5 bg-gray-700/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${stats.activeRate}%` }}
            />
          </div>
        </div>
      </div>

      <div
        className={`relative overflow-hidden rounded-xl p-5 transition-all duration-300 border-2 group cursor-pointer transform hover:-translate-y-1 ${
          isDark
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-red-500/30 hover:border-red-500/50 hover:shadow-2xl hover:shadow-red-500/20'
            : 'bg-gradient-to-br from-white to-red-50/50 border-red-200 hover:border-red-400 hover:shadow-2xl hover:shadow-red-500/20'
        }`}
      >
        <div
          className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity ${
            isDark ? 'bg-red-500/10' : 'bg-red-500/5'
          }`}
        />

        <div className="flex items-center justify-between mb-3">
          <div
            className={`p-3 rounded-xl transition-all duration-300 ${
              isDark
                ? 'bg-red-500/20 group-hover:bg-red-500/30 group-hover:scale-110'
                : 'bg-red-100 group-hover:bg-red-200 group-hover:scale-110'
            }`}
          >
            <XCircle className={`w-6 h-6 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          </div>

          <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-500/20 text-red-500 border border-red-500/30">
            Inactive
          </span>
        </div>

        <p className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {stats.inactive}
        </p>

        <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Inactive Spaces
        </p>

        {stats.inactive > 3 && (
          <div className="absolute top-3 right-3">
            <AlertCircle className="w-4 h-4 text-yellow-500 animate-pulse" />
          </div>
        )}
      </div>

      <div
        className={`relative overflow-hidden rounded-xl p-5 transition-all duration-300 border-2 group cursor-pointer transform hover:-translate-y-1 ${
          isDark
            ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-purple-500/30 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20'
            : 'bg-gradient-to-br from-white to-purple-50/50 border-purple-200 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/20'
        }`}
      >
        <div
          className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity ${
            isDark ? 'bg-purple-500/10' : 'bg-purple-500/5'
          }`}
        />

        <div className="flex items-center justify-between mb-3">
          <div
            className={`p-3 rounded-xl transition-all duration-300 ${
              isDark
                ? 'bg-purple-500/20 group-hover:bg-purple-500/30 group-hover:scale-110'
                : 'bg-purple-100 group-hover:bg-purple-200 group-hover:scale-110'
            }`}
          >
            <Filter className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
          </div>

          {searchTerm ? (
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-500/20 text-purple-500 border border-purple-500/30">
              Filtered
            </span>
          ) : null}
        </div>

        <p className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {stats.filtered}
        </p>

        <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Filtered Results
        </p>

        {searchTerm ? (
          <div className="absolute bottom-3 right-3">
            <div
              className={`text-xs px-2 py-1 rounded-full ${
                isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
              }`}
            >
              Search: {searchTerm}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default FacilitySpaceStatsOverview;
