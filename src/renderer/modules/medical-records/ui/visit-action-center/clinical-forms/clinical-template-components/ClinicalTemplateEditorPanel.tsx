import React from 'react';
import { Activity, FileText, FolderOpen, RefreshCw, Save, Tag, X, Eye, Plus } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import {
  TemplateCategory,
  TemplateVisibility,
  type TemplateMedicationItem,
} from '../../../../api/clinical-templates/ClinicalTemplateTypes';
import { ClinicalTemplateMedicationTable } from './ClinicalTemplateMedicationTable';

interface ClinicalTemplateEditorPanelProps {
  isDark: boolean;
  colors: {
    bg: {
      card: string;
      input: string;
      subtle: string;
      hover: string;
    };
    text: {
      primary: string;
      secondary: string;
      brand: string;
    };
    border: {
      primary: string;
      focus: string;
    };
  };
  isEditing: boolean;
  formData: {
    name: string;
    description: string;
    category: TemplateCategory;
    visibility: TemplateVisibility;
    default_diagnosis: string;
    default_notes: string;
    patient_instructions: string;
  };
  medications: TemplateMedicationItem[];
  isMutating: boolean;
  onFormChange: (
    field:
      | 'name'
      | 'description'
      | 'category'
      | 'visibility'
      | 'default_diagnosis'
      | 'default_notes'
      | 'patient_instructions',
    value: string | TemplateCategory | TemplateVisibility
  ) => void;
  onOpenMedicationModal: () => void;
  onEditMedication: (index: number) => void;
  onDeleteMedication: (index: number) => void;
  onReset: () => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const RequiredLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <label className={className}>
    {children} <span className="text-red-500">*</span>
  </label>
);

export const ClinicalTemplateEditorPanel: React.FC<ClinicalTemplateEditorPanelProps> = ({
  isDark,
  colors,
  isEditing,
  formData,
  medications,
  isMutating,
  onFormChange,
  onOpenMedicationModal,
  onEditMedication,
  onDeleteMedication,
  onReset,
  onClose,
  onSubmit,
}) => {
  return (
    <div className={cn('rounded-2xl border p-5', colors.border.primary, colors.bg.card)}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className={cn('text-base font-semibold', colors.text.primary)}>
            {isEditing ? 'Edit Template' : 'Create Clinical Template'}
          </h3>
          <p className={cn('text-sm', colors.text.secondary)}>
            Fill in template details and medications
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={cn(
            'inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
            colors.bg.hover,
            colors.text.secondary
          )}
        >
          <X className="h-4 w-4" />
          Close
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <RequiredLabel
            className={cn('mb-2 flex items-center gap-2 text-sm font-medium', colors.text.primary)}
          >
            <Tag className="h-4 w-4" />
            Template Name
          </RequiredLabel>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onFormChange('name', e.target.value)}
            placeholder="e.g., Hypertension Protocol, Diabetes Management"
            className={cn(
              'w-full cursor-text rounded-lg border p-3 text-sm outline-none transition-all',
              colors.bg.input,
              colors.text.primary,
              colors.border.primary,
              colors.border.focus
            )}
            required
            autoFocus
          />
        </div>

        <div>
          <label className={cn('mb-2 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
            <FileText className="h-4 w-4" />
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => onFormChange('description', e.target.value)}
            placeholder="Brief description of when to use this template..."
            rows={2}
            className={cn(
              'w-full cursor-text resize-y rounded-lg border p-3 text-sm outline-none transition-all',
              colors.bg.input,
              colors.text.primary,
              colors.border.primary,
              colors.border.focus
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={cn('mb-2 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
              <FolderOpen className="h-4 w-4" />
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => onFormChange('category', e.target.value as TemplateCategory)}
              className={cn(
                'w-full cursor-pointer rounded-lg border p-3 text-sm outline-none transition-all',
                colors.bg.input,
                colors.text.primary,
                colors.border.primary,
                colors.border.focus
              )}
            >
              {Object.values(TemplateCategory).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={cn('mb-2 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
              <Eye className="h-4 w-4" />
              Visibility
            </label>
            <select
              value={formData.visibility}
              onChange={(e) => onFormChange('visibility', e.target.value as TemplateVisibility)}
              className={cn(
                'w-full cursor-pointer rounded-lg border p-3 text-sm outline-none transition-all',
                colors.bg.input,
                colors.text.primary,
                colors.border.primary,
                colors.border.focus
              )}
            >
              {Object.values(TemplateVisibility).map((vis) => (
                <option key={vis} value={vis}>
                  {vis}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={cn('mb-2 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
            <FileText className="h-4 w-4" />
            Default Diagnosis
          </label>
          <textarea
            value={formData.default_diagnosis}
            onChange={(e) => onFormChange('default_diagnosis', e.target.value)}
            placeholder="e.g., Essential Hypertension, Type 2 Diabetes Mellitus"
            rows={2}
            className={cn(
              'w-full cursor-text resize-y rounded-lg border p-3 text-sm outline-none transition-all',
              colors.bg.input,
              colors.text.primary,
              colors.border.primary,
              colors.border.focus
            )}
          />
        </div>

        <div>
          <label className={cn('mb-2 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
            <FileText className="h-4 w-4" />
            Default Clinical Notes
          </label>
          <textarea
            value={formData.default_notes}
            onChange={(e) => onFormChange('default_notes', e.target.value)}
            placeholder="Standard notes that will be added to the prescription..."
            rows={3}
            className={cn(
              'w-full cursor-text resize-y rounded-lg border p-3 text-sm outline-none transition-all',
              colors.bg.input,
              colors.text.primary,
              colors.border.primary,
              colors.border.focus
            )}
          />
        </div>

        <div>
          <label className={cn('mb-2 flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
            <FileText className="h-4 w-4" />
            Patient Instructions
          </label>
          <textarea
            value={formData.patient_instructions}
            onChange={(e) => onFormChange('patient_instructions', e.target.value)}
            placeholder="Instructions to be printed on prescription for the patient..."
            rows={2}
            className={cn(
              'w-full cursor-text resize-y rounded-lg border p-3 text-sm outline-none transition-all',
              colors.bg.input,
              colors.text.primary,
              colors.border.primary,
              colors.border.focus
            )}
          />
        </div>

        <div className="pt-2">
          <div className="mb-3 flex items-center justify-between">
            <label className={cn('flex items-center gap-2 text-sm font-medium', colors.text.primary)}>
              <Activity className="h-4 w-4" />
              Medications
            </label>

            <button
              type="button"
              onClick={onOpenMedicationModal}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                colors.bg.hover,
                colors.text.brand
              )}
            >
              <Plus className="h-4 w-4" />
              Add Medication
            </button>
          </div>

         <ClinicalTemplateMedicationTable
            isDark={isDark}
            colors={{
                bg: {
                subtle: colors.bg.subtle || 'bg-gray-50'  // use your existing subtle color
                },
                text: {
                primary: colors.text.primary,
                secondary: colors.text.secondary,
                tertiary: colors.text.brand || colors.text.secondary  // provide a tertiary color
                },
                border: {
                primary: colors.border.primary
                }
            }}
            medications={medications}
            onEditMedication={onEditMedication}
            onDeleteMedication={onDeleteMedication}
            emptyTitle="No medications added"
            emptyDescription='Click "Add Medication" to include drugs in this template.'
            />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onReset}
            className={cn(
              'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
              colors.bg.hover,
              colors.text.secondary
            )}
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </button>

          <button
            type="submit"
            disabled={!formData.name.trim() || isMutating}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all',
              !formData.name.trim() || isMutating
                ? 'cursor-not-allowed bg-gray-400'
                : 'cursor-pointer bg-blue-600 hover:bg-blue-700'
            )}
          >
            <Save className="h-4 w-4" />
            {isEditing ? 'Update Template' : 'Save Template'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClinicalTemplateEditorPanel;
