// BaseFocusWrapper.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface BaseFocusWrapperProps<T> {
  theme?: 'light' | 'dark';
  onSave: (data: T) => void;
  onCancel?: () => void;
  backRoute?: string;
  FormComponent: React.ComponentType<{
    theme?: 'light' | 'dark';
    initialData?: T;
    onSave?: (data: T) => void;
    onCancel?: () => void;
  }>;
  initialData?: T;
}

export const BaseFocusWrapper = <T extends object>({
  theme = 'light',
  onSave,
  onCancel,
  backRoute,
  FormComponent,
  initialData,
}: BaseFocusWrapperProps<T>) => {
  const navigate = useNavigate();

  const handleSave = (data: T) => {
    onSave(data);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (backRoute) {
      navigate(backRoute);
    } else {
      navigate(-1);
    }
  };

  return (
    <FormComponent
      theme={theme}
      initialData={initialData}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
};