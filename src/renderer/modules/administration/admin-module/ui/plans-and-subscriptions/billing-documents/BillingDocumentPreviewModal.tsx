import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, X } from 'lucide-react';

import type { BillingDocument } from '../../../api/subscriptions/SubscriptionTypes';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import { useAppSelector } from '../../../../../../app/store/hooks/useApp';
import { axiosInstance } from '../../../../../../app/api/axiosConfig';
import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';

interface BillingDocumentPreviewModalProps {
  theme: 'light' | 'dark';
  document: BillingDocument | null;
  isLoading?: boolean;
  onClose: () => void;
}

export const BillingDocumentPreviewModal: React.FC<BillingDocumentPreviewModalProps> = ({
  theme,
  document: doc,
  isLoading = false,
  onClose,
}) => {
  const isDark = theme === 'dark';
  const activeFacilityId = useAppSelector((s) => s.activeContext.activeFacilityId);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState(false);
  const pdfUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!doc || !activeFacilityId) return;

    const isInvoice = doc.document_type === 'invoice';
    const id = isInvoice ? doc.invoice_id : doc.payment_id;
    if (!id) return;

    let cancelled = false;

    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
      pdfUrlRef.current = null;
    }

    const endpoint = isInvoice
      ? `/facilities/${activeFacilityId}/billing-documents/invoices/${id}/pdf`
      : `/facilities/${activeFacilityId}/billing-documents/receipts/${id}/pdf`;

    axiosInstance.get(endpoint, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return;
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        pdfUrlRef.current = url;
        setPdfUrl(url);
      })
      .catch(() => { if (!cancelled) setPdfError(true); });

    return () => { cancelled = true; };
  }, [doc, doc?.document_type, doc?.invoice_id, doc?.payment_id, activeFacilityId]);

  const handleDownload = () => {
    if (!pdfUrl || !doc) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${doc.document_number}.pdf`;
    link.click();
  };

  if (!doc && !isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'relative z-10 flex h-4/5 w-4/5 flex-col overflow-hidden rounded-2xl shadow-2xl',
          isDark ? 'bg-gray-900' : 'bg-gray-100',
        )}
      >
        <div
          className={cn(
            'flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3',
            isDark ? 'border-gray-800' : 'border-gray-200',
          )}
        >
          <p className="font-semibold">
            {doc?.document_type === 'receipt' ? 'Receipt preview' : 'Invoice preview'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!pdfUrl}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className={cn('rounded-lg p-2', isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <LoadingSkeleton variant="default" theme={theme} message="Loading document…" />
          )}
          {pdfUrl && (
            <embed
              src={pdfUrl}
              type="application/pdf"
              className="h-full w-full"
            />
          )}
          {pdfError && !isLoading && (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-slate-500">
              <p className="font-semibold">Could not load PDF preview</p>
              <p className="text-sm">Try downloading the document instead.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
