import type React from 'react';
import {
  Activity,
  AlertCircle,
  Bed,
  Briefcase,
  Building2,
  DoorOpen,
  FlaskConical,
  Home,
  Monitor,
  PillBottle,
  Users,
} from 'lucide-react';

import type {
  AssignSpaceFormData,
  ReleaseSpaceFormData,
  SpaceAllocationColors,
} from './space-allocation.types';

export const SPACE_TYPE_ICONS: Record<string, React.ElementType> = {
  consultation: Monitor,
  triage: AlertCircle,
  lab: FlaskConical,
  theatre: Activity,
  ward: Bed,
  pharmacy: PillBottle,
  office: Briefcase,
  meeting: Users,
  cubicle: Home,
  default: DoorOpen,
};

export const SPACE_TYPE_COLORS: Record<string, string> = {
  consultation: 'text-blue-500',
  triage: 'text-orange-500',
  lab: 'text-purple-500',
  theatre: 'text-red-500',
  ward: 'text-green-500',
  pharmacy: 'text-yellow-500',
  office: 'text-indigo-500',
  meeting: 'text-cyan-500',
  cubicle: 'text-gray-500',
  default: 'text-gray-400',
};

export const getEmptyAssignFormData = (
  facilityId: number | null
): AssignSpaceFormData => ({
  facility_id: facilityId,
  space_id: null,
  staff_id: null,
  note: '',
});

export const getEmptyReleaseFormData = (
  facilityId: number | null
): ReleaseSpaceFormData => ({
  facility_id: facilityId,
  staff_id: null,
  assignment_id: null,
  note: '',
});

export const createSpaceAllocationColors = (
  theme: 'light' | 'dark'
): SpaceAllocationColors => {
  const isDark = theme === 'dark';

  return {
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
      elevated: isDark ? 'bg-gray-800' : 'bg-white',
      hover: isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50',
    },
    border: {
      primary: isDark ? 'border-gray-800' : 'border-gray-200',
      secondary: isDark ? 'border-gray-700' : 'border-gray-300',
    },
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
    },
    accent: {
      primary: 'bg-blue-600',
      hover: isDark ? 'hover:bg-blue-600' : 'hover:bg-blue-700',
      text: 'text-white',
    },
  };
};

export const SPACE_STAT_ICONS = {
  total: Building2,
  occupied: Users,
  available: DoorOpen,
  rate: Activity,
};
