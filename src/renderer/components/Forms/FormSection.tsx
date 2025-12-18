import React from 'react';

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * FormSection Component
 * 
 * Groups related form fields with optional title and description
 * 
 * Usage:
 * <FormSection 
 *   title="Personal Information"
 *   description="Enter patient's basic details"
 * >
 *   <FormField><TextInput label="First Name" /></FormField>
 *   <FormField><TextInput label="Last Name" /></FormField>
 * </FormSection>
 */
const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className = ''
}) => {
  return (
    <section className={`mb-48 ${className}`}>
      {(title || description) && (
        <div className="mb-24 pb-16 border-b border-neutral-gray-light">
          {title && (
            <h3 className="text-h4 text-neutral-black font-semibold mb-8">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-body text-neutral-gray-dark">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-24">
        {children}
      </div>
    </section>
  );
};

export default FormSection;