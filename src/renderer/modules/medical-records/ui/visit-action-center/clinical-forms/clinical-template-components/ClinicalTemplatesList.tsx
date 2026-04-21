import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import LoadingSkeleton from '../../../../../../shared/components/Loading/LoadingSkeletons';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import type { ClinicalTemplate } from '../../../../api/clinical-templates/ClinicalTemplateTypes';
import { ClinicalTemplateCard } from './ClinicalTemplateCard';

interface ClinicalTemplatesListProps {
  isDark: boolean;
  colors: {
    bg: {
      card: string;
      subtle: string;
    };
    text: {
      primary: string;
      secondary: string;
    };
    border: {
      primary: string;
    };
  };
  templates: ClinicalTemplate[];
  isFetching: boolean;
  isMutating: boolean;
  onEditTemplate: (template: ClinicalTemplate) => void;
  onDeleteTemplate: (template: ClinicalTemplate) => void;
  onToggleStatus: (template: ClinicalTemplate) => void;
}

export const ClinicalTemplatesList: React.FC<ClinicalTemplatesListProps> = ({
  isDark,
  colors,
  templates,
  isFetching,
  isMutating,
  onEditTemplate,
  onDeleteTemplate,
  onToggleStatus,
}) => {
  return (
    <div className={cn('rounded-2xl border', colors.border.primary, colors.bg.card)}>
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 border-b p-5',
          colors.border.primary
        )}
      >
        <div>
          <h3 className={cn('text-base font-semibold', colors.text.primary)}>
            Saved Templates
          </h3>
          <p className={cn('text-sm', colors.text.secondary)}>
            View, edit, activate/deactivate, and delete existing templates
          </p>
        </div>
      </div>

      {(isFetching || isMutating) && (
        <div className="px-5 pt-4">
          <LoadingSkeleton
            variant="minimal"
            theme={isDark ? 'dark' : 'light'}
            message="Refreshing..."
          />
        </div>
      )}

      <div className="p-5">
        {templates.length === 0 ? (
          <div
            className={cn(
              'rounded-xl border border-dashed p-8 text-center',
              colors.border.primary,
              colors.bg.subtle
            )}
          >
            <CheckCircle2
              className={cn(
                'mx-auto mb-3 h-10 w-10',
                isDark ? 'text-green-400' : 'text-green-600'
              )}
            />
            <h4 className={cn('mb-1 text-base font-semibold', colors.text.primary)}>
              No templates yet
            </h4>
            <p className={cn('text-sm', colors.text.secondary)}>
              Click <span className="font-medium">Add Clinical Template</span> to create your first
              one.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
             <ClinicalTemplateCard
                    key={template.id}
                    template={template}
                    isDark={isDark}
                    colors={{
                        bg: {
                        subtle: colors.bg.subtle,
                        hover: colors.bg.card || colors.bg.subtle  // map 'card' to 'hover'
                        },
                        text: {
                        primary: colors.text.primary,
                        secondary: colors.text.secondary,
                        tertiary: colors.text.secondary  // provide a tertiary color
                        },
                        border: {
                        primary: colors.border.primary
                        }
                    }}
                    isBusy={isMutating}
                    onEdit={onEditTemplate}
                    onDelete={onDeleteTemplate}
                    onToggleStatus={onToggleStatus}
                    />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicalTemplatesList;
