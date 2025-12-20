import React from 'react';
import { 
  Loader2 
} from 'lucide-react';
import { cn } from '../../utils/classNameUtils';

/**
 * Loading Skeleton Component
 * 
 * Enterprise-Grade Loading States:
 * - Multiple variants for different page types
 * - Smooth pulse animations
 * - Maintains layout during loading
 * - Prevents layout shift (CLS)
 * - Provides visual feedback without jarring transitions
 * 
 * Variants:
 * - default: Generic loading state
 * - dashboard: Dashboard-specific skeleton
 * - table: Table/list view skeleton
 * - detail: Detail page skeleton
 * - card: Card grid skeleton
 */

interface LoadingSkeletonProps {
  variant?: 'default' | 'dashboard' | 'table' | 'detail' | 'card';
  message?: string;
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'default',
  message,
  className
}) => {
  // Shimmer effect for skeletons
  const shimmerClass = 'animate-pulse bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%]';

  if (variant === 'dashboard') {
    return (
      <div className={cn('p-4 lg:p-8 space-y-6', className)}>
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className={cn('h-8 w-64 rounded-lg', shimmerClass)} />
            <div className={cn('h-4 w-96 rounded', shimmerClass)} />
          </div>
          <div className={cn('h-10 w-32 rounded-lg', shimmerClass)} />
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="border border-gray-800 rounded-xl p-6 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className={cn('h-10 w-10 rounded-lg', shimmerClass)} />
                <div className={cn('h-6 w-16 rounded', shimmerClass)} />
              </div>
              <div className={cn('h-8 w-24 rounded', shimmerClass)} />
              <div className={cn('h-3 w-32 rounded', shimmerClass)} />
            </div>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="border border-gray-800 rounded-xl p-6 space-y-4"
            >
              <div className={cn('h-6 w-48 rounded', shimmerClass)} />
              <div className={cn('h-64 w-full rounded-lg', shimmerClass)} />
            </div>
          ))}
        </div>

        {message && (
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            <p className="text-sm text-gray-400">{message}</p>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn('p-4 lg:p-8 space-y-6', className)}>
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className={cn('h-8 w-48 rounded-lg', shimmerClass)} />
            <div className={cn('h-4 w-64 rounded', shimmerClass)} />
          </div>
          <div className="flex gap-3">
            <div className={cn('h-10 w-32 rounded-lg', shimmerClass)} />
            <div className={cn('h-10 w-24 rounded-lg', shimmerClass)} />
          </div>
        </div>

        {/* Filters skeleton */}
        <div className="flex gap-3">
          <div className={cn('h-10 w-64 rounded-lg', shimmerClass)} />
          <div className={cn('h-10 w-32 rounded-lg', shimmerClass)} />
          <div className={cn('h-10 w-32 rounded-lg', shimmerClass)} />
        </div>

        {/* Table skeleton */}
        <div className="border border-gray-800 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="bg-gray-900/50 border-b border-gray-800 p-4">
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={cn('h-4 rounded', shimmerClass)} />
              ))}
            </div>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-gray-800">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="p-4">
                <div className="grid grid-cols-5 gap-4 items-center">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className={cn('h-4 rounded', shimmerClass)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {message && (
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            <p className="text-sm text-gray-400">{message}</p>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div className={cn('p-4 lg:p-8 space-y-6', className)}>
        {/* Back button skeleton */}
        <div className={cn('h-10 w-24 rounded-lg', shimmerClass)} />

        {/* Header skeleton */}
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className={cn('h-20 w-20 rounded-xl', shimmerClass)} />
            <div className="space-y-2">
              <div className={cn('h-8 w-64 rounded-lg', shimmerClass)} />
              <div className={cn('h-4 w-48 rounded', shimmerClass)} />
              <div className="flex gap-2 mt-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={cn('h-6 w-16 rounded-full', shimmerClass)} />
                ))}
              </div>
            </div>
          </div>
          <div className={cn('h-10 w-32 rounded-lg', shimmerClass)} />
        </div>

        {/* Content grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="border border-gray-800 rounded-xl p-6 space-y-4"
              >
                <div className={cn('h-6 w-48 rounded', shimmerClass)} />
                <div className="space-y-2">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className={cn('h-4 w-full rounded', shimmerClass)} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="border border-gray-800 rounded-xl p-6 space-y-4"
              >
                <div className={cn('h-6 w-32 rounded', shimmerClass)} />
                <div className="space-y-3">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="flex justify-between">
                      <div className={cn('h-4 w-24 rounded', shimmerClass)} />
                      <div className={cn('h-4 w-32 rounded', shimmerClass)} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {message && (
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            <p className="text-sm text-gray-400">{message}</p>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn('p-4 lg:p-8 space-y-6', className)}>
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className={cn('h-8 w-48 rounded-lg', shimmerClass)} />
          <div className={cn('h-10 w-32 rounded-lg', shimmerClass)} />
        </div>

        {/* Card grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="border border-gray-800 rounded-xl overflow-hidden"
            >
              <div className={cn('h-48 w-full', shimmerClass)} />
              <div className="p-4 space-y-3">
                <div className={cn('h-6 w-3/4 rounded', shimmerClass)} />
                <div className={cn('h-4 w-full rounded', shimmerClass)} />
                <div className={cn('h-4 w-5/6 rounded', shimmerClass)} />
                <div className="flex gap-2 mt-4">
                  <div className={cn('h-8 flex-1 rounded-lg', shimmerClass)} />
                  <div className={cn('h-8 w-8 rounded-lg', shimmerClass)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {message && (
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            <p className="text-sm text-gray-400">{message}</p>
          </div>
        )}
      </div>
    );
  }

  // Default variant - simple centered loading
  return (
    <div className={cn(
      'flex flex-col items-center justify-center min-h-[400px] p-8',
      className
    )}>
      <div className="relative">
        {/* Animated rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 border-4 border-cyan-500/20 rounded-full animate-ping" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
        </div>

        {/* Center icon */}
        <div className="relative w-20 h-20 bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-500/50">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      </div>

      {message && (
        <p className="mt-6 text-gray-400 text-sm font-medium">{message}</p>
      )}

      {/* Loading dots */}
      <div className="flex gap-2 mt-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
    </div>
  );
};

LoadingSkeleton.displayName = 'LoadingSkeleton';

export default LoadingSkeleton;