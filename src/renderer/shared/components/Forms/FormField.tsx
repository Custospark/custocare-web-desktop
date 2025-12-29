import React from 'react';

interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * FormField Component
 * 
 * Wrapper for form inputs providing consistent spacing
 * 
 * Usage:
 * <FormField>
 *   <TextInput label="First Name" />
 * </FormField>
 * 
 * <FormField>
 *   <Select label="Blood Type" options={bloodTypes} />
 * </FormField>
 */
const FormField: React.FC<FormFieldProps> = ({ children, className = '' }) => {
  return (
    <div className={`mb-24 ${className}`}>
      {children}
    </div>
  );
};

export default FormField;