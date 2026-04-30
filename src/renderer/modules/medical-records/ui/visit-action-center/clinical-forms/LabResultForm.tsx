// lab-results/LabResultForm.tsx
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { getActiveFacilityId, getStaffId } from '../../../../../app/store/utils/contextSelectors';
import { selectActiveVisitPatientId, selectActiveVisitId } from '../../../../../app/store/slices/visitSlice';
import type { RootState } from '../../../../../app/store/rootReducer';

import { LabResultResolvedRequestScope } from './labresult-form-components/LabResultResolvedRequestScope';
import { LabResultFormBody } from './labresult-form-components/LabResultFormBody';
import type { ColorTokens } from './labresult-form-components/labResultForm.types';
import { buildLabResultColorTokens } from './labresult-form-components/labResultForm.utils';

interface LabResultFormProps {
  theme: 'light' | 'dark';
  requestUuid?: string | null;
  onCancel?: () => void;
}

export const LabResultForm: React.FC<LabResultFormProps> = ({
  theme = 'light',
  requestUuid = null,
  onCancel,
}) => {
  const isDark = theme === 'dark';

  const facilityId = useSelector((state: RootState) => getActiveFacilityId(state));
  const patientId = useSelector((state: RootState) => selectActiveVisitPatientId(state));
  const visitId = useSelector((state: RootState) => selectActiveVisitId(state));
  const staffId = useSelector((state: RootState) => getStaffId(state));

  const patientNumericId = patientId ? Number(patientId) : 0;
  const visitNumericId = visitId ? Number(visitId) : 0;
  const numericStaffId = staffId ? Number(staffId) : null;

  const colors: ColorTokens = useMemo(
    () => buildLabResultColorTokens(theme),
    [theme]
  );

  return (
    <LabResultResolvedRequestScope requestUuid={requestUuid}>
      {({ request, refetch, isFetching }) => (
        <LabResultFormBody
          theme={theme}
          isDark={isDark}
          colors={colors}
          request={request}
          facilityId={facilityId}
          patientId={patientId}
          visitId={visitId}
          staffId={numericStaffId}
          patientNumericId={patientNumericId}
          visitNumericId={visitNumericId}
          isRequestFetching={isFetching}
          refetchRequest={refetch}
          onCancel={onCancel}
        />
      )}
    </LabResultResolvedRequestScope>
  );
};

export default LabResultForm;
