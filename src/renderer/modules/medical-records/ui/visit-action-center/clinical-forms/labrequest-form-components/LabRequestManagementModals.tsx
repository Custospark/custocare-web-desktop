import React, { useEffect, useMemo } from 'react';

import type { LabTemplate, LabTest } from '../../../../api/lab/LabTypes';

import LabTemplateSelectorModal from './LabTemplateSelectorModal';
import LabTemplateManagerModal from './LabTemplateManagerModal';
import LabTemplateFieldManagerModal from './LabTemplateFieldManagerModal';
import LabItemManagerModal from './LabItemManagerModal';
import type {
  ColorTokens,
  LabTemplateSelectionResult,
} from './labRequestForm.types';

interface LabRequestManagementModalsProps {
  openTemplateSelector: boolean;
  openTemplateManager: boolean;
  openTemplateFieldManager: boolean;
  openLabItemManager: boolean;
  isDark: boolean;
  colors: ColorTokens;
  templates: LabTemplate[];
  labItems: LabTest[];
  popularLabItems: LabTest[];
  selectedTemplateUuid: string | null;
  selectedLabItemUuid: string | null;
  onSelectTemplateUuid: (value: string | null) => void;
  onSelectLabItemUuid: (value: string | null) => void;
  onCloseTemplateSelector: () => void;
  onCloseTemplateManager: () => Promise<void> | void;
  onCloseTemplateFieldManager: () => Promise<void> | void;
  onCloseLabItemManager: () => Promise<void> | void;
  onApplyTemplate: (selection: LabTemplateSelectionResult) => Promise<void> | void;
  onOpenTemplateManager: () => Promise<void> | void;
  onOpenLabItemManager: () => Promise<void> | void;
  onOpenTemplateFieldManager: (template: LabTemplate) => void;
}

export const LabRequestManagementModals: React.FC<
  LabRequestManagementModalsProps
> = ({
  openTemplateSelector,
  openTemplateManager,
  openTemplateFieldManager,
  openLabItemManager,
  isDark,
  colors,
  templates,
  labItems,
  popularLabItems,
  selectedTemplateUuid,
  selectedLabItemUuid,
  onSelectTemplateUuid,
  onSelectLabItemUuid,
  onCloseTemplateSelector,
  onCloseTemplateManager,
  onCloseTemplateFieldManager,
  onCloseLabItemManager,
  onApplyTemplate,
  onOpenTemplateManager,
  onOpenLabItemManager,
  onOpenTemplateFieldManager,
}) => {
  useEffect(() => {
    if (
      selectedTemplateUuid &&
      !templates.some((template) => template.template_uuid === selectedTemplateUuid)
    ) {
      onSelectTemplateUuid(null);
    }
  }, [onSelectTemplateUuid, selectedTemplateUuid, templates]);

  useEffect(() => {
    if (
      selectedLabItemUuid &&
      !labItems.some((item) => item.test_uuid === selectedLabItemUuid)
    ) {
      onSelectLabItemUuid(null);
    }
  }, [labItems, onSelectLabItemUuid, selectedLabItemUuid]);

  useEffect(() => {
    if (
      (openTemplateManager || openTemplateFieldManager) &&
      !selectedTemplateUuid &&
      templates.length > 0
    ) {
      onSelectTemplateUuid(templates[0].template_uuid);
    }
  }, [
    onSelectTemplateUuid,
    openTemplateFieldManager,
    openTemplateManager,
    selectedTemplateUuid,
    templates,
  ]);

  useEffect(() => {
    if (openLabItemManager && !selectedLabItemUuid && labItems.length > 0) {
      onSelectLabItemUuid(labItems[0].test_uuid);
    }
  }, [labItems, onSelectLabItemUuid, openLabItemManager, selectedLabItemUuid]);

    const selectedTemplateForManagement = useMemo(() => {
      const safeTemplates = Array.isArray(templates) ? templates : [];

      return (
        safeTemplates.find(
          (template) => template.template_uuid === selectedTemplateUuid
        ) || null
      );
    }, [templates, selectedTemplateUuid]);

    const selectedLabItemForManagement = useMemo(() => {
      const safeLabItems = Array.isArray(labItems) ? labItems : [];

      return (
        safeLabItems.find(
          (item) => item.test_uuid === selectedLabItemUuid
        ) || null
      );
    }, [labItems, selectedLabItemUuid]);

  return (
    <>
      <LabTemplateSelectorModal
        open={openTemplateSelector}
        isDark={isDark}
        colors={colors}
        templates={templates}
        labItems={labItems}
        onClose={onCloseTemplateSelector}
        onApplyTemplate={onApplyTemplate}
        onManageTemplates={onOpenTemplateManager}
        onManageTemplateFields={(template) => {
          onSelectTemplateUuid(template.template_uuid);
          onOpenTemplateFieldManager(template);
        }}
        onManageLabItems={onOpenLabItemManager}
      />

      <LabTemplateManagerModal
        open={openTemplateManager}
        isDark={isDark}
        colors={colors}
        selectedTemplate={selectedTemplateForManagement}
        templates={templates}
        onClose={onCloseTemplateManager}
        onSelectTemplate={(template) =>
          onSelectTemplateUuid(template?.template_uuid ?? null)
        }
        onManageFields={(template) => {
          onSelectTemplateUuid(template.template_uuid);
          onOpenTemplateFieldManager(template);
        }}
      />

      <LabTemplateFieldManagerModal
        open={openTemplateFieldManager}
        isDark={isDark}
        colors={colors}
        selectedTemplate={selectedTemplateForManagement}
        templates={templates}
        onClose={onCloseTemplateFieldManager}
        onSelectTemplate={(template) =>
          onSelectTemplateUuid(template?.template_uuid ?? null)
        }
      />

      <LabItemManagerModal
        open={openLabItemManager}
        isDark={isDark}
        colors={colors}
        selectedLabItem={selectedLabItemForManagement}
        templates={templates}
        labItems={labItems}
        popularLabItems={popularLabItems}
        onClose={onCloseLabItemManager}
        onSelectLabItem={(item) => onSelectLabItemUuid(item?.test_uuid ?? null)}
      />
    </>
  );
};