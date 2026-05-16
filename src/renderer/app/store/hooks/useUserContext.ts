// hooks/useUserContext.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch } from '../../../app/store/hooks/useApp';
import { setUserContext, setLoading, setError, type UserContext } from '../slices/activeContextSlice';
import axiosInstance from '../../api/axiosConfig';

const fetchUserContext = async (): Promise<UserContext> => {
  const response = await axiosInstance.get('/user/context/resolve');
  return response.data.data;
};

export const useUserContext = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const { data: context, isLoading, error, refetch } = useQuery<UserContext, Error>({
    queryKey: ['userContext'],
    queryFn: fetchUserContext,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: false,
  });

  const refreshMutation = useMutation<UserContext, Error, void>({
    mutationFn: fetchUserContext,
    onMutate: () => { dispatch(setLoading(true)); },
    onSuccess: (data) => {
      dispatch(setUserContext(data));
      dispatch(setLoading(false));
      queryClient.setQueryData(['userContext'], data);
    },
    onError: (err) => {
      dispatch(setError(err.message || 'Failed to refresh context'));
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
