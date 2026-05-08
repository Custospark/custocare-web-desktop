import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import { Printer, Search, AlertCircle, RefreshCcw } from 'lucide-react';
import { selectActiveVisitPatientId } from '../../../../../app/store/slices/visitSlice';
import { usePatientMedicalHistory } from '../../../api/patient-medical-history/patientMedicalHistoryQueries';
import type { PatientMedicalHistoryPayload } from '../../../api/patient-medical-history/patientMedicalHistoryTypes';
import LoadingSkeleton from '../../../../../shared/components/Loading/LoadingSkeletons';
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
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">No active patient</p>
            <p className="mt-1 text-amber-800/90 dark:text-amber-200/90">
              Open a patient visit in Medical Records to view continuity-of-care history.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-slate-900 dark:text-slate-100">
      <div className="no-print mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Medical History</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Cross-facility clinical documentation for continuity of care (same data source as clinical form previews).
          </p>
          {filteredPayload ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {[
                `Visits: ${filteredPayload.visits.length}`,
                `Allergies: ${filteredPayload.allergies.length}`,
                `Medications: ${filteredPayload.prescriptions.length}`,
                `Lab Requests: ${filteredPayload.lab_requests.length}`,
                `Lab Results: ${filteredPayload.lab_results.length}`,
              ].join(' · ')}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={historyQuery.isFetching}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RefreshCcw className={`h-4 w-4 ${historyQuery.isFetching ? 'animate-spin' : ''}`} />
            {historyQuery.isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={onPrint}
            disabled={!filteredPayload}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            Print / PDF
          </button>
        </div>
      </div>

      <div className="no-print mb-6 flex flex-wrap gap-2 border-b pb-4">
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
            className={`rounded-lg px-3 py-1 text-sm transition-colors ${
              timeRange === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {formatText(label)}
          </button>
        ))}
      </div>

      <div className="no-print mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search across allergies, medications, notes, labs…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          />
        </div>
      </div>

      {historyQuery.isLoading ? (
        <LoadingSkeleton variant="list" theme={theme} message="Loading medical history…" />
      ) : historyQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {(historyQuery.error as Error)?.message || 'Unable to load medical history.'}
        </div>
      ) : filteredPayload ? (
        <div ref={printRef} className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <MedicalHistoryPreviewDocument history={filteredPayload} />
        </div>
      ) : null}
    </div>
  );
};

export default MedicalHistory;
