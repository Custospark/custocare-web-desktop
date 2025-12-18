import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Menu, Search, Bell, User, ChevronDown, 
  Sparkles, Shield, Settings, LogOut, X,
  Sun, Moon, Clock, Calendar, FileText, Users as UsersIcon
} from 'lucide-react';
import { SearchResult } from '../../types/index';
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
 * Premium Navbar Component
 * Receives all state and handlers as props from parent Layout
 */
export const Navbar: React.FC<NavbarProps> = ({ 
  theme = 'dark',
  onMenuClick,
  onThemeToggle,
  onSearch,
  searchQuery = '',
  className
}) => {
  // Local state management
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  // Mock search results
  const mockSearchResults: SearchResult[] = [
    {
      id: '1',
      title: 'John Doe',
      type: 'patient',
      description: 'Patient ID: PT-2023-8492 • 42yo Male',
      icon: <UsersIcon className="w-4 h-4" />
    },
    {
      id: '2',
      title: 'Blood Test Results',
      type: 'report',
      description: 'Lab report from 12/05/2023',
      icon: <FileText className="w-4 h-4" />
    },
    {
      id: '3',
      title: 'Amoxicillin 500mg',
      type: 'medication',
      description: 'Prescription • 2 refills remaining',
      icon: <Calendar className="w-4 h-4" />
    },
    {
      id: '4',
      title: 'Follow-up Appointment',
      type: 'appointment',
      description: 'Scheduled for Dec 20, 2023 • 10:00 AM',
      icon: <Clock className="w-4 h-4" />
    },
  ];

  const notifications = [
    { id: 1, title: 'New Patient Admission', time: '5 min ago', read: false, type: 'patient' as const },
    { id: 2, title: 'Lab Results Ready', time: '1 hour ago', read: true, type: 'report' as const },
    { id: 3, title: 'Meeting Reminder', time: '2 hours ago', read: true, type: 'appointment' as const },
    { id: 4, title: 'Prescription Expiring', time: '1 day ago', read: false, type: 'medication' as const },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  // Handle search input
  const handleSearch = useCallback((query: string) => {
    setLocalSearchQuery(query);
    
    if (query.trim()) {
      const filtered = mockSearchResults.filter(result =>
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.description?.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
    
    // Call parent callback if provided
    if (onSearch) {
      onSearch(query);
    }
  }, [onSearch]);

  // Sync local search query with prop
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Handle click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setLocalSearchQuery('');
    setSearchResults([]);
    if (onSearch) {
      onSearch('');
    }
  }, [onSearch]);

  return (
    <nav
      className={cn(
        'sticky top-0 z-50',
        'h-20 flex items-center justify-between px-6 lg:px-8',
        'border-b backdrop-blur-xl',
        'transition-all duration-300',
        isDark 
          ? 'bg-gray-900/95 border-gray-800/50 shadow-2xl shadow-black/20' 
          : 'bg-white/95 border-gray-200/60 shadow-lg shadow-gray-900/5',
        className
      )}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Menu Button */}
        <button
          onClick={onMenuClick}
          className={cn(
            'lg:hidden p-2.5 rounded-xl transition-all duration-200 active:scale-95',
            isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100/80'
          )}
          aria-label="Toggle menu"
        >
          <Menu className={cn('w-5 h-5', isDark ? 'text-gray-400' : 'text-gray-600')} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white shadow-sm" />
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
            <p className={cn('text-xs mt-0.5', isDark ? 'text-gray-400' : 'text-gray-500')}>
              Intelligent Healthcare Platform
            </p>
          </div>
        </div>
      </div>

      {/* Center Section - Enhanced Search */}
      <div ref={searchRef} className="flex-1 max-w-2xl mx-6 hidden md:block">
        <div className="relative">
          <Search className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200",
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
              "w-full pl-12 pr-4 py-3",
              "rounded-2xl text-sm transition-all duration-300 placeholder:text-gray-400",
              "focus:outline-none focus:ring-2",
              isDark
                ? "bg-gray-800/50 border border-gray-700/50 focus:ring-cyan-500/30 focus:border-cyan-500/50 placeholder:text-gray-500"
                : "bg-gray-50/80 border border-gray-300/50 focus:ring-blue-500/30 focus:border-blue-300/50",
              "shadow-sm hover:shadow-md"
            )}
          />
          
          {/* Clear search button */}
          {localSearchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}

          {/* Search Suggestions Dropdown */}
          {isSearchFocused && (searchResults.length > 0 || localSearchQuery) && (
            <div className={cn(
              'absolute top-full mt-2 w-full rounded-2xl shadow-2xl border z-50 animate-fade-in',
              isDark 
                ? 'bg-gray-900 border-gray-800' 
                : 'bg-white border-gray-200/60'
            )}>
              {/* Search results */}
              {searchResults.length > 0 ? (
                <>
                  <div className={cn(
                    "p-3 border-b",
                    isDark ? "border-gray-800/50" : "border-gray-200"
                  )}>
                    <p className={cn(
                      'text-xs font-semibold uppercase tracking-wider px-2',
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    )}>
                      Search Results
                    </p>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        className={cn(
                          'w-full text-left p-3 border-b last:border-0 transition-colors',
                          'flex items-center gap-3',
                          isDark 
                            ? 'hover:bg-gray-800 border-gray-800/50' 
                            : 'hover:bg-gray-50 border-gray-100'
                        )}
                        onClick={() => {
                          setLocalSearchQuery(result.title);
                          if (onSearch) onSearch(result.title);
                          setIsSearchFocused(false);
                        }}
                      >
                        <div className={cn(
                          'p-2 rounded-lg',
                          isDark ? 'bg-gray-800' : 'bg-gray-100'
                        )}>
                          <div className={cn(
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          )}>
                            {result.icon}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'font-medium truncate',
                            isDark ? 'text-gray-200' : 'text-gray-900'
                          )}>
                            {result.title}
                          </p>
                          <p className={cn(
                            'text-sm truncate',
                            isDark ? 'text-gray-500' : 'text-gray-600'
                          )}>
                            {result.description}
                          </p>
                        </div>
                        <span className={cn(
                          'px-2 py-1 text-xs font-medium rounded-full',
                          result.type === 'patient' 
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                            : result.type === 'report'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : result.type === 'medication'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        )}>
                          {result.type}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                // No results found
                <div className="p-6 text-center">
                  <div className={cn(
                    'w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center',
                    isDark ? 'bg-gray-800' : 'bg-gray-100'
                  )}>
                    <Search className={cn(
                      'w-5 h-5',
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    )} />
                  </div>
                  <p className={cn(
                    'font-medium mb-1',
                    isDark ? 'text-gray-300' : 'text-gray-900'
                  )}>
                    No results found
                  </p>
                  <p className={cn(
                    'text-sm',
                    isDark ? 'text-gray-500' : 'text-gray-600'
                  )}>
                    Try searching for patients, reports, or medications
                  </p>
                </div>
              )}
              
              {/* Quick search tips */}
              <div className={cn(
                'p-3 border-t',
                isDark ? 'border-gray-800/50 bg-gray-900/50' : 'border-gray-100 bg-gray-50/50'
              )}>
                <p className={cn(
                  'text-xs font-medium mb-2',
                  isDark ? 'text-gray-500' : 'text-gray-400'
                )}>
                  Quick tips:
                </p>
                <div className="flex flex-wrap gap-2">
                  {['john doe', 'lab results', 'amoxicillin', 'appointment'].map((tip) => (
                    <button
                      key={tip}
                      onClick={() => handleSearch(tip)}
                      className={cn(
                        'px-2 py-1 text-xs rounded-full transition-colors',
                        isDark 
                          ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300' 
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-700'
                      )}
                    >
                      {tip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Mobile search button */}
        <button
          className={cn(
            'md:hidden p-2.5 rounded-xl transition-colors',
            isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100/80'
          )}
          aria-label="Search"
        >
          <Search className={cn('w-5 h-5', isDark ? 'text-gray-400' : 'text-gray-600')} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onThemeToggle}
          className={cn(
            'p-2.5 rounded-xl transition-all duration-200 hover:scale-105',
            isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100/80'
          )}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-600" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={cn(
              "relative p-2.5 rounded-xl transition-all duration-200 hover:scale-105",
              isDark ? "hover:bg-gray-800" : "hover:bg-gray-100/80",
              isNotificationsOpen && (isDark ? "bg-gray-800" : "bg-gray-100/80")
            )}
            aria-label="Notifications"
          >
            <Bell className={cn(
              "w-5 h-5 transition-colors duration-200",
              isNotificationsOpen 
                ? (isDark ? "text-cyan-400" : "text-blue-500") 
                : (isDark ? "text-gray-400" : "text-gray-600")
            )} />
            
            {/* Notification badge */}
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5">
                <span className="flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-r from-red-500 to-red-600"></span>
                </span>
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsNotificationsOpen(false)}
              />
              <div className={cn(
                'absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl border z-50 animate-slide-down',
                isDark 
                  ? 'bg-gray-900 border-gray-800' 
                  : 'bg-white border-gray-200/60'
              )}>
                <div className={cn(
                  'p-4 border-b',
                  isDark ? 'border-gray-800' : 'border-gray-200/60'
                )}>
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
                          : "hover:bg-gray-50/50 border-gray-100",
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
                        <div className="flex-1 min-w-0">
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
                            <span className={cn(
                              'px-1.5 py-0.5 text-xs rounded-full',
                              notification.type === 'patient' 
                                ? (isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700')
                                : notification.type === 'report'
                                ? (isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700')
                                : notification.type === 'medication'
                                ? (isDark ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700')
                                : (isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700')
                            )}>
                              {notification.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className={cn(
                  'p-3 border-t',
                  isDark ? 'border-gray-800' : 'border-gray-200/60'
                )}>
                  <button className={cn(
                    "w-full text-center text-sm font-medium py-2 rounded-lg transition-colors",
                    isDark 
                      ? "text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10" 
                      : "text-blue-600 hover:text-blue-700 hover:bg-blue-50/50"
                  )}>
                    View all notifications
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className={cn(
              "flex items-center gap-3 pl-3 pr-2 py-2 rounded-2xl transition-all duration-200",
              isDark 
                ? "hover:bg-gray-800" 
                : "hover:bg-gray-100/80",
              isUserDropdownOpen && (isDark ? "bg-gray-800" : "bg-gray-100/80")
            )}
            aria-label="User menu"
          >
            <div className="hidden lg:block text-right">
              <p className={cn(
                'text-sm font-semibold',
                isDark ? 'text-gray-200' : 'text-gray-900'
              )}>
                Dr. Okafor
              </p>
              <p className={cn(
                'text-xs flex items-center gap-1',
                isDark ? 'text-gray-500' : 'text-gray-600'
              )}>
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                Physician • Online
              </p>
            </div>
            
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full p-0.5">
                <div className="w-full h-full bg-emerald-400 rounded-full border border-white"></div>
              </div>
            </div>
            
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform duration-200",
              isDark ? "text-gray-500" : "text-gray-600",
              isUserDropdownOpen && "rotate-180"
            )} />
          </button>

          {/* User Dropdown */}
          {isUserDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsUserDropdownOpen(false)}
              />
              <div className={cn(
                'absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl border z-50 animate-slide-down',
                isDark 
                  ? 'bg-gray-900 border-gray-800' 
                  : 'bg-white border-gray-200/60'
              )}>
                {/* User Info */}
                <div className={cn(
                  'p-4 border-b',
                  isDark 
                    ? 'bg-gradient-to-r from-gray-900/50 to-gray-800/50 border-gray-800' 
                    : 'bg-gradient-to-r from-gray-50/50 to-white border-gray-200/60'
                )}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
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
                  <div className={cn(
                    'mt-3 px-2 py-1.5 text-xs font-medium rounded-lg inline-flex items-center gap-1',
                    isDark 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : 'bg-emerald-100 text-emerald-700'
                  )}>
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                    Active • 2.4K patients
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  {[
                    { icon: User, label: 'My Profile', badge: 'New' },
                    { icon: Settings, label: 'Account Settings' },
                    { icon: Shield, label: 'Privacy & Security' },
                    { icon: Sparkles, label: 'Upgrade Plan', variant: 'premium' as const },
                  ].map((item) => (
                    <button
                      key={item.label}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors",
                        isDark 
                          ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200" 
                          : "text-gray-700 hover:bg-gray-50/80 hover:text-gray-900",
                        item.variant === 'premium' && (isDark ? "hover:bg-cyan-500/10" : "hover:bg-blue-50/50")
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={cn(
                          "w-4 h-4",
                          item.variant === 'premium' 
                            ? (isDark ? "text-cyan-400" : "text-blue-600") 
                            : (isDark ? "text-gray-500" : "text-gray-600")
                        )} />
                        <span className={cn(
                          item.variant === 'premium' && "font-semibold",
                          item.variant === 'premium' 
                            ? (isDark ? "text-cyan-400" : "text-blue-600") 
                            : ""
                        )}>
                          {item.label}
                        </span>
                      </div>
                      {item.badge && (
                        <span className={cn(
                          'px-2 py-0.5 text-xs font-semibold rounded-full',
                          isDark 
                            ? 'bg-cyan-500/20 text-cyan-300' 
                            : 'bg-blue-100 text-blue-700'
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Logout */}
                <div className={cn(
                  'p-2 border-t',
                  isDark ? 'border-gray-800' : 'border-gray-200/60'
                )}>
                  <button className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group",
                    isDark 
                      ? "text-gray-400 hover:bg-red-500/10 hover:text-red-400" 
                      : "text-gray-700 hover:bg-red-50/80 hover:text-red-600"
                  )}>
                    <LogOut className={cn(
                      "w-4 h-4 transition-colors",
                      isDark 
                        ? "text-gray-500 group-hover:text-red-400" 
                        : "text-gray-600 group-hover:text-red-500"
                    )} />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default React.memo(Navbar);
