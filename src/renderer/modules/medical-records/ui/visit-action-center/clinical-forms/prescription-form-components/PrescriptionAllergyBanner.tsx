import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import { AllergySeverity } from '../../../../api/allergies/AllergyTypes';
import type { AllergyLike, ColorTokens } from './prescriptionForm.types';

interface PrescriptionAllergyBannerProps {
  allergies: AllergyLike[];
  isDark: boolean;
  colors: ColorTokens;
}

export const PrescriptionAllergyBanner: React.FC<PrescriptionAllergyBannerProps> = ({
  allergies,
  isDark,
}) => {
  if (!allergies.length) return null;

  return (
    <div
      className={cn(
        'mb-6 rounded-lg border p-3',
        isDark ? 'border-yellow-800/50 bg-yellow-900/20' : 'border-yellow-200 bg-yellow-50'
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className={cn('h-5 w-5 flex-shrink-0', isDark ? 'text-yellow-400' : 'text-yellow-600')} />

        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-medium', isDark ? 'text-yellow-300' : 'text-yellow-800')}>
            Patient Allergies
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {allergies.map((allergy) => {
              const isSevere = allergy.severity === AllergySeverity.SEVERE;

              return (
                <span
                  key={allergy.id}
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    isSevere
                      ? isDark
                        ? 'bg-red-900/50 text-red-300'
                        : 'bg-red-100 text-red-700'
                      : isDark
                        ? 'bg-yellow-900/50 text-yellow-300'
                        : 'bg-yellow-100 text-yellow-700'
                  )}
                >
                  {allergy.allergen} ({allergy.severity})
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionAllergyBanner;
