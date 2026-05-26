import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../../app/api/axiosConfig';

export interface ConvertResponse {
  amount: number;
  from: string;
  to: string;
  converted: number | null;
  rate: number | null;
  formatted: string | null;
}

interface ApiSuccessResponse<T> {
  success: boolean;
  data: T;
}

export const currencyKeys = {
  convert: (from: string, to: string, amount: number) =>
    ['currencies', 'convert', from, to, amount] as const,
};

export const useCurrencyConvert = (amount: number, from: string, to: string) =>
  useQuery<ApiSuccessResponse<ConvertResponse>, AxiosError>({
    queryKey: currencyKeys.convert(from, to, amount),
    queryFn: async () => {
      const res = await axiosInstance.get<ApiSuccessResponse<ConvertResponse>>(
        `/currencies/convert?amount=${amount}&from=${from}&to=${to}`,
      );
      return res.data;
    },
    enabled: amount > 0 && !!from && !!to && from !== to,
    staleTime: 1000 * 60 * 60,
  });
