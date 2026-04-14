import React from 'react';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

import type { ForwardPatientColors } from './constants';

export interface ServicesDecisionSectionProps {
  shouldHideServicesQuestion: boolean;
  hasProvidedServices: boolean | null;
  handleServicesChoice: (value: boolean) => void;
  colors: ForwardPatientColors;
  isFetchingBillableItems: boolean;
  servicesDecisionError: string | null;
}

export const ServicesDecisionSection: React.FC<ServicesDecisionSectionProps> = ({
  shouldHideServicesQuestion,
  hasProvidedServices,
  handleServicesChoice,
  colors,
  isFetchingBillableItems,
  servicesDecisionError,
}) => {
  if (shouldHideServicesQuestion) {
    return (
      <div
        className={`p-4 rounded-lg border ${colors.border.primary} ${colors.bg.secondary}`}
      >
        <p className={`text-sm ${colors.text.secondary}`}>
          Charges were already indicated for this patient. Continue to billing to add
          services/items before forwarding.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-lg border ${colors.border.primary} ${colors.bg.secondary}`}
    >
      <label className={`block text-sm font-medium mb-3 ${colors.text.secondary}`}>
        Did you provide any services or items to this patient?{' '}
        <span className="text-red-500">*</span>
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handleServicesChoice(true)}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
            hasProvidedServices === true
              ? 'bg-blue-600 text-white border-blue-600'
              : `${colors.bg.primary} ${colors.border.primary} ${colors.text.secondary}`
          }`}
        >
          Yes, add charges before forwarding
        </button>

        <button
          type="button"
          onClick={() => handleServicesChoice(false)}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
            hasProvidedServices === false
              ? 'bg-green-600 text-white border-green-600'
              : `${colors.bg.primary} ${colors.border.primary} ${colors.text.secondary}`
          }`}
        >
          No, just forward patient
        </button>
      </div>

      <p className={`mt-3 text-xs ${colors.text.tertiary}`}>
        If you provided services or dispensed items, we will open charge entry and keep
        the forwarding details for completion after billing.
      </p>

      {hasProvidedServices === true && (
        <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
          {isFetchingBillableItems ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Preparing billing items...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Billing handoff is ready.</span>
            </>
          )}
        </div>
      )}

      {servicesDecisionError && (
        <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {servicesDecisionError}
        </p>
      )}
    </div>
  );
};
