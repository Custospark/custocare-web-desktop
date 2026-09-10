import { useEffect, useRef, useState } from 'react';
import { useToast } from '../../../../../app/store/contexts/toast/useToast';
import { usePaymentPopup } from '../../../../../shared/hooks/usePaymentPopup';
import {
  useInitiateGatewayPayment,
  useGetGatewayPaymentStatus,
  useCancelGatewayPayment,
} from '../../api/subscriptions/PaymentGatewayQueries';
import type { PaymentType } from '../../api/subscriptions/SubscriptionTypes';

export interface CheckoutFlowParams {
  subscriptionId: number;
  paymentType: PaymentType | string;
  amount: number;
  currency: string;
  targetPlanId?: number | null;
  /** Resume tracking an existing pending payment (e.g. after remount). */
  resumedPaymentId?: number | null;
  onApproved: () => void;
}

/**
 * Shared gateway checkout flow (single implementation for the inline
 * checkout and the payment modal - no drift between the two).
 *
 * Popup discipline (Custosell standard): open blank synchronously in the
 * click gesture, redirect on API success. The flow owns paymentId + polling
 * so unmounts and refetches can never orphan the user mid-payment.
 */
export function useGatewayCheckoutFlow({
  subscriptionId,
  paymentType,
  amount,
  currency,
  targetPlanId,
  resumedPaymentId,
  onApproved,
}: CheckoutFlowParams) {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentId, setPaymentId] = useState<number | null>(resumedPaymentId ?? null);
  const [verifying, setVerifying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const approvedRef = useRef(false);

  const cancelRemote = useCancelGatewayPayment();

  // Adopt a resumed pending payment (arrives async from the payments list).
  // Never overwrites an in-flight payment owned by this flow instance.
  useEffect(() => {
    if (resumedPaymentId != null && paymentId == null) {
      setPaymentId(resumedPaymentId);
    }
  }, [resumedPaymentId, paymentId]);

  const {
    popupBlocked,
    paymentUrl,
    openPaymentPopup,
    redirectPaymentWindow,
    closePaymentPopup,
  } = usePaymentPopup();

  const initiate = useInitiateGatewayPayment({
    onSuccess: (res) => {
      const pid = res.data?.payment_id;
      const redirectUrl = res.data?.redirect_url;
      if (pid) setPaymentId(pid);
      if (redirectUrl) {
        redirectPaymentWindow(redirectUrl);
      } else {
        // Bypass mode (local dev): no hosted page.
        closePaymentPopup();
      }
    },
    onError: () => closePaymentPopup(),
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
    if (liveStatus === 'completed' && !approvedRef.current) {
      approvedRef.current = true;
      closePaymentPopup();
      showToast('success', 'Payment confirmed. Subscription activated.', 7000);
      onApproved();
    }
  }, [liveStatus, onApproved, showToast, closePaymentPopup]);

  const startPayment = (): boolean => {
    if (!email.trim()) {
      showToast('error', 'Enter the email address for your receipt.', 5000);
      return false;
    }
    approvedRef.current = false;
    if (!openPaymentPopup()) {
      showToast('error', 'Popup blocked. Allow popups for this app, then try again.', 7000);
      return false;
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
    return true;
  };

  const verifyNow = async () => {
    if (paymentId == null) return;
    setVerifying(true);
    try {
      await liveVerifyQuery.refetch();
      await statusQuery.refetch();
    } finally {
      setVerifying(false);
    }
  };

  /** Give up on a stuck pending payment: it expires server-side (history
      kept) and the flow returns to the form so a new payment can start. */
  const cancelPayment = async () => {
    if (paymentId == null) return;
    setCancelling(true);
    try {
      await cancelRemote.mutateAsync(paymentId);
      closePaymentPopup();
      setPaymentId(null);
      approvedRef.current = false;
      onApproved();
    } finally {
      setCancelling(false);
    }
  };

  const busy = initiate.isPending || statusQuery.isFetching;

  return {
    email, setEmail,
    phone, setPhone,
    paymentId,
    liveStatus,
    verifying,
    cancelling,
    busy,
    popupBlocked,
    paymentUrl,
    initiating: initiate.isPending,
    startPayment,
    verifyNow,
    cancelPayment,
  };
}
