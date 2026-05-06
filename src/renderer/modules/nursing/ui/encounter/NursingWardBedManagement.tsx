import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BedDouble, Building2, MoveRight, PlusCircle, RefreshCw } from 'lucide-react';

import { useAppDispatch, useAppSelector } from '../../../../app/store/hooks/useApp';
import { getActiveFacilityId } from '../../../../app/store/utils/contextSelectors';
import { selectActiveVisitUuid } from '../../../../app/store/slices/visitSlice';
import { useToast } from '../../../../app/store/contexts/toast/useToast';
import { updateActiveVisitPhase } from '../../../../app/store/slices/visitSlice';
import { VisitPhase } from '../../../pharmacy/api/dispensing/visit-queue/visitTypes';
import {
  useAssignWardBed,
  useCreateWardBed,
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

interface Props {
  theme: 'light' | 'dark';
}

const NursingWardBedManagement: React.FC<Props> = ({ theme }) => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const facilityId = useAppSelector(getActiveFacilityId);
  const visitUuid = useAppSelector(selectActiveVisitUuid);
  const isDark = theme === 'dark';

  const [selectedWardId, setSelectedWardId] = useState<number | null>(null);
  const [selectedBedId, setSelectedBedId] = useState<number | null>(null);
  const [admissionAction, setAdmissionAction] = useState<'admit' | 'assign_bed' | 'transfer'>('assign_bed');
  const [transferReason, setTransferReason] = useState('');
  const [newBedLabel, setNewBedLabel] = useState('');
  const [editingBedId, setEditingBedId] = useState<number | null>(null);
  const [editingBedLabel, setEditingBedLabel] = useState('');

  const [wardDrawerOpen, setWardDrawerOpen] = useState(false);
  const [wardFormData, setWardFormData] = useState<FacilityWardFormData>(getEmptyFormData(facilityId));

  const optionsQuery = useWardBedOptions(visitUuid);
  const assignMutation = useAssignWardBed();
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
    const current = optionsQuery.data.current_location;
    setSelectedWardId(current.ward_id);
    setSelectedBedId(current.bed_id);
    setAdmissionAction(current.admission_action ?? 'assign_bed');
    setTransferReason(current.transfer_reason ?? '');
  }, [optionsQuery.data]);

  const wardBedsQuery = useWardBeds(selectedWardId, facilityId);

  const selectedWard = useMemo(
    () => optionsQuery.data?.wards.find((w) => w.id === selectedWardId) ?? null,
    [optionsQuery.data, selectedWardId]
  );

  const canSubmit =
    !!visitUuid &&
    !!selectedWardId &&
    !!selectedBedId &&
    (admissionAction !== 'transfer' || transferReason.trim().length > 0);

  const handleAssign = async () => {
    if (!visitUuid || !selectedWardId) return;
    try {
      const response = await assignMutation.mutateAsync({
        visitUuid,
        payload: {
          ward_id: selectedWardId,
          bed_id: selectedBedId,
          admission_action: admissionAction,
          transfer_reason: admissionAction === 'transfer' ? transferReason.trim() : undefined,
        },
      });

      if (admissionAction === 'transfer') {
        dispatch(updateActiveVisitPhase({ phase: VisitPhase.TRANSFERRED }));
      } else {
        dispatch(updateActiveVisitPhase({ phase: VisitPhase.ADMITTED }));
      }

      showToast('success', response.message || 'Ward and bed assignment saved.', 4000);
      await optionsQuery.refetch();
      await wardBedsQuery.refetch();
    } catch (error: any) {
      showToast('error', error?.response?.data?.message || 'Failed to save ward assignment.', 5000);
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
      });
      setNewBedLabel('');
      await Promise.all([
        wardBedsQuery.refetch(),
        optionsQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: nursingWardBedKeys.all }),
      ]);
      showToast('success', 'Bed created successfully.', 3000);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to create bed.';
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
      });
      setEditingBedId(null);
      setEditingBedLabel('');
      await Promise.all([
        wardBedsQuery.refetch(),
        optionsQuery.refetch(),
      ]);
      showToast('success', 'Bed updated successfully.', 3000);
    } catch (error: any) {
      showToast('error', error?.response?.data?.message || 'Failed to update bed.', 5000);
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
            Admit, assign/change bed, or transfer while staying in nursing encounter.
          </p>
        </div>
        <button
          onClick={() => optionsQuery.refetch()}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer ${isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-50'}`}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className={`rounded-lg border p-3 ${isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-gray-50'}`}>
        <div className="text-sm font-medium mb-1">Current Location</div>
        <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {optionsQuery.data?.current_location?.ward_name
            ? `${optionsQuery.data.current_location.ward_name} - Bed ${optionsQuery.data.current_location.bed_label ?? 'N/A'}`
            : 'Not yet assigned'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Action</label>
          <select
            aria-label="Select ward and bed action"
            value={admissionAction}
            onChange={(e) => setAdmissionAction(e.target.value as 'admit' | 'assign_bed' | 'transfer')}
            className={`mt-1 w-full rounded-lg border px-3 py-2 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
          >
            <option value="admit">Admit to Ward</option>
            <option value="assign_bed">Assign / Change Bed</option>
            <option value="transfer">Transfer Ward</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Ward</label>
          <div className="mt-1 flex gap-2">
            <select
              aria-label="Select ward"
              value={selectedWardId ?? ''}
              onChange={(e) => setSelectedWardId(e.target.value ? Number(e.target.value) : null)}
              className={`flex-1 rounded-lg border px-3 py-2 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
            >
              <option value="">Select ward...</option>
              {(optionsQuery.data?.wards ?? []).map((ward) => (
                <option key={ward.id} value={ward.id}>
                  {ward.name} ({ward.available_beds} available)
                </option>
              ))}
            </select>
            <button
              onClick={handleCreateWard}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Ward
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Bed</label>
          <select
            aria-label="Select bed"
            value={selectedBedId ?? ''}
            onChange={(e) => setSelectedBedId(e.target.value ? Number(e.target.value) : null)}
            className={`mt-1 w-full rounded-lg border px-3 py-2 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
          >
            <option value="">Select bed...</option>
            {(selectedWard?.available_bed_list ?? []).map((bed) => (
              <option key={bed.id} value={bed.id}>
                {bed.bed_label}
              </option>
            ))}
          </select>
        </div>

        {admissionAction === 'transfer' && (
          <div>
            <label className="text-sm font-medium">Transfer Reason</label>
            <input
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder="Why this transfer is needed"
              className={`mt-1 w-full rounded-lg border px-3 py-2 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
            />
          </div>
        )}
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
          <div className="flex gap-2 mb-3">
            <input
              value={newBedLabel}
              onChange={(e) => setNewBedLabel(e.target.value)}
              placeholder="New bed label (e.g. A-01)"
              className={`flex-1 rounded-lg border px-3 py-2 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
            />
            <button
              onClick={handleCreateBed}
              disabled={!newBedLabel.trim() || createBedMutation.isPending}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
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
                    <button onClick={handleUpdateBed} className="text-xs px-2 py-1 rounded bg-green-600 text-white">Save</button>
                    <button onClick={() => setEditingBedId(null)} className="text-xs px-2 py-1 rounded border">Cancel</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{bed.bed_label}</span>
                    <button
                      onClick={() => {
                        setEditingBedId(bed.id);
                        setEditingBedLabel(bed.bed_label);
                      }}
                      className="text-xs px-2 py-1 rounded border"
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

      <button
        onClick={handleAssign}
        disabled={!canSubmit || assignMutation.isPending}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <MoveRight className="w-4 h-4" />
        {assignMutation.isPending ? 'Saving...' : 'Save Ward & Bed'}
      </button>

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

