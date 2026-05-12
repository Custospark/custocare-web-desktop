import React, { useCallback, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
  Bell,
  Calendar,
  ChevronRight,
  CreditCard,
  Download,
  FileText,
  FlaskConical,
  Pill,
  RefreshCw,
  Stethoscope,
} from 'lucide-react';
import type { RootState } from '../../../../app/store/rootReducer';
import { getPatientId } from '../../../../app/store/utils/contextSelectors';
import { PATIENT_PORTAL_ROUTES } from '../../../../app/routes/routeConstants';
import { patientMedicalHistoryKeys, patientLatestVisitContextKeys } from '../../../medical-records/api/patient-medical-history/patientMedicalHistoryQueries';
import { usePatientPortalLatestEncounter } from '../../hooks/usePatientPortalLatestEncounter';
import { usePatientPortalAppointmentsList, extractAppointmentsList } from '../../api/appointmentPortalQueries';
import { appointmentPortalKeys } from '../../api/appointmentPortalQueries';
import { usePatientPortalBilling, patientPortalBillingKeys } from '../../api/patientPortalBillingQueries';
import { useGetMessageStats, messageKeys } from '../../../account/api/messages/MessageQueries';
import { invoiceNumberFromBillingItem } from '../../../billling/ui/revenue/billingInvoiceFromReceiptUtils';
import LoadingSkeleton from '../../../../shared/components/Loading/LoadingSkeletons';

type Ctx = { theme: 'light' | 'dark' };

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '—';
  }
}

export function PatientPortalDashboardPage() {
  const { theme } = useOutletContext<Ctx>();
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const patientId = useSelector((state: RootState) => getPatientId(state));
  const numericId = patientId ?? 0;

  const [lastRefreshed, setLastRefreshed] = useState(() => new Date());
  /** Snapshot time for “upcoming” filtering — avoids impure `Date.now()` inside `useMemo` during render. */
  const [asOfMs, setAsOfMs] = useState(() => Date.now());

  const {
    historyQuery,
    latestVisitContextQuery,
    effectiveVisitId,
    scopedForEffective,
    headerVisit,
    headerFacility,
    patientDisplayName,
  } = usePatientPortalLatestEncounter(numericId);

  const appointmentsQuery = usePatientPortalAppointmentsList(numericId, { perPage: 50 });
  const billingQuery = usePatientPortalBilling({ page: 1, per_page: 5 });
  const messageStatsQuery = useGetMessageStats({
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  const appointments = useMemo(
    () => extractAppointmentsList(appointmentsQuery.data),
    [appointmentsQuery.data]
  );

  const upcomingAppointments = useMemo(() => {
    const now = asOfMs;
    return [...appointments]
      .filter((a) => {
        if (a.is_upcoming) return true;
        if (!a.scheduled_start_time) return false;
        return new Date(a.scheduled_start_time).getTime() >= now - 120_000;
      })
      .sort((a, b) => {
        const ta = new Date(a.scheduled_start_time ?? 0).getTime();
        const tb = new Date(b.scheduled_start_time ?? 0).getTime();
        return ta - tb;
      });
  }, [appointments, asOfMs]);

  const nextAppointment = upcomingAppointments[0] ?? null;
  const rxCount = scopedForEffective?.prescriptions?.length ?? 0;
  const labCount = scopedForEffective?.lab_results?.length ?? 0;
  const visitCount = historyQuery.data?.visits?.length ?? 0;
  const billingSummary = billingQuery.data?.data?.summary;
  const billingPreviewRows = billingQuery.data?.data?.items ?? [];
  const inboxUnread = messageStatsQuery.data?.inbox?.unread ?? 0;

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: patientMedicalHistoryKeys.all() }),
      queryClient.invalidateQueries({ queryKey: patientLatestVisitContextKeys.all() }),
      queryClient.invalidateQueries({ queryKey: appointmentPortalKeys.all }),
      queryClient.invalidateQueries({ queryKey: patientPortalBillingKeys.all }),
      queryClient.invalidateQueries({ queryKey: messageKeys.stats() }),
    ]);
    setLastRefreshed(new Date());
    setAsOfMs(Date.now());
  }, [queryClient]);

  const cardClass = isDark ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-900';
  const muted = isDark ? 'text-slate-400' : 'text-slate-600';
  const subtle = isDark ? 'text-slate-500' : 'text-slate-500';
  const pageBg = isDark ? 'min-h-screen bg-slate-950' : 'min-h-screen bg-slate-50';

  const greeting = patientDisplayName?.trim() ? `Welcome, ${patientDisplayName.trim()}` : 'Your health dashboard';

  if (!numericId) {
    return (
      <div className={`p-6 text-sm ${muted}`}>
        Patient record could not be loaded from this session. Please sign in again or contact support.
      </div>
    );
  }

  const loading =
    historyQuery.isLoading ||
    (latestVisitContextQuery.isPending && !historyQuery.data) ||
    (appointmentsQuery.isPending && !appointmentsQuery.data) ||
    (billingQuery.isPending && !billingQuery.data);

  const historyReady = Boolean(historyQuery.data) || historyQuery.isError;
  const appointmentsReady = Boolean(appointmentsQuery.data) || appointmentsQuery.isError;
  const billingReady = Boolean(billingQuery.data) || billingQuery.isError;

  /** First visit: no cached history — match other portal pages (e.g. medications). */
  const showFullDashboardSkeleton = numericId > 0 && !historyQuery.data && loading;

  const isRefreshing =
    (historyReady && historyQuery.isFetching) ||
    (appointmentsReady && appointmentsQuery.isFetching) ||
    (billingReady && billingQuery.isFetching) ||
    messageStatsQuery.isFetching;

  if (showFullDashboardSkeleton) {
    return (
      <div className={`${pageBg} p-4 sm:p-6`}>
        <div className="mx-auto max-w-6xl">
          <LoadingSkeleton
            variant="dashboard"
            theme={theme}
            message="Loading your health dashboard…"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`${pageBg} p-4 sm:p-6`}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Patient dashboard</h1>
            <p className={`mt-2 text-sm ${muted}`}>{greeting}</p>
            <p className={`mt-1 text-xs ${subtle}`}>
              Read-only snapshot across your care. Last refreshed: {lastRefreshed.toLocaleTimeString()}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
            className={`inline-flex cursor-pointer items-center gap-2 self-start rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:self-auto ${
              isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            } ${isRefreshing ? 'cursor-wait opacity-70' : ''}`}
            aria-label="Refresh dashboard"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden />
            Refresh
          </button>
        </div>

        {(historyQuery.isError || appointmentsQuery.isError || billingQuery.isError) && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              isDark ? 'border-red-900 bg-red-950/40 text-red-200' : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            Some sections could not be refreshed. Open each area for details or try again.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            theme={theme}
            icon={<Stethoscope className="h-5 w-5 text-blue-500" />}
            label="Care visits on file"
            value={String(visitCount)}
            valueSkeleton={!historyReady && !historyQuery.isError}
            hint={headerFacility?.name ? `Latest: ${headerFacility.name}` : 'Medical history'}
          />
          <StatCard
            theme={theme}
            icon={<Pill className="h-5 w-5 text-blue-500" />}
            label="Medications (latest visit)"
            value={effectiveVisitId == null ? '—' : String(rxCount)}
            valueSkeleton={!historyReady && !historyQuery.isError}
            hint={effectiveVisitId == null ? 'No visit context yet' : 'Medications page'}
          />
          <StatCard
            theme={theme}
            icon={<FlaskConical className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />}
            label="Lab results (latest visit)"
            value={effectiveVisitId == null ? '—' : String(labCount)}
            valueSkeleton={!historyReady && !historyQuery.isError}
            hint={effectiveVisitId == null ? 'No visit context yet' : 'Laboratory results'}
          />
          <StatCard
            theme={theme}
            icon={<Calendar className="h-5 w-5 text-blue-500" />}
            label="Upcoming appointments"
            value={String(upcomingAppointments.length)}
            valueSkeleton={!appointmentsReady && !appointmentsQuery.isError}
            hint={
              !appointmentsReady && !appointmentsQuery.isError
                ? 'Loading schedule…'
                : nextAppointment
                  ? formatShortDate(nextAppointment.scheduled_start_time)
                  : 'None scheduled'
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className={`rounded-xl border p-5 lg:col-span-2 ${cardClass}`}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Quick access
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <QuickLink
                to={PATIENT_PORTAL_ROUTES.MEDICAL_HISTORY_LATEST_VISIT}
                icon={<FileText className="h-5 w-5 text-blue-500" />}
                title="Medical history"
                description="Latest visit and full record"
                isDark={isDark}
              />
              <QuickLink
                to={PATIENT_PORTAL_ROUTES.MEDICATIONS}
                icon={<Pill className="h-5 w-5 text-blue-500" />}
                title="Medications"
                description="Prescriptions tied to your visits"
                isDark={isDark}
              />
              <QuickLink
                to={PATIENT_PORTAL_ROUTES.LABORATORY_RESULTS}
                icon={<FlaskConical className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />}
                title="Laboratory results"
                description="Results from your latest visit"
                isDark={isDark}
              />
              <QuickLink
                to={PATIENT_PORTAL_ROUTES.APPOINTMENTS}
                icon={<Calendar className="h-5 w-5 text-blue-500" />}
                title="Appointments"
                description="Upcoming visits and scheduling"
                isDark={isDark}
              />
              <QuickLink
                to={PATIENT_PORTAL_ROUTES.APPOINTMENTS_SCHEDULE}
                icon={<Calendar className="h-5 w-5 text-blue-500" />}
                title="Schedule a visit"
                description="Pick facility, provider, and time"
                isDark={isDark}
              />
              <QuickLink
                to={PATIENT_PORTAL_ROUTES.BILLING}
                icon={<CreditCard className="h-5 w-5 text-blue-500" />}
                title="Billing & payments"
                description="Receipts and balances"
                isDark={isDark}
              />
              <QuickLink
                to={PATIENT_PORTAL_ROUTES.NOTIFICATIONS_INBOX}
                icon={<Bell className="h-5 w-5 text-blue-500" />}
                title="Notifications"
                description={
                  messageStatsQuery.isPending
                    ? 'Loading inbox status…'
                    : inboxUnread > 0
                      ? `${inboxUnread} unread in inbox`
                      : 'Message center'
                }
                isDark={isDark}
              />
              <QuickLink
                to={PATIENT_PORTAL_ROUTES.DOWNLOADS}
                icon={<Download className="h-5 w-5 text-blue-500" />}
                title="Downloads & reports"
                description="Documents you can save"
                isDark={isDark}
              />
            </div>
          </section>

          <section className={`rounded-xl border p-5 ${cardClass}`}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Financial snapshot
            </h2>
            {billingQuery.isError ? (
              <p className={`mt-4 text-sm ${muted}`}>Billing could not be loaded.</p>
            ) : !billingReady && !billingQuery.isError ? (
              <div className="mt-4">
                <LoadingSkeleton variant="minimal" theme={theme} message="Loading billing summary…" />
              </div>
            ) : billingSummary ? (
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className={muted}>Receipts on file</dt>
                  <dd className="font-semibold tabular-nums">{billingSummary.receipt_count}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className={muted}>Total billed</dt>
                  <dd className="font-semibold tabular-nums">{billingSummary.total_billed.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className={muted}>Total paid</dt>
                  <dd className="font-semibold tabular-nums text-blue-700 dark:text-blue-300">
                    {billingSummary.total_paid.toLocaleString()}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className={muted}>Outstanding</dt>
                  <dd className="font-semibold tabular-nums">{billingSummary.total_balance.toLocaleString()}</dd>
                </div>
              </dl>
            ) : (
              <p className={`mt-4 text-sm ${muted}`}>No billing summary yet.</p>
            )}
            <Link
              to={PATIENT_PORTAL_ROUTES.BILLING}
              className={`mt-5 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300`}
            >
              View billing & receipts
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className={`rounded-xl border p-5 ${cardClass}`}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Latest visit
            </h2>
            {!headerVisit && effectiveVisitId == null ? (
              <p className={`mt-4 text-sm ${muted}`}>
                No visit on file yet. When you receive care, your latest visit summary will appear here.
              </p>
            ) : (
              <div className="mt-4 space-y-2 text-sm">
                <p className="font-medium">{headerFacility?.name ?? 'Facility'}</p>
                <p className={muted}>
                  Visit #{headerVisit?.id ?? effectiveVisitId ?? '—'}
                  {headerVisit?.occurred_at || headerVisit?.arrived_at
                    ? ` · ${formatShortDate(headerVisit.occurred_at ?? headerVisit.arrived_at)}`
                    : ''}
                </p>
                <Link
                  to={PATIENT_PORTAL_ROUTES.MEDICAL_HISTORY_LATEST_VISIT}
                  className="mt-2 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Open medical history
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            )}
          </section>

          <section className={`rounded-xl border p-5 ${cardClass}`}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Next appointment
            </h2>
            {!appointmentsReady && !appointmentsQuery.isError ? (
              <div className="mt-4">
                <LoadingSkeleton variant="minimal" theme={theme} message="Loading appointments…" />
              </div>
            ) : !nextAppointment ? (
              <p className={`mt-4 text-sm ${muted}`}>No upcoming appointments. Schedule when you are ready.</p>
            ) : (
              <div className="mt-4 space-y-2 text-sm">
                <p className="font-medium">{nextAppointment.facility?.name ?? 'Facility'}</p>
                <p className={muted}>{formatShortDate(nextAppointment.scheduled_start_time)}</p>
                <p className={muted}>
                  {(nextAppointment.appointment_type_display ?? nextAppointment.appointment_type).replace(/_/g, ' ')}
                </p>
                <Link
                  to={PATIENT_PORTAL_ROUTES.APPOINTMENTS}
                  className="mt-2 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View appointments
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            )}
          </section>
        </div>

        <section className={`rounded-xl border p-5 ${cardClass}`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Recent receipts
            </h2>
            <Link
              to={PATIENT_PORTAL_ROUTES.BILLING}
              className="cursor-pointer text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              See all
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {!billingReady && !billingQuery.isError ? (
              <li className="list-none py-3">
                <LoadingSkeleton variant="minimal" theme={theme} message="Loading recent receipts…" />
              </li>
            ) : billingPreviewRows.length === 0 ? (
              <li className={`py-3 text-sm ${muted}`}>No receipts yet.</li>
            ) : (
              billingPreviewRows.slice(0, 5).map((row) => (
                <li key={`${row.billing_cycle_id}-${row.visit_uuid}`} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="text-sm font-medium">{(row as { facility_name?: string }).facility_name ?? 'Facility'}</p>
                    <p className={`text-xs ${subtle}`}>{invoiceNumberFromBillingItem(row)}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {(row.billing_data?.grandTotal ?? 0).toLocaleString()}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}

function StatCard(props: {
  theme: 'light' | 'dark';
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  valueSkeleton?: boolean;
}) {
  const isDark = props.theme === 'dark';
  const cardClass = isDark ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-900';
  const muted = isDark ? 'text-slate-400' : 'text-slate-600';
  const pulseBar = isDark ? 'bg-slate-700' : 'bg-slate-200';

  return (
    <div className={`rounded-xl border p-5 ${cardClass}`}>
      <div className="flex items-center gap-2">
        {props.icon}
        <p className="text-sm font-semibold">{props.label}</p>
      </div>
      {props.valueSkeleton ? (
        <div className={`mt-3 h-9 w-20 animate-pulse rounded-lg ${pulseBar}`} aria-hidden />
      ) : (
        <p className="mt-3 text-2xl font-bold tabular-nums">{props.value}</p>
      )}
      <p className={`mt-2 text-xs ${muted}`}>{props.hint}</p>
    </div>
  );
}

function QuickLink(props: {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  isDark: boolean;
}) {
  const border = props.isDark ? 'border-slate-700 hover:bg-slate-800/80' : 'border-slate-200 hover:bg-slate-50';
  const text = props.isDark ? 'text-slate-100' : 'text-slate-900';
  const sub = props.isDark ? 'text-slate-400' : 'text-slate-600';

  return (
    <Link
      to={props.to}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${border}`}
    >
      <div className="mt-0.5 shrink-0">{props.icon}</div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${text}`}>{props.title}</p>
        <p className={`mt-0.5 text-xs ${sub}`}>{props.description}</p>
      </div>
      <ChevronRight className={`mt-1 h-4 w-4 shrink-0 ${sub}`} aria-hidden />
    </Link>
  );
}

export default PatientPortalDashboardPage;
