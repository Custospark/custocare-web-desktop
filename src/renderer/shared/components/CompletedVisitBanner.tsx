import React from 'react';
import { useSelector } from 'react-redux';
import { Info } from 'lucide-react';
import { selectIsVisitCompleted } from '../../app/store/slices/visitSlice';
import { cn } from '../utils/classNameUtils';

interface CompletedVisitBannerProps {
  theme?: 'light' | 'dark';
}

export const CompletedVisitBanner: React.FC<CompletedVisitBannerProps> = ({ theme }) => {
  const isCompleted = useSelector(selectIsVisitCompleted);
  const isDark = theme === 'dark';

  if (!isCompleted) return null;

  return (
    <div className={cn(
      'mb-4 p-3 rounded-lg border flex items-start gap-2 text-sm',
      isDark
        ? 'bg-blue-900/20 border-blue-700/40 text-blue-200'
        : 'bg-blue-50 border-blue-200 text-blue-800',
    )}>
      <Info className="w-4 h-4 mt-0.5 shrink-0" />
      <span>
        This visit has been completed — viewing only. No new clinical entries, billing, or forwarding actions can be performed.
      </span>
    </div>
  );
};

export default CompletedVisitBanner;
