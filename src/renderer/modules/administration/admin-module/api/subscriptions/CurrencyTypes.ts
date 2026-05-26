import type { ApiSuccessResponse } from './SubscriptionTypes';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface ConvertResponse {
  amount: number;
  from: string;
  to: string;
  converted: number | null;
  rate: number | null;
  formatted: string | null;
}

export type CurrenciesResponse = ApiSuccessResponse<Currency[]>;
export type CurrencyConvertResponse = ApiSuccessResponse<ConvertResponse>;
