// MedicationAutocomplete.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, Pill, AlertCircle, Check, Package } from 'lucide-react';
import { cn } from '../../../../../../shared/utils/classNameUtils';
import { useGetBillableItems } from '../../../../api/billable-items/BillableItemsQueries';
import { BillableItemType, type BillableItem, isInventoryItem } from '../../../../api/billable-items/BillingItemsTypes';
import type { ColorTokens } from './prescriptionForm.types';
import { formatCurrency } from '../../billing-space';
import { formatText } from '../../../revenue/stats/billing-revenue-stats-component/revenueDashboardUtils';

interface MedicationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (medication: BillableItem) => void;
  placeholder?: string;
  required?: boolean;
  isDark: boolean;
  colors: ColorTokens;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  hasAllergyWarning?: boolean;
}

interface SuggestionItem {
  id: number;
  name: string;
  code: string;
  category: string;
  form?: string;
  strength?: string;
  unitPrice?: number;
  isInventory: boolean;
  originalItem: BillableItem;
  stockLevel?: number;
  isLowStock?: boolean;
  isOutOfStock?: boolean;
  packageQuantity?: number;
}

// Helper function for fuzzy matching
const fuzzyMatch = (text: string, searchTerm: string): boolean => {
  const normalizedText = text.toLowerCase().trim();
  const normalizedSearch = searchTerm.toLowerCase().trim();
  
  if (normalizedSearch.length === 0) return false;
  
  if (normalizedText.includes(normalizedSearch)) return true;
  
  let searchIndex = 0;
  for (let i = 0; i < normalizedText.length && searchIndex < normalizedSearch.length; i++) {
    if (normalizedText[i] === normalizedSearch[searchIndex]) {
      searchIndex++;
    }
  }
  return searchIndex === normalizedSearch.length;
};

// Calculate relevance score for sorting
const getRelevanceScore = (item: BillableItem, searchTerm: string): number => {
  const term = searchTerm.toLowerCase().trim();
  const name = item.name.toLowerCase();
  const code = item.code.toLowerCase();
  const category = item.category.toLowerCase();
  
  let score = 0;
  
  if (name === term) score += 100;
  else if (name.startsWith(term)) score += 80;
  else if (name.includes(term)) score += 60;
  
  if (code === term) score += 90;
  else if (code.startsWith(term)) score += 70;
  else if (code.includes(term)) score += 50;
  
  if (category.includes(term)) score += 30;
  
  if ('generic_name' in item && item.generic_name) {
    const genericName = item.generic_name.toLowerCase();
    if (genericName.includes(term)) score += 40;
  }
  
  return score;
};

// Helper function to get stock information - follows the same pattern as SearchBar
const getStockInfo = (item: BillableItem): { 
  isOutOfStock: boolean; 
  isLowStock?: boolean; 
  stockLevel?: number;
  packageQuantity?: number;
  unitOfMeasure?: string;
} => {
  if (isInventoryItem(item)) {
    const packageQuantity = Number(item.package_quantity);
    const isOutOfStock = packageQuantity <= 0;
    const isLowStock = item.stock?.is_low_stock ?? false;
    
    return {
      isOutOfStock: isOutOfStock,
      isLowStock: !isOutOfStock && isLowStock,
      stockLevel: packageQuantity > 0 ? packageQuantity : undefined,
      packageQuantity: packageQuantity > 0 ? packageQuantity : undefined,
      unitOfMeasure: item.unit_of_measure
    };
  }
  
  return { 
    isOutOfStock: false, 
    isLowStock: false,
    stockLevel: undefined,
    packageQuantity: undefined,
    unitOfMeasure: undefined
  };
};

// Get stock badge text and styling
const getStockDisplay = (item: BillableItem, isDark: boolean): { text: string; className: string } | null => {
  if (!isInventoryItem(item)) {
    return null;
  }
  
  const packageQuantity = Number(item.package_quantity);
  const isOutOfStock = packageQuantity <= 0;
  const isLowStock = item.stock?.is_low_stock ?? false;
  const unitName = item.unit_of_measure ?? 'unit';
  
  const pluralUnit = unitName.endsWith('y') 
    ? unitName.slice(0, -1) + 'ies' 
    : unitName.endsWith('s') 
      ? unitName 
      : unitName + 's';
  
  const displayUnit = packageQuantity === 1 ? unitName : pluralUnit;
  
  if (isOutOfStock) {
    return {
      text: 'Out of stock',
      className: isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
    };
  }
  
  if (isLowStock) {
    return {
      text: `Low stock: ${packageQuantity} ${displayUnit}`,
      className: isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'
    };
  }
  
  return {
    text: `${packageQuantity} ${displayUnit}`,
    className: isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
  };
};

export const MedicationAutocomplete: React.FC<MedicationAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = "Search for medication...",
  required = false,
  isDark,
  colors,
  disabled = false,
  autoFocus = false,
  className = "",
  hasAllergyWarning = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const [justSelected, setJustSelected] = useState(false);
  const [prevSuggestionsLength, setPrevSuggestionsLength] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>(null);
  const suggestionRefs = useRef<HTMLDivElement[]>([]);

  // Fetch billable items
  const { data, isLoading, isError } = useGetBillableItems(
    {
      limit: 200,
      include_inactive: false,
      type: BillableItemType.ALL,
    },
    {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );

  // Smart suggestions with fuzzy matching and relevance scoring
  const suggestions = useMemo(() => {
    const allItems = data?.data?.items_full || [];
    const searchTerm = searchQuery.trim();
    
    if (!searchTerm) return [];
    
    const scored = allItems
      .filter(item => {
        const nameMatch = fuzzyMatch(item.name, searchTerm);
        const codeMatch = fuzzyMatch(item.code, searchTerm);
        const categoryMatch = fuzzyMatch(item.category, searchTerm);
        
        let genericMatch = false;
        if ('generic_name' in item && item.generic_name) {
          genericMatch = fuzzyMatch(item.generic_name, searchTerm);
        }
        
        return nameMatch || codeMatch || categoryMatch || genericMatch;
      })
      .map(item => {
        const score = getRelevanceScore(item, searchTerm);
        let form = '';
        let strength = '';
        const isInventory = isInventoryItem(item);
        
        if (isInventory) {
          if (item.dosage_form) form = item.dosage_form;
          if (item.strength) strength = item.strength;
        }
        
        const stockInfo = getStockInfo(item);
        
        return {
          id: item.id,
          name: item.name,
          code: item.code,
          category: item.category,
          form,
          strength,
          unitPrice: item.unitPrice,
          isInventory,
          originalItem: item,
          score,
          ...stockInfo
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
    
    return scored;
  }, [data, searchQuery]);

  // Fixed: Improved highlight function with case-insensitive matching and proper spacing
  const highlightMatch = useCallback((text: string, search: string) => {
    if (!search.trim()) return text;
    
    // Create a case-insensitive regex that matches the search term
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedSearch})`, 'gi');
    
    // Split the text and preserve the matched parts
    const parts = text.split(regex);
    
    return parts.map((part, i) => {
      // Check if this part matches the search term (case-insensitive)
      const isMatch = regex.test(part);
      // Reset regex lastIndex since we're reusing it
      regex.lastIndex = 0;
      
      if (isMatch) {
        return (
          <mark 
            key={i} 
            className={cn(
              'bg-green-500/20 text-green-700 dark:bg-green-500/30 dark:text-green-300 rounded-none px-0 font-semibold',
              'inline'
            )}
            style={{ 
              backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)',
              color: isDark ? '#86efac' : '#15803d'
            }}
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  }, [isDark]);

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback((suggestion: SuggestionItem) => {
    if (suggestion.isOutOfStock) {
      return;
    }
    
    setJustSelected(true);
    onChange(suggestion.name);
    setSearchQuery(suggestion.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
    
    if (onSelect) {
      onSelect(suggestion.originalItem);
    }
    
    setTimeout(() => {
      setJustSelected(false);
    }, 300);
    
    inputRef.current?.focus();
  }, [onChange, onSelect]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onChange(newValue);
    
    // Only show dropdown when typing and not just selected
    if (newValue.trim() && !justSelected) {
      setIsTyping(true);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 300);
  }, [onChange, justSelected]);

  const handleClearInput = useCallback(() => {
    setSearchQuery('');
    onChange('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    setJustSelected(false);
    inputRef.current?.focus();
  }, [onChange]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter' && searchQuery.trim()) {
        setIsOpen(false);
        onChange(searchQuery);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          const selected = suggestions[highlightedIndex];
          if (!selected.isOutOfStock) {
            handleSelectSuggestion(selected);
          }
        } else if (searchQuery.trim()) {
          setIsOpen(false);
          onChange(searchQuery);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  }, [isOpen, suggestions, highlightedIndex, searchQuery, onChange, handleSelectSuggestion]);

  // Fixed: Reset highlighted index without causing cascading renders
  useEffect(() => {
    // Only reset if suggestions length changed and we're not just selecting
    if (suggestions.length !== prevSuggestionsLength && !justSelected) {
      setHighlightedIndex(-1);
      setPrevSuggestionsLength(suggestions.length);
    }
  }, [suggestions.length, prevSuggestionsLength, justSelected]);

  // Fixed: Scroll to highlighted item - no setState here
  useEffect(() => {
    if (highlightedIndex >= 0 && suggestionRefs.current[highlightedIndex]) {
      suggestionRefs.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [highlightedIndex]);

  // Fixed: Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Fixed: Sync searchQuery with value prop without causing cascading renders
  useEffect(() => {
    if (value !== searchQuery && !justSelected) {
      setSearchQuery(value);
      if (value && !searchQuery) {
        setIsOpen(false);
      }
    }
  }, [value, searchQuery, justSelected]); // Added justSelected dependency

  // Fixed: Don't auto-open on focus - only when typing
  const handleFocus = useCallback(() => {
    // Do nothing - dropdown only opens when typing
  }, []);

  const showSuggestions = isOpen && !disabled && !isError && (suggestions.length > 0 || isLoading || isTyping);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Pill className={cn('h-4 w-4', colors.text.tertiary)} />
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            autoFocus={autoFocus}
            className={cn(
              'w-full rounded-lg border pl-9 pr-16 py-2.5 text-sm transition-all duration-200',
              colors.bg.input,
              colors.text.primary,
              colors.border.primary,
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              disabled && 'cursor-not-allowed opacity-60',
              hasAllergyWarning && 'border-red-400 dark:border-red-600 ring-1 ring-red-400/50',
              className
            )}
          />
          
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {hasAllergyWarning && (
              <div className="relative group">
                <AlertCircle className="h-4 w-4 text-red-500 cursor-help" />
                <div className="absolute right-0 top-6 z-10 hidden group-hover:block whitespace-nowrap">
                  <div className={cn(
                    'text-xs px-2 py-1 rounded shadow-lg',
                    isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-900 text-white'
                  )}>
                    Allergy warning for this medication
                  </div>
                </div>
              </div>
            )}
            
            {(isLoading || isTyping) && (
              <Loader2 className={cn('h-4 w-4 animate-spin', colors.text.secondary)} />
            )}
            
            {!isLoading && !isTyping && searchQuery && (
              <button
                type="button"
                onClick={handleClearInput}
                className={cn(
                  'p-1 rounded-full transition-all duration-200 hover:scale-110',
                  colors.bg.hover,
                  'focus:outline-none'
                )}
                aria-label="Clear search"
              >
                <X className={cn('h-3.5 w-3.5', colors.text.secondary)} />
              </button>
            )}
            
            {!isLoading && !isTyping && !searchQuery && (
              <Search className={cn('h-4 w-4 mr-1', colors.text.tertiary)} />
            )}
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 mt-1.5 w-full max-h-96 overflow-y-auto rounded-xl border shadow-xl',
              colors.border.primary,
              colors.bg.card
            )}
            style={{ top: '100%', left: 0 }}
          >
            {isLoading && (
              <div className={cn('p-6 text-center text-sm', colors.text.secondary)}>
                <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                Loading medications...
              </div>
            )}
            
            {!isLoading && suggestions.length === 0 && searchQuery.trim() && (
              <div className={cn('p-6 text-center', colors.text.secondary)}>
                <div className="flex flex-col items-center gap-2">
                  <Search className="h-8 w-8 opacity-50" />
                  <p className="text-sm">No medications found matching "{searchQuery}"</p>
                  <p className="text-xs">Try a different search term or check the spelling</p>
                </div>
              </div>
            )}
            
            {suggestions.map((suggestion, index) => {
              const stockDisplay = getStockDisplay(suggestion.originalItem, isDark);
              const isOutOfStock = suggestion.isOutOfStock;
              
              return (
                <motion.div
                  key={`${suggestion.id}-${suggestion.code}`}
                  ref={el => {
                    if (el) {
                      suggestionRefs.current[index] = el;
                    }
                  }}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    'cursor-pointer px-4 py-3 transition-all duration-150',
                    isOutOfStock && 'cursor-not-allowed opacity-60',
                    index === highlightedIndex && !isOutOfStock
                      ? isDark ? 'bg-gray-700/70' : 'bg-gray-100'
                      : isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50',
                    index !== suggestions.length - 1 && cn('border-b', colors.border.subtle)
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className={cn('font-medium text-sm flex items-center gap-2 flex-wrap', 
                        isOutOfStock ? (isDark ? 'text-gray-500' : 'text-gray-400') : colors.text.primary
                      )}>
                        <span className="inline">
                          {highlightMatch(suggestion.name, searchQuery)}
                        </span>
                        {suggestion.isInventory && (
                          <span className={cn(
                            'text-xs px-1.5 py-0.5 rounded-full flex-shrink-0',
                            isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                          )}>
                            Medication
                          </span>
                        )}
                        {stockDisplay && (
                          <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0', stockDisplay.className)}>
                            {stockDisplay.text}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {suggestion.code && (
                          <span className={cn('text-xs', colors.text.tertiary)}>
                            Code: {highlightMatch(suggestion.code, searchQuery)}
                          </span>
                        )}
                        {suggestion.form && (
                          <span className={cn('text-xs px-1.5 py-0.5 rounded', colors.bg.subtle, colors.text.secondary)}>
                            {suggestion.form}
                          </span>
                        )}
                        {suggestion.strength && (
                          <span className={cn('text-xs px-1.5 py-0.5 rounded', colors.bg.subtle, colors.text.secondary)}>
                            {suggestion.strength}
                          </span>
                        )}
                        <span className={cn('text-xs px-1.5 py-0.5 rounded', colors.bg.subtle, colors.text.secondary)}>
                          {formatText(suggestion.category)}
                        </span>
                      </div>
                      
                      {isOutOfStock && (
                        <div className="flex items-center gap-1 mt-2">
                          <Package className="h-3 w-3 text-red-500" />
                          <span className="text-xs text-red-500">
                            Not available for dispensing
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {suggestion.unitPrice !== undefined && suggestion.unitPrice > 0 && (
                        <div className={cn('text-sm font-semibold whitespace-nowrap', 
                          isOutOfStock ? (isDark ? 'text-gray-500' : 'text-gray-400') : colors.text.brand
                        )}>
                          {formatCurrency(suggestion.unitPrice)}
                        </div>
                      )}
                      {index === highlightedIndex && !isOutOfStock && (
                        <Check className={cn('h-3.5 w-3.5', colors.text.brand)} />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MedicationAutocomplete;