import React from 'react';
import {
  Beaker,
  CheckCircle,
  CheckCircle2,
  Clock3,
  Syringe,
  XCircle,
} from 'lucide-react';
import { cn } from '../../../../../../../shared/utils/classNameUtils';
import type {
  LabRequestItemStatus as LabRequestItemStatusType,
} from '../../../../../api/lab/LabTypes';
import { LabRequestItemStatus } from '../../../../../api/lab/LabTypes';
import type { ColorTokens } from '../labRequestForm.types';
import type { ColorTokens as LabResultColorTokens } from '../../labresult-form-components/labResultForm.types';

export const badgeBase = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium';

export const getItemStatusBadgeColor = (
  status: LabRequestItemStatusType | undefined,
  isDark: boolean
): string => {
  if (!status) return isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700';

  const statusColors: Record<LabRequestItemStatusType, string> = {
    [LabRequestItemStatus.PENDING]: isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-700',
    [LabRequestItemStatus.SAMPLE_COLLECTED]: isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700',
    [LabRequestItemStatus.IN_PROGRESS]: isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700',
    [LabRequestItemStatus.COMPLETED]: isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700',
    [LabRequestItemStatus.VERIFIED]: isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-100 text-emerald-700',
    [LabRequestItemStatus.CANCELLED]: isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700',
  };

  return statusColors[status];
};

export const getItemStatusIcon = (status: LabRequestItemStatusType | undefined) => {
  switch (status) {
    case LabRequestItemStatus.PENDING:
      return <Clock3 className="h-3 w-3" />;
    case LabRequestItemStatus.SAMPLE_COLLECTED:
      return <Syringe className="h-3 w-3" />;
    case LabRequestItemStatus.IN_PROGRESS:
      return <Beaker className="h-3 w-3" />;
    case LabRequestItemStatus.COMPLETED:
      return <CheckCircle2 className="h-3 w-3" />;
    case LabRequestItemStatus.VERIFIED:
      return <CheckCircle className="h-3 w-3" />;
    case LabRequestItemStatus.CANCELLED:
      return <XCircle className="h-3 w-3" />;
    default:
      return <Beaker className="h-3 w-3" />;
  }
};

export const adaptColorsForResultModal = (
  colors: ColorTokens,
  isDark: boolean
): LabResultColorTokens => {
  return {
    bg: {
      page: colors.bg?.card ?? (isDark ? '#1f2937' : '#ffffff'),
      card: colors.bg?.card ?? (isDark ? '#1f2937' : '#ffffff'),
      input: colors.bg?.input ?? (isDark ? '#374151' : '#f9fafb'),
      subtle: colors.bg?.subtle ?? (isDark ? '#374151' : '#f3f4f6'),
      hover: colors.bg?.hover ?? (isDark ? '#4b5563' : '#e5e7eb'),
      muted: colors.bg?.muted ?? (isDark ? '#6b7280' : '#9ca3af'),
      modal: colors.bg?.modal ?? (isDark ? '#1f2937' : '#ffffff'),
      accent: colors.bg?.hover ?? (isDark ? '#4b5563' : '#e5e7eb'),
    },
    text: {
      primary: colors.text?.primary ?? (isDark ? '#f9fafb' : '#111827'),
      secondary: colors.text?.secondary ?? (isDark ? '#d1d5db' : '#6b7280'),
      tertiary: colors.text?.tertiary ?? (isDark ? '#9ca3af' : '#9ca3af'),
      brand: colors.text?.brand ?? '#3b82f6',
      danger: '#ef4444',
      success: '#10b981',
      warning: '#f59e0b',
    },
    border: {
      primary: colors.border?.primary ?? (isDark ? '#374151' : '#e5e7eb'),
      subtle: colors.border?.subtle ?? (isDark ? '#374151' : '#e5e7eb'),
      focus: colors.border?.focus ?? '#3b82f6',
      accent: colors.border?.primary ?? (isDark ? '#374151' : '#e5e7eb'),
    },
  };
};

export const getWorkflowStep = (status: LabRequestItemStatusType | undefined): number => {
  switch (status) {
    case LabRequestItemStatus.PENDING:
      return 1;
    case LabRequestItemStatus.SAMPLE_COLLECTED:
      return 2;
    case LabRequestItemStatus.IN_PROGRESS:
      return 3;
    case LabRequestItemStatus.COMPLETED:
      return 4;
    case LabRequestItemStatus.VERIFIED:
      return 5;
    default:
      return 0;
  }
};

export const getDraftBadgeColor = (isDark: boolean): string => {
  return isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700';
};

export const formatStaffName = (
  staff: { name: string | null; professional_title?: string | null } | null | undefined
): string => {
  if (!staff?.name) return 'Unknown clinician';

  const title = staff.professional_title || 'Dr.';
  const titlePrefix = title.toLowerCase().includes('dr') ? '' : 'Dr. ';
  return `${titlePrefix}${staff.name}`;
};

export const formatTurnaroundTimeWithMinutes = (hours: number | null | undefined): string => {
  if (hours == null) return 'N/A';

  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }

  if (hours < 24) {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);

    if (minutes === 0) {
      return `${wholeHours} hr${wholeHours !== 1 ? 's' : ''}`;
    }

    return `${wholeHours} hr${wholeHours !== 1 ? 's' : ''} (${minutes} min${minutes !== 1 ? 's' : ''})`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  const wholeHours = Math.floor(remainingHours);
  const minutes = Math.round((remainingHours - wholeHours) * 60);

  let result = `${days} day${days !== 1 ? 's' : ''}`;
  if (wholeHours > 0) result += ` ${wholeHours} hr${wholeHours !== 1 ? 's' : ''}`;
  if (minutes > 0) result += ` (${minutes} min${minutes !== 1 ? 's' : ''})`;

  return result;
};

export const getRowClassName = (
  isDark: boolean,
  colors: ColorTokens,
  isDraft: boolean,
  isCancelled: boolean,
  isLocked: boolean
) => {
  if (isCancelled) {
    return cn(
      'border-b align-top transition-colors opacity-60',
      colors.border.primary,
      isDark ? 'bg-red-900/5 hover:bg-red-900/10' : 'bg-red-50/30 hover:bg-red-50/50'
    );
  }

  if (isLocked) {
    return cn(
      'border-b align-top transition-colors',
      colors.border.primary,
      isDark ? 'bg-gray-800/30 hover:bg-gray-800/40' : 'bg-gray-50/50 hover:bg-gray-50/70'
    );
  }

  return cn(
    'border-b align-top transition-colors',
    colors.border.primary,
    isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50',
    isDraft && 'opacity-75',
    isDraft && (isDark ? 'bg-purple-900/10' : 'bg-purple-50/50')
  );
};

export const isLockedStatus = (status: LabRequestItemStatusType): boolean => {
  return (
    status === LabRequestItemStatus.IN_PROGRESS ||
    status === LabRequestItemStatus.COMPLETED ||
    status === LabRequestItemStatus.VERIFIED
  );
};
