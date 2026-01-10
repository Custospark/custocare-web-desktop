import React from 'react';
import { cn } from '../../utils/classNameUtils';

export interface LayoutMainContentProps {
  children: React.ReactNode;
  className?: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * MainContent:
 * - Scrolls independently (requirement #3)
 * - Stable padding/spacing regardless of dock side
 */
export const LayoutMainContent: React.FC<LayoutMainContentProps> = ({
  children,
  className,
  scrollRef
}) => {
  return (
    <section
      className={cn(
        'flex-1 min-w-0 min-h-0',
        'rounded-2xl overflow-hidden',
        className
      )}
      aria-label="Main content"
    >
      <div
        ref={scrollRef as React.RefObject<HTMLDivElement>}
        className={cn(
          'main-content-area',
          'h-full w-full overflow-auto',
          'px-4 py-4 sm:px-5 sm:py-5 lg:px-4 lg:py-4', // slightly reduced spacing
          'scroll-smooth'
        )}
      >
        {children}
      </div>
    </section>
  );
};

LayoutMainContent.displayName = 'LayoutMainContent';
