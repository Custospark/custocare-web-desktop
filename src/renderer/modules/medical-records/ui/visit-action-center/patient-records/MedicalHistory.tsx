import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { useReactToPrint } from 'react-to-print';
import { Activity, Printer, Search, User, RefreshCw } from 'lucide-react';
import { selectActiveVisitPatientId } from '../../../../../app/store/slices/visitSlice';
import { usePatientMedicalHistory } from '../../../api/patient-medical-history/patientMedicalHistoryQueries';
import type { PatientMedicalHistoryPayload } from '../../../api/patient-medical-history/patientMedicalHistoryTypes';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
import { cn } from '../../../../../shared/utils/classNameUtils';
import { getAllergiesTheme } from '../clinical-forms/allergies-form-components/allergiesForm.utils';
import { MedicalHistoryPreviewDocument } from './MedicalHistoryPreviewDocument';

interface MedicalHistoryProps {
  theme?: 'light' | 'dark';
}

type TimeRange = 'all' | 'year' | '6months' | 'month';

const formatText = (text: string): string =>
  text
    .replace(/[,-]/g, ' ')
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

const toTimestamp = (value?: string | null): number => {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const isWithinRange = (dateValue: string | null | undefined, range: TimeRange): boolean => {
  if (range === 'all') return true;
  const ts = toTimestamp(dateValue ?? null);
  if (!ts) return false;
  const now = Date.now();
  const days = range === 'year' ? 365 : range === '6months' ? 183 : 31;
  return ts >= now - days * 24 * 60 * 60 * 1000;
};

function shallowContainsSearch(obj: unknown, query: string): boolean {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const walk = (val: unknown): boolean => {
    if (val === null || val === undefined) return false;
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      return String(val).toLowerCase().includes(q);
    }
    if (Array.isArray(val)) return val.some(walk);
    if (typeof val === 'object') {
      return Object.values(val as Record<string, unknown>).some(walk);
    }
    return false;
  };

  return walk(obj);
}

function filterMedicalHistoryPayload(
  data: PatientMedicalHistoryPayload,
  range: TimeRange,
  search: string
): PatientMedicalHistoryPayload {
  const dateOk = (occurred?: string | null, ...fallbacks: (string | null | undefined)[]) => {
    const primary = occurred ?? fallbacks.find(Boolean);
    return isWithinRange(primary ?? null, range);
  };

  return {
    ...data,
    visits: data.visits.filter((v) => dateOk(v.occurred_at, v.arrived_at) && shallowContainsSearch(v, search)),
    allergies: data.allergies.filter(
      (a) => dateOk(a.occurred_at, a.diagnosed_at, a.created_at) && shallowContainsSearch(a, search)
    ),
    prescriptions: data.prescriptions.filter(
      (p) => dateOk(p.occurred_at, p.created_at, p.prescription_date) && shallowContainsSearch(p, search)
    ),
    clinical_notes: data.clinical_notes.filter(
      (n) => dateOk(n.occurred_at, n.noted_at, n.created_at) && shallowContainsSearch(n, search)
    ),
    vitals: data.vitals.filter(
      (v) => dateOk(v.occurred_at, v.measured_at, v.created_at) && shallowContainsSearch(v, search)
    ),
    diagnoses: data.diagnoses.filter(
      (d) => dateOk(d.occurred_at, d.created_at) && shallowContainsSearch(d, search)
    ),
    consultations: data.consultations.filter(
      (c) => dateOk(c.occurred_at, c.requested_at) && shallowContainsSearch(c, search)
    ),
    lab_requests: data.lab_requests.filter(
      (l) => dateOk(l.occurred_at, l.requested_at) && shallowContainsSearch(l, search)
    ),
    lab_results: data.lab_results.filter(
      (r) => dateOk(r.occurred_at, r.recorded_at, r.verified_at) && shallowContainsSearch(r, search)
    ),
  };
}

export const MedicalHistory: React.FC<MedicalHistoryProps> = ({ theme = 'light' }) => {
  const isDark = theme === 'dark';
  const colors = getAllergiesTheme(theme);
  const patientId = useSelector(selectActiveVisitPatientId);
  const patientNumericId = patientId ? Number(patientId) : 0;

  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  const historyQuery = usePatientMedicalHistory(patientNumericId, {
    enabled: !!patientNumericId,
  });

  const filteredPayload = useMemo(() => {
    if (!historyQuery.data) return null;
    return filterMedicalHistoryPayload(historyQuery.data, timeRange, searchQuery);
  }, [historyQuery.data, timeRange, searchQuery]);

  const printRef = useRef<HTMLDivElement>(null);

  const documentTitle = useMemo(() => {
    const name =
      historyQuery.data?.patient.full_name?.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-') ||
      'patient';
    const day = new Date().toISOString().split('T')[0];
    return `${name}_medical-history_${day}`;
  }, [historyQuery.data?.patient.full_name]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle,
    pageStyle: `
      @page { size: A4; margin: 15mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
        .no-print { display: none !important; }
      }
    `,
  });

  const onPrint = useCallback(() => {
    void handlePrint?.();
  }, [handlePrint]);

  const onRefresh = useCallback(() => {
    void historyQuery.refetch();
  }, [historyQuery]);

  if (!patientNumericId) {
    return (
      <div className="p-6">
        <div className={cn('rounded-xl border p-6 text-center', colors.border.primary, colors.bg.card)}>
          <div className={cn('mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full', colors.bg.muted)}>
            <User className={cn('h-6 w-6', colors.text.secondary)} />
          </div>
          <h2 className={cn('mb-2 text-lg font-semibold', colors.text.primary)}>No active patient selected</h2>
          <p className={cn('text-sm', colors.text.secondary)}>
            Open a patient visit in Medical Records to view continuity-of-care history.
          </p>
        </div>
      </div>
    );
  }

  if (historyQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
        <div>
          <LoadingSkeleton variant="form" theme={theme} message="Loading medical history…" />
        </div>
        <div>
          <LoadingSkeleton variant="list" theme={theme} message="Fetching clinical records…" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      className={cn('min-h-0 p-6', colors.bg.page)}
    >
      {/* Header — same structure as AllergiesHeader (clinical-forms) */}
      <section
        className={cn('no-print mb-6 rounded-2xl border p-5 sm:p-6', colors.border.primary, colors.bg.card)}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className={cn('rounded-2xl p-3', isDark ? 'bg-blue-900/25' : 'bg-blue-50')}>
              <Activity className={cn('h-6 w-6', isDark ? 'text-blue-300' : 'text-blue-600')} />
            </div>
            <div>
              <h2 className={cn('text-xl font-semibold', colors.text.primary)}>Medical History</h2>
              <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                Cross-facility clinical documentation for continuity of care.
              </p>
              {filteredPayload ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
                      colors.state.infoSoft,
                      colors.state.info
                    )}
                  >
                    <Search className="h-3.5 w-3.5" />
                    Filtered view
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
                      isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
                    )}
                  >
                    Visits {filteredPayload.visits.length} · Allergies {filteredPayload.allergies.length} · Rx{' '}
                    {filteredPayload.prescriptions.length}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
                      isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
                    )}
                  >
                    Labs {filteredPayload.lab_requests.length} · Results {filteredPayload.lab_results.length}
                  </span>
                  {historyQuery.isFetching && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                        isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700'
                      )}
                    >
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Refreshing…
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={historyQuery.isFetching}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all',
                colors.border.primary,
                colors.text.primary,
                colors.bg.hover,
                historyQuery.isFetching && 'cursor-not-allowed opacity-50'
              )}
            >
              <RefreshCw className={cn('h-4 w-4', historyQuery.isFetching && 'animate-spin')} />
              Refresh
            </button>
            <button
              type="button"
              onClick={onPrint}
              disabled={!filteredPayload}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              Print / PDF
            </button>
          </div>
        </div>
      </section>

      {/* Filters + search — card shell like form sections */}
      <section
        className={cn('no-print mb-6 rounded-2xl border p-4 sm:p-5', colors.border.primary, colors.bg.card)}
      >
        <div className={cn('mb-4 flex flex-wrap gap-2 border-b pb-4', colors.border.primary)}>
          {(
            [
              ['all', 'All time'],
              ['year', 'Last year'],
              ['6months', '6 months'],
              ['month', 'Last month'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTimeRange(key)}
              className={cn(
                'cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                timeRange === key
                  ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                  : cn(
                      'border',
                      colors.border.primary,
                      colors.text.primary,
                      colors.bg.subtle,
                      colors.bg.hover
                    )
              )}
            >
              {formatText(label)}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className={cn('pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', colors.text.tertiary)} />
          <input
            type="text"
            placeholder="Search across allergies, medications, notes, labs…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'w-full rounded-lg border py-2 pl-9 pr-4 text-sm outline-none transition-colors',
              colors.border.primary,
              colors.bg.input,
              colors.text.primary,
              colors.border.focus,
              'focus:ring-2 focus:ring-blue-500/25'
            )}
          />
        </div>
      </section>

      {historyQuery.isError ? (
        <div
          className={cn(
            'rounded-2xl border p-4 text-sm',
            colors.border.primary,
            colors.state.dangerSoft,
            colors.state.danger
          )}
        >
          {(historyQuery.error as Error)?.message || 'Unable to load medical history.'}
        </div>
      ) : filteredPayload ? (
        /* Mat + document: padded non-white canvas so the white sheet reads with clear space (AllergiesPreviewModal pattern). */
        <div
          ref={printRef}
          className={cn(
            'rounded-2xl border p-6 shadow-sm sm:p-8 md:p-10',
            colors.border.primary,
            isDark ? 'bg-slate-900/85' : 'bg-slate-100',
            'print:border-0 print:bg-white print:p-4 print:shadow-none'
          )}
        >
          <MedicalHistoryPreviewDocument history={filteredPayload} />
        </div>
      ) : null}
    </motion.div>
  );
};

export default MedicalHistory;
