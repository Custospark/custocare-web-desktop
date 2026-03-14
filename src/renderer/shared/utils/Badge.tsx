// shared/components/ui/Badge.tsx
import React from 'react';
import { Crown, Star, Zap, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '../types/cn';
export type BadgeTier = 'essential' | 'professional' | 'enterprise';
export type BadgeStatus = 'beta' | 'new' | 'experimental' | 'deprecated' | 'premium';
export type BadgeType = BadgeTier | BadgeStatus;

export interface BadgeProps {
  type: BadgeType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  tooltip?: string;
  theme?: 'light' | 'dark';
}

const tierConfig = {
  essential: {
    icon: Star,
    label: 'ESSENTIAL',
    colors: {
      light: 'bg-gray-100 text-gray-700 border-gray-200',
      dark: 'bg-gray-800 text-gray-300 border-gray-700',
      icon: 'text-gray-500'
    }
  },
  professional: {
    icon: Zap,
    label: 'PROFESSIONAL',
    colors: {
      light: 'bg-blue-100 text-blue-700 border-blue-200',
      dark: 'bg-blue-900/30 text-blue-300 border-blue-800',
      icon: 'text-blue-500'
    }
  },
  enterprise: {
    icon: Crown,
    label: 'ENTERPRISE',
    colors: {
      light: 'bg-purple-100 text-purple-700 border-purple-200',
      dark: 'bg-purple-900/30 text-purple-300 border-purple-800',
      icon: 'text-purple-500'
    }
  }
};

const statusConfig = {
  beta: {
    icon: AlertCircle,
    label: 'BETA',
    colors: {
      light: 'bg-amber-100 text-amber-700 border-amber-200',
      dark: 'bg-amber-900/30 text-amber-300 border-amber-800',
      icon: 'text-amber-500'
    }
  },
  new: {
    icon: Sparkles,
    label: 'NEW',
    colors: {
      light: 'bg-green-100 text-green-700 border-green-200',
      dark: 'bg-green-900/30 text-green-300 border-green-800',
      icon: 'text-green-500'
    }
  },
  experimental: {
    icon: Zap,
    label: 'EXPERIMENTAL',
    colors: {
      light: 'bg-orange-100 text-orange-700 border-orange-200',
      dark: 'bg-orange-900/30 text-orange-300 border-orange-800',
      icon: 'text-orange-500'
    }
  },
  deprecated: {
    icon: AlertCircle,
    label: 'DEPRECATED',
    colors: {
      light: 'bg-red-100 text-red-700 border-red-200',
      dark: 'bg-red-900/30 text-red-300 border-red-800',
      icon: 'text-red-500'
    }
  },
  premium: {
    icon: Crown,
    label: 'PREMIUM',
    colors: {
      light: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-200',
      dark: 'bg-gradient-to-r from-amber-900/30 to-yellow-900/30 text-amber-300 border-amber-800',
      icon: 'text-amber-500'
    }
  }
};

const sizeConfig = {
  sm: 'text-[10px] px-1.5 py-0.5 gap-1',
  md: 'text-xs px-2 py-1 gap-1.5',
  lg: 'text-sm px-2.5 py-1.5 gap-2'
};

const iconSize = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4'
};

export const Badge: React.FC<BadgeProps> = ({
  type,
  size = 'md',
  showIcon = true,
  className = '',
  tooltip,
  theme = 'light'
}) => {
  const config = tierConfig[type as BadgeTier] || statusConfig[type as BadgeStatus];
  if (!config) return null;

  const Icon = config.icon;
  const colors = config.colors[theme];

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        colors,
        sizeConfig[size],
        className
      )}
      title={tooltip || config.label}
    >
      {showIcon && <Icon className={cn(iconSize[size], config.colors.icon)} />}
      <span>{config.label}</span>
    </span>
  );
};

// Helper component for tier badges with upgrade CTA
export const UpgradeBadge: React.FC<{
  currentTier: BadgeTier;
  requiredTier: BadgeTier;
  onClick?: () => void;
  theme?: 'light' | 'dark';
}> = ({ currentTier, requiredTier, onClick, theme = 'light' }) => {
  const tierOrder = { essential: 0, professional: 1, enterprise: 2 };
  
  if (tierOrder[currentTier] >= tierOrder[requiredTier]) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium',
        'transition-all duration-200 hover:scale-105 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-offset-0',
        theme === 'dark'
          ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 hover:from-amber-500/30 hover:to-yellow-500/30 ring-1 ring-amber-500/30'
          : 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10 text-amber-700 hover:from-amber-500/20 hover:to-yellow-500/20 ring-1 ring-amber-500/30'
      )}
      title={`Upgrade to ${requiredTier} to access this feature`}
    >
      <Crown className="w-3.5 h-3.5" />
      <span>Upgrade to {requiredTier}</span>
    </button>
  );
};