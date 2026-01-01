export type ToastVariant = 'error' | 'warning' | 'success';

interface MappedError {
  message: string;
  variant: ToastVariant;
}

/**
 * Map backend error codes to user-friendly messages
 * @param code Backend error code
 * @returns Mapped error with user-friendly message and toast variant
 */
export const mapRegisterPatientError = (code: string): MappedError => {
  switch (code) {
    case 'PATIENT_ALREADY_EXISTS':
      return {
        message:
          'A patient record already exists for your account. Redirecting to dashboard...',
        variant: 'warning',
      };

    case 'INVALID_DATE_OF_BIRTH':
      return {
        message:
          'The date of birth you entered is invalid. Please check and try again.',
        variant: 'error',
      };

    case 'INVALID_BIOLOGICAL_SEX':
      return {
        message:
          'Please select a valid biological sex option.',
        variant: 'error',
      };

    case 'EMERGENCY_CONTACT_REQUIRED':
      return {
        message:
          'Emergency contact information is required. Please fill in all fields.',
        variant: 'error',
      };

    case 'USER_NOT_FOUND':
      return {
        message:
          'Your user session has expired. Please log in again.',
        variant: 'error',
      };

    case 'PATIENT_CREATION_FAILED':
      return {
        message:
          'Patient registration could not be completed at this time. Please try again later.',
        variant: 'error',
      };

    case 'VALIDATION_FAILED':
      return {
        message:
          'Some of the information you entered is invalid. Please review and try again.',
        variant: 'error',
      };

    case 'NETWORK_ERROR':
      return {
        message:
          'Unable to connect to the server. Please check your internet connection and try again.',
        variant: 'error',
      };

    case 'UNKNOWN_ERROR':
      return {
        message:
          'An unexpected error occurred during registration. Please try again.',
        variant: 'error',
      };

    default:
      return {
        message:
          'Something went wrong while creating your patient record. Please try again.',
        variant: 'error',
      };
  }
};

/**
 * Map validation errors to field-specific messages
 * Useful for displaying inline field errors
 * @param errors Backend validation errors object
 * @returns Formatted error messages by field
 */
export const mapValidationErrors = (
  errors: Record<string, string[]>
): Record<string, string> => {
  const fieldErrors: Record<string, string> = {};

  Object.keys(errors).forEach((field) => {
    // Take the first error message for each field
    fieldErrors[field] = errors[field][0] || 'Invalid value';
  });

  return fieldErrors;
};

/**
 * Extract user-friendly error message from errors object
 * @param errors Backend validation errors
 * @returns Combined error message string
 */
export const extractErrorMessage = (
  errors: Record<string, string[]>
): string => {
  const messages: string[] = [];

  Object.values(errors).forEach((errorArray) => {
    messages.push(...errorArray);
  });

  return messages.join('. ') || 'Validation failed';
};