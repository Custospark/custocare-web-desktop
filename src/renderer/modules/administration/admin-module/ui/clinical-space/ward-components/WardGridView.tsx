import React from 'react';
import {
  Building2,
  Edit2,
  Trash2,
  Users,
} from 'lucide-react';

import { cn } from '../../../../../../shared/types/cn';
import { type Ward } from '../../../api/wards/wardTypes';
import type { WardColors } from './ward.types';
import {
  formatCapacity,
  formatEnumLabel,
  getWardStatusMeta,
  getWardTypeColor,
  getWardTypeIcon,
  getWardTypeLabel,
} from './ward.utils';

interface WardGridViewProps {
  colors: WardColors;
  wards: Ward[];
  onEdit: (ward: Ward) => void;
  onDelete: (ward: Ward) => void | Promise<void>;
}

export const WardGridView: React.FC<WardGridViewProps> = ({
  colors,
  wards,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {wards.map(ward => {
        const Icon = getWardTypeIcon(ward.ward_type);
        const statusMeta = getWardStatusMeta(ward.status);
        const StatusIcon = statusMeta.icon;

        return (
          <div
            key={ward.id}
            className={cn(
              'rounded-xl p-6 border transition-all',
              colors.border.primary,
              colors.bg.elevated,
              'hover:shadow-lg hover:scale-[1.02]'
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn('p-2 rounded-lg', colors.bg.secondary)}>
                  <Icon className={cn('w-6 h-6', getWardTypeColor(ward.ward_type))} />
                </div>

                <div className="min-w-0">
                  <h3 className={cn('font-semibold truncate', colors.text.primary)}>
                    {ward.name ?? '—'}
                  </h3>

                  {ward.code && (
                    <p className={cn('text-sm', colors.text.secondary)}>
                      {ward.code}
                    </p>
                  )}

                  <p className={cn('text-sm', colors.text.secondary)}>
                    {getWardTypeLabel(ward.ward_type)}
                  </p>
                </div>
              </div>

              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs whitespace-nowrap',
                  statusMeta.className
                )}
              >
                <StatusIcon className="w-3 h-3" />
                {statusMeta.label}
              </span>
            </div>

            {/* Body */}
            <div className={cn('mb-4 p-3 rounded-lg', colors.bg.secondary)}>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className={cn('w-4 h-4', colors.text.tertiary)} />
                <span className={cn('text-sm', colors.text.secondary)}>
                  {ward.building ?? 'No building'}
                  {ward.floor ? ` · ${ward.floor}` : ''}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <Users className={cn('w-4 h-4', colors.text.tertiary)} />
                <span className={cn('text-sm', colors.text.secondary)}>
                  Capacity: {formatCapacity(ward.capacity_declared, ward.capacity_operational)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span
                  className={cn(
                    'text-xs px-2 py-1 rounded',
                    colors.bg.primary,
                    colors.text.secondary
                  )}
                >
                  {formatEnumLabel(ward.sex_restriction)}
                </span>

                <span
                  className={cn(
                    'text-xs px-2 py-1 rounded',
                    colors.bg.primary,
                    colors.text.secondary
                  )}
                >
                  {formatEnumLabel(ward.age_group)}
                </span>
              </div>

              {ward.note && (
                <p className={cn('text-sm mt-3 italic', colors.text.secondary)}>
                  {ward.note}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(ward)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors cursor-pointer',
                  colors.border.primary,
                  colors.bg.hover
                )}
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit</span>
              </button>

              <button
                onClick={() => void onDelete(ward)}
                className="p-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer"
                title="Delete ward"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WardGridView;
