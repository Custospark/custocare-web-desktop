import type { ReferralPriority, ReferralStatus } from '../../api/referrals/referralTypes';

interface ReferralStatusBadgeProps {
  status: ReferralStatus;
  isDark?: boolean;
}

const STATUS_STYLES: Record<ReferralStatus, { light: string; dark: string }> = {
  pending: { light: 'bg-amber-100 text-amber-800', dark: 'bg-amber-900/30 text-amber-300' },
  accepted: { light: 'bg-blue-100 text-blue-800', dark: 'bg-blue-900/30 text-blue-300' },
  rejected: { light: 'bg-red-100 text-red-800', dark: 'bg-red-900/30 text-red-300' },
  completed: { light: 'bg-green-100 text-green-800', dark: 'bg-green-900/30 text-green-300' },
  cancelled: { light: 'bg-gray-100 text-gray-700', dark: 'bg-gray-800 text-gray-400' },
};

export const ReferralStatusBadge = ({ status, isDark = false }: ReferralStatusBadgeProps) => {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
        isDark ? style.dark : style.light
      }`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
};

interface ReferralPriorityBadgeProps {
  priority: ReferralPriority;
  isDark?: boolean;
}

const PRIORITY_STYLES: Record<ReferralPriority, { light: string; dark: string }> = {
  low: { light: 'bg-gray-100 text-gray-700', dark: 'bg-gray-800 text-gray-400' },
  medium: { light: 'bg-sky-100 text-sky-800', dark: 'bg-sky-900/30 text-sky-300' },
  high: { light: 'bg-orange-100 text-orange-800', dark: 'bg-orange-900/30 text-orange-300' },
  urgent: { light: 'bg-red-100 text-red-800', dark: 'bg-red-900/30 text-red-300' },
};

export const ReferralPriorityBadge = ({ priority, isDark = false }: ReferralPriorityBadgeProps) => (
  <span
    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
      isDark ? PRIORITY_STYLES[priority].dark : PRIORITY_STYLES[priority].light
    }`}
  >
    {priority}
  </span>
);
