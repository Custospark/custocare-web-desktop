import React from 'react';

interface FormActionsProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  sticky?: boolean;
  className?: string;
}

/**
 * FormActions Component
 * 
 * Container for form action buttons (Save, Cancel, etc.)
 * Optionally sticky at bottom of viewport
 * 
 * Usage:
 * <FormActions align="right">
 *   <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
 *   <Button variant="primary" type="submit">Save Patient</Button>
 * </FormActions>
 * 
 * <FormActions sticky align="right">
 *   <Button variant="primary" type="submit">Save Changes</Button>
 * </FormActions>
 */
const FormActions: React.FC<FormActionsProps> = ({
  children,
  align = 'right',
  sticky = false,
  className = ''
}) => {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  const stickyClasses = sticky
    ? 'sticky bottom-0 bg-neutral-white border-t border-neutral-gray-light shadow-md'
    : 'border-t border-neutral-gray-light';

  return (
    <div className={`flex items-center gap-12 pt-24 mt-32 ${alignmentClasses[align]} ${stickyClasses} ${className}`}>
      {children}
    </div>
  );
};

export default FormActions;