import type { BillingReviewItem, ChargeItem } from '../../../medical-records/api/billing-review/BillingReviewTypes';
import type { ReceiptTransactionShape } from '../../../medical-records/ui/revenue/billing-review/components/receipt-view/printable-receipt/ReceiptTypes';

export function invoiceNumberFromBillingItem(item: BillingReviewItem): string {
  return item.receipt_number ? `INV-${item.receipt_number}` : `INV-${item.visit_uuid.slice(0, 8)}`;
}

/** Align charge line keys with printable receipt (same mapping as MRBillingReview). */
export function billingReviewItemToReceiptTransaction(item: BillingReviewItem): ReceiptTransactionShape {
  return {
    ...item,
    created_at: item.billed_at || item.created_at,
    charge_items: (item.charge_items ?? []).map((chargeItem: ChargeItem) => ({
      ...chargeItem,
      service_key:
        chargeItem.service_key ||
        chargeItem.serviceKey ||
        chargeItem.service?.code ||
        chargeItem.id,
    })),
    refunded_items: (item.refunded_items ?? []).map((refundedItem: ChargeItem) => ({
      ...refundedItem,
      refunded: true,
    })),
  };
}
