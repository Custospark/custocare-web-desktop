
export type ToastVariant = 'error' | 'warning';

interface MappedError {
  message: string;
  variant: ToastVariant;
}

/**
 * Map backend error codes to user-friendly messages
 * @param code backend response code
 */
export const mapRegisterError = (code: string): MappedError => {
  switch (code) {
    case 'EMAIL_ALREADY_REGISTERED':
      return {
        message:
          'This email is already registered. Please log in or use a different email.',
        variant: 'warning',
      };

    case 'NATIONAL_ID_ALREADY_REGISTERED':
      return {
        message:
          'This national ID is already registered. Please contact support if you believe this is a mistake.',
        variant: 'error',
      };

    case 'VALIDATION_FAILED':
      return {
        message:
          'Some of the information you entered is invalid. Please review and try again.',
        variant: 'error',
      };

    case 'REGISTRATION_FAILED':
      return {
        message:
          'Registration could not be completed at this time. Please try again later.',
        variant: 'error',
      };

    case 'NETWORK_ERROR':
      return {
        message:
          'Unable to connect to the server. Please check your internet connection.',
        variant: 'error',
      };

    default:
      return {
        message:
          'Something went wrong while creating your account. Please try again.',
        variant: 'error',
      };
  }
};
