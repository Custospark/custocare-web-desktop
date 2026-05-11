import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ForwardPatient } from '../../ForwardPatient';

export interface ForwardPatientFocusFormProps {
  theme?: 'light' | 'dark';
  cancelTo: string;
  queueRedirectTo: string;
}

/** Forward Patient form (FocusedModeLayout lives in the route table). */
export function ForwardPatientFocusForm({
  theme = 'light',
  cancelTo,
  queueRedirectTo,
}: ForwardPatientFocusFormProps) {
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate(cancelTo);
  };

  return (
    <ForwardPatient
      theme={theme}
      onCancel={handleCancel}
      queueRedirectTo={queueRedirectTo}
    />
  );
}
