import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface ThemeColors {
  border: {
    primary: string;
  };
  bg: {
    secondary: string;
  };
  text: {
    tertiary: string;
    secondary: string;
  };
}

interface ReceiptFooterProps {
  selectedTransaction: any | null;
  colors: ThemeColors;
}

const cx = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

export const ReceiptFooter: React.FC<ReceiptFooterProps> = ({
  selectedTransaction,
  colors,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cx('no-print shrink-0 px-5 py-4 border-t', colors.border.primary, colors.bg.secondary)}
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle className={cx('w-4 h-4 shrink-0 mt-0.5', colors.text.tertiary)} />
        <p className={cx('text-xs leading-relaxed', colors.text.secondary)}>
          {selectedTransaction
            ? `Viewing ${selectedTransaction.receipt_number || 'Draft'} • ${selectedTransaction.patient_name} • ${selectedTransaction.patient_number}`
            : 'Select a transaction to view its receipt details and perform actions'}
        </p>
      </div>
    </motion.div>
  );
};