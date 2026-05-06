import type { QueryClient } from '@tanstack/react-query';

import type { Ward } from '../../../../administration/admin-module/api/wards/wardTypes';

import { nursingWardBedKeys } from '../../../api/ward-bed/wardBedQueries';
import type { WardBedOptionsResponseData } from '../../../api/ward-bed/wardBedTypes';

/**
 * Merges an updated Ward entity into the cached ward-bed-options payload so labels
 * (name, building, floor, etc.) update immediately without waiting for a refetch.
 */
export function applyUpdatedWardToVisitOptionsCache(
  queryClient: QueryClient,
  visitUuid: string,
  ward: Ward
): void {
  queryClient.setQueryData<WardBedOptionsResponseData>(
    nursingWardBedKeys.byVisit(visitUuid),
    (prev) => {
      if (!prev) return prev;

      const wards = prev.wards.map((w) =>
        w.id === ward.id
          ? {
              ...w,
              name: ward.name,
              code: ward.code ?? w.code,
              ward_type: ward.ward_type,
              building: ward.building ?? w.building,
              floor: ward.floor ?? w.floor,
              capacity_operational: ward.capacity_operational ?? w.capacity_operational,
            }
          : w
      );

      const cur = prev.current_location;
      const current_location =
        cur.ward_id === ward.id
          ? {
              ...cur,
              ward_name: ward.name,
            }
          : cur;

      return {
        ...prev,
        wards,
        current_location,
      };
    }
  );
}
