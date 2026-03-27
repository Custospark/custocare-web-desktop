import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Receipt, ShoppingCart, Database, FilePlus2 } from 'lucide-react';
import { type RootState } from '../../../../../app/store/rootReducer';
import {
  selectActivePatient,
  selectActiveVisit,
} from '../../../../../app/store/slices/visitSlice';
import {
  openTray,
  selectRenderableChargeItems,
  selectDisplayBillingData,
  selectEffectiveBillingStatus,
  hydrateBackendBilling,
  clearBackendBilling,
} from './billingSlice';
import { formatCurrency } from './billing-types';
import { useGetBillingByVisit } from '../../../api/billable-items/BillableItemsQueries';

interface BillingBottomDisplayProps {
  theme?: 'light' | 'dark';
}

export const BillingBottomDisplay: React.FC<BillingBottomDisplayProps> = ({ theme = 'light' }) => {
  const dispatch = useDispatch();
  const isDark = theme === 'dark';

  const patient = useSelector((state: RootState) => selectActivePatient(state));
  const activeVisit = useSelector((state: RootState) => selectActiveVisit(state));

  const renderableChargeItems = useSelector(selectRenderableChargeItems);
  const displayBillingData = useSelector(selectDisplayBillingData);
  const billingStatus = useSelector(selectEffectiveBillingStatus);

  const visitId = activeVisit?.visit_id ? Number(activeVisit.visit_id) : 0;
  const patientId = activeVisit?.patient_id ? String(activeVisit.patient_id) : undefined;
  const patientName = patient?.name || activeVisit?.patient?.name || 'Unknown Patient';

  const { data: backendBillingResponse } = useGetBillingByVisit(visitId, {
    enabled: !!visitId,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!backendBillingResponse?.data) return;

    if (backendBillingResponse.data.has_billing) {
      dispatch(hydrateBackendBilling(backendBillingResponse.data));
    } else {
      dispatch(clearBackendBilling());
    }
  }, [backendBillingResponse, dispatch]);

  if (!activeVisit?.visit_id) {
    return null;
  }

  const statusLabel = (() => {
    switch (billingStatus) {
      case 'ready':
        return 'Ready';
      case 'settled':
        return 'Settled';
      case 'draft':
      default:
        return 'Draft';
    }
  })();

  const itemsCount = renderableChargeItems.length;
  const subtotal = displayBillingData.displayedSubtotal;
  const totalDue = displayBillingData.displayedBalance;

  const persistedCount = renderableChargeItems.filter((item) => item.source === 'backend').length;
  const draftCount = renderableChargeItems.filter((item) => item.source === 'slice').length;

  const getPatientInitial = () => {
    if (!patientName || typeof patientName !== 'string' || patientName.trim() === '') {
      return 'P';
    }

    const firstChar = patientName.trim().charAt(0).toUpperCase();
    return /[A-Z]/i.test(firstChar) ? firstChar : 'P';
  };

  const colors = {
    bg: isDark ? 'bg-gray-800' : 'bg-white',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
    },
    button: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      disabled: isDark
        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
        : 'bg-gray-300 text-gray-500 cursor-not-allowed',
    },
    source: {
      persisted: isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-50 text-amber-700',
      draft: isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700',
    },
  };

  const summaryEnabled = itemsCount > 0;

  return (
    <div className={`fixed bottom-4 right-4 z-30 ${colors.bg} ${colors.border} border rounded-xl shadow-2xl p-4 max-w-sm`}>
      {/* Patient Info */}
      <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
              {getPatientInitial()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`font-medium text-sm truncate ${colors.text.primary}`}
              title={patientName}
            >
              {patientName}
            </p>
            <p className={`text-xs ${colors.text.secondary}`}>
              {patient?.patient_number ? `Patient Number: ${patient.patient_number}` : 'No Number'}
            </p>
          </div>
        </div>
      </div>

      {/* Source badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {persistedCount > 0 && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.source.persisted}`}>
            <Database className="w-3 h-3" />
            {persistedCount} Saved
          </span>
        )}
        {draftCount > 0 && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors.source.draft}`}>
            <FilePlus2 className="w-3 h-3" />
            {draftCount} draft
          </span>
        )}
      </div>

      {/* Indicators */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <p className={`text-xs ${colors.text.secondary}`}>Items</p>
          <p className={`text-lg font-bold ${colors.text.primary}`}>
            {itemsCount}
          </p>
        </div>

        <div className="text-center">
          <p className={`text-xs ${colors.text.secondary}`}>Subtotal</p>
          <p
            className={`text-sm font-bold ${colors.text.primary} truncate`}
            title={formatCurrency(subtotal)}
          >
            {formatCurrency(subtotal)}
          </p>
        </div>

        <div className="text-center">
          <p className={`text-xs ${colors.text.secondary}`}>Status</p>
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-medium truncate max-w-full ${
              statusLabel === 'Ready'
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : statusLabel === 'Settled'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
            title={statusLabel}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Amount due */}
      <div className="mb-3 text-center">
        <p className={`text-xs ${colors.text.secondary}`}>Total Due</p>
        <p className={`text-base font-bold ${colors.text.primary}`}>
          {formatCurrency(totalDue)}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            dispatch(
              openTray({
                step: 'charge_entry',
                visitId: String(activeVisit.visit_id),
                patientId,
                patientName,
              })
            );
          }}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${colors.button.primary}`}
          title="Open charge entry"
        >
          <ShoppingCart className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Enter Charges</span>
        </button>

        <button
          onClick={() => {
            if (!summaryEnabled) return;

            dispatch(
              openTray({
                step: 'billing_summary',
                visitId: String(activeVisit.visit_id),
                patientId,
                patientName,
              })
            );
          }}
          disabled={!summaryEnabled}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
            summaryEnabled ? colors.button.primary : colors.button.disabled
          }`}
          title={summaryEnabled ? 'Open billing summary' : 'No billing items to review'}
        >
          <Receipt className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Review & Bill</span>
        </button>
      </div>

      <div className="sr-only" aria-live="polite">
        Billing space loaded for visit {activeVisit?.visit_id}
      </div>
    </div>
  );
};

export default BillingBottomDisplay;
