import React from 'react';
import { CreditCard, Loader2, ExternalLink, RefreshCw, XCircle } from 'lucide-react';
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
  resumedPaymentId?: number | null;
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
  resumedPaymentId,
  onApproved,
}) => {
  const isDark = theme === 'dark';
  const flow = useGatewayCheckoutFlow({
    subscriptionId, paymentType, amount, currency, targetPlanId, resumedPaymentId, onApproved,
  });

  // Failed view: the payment died at the gateway. Back to the form without
  // unmounting, so the popup lifecycle stays intact.
  if (flow.paymentId != null && flow.liveStatus === 'failed') {
    return (
      <div
        className={cn(
          'rounded-xl border-2 p-5 text-center space-y-4',
          isDark ? 'border-emerald-700 bg-emerald-900/10' : 'border-emerald-200 bg-emerald-50/60',
        )}
      >
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <div>
          <p className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>Payment failed</p>
          <p className={cn('text-sm mt-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
            The payment did not go through. Try again below - failed payments never block you.
          </p>
        </div>
        <button
          type="button"
          onClick={() => flow.resetFlow()}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg transition-all"
        >
          Try again
        </button>
      </div>
    );
  }

  // Waiting view: a payment is in flight (fresh or resumed). The form stays
  // hidden so a second payment can never be started by accident.
  if (flow.paymentId != null) {
    return (
      <div
        className={cn(
          'rounded-xl border-2 p-5 text-center space-y-4',
          isDark ? 'border-emerald-700 bg-emerald-900/10' : 'border-emerald-200 bg-emerald-50/60',
        )}
      >
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto" />
        <div>
          <p className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>Waiting for Payment</p>
          <p className={cn('text-sm mt-1', isDark ? 'text-gray-400' : 'text-gray-500')}>
            Complete the payment in the opened window.
          </p>
        </div>
        <PaymentPopupNotice theme={theme} popupBlocked={flow.popupBlocked} paymentUrl={flow.paymentUrl} />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => flow.verifyNow()}
            disabled={flow.verifying}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm border transition-all disabled:opacity-50',
              isDark ? 'border-gray-600 hover:bg-gray-800 text-gray-200' : 'border-gray-300 hover:bg-gray-100 text-gray-700',
            )}
          >
            {flow.verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Verify payment
          </button>
          <button
            type="button"
            onClick={() => flow.cancelPayment()}
            disabled={flow.cancelling}
            className={cn('text-xs underline underline-offset-2 transition-all disabled:opacity-50', isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800')}
          >
            {flow.cancelling ? 'Cancelling...' : 'Cancel and start over'}
          </button>
        </div>
        {flow.liveStatus && flow.liveStatus !== 'pending' && (
          <p className={cn('text-xs font-semibold', flow.liveStatus === 'completed' ? 'text-emerald-600' : 'text-amber-600')}>
            Status: {flow.liveStatus}
          </p>
        )}
      </div>
    );
  }

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
          Pay now
        </button>
      </div>
    </div>
  );
};
