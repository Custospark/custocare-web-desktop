import React from 'react';
import { cn } from '../../../../../shared/types/cn';
import {
  paymentStatusMeta,
  subscriptionStatusMeta,
  type PaymentTone,
  type SubscriptionTone,
} from '../../utils/subscriptionMatrix';

interface SubscriptionOutcomePillProps {
  subscriptionStatus?: string | null;
  subscriptionStatusLabel?: string | null;
  paymentStatus?: string | null;
  paymentStatusLabel?: string | null;
}

const toneClasses = (tone: SubscriptionTone | PaymentTone): string => {
  switch (tone) {
    case 'active':
    case 'completed':
      return 'bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100';
    case 'trial':
    case 'pending':
      return 'bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100';
    default:
      return 'bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100';
  }
};

/**
 * History rows narrate the SUBSCRIPTION outcome (Custosell parity) -
 * payment plumbing stays out of the UI. Falls back to payment status
 * only when the row carries no subscription context (legacy rows).
 */
export const SubscriptionOutcomePill: React.FC<SubscriptionOutcomePillProps> = ({
  subscriptionStatus,
  subscriptionStatusLabel,
  paymentStatus,
  paymentStatusLabel,
}) => {
  if (subscriptionStatus) {
    const meta = subscriptionStatusMeta(subscriptionStatus);
    return (
      <span className={cn('shrink-0 px-2 py-0.5 rounded-full text-xs font-bold', toneClasses(meta.tone))}>
        {subscriptionStatusLabel || meta.label}
      </span>
    );
  }
  const meta = paymentStatusMeta(paymentStatus ?? '');
  return (
    <span className={cn('shrink-0 px-2 py-0.5 rounded-full text-xs font-bold', toneClasses(meta.tone))}>
      {paymentStatusLabel || meta.label}
    </span>
  );
};

export default SubscriptionOutcomePill;
