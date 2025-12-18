import React, { useState, useRef, useCallback } from 'react';
import { SidebarToggleButton } from './SidebarToggleButton';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  Settings,
  HelpCircle,
  X,
  ChevronRight,
  Shield,
  Activity,
  TrendingUp,
  Cpu,
  Lock,
  BarChart3,
  Moon,
  Sun,
} from 'lucide-react';
import { SidebarProps, MenuItem } from '../../types/index';
import { cn } from '../../types/cn';
import {
  CompassIcon,
  HeartIcon,
  BrainIcon,
  ServerIcon,
  ShieldCheckIcon,
  SlidersIcon,
  GraduationCapIcon,
  ArrowRightIcon,
  HeadphonesIcon,
} from './icons';

interface EnhancedMenuItem extends MenuItem {
  premiumIcon?: React.ReactNode;
  glowColor?: string;
  stats?: string;
}

/**
 * Masterpiece Sidebar Navigation Component
 * 
 * After 80 years of design evolution, this sidebar embodies:
 * - Timeless aesthetic principles
 * - Perfect visual hierarchy
 * - Exceptional ergonomics
 * - Unobtrusive sophistication
 * - Seamless user experience
 * - Professional craftsmanship
 */
export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  className,
  theme = 'dark'
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleToggleCollapse = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  // Theme-aware styles
  const isDark = theme === 'dark';
  // const textColor = isDark ? 'text-gray-100' : 'text-gray-900';
  // const bgColor = isDark ? 'bg-gray-900' : 'bg-white';
  // const borderColor = isDark ? 'border-gray-800' : 'border-gray-200';
  const hoverBg = isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50';
  // const activeBg = isDark ? 'bg-gray-800' : 'bg-gray-100';
  // const cardBg = isDark ? 'bg-gray-800' : 'bg-gray-50';
  // const mutedText = isDark ? 'text-gray-400' : 'text-gray-600';

  // Enhanced menu items with premium icons
  const menuItems: EnhancedMenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      premiumIcon: <CompassIcon className="w-5 h-5" />,
      href: '/dashboard',
      active: true,
      description: 'Holistic system overview',
      stats: '98% uptime',
      glowColor: 'from-blue-500 to-cyan-400'
    },
    {
      id: 'patients',
      label: 'Patients',
      icon: <Users className="w-5 h-5" />,
      premiumIcon: <HeartIcon className="w-5 h-5" />,
      href: '/patients',
      badge: 12,
      description: 'Comprehensive care management',
      stats: '2.4K active',
      glowColor: 'from-emerald-500 to-teal-400'
    },
    {
      id: 'encounters',
      label: 'Encounters',
      icon: <ClipboardList className="w-5 h-5" />,
      premiumIcon: <Activity className="w-5 h-5" />,
      href: '/encounters',
      badge: 3,
      badgeVariant: 'urgent' as const,
      description: 'Real-time consultations',
      stats: 'Live monitoring',
      glowColor: 'from-amber-500 to-orange-400'
    },
    {
      id: 'reports',
      label: 'Intelligence',
      icon: <FileText className="w-5 h-5" />,
      premiumIcon: <BrainIcon className="w-5 h-5" />,
      href: '/reports',
      description: 'Predictive analytics',
      stats: 'AI-powered',
      glowColor: 'from-purple-500 to-pink-400'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      premiumIcon: <TrendingUp className="w-5 h-5" />,
      href: '/analytics',
      description: 'Advanced metrics',
      stats: 'Real-time data',
      glowColor: 'from-indigo-500 to-blue-400'
    },
    {
      id: 'system',
      label: 'System',
      icon: <Cpu className="w-5 h-5" />,
      premiumIcon: <ServerIcon className="w-5 h-5" />,
      href: '/system',
      description: 'Infrastructure health',
      stats: 'Optimal',
      glowColor: 'from-gray-700 to-gray-600'
    },
  ];

  const secondaryMenuItems: EnhancedMenuItem[] = [
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      premiumIcon: <SlidersIcon className="w-5 h-5" />,
      href: '/settings',
      description: 'Master configuration',
      glowColor: 'from-gray-600 to-gray-500'
    },
    {
      id: 'security',
      label: 'Security',
      icon: <ShieldCheckIcon className="w-5 h-5" />,
      premiumIcon: <Lock className="w-5 h-5" />,
      href: '/security',
      description: 'Advanced protection',
      badge: 'PRO',
      badgeVariant: 'pro' as const,
      glowColor: 'from-green-600 to-emerald-500'
    },
    {
      id: 'help',
      label: 'Academy',
      icon: <HelpCircle className="w-5 h-5" />,
      premiumIcon: <GraduationCapIcon className="w-5 h-5" />,
      href: '/help',
      description: 'Expert training',
      glowColor: 'from-violet-600 to-purple-500'
    },
  ];

  const renderMenuItem = (item: EnhancedMenuItem) => {
    const isActive = item.active;
    const isHovered = activeHover === item.id;
    
    return (
      <a
        key={item.id}
        href={item.href}
        className={cn(
          'group relative flex items-center gap-3 px-4 py-3.5',
          'rounded-2xl transition-all duration-500 ease-out-expo',
          'border border-transparent',
          isActive
            ? cn(
                isDark 
                  ? 'bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-md border-white/10' 
                  : 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200'
              )
            : cn('bg-transparent', hoverBg, isDark ? 'hover:border-white/10' : 'hover:border-gray-200'),
          collapsed && 'justify-center px-3.5',
          isHovered && 'scale-[1.02]'
        )}
        onMouseEnter={() => setActiveHover(item.id)}
        onMouseLeave={() => setActiveHover(null)}
        title={collapsed ? `${item.label} • ${item.description}` : undefined}
      >
        {/* Animated background gradient */}
        {item.glowColor && (
          <div className={cn(
            'absolute inset-0 rounded-2xl bg-gradient-to-r opacity-0',
            item.glowColor,
            'transition-opacity duration-700',
            isHovered && 'opacity-10',
            isActive && 'opacity-5'
          )} />
        )}
        
        {/* Subtle glow effect */}
        {isActive && !collapsed && (
          <div className="absolute -left-1 top-1/2 -translate-y-1/2">
            <div className={cn(
              'w-1 h-12 bg-gradient-to-b rounded-r-full shadow-lg',
              isDark 
                ? 'from-blue-400/80 via-blue-500 to-cyan-400/80 shadow-blue-500/30' 
                : 'from-blue-300 via-blue-400 to-blue-300 shadow-blue-400/30'
            )} />
          </div>
        )}
        
        {/* Icon container with depth */}
        <div className={cn(
          'relative z-10',
          'transition-all duration-500 ease-out-expo',
          isActive ? 'scale-110' : 'group-hover:scale-110',
          collapsed && 'mx-auto'
        )}>
          <div className={cn(
            'p-2.5 rounded-xl',
            isDark 
              ? 'bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-lg shadow-black/5' 
              : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-sm',
            'transition-all duration-500',
            isActive && (isDark ? 'shadow-blue-500/20' : 'shadow-blue-200'),
            isHovered && (isDark ? 'shadow-white/10' : 'shadow-gray-200')
          )}>
            <div className={cn(
              'transition-all duration-500',
              isActive 
                ? (isDark ? 'text-white' : 'text-blue-600')
                : cn(isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-700')
            )}>
              {item.premiumIcon || item.icon}
            </div>
          </div>
          
          {/* Active pulse animation */}
          {isActive && (
            <div className={cn(
              'absolute inset-0 rounded-xl animate-ping-slow',
              isDark ? 'bg-blue-500/20' : 'bg-blue-400/30'
            )} />
          )}
        </div>
        
        {!collapsed && (
          <div className="relative z-10 flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between">
              <span className={cn(
                'font-semibold tracking-tight transition-colors duration-300',
                isActive 
                  ? (isDark ? 'text-white' : 'text-blue-700')
                  : cn(isDark ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900')
              )}>
                {item.label}
              </span>
              
              {item.badge && (
                <span className={cn(
                  'px-2.5 py-1 text-xs font-bold rounded-full',
                  'border shadow-lg transition-all duration-300',
                  item.badgeVariant === 'urgent'
                    ? cn(
                        isDark 
                          ? 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-300 border-red-500/30 group-hover:from-red-500/30 group-hover:to-red-600/30' 
                          : 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border-red-200 group-hover:from-red-200 group-hover:to-red-100'
                      )
                    : item.badgeVariant === 'pro'
                    ? cn(
                        isDark 
                          ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30 group-hover:from-purple-500/30 group-hover:to-pink-500/30' 
                          : 'bg-gradient-to-r from-purple-100 to-pink-50 text-purple-700 border-purple-200 group-hover:from-purple-200 group-hover:to-pink-100'
                      )
                    : cn(
                        isDark 
                          ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border-blue-500/30 group-hover:from-blue-500/30 group-hover:to-cyan-500/30' 
                          : 'bg-gradient-to-r from-blue-100 to-cyan-50 text-blue-700 border-blue-200 group-hover:from-blue-200 group-hover:to-cyan-100'
                      ),
                  'group-hover:scale-105'
                )}>
                  {item.badge}
                </span>
              )}
            </div>
            
            <p className={cn(
              'text-xs truncate transition-colors duration-300',
              isDark ? 'text-gray-400/80 group-hover:text-gray-300/90' : 'text-gray-600 group-hover:text-gray-700'
            )}>
              {item.description}
            </p>
            
            {item.stats && (
              <div className="flex items-center gap-1.5 mt-1">
                <div className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  item.id === 'dashboard' && 'bg-green-400 animate-pulse',
                  item.id === 'patients' && 'bg-emerald-400',
                  item.id === 'encounters' && 'bg-amber-400',
                  item.id === 'reports' && 'bg-purple-400',
                )} />
                <span className={cn(
                  'text-xs font-medium',
                  isDark ? 'text-gray-500 group-hover:text-gray-400' : 'text-gray-600 group-hover:text-gray-700'
                )}>
                  {item.stats}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Hover indicator arrow */}
        {!collapsed && (
          <ChevronRight className={cn(
            "w-4 h-4 transition-all duration-500 ease-out-expo",
            isDark ? "text-gray-500/50" : "text-gray-400",
            isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
          )} />
        )}
      </a>
    );
  };

  return (
    <>
      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          className={cn(
            'fixed inset-0 z-40 lg:hidden animate-fade-in',
            isDark 
              ? 'bg-gradient-to-br from-gray-900/70 via-black/60 to-gray-900/70 backdrop-blur-xl' 
              : 'bg-black/50 backdrop-blur-sm'
          )}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Masterpiece Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          'fixed top-0 left-0 z-50 h-screen',
          'backdrop-blur-2xl border-r shadow-3xl',
          'flex flex-col transition-all duration-700 ease-out-expo',
          'lg:sticky lg:top-0 lg:h-screen',
          // Theme colors
          isDark 
            ? 'bg-gradient-to-b from-gray-900/95 via-gray-900/90 to-gray-900/95 border-gray-800/50 shadow-black/40' 
            : 'bg-white/95 border-gray-200 shadow-gray-900/5',
          // Responsive width
          collapsed ? 'w-24' : 'w-80',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'overflow-hidden',
          className
        )}
      >
        {/* Premium Toggle Button */}
        <SidebarToggleButton
          collapsed={collapsed}
          onToggle={handleToggleCollapse}
          className="top-24"
          theme={{
            primary: isDark ? 'blue' : 'indigo',
            secondary: isDark ? 'cyan' : 'purple',
            accent: isDark ? 'gray' : 'gray'
          }}
          animationSpeed="normal"
          showGlow={true}
          showTooltip={true}
          tooltipLabels={{
            collapsed: 'Expand navigation',
            expanded: 'Collapse navigation'
          }}
        />

        {/* Header */}
        <div className={cn(
          'relative h-24 px-6 border-b backdrop-blur-xl',
          'transition-all duration-500',
          isDark 
            ? 'bg-gradient-to-r from-gray-900/80 via-gray-900/60 to-gray-900/40 border-gray-800/50' 
            : 'bg-gradient-to-r from-white/80 via-white/60 to-white/40 border-gray-200',
          collapsed && 'px-4'
        )}>
          {/* Top gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/30 via-cyan-500/30 to-blue-500/30" />
          
          <div className="relative h-full flex items-center gap-3">
            {/* Logo */}
            <div className="relative">
              <div className={cn(
                'relative w-12 h-12 rounded-2xl',
                'bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500',
                'shadow-2xl shadow-blue-500/30 border border-blue-400/30',
                'flex items-center justify-center transition-all duration-500',
                collapsed ? 'mx-auto' : '',
                'group-hover:shadow-blue-500/40'
              )}>
                <Shield className="w-6 h-6 text-white" />
                
                {/* Inner glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent" />
                
                {/* Pulsing ring */}
                <div className="absolute -inset-2 rounded-2xl border-2 border-blue-500/20 animate-pulse-slow" />
              </div>
              
              {/* Status indicator */}
              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full border-2 border-gray-900 shadow-lg shadow-emerald-500/50">
                <div className="absolute inset-0.5 rounded-full bg-emerald-400 animate-ping-slow" />
              </div>
            </div>
            
            {/* Branding */}
            {!collapsed && (
              <div className="flex flex-col space-y-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent tracking-tight',
                    isDark 
                      ? 'from-white via-gray-100 to-gray-200' 
                      : 'from-gray-900 via-gray-800 to-gray-700'
                  )}>
                    CustoCare
                  </span>
                  <span className={cn(
                    'px-2 py-0.5 text-xs font-bold rounded-full border',
                    isDark 
                      ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/30' 
                      : 'bg-gradient-to-r from-blue-100 to-cyan-50 text-blue-700 border-blue-200'
                  )}>
                    PRO
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full animate-pulse" />
                    <span className={cn('text-xs font-medium', isDark ? 'text-gray-400' : 'text-gray-500')}>
                      System Active
                    </span>
                  </div>
                  <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>•</span>
                  <span className="text-xs text-cyan-400 font-medium">v4.2.1</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className={cn(
              'lg:hidden absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-xl backdrop-blur-sm',
              'border transition-all duration-300 hover:scale-110',
              isDark 
                ? 'bg-gray-800/50 hover:bg-gray-700/50 border-gray-700/50' 
                : 'bg-white/50 hover:bg-gray-100/50 border-gray-300'
            )}
            aria-label="Close menu"
          >
            <X className={cn('w-4 h-4', isDark ? 'text-gray-400' : 'text-gray-600')} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar-premium p-6 space-y-2.5">
          {/* Navigation header */}
          {!collapsed && (
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className={cn(
                  'text-xs font-semibold uppercase tracking-widest',
                  isDark ? 'text-gray-500' : 'text-gray-400'
                )}>
                  Navigation
                </p>
                <span className={cn(
                  'text-xs font-medium',
                  isDark ? 'text-cyan-400/70' : 'text-cyan-600'
                )}>
                  {menuItems.length} modules
                </span>
              </div>
            </div>
          )}

          {/* Primary Menu */}
          <div className="space-y-2.5">
            {menuItems.map((item) => renderMenuItem(item))}
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className={cn(
                'w-full h-px bg-gradient-to-r',
                isDark ? 'from-transparent via-gray-700/50 to-transparent' : 'from-transparent via-gray-300 to-transparent'
              )}></div>
            </div>
            {!collapsed && (
              <div className="relative flex justify-center">
                <span className={cn(
                  'px-4 py-1.5 text-xs font-medium rounded-full border backdrop-blur-sm',
                  isDark 
                    ? 'bg-gray-900/80 text-gray-500 border-gray-700/50' 
                    : 'bg-white/80 text-gray-400 border-gray-300'
                )}>
                  System & Configuration
                </span>
              </div>
            )}
          </div>

          {/* Secondary Menu */}
          <div className="space-y-2.5">
            {secondaryMenuItems.map((item) => renderMenuItem(item))}
          </div>

          {/* Quick Actions */}
          {!collapsed && (
            <div className={cn(
              'mt-8 p-4 rounded-2xl border backdrop-blur-sm',
              isDark 
                ? 'bg-gradient-to-br from-gray-800/30 to-gray-900/30 border-gray-700/30' 
                : 'bg-gradient-to-br from-gray-100/30 to-gray-200/30 border-gray-300'
            )}>
              <p className={cn(
                'text-xs font-semibold uppercase tracking-wider mb-3',
                isDark ? 'text-gray-400' : 'text-gray-500'
              )}>
                Quick Actions
              </p>
              <div className="grid grid-cols-2 gap-2">
                {['New Patient', 'Quick Report', 'Schedule', 'Emergency'].map((action) => (
                  <button
                    key={action}
                    className={cn(
                      'px-3 py-2 border rounded-lg text-xs font-medium transition-all duration-300 hover:scale-105',
                      isDark 
                        ? 'bg-gray-800/50 hover:bg-gray-700/50 border-gray-700/50 text-gray-300 hover:text-white' 
                        : 'bg-white/50 hover:bg-gray-100 border-gray-300 text-gray-700 hover:text-gray-900'
                    )}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className={cn(
          "p-6 border-t backdrop-blur-xl",
          isDark 
            ? "bg-gradient-to-t from-gray-900/80 via-gray-900/60 to-transparent border-gray-800/50" 
            : "bg-gradient-to-t from-white/80 via-white/60 to-transparent border-gray-200",
          collapsed && "px-4"
        )}>
          {!collapsed ? (
            <div className="space-y-6">
              {/* Support Card */}
              <div className={cn(
                'relative p-5 rounded-2xl border backdrop-blur-sm overflow-hidden',
                isDark 
                  ? 'bg-gradient-to-br from-gray-800/40 to-gray-900/40 border-gray-700/30' 
                  : 'bg-gradient-to-br from-blue-50/40 to-cyan-50/40 border-blue-200/30'
              )}>
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-500/20" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={cn(
                      'p-2.5 rounded-xl border',
                      isDark 
                        ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/30' 
                        : 'bg-gradient-to-br from-cyan-100 to-blue-100 border-cyan-300'
                    )}>
                      <HeadphonesIcon className={cn('w-5 h-5', isDark ? 'text-cyan-400' : 'text-cyan-600')} />
                    </div>
                    <div className="flex-1">
                      <p className={cn('text-sm font-semibold mb-1', isDark ? 'text-white' : 'text-gray-900')}>
                        Concierge Support
                      </p>
                      <p className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>
                        24/7 priority assistance with 5-min response
                      </p>
                    </div>
                  </div>
                  <button className="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 active:scale-[0.98] group">
                    <span className="flex items-center justify-center gap-2">
                      Contact Support
                      <ArrowRightIcon className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </button>
                </div>
              </div>

              {/* User Profile */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={cn(
                    'w-12 h-12 rounded-xl border overflow-hidden',
                    isDark 
                      ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600/50' 
                      : 'bg-gradient-to-br from-gray-200 to-gray-300 border-gray-400/50'
                  )}>
                    <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-white/70" />
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full border-2 border-gray-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold truncate', isDark ? 'text-white' : 'text-gray-900')}>
                    Dr. Alexander Morgan
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs', isDark ? 'text-gray-400' : 'text-gray-600')}>Chief Medical Officer</span>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full border',
                      isDark 
                        ? 'bg-gray-800/50 text-cyan-400 border-cyan-500/30' 
                        : 'bg-blue-100 text-blue-700 border-blue-300'
                    )}>
                      Admin
                    </span>
                  </div>
                </div>
                <button className={cn(
                  'p-2 rounded-lg transition-colors',
                  isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                )}>
                  {isDark ? <Sun className="w-4 h-4 text-gray-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
                </button>
              </div>
            </div>
          ) : (
            // Collapsed footer
            <div className="space-y-4">
              <button 
                className={cn(
                  'w-full p-3 rounded-xl border transition-all duration-300 hover:scale-105',
                  isDark 
                    ? 'bg-gradient-to-br from-gray-800/40 to-gray-900/40 border-gray-700/30 hover:border-cyan-500/30' 
                    : 'bg-gradient-to-br from-gray-100/40 to-gray-200/40 border-gray-300 hover:border-cyan-300'
                )}
                title="Support"
              >
                <HeadphonesIcon className={cn('w-5 h-5 mx-auto', isDark ? 'text-cyan-400' : 'text-cyan-600')} />
              </button>
              <div className={cn(
                'p-2 rounded-xl border',
                isDark 
                  ? 'bg-gradient-to-br from-gray-800/40 to-gray-900/40 border-gray-700/30' 
                  : 'bg-gradient-to-br from-gray-100/40 to-gray-200/40 border-gray-300'
              )}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 mx-auto overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-white/70" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ambient glow effects */}
        {isDark && (
          <>
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
          </>
        )}
      </aside>
    </>
  );
};

export default Sidebar;