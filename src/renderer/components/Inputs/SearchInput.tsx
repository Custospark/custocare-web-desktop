import React, { forwardRef, useState } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  onClear?: () => void;
  fullWidth?: boolean;
}

/**
 * SearchInput Component
 * 
 * Specialized input for search functionality with clear button
 * 
 * Usage:
 * <SearchInput 
 *   placeholder="Search patients..."
 *   value={searchTerm}
 *   onChange={(e) => setSearchTerm(e.target.value)}
 *   onClear={() => setSearchTerm('')}
 * />
 */
const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(({
  label,
  onClear,
  fullWidth = true,
  className = '',
  value,
  onChange,
  ...props
}, ref) => {
  const [inputId] = useState(() => props.id || `search-${Math.random().toString(36).substr(2, 9)}`);
  const hasValue = value && String(value).length > 0;

  const handleClear = () => {
    if (onClear) onClear();
  };

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-body font-medium text-neutral-black mb-2"
        >
          {label}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <FaSearch className="w-5 h-5 text-neutral-gray-dark" />
        </div>

        {/* Input field */}
        <input
          ref={ref}
          type="search"
          id={inputId}
          value={value}
          onChange={onChange}
          className={`
            h-10 w-full 
            pl-10 pr-10 py-2
            text-body text-neutral-black
            placeholder:text-neutral-gray-dark
            rounded-md border border-neutral-gray-light
            bg-neutral-white
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary
            transition-all duration-200
          `}
          {...props}
        />

        {/* Clear Button */}
        {hasValue && onClear && (
          <button
            type="button"
            onClick={handleClear}
            className="
              absolute right-3 top-1/2 -translate-y-1/2
              text-neutral-gray-dark hover:text-neutral-black
              transition-colors
            "
            aria-label="Clear search"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

export default SearchInput;
