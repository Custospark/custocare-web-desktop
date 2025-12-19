import React, { ReactNode } from 'react';
import {
  MoreVertical, Filter, Download,
  RefreshCw, Settings, Eye,
  Grid, List,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../types/cn';

/* =====================================================
   ActionButton (MOVED OUTSIDE RENDER — REQUIRED)
===================================================== */
interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'secondary' | 'ghost';
  active?: boolean;
  className?: string;
  isDark: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
  active = false,
  className,
  isDark,
}) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300',
      'text-sm font-medium whitespace-nowrap',
      variant === 'primary'
        ? cn(
            'bg-gradient-to-r from-blue-600 to-cyan-500 text-white',
            'hover:from-blue-500 hover:to-cyan-400 hover:shadow-lg hover:shadow-blue-500/25'
          )
        : variant === 'secondary'
        ? cn(
            isDark
              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
          )
        : cn(
            isDark
              ? 'text-gray-400 hover:text-white hover:bg-gray-800'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          ),
      active &&
        cn(
          isDark
            ? 'bg-gray-800 text-white'
            : 'bg-gray-100 text-gray-900'
        ),
      'hover:scale-105',
      className
    )}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

/* =====================================================
   ContentSection
===================================================== */
interface ContentSectionProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  actions?: ReactNode;
  filters?: ReactNode;
  theme?: 'light' | 'dark';
  viewMode?: 'grid' | 'list' | 'card';
  onViewModeChange?: (mode: 'grid' | 'list' | 'card') => void;
  showViewToggle?: boolean;
  showFilters?: boolean;
  loading?: boolean;
  emptyState?: {
    icon: ReactNode;
    title: string;
    description: string;
    action?: ReactNode;
  };
}

/**
 * Premium Content Section Component
 */
export const ContentSection: React.FC<ContentSectionProps> = ({
  children,
  className,
  title,
  subtitle,
  description,
  actions,
  filters,
  theme = 'dark',
  viewMode = 'list',
  onViewModeChange,
  showViewToggle = true,
  showFilters = true,
  loading = false,
}) => {
  const isDark = theme === 'dark';
  const [showFilterPanel, setShowFilterPanel] = React.useState(false);

  return (
    <section className={cn(
      'flex flex-col h-full overflow-hidden',
      'rounded-2xl border backdrop-blur-xl',
      'transition-all duration-300',
      isDark
        ? 'bg-gradient-to-b from-gray-900/95 to-gray-950/95 border-gray-800/50'
        : 'bg-gradient-to-b from-white/95 to-gray-50/95 border-gray-200/60',
      'shadow-2xl',
      className
    )}>
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/30 via-cyan-500/30 to-blue-500/30 rounded-t-2xl" />

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
      </div>

      {/* Header */}
      {(title || subtitle || description || actions) && (
        <div className={cn(
          'relative z-10 px-6 lg:px-8 py-4 lg:py-6 border-b',
          isDark ? 'border-gray-800/50' : 'border-gray-200/60'
        )}>
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">

            {/* Title Section */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3">
                <div className={cn(
                  'p-2.5 rounded-xl mt-1',
                  'bg-gradient-to-br from-blue-500/10 to-cyan-500/10',
                  'border',
                  isDark ? 'border-blue-500/20' : 'border-blue-200'
                )}>
                  <div className={cn(
                    'w-5 h-5',
                    isDark ? 'text-cyan-400' : 'text-blue-600'
                  )}>
                    {title && '📊'}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    {title && (
                      <h1 className={cn(
                        'text-2xl lg:text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent',
                        isDark
                          ? 'from-white via-gray-100 to-gray-200'
                          : 'from-gray-900 via-gray-800 to-gray-700'
                      )}>
                        {title}
                      </h1>
                    )}

                    {subtitle && (
                      <span className={cn(
                        'px-3 py-1 text-sm font-bold rounded-full',
                        isDark
                          ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300'
                          : 'bg-gradient-to-r from-blue-100 to-cyan-50 text-blue-700'
                      )}>
                        {subtitle}
                      </span>
                    )}
                  </div>

                  {description && (
                    <p className={cn(
                      'mt-2 text-sm max-w-3xl',
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    )}>
                      {description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div className="flex items-center gap-2">

              {showViewToggle && (
                <div className={cn(
                  'flex items-center rounded-lg p-1',
                  isDark ? 'bg-gray-800/50' : 'bg-gray-100'
                )}>
                  <button
                    onClick={() => onViewModeChange?.('grid')}
                    className={cn(
                      'p-2 rounded-md',
                      viewMode === 'grid'
                        ? isDark ? 'bg-gray-700 text-white' : 'bg-white shadow-sm'
                        : isDark ? 'text-gray-500 hover:bg-gray-700' : 'hover:bg-gray-200'
                    )}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onViewModeChange?.('list')}
                    className={cn(
                      'p-2 rounded-md',
                      viewMode === 'list'
                        ? isDark ? 'bg-gray-700 text-white' : 'bg-white shadow-sm'
                        : isDark ? 'text-gray-500 hover:bg-gray-700' : 'hover:bg-gray-200'
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              )}

              <ActionButton
                icon={Download}
                label="Export"
                variant="secondary"
                isDark={isDark}
              />

              <ActionButton
                icon={RefreshCw}
                label="Refresh"
                onClick={() => window.location.reload()}
                isDark={isDark}
              />

              {showFilters && (
                <ActionButton
                  icon={Filter}
                  label="Filters"
                  active={showFilterPanel}
                  onClick={() => setShowFilterPanel(v => !v)}
                  isDark={isDark}
                />
              )}

              {actions}

              <button className={cn(
                'p-2.5 rounded-lg',
                isDark ? 'text-gray-400 hover:bg-gray-800' : 'hover:bg-gray-100'
              )}>
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {showFilterPanel && filters && (
            <div className={cn(
              'mt-4 p-4 rounded-xl border',
              isDark
                ? 'bg-gray-900/50 border-gray-800/50'
                : 'bg-white/50 border-gray-200/60'
            )}>
              {filters}
            </div>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {!loading && (
          <div className="h-full overflow-y-auto px-6 lg:px-8 py-4 lg:py-6">
            {children}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={cn(
        'px-6 lg:px-8 py-3 border-t flex justify-between',
        isDark ? 'border-gray-800/50' : 'border-gray-200/60'
      )}>
        <div className="flex gap-4 text-xs">
          <button className="flex items-center gap-2">
            <Eye className="w-3 h-3" /> Show/Hide Columns
          </button>
          <button className="flex items-center gap-2">
            <Settings className="w-3 h-3" /> Settings
          </button>
        </div>
      </div>
    </section>
  );
};

export default ContentSection;
