import { CheckCircle2, DoorOpen, XCircle } from 'lucide-react';

import type {
  AvailableSpace,
  SpaceReference,
  SpaceWithAssignment,
  StaffForAssignment,
  StaffReference,
  StaffSpaceAssignment,
  UserReference,
} from '../../../api/staff-space-assignment/StaffSpaceAssignmentTypes';
import { StaffSpaceAssignmentStatus } from '../../../api/staff-space-assignment/StaffSpaceAssignmentTypes';

import {
  SPACE_TYPE_COLORS,
  SPACE_TYPE_ICONS,
} from './space-allocation.constants';

export const safeLower = (value: string | null | undefined): string =>
  (value ?? '').toLowerCase();

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'N/A';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'N/A';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Unknown error';
};

export const getSpaceTypeIcon = (type: string | null | undefined) => {
  return SPACE_TYPE_ICONS[safeLower(type)] || SPACE_TYPE_ICONS.default;
};

export const getSpaceTypeColor = (type: string | null | undefined): string => {
  return SPACE_TYPE_COLORS[safeLower(type)] || SPACE_TYPE_COLORS.default;
};

export const formatSpaceTypeLabel = (value: string | null | undefined): string => {
  if (!value) return 'Unknown';

  return value
    .replace(/[_-]/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
};

export const buildSafeUserReference = (
  id: number,
  firstName: string,
  lastName: string
): UserReference => ({
  id,
  first_name: firstName,
  last_name: lastName,
  full_name: `${firstName} ${lastName}`.trim(),
});

export const buildSafeStaffReference = (
  staff: StaffForAssignment,
  userId = 0
): StaffReference => ({
  staff_id: staff.staff_id,
  staff_uuid: staff.staff_uuid,
  employee_id: staff.employee_id,
  user: buildSafeUserReference(userId, staff.first_name, staff.last_name),
  role_code: staff.role_code,
});

export const buildSafeSpaceReference = (
  space: SpaceWithAssignment | AvailableSpace
): SpaceReference => ({
  id: space.id,
  name: space.name,
  type: space.type,
  floor: space.floor,
  building: space.building,
  is_active: space.is_active,
  facility_id: space.facility_id,
});

export const createOptimisticAssignment = (
  tempId: number,
  facilityId: number,
  spaceId: number,
  staffId: number,
  note: string | null,
  targetSpace: SpaceWithAssignment | AvailableSpace,
  selectedStaff: StaffForAssignment
): StaffSpaceAssignment => {
  const now = new Date().toISOString();

  return {
    id: tempId,
    facility_id: facilityId,
    space_id: spaceId,
    staff_id: staffId,
    assigned_by_user_id: null,
    released_by_user_id: null,
    assigned_at: now,
    released_at: null,
    note,
    status: StaffSpaceAssignmentStatus.ACTIVE,
    created_at: now,
    updated_at: now,
    space: buildSafeSpaceReference(targetSpace),
    staff: buildSafeStaffReference(selectedStaff),
    assigned_by_user: undefined,
    released_by_user: undefined,
  };
};

export const getOccupancyStatusMeta = (isOccupied: boolean) => {
  if (isOccupied) {
    return {
      label: 'Occupied',
      icon: CheckCircle2,
      className: 'bg-blue-500/10 text-blue-500',
    };
  }

  return {
    label: 'Available',
    icon: DoorOpen,
    className: 'bg-green-500/10 text-green-500',
  };
};

export const getSpaceActiveStatusMeta = (isActive: boolean) => {
  if (isActive) {
    return {
      label: 'Active',
      icon: CheckCircle2,
      className: 'text-green-500',
    };
  }

  return {
    label: 'Inactive',
    icon: XCircle,
    className: 'text-red-500',
  };
};
