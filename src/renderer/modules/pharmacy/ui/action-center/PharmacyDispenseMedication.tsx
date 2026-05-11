/**
 * Pharmacy dispensing — mirrors Charge Entry UX (SearchBar + ChargeItemsList + billing slice).
 * Draft lines accumulate in Redux; pharmacist saves once to post new charges to the patient bill.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Lock,
  Maximize2,
  Pill,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';

import { type RootState } from '../../../../app/store/rootReducer';
import { store } from '../../../../app/store/store';
import { axiosInstance } from '../../../../app/api/axiosConfig';
import { PHARMACY_ROUTES } from '../../../../app/routes/routeConstants';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import { cn } from '../../../../shared/utils/classNameUtils';
import { useConfirm } from '../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import { containerVariants } from '../../../../shared/components/animations/motionVariants';
import LogoImage from '../../../../shared/assets/LogoImage';
import { BrandName } from '../../../../shared/utils/BrandName';

import {
  selectActivePatient,
  selectActiveVisit,
  selectActiveVisitId,
  selectActiveVisitPatientId,
  selectHasActiveVisit,
} from '../../../../app/store/slices/visitSlice';

import {
  addChargeItem,
  clearBackendBilling,
  clearBillingDataLoaded,
  hydrateBackendBilling,
  increaseQuantity,
  decreaseQuantity,
  removeChargeItem,
  clearCharges,
  selectBilling,
  selectBillingData,
  selectDraftChargeItems,
  selectRenderableChargeItems,
  selectEffectiveBillingStatus,
  selectBackendChargeItems,
  optimisticAdjustBackendItem,
  rollbackOptimisticBackendAdjustment,
  setBillingDataLoaded,
  setPatientInfo,
  setQuantity,
  selectDisplayBillingData,
} from '../../../medical-records/ui/visit-action-center/billing-space/billingSlice';

import {
  type BackendChargeItem,
  type ServiceItem,
  type RenderableChargeItem,
  type AnyBackendChargeItem,
  makeBillableKey,
  formatCurrency,
  getChargeItemQuantity,
} from '../../../medical-records/ui/visit-action-center/billing-space/billing-types';

import { BillableItemType } from '../../../medical-records/api/billable-items/BillingItemsTypes';
import {
  useGetBillableItems,
  useGetBillingByVisit,
  useSubmitBilling,
  useAdjustBillingLineItem,
  billingItemsKeys,
} from '../../../medical-records/api/billable-items/BillableItemsQueries';
import type { BillingSubmissionPayload } from '../../../medical-records/api/billable-items/BillingItemsTypes';
import type { PrescriptionResponse } from '../../../medical-records/api/prescription/PrescriptionTypes';
import { PaymentStatus } from '../../../medical-records/api/billing-review/BillingReviewTypes';

import { useGetAllergies } from '../../../medical-records/api/allergies/AllergyQueries';
import type { Allergy } from '../../../medical-records/api/allergies/AllergyTypes';
import { AllergySeverity } from '../../../medical-records/api/allergies/AllergyTypes';

import {
  useGetPatientPrescriptions,
  prescriptionKeys,
} from '../../../medical-records/api/prescription/PrescriptionQueries';
import { PrescriptionStatus } from '../../../medical-records/api/prescription/PrescriptionTypes';
import type { Prescription } from '../../../medical-records/api/prescription/PrescriptionTypes';
import type { PrescriptionItem } from '../../../medical-records/api/prescription-items/PrescriptionItemsTypes';

import { SearchBar } from '../../../medical-records/ui/visit-action-center/billing-space/charge-entry/SearchBar';
import { ChargeItemsList } from '../../../medical-records/ui/visit-action-center/billing-space/charge-entry/ChargeItemsList';
import PersistedBillingAdjustmentModal from '../../../medical-records/ui/visit-action-center/billing-space/charge-entry/PersistedBillingAdjustmentModal';
import LineItemHistoryModal from '../../../medical-records/ui/revenue/billing-review/components/receipt-action-modals/LineItemHistoryModal';

import {
  PharmacyInventoryCreateDrawer,
  CreateInventoryItemButton,
} from './PharmacyInventoryCreateDrawer';

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
const safeLower = (v: string) => (v || '').toLowerCase();

const normalizeAllergyList = (raw: unknown): { allergen: string; severity: string }[] => {
  const payload = raw as { data?: { data?: Allergy[] } | Allergy[] } | undefined;
  const nested =
    payload?.data && typeof payload.data === 'object' && 'data' in payload.data
      ? (payload.data as { data?: Allergy[] }).data
      : undefined;
  const list: Allergy[] = Array.isArray(nested)
    ? nested
    : Array.isArray(payload?.data)
      ? (payload?.data as Allergy[])
      : [];
  return list
    .filter((a) => a.is_active !== false)
    .map((a) => ({ allergen: a.allergen, severity: a.severity ?? String(AllergySeverity.MILD) }));
};

const medMatchesBillLine = (medicationName: string, serviceName: string): boolean => {
  const a = norm(medicationName);
  const b = norm(serviceName);
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a) || a.split(' ')[0] === b.split(' ')[0];
};

const countBilledUnitsForMed = (
  medicationName: string,
  items: { service: ServiceItem; quantity: number }[]
): number =>
  items
    .filter((row) => medMatchesBillLine(medicationName, row.service.name))
    .reduce((sum, row) => sum + row.quantity, 0);

function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Submit payload built only from the given draft lines (recalculated totals for allergy-safe partial save). */
function buildBillingPayloadFromDraftSubset(
  state: RootState,
  draftSubset: ReturnType<typeof selectDraftChargeItems>
): BillingSubmissionPayload | null {
  if (!draftSubset.length) return null;
  const visitIdNum = selectActiveVisitId(state);
  const patientIdNum = selectActiveVisitPatientId(state);
  if (visitIdNum == null || patientIdNum == null) return null;

  const billingState = selectBilling(state);
  const draftBillingData = selectBillingData(state);
  const discount = billingState.discount;
  const hasDiscount =
    discount?.value !== undefined && discount?.value !== null && Number(discount.value) > 0;

  const subtotal = roundMoney(draftSubset.reduce((s, item) => s + item.totalAmount, 0));

  let discountAmount = 0;
  if (hasDiscount && discount) {
    if (discount.type === 'percentage') {
      discountAmount = roundMoney(subtotal * (Number(discount.value) / 100));
    } else {
      discountAmount = roundMoney(Math.min(Number(discount.value), subtotal));
    }
  }

  const taxableAmount = roundMoney(Math.max(0, subtotal - discountAmount));
  const taxes = draftBillingData.taxes.map((tax) => ({
    name: tax.name,
    rate: tax.rate,
    amount: roundMoney(taxableAmount * (tax.rate / 100)),
  }));
  const taxTotal = roundMoney(taxes.reduce((s, t) => s + t.amount, 0));
  const grandTotal = roundMoney(taxableAmount + taxTotal);
  const totalPaid = roundMoney(
    billingState.paymentMethods.reduce((sum, m) => sum + (Number(m.amount) || 0), 0)
  );

  return {
    visit_id: Number(visitIdNum),
    patient_id: Number(patientIdNum),
    charge_items: draftSubset.map((item) => ({
      service_key: item.serviceKey,
      service: {
        id: item.service.id,
        code: item.service.code,
        name: item.service.name.toUpperCase(),
        unitPrice: item.service.unitPrice,
        category: item.service.category,
      },
      quantity: item.quantity,
      totalAmount: item.totalAmount,
    })),
    ...(hasDiscount &&
      discount && {
        discount: {
          type: discount.type,
          value: discount.value,
          ...(discount.reason && { reason: discount.reason }),
        },
      }),
    taxes,
    payment_methods: billingState.paymentMethods
      .filter((m) => (Number(m.amount) || 0) > 0)
      .map((m) => ({
        type: m.type,
        amount: Number(m.amount),
        reference: m.reference || m.details || undefined,
        details: m.details || undefined,
      })),
    billing_data: {
      subtotal,
      discountAmount,
      taxableAmount,
      taxTotal,
      grandTotal,
      totalPaid,
      balance: roundMoney(grandTotal - totalPaid),
    },
    additional_notes: billingState.additionalNotes || undefined,
    status: 'ready',
    payment_status: PaymentStatus.PENDING,
  };
}

export interface PharmacyDispenseMedicationProps {
  theme: 'light' | 'dark';
}

type PersistedAction = 'increase' | 'decrease' | 'remove';

const PharmacyDispenseMedication: React.FC<PharmacyDispenseMedicationProps> = ({ theme }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();
  const isDark = theme === 'dark';

  const hasVisit = useSelector(selectHasActiveVisit);
  const activeVisit = useSelector(selectActiveVisit);
  const visitIdNum = useSelector(selectActiveVisitId);
  const patientIdNum = useSelector(selectActiveVisitPatientId);
  const patient = useSelector(selectActivePatient);

  const renderableChargeItems = useSelector(selectRenderableChargeItems);
  const draftChargeItems = useSelector(selectDraftChargeItems);
  const backendChargeItems = useSelector(selectBackendChargeItems);
  const billingState = useSelector(selectBilling);
  const billingStatus = useSelector(selectEffectiveBillingStatus);
  const displayBillingData = useSelector(selectDisplayBillingData);

  const visitIdStr = visitIdNum != null ? String(visitIdNum) : '';
  const patientIdStr = patientIdNum != null ? String(patientIdNum) : '';
  const numericVisitId = activeVisit?.visit_id ? Number(activeVisit.visit_id) : 0;

  const [searchTerm, setSearchTerm] = useState('');
  const [catalogSearchResults, setCatalogSearchResults] = useState<ServiceItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearchSticky, setIsSearchSticky] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [importPulse, setImportPulse] = useState(false);
  const [dispenseFocusOpen, setDispenseFocusOpen] = useState(false);
  const [inventoryDrawerOpen, setInventoryDrawerOpen] = useState(false);

  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentNewQuantity, setAdjustmentNewQuantity] = useState(1);
  const [pendingAdjustment, setPendingAdjustment] = useState<{
    item: BackendChargeItem;
    action: PersistedAction;
  } | null>(null);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<BackendChargeItem | null>(null);

  const searchWrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isReadOnly = billingStatus === 'settled';
  /** Must be state (not a ref) so the Save button re-enables after submit — refs do not trigger re-renders. */
  const [isSavingToBill, setIsSavingToBill] = useState(false);
  const saveInFlightRef = useRef(false);

  /**
   * Allergy banner dismiss is scoped per visit (billing session). Other visits/patients keep their own state.
   * Reset keys re-show for that visit when conflicts / allergy list meaningfully change.
   */
  const [bannerHiddenByVisitId, setBannerHiddenByVisitId] = useState<
    Record<string, { prescriptionConflict?: boolean; knownAllergies?: boolean }>
  >({});

  const allergiesQuery = useGetAllergies(patientIdStr, {}, { enabled: !!patientIdStr });
  const allergyRows = useMemo(
    () => normalizeAllergyList(allergiesQuery.data),
    [allergiesQuery.data]
  );

  const rxQuery = useGetPatientPrescriptions(patientIdNum ?? 0, [], {
    enabled: !!patientIdNum,
    refetchInterval: 20_000,
  });

  const billableQuery = useGetBillableItems(
    {
      limit: 500,
      include_inactive: false,
      type: BillableItemType.INVENTORY,
    },
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const backendBilling = useGetBillingByVisit(numericVisitId, {
    enabled: !!numericVisitId,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const { mutateAsync: submitBilling } = useSubmitBilling({});
  const { mutateAsync: adjustBillingLineItem, isPending: isAdjustingPersistedItem } =
    useAdjustBillingLineItem(numericVisitId);

  const colors = useMemo(
    () => ({
      bg: {
        primary: isDark ? 'bg-gray-900' : 'bg-white',
        secondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
        hover: isDark ? 'bg-gray-800/60' : 'bg-gray-50',
        elevated: isDark ? 'bg-gray-900' : 'bg-white',
        overlay: isDark ? 'bg-gray-900/95' : 'bg-white/95',
        stripe: isDark ? 'bg-gray-800/30' : 'bg-gray-50/50',
        stripeAlt: isDark ? 'bg-gray-900/50' : 'bg-white/50',
        disabled: isDark ? 'bg-gray-800/50' : 'bg-gray-50',
      },
      border: {
        primary: isDark ? 'border-gray-800' : 'border-gray-200',
        subtle: isDark ? 'border-gray-700' : 'border-gray-100',
        disabled: isDark ? 'border-gray-700' : 'border-gray-200',
      },
      text: {
        primary: isDark ? 'text-gray-100' : 'text-gray-900',
        secondary: isDark ? 'text-gray-400' : 'text-gray-600',
        tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
        muted: isDark ? 'text-gray-500' : 'text-gray-400',
        disabled: isDark ? 'text-gray-500' : 'text-gray-400',
      },
      accent: {
        primary: 'bg-blue-600',
        hover: 'hover:bg-blue-700',
        text: 'text-white',
      },
      status: {
        settledBadge: isDark ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-50 text-blue-700',
        backendBadge: isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-50 text-amber-700',
        draftBadge: isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700',
        warningBadge: isDark ? 'bg-rose-500/15 text-rose-300' : 'bg-rose-50 text-rose-700',
      },
    }),
    [isDark]
  );

  useEffect(() => {
    if (!visitIdStr || !patientIdStr || !patient?.name) return;
    dispatch(
      setPatientInfo({
        visitId: visitIdStr,
        patientId: patientIdStr,
        patientName: patient.name,
      })
    );
  }, [dispatch, visitIdStr, patientIdStr, patient?.name]);

  useEffect(() => {
    if (!visitIdNum || !visitIdStr) {
      dispatch(clearBackendBilling());
      return;
    }
    if (backendBilling.isLoading) return;
    const payload = backendBilling.data?.data;
    if (payload?.has_billing) {
      dispatch(hydrateBackendBilling(payload));
    } else {
      dispatch(clearBackendBilling());
    }
    dispatch(setBillingDataLoaded({ visitId: visitIdStr, loaded: true }));
    return () => {
      if (visitIdStr) dispatch(clearBillingDataLoaded(visitIdStr));
    };
  }, [backendBilling.data, backendBilling.isLoading, dispatch, visitIdNum, visitIdStr]);

  const syncBillingSliceFromServer = useCallback(async () => {
    if (!numericVisitId || !visitIdStr) {
      dispatch(clearBackendBilling());
      return;
    }
    const refreshed = await backendBilling.refetch();
    const refreshedPayload = refreshed.data?.data;
    if (refreshedPayload?.has_billing) {
      dispatch(hydrateBackendBilling(refreshedPayload));
    } else {
      dispatch(clearBackendBilling());
    }
    dispatch(setBillingDataLoaded({ visitId: visitIdStr, loaded: true }));
  }, [backendBilling, dispatch, numericVisitId, visitIdStr]);

  const allServices: ServiceItem[] = useMemo(() => {
    const services = billableQuery.data?.data?.services ?? [];
    if (services.length > 0) return services;
    const itemsFull = billableQuery.data?.data?.items_full ?? [];
    return itemsFull.map((x) => ({
      id: x.id,
      code: x.code,
      name: x.name,
      unitPrice: x.unitPrice,
      category: x.category,
    }));
  }, [billableQuery.data]);

  const dedupedServices: ServiceItem[] = useMemo(() => {
    const seen = new Set<string>();
    const out: ServiceItem[] = [];
    for (const s of allServices) {
      const k = makeBillableKey(s);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(s);
    }
    return out;
  }, [allServices]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const term = searchTerm.trim();
      if (billableQuery.isLoading) {
        setShowSearchResults(true);
        setCatalogSearchResults([]);
        return;
      }
      if (!term) {
        setCatalogSearchResults([]);
        setShowSearchResults(false);
        return;
      }
      const t = safeLower(term);
      const results = dedupedServices
        .filter(
          (s) =>
            safeLower(s.name).includes(t) ||
            safeLower(s.code).includes(t) ||
            safeLower(s.category).includes(t)
        )
        .slice(0, 8);
      setCatalogSearchResults(results);
      setShowSearchResults(true);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, dedupedServices, billableQuery.isLoading]);

  const checkBlockedByAllergy = useCallback(
    (medicationLabel: string): { blocked: boolean; allergen?: string; severity?: string } => {
      if (!allergyRows.length) return { blocked: false };
      const lower = norm(medicationLabel);
      const hit = allergyRows.find(
        (a) => lower.includes(norm(a.allergen)) || norm(a.allergen).includes(lower)
      );
      if (!hit) return { blocked: false };
      return { blocked: true, allergen: hit.allergen, severity: hit.severity };
    },
    [allergyRows]
  );

  /** Draft lines that match an allergen (still shown in session; excluded from save until removed). */
  const draftLinesMatchingAllergy = useMemo(() => {
    return draftChargeItems.filter((row) => checkBlockedByAllergy(row.service.name).blocked);
  }, [draftChargeItems, checkBlockedByAllergy]);

  /** Save posts only non–allergy-flagged drafts — enable Save iff at least one such draft exists. */
  const hasSaveableDraftLine = useMemo(
    () =>
      draftChargeItems.some((row) => !checkBlockedByAllergy(row.service.name).blocked),
    [draftChargeItems, checkBlockedByAllergy]
  );

  const prescriptionsForVisit: Prescription[] = useMemo(() => {
    const rows = rxQuery.data?.data ?? [];
    if (!visitIdNum) return [];
    return rows.filter(
      (p) =>
        p.visit_id === visitIdNum &&
        (p.status === PrescriptionStatus.ACTIVE || p.status === PrescriptionStatus.PARTIALLY_DISPENSED)
    );
  }, [rxQuery.data, visitIdNum]);

  const rxIdsNeedingDetail = useMemo(
    () => prescriptionsForVisit.filter((p) => !p.items?.length).map((p) => p.id),
    [prescriptionsForVisit]
  );

  const detailQueries = useQueries({
    queries: rxIdsNeedingDetail.map((id) => ({
      queryKey: prescriptionKeys.detail(id),
      queryFn: async () => {
        const res = await axiosInstance.get<PrescriptionResponse>(`/prescriptions/${id}`);
        return res.data.data;
      },
      enabled: !!id && !!visitIdNum && !!patientIdNum,
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

  const prescriptionsMerged = useMemo(
    () =>
      prescriptionsForVisit.map((rx) => {
        const fromDetail = prescriptionDetailById.get(rx.id)?.items;
        const items = rx.items?.length ? rx.items : fromDetail;
        if (items?.length) return { ...rx, items };
        return rx;
      }),
    [prescriptionsForVisit, prescriptionDetailById]
  );

  const prescriptionLines: { rx: Prescription; item: PrescriptionItem }[] = useMemo(() => {
    const out: { rx: Prescription; item: PrescriptionItem }[] = [];
    for (const rx of prescriptionsMerged) {
      const items = rx.items ?? [];
      for (const item of items) {
        out.push({ rx, item });
      }
    }
    return out;
  }, [prescriptionsMerged]);

  /** Prescribed medication names that match a documented allergen (informational / workflow banner). */
  const prescriptionAllergyConflicts = useMemo(() => {
    const out: { medication: string; allergen: string; severity: string }[] = [];
    const seen = new Set<string>();
    for (const { item } of prescriptionLines) {
      const med = item.medication_name?.trim() ?? '';
      if (!med) continue;
      const r = checkBlockedByAllergy(med);
      if (r.blocked && r.allergen) {
        const key = `${norm(med)}|${norm(r.allergen)}`;
        if (!seen.has(key)) {
          seen.add(key);
          out.push({
            medication: med,
            allergen: r.allergen,
            severity: r.severity ?? '',
          });
        }
      }
    }
    return out;
  }, [prescriptionLines, checkBlockedByAllergy]);

  const prescriptionConflictBannerResetKey = useMemo(
    () =>
      prescriptionAllergyConflicts
        .map((c) => `${norm(c.medication)}|${norm(c.allergen)}`)
        .sort()
        .join(';'),
    [prescriptionAllergyConflicts]
  );

  const knownAllergiesBannerResetKey = useMemo(
    () =>
      allergyRows
        .map((a) => `${norm(a.allergen)}|${norm(a.severity)}`)
        .sort()
        .join(';'),
    [allergyRows]
  );

  const prescriptionConflictBannerHidden = Boolean(
    visitIdStr && bannerHiddenByVisitId[visitIdStr]?.prescriptionConflict
  );
  const knownAllergiesBannerHidden = Boolean(
    visitIdStr && bannerHiddenByVisitId[visitIdStr]?.knownAllergies
  );

  useEffect(() => {
    if (!visitIdStr) return;
    setBannerHiddenByVisitId((prev) => ({
      ...prev,
      [visitIdStr]: {
        ...prev[visitIdStr],
        prescriptionConflict: false,
      },
    }));
  }, [prescriptionConflictBannerResetKey, visitIdStr]);

  useEffect(() => {
    if (!visitIdStr) return;
    setBannerHiddenByVisitId((prev) => ({
      ...prev,
      [visitIdStr]: {
        ...prev[visitIdStr],
        knownAllergies: false,
      },
    }));
  }, [knownAllergiesBannerResetKey, visitIdStr]);

  const rxDetailLoading =
    rxIdsNeedingDetail.length > 0 && detailQueries.some((q) => q.isPending || q.isLoading);

  const chargedRows = useMemo(
    () =>
      renderableChargeItems.map((row) => ({
        service: row.service,
        quantity: getChargeItemQuantity(row),
        source: row.source,
      })),
    [renderableChargeItems]
  );

  const displayedSubtotal = useMemo(
    () => renderableChargeItems.reduce((sum, item) => sum + item.totalAmount, 0),
    [renderableChargeItems]
  );

  const findRenderableItemById = (itemId: string): RenderableChargeItem | undefined =>
    renderableChargeItems.find((item) => item.id === itemId);

  const clampQty = (val: number) => {
    if (!Number.isFinite(val)) return 1;
    const n = Math.floor(val);
    if (n < 1) return 1;
    if (n > 9999) return 9999;
    return n;
  };

  const openAdjustmentDialog = (
    item: BackendChargeItem,
    action: PersistedAction = 'increase',
    quantityDelta = 1
  ) => {
    setPendingAdjustment({ item, action });
    setAdjustmentReason('');
    let newQuantity = item.quantity;
    if (action === 'increase') newQuantity = item.quantity + quantityDelta;
    else if (action === 'decrease') newQuantity = Math.max(0, item.quantity - quantityDelta);
    else if (action === 'remove') newQuantity = 0;
    setAdjustmentNewQuantity(newQuantity);
    setAdjustmentDialogOpen(true);
  };

  const closeAdjustmentDialog = () => {
    setPendingAdjustment(null);
    setAdjustmentReason('');
    setAdjustmentNewQuantity(1);
    setAdjustmentDialogOpen(false);
  };

  const submitPersistedAdjustment = async (
    item: BackendChargeItem,
    action: PersistedAction,
    deltaQuantity: number,
    reason?: string
  ) => {
    await adjustBillingLineItem({
      line_item_id: item.lineItemId,
      action,
      quantity: action === 'remove' ? 0 : deltaQuantity,
      reason: reason?.trim() || undefined,
    });
  };

  const handleAdjustmentDialogSubmit = async () => {
    if (!pendingAdjustment) return;
    const { item } = pendingAdjustment;
    const finalQuantity = adjustmentNewQuantity;
    const currentQuantity = item.quantity;
    const rsn = adjustmentReason;

    let apiAction: PersistedAction;
    let deltaQuantity: number;

    if (finalQuantity === 0) {
      apiAction = 'remove';
      deltaQuantity = 0;
    } else if (finalQuantity > currentQuantity) {
      apiAction = 'increase';
      deltaQuantity = finalQuantity - currentQuantity;
    } else if (finalQuantity < currentQuantity) {
      apiAction = 'decrease';
      deltaQuantity = currentQuantity - finalQuantity;
    } else {
      closeAdjustmentDialog();
      return;
    }

    const previousBackendChargeItems: AnyBackendChargeItem[] = billingState.backendChargeItems.map(
      (backendItem): AnyBackendChargeItem => {
        if (backendItem.source === 'refund') {
          return {
            ...backendItem,
            source: 'refund',
            refunded: true,
            service: { ...backendItem.service },
            quantity: { ...backendItem.quantity },
            permissions: { ...backendItem.permissions },
            audit: backendItem.audit ? { ...backendItem.audit } : undefined,
          };
        }
        return {
          ...backendItem,
          source: 'backend',
          service: { ...backendItem.service },
          quantity: backendItem.quantity,
          permissions: { ...backendItem.permissions },
          audit: backendItem.audit ? { ...backendItem.audit } : undefined,
        };
      }
    );

    const previousOptimisticPersistedBalanceDelta = billingState.optimisticPersistedBalanceDelta;

    dispatch(
      optimisticAdjustBackendItem({
        lineItemId: item.lineItemId,
        action: apiAction,
        quantity: deltaQuantity,
      })
    );

    closeAdjustmentDialog();

    try {
      await submitPersistedAdjustment(item, apiAction, deltaQuantity, rsn);
      await syncBillingSliceFromServer();
    } catch (error) {
      console.error('Failed to adjust persisted item:', error);
      dispatch(
        rollbackOptimisticBackendAdjustment({
          previousBackendChargeItems,
          previousOptimisticPersistedBalanceDelta,
        })
      );
    }
  };

  const handleAddItemFromSearch = (service: ServiceItem) => {
    if (isReadOnly) return;
    const block = checkBlockedByAllergy(service.name);
    if (block.blocked) {
      showToast(
        'error',
        `Cannot dispense: allergy to “${block.allergen}” (${block.severity}).`,
        7000
      );
      return;
    }

    const serviceKey = makeBillableKey(service);
    const existingBackendItem = backendChargeItems.find(
      (row): row is BackendChargeItem =>
        row.source === 'backend' && row.serviceKey === serviceKey
    );

    if (existingBackendItem) {
      openAdjustmentDialog(existingBackendItem, 'increase', 1);
      setSearchTerm('');
      setShowSearchResults(false);
      inputRef.current?.focus();
      return;
    }

    dispatch(addChargeItem(service));
    setSearchTerm('');
    setShowSearchResults(false);
    inputRef.current?.focus();
  };

  const handleSaveDraftToBill = useCallback(async () => {
    const drafts = selectDraftChargeItems(store.getState());
    const safeDrafts = drafts.filter((line) => !checkBlockedByAllergy(line.service.name).blocked);
    const skippedDrafts = drafts.filter((line) => checkBlockedByAllergy(line.service.name).blocked);

    if (safeDrafts.length === 0) {
      if (skippedDrafts.length > 0) {
        showToast(
          'warning',
          'Only allergy-flagged lines are in your new items — remove them or add other medications, then save.',
          7000
        );
      } else {
        showToast('info', 'No new dispensed lines to save.', 3500);
      }
      return;
    }

    const payload = buildBillingPayloadFromDraftSubset(store.getState(), safeDrafts);
    if (!payload) {
      showToast('info', 'No new dispensed lines to save.', 3500);
      return;
    }
    if (saveInFlightRef.current) return;
    saveInFlightRef.current = true;
    setIsSavingToBill(true);
    try {
      await submitBilling(payload);
      for (const line of safeDrafts) {
        dispatch(removeChargeItem(line.id));
      }
      await syncBillingSliceFromServer();
      await queryClient.invalidateQueries({ queryKey: prescriptionKeys.all() });
      await queryClient.invalidateQueries({ queryKey: billingItemsKeys.lists() });
      if (visitIdNum != null) {
        await queryClient.invalidateQueries({ queryKey: billingItemsKeys.detail(visitIdNum) });
      }
      if (skippedDrafts.length > 0) {
        const names = skippedDrafts.map((d) => d.service.name).join(', ');
        showToast(
          'success',
          `Saved ${safeDrafts.length} line(s) to the bill. Skipped ${skippedDrafts.length} allergy-flagged line(s): ${names}.`,
          8000
        );
      } else {
        showToast('success', 'Medication charges saved to the patient bill.', 4500);
      }
    } catch (e) {
      console.error(e);
      showToast('error', 'Could not save charges. Try again.', 5000);
    } finally {
      saveInFlightRef.current = false;
      setIsSavingToBill(false);
    }
  }, [checkBlockedByAllergy, dispatch, queryClient, showToast, submitBilling, syncBillingSliceFromServer, visitIdNum]);

  const handleClearAllDrafts = async () => {
    if (isReadOnly || draftChargeItems.length === 0) return;
    const confirmed = await confirm({
      title: 'Clear unsaved dispensed lines?',
      message: `Remove ${draftChargeItems.length} new line(s) from this session? Saved bill lines are unchanged.`,
      confirmText: 'Clear',
      cancelText: 'Cancel',
      variant: 'warning',
      theme,
    });
    if (confirmed) dispatch(clearCharges());
  };

  const handleIncreaseAction = async (itemId: string) => {
    const item = findRenderableItemById(itemId);
    if (!item || isReadOnly) return;
    if (item.source === 'backend') {
      await handlePersistedItemAction(item as BackendChargeItem, 'increase');
      return;
    }
    dispatch(increaseQuantity(itemId));
  };

  const handleDecreaseAction = async (itemId: string) => {
    const item = findRenderableItemById(itemId);
    if (!item || isReadOnly) return;
    if (item.source === 'backend') {
      await handlePersistedItemAction(item as BackendChargeItem, 'decrease');
      return;
    }
    dispatch(decreaseQuantity(itemId));
  };

  const handleRemoveAction = async (itemId: string) => {
    const item = findRenderableItemById(itemId);
    if (!item || isReadOnly) return;
    if (item.source === 'backend') {
      await handlePersistedItemAction(item as BackendChargeItem, 'remove');
      return;
    }
    dispatch(removeChargeItem(itemId));
  };

  const handlePersistedItemAction = async (item: BackendChargeItem, action: PersistedAction) => {
    if (isReadOnly) return;
    openAdjustmentDialog(item, action, 1);
  };

  const handleQtyChange = (itemId: string, raw: string) => {
    if (isReadOnly) return;
    const item = findRenderableItemById(itemId);
    if (!item || item.source === 'backend') return;
    if (raw.trim() === '') {
      dispatch(setQuantity({ itemId, quantity: 1 }));
      return;
    }
    dispatch(setQuantity({ itemId, quantity: clampQty(Number(raw)) }));
  };

  const handleQtyBlur = (itemId: string, raw: string) => {
    if (isReadOnly) return;
    const item = findRenderableItemById(itemId);
    if (!item || item.source === 'backend') return;
    dispatch(setQuantity({ itemId, quantity: clampQty(Number(raw)) }));
  };

  const handleViewHistory = (item: RenderableChargeItem) => {
    if (item.source === 'backend') {
      setSelectedHistoryItem(item as BackendChargeItem);
      setHistoryModalOpen(true);
    }
  };

  const handleCloseHistoryModal = () => {
    setHistoryModalOpen(false);
    setSelectedHistoryItem(null);
  };

  const handleSearchFocus = () => {
    if (isReadOnly) return;
    setIsSearchFocused(true);
    if (searchTerm.trim() || billableQuery.isLoading) setShowSearchResults(true);
  };

  const handleSearchBlur = () => setIsSearchFocused(false);

  const handleClearSearch = () => {
    setSearchTerm('');
    setShowSearchResults(false);
    inputRef.current?.focus();
  };

  const handleSearchChange = (value: string) => {
    if (!isReadOnly) setSearchTerm(value);
  };

  const handleImportRxHighlight = useCallback(() => {
    setImportPulse(true);
    setTimeout(() => setImportPulse(false), 1200);
    void rxQuery.refetch();
    showToast('info', 'Prescription list refreshed.', 3000);
  }, [rxQuery, showToast]);

  const handleImportFromPrescription = useCallback(async () => {
    if (isReadOnly) {
      showToast('error', 'Billing is settled. Import is locked.', 4000);
      return;
    }
    if (prescriptionLines.length === 0) {
      showToast('info', 'No prescription lines to import.', 3000);
      return;
    }

    const qtyByService = new Map<string, { service: ServiceItem; qty: number }>();
    let blocked = 0;
    let unmatched = 0;

    for (const { item } of prescriptionLines) {
      const medName = item.medication_name ?? '';
      const block = checkBlockedByAllergy(medName);
      if (block.blocked) {
        blocked += 1;
        continue;
      }

      const matchedService = dedupedServices.find((s) => medMatchesBillLine(medName, s.name));
      if (!matchedService) {
        unmatched += 1;
        continue;
      }

      const key = makeBillableKey(matchedService);
      const qty = clampQty(Number(item.dosage_quantity ?? 1));
      const existing = qtyByService.get(key);
      if (existing) {
        existing.qty += qty;
      } else {
        qtyByService.set(key, { service: matchedService, qty });
      }
    }

    if (qtyByService.size === 0) {
      showToast(
        'info',
        `Nothing imported. Unmatched: ${unmatched}, blocked by allergy: ${blocked}.`,
        4500
      );
      return;
    }

    let imported = 0;
    let adjusted = 0;

    for (const { service, qty } of qtyByService.values()) {
      const serviceKey = makeBillableKey(service);
      const existingBackendItem = backendChargeItems.find(
        (row): row is BackendChargeItem =>
          row.source === 'backend' && row.serviceKey === serviceKey
      );

      if (existingBackendItem) {
        await adjustBillingLineItem({
          line_item_id: existingBackendItem.lineItemId,
          action: 'increase',
          quantity: qty,
          reason: 'Imported from prescription',
        });
        adjusted += 1;
      } else {
        for (let i = 0; i < qty; i += 1) {
          dispatch(addChargeItem(service));
        }
        imported += 1;
      }
    }

    if (adjusted > 0) {
      await syncBillingSliceFromServer();
    }

    showToast(
      'success',
      `Imported ${imported} new item(s), updated ${adjusted} saved item(s). Unmatched: ${unmatched}, blocked: ${blocked}.`,
      6000
    );
  }, [
    isReadOnly,
    prescriptionLines,
    checkBlockedByAllergy,
    dedupedServices,
    clampQty,
    backendChargeItems,
    adjustBillingLineItem,
    dispatch,
    syncBillingSliceFromServer,
    showToast,
  ]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!searchWrapRef.current?.contains(e.target as Node)) setShowSearchResults(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      setIsSearchSticky(containerRef.current.scrollTop > 50);
    };
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [dispenseFocusOpen]);

  const requestCloseFocus = useCallback(async () => {
    if (!dispenseFocusOpen) return;
    if (isReadOnly || draftChargeItems.length === 0) {
      setDispenseFocusOpen(false);
      return;
    }
    const confirmed = await confirm({
      title: 'Exit dispensing?',
      message:
        'You have unsaved draft medication lines. Exit now and keep drafts, or stay and save them to the patient bill.',
      confirmText: 'Exit anyway',
      cancelText: 'Stay and continue',
      variant: 'warning',
      theme,
    });
    if (confirmed) setDispenseFocusOpen(false);
  }, [confirm, dispenseFocusOpen, draftChargeItems.length, isReadOnly, theme]);

  useEffect(() => {
    const state = location.state as { openDispenseFocus?: boolean } | null;
    if (state?.openDispenseFocus) {
      setDispenseFocusOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!dispenseFocusOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') void requestCloseFocus();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [dispenseFocusOpen, requestCloseFocus]);

  const handleSyncData = useCallback(() => {
    void billableQuery.refetch();
    void backendBilling.refetch();
    void rxQuery.refetch();
    if (visitIdNum != null) {
      void queryClient.invalidateQueries({ queryKey: billingItemsKeys.detail(visitIdNum) });
    }
  }, [billableQuery, backendBilling, rxQuery, queryClient, visitIdNum]);

  const handleSyncDataAfterInventoryCreate = useCallback(() => {
    handleSyncData();
    showToast('success', 'Catalog updated — search again for the new item.', 5000);
  }, [handleSyncData, showToast]);

  const handleSaveDispense = useCallback(async () => {
    await handleSaveDraftToBill();
  }, [handleSaveDraftToBill]);

  if (!hasVisit || visitIdNum == null || patientIdNum == null) {
    return (
      <div
        className={cn(
          'rounded-xl border p-8 text-center',
          isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
        )}
      >
        <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>
          Select a patient from the queue to use dispensing.
        </p>
      </div>
    );
  }

  const panelBg = isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white';
  const subtle = isDark ? 'text-gray-400' : 'text-gray-600';
  const rxListMaxH = dispenseFocusOpen
    ? 'max-h-[min(85vh,calc(100vh-11rem))]'
    : 'max-h-[min(70vh,520px)]';

  if (!dispenseFocusOpen) {
    return (
      <div className="space-y-6">
       
        <div
          className={cn(
            'mx-auto max-w-lg rounded-2xl border px-8 py-10 text-center shadow-sm',
            isDark ? 'border-gray-700 bg-gray-900/80' : 'border-gray-200 bg-white'
          )}
        >
          <div
            className={cn(
              'mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl',
              isDark ? 'bg-blue-500/20' : 'bg-blue-50'
            )}
          >
            <Pill className={cn('h-8 w-8', isDark ? 'text-blue-400' : 'text-blue-600')} aria-hidden />
          </div>
          <h2 className={cn('text-xl font-semibold tracking-tight', isDark ? 'text-white' : 'text-gray-900')}>
            Dispense medication
          </h2>
          <p className={cn('mt-2 text-sm leading-relaxed', subtle)}>
            Charge-entry style workspace: add billable medication lines, then save once to the patient bill.
          </p>
          <button
            type="button"
            onClick={() => setDispenseFocusOpen(true)}
            className={cn(
              'mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-md transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto',
              isDark
                ? 'bg-blue-600 hover:bg-blue-500 focus:ring-offset-gray-950'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-offset-white'
            )}
          >
            <Maximize2 className="h-4 w-4 shrink-0" aria-hidden />
            Dispense medication
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn('fixed inset-0 z-50 flex flex-col', isDark ? 'bg-gray-950' : 'bg-gray-100')}
        role="dialog"
        aria-modal="true"
        aria-label="Dispense medication workspace"
      >
        <header
          className={cn(
            'flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-5',
            isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div
              className={cn(
                'hidden md:flex items-center gap-2 rounded-md border px-2 py-1',
                isDark ? 'border-gray-700 bg-gray-800/70' : 'border-gray-200 bg-white'
              )}
            >
              <LogoImage size="sm" />
              <BrandName />
              <Pill className="h-4 w-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <h2 className={cn('truncate text-lg font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                Dispense medication
              </h2>
              <p className={cn('hidden text-xs sm:block', subtle)}>
                Same charge entry flow · Save posts new lines to the bill
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void requestCloseFocus()}
            className={cn(
              'inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border',
              isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            )}
            aria-label="Close dispensing workspace"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="mx-auto max-w-[1760px] space-y-5 lg:space-y-6">
            {prescriptionAllergyConflicts.length > 0 && !prescriptionConflictBannerHidden && (
              <div
                className={cn(
                  'flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm',
                  isDark
                    ? 'border-red-900/50 bg-red-950/40 text-red-50'
                    : 'border-red-200 bg-red-50 text-red-950'
                )}
              >
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">Prescription vs allergy</div>
                  <p className="mt-1 text-xs opacity-95">
                    These prescribed medications align with a documented allergen. Do not add them to the bill unless
                    the prescriber has resolved the conflict. Search/add for these drugs remains blocked.
                  </p>
                  <ul className="mt-2 list-inside list-disc text-xs font-medium">
                    {prescriptionAllergyConflicts.map((c, i) => (
                      <li key={`${c.medication}-${c.allergen}-${i}`}>
                        <span className="font-semibold">{c.medication}</span>
                        {' → '}
                        allergy: {c.allergen}
                        {c.severity ? ` (${c.severity})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!visitIdStr) return;
                    setBannerHiddenByVisitId((prev) => ({
                      ...prev,
                      [visitIdStr]: {
                        ...prev[visitIdStr],
                        prescriptionConflict: true,
                      },
                    }));
                  }}
                  className={cn(
                    '-m-1 shrink-0 rounded-md p-1.5 transition-colors',
                    isDark ? 'text-red-200 hover:bg-red-950/60' : 'text-red-800 hover:bg-red-100/80'
                  )}
                  aria-label="Hide this notice for now"
                  title="Hide for now"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </div>
            )}

            {allergyRows.length > 0 &&
              prescriptionAllergyConflicts.length === 0 &&
              !knownAllergiesBannerHidden && (
                <div
                  className={cn(
                    'flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm',
                    isDark
                      ? 'border-amber-800/60 bg-amber-950/35 text-amber-50'
                      : 'border-amber-200 bg-amber-50 text-amber-950'
                  )}
                >
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">Known allergies on file</div>
                    <p className="mt-1 text-xs opacity-95">
                      No current prescription line matched these allergens. Adding a conflicting medication from search
                      is still blocked.
                    </p>
                    <ul className="mt-1 list-inside list-disc text-xs opacity-95">
                      {allergyRows.map((a, i) => (
                        <li key={`${a.allergen}-${a.severity}-${i}`}>
                          {a.allergen}
                          {a.severity ? ` · ${a.severity}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!visitIdStr) return;
                      setBannerHiddenByVisitId((prev) => ({
                        ...prev,
                        [visitIdStr]: {
                          ...prev[visitIdStr],
                          knownAllergies: true,
                        },
                      }));
                    }}
                    className={cn(
                      '-m-1 shrink-0 rounded-md p-1.5 transition-colors',
                      isDark ? 'text-amber-200 hover:bg-amber-950/50' : 'text-amber-900 hover:bg-amber-100/80'
                    )}
                    aria-label="Hide this notice for now"
                    title="Hide for now"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              )}

            {isReadOnly && (
              <div
                className={cn(
                  'flex items-start gap-2 rounded-lg border px-3 py-2 text-sm',
                  isDark
                    ? 'border-amber-800/60 bg-amber-950/40 text-amber-100'
                    : 'border-amber-200 bg-amber-50 text-amber-900'
                )}
              >
                <LockNotice isDark={isDark} />
                Billing settled — view only.
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
              {/* Rx alignment */}
              <section className={cn('lg:col-span-3 min-h-0 rounded-xl border p-4 lg:p-5', panelBg)}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Pill className={cn('h-5 w-5', isDark ? 'text-emerald-400' : 'text-emerald-600')} />
                    <h3 className={cn('font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
                      Prescribed vs bill
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleImportRxHighlight}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium',
                        isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'
                      )}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Refresh Rx
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleImportFromPrescription()}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium',
                        importPulse
                          ? 'bg-emerald-600 text-white'
                          : isDark
                            ? 'bg-emerald-700/70 text-emerald-100 hover:bg-emerald-700'
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      )}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Import Rx
                    </button>
                  </div>
                </div>
                <p className={cn('mb-4 text-xs', subtle)}>
                  Compare orders to what is on the bill (including unsaved lines in the list).
                </p>
                {rxDetailLoading && (
                  <p className={cn('mb-3 text-xs', subtle)}>Loading prescription lines…</p>
                )}
                {prescriptionLines.length === 0 ? (
                  <div className={cn('rounded-lg border border-dashed p-6 text-center text-sm', subtle)}>
                    No prescription lines for this visit.
                  </div>
                ) : (
                  <ul className={cn(rxListMaxH, 'space-y-2 overflow-y-auto pr-1')}>
                    {prescriptionLines.map(({ rx, item }) => {
                      const billed = countBilledUnitsForMed(item.medication_name, chargedRows);
                      const prescribedQty = item.dosage_quantity ?? 1;
                      const aligned = billed >= prescribedQty;
                      return (
                        <li
                          key={`${rx.id}-${item.id}`}
                          className={cn(
                            'rounded-lg border px-3 py-2 text-sm',
                            aligned
                              ? isDark
                                ? 'border-emerald-800/50 bg-emerald-950/30'
                                : 'border-emerald-200 bg-emerald-50/80'
                              : isDark
                                ? 'border-gray-700 bg-gray-800/40'
                                : 'border-gray-200 bg-gray-50'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-medium">{item.medication_name}</div>
                              <div className={cn('text-xs', subtle)}>
                                Rx #{rx.prescription_number} · Qty {prescribedQty} {item.dosage_unit ?? ''}
                              </div>
                            </div>
                            <span
                              className={cn(
                                'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                                aligned
                                  ? isDark
                                    ? 'bg-emerald-900/50 text-emerald-200'
                                    : 'bg-emerald-100 text-emerald-800'
                                  : isDark
                                    ? 'bg-amber-900/40 text-amber-200'
                                    : 'bg-amber-100 text-amber-900'
                              )}
                            >
                              {aligned ? 'Aligned' : 'Not fully on bill'}
                            </span>
                          </div>
                          <div className={cn('mt-1 text-xs', subtle)}>
                            Units on charges: <strong>{billed}</strong>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* Charge entry cluster */}
              <div className="lg:col-span-9 flex min-h-0 flex-col">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-7">
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="lg:col-span-8 flex min-h-0 flex-col"
                    ref={containerRef}
                  >
                    <div className="mb-4 space-y-2.5">
                      <AnimatePresence>
                        {isReadOnly && (
                          <motion.div
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex w-fit items-center gap-2 rounded-full border border-blue-400 bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow"
                          >
                            <Lock className="h-3.5 w-3.5" />
                            Settled — view only
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <AnimatePresence>
                        {isAdjustingPersistedItem && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex w-fit items-center gap-2 rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Updating saved line…
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div
                      className={`sticky top-0 z-30 mb-4 rounded-xl px-2 py-2 ${colors.bg.primary} transition-all duration-200 ${
                        isSearchSticky ? 'bg-opacity-95 shadow-sm backdrop-blur-sm' : ''
                      }`}
                    >
                      <SearchBar
                        searchTerm={searchTerm}
                        searchResults={catalogSearchResults}
                        showSearchResults={showSearchResults}
                        isLoading={billableQuery.isLoading}
                        isError={billableQuery.isError}
                        isReadOnly={isReadOnly}
                        isSearchFocused={isSearchFocused}
                        theme={theme}
                        colors={colors}
                        itemsFullData={billableQuery.data?.data?.items_full}
                        error={billableQuery.error}
                        onSearchChange={handleSearchChange}
                        onSearchFocus={handleSearchFocus}
                        onSearchBlur={handleSearchBlur}
                        onAddItem={handleAddItemFromSearch}
                        onClearSearch={handleClearSearch}
                        searchWrapRef={searchWrapRef as React.RefObject<HTMLDivElement>}
                        inputRef={inputRef as React.RefObject<HTMLInputElement>}
                        noResultsFooter={
                          !isReadOnly && searchTerm.trim().length > 0 ? (
                            <CreateInventoryItemButton
                              theme={theme}
                              disabled={billableQuery.isLoading}
                              onClick={() => setInventoryDrawerOpen(true)}
                            />
                          ) : undefined
                        }
                      />
                    </div>

                    <ChargeItemsList
                      chargeItems={renderableChargeItems}
                      subtotal={displayedSubtotal}
                      isReadOnly={isReadOnly}
                      isSearchSticky={isSearchSticky}
                      theme={theme}
                      colors={colors}
                      itemsFullData={billableQuery.data?.data?.items_full}
                      onClearAll={handleClearAllDrafts}
                      onIncrease={handleIncreaseAction}
                      onDecrease={handleDecreaseAction}
                      onRemove={handleRemoveAction}
                      onQuantityChange={handleQtyChange}
                      onQuantityBlur={handleQtyBlur}
                      onViewHistory={handleViewHistory}
                    />
                  </motion.div>

                  {/* Summary / save */}
                  <div className="lg:col-span-4 min-h-0 lg:sticky lg:top-4 self-start">
                    <div
                      className={cn(
                        'space-y-5 rounded-xl border p-4 sm:p-5 lg:p-6',
                        colors.border.primary,
                        colors.bg.secondary
                      )}
                    >
                      <h3 className={cn('text-base font-bold', colors.text.primary)}>Dispense summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className={colors.text.secondary}>Session subtotal</span>
                          <span className="font-extrabold text-transparent bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text">
                            {formatCurrency(displayedSubtotal)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={colors.text.secondary}>Existing on bill</span>
                          <span className="font-semibold text-amber-600 dark:text-amber-300">
                            {formatCurrency(displayBillingData.persistedBalance)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={colors.text.secondary}>New (draft) lines</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-300">
                            {formatCurrency(displayBillingData.draftGrandTotal)}
                          </span>
                        </div>
                      </div>
                      <p className={cn('text-xs', colors.text.secondary)}>
                        Add medications from search — same as charge entry. Adjust saved lines via the audited dialog.
                        Click save when finished to post <strong>new</strong> lines to the patient bill.
                      </p>
                      <button
                        type="button"
                        disabled={isReadOnly || !hasSaveableDraftLine || isSavingToBill}
                        title={
                          !isReadOnly && draftChargeItems.length > 0 && !hasSaveableDraftLine
                            ? 'Only allergy-flagged lines are in new items — add a safe medication or remove allergy lines.'
                            : undefined
                        }
                        onClick={() => void handleSaveDispense()}
                        className={cn(
                          'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all',
                          isReadOnly || !hasSaveableDraftLine || isSavingToBill
                            ? 'cursor-not-allowed bg-gray-400 text-gray-200'
                            : 'cursor-pointer bg-blue-600 text-white hover:bg-blue-700'
                        )}
                      >
                        Save to patient bill
                      </button>
                      {draftLinesMatchingAllergy.length > 0 && (
                        <p className={cn('text-xs text-amber-700 dark:text-amber-300')}>
                          Allergy-flagged new lines are not posted — save sends everything else to the bill. Remove those
                          lines manually when finished.
                        </p>
                      )}
                      <div
                        className={cn(
                          'flex items-start gap-2 rounded-lg border p-3 text-xs',
                          colors.border.subtle,
                          colors.bg.primary
                        )}
                      >
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        <span className={colors.text.secondary}>
                          Inventory items must exist in the billable catalog. If search finds nothing, create an item
                          — the catalog refreshes when the drawer completes.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PersistedBillingAdjustmentModal
        open={adjustmentDialogOpen}
        theme={theme}
        item={pendingAdjustment?.item ?? null}
        newQuantity={adjustmentNewQuantity}
        reason={adjustmentReason}
        isSubmitting={isAdjustingPersistedItem}
        onClose={closeAdjustmentDialog}
        onNewQuantityChange={setAdjustmentNewQuantity}
        onReasonChange={setAdjustmentReason}
        onSubmit={() => void handleAdjustmentDialogSubmit()}
      />

      <LineItemHistoryModal
        open={historyModalOpen}
        onClose={handleCloseHistoryModal}
        theme={theme}
        itemName={selectedHistoryItem?.service.name}
        logs={selectedHistoryItem?.audit_logs || []}
      />

      <PharmacyInventoryCreateDrawer
        theme={theme}
        open={inventoryDrawerOpen}
        onClose={() => setInventoryDrawerOpen(false)}
        initialItemName={searchTerm}
        onSuccess={handleSyncDataAfterInventoryCreate}
      />
    </>
  );
};

function LockNotice({ isDark }: { isDark: boolean }) {
  return (
    <span
      className={cn(
        'mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded',
        isDark ? 'bg-amber-500/25 text-amber-200' : 'bg-amber-500/15 text-amber-900'
      )}
    >
      <Lock className="h-3 w-3" aria-hidden />
    </span>
  );
}

export default PharmacyDispenseMedication;
