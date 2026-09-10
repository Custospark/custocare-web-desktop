import React from 'react';
import Modal from '../../../../../shared/components/Common/Modal';
import { PesapalCheckout } from './PesapalCheckout';
import type { PaymentType } from '../../api/subscriptions/SubscriptionTypes';

export interface PaymentModalParams {
  subscriptionId: number;
  paymentType: PaymentType | string;
  amount: number;
  currency: string;
  targetPlanId?: number | null;
  title?: string;
}

interface PaymentModalProps {
  theme: 'light' | 'dark';
  params: PaymentModalParams | null;
  onClose: () => void;
  onApproved: () => void;
}

/**
 * Guided payment modal (Custosell parity): plan action buttons open this
 * directly instead of navigating away. The user pays inside the modal flow
 * until completion - approval refreshes the caller, which closes the modal.
 */
export const PaymentModal: React.FC<PaymentModalProps> = ({
  theme,
  params,
  onClose,
  onApproved,
}) => {
  return (
    <Modal
      isOpen={params != null}
      onClose={onClose}
      title={params?.title ?? 'Complete payment'}
    >
      {params && (
        <PesapalCheckout
          theme={theme}
          subscriptionId={params.subscriptionId}
          paymentType={params.paymentType}
          amount={params.amount}
          currency={params.currency}
          targetPlanId={params.targetPlanId ?? null}
          onApproved={() => {
            onApproved();
            onClose();
          }}
        />
      )}
    </Modal>
  );
};

export default PaymentModal;
