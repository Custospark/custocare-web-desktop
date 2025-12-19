import React from 'react';
import type { IconType } from 'react-icons';
import { FaFlask, FaPills, FaAmbulance } from 'react-icons/fa';

type ModuleType = 'lab' | 'pharmacy' | 'triage';

interface ModuleBadgeProps {
  module: ModuleType;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  className?: string;
}

/**
 * ModuleBadge Component
 * 
 * Specialty badges for different clinical modules
 * 
 * Usage:
 * <ModuleBadge module="lab" />
 * <ModuleBadge module="pharmacy" label="Pending" size="large" />
 * <ModuleBadge module="triage" showIcon={false} />
 */
const ModuleBadge: React.FC<ModuleBadgeProps> = ({
  module,
  label,
  size = 'medium',
  showIcon = true,
  className = ''
}) => {
  const moduleConfig: Record<ModuleType, { color: string; bgColor: string; icon: IconType; defaultLabel: string }> = {
    lab: { color: 'text-blue-800', bgColor: 'bg-blue-100', icon: FaFlask, defaultLabel: 'Laboratory' },
    pharmacy: { color: 'text-purple-800', bgColor: 'bg-purple-100', icon: FaPills, defaultLabel: 'Pharmacy' },
    triage: { color: 'text-orange-800', bgColor: 'bg-orange-100', icon: FaAmbulance, defaultLabel: 'Triage' },
  };

  const sizeStyles: Record<string, string> = {
    small: 'px-2 py-1 text-xs gap-2',
    medium: 'px-3 py-2 text-sm gap-3',
    large: 'px-4 py-3 text-base gap-4',
  };

  const iconSizes: Record<string, string> = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  };

  const config = moduleConfig[module];
  const Icon = config.icon;
  const displayLabel = label || config.defaultLabel;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold ${config.bgColor} ${config.color} ${sizeStyles[size]} ${className}`}
    >
      {showIcon && <Icon className={`${iconSizes[size]} flex-shrink-0`} />}
      <span className="truncate">{displayLabel}</span>
    </span>
  );
};

export default ModuleBadge;
