import React, { ReactNode } from 'react';
import { 
  MoreVertical, Filter, Download, 
  RefreshCw, Settings, Eye,
  Grid, List, 
} from 'lucide-react';
import { cn } from '../../types/cn';

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
 * 
 * After 80 years of design evolution, this content section embodies:
 * - Timeless content hierarchy
 * - Perfect information density
 * - Exceptional content choreography
 * - Unobtrusive sophistication
 * - Seamless user experience
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
  emptyState
}) => {
  const isDark = theme === 'dark';
  const [showFilterPanel, setShowFilterPanel] = React.useState(false);

  const ActionButton = ({ 
    icon: Icon, 
    label, 
    onClick, 
    variant = 'default',
    active = false 
  }: {
    icon: Node;
    label: string;
    onClick?: () => void;
    variant?: 'default' | 'primary' | 'secondary' | 'ghost';
    active?: boolean;
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
        active && cn(
          isDark 
            ? 'bg-gray-800 text-white' 
            : 'bg-gray-100 text-gray-900'
        ),
        'hover:scale-105'
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

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
                {/* Title Icon/Indicator */}
                <div className={cn(
                  'p-2.5 rounded-xl mt-1',
                  'bg-gradient-to-br from-blue-500/10 to-cyan-500/10',
                  'border',
                  isDark 
                    ? 'border-blue-500/20' 
                    : 'border-blue-200'
                )}>
                  <div className={cn(
                    'w-5 h-5',
                    isDark ? 'text-cyan-400' : 'text-blue-600'
                  )}>
                    {title && '📊'}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Title & Subtitle */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {title && (
                      <h1 className={cn(
                        'text-2xl lg:text-3xl font-bold',
                        'bg-gradient-to-r bg-clip-text text-transparent',
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
                        'transition-all duration-300 hover:scale-105',
                        isDark 
                          ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300' 
                          : 'bg-gradient-to-r from-blue-100 to-cyan-50 text-blue-700'
                      )}>
                        {subtitle}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {description && (
                    <p className={cn(
                      'mt-2 text-sm max-w-3xl',
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    )}>
                      {description}
                    </p>
                  )}

                  {/* Stats/Info Chips */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                      'text-xs font-medium',
                      isDark 
                        ? 'bg-gray-800/50 text-gray-300' 
                        : 'bg-gray-100 text-gray-700'
                    )}>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      <span>Live Data</span>
                    </div>
                    <div className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                      'text-xs font-medium',
                      isDark 
                        ? 'bg-gray-800/50 text-gray-300' 
                        : 'bg-gray-100 text-gray-700'
                    )}>
                      <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                      <span>Updated just now</span>
                    </div>
                  </div>
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
                      'p-2 rounded-md transition-all duration-300',
                      viewMode === 'grid'
                        ? cn(
                            isDark 
                              ? 'bg-gray-700 text-white' 
                              : 'bg-white text-gray-900 shadow-sm'
                          )
                        : cn(
                            isDark 
                              ? 'text-gray-500 hover:text-white hover:bg-gray-700' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                          )
                    )}
                    aria-label="Grid view"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onViewModeChange?.('list')}
                    className={cn(
                      'p-2 rounded-md transition-all duration-300',
                      viewMode === 'list'
                        ? cn(
                            isDark 
                              ? 'bg-gray-700 text-white' 
                              : 'bg-white text-gray-900 shadow-sm'
                          )
                        : cn(
                            isDark 
                              ? 'text-gray-500 hover:text-white hover:bg-gray-700' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                          )
                    )}
                    aria-label="List view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Filter Toggle */}
              {showFilters && (
                <ActionButton
                  icon={Filter}
                  label="Filters"
                  active={showFilterPanel}
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                />
              )}

              {/* Default Actions */}
              <div className="flex items-center gap-2">
                <ActionButton
                  icon={Download}
                  label="Export"
                  variant="secondary"
                />
                <ActionButton
                  icon={RefreshCw}
                  label="Refresh"
                  onClick={() => window.location.reload()}
                />
                {actions}
              </div>

              {/* Settings Menu */}
              <button className={cn(
                'p-2.5 rounded-lg transition-all duration-300 hover:scale-105',
                isDark 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}>
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilterPanel && filters && (
            <div className={cn(
              'mt-4 p-4 rounded-xl border',
              'animate-fade-in',
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
        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center">
            <div className="text-center">
              <div className="relative">
                <div className={cn(
                  'w-16 h-16 rounded-full animate-spin',
                  'border-4 border-t-transparent',
                  isDark 
                    ? 'border-cyan-500/30' 
                    : 'border-blue-500/30'
                )} />
                <div className={cn(
                  'absolute inset-0 w-16 h-16 rounded-full animate-ping opacity-30',
                  isDark ? 'bg-cyan-500' : 'bg-blue-500'
                )} />
              </div>
              <p className={cn(
                'mt-4 text-sm font-medium',
                isDark ? 'text-gray-300' : 'text-gray-700'
              )}>
                Loading content...
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && emptyState && React.Children.count(children) === 0 ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className={cn(
                'w-20 h-20 rounded-2xl mx-auto mb-6',
                'flex items-center justify-center',
                isDark 
                  ? 'bg-gray-800/50' 
                  : 'bg-gray-100'
              )}>
                {emptyState.icon}
              </div>
              <h3 className={cn(
                'text-xl font-bold mb-2',
                isDark ? 'text-white' : 'text-gray-900'
              )}>
                {emptyState.title}
              </h3>
              <p className={cn(
                'text-sm mb-6',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                {emptyState.description}
              </p>
              {emptyState.action}
            </div>
          </div>
        ) : (
          /* Main Content */
          <div className={cn(
            'h-full overflow-y-auto custom-scrollbar-premium',
            'px-6 lg:px-8 py-4 lg:py-6'
          )}>
            {children}
          </div>
        )}
      </div>

      {/* Footer Bar */}
      <div className={cn(
        'relative z-10 px-6 lg:px-8 py-3 border-t',
        'flex items-center justify-between',
        isDark ? 'border-gray-800/50' : 'border-gray-200/60'
      )}>
        <div className="flex items-center gap-4">
          <button className={cn(
            'flex items-center gap-2 text-xs transition-colors duration-300',
            isDark 
              ? 'text-gray-500 hover:text-gray-300' 
              : 'text-gray-500 hover:text-gray-700'
          )}>
            <Eye className="w-3 h-3" />
            <span>Show/Hide Columns</span>
          </button>
          <button className={cn(
            'flex items-center gap-2 text-xs transition-colors duration-300',
            isDark 
              ? 'text-gray-500 hover:text-gray-300' 
              : 'text-gray-500 hover:text-gray-700'
          )}>
            <Settings className="w-3 h-3" />
            <span>Settings</span>
          </button>
        </div>

        {/* Pagination/Info */}
        <div className="flex items-center gap-4">
          <div className={cn(
            'text-xs px-3 py-1.5 rounded-lg',
            isDark 
              ? 'bg-gray-800/50 text-gray-400' 
              : 'bg-gray-100 text-gray-600'
          )}>
            Showing 1-10 of 247 items
          </div>
          <div className="flex items-center gap-2">
            <button className={cn(
              'p-1.5 rounded-lg transition-colors duration-300',
              isDark 
                ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            )}>
              ←
            </button>
            <span className={cn(
              'text-xs font-medium px-2',
              isDark ? 'text-gray-300' : 'text-gray-700'
            )}>
              Page 1 of 25
            </span>
            <button className={cn(
              'p-1.5 rounded-lg transition-colors duration-300',
              isDark 
                ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            )}>
              →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContentSection;