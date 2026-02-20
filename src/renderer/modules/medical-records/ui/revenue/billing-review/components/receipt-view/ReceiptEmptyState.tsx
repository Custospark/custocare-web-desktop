// components/billing-review/components/ReceiptEmptyState.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Receipt } from 'lucide-react';

interface ThemeColors {
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
}

interface ReceiptEmptyStateProps {
  isDark: boolean;
  colors: ThemeColors;
}

const cx = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

export const ReceiptEmptyState: React.FC<ReceiptEmptyStateProps> = ({
  isDark,
  colors,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-64"
    >
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          repeatType: 'reverse'
        }}
        className={cx('p-4 rounded-xl mb-4 cursor-pointer', isDark ? 'bg-gray-800' : 'bg-gray-100')}
        whileHover={{ scale: 1.05 }}
      >
        <Receipt className={cx('w-16 h-16', colors.text.tertiary)} />
      </motion.div>
      <p className={cx('text-sm text-center font-medium', colors.text.primary)}>
        No Transaction Selected
      </p>
      <p className={cx('text-xs text-center mt-1', colors.text.secondary)}>
        Select a transaction from the left panel to view the receipt
      </p>
    </motion.div>
  );
};