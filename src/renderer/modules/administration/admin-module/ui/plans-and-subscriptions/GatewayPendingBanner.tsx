import React, { useEffect, useRef, useState } from 'react';
import { CreditCard, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '../../../../../shared/types/cn';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import {
  useCancelGatewayPayment,
  useGetGatewayPaymentStatus,
} from '../../api/subscriptions/PaymentGatewayQueries';

interface GatewayPendingBannerProps {
  theme: 'light' | 'dark';
  paymentId: number;
  onApproved: () => void;
}

/**
 * Persistent in-progress banner for an online payment.
 *
 * Driven by the payments list (not the subscription flag), so it survives
 * refetches and remounts for as long as the payment is pending. Polls the
 * status endpoint while pending and offers a live Verify for slow
 * notifications. Disappears only when the payment leaves pending.
 */
export const GatewayPendingBanner: React.FC<GatewayPendingBannerProps> = ({
  theme,
  paymentId,
  onApproved,
}) => {
  const isDark = theme === 'dark';
  const { showToast } = useToast();
  const [verifying, setVerifying] = useState(false);
  const approvedRef = useRef(false);

  const statusQuery = useGetGatewayPaymentStatus({ reference: paymentId });
  const liveVerifyQuery = useGetGatewayPaymentStatus(
    { reference: paymentId, verify: true },
    { enabled: false },
  );
  const cancelPayment = useCancelGatewayPayment({
    onSuccess: () => onApproved(),
  });
  const status = statusQuery.data?.data?.status;

  useEffect(() => {
    if (status === 'completed' && !approvedRef.current) {
      approvedRef.current = true;
      showToast('success', 'Payment confirmed. Subscription activated.', 7000);
      onApproved();
    }
  }, [status, onApproved, showToast]);

  if (status !== undefined && status !== 'pending') return null;

  const handleVerify = async () => {
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
        'rounded-xl border-2 p-4',
        isDark ? 'bg-blue-900/20 border-blue-700/50' : 'bg-blue-50 border-blue-200',
      )}
    >
      <div className="flex items-start gap-3">
        <CreditCard className={cn('w-5 h-5 shrink-0', isDark ? 'text-blue-400' : 'text-blue-600')} />
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-bold', isDark ? 'text-blue-100' : 'text-blue-900')}>
            Payment in progress
          </p>
          <p className={cn('text-sm mt-0.5', isDark ? 'text-blue-200/90' : 'text-blue-800')}>
            Complete the payment in the checkout window. Activation is automatic once it completes.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm border transition-all disabled:opacity-50',
                isDark
                  ? 'border-blue-600 hover:bg-blue-900/40 text-blue-100'
                  : 'border-blue-300 hover:bg-blue-100 text-blue-800',
              )}
            >
              {verifying || statusQuery.isFetching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {verifying ? 'Verifying...' : 'Verify payment'}
            </button>
            <button
              type="button"
              onClick={() => cancelPayment.mutate(paymentId)}
              disabled={cancelPayment.isPending}
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-semibold underline underline-offset-2 transition-all disabled:opacity-50',
                isDark ? 'text-blue-300 hover:text-blue-100' : 'text-blue-700 hover:text-blue-900',
              )}
            >
              {cancelPayment.isPending ? 'Cancelling...' : 'Cancel and start over'}
            </button>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-semibold',
                isDark ? 'text-blue-300' : 'text-blue-700',
              )}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              Waiting for payment
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GatewayPendingBanner;
