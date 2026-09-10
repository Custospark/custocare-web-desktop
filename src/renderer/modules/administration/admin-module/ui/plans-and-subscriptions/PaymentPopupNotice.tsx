import React, { useState } from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { cn } from '../../../../../shared/types/cn';

interface PaymentPopupNoticeProps {
  theme: 'light' | 'dark';
  popupBlocked: boolean;
  paymentUrl: string | null;
}

/**
 * Rendered inside payment flows when the gateway window could not be
 * opened automatically: manual "Open Payment Page" fallback from a fresh
 * user gesture, so the user is never stranded polling with no way to pay.
 */
export const PaymentPopupNotice: React.FC<PaymentPopupNoticeProps> = ({
  theme,
  popupBlocked,
  paymentUrl,
}) => {
  const isDark = theme === 'dark';
  const [manualOpenFailed, setManualOpenFailed] = useState(false);

  if (!popupBlocked || !paymentUrl) return null;

  const openManually = () => {
    const win = window.open(paymentUrl, '_blank');
    if (!win || win.closed) {
      setManualOpenFailed(true);
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-4 flex items-start gap-3',
        isDark ? 'bg-amber-900/20 border-amber-700/50' : 'bg-amber-50 border-amber-200',
      )}
    >
      <AlertCircle className={cn('w-5 h-5 shrink-0', isDark ? 'text-amber-400' : 'text-amber-600')} />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-bold', isDark ? 'text-amber-100' : 'text-amber-900')}>
          Payment window was blocked
        </p>
        <p className={cn('text-sm mt-0.5', isDark ? 'text-amber-200/90' : 'text-amber-800')}>
          Your browser blocked the checkout window. Open it manually to complete payment.
        </p>
        <button
          type="button"
          onClick={openManually}
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm bg-amber-600 hover:bg-amber-700 text-white transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          Open Payment Page
        </button>
        {manualOpenFailed && (
          <p className={cn('text-xs mt-2', isDark ? 'text-amber-300' : 'text-amber-700')}>
            Still blocked - allow popups for this site, then press Verify payment below.
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentPopupNotice;
