import { useCallback, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AlertCircle, ChevronLeft, ChevronRight, CreditCard, Eye, Search } from 'lucide-react';
import type { RootState } from '../../../../app/store/rootReducer';
import { getPatientId } from '../../../../app/store/utils/contextSelectors';
import { selectActiveFacilityCurrency } from '../../../../app/store/slices/activeContextSlice';
import { formatCurrency } from '../../../../shared/utils/formatCurrency';
import type { BillingReviewItem } from '../../../medical-records/api/billing-review/BillingReviewTypes';
import { BillingInvoicePreviewModal } from '../../../billling/ui/revenue/BillingInvoicePreviewModal';
import { invoiceNumberFromBillingItem } from '../../../billling/ui/revenue/billingInvoiceFromReceiptUtils';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';
import { usePatientPortalBilling } from '../../api/patientPortalBillingQueries';

type Ctx = { theme: 'light' | 'dark' };

type BillingRow = BillingReviewItem & {
  facility_id?: number;
  facility_name?: string | null;
};

function formatMoney(amount: number, currencyCode?: string | null): string {
  return formatCurrency(amount, currencyCode ?? undefined);
}

function formatVisitWhen(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export function PatientPortalBillingPaymentsPage() {
  const { theme } = useOutletContext<Ctx>();
  const isDark = theme === 'dark';
  const patientId = useSelector((state: RootState) => getPatientId(state));
  const currencyCode = useSelector(selectActiveFacilityCurrency);
  const numericId = patientId ?? 0;

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const billingQuery = usePatientPortalBilling({
    page,
    per_page: 20,
    search: debouncedSearch || undefined,
  });

  const [previewItem, setPreviewItem] = useState<BillingReviewItem | null>(null);

  const rows = useMemo((): BillingRow[] => {
    const items = billingQuery.data?.data?.items ?? [];
    return items as BillingRow[];
  }, [billingQuery.data?.data?.items]);

  const summary = billingQuery.data?.data?.summary;
  const pagination = billingQuery.data?.data?.pagination;

  const onPrev = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const onNext = useCallback(() => {
    if (pagination?.has_next) setPage((p) => p + 1);
  }, [pagination?.has_next]);

  if (!numericId) {
    return (
      <div className="p-6 text-sm text-slate-600 dark:text-slate-400">
        Your patient record could not be resolved from this session. Please sign in again or contact support.
      </div>
    );
  }

  if (billingQuery.isError) {
    const status = billingQuery.error?.response?.status;
    const msg =
      status === 403
        ? 'Billing is only available when a patient profile is linked to your account.'
        : (billingQuery.error as Error)?.message ?? 'Unable to load billing.';

    return (
      <div
        className={`m-6 flex gap-3 rounded-xl border p-6 ${
          isDark ? 'border-red-900 bg-red-950/40' : 'border-red-200 bg-red-50'
        }`}
      >
        <AlertCircle className={`mt-0.5 h-5 w-5 shrink-0 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
        <div>
          <h3 className={`font-semibold ${isDark ? 'text-red-200' : 'text-red-800'}`}>Could not load billing</h3>
          <p className={`mt-1 text-sm ${isDark ? 'text-red-300/90' : 'text-red-700'}`}>{msg}</p>
        </div>
      </div>
    );
  }

  if (billingQuery.isPending && !billingQuery.data) {
    return (
      <div className="p-6">
        <LoadingSkeleton variant="dashboard" theme={theme} message="Loading your billing and receipts…" />
      </div>
    );
  }

  const borderCard = isDark ? 'border-slate-700 bg-slate-900/80' : 'border-slate-200 bg-white';
  const thead = isDark ? 'bg-slate-800/90 text-slate-200' : 'bg-slate-50 text-slate-700';
  const rowBorder = isDark ? 'border-t border-slate-800' : 'border-t border-slate-100';

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className={`rounded-xl border p-5 ${borderCard}`}>
        <div className="flex flex-wrap items-start gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              isDark ? 'bg-blue-950/80 text-blue-300' : 'bg-blue-50 text-blue-700'
            }`}
          >
            <CreditCard className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className={`text-lg font-semibold sm:text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Billing & payments
            </h1>
            <p className={`mt-1 max-w-3xl text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Healthcare charges and payments across all your visits. Preview opens the same printable receipt used in
              medical records — use Print from the preview to save or print a copy.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search
              className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}
              aria-hidden
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder="Search by receipt, visit, or facility name…"
              className={`w-full cursor-text rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none ring-blue-500/30 transition focus:ring-2 ${
                isDark
                  ? 'border-slate-600 bg-slate-950 text-slate-100 placeholder:text-slate-500'
                  : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
              }`}
              aria-label="Search billing"
            />
          </div>
        </div>
      </header>

      {summary ? (
        <section className="grid gap-4 sm:grid-cols-3">
          <SummaryStat
            label="Total billed (all receipts)"
            value={formatMoney(summary.total_billed, currencyCode)}
            hint={`${summary.receipt_count} receipt${summary.receipt_count === 1 ? '' : 's'}`}
            isDark={isDark}
            accent="blue"
          />
          <SummaryStat
            label="Total paid"
            value={formatMoney(summary.total_paid, currencyCode)}
            hint="Across visits and facilities"
            isDark={isDark}
            accent="cyan"
          />
          <SummaryStat
            label="Outstanding balance"
            value={formatMoney(summary.total_balance, currencyCode)}
            hint="Sum of open balances on file"
            isDark={isDark}
            accent="slate"
          />
        </section>
      ) : null}

      <section className={`overflow-hidden rounded-xl border ${borderCard}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className={thead}>
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Facility</th>
                <th className="px-4 py-3 text-left font-semibold">Invoice</th>
                <th className="px-4 py-3 text-left font-semibold">Receipt #</th>
                <th className="px-4 py-3 text-right font-semibold">Amount</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {billingQuery.isFetching && rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-600 dark:text-slate-400">
                    No billing receipts on file yet. When you receive care, finalized charges will appear here with
                    printable receipts.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const inv = invoiceNumberFromBillingItem(row);
                  const grand = row.billing_data?.grandTotal ?? 0;
                  const facilityLabel =
                    row.facility_name?.trim() || (row.facility_id ? `Facility #${row.facility_id}` : '—');

                  return (
                    <tr key={`${row.billing_cycle_id ?? row.visit_id}-${row.visit_uuid}`} className={rowBorder}>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-slate-300">
                        {formatVisitWhen(row.billed_at ?? row.created_at)}
                      </td>
                      <td className="max-w-[200px] px-4 py-3 text-slate-800 dark:text-slate-200">
                        <span className="line-clamp-2" title={facilityLabel}>
                          {facilityLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-medium text-slate-800 dark:text-slate-100">
                        {inv}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                        {row.receipt_number ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-50">
                        {formatMoney(Number(grand), currencyCode)}
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-700 dark:text-slate-300">
                        {(row.billing_status ?? row.status ?? '—').toString().replace(/_/g, ' ')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setPreviewItem(row)}
                          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                            isDark
                              ? 'bg-blue-900/50 text-blue-100 hover:bg-blue-800/70'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden />
                          Preview / print
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.total_items > 0 ? (
          <div
            className={`flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm ${
              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'
            }`}
          >
            <span>
              Showing {pagination.from ?? 0}–{pagination.to ?? 0} of {pagination.total_items}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPrev}
                disabled={!pagination.has_previous}
                className={`inline-flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-1.5 font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  isDark
                    ? 'border-slate-600 text-slate-200 hover:bg-slate-800'
                    : 'border-slate-200 text-slate-800 hover:bg-slate-50'
                }`}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Previous
              </button>
              <button
                type="button"
                onClick={onNext}
                disabled={!pagination.has_next}
                className={`inline-flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-1.5 font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  isDark
                    ? 'border-slate-600 text-slate-200 hover:bg-slate-800'
                    : 'border-slate-200 text-slate-800 hover:bg-slate-50'
                }`}
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {previewItem ? (
        <BillingInvoicePreviewModal item={previewItem} theme={theme} onClose={() => setPreviewItem(null)} />
      ) : null}
    </div>
  );
}

function SummaryStat(props: {
  label: string;
  value: string;
  hint: string;
  isDark: boolean;
  accent: 'blue' | 'cyan' | 'slate';
}) {
  const { label, value, hint, isDark, accent } = props;
  const ring =
    accent === 'blue'
      ? isDark
        ? 'border-blue-900/60 bg-blue-950/30'
        : 'border-blue-100 bg-blue-50/80'
      : accent === 'cyan'
        ? isDark
          ? 'border-cyan-900/50 bg-cyan-950/25'
          : 'border-cyan-100 bg-cyan-50/80'
        : isDark
          ? 'border-slate-700 bg-slate-950/40'
          : 'border-slate-200 bg-slate-50';

  return (
    <div className={`rounded-xl border p-4 ${ring}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {label}
      </p>
      <p className={`mt-2 text-xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
      <p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>{hint}</p>
    </div>
  );
}
