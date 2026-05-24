import React, { useCallback, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';

import { cn } from '../../types/cn';
import { useToast } from '../../../app/store/contexts/toast/useToast';
import { openAuthenticatedFile } from '../../utils/openAuthenticatedFile';

export interface ReceiptViewButtonProps {
  receiptDownloadUrl?: string | null;
  receiptUrl?: string | null;
  label?: string;
  className?: string;
  iconClassName?: string;
}

export const ReceiptViewButton: React.FC<ReceiptViewButtonProps> = ({
  receiptDownloadUrl,
  receiptUrl,
  label = 'View',
  className,
  iconClassName,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const endpoint = receiptDownloadUrl ?? receiptUrl;

  const handleClick = useCallback(async () => {
    if (!endpoint) return;
    setLoading(true);
    try {
      await openAuthenticatedFile(endpoint);
    } catch {
      showToast('error', 'Could not open receipt. Please sign in again or try later.', 5000);
    } finally {
      setLoading(false);
    }
  }, [endpoint, showToast]);

  if (!endpoint) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={loading}
      className={cn(
        'inline-flex items-center gap-0.5 text-xs underline disabled:opacity-60',
        className,
      )}
    >
      {loading ? (
        <Loader2 className={cn('w-3 h-3 animate-spin', iconClassName)} />
      ) : (
        <ExternalLink className={cn('w-3 h-3', iconClassName)} />
      )}
      {label}
    </button>
  );
};
