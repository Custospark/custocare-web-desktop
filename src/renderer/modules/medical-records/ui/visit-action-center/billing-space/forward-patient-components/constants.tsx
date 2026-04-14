import {
  Activity,
  CheckCircle2,
  Clock,
  Users,
  XCircle,
} from 'lucide-react';

import { StaffPresenceStatus } from '../../../../../pharmacy/api/dispensing/visit-queue/visitTypes';
import type { StaffFilterStatus } from './schema';

export const statusOrder: Record<StaffPresenceStatus, number> = {
  [StaffPresenceStatus.ON_DUTY]: 0,
  [StaffPresenceStatus.BUSY]: 1,
  [StaffPresenceStatus.ON_BREAK]: 2,
  [StaffPresenceStatus.UNAVAILABLE]: 3,
  [StaffPresenceStatus.OFF_DUTY]: 4,
};

export const filterOptions: Array<{ value: StaffFilterStatus; label: string }> = [
  { value: 'available', label: 'Available' },
  { value: 'on_duty', label: 'On Duty' },
  { value: 'busy', label: 'Busy' },
  { value: 'all', label: 'All Staff' },
];

export const getFilterIcon = (value: StaffFilterStatus) => {
  if (value === 'available') return <CheckCircle2 className="w-4 h-4" />;
  if (value === 'on_duty') return <CheckCircle2 className="w-4 h-4" />;
  if (value === 'busy') return <Activity className="w-4 h-4" />;
  return <Users className="w-4 h-4" />;
};

export const getForwardPatientColors = (theme: 'light' | 'dark' = 'light') => {
  const isDark = theme === 'dark';

  return {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      hover: isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50',
      accent: 'bg-blue-600',
      accentHover: 'hover:bg-blue-700',
    },
    border: {
      primary: isDark ? 'border-gray-800' : 'border-gray-200',
      secondary: isDark ? 'border-gray-700' : 'border-gray-300',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
      accent: 'text-white',
    },
    status: {
      [StaffPresenceStatus.ON_DUTY]: {
        bg: 'bg-green-500/10',
        text: 'text-green-500',
        label: 'On Duty',
      },
      [StaffPresenceStatus.BUSY]: {
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-500',
        label: 'Busy',
      },
      [StaffPresenceStatus.ON_BREAK]: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-500',
        label: 'On Break',
      },
      [StaffPresenceStatus.UNAVAILABLE]: {
        bg: 'bg-purple-500/10',
        text: 'text-purple-500',
        label: 'Unavailable',
      },
      [StaffPresenceStatus.OFF_DUTY]: {
        bg: 'bg-gray-500/10',
        text: 'text-gray-500',
        label: 'Off Duty',
      },
    },
  };
};

export type ForwardPatientColors = ReturnType<typeof getForwardPatientColors>;

export const getStatusInfo = (
  colors: ForwardPatientColors,
  status: StaffPresenceStatus
) => {
  const statusInfo =
    colors.status[status] ?? colors.status[StaffPresenceStatus.OFF_DUTY];

  const icon = {
    [StaffPresenceStatus.ON_DUTY]: <CheckCircle2 className="w-4 h-4" />,
    [StaffPresenceStatus.BUSY]: <Activity className="w-4 h-4" />,
    [StaffPresenceStatus.ON_BREAK]: <Clock className="w-4 h-4" />,
    [StaffPresenceStatus.UNAVAILABLE]: <XCircle className="w-4 h-4" />,
    [StaffPresenceStatus.OFF_DUTY]: <XCircle className="w-4 h-4" />,
  }[status] ?? <XCircle className="w-4 h-4" />;

  return { ...statusInfo, icon };
};
