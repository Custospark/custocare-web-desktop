import React from 'react';
import { useSelector } from 'react-redux';
import {
  selectChargeItems,
  selectBillingData,
} from '../billingSlice';
import {
  formatCurrency,
  DEFAULT_TAXES,
} from '../billing-types';

interface ReceiptPreviewProps {
  theme: 'light' | 'dark';
  isReadOnly: boolean;
  status: string;
  receiptNumber: string;
  patientName?: string;
  patientNumber?: string;
  patientId?: number;
  visitId?: number;
  activeVisit?: any;
  discount: { type: 'percentage' | 'fixed'; value: number };
  additionalNotes: string;
  paymentMethods: any[];
  cashChangeByIndex: Record<number, { dueBefore: number; change: number }>;
  focusedAmountInputs: Record<number, boolean>;
  colors: any;
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({
  isReadOnly,
  status,
  receiptNumber,
  patientName,
  patientNumber,
  patientId,
  visitId,
  activeVisit,
  discount,
  additionalNotes,
  paymentMethods,
  cashChangeByIndex,
  focusedAmountInputs,
  colors,
}) => {
  const chargeItems = useSelector(selectChargeItems);
  const billingData = useSelector(selectBillingData);
  const paidMethods = paymentMethods.filter((method) => (Number(method.amount) || 0) > 0);

  return (
    <div
      className={`flex flex-col h-full border ${colors.border.primary} ${colors.bg.primary} rounded-lg shadow-sm overflow-hidden ${
        isReadOnly ? 'opacity-90' : ''
      }`}
    >
      {/* Fixed header */}
      <div className={`flex-shrink-0 px-4 py-3 border-b ${colors.border.primary} ${colors.bg.secondary}`}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <h3 className={`text-sm sm:text-base font-bold ${colors.text.primary}`}>Receipt Preview</h3>
            <p className={`text-xs ${colors.text.secondary} truncate`}>
              {isReadOnly
                ? 'Payment completed - receipt finalized'
                : 'Live updates as you adjust discount, taxes, and payment'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className={`px-2 py-1 rounded-md text-xs font-medium select-none whitespace-nowrap ${
                status === 'draft'
                  ? colors.status.draft
                  : status === 'ready'
                  ? colors.status.ready
                  : colors.status.settled
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </div>
            <div
              className={`text-xs font-semibold px-2.5 py-1 rounded border ${colors.border.primary} ${colors.bg.secondary} ${colors.text.primary}`}
            >
              {receiptNumber ? `# ${receiptNumber}` : '# Pending'}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable receipt */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-h-0"
        style={{ scrollbarGutter: 'stable' }}
      >
        <div className="mx-auto w-full max-w-[360px] sm:max-w-[420px]">
          <div
            className={`border ${colors.border.receipt} bg-white text-black p-4 sm:p-5 rounded shadow-md`}
          >
            {/* Receipt Header */}
            <div className="text-center mb-4">
              <h2 className="text-lg sm:text-xl font-extrabold leading-tight">MEDICAL CLINIC</h2>
              <p className="text-xs text-gray-600 mt-1">123 Health Street, Kampala</p>
              <p className="text-xs text-gray-600">Phone: +256 700 000 000</p>
            </div>

            {/* Patient Info */}
            {patientName && (
              <div className="border-t border-b border-gray-300 py-2 my-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Patient:</span>
                  <span className="font-bold">{patientName}</span>
                </div>
                {patientNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Patient #:</span>
                    <span className="font-bold">{patientNumber}</span>
                  </div>
                )}
                {patientId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Patient ID:</span>
                    <span className="font-bold">{patientId}</span>
                  </div>
                )}
                {visitId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Visit ID:</span>
                    <span className="font-bold">{visitId}</span>
                  </div>
                )}
                {activeVisit?.visit_uuid && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Visit UUID:</span>
                    <span className="font-mono text-[10px]">{activeVisit.visit_uuid.slice(0, 8)}...</span>
                  </div>
                )}
              </div>
            )}

            {/* Receipt Meta */}
            <div className="border-t border-b border-gray-300 py-2 my-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Receipt:</span>
                <span className="font-bold">{receiptNumber || 'Pending'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Services */}
            <div className="mb-3">
              <h3 className="text-sm font-extrabold mb-2">Services Rendered</h3>
              {chargeItems.length === 0 ? (
                <div className="text-xs text-gray-600 italic py-2">No items added yet</div>
              ) : (
                <div className="space-y-2">
                  {chargeItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs border-b border-gray-100 pb-1.5">
                      <div className="min-w-0 pr-2 flex-1">
                        <p className="font-semibold truncate">{item.service.name}</p>
                        <p className="text-[11px] text-gray-600">
                          {item.quantity} × {formatCurrency(item.service.unitPrice)}
                        </p>
                      </div>
                      <span className="font-extrabold flex-shrink-0">{formatCurrency(item.totalAmount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="border-t border-gray-300 pt-2 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold">{formatCurrency(billingData.subtotal)}</span>
              </div>

              {discount.value > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount</span>
                  <span className="font-semibold">-{formatCurrency(billingData.discountAmount)}</span>
                </div>
              )}

              {DEFAULT_TAXES.map((tax, index) => (
                <div key={index} className="flex justify-between">
                  <span>{tax.name}</span>
                  <span className="font-semibold">{formatCurrency(billingData.taxes[index]?.amount || 0)}</span>
                </div>
              ))}

              <div className="flex justify-between font-extrabold text-sm mt-2 pt-2 border-t border-gray-300">
                <span>TOTAL</span>
                <span>{formatCurrency(billingData.grandTotal)}</span>
              </div>

              <div className="flex justify-between mt-2">
                <span className="text-gray-600">Status</span>
                <span
                  className={`font-extrabold ${
                    isReadOnly
                      ? 'text-blue-700'
                      : billingData.balance === 0
                      ? 'text-green-700'
                      : 'text-yellow-700'
                  }`}
                >
                  {isReadOnly ? 'SETTLED' : billingData.balance === 0 ? 'PAID' : `DUE ${formatCurrency(billingData.balance)}`}
                </span>
              </div>
            </div>

            {/* Payment */}
            <div className="mt-3 pt-3 border-t border-gray-300 text-xs">
              <h3 className="text-sm font-extrabold mb-2">Payment</h3>

              {paidMethods.length === 0 ? (
                <div className="text-xs text-gray-600 italic">No payments entered</div>
              ) : (
                <div className="space-y-1.5">
                  {paidMethods.map((method, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="capitalize">{method.type}</span>
                      <span className="font-semibold">{formatCurrency(method.amount)}</span>
                    </div>
                  ))}

                  {paymentMethods.map((method, index) => {
                    if (method.type !== 'cash') return null;
                    const cashCalculation = cashChangeByIndex[index];
                    if (!cashCalculation) return null;

                    const tendered = Number(method.amount) || 0;
                    if (!focusedAmountInputs[index] && tendered === 0) return null;

                    return (
                      <div key={`cash-change-${index}`} className="pt-2 mt-2 border-t border-gray-200 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cash due</span>
                          <span className="font-semibold">{formatCurrency(cashCalculation.dueBefore)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cash tendered</span>
                          <span className="font-semibold">{formatCurrency(tendered)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Change</span>
                          <span className="font-extrabold">{formatCurrency(cashCalculation.change)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Additional Notes in Receipt */}
            {additionalNotes && (
              <div className="mt-3 pt-3 border-t border-gray-300 text-xs">
                <h3 className="text-sm font-extrabold mb-2">Notes</h3>
                <p className="text-gray-600">{additionalNotes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="text-center mt-4 pt-3 border-t border-gray-300">
              <p className="text-[11px] text-gray-600">Computer generated receipt</p>
              <p className="text-[11px] text-gray-600">Valid without signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};