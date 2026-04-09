import React from 'react';
import { motion } from 'framer-motion';
import { MetricCard } from './dashboard.primitives';
import type { AccentTone } from './dashboard.utils';

export interface DashboardMetricItem {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  accent: AccentTone;
  trend?: 'up' | 'down' | 'stable';
  delta?: number;
}

interface DashboardMetricsGridProps {
  isDark: boolean;
  metrics: DashboardMetricItem[];
}

const DashboardMetricsGrid: React.FC<DashboardMetricsGridProps> = ({ isDark, metrics }) => {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.title}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: index * 0.04 }}
        >
          <MetricCard isDark={isDark} {...metric} />
        </motion.div>
      ))}
    </section>
  );
};

export default DashboardMetricsGrid;
