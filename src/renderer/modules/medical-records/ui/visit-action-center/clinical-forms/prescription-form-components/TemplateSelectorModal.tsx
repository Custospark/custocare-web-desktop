import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy, FolderOpen, Plus, Search, X } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';
import type { ClinicalTemplate } from '../../../../api/clinical-templates/ClinicalTemplateTypes';
import { getCategoryColor as getCategoryBadgeColor } from '../../../../api/clinical-templates/ClinicalTemplateTypes';
import type { ColorTokens } from './prescriptionForm.types';

interface TemplateSelectorModalProps {
  open: boolean;
  isDark: boolean;
  colors: ColorTokens;
  templateSearch: string;
  onTemplateSearchChange: (value: string) => void;
  templates: ClinicalTemplate[];
  isLoading: boolean;
  isNavigatingToTemplateCreate: boolean;
  onClose: () => void;
  onApplyTemplate: (template: ClinicalTemplate) => void;
  onCreateTemplate: () => void;
}

export const TemplateSelectorModal: React.FC<TemplateSelectorModalProps> = ({
  open,
  isDark,
  colors,
  templateSearch,
  onTemplateSearchChange,
  templates,
  isLoading,
  isNavigatingToTemplateCreate,
  onClose,
  onApplyTemplate,
  onCreateTemplate,
}) => {
  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={cn('w-full max-w-2xl rounded-2xl border shadow-xl', colors.border.primary, colors.bg.card)}
          >
            <div className={cn('flex items-center justify-between border-b p-5', colors.border.primary)}>
              <h3 className={cn('text-lg font-semibold', colors.text.primary)}>Apply Clinical Template</h3>
              <button
                type="button"
                onClick={onClose}
                className={cn('rounded p-1 transition-colors', colors.bg.hover, colors.text.secondary)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              {isNavigatingToTemplateCreate ? (
                <LoadingSkeleton
                  variant="dashboard"
                  theme={isDark ? 'dark' : 'light'}
                  message="Opening template creation..."
                />
              ) : (
                <>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={templateSearch}
                      onChange={(e) => onTemplateSearchChange(e.target.value)}
                      placeholder="Search templates..."
                      className={cn(
                        'w-full rounded-lg border py-2 pl-9 pr-3 text-sm',
                        colors.bg.input,
                        colors.text.primary,
                        colors.border.primary
                      )}
                    />
                  </div>

                  {isLoading ? (
                    <LoadingSkeleton variant="minimal" theme={isDark ? 'dark' : 'light'} />
                  ) : templates.length === 0 ? (
                    <div className={cn('rounded-xl border border-dashed p-8 text-center', colors.border.primary, colors.bg.subtle)}>
                      <FolderOpen className={cn('mx-auto mb-2 h-10 w-10', colors.text.tertiary)} />
                      <p className={cn('text-sm font-medium', colors.text.primary)}>No templates found</p>
                      <p className={cn('mt-1 text-sm', colors.text.secondary)}>
                        Create a new clinical template and return here when ready.
                      </p>

                      <button
                        type="button"
                        onClick={onCreateTemplate}
                        className={cn(
                          'mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium',
                          colors.bg.hover,
                          colors.text.brand
                        )}
                      >
                        <Plus className="h-4 w-4" />
                        Create Template
                      </button>
                    </div>
                  ) : (
                    <div className="max-h-96 space-y-2 overflow-y-auto">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          className={cn(
                            'w-full rounded-lg border p-3 text-left transition-all',
                            colors.border.primary,
                            isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                          )}
                          onClick={() => onApplyTemplate(template)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className={cn('font-medium', colors.text.primary)}>{template.name}</p>
                              {template.description && (
                                <p className={cn('text-xs', colors.text.secondary)}>{template.description}</p>
                              )}

                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className={cn('rounded-full px-2 py-0.5 text-xs', getCategoryBadgeColor(template.category))}>
                                  {template.category}
                                </span>
                                <span className={cn('text-xs', colors.text.tertiary)}>
                                  {template.default_medications?.length || 0} medication(s)
                                </span>
                              </div>
                            </div>

                            <Copy className={cn('h-4 w-4 flex-shrink-0', colors.text.tertiary)} />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TemplateSelectorModal;
