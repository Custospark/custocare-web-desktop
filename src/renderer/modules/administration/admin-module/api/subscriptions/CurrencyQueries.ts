import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { axiosInstance } from '../../../../../app/api/axiosConfig';
import type {
  CurrenciesResponse,
  CurrencyConvertResponse,
} from './CurrencyTypes';

export const currencyKeys = {
  all:       ['currencies'] as const,
  list:      () => [...currencyKeys.all, 'list'] as const,
  convert:   (from: string, to: string, amount: number) =>
    [...currencyKeys.all, 'convert', from, to, amount] as const,
};

export const useGetCurrencies = () =>
  useQuery<CurrenciesResponse, AxiosError>({
    queryKey: currencyKeys.list(),
    queryFn: async () => {
      const res = await axiosInstance.get<CurrenciesResponse>('/currencies');
      return res.data;
    },
    staleTime: 1000 * 60 * 60,
  });

export const useCurrencyConvert = (amount: number, from: string, to: string) =>
  useQuery<CurrencyConvertResponse, AxiosError>({
    queryKey: currencyKeys.convert(from, to, amount),
    queryFn: async () => {
      const res = await axiosInstance.get<CurrencyConvertResponse>(
        `/currencies/convert?amount=${amount}&from=${from}&to=${to}`,
      );
      return res.data;
    },
    enabled: amount > 0 && !!from && !!to && from !== to,
    staleTime: 1000 * 60 * 60,
  });
