import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../../../../app/api/axiosConfig';

export interface FacilityOption {
  id: number;
  facility_uuid: string;
  facility_name: string;
  facility_code: string;
  city: string;
}

export const useFacilities = (search?: string) =>
  useQuery<{ data: FacilityOption[] }>({
    queryKey: ['facilities', 'list', search],
    queryFn: async () => {
      const { data } = await axiosInstance.get('/facilities', {
        params: search ? { search, per_page: 50 } : { per_page: 100 },
      });
      return data;
    },
  });
