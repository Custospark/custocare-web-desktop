import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { getActiveFacilityId, getStaffId } from '../../../../../app/store/utils/contextSelectors';
import { selectActiveVisitPatientId, selectActiveVisitId } from '../../../../../app/store/slices/visitSlice';
import type { RootState } from '../../../../../app/store/rootReducer';

import type { LabRequest } from '../../../api/lab/LabTypes';

import type { ColorTokens } from './labrequest-form-components/labRequestForm.types';
import { LabRequestResolvedRequestScope } from './labrequest-form-components/LabRequestResolvedRequestScope';
import { LabRequestReferenceDataScope } from './labrequest-form-components/LabRequestReferenceDataScope';
import { LabRequestFormBody } from './labrequest-form-components/LabRequestFormBody';

interface LabRequestFormProps {
  theme?: 'light' | 'dark';
  existingRequest?: LabRequest | null;
  onCancel?: () => void;
  onSuccess?: (requestId: number) => void;
}

export const LabRequestForm: React.FC<LabRequestFormProps> = ({
  theme = 'light',
  existingRequest,
  onCancel,
  onSuccess,
}) => {
  const isDark = theme === 'dark';

  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));
  const patientId = useSelector((state: RootState) => selectActiveVisitPatientId(state));
  const visitId = useSelector((state: RootState) => selectActiveVisitId(state));
  const staffId = useSelector((state: RootState) => getStaffId(state));

  const patientNumericId = patientId ? Number(patientId) : 0;
  const visitNumericId = visitId ? Number(visitId) : 0;

  const [createdRequestUuid, setCreatedRequestUuid] = useState<string | null>(null);

  const colors: ColorTokens = useMemo(
    () => ({
      bg: {
        card: isDark ? 'bg-gray-900' : 'bg-white',
        input: isDark ? 'bg-gray-800' : 'bg-gray-50',
        subtle: isDark ? 'bg-gray-800/60' : 'bg-gray-50',
        hover: isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50',
        muted: isDark ? 'bg-gray-800' : 'bg-gray-100',
        modal: isDark ? 'bg-gray-900/95' : 'bg-white/95',
      },
      text: {
        primary: isDark ? 'text-gray-100' : 'text-gray-900',
        secondary: isDark ? 'text-gray-400' : 'text-gray-600',
        tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
        brand: isDark ? 'text-blue-400' : 'text-blue-600',
      },
      border: {
        primary: isDark ? 'border-gray-700' : 'border-gray-200',
        subtle: isDark ? 'border-gray-800' : 'border-gray-100',
        focus: 'focus:border-blue-500',
      },
    }),
    [isDark]
  );

  return (
    <LabRequestResolvedRequestScope
      existingRequest={existingRequest ?? null}
      visitNumericId={visitNumericId}
      createdRequestUuid={createdRequestUuid}
    >
      <LabRequestReferenceDataScope facilityId={facilityId}>
        <LabRequestFormBody
          theme={theme}
          isDark={isDark}
          colors={colors}
          facilityId={facilityId}
          patientId={patientId}
          visitId={visitId}
          staffId={staffId}
          patientNumericId={patientNumericId}
          visitNumericId={visitNumericId}
          onCancel={onCancel}
          onSuccess={onSuccess}
          setCreatedRequestUuid={setCreatedRequestUuid}
        />
      </LabRequestReferenceDataScope>
    </LabRequestResolvedRequestScope>
  );
};

export default LabRequestForm;