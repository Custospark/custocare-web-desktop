import React from 'react';
import { CreditCard, Loader2, RefreshCw, CheckCircle, XCircle, X } from 'lucide-react';
import { cn } from '../../../../../shared/types/cn';
import Modal from '../../../../../shared/components/Common/Modal';
import { useGatewayCheckoutFlow } from './useGatewayCheckoutFlow';
import { PaymentPopupNotice } from './PaymentPopupNotice';
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
 * Guided payment modal (Custosell standard): plan actions open this
 * directly. The modal owns the whole flow - initiate, hosted checkout,
 * polling, verify, done/failed states - and only closes on user action
 * or confirmed completion. It can never vanish mid-payment.
 */
const PaymentModalBody: React.FC<{
  theme: 'light' | 'dark';
  params: PaymentModalParams;
  onClose: () => void;
  onApproved: () => void;
}> = ({ theme, params, onClose, onApproved }) => {
  const isDark = theme === 'dark';
  const flow = useGatewayCheckoutFlow({
    subscriptionId: params.subscriptionId,
    paymentType: params.paymentType,
    amount: params.amount,
    currency: params.currency,
    targetPlanId: params.targetPlanId ?? null,
    onApproved,
  });

  const done = flow.liveStatus === 'completed';
  const failed = flow.liveStatus === 'failed';

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={params.title ?? 'Complete payment'}
    >
      <div>
        {done ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>Payment completed</p>
            <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
              Your subscription is now active.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-all"
            >
              Done
            </button>
          </div>
        ) : failed ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className={cn('text-lg font-bold', isDark ? 'text-white' : 'text-gray-900')}>Payment failed</p>
            <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
              The payment did not go through. Start again below - failed payments never block you.
            </p>
            <button
              type="button"
              onClick={() => flow.startPayment()}
              disabled={flow.busy}
              className="px-6 py-2.5 rounded-lg font-bold text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-all"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={cn('rounded-xl p-4 text-sm flex justify-between', isDark ? 'bg-gray-800' : 'bg-gray-50')}>
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Amount due</span>
              <span className="font-extrabold text-blue-600">
                {params.currency} {params.amount.toLocaleString()}
              </span>
            </div>

            {flow.paymentId != null ? (
              <div className="text-center space-y-4 py-2">
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
                    className={cn('text-sm underline underline-offset-2 transition-all disabled:opacity-50', isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800')}
                  >
                    {flow.cancelling ? 'Cancelling...' : 'Cancel and start over'}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className={cn('text-sm underline transition-all', isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')}
                >
                  Close
                </button>
              </div>
            ) : (
            <>
            <div className="grid grid-cols-1 gap-3">
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

            <PaymentPopupNotice theme={theme} popupBlocked={flow.popupBlocked} paymentUrl={flow.paymentUrl} />

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => flow.startPayment()}
                disabled={flow.busy}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-lg transition-all"
              >
                {flow.initiating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                Pay now
              </button>
              <button
                type="button"
                onClick={onClose}
                className={cn('inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all', isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800')}
              >
                <X className="w-4 h-4" />
                Close
              </button>
            </div>
            </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

/**
 * Keyed body: every opening remounts with fresh flow state, so a previous
 * payment can never leak into (or unmount) the next one.
 */
export const PaymentModal: React.FC<PaymentModalProps> = (props) => {
  if (!props.params) return null;
  const p = props.params;
  const openKey = `${p.subscriptionId}-${p.paymentType}-${p.amount}-${p.targetPlanId ?? 0}`;
  return <PaymentModalBody key={openKey} {...props} params={p} />;
};

export default PaymentModal;
