import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  circle?: boolean;
  className?: string;
}

/**
 * Skeleton Component
 * 
 * Loading placeholder that mimics content shape
 * 
 * Usage:
 * <Skeleton width="200px" height="20px" />
 * <Skeleton circle width="48px" height="48px" />
 */
const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  circle = false,
  className = ''
}) => {
  return (
    <div
      className={`bg-neutral-gray-light animate-pulse ${circle ? 'rounded-full' : 'rounded-md'} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
};

export default Skeleton;

/**
 * Pre-built skeleton layouts for common use cases
 */

export const SkeletonCard: React.FC = () => (
  <div className="bg-neutral-white rounded-lg shadow-card p-24">
    <div className="flex items-start gap-16">
      <Skeleton circle width="48px" height="48px" />
      <div className="flex-1 space-y-12">
        <Skeleton width="60%" height="20px" />
        <Skeleton width="40%" height="16px" />
        <Skeleton width="80%" height="16px" />
      </div>
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-16">
    {/* Header */}
    <div className="flex gap-16">
      <Skeleton width="25%" height="20px" />
      <Skeleton width="25%" height="20px" />
      <Skeleton width="25%" height="20px" />
      <Skeleton width="25%" height="20px" />
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-16">
        <Skeleton width="25%" height="16px" />
        <Skeleton width="25%" height="16px" />
        <Skeleton width="25%" height="16px" />
        <Skeleton width="25%" height="16px" />
      </div>
    ))}
  </div>
);