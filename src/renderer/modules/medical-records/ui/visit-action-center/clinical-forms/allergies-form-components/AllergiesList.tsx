import React from 'react';
import { AllergiesSummaryCard } from './AllergiesSummaryCard';
import type { Allergy } from '../../../../api/allergies/AllergyTypes';
import type { AllergiesThemeTokens } from './allergiesForm.types';

interface AllergiesListProps {
  isDark: boolean;
  colors: AllergiesThemeTokens;
  allergies: Allergy[];
  editingAllergyId: number | null;
  isMutating: boolean;
  onEdit: (allergy: Allergy) => void;
  onDelete: (allergy: Allergy) => void;
  canDelete: (allergy: Allergy) => boolean;
}

export const AllergiesList: React.FC<AllergiesListProps> = ({
  isDark,
  colors,
  allergies,
  editingAllergyId,
  isMutating,
  onEdit,
  onDelete,
  canDelete,
}) => {
  if (allergies.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {allergies.map((allergy) => (
        <AllergiesSummaryCard
          key={allergy.id}
          isDark={isDark}
          colors={colors}
          allergy={allergy}
          isEditing={editingAllergyId === allergy.id}
          isMutating={isMutating}
          canDelete={canDelete(allergy)}
          onEdit={() => onEdit(allergy)}
          onDelete={() => onDelete(allergy)}
        />
      ))}
    </div>
  );
};

export default AllergiesList;