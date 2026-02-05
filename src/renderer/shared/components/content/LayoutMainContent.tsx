import React from 'react';
import { cn } from '../../utils/classNameUtils';

export interface LayoutMainContentProps {
  children: React.ReactNode;
  className?: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export const LayoutMainContent: React.FC<LayoutMainContentProps> = ({
  children,
  className,
  scrollRef
}) => {
  return (
    <section
      className={cn(
        'flex-1 min-w-0 min-h-0',
        // tighter corners on mobile
        'rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden',
        className
      )}
      aria-label="Main content"
    >
      <div
        ref={scrollRef as React.RefObject<HTMLDivElement>}
        className={cn(
          'main-content-area',
          'h-full w-full overflow-auto scroll-smooth',
          // 🔥 very tight on mobile
          'px-1 py-1 sm:px-2 sm:py-2 md:px-4 md:py-4'
        )}
      >
        {children}
      </div>
    </section>
  );
};

LayoutMainContent.displayName = 'LayoutMainContent';
