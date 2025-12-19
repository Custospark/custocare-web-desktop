import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
   Search, Bell, User, ChevronDown, 
  Sparkles, Shield, Settings, LogOut, X,
  Sun, Moon, 
} from 'lucide-react';
// import { SearchResult } from '../../types/index';
import { cn } from '../../types/cn';

export interface NavbarProps {
  theme?: 'light' | 'dark';
  onMenuClick?: () => void;
  onThemeToggle?: () => void;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  className?: string;
}

/**
 * Premium Navbar Component - Enhanced UX
 */
export const Navbar: React.FC<NavbarProps> = ({ 
  theme = 'dark',
  onThemeToggle,
  onSearch,
  searchQuery = '',
  className
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  // Mock data
  // const mockSearchResults: SearchResult[] = [
  //   { id: '1', title: 'John Doe', type: 'patient', description: 'Patient ID: PT-2023-8492 • 42yo Male', icon: <UsersIcon className="w-4 h-4" /> },
  //   { id: '2', title: 'Blood Test Results', type: 'report', description: 'Lab report from 12/05/2023', icon: <FileText className="w-4 h-4" /> },
  //   { id: '3', title: 'Amoxicillin 500mg', type: 'medication', description: 'Prescription • 2 refills remaining', icon: <Calendar className="w-4 h-4" /> },
  //   { id: '4', title: 'Follow-up Appointment', type: 'appointment', description: 'Scheduled for Dec 20, 2023 • 10:00 AM', icon: <Clock className="w-4 h-4" /> },
  // ];

  const notifications = [
    { id: 1, title: 'New Patient Admission', time: '5 min ago', read: false, type: 'patient' as const },
    { id: 2, title: 'Lab Results Ready', time: '1 hour ago', read: true, type: 'report' as const },
    { id: 3, title: 'Meeting Reminder', time: '2 hours ago', read: true, type: 'appointment' as const },
    { id: 4, title: 'Prescription Expiring', time: '1 day ago', read: false, type: 'medication' as const },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  // Search handler
  const handleSearch = useCallback((query: string) => {
    setLocalSearchQuery(query);
    if (onSearch) onSearch(query);
  }, [onSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setLocalSearchQuery('');
    if (onSearch) onSearch('');
  }, [onSearch]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav
      className={cn(
        'flex-1 flex items-center justify-between',
        'transition-all duration-300',
        className
      )}
    >
      {/* Left Section - Brand */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          
          <div className="hidden md:block">
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent',
                isDark ? 'from-white to-gray-300' : 'from-gray-900 to-gray-700'
              )}>
                CustoCare AI
              </span>
              <span className={cn(
                'px-2 py-0.5 text-xs font-semibold rounded-full border',
                isDark 
                  ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 border-cyan-500/30' 
                  : 'bg-gradient-to-r from-blue-100 to-cyan-50 text-blue-700 border-blue-200'
              )}>
                <Sparkles className="w-3 h-3 inline mr-1" />
                Pro
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Section - Search */}
      <div ref={searchRef} className="flex-1 max-w-2xl mx-6 hidden md:block">
        <div className="relative">
          <Search className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
            isSearchFocused 
              ? (isDark ? "text-cyan-400" : "text-blue-500") 
              : (isDark ? "text-gray-500" : "text-gray-400")
          )} />
          <input
            type="text"
            value={localSearchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            placeholder="Search patients, reports, medications..."
            className={cn(
                    "w-full pl-12 pr-10 py-2.5 rounded-xl text-sm",
                    "border transition-all duration-300",
                    isDark
                      ? "bg-slate-900/60 border-blue-900/40 text-slate-100 placeholder-slate-400 focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/25"
                      : "bg-blue-50/70 border-blue-200/60 text-slate-900 placeholder-slate-500 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-400/25"
                  )
}
          />
          
          {localSearchQuery && (
            <button
  onClick={clearSearch}
  className={cn(
    "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full",
    "transition-all duration-200",
    "hover:scale-105 active:scale-95",
    isDark
      ? "hover:bg-blue-500/15"
      : "hover:bg-blue-100/70"
  )}
>
  <X
    className={cn(
      "w-4 h-4 transition-colors duration-200",
      isDark ? "text-blue-300" : "text-blue-500"
    )}
  />
</button>

          )}
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        {/* Mobile search */}
        <button className="md:hidden p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-800/50">
          <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={onThemeToggle}
          className={cn(
            'p-2 rounded-lg transition-all duration-300 hover:scale-110',
            isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
          )}
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-600" />
          )}
        </button>

        {/* Notifications */}
        <div ref={notificationsRef} className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={cn(
              "p-2 rounded-lg transition-all duration-300 hover:scale-110 relative",
              isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
            )}
          >
            <Bell className={cn(
              "w-5 h-5 transition-colors",
              isNotificationsOpen 
                ? (isDark ? "text-cyan-400" : "text-blue-500") 
                : (isDark ? "text-gray-400" : "text-gray-600")
            )} />
            
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className={cn(
              'absolute right-0 mt-2 w-80 rounded-xl border shadow-2xl z-50',
              isDark 
                ? 'bg-gray-900 border-gray-800' 
                : 'bg-white border-gray-200'
            )}>
              <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50">
                <div className="flex items-center justify-between">
                  <h3 className={cn(
                    'font-semibold',
                    isDark ? 'text-gray-200' : 'text-gray-900'
                  )}>
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className={cn(
                      'px-2 py-1 text-xs font-semibold rounded-full',
                      isDark 
                        ? 'bg-cyan-500/20 text-cyan-300' 
                        : 'bg-blue-100 text-blue-700'
                    )}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 border-b last:border-0 transition-colors",
                      isDark 
                        ? "hover:bg-gray-800 border-gray-800" 
                        : "hover:bg-gray-50 border-gray-100",
                      !notification.read && (isDark ? "bg-cyan-500/10" : "bg-blue-50/30")
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "w-2 h-2 mt-2 rounded-full flex-shrink-0",
                        notification.read 
                          ? (isDark ? "bg-gray-700" : "bg-gray-300") 
                          : (isDark ? "bg-cyan-500" : "bg-blue-500")
                      )} />
                      <div className="flex-1">
                        <p className={cn(
                          'font-medium',
                          isDark ? 'text-gray-200' : 'text-gray-900'
                        )}>
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            'text-xs',
                            isDark ? 'text-gray-500' : 'text-gray-600'
                          )}>
                            {notification.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div ref={userDropdownRef} className="relative">
          <button
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className={cn(
              "flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-xl transition-all",
              isDark 
                ? "hover:bg-gray-800" 
                : "hover:bg-gray-100"
            )}
          >
            <div className="text-right hidden md:block">
              <p className={cn(
                'text-sm font-medium',
                isDark ? 'text-gray-200' : 'text-gray-900'
              )}>
                Dr. Okafor
              </p>
              <p className={cn(
                'text-xs',
                isDark ? 'text-gray-500' : 'text-gray-600'
              )}>
                Physician
              </p>
            </div>
            
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform",
              isUserDropdownOpen && "rotate-180"
            )} />
          </button>

          {isUserDropdownOpen && (
            <div className={cn(
              'absolute right-0 mt-2 w-64 rounded-xl border shadow-2xl z-50',
              isDark 
                ? 'bg-gray-900 border-gray-800' 
                : 'bg-white border-gray-200'
            )}>
              <div className="p-4 border-b border-gray-200/50 dark:border-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className={cn(
                      'font-semibold',
                      isDark ? 'text-gray-200' : 'text-gray-900'
                    )}>
                      Dr. Alexander Okafor
                    </p>
                    <p className={cn(
                      'text-sm',
                      isDark ? 'text-gray-500' : 'text-gray-600'
                    )}>
                      Chief Physician
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2">
                {[
                  { icon: User, label: 'My Profile' },
                  { icon: Settings, label: 'Settings' },
                  { icon: Shield, label: 'Security' },
                  { icon: Sparkles, label: 'Upgrade Plan' },
                ].map((item) => (
                  <button
                    key={item.label}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                      isDark 
                        ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200" 
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-2 border-t border-gray-200/50 dark:border-gray-800/50">
                <button className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isDark 
                    ? "text-gray-400 hover:bg-red-500/10 hover:text-red-400" 
                    : "text-gray-700 hover:bg-red-50 hover:text-red-600"
                )}>
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default React.memo(Navbar);