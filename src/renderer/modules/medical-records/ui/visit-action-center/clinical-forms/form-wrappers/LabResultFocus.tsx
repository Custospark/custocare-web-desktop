// lab-results/LabResultFocus.tsx
import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MEDICAL_RECORDS_ROUTES } from '../../../../../../app/routes/routeConstants';
import LabResultForm from '../LabResultForm';
interface LabResultFocusProps {
  theme?: 'light' | 'dark';
  requestUuid?: string | null;
  cancelTo?: string;
}

interface LabResultLocationState {
  requestUuid?: string;
  labRequestUuid?: string;
  uuid?: string;
}

export const LabResultFocus: React.FC<LabResultFocusProps> = ({
  theme = 'light',
  requestUuid,
  cancelTo = MEDICAL_RECORDS_ROUTES.CLINICAL_CARE,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{
    requestUuid?: string;
    uuid?: string;
    labRequestUuid?: string;
  }>();

  const locationState = (location.state || {}) as LabResultLocationState;

  const resolvedRequestUuid =
    requestUuid ||
    params.requestUuid ||
    params.labRequestUuid ||
    params.uuid ||
    locationState.requestUuid ||
    locationState.labRequestUuid ||
    locationState.uuid ||
    null;

  const handleCancel = () => {
    navigate(cancelTo);
  };

  return (
    <LabResultForm
      theme={theme}
      requestUuid={resolvedRequestUuid}
      onCancel={handleCancel}
    />
  );
};

export default LabResultFocus;
