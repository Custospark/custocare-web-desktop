// components/TaxesSection.tsx
import React from 'react';
import {
  formatCurrency,
  DEFAULT_TAXES,
} from '../billing-types';

interface TaxesSectionProps {
  theme: 'light' | 'dark';
  isReadOnly: boolean;
  billingData: any;
  additionalNotes: string;
  onAdditionalNotesChange: (notes: string) => void;
  colors: any;
}

export const TaxesSection: React.FC<TaxesSectionProps> = ({
  isReadOnly,
  billingData,
  additionalNotes,
  onAdditionalNotesChange,
  colors,
}) => {
  return (
    <div className={`flex-shrink-0 border-t ${colors.border.primary} ${colors.bg.secondary}`}>
      {/* Additional Notes */}
      <div className="px-4 py-3">
        <label className={`block text-sm font-bold mb-1 ${colors.text.primary}`}>
          Additional Notes <span className={`text-xs font-normal ${colors.text.secondary}`}>(optional)</span>
        </label>

        <textarea
          value={additionalNotes}
          onChange={(e) => onAdditionalNotesChange(e.target.value)}
          placeholder="E.g. patient paid in two installments, waived consultation fee…"
          rows={2}
          readOnly={isReadOnly}
          disabled={isReadOnly}
          className={`w-full px-3 py-2 text-sm border ${
            isReadOnly
              ? `${colors.border.disabled} ${colors.bg.disabled} ${colors.text.disabled} cursor-not-allowed`
              : `${colors.border.primary} ${colors.bg.primary} ${colors.text.primary} focus:outline-none focus:ring-2 ${colors.accent.ring}`
          } rounded-lg transition-shadow resize-none`}
        />
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className={`text-sm font-bold ${colors.text.primary}`}>Taxes</div>
          <div className={`text-xs ${colors.text.secondary}`}>Auto-calculated</div>
        </div>

        <div className="space-y-2">
          {DEFAULT_TAXES.map((tax, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3 border ${colors.border.primary} ${colors.bg.primary} rounded-lg ${
                isReadOnly ? 'opacity-75' : ''
              }`}
            >
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${colors.text.primary}`}>{tax.name}</p>
                <p className={`text-xs ${colors.text.secondary}`}>{tax.rate}% rate</p>
              </div>
              <p className={`text-sm font-extrabold ${colors.text.primary}`}>
                {formatCurrency(billingData.taxes[idx]?.amount || 0)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};