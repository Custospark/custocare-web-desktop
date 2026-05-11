import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  BedDouble,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  PlusCircle,
  RefreshCw,
  Search,
  UserPlus,
} from 'lucide-react';

import { useAppDispatch, useAppSelector } from '../../../../app/store/hooks/useApp';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';
import { selectActiveVisitUuid, updateActiveVisitPhase } from '../../../../app/store/slices/visitSlice';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import { useConfirm } from '../../../../shared/components/Feedback/ConfirmDialog/ConfirmContext';
import type { Visit } from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';
import { VisitPhase } from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';
import {
  useAssignWardBed,
  useCreateWardBed,
  useReleaseWardBed,
  useUpdateWardBed,
  useWardBeds,
  useWardBedOptions,
  nursingWardBedKeys,
} from '../../api/ward-bed/wardBedQueries';
import WardFormDrawer from '../../../administration/admin-module/ui/clinical-space/ward-components/WardFormDrawer';
import BedActionPanel from './components/BedActionPanel';
import BedBoardGrid from './components/BedBoardGrid';
import WardBedPickerModalHeader from './components/WardBedPickerModalHeader';
import { useNursingWardFormDrawer } from './ward-drawer/useNursingWardFormDrawer';
import { cn } from '../../../../shared/utils/classNameUtils';
import { getNursingEncounterChrome } from './nursingEncounterChrome';

interface Props {
  theme: 'light' | 'dark';
}

const WARD_PAGE_SIZE_OPTIONS = [6, 12, 24, 48] as const;
const MANAGE_BED_PAGE_OPTIONS = [8, 16, 32, 64] as const;
const MODAL_BED_PAGE_OPTIONS = [12, 24, 36, 48] as const;

function PaginationBar({
  isDark,
  idPrefix,
  rangeStart,
  rangeEnd,
  totalItems,
  page,
  totalPages,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: {
  isDark: boolean;
  idPrefix: string;
  rangeStart: number;
  rangeEnd: number;
  totalItems: number;
  page: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;
}) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between ${
        isDark ? 'border-slate-600/90 bg-slate-950/75' : 'border-slate-200 bg-slate-50'
      }`}
    >
      <span className={`tabular-nums ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
        {totalItems === 0 ? (
          'No results'
        ) : (
          <>
            Showing <span className="font-medium text-inherit">{rangeStart}</span>–
            <span className="font-medium text-inherit">{rangeEnd}</span> of{' '}
            <span className="font-medium text-inherit">{totalItems}</span>
          </>
        )}
      </span>
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <label htmlFor={`${idPrefix}-page-size`} className={isDark ? 'text-slate-400' : 'text-slate-600'}>
          Per page
        </label>
        <select
          id={`${idPrefix}-page-size`}
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className={`cursor-pointer rounded-md border px-2 py-1 text-xs ${
            isDark
              ? 'border-slate-600 bg-slate-950 text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30'
              : 'border-slate-300 bg-white text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25'
          }`}
        >
          {pageSizeOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous page"
            disabled={page <= 1 || totalItems === 0}
            onClick={() => onPageChange(page - 1)}
            className={`cursor-pointer rounded-md border p-1 disabled:cursor-not-allowed disabled:opacity-40 ${
              isDark
                ? 'border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-slate-50'
                : 'border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className={`min-w-[4.5rem] text-center tabular-nums ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {totalItems === 0 ? '—' : `${page} / ${totalPages}`}
          </span>
          <button
            type="button"
            aria-label="Next page"
            disabled={page >= totalPages || totalItems === 0}
            onClick={() => onPageChange(page + 1)}
            className={`cursor-pointer rounded-md border p-1 disabled:cursor-not-allowed disabled:opacity-40 ${
              isDark
                ? 'border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-slate-50'
                : 'border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

const NursingWardBedManagement: React.FC<Props> = ({ theme }) => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const facilityId = useAppSelector(getActiveFacilityId);
  const visitUuid = useAppSelector(selectActiveVisitUuid);
  const isDark = theme === 'dark';
  const chrome = getNursingEncounterChrome(theme);

  const [selectedWardId, setSelectedWardId] = useState<number | null>(null);
  const [selectedBedId, setSelectedBedId] = useState<number | null>(null);
  const [admissionAction, setAdmissionAction] = useState<'admit' | 'assign_bed'>('assign_bed');
  const [selectedBedAction, setSelectedBedAction] = useState<'assign' | 'transfer' | 'mark_available' | 'mark_maintenance'>('assign');
  const [transferReason, setTransferReason] = useState('');
  const [newBedLabel, setNewBedLabel] = useState('');
  const [newRoomLabel, setNewRoomLabel] = useState('');
  const [editingBedId, setEditingBedId] = useState<number | null>(null);
  const [editingBedLabel, setEditingBedLabel] = useState('');
  const [editingRoomLabel, setEditingRoomLabel] = useState('');
  const [bedSearch, setBedSearch] = useState('');
  const [wardSearch, setWardSearch] = useState('');
  const [wardPage, setWardPage] = useState(1);
  const [wardPageSize, setWardPageSize] = useState<number>(WARD_PAGE_SIZE_OPTIONS[0]);
  const [manageBedSearch, setManageBedSearch] = useState('');
  const [manageBedPage, setManageBedPage] = useState(1);
  const [manageBedPageSize, setManageBedPageSize] = useState<number>(MANAGE_BED_PAGE_OPTIONS[0]);
  const [bedBoardPage, setBedBoardPage] = useState(1);
  const [bedBoardPageSize, setBedBoardPageSize] = useState<number>(MODAL_BED_PAGE_OPTIONS[1]);
  const [transferWardId, setTransferWardId] = useState<number | null>(null);
  const [transferRoomLabel, setTransferRoomLabel] = useState<string>('');
  const [transferBedId, setTransferBedId] = useState<number | null>(null);
  const [bedPickerOpen, setBedPickerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === 'object' && error !== null) {
      const maybeResponse = error as { response?: { data?: { message?: string } } };
      return maybeResponse.response?.data?.message || fallback;
    }
    return fallback;
  };

  const optionsQuery = useWardBedOptions(visitUuid);
  const assignMutation = useAssignWardBed();
  const releaseMutation = useReleaseWardBed();
  const createBedMutation = useCreateWardBed();
  const updateBedMutation = useUpdateWardBed();
  const wardFormDrawer = useNursingWardFormDrawer({ facilityId, theme, activeVisitUuid: visitUuid });

  useEffect(() => {
    if (!optionsQuery.data) return;
    const wards = optionsQuery.data.wards;
    const current = optionsQuery.data.current_location;
    let nextWardId = current.ward_id;
    if (wards.length === 0) {
      nextWardId = null;
    } else if (nextWardId != null && !wards.some((w) => w.id === nextWardId)) {
      nextWardId = wards[0]?.id ?? null;
    }
    setSelectedWardId(nextWardId);
    setSelectedBedId(current.bed_id);
    setAdmissionAction(current.admission_action === 'admit' ? 'admit' : 'assign_bed');
  }, [optionsQuery.data]);

  const wardBedsQuery = useWardBeds(selectedWardId, facilityId);
  const refetchWardBedsSafely = async () => {
    if (!selectedWardId || !facilityId) return;
    await wardBedsQuery.refetch();
  };

  const selectedWard = useMemo(
    () => optionsQuery.data?.wards.find((w) => w.id === selectedWardId) ?? null,
    [optionsQuery.data, selectedWardId]
  );
  const currentLocation = optionsQuery.data?.current_location;
  const placementWardMeta = useMemo(
    () => (optionsQuery.data?.wards ?? []).find((w) => w.id === currentLocation?.ward_id) ?? null,
    [optionsQuery.data?.wards, currentLocation?.ward_id]
  );
  const currentAssignedBedId = optionsQuery.data?.current_location?.bed_id ?? null;
  const currentAssignedWardId = optionsQuery.data?.current_location?.ward_id ?? null;

  const hasBedAssignment = !!(currentAssignedWardId && currentAssignedBedId);

  const formatPlacementTime = (iso?: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString();
  };

  const filteredWardsForGrid = useMemo(() => {
    const wards = optionsQuery.data?.wards ?? [];
    const q = wardSearch.trim().toLowerCase();
    if (!q) return wards;
    return wards.filter((w) => {
      const blob = [w.name, w.code ?? '', w.building ?? '', w.floor ?? '', w.ward_type ?? ''].join(' ').toLowerCase();
      return blob.includes(q);
    });
  }, [optionsQuery.data?.wards, wardSearch]);

  const wardPaging = useMemo(() => {
    const total = filteredWardsForGrid.length;
    const totalPages = Math.max(1, Math.ceil(total / wardPageSize));
    const page = Math.min(Math.max(1, wardPage), totalPages);
    const start = (page - 1) * wardPageSize;
    return {
      slice: filteredWardsForGrid.slice(start, start + wardPageSize),
      total,
      totalPages,
      page,
      rangeStart: total ? start + 1 : 0,
      rangeEnd: Math.min(start + wardPageSize, total),
    };
  }, [filteredWardsForGrid, wardPage, wardPageSize]);

  const filteredManageBeds = useMemo(() => {
    const beds = wardBedsQuery.data ?? [];
    const q = manageBedSearch.trim().toLowerCase();
    if (!q) return beds;
    return beds.filter((b) => {
      const label = b.bed_label.toLowerCase();
      const room = (b.room_label ?? '').toLowerCase();
      return label.includes(q) || room.includes(q);
    });
  }, [wardBedsQuery.data, manageBedSearch]);

  const manageBedsPaging = useMemo(() => {
    const total = filteredManageBeds.length;
    const totalPages = Math.max(1, Math.ceil(total / manageBedPageSize));
    const page = Math.min(Math.max(1, manageBedPage), totalPages);
    const start = (page - 1) * manageBedPageSize;
    return {
      slice: filteredManageBeds.slice(start, start + manageBedPageSize),
      total,
      totalPages,
      page,
      rangeStart: total ? start + 1 : 0,
      rangeEnd: Math.min(start + manageBedPageSize, total),
    };
  }, [filteredManageBeds, manageBedPage, manageBedPageSize]);

  useEffect(() => {
    setWardPage(1);
  }, [wardSearch]);

  useEffect(() => {
    setWardPage((p) => {
      const tp = Math.max(1, Math.ceil(filteredWardsForGrid.length / wardPageSize));
      return Math.min(p, tp);
    });
  }, [filteredWardsForGrid.length, wardPageSize]);

  useEffect(() => {
    setManageBedPage(1);
  }, [selectedWardId, manageBedSearch]);

  useEffect(() => {
    setManageBedPage((p) => {
      const tp = Math.max(1, Math.ceil(filteredManageBeds.length / manageBedPageSize));
      return Math.min(p, tp);
    });
  }, [filteredManageBeds.length, manageBedPageSize]);

  const occupiedBedIds = useMemo(() => {
    const ids = new Set<number>();
    (selectedWard?.occupied_bed_labels ?? []).forEach((bed) => {
      if (bed.id) ids.add(bed.id);
    });
    return ids;
  }, [selectedWard]);

  const occupiedBedMetaById = useMemo(() => {
    const map = new Map<number, { patient_name?: string | null; patient_uuid?: string | null; occupied_at?: string | null; visit_uuid?: string }>();
    (selectedWard?.occupied_bed_labels ?? []).forEach((bed) => {
      if (!bed.id) return;
      map.set(bed.id, {
        patient_name: bed.patient_name ?? null,
        patient_uuid: bed.patient_uuid ?? null,
        occupied_at: bed.occupied_at ?? null,
        visit_uuid: bed.visit_uuid,
      });
    });
    return map;
  }, [selectedWard]);

  const formatOccupiedAt = (iso?: string | null) => {
    if (!iso) return 'Occupied';
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return 'Occupied';
    return `Occupied ${dt.toLocaleString()}`;
  };

  const modalBedsFiltered = useMemo(() => {
    const search = bedSearch.trim().toLowerCase();
    const beds = wardBedsQuery.data ?? [];
    if (!search) return beds;
    return beds.filter((b) => {
      const label = b.bed_label.toLowerCase();
      const room = (b.room_label ?? '').toLowerCase();
      return label.includes(search) || room.includes(search);
    });
  }, [wardBedsQuery.data, bedSearch]);

  const modalBedsPaging = useMemo(() => {
    const total = modalBedsFiltered.length;
    const totalPages = Math.max(1, Math.ceil(total / bedBoardPageSize));
    const page = Math.min(Math.max(1, bedBoardPage), totalPages);
    const start = (page - 1) * bedBoardPageSize;
    return {
      slice: modalBedsFiltered.slice(start, start + bedBoardPageSize),
      total,
      totalPages,
      page,
      rangeStart: total ? start + 1 : 0,
      rangeEnd: Math.min(start + bedBoardPageSize, total),
    };
  }, [modalBedsFiltered, bedBoardPage, bedBoardPageSize]);

  useEffect(() => {
    setBedBoardPage((p) => {
      const tp = Math.max(1, Math.ceil(modalBedsFiltered.length / bedBoardPageSize));
      return Math.min(p, tp);
    });
  }, [modalBedsFiltered.length, bedBoardPageSize]);

  useEffect(() => {
    setBedBoardPage(1);
  }, [bedSearch, selectedWardId]);

  const selectedBed = useMemo(
    () => (wardBedsQuery.data ?? []).find((bed) => bed.id === selectedBedId) ?? null,
    [wardBedsQuery.data, selectedBedId]
  );
  const selectedBedIsOccupied = selectedBed ? occupiedBedIds.has(selectedBed.id) || selectedBed.status === 'occupied' : false;
  /** Prefer server current_location bed id — visit_uuid from options can be stale or missing vs active visit UUID. */
  const canReleaseSelectedBed =
    !!selectedBedId &&
    !!currentAssignedBedId &&
    selectedBedId === currentAssignedBedId &&
    selectedBedIsOccupied;
  const occupiedByAnotherPatient =
    !!selectedBedId && selectedBedIsOccupied && !canReleaseSelectedBed;
  /** Visit UUID that occupies the selected bed (from ward-bed-options); used to call the correct release API */
  const occupyingVisitUuidOnSelectedBed =
    selectedBedId && occupiedByAnotherPatient ? occupiedBedMetaById.get(selectedBedId)?.visit_uuid : undefined;
  const selectedBedIsMaintenance = selectedBed?.status === 'maintenance';
  const selectedBedIsInactive = selectedBed?.status === 'inactive';
  /** Own occupied bed → Transfer + Release. Other occupant (resolved visit) → Release occupant only. Free bed → Assign + maintenance. */
  const availableBedActions = useMemo(() => {
    if (!selectedBed) return [] as Array<'assign' | 'transfer' | 'mark_available' | 'mark_maintenance'>;
    if (selectedBedIsInactive) return [] as Array<'assign' | 'transfer' | 'mark_available' | 'mark_maintenance'>;

    if (canReleaseSelectedBed) {
      return ['transfer', 'mark_available'] as Array<'assign' | 'transfer' | 'mark_available' | 'mark_maintenance'>;
    }

    if (occupiedByAnotherPatient && occupyingVisitUuidOnSelectedBed) {
      return ['mark_available'] as Array<'assign' | 'transfer' | 'mark_available' | 'mark_maintenance'>;
    }

    if (occupiedByAnotherPatient) {
      return [] as Array<'assign' | 'transfer' | 'mark_available' | 'mark_maintenance'>;
    }

    if (selectedBedIsMaintenance) {
      return ['mark_available'] as Array<'assign' | 'transfer' | 'mark_available' | 'mark_maintenance'>;
    }

    if (currentAssignedBedId && selectedBed.id !== currentAssignedBedId) {
      return ['assign', 'mark_maintenance'] as Array<'assign' | 'transfer' | 'mark_available' | 'mark_maintenance'>;
    }

    return ['assign', 'mark_maintenance'] as Array<'assign' | 'transfer' | 'mark_available' | 'mark_maintenance'>;
  }, [
    selectedBed,
    selectedBedIsInactive,
    selectedBedIsMaintenance,
    currentAssignedBedId,
    canReleaseSelectedBed,
    occupiedByAnotherPatient,
    occupyingVisitUuidOnSelectedBed,
  ]);

  const transferWard = useMemo(
    () => (optionsQuery.data?.wards ?? []).find((ward) => ward.id === transferWardId) ?? null,
    [optionsQuery.data?.wards, transferWardId]
  );
  const transferRoomOptions = useMemo(() => {
    const rooms = new Set<string>();
    (transferWard?.available_bed_list ?? []).forEach((bed) => {
      if (bed.room_label) rooms.add(bed.room_label);
    });
    return Array.from(rooms).sort((a, b) => a.localeCompare(b));
  }, [transferWard]);
  const transferBedOptions = useMemo(() => {
    const beds = transferWard?.available_bed_list ?? [];
    if (!transferRoomLabel) return beds;
    return beds.filter((bed) => (bed.room_label ?? '') === transferRoomLabel);
  }, [transferWard, transferRoomLabel]);

  const transferDestinationBed = useMemo(() => {
    if (!transferWardId || !transferBedId) return null;
    const ward = optionsQuery.data?.wards.find((w) => w.id === transferWardId);
    return ward?.available_bed_list.find((b) => b.id === transferBedId) ?? null;
  }, [optionsQuery.data?.wards, transferWardId, transferBedId]);

  /** Mirrors server logic so explicit transfers satisfy ward/room/bed validation. */
  const derivedTransferLevel = useMemo((): 'ward' | 'room' | 'bed' => {
    const curWard = currentAssignedWardId ?? 0;
    const destWard = transferWardId ?? 0;
    const curRoom = (optionsQuery.data?.current_location?.room_label ?? '').trim();
    const nextRoom = (transferDestinationBed?.room_label ?? '').trim();
    if (!curWard || !destWard || !transferDestinationBed) return 'bed';
    if (curWard !== destWard) return 'ward';
    if (curRoom !== '' && nextRoom !== '' && curRoom !== nextRoom) return 'room';
    return 'bed';
  }, [
    currentAssignedWardId,
    transferWardId,
    transferDestinationBed,
    optionsQuery.data?.current_location?.room_label,
  ]);

  useEffect(() => {
    if (!selectedBedId) return;
    if (availableBedActions.length === 0) return;
    if (!availableBedActions.includes(selectedBedAction)) {
      setSelectedBedAction(availableBedActions[0]);
    }
  }, [selectedBedId, selectedBedAction, availableBedActions]);

  useEffect(() => {
    if (!selectedBedId || availableBedActions.length > 0) return;
    setSelectedBedAction('assign');
  }, [selectedBedId, availableBedActions.length]);

  useEffect(() => {
    if (!selectedWard) return;
    const stillValid = (wardBedsQuery.data ?? []).some((bed) => bed.id === selectedBedId);
    if (!stillValid) {
      setSelectedBedId(null);
    }
  }, [selectedWard, selectedBedId, wardBedsQuery.data]);

  useEffect(() => {
    if (selectedBedAction !== 'transfer') return;
    setTransferWardId(selectedWardId);
    const bed = (wardBedsQuery.data ?? []).find((b) => b.id === selectedBedId);
    setTransferRoomLabel(bed?.room_label ?? '');
    setTransferBedId(selectedBedId);
  }, [selectedBedAction, selectedWardId, selectedBedId, wardBedsQuery.data]);

  /** Modal "Assign patient" flow only admits or assigns/changes bed — never mirrors main-toolbar "Transfer". */
  const canSubmitModalAssign =
    !!visitUuid && !!selectedWardId && !!selectedBedId;

  const applyPhaseFromAssignedVisit = (visit: Visit | undefined) => {
    if (!visit?.current_phase) return;
    const phase = visit.current_phase;
    if (phase === VisitPhase.TRANSFERRED) {
      dispatch(updateActiveVisitPhase({ phase: VisitPhase.TRANSFERRED }));
    } else if (phase === VisitPhase.ADMITTED) {
      dispatch(updateActiveVisitPhase({ phase: VisitPhase.ADMITTED }));
    }
  };

  const handleAssign = async () => {
    if (!visitUuid || !selectedWardId || !selectedBedId) {
      showToast('error', 'Select ward and bed before saving assignment.', 4000);
      return;
    }
    const modalAssignAdmissionAction: 'admit' | 'assign_bed' =
      admissionAction === 'admit' ? 'admit' : 'assign_bed';
    try {
      const response = await assignMutation.mutateAsync({
        visitUuid,
        payload: {
          ward_id: selectedWardId,
          bed_id: selectedBedId,
          admission_action: modalAssignAdmissionAction,
        },
      });

      applyPhaseFromAssignedVisit(response.data);

      showToast('success', response.message || 'Ward and bed assignment saved.', 4000);
      await optionsQuery.refetch();
      await refetchWardBedsSafely();
    } catch (error: unknown) {
      showToast('error', getErrorMessage(error, 'Failed to save ward assignment.'), 5000);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await optionsQuery.refetch();
      await refetchWardBedsSafely();
      showToast('success', 'Latest ward and bed data loaded.', 2500);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateWard = () => {
    if (!facilityId) {
      showToast('error', 'Select an active facility before creating wards.', 4000);
      return;
    }
    wardFormDrawer.openCreateDrawer();
  };

  const handleCreateBedFromModal = () => {
    setBedPickerOpen(false);
    setTimeout(() => {
      const input = document.getElementById('new-bed-label-input') as HTMLInputElement | null;
      input?.focus();
    }, 0);
  };

  const handleCreateBed = async () => {
    if (!selectedWardId || !facilityId || !newBedLabel.trim()) return;
    try {
      await createBedMutation.mutateAsync({
        wardId: selectedWardId,
        facilityId,
        bedLabel: newBedLabel.trim(),
        roomLabel: newRoomLabel.trim() || undefined,
      });
      setNewBedLabel('');
      setNewRoomLabel('');
      await Promise.all([
        refetchWardBedsSafely(),
        optionsQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: nursingWardBedKeys.all }),
      ]);
      showToast('success', 'Bed created successfully.', 3000);
    } catch (error: unknown) {
      const msg = getErrorMessage(error, 'Failed to create bed.');
      showToast('error', msg.includes('Duplicate') ? 'Bed label already exists in this ward.' : msg, 5000);
    }
  };

  const handleUpdateBed = async () => {
    if (!editingBedId || !facilityId) return;
    try {
      await updateBedMutation.mutateAsync({
        bedId: editingBedId,
        facilityId,
        wardId: selectedWardId ?? undefined,
        bedLabel: editingBedLabel.trim() || undefined,
        roomLabel: editingRoomLabel.trim() || undefined,
      });
      setEditingBedId(null);
      setEditingBedLabel('');
      await Promise.all([
        refetchWardBedsSafely(),
        optionsQuery.refetch(),
      ]);
      showToast('success', 'Bed updated successfully.', 3000);
    } catch (error: unknown) {
      showToast('error', getErrorMessage(error, 'Failed to update bed.'), 5000);
    }
  };

  const executeSelectedBedAction = async (closeModal = false) => {
    if (!selectedBedId || !facilityId) return;
    if (!availableBedActions.includes(selectedBedAction)) {
      showToast('error', 'Selected action is not valid for this bed status.', 4000);
      return;
    }
    try {
      if (selectedBedAction === 'assign') {
        await handleAssign();
        if (closeModal) setBedPickerOpen(false);
        return;
      }

      if (selectedBedAction === 'transfer') {
        if (!visitUuid || !selectedWardId || !transferWardId || !transferBedId) return;
        const fromWard = optionsQuery.data?.current_location?.ward_name ?? 'Current Ward';
        const fromBed = optionsQuery.data?.current_location?.bed_label ?? 'Current Bed';
        const fromRoom = optionsQuery.data?.current_location?.room_label
          ? `Room ${optionsQuery.data.current_location.room_label}`
          : 'Unspecified Room';
        const destinationWard = (optionsQuery.data?.wards ?? []).find((w) => w.id === transferWardId) ?? selectedWard;
        const destinationBed = destinationWard?.available_bed_list.find((b) => b.id === transferBedId) ?? selectedBed;
        const toWard = destinationWard?.name ?? 'Selected Ward';
        const toRoom = destinationBed?.room_label ? `Room ${destinationBed.room_label}` : 'Unspecified Room';
        const toBed = destinationBed?.bed_label ?? 'Selected Bed';
        const approved = await confirm({
          title: 'Confirm Patient Transfer',
          message: `Transfer patient from ${fromWard} (${fromRoom} - ${fromBed}) to ${toWard} (${toRoom} - ${toBed})?`,
          confirmText: 'Confirm Transfer',
          cancelText: 'Cancel',
          variant: 'warning',
          theme,
        });
        if (!approved) {
          return;
        }
        const response = await assignMutation.mutateAsync({
          visitUuid,
          payload: {
            ward_id: transferWardId,
            bed_id: transferBedId,
            admission_action: 'transfer',
            transfer_reason: transferReason.trim() || 'Transfer confirmed via nursing bed board.',
            transfer_level: derivedTransferLevel,
          },
        });
        applyPhaseFromAssignedVisit(response.data);
        await optionsQuery.refetch();
        await refetchWardBedsSafely();
        const transferMsg = response.message || 'Patient transferred to selected bed.';
        showToast('success', transferMsg, 4000);
        if (closeModal) setBedPickerOpen(false);
        return;
      }

      if (selectedBedAction === 'mark_available' && selectedBedIsOccupied) {
        if (canReleaseSelectedBed) {
          if (!visitUuid || !currentAssignedBedId) {
            showToast('error', 'No ward/bed assignment to release for this visit.', 4000);
            return;
          }
          const releaseResponse = await releaseMutation.mutateAsync({
            visitUuid,
            bedId: currentAssignedBedId,
          });
          await optionsQuery.refetch();
          await refetchWardBedsSafely();
          showToast('success', releaseResponse.message || 'Room/bed released successfully.', 3000);
          if (closeModal) setBedPickerOpen(false);
          return;
        }

        if (occupiedByAnotherPatient && selectedBedId) {
          const targetVisitUuid = occupyingVisitUuidOnSelectedBed;
          if (!targetVisitUuid) {
            showToast(
              'error',
              'Cannot resolve which visit occupies this bed. Refresh ward data and try again.',
              5000
            );
            return;
          }
          const releaseResponse = await releaseMutation.mutateAsync({
            visitUuid: targetVisitUuid,
            bedId: selectedBedId,
          });
          await optionsQuery.refetch();
          await refetchWardBedsSafely();
          showToast('success', releaseResponse.message || 'Occupant released from bed successfully.', 3000);
          if (closeModal) setBedPickerOpen(false);
          return;
        }

        showToast('error', 'Cannot release this bed from the current selection.', 4000);
        return;
      }

      if (selectedBedAction === 'mark_available' || selectedBedAction === 'mark_maintenance') {
        await updateBedMutation.mutateAsync({
          bedId: selectedBedId,
          facilityId,
          status: selectedBedAction === 'mark_available' ? 'available' : 'maintenance',
        });
        await optionsQuery.refetch();
        await refetchWardBedsSafely();
        showToast('success', 'Bed status updated successfully.', 3000);
        if (closeModal) setBedPickerOpen(false);
        return;
      }
    } catch (error: unknown) {
      showToast('error', getErrorMessage(error, 'Failed to complete selected bed action.'), 5000);
    }
  };

  if (!visitUuid) {
    return (
      <div className={chrome.emptyPanel}>
        <p className={cn(chrome.body, 'leading-relaxed')}>Select a patient from nursing queue first to assign ward and bed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h3 className={cn('text-lg font-semibold tracking-tight', chrome.heading)}>Ward & Bed Assignment</h3>
          <p className={cn('text-sm leading-relaxed', chrome.subhead)}>
            {hasBedAssignment
              ? 'Open a ward, then use Transfer on the bed board to move to another ward/bed.'
              : 'Choose Admit or Assign, select a ward, then confirm on the bed board.'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={cn(chrome.btnSecondary, 'shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60')}
        >
          <RefreshCw className={cn('h-4 w-4 shrink-0', isRefreshing ? 'animate-spin' : '')} aria-hidden />
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <label className={cn('mb-2 block text-sm font-semibold', chrome.body)}>Action</label>
          <div className="flex flex-wrap gap-2 items-center">
            {hasBedAssignment ? (
              <div
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm ${
                  isDark
                    ? 'border-blue-500/80 bg-blue-950/50 text-blue-100'
                    : 'border-blue-200 bg-blue-50 text-blue-900'
                }`}
                role="status"
              >
                <ArrowLeftRight className="w-4 h-4 shrink-0" aria-hidden />
                <span className="font-medium">Transfer</span>
                <span className={`text-xs font-normal ${isDark ? 'text-blue-200/90' : 'text-blue-800'}`}>
                  Open a ward, then select Transfer on the bed board.
                </span>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setAdmissionAction('admit')}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition cursor-pointer ${
                    admissionAction === 'admit'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : isDark
                        ? 'border-slate-600 text-slate-100 hover:bg-slate-800'
                        : 'border-slate-300 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <UserPlus className="w-4 h-4 shrink-0" aria-hidden />
                  Admit
                </button>
                <button
                  type="button"
                  onClick={() => setAdmissionAction('assign_bed')}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm transition cursor-pointer ${
                    admissionAction === 'assign_bed'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : isDark
                        ? 'border-slate-600 text-slate-100 hover:bg-slate-800'
                        : 'border-slate-300 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <BedDouble className="w-4 h-4 shrink-0" aria-hidden />
                  Assign / Change bed
                </button>
              </>
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className={cn('text-sm font-semibold', chrome.body)}>Select Ward</label>
            <button
              onClick={handleCreateWard}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 cursor-pointer text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Create Ward
            </button>
          </div>
          <div
            className={`mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 ${
              isDark ? 'border-slate-600/90 bg-slate-950/60' : 'border-slate-200 bg-white'
            }`}
          >
            <Search className={`h-4 w-4 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} aria-hidden />
            <input
              value={wardSearch}
              onChange={(e) => setWardSearch(e.target.value)}
              placeholder="Search wards by name, code, building, or floor…"
              className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${
                isDark ? 'text-slate-100 placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'
              }`}
              aria-label="Search wards"
            />
          </div>
          <PaginationBar
            isDark={isDark}
            idPrefix="ward-grid"
            rangeStart={wardPaging.rangeStart}
            rangeEnd={wardPaging.rangeEnd}
            totalItems={wardPaging.total}
            page={wardPaging.page}
            totalPages={wardPaging.totalPages}
            pageSize={wardPageSize}
            pageSizeOptions={WARD_PAGE_SIZE_OPTIONS}
            onPageChange={setWardPage}
            onPageSizeChange={setWardPageSize}
          />
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {optionsQuery.isLoading
              ? Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={`ward-skeleton-${idx}`}
                  className={`h-20 animate-pulse rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-100'}`}
                />
              ))
              : wardPaging.total === 0 ? (
                <div
                  className={`col-span-full rounded-xl border px-4 py-8 text-center text-sm leading-relaxed ${
                    isDark ? 'border-slate-600 text-slate-400' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  No wards match your search. Adjust the filter or clear the search field.
                </div>
              ) : (
                wardPaging.slice.map((ward) => {
                  const active = selectedWardId === ward.id;
                  return (
                    <button
                      key={ward.id}
                      type="button"
                      onClick={() => {
                        setSelectedWardId(ward.id);
                        setBedSearch('');
                        setBedPickerOpen(true);
                      }}
                      className={`cursor-pointer rounded-xl border p-3 text-left transition ${
                        active
                          ? isDark
                            ? 'border-sky-500 bg-sky-950/40 ring-1 ring-sky-500/40'
                            : 'border-blue-500 bg-blue-50'
                          : isDark
                            ? 'border-slate-600 hover:bg-slate-800/90'
                            : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className={cn('font-semibold', active && isDark ? 'text-slate-50' : active ? 'text-slate-900' : isDark ? 'text-slate-100' : 'text-slate-900')}>
                          {ward.name}
                        </div>
                        {active && (
                          <Check className={`h-4 w-4 shrink-0 ${isDark ? 'text-sky-400' : 'text-blue-600'}`} />
                        )}
                      </div>
                      <div className={cn('mt-1 text-xs', isDark ? 'text-slate-400' : 'text-slate-600')}>
                        {ward.available_beds} beds available
                        {(ward.building || ward.floor) && (
                          <span className="block truncate opacity-90">
                            {[ward.building, ward.floor].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
          </div>
        </div>
      </div>

      <div
        className={`rounded-xl border p-4 text-sm ${
          isDark ? 'border-slate-600/90 bg-slate-950/70' : 'border-slate-200 bg-slate-50/90'
        }`}
      >
        <div className={cn('mb-3 flex items-center gap-2 font-semibold', chrome.heading)}>
          <MapPin className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          Current Patient placement
        </div>
        {optionsQuery.isLoading ? (
          <div className={`h-24 animate-pulse rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
        ) : !hasBedAssignment ? (
          <p className={cn('leading-relaxed', chrome.subhead)}>
            No ward or bed is assigned to this visit yet. Select a ward and bed below to place this patient.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className={cn('text-xs font-semibold uppercase tracking-wide', chrome.muted)}>Patient</div>
              <div className={cn('mt-1 text-base font-semibold', chrome.rowTitle)}>{currentLocation?.patient_name?.trim() || '—'}</div>
              {currentLocation?.patient_uuid?.trim() ? (
                <div className={cn('mt-1 break-all font-mono text-xs', chrome.subhead)}>{currentLocation.patient_uuid}</div>
              ) : null}
            </div>
            <div>
              <div className={cn('text-xs font-semibold uppercase tracking-wide', chrome.muted)}>Ward</div>
              <div className={cn('mt-1 font-semibold', chrome.rowTitle)}>{currentLocation?.ward_name ?? '—'}</div>
              {(placementWardMeta?.building || placementWardMeta?.floor) && (
                <div className={cn('mt-1 text-xs', chrome.subhead)}>
                  {[placementWardMeta.building, placementWardMeta.floor].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <div className={cn('text-xs font-semibold uppercase tracking-wide', chrome.muted)}>Room & bed</div>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                {currentLocation?.room_label ? (
                  <span className={cn('font-semibold', chrome.rowTitle)}>Room {currentLocation.room_label}</span>
                ) : (
                  <span className={chrome.muted}>Room —</span>
                )}
                <span className={cn(isDark ? 'text-slate-600' : 'text-slate-300')} aria-hidden>
                  ·
                </span>
                {currentLocation?.bed_label ? (
                  <span className={cn('font-semibold', chrome.rowTitle)}>Bed {currentLocation.bed_label}</span>
                ) : (
                  <span className={chrome.muted}>Bed —</span>
                )}
              </div>
              <div className={cn('mt-2 inline-flex items-center gap-1.5 text-xs', chrome.subhead)}>
                <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden />
                <span>Updated {formatPlacementTime(currentLocation?.updated_at)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedWardId && (
        <div className={`rounded-xl border p-4 ${isDark ? 'border-slate-600/90 bg-slate-950/70' : 'border-slate-200 bg-slate-50/90'}`}>
          <div className={cn('mb-3 font-semibold', chrome.heading)}>Manage Beds in Ward</div>
          <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            <input
              value={newRoomLabel}
              onChange={(e) => setNewRoomLabel(e.target.value)}
              placeholder="Room (optional, e.g. R1)"
              className={`rounded-lg border px-3 py-2 text-sm ${
                isDark
                  ? 'border-slate-600 bg-slate-950 text-slate-100 placeholder:text-slate-500'
                  : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
              }`}
            />
            <input
              id="new-bed-label-input"
              value={newBedLabel}
              onChange={(e) => setNewBedLabel(e.target.value)}
              placeholder="New bed label (e.g. A-01)"
              className={`rounded-lg border px-3 py-2 text-sm ${
                isDark
                  ? 'border-slate-600 bg-slate-950 text-slate-100 placeholder:text-slate-500'
                  : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
              }`}
            />
          </div>
          <div className="mb-3">
            <button
              onClick={handleCreateBed}
              disabled={!newBedLabel.trim() || createBedMutation.isPending}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Add Bed
            </button>
          </div>
          <div
            className={`mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 ${
              isDark ? 'border-slate-600/90 bg-slate-950/60' : 'border-slate-200 bg-white'
            }`}
          >
            <Search className={`h-4 w-4 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} aria-hidden />
            <input
              value={manageBedSearch}
              onChange={(e) => setManageBedSearch(e.target.value)}
              placeholder="Search beds by label or room…"
              className={`min-w-0 flex-1 bg-transparent text-sm outline-none ${
                isDark ? 'text-slate-100 placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'
              }`}
              aria-label="Search beds in ward"
            />
          </div>
          <PaginationBar
            isDark={isDark}
            idPrefix="manage-beds"
            rangeStart={manageBedsPaging.rangeStart}
            rangeEnd={manageBedsPaging.rangeEnd}
            totalItems={manageBedsPaging.total}
            page={manageBedsPaging.page}
            totalPages={manageBedsPaging.totalPages}
            pageSize={manageBedPageSize}
            pageSizeOptions={MANAGE_BED_PAGE_OPTIONS}
            onPageChange={setManageBedPage}
            onPageSizeChange={setManageBedPageSize}
          />
          <div className="space-y-2 max-h-44 overflow-auto">
            {manageBedsPaging.total === 0 ? (
              <p className={cn('py-2 text-sm leading-relaxed', chrome.subhead)}>
                {(wardBedsQuery.data ?? []).length === 0
                  ? 'No beds defined for this ward yet. Add one above.'
                  : 'No beds match your search.'}
              </p>
            ) : (
              manageBedsPaging.slice.map((bed) => (
              <div key={bed.id} className="flex items-center gap-2">
                {editingBedId === bed.id ? (
                  <>
                    <input
                      aria-label="Edit bed label"
                      value={editingBedLabel}
                      onChange={(e) => setEditingBedLabel(e.target.value)}
                      className={`flex-1 rounded-lg border px-2 py-1 text-sm ${
                        isDark
                          ? 'border-slate-600 bg-slate-950 text-slate-100'
                          : 'border-slate-300 bg-white text-slate-900'
                      }`}
                    />
                    <input
                      aria-label="Edit room label"
                      value={editingRoomLabel}
                      onChange={(e) => setEditingRoomLabel(e.target.value)}
                      placeholder="Room"
                      className={`w-24 rounded-lg border px-2 py-1 text-sm ${
                        isDark
                          ? 'border-slate-600 bg-slate-950 text-slate-100 placeholder:text-slate-500'
                          : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleUpdateBed}
                      className="cursor-pointer rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingBedId(null)}
                      className={`cursor-pointer rounded border px-2 py-1 text-xs font-medium ${
                        isDark
                          ? 'border-slate-600 text-slate-200 hover:bg-slate-800'
                          : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className={cn('flex-1 text-sm font-medium', chrome.rowTitle)}>
                      {bed.room_label ? `Room ${bed.room_label} - ` : ''}
                      {bed.bed_label}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBedId(bed.id);
                        setEditingBedLabel(bed.bed_label);
                        setEditingRoomLabel(bed.room_label ?? '');
                      }}
                      className={`cursor-pointer rounded border px-2 py-1 text-xs font-medium ${
                        isDark
                          ? 'border-slate-600 text-slate-200 hover:bg-slate-800'
                          : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
              ))
            )}
          </div>
        </div>
      )}

      {bedPickerOpen && !!selectedWardId && (
        <div className="fixed inset-0 z-50">
          <button
            onClick={() => setBedPickerOpen(false)}
            className="absolute inset-0 bg-black/50 cursor-pointer"
            aria-label="Close bed picker"
          />
          <div
            className={`absolute left-1/2 top-1/2 w-[92vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-4 shadow-xl ${
              isDark
                ? 'border-slate-600 bg-slate-950 text-slate-100'
                : 'border-slate-200 bg-white text-slate-900 shadow-slate-200/50'
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Ward bed picker"
          >
            <WardBedPickerModalHeader
              wardName={selectedWard?.name ?? 'Ward'}
              isDark={isDark}
              onEditWard={() => {
                if (selectedWardId != null) wardFormDrawer.openEditDrawerForWardId(selectedWardId);
              }}
              onCloseModal={() => setBedPickerOpen(false)}
              editDisabled={!facilityId || selectedWardId == null}
            />
            <BedBoardGrid
              isDark={isDark}
              wardBedsLoading={wardBedsQuery.isLoading}
              filteredWardBeds={modalBedsPaging.slice}
              bedSearch={bedSearch}
              onBedSearchChange={setBedSearch}
              onCreateBed={handleCreateBedFromModal}
              selectedBedId={selectedBedId}
              selectedWardId={selectedWardId}
              currentAssignedBedId={currentAssignedBedId}
              currentAssignedWardId={currentAssignedWardId}
              currentPatientBed={
                optionsQuery.data?.current_location?.patient_name != null ||
                optionsQuery.data?.current_location?.patient_uuid
                  ? {
                      name: optionsQuery.data.current_location.patient_name ?? null,
                      patientNumber: optionsQuery.data.current_location.patient_uuid ?? '—',
                    }
                  : null
              }
              assignmentUpdatedAt={optionsQuery.data?.current_location?.updated_at ?? null}
              occupiedBedIds={occupiedBedIds}
              occupiedBedMetaById={occupiedBedMetaById}
              formatOccupiedAt={formatOccupiedAt}
              paginationFooter={
                <PaginationBar
                  isDark={isDark}
                  idPrefix="modal-bed-board"
                  rangeStart={modalBedsPaging.rangeStart}
                  rangeEnd={modalBedsPaging.rangeEnd}
                  totalItems={modalBedsPaging.total}
                  page={modalBedsPaging.page}
                  totalPages={modalBedsPaging.totalPages}
                  pageSize={bedBoardPageSize}
                  pageSizeOptions={MODAL_BED_PAGE_OPTIONS}
                  onPageChange={setBedBoardPage}
                  onPageSizeChange={setBedBoardPageSize}
                />
              }
              onSelectBed={(bed, flags) => {
                if (selectedBedId === bed.id) {
                  setSelectedBedId(null);
                  return;
                }
                setSelectedBedId(bed.id);
                if (flags.isOccupied && currentAssignedBedId === bed.id) {
                  setSelectedBedAction('transfer');
                } else if (flags.isOccupied && occupiedBedMetaById.get(bed.id)?.visit_uuid) {
                  setSelectedBedAction('mark_available');
                } else if (flags.isBookable) {
                  setSelectedBedAction('assign');
                } else if (flags.isMaintenance) {
                  setSelectedBedAction('mark_available');
                }
              }}
            />
            {!!selectedBedId && (
              <>
                {occupiedByAnotherPatient && occupyingVisitUuidOnSelectedBed && (
                  <p className={`mt-3 text-xs ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                    This bed is assigned to another Patient. Use <span className="font-medium">Release occupant</span> to clear that
                    assignment.
                  </p>
                )}
                {occupiedByAnotherPatient && !occupyingVisitUuidOnSelectedBed && (
                  <p className={`mt-3 text-xs ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                    Occupancy on this bed could not be linked to a visit. Refresh ward data or choose another bed.
                  </p>
                )}
                {selectedBedAction === 'transfer' && (
                  <div
                    className={`mt-3 space-y-3 rounded-lg border p-3 ${
                      isDark ? 'border-slate-600 bg-slate-950/90' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div>
                      <div className={cn('mb-2 text-xs font-semibold', chrome.subhead)}>Transfer Destination</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <select
                          aria-label="Transfer ward"
                          value={transferWardId ?? ''}
                          onChange={(e) => {
                            const nextWardId = Number(e.target.value);
                            setTransferWardId(Number.isFinite(nextWardId) ? nextWardId : null);
                            setTransferRoomLabel('');
                            setTransferBedId(null);
                          }}
                          className={`cursor-pointer rounded-lg border px-2 py-2 text-xs ${
                            isDark
                              ? 'border-slate-600 bg-slate-950 text-slate-100'
                              : 'border-slate-300 bg-white text-slate-900'
                          }`}
                        >
                          <option value="">Select ward</option>
                          {(optionsQuery.data?.wards ?? []).map((ward) => (
                            <option key={ward.id} value={ward.id}>{ward.name}</option>
                          ))}
                        </select>
                        <select
                          aria-label="Transfer room"
                          value={transferRoomLabel}
                          onChange={(e) => {
                            setTransferRoomLabel(e.target.value);
                            setTransferBedId(null);
                          }}
                          className={`cursor-pointer rounded-lg border px-2 py-2 text-xs ${
                            isDark
                              ? 'border-slate-600 bg-slate-950 text-slate-100'
                              : 'border-slate-300 bg-white text-slate-900'
                          }`}
                        >
                          <option value="">Any room</option>
                          {transferRoomOptions.map((room) => (
                            <option key={room} value={room}>{room}</option>
                          ))}
                        </select>
                        <select
                          aria-label="Transfer bed"
                          value={transferBedId ?? ''}
                          onChange={(e) => {
                            const nextBedId = Number(e.target.value);
                            const nextBed = transferBedOptions.find((bed) => bed.id === nextBedId);
                            setTransferBedId(Number.isFinite(nextBedId) ? nextBedId : null);
                            if (transferWardId) setSelectedWardId(transferWardId);
                            if (nextBed) {
                              setSelectedBedId(nextBed.id);
                              setTransferRoomLabel(nextBed.room_label ?? transferRoomLabel);
                            }
                          }}
                          className={`cursor-pointer rounded-lg border px-2 py-2 text-xs ${
                            isDark
                              ? 'border-slate-600 bg-slate-950 text-slate-100'
                              : 'border-slate-300 bg-white text-slate-900'
                          }`}
                        >
                          <option value="">Select bed</option>
                          {transferBedOptions.map((bed) => (
                            <option key={bed.id} value={bed.id}>
                              {bed.room_label ? `Room ${bed.room_label} - ` : ''}{bed.bed_label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="modal-transfer-reason" className={cn('mb-1 block text-xs font-semibold', chrome.subhead)}>
                        Transfer reason
                      </label>
                      <input
                        id="modal-transfer-reason"
                        value={transferReason}
                        onChange={(e) => setTransferReason(e.target.value)}
                        placeholder="Why this transfer is needed"
                        className={`w-full rounded-lg border px-3 py-2 text-sm ${
                          isDark
                            ? 'border-slate-600 bg-slate-950 text-slate-100 placeholder:text-slate-500'
                            : 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
                        }`}
                      />
                    </div>
                  </div>
                )}
              <BedActionPanel
                theme={theme}
                isDark={isDark}
                isBusy={assignMutation.isPending || updateBedMutation.isPending || releaseMutation.isPending}
                isRefreshing={optionsQuery.isFetching}
                actionHint={undefined}
                availableBedActions={availableBedActions}
                selectedBedAction={selectedBedAction}
                canReleaseCurrentPatientBed={canReleaseSelectedBed}
                releaseOccupantHint={occupiedByAnotherPatient && !!occupyingVisitUuidOnSelectedBed}
                selectedBedIsMaintenance={selectedBedIsMaintenance}
                onSelectAction={setSelectedBedAction}
                onContinue={() => executeSelectedBedAction(false)}
                continueDisabled={
                  availableBedActions.length === 0 ||
                  (selectedBedAction === 'assign' && (!canSubmitModalAssign || assignMutation.isPending)) ||
                  (selectedBedAction === 'transfer' &&
                    (!transferWardId ||
                      !transferBedId ||
                      !transferReason.trim() ||
                      assignMutation.isPending ||
                      (transferWardId === currentAssignedWardId && transferBedId === currentAssignedBedId))) ||
                  updateBedMutation.isPending ||
                  releaseMutation.isPending
                }
              />
              </>
            )}
          </div>
        </div>
      )}

      <WardFormDrawer {...wardFormDrawer.drawerProps} />
    </div>
  );
};

export default NursingWardBedManagement;

