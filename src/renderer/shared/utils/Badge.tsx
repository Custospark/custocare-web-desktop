// shared/components/badges/Badge.tsx
import React from 'react';
import { cn } from '../types/cn';
export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'premium';

export type BadgeSpec = {
  text: string;
  tone?: BadgeTone;
  icon?: React.ReactNode;
  title?: string;
  onClick?: () => void;
  testId?: string;
};

export function Badge({
  badge,
  theme,
  size = 'xs',
  className,
}: {
  badge: BadgeSpec;
  theme: 'light' | 'dark';
  size?: 'xs' | 'sm';
  className?: string;
}) {
  const isDark = theme === 'dark';

  const toneClass: Record<BadgeTone, string> = {
    neutral: isDark
      ? 'bg-gray-800 text-gray-300 ring-gray-700/40'
      : 'bg-gray-100 text-gray-700 ring-gray-200',
    info: isDark
      ? 'bg-blue-900/30 text-blue-200 ring-blue-500/20'
      : 'bg-blue-50 text-blue-700 ring-blue-200',
    success: isDark
      ? 'bg-emerald-900/30 text-emerald-200 ring-emerald-500/20'
      : 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    warning: isDark
      ? 'bg-amber-900/30 text-amber-200 ring-amber-500/20'
      : 'bg-amber-50 text-amber-800 ring-amber-200',
    danger: isDark
      ? 'bg-red-900/30 text-red-200 ring-red-500/20'
      : 'bg-red-50 text-red-700 ring-red-200',
    premium: isDark
      ? 'bg-gradient-to-r from-amber-500/20 to-yellow-400/10 text-amber-200 ring-amber-500/30'
      : 'bg-gradient-to-r from-amber-200/60 to-yellow-100/60 text-amber-900 ring-amber-300',
  };

  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-[10px] px-1.5 py-0.5';

  const Node: any = badge.onClick ? 'button' : 'span';

  return (
    <Node
      type={badge.onClick ? 'button' : undefined}
      onClick={badge.onClick}
      data-testid={badge.testId}
      title={badge.title}
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-bold ring-1 whitespace-nowrap',
        sizeClass,
        toneClass[badge.tone ?? 'neutral'],
        badge.onClick && 'cursor-pointer hover:opacity-90 active:opacity-80',
        className
      )}
    >
      {badge.icon ? <span className="shrink-0">{badge.icon}</span> : null}
      <span>{badge.text}</span>
    </Node>
  );
}
