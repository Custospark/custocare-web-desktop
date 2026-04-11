import React, { useEffect, useRef, useState } from 'react';
import { EmptyChartState } from '../../../../../medical-records/ui/overview/medical-records-dashboard/dashboard.primitives';
import { cn } from './facilityAdminDashboard.utils';

type ChartSize = {
  width: number;
  height: number;
};

interface MeasuredChartProps {
  height: number;
  isDark: boolean;
  hasData: boolean;
  emptyTitle: string;
  emptySubtitle: string;
  className?: string;
  children: (size: ChartSize) => React.ReactNode;
}

const MeasuredChart: React.FC<MeasuredChartProps> = ({
  height,
  isDark,
  hasData,
  emptyTitle,
  emptySubtitle,
  className,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<ChartSize>({ width: 0, height });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let frame = 0;

    const updateSize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();

        setSize({
          width: Math.max(0, Math.floor(rect.width)),
          height: Math.max(0, Math.floor(rect.height || height)),
        });
      });
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(el);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [height]);

  const isReady = hasData && size.width > 0 && size.height > 0;

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full min-w-0 overflow-hidden', className)}
      style={{ height, minHeight: height }}
    >
      {!hasData ? (
        <EmptyChartState
          title={emptyTitle}
          subtitle={emptySubtitle}
          isDark={isDark}
        />
      ) : isReady ? (
        children(size)
      ) : (
        <div
          className={cn(
            'h-full w-full animate-pulse rounded-2xl',
            isDark ? 'bg-white/[0.03]' : 'bg-slate-100'
          )}
        />
      )}
    </div>
  );
};

export default MeasuredChart;
