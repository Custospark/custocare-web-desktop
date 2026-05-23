import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, Clock, CreditCard, RefreshCw, Loader2, AlertTriangle, Building2 } from 'lucide-react';
import { cn } from '../../../shared/types/cn';
import { useGetAdminSubscriptions, useGetAdminPayments, useAdminApprovePayment, useAdminRejectPayment } from '../../administration/admin-module/api/subscriptions/SubscriptionQueries';
import { SubscriptionStatus, PaymentStatus, type Subscription, type Payment } from '../../administration/admin-module/api/subscriptions/SubscriptionTypes';

interface Props { theme: 'light' | 'dark' }

const statusColors = (s: string, d: boolean) => {
  if (s === SubscriptionStatus.TRIAL) return { bg: d ? 'bg-blue-900/30' : 'bg-blue-100', text: d ? 'text-blue-300' : 'text-blue-700' };
  if (s === SubscriptionStatus.ACTIVE) return { bg: d ? 'bg-emerald-900/30' : 'bg-emerald-100', text: d ? 'text-emerald-300' : 'text-emerald-700' };
  if (s === SubscriptionStatus.PAST_DUE) return { bg: d ? 'bg-amber-900/30' : 'bg-amber-100', text: d ? 'text-amber-300' : 'text-amber-700' };
  if (s === SubscriptionStatus.SUSPENDED) return { bg: d ? 'bg-red-900/30' : 'bg-red-100', text: d ? 'text-red-300' : 'text-red-700' };
  return { bg: d ? 'bg-gray-800' : 'bg-gray-100', text: d ? 'text-gray-400' : 'text-gray-600' };
};

const FacilitySubscriptions: React.FC<Props> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [search, setSearch] = useState('');
  const [rejectTarget, setRejectTarget] = useState<{ paymentId: number; facility: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: subsRes, isLoading, refetch } = useGetAdminSubscriptions({ per_page: 100 });
  const { data: paysRes } = useGetAdminPayments({ status: 'pending', per_page: 100 });

  const approvePay = useAdminApprovePayment({ onSuccess: () => refetch() });
  const rejectPay = useAdminRejectPayment({
    onSuccess: () => { setRejectTarget(null); setRejectReason(''); refetch(); },
  });

  const subs = subsRes?.data || [];
  const pendingPays = paysRes?.data || [];

  const filtered = subs.filter((s) =>
    (s.facility?.facility_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.plan?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Facility Subscriptions</h1>
          <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
            {subs.length} subscription{subs.length !== 1 ? 's' : ''} · {pendingPays.length} pending payment{pendingPays.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => refetch()} className={cn('p-2 rounded-lg transition-colors', isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100')}>
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-gray-500' : 'text-gray-400')} />
        <input type="text" placeholder="Search by facility or plan..." value={search} onChange={(e) => setSearch(e.target.value)}
          className={cn('w-full pl-10 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
            isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400')} />
      </div>

      {/* Pending Payments Banner */}
      {pendingPays.length > 0 && (
        <div className={cn('rounded-xl border-2 p-4', isDark ? 'bg-amber-900/20 border-amber-700/50' : 'bg-amber-50 border-amber-200')}>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-sm">{pendingPays.length} pending payment{pendingPays.length !== 1 ? 's' : ''} require your review</span>
          </div>
          <div className="space-y-2">
            {pendingPays.map((p: Payment) => (
              <div key={p.id} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Building2 className={cn('w-4 h-4 shrink-0', isDark ? 'text-gray-400' : 'text-gray-500')} />
                  <span className="text-sm font-medium truncate">Payment #{p.id}</span>
                  <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-500')}>${p.amount} {p.currency}</span>
                  {p.transaction_reference && <span className={cn('text-xs font-mono', isDark ? 'text-gray-500' : 'text-gray-400')}>Ref: {p.transaction_reference}</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => approvePay.mutate({ paymentId: p.id })}
                    disabled={approvePay.isPending}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all',
                      'bg-emerald-600 hover:bg-emerald-700 text-white', approvePay.isPending && 'opacity-60 cursor-wait')}>
                    {approvePay.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                    Approve
                  </button>
                  <button onClick={() => setRejectTarget({ paymentId: p.id, facility: `Payment #${p.id}` })}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all',
                      isDark ? 'border-red-800 text-red-300 hover:bg-red-900/30' : 'border-red-200 text-red-700 hover:bg-red-50')}>
                    <XCircle className="w-3 h-3" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscriptions Table */}
      {filtered.length === 0 ? (
        <div className={cn('rounded-2xl p-10 text-center border', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
          <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>No subscriptions found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={cn('border-b-2', isDark ? 'border-gray-700' : 'border-gray-200')}>
                <th className="text-left py-3 px-2 font-semibold">Facility</th>
                <th className="text-left py-3 px-2 font-semibold">Plan</th>
                <th className="text-center py-3 px-2 font-semibold">Status</th>
                <th className="text-center py-3 px-2 font-semibold">Onboarding Fee</th>
                <th className="text-center py-3 px-2 font-semibold">Payments</th>
                <th className="text-right py-3 px-2 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className={cn('divide-y', isDark ? 'divide-gray-800' : 'divide-gray-100')}>
              {filtered.map((s: Subscription) => {
                const sc = statusColors(s.status, isDark);
                const pendingPayments = (s.payments || []).filter((p: Payment) => p.status === PaymentStatus.PENDING);
                const approvedPayments = (s.payments || []).filter((p: Payment) => p.status === PaymentStatus.APPROVED);
                return (
                  <tr key={s.id} className={cn(isDark ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50')}>
                    <td className="py-3 px-2">
                      <p className="font-medium">{s.facility?.facility_name || 'N/A'}</p>
                      {s.facility?.facility_code && <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>{s.facility.facility_code}</p>}
                    </td>
                    <td className="py-3 px-2">
                      <p className="font-medium">{s.plan?.name || 'N/A'}</p>
                      <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>${s.plan?.pricing?.usd || 0}/mo</p>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold', sc.bg, sc.text)}>
                        {s.status_label}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      {s.onboarding_fee_paid ? (
                        <span className="text-emerald-500 font-medium">Paid</span>
                      ) : (
                        <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {approvedPayments.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-emerald-500">
                            <CheckCircle className="w-3 h-3" /> {approvedPayments.length}
                          </span>
                        )}
                        {pendingPayments.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-amber-500">
                            <Clock className="w-3 h-3" /> {pendingPayments.length}
                          </span>
                        )}
                        {s.payments && s.payments.length === 0 && (
                          <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
                        {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => !rejectPay.isPending && setRejectTarget(null)}>
          <div className={cn('relative rounded-2xl max-w-md w-full border-2 p-6', isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200')}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className={cn('p-2 rounded-full', isDark ? 'bg-red-900/30' : 'bg-red-100')}>
                <AlertTriangle className={cn('w-6 h-6', isDark ? 'text-red-400' : 'text-red-600')} />
              </div>
              <h3 className="text-lg font-bold">Reject Payment</h3>
            </div>
            <p className={cn('text-sm mb-4', isDark ? 'text-gray-300' : 'text-gray-700')}>
              Reject the payment from <strong>{rejectTarget.facility}</strong>. A reason is required (minimum 10 characters).
            </p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Why is this payment being rejected?"
              rows={3}
              className={cn('w-full px-3 py-2 rounded-lg border text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500',
                isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400')} />
            <div className="flex gap-3">
              <button onClick={() => rejectPay.mutate({ paymentId: rejectTarget.paymentId, data: { reason: rejectReason } })}
                disabled={rejectReason.length < 10 || rejectPay.isPending}
                className={cn('flex-1 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2',
                  'bg-red-600 hover:bg-red-700 text-white',
                  (rejectReason.length < 10 || rejectPay.isPending) && 'opacity-60 cursor-not-allowed')}>
                {rejectPay.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Rejecting…</> : 'Reject Payment'}
              </button>
              <button onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                disabled={rejectPay.isPending}
                className={cn('flex-1 py-2.5 rounded-lg font-bold text-sm',
                  isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacilitySubscriptions;
