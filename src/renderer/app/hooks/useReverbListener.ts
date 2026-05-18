import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import echo from '../api/echo';
import { useAppSelector } from '../store/hooks/useApp';
import { selectUser } from '../store/slices/authSlice';
import { messageKeys } from '../../modules/account/api/messages/MessageQueries';
import { staffSpaceAssignmentKeys } from '../../modules/administration/admin-module/api/staff-space-assignment/StaffSpaceAssignmentQueries';

const selectActiveFacilityId = (state: { activeContext: { activeFacilityId: number | null } }) =>
  state.activeContext.activeFacilityId;

export const useReverbListener = (): void => {
  const queryClient = useQueryClient();
  const user = useAppSelector(selectUser);
  const facilityId = useAppSelector(selectActiveFacilityId);

  useEffect(() => {
    if (!user?.id) return;

    const channel = echo.private(`user.${user.id}`);

    channel.listen('.MessageStatsUpdated', () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.statsByUser(user.id) });
    });

    channel.listen('.StaffPresenceChanged', () => {
      queryClient.invalidateQueries({ queryKey: ['staff-presence'] });
    });

    return () => {
      channel.stopListening('.MessageStatsUpdated');
      channel.stopListening('.StaffPresenceChanged');
      echo.leave(`user.${user.id}`);
    };
  }, [user?.id, queryClient]);

  useEffect(() => {
    if (!facilityId) return;

    const channel = echo.private(`facility.${facilityId}`);

    channel.listen('.SpaceOccupancyChanged', () => {
      queryClient.invalidateQueries({ queryKey: staffSpaceAssignmentKeys.occupancy({ facility_id: facilityId }) });
    });

    return () => {
      channel.stopListening('.SpaceOccupancyChanged');
      echo.leave(`facility.${facilityId}`);
    };
  }, [facilityId, queryClient]);
};
