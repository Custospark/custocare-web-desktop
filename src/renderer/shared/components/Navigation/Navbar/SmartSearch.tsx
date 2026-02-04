/**
 * ============================================================================
 * SMART SEARCH COMPONENT
 * ============================================================================
 * AI-powered search with keyboard shortcuts and category filtering
 */

import React, { useRef, useEffect, useState } from 'react';
import { Search, Command, ChevronRight, Brain, Sparkles } from 'lucide-react';
import { cn } from '../../../utils/classNameUtils';

interface SmartSearchItem {
  id: string;
  category: string;
  title: string;
  path: string;
  icon: React.ReactNode;
}

interface SmartSearchProps {
  isOpen: boolean;
  onToggle: () => void;
  isDark: boolean;
  isMobile: boolean;
  searchItems: SmartSearchItem[];
}

export const SmartSearch: React.FC<SmartSearchProps> = ({
  isOpen,
  onToggle,
  isDark,
  isMobile,
  searchItems,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const smartSearchRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (smartSearchRef.current && !smartSearchRef.current.contains(event.target as Node)) {
        if (isOpen) onToggle();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  // Reset search query when closing
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setSearchQuery(''), 0);
    }
  }, [isOpen]);

  const getDropdownPosition = () => {
    if (isMobile) {
      return 'fixed left-1/2 -translate-x-1/2 top-20 w-[calc(100vw-2rem)] max-w-md';
    }
    return 'absolute right-0 mt-2 w-96';
  };

  const filteredSearchResults = searchQuery 
    ? searchItems.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : searchItems.slice(0, 5);

  return (
    <div ref={smartSearchRef} className="relative">
      <button
        onClick={onToggle}
        className={cn(
          'p-2 rounded-lg transition-all duration-300 hover:scale-105 relative',
          isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
        )}
        title="Smart search (⌘K)"
      >
        <Search className={cn(
          'w-5 h-5 transition-colors',
          isOpen 
            ? (isDark ? 'text-cyan-400' : 'text-blue-500') 
            : (isDark ? 'text-gray-400' : 'text-gray-600')
        )} />
      </button>

      {isOpen && (
        <div className={cn(
          'rounded-xl border shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200',
          getDropdownPosition(),
          isDark 
            ? 'bg-gray-900 border-gray-800' 
            : 'bg-white border-gray-200'
        )}>
          <div className="p-3 border-b border-gray-200/50 dark:border-gray-800/50">
            <div className="relative">
              <Search className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
                isDark ? 'text-gray-500' : 'text-gray-400'
              )} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patients, reports, settings..."
                className={cn(
                  'w-full pl-10 pr-4 py-2 rounded-lg text-sm border transition-all',
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-cyan-500' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                )}
                autoFocus
              />
              <div className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border',
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-gray-500' 
                  : 'bg-gray-100 border-gray-300 text-gray-600'
              )}>
                <Command className="w-3 h-3" />K
              </div>
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto p-2">
            {filteredSearchResults.length > 0 ? (
              filteredSearchResults.map((item) => (
                <button
                  key={item.id}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all hover:scale-[1.02]',
                    isDark 
                      ? 'hover:bg-gray-800 text-gray-300' 
                      : 'hover:bg-gray-50 text-gray-700'
                  )}
                >
                  <div className={cn(
                    'p-2 rounded-lg',
                    isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                  )}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-xs font-medium mb-0.5',
                      isDark ? 'text-gray-500' : 'text-gray-600'
                    )}>
                      {item.category}
                    </p>
                    <p className={cn(
                      'text-sm font-medium truncate',
                      isDark ? 'text-gray-200' : 'text-gray-900'
                    )}>
                      {item.title}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              ))
            ) : (
              <div className="text-center py-8">
                <Brain className={cn(
                  'w-12 h-12 mx-auto mb-3',
                  isDark ? 'text-gray-700' : 'text-gray-300'
                )} />
                <p className={cn(
                  'text-sm font-medium',
                  isDark ? 'text-gray-500' : 'text-gray-600'
                )}>
                  No results found
                </p>
              </div>
            )}
          </div>

          <div className="p-2 border-t border-gray-200/50 dark:border-gray-800/50">
            <div className={cn(
              'text-xs px-3 py-2 rounded-lg flex items-center gap-2',
              isDark ? 'text-gray-500' : 'text-gray-600'
            )}>
              <Sparkles className="w-3 h-3" />
              <span>AI-powered search suggestions</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(SmartSearch);
