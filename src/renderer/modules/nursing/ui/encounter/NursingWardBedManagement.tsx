import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  BedDouble,
  Building2,
  Check,
  CircleDot,
  Lock,
  PlusCircle,
  RefreshCw,
  UserPlus,
  UserRound,
  X,
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
import { useCreateWard, wardKeys } from '../../../administration/admin-module/api/wards/wardQueries';
import { WardType } from '../../../administration/admin-module/api/wards/wardTypes';
import WardFormDrawer from '../../../administration/admin-module/ui/clinical-space/ward-components/WardFormDrawer';
import { getEmptyFormData } from '../../../administration/admin-module/ui/clinical-space/ward-components/ward.constants';
import type { FacilityWardFormData } from '../../../administration/admin-module/ui/clinical-space/ward-components/ward.types';
import BedActionPanel from './components/BedActionPanel';
import BedBoardGrid from './components/BedBoardGrid';

interface Props {
  theme: 'light' | 'dark';
}

const NursingWardBedManagement: React.FC<Props> = ({ theme }) => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const facilityId = useAppSelector(getActiveFacilityId);
  const visitUuid = useAppSelector(selectActiveVisitUuid);
  const isDark = theme === 'dark';

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
  const [transferWardId, setTransferWardId] = useState<number | null>(null);
  const [transferRoomLabel, setTransferRoomLabel] = useState<string>('');
  const [transferBedId, setTransferBedId] = useState<number | null>(null);
  const [bedPickerOpen, setBedPickerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  const [wardDrawerOpen, setWardDrawerOpen] = useState(false);
  const [wardFormData, setWardFormData] = useState<FacilityWardFormData>(getEmptyFormData(facilityId));
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
  const createWardMutation = useCreateWard({
    onSuccess: async () => {
      setWardDrawerOpen(false);
      await queryClient.invalidateQueries({ queryKey: wardKeys.all });
      await queryClient.invalidateQueries({ queryKey: nursingWardBedKeys.all });
    },
  });

  useEffect(() => {
    setWardFormData(getEmptyFormData(facilityId));
  }, [facilityId]);

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
  const currentAssignedBedId = optionsQuery.data?.current_location?.bed_id ?? null;
  const currentAssignedWardId = optionsQuery.data?.current_location?.ward_id ?? null;

  const hasBedAssignment = !!(currentAssignedWardId && currentAssignedBedId);

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

  const filteredWardBeds = useMemo(() => {
    const search = bedSearch.trim().toLowerCase();
    const beds = wardBedsQuery.data ?? [];
    if (!search) return beds;
    return beds.filter((b) => b.bed_label.toLowerCase().includes(search));
  }, [wardBedsQuery.data, bedSearch]);

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
  const selectedBedIsMaintenance = selectedBed?.status === 'maintenance';
  const selectedBedIsInactive = selectedBed?.status === 'inactive';
  /** Patient's occupied bed → Release + Transfer. Other occupied whilst visit has assignment → Release (clears assignment only). Else free bed → Assign (+ maintenance); Transfer only applies when source is own bed chip flow. */
  const availableBedActions = useMemo(() => {
    if (!selectedBed) return [] as Array<'assign' | 'transfer' | 'mark_available' | 'mark_maintenance'>;
    if (selectedBedIsInactive) return [] as Array<'assign' | 'transfer' | 'mark_available' | 'mark_maintenance'>;

    if (canReleaseSelectedBed) {
      return ['transfer', 'mark_available'] as Array<'assign' | 'transfer' | 'mark_available' | 'mark_maintenance'>;
    }

    if (occupiedByAnotherPatient && hasBedAssignment) {
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
    hasBedAssignment,
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
      setLastActionMessage(response.message || 'Ward and bed assignment saved.');
    } catch (error: unknown) {
      showToast('error', getErrorMessage(error, 'Failed to save ward assignment.'), 5000);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await optionsQuery.refetch();
      await refetchWardBedsSafely();
      setLastActionMessage('Ward and bed data refreshed.');
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
    setWardFormData(getEmptyFormData(facilityId));
    setWardDrawerOpen(true);
  };

  const handleCreateBedFromModal = () => {
    setBedPickerOpen(false);
    setTimeout(() => {
      const input = document.getElementById('new-bed-label-input') as HTMLInputElement | null;
      input?.focus();
    }, 0);
  };

  const submitWardCreate = () => {
    if (!facilityId || !wardFormData.name.trim() || !wardFormData.ward_type) return;
    createWardMutation.mutate({
      facility_id: facilityId,
      name: wardFormData.name.trim(),
      code: wardFormData.code.trim() || undefined,
      ward_type: wardFormData.ward_type as WardType,
      building: wardFormData.building.trim() || undefined,
      floor: wardFormData.floor.trim() || undefined,
      status: wardFormData.status,
      capacity_declared: wardFormData.capacity_declared ? Number(wardFormData.capacity_declared) : undefined,
      capacity_operational: wardFormData.capacity_operational ? Number(wardFormData.capacity_operational) : undefined,
      sex_restriction: wardFormData.sex_restriction,
      age_group: wardFormData.age_group,
      note: wardFormData.note.trim() || undefined,
    });
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
      setLastActionMessage('Bed created successfully.');
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
      setLastActionMessage('Bed details updated successfully.');
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
      setLastActionMessage('Processing bed action...');
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
          setLastActionMessage(null);
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
        setLastActionMessage(transferMsg);
        if (closeModal) setBedPickerOpen(false);
        return;
      }

      if (selectedBedAction === 'mark_available' && selectedBedIsOccupied) {
        if (!visitUuid || !currentAssignedBedId) {
          showToast('error', 'No ward/bed assignment to release for this visit.', 4000);
          return;
        }
        const mayReleaseVisitBed =
          canReleaseSelectedBed || (occupiedByAnotherPatient && hasBedAssignment);
        if (!mayReleaseVisitBed) {
          showToast('error', 'Only release this visit from an occupied bed when it has an assignment.', 4000);
          return;
        }
        const releaseResponse = await releaseMutation.mutateAsync({
          visitUuid,
          bedId: currentAssignedBedId,
        });
        await optionsQuery.refetch();
        await refetchWardBedsSafely();
        showToast('success', releaseResponse.message || 'Room/bed released successfully.', 3000);
        setLastActionMessage(releaseResponse.message || 'Room/bed released successfully.');
        if (closeModal) setBedPickerOpen(false);
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
        setLastActionMessage(
          selectedBedAction === 'mark_available'
            ? selectedBedIsOccupied
              ? 'Room/bed released successfully.'
              : 'Selected bed marked as available.'
            : 'Selected bed marked for maintenance.'
        );
        if (closeModal) setBedPickerOpen(false);
        return;
      }
    } catch (error: unknown) {
      showToast('error', getErrorMessage(error, 'Failed to complete selected bed action.'), 5000);
      setLastActionMessage(null);
    }
  };

  if (!visitUuid) {
    return (
      <div className="rounded-xl border p-6">
        Select a patient from nursing queue first to assign ward and bed.
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-5 space-y-4 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Ward & Bed Assignment</h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {hasBedAssignment
              ? 'Open a ward, then use Transfer on the bed board to move to another ward/bed.'
              : 'Choose Admit or Assign, select a ward, then confirm on the bed board.'}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'}`}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {lastActionMessage && (
        <div className={`rounded-lg border px-3 py-2 text-sm ${isDark ? 'border-emerald-700 bg-emerald-900/20 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {lastActionMessage}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Action</label>
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
                        ? 'border-gray-700 text-gray-200 hover:bg-gray-800'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
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
                        ? 'border-gray-700 text-gray-200 hover:bg-gray-800'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
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
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Select Ward</label>
            <button
              onClick={handleCreateWard}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 cursor-pointer text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Create Ward
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {optionsQuery.isLoading
              ? Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={`ward-skeleton-${idx}`}
                  className={`h-20 rounded-xl border animate-pulse ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-100'}`}
                />
              ))
              : (optionsQuery.data?.wards ?? []).map((ward) => {
              const active = selectedWardId === ward.id;
              return (
                <button
                  key={ward.id}
                  onClick={() => {
                    setSelectedWardId(ward.id);
                    setBedSearch('');
                    setBedPickerOpen(true);
                  }}
                  className={`text-left rounded-xl border p-3 transition cursor-pointer ${
                    active
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : isDark
                        ? 'border-gray-700 hover:bg-gray-800'
                        : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{ward.name}</div>
                    {active && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {ward.available_beds} beds available
                  </div>
                </button>
              );
              })}
          </div>
        </div>
      </div>

      {selectedWard && (
        <div className={`rounded-lg border p-3 text-sm ${isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-50'}`}>
          <div className="font-medium flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4" />
            Ward Availability
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>Operational Beds: {selectedWard.capacity_operational}</div>
            <div>Available Beds: {selectedWard.available_beds}</div>
            <div className="col-span-2">Location: {selectedWard.building ?? '-'} / {selectedWard.floor ?? '-'}</div>
          </div>
        </div>
      )}

      {selectedWardId && (
        <div className={`rounded-lg border p-3 ${isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-50'}`}>
          <div className="font-medium mb-2">Manage Beds in Ward</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            <input
              value={newRoomLabel}
              onChange={(e) => setNewRoomLabel(e.target.value)}
              placeholder="Room (optional, e.g. R1)"
              className={`rounded-lg border px-3 py-2 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
            />
            <input
              id="new-bed-label-input"
              value={newBedLabel}
              onChange={(e) => setNewBedLabel(e.target.value)}
              placeholder="New bed label (e.g. A-01)"
              className={`rounded-lg border px-3 py-2 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
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
          <div className="space-y-2 max-h-44 overflow-auto">
            {(wardBedsQuery.data ?? []).map((bed) => (
              <div key={bed.id} className="flex items-center gap-2">
                {editingBedId === bed.id ? (
                  <>
                    <input
                      aria-label="Edit bed label"
                      value={editingBedLabel}
                      onChange={(e) => setEditingBedLabel(e.target.value)}
                      className={`flex-1 rounded-lg border px-2 py-1 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
                    />
                    <input
                      aria-label="Edit room label"
                      value={editingRoomLabel}
                      onChange={(e) => setEditingRoomLabel(e.target.value)}
                      placeholder="Room"
                      className={`w-24 rounded-lg border px-2 py-1 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
                    />
                    <button onClick={handleUpdateBed} className="text-xs px-2 py-1 rounded bg-green-600 text-white cursor-pointer">Save</button>
                    <button onClick={() => setEditingBedId(null)} className="text-xs px-2 py-1 rounded border cursor-pointer">Cancel</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{bed.room_label ? `Room ${bed.room_label} - ` : ''}{bed.bed_label}</span>
                    <button
                      onClick={() => {
                        setEditingBedId(bed.id);
                        setEditingBedLabel(bed.bed_label);
                        setEditingRoomLabel(bed.room_label ?? '');
                      }}
                      className="text-xs px-2 py-1 rounded border cursor-pointer"
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            ))}
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
            className={`absolute left-1/2 top-1/2 w-[92vw] max-w-5xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-4 ${
              isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Ward bed picker"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <label className="text-sm font-medium block">{selectedWard?.name ?? 'Ward'} Bed Board</label>
              <div className="text-xs flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-1"><CircleDot className="w-3.5 h-3.5 text-green-500" /> Free</span>
                <span className="inline-flex items-center gap-1"><UserRound className="w-3.5 h-3.5 text-blue-500" /> This patient</span>
                <span className="inline-flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-rose-500" /> Other patient</span>
              </div>
              <button onClick={() => setBedPickerOpen(false)} className="p-1.5 rounded-md border cursor-pointer" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <BedBoardGrid
              isDark={isDark}
              wardBedsLoading={wardBedsQuery.isLoading}
              filteredWardBeds={filteredWardBeds}
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
              onSelectBed={(bed, flags) => {
                if (selectedBedId === bed.id) {
                  setSelectedBedId(null);
                  return;
                }
                setSelectedBedId(bed.id);
                if (flags.isOccupied && currentAssignedBedId === bed.id) {
                  setSelectedBedAction('transfer');
                } else if (flags.isOccupied && hasBedAssignment) {
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
                {occupiedByAnotherPatient && hasBedAssignment && (
                  <p className={`mt-3 text-xs ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                    This bed is occupied by another patient. Use <span className="font-medium">Release current patient bed</span> to
                    clear this visit&apos;s assignment, or select a free bed to assign.
                  </p>
                )}
                {occupiedByAnotherPatient && !hasBedAssignment && (
                  <p className={`mt-3 text-xs ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                    This bed is occupied by another patient. Select a free bed to assign this visit.
                  </p>
                )}
                {selectedBedAction === 'transfer' && (
                  <div className={`mt-3 rounded-lg border p-3 space-y-3 ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                    <div>
                      <div className="text-xs font-medium mb-2">Transfer Destination</div>
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
                          className={`rounded-lg border px-2 py-2 text-xs cursor-pointer ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
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
                          className={`rounded-lg border px-2 py-2 text-xs cursor-pointer ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
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
                          className={`rounded-lg border px-2 py-2 text-xs cursor-pointer ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
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
                      <label htmlFor="modal-transfer-reason" className="text-xs font-medium block mb-1">
                        Transfer reason
                      </label>
                      <input
                        id="modal-transfer-reason"
                        value={transferReason}
                        onChange={(e) => setTransferReason(e.target.value)}
                        placeholder="Why this transfer is needed"
                        className={`w-full rounded-lg border px-3 py-2 text-sm ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
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
                releaseCurrentBedFromOccupiedElsewhereHint={occupiedByAnotherPatient && hasBedAssignment}
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

      <WardFormDrawer
        theme={theme}
        mode="create"
        open={wardDrawerOpen}
        formData={wardFormData}
        onChange={setWardFormData}
        onClose={() => setWardDrawerOpen(false)}
        onSubmit={submitWardCreate}
        isSubmitting={createWardMutation.isPending}
        canSubmit={!!wardFormData.name.trim() && !!wardFormData.ward_type && !!facilityId}
      />
    </div>
  );
};

export default NursingWardBedManagement;

