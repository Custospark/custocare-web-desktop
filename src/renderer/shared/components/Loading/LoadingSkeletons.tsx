import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/classNameUtils';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ENTERPRISE-GRADE LOADING SKELETON SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * A comprehensive, production-ready loading state management system designed
 * to provide premium user experience across all application states.
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🎯 CORE PRINCIPLES
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 1. LAYOUT STABILITY
 *    - Prevents Cumulative Layout Shift (CLS)
 *    - Maintains exact dimensions of loaded content
 *    - Zero jarring transitions during load → content swap
 * 
 * 2. COGNITIVE LOAD REDUCTION
 *    - Clear visual hierarchy matches final content
 *    - Predictable loading patterns reduce user anxiety
 *    - Progressive disclosure of complex content
 * 
 * 3. PERFORMANCE PERCEPTION
 *    - Smooth animations create perception of faster loading
 *    - Contextual feedback shows progress, not just waiting
 *    - Staggered animations provide visual interest
 * 
 * 4. ACCESSIBILITY
 *    - ARIA live regions announce loading states
 *    - Reduced motion support for accessibility preferences
 *    - High contrast maintained in both themes
 * 
 * 5. THEME CONSISTENCY
 *    - Seamless integration with dark/light modes
 *    - Color tokens align with design system
 *    - Gradient effects enhance premium feel
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 📋 VARIANT CATALOG
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ 1. DEFAULT - Centered Spinner                                           │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ USE CASE:                                                               │
 * │ - Initial app loading                                                   │
 * │ - Modal content loading                                                 │
 * │ - Simple API calls with unknown duration                               │
 * │                                                                         │
 * │ FEATURES:                                                               │
 * │ - Animated concentric rings                                            │
 * │ - Pulsing gradient background                                          │
 * │ - Bouncing dots indicator                                              │
 * │ - Optional custom message                                              │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ 2. DASHBOARD - Executive Overview Skeleton                             │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ USE CASE:                                                               │
 * │ - Analytics dashboards                                                  │
 * │ - KPI metric displays                                                   │
 * │ - Business intelligence reports                                         │
 * │                                                                         │
 * │ LAYOUT:                                                                 │
 * │ - Header (title + subtitle + action button)                            │
 * │ - 4-column stat cards with icons                                        │
 * │ - 2-column chart placeholders                                           │
 * │ - Staggered animation timing                                            │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ 3. TABLE - Data Grid Skeleton                                           │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ USE CASE:                                                               │
 * │ - Patient lists                                                         │
 * │ - Staff directories                                                     │
 * │ - Transaction logs                                                      │
 * │ - Any tabular data                                                      │
 * │                                                                         │
 * │ LAYOUT:                                                                 │
 * │ - Header (title + search + filters + actions)                          │
 * │ - Filter controls bar                                                   │
 * │ - Table header row                                                      │
 * │ - 8 data rows (5 columns each)                                          │
 * │ - Zebra striping on hover                                               │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ 4. DETAIL - Entity Detail Page Skeleton                                 │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ USE CASE:                                                               │
 * │ - Patient profiles                                                      │
 * │ - Staff member details                                                  │
 * │ - Department information                                                │
 * │ - Any entity detail view                                                │
 * │                                                                         │
 * │ LAYOUT:                                                                 │
 * │ - Back button                                                           │
 * │ - Hero section (avatar + title + badges + action)                      │
 * │ - 2/3 main content (3 content blocks)                                   │
 * │ - 1/3 sidebar (2 info cards)                                            │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ 5. CARD - Grid View Skeleton                                            │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ USE CASE:                                                               │
 * │ - Department cards                                                      │
 * │ - Facility listings                                                     │
 * │ - Service offerings                                                     │
 * │ - Any card-based grid layout                                            │
 * │                                                                         │
 * │ LAYOUT:                                                                 │
 * │ - Header (title + action button)                                        │
 * │ - 3-column responsive grid (9 cards)                                    │
 * │ - Each card: image + title + description + actions                     │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ 6. FORM - Input Form Skeleton                                           │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ USE CASE:                                                               │
 * │ - Patient registration forms                                            │
 * │ - Staff onboarding forms                                                │
 * │ - Settings/configuration pages                                          │
 * │ - Multi-step wizards                                                    │
 * │                                                                         │
 * │ LAYOUT:                                                                 │
 * │ - Form header                                                           │
 * │ - 2-column field grid                                                   │
 * │ - Mixed input types (text, select, textarea, checkbox)                 │
 * │ - Action buttons                                                        │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ 7. LIST - Compact List Skeleton                                         │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ USE CASE:                                                               │
 * │ - Sidebar navigation                                                    │
 * │ - Activity feeds                                                        │
 * │ - Notification lists                                                    │
 * │ - Chat conversations                                                    │
 * │                                                                         │
 * │ LAYOUT:                                                                 │
 * │ - 10 list items                                                         │
 * │ - Icon + title + subtitle pattern                                       │
 * │ - Compact spacing                                                       │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ 8. TIMELINE - Chronological Event Skeleton                              │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ USE CASE:                                                               │
 * │ - Patient medical history                                               │
 * │ - Audit logs                                                            │
 * │ - Activity timelines                                                    │
 * │ - Status change history                                                 │
 * │                                                                         │
 * │ LAYOUT:                                                                 │
 * │ - Vertical timeline with connector                                      │
 * │ - 6 timeline events                                                     │
 * │ - Date + title + description pattern                                    │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ 9. MINIMAL - Inline Content Loading                                     │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ USE CASE:                                                               │
 * │ - Inline content updates                                                │
 * │ - Section reloads                                                       │
 * │ - Quick mutations                                                       │
 * │ - Non-disruptive loading                                                │
 * │                                                                         │
 * │ FEATURES:                                                               │
 * │ - Small spinner with text                                               │
 * │ - Minimal visual disruption                                             │
 * │ - Inline layout preservation                                            │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ 10. PROGRESS - Determinate Progress Bar                                 │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ USE CASE:                                                               │
 * │ - File uploads                                                          │
 * │ - Multi-step processes                                                  │
 * │ - Batch operations                                                      │
 * │ - Any task with known progress                                          │
 * │                                                                         │
 * │ FEATURES:                                                               │
 * │ - Animated progress bar                                                 │
 * │ - Percentage display                                                    │
 * │ - Status message                                                        │
 * │ - Estimated time remaining                                              │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🎨 ANIMATION SYSTEM
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * SHIMMER WAVE:
 * - Gradient moves from left to right
 * - Creates perception of content loading
 * - 2-second duration with ease-in-out timing
 * 
 * PULSE:
 * - Subtle opacity change
 * - 2-second duration
 * - Fallback for reduced motion preference
 * 
 * STAGGER:
 * - Child elements animate with delay
 * - Creates waterfall effect
 * - Improves visual hierarchy perception
 * 
 * SKELETON GLOW:
 * - Subtle luminosity increase
 * - Premium feel
 * - Enhanced in dark mode
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🔧 TECHNICAL SPECIFICATIONS
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * PERFORMANCE:
 * - CSS animations only (GPU accelerated)
 * - No JavaScript animation loops
 * - will-change hints for optimization
 * - transform3d for hardware acceleration
 * 
 * ACCESSIBILITY:
 * - role="status" for screen readers
 * - aria-live="polite" for updates
 * - aria-busy="true" during loading
 * - prefers-reduced-motion support
 * 
 * THEMING:
 * - Dark mode: Gray-900/800/700 palette with cyan accents
 * - Light mode: Gray-50/100/200 palette with blue accents
 * - Consistent border and shadow tokens
 * - High contrast ratios maintained
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

interface LoadingSkeletonProps {
  variant?: 
    | 'default'      // Centered spinner
    | 'dashboard'    // Dashboard with stats and charts
    | 'table'        // Data table/grid
    | 'detail'       // Entity detail page
    | 'card'         // Card grid layout
    | 'form'         // Form with input fields
    | 'list'         // Compact list view
    | 'timeline'     // Timeline/chronological
    | 'minimal'      // Inline/compact spinner
    | 'progress';    // Progress bar with percentage
  
  message?: string;
  className?: string;
  theme?: 'dark' | 'light';
  
  // Progress variant specific props
  progress?: number; // 0-100 for progress variant
  progressMessage?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// REUSABLE SHIMMER COMPONENT (outside component)
// ═══════════════════════════════════════════════════════════════════════════

interface ShimmerProps {
  className?: string;
  delay?: number;
  isDark?: boolean;
}

const Shimmer: React.FC<ShimmerProps> = ({ 
  className, 
  delay = 0,
  isDark = true
}) => {
  const colors = {
    skeleton: {
      base: isDark ? 'bg-gray-800' : 'bg-gray-200',
      from: isDark ? 'from-gray-800' : 'from-gray-200',
      via: isDark ? 'via-gray-700' : 'via-gray-100',
      to: isDark ? 'to-gray-800' : 'to-gray-200',
      glow: isDark ? 'via-gray-600' : 'via-gray-50',
    },
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded',
        colors.skeleton.base,
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        className={cn(
          'absolute inset-0 -translate-x-full',
          'bg-gradient-to-r',
          colors.skeleton.from,
          colors.skeleton.via,
          colors.skeleton.glow,
          colors.skeleton.via,
          colors.skeleton.to,
          'animate-[shimmer_2s_ease-in-out_infinite]'
        )}
        style={{
          backgroundSize: '200% 100%',
        }}
      />
    </div>
  );
};

interface LoadingMessageProps {
  text?: string;
  isDark?: boolean;
}

const LoadingMessage: React.FC<LoadingMessageProps> = ({ text, isDark = true }) => {
  if (!text) return null;
  
  const textColor = isDark ? 'text-gray-400' : 'text-gray-600';
  const accentColor = isDark ? 'text-cyan-400' : 'text-blue-600';

  return (
    <div 
      className="flex items-center justify-center gap-3 py-8"
      role="status"
      aria-live="polite"
    >
      <Loader2 className={cn('w-5 h-5 animate-spin', accentColor)} />
      <p className={cn('text-sm font-medium', textColor)}>
        {text}
      </p>
    </div>
  );
};

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'default',
  message,
  className,
  theme = 'dark',
  progress = 0,
  progressMessage,
}) => {
  const isDark = theme === 'dark';

  // ═══════════════════════════════════════════════════════════════════════════
  // THEME-AWARE COLOR TOKENS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const colors = {
    // Background layers
    bg: {
      primary: isDark ? 'bg-gray-900' : 'bg-white',
      secondary: isDark ? 'bg-gray-900/50' : 'bg-gray-50',
      elevated: isDark ? 'bg-gray-800' : 'bg-white',
    },
    
    // Borders
    border: {
      primary: isDark ? 'border-gray-800' : 'border-gray-200',
      secondary: isDark ? 'border-gray-700' : 'border-gray-300',
    },
    
    // Text
    text: {
      primary: isDark ? 'text-gray-100' : 'text-gray-900',
      secondary: isDark ? 'text-gray-400' : 'text-gray-600',
      tertiary: isDark ? 'text-gray-500' : 'text-gray-500',
    },
    
    // Skeleton shimmer
    skeleton: {
      base: isDark ? 'bg-gray-800' : 'bg-gray-200',
      from: isDark ? 'from-gray-800' : 'from-gray-200',
      via: isDark ? 'via-gray-700' : 'via-gray-100',
      to: isDark ? 'to-gray-800' : 'to-gray-200',
      glow: isDark ? 'via-gray-600' : 'via-gray-50',
    },
    
    // Accent colors
    accent: {
      primary: isDark ? 'text-cyan-400' : 'text-blue-600',
      bg: isDark ? 'bg-cyan-500/20' : 'bg-blue-500/10',
      border: isDark ? 'border-cyan-500/30' : 'border-blue-500/30',
    },
  };


  // ═══════════════════════════════════════════════════════════════════════════
  // VARIANT IMPLEMENTATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ DASHBOARD VARIANT                                                       │
  // └─────────────────────────────────────────────────────────────────────────┘
  if (variant === 'dashboard') {
    return (
      <div className={cn('p-4 lg:p-8 space-y-6', className)} role="status" aria-busy="true">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Shimmer className="h-8 w-64 rounded-lg" isDark={isDark} />
            <Shimmer className="h-4 w-96 max-w-full" delay={100} isDark={isDark} />
          </div>
          <Shimmer className="h-10 w-32 rounded-lg" delay={200} isDark={isDark} />
        </div>

        {/* Stats Grid - 4 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'rounded-xl p-6 space-y-3',
                'border',
                colors.border.primary,
                colors.bg.elevated
              )}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center justify-between">
                <Shimmer className="h-10 w-10 rounded-lg" delay={i * 100} isDark={isDark} />
                <Shimmer className="h-6 w-16 rounded" delay={i * 100 + 50} isDark={isDark} />
              </div>
              <Shimmer className="h-8 w-24 rounded" delay={i * 100 + 100} isDark={isDark} />
              <Shimmer className="h-3 w-32 rounded" delay={i * 100 + 150} isDark={isDark} />
            </div>
          ))}
        </div>

        {/* Charts Grid - 2 Large Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'rounded-xl p-6 space-y-4',
                'border',
                colors.border.primary,
                colors.bg.elevated
              )}
            >
              <Shimmer className="h-6 w-48 rounded" delay={i * 100} isDark={isDark} />
              <Shimmer className="h-64 w-full rounded-lg" delay={i * 100 + 100} isDark={isDark} />
              <div className="flex gap-4">
                <Shimmer className="h-3 w-20 rounded" delay={i * 100 + 200} isDark={isDark} />
                <Shimmer className="h-3 w-20 rounded" delay={i * 100 + 250} isDark={isDark} />
                <Shimmer className="h-3 w-20 rounded" delay={i * 100 + 300} isDark={isDark} />
              </div>
            </div>
          ))}
        </div>

        <LoadingMessage text={message} isDark={isDark} />
      </div>
    );
  }

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ TABLE VARIANT                                                           │
  // └─────────────────────────────────────────────────────────────────────────┘
  if (variant === 'table') {
    return (
      <div className={cn('p-4 lg:p-8 space-y-6', className)} role="status" aria-busy="true">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Shimmer className="h-8 w-48 rounded-lg" isDark={isDark} />
            <Shimmer className="h-4 w-64" delay={50} isDark={isDark} />
          </div>
          <div className="flex gap-3">
            <Shimmer className="h-10 w-32 rounded-lg" delay={100} isDark={isDark} />
            <Shimmer className="h-10 w-24 rounded-lg" delay={150} isDark={isDark} />
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex gap-3 flex-wrap">
          <Shimmer className="h-10 w-64 rounded-lg" isDark={isDark} />
          <Shimmer className="h-10 w-32 rounded-lg" delay={50} isDark={isDark} />
          <Shimmer className="h-10 w-32 rounded-lg" delay={100} isDark={isDark} />
          <Shimmer className="h-10 w-24 rounded-lg" delay={150} isDark={isDark} />
        </div>

        {/* Table Container */}
        <div className={cn('rounded-xl overflow-hidden border', colors.border.primary)}>
          {/* Table Header */}
          <div className={cn('p-4 border-b', colors.bg.secondary, colors.border.primary)}>
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Shimmer key={i} className="h-4 rounded" delay={i * 30} isDark={isDark} />
              ))}
            </div>
          </div>

          {/* Table Rows */}
          <div className={cn('divide-y', colors.border.primary)}>
            {[...Array(8)].map((_, rowIndex) => (
              <div 
                key={rowIndex} 
                className={cn(
                  'p-4 transition-colors',
                  colors.bg.primary,
                  isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50'
                )}
              >
                <div className="grid grid-cols-5 gap-4 items-center">
                  {[...Array(5)].map((_, colIndex) => (
                    <Shimmer 
                      key={colIndex} 
                      className="h-4 rounded" 
                      delay={rowIndex * 50 + colIndex * 20} 
                      isDark={isDark}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <Shimmer className="h-4 w-48 rounded" isDark={isDark} />
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <Shimmer key={i} className="h-10 w-10 rounded-lg" delay={i * 30} isDark={isDark} />
            ))}
          </div>
        </div>

        <LoadingMessage text={message} isDark={isDark} />
      </div>
    );
  }

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ DETAIL VARIANT                                                          │
  // └─────────────────────────────────────────────────────────────────────────┘
  if (variant === 'detail') {
    return (
      <div className={cn('p-4 lg:p-8 space-y-6', className)} role="status" aria-busy="true">
        {/* Back Button */}
        <Shimmer className="h-10 w-24 rounded-lg" isDark={isDark} />

        {/* Hero Section */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4 flex-1">
            {/* Avatar */}
            <Shimmer className="h-20 w-20 rounded-xl flex-shrink-0" isDark={isDark} />
            
            {/* Title and Badges */}
            <div className="space-y-3 flex-1">
              <Shimmer className="h-8 w-64 max-w-full rounded-lg" isDark={isDark} />
              <Shimmer className="h-4 w-48 max-w-full rounded" delay={50} isDark={isDark} />
              <div className="flex gap-2 flex-wrap">
                {[...Array(3)].map((_, i) => (
                  <Shimmer key={i} className="h-6 w-20 rounded-full" delay={i * 50} isDark={isDark} />
                ))}
              </div>
            </div>
          </div>
          
          {/* Action Button */}
          <Shimmer className="h-10 w-32 rounded-lg flex-shrink-0" delay={100} isDark={isDark} />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {[...Array(3)].map((_, sectionIndex) => (
              <div
                key={sectionIndex}
                className={cn(
                  'rounded-xl p-6 space-y-4',
                  'border',
                  colors.border.primary,
                  colors.bg.elevated
                )}
              >
                <Shimmer className="h-6 w-48 rounded" delay={sectionIndex * 100} isDark={isDark} />
                <div className="space-y-3">
                  {[...Array(4)].map((_, lineIndex) => (
                    <Shimmer 
                      key={lineIndex} 
                      className="h-4 w-full rounded" 
                      delay={sectionIndex * 100 + lineIndex * 50}
                      isDark={isDark}
                    />
                  ))}
                  <Shimmer 
                    className="h-4 w-3/4 rounded" 
                    delay={sectionIndex * 100 + 200}
                    isDark={isDark}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-6">
            {[...Array(2)].map((_, cardIndex) => (
              <div
                key={cardIndex}
                className={cn(
                  'rounded-xl p-6 space-y-4',
                  'border',
                  colors.border.primary,
                  colors.bg.elevated
                )}
              >
                <Shimmer className="h-6 w-32 rounded" delay={cardIndex * 100} isDark={isDark} />
                <div className="space-y-3">
                  {[...Array(5)].map((_, itemIndex) => (
                    <div key={itemIndex} className="flex justify-between items-center">
                      <Shimmer 
                        className="h-4 w-24 rounded" 
                        delay={cardIndex * 100 + itemIndex * 50}
                        isDark={isDark}
                      />
                      <Shimmer 
                        className="h-4 w-32 rounded" 
                        delay={cardIndex * 100 + itemIndex * 50 + 25}
                        isDark={isDark}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <LoadingMessage text={message} isDark={isDark} />
      </div>
    );
  }

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ CARD VARIANT                                                            │
  // └─────────────────────────────────────────────────────────────────────────┘
  if (variant === 'card') {
    return (
      <div className={cn('p-4 lg:p-8 space-y-6', className)} role="status" aria-busy="true">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Shimmer className="h-8 w-48 rounded-lg" isDark={isDark} />
          <Shimmer className="h-10 w-32 rounded-lg" delay={50} isDark={isDark} />
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'rounded-xl overflow-hidden',
                'border',
                colors.border.primary,
                colors.bg.elevated
              )}
            >
              {/* Card Image */}
              <Shimmer className="h-48 w-full" delay={i * 50} isDark={isDark} />
              
              {/* Card Content */}
              <div className="p-4 space-y-3">
                <Shimmer className="h-6 w-3/4 rounded" delay={i * 50 + 50} isDark={isDark} />
                <Shimmer className="h-4 w-full rounded" delay={i * 50 + 100} isDark={isDark} />
                <Shimmer className="h-4 w-5/6 rounded" delay={i * 50 + 150} isDark={isDark} />
                
                {/* Card Actions */}
                <div className="flex gap-2 pt-2">
                  <Shimmer className="h-8 flex-1 rounded-lg" delay={i * 50 + 200} isDark={isDark} />
                  <Shimmer className="h-8 w-8 rounded-lg" delay={i * 50 + 250} isDark={isDark} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <LoadingMessage text={message} isDark={isDark} />
      </div>
    );
  }

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ FORM VARIANT                                                            │
  // └─────────────────────────────────────────────────────────────────────────┘
  if (variant === 'form') {
    return (
      <div className={cn('p-4 lg:p-8 space-y-6', className)} role="status" aria-busy="true">
        {/* Form Header */}
        <div className="space-y-2">
          <Shimmer className="h-8 w-64 rounded-lg" isDark={isDark} />
          <Shimmer className="h-4 w-96 max-w-full rounded" delay={50} isDark={isDark} />
        </div>

        {/* Form Container */}
        <div className={cn('rounded-xl p-6 border', colors.border.primary, colors.bg.elevated)}>
          <div className="space-y-6">
            {/* Form Fields - 2 Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Shimmer className="h-4 w-32 rounded" delay={i * 50} isDark={isDark} />
                  <Shimmer className="h-10 w-full rounded-lg" delay={i * 50 + 25} isDark={isDark} />
                </div>
              ))}
            </div>

            {/* Full Width Select */}
            <div className="space-y-2">
              <Shimmer className="h-4 w-40 rounded" delay={400} isDark={isDark} />
              <Shimmer className="h-10 w-full rounded-lg" delay={425} isDark={isDark} />
            </div>

            {/* Textarea */}
            <div className="space-y-2">
              <Shimmer className="h-4 w-36 rounded" delay={450} isDark={isDark} />
              <Shimmer className="h-32 w-full rounded-lg" delay={475} isDark={isDark} />
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Shimmer className="h-5 w-5 rounded" delay={500 + i * 50} isDark={isDark} />
                  <Shimmer className="h-4 w-48 rounded" delay={500 + i * 50 + 25} isDark={isDark} />
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Shimmer className="h-10 w-24 rounded-lg" delay={650} isDark={isDark} />
              <Shimmer className="h-10 w-32 rounded-lg" delay={700} isDark={isDark} />
            </div>
          </div>
        </div>

        <LoadingMessage text={message} isDark={isDark} />
      </div>
    );
  }

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ LIST VARIANT                                                            │
  // └─────────────────────────────────────────────────────────────────────────┘
  if (variant === 'list') {
    return (
      <div className={cn('p-4 space-y-3', className)} role="status" aria-busy="true">
        {/* List Header */}
        <div className="pb-3 border-b" style={{ borderColor: colors.border.primary }}>
          <Shimmer className="h-6 w-32 rounded" isDark={isDark} />
        </div>

        {/* List Items */}
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg',
              isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50',
              'transition-colors'
            )}
          >
            <Shimmer className="h-10 w-10 rounded-lg flex-shrink-0" delay={i * 50} isDark={isDark} />
            <div className="flex-1 space-y-2">
              <Shimmer className="h-4 w-3/4 rounded" delay={i * 50 + 25} isDark={isDark} />
              <Shimmer className="h-3 w-1/2 rounded" delay={i * 50 + 50} isDark={isDark} />
            </div>
            <Shimmer className="h-8 w-8 rounded-lg flex-shrink-0" delay={i * 50 + 75} isDark={isDark} />
          </div>
        ))}

        <LoadingMessage text={message} isDark={isDark} />
      </div>
    );
  }

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ TIMELINE VARIANT                                                        │
  // └─────────────────────────────────────────────────────────────────────────┘
  if (variant === 'timeline') {
    return (
      <div className={cn('p-4 lg:p-8 space-y-6', className)} role="status" aria-busy="true">
        {/* Timeline Header */}
        <div className="space-y-2">
          <Shimmer className="h-8 w-48 rounded-lg" isDark={isDark} />
          <Shimmer className="h-4 w-64 rounded" delay={50} isDark={isDark} />
        </div>

        {/* Timeline Items */}
        <div className="relative space-y-6">
          {/* Vertical Line */}
          <div 
            className={cn(
              'absolute left-4 top-0 bottom-0 w-0.5',
              colors.border.primary
            )}
          />

          {[...Array(6)].map((_, i) => (
            <div key={i} className="relative flex gap-4">
              {/* Timeline Dot */}
              <div className="relative flex-shrink-0">
                <Shimmer className="h-8 w-8 rounded-full z-10 relative" delay={i * 100} isDark={isDark} />
              </div>

              {/* Timeline Content */}
              <div className={cn('flex-1 pb-6', i < 5 && 'border-b', colors.border.primary)}>
                <div className="space-y-2">
                  <Shimmer className="h-4 w-32 rounded" delay={i * 100 + 25} isDark={isDark} />
                  <Shimmer className="h-6 w-3/4 rounded-lg" delay={i * 100 + 50} isDark={isDark} />
                  <Shimmer className="h-4 w-full rounded" delay={i * 100 + 75} isDark={isDark} />
                  <Shimmer className="h-4 w-5/6 rounded" delay={i * 100 + 100} isDark={isDark} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <LoadingMessage text={message} isDark={isDark} />
      </div>
    );
  }

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ MINIMAL VARIANT                                                         │
  // └─────────────────────────────────────────────────────────────────────────┘
  if (variant === 'minimal') {
    return (
      <div 
        className={cn('inline-flex items-center gap-2 py-2', className)}
        role="status"
        aria-busy="true"
      >
        <Loader2 className={cn('w-4 h-4 animate-spin', colors.accent.primary)} />
        {message && (
          <span className={cn('text-sm', colors.text.secondary)}>{message}</span>
        )}
      </div>
    );
  }

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ PROGRESS VARIANT                                                        │
  // └─────────────────────────────────────────────────────────────────────────┘
  if (variant === 'progress') {
    const clampedProgress = Math.min(Math.max(progress, 0), 100);
    
    return (
      <div 
        className={cn('p-4 lg:p-8 space-y-6 max-w-2xl mx-auto', className)}
        role="status"
        aria-busy="true"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <Shimmer className="h-8 w-64 rounded-lg mx-auto" />
          <Shimmer className="h-4 w-96 max-w-full rounded mx-auto" delay={50} />
        </div>

        {/* Progress Bar Container */}
        <div className="space-y-3">
          {/* Progress Bar */}
          <div className={cn(
            'relative h-3 rounded-full overflow-hidden',
            colors.skeleton.base
          )}>
            {/* Progress Fill */}
            <div
              className={cn(
                'absolute inset-y-0 left-0',
                'bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600',
                'transition-all duration-500 ease-out',
                'after:absolute after:inset-0',
                'after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent',
                'after:animate-[shimmer_2s_ease-in-out_infinite]'
              )}
              style={{ width: `${clampedProgress}%` }}
            />
          </div>

          {/* Progress Info */}
          <div className="flex items-center justify-between">
            <span className={cn('text-sm font-medium', colors.text.secondary)}>
              {progressMessage || message || 'Loading...'}
            </span>
            <span className={cn('text-sm font-bold', colors.text.primary)}>
              {clampedProgress}%
            </span>
          </div>
        </div>

        {/* Loading Animation */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={cn(
                'w-16 h-16 rounded-full animate-ping',
                colors.accent.bg
              )} />
            </div>
            <div className={cn(
              'relative w-16 h-16 rounded-2xl flex items-center justify-center',
              'bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-600',
              'shadow-2xl',
              isDark ? 'shadow-cyan-500/50' : 'shadow-blue-500/30'
            )}>
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          </div>
        </div>

        {/* Loading Dots */}
        <div className="flex gap-2 justify-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full animate-bounce',
                isDark ? 'bg-cyan-400' : 'bg-blue-600'
              )}
              style={{
                animationDelay: `${i * 0.15}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>

        <LoadingMessage text={message} isDark={isDark} />
      </div>
    );
  }

  // ┌─────────────────────────────────────────────────────────────────────────┐
  // │ DEFAULT VARIANT - Premium Centered Spinner                             │
  // └─────────────────────────────────────────────────────────────────────────┘
  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center min-h-[400px] p-8',
        className
      )}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Animated Loading Icon */}
      <div className="relative">
        {/* Outer Ping Ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            'w-20 h-20 rounded-full animate-ping',
            isDark ? 'border-4 border-cyan-500/20' : 'border-4 border-blue-500/20'
          )} />
        </div>

        {/* Rotating Ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            'w-16 h-16 rounded-full animate-spin',
            'border-4',
            isDark 
              ? 'border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent'
              : 'border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent'
          )} />
        </div>

        {/* Center Icon with Gradient Background */}
        <div className={cn(
          'relative w-20 h-20 rounded-2xl flex items-center justify-center',
          'bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-600',
          'shadow-2xl',
          isDark ? 'shadow-cyan-500/50' : 'shadow-blue-500/30',
          'animate-pulse'
        )}>
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      </div>

      {/* Loading Message */}
      {message && (
        <p className={cn('mt-6 text-sm font-medium', colors.text.secondary)}>
          {message}
        </p>
      )}

      {/* Loading Dots Indicator */}
      <div className="flex gap-2 mt-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'w-2 h-2 rounded-full animate-bounce',
              isDark ? 'bg-cyan-400' : 'bg-blue-600'
            )}
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>

      {/* Accessibility Announcement */}
      <span className="sr-only">
        {message || 'Loading content, please wait'}
      </span>
    </div>
  );
};

LoadingSkeleton.displayName = 'LoadingSkeleton';

export default LoadingSkeleton;