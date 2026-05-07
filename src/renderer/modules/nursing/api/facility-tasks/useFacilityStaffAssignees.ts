import { useQuery } from '@tanstack/react-query';

import { axiosInstance } from '../../../../app/api/axiosConfig';

/**
 * Staff eligible for task assignment at a facility:
 * rows in `facility_staff_roles` with **active** assignment for this facility,
 * each tied to a `staff` record (which links to `users.id` via `staff.user_id`).
 */
export const facilityStaffAssigneeKeys = {
  all: ['nursing', 'facility-staff-assignees'] as const,
  facility: (facilityId: number) => [...facilityStaffAssigneeKeys.all, facilityId] as const,
};

export interface StaffAssigneeOption {
  /** `users.id` — used as `assigned_to_user_id` on facility_tasks */
  userId: number;
  staffId: number;
  label: string;
  roleLabel?: string;
}

/** Laravel paginated facility-staff-roles index response (axios body). */
interface FacilityStaffRolesPaginatedBody {
  data?: unknown[];
  meta?: { current_page?: number; last_page?: number; total?: number };
  success?: boolean;
  message?: string;
}

function resolveStaffUserId(staff: Record<string, unknown> | undefined): number | null {
  if (!staff) return null;
  const direct = staff.user_id;
  if (typeof direct === 'number' && direct > 0) return direct;
  const user = staff.user;
  if (user && typeof user === 'object' && typeof (user as { id?: number }).id === 'number') {
    const id = (user as { id: number }).id;
    return id > 0 ? id : null;
  }
  return null;
}

function parseStaffAssignees(apiBody: unknown): StaffAssigneeOption[] {
  if (!apiBody || typeof apiBody !== 'object') return [];

  const body = apiBody as FacilityStaffRolesPaginatedBody & { success?: boolean };
  const rows = Array.isArray(body.data) ? body.data : [];

  const byUser = new Map<number, StaffAssigneeOption>();

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const r = row as {
      role_code?: string;
      role_label?: string;
      staff?: Record<string, unknown>;
    };

    const staff = r.staff;
    const userId = resolveStaffUserId(staff);
    if (userId == null) continue;

    const sn = staff?.staff_name;
    const pt = staff?.professional_title;
    const eid = staff?.employee_id;
    const name =
      (typeof sn === 'string' && sn.trim()) ||
      [typeof pt === 'string' ? pt : null, typeof eid === 'string' && eid ? `#${eid}` : null].filter(Boolean).join(' · ') ||
      `Staff #${typeof staff?.id === 'number' ? staff.id : '?'}`;

    const roleLabel =
      typeof r.role_label === 'string'
        ? r.role_label
        : typeof r.role_code === 'string'
          ? r.role_code.replace(/_/g, ' ')
          : undefined;

    if (!byUser.has(userId)) {
      byUser.set(userId, {
        userId,
        staffId: typeof staff?.id === 'number' ? staff.id : 0,
        label: name,
        roleLabel,
      });
    }
  }

  return [...byUser.values()].sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
}

export function useFacilityStaffAssignees(facilityId: number | null) {
  const fid = facilityId ?? 0;

  return useQuery({
    queryKey: facilityStaffAssigneeKeys.facility(fid),
    queryFn: async () => {
      const response = await axiosInstance.get<unknown>('/facility-staff-roles', {
        params: {
          facility_id: fid,
          assignment_status: 'active',
          per_page: 200,
          page: 1,
        },
      });
      return parseStaffAssignees(response.data);
    },
    enabled: fid > 0,
    staleTime: 60_000,
  });
}
