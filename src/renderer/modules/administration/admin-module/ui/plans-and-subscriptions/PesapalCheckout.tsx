import React from 'react';
import { CreditCard, Loader2, ExternalLink, RefreshCw, CheckCircle } from 'lucide-react';
import { cn } from '../../../../../shared/types/cn';
import { useGatewayCheckoutFlow } from './useGatewayCheckoutFlow';
import { PaymentPopupNotice } from './PaymentPopupNotice';
import type { PaymentType } from '../../api/subscriptions/SubscriptionTypes';

interface PesapalCheckoutProps {
  theme: 'light' | 'dark';
  subscriptionId: number;
  paymentType: PaymentType | string;
  amount: number;
  currency: string;
  targetPlanId?: number | null;
  disabled?: boolean;
  onApproved: () => void;
}

/**
 * Inline online checkout. All flow state lives in useGatewayCheckoutFlow
 * (shared with the payment modal) - this component is presentation only.
 */
export const PesapalCheckout: React.FC<PesapalCheckoutProps> = ({
  theme,
  subscriptionId,
  paymentType,
  amount,
  currency,
  targetPlanId,
  disabled,
  onApproved,
}) => {
  const isDark = theme === 'dark';
  const flow = useGatewayCheckoutFlow({
    subscriptionId, paymentType, amount, currency, targetPlanId, onApproved,
  });

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-5',
        isDark ? 'border-emerald-700 bg-emerald-900/10' : 'border-emerald-200 bg-emerald-50/60',
      )}
    >
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-600 text-white">
          <CreditCard className="w-5 h-5" />
        </div>
        <div>
          <h3 className={cn('font-bold text-sm', isDark ? 'text-white' : 'text-gray-900')}>
            Pay Online
          </h3>
          <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>
            Mobile money & cards - instant activation
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        <label className="block">
          <span className={cn('text-xs font-medium', isDark ? 'text-gray-300' : 'text-gray-600')}>
            Email for receipt *
          </span>
          <input
            type="email"
            value={flow.email}
            onChange={(e) => flow.setEmail(e.target.value)}
            placeholder="you@example.com"
            className={cn(
              'mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500',
              isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900',
            )}
          />
        </label>
        <label className="block">
          <span className={cn('text-xs font-medium', isDark ? 'text-gray-300' : 'text-gray-600')}>
            Phone for mobile money (optional)
          </span>
          <input
            type="tel"
            value={flow.phone}
            onChange={(e) => flow.setPhone(e.target.value)}
            placeholder="2567XXXXXXXX"
            className={cn(
              'mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500',
              isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900',
            )}
          />
        </label>
      </div>

      <div className="mt-4">
        <PaymentPopupNotice theme={theme} popupBlocked={flow.popupBlocked} paymentUrl={flow.paymentUrl} />
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-4">
        <button
          type="button"
          onClick={() => flow.startPayment()}
          disabled={disabled || flow.busy}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-lg transition-all"
        >
          {flow.initiating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ExternalLink className="w-4 h-4" />
          )}
          {flow.paymentId ? 'Reopen checkout' : 'Pay now'}
        </button>

        {flow.paymentId != null && (
          <button
            type="button"
            onClick={() => flow.verifyNow()}
            disabled={flow.verifying || flow.liveStatus === 'completed'}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm border transition-all disabled:opacity-50',
              isDark
                ? 'border-gray-600 hover:bg-gray-800 text-gray-200'
                : 'border-gray-300 hover:bg-gray-100 text-gray-700',
            )}
          >
            {flow.verifying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Verify payment
          </button>
        )}

        {flow.liveStatus && (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-semibold',
              flow.liveStatus === 'completed' ? 'text-emerald-600' : isDark ? 'text-amber-300' : 'text-amber-700',
            )}
          >
            {flow.liveStatus === 'completed' && <CheckCircle className="w-4 h-4" />}
            Status: {flow.liveStatus}
          </span>
        )}
      </div>

      {flow.paymentId != null && flow.liveStatus === 'pending' && (
        <p className={cn('text-xs mt-3', isDark ? 'text-gray-400' : 'text-gray-500')}>
          Complete payment in the checkout window - this page checks automatically. If you already
          paid, press <strong>Verify payment</strong>.
        </p>
      )}
    </div>
  );
};
