// components/billing-review/components/Modals.tsx
import type { BillingReviewItem } from '../../../../api/billing-review/BillingReviewTypes';

// Export shared types
export interface ThemeColors {
  bg: {
    primary: string;
    secondary: string;
    elevated: string;
    hover: string;
    selected: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  border: {
    primary: string;
  };
  ring: string;
}

export interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  colors: ThemeColors;
  isProcessing?: boolean;
}

// Re-export all modals and primitives
export { EmailModal } from './receipt-action-modals/EmailModal';
export { RefundModal } from './receipt-action-modals/RefundModal';
export { VoidModal } from './receipt-action-modals/VoidModal';

// Re-export types for convenience
export type { BillingReviewItem };
