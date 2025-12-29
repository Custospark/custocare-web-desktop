import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../types/cn';

export interface ToggleButtonProps {
  /**
   * Whether the sidebar is currently collapsed
   */
  collapsed: boolean;
  
  /**
   * Callback function when the toggle button is clicked
   */
  onToggle: () => void;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Position offset from the sidebar edge
   * @default 24 (top-24)
   */
  topOffset?: number;
  
  /**
   * Button size
   * @default 'default'
   */
  size?: 'small' | 'default' | 'large';
  
  /**
   * Show hover tooltip
   * @default true
   */
  showTooltip?: boolean;
  
  /**
   * Custom tooltip labels
   */
  tooltipLabels?: {
    collapsed: string;
    expanded: string;
  };
  
  /**
   * Animation speed
   * @default 'normal'
   */
  animationSpeed?: 'fast' | 'normal' | 'slow';
  
  /**
   * Show outer glow effect
   * @default true
   */
  showGlow?: boolean;
  
  /**
   * Custom color theme
   */
  theme?: {
    primary?: 'blue' | 'indigo' | 'emerald' | 'rose' | 'amber';
    secondary?: string;
    accent?: string;
  };
}

/**
 * Exceptional Toggle Button Component
 * 
 * Features:
 * - Premium glass-morphism design
 * - Exceptional visibility with multi-layer effects
 * - Smooth micro-interactions
 * - Hover tooltip with clear instructions
 * - Animated transitions
 * - Fully customizable
 */
export const SidebarToggleButton: React.FC<ToggleButtonProps> = ({
  collapsed,
  onToggle,
  className,
  topOffset = 24,
  size = 'default',
  showTooltip = true,
  tooltipLabels = {
    collapsed: 'Expand navigation',
    expanded: 'Collapse navigation'
  },
  animationSpeed = 'normal',
  showGlow = true,
  theme = {
    primary: 'blue',
    secondary: 'cyan',
    accent: 'gray'
  },
}) => {
  // Size configurations with Tailwind classes
  const sizeConfig = {
    small: {
      container: 'w-5 h-10',
      icon: 'w-2.5 h-2.5',
      heightHalf: 'h-5',
    },
    default: {
      container: 'w-6 h-12',
      icon: 'w-3 h-3',
      heightHalf: 'h-6',
    },
    large: {
      container: 'w-8 h-16',
      icon: 'w-4 h-4',
      heightHalf: 'h-8',
    },
  };

  const currentSize = sizeConfig[size];

  // Animation speed configurations
  const animationConfig = {
    fast: 'duration-300',
    normal: 'duration-500',
    slow: 'duration-700',
  };

  const currentAnimation = animationConfig[animationSpeed];

  // Theme color configurations with fallbacks
  const getThemeClasses = () => {
    const primary = theme.primary || 'blue';
    
    switch (primary) {
      case 'indigo':
        return {
          primary: 'indigo-500',
          secondary: 'purple-500',
          accent: 'gray',
        };
      case 'emerald':
        return {
          primary: 'emerald-500',
          secondary: 'teal-500',
          accent: 'gray',
        };
      case 'rose':
        return {
          primary: 'rose-500',
          secondary: 'pink-500',
          accent: 'gray',
        };
      case 'amber':
        return {
          primary: 'amber-500',
          secondary: 'orange-500',
          accent: 'gray',
        };
      default: // blue
        return {
          primary: 'blue-500',
          secondary: 'cyan-500',
          accent: 'gray',
        };
    }
  };

  const currentTheme = getThemeClasses();

  return (
    <button
      onClick={onToggle}
      style={{ top: `${topOffset}px` }}
      className={cn(
        'absolute -right-3 z-50',
        'group transition-all ease-out-expo',
        currentAnimation,
        'focus:outline-none focus:ring-4',
        `focus:ring-${currentTheme.primary}/30`,
        className
      )}
      aria-label={collapsed ? tooltipLabels.collapsed : tooltipLabels.expanded}
      data-state={collapsed ? 'collapsed' : 'expanded'}
    >
      {/* Outer glow ring - Multi-layer for exceptional visibility */}
      {showGlow && (
        <>
          {/* Subtle background glow */}
          <div className={cn(
            'absolute -inset-2 rounded-full',
            `bg-gradient-to-r from-${currentTheme.primary}/5 to-${currentTheme.secondary}/5`,
            'opacity-0 group-hover:opacity-100',
            'transition-opacity duration-500',
            'animate-pulse-slow'
          )} />
          
          {/* Intense hover glow */}
          <div className={cn(
            'absolute -inset-1 rounded-full',
            `bg-gradient-to-r from-${currentTheme.primary}/20 to-${currentTheme.secondary}/20`,
            'opacity-0 group-hover:opacity-100 group-active:opacity-100',
            'transition-opacity duration-300',
            'blur-sm'
          )} />
        </>
      )}
      
      {/* Main toggle container with exceptional depth */}
      <div className={cn(
        'relative rounded-r-lg',
        `bg-gradient-to-b from-${currentTheme.accent}-900 to-${currentTheme.accent}-800`,
        `border border-${currentTheme.accent}-700/50 border-l-0`,
        'shadow-2xl shadow-black/30',
        'flex items-center justify-center',
        'transition-all ease-out-expo',
        currentAnimation,
        'group-hover:scale-110 group-active:scale-95',
        'group-hover:shadow-2xl group-hover:shadow-black/50',
        currentSize.container
      )}>
        {/* Metallic edge highlights */}
        <div className="absolute inset-0 rounded-r-lg overflow-hidden">
          <div className={cn(
            'absolute inset-0',
            'bg-gradient-to-r from-white/5 via-transparent to-transparent'
          )} />
          <div className={cn(
            'absolute top-0 left-0 right-0 h-px',
            'bg-gradient-to-r from-white/10 to-transparent'
          )} />
          <div className={cn(
            'absolute bottom-0 left-0 right-0 h-px',
            'bg-gradient-to-r from-white/5 to-transparent'
          )} />
        </div>
        
        {/* Center indicator with depth */}
        <div className={cn(
          'absolute w-0.5 rounded-full',
          currentSize.heightHalf,
          `bg-gradient-to-b from-${currentTheme.accent}-400 to-${currentTheme.accent}-600`,
          'transition-all ease-out-expo',
          currentAnimation,
          collapsed ? 'rotate-0' : 'rotate-180',
          'shadow-lg'
        )} />
        
        {/* Premium arrow indicator with shine effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Arrow background glow */}
            <div className={cn(
              'absolute -inset-1 rounded-full',
              `bg-${currentTheme.primary}/20`,
              'opacity-0 group-hover:opacity-100',
              'transition-opacity duration-300',
              'blur-sm'
            )} />
            
            {/* Main arrow */}
            <ChevronRight className={cn(
              'transition-all ease-out-expo',
              currentAnimation,
              `text-${currentTheme.accent}-400`,
              collapsed ? "rotate-0" : "rotate-180",
              'relative z-10',
              'drop-shadow-sm',
              currentSize.icon
            )} />
            
            {/* Arrow shine overlay */}
            <div className={cn(
              'absolute inset-0',
              'bg-gradient-to-br from-white/20 to-transparent',
              'rounded-full opacity-50'
            )} />
          </div>
        </div>
        
        {/* Interactive touch target extension (invisible but clickable) */}
        <div className="absolute -inset-4" aria-hidden="true" />
      </div>
      
      {/* Premium Hover Tooltip - Exceptionally clear and visible */}
      {showTooltip && (
        <div className={cn(
          'absolute left-full ml-3',
          'px-3 py-2',
          `bg-${currentTheme.accent}-900/95 backdrop-blur-sm`,
          `border border-${currentTheme.accent}-700/50 rounded-lg`,
          'text-xs font-medium text-gray-300 whitespace-nowrap',
          'shadow-2xl shadow-black/50',
          'opacity-0 group-hover:opacity-100',
          'transition-all duration-300',
          'pointer-events-none',
          'z-50'
        )}>
          {collapsed ? tooltipLabels.collapsed : tooltipLabels.expanded}
          
          {/* Tooltip arrow with gradient */}
          <div className={cn(
            'absolute right-full top-1/2 -translate-y-1/2',
            'w-2 h-2',
            `bg-${currentTheme.accent}-900/95`,
            'rotate-45',
            `border-l border-t border-${currentTheme.accent}-700/50`
          )} />
          
          {/* Tooltip shine effect */}
          <div className="absolute inset-0 rounded-lg overflow-hidden">
            <div className={cn(
              'absolute top-0 left-0 right-0 h-px',
              'bg-gradient-to-r from-white/10 to-transparent'
            )} />
          </div>
        </div>
      )}
      
      {/* Click animation feedback */}
      <div className="absolute inset-0 rounded-r-lg overflow-hidden pointer-events-none">
        <div className={cn(
          'absolute inset-0',
          `bg-gradient-to-r from-${currentTheme.primary}/0 via-${currentTheme.primary}/10 to-${currentTheme.primary}/0`,
          'opacity-0 group-active:opacity-100',
          'transition-opacity duration-200',
          'animate-ping-slow'
        )} />
      </div>
      
      {/* Keyboard focus indicator */}
      <div className={cn(
        'absolute -inset-2 rounded-lg',
        `border-2 border-${currentTheme.primary}/0`,
        'group-focus:border-current',
        'transition-all duration-200',
        'pointer-events-none'
      )} />
    </button>
  );
};

/**
 * Compact Toggle Button Variant
 * For use in tight spaces or minimal designs
 */
export const CompactToggleButton: React.FC<ToggleButtonProps> = (props) => {
  return (
    <SidebarToggleButton
      {...props}
      size="small"
      showGlow={false}
      showTooltip={false}
      className={cn('opacity-70 hover:opacity-100', props.className)}
    />
  );
};

/**
 * Enhanced Toggle Button with Status Indicator
 * Shows additional status information
 */
interface StatusToggleButtonProps extends ToggleButtonProps {
  status?: 'online' | 'offline' | 'warning' | 'error';
  statusLabel?: string;
}

export const StatusToggleButton: React.FC<StatusToggleButtonProps> = ({ 
  status = 'online', 
  statusLabel, 
  ...props 
}) => {
  const statusConfig = {
    online: {
      color: 'emerald',
      pulse: true,
    },
    offline: {
      color: 'gray',
      pulse: false,
    },
    warning: {
      color: 'amber',
      pulse: true,
    },
    error: {
      color: 'red',
      pulse: true,
    },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className="relative">
      <SidebarToggleButton {...props} />
      
      {/* Status indicator */}
      <div className="absolute -top-1 -right-1 z-50">
        <div className={cn(
          'relative',
          'w-3 h-3 rounded-full',
          `bg-${currentStatus.color}-500`,
          'border-2 border-gray-900',
          'shadow-lg',
          currentStatus.pulse && 'animate-pulse'
        )}>
          {/* Status pulse effect */}
          {currentStatus.pulse && (
            <div className={cn(
              'absolute -inset-1 rounded-full',
              `bg-${currentStatus.color}-500/30`,
              'animate-ping'
            )} />
          )}
          
          {/* Status tooltip */}
          {statusLabel && (
            <div className={cn(
              'absolute left-full ml-2 top-1/2 -translate-y-1/2',
              'px-2 py-1',
              'bg-gray-900/95 backdrop-blur-sm',
              'border border-gray-700/50 rounded',
              'text-xs text-gray-300 whitespace-nowrap',
              'shadow-lg',
              'opacity-0 hover:opacity-100',
              'transition-opacity duration-200',
              'pointer-events-none'
            )}>
              {statusLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarToggleButton;