import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  LayoutDashboard, Users, ClipboardList, FileText, Settings, HelpCircle,
  X, Shield, Activity, TrendingUp, Cpu, Lock, BarChart3,
  Moon, Sun, Home, Database, AlertCircle, Heart, Bell, MessageSquare
} from 'lucide-react';
import { SidebarProps, MenuItem } from '../../types/index';
import { cn } from '../../types/cn';

interface EnhancedMenuItem extends MenuItem {
  premiumIcon?: React.ReactNode;
  glowColor?: string;
  stats?: string;
  shortcut?: string;
}

/**
 * Masterpiece Sidebar - Intelligent Navigation
 * 
 * Key Innovations:
 * 1. Fixed positioning with smooth transitions
 * 2. Mobile-first touch gestures
 * 3. Clear toggle states
 * 4. Spatial hierarchy
 * 5. Professional craftsmanship
 */
export const Sidebar: React.FC<SidebarProps & {
  collapsed: boolean;
  onToggleCollapse: () => void;
}> = ({ 
  isOpen, 
  onClose, 
  collapsed,
  className,
  theme = 'dark'
}) => {
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  // Touch gesture handling for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart || !isOpen) return;
    
    const touchEnd = e.touches[0].clientX;
    const diff = touchStart - touchEnd;
    
    // Swipe left to close
    if (diff > 50) {
      onClose?.();
    }
  }, [touchStart, isOpen, onClose]);

  // Enhanced menu items
  const menuItems: EnhancedMenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      premiumIcon: <Home className="w-5 h-5" />,
      href: '/dashboard',
      active: true,
      description: 'Holistic system overview',
      stats: '98% uptime',
      shortcut: '⌘ + 1',
      glowColor: 'from-blue-500 to-cyan-400'
    },
    {
      id: 'patients',
      label: 'Patients',
      icon: <Users className="w-5 h-5" />,
      premiumIcon: <Heart className="w-5 h-5" />,
      href: '/patients',
      badge: 12,
      description: 'Comprehensive care management',
      stats: '2.4K active',
      shortcut: '⌘ + 2',
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
      shortcut: '⌘ + 3',
      glowColor: 'from-amber-500 to-orange-400'
    },
    {
      id: 'reports',
      label: 'Intelligence',
      icon: <FileText className="w-5 h-5" />,
      premiumIcon: <Database className="w-5 h-5" />,
      href: '/reports',
      description: 'Predictive analytics',
      stats: 'AI-powered',
      shortcut: '⌘ + 4',
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
      shortcut: '⌘ + 5',
      glowColor: 'from-indigo-500 to-blue-400'
    },
    {
      id: 'system',
      label: 'System',
      icon: <Cpu className="w-5 h-5" />,
      premiumIcon: <AlertCircle className="w-5 h-5" />,
      href: '/system',
      description: 'Infrastructure health',
      stats: 'Optimal',
      shortcut: '⌘ + 6',
      glowColor: 'from-gray-700 to-gray-600'
    },
  ];

  const secondaryMenuItems: EnhancedMenuItem[] = [
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      premiumIcon: <Settings className="w-5 h-5" />,
      href: '/settings',
      description: 'Master configuration',
      shortcut: '⌘ + ,',
      glowColor: 'from-gray-600 to-gray-500'
    },
    {
      id: 'security',
      label: 'Security',
      icon: <Shield className="w-5 h-5" />,
      premiumIcon: <Lock className="w-5 h-5" />,
      href: '/security',
      description: 'Advanced protection',
      badge: 'PRO',
      badgeVariant: 'pro' as const,
      shortcut: '⌘ + ;',
      glowColor: 'from-green-600 to-emerald-500'
    },
    {
      id: 'help',
      label: 'Academy',
      icon: <HelpCircle className="w-5 h-5" />,
      premiumIcon: <MessageSquare className="w-5 h-5" />,
      href: '/help',
      description: 'Expert training',
      shortcut: '⌘ + ?',
      glowColor: 'from-violet-600 to-purple-500'
    },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close sidebar on Escape
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const renderMenuItem = (item: EnhancedMenuItem) => {
    const isActive = item.active;
    const isHovered = activeHover === item.id;

    return (
      <a
        key={item.id}
        href={item.href}
        className={cn(
          'group relative flex items-center',
          'rounded-xl transition-all duration-300 ease-out-expo',
          'border',
          isActive
            ? cn(
                'bg-gradient-to-r from-blue-500/10 to-cyan-500/10',
                isDark 
                  ? 'border-blue-500/20' 
                  : 'border-blue-200'
              )
            : cn(
                'border-transparent hover:border-gray-300/50',
                isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-100/50'
              ),
          collapsed ? 'p-3 justify-center' : 'p-3 gap-3'
        )}
        onMouseEnter={() => setActiveHover(item.id)}
        onMouseLeave={() => setActiveHover(null)}
        title={collapsed ? `${item.label} • ${item.description}` : undefined}
      >
        {/* Active indicator */}
        {isActive && !collapsed && (
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-blue-400 to-cyan-400" />
        )}

        {/* Icon */}
        <div className={cn(
          'relative flex-shrink-0',
          collapsed ? 'mx-auto' : ''
        )}>
          <div className={cn(
            'p-2 rounded-lg transition-all duration-300',
            isDark 
              ? 'bg-gray-800/50 border border-gray-700/50' 
              : 'bg-gray-100 border border-gray-200',
            isActive && (isDark ? 'border-blue-500/30' : 'border-blue-300'),
            isHovered && 'scale-110'
          )}>
            <div className={cn(
              'transition-colors duration-300',
              isActive 
                ? (isDark ? 'text-cyan-400' : 'text-blue-600')
                : (isDark ? 'text-gray-400' : 'text-gray-600')
            )}>
              {item.premiumIcon || item.icon}
            </div>
          </div>
        </div>

        {/* Text content - hidden when collapsed */}
        {!collapsed && (
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between">
              <span className={cn(
                'font-medium text-sm truncate',
                isActive 
                  ? (isDark ? 'text-white' : 'text-gray-900')
                  : (isDark ? 'text-gray-300' : 'text-gray-700')
              )}>
                {item.label}
              </span>
              
              {item.badge && (
                <span className={cn(
                  'px-2 py-0.5 text-xs font-bold rounded-full border',
                  item.badgeVariant === 'urgent'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : item.badgeVariant === 'pro'
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                )}>
                  {item.badge}
                </span>
              )}
            </div>
            
            <p className={cn(
              'text-xs truncate',
              isDark ? 'text-gray-500' : 'text-gray-500'
            )}>
              {item.description}
            </p>
            
            <div className="flex items-center justify-between">
              {item.stats && (
                <span className={cn(
                  'text-xs font-medium',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}>
                  {item.stats}
                </span>
              )}
              {item.shortcut && (
                <kbd className={cn(
                  'px-1.5 py-0.5 text-xs rounded border',
                  isDark 
                    ? 'bg-gray-800 text-gray-400 border-gray-700' 
                    : 'bg-gray-100 text-gray-600 border-gray-300'
                )}>
                  {item.shortcut}
                </kbd>
              )}
            </div>
          </div>
        )}
      </a>
    );
  };

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        'h-full flex flex-col',
        'backdrop-blur-xl border-r',
        'transition-all duration-300 ease-in-out',
        // Theme
        isDark 
          ? 'bg-gray-900/95 border-gray-800/50' 
          : 'bg-white/95 border-gray-200/60',
        // Collapsed state
        collapsed ? 'w-20' : 'w-80',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Header */}
      <div className={cn(
        'p-4 border-b',
        isDark ? 'border-gray-800/50' : 'border-gray-200/50'
      )}>
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className={cn(
                  'font-bold',
                  isDark ? 'text-white' : 'text-gray-900'
                )}>
                  CustoCare
                </h2>
                <p className={cn(
                  'text-xs',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}>
                  Healthcare Pro
                </p>
              </div>
            </div>
          )}
          
          {/* Close button for mobile */}
          <button
            onClick={() => onClose?.()}
            className={cn(
              'lg:hidden p-2 rounded-lg',
              isDark 
                ? 'hover:bg-gray-800 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-600'
            )}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {!collapsed && (
          <div className="mb-4">
            <p className={cn(
              'text-xs font-semibold uppercase tracking-wider px-2',
              isDark ? 'text-gray-500' : 'text-gray-400'
            )}>
              Navigation
            </p>
          </div>
        )}

        <div className="space-y-2">
          {menuItems.map((item) => renderMenuItem(item))}
        </div>

        {!collapsed && (
          <>
            <div className="my-6 border-t border-gray-200/50 dark:border-gray-800/50" />
            
            <div className="space-y-2">
              {secondaryMenuItems.map((item) => renderMenuItem(item))}
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className={cn(
        'p-4 border-t',
        isDark ? 'border-gray-800/50' : 'border-gray-200/50'
      )}>
        {!collapsed ? (
          <div className="space-y-4">
            <div className={cn(
              'p-3 rounded-lg border',
              isDark 
                ? 'bg-gray-800/50 border-gray-700/50' 
                : 'bg-gray-100/50 border-gray-200/50'
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  isDark ? 'bg-cyan-500/20' : 'bg-cyan-100'
                )}>
                  <Bell className={cn(
                    'w-4 h-4',
                    isDark ? 'text-cyan-400' : 'text-cyan-600'
                  )} />
                </div>
                <div>
                  <p className={cn(
                    'text-sm font-medium',
                    isDark ? 'text-white' : 'text-gray-900'
                  )}>
                    Quick Support
                  </p>
                  <p className={cn(
                    'text-xs',
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    24/7 priority assistance
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white/70" />
                </div>
              </div>
              <div className="flex-1">
                <p className={cn(
                  'text-sm font-medium truncate',
                  isDark ? 'text-white' : 'text-gray-900'
                )}>
                  Dr. Alexander
                </p>
                <p className={cn(
                  'text-xs truncate',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}>
                  Chief Physician
                </p>
              </div>
              <button className="p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-800/50">
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <button className="w-full p-3 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-800/50">
              <Bell className="w-5 h-5 mx-auto text-gray-500 dark:text-gray-400" />
            </button>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 mx-auto overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-white/70" />
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;