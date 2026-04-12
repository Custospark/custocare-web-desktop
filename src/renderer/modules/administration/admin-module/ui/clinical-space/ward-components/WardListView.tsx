import React from 'react';
import {
  Building,
  ChevronDown,
  ChevronUp,
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
  safeDate,
} from './ward.utils';

interface WardListViewProps {
  colors: WardColors;
  wards: Ward[];
  expandedRows: Set<number>;
  onToggleExpand: (id: number) => void;
  onEdit: (ward: Ward) => void;
  onDelete: (ward: Ward) => void | Promise<void>;
}

export const WardListView: React.FC<WardListViewProps> = ({
  colors,
  wards,
  expandedRows,
  onToggleExpand,
  onEdit,
  onDelete,
}) => {
  return (
    <div className={cn('rounded-xl overflow-hidden border', colors.border.primary)}>
      {/* Table Header */}
      <div
        className={cn(
          'grid grid-cols-12 gap-4 p-4 font-medium border-b',
          colors.bg.secondary,
          colors.border.primary
        )}
      >
        <div className="col-span-3">Ward Name</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-2">Location</div>
        <div className="col-span-2">Capacity</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      {/* Table Rows */}
      <div className={colors.bg.elevated}>
        {wards.map(ward => {
          const isExpanded = expandedRows.has(ward.id);
          const Icon = getWardTypeIcon(ward.ward_type);
          const statusMeta = getWardStatusMeta(ward.status);
          const StatusIcon = statusMeta.icon;
          const created = safeDate(ward.created_at);
          const updated = safeDate(ward.updated_at);

          return (
            <div
              key={ward.id}
              className={cn('border-b last:border-b-0', colors.border.primary)}
            >
              {/* Main Row */}
              <div
                className={cn(
                  'grid grid-cols-12 gap-4 p-4 items-center transition-colors cursor-pointer',
                  colors.bg.hover
                )}
                onClick={() => onToggleExpand(ward.id)}
              >
                {/* Name */}
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}

                    <span className={cn('font-medium', colors.text.primary)}>
                      {ward.name ?? '—'}
                    </span>

                    {ward.code && (
                      <span
                        className={cn(
                          'text-xs px-2 py-1 rounded',
                          colors.bg.secondary,
                          colors.text.secondary
                        )}
                      >
                        {ward.code}
                      </span>
                    )}
                  </div>
                </div>

                {/* Type */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('w-4 h-4', getWardTypeColor(ward.ward_type))} />
                    <span className={colors.text.secondary}>
                      {getWardTypeLabel(ward.ward_type)}
                    </span>
                  </div>
                </div>

                {/* Location */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <Building className={cn('w-4 h-4', colors.text.tertiary)} />
                    <span className={colors.text.secondary}>
                      {ward.building
                        ? `${ward.building}${ward.floor ? `, ${ward.floor}` : ''}`
                        : '—'}
                    </span>
                  </div>
                </div>

                {/* Capacity */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <Users className={cn('w-4 h-4', colors.text.tertiary)} />
                    <span className={colors.text.secondary}>
                      {formatCapacity(ward.capacity_declared, ward.capacity_operational)}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-1">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm',
                      statusMeta.className
                    )}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {statusMeta.label}
                  </span>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      onEdit(ward);
                    }}
                    className={cn(
                      'p-2 rounded-lg border transition-colors cursor-pointer',
                      colors.border.primary,
                      colors.bg.hover
                    )}
                    title="Edit ward"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      void onDelete(ward);
                    }}
                    className="p-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer"
                    title="Delete ward"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className={cn('p-4 border-t', colors.bg.secondary, colors.border.primary)}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className={cn('text-sm font-medium mb-1', colors.text.secondary)}>
                        Restrictions
                      </p>
                      <p className={colors.text.primary}>
                        {formatEnumLabel(ward.sex_restriction)}, {formatEnumLabel(ward.age_group)}
                      </p>
                    </div>

                    <div>
                      <p className={cn('text-sm font-medium mb-1', colors.text.secondary)}>
                        Capacities
                      </p>
                      <p className={colors.text.primary}>
                        Operational: {ward.capacity_operational ?? '—'}
                        <br />
                        Declared: {ward.capacity_declared ?? '—'}
                      </p>
                    </div>

                    <div>
                      <p className={cn('text-sm font-medium mb-1', colors.text.secondary)}>
                        Created
                      </p>
                      <p className={colors.text.primary}>
                        {created ? created.toLocaleDateString() : '—'}
                      </p>
                    </div>

                    <div>
                      <p className={cn('text-sm font-medium mb-1', colors.text.secondary)}>
                        Updated
                      </p>
                      <p className={colors.text.primary}>
                        {updated ? updated.toLocaleDateString() : '—'}
                      </p>
                    </div>

                    {ward.note && (
                      <div className="col-span-2 md:col-span-4">
                        <p className={cn('text-sm font-medium mb-1', colors.text.secondary)}>
                          Notes
                        </p>
                        <p className={cn('text-sm italic', colors.text.primary)}>
                          {ward.note}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WardListView;
