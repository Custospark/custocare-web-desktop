import React from 'react';

import type { LabTemplate, LabTest } from '../../../../api/lab/LabTypes';

import LabRequestItemEditorModal from './LabRequestItemEditorModal';
import type {
  ColorTokens,
  LabRequestDraftItem,
  LabRequestItemEditorData,
} from './labRequestForm.types';

interface LabRequestItemEditorControllerProps {
  open: boolean;
  isDark: boolean;
  colors: ColorTokens;
  editingItem: LabRequestDraftItem | null;
  formData: LabRequestItemEditorData;
  isMutating: boolean;
  templates: LabTemplate[];
  labItems: LabTest[];
  popularLabItems: LabTest[];
  onClose: () => void;
  onChange: (
    field: keyof LabRequestItemEditorData,
    value: string | number | boolean | null
  ) => void;
  onOpenTemplateManager: () => Promise<void> | void;
  onOpenLabItemManager: () => Promise<void> | void;
  onSubmit: () => Promise<void> | void;
}

export const LabRequestItemEditorController: React.FC<
  LabRequestItemEditorControllerProps
> = ({
  open,
  isDark,
  colors,
  editingItem,
  formData,
  isMutating,
  templates,
  labItems,
  popularLabItems,
  onClose,
  onChange,
  onOpenTemplateManager,
  onOpenLabItemManager,
  onSubmit,
}) => {
  return (
    <LabRequestItemEditorModal
      open={open}
      isDark={isDark}
      colors={colors}
      editingItem={editingItem}
      formData={formData}
      isMutating={isMutating}
      templates={templates}
      labItems={labItems}
      popularLabItems={popularLabItems}
      onClose={onClose}
      onChange={onChange}
      onOpenTemplateManager={onOpenTemplateManager}
      onOpenLabItemManager={onOpenLabItemManager}
      onSubmit={onSubmit}
    />
  );
};