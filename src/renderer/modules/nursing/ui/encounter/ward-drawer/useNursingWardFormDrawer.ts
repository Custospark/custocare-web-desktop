import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  useCreateWard,
  useGetWardById,
  useUpdateWard,
  wardKeys,
} from '../../../../administration/admin-module/api/wards/wardQueries';
import type {
  CreateWardRequest,
  UpdateWardRequest,
  WardType,
} from '../../../../administration/admin-module/api/wards/wardTypes';
import { getEmptyFormData } from '../../../../administration/admin-module/ui/clinical-space/ward-components/ward.constants';
import type { FacilityWardFormData } from '../../../../administration/admin-module/ui/clinical-space/ward-components/ward.types';
import { parseOptionalInteger } from '../../../../administration/admin-module/ui/clinical-space/ward-components/ward.utils';

import { nursingWardBedKeys } from '../../../api/ward-bed/wardBedQueries';

import { mapWardToFacilityFormData } from './mapWardToFacilityFormData';

export function useNursingWardFormDrawer(params: { facilityId: number | null; theme: 'light' | 'dark' }) {
  const { facilityId, theme } = params;
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editWardId, setEditWardId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FacilityWardFormData>(() => getEmptyFormData(facilityId));

  useEffect(() => {
    setFormData(getEmptyFormData(facilityId));
  }, [facilityId]);

  const wardDetailQuery = useGetWardById(
    { id: editWardId ?? 0, facility_id: facilityId ?? 0 },
    {
      enabled:
        open &&
        mode === 'edit' &&
        editWardId != null &&
        facilityId != null &&
        facilityId > 0,
    }
  );

  useEffect(() => {
    if (!open || mode !== 'edit' || !wardDetailQuery.data) return;
    setFormData(mapWardToFacilityFormData(wardDetailQuery.data));
  }, [open, mode, wardDetailQuery.data]);

  const createMutation = useCreateWard({
    onSuccess: async () => {
      setOpen(false);
      setEditWardId(null);
      await queryClient.invalidateQueries({ queryKey: wardKeys.all });
      await queryClient.invalidateQueries({ queryKey: nursingWardBedKeys.all });
    },
  });

  const updateMutation = useUpdateWard({
    onSuccess: async () => {
      setOpen(false);
      setEditWardId(null);
      await queryClient.invalidateQueries({ queryKey: wardKeys.all });
      await queryClient.invalidateQueries({ queryKey: nursingWardBedKeys.all });
    },
  });

  const closeDrawer = useCallback(() => {
    setOpen(false);
    setEditWardId(null);
    setFormData(getEmptyFormData(facilityId));
  }, [facilityId]);

  const openCreateDrawer = useCallback(() => {
    setMode('create');
    setEditWardId(null);
    setFormData(getEmptyFormData(facilityId));
    setOpen(true);
  }, [facilityId]);

  const openEditDrawerForWardId = useCallback(
    (wardId: number) => {
      setMode('edit');
      setEditWardId(wardId);
      setFormData(getEmptyFormData(facilityId));
      setOpen(true);
    },
    [facilityId]
  );

  const submit = useCallback(() => {
    const fid = facilityId;
    if (!fid || !formData.name.trim() || !formData.ward_type) return;

    const payload: CreateWardRequest = {
      facility_id: fid,
      name: formData.name.trim(),
      code: formData.code.trim() || undefined,
      ward_type: formData.ward_type as WardType,
      building: formData.building.trim() || undefined,
      floor: formData.floor.trim() || undefined,
      status: formData.status,
      capacity_declared: parseOptionalInteger(formData.capacity_declared),
      capacity_operational: parseOptionalInteger(formData.capacity_operational),
      sex_restriction: formData.sex_restriction,
      age_group: formData.age_group,
      note: formData.note.trim() || undefined,
    };

    if (mode === 'create') {
      createMutation.mutate(payload);
      return;
    }

    const ward = wardDetailQuery.data;
    if (!ward?.id) return;

    const updatePayload: UpdateWardRequest = {
      name: payload.name,
      code: payload.code,
      ward_type: payload.ward_type,
      building: payload.building,
      floor: payload.floor,
      status: payload.status,
      capacity_declared: payload.capacity_declared,
      capacity_operational: payload.capacity_operational,
      sex_restriction: payload.sex_restriction,
      age_group: payload.age_group,
      note: payload.note,
    };

    updateMutation.mutate({
      id: ward.id,
      facility_id: ward.facility_id,
      data: updatePayload,
    });
  }, [facilityId, formData, mode, wardDetailQuery.data, createMutation, updateMutation]);

  const canSubmit = useMemo(() => {
    if (!facilityId || !formData.name.trim() || !formData.ward_type) return false;
    if (mode === 'edit') {
      return !wardDetailQuery.isLoading && !!wardDetailQuery.data;
    }
    return true;
  }, [facilityId, formData.name, formData.ward_type, mode, wardDetailQuery.isLoading, wardDetailQuery.data]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const drawerProps = useMemo(
    () => ({
      theme,
      mode,
      open,
      formData,
      selectedWardName: mode === 'edit' ? wardDetailQuery.data?.name ?? '' : undefined,
      onChange: setFormData,
      onClose: closeDrawer,
      onSubmit: submit,
      isSubmitting,
      canSubmit,
    }),
    [
      theme,
      mode,
      open,
      formData,
      wardDetailQuery.data?.name,
      closeDrawer,
      submit,
      isSubmitting,
      canSubmit,
    ]
  );

  return {
    drawerProps,
    openCreateDrawer,
    openEditDrawerForWardId,
    closeDrawer,
  };
}
