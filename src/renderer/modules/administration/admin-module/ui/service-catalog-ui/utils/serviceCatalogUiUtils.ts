import { RiskLevel, ServiceStatus } from '../../../api/service-catalog/serviceCatalogTypes';
import { formatPrice as sharedFormatPrice } from '../../../../../shared/utils/formatCurrency';

export const normalizeAmount = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

/**
 * Format price using facility's configured currency
 * Falls back to USD if no facility currency is set
 */
export const formatPrice = (amount: unknown, currency?: string) => {
  const safeAmount = normalizeAmount(amount);
  return sharedFormatPrice(safeAmount, currency);
};

/**
 * Format price with explicit currency (overrides facility config)
 */
export const formatPriceWithCurrency = (amount: unknown, currencyCode: string) => {
  const safeAmount = normalizeAmount(amount);
  return sharedFormatPrice(safeAmount, currencyCode);
};

export const getStatusColor = (status: ServiceStatus, isDark: boolean) => {
  switch (status) {
    case ServiceStatus.ACTIVE:
      return isDark ? 'text-green-400' : 'text-green-600';
    case ServiceStatus.INACTIVE:
      return isDark ? 'text-red-400' : 'text-red-600';
    case ServiceStatus.DEPRECATED:
      return isDark ? 'text-gray-400' : 'text-gray-600';
    case ServiceStatus.UNDER_REVIEW:
      return isDark ? 'text-yellow-400' : 'text-yellow-600';
    default:
      return isDark ? 'text-gray-400' : 'text-gray-600';
  }
};

export const getStatusBgColor = (status: ServiceStatus, isDark: boolean) => {
  switch (status) {
    case ServiceStatus.ACTIVE:
      return isDark ? 'bg-green-900/30' : 'bg-green-50';
    case ServiceStatus.INACTIVE:
      return isDark ? 'bg-red-900/30' : 'bg-red-50';
    case ServiceStatus.DEPRECATED:
      return isDark ? 'bg-gray-900/30' : 'bg-gray-50';
    case ServiceStatus.UNDER_REVIEW:
      return isDark ? 'bg-yellow-900/30' : 'bg-yellow-50';
    default:
      return isDark ? 'bg-gray-900/30' : 'bg-gray-50';
  }
};

export const getRiskLevelColor = (risk: RiskLevel, isDark: boolean) => {
  switch (risk) {
    case RiskLevel.LOW:
      return isDark ? 'text-green-400' : 'text-green-600';
    case RiskLevel.MODERATE:
      return isDark ? 'text-yellow-400' : 'text-yellow-600';
    case RiskLevel.HIGH:
      return isDark ? 'text-orange-400' : 'text-orange-600';
    case RiskLevel.CRITICAL:
      return isDark ? 'text-red-400' : 'text-red-600';
    default:
      return isDark ? 'text-gray-400' : 'text-gray-600';
  }
};

/**
 * Auto-generate a stable service code from a name.
 * Pure function (safe for use in handlers), no React effects needed.
 */
export const generateServiceCodeFromName = (name: string) => {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 8);
};