/**
 * ============================================================================
 * WORKSPACE CARD COMPONENT
 * ============================================================================
 * Reusable card for workspaces and portals with responsive design
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { cn } from '../../../../../../shared/types/cn';
import { cardVariants } from '../../../../../../shared/components/animations/motionVariants';

interface Feature {
  icon: LucideIcon;
  label: string;
}

interface Badge {
  label: string;
  variant: 'success' | 'primary' | 'warning';
  animated?: boolean;
}

interface WorkspaceCardProps {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  iconGradient: string;
  buttonText: string;
  buttonGradient: string;
  features?: Feature[];
  badges?: Badge[];
  imageUrl?: string;
  theme: 'light' | 'dark';
  onClick: () => void;
}

const DEFAULT_WORKSPACE_IMAGE = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop&q=80';

export const WorkspaceCard: React.FC<WorkspaceCardProps> = ({
  title,
  subtitle,
  description,
  icon: Icon,
  iconGradient,
  buttonText,
  buttonGradient,
  features = [],
  badges = [],
  imageUrl,
  theme,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getBadgeStyles = (variant: Badge['variant']) => {
    const styles = {
      success:
        theme === 'dark'
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      primary:
        theme === 'dark'
          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
          : 'bg-blue-50 text-blue-700 border-blue-200',
      warning:
        theme === 'dark'
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          : 'bg-amber-50 text-amber-700 border-amber-200',
    };
    return styles[variant];
  };

  return (
    <motion.div
      variants={cardVariants}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className={cn(
        'group relative rounded-xl border overflow-hidden cursor-pointer',
        'transition-all duration-300',
        'shadow-sm hover:shadow-md',
        'w-full', // Ensure card takes full width of container
        theme === 'dark'
          ? 'bg-gray-900 border-gray-800 hover:bg-gray-800/80 hover:border-gray-700'
          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
      )}
    >
      <div className="flex flex-col">
        {/* Image Section - Only if imageUrl provided */}
        {imageUrl && (
          <div className="relative w-full h-32 shrink-0 overflow-hidden">
            <img
              src={imageUrl || DEFAULT_WORKSPACE_IMAGE}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div
              className={cn(
                'absolute inset-0',
                theme === 'dark'
                  ? 'bg-linear-to-r from-transparent to-gray-900/40'
                  : 'bg-linear-to-r from-transparent to-white/40'
              )}
            />
          </div>
        )}

        {/* Content Section */}
        <div className="flex-1 p-3 sm:p-4">
          <div className="flex flex-col items-start justify-between gap-3">
            {/* Left Content - Takes available space */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Header with Icon */}
              <div className="flex items-start gap-2">
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    iconGradient
                  )}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3
                      className={cn(
                        'text-sm font-bold truncate',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      )}
                    >
                      {title}
                    </h3>
                    {badges.map((badge, index) => (
                      <div
                        key={index}
                        className={cn(
                          'px-1.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 border',
                          getBadgeStyles(badge.variant)
                        )}
                      >
                        {badge.animated && (
                          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                        {badge.label}
                      </div>
                    ))}
                  </div>
                  <p
                    className={cn(
                      'text-xs font-semibold mt-0.5',
                      theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                    )}
                  >
                    {subtitle}
                  </p>
                </div>
              </div>

              {/* Description - shorter for grid */}
              {description && (
                <p
                  className={cn(
                    'text-xs leading-relaxed line-clamp-2',
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  )}
                >
                  {description}
                </p>
              )}

              {/* Features - compact pill layout */}
              {features.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium',
                        theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                      )}
                    >
                      <feature.icon className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-24">{feature.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Button - full width */}
              <button
                type="button"
                className={cn(
                  'w-full px-3 py-2 rounded-lg font-medium text-xs cursor-pointer',
                  'flex items-center justify-center gap-1.5',
                  'transition-all duration-300',
                  'text-white shadow-sm hover:shadow-md',
                  'transform hover:scale-[1.02] active:scale-[0.98]',
                  buttonGradient
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
              >
                <span>{buttonText}</span>
                <ArrowRight
                  className={cn(
                    'w-3.5 h-3.5 transition-transform duration-300 shrink-0',
                    isHovered && 'translate-x-0.5'
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};