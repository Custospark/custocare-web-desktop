import React, { useState } from 'react';
import {
  Landmark, Smartphone, CheckCircle, Copy,
  CheckCheck, Upload, Loader2, FileText,
  Building2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '../../../../../app/store/hooks/useApp';
import { useGetFacilitySubscription, useRecordPayment } from '../../api/subscriptions/SubscriptionQueries';
import { useGetFacilityPayments } from '../../api/subscriptions/SubscriptionQueries';
import { PaymentStatus, PaymentMethod, PaymentType, type Payment } from '../../api/subscriptions/SubscriptionTypes';
import { cn } from '../../../../../shared/types/cn';

interface PaymentsProps {
  theme: 'light' | 'dark';
}

const BANK_DETAILS = {
  bank: 'Stanbic Bank Uganda',
  accountName: 'Custospark Company Ltd',
  accountNumber: '9030027316580',
};

export const Payments: React.FC<PaymentsProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const planSelection = useAppSelector((s) => s.plan.selected);
  const [method, setMethod] = useState<'bank' | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const { data: subResp } = useGetFacilitySubscription();
  const { data: paymentsResp, refetch } = useGetFacilityPayments({ per_page: 100 });
  const recordPayment = useRecordPayment({
    onSuccess: () => { setSubmitted(true); refetch(); },
  });

  const subscription = subResp?.data;
  const payments = paymentsResp?.data || [];
  const plan = subscription?.plan;
  const price = plan?.pricing.usd || planSelection?.planPrice || 0;
  const planName = plan?.name || planSelection?.planName || '';
  const onboardingFee = plan?.onboarding_fee?.applicable ? (plan.onboarding_fee.usd || planSelection?.onboardingFee || 0) : 0;
  const total = price + onboardingFee;
  const noPlan = !planName && !planSelection && !subscription;

  const copy = (val: string, key: string) => {
    navigator.clipboard.writeText(val).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleSubmitPayment = () => {
    if (!reference.trim()) return;
    recordPayment.mutate({
      data: {
        amount: total,
        currency: 'USD',
        method: PaymentMethod.BANK_TRANSFER,
        payment_type: PaymentType.SUBSCRIPTION,
        transaction_reference: reference,
        receipt_notes: notes,
        paid_at: new Date().toISOString(),
      },
      receipt: file,
    });
  };

  const recentPayments = payments.slice(0, 5);

  if (noPlan) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS)}
            className={cn('p-2 rounded-lg transition-colors', isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600')}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Payment</h1>
        </div>
        <div className={cn('rounded-2xl border-2 p-10 text-center', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h2 className="text-lg font-bold mb-2">No Plan Selected</h2>
          <p className={cn('text-sm mb-6', isDark ? 'text-gray-400' : 'text-gray-600')}>
            Please select a plan first before proceeding to payment.
          </p>
          <button
            onClick={() => navigate(ADMINISTRATION_PLANS_SUBSCRIPTIONS_ROUTES.AVAILABLE_PLANS)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all"
          >
            Browse Plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      
      {/* Transaction Summary */}
      <div className={cn('rounded-2xl border-2 p-6', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
        <h2 className={cn('font-bold text-sm mb-4 flex items-center gap-2', isDark ? 'text-gray-300' : 'text-gray-700')}>
          <FileText className="w-4 h-4" />
          Transaction Summary
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Plan</span>
            <span className="font-bold">{planName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Plan Price</span>
            <span className="font-bold">${price} USD</span>
          </div>
          {onboardingFee > 0 && (
            <div className="flex justify-between items-center">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Onboarding Fee</span>
              <span className="font-bold">${onboardingFee} USD</span>
            </div>
          )}
          <div className={cn('border-t pt-3 flex justify-between items-center', isDark ? 'border-gray-700' : 'border-gray-200')}>
            <span className="font-bold">Total</span>
            <span className="text-xl font-extrabold text-blue-600">${total} USD</span>
          </div>
        </div>
      </div>

      {/* Payment Method Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setMethod(method === 'bank' ? null : 'bank')}
          className={cn(
            'relative rounded-xl border-2 p-5 text-left transition-all cursor-pointer',
            method === 'bank'
              ? isDark ? 'border-blue-500 bg-blue-500/10 shadow-lg' : 'border-blue-500 bg-blue-50 shadow-lg'
              : isDark ? 'border-gray-700 bg-gray-800/40 hover:border-gray-600' : 'border-gray-200 bg-white hover:border-gray-300'
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center',
              method === 'bank' ? 'bg-blue-600 text-white' : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            )}>
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className={cn('font-bold text-sm', isDark ? 'text-white' : 'text-gray-900')}>Bank Transfer</h3>
              <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>Transfer directly to our bank account</p>
            </div>
          </div>
        </button>

        <div className={cn('rounded-xl border-2 border-dashed p-5', isDark ? 'border-gray-700 bg-gray-800/20' : 'border-gray-300 bg-gray-50/50')}>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-400')}>
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className={cn('font-bold text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>Mobile Money</h3>
              <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>Coming soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Transfer Details — shown only when selected */}
      <AnimatePresence>
        {method === 'bank' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={cn('rounded-2xl border-2 overflow-hidden', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}
          >
            <div className={cn('px-6 py-4 border-b flex items-center gap-2', isDark ? 'border-gray-800 bg-gray-800/40' : 'border-gray-200 bg-gray-50')}>
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className={cn('font-semibold text-sm', isDark ? 'text-gray-200' : 'text-gray-800')}>Bank Account Details</span>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Bank', value: BANK_DETAILS.bank, key: 'bank' },
                { label: 'Account Name', value: BANK_DETAILS.accountName, key: 'name' },
                { label: 'Account Number', value: BANK_DETAILS.accountNumber, key: 'num' },
              ].map(({ label, value, key }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>{label}</p>
                    <p className="font-semibold">{value}</p>
                  </div>
                  <button onClick={() => copy(value, key)}
                    className={cn('p-1.5 rounded-lg', isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}>
                    {copied === key ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>

            {/* Upload Proof of Payment */}
            <div className={cn('px-6 py-4 border-t', isDark ? 'border-gray-800' : 'border-gray-200')}>
              <h3 className={cn('font-semibold text-sm mb-3', isDark ? 'text-gray-200' : 'text-gray-800')}>Upload Proof of Payment</h3>
              <div className="space-y-3">
                <div className={cn(
                  'rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors',
                  isDark ? 'border-gray-700 hover:border-blue-500 bg-gray-800/40' : 'border-gray-300 hover:border-blue-500 bg-gray-50'
                )}>
                  <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" id="receipt-upload" />
                  <label htmlFor="receipt-upload" className="cursor-pointer block">
                    {file ? (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className={cn('text-sm font-medium', isDark ? 'text-gray-200' : 'text-gray-800')}>{file.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Upload className={cn('w-6 h-6', isDark ? 'text-gray-500' : 'text-gray-400')} />
                        <span className={cn('text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-700')}>Upload receipt or screenshot</span>
                        <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>PNG, JPG or PDF</span>
                      </div>
                    )}
                  </label>
                </div>

                <input
                  type="text"
                  placeholder="Transaction reference (e.g. STANBIC-12345)"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className={cn(
                    'w-full px-4 py-2.5 rounded-lg border text-sm',
                    isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  )}
                />

                <textarea
                  placeholder="Additional notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className={cn(
                    'w-full px-4 py-2.5 rounded-lg border text-sm',
                    isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  )}
                />

                <button
                  onClick={handleSubmitPayment}
                  disabled={!reference.trim() || recordPayment.isPending}
                  className={cn(
                    'w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2',
                    'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]',
                    (recordPayment.isPending) && 'opacity-60 cursor-wait',
                  )}
                >
                  {recordPayment.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                  ) : submitted ? (
                    <><CheckCircle className="w-4 h-4" /> Payment Submitted</>
                  ) : (
                    'Submit Payment'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('rounded-xl p-4 border text-center', isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200')}
        >
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="font-bold text-green-700 dark:text-green-300">Payment Submitted</p>
          <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
            Your payment is pending admin approval. You will be notified once it is confirmed.
          </p>
        </motion.div>
      )}

      {/* Recent Payments */}
      {recentPayments.length > 0 && !submitted && (
        <div className={cn('rounded-2xl border overflow-hidden', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
          <div className={cn('p-4 border-b font-semibold', isDark ? 'border-gray-800' : 'border-gray-200')}>Recent Payments</div>
          <div className="divide-y" style={{ borderColor: isDark ? '#1f2a37' : '#e5e7eb' }}>
            {recentPayments.map((p: Payment) => (
              <div key={p.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">${p.amount} {p.currency}</p>
                  <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>{p.payment_type_label} · {p.method_label}</p>
                </div>
                <span className={cn(
                  'text-sm font-medium',
                  p.status === PaymentStatus.APPROVED ? 'text-green-500' :
                  p.status === PaymentStatus.PENDING ? 'text-yellow-500' : 'text-red-500'
                )}>
                  {p.status_label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* More payment methods note */}
      <div className={cn('rounded-xl border border-dashed p-4 text-center', isDark ? 'border-gray-700 bg-gray-800/10' : 'border-gray-200 bg-gray-50/50')}>
        <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-500')}>
          More payment methods are being integrated — card payments, PayPal, and mobile money.
        </p>
      </div>
    </div>
  );
};

export default Payments;
