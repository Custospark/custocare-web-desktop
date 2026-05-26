import { forwardRef } from 'react';
import { Building2, Globe, Mail, Phone, MapPin } from 'lucide-react';

import type { BillingDocument } from '../../../api/subscriptions/SubscriptionTypes';
import { cn } from '../../../../../../shared/utils/classNameUtils';

interface BillingDocumentPreviewProps {
  document: BillingDocument;
  className?: string;
}

const formatMoney = (amount: number, currency: string) =>
  `${currency} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const BillingDocumentPreview = forwardRef<HTMLDivElement, BillingDocumentPreviewProps>(
  function BillingDocumentPreview({ document: doc, className }, ref) {
    const isReceipt = doc.document_type === 'receipt';
    const title = isReceipt ? 'PAYMENT RECEIPT' : 'TAX INVOICE';

    return (
      <div
        ref={ref}
        className={cn(
          'mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm',
          'print:max-w-none print:rounded-none print:border-0 print:shadow-none print:p-0',
          className,
        )}
      >
        <div className="border-b-2 border-blue-600 px-8 pt-8 pb-6 print:px-0">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 print:bg-transparent">
                <Building2 className="h-7 w-7 text-blue-600" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                {doc.issuer.legal_name}
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight">{doc.issuer.product_name}</h1>
              <p className="mt-1 text-sm text-slate-500">{doc.issuer.product_tagline}</p>
              <p className="mt-2 text-xs text-slate-500">{doc.issuer.product_of}</p>
              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {doc.issuer.address_line}
                </p>
                <p className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 shrink-0" />
                  {doc.issuer.website_label}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {doc.document_type_label}
              </p>
              <p className="mt-1 font-mono text-lg font-bold">{doc.document_number}</p>
              <div
                className={cn(
                  'mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                  isReceipt ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900',
                )}
              >
                {doc.status_label}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-center print:bg-blue-600">
            <p className="text-sm font-bold tracking-[0.2em] text-white">{title}</p>
          </div>
        </div>

        <div className="grid gap-6 px-8 py-6 sm:grid-cols-2 print:px-0">
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-4 print:border-slate-200">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Bill to</p>
            <p className="font-bold text-slate-900">{doc.bill_to.facility_name ?? 'Facility'}</p>
            {doc.bill_to.facility_code && (
              <p className="text-xs text-slate-500">Code: {doc.bill_to.facility_code}</p>
            )}
            {doc.bill_to.address && (
              <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-600">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {doc.bill_to.address}
              </p>
            )}
            {doc.bill_to.email && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                <Mail className="h-3.5 w-3.5" />
                {doc.bill_to.email}
              </p>
            )}
            {doc.bill_to.phone && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                <Phone className="h-3.5 w-3.5" />
                {doc.bill_to.phone}
              </p>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-slate-100 py-2">
              <span className="text-slate-500">Issued</span>
              <span className="font-medium">{formatDate(doc.issued_at)}</span>
            </div>
            {!isReceipt && (
              <div className="flex justify-between border-b border-slate-100 py-2">
                <span className="text-slate-500">Due date</span>
                <span className="font-medium">{formatDate(doc.due_at)}</span>
              </div>
            )}
            {isReceipt && (
              <div className="flex justify-between border-b border-slate-100 py-2">
                <span className="text-slate-500">Paid on</span>
                <span className="font-medium">{formatDate(doc.paid_at)}</span>
              </div>
            )}
            {doc.product.plan_name && (
              <div className="flex justify-between border-b border-slate-100 py-2">
                <span className="text-slate-500">Plan</span>
                <span className="font-medium">{doc.product.plan_name}</span>
              </div>
            )}
            {doc.payment?.transaction_reference && (
              <div className="flex justify-between border-b border-slate-100 py-2">
                <span className="text-slate-500">Reference</span>
                <span className="font-mono text-xs font-medium">{doc.payment.transaction_reference}</span>
              </div>
            )}
            {doc.payment?.method_label && (
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Payment method</span>
                <span className="font-medium">{doc.payment.method_label}</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-8 pb-6 print:px-0">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-3 pr-4 font-semibold">Description</th>
                <th className="py-3 pr-4 text-right font-semibold">Qty</th>
                <th className="py-3 pr-4 text-right font-semibold">Unit price</th>
                <th className="py-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {doc.line_items.map((item, index) => (
                <tr key={index} className="border-b border-slate-100">
                  <td className="py-3 pr-4 text-slate-800">{item.description}</td>
                  <td className="py-3 pr-4 text-right text-slate-700">{item.quantity}</td>
                  <td className="py-3 pr-4 text-right text-slate-700">
                    {formatMoney(item.unit_price, doc.currency)}
                  </td>
                  <td className="py-3 text-right font-semibold text-slate-900">
                    {formatMoney(item.total, doc.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatMoney(doc.subtotal, doc.currency)}</span>
              </div>
              {!isReceipt && doc.balance_due > 0.01 && (
                <div className="flex justify-between font-medium text-amber-800">
                  <span>Balance due</span>
                  <span>{formatMoney(doc.balance_due, doc.currency)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                <span>{isReceipt ? 'Amount received' : 'Total due'}</span>
                <span>{formatMoney(isReceipt ? doc.paid_amount : doc.total, doc.currency)}</span>
              </div>
            </div>
          </div>

          {doc.notes && (
            <p className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{doc.notes}</p>
          )}
        </div>

        <div className="border-t border-slate-200 px-8 py-4 text-center text-xs text-slate-400 print:px-0">
          <p>
            {isReceipt
              ? 'Thank you for your payment. This receipt confirms funds received by Custospark Company Ltd for Custocare subscription services.'
              : 'Please remit payment by the due date. Reference the invoice number on your bank transfer.'}
          </p>
          <p className="mt-1">{doc.issuer.website_label}</p>
        </div>
      </div>
    );
  },
);
