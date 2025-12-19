import React from 'react';
import { cn } from '../../utils/classNameUtils';

interface DashboardCardProps {
  icon: React.ComponentType<{ className: string }>;
  title: string;
  value: number | string;
  color: 'blue' | 'cyan' | 'green' | 'orange';
}

const colorClasses = {
  blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
  cyan: 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400',
  green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
  orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400',
};

function DashboardCard({ icon: Icon, title, value, color }: DashboardCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border-l-4 border-l-blue-600 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        <div className={cn('p-3 rounded-lg border', colorClasses[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

export default DashboardCard;