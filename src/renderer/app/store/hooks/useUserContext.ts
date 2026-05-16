// hooks/useUserContext.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch } from '../../../app/store/hooks/useApp';
import { setUserContext, setLoading, setError, type UserContext } from '../slices/activeContextSlice';
import { setSessionStart } from '../slices/authSlice';
import axiosInstance from '../../api/axiosConfig';

/**
 * Fetch user context from backend
 */
const fetchUserContext = async (): Promise<UserContext> => {
  const response = await axiosInstance.get('/user/context/resolve');
  return response.data.data;
};

/**
 * Hook to manage user context with automatic sync
 */
export const useUserContext = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  // Query to fetch context
  const {
    data: context,
    isLoading,
    error,
    refetch,
  } = useQuery<UserContext, Error>({
    queryKey: ['userContext'],
    queryFn: fetchUserContext,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: false, // Manual fetch only
  });

  // Mutations

  // Refresh mutation — used for explicit refresh calls
  const refreshMutation = useMutation<UserContext, Error, void>({
    mutationFn: fetchUserContext,
    onMutate: () => {
      dispatch(setLoading(true));
    },
    onSuccess: (data) => {
      dispatch(setUserContext(data));
      dispatch(setSessionStart()); // record session start time
      dispatch(setLoading(false));
      queryClient.setQueryData(['userContext'], data);
    },
    onError: (error) => {
      dispatch(setError(error.message || 'Failed to refresh context'));
      dispatch(setLoading(false));
    },
  });

  return {
    context,
    isLoading: isLoading || refreshMutation.isPending,
    error: error || refreshMutation.error,
    refresh: () => refreshMutation.mutate(),
    refetch,
  };
};
