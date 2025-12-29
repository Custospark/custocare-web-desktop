import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import { AllergyWarning } from '../Typography/SpecializedText';

interface AllergyTagProps {
  allergen: string;
  severity?: 'mild' | 'moderate' | 'severe';
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * AllergyTag Component
 * 
 * High-visibility, responsive tag for patient allergies
 * 
 * Usage:
 * <AllergyTag allergen="Penicillin" severity="severe" />
 * <AllergyTag allergen="Latex" severity="moderate" size="large" />
 */
const AllergyTag: React.FC<AllergyTagProps> = ({
  allergen,
  severity = 'severe',
  className = '',
  size = 'medium'
}) => {
  const severityStyles: Record<string, string> = {
    mild: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    moderate: 'bg-orange-200 text-orange-900 border-orange-400',
    severe: 'bg-red-600 text-white border-red-700',
  };

  const sizeStyles: Record<string, string> = {
    small: 'px-2 py-1 text-xs gap-4',
    medium: 'px-3 py-2 text-sm gap-6',
    large: 'px-4 py-3 text-base gap-8',
  };

  return (
    <div
      className={`inline-flex items-center rounded-md border-2 ${severityStyles[severity]} ${sizeStyles[size]} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <FaExclamationTriangle className={`flex-shrink-0 w-4 h-4 md:w-6 md:h-6`} />
      <AllergyWarning className={`${severity === 'severe' ? 'text-white' : ''} truncate`}>
        Allergy: {allergen}
      </AllergyWarning>
    </div>
  );
};

export default AllergyTag;
