import React, { useMemo } from 'react';
import {
  Clock,
  ClipboardList,
  Pill,
  Stethoscope,
  ArrowRightLeft,
  User,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { NursingRecentActivityItem } from '../../api/intelligence/nursingDashboardTypes';

interface NursingRecentActivityFeedProps {
  theme: 'light' | 'dark';
  refreshKey: number;
  items: NursingRecentActivityItem[] | undefined;
  isLoading: boolean;
}

function iconFor(type: NursingRecentActivityItem['type']) {
  switch (type) {
    case 'medication':
      return Pill;
    case 'task':
      return ClipboardList;
    case 'treatment':
      return Stethoscope;
    case 'handover':
      return ArrowRightLeft;
    default:
      return Clock;
  }
}

function colorsFor(type: NursingRecentActivityItem['type'], isDark: boolean) {
  switch (type) {
    case 'medication':
      return {
        iconColor: isDark ? 'text-green-400' : 'text-green-600',
        iconBg: isDark ? 'bg-green-900/30' : 'bg-green-50',
      };
    case 'task':
      return {
        iconColor: isDark ? 'text-blue-400' : 'text-blue-600',
        iconBg: isDark ? 'bg-blue-900/30' : 'bg-blue-50',
      };
    case 'treatment':
      return {
        iconColor: isDark ? 'text-purple-400' : 'text-purple-600',
        iconBg: isDark ? 'bg-purple-900/30' : 'bg-purple-50',
      };
    case 'handover':
      return {
        iconColor: isDark ? 'text-orange-400' : 'text-orange-600',
        iconBg: isDark ? 'bg-orange-900/30' : 'bg-orange-50',
      };
    default:
      return {
        iconColor: isDark ? 'text-gray-400' : 'text-gray-600',
        iconBg: isDark ? 'bg-gray-800' : 'bg-gray-100',
      };
  }
}

export const NursingRecentActivityFeed: React.FC<NursingRecentActivityFeedProps> = ({
  theme,
  refreshKey,
  items,
  isLoading,
}) => {
  const isDark = theme === 'dark';

  const rows = useMemo(() => items ?? [], [items]);

  if (isLoading && !items?.length) {
    return (
      <div
        className={`rounded-xl p-6 border animate-pulse ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        }`}
      >
        <div className={`h-6 w-40 rounded mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`h-16 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl p-6 border ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className={isDark ? 'text-gray-400' : 'text-gray-600'} />
          <h2 className="text-lg font-semibold">Recent activity</h2>
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {rows.length === 0 && (
          <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>No recent activity.</p>
        )}
        {rows.map((activity) => {
          const Icon = iconFor(activity.type);
          const c = colorsFor(activity.type, isDark);
          const when = activity.occurred_at
            ? formatDistanceToNow(new Date(activity.occurred_at), { addSuffix: true })
            : '';

          return (
            <div
              key={`${activity.id}-${refreshKey}`}
              className={`flex gap-3 p-3 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
              }`}
            >
              <div className={`p-2 rounded-lg ${c.iconBg} h-fit`}>
                <Icon className={`w-4 h-4 ${c.iconColor}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-sm">{activity.title}</h3>
                  {when && (
                    <span className={`text-xs whitespace-nowrap ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {when}
                    </span>
                  )}
                </div>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {activity.description}
                </p>
                <div className={`flex items-center gap-1 mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  <User className="w-3 h-3" />
                  <span>{activity.actor_name || '—'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
