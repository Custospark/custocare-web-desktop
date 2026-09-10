import React, { useEffect, useRef, useState } from 'react';
import { CreditCard, Loader2, ExternalLink, RefreshCw, CheckCircle } from 'lucide-react';
import { cn } from '../../../../../shared/types/cn';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import {
  useGetAvailablePaymentGateways,
  useInitiateGatewayPayment,
  useGetGatewayPaymentStatus,
} from '../../api/subscriptions/PaymentGatewayQueries';
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
 * PesaPal online checkout (redirect flow).
 *
 * 1. Opens the hosted PesaPal page in a popup (blank-first so blockers allow it).
 * 2. Polls our status endpoint every 5s while pending (hook handles the interval).
 * 3. On approved → toast + close popup + refresh parent.
 * 4. "Verify payment" forces a live gateway re-check (?verify=1) for slow IPNs.
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
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [verifying, setVerifying] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const approvedRef = useRef(false);

  const { data: gatewaysResp } = useGetAvailablePaymentGateways();
  const pesapal = gatewaysResp?.data?.find((g) => g.name === 'pesapal') ?? null;

  const initiate = useInitiateGatewayPayment({
    onSuccess: (res) => {
      const pid = res.data?.payment_id;
      const redirectUrl = res.data?.redirect_url;
      if (pid) setPaymentId(pid);
      if (redirectUrl && popupRef.current && !popupRef.current.closed) {
        popupRef.current.location.href = redirectUrl;
      } else {
        // Bypass mode (local dev): no hosted page - close the popup and let
        // the status poll pick up the approval.
        try {
          popupRef.current?.close();
        } catch {
          /* ignore */
        }
        if (!redirectUrl) {
          showToast('info', 'Payment created. Complete it, then press Verify payment.', 7000);
        }
      }
    },
  });

  const statusQuery = useGetGatewayPaymentStatus(
    { reference: paymentId ?? 0 },
    { enabled: paymentId != null },
  );
  const liveVerifyQuery = useGetGatewayPaymentStatus(
    { reference: paymentId ?? 0, verify: true },
    { enabled: false },
  );
  const liveStatus = paymentId != null ? statusQuery.data?.data?.status : undefined;

  useEffect(() => {
    if (liveStatus === 'approved' && !approvedRef.current) {
      approvedRef.current = true;
      try {
        popupRef.current?.close();
      } catch {
        /* popup already closed by user */
      }
      showToast('success', 'Payment confirmed. Subscription activated.', 7000);
      onApproved();
    }
  }, [liveStatus, onApproved, showToast]);

  useEffect(() => () => {
    try {
      if (!approvedRef.current) popupRef.current?.close();
    } catch {
      /* ignore */
    }
  }, []);

  if (!pesapal) return null;

  const busy = initiate.isPending || statusQuery.isFetching;

  const handlePay = () => {
    if (!email.trim()) {
      showToast('error', 'Enter the email address for your receipt.', 5000);
      return;
    }
    approvedRef.current = false;
    popupRef.current = window.open('about:blank', 'pesapal_checkout', 'width=640,height=760');
    if (!popupRef.current) {
      showToast('error', 'Popup blocked. Allow popups for this app, then try again.', 7000);
      return;
    }
    initiate.mutate({
      gateway: 'pesapal',
      data: {
        subscription_id: subscriptionId,
        payment_type: paymentType,
        amount,
        currency,
        email: email.trim(),
        phone_number: phone.trim() || null,
        target_plan_id: targetPlanId ?? null,
      },
    });
  };

  const handleVerify = async () => {
    if (paymentId == null) return;
    setVerifying(true);
    try {
      await liveVerifyQuery.refetch();
      await statusQuery.refetch();
    } finally {
      setVerifying(false);
    }
  };

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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="2567XXXXXXXX"
            className={cn(
              'mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500',
              isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900',
            )}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-4">
        <button
          type="button"
          onClick={handlePay}
          disabled={disabled || busy}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-lg transition-all"
        >
          {initiate.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ExternalLink className="w-4 h-4" />
          )}
          {paymentId ? 'Reopen checkout' : 'Pay now'}
        </button>

        {paymentId != null && (
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying || liveStatus === 'approved'}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm border transition-all disabled:opacity-50',
              isDark
                ? 'border-gray-600 hover:bg-gray-800 text-gray-200'
                : 'border-gray-300 hover:bg-gray-100 text-gray-700',
            )}
          >
            {verifying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Verify payment
          </button>
        )}

        {liveStatus && (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-semibold',
              liveStatus === 'approved' ? 'text-emerald-600' : isDark ? 'text-amber-300' : 'text-amber-700',
            )}
          >
            {liveStatus === 'approved' && <CheckCircle className="w-4 h-4" />}
            Status: {liveStatus}
          </span>
        )}
      </div>

      {paymentId != null && liveStatus === 'pending' && (
        <p className={cn('text-xs mt-3', isDark ? 'text-gray-400' : 'text-gray-500')}>
          Complete payment in the checkout window - this page checks automatically. If you already
          paid, press <strong>Verify payment</strong>.
        </p>
      )}
    </div>
  );
};
