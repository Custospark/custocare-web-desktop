import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  ClipboardList,
  Download,
  Eye,
  FileEdit,
  Pill,
  Printer,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import {
  prescriptionKeys,
  useCancelPrescription,
  useGetPrescriptions,
  useGetPatientPrescriptions,
  useMarkPrescriptionDispensed,
} from '../../../../medical-records/api/prescription/PrescriptionQueries';
import {
  CancellationReason,
  PrescriptionStatus,
  canBeDispensed,
  type Prescription,
  type PrescriptionResponse,
} from '../../../../medical-records/api/prescription/PrescriptionTypes';
import type { PrescriptionItem } from '../../../../medical-records/api/prescription-items/PrescriptionItemsTypes';
import {
  selectActivePatient,
  selectActiveVisitId,
  selectActiveVisitPatientId,
} from '../../../../../app/store/slices/visitSlice';
import type { RootState } from '../../../../../app/store/store';
import { getActiveFacilityId } from '../../../../../app/store/utils/contextSelectors';
import { axiosInstance } from '../../../../../app/api/axiosConfig';
import { PHARMACY_ROUTES } from '../../../../../app/routes/routeConstants';
import { PharmacyPrescriptionReportModal } from '../../action-center/PharmacyPrescriptionReportModal';

type WorkbenchMode = 'queue' | 'search' | 'review' | 'flagged' | 'approved' | 'create';

export type PrescriptionWorkbenchScope = 'facility' | 'activeVisit';

/** Client-side page size for long medication / Rx lists (avoids huge DOM trees). */
const MEDICATION_TABLE_PAGE_SIZE = 40;
const REVIEW_RX_LIST_PAGE_SIZE = 35;

interface PrescriptionWorkbenchProps {
  theme: 'light' | 'dark';
  mode: WorkbenchMode;
  /** Facility lists (default) vs current visit from visitSlice (pharmacy workstation). */
  scope?: PrescriptionWorkbenchScope;
}

const statusTone = (status: string): string => {
  if (status === PrescriptionStatus.ACTIVE || status === PrescriptionStatus.FULLY_DISPENSED) {
    return 'bg-emerald-100 text-emerald-700';
  }
  if (status === PrescriptionStatus.ON_HOLD || status === PrescriptionStatus.PARTIALLY_DISPENSED) {
    return 'bg-amber-100 text-amber-700';
  }
  if (status === PrescriptionStatus.CANCELLED) {
    return 'bg-red-100 text-red-700';
  }
  return 'bg-slate-100 text-slate-700';
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString();
};

/** Dispensing is tracked at prescription level in this API — lines share the same fulfillment state. */
const lineDispenseState = (rx: Prescription): 'dispensed' | 'partial' | 'not_dispensed' => {
  if (rx.status === PrescriptionStatus.FULLY_DISPENSED) return 'dispensed';
  if (rx.status === PrescriptionStatus.PARTIALLY_DISPENSED) return 'partial';
  return 'not_dispensed';
};

const modeTitle = (mode: WorkbenchMode, scope: PrescriptionWorkbenchScope): string => {
  if (mode === 'search' && scope === 'activeVisit') return 'Prescriptions for this visit';
  const titles: Record<WorkbenchMode, string> = {
    queue: 'Prescription Queue',
    search: 'Search Prescriptions',
    review: 'Review Prescriptions',
    flagged: 'Flagged Prescriptions',
    approved: 'Approved Prescriptions',
    create: 'New Prescription',
  };
  return titles[mode];
};

export const PrescriptionWorkbench: React.FC<PrescriptionWorkbenchProps> = ({
  theme,
  mode,
  scope = 'facility',
}) => {
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const activePatientId = useSelector(selectActiveVisitPatientId);
  const activePatient = useSelector(selectActivePatient);
  const activeVisitId = useSelector(selectActiveVisitId);
  const activeFacilityId = useSelector((state: RootState) => getActiveFacilityId(state));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<number | null>(null);
  const [medicationPage, setMedicationPage] = useState(1);
  const [reviewRxPage, setReviewRxPage] = useState(1);
  const [reportModal, setReportModal] = useState<{
    prescriptionId: number;
    initialAction?: 'preview' | 'print' | 'download';
  } | null>(null);

  const patientNumericId = activePatientId ? Number(activePatientId) : 0;

  const patientPrescriptionsQuery = useGetPatientPrescriptions(patientNumericId, [], {
    enabled: !!patientNumericId && mode === 'create',
    refetchOnMount: true,
  });
  const facilityPrescriptionsQuery = useGetPrescriptions(
    {
      facility_id: activeFacilityId ?? undefined,
      ...(mode === 'queue' ? { status: PrescriptionStatus.ACTIVE } : {}),
    },
    {
      enabled: scope === 'facility' && !!activeFacilityId && mode !== 'create',
      refetchOnMount: true,
    }
  );
  const activeVisitPrescriptionsQuery = useGetPatientPrescriptions(patientNumericId, [], {
    enabled: scope === 'activeVisit' && !!patientNumericId && mode !== 'create',
    refetchOnMount: true,
  });

  const prescriptionsQuery =
    mode === 'create'
      ? patientPrescriptionsQuery
      : scope === 'activeVisit'
        ? activeVisitPrescriptionsQuery
        : facilityPrescriptionsQuery;
  const markDispensed = useMarkPrescriptionDispensed();
  const cancelPrescription = useCancelPrescription();

  /** Single patient + single visit only — ignore stray rows from cache or API overlap. */
  const allPrescriptions = useMemo(() => {
    const rows = prescriptionsQuery.data?.data ?? [];
    if (scope !== 'activeVisit' || activeVisitId == null || !patientNumericId) return rows;
    const visitIdNum = Number(activeVisitId);
    return rows.filter(
      (item) =>
        item.visit_id != null &&
        Number(item.visit_id) === visitIdNum &&
        Number(item.patient_id) === patientNumericId
    );
  }, [prescriptionsQuery.data, scope, activeVisitId, patientNumericId]);

  const filteredByMode = useMemo(() => {
    switch (mode) {
      case 'approved':
        return allPrescriptions.filter((item) => item.status === PrescriptionStatus.FULLY_DISPENSED);
      case 'flagged':
        return allPrescriptions.filter(
          (item) =>
            item.status === PrescriptionStatus.ON_HOLD ||
            item.status === PrescriptionStatus.CANCELLED ||
            item.status === PrescriptionStatus.EXPIRED
        );
      case 'queue':
        return allPrescriptions.filter((item) => item.status === PrescriptionStatus.ACTIVE && !!item.visit_id);
      case 'review':
        if (scope === 'activeVisit') {
          return allPrescriptions.filter(
            (p) => p.status !== PrescriptionStatus.CANCELLED && p.status !== PrescriptionStatus.EXPIRED
          );
        }
        return allPrescriptions.filter(
          (item) =>
            item.status === PrescriptionStatus.ON_HOLD || item.status === PrescriptionStatus.DRAFT
        );
      case 'search':
      case 'create':
      default:
        return allPrescriptions;
    }
  }, [allPrescriptions, mode, scope]);

  const needsRxItems =
    scope === 'activeVisit' && (mode === 'search' || mode === 'review') && !!patientNumericId;

  const rxIdsNeedingDetail = useMemo(
    () => allPrescriptions.filter((p) => !p.items?.length).map((p) => p.id),
    [allPrescriptions]
  );

  const detailQueries = useQueries({
    queries: rxIdsNeedingDetail.map((id) => ({
      queryKey: prescriptionKeys.detail(id),
      queryFn: async () => {
        const res = await axiosInstance.get<PrescriptionResponse>(`/prescriptions/${id}`);
        return res.data.data;
      },
      enabled: needsRxItems && !!id,
      staleTime: 60_000,
    })),
  });

  const prescriptionDetailById = useMemo(() => {
    const map = new Map<number, Prescription>();
    rxIdsNeedingDetail.forEach((id, i) => {
      const row = detailQueries[i]?.data;
      if (row) map.set(id, row);
    });
    return map;
  }, [detailQueries, rxIdsNeedingDetail]);

  const mergedPrescriptions = useMemo(() => {
    if (!needsRxItems || activeVisitId == null) return [];
    const visitIdNum = Number(activeVisitId);
    const pid = patientNumericId;
    const matchesVisitPatient = (rx: Prescription) =>
      Number(rx.patient_id) === pid && rx.visit_id != null && Number(rx.visit_id) === visitIdNum;

    return filteredByMode.map((p) => {
      const detail = prescriptionDetailById.get(p.id);
      const detailOk = detail && matchesVisitPatient(detail);
      const fromDetail = detailOk ? detail.items : undefined;
      const items = p.items?.length ? p.items : fromDetail;
      if (items?.length) return { ...p, items };
      return p;
    });
  }, [needsRxItems, filteredByMode, prescriptionDetailById, activeVisitId, patientNumericId]);

  const visitMedicationRows = useMemo(() => {
    if (!needsRxItems || mode !== 'search') return [];
    const rows: { rx: Prescription; item: PrescriptionItem }[] = [];
    for (const rx of mergedPrescriptions) {
      for (const item of rx.items ?? []) {
        rows.push({ rx, item });
      }
    }
    return rows;
  }, [needsRxItems, mode, mergedPrescriptions]);

  const visibleMedicationRows = useMemo(() => {
    if (!searchTerm.trim()) return visitMedicationRows;
    const q = searchTerm.toLowerCase();
    return visitMedicationRows.filter(({ rx, item }) => {
      return (
        item.medication_name.toLowerCase().includes(q) ||
        item.full_name.toLowerCase().includes(q) ||
        rx.prescription_number.toLowerCase().includes(q) ||
        (rx.diagnosis ?? '').toLowerCase().includes(q)
      );
    });
  }, [visitMedicationRows, searchTerm]);

  const medicationPageCount = Math.max(
    1,
    Math.ceil(visibleMedicationRows.length / MEDICATION_TABLE_PAGE_SIZE)
  );

  const paginatedMedicationRows = useMemo(() => {
    const start = (medicationPage - 1) * MEDICATION_TABLE_PAGE_SIZE;
    return visibleMedicationRows.slice(start, start + MEDICATION_TABLE_PAGE_SIZE);
  }, [visibleMedicationRows, medicationPage]);

  const detailsLoading =
    needsRxItems &&
    rxIdsNeedingDetail.length > 0 &&
    detailQueries.some((q) => q.isPending || q.isLoading);

  const visiblePrescriptions = useMemo(() => {
    if (!searchTerm.trim()) return filteredByMode;
    const query = searchTerm.toLowerCase();
    return filteredByMode.filter((item) => {
      const patientName = item.patient?.name ?? '';
      return (
        item.prescription_number.toLowerCase().includes(query) ||
        (item.diagnosis ?? '').toLowerCase().includes(query) ||
        patientName.toLowerCase().includes(query)
      );
    });
  }, [filteredByMode, searchTerm]);

  const reviewRxPageCount = Math.max(
    1,
    Math.ceil(visiblePrescriptions.length / REVIEW_RX_LIST_PAGE_SIZE)
  );

  const paginatedReviewPrescriptions = useMemo(() => {
    const start = (reviewRxPage - 1) * REVIEW_RX_LIST_PAGE_SIZE;
    return visiblePrescriptions.slice(start, start + REVIEW_RX_LIST_PAGE_SIZE);
  }, [visiblePrescriptions, reviewRxPage]);

  useEffect(() => {
    setMedicationPage(1);
  }, [searchTerm, scope, mode]);

  useEffect(() => {
    const max = Math.max(1, Math.ceil(visibleMedicationRows.length / MEDICATION_TABLE_PAGE_SIZE));
    if (medicationPage > max) setMedicationPage(max);
  }, [visibleMedicationRows.length, medicationPage]);

  useEffect(() => {
    setReviewRxPage(1);
  }, [searchTerm, scope, mode]);

  useEffect(() => {
    const max = Math.max(1, Math.ceil(visiblePrescriptions.length / REVIEW_RX_LIST_PAGE_SIZE));
    if (reviewRxPage > max) setReviewRxPage(max);
  }, [visiblePrescriptions.length, reviewRxPage]);

  const selectedPrescription = useMemo(() => {
    if (selectedPrescriptionId === null) return visiblePrescriptions[0] ?? null;
    return visiblePrescriptions.find((item) => item.id === selectedPrescriptionId) ?? null;
  }, [selectedPrescriptionId, visiblePrescriptions]);

  const selectedForReviewDetail = useMemo(() => {
    if (!needsRxItems || mode !== 'review') return null;
    const id = selectedPrescriptionId ?? visiblePrescriptions[0]?.id ?? null;
    if (id == null) return null;
    return mergedPrescriptions.find((p) => p.id === id) ?? null;
  }, [needsRxItems, mode, selectedPrescriptionId, visiblePrescriptions, mergedPrescriptions]);

  const handleDispense = async (prescription: Prescription) => {
    await markDispensed.mutateAsync({
      id: prescription.id,
      data: {
        pharmacy_name: 'Main Pharmacy',
      },
    });
  };

  const handleCancel = async (prescription: Prescription) => {
    await cancelPrescription.mutateAsync({
      id: prescription.id,
      data: {
        cancellation_reason: CancellationReason.OUT_OF_STOCK,
        cancellation_notes: 'Cancelled from pharmacy queue',
      },
    });
  };

  const openDispenseWorkspace = () => {
    navigate(PHARMACY_ROUTES.ACTION_CENTER_DISPENSING);
  };

  const openPrescriptionNotes = (prescriptionId: number) => {
    navigate(`${PHARMACY_ROUTES.ACTION_CENTER_PRESCRIPTION_NOTES}/${prescriptionId}`);
  };

  if (mode !== 'create' && scope === 'facility' && !activeFacilityId) {
    return (
      <div className="rounded-xl border border-dashed border-amber-300 p-6 text-sm text-amber-700">
        Select an active facility first to open the pharmacy prescription queue.
      </div>
    );
  }

  if (mode !== 'create' && scope === 'activeVisit' && (!patientNumericId || !activeVisitId)) {
    return (
      <div className="rounded-xl border border-dashed border-amber-300 p-6 text-sm text-amber-700">
        No active visit in context. Open a patient from the pharmacy queue first.
      </div>
    );
  }

  if (mode === 'create' && !patientNumericId) {
    return (
      <div className="rounded-xl border border-dashed border-amber-300 p-6 text-sm text-amber-700">
        Select an active patient visit first to work on pharmacy prescriptions.
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold">Start New Prescription</h3>
        <p className="mt-2 text-sm text-slate-600">
          Prescription authoring is handled in clinical documentation. Pharmacy focuses on
          validation, dispensing, and fulfillment after prescriber submission.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Active patient: <span className="font-semibold">{activePatient?.name ?? 'N/A'}</span>
        </p>
      </div>
    );
  }

  const isVisitMedicationList = scope === 'activeVisit' && mode === 'search';
  const isVisitReview = scope === 'activeVisit' && mode === 'review';
  const listLoading = prescriptionsQuery.isLoading || (needsRxItems && detailsLoading);
  const listEmpty = isVisitMedicationList
    ? visibleMedicationRows.length === 0
    : visiblePrescriptions.length === 0;

  const searchPlaceholder =
    isVisitMedicationList
      ? 'Filter by medication name, Rx number, or diagnosis…'
      : 'Search prescription number, diagnosis…';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold">{modeTitle(mode, scope)}</h3>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className={`w-full rounded-lg border py-2 pl-9 pr-3 text-sm ${
              isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 bg-white'
            }`}
          />
        </div>
      </div>

      {(isVisitMedicationList || isVisitReview) && activeVisitId != null && (
        <div
          className={`flex flex-col gap-2 rounded-lg border px-3 py-2.5 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-1 ${
            isDark ? 'border-gray-700 bg-gray-800/80 text-gray-200' : 'border-slate-200 bg-slate-50 text-slate-800'
          }`}
        >
          <span className="font-semibold">
            Patient:{' '}
            <span className="font-normal opacity-90">{activePatient?.name ?? '—'}</span>
          </span>
          <span className="font-semibold">
            Visit:{' '}
            <span className="font-mono text-xs font-normal opacity-90">#{activeVisitId}</span>
          </span>
          <span className="font-semibold">
            Prescriptions (this visit):{' '}
            <span className="font-normal">{filteredByMode.length}</span>
          </span>
          {isVisitMedicationList && (
            <span className="font-semibold">
              Medication lines:{' '}
              <span className="font-normal">{visitMedicationRows.length}</span>
            </span>
          )}
        </div>
      )}

      {isVisitMedicationList && (
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
          Only this patient&apos;s prescriptions for the active visit are shown.{' '}
          <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>Notes</span> opens the
          prescription form; <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>Document</span>{' '}
          previews / prints / PDF for the patient;{' '}
          <span className={`font-semibold ${isDark ? 'text-gray-200' : 'text-slate-800'}`}>Dispense</span> opens billing.
        </p>
      )}

      {isVisitReview && (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            isDark ? 'border-gray-700 bg-gray-800/80 text-gray-300' : 'border-slate-200 bg-slate-50 text-slate-700'
          }`}
        >
          <span className="font-semibold">Legend:</span>{' '}
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <CheckCircle2 className="inline h-4 w-4" aria-hidden /> Dispensed
          </span>
          {' · '}
          <span className="inline-flex items-center gap-1 text-slate-500">
            <Circle className="inline h-4 w-4 text-slate-300" aria-hidden /> Not dispensed
          </span>
          {' · '}
          <span className="inline-flex items-center gap-1 text-amber-700">
            <AlertCircle className="inline h-4 w-4" aria-hidden /> Partially dispensed
          </span>
          <span className="block mt-1 text-xs opacity-90">
            Line items follow the prescription&apos;s dispensing status. Use{' '}
            <span className="font-medium">Dispense &amp; fulfill</span> for quantity-level detail.
          </span>
        </div>
      )}

      {listLoading ? (
        <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">
          Loading prescriptions…
        </div>
      ) : listEmpty ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
          {isVisitMedicationList
            ? 'No prescribed medications found for this visit.'
            : 'No prescriptions found for this view.'}
        </div>
      ) : isVisitMedicationList ? (
        <div
          className={`overflow-hidden rounded-xl border ${
            isDark ? 'border-gray-700 bg-gray-900/30' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="max-h-[min(65vh,780px)] overflow-auto">
            <table className="w-full min-w-[880px] table-fixed border-collapse text-left text-xs sm:text-sm">
              <thead
                className={`sticky top-0 z-10 border-b shadow-sm ${
                  isDark ? 'border-gray-700 bg-gray-900' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <tr>
                  <th className="w-10 px-2 py-2.5 font-semibold">#</th>
                  <th className="min-w-[180px] px-2 py-2.5 font-semibold">Medication</th>
                  <th className="w-[120px] px-2 py-2.5 font-semibold">Rx #</th>
                  <th className="min-w-[200px] px-2 py-2.5 font-semibold">Qty / directions</th>
                  <th className="w-[140px] px-2 py-2.5 font-semibold">Status</th>
                  <th className="min-w-[220px] px-2 py-2.5 text-right font-semibold">Notes &amp; fulfillment</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMedicationRows.map(({ rx, item }, idx) => {
                  const rowNum = (medicationPage - 1) * MEDICATION_TABLE_PAGE_SIZE + idx + 1;
                  return (
                    <tr
                      key={`${rx.id}-${item.id}`}
                      className={`border-b last:border-b-0 ${
                        isDark ? 'border-gray-800 hover:bg-gray-800/60' : 'border-slate-100 hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="px-2 py-2 align-top text-slate-500">{rowNum}</td>
                      <td className="px-2 py-2 align-top">
                        <div className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                          {item.medication_name}
                          {item.strength ? (
                            <span className={`font-normal ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                              {' '}
                              · {item.strength}
                            </span>
                          ) : null}
                        </div>
                        {item.full_name !== item.medication_name ? (
                          <div className={`mt-0.5 truncate text-[11px] ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                            {item.full_name}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-2 py-2 align-top font-mono text-[11px] text-slate-600 dark:text-gray-400">
                        {rx.prescription_number}
                      </td>
                      <td className="px-2 py-2 align-top">
                        <div className={`text-[11px] leading-snug ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                          Qty {item.total_quantity} · {item.dosage_text}
                        </div>
                        <div className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                          {item.duration_text}
                          {rx.diagnosis ? ` · ${rx.diagnosis}` : ''}
                        </div>
                      </td>
                      <td className="px-2 py-2 align-top">
                        <span className={`inline-flex rounded px-1.5 py-0.5 text-[11px] ${statusTone(rx.status)}`}>
                          {rx.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 align-top text-right">
                        <div className="flex flex-col items-end gap-1 sm:flex-row sm:flex-wrap sm:justify-end">
                          <button
                            type="button"
                            onClick={() => openPrescriptionNotes(rx.id)}
                            className={`inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium ${
                              isDark
                                ? 'border-gray-600 text-gray-200 hover:bg-gray-800'
                                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                            title="Edit prescription notes (same form as clinical)"
                          >
                            <FileEdit className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            Notes
                          </button>
                          <button
                            type="button"
                            onClick={() => setReportModal({ prescriptionId: rx.id, initialAction: 'preview' })}
                            className={`inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium ${
                              isDark
                                ? 'border-gray-600 text-gray-200 hover:bg-gray-800'
                                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                            title="Preview, print, or save PDF for the patient"
                          >
                            <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            Document
                          </button>
                          <button
                            type="button"
                            onClick={openDispenseWorkspace}
                            className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                            title="Open dispense & billing for this visit"
                          >
                            <Pill className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            Dispense
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {visibleMedicationRows.length > 0 && (
            <div
              className={`flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2 text-xs ${
                isDark ? 'border-gray-700 text-gray-400' : 'border-slate-200 text-slate-600'
              }`}
            >
              <span>
                Showing{' '}
                {(medicationPage - 1) * MEDICATION_TABLE_PAGE_SIZE + (paginatedMedicationRows.length ? 1 : 0)}–
                {Math.min(medicationPage * MEDICATION_TABLE_PAGE_SIZE, visibleMedicationRows.length)} of{' '}
                {visibleMedicationRows.length} lines
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={medicationPage <= 1}
                  onClick={() => setMedicationPage((p) => Math.max(1, p - 1))}
                  className={`inline-flex items-center rounded border px-2 py-1 disabled:opacity-40 ${
                    isDark ? 'border-gray-600 hover:bg-gray-800' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="tabular-nums">
                  Page {medicationPage} / {medicationPageCount}
                </span>
                <button
                  type="button"
                  disabled={medicationPage >= medicationPageCount}
                  onClick={() => setMedicationPage((p) => Math.min(medicationPageCount, p + 1))}
                  className={`inline-flex items-center rounded border px-2 py-1 disabled:opacity-40 ${
                    isDark ? 'border-gray-600 hover:bg-gray-800' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : mode === 'review' && isVisitReview ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,380px)_1fr]">
          <div className="flex min-h-0 max-h-[min(70vh,640px)] flex-col gap-2">
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {paginatedReviewPrescriptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedPrescriptionId(item.id)}
                  className={`w-full rounded-lg border p-2.5 text-left text-sm transition-colors ${
                    selectedPrescription?.id === item.id
                      ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40'
                      : isDark
                        ? 'border-gray-700 hover:bg-gray-800'
                        : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        {item.prescription_number}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{formatDate(item.prescription_date)}</p>
                    </div>
                    {lineDispenseState(item) === 'dispensed' && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Dispensed" />
                    )}
                    {lineDispenseState(item) === 'partial' && (
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" aria-label="Partially dispensed" />
                    )}
                    {lineDispenseState(item) === 'not_dispensed' && (
                      <Circle className="h-4 w-4 shrink-0 text-slate-300" aria-label="Not dispensed" />
                    )}
                  </div>
                  <span
                    className={`mt-1.5 inline-flex rounded px-1.5 py-0.5 text-[11px] ${statusTone(item.status)}`}
                  >
                    {item.status}
                  </span>
                </button>
              ))}
            </div>
            {visiblePrescriptions.length > REVIEW_RX_LIST_PAGE_SIZE && (
              <div
                className={`flex shrink-0 flex-wrap items-center justify-between gap-2 border-t pt-2 text-xs ${
                  isDark ? 'border-gray-700 text-gray-400' : 'border-slate-200 text-slate-600'
                }`}
              >
                <span className="tabular-nums">
                  {(reviewRxPage - 1) * REVIEW_RX_LIST_PAGE_SIZE + 1}–
                  {Math.min(reviewRxPage * REVIEW_RX_LIST_PAGE_SIZE, visiblePrescriptions.length)} of{' '}
                  {visiblePrescriptions.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={reviewRxPage <= 1}
                    onClick={() => setReviewRxPage((p) => Math.max(1, p - 1))}
                    className={`inline-flex items-center rounded border px-2 py-1 disabled:opacity-40 ${
                      isDark ? 'border-gray-600 hover:bg-gray-800' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                    aria-label="Previous prescriptions page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="tabular-nums">
                    {reviewRxPage}/{reviewRxPageCount}
                  </span>
                  <button
                    type="button"
                    disabled={reviewRxPage >= reviewRxPageCount}
                    onClick={() => setReviewRxPage((p) => Math.min(reviewRxPageCount, p + 1))}
                    className={`inline-flex items-center rounded border px-2 py-1 disabled:opacity-40 ${
                      isDark ? 'border-gray-600 hover:bg-gray-800' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                    aria-label="Next prescriptions page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div
            className={`rounded-lg border p-4 ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-slate-200 bg-white'}`}
          >
            {selectedForReviewDetail && (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <p className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {selectedForReviewDetail.prescription_number}
                  </p>
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${statusTone(selectedForReviewDetail.status)}`}
                  >
                    {selectedForReviewDetail.status}
                  </span>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openPrescriptionNotes(selectedForReviewDetail.id)}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
                      isDark
                        ? 'border-gray-600 text-gray-100 hover:bg-gray-800'
                        : 'border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <FileEdit className="h-4 w-4" aria-hidden />
                    Edit notes
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setReportModal({ prescriptionId: selectedForReviewDetail.id, initialAction: 'preview' })
                    }
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
                      isDark
                        ? 'border-gray-600 text-gray-100 hover:bg-gray-800'
                        : 'border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Eye className="h-4 w-4" aria-hidden />
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setReportModal({ prescriptionId: selectedForReviewDetail.id, initialAction: 'print' })
                    }
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
                      isDark
                        ? 'border-gray-600 text-gray-100 hover:bg-gray-800'
                        : 'border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Printer className="h-4 w-4" aria-hidden />
                    Print
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setReportModal({ prescriptionId: selectedForReviewDetail.id, initialAction: 'download' })
                    }
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
                      isDark
                        ? 'border-gray-600 text-gray-100 hover:bg-gray-800'
                        : 'border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={openDispenseWorkspace}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <Pill className="h-4 w-4" aria-hidden />
                    Dispense
                  </button>
                </div>

                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                  Diagnosis: {selectedForReviewDetail.diagnosis || 'Not documented'}
                </p>
                <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                  Clinical notes: {selectedForReviewDetail.clinical_notes || 'Not documented'}
                </p>
                <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                  Prescribed on: {formatDate(selectedForReviewDetail.prescription_date)}
                </p>

                <h4
                  className={`mt-6 border-t pt-4 text-sm font-semibold ${
                    isDark ? 'border-gray-700 text-gray-200' : 'border-slate-200 text-slate-900'
                  }`}
                >
                  Medications on this prescription ({(selectedForReviewDetail.items ?? []).length})
                </h4>
                <div
                  className={`mt-2 max-h-[min(50vh,480px)] overflow-auto rounded-lg border ${
                    isDark ? 'border-gray-700' : 'border-slate-200'
                  }`}
                >
                  <table className="w-full min-w-[400px] table-fixed border-collapse text-left text-xs">
                    <thead
                      className={`sticky top-0 z-[1] border-b text-[11px] uppercase tracking-wide ${
                        isDark ? 'border-gray-700 bg-gray-900 text-gray-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      <tr>
                        <th className="w-10 px-2 py-2 font-semibold"> </th>
                        <th className="px-2 py-2 font-semibold">Medication</th>
                        <th className="hidden w-[100px] px-2 py-2 font-semibold sm:table-cell">Qty</th>
                        <th className="w-[120px] px-2 py-2 font-semibold">Fulfillment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedForReviewDetail.items ?? []).map((line) => {
                        const st = lineDispenseState(selectedForReviewDetail);
                        return (
                          <tr
                            key={line.id}
                            className={`border-b last:border-b-0 ${
                              isDark ? 'border-gray-800' : 'border-slate-100'
                            }`}
                          >
                            <td className="px-2 py-2 align-top">
                              {st === 'dispensed' && (
                                <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-600" aria-hidden />
                              )}
                              {st === 'partial' && (
                                <AlertCircle className="mx-auto h-4 w-4 text-amber-500" aria-hidden />
                              )}
                              {st === 'not_dispensed' && (
                                <Circle className="mx-auto h-4 w-4 text-slate-300" aria-hidden />
                              )}
                            </td>
                            <td className="px-2 py-2 align-top">
                              <div className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                                {line.medication_name}
                                {line.strength ? (
                                  <span className={`font-normal ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                                    {' '}
                                    · {line.strength}
                                  </span>
                                ) : null}
                              </div>
                              <div className={`mt-0.5 text-[11px] ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                                {line.dosage_text} · {line.duration_text}
                              </div>
                            </td>
                            <td className="hidden px-2 py-2 align-top tabular-nums sm:table-cell">
                              {line.total_quantity}
                            </td>
                            <td className={`px-2 py-2 align-top text-[11px] leading-snug ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                              {st === 'dispensed' && 'Dispensed (Rx closed).'}
                              {st === 'partial' && 'Partial — complete in Dispense & fulfill.'}
                              {st === 'not_dispensed' && 'Not dispensed yet.'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {(selectedForReviewDetail.items ?? []).length === 0 && (
                  <p className={`mt-2 text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                    No line items loaded. Refresh or open this prescription in clinical documentation.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      ) : mode === 'review' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
          <div className="max-h-[58vh] space-y-2 overflow-y-auto pr-1">
            {visiblePrescriptions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedPrescriptionId(item.id)}
                className={`w-full rounded-lg border p-3 text-left ${
                  selectedPrescription?.id === item.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <p className="font-medium">{item.prescription_number}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDate(item.prescription_date)}</p>
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            {selectedPrescription && (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold">{selectedPrescription.prescription_number}</p>
                  <span className={`rounded px-2 py-0.5 text-xs ${statusTone(selectedPrescription.status)}`}>
                    {selectedPrescription.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  Diagnosis: {selectedPrescription.diagnosis || 'Not documented'}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Clinical notes: {selectedPrescription.clinical_notes || 'Not documented'}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Prescribed on: {formatDate(selectedPrescription.prescription_date)}
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {visiblePrescriptions.map((item) => {
            const canDispense = item.status === PrescriptionStatus.ACTIVE;
            const canCancel =
              item.status !== PrescriptionStatus.CANCELLED &&
              item.status !== PrescriptionStatus.FULLY_DISPENSED;

            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{item.prescription_number}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(item.prescription_date)} • {item.diagnosis || 'No diagnosis'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Patient: {item.patient?.name || 'Unknown'} • Visit:{' '}
                    {item.visit?.visit_uuid || item.visit_id || 'N/A'}
                  </p>
                  <span className={`mt-1 inline-flex rounded px-2 py-0.5 text-xs ${statusTone(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPrescriptionId(item.id)}
                    className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    Review
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDispense(item)}
                    disabled={!canDispense || !canBeDispensed(item) || markDispensed.isPending}
                    className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-xs text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Dispense
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCancel(item)}
                    disabled={!canCancel || cancelPrescription.isPending}
                    className="inline-flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-xs text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {mode === 'flagged' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          <ShieldAlert className="mr-2 inline h-4 w-4" />
          Prioritize on-hold, expired, and cancelled prescriptions for pharmacist intervention.
        </div>
      )}

      {scope === 'activeVisit' && (
        <PharmacyPrescriptionReportModal
          prescriptionId={reportModal?.prescriptionId ?? null}
          open={reportModal !== null}
          onClose={() => setReportModal(null)}
          initialAction={reportModal?.initialAction ?? 'preview'}
        />
      )}
    </div>
  );
};

export default PrescriptionWorkbench;
