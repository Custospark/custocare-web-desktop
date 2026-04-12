import { Bed, CheckCircle2, XCircle } from 'lucide-react';

import { WardStatus, WardType } from '../../../api/wards/wardTypes';
import { WARD_TYPE_OPTIONS } from './ward.constants';

export const safeLower = (value: string | null | undefined): string =>
  (value ?? '').toLowerCase();

export const safeDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Unknown error';
};

export const formatCapacity = (
  declared: number | null,
  operational: number | null
): string => {
  if (declared === null && operational === null) return 'Not set';
  if (operational === null) return `${declared}`;
  if (declared === null) return `${operational}`;
  return `${operational}/${declared}`;
};

export const parseOptionalInteger = (value: string): number | undefined => {
  if (!value.trim()) return undefined;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export const formatEnumLabel = (value: string | null | undefined): string => {
  if (!value) return '—';

  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
};

export const getWardTypeLabel = (type: WardType): string => {
  const option = WARD_TYPE_OPTIONS.find(opt => opt.value === type);
  return option?.label || type;
};

export const getWardTypeIcon = (type: WardType) => {
  const option = WARD_TYPE_OPTIONS.find(opt => opt.value === type);
  return option?.icon || Bed;
};

export const getWardTypeColor = (type: WardType): string => {
  const option = WARD_TYPE_OPTIONS.find(opt => opt.value === type);
  return option?.color || 'text-gray-500';
};

export const getWardStatusMeta = (status: WardStatus) => {
  switch (status) {
    case WardStatus.ACTIVE:
      return {
        label: 'Active',
        icon: CheckCircle2,
        className: 'bg-green-500/10 text-green-500',
      };
    case WardStatus.INACTIVE:
      return {
        label: 'Inactive',
        icon: XCircle,
        className: 'bg-red-500/10 text-red-500',
      };
    default:
      return {
        label: 'Closed',
        icon: XCircle,
        className: 'bg-yellow-500/10 text-yellow-500',
      };
  }
};
