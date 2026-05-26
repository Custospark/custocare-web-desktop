import type { BillingDocument } from '../../../api/subscriptions/SubscriptionTypes';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

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

export const buildBillingDocumentHtml = (doc: BillingDocument): string => {
  const isReceipt = doc.document_type === 'receipt';
  const title = isReceipt ? 'PAYMENT RECEIPT' : 'TAX INVOICE';

  const rows = doc.line_items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">${escapeHtml(item.description)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;">${formatMoney(item.unit_price, doc.currency)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:600;">${formatMoney(item.total, doc.currency)}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(doc.document_type_label)} - ${escapeHtml(doc.document_number)}</title>
  <style>
    @page { margin: 18mm; }
    body { font-family: Inter, system-ui, sans-serif; color: #111827; max-width: 800px; margin: 0 auto; }
    .banner { background: linear-gradient(90deg, #2563eb, #4f46e5); color: #fff; text-align: center; padding: 12px; font-weight: 700; letter-spacing: 0.15em; font-size: 13px; margin: 24px 0; border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    th { text-align: left; padding: 8px 12px; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 11px; text-transform: uppercase; }
    .totals { margin-top: 24px; text-align: right; font-size: 14px; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div style="border-bottom:2px solid #2563eb;padding-bottom:20px;margin-bottom:24px;">
    <p style="color:#2563eb;font-size:11px;font-weight:600;letter-spacing:0.1em;margin:0;">${escapeHtml(doc.issuer.legal_name)}</p>
    <h1 style="margin:4px 0;font-size:24px;">${escapeHtml(doc.issuer.product_name)}</h1>
    <p style="color:#6b7280;font-size:13px;margin:0;">${escapeHtml(doc.issuer.product_tagline)}</p>
    <p style="color:#6b7280;font-size:11px;margin:8px 0 0;">${escapeHtml(doc.issuer.product_of)}</p>
    <p style="font-size:12px;color:#4b5563;margin:8px 0 0;">${escapeHtml(doc.issuer.address_line)} · ${escapeHtml(doc.issuer.website_label)}</p>
    <div style="text-align:right;margin-top:-80px;">
      <p style="font-size:11px;color:#6b7280;margin:0;">${escapeHtml(doc.document_type_label)}</p>
      <p style="font-family:monospace;font-size:18px;font-weight:700;margin:4px 0;">${escapeHtml(doc.document_number)}</p>
      <p style="display:inline-block;background:#fef3c7;color:#92400e;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:600;">${escapeHtml(doc.status_label)}</p>
    </div>
  </div>
  <div class="banner">${title}</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
    <div style="background:#f9fafb;padding:16px;border-radius:8px;">
      <p style="font-size:11px;font-weight:700;color:#6b7280;margin:0 0 8px;">BILL TO</p>
      <p style="font-weight:700;margin:0;">${escapeHtml(doc.bill_to.facility_name ?? '')}</p>
      ${doc.bill_to.facility_code ? `<p style="font-size:11px;color:#6b7280;">Code: ${escapeHtml(doc.bill_to.facility_code)}</p>` : ''}
      ${doc.bill_to.address ? `<p style="font-size:11px;margin-top:8px;">${escapeHtml(doc.bill_to.address)}</p>` : ''}
    </div>
    <div style="font-size:13px;">
      <p><span style="color:#6b7280;">Issued:</span> <strong>${formatDate(doc.issued_at)}</strong></p>
      ${!isReceipt ? `<p><span style="color:#6b7280;">Due:</span> <strong>${formatDate(doc.due_at)}</strong></p>` : ''}
      ${isReceipt ? `<p><span style="color:#6b7280;">Paid:</span> <strong>${formatDate(doc.paid_at)}</strong></p>` : ''}
      ${doc.product.plan_name ? `<p><span style="color:#6b7280;">Plan:</span> <strong>${escapeHtml(doc.product.plan_name)}</strong></p>` : ''}
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align:right;">Qty</th>
        <th style="text-align:right;">Unit</th>
        <th style="text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <p>Subtotal: <strong>${formatMoney(doc.subtotal, doc.currency)}</strong></p>
  <p style="font-size:18px;margin-top:8px;">${isReceipt ? 'Amount received' : 'Total due'}: <strong>${formatMoney(isReceipt ? doc.paid_amount : doc.total, doc.currency)}</strong></p>
  </div>
  <div class="footer">
    <p>${isReceipt ? 'Payment received by Custospark Company Ltd for Custocare subscription services.' : 'Please pay by the due date and reference the invoice number.'}</p>
  </div>
</body>
</html>`;
};

export const printBillingDocument = (doc: BillingDocument): void => {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(buildBillingDocumentHtml(doc));
  win.document.close();
  win.focus();
  win.print();
};

export const downloadBillingDocumentHtml = (doc: BillingDocument): void => {
  const html = buildBillingDocumentHtml(doc);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${doc.document_number}.html`;
  link.click();
  URL.revokeObjectURL(url);
};
