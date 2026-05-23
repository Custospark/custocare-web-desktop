import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Printer } from 'lucide-react';
import { cn } from '../../../../../shared/types/cn';
import { InvoiceStatus, INVOICE_STATUS_LABELS, INVOICE_TYPE_LABELS, type Invoice } from '../../api/subscriptions/SubscriptionTypes';

interface PrintableInvoiceReceiptProps {
  invoice: Invoice;
  theme: 'light' | 'dark';
  onClose: () => void;
}

const PrintableInvoiceReceipt: React.FC<PrintableInvoiceReceiptProps> = ({ invoice, theme, onClose }) => {
  const isDark = theme === 'dark';
  const receiptRef = useRef<HTMLDivElement>(null);
  const isPaid = invoice.status === InvoiceStatus.PAID || invoice.status === InvoiceStatus.PARTIALLY_PAID;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const lines = invoice.line_items || [];
    const itemsHtml = lines.length > 0 ? `
      <table style="width:100%; border-collapse: collapse; margin-top: 16px; font-size: 13px;">
        <thead>
          <tr style="border-bottom: 2px solid #e5e7eb;">
            <th style="text-align:left; padding:8px 12px; color:#6b7280;">Description</th>
            <th style="text-align:right; padding:8px 12px; color:#6b7280;">Qty</th>
            <th style="text-align:right; padding:8px 12px; color:#6b7280;">Unit Price</th>
            <th style="text-align:right; padding:8px 12px; color:#6b7280;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${lines.map((item: any) => `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding:8px 12px;">${item.description}</td>
              <td style="text-align:right; padding:8px 12px;">${item.quantity}</td>
              <td style="text-align:right; padding:8px 12px;">${Number(item.unit_price).toLocaleString()}</td>
              <td style="text-align:right; padding:8px 12px; font-weight:600;">${Number(item.total).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align:right; padding:8px 12px; font-weight:600;">Total</td>
            <td style="text-align:right; padding:8px 12px; font-weight:700; font-size:15px;">${invoice.amount.toLocaleString()} ${invoice.currency}</td>
          </tr>
        </tfoot>
      </table>
    ` : `<p style="color:#9ca3af; margin-top:16px;">No line items</p>`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${invoice.invoice_number}</title>
        <style>
          @page { margin: 20mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #111827; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb; }
          .header h1 { font-size: 24px; margin-bottom: 4px; }
          .header p { color: #6b7280; font-size: 14px; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-top: 8px; }
          .status-paid { background: #d1fae5; color: #065f46; }
          .status-unpaid { background: #fef3c7; color: #92400e; }
          .status-overdue { background: #fee2e2; color: #991b1b; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
          .info-box { background: #f9fafb; padding: 12px 16px; border-radius: 8px; }
          .info-box .label { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
          .info-box .value { font-size: 14px; font-weight: 600; }
          .amount-large { font-size: 28px; font-weight: 700; }
          .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Custocare</h1>
          <p>Subscription Invoice</p>
          <div class="status-badge status-${invoice.status}">${INVOICE_STATUS_LABELS[invoice.status as InvoiceStatus] || invoice.status_label}</div>
        </div>
        <div class="info-grid">
          <div class="info-box">
            <div class="label">Invoice Number</div>
            <div class="value">${invoice.invoice_number}</div>
          </div>
          <div class="info-box">
            <div class="label">Type</div>
            <div class="value">${INVOICE_TYPE_LABELS[invoice.invoice_type as any] || invoice.invoice_type_label}</div>
          </div>
          <div class="info-box">
            <div class="label">Amount</div>
            <div class="value amount-large">${invoice.amount.toLocaleString()} ${invoice.currency}</div>
          </div>
          <div class="info-box">
            <div class="label">Status</div>
            <div class="value">${INVOICE_STATUS_LABELS[invoice.status as InvoiceStatus] || invoice.status_label}</div>
          </div>
          <div class="info-box">
            <div class="label">Issued</div>
            <div class="value">${invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</div>
          </div>
          <div class="info-box">
            <div class="label">Due Date</div>
            <div class="value">${invoice.due_at ? new Date(invoice.due_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</div>
          </div>
          ${invoice.paid_at ? `
          <div class="info-box">
            <div class="label">Paid On</div>
            <div class="value">${new Date(invoice.paid_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          ` : ''}
          ${invoice.facility?.facility_name ? `
          <div class="info-box">
            <div class="label">Facility</div>
            <div class="value">${invoice.facility.facility_name}</div>
          </div>
          ` : ''}
        </div>
        ${itemsHtml}
        ${invoice.description ? `<p style="margin-top:16px; color:#6b7280; font-size:13px; padding:12px 16px; background:#f9fafb; border-radius:8px;">${invoice.description}</p>` : ''}
        <div class="footer">
          <p>Generated by Custocare on ${new Date().toLocaleString()}</p>
          <p style="margin-top:4px;">For support, contact custocare@custospark.com</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    const content = receiptRef.current;
    if (!content) return;

    const clone = content.cloneNode(true) as HTMLElement;
    const styles = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules || []).map((rule) => rule.cssText).join('\n');
        } catch { return ''; }
      })
      .join('\n');

    const html = `
      <!DOCTYPE html>
      <html>
      <head><title>Receipt-${invoice.invoice_number}</title><style>${styles}</style></head>
      <body>${clone.outerHTML}</body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${invoice.invoice_number}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusBg = () => {
    switch (invoice.status) {
      case InvoiceStatus.PAID: return isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200';
      case InvoiceStatus.OVERDUE: return isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200';
      case InvoiceStatus.PARTIALLY_PAID: return isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200';
      default: return isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={cn('relative rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border shadow-2xl', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}
      >
        <div className={cn('sticky top-0 z-10 p-6 border-b flex items-center justify-between', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
          <div>
            <h2 className="text-xl font-bold">Invoice Receipt</h2>
            <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-600')}>{invoice.invoice_number}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className={cn('p-2 rounded-lg transition-colors', isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600')} title="Print">
              <Printer className="w-5 h-5" />
            </button>
            <button onClick={handleDownload} className={cn('p-2 rounded-lg transition-colors', isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600')} title="Download">
              <Download className="w-5 h-5" />
            </button>
            <button onClick={onClose} className={cn('p-2 rounded-lg transition-colors', isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600')}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div ref={receiptRef} className="p-6">
          <div className={cn('text-center mb-8 pb-6 border-b', isDark ? 'border-gray-800' : 'border-gray-200')}>
            <h1 className="text-2xl font-bold mb-1">Custocare</h1>
            <p className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>Subscription Invoice</p>
            {isPaid && (
              <div className={cn(
                'inline-block mt-3 px-4 py-1 rounded-full text-sm font-semibold',
                invoice.status === InvoiceStatus.PAID
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
              )}>
                {invoice.status === InvoiceStatus.PAID ? 'PAID' : 'PARTIALLY PAID'}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={cn('p-4 rounded-xl', isDark ? 'bg-gray-800' : 'bg-gray-50')}>
              <p className={cn('text-xs mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Invoice Number</p>
              <p className="font-semibold">{invoice.invoice_number}</p>
            </div>
            <div className={cn('p-4 rounded-xl', isDark ? 'bg-gray-800' : 'bg-gray-50')}>
              <p className={cn('text-xs mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Type</p>
              <p className="font-semibold">{INVOICE_TYPE_LABELS[invoice.invoice_type as InvoiceType] || invoice.invoice_type_label}</p>
            </div>
            <div className={cn('p-4 rounded-xl', isDark ? 'bg-gray-800' : 'bg-gray-50')}>
              <p className={cn('text-xs mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Amount</p>
              <p className="text-2xl font-bold">{invoice.amount.toLocaleString()} {invoice.currency}</p>
            </div>
            <div className={cn('p-4 rounded-xl', isDark ? 'bg-gray-800' : 'bg-gray-50')}>
              <p className={cn('text-xs mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Status</p>
              <p className="font-semibold">{INVOICE_STATUS_LABELS[invoice.status as InvoiceStatus] || invoice.status_label}</p>
            </div>
            <div className={cn('p-4 rounded-xl', isDark ? 'bg-gray-800' : 'bg-gray-50')}>
              <p className={cn('text-xs mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Issued</p>
              <p className="font-semibold">{invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString() : '—'}</p>
            </div>
            <div className={cn('p-4 rounded-xl', isDark ? 'bg-gray-800' : 'bg-gray-50')}>
              <p className={cn('text-xs mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Due Date</p>
              <p className="font-semibold">{invoice.due_at ? new Date(invoice.due_at).toLocaleDateString() : '—'}</p>
            </div>
            {invoice.paid_at && (
              <div className={cn('p-4 rounded-xl', isDark ? 'bg-gray-800' : 'bg-gray-50')}>
                <p className={cn('text-xs mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Paid On</p>
                <p className="font-semibold">{new Date(invoice.paid_at).toLocaleDateString()}</p>
              </div>
            )}
            {invoice.facility?.facility_name && (
              <div className={cn('p-4 rounded-xl', isDark ? 'bg-gray-800' : 'bg-gray-50')}>
                <p className={cn('text-xs mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Facility</p>
                <p className="font-semibold">{invoice.facility.facility_name}</p>
              </div>
            )}
          </div>

          {invoice.line_items && invoice.line_items.length > 0 && (
            <div className={cn('rounded-xl border overflow-hidden mb-6', isDark ? 'border-gray-800' : 'border-gray-200')}>
              <table className="w-full text-sm">
                <thead className={cn(isDark ? 'bg-gray-800' : 'bg-gray-50')}>
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium">Description</th>
                    <th className="text-right px-4 py-2.5 font-medium">Qty</th>
                    <th className="text-right px-4 py-2.5 font-medium">Unit Price</th>
                    <th className="text-right px-4 py-2.5 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className={cn('divide-y', isDark ? 'divide-gray-800' : 'divide-gray-100')}>
                  {invoice.line_items.map((item, idx) => (
                    <tr key={idx}>
                      <td className={cn('px-4 py-2.5', isDark ? 'text-gray-300' : 'text-gray-700')}>{item.description}</td>
                      <td className="text-right px-4 py-2.5">{item.quantity}</td>
                      <td className="text-right px-4 py-2.5">{item.unit_price.toLocaleString()}</td>
                      <td className="text-right px-4 py-2.5 font-medium">{item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className={cn(isDark ? 'bg-gray-800' : 'bg-gray-50')}>
                  <tr>
                    <td colSpan={3} className="text-right px-4 py-3 font-semibold">Total</td>
                    <td className="text-right px-4 py-3 font-bold text-base">{invoice.amount.toLocaleString()} {invoice.currency}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {invoice.description && (
            <div className={cn('p-4 rounded-xl mb-6', isDark ? 'bg-gray-800' : 'bg-gray-50')}>
              <p className={cn('text-xs mb-1', isDark ? 'text-gray-400' : 'text-gray-500')}>Description</p>
              <p className="text-sm">{invoice.description}</p>
            </div>
          )}

          <div className={cn('text-center pt-6 border-t', isDark ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400')}>
            <p className="text-xs">Generated by Custocare on {new Date().toLocaleString()}</p>
            <p className="text-xs mt-1">For support, contact custocare@custospark.com</p>
          </div>
        </div>

        <div className={cn('sticky bottom-0 p-6 border-t flex justify-between gap-3', isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200')}>
          <button onClick={onClose} className={cn('px-4 py-2 rounded-lg font-medium', isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
            Close
          </button>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={handleDownload} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white">
              <Download className="w-4 h-4" /> Download
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PrintableInvoiceReceipt;
