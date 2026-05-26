import React, { useMemo, useState } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Filter,
  ChevronDown,
  ChevronUp,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../../shared/types/cn';
import { ReceiptViewButton } from '../../../shared/components/billing/ReceiptViewButton';
import { useClientPagination } from '../../../shared/hooks/useClientPagination';
import { useConfirm } from '../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import {
  useGetAdminSubscriptions,
  useGetAdminPayments,
  useAdminApprovePayment,
  useAdminRejectPayment,
} from '../../administration/admin-module/api/subscriptions/SubscriptionQueries';
import {
  SubscriptionStatus,
  PaymentStatus,
  type Subscription,
  type Payment,
  type BillingFacilitySummary,
} from '../../administration/admin-module/api/subscriptions/SubscriptionTypes';
import { BillingFacilityDetailModal } from './BillingFacilityDetailModal';

interface Props {
  theme: 'light' | 'dark';
}

const statusCfg = (s: string, d: boolean) => {
  if (s === SubscriptionStatus.TRIAL) return { bg: d ? 'bg-blue-900/30' : 'bg-blue-100', text: d ? 'text-blue-300' : 'text-blue-700' };
  if (s === SubscriptionStatus.ACTIVE) return { bg: d ? 'bg-emerald-900/50' : 'bg-emerald-200', text: d ? 'text-emerald-200' : 'text-emerald-900' };
  if (s === SubscriptionStatus.PAST_DUE) return { bg: d ? 'bg-amber-900/30' : 'bg-amber-100', text: d ? 'text-amber-300' : 'text-amber-700' };
  if (s === SubscriptionStatus.SUSPENDED) return { bg: d ? 'bg-red-900/30' : 'bg-red-100', text: d ? 'text-red-300' : 'text-red-700' };
  return { bg: d ? 'bg-gray-800' : 'bg-gray-100', text: d ? 'text-gray-400' : 'text-gray-600' };
};

const facilitySearchText = (facility?: BillingFacilitySummary | null): string => {
  if (!facility) return '';
  return [
    facility.facility_name,
    facility.facility_code,
    facility.location_label,
    facility.phone,
    facility.email,
    facility.owner?.name,
    facility.owner?.email,
    facility.owner?.phone,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

const PaginationBar: React.FC<{
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
  onPageSize: (n: number) => void;
  isDark: boolean;
}> = ({ page, totalPages, total, pageSize, onPage, onPageSize, isDark }) => (
  <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
    <span>
      {total === 0 ? 'No rows' : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
    </span>
    <div className="flex items-center gap-2">
      <select
        value={pageSize}
        onChange={(e) => onPageSize(Number(e.target.value))}
        className={cn('px-2 py-1 rounded-lg border text-xs', isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200')}
      >
        {[10, 25, 50, 100].map((n) => (
          <option key={n} value={n}>{n} / page</option>
        ))}
      </select>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className={cn('p-1.5 rounded-lg border disabled:opacity-40', isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50')}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-xs font-medium px-1">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
        className={cn('p-1.5 rounded-lg border disabled:opacity-40', isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50')}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);

const FacilityIconButton: React.FC<{
  facility?: BillingFacilitySummary | null;
  isDark: boolean;
  onOpen: (facility: BillingFacilitySummary) => void;
}> = ({ facility, isDark, onOpen }) => {
  if (!facility?.id) {
    return <span className={cn('text-xs', isDark ? 'text-gray-600' : 'text-gray-400')}>—</span>;
  }
  return (
    <button
      type="button"
      onClick={() => onOpen(facility)}
      title={facility.facility_name || 'View facility'}
      className={cn(
        'p-2 rounded-lg border transition-colors',
        isDark
          ? 'border-gray-700 text-blue-400 hover:bg-blue-500/10'
          : 'border-gray-200 text-blue-600 hover:bg-blue-50',
      )}
    >
      <Building2 className="w-4 h-4" />
    </button>
  );
};

const FacilitySubscriptions: React.FC<Props> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [tab, setTab] = useState<'subscriptions' | 'payments'>('subscriptions');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ paymentId: number; label: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [facilityModal, setFacilityModal] = useState<BillingFacilitySummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { confirm } = useConfirm();

  const { data: subsRes, isLoading: subsLoading, refetch: refetchSubs } = useGetAdminSubscriptions({ per_page: 500 });
  const { data: paysRes, isLoading: paysLoading, refetch: refetchPays } = useGetAdminPayments({ per_page: 500 });

  const approvePay = useAdminApprovePayment({ onSuccess: () => { refetchSubs(); refetchPays(); } });
  const rejectPay = useAdminRejectPayment({
    onSuccess: () => {
      setRejectTarget(null);
      setRejectReason('');
      refetchSubs();
      refetchPays();
    },
  });

  const subs = subsRes?.data || [];
  const pays = paysRes?.data || [];
  const pendingPays = pays.filter((p: Payment) => p.status === PaymentStatus.PENDING);

  const filteredSubs = useMemo(() => {
    const q = search.toLowerCase().trim();
    return subs.filter((s: Subscription) => {
      const matchSearch =
        !q
        || facilitySearchText(s.facility).includes(q)
        || (s.plan?.name || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [subs, search, statusFilter]);

  const filteredPays = useMemo(() => {
    const q = search.toLowerCase().trim();
    return pays.filter((p: Payment) => {
      const matchSearch =
        !q
        || facilitySearchText(p.facility).includes(q)
        || (p.transaction_reference || '').toLowerCase().includes(q)
        || String(p.amount).includes(q)
        || (p.plan_name || '').toLowerCase().includes(q);
      const matchStatus = paymentStatusFilter === 'all' || p.status === paymentStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [pays, search, paymentStatusFilter]);

  const subsPagination = useClientPagination(filteredSubs, { initialPageSize: 10 });
  const paysPagination = useClientPagination(filteredPays, { initialPageSize: 10 });

  const isLoading = subsLoading || paysLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Facility Subscriptions</h1>
          <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
            {subs.length} subscriptions · {pendingPays.length} pending payments
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            setRefreshing(true);
            await Promise.all([refetchSubs(), refetchPays()]);
            setRefreshing(false);
          }}
          disabled={refreshing}
          className={cn('p-2 rounded-lg', isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100')}
          aria-label="Refresh"
        >
          <RefreshCw className={cn('w-5 h-5', refreshing && 'animate-spin')} />
        </button>
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
        {(['subscriptions', 'payments'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-semibold border-b-2 transition-colors -mb-px cursor-pointer',
              tab === t
                ? 'border-blue-600 text-blue-600'
                : cn('border-transparent', isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'),
            )}
          >
            {t === 'subscriptions' ? 'Subscriptions' : 'Payments'}
            {t === 'payments' && pendingPays.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500 text-white">
                {pendingPays.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', isDark ? 'text-gray-500' : 'text-gray-400')} />
          <input
            type="text"
            placeholder={
              tab === 'subscriptions'
                ? 'Search facility, owner, plan…'
                : 'Search facility, owner, reference, plan…'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              'w-full pl-10 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
              isDark
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400',
            )}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'px-3 py-2 rounded-lg border text-sm font-medium flex items-center gap-2',
            isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700',
          )}
        >
          <Filter className="w-4 h-4" />
          Filters
          {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        {showFilters && tab === 'subscriptions' && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={cn(
              'px-3 py-2 rounded-lg border text-sm',
              isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900',
            )}
          >
            <option value="all">All statuses</option>
            {Object.values(SubscriptionStatus).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
        {showFilters && tab === 'payments' && (
          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className={cn(
              'px-3 py-2 rounded-lg border text-sm',
              isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900',
            )}
          >
            <option value="all">All statuses</option>
            {Object.values(PaymentStatus).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
      </div>

      {tab === 'subscriptions' && (
        <div className={cn('rounded-2xl border overflow-hidden', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
          {filteredSubs.length === 0 ? (
            <div className="p-10 text-center">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>No subscriptions match your filters.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={cn('border-b', isDark ? 'border-gray-800 bg-gray-800/50' : 'border-gray-100 bg-gray-50')}>
                      <th className="text-left py-3 px-3 font-semibold w-14">Facility</th>
                      <th className="text-left py-3 px-2 font-semibold">Plan</th>
                      <th className="text-center py-3 px-2 font-semibold">Status</th>
                      <th className="text-center py-3 px-2 font-semibold">Onboarding</th>
                      <th className="text-center py-3 px-2 font-semibold">Payments</th>
                      <th className="text-right py-3 px-2 font-semibold">Created</th>
                    </tr>
                  </thead>
                  <tbody className={cn('divide-y', isDark ? 'divide-gray-800' : 'divide-gray-100')}>
                    {subsPagination.pageItems.map((s: Subscription) => {
                      const sc = statusCfg(s.status, isDark);
                      const pending = s.pending_payments_count ?? 0;
                      const approved = s.approved_payments_count ?? 0;
                      return (
                        <tr key={s.id} className={cn(isDark ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50')}>
                          <td className="py-3 px-3">
                            <FacilityIconButton facility={s.facility} isDark={isDark} onOpen={setFacilityModal} />
                          </td>
                          <td className="py-3 px-2">
                            <p className="font-medium">{s.plan?.name || '—'}</p>
                            <p className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>
                              ${s.plan?.pricing?.usd ?? 0}/mo
                            </p>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-bold', sc.bg, sc.text)}>
                              {s.status_label}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center text-xs">
                            {s.onboarding_fee_paid ? (
                              <span className="font-medium text-emerald-600 dark:text-emerald-400">Paid</span>
                            ) : (
                              <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Pending</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <div className="flex items-center justify-center gap-2 text-xs">
                              {approved > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle className="w-3 h-3" /> {approved}
                                </span>
                              )}
                              {pending > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-amber-500">
                                  <Clock className="w-3 h-3" /> {pending}
                                </span>
                              )}
                              {pending === 0 && approved === 0 && (
                                <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>—</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-right text-xs text-gray-500">
                            {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 pb-4">
                <PaginationBar
                  {...subsPagination}
                  onPage={subsPagination.setPage}
                  onPageSize={subsPagination.setPageSize}
                  isDark={isDark}
                />
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'payments' && (
        <div className={cn('rounded-2xl border overflow-hidden', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
          {filteredPays.length === 0 ? (
            <div className="p-10 text-center">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>No payments match your filters.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={cn('border-b', isDark ? 'border-gray-800 bg-gray-800/50' : 'border-gray-100 bg-gray-50')}>
                      <th className="text-left py-3 px-2 font-semibold">Reference</th>
                      <th className="text-left py-3 px-3 font-semibold w-14">Facility</th>
                      <th className="text-left py-3 px-2 font-semibold">Plan</th>
                      <th className="text-right py-3 px-2 font-semibold">Amount</th>
                      <th className="text-center py-3 px-2 font-semibold">Status</th>
                      <th className="text-center py-3 px-2 font-semibold">Date</th>
                      <th className="text-center py-3 px-2 font-semibold w-16">Receipt</th>
                      <th className="text-center py-3 px-2 font-semibold w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody className={cn('divide-y', isDark ? 'divide-gray-800' : 'divide-gray-100')}>
                    {paysPagination.pageItems.map((p: Payment) => (
                      <tr key={p.id} className={cn(isDark ? 'hover:bg-gray-800/40' : 'hover:bg-gray-50')}>
                        <td className="py-3 px-2">
                          <p className="font-mono text-xs font-medium">{p.transaction_reference || `#${p.id}`}</p>
                          <p className={cn('text-[10px]', isDark ? 'text-gray-500' : 'text-gray-400')}>{p.payment_type_label}</p>
                        </td>
                        <td className="py-3 px-3">
                          <FacilityIconButton facility={p.facility} isDark={isDark} onOpen={setFacilityModal} />
                        </td>
                        <td className="py-3 px-2">
                          <p className="font-medium text-sm">{p.plan_name || '—'}</p>
                        </td>
                        <td className="py-3 px-2 text-right font-medium whitespace-nowrap">
                          ${p.amount} {p.currency}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span
                            className={cn(
                              'inline-flex px-2 py-0.5 rounded-full text-xs font-bold',
                              p.status === PaymentStatus.APPROVED
                                ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100'
                                : p.status === PaymentStatus.PENDING
                                  ? 'bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
                            )}
                          >
                            {p.status_label}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center text-xs text-gray-500">
                          {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {(p.receipt_download_url || p.receipt_url) ? (
                            <ReceiptViewButton
                              receiptDownloadUrl={p.receipt_download_url}
                              receiptUrl={p.receipt_url}
                              className={isDark ? 'text-blue-400' : 'text-blue-600'}
                            />
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {p.status === PaymentStatus.PENDING ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={async () => {
                                  const confirmed = await confirm({
                                    title: 'Approve Payment',
                                    message: 'Approve this payment and activate the subscription for this facility?',
                                    confirmText: 'Approve',
                                    cancelText: 'Cancel',
                                    variant: 'info',
                                    theme,
                                  });
                                  if (!confirmed) return;
                                  approvePay.mutate({ paymentId: p.id });
                                }}
                                disabled={approvePay.isPending}
                                className={cn('p-1.5 rounded-md', isDark ? 'hover:bg-emerald-900/30 text-emerald-400' : 'hover:bg-emerald-100 text-emerald-600')}
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectTarget({
                                  paymentId: p.id,
                                  label: p.facility?.facility_name || p.transaction_reference || `Payment #${p.id}`,
                                })}
                                className={cn('p-1.5 rounded-md', isDark ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-100 text-red-600')}
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 pb-4">
                <PaginationBar
                  {...paysPagination}
                  onPage={paysPagination.setPage}
                  onPageSize={paysPagination.setPageSize}
                  isDark={isDark}
                />
              </div>
            </>
          )}
        </div>
      )}

      <BillingFacilityDetailModal
        facility={facilityModal}
        isDark={isDark}
        onClose={() => setFacilityModal(null)}
      />

      {rejectTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => !rejectPay.isPending && setRejectTarget(null)}
          role="presentation"
        >
          <div
            className={cn('relative rounded-2xl max-w-md w-full border-2 p-6', isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200')}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={cn('p-2 rounded-full', isDark ? 'bg-red-900/30' : 'bg-red-100')}>
                <AlertTriangle className={cn('w-6 h-6', isDark ? 'text-red-400' : 'text-red-600')} />
              </div>
              <h3 className="text-lg font-bold">Reject payment</h3>
            </div>
            <p className={cn('text-sm mb-4', isDark ? 'text-gray-300' : 'text-gray-700')}>
              Reject payment for <strong>{rejectTarget.label}</strong>. Reason required (min 10 characters).
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Why is this payment being rejected?"
              rows={3}
              className={cn(
                'w-full px-3 py-2 rounded-lg border text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500',
                isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900',
              )}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => rejectPay.mutate({ paymentId: rejectTarget.paymentId, data: { reason: rejectReason } })}
                disabled={rejectReason.length < 10 || rejectPay.isPending}
                className={cn(
                  'flex-1 py-2.5 rounded-lg font-bold text-sm bg-red-600 hover:bg-red-700 text-white',
                  (rejectReason.length < 10 || rejectPay.isPending) && 'opacity-60 cursor-not-allowed',
                )}
              >
                {rejectPay.isPending ? 'Rejecting…' : 'Reject'}
              </button>
              <button
                type="button"
                onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                disabled={rejectPay.isPending}
                className={cn('flex-1 py-2.5 rounded-lg font-bold text-sm', isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700')}
              >
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
